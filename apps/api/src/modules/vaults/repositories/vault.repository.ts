import { Injectable } from '@nestjs/common';

import { type VaultRole } from '@crypta/contracts';

import { PrismaService } from '@/database/prisma/prisma.service';

import { type PrismaExecutor } from '../../auth/repositories/auth.repository';

/**
 * Acesso Prisma aos cofres.
 *
 * **Toda consulta é escopada pelo membership**, e não filtrada depois. O
 * `userId` entra no `where`, então um cofre de outro usuário não é encontrado —
 * ele não é encontrado e descartado, o que é a diferença entre uma consulta
 * segura e uma que depende de o chamador lembrar do filtro (`CLAUDE.md`
 * secao 31).
 *
 * A exclusão é física (ADR 0020) e propaga por `ON DELETE CASCADE` para membros
 * e envelopes. A auditoria não tem FK e sobrevive.
 */

export type VaultMetadataInput = {
  metadataNonce: string;
  metadataCiphertext: string;
  metadataAlgorithm: string;
  cryptoVersion: number;
  schemaVersion: number;
};

export type OwnerEnvelopeInput = {
  keyVersion: number;
  cryptoVersion: number;
  algorithm: string;
  ephemeralPublicKey: string;
  encryptedVaultKey: string;
};

export type VaultRecord = {
  id: string;
  metadataNonce: string;
  metadataCiphertext: string;
  metadataAlgorithm: string;
  cryptoVersion: number;
  schemaVersion: number;
  version: number;
  keyVersion: number;
  createdAt: Date;
  updatedAt: Date;
};

export type VaultWithRole = VaultRecord & {
  role: VaultRole;
  memberCount: number;
};

const VAULT_FIELDS = {
  id: true,
  metadataNonce: true,
  metadataCiphertext: true,
  metadataAlgorithm: true,
  cryptoVersion: true,
  schemaVersion: true,
  version: true,
  keyVersion: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class VaultRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cofres acessíveis ao usuário, do mais recente para o mais antigo.
   *
   * A paginação por cursor usa o `id`, que é UUIDv7 e portanto monotônico com o
   * instante de criação — não é preciso um segundo campo de desempate, e uma
   * página não perde nem repete linha quando outra é criada no meio.
   */
  async listForUser(input: {
    userId: string;
    limit: number;
    cursor?: string | undefined;
    role?: VaultRole | undefined;
  }): Promise<VaultWithRole[]> {
    const memberships = await this.prisma.vaultMember.findMany({
      where: {
        userId: input.userId,
        ...(input.role === undefined ? {} : { role: input.role }),
        ...(input.cursor === undefined ? {} : { vaultId: { lt: input.cursor } }),
      },
      orderBy: { vaultId: 'desc' },
      // Uma linha a mais do que o pedido: é ela que responde `hasMore` sem uma
      // segunda consulta de contagem.
      take: input.limit + 1,
      select: {
        role: true,
        vault: { select: { ...VAULT_FIELDS, _count: { select: { members: true } } } },
      },
    });

    return memberships.map(({ role, vault }) => {
      const { _count, ...record } = vault;

      return { ...record, role, memberCount: _count.members };
    });
  }

  /** Um cofre, apenas se o usuário for membro dele. */
  async findForUser(vaultId: string, userId: string): Promise<VaultWithRole | null> {
    const membership = await this.prisma.vaultMember.findUnique({
      where: { vaultId_userId: { vaultId, userId } },
      select: {
        role: true,
        vault: { select: { ...VAULT_FIELDS, _count: { select: { members: true } } } },
      },
    });

    if (membership === null) {
      return null;
    }

    const { _count, ...record } = membership.vault;

    return { ...record, role: membership.role, memberCount: _count.members };
  }

  async countForUser(userId: string): Promise<number> {
    return this.prisma.vaultMember.count({ where: { userId } });
  }

  async exists(vaultId: string): Promise<boolean> {
    return (await this.prisma.vault.count({ where: { id: vaultId } })) > 0;
  }

  /**
   * Cria cofre, associação do dono e envelope, dentro da transação recebida.
   *
   * Os três nascem juntos por obrigação, não por conveniência: um cofre sem
   * envelope é conteúdo que ninguém abre, e um cofre sem dono é conteúdo que
   * ninguém administra (`CLAUDE.md` secao 37).
   */
  async createWithOwner(
    input: {
      vaultId: string;
      ownerId: string;
      metadata: VaultMetadataInput;
      envelope: OwnerEnvelopeInput;
    },
    executor: PrismaExecutor,
  ): Promise<VaultRecord> {
    const vault = await executor.vault.create({
      data: { id: input.vaultId, ...input.metadata },
      select: VAULT_FIELDS,
    });

    await executor.vaultMember.create({
      data: { vaultId: vault.id, userId: input.ownerId, role: 'OWNER' },
    });

    await executor.vaultKeyEnvelope.create({
      data: { vaultId: vault.id, userId: input.ownerId, ...input.envelope },
    });

    return vault;
  }

  /**
   * Atualiza a metadata **condicionalmente à versão**.
   *
   * A versão entra no `where`, não numa checagem anterior: entre ler e escrever
   * cabe outra requisição, e o banco é o único lugar onde as duas coisas
   * acontecem juntas. Devolve `null` quando ninguém casou, e quem chama traduz
   * isso em conflito.
   */
  async updateMetadata(
    input: { vaultId: string; expectedVersion: number; metadata: VaultMetadataInput },
    executor: PrismaExecutor,
  ): Promise<VaultRecord | null> {
    const updated = await executor.vault.updateMany({
      where: { id: input.vaultId, version: input.expectedVersion },
      data: { ...input.metadata, version: { increment: 1 } },
    });

    if (updated.count === 0) {
      return null;
    }

    return executor.vault.findUniqueOrThrow({
      where: { id: input.vaultId },
      select: VAULT_FIELDS,
    });
  }

  /** Exclui condicionalmente à versão. `false` quando a versão não casou. */
  async deleteIfVersionMatches(
    input: { vaultId: string; expectedVersion: number },
    executor: PrismaExecutor,
  ): Promise<boolean> {
    const deleted = await executor.vault.deleteMany({
      where: { id: input.vaultId, version: input.expectedVersion },
    });

    return deleted.count > 0;
  }

  async currentVersion(vaultId: string): Promise<number | null> {
    const vault = await this.prisma.vault.findUnique({
      where: { id: vaultId },
      select: { version: true },
    });

    return vault?.version ?? null;
  }

  /** Envelope do próprio chamador. Nunca o de outro membro. */
  async findEnvelopeFor(input: {
    vaultId: string;
    userId: string;
    keyVersion: number;
  }): Promise<OwnerEnvelopeInput | null> {
    return this.prisma.vaultKeyEnvelope.findUnique({
      where: {
        vaultId_userId_keyVersion: {
          vaultId: input.vaultId,
          userId: input.userId,
          keyVersion: input.keyVersion,
        },
      },
      select: {
        keyVersion: true,
        cryptoVersion: true,
        algorithm: true,
        ephemeralPublicKey: true,
        encryptedVaultKey: true,
      },
    });
  }

  async listMembers(
    vaultId: string,
  ): Promise<{ userId: string; role: VaultRole; createdAt: Date }[]> {
    return this.prisma.vaultMember.findMany({
      where: { vaultId },
      orderBy: { createdAt: 'asc' },
      select: { userId: true, role: true, createdAt: true },
    });
  }
}
