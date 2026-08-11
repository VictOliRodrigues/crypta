import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/database/prisma/prisma.service';

import { type PrismaExecutor } from '../auth/repositories/auth.repository';

/**
 * Trilha de auditoria (ARCHITECTURE.md secao 33, ADR 0020).
 *
 * A tabela não tem chave estrangeira, e é isso que a torna útil: como a
 * exclusão é física, o registro de que um cofre existiu e foi apagado só
 * sobrevive porque nada o prende à linha apagada.
 *
 * **Nada de conteúdo entra aqui.** Nome de cofre, senha, observação e ciphertext
 * estão proibidos (secao 33.3). O que se grava são identificadores, o verbo e
 * metadados técnicos — o suficiente para reconstruir quem fez o quê, e nada que
 * descreva o que estava dentro.
 *
 * A escrita participa da transação de quem chama. Um cofre criado com a
 * auditoria fora da transação poderia existir sem registro se o processo caísse
 * no meio, e é exatamente o registro que não pode faltar.
 */

/** Verbos estáveis. Um cliente ou relatório pode ramificar por eles. */
export const AUDIT_ACTIONS = {
  vaultCreated: 'VAULT_CREATED',
  vaultUpdated: 'VAULT_UPDATED',
  vaultDeleted: 'VAULT_DELETED',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export type AuditEntry = {
  actorId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  vaultId?: string | undefined;
  requestId?: string | undefined;
  ipAddress?: string | null | undefined;
  userAgent?: string | null | undefined;
  result?: 'SUCCESS' | 'FAILURE' | undefined;
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntry, executor: PrismaExecutor = this.prisma): Promise<void> {
    await executor.auditLog.create({
      data: {
        actorId: entry.actorId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        vaultId: entry.vaultId ?? null,
        requestId: entry.requestId ?? null,
        ipAddress: entry.ipAddress ?? null,
        userAgent: entry.userAgent ?? null,
        result: entry.result ?? 'SUCCESS',
      },
    });
  }
}
