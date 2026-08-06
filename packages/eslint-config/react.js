import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import { baseConfig } from './index.js';

/**
 * Configuração da aplicação Web (React + Vite).
 *
 * @type {import('typescript-eslint').ConfigArray}
 */
export const reactConfig = tseslint.config(...baseConfig, {
  files: ['**/*.{ts,tsx}'],
  languageOptions: {
    globals: {
      ...globals.browser,
    },
  },
  plugins: {
    'react-hooks': reactHooks,
    'react-refresh': reactRefresh,
  },
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'error',
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

    // ARCHITECTURE.md secao 30.1 — nada descriptografado pode ser persistido
    // no navegador. A violação precisa falhar no lint, não na revisão.
    'no-restricted-globals': [
      'error',
      {
        name: 'localStorage',
        message:
          'localStorage não pode armazenar token, chave ou conteúdo descriptografado. Use estado em memória.',
      },
      {
        name: 'sessionStorage',
        message:
          'sessionStorage não pode armazenar token, chave ou conteúdo descriptografado. Use estado em memória.',
      },
    ],
  },
});

export default reactConfig;
