import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/database/prisma/prisma.service';

import { type PrismaExecutor } from './auth.repository';

/**
 * Acesso Prisma às sessões.
 *
 * Revogar é **apagar a linha** (ADR 0020). Não existe update para marcar como
 * revogada, e não deve passar a existir: uma coluna de revogação traria de volta
 * o problema que a exclusão física resolve, em que um `findMany` sem o filtro
 * faz uma sessão revogada voltar a valer.
 */

export type SessionRecord = {
  id: string;
  userId: string;
  familyId: string;
  createdAt: Date;
  lastUsedAt: Date;
};

export type RotatableSession = SessionRecord & {
  refreshTokenHash: string;
  previousTokenHash: string | null;
  rotatedAt: Date | null;
};

export type SessionSummary = SessionRecord & {
  clientType: string;
  clientName: string | null;
  ipAddress: string | null;
  userAgent: string | null;
};

export type CreateSessionInput = {
  userId: string;
  familyId: string;
  refreshTokenHash: string;
  clientType: string;
  clientName: string | null;
  ipAddress: string | null;
  userAgent: string | null;
};

const SESSION_FIELDS = {
  id: true,
  userId: true,
  familyId: true,
  createdAt: true,
  lastUsedAt: true,
} as const;

@Injectable()
export class SessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateSessionInput, executor: PrismaExecutor): Promise<SessionRecord> {
    return executor.session.create({ data: input, select: SESSION_FIELDS });
  }

  async findById(
    id: string,
    executor: PrismaExecutor = this.prisma,
  ): Promise<SessionRecord | null> {
    return executor.session.findUnique({ where: { id }, select: SESSION_FIELDS });
  }

  /**
   * Localiza pela versão corrente **ou** pela anterior do hash.
   *
   * A busca precisa alcançar as duas: pela corrente para rotacionar, e pela
   * anterior para distinguir a janela de tolerância de uma reutilização. As duas
   * colunas são indexadas, então não há varredura.
   */
  async findByAnyTokenHash(
    tokenHash: string,
    executor: PrismaExecutor = this.prisma,
  ): Promise<RotatableSession | null> {
    return executor.session.findFirst({
      where: {
        OR: [{ refreshTokenHash: tokenHash }, { previousTokenHash: tokenHash }],
      },
      select: {
        ...SESSION_FIELDS,
        refreshTokenHash: true,
        previousTokenHash: true,
        rotatedAt: true,
      },
    });
  }

  /**
   * Troca o token da sessão.
   *
   * O `where` inclui o hash anterior, o que torna a operação uma troca
   * condicional: duas rotações concorrentes disputam a mesma linha e apenas uma
   * escreve. A perdedora recebe `false` e recusa, em vez de sobrescrever o
   * trabalho da outra.
   */
  async rotate(input: {
    id: string;
    refreshTokenHash: string;
    previousTokenHash: string;
    rotatedAt: Date;
    lastUsedAt: Date;
  }): Promise<boolean> {
    const { count } = await this.prisma.session.updateMany({
      where: {
        id: input.id,
        OR: [
          { refreshTokenHash: input.previousTokenHash },
          { previousTokenHash: input.previousTokenHash },
        ],
      },
      data: {
        refreshTokenHash: input.refreshTokenHash,
        previousTokenHash: input.previousTokenHash,
        rotatedAt: input.rotatedAt,
        lastUsedAt: input.lastUsedAt,
      },
    });

    return count === 1;
  }

  async listForUser(
    userId: string,
    executor: PrismaExecutor = this.prisma,
  ): Promise<SessionSummary[]> {
    return executor.session.findMany({
      where: { userId },
      select: {
        ...SESSION_FIELDS,
        clientType: true,
        clientName: true,
        ipAddress: true,
        userAgent: true,
      },
      orderBy: { lastUsedAt: 'desc' },
    });
  }

  /**
   * Apaga por id **e** dono.
   *
   * O `userId` no `where` é o que impede IDOR: um id de sessão de outro usuário
   * simplesmente não casa, e a rota devolve `404` sem revelar que a sessão
   * existe (`CLAUDE.md` secao 40).
   */
  async deleteOwnedById(id: string, userId: string): Promise<boolean> {
    const { count } = await this.prisma.session.deleteMany({ where: { id, userId } });

    return count === 1;
  }

  async deleteById(id: string, executor: PrismaExecutor = this.prisma): Promise<void> {
    await executor.session.deleteMany({ where: { id } });
  }

  /** Derruba a família inteira, na detecção de reuso (ADR 0010). */
  async deleteFamily(familyId: string): Promise<void> {
    await this.prisma.session.deleteMany({ where: { familyId } });
  }

  /**
   * O `executor` existe para a troca de senha, que revoga as demais sessões
   * dentro da mesma transação que grava a credencial nova. Fora dela, uma falha
   * depois da revogação deixaria o usuário deslogado de tudo com a senha antiga
   * ainda válida.
   */
  async deleteAllForUser(
    userId: string,
    exceptSessionId?: string,
    executor: PrismaExecutor = this.prisma,
  ): Promise<number> {
    const { count } = await executor.session.deleteMany({
      where: {
        userId,
        ...(exceptSessionId === undefined ? {} : { NOT: { id: exceptSessionId } }),
      },
    });

    return count;
  }
}
