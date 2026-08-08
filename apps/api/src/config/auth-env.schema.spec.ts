import { randomBytes } from 'node:crypto';

import {
  type AuthEnv,
  authEnvSchema,
  collectAuthEnvIssues,
  parseDuration,
  parseVersionedSecret,
} from './auth-env.schema';

/**
 * As faixas do ADR 0021 e do ADR 0022 são requisito de segurança, não
 * preferência: uma sessão de um ano ou um bloqueio de dois segundos passariam
 * despercebidos até virarem incidente. O que estes testes garantem é que a API
 * recusa subir nesses casos.
 */

function secret(version = 1): string {
  return `v${String(version)}:${randomBytes(32).toString('base64url')}`;
}

const PEM_BASE64 = Buffer.from(
  '-----BEGIN PRIVATE KEY-----\nQUJD\n-----END PRIVATE KEY-----\n',
).toString('base64');

function validEnv(overrides: Record<string, string> = {}): Record<string, string> {
  return {
    AUTH_SERVER_SECRET: secret(),
    JWT_PRIVATE_KEY: PEM_BASE64,
    JWT_PUBLIC_KEY: PEM_BASE64,
    ...overrides,
  };
}

describe('parseDuration', () => {
  it.each([
    ['30s', 30],
    ['15m', 900],
    ['2h', 7200],
    ['7d', 604800],
  ])('converte %s em %i segundos', (value, expected) => {
    expect(parseDuration(value)).toBe(expected);
  });

  it.each(['15', '15x', 'm15', '', '-5m', '1.5h'])('recusa %p', (value) => {
    expect(parseDuration(value)).toBeNull();
  });
});

describe('parseVersionedSecret', () => {
  it('aceita o formato v<N>:<base64url de 32 bytes>', () => {
    const parsed = parseVersionedSecret(secret(3));

    expect(parsed?.version).toBe(3);
    expect(parsed?.secret).toHaveLength(32);
  });

  it('recusa segredo de tamanho diferente de 32 bytes', () => {
    expect(parseVersionedSecret(`v1:${randomBytes(16).toString('base64url')}`)).toBeNull();
  });

  it('recusa valor sem versão', () => {
    expect(parseVersionedSecret(randomBytes(32).toString('base64url'))).toBeNull();
  });

  it('recusa versão zero', () => {
    expect(parseVersionedSecret(`v0:${randomBytes(32).toString('base64url')}`)).toBeNull();
  });
});

describe('authEnvSchema', () => {
  it('aplica os padrões dos ADRs 0021 e 0022', () => {
    const parsed = authEnvSchema.parse(validEnv());

    expect(parsed.ACCESS_TOKEN_TTL).toBe(900);
    expect(parsed.REFRESH_TOKEN_TTL).toBe(604800);
    expect(parsed.REFRESH_TOKEN_ABSOLUTE_TTL).toBe(2592000);
    expect(parsed.REFRESH_COOKIE_SAMESITE).toBe('Strict');
    expect(parsed.LOGIN_MAX_ATTEMPTS).toBe(5);
    expect(parsed.AUTH_IP_RATE_LIMIT).toBe(60);
  });

  it.each([
    ['ACCESS_TOKEN_TTL abaixo da faixa', { ACCESS_TOKEN_TTL: '30s' }],
    ['ACCESS_TOKEN_TTL acima da faixa', { ACCESS_TOKEN_TTL: '2h' }],
    ['REFRESH_TOKEN_TTL acima da faixa', { REFRESH_TOKEN_TTL: '120d' }],
    ['REFRESH_TOKEN_ABSOLUTE_TTL acima da faixa', { REFRESH_TOKEN_ABSOLUTE_TTL: '400d' }],
    ['LOGIN_MAX_ATTEMPTS abaixo do mínimo', { LOGIN_MAX_ATTEMPTS: '1' }],
    ['LOGIN_MAX_ATTEMPTS acima do teto', { LOGIN_MAX_ATTEMPTS: '100' }],
    ['AUTH_IP_RATE_LIMIT abaixo do mínimo', { AUTH_IP_RATE_LIMIT: '1' }],
    ['SameSite desconhecido', { REFRESH_COOKIE_SAMESITE: 'Nenhum' }],
  ])('recusa %s', (_name, override) => {
    expect(authEnvSchema.safeParse(validEnv(override)).success).toBe(false);
  });

  it('recusa AUTH_SERVER_SECRET ausente', () => {
    const env = validEnv();
    delete env.AUTH_SERVER_SECRET;

    expect(authEnvSchema.safeParse(env).success).toBe(false);
  });

  it('recusa JWT em PEM cru, que é multilinha', () => {
    const raw = '-----BEGIN PRIVATE KEY-----\nQUJD\n-----END PRIVATE KEY-----';

    expect(authEnvSchema.safeParse(validEnv({ JWT_PRIVATE_KEY: raw })).success).toBe(false);
  });

  it('não repete o valor do segredo na mensagem de erro', () => {
    const leaked = 'valor-secreto-que-nao-pode-vazar';
    const result = authEnvSchema.safeParse(validEnv({ AUTH_SERVER_SECRET: leaked }));

    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).not.toContain(leaked);
  });
});

describe('collectAuthEnvIssues', () => {
  function parse(overrides: Record<string, string> = {}): AuthEnv {
    return authEnvSchema.parse(validEnv(overrides));
  }

  it('aceita a configuração padrão', () => {
    expect(collectAuthEnvIssues(parse())).toEqual([]);
  });

  /**
   * Cada campo passa isolado; juntos produzem uma sessão que morre antes do
   * primeiro período ocioso completo.
   */
  it('recusa teto absoluto menor que o de inatividade', () => {
    const issues = collectAuthEnvIssues(
      parse({ REFRESH_TOKEN_TTL: '60d', REFRESH_TOKEN_ABSOLUTE_TTL: '2d' }),
    );

    expect(issues).toHaveLength(1);
    expect(issues.at(0)).toContain('REFRESH_TOKEN_ABSOLUTE_TTL');
  });

  it('recusa teto de bloqueio menor que a espera inicial', () => {
    const issues = collectAuthEnvIssues(
      parse({ LOGIN_LOCK_INITIAL_SECONDS: '600', LOGIN_LOCK_MAX_SECONDS: '60' }),
    );

    expect(issues.at(0)).toContain('LOGIN_LOCK_MAX_SECONDS');
  });

  it('recusa rotação configurada pela metade', () => {
    const shared = secret(2);
    const issues = collectAuthEnvIssues(
      parse({ AUTH_SERVER_SECRET: shared, AUTH_SERVER_SECRET_PREVIOUS: secret(2) }),
    );

    expect(issues.at(0)).toContain('AUTH_SERVER_SECRET_PREVIOUS');
    expect(shared).toBeDefined();
  });

  it('aceita rotação com a versão anterior menor', () => {
    expect(
      collectAuthEnvIssues(
        parse({ AUTH_SERVER_SECRET: secret(2), AUTH_SERVER_SECRET_PREVIOUS: secret(1) }),
      ),
    ).toEqual([]);
  });
});
