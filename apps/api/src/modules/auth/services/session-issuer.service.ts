import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { type ClientType } from '@crypta/contracts';

import { type PrismaExecutor } from '../repositories/auth.repository';
import { SessionRepository } from '../repositories/session.repository';
import { AccessTokenService } from './access-token.service';
import { RefreshTokenService } from './refresh-token.service';

/**
 * Cria uma sessão e emite o par de tokens.
 *
 * Único lugar que abre sessão. O `POST /setup` e o `POST /auth/login` chamam
 * daqui, o que garante que os dois produzam sessões com a mesma forma — e que
 * uma mudança na emissão não valha só para um deles.
 *
 * O refresh token em texto aberto sai desta função e não é guardado em lugar
 * nenhum: o que persiste é o `SHA-256` dele.
 */

export type IssuedSession = {
  sessionId: string;
  accessToken: string;
  expiresIn: number;
  /** Texto aberto. Vai para o cookie na Web, ou para o corpo no Android. */
  refreshToken: string;
};

export type SessionClient = {
  type: ClientType;
  name: string | null;
  ipAddress: string | null;
  userAgent: string | null;
};

@Injectable()
export class SessionIssuerService {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly accessTokens: AccessTokenService,
    private readonly refreshTokens: RefreshTokenService,
  ) {}

  async issue(
    input: { userId: string; client: SessionClient },
    executor: PrismaExecutor,
  ): Promise<IssuedSession> {
    const refreshToken = this.refreshTokens.generate();

    const session = await this.sessions.create(
      {
        userId: input.userId,
        // Uma sessão nova abre a própria família. Rotações herdam este valor, e
        // é por ele que uma reutilização detectada derruba tudo de uma vez.
        familyId: randomUUID(),
        refreshTokenHash: this.refreshTokens.hash(refreshToken),
        clientType: input.client.type,
        clientName: input.client.name,
        ipAddress: input.client.ipAddress,
        userAgent: input.client.userAgent,
      },
      executor,
    );

    const { token, expiresIn } = await this.accessTokens.issue({
      sub: input.userId,
      sid: session.id,
    });

    return { sessionId: session.id, accessToken: token, expiresIn, refreshToken };
  }
}
