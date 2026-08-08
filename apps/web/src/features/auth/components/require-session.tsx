import { type ReactNode } from 'react';
import { Navigate } from 'react-router';

import { useSessionStore } from '../stores/session-store';

/**
 * Barreira de rota autenticada.
 *
 * É conveniência de navegação, **não** autorização: a decisão real está na API,
 * que verifica o `sid` a cada requisição (`CLAUDE.md` secao 32). Um usuário que
 * contorne esta barreira encontra `401` em toda chamada.
 *
 * A condição é o `accessToken`, e não o `keyPair`: o desbloqueio do cofre é uma
 * segunda camada, que as telas de conteúdo checarão quando existirem.
 */
export function RequireSession({ children }: { children: ReactNode }): React.JSX.Element {
  const accessToken = useSessionStore((state) => state.accessToken);

  if (accessToken === null) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
