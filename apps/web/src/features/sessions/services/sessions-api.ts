import { type SessionListResponse, type SessionView } from '@crypta/contracts';

import { apiClient, normalizeApiError } from '@/services/api-client';

/**
 * Sessões do usuário autenticado (docs/API.md secoes 30 a 32).
 *
 * Toda rota aqui é escopada ao dono pelo token: o cliente nunca envia `userId`,
 * e um id de sessão alheio devolve `404`. A escolha de não distinguir "não
 * existe" de "não é sua" é da API (`CLAUDE.md` secao 40), e a interface não
 * pode inventar a distinção que o servidor recusa dar.
 */

export async function fetchSessions(): Promise<SessionView[]> {
  try {
    const response = await apiClient.get<SessionListResponse>('/sessions');
    return response.data.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export async function revokeSession(sessionId: string): Promise<void> {
  try {
    await apiClient.delete(`/sessions/${encodeURIComponent(sessionId)}`);
  } catch (error) {
    throw normalizeApiError(error);
  }
}

/** Derruba as demais sessões. A que fez a chamada permanece. */
export async function revokeOtherSessions(): Promise<void> {
  try {
    await apiClient.delete('/sessions');
  } catch (error) {
    throw normalizeApiError(error);
  }
}

/**
 * Derruba **todas** as sessões, inclusive a atual.
 *
 * É `POST /auth/logout-all`, e não `DELETE /sessions`: o segundo preserva quem
 * chamou de propósito. Quem escolhe "encerrar todas" está dizendo que perdeu a
 * confiança no conjunto, e deixar a própria sessão viva contradiria o pedido.
 */
export async function revokeAllSessions(): Promise<void> {
  try {
    await apiClient.post('/auth/logout-all');
  } catch (error) {
    throw normalizeApiError(error);
  }
}
