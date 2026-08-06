import { createBrowserRouter, RouterProvider } from 'react-router';

import { StatusPage } from '@/features/diagnostics/components/status-page';

/**
 * Rotas da aplicação.
 *
 * Na R0 existe apenas a tela de diagnóstico. Autenticação, cofres, sites e
 * credenciais entram a partir da R0.2, cada um com a sua rota protegida.
 */
const router = createBrowserRouter([
  {
    path: '/',
    element: <StatusPage />,
  },
  {
    path: '*',
    element: <StatusPage />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
