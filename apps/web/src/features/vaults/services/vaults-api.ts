import {
  type EncryptedPayload,
  type KeyEnvelopeView,
  type VaultCreatedResponse,
  type VaultListResponse,
  type VaultSummary,
  type VaultUpdatedResponse,
} from '@crypta/contracts';

import { apiClient, normalizeApiError } from '@/services/api-client';

/**
 * Rotas de cofre (docs/API.md secoes 33 a 37).
 *
 * Nada aqui envia nem recebe texto aberto. O que trafega é `encryptedMetadata`
 * e o envelope da `VaultKey`; a decifragem acontece em `vault-crypto`, depois
 * que esta camada devolve os bytes.
 *
 * O `id` do cofre é gerado pelo cliente (ADR 0025) e vai no corpo do `POST`.
 */

export type CreateVaultPayload = {
  id: string;
  encryptedMetadata: EncryptedPayload;
  ownerEnvelope: KeyEnvelopeView;
  idempotencyKey: string;
};

export async function fetchVaults(): Promise<VaultSummary[]> {
  try {
    const response = await apiClient.get<VaultListResponse>('/vaults');

    return response.data.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export async function createVault(payload: CreateVaultPayload): Promise<void> {
  const { idempotencyKey, ...body } = payload;

  try {
    await apiClient.post<VaultCreatedResponse>('/vaults', body, {
      // A chave nasce com a operação, não com o clique: um retry do usuário
      // depois de uma falha de rede reaproveita a mesma e não cria dois cofres.
      headers: { 'Idempotency-Key': idempotencyKey },
    });
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export async function updateVault(input: {
  vaultId: string;
  expectedVersion: number;
  encryptedMetadata: EncryptedPayload;
}): Promise<void> {
  try {
    await apiClient.patch<VaultUpdatedResponse>(`/vaults/${encodeURIComponent(input.vaultId)}`, {
      expectedVersion: input.expectedVersion,
      encryptedMetadata: input.encryptedMetadata,
    });
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export async function deleteVault(input: {
  vaultId: string;
  expectedVersion: number;
}): Promise<void> {
  try {
    await apiClient.delete(`/vaults/${encodeURIComponent(input.vaultId)}`, {
      data: { expectedVersion: input.expectedVersion, confirmation: true },
    });
  } catch (error) {
    throw normalizeApiError(error);
  }
}
