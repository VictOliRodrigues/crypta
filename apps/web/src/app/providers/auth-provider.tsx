import { useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useEffect } from 'react';

import { sessionStore } from '@/features/auth/stores/session-store';
import { apiClient, installAuthInterceptors } from '@/services/api-client';

/**
 * Liga o cliente HTTP à sessão.
 *
 * Precisa ficar **dentro** do `QueryClientProvider`: quando a renovação falha, o
 * cache do TanStack Query é limpo junto com a sessão, e o cache guarda conteúdo
 * descriptografado de cofre (`CLAUDE.md` secao 21).
 *
 * Instalar os interceptors num efeito, com desinstalação no retorno, evita que o
 * `StrictMode` do React registre dois pares em desenvolvimento — o que faria
 * cada `401` disparar dois refresh e mascarar exatamente o defeito que a fila
 * existe para impedir.
 */
export function AuthProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const queryClient = useQueryClient();

  useEffect(
    () =>
      installAuthInterceptors(apiClient, {
        getAccessToken: sessionStore.getAccessToken,
        setAccessToken: sessionStore.setAccessToken,
        onSessionLost: () => {
          sessionStore.clear();
          queryClient.clear();
        },
      }),
    [queryClient],
  );

  return <>{children}</>;
}
