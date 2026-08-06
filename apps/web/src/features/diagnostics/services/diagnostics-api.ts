import {
  type ReadinessData,
  type ReadinessResponse,
  type VersionData,
  type VersionResponse,
} from '@crypta/contracts';

import { apiClient, normalizeApiError } from '@/services/api-client';

/**
 * Endpoints públicos de diagnóstico.
 *
 * São a primeira integração real Web -> API -> MySQL, usada para validar
 * CORS, HTTPS, proxy e rede antes de qualquer funcionalidade sensível
 * (ROADMAP.md secao 10).
 */

export async function fetchApiVersion(): Promise<VersionData> {
  try {
    const response = await apiClient.get<VersionResponse>('/version');
    return response.data.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export async function fetchApiReadiness(): Promise<ReadinessData> {
  try {
    const response = await apiClient.get<ReadinessResponse>('/health/ready');
    return response.data.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}
