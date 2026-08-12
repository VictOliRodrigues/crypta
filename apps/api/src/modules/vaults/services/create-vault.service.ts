import { createHash } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { type VaultCreatedData } from '@crypta/contracts';

import { PrismaService } from '@/database/prisma/prisma.service';

import { AUDIT_ACTIONS, AuditService } from '../../audit/audit.service';
import { IdempotencyConflictException } from '../../auth/errors/auth.errors';
import { type CreateVaultRequest } from '../dto/vault.schema';
import {
  InvalidEnvelopeException,
  VaultIdentifierConflictException,
  VaultLimitReachedException,
} from '../errors/vault.errors';
import { VaultRepository } from '../repositories/vault.repository';

/**
 * `POST /vaults` — cria um cofre privado (docs/API.md secao 34, `BLG-1001`).
 *
 * Tudo em uma transação (`CLAUDE.md` secao 37): cofre, membro `OWNER`, envelope
 * e auditoria. Um cofre sem envelope é conteúdo que ninguém abre; um cofre sem
 * dono é conteúdo que ninguém administra; e um cofre sem registro de criação
 * some sem deixar rastro quando for excluído.
 *
 * A API não recebe a `VaultKey`, não a deriva e não a guarda. Ela recebe um
 * envelope pronto, selado para a chave pública do dono, e o grava como blob.
 */

const IDEMPOTENCY_SCOPE = 'create-vault';

/**
 * Teto por usuário (`API.md` secao 74).
 *
 * Continua sugerido até virar configuração por ambiente. Existe para que uma
 * automação com defeito não encha o banco, não para limitar uso legítimo.
 */
export const MAX_VAULTS_PER_USER = 100;

export type CreateVaultInput = CreateVaultRequest & {
  userId: string;
  idempotencyKey: string;
  requestId: string;
  ipAddress: string | null;
  userAgent: string | null;
};

@Injectable()
export class CreateVaultService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: VaultRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(input: CreateVaultInput): Promise<VaultCreatedData> {
    const requestHash = this.hashRequest(input);

    const replayed = await this.replay(input.idempotencyKey, requestHash);

    if (replayed !== null) {
      return replayed;
    }

    // A API não abre o envelope, mas confere o que dá para conferir sem abrir.
    // Um cofre nasce na geração 1; um envelope declarando outra só seria
    // descoberto quando alguém tentasse abrir o cofre e não conseguisse.
    if (input.ownerEnvelope.keyVersion !== 1) {
      throw new InvalidEnvelopeException('KEY_VERSION_MISMATCH');
    }

    if ((await this.repository.countForUser(input.userId)) >= MAX_VAULTS_PER_USER) {
      throw new VaultLimitReachedException(MAX_VAULTS_PER_USER);
    }

    // O id vem do cliente (ADR 0025), então colisão é possível e precisa de
    // resposta própria. A checagem aqui existe para a mensagem; a garantia é a
    // chave primária, e a corrida entre as duas termina em erro do banco.
    if (await this.repository.exists(input.id)) {
      throw new VaultIdentifierConflictException();
    }

    return this.prisma.$transaction(async (tx) => {
      const vault = await this.repository.createWithOwner(
        {
          vaultId: input.id,
          ownerId: input.userId,
          metadata: {
            metadataNonce: input.encryptedMetadata.nonce,
            metadataCiphertext: input.encryptedMetadata.ciphertext,
            metadataAlgorithm: input.encryptedMetadata.algorithm,
            cryptoVersion: input.encryptedMetadata.cryptoVersion,
            schemaVersion: input.encryptedMetadata.schemaVersion,
          },
          envelope: input.ownerEnvelope,
        },
        tx,
      );

      await this.audit.record(
        {
          actorId: input.userId,
          action: AUDIT_ACTIONS.vaultCreated,
          entityType: 'vault',
          entityId: vault.id,
          vaultId: vault.id,
          requestId: input.requestId,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
        },
        tx,
      );

      await tx.idempotencyRecord.create({
        data: {
          scope: IDEMPOTENCY_SCOPE,
          idempotencyKey: input.idempotencyKey,
          requestHash,
          resourceId: vault.id,
          responseStatus: 201,
        },
      });

      return {
        id: vault.id,
        role: 'OWNER' as const,
        version: vault.version,
        keyVersion: vault.keyVersion,
        createdAt: vault.createdAt.toISOString(),
      };
    });
  }

  /**
   * Replay de uma chave já usada.
   *
   * Mesma chave com o mesmo corpo devolve a resposta anterior, reconstruída a
   * partir do cofre — não de uma cópia guardada. Mesma chave com corpo diferente
   * é `409` (`CLAUDE.md` secao 38).
   */
  private async replay(
    idempotencyKey: string,
    requestHash: string,
  ): Promise<VaultCreatedData | null> {
    const record = await this.prisma.idempotencyRecord.findUnique({
      where: { scope_idempotencyKey: { scope: IDEMPOTENCY_SCOPE, idempotencyKey } },
      select: { requestHash: true, resourceId: true },
    });

    if (record === null) {
      return null;
    }

    if (record.requestHash !== requestHash) {
      throw new IdempotencyConflictException();
    }

    if (record.resourceId === null) {
      return null;
    }

    const vault = await this.prisma.vault.findUnique({
      where: { id: record.resourceId },
      select: { id: true, version: true, keyVersion: true, createdAt: true },
    });

    // O cofre pode ter sido excluído depois do primeiro `POST`. Repetir a
    // criação seria pior: o registro de idempotência diz que a operação já
    // aconteceu, e ela aconteceu.
    if (vault === null) {
      return null;
    }

    return {
      id: vault.id,
      role: 'OWNER',
      version: vault.version,
      keyVersion: vault.keyVersion,
      createdAt: vault.createdAt.toISOString(),
    };
  }

  /**
   * Impressão canônica do corpo.
   *
   * Só entram os campos que definem a operação. O ciphertext entra porque dois
   * corpos com metadata diferente **são** operações diferentes, e tratá-los
   * como replay gravaria o cofre errado.
   */
  private hashRequest(input: CreateVaultInput): string {
    return createHash('sha256')
      .update(
        JSON.stringify({
          userId: input.userId,
          id: input.id,
          metadata: input.encryptedMetadata,
          envelope: input.ownerEnvelope,
        }),
      )
      .digest('hex');
  }
}
