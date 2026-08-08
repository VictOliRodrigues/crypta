import { createHash } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { type AuthSessionData, type KeyBundlePayload } from '@crypta/contracts';

import { PrismaService } from '@/database/prisma/prisma.service';

import {
  IdempotencyConflictException,
  SetupAlreadyCompletedException,
} from '../errors/auth.errors';
import { AuthRepository } from '../repositories/auth.repository';
import { ServerSecretService } from './server-secret.service';
import { type SessionClient, SessionIssuerService } from './session-issuer.service';

/**
 * `POST /setup` — cria o primeiro usuário (docs/API.md secao 20).
 *
 * Tudo em uma transação (`CLAUDE.md` secao 37): usuário, key bundle, sessão
 * inicial e o registro de idempotência. Uma falha no meio não pode deixar uma
 * conta sem material criptográfico — ela seria impossível de usar e impossível
 * de recriar, porque `setupRequired` já teria virado `false`.
 */

const IDEMPOTENCY_SCOPE = 'setup';

export type CreateFirstUserInput = {
  name: string;
  email: string;
  authSecret: string;
  keyBundle: KeyBundlePayload;
  idempotencyKey: string;
  client: SessionClient;
};

@Injectable()
export class CreateFirstUserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: AuthRepository,
    private readonly serverSecret: ServerSecretService,
    private readonly sessionIssuer: SessionIssuerService,
  ) {}

  async execute(input: CreateFirstUserInput): Promise<AuthSessionData> {
    const requestHash = this.hashRequest(input);

    const replayed = await this.replay(input.idempotencyKey, requestHash, input.client);

    if (replayed !== null) {
      return replayed;
    }

    return this.prisma.$transaction(async (tx) => {
      // Dentro da transação: entre a checagem e a inserção, outra requisição
      // poderia criar o primeiro usuário. O `UNIQUE` de e-mail não cobre isso —
      // dois setups com e-mails diferentes passariam pelos dois.
      if (await this.repository.hasAnyUser(tx)) {
        throw new SetupAlreadyCompletedException();
      }

      const user = await this.repository.createUserWithKeyBundle(
        {
          name: input.name,
          email: input.email,
          authSecretHash: this.serverSecret.computeAuthSecretHash(
            Buffer.from(input.authSecret, 'base64url'),
          ),
          authSecretVersion: this.serverSecret.currentVersion,
          keyBundle: input.keyBundle,
        },
        tx,
      );

      const session = await this.sessionIssuer.issue({ userId: user.id, client: input.client }, tx);

      await tx.idempotencyRecord.create({
        data: {
          scope: IDEMPOTENCY_SCOPE,
          idempotencyKey: input.idempotencyKey,
          requestHash,
          resourceId: user.id,
          responseStatus: 201,
        },
      });

      return {
        user,
        accessToken: session.accessToken,
        expiresIn: session.expiresIn,
        refreshToken: session.refreshToken,
      };
    });
  }

  /**
   * Repetição da mesma chave com o mesmo payload.
   *
   * A resposta anterior **não** é lida do banco: ela continha um access token, e
   * gravá-lo transformaria `idempotency_records` em depósito de credencial viva
   * (ADR 0022). O que se guarda é o `resourceId`; o replay reconstrói o perfil e
   * emite uma sessão nova.
   *
   * Isso significa que dois replays produzem duas sessões. É o comportamento
   * correto: cada uma pertence a um cliente que de fato apresentou a chave, e o
   * usuário pode revogá-las na tela de sessões.
   */
  private async replay(
    idempotencyKey: string,
    requestHash: string,
    client: SessionClient,
  ): Promise<AuthSessionData | null> {
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
      throw new SetupAlreadyCompletedException();
    }

    const user = await this.repository.findUserById(record.resourceId);

    if (user === null) {
      // A conta referenciada foi excluída. O registro sobreviveu por não ter FK,
      // e reemitir sessão para um usuário inexistente seria pior do que recusar.
      throw new SetupAlreadyCompletedException();
    }

    const session = await this.sessionIssuer.issue({ userId: user.id, client }, this.prisma);

    return {
      user,
      accessToken: session.accessToken,
      expiresIn: session.expiresIn,
      refreshToken: session.refreshToken,
    };
  }

  /**
   * Impressão canônica do payload, para distinguir replay de conflito.
   *
   * As chaves são ordenadas: `JSON.stringify` preserva a ordem de inserção, e
   * dois corpos idênticos com campos em ordem diferente produziriam hashes
   * diferentes — um `409` onde deveria haver replay.
   *
   * O `authSecret` entra no hash. Ele é o que distingue um retry legítimo de uma
   * tentativa de reutilizar a chave com outra credencial, e o hash é `SHA-256` —
   * o valor não é recuperável a partir dele.
   */
  private hashRequest(input: CreateFirstUserInput): string {
    const canonical = JSON.stringify([
      input.name,
      input.email,
      input.authSecret,
      Object.entries(input.keyBundle).sort(([a], [b]) => a.localeCompare(b)),
    ]);

    return createHash('sha256').update(canonical).digest('hex');
  }
}
