import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/database/prisma/prisma.service';

import { AUDIT_ACTIONS, AuditService } from '../../audit/audit.service';
import { VaultVersionConflictException } from '../errors/vault.errors';
import { VaultAccessPolicy } from '../policies/vault-access.policy';
import { VaultRepository } from '../repositories/vault.repository';

/**
 * `DELETE /vaults/:vaultId` — exclui o cofre (docs/API.md secao 37, `BLG-1005`).
 *
 * Somente o dono, e a exclusão é **física** (ADR 0020): a linha some, e com ela
 * membros e envelopes, por `ON DELETE CASCADE`. Não existe lixeira nem
 * `deleted_at` — segredo excluído deixa de existir no banco, então nenhum
 * caminho de consulta, nem um futuro, pode devolvê-lo.
 *
 * A auditoria é gravada **na mesma transação** e sobrevive à exclusão, porque a
 * tabela não tem chave estrangeira para o cofre. Sem isso, apagar um cofre não
 * deixaria rastro nenhum — que é exatamente o que a exclusão física exige em
 * troca.
 */
@Injectable()
export class DeleteVaultService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: VaultRepository,
    private readonly policy: VaultAccessPolicy,
    private readonly audit: AuditService,
  ) {}

  async execute(input: {
    vaultId: string;
    userId: string;
    expectedVersion: number;
    requestId: string;
    ipAddress: string | null;
    userAgent: string | null;
  }): Promise<void> {
    await this.policy.requireOwner(input.vaultId, input.userId);

    await this.prisma.$transaction(async (tx) => {
      // A auditoria vem antes do `DELETE`, e a ordem é obrigatória: depois da
      // exclusão o cofre não existe para ser descrito, e uma falha entre as
      // duas escritas desfaz as duas juntas.
      await this.audit.record(
        {
          actorId: input.userId,
          action: AUDIT_ACTIONS.vaultDeleted,
          entityType: 'vault',
          entityId: input.vaultId,
          vaultId: input.vaultId,
          requestId: input.requestId,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
        },
        tx,
      );

      const deleted = await this.repository.deleteIfVersionMatches(
        { vaultId: input.vaultId, expectedVersion: input.expectedVersion },
        tx,
      );

      if (!deleted) {
        throw new VaultVersionConflictException(
          (await this.repository.currentVersion(input.vaultId)) ?? 0,
        );
      }
    });
  }
}
