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

export type CreateSessionInput = {
  userId: string;
  familyId: string;
  refreshTokenHash: string;
  clientType: string;
  clientName: string | null;
  ipAddress: string | null;
  userAgent: string | null;
};

@Injectable()
export class SessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateSessionInput, executor: PrismaExecutor): Promise<SessionRecord> {
    return executor.session.create({
      data: input,
      select: { id: true, userId: true, familyId: true, createdAt: true, lastUsedAt: true },
    });
  }

  async findById(
    id: string,
    executor: PrismaExecutor = this.prisma,
  ): Promise<SessionRecord | null> {
    return executor.session.findUnique({
      where: { id },
      select: { id: true, userId: true, familyId: true, createdAt: true, lastUsedAt: true },
    });
  }

  async deleteById(id: string, executor: PrismaExecutor = this.prisma): Promise<void> {
    await executor.session.deleteMany({ where: { id } });
  }
}
