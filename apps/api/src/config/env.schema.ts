import { z } from 'zod';

import { APP_ENVIRONMENTS } from '@crypta/contracts';

import { authEnvSchema, collectAuthEnvIssues } from './auth-env.schema';

/**
 * Validação das variáveis de ambiente (STYLE_GUIDE.md secao 68).
 *
 * A aplicação falha no startup quando a configuração é inválida. Subir com
 * configuração parcial é pior do que não subir: significaria CORS aberto,
 * ambiente errado ou banco errado descobertos só em produção.
 */

export const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'] as const;

export type LogLevel = (typeof LOG_LEVELS)[number];

/**
 * `CORS_ORIGINS` é uma lista separada por vírgula.
 *
 * `*` é rejeitado explicitamente: a API usa cookie de refresh e credenciais,
 * e um curinga tornaria qualquer site capaz de originar requisições
 * autenticadas.
 */
const corsOriginsSchema = z
  .string()
  .transform((value) =>
    value
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0),
  )
  .refine((origins) => origins.length > 0, {
    message: 'CORS_ORIGINS deve listar ao menos uma origem.',
  })
  .refine((origins) => !origins.includes('*'), {
    message: 'CORS_ORIGINS não aceita curinga.',
  })
  .refine((origins) => origins.every((origin) => URL.canParse(origin)), {
    message: 'CORS_ORIGINS deve conter URLs absolutas.',
  });

const baseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  APP_ENVIRONMENT: z.enum(APP_ENVIRONMENTS),

  // Metadados de build. Os defaults servem apenas para execução local: o CI
  // injeta os valores reais como build args da imagem.
  APP_VERSION: z.string().min(1).default('0.0.0-local'),
  APP_COMMIT: z.string().min(1).default('local'),
  APP_BUILT_AT: z.string().min(1).default('1970-01-01T00:00:00.000Z'),

  API_PORT: z.coerce.number().int().min(1).max(65535).default(3000),

  DATABASE_URL: z
    .string()
    .min(1)
    .refine((value) => value.startsWith('mysql://'), {
      message: 'DATABASE_URL deve ser uma conexão MySQL.',
    }),

  CORS_ORIGINS: corsOriginsSchema,

  LOG_LEVEL: z.enum(LOG_LEVELS).default('info'),
});

export const envSchema = baseEnvSchema.merge(authEnvSchema);

export type AppEnv = z.infer<typeof envSchema>;

/** Lançado quando a configuração de ambiente é inválida. */
export class EnvValidationError extends Error {
  readonly code = 'ENV_VALIDATION_ERROR';

  constructor(issues: string[]) {
    super(
      `Configuração de ambiente inválida:\n${issues.map((issue) => `  - ${issue}`).join('\n')}`,
    );
    this.name = 'EnvValidationError';
  }
}

/**
 * Valida `process.env`.
 *
 * A mensagem de erro cita apenas NOMES de variáveis e o motivo. Os valores
 * jamais são incluídos: `DATABASE_URL` carrega a senha do banco,
 * `AUTH_SERVER_SECRET` e `JWT_PRIVATE_KEY` são segredos, e a mensagem costuma
 * acabar em log de container (CLAUDE.md secao 36).
 */
export function parseEnv(source: Record<string, string | undefined>): AppEnv {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    const issues = result.error.issues.map((issue) => {
      const field = issue.path.join('.');
      return field.length > 0 ? `${field}: ${issue.message}` : issue.message;
    });

    throw new EnvValidationError(issues);
  }

  // Relações entre variáveis, que a validação de campo isolado não alcança.
  const crossFieldIssues = collectAuthEnvIssues(result.data);

  if (crossFieldIssues.length > 0) {
    throw new EnvValidationError(crossFieldIssues);
  }

  return result.data;
}
