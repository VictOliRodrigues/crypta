import { buildTestAuthEnv } from './support/auth-env';
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

// Segredos de autenticação descartáveis, gerados a cada execução. A validação de
// partida recusa subir sem eles (ADR 0022).
for (const [key, value] of Object.entries(buildTestAuthEnv())) {
  process.env[key] ??= value;
}

// Teto do throttle por IP no máximo aceito pela faixa do ADR 0022.
//
// A suíte inteira sai do mesmo endereço e faz centenas de requisições em poucos
// minutos, o que estoura o padrão de 60/min e produz `429` em testes que não
// têm nada a ver com rate limit — falha intermitente, dependente de como as
// requisições caem nas janelas de 60 s.
//
// A consequência é que o throttle **não é exercitado por esta suíte**. Cobri-lo
// exigiria um processo próprio, com limite baixo, e está registrado como
// pendência em vez de simulado aqui.
process.env.AUTH_IP_RATE_LIMIT ??= '600';
