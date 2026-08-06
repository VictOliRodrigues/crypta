import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

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
      <AppRouter />
    </QueryProvider>
  </StrictMode>,
);
