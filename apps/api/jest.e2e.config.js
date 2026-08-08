/**
 * Testes end-to-end da API.
 *
 * Rodam contra MySQL real: SQLite não é substituto aceitável porque o schema
 * depende de comportamento específico do MySQL (CLAUDE.md secao 42).
 *
 * A conexão vem de `TEST_DATABASE_URL`, e o `setup-e2e.ts` recusa qualquer
 * banco cujo nome não termine em `_test` — a suíte apaga tabelas.
 *
 * `maxWorkers: 1` porque todas as specs compartilham o mesmo banco e limpam as
 * mesmas tabelas. Paralelizar exigiria um banco por worker, que é complexidade
 * sem ganho enquanto a suíte roda em segundos.
 *
 * @type {import('ts-jest').JestConfigWithTsJest}
 */
module.exports = {
  rootDir: 'test',
  testEnvironment: 'node',
  testRegex: '.*\\.e2e-spec\\.ts$',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.json' }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../src/$1',
  },
  setupFiles: ['<rootDir>/setup-e2e.ts'],
  testTimeout: 30000,
  maxWorkers: 1,
};
