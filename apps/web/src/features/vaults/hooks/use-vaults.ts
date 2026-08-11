import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';

import { type VaultSummary } from '@crypta/contracts';
import { type VaultMetadata } from '@crypta/crypto-core';

import { useSessionStore } from '@/features/auth/stores/session-store';

import { buildNewVault, openVaultMetadata, resealVaultMetadata } from '../services/vault-crypto';
import { createVault, deleteVault, fetchVaults, updateVault } from '../services/vaults-api';
import { vaultsKeys } from './vaults.keys';

/**
 * Cofres do usuário (W05).
 *
 * A decifragem acontece **dentro da query**, e o cache guarda o resultado já
 * aberto — em memória, como todo cache do TanStack Query aqui, e limpo no
 * logout junto com o resto (`CLAUDE.md` secao 21). Decifrar no componente
 * refaria a operação a cada render.
 *
 * Um cofre que falha ao abrir não derruba a lista. Ele aparece com o defeito
 * declarado: esconder a linha faria um cofre existente sumir da interface, que
 * é pior do que mostrá-lo ilegível.
 */

/** Cofre com a metadata já aberta, ou com o motivo de não ter aberto. */
export type DecryptedVault = VaultSummary & {
  metadata: VaultMetadata | null;
};

export function useVaults(): UseQueryResult<DecryptedVault[]> {
  const keyPair = useSessionStore((state) => state.keyPair);

  return useQuery({
    queryKey: vaultsKeys.list(),
    // Sem o par aberto não há o que decifrar. A query só roda desbloqueada.
    enabled: keyPair !== null,
    queryFn: async () => {
      const vaults = await fetchVaults();

      if (keyPair === null) {
        return [];
      }

      return Promise.all(
        vaults.map(async (vault) => ({
          ...vault,
          metadata: await openVaultMetadata({ vault, keyPair }).catch(() => null),
        })),
      );
    },
  });
}

export function useCreateVault() {
  const queryClient = useQueryClient();
  const keyPair = useSessionStore((state) => state.keyPair);

  return useMutation({
    mutationFn: async (input: { metadata: VaultMetadata; idempotencyKey: string }) => {
      if (keyPair === null) {
        throw new Error('O cofre está bloqueado. Entre novamente para criar cofres.');
      }

      const material = await buildNewVault({
        metadata: input.metadata,
        ownerPublicKey: keyPair.publicKey,
      });

      await createVault({ ...material, idempotencyKey: input.idempotencyKey });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: vaultsKeys.list() });
    },
  });
}

export function useUpdateVault() {
  const queryClient = useQueryClient();
  const keyPair = useSessionStore((state) => state.keyPair);

  return useMutation({
    mutationFn: async (input: { vault: VaultSummary; metadata: VaultMetadata }) => {
      if (keyPair === null) {
        throw new Error('O cofre está bloqueado. Entre novamente para editar.');
      }

      const encryptedMetadata = await resealVaultMetadata({
        vault: input.vault,
        keyPair,
        metadata: input.metadata,
      });

      await updateVault({
        vaultId: input.vault.id,
        // A versão vem do que a lista carregou. Se outra sessão gravou nesse
        // meio-tempo, a API recusa com `409` em vez de sobrescrever.
        expectedVersion: input.vault.version,
        encryptedMetadata,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: vaultsKeys.list() });
    },
  });
}

export function useDeleteVault() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vault: VaultSummary) => {
      await deleteVault({ vaultId: vault.id, expectedVersion: vault.version });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: vaultsKeys.list() });
    },
  });
}
