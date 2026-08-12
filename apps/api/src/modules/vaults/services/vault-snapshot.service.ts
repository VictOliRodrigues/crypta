import { Injectable } from '@nestjs/common';

import { type VaultSnapshotData } from '@crypta/contracts';

import { InvalidEnvelopeException } from '../errors/vault.errors';
import { toKeyEnvelopeView } from '../mappers/vault.mapper';
import { VaultAccessPolicy } from '../policies/vault-access.policy';
import { VaultRepository } from '../repositories/vault.repository';

/**
 * `GET /vaults/:vaultId/snapshot` (docs/API.md secao 38, `BLG-1006`).
 *
 * É a leitura que abre o cofre: devolve a metadata cifrada, o envelope do
 * chamador e a lista de membros, para que o cliente recupere a `VaultKey` e
 * decifre o conteúdo (ARCHITECTURE.md secao 20).
 *
 * **Só o envelope de quem chamou.** Devolver o de outro membro não daria acesso
 * a nada — ele é selado para outra chave pública — mas entregaria o mapa de quem
 * tem acesso a quê a qualquer um que capturasse a resposta. O `where` da
 * consulta inclui o `userId`, então o envelope alheio não é buscado e
 * descartado: ele não é buscado.
 *
 * `sites` e `credentials` vêm vazios na R0.3 e ganham conteúdo na R0.4. O
 * cursor e a forma existem desde já para que a resposta não mude quando houver
 * o que paginar.
 */
@Injectable()
export class VaultSnapshotService {
  constructor(
    private readonly repository: VaultRepository,
    private readonly policy: VaultAccessPolicy,
  ) {}

  async execute(vaultId: string, userId: string): Promise<VaultSnapshotData> {
    const vault = await this.policy.requireMember(vaultId, userId);

    const envelope = vault.currentUserEnvelope;

    // Membro sem envelope na geração corrente é estado inválido, não caso de
    // borda: a associação e o envelope nascem na mesma transação, e o rekey da
    // R0.5 troca os dois juntos. Devolver um snapshot sem envelope entregaria
    // conteúdo que o cliente não tem como abrir, e o erro apareceria como
    // "falha ao descriptografar" — sintoma que não aponta para a causa.
    if (envelope === null) {
      throw new InvalidEnvelopeException('MISSING_FOR_CURRENT_KEY_VERSION');
    }

    const members = await this.repository.listMembers(vaultId);

    return {
      vault: {
        id: vault.id,
        encryptedMetadata: {
          cryptoVersion: vault.cryptoVersion,
          schemaVersion: vault.schemaVersion,
          algorithm: vault.metadataAlgorithm,
          nonce: vault.metadataNonce,
          ciphertext: vault.metadataCiphertext,
        },
        version: vault.version,
        keyVersion: vault.keyVersion,
      },
      currentUserEnvelope: toKeyEnvelopeView(envelope),
      sites: [],
      credentials: [],
      members: members.map((member) => ({
        userId: member.userId,
        role: member.role,
        joinedAt: member.createdAt.toISOString(),
      })),
      // Sem conteúdo a paginar, não há cursor a devolver. `null` é a resposta
      // honesta; uma string opaca sugeriria que existe uma página seguinte.
      syncCursor: null,
    };
  }
}
