import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';

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
  const location = useLocation();

  if (accessToken === null) {
    // A rota tentada viaja no `state` para que `RedirectAuthenticated` devolva o
    // usuário a ela depois do login, em vez de largá-lo na raiz. Vai só o
    // caminho, nunca o objeto inteiro: `location` carrega também o `search`, e
    // um dia isso significaria copiar um parâmetro sensível para o histórico.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
