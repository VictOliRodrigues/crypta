import tseslint from 'typescript-eslint';

import { baseConfig } from './index.js';

/**
 * Configuração da API (NestJS).
 *
 * @type {import('typescript-eslint').ConfigArray}
 */
export const nestConfig = tseslint.config(...baseConfig, {
  files: ['**/*.ts'],
  rules: {
    // Decorators do Nest usam metadata em tempo de execução; classes vazias
    // (módulos, DTOs) são idiomáticas.
    '@typescript-eslint/no-extraneous-class': 'off',

    // Toda query Prisma vive em repositories (CLAUDE.md secao 31).
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@prisma/client'],
            importNames: ['PrismaClient'],
            message:
              'Instancie o PrismaClient apenas em database/prisma. Serviços devem receber o PrismaService por injeção.',
          },
        ],
      },
    ],
  },
});

export default nestConfig;
