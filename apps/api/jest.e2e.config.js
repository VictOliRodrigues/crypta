/**
 * Testes end-to-end da API.
 *
 * Rodam contra MySQL real: SQLite não é substituto aceitável porque o schema
 * depende de comportamento específico do MySQL (CLAUDE.md secao 42).
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
  testTimeout: 30000,
};
