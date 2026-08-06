import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Ordem de imports exigida por STYLE_GUIDE.md secao 7.
 *
 * Os grupos usam lookahead negativo para que `@crypta/*` nunca seja capturado
 * pelo grupo genérico de dependências externas, independentemente da regra de
 * desempate da versão do plugin.
 */
const importGroups = [
  // 1. Builtins do Node.
  ['^node:'],
  // 2. Dependências externas.
  ['^(?!@crypta/)@?\\w'],
  // 3. Packages internos do monorepo.
  ['^@crypta/'],
  // 4. Aliases da aplicação.
  ['^@/'],
  // 5. Imports relativos.
  ['^\\.'],
  // 6. Estilos.
  ['^.+\\.s?css$'],
];

/**
 * Configuração base compartilhada por todos os workspaces TypeScript.
 *
 * @type {import('typescript-eslint').ConfigArray}
 */
export const baseConfig = tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/*.tsbuildinfo',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': ['error', { groups: importGroups }],
      'simple-import-sort/exports': 'error',

      // CLAUDE.md secao 13 — `any` e non-null assertion são proibidos por padrão.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],

      // Falha fechada: uma promise ignorada pode engolir erro de autorização
      // ou de criptografia (STYLE_GUIDE.md secao 67).
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/require-await': 'error',

      // Segredos jamais podem sair por console (CLAUDE.md secao 36).
      'no-console': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-param-reassign': 'error',
      'prefer-const': 'error',

      // CLAUDE.md secao 9 — CSPRNG obrigatório em qualquer caminho criptográfico.
      'no-restricted-properties': [
        'error',
        {
          object: 'Math',
          property: 'random',
          message:
            'Math.random() não é criptograficamente seguro. Use o CSPRNG da plataforma (crypto.getRandomValues / node:crypto).',
        },
      ],
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.test.ts', '**/*.test.tsx', '**/*.e2e-spec.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
    },
  },
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
  },
  prettier,
);

export default baseConfig;
