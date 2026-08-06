import { EnvValidationError, parseEnv } from './env.schema';

const VALID_ENV = {
  APP_ENVIRONMENT: 'development',
  DATABASE_URL: 'mysql://vault:s3cr3t@db:3306/password_vault_development',
  CORS_ORIGINS: 'http://localhost:5173',
};

describe('parseEnv', () => {
  it('accepts a minimal valid environment and applies defaults', () => {
    const env = parseEnv(VALID_ENV);

    expect(env.APP_ENVIRONMENT).toBe('development');
    expect(env.API_PORT).toBe(3000);
    expect(env.LOG_LEVEL).toBe('info');
    expect(env.APP_VERSION).toBe('0.0.0-local');
  });

  it('splits and trims the CORS origin list', () => {
    const env = parseEnv({
      ...VALID_ENV,
      CORS_ORIGINS: ' https://vault.example.com , https://vault-dev.example.com ',
    });

    expect(env.CORS_ORIGINS).toEqual([
      'https://vault.example.com',
      'https://vault-dev.example.com',
    ]);
  });

  it('rejects a wildcard CORS origin', () => {
    expect(() => parseEnv({ ...VALID_ENV, CORS_ORIGINS: '*' })).toThrow(EnvValidationError);
  });

  it('rejects an empty CORS origin list instead of allowing every origin', () => {
    expect(() => parseEnv({ ...VALID_ENV, CORS_ORIGINS: '' })).toThrow(EnvValidationError);
  });

  it('rejects an unknown environment name such as prod', () => {
    expect(() => parseEnv({ ...VALID_ENV, APP_ENVIRONMENT: 'prod' })).toThrow(EnvValidationError);
  });

  it('rejects a database url that is not MySQL', () => {
    expect(() =>
      parseEnv({ ...VALID_ENV, DATABASE_URL: 'postgresql://vault:s3cr3t@db:5432/vault' }),
    ).toThrow(EnvValidationError);
  });

  it('rejects a missing APP_ENVIRONMENT', () => {
    const { APP_ENVIRONMENT: _ignored, ...withoutEnvironment } = VALID_ENV;

    expect(() => parseEnv(withoutEnvironment)).toThrow(EnvValidationError);
  });

  it('rejects a port outside the valid range', () => {
    expect(() => parseEnv({ ...VALID_ENV, API_PORT: '70000' })).toThrow(EnvValidationError);
  });

  it('never includes the offending value in the error message', () => {
    const password = 'super-secret-password';

    try {
      parseEnv({ ...VALID_ENV, DATABASE_URL: `postgresql://vault:${password}@db:5432/vault` });
      throw new Error('parseEnv deveria ter lançado.');
    } catch (error) {
      expect(error).toBeInstanceOf(EnvValidationError);
      expect((error as EnvValidationError).message).not.toContain(password);
      expect((error as EnvValidationError).message).toContain('DATABASE_URL');
    }
  });
});
