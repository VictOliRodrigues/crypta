import { Navigate, Outlet } from 'react-router';

import { AuthGate } from '@/features/auth/components/auth-gate';
import { LoginPage } from '@/features/auth/components/login-page';
import { RedirectAuthenticated } from '@/features/auth/components/redirect-authenticated';
import { RequireSession } from '@/features/auth/components/require-session';
import { SetupPage } from '@/features/auth/components/setup-page';
import { StatusPage } from '@/features/diagnostics/components/status-page';
import { SettingsPage } from '@/features/settings/components/settings-page';
import { VaultsPage } from '@/features/vaults/components/vaults-page';

/**
 * Rotas da aplicação.
 *
 * `AuthGate` decide, antes de qualquer rota, se a instalação ainda precisa de
 * configuração inicial. Sem isso, uma instalação nova cairia no login e
 * mostraria "e-mail ou senha inválidos" para alguém que não tem conta a criar.
 *
 * O dashboard de cofres (W05) é a rota inicial de quem tem sessão: `TELAS.md`
 * secao 7 registra `Login → Dashboard de cofres`. O diagnóstico continua em
 * `/diagnostico`, onde estava.
 *
 * Sites e credenciais entram na R0.4, sob a mesma guarda.
 */
/**
 * Exportado para que o roteamento seja testável.
 *
 * O defeito que motivou este arquivo vivia exatamente aqui — faltava a guarda
 * que tira de `/login` quem já tem sessão — e nenhum teste montava as rotas de
 * verdade, então nada reprovou. Testar as guardas isoladamente não bastaria: o
 * que faltava era a guarda **no grafo**, e só montando o grafo isso aparece.
 */
export const routes = [
  {
    element: (
      <AuthGate>
        <Outlet />
      </AuthGate>
    ),
    children: [
      {
        // Sessão viva não tem o que fazer no login nem no setup. Sem esta
        // guarda o `signIn` completava e a tela continuava sendo o formulário —
        // autenticação bem-sucedida indistinguível de falha.
        element: (
          <RedirectAuthenticated>
            <Outlet />
          </RedirectAuthenticated>
        ),
        children: [
          { path: '/setup', element: <SetupPage /> },
          { path: '/login', element: <LoginPage /> },
        ],
      },
      {
        element: (
          <RequireSession>
            <Outlet />
          </RequireSession>
        ),
        children: [
          { path: '/', element: <VaultsPage /> },
          { path: '/cofres', element: <VaultsPage /> },
          { path: '/diagnostico', element: <StatusPage /> },
          { path: '/configuracoes', element: <SettingsPage /> },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
];
