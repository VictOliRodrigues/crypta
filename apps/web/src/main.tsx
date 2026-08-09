// A ordem importa e não pode ser ordenada automaticamente: `zod-csp` desliga o
// JIT do Zod, e o Zod decide se vai usá-lo **na construção de cada schema**.
// `app-router` puxa as telas, que constroem schemas no escopo do módulo — se
// este import viesse depois, a configuração chegaria tarde e a sonda
// `new Function('')` já teria disparado a violação de CSP.
//
// Mesmo motivo pelo qual `test-app.ts` da API isola o `reflect-metadata`.
// eslint-disable-next-line simple-import-sort/imports
import '@/lib/zod-csp';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { AuthProvider } from '@/app/providers/auth-provider';
import { QueryProvider } from '@/app/providers/query-provider';
import { AppRouter } from '@/app/router/app-router';

import './styles/global.css';

const container = document.getElementById('root');

if (container === null) {
  throw new Error('Elemento raiz não encontrado.');
}

createRoot(container).render(
  <StrictMode>
    <QueryProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </QueryProvider>
  </StrictMode>,
);
