import { randomBytes } from 'node:crypto';

/**
 * Ambiente mínimo válido, para as specs de configuração.
 *
 * Existe para que acrescentar uma variável obrigatória não obrigue a editar
 * cada spec que monta um ambiente — foi o que aconteceu quando as variáveis de
 * autenticação entraram.
 *
 * Os segredos são descartáveis e gerados na importação. Nenhum deles é válido
 * fora do processo de teste.
 */

const PEM_BASE64 = Buffer.from(
  '-----BEGIN PRIVATE KEY-----\nQUJD\n-----END PRIVATE KEY-----\n',
).toString('base64');

export const VALID_ENV: Readonly<Record<string, string>> = Object.freeze({
  APP_ENVIRONMENT: 'development',
  DATABASE_URL: 'mysql://crypta:s3cr3t@db:3306/crypta_development',
  CORS_ORIGINS: 'http://localhost:5173',
  AUTH_SERVER_SECRET: `v1:${randomBytes(32).toString('base64url')}`,
  JWT_PRIVATE_KEY: PEM_BASE64,
  JWT_PUBLIC_KEY: PEM_BASE64,
});
