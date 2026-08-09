import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';

import { type SessionView } from '@crypta/contracts';

import { useAuthActions } from '@/features/auth/hooks/use-auth-actions';

import {
  fetchSessions,
  revokeAllSessions,
  revokeOtherSessions,
  revokeSession,
} from '../services/sessions-api';
import { sessionsKeys } from './sessions.keys';

/**
 * Lista de sessões (W24, aba Sessões).
 *
 * `staleTime: 0` porque a lista é o instrumento de reação a um acesso indevido:
 * um cache de 30 s mostraria como viva uma sessão que o próprio usuário acabou
 * de derrubar em outro dispositivo.
 *
 * É também a primeira consulta autenticada recorrente da Web, e com
 * `refetchOnWindowFocus` herdado do provider ela é o que exercita a fila de
 * refresh em navegador real — o item de gate que jsdom não alcança.
 */
export function useSessions(): UseQueryResult<SessionView[]> {
  return useQuery({
    queryKey: sessionsKeys.list(),
    queryFn: fetchSessions,
    staleTime: 0,
  });
}

/**
 * Revoga uma sessão da lista.
 *
 * Revogar a **própria** sessão é permitido e tem consequência imediata: o
 * `sid` do access token deixa de valer e a próxima requisição recebe `401`.
 * Em vez de esperar esse `401` chegar por acaso, o encerramento local acontece
 * aqui, junto — caso contrário a interface ficaria mostrando uma lista que já
 * não pode recarregar.
 */
export function useRevokeSession() {
  const queryClient = useQueryClient();
  const { endLocalSession } = useAuthActions();

  return useMutation({
    mutationFn: async (session: SessionView) => {
      await revokeSession(session.id);

      return session;
    },
    onSuccess: async (session) => {
      if (session.isCurrent) {
        endLocalSession();

        return;
      }

      await queryClient.invalidateQueries({ queryKey: sessionsKeys.list() });
    },
  });
}

/** Derruba as demais sessões e mantém a atual (`DELETE /sessions`). */
export function useRevokeOtherSessions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: revokeOtherSessions,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sessionsKeys.list() });
    },
  });
}

/**
 * Derruba todas, inclusive a atual (`POST /auth/logout-all`).
 *
 * Não invalida query nenhuma: não há sessão para recarregar depois. O estado
 * local cai junto, e o usuário volta ao login.
 */
export function useRevokeAllSessions() {
  const { endLocalSession } = useAuthActions();

  return useMutation({
    mutationFn: revokeAllSessions,
    onSuccess: () => {
      endLocalSession();
    },
  });
}
