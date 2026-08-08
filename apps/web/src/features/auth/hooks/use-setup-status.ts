import { useQuery } from '@tanstack/react-query';

import { fetchSetupStatus } from '../services/auth-api';
import { authKeys } from './auth.keys';

/**
 * Estado da configuração inicial.
 *
 * Decide se a aplicação abre em W01 ou em W02. `staleTime: Infinity` porque a
 * resposta só muda uma vez na vida da instalação, e refazer a consulta a cada
 * foco de janela seria ruído.
 */
export function useSetupStatus() {
  return useQuery({
    queryKey: authKeys.setupStatus(),
    queryFn: fetchSetupStatus,
    staleTime: Infinity,
    retry: 1,
  });
}
