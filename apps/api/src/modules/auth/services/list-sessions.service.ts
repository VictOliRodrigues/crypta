import { HttpStatus, Injectable } from '@nestjs/common';

import { type SessionView } from '@crypta/contracts';

import { ApiException } from '@/common/errors/api.exception';

import { type RequestAuth } from '../mappers/request-auth';
import { SessionRepository } from '../repositories/session.repository';

/**
 * `GET /sessions` e `DELETE /sessions/:sessionId` (docs/API.md secoes 30 e 31).
 *
 * `SessionView` vive em `@crypta/contracts` porque Web e Android consomem a
 * mesma forma. Declará-la aqui obrigaria cada cliente a redigitá-la, e a
 * primeira divergência apareceria em produção, não no typecheck.
 */

@Injectable()
export class ListSessionsService {
  constructor(private readonly sessions: SessionRepository) {}

  async execute(auth: RequestAuth): Promise<SessionView[]> {
    const sessions = await this.sessions.listForUser(auth.userId);

    return sessions.map((session) => ({
      id: session.id,
      clientType: session.clientType,
      clientName: session.clientName,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      createdAt: session.createdAt.toISOString(),
      lastUsedAt: session.lastUsedAt.toISOString(),
      isCurrent: session.id === auth.sessionId,
    }));
  }

  /**
   * Revoga uma sessão do próprio usuário.
   *
   * `404` quando o id não pertence a ele. Um `403` confirmaria que a sessão
   * existe, o que é informação sobre a conta alheia (`CLAUDE.md` secao 40).
   */
  async revokeOwned(sessionId: string, userId: string): Promise<void> {
    const deleted = await this.sessions.deleteOwnedById(sessionId, userId);

    if (!deleted) {
      throw new ApiException('RESOURCE_NOT_FOUND', HttpStatus.NOT_FOUND, 'Sessão não encontrada.');
    }
  }
}
