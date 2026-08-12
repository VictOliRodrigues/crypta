import { Injectable } from '@nestjs/common';

import { type VaultUpdatedData } from '@crypta/contracts';

import { PrismaService } from '@/database/prisma/prisma.service';

import { AUDIT_ACTIONS, AuditService } from '../../audit/audit.service';
import { type UpdateVaultRequest } from '../dto/vault.schema';
import { VaultVersionConflictException } from '../errors/vault.errors';
import { VaultAccessPolicy } from '../policies/vault-access.policy';
import { VaultRepository } from '../repositories/vault.repository';

/**
 * `PATCH /vaults/:vaultId` — atualiza a metadata cifrada (docs/API.md secao 36,
 * `BLG-1004`).
 *
 * Somente o dono. A metadata chega já cifrada com a mesma `VaultKey`: editar o
 * nome não troca chave nem versão de chave, apenas o ciphertext.
 *
 * O `expectedVersion` é obrigatório e vai para o `WHERE` do `UPDATE`. Entre ler
 * a versão e escrever cabe outra requisição, e o banco é o único lugar onde as
 * duas coisas acontecem juntas — comparar em memória antes devolveria um
 * "verificado" que já não vale no instante seguinte.
 */
@Injectable()
export class UpdateVaultService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: VaultRepository,
    private readonly policy: VaultAccessPolicy,
    private readonly audit: AuditService,
  ) {}

  async execute(input: {
    vaultId: string;
    userId: string;
    body: UpdateVaultRequest;
    requestId: string;
    ipAddress: string | null;
    userAgent: string | null;
  }): Promise<VaultUpdatedData> {
    await this.policy.requireOwner(input.vaultId, input.userId);

    return this.prisma.$transaction(async (tx) => {
      const updated = await this.repository.updateMetadata(
        {
          vaultId: input.vaultId,
          expectedVersion: input.body.expectedVersion,
          metadata: {
            metadataNonce: input.body.encryptedMetadata.nonce,
            metadataCiphertext: input.body.encryptedMetadata.ciphertext,
            metadataAlgorithm: input.body.encryptedMetadata.algorithm,
            cryptoVersion: input.body.encryptedMetadata.cryptoVersion,
            schemaVersion: input.body.encryptedMetadata.schemaVersion,
          },
        },
        tx,
      );

      if (updated === null) {
        // Nada foi gravado: a versão no banco não era a esperada. A leitura
        // acontece fora do `UPDATE` só para compor a mensagem.
        throw new VaultVersionConflictException(
          (await this.repository.currentVersion(input.vaultId)) ?? 0,
        );
      }

      await this.audit.record(
        {
          actorId: input.userId,
          action: AUDIT_ACTIONS.vaultUpdated,
          entityType: 'vault',
          entityId: updated.id,
          vaultId: updated.id,
          requestId: input.requestId,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
        },
        tx,
      );

      return {
        id: updated.id,
        version: updated.version,
        updatedAt: updated.updatedAt.toISOString(),
      };
    });
  }
}
