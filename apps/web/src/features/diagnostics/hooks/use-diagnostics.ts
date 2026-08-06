import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { type ReadinessData, type VersionData } from '@vault/contracts';

import { fetchApiReadiness, fetchApiVersion } from '../services/diagnostics-api';

/** Query keys centralizadas por feature (STYLE_GUIDE.md secao 15). */
export const diagnosticsKeys = {
  all: ['diagnostics'] as const,
  version: () => ['diagnostics', 'version'] as const,
  readiness: () => ['diagnostics', 'readiness'] as const,
};

export function useApiVersion(): UseQueryResult<VersionData> {
  return useQuery({
    queryKey: diagnosticsKeys.version(),
    queryFn: fetchApiVersion,
  });
}

export function useApiReadiness(): UseQueryResult<ReadinessData> {
  return useQuery({
    queryKey: diagnosticsKeys.readiness(),
    queryFn: fetchApiReadiness,
    // Readiness muda com o estado do banco; um cache longo esconderia uma
    // indisponibilidade real.
    staleTime: 0,
  });
}
