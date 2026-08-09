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

    // ARCHITECTURE.md secao 30.1 e SECURITY.md secao 52 — nada descriptografado
    // pode ser persistido no navegador. A violação precisa falhar no lint, não
    // na revisão.
    //
    // A lista cobre os cinco meios que a SECURITY.md secao 52 proíbe. Até a
    // revisão do BLG-0707 ela tinha só os dois primeiros, e IndexedDB — citado
    // por nome na própria secao — passaria pelo lint sem uma palavra.
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
      {
        name: 'indexedDB',
        message:
          'IndexedDB é persistente e SECURITY.md secao 52 o proíbe para conteúdo de cofre. Use estado em memória.',
      },
      {
        name: 'caches',
        message:
          'O Cache Storage é persistente e SECURITY.md secao 52 o proíbe. Nenhuma resposta com conteúdo de cofre pode ser cacheada.',
      },
    ],
  },
});

export default reactConfig;
