import { z } from 'zod';

/**
 * Variáveis de autenticação (ADRs 0021 e 0022).
 *
 * Todas têm faixa validada na partida. Fora da faixa, a API **não sobe**: subir
 * com configuração parcial de autenticação significaria descobrir em produção
 * que a sessão dura o que não deveria, ou que o segredo do servidor está vazio.
 *
 * As mensagens citam apenas NOMES de variável. `AUTH_SERVER_SECRET` e
 * `JWT_PRIVATE_KEY` são segredos, e a mensagem de erro costuma acabar em log de
 * container (CLAUDE.md secao 36).
 */

const SECONDS_PER_UNIT = { s: 1, m: 60, h: 3600, d: 86400 } as const;

type DurationUnit = keyof typeof SECONDS_PER_UNIT;

/**
 * Converte `15m`, `7d`, `30s` em segundos.
 *
 * Formato explícito em vez de número solto: `REFRESH_TOKEN_TTL=7` é ambíguo
 * entre sete segundos e sete dias, e o erro só apareceria em produção.
 */
export function parseDuration(value: string): number | null {
  const match = /^(\d+)([smhd])$/.exec(value.trim());

  if (match === null) {
    return null;
  }

  const amount = Number(match[1]);
  const unit = match[2] as DurationUnit;

  return amount * SECONDS_PER_UNIT[unit];
}

function durationSchema(field: string, minSeconds: number, maxSeconds: number, fallback: string) {
  // O `.default` fica ANTES do `.transform`: depois dele o Zod exigiria o valor
  // já convertido em segundos, e a faixa deixaria de ser conferida no padrão.
  return z
    .string()
    .default(fallback)
    .transform((value, ctx) => {
      const seconds = parseDuration(value);

      if (seconds === null) {
        ctx.addIssue({
          code: 'custom',
          message: `${field} deve usar o formato <número><s|m|h|d>, por exemplo 15m ou 7d.`,
        });

        return z.NEVER;
      }

      if (seconds < minSeconds || seconds > maxSeconds) {
        ctx.addIssue({
          code: 'custom',
          message: `${field} está fora da faixa aceita pelo ADR 0021.`,
        });

        return z.NEVER;
      }

      return seconds;
    });
}

/**
 * Segredo do servidor no formato `v<N>:<base64url de 32 bytes>`.
 *
 * A versão viaja junto com o valor para que a rotação seja possível sem uma
 * variável extra e sem ambiguidade sobre qual segredo gerou qual verificador
 * (ADR 0022).
 */
export type VersionedSecret = {
  version: number;
  secret: Uint8Array;
};

const SECRET_BYTES = 32;

export function parseVersionedSecret(value: string): VersionedSecret | null {
  const match = /^v(\d{1,4}):([A-Za-z0-9_-]+)$/.exec(value.trim());

  if (match === null) {
    return null;
  }

  const version = Number(match[1]);
  const encoded = match[2] ?? '';

  let secret: Buffer;

  try {
    secret = Buffer.from(encoded, 'base64url');
  } catch {
    return null;
  }

  if (version < 1 || secret.length !== SECRET_BYTES) {
    return null;
  }

  return { version, secret: new Uint8Array(secret) };
}

const versionedSecretSchema = (field: string) =>
  z.string().transform((value, ctx) => {
    const parsed = parseVersionedSecret(value);

    if (parsed === null) {
      ctx.addIssue({
        code: 'custom',
        message: `${field} deve estar no formato v<N>:<base64url de 32 bytes>.`,
      });

      return z.NEVER;
    }

    return parsed;
  });

/**
 * Chave em base64 do PEM, numa linha só.
 *
 * O PEM cru é multilinha, e uma quebra de linha invisível em variable já custou
 * um deploy nesta infraestrutura (`config_user.md` secao 41.1). Uma linha só
 * elimina a classe inteira.
 */
const base64PemSchema = (field: string) =>
  z.string().transform((value, ctx) => {
    const pem = Buffer.from(value.trim(), 'base64').toString('utf8');

    if (!pem.includes('-----BEGIN')) {
      ctx.addIssue({
        code: 'custom',
        message: `${field} deve conter o base64 de um PEM, em uma linha só.`,
      });

      return z.NEVER;
    }

    return pem;
  });

export const authEnvSchema = z.object({
  AUTH_SERVER_SECRET: versionedSecretSchema('AUTH_SERVER_SECRET'),
  AUTH_SERVER_SECRET_PREVIOUS: versionedSecretSchema('AUTH_SERVER_SECRET_PREVIOUS').optional(),

  JWT_PRIVATE_KEY: base64PemSchema('JWT_PRIVATE_KEY'),
  JWT_PUBLIC_KEY: base64PemSchema('JWT_PUBLIC_KEY'),

  ACCESS_TOKEN_TTL: durationSchema('ACCESS_TOKEN_TTL', 60, 3600, '15m'),
  REFRESH_TOKEN_TTL: durationSchema('REFRESH_TOKEN_TTL', 3600, 90 * 86400, '7d'),
  REFRESH_TOKEN_ABSOLUTE_TTL: durationSchema(
    'REFRESH_TOKEN_ABSOLUTE_TTL',
    86400,
    365 * 86400,
    '30d',
  ),

  REFRESH_COOKIE_SAMESITE: z.enum(['Strict', 'Lax', 'None']).default('Strict'),

  LOGIN_MAX_ATTEMPTS: z.coerce.number().int().min(3).max(20).default(5),
  LOGIN_LOCK_INITIAL_SECONDS: z.coerce.number().int().min(10).max(600).default(60),
  LOGIN_LOCK_MAX_SECONDS: z.coerce.number().int().min(60).max(86400).default(900),

  AUTH_IP_RATE_LIMIT: z.coerce.number().int().min(10).max(600).default(60),
});

export type AuthEnv = z.infer<typeof authEnvSchema>;

/**
 * Relações entre variáveis, que o schema de campo isolado não alcança.
 *
 * Cada uma delas é uma configuração que passa na validação individual e produz
 * comportamento errado em conjunto.
 */
export function collectAuthEnvIssues(env: AuthEnv): string[] {
  const issues: string[] = [];

  if (env.REFRESH_TOKEN_ABSOLUTE_TTL < env.REFRESH_TOKEN_TTL) {
    issues.push(
      'REFRESH_TOKEN_ABSOLUTE_TTL: o teto absoluto não pode ser menor que o de inatividade, ' +
        'ou a sessão morreria antes do primeiro período ocioso completo.',
    );
  }

  if (env.LOGIN_LOCK_MAX_SECONDS < env.LOGIN_LOCK_INITIAL_SECONDS) {
    issues.push(
      'LOGIN_LOCK_MAX_SECONDS: o teto da espera não pode ser menor que a espera inicial.',
    );
  }

  if (
    env.AUTH_SERVER_SECRET_PREVIOUS !== undefined &&
    env.AUTH_SERVER_SECRET_PREVIOUS.version >= env.AUTH_SERVER_SECRET.version
  ) {
    issues.push(
      'AUTH_SERVER_SECRET_PREVIOUS: a versão anterior precisa ser menor que a corrente. ' +
        'Versões iguais indicam que a rotação foi configurada pela metade.',
    );
  }

  return issues;
}
