import { assertTestDatabase } from './support/database';

/**
 * Preparação do ambiente de e2e, executada antes de qualquer spec.
 *
 * Os testes rodam contra MySQL real: SQLite não é substituto aceitável porque o
 * schema depende de comportamento específico do MySQL (CLAUDE.md secao 42).
 *
 * `TEST_DATABASE_URL` é lida aqui e promovida a `DATABASE_URL`, para que a
 * aplicação suba sem saber que está em teste. Manter as duas separadas evita o
 * acidente clássico: rodar a suíte com o `.env` de development carregado e
 * truncar as tabelas erradas.
 */

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (testDatabaseUrl === undefined || testDatabaseUrl.length === 0) {
  throw new Error(
    'TEST_DATABASE_URL não está definida. Os testes e2e precisam de um MySQL real; ' +
      'ver CONTRIBUTING.md, "Banco de testes".',
  );
}

assertTestDatabase(testDatabaseUrl);

process.env.DATABASE_URL = testDatabaseUrl;
process.env.NODE_ENV = 'test';
process.env.APP_ENVIRONMENT ??= 'development';
process.env.CORS_ORIGINS ??= 'http://localhost:5173';
process.env.LOG_LEVEL ??= 'fatal';
