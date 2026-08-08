import { createBrowserRouter, Navigate, Outlet, RouterProvider } from 'react-router';

import { AuthGate } from '@/features/auth/components/auth-gate';
import { LoginPage } from '@/features/auth/components/login-page';
import { RequireSession } from '@/features/auth/components/require-session';
import { SetupPage } from '@/features/auth/components/setup-page';
import { StatusPage } from '@/features/diagnostics/components/status-page';

/**
 * Rotas da aplicação.
 *
 * `AuthGate` decide, antes de qualquer rota, se a instalação ainda precisa de
 * configuração inicial. Sem isso, uma instalação nova cairia no login e
 * mostraria "e-mail ou senha inválidos" para alguém que não tem conta a criar.
 *
 * Cofres, sites e credenciais entram a partir da R0.3, sob `RequireSession`.
 */
const router = createBrowserRouter([
  {
    element: (
      <AuthGate>
        <Outlet />
      </AuthGate>
    ),
    children: [
      { path: '/setup', element: <SetupPage /> },
      { path: '/login', element: <LoginPage /> },
      {
        element: (
          <RequireSession>
            <Outlet />
          </RequireSession>
        ),
        children: [
          { path: '/', element: <StatusPage /> },
          { path: '/diagnostico', element: <StatusPage /> },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
