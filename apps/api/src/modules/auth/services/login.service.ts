import { Injectable } from '@nestjs/common';

import { AppConfigService } from '@/config/app-config.service';
import { PrismaService } from '@/database/prisma/prisma.service';

import { AuthRepository, type UserIdentity } from '../repositories/auth.repository';
import { ServerSecretService } from './server-secret.service';
import {
  type IssuedSession,
  type SessionClient,
  SessionIssuerService,
} from './session-issuer.service';

/**
 * `POST /auth/login` (docs/API.md secao 22).
 *
 * ## O oráculo que este serviço existe para não criar
 *
 * `SECURITY.md` secao 25 exige que a resposta não revele se a conta existe.
 * `ACCOUNT_LOCKED` e `ACCOUNT_DISABLED` só podem sair **depois** de o
 * `AuthSecret` conferir — nesse ponto o chamador já provou ter a senha, e
 * informá-lo não entrega nada novo (ADR 0022).
 *
 * Duas consequências que precisam valer no código, ou o oráculo volta por outro
 * caminho:
 *
 * 1. o bloqueio é verificado **depois** do cálculo do verificador, nunca antes;
 * 2. e-mail inexistente executa um HMAC descartável de mesmo custo, para que o
 *    tempo de resposta não separe os casos que os códigos igualaram.
 */

export type LoginInput = {
  email: string;
  authSecret: string;
  client: SessionClient;
  now: Date;
};

export type LoginOutcome =
  /** Credencial errada, conta inexistente ou bloqueada. Tudo igual, por fora. */
  | { kind: 'invalid' }
  /** Autenticou, mas o acesso é negado. Só aqui o motivo pode ser revelado. */
  | { kind: 'locked'; retryAfterSeconds: number }
  | { kind: 'disabled' }
  | {
      kind: 'authenticated';
      user: { id: string; name: string; email: string };
      session: IssuedSession;
    };

/**
 * Verificador descartável para e-mail inexistente.
 *
 * 64 caracteres hexadecimais, o mesmo formato de um verificador real, para que a
 * comparação em tempo constante tenha o mesmo custo dos dois lados.
 */
const DECOY_HASH = 'f'.repeat(64);

@Injectable()
export class LoginService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: AuthRepository,
    private readonly serverSecret: ServerSecretService,
    private readonly sessionIssuer: SessionIssuerService,
    private readonly appConfig: AppConfigService,
  ) {}

  async execute(input: LoginInput): Promise<LoginOutcome> {
    const identity = await this.repository.findIdentityByEmail(input.email);
    const authSecret = Buffer.from(input.authSecret, 'base64url');

    // Sem conta: o HMAC roda mesmo assim, contra o verificador descartável. O
    // trabalho é o mesmo, então o tempo de resposta também.
    if (identity === null) {
      this.serverSecret.matchesAuthSecretHash(
        this.serverSecret.computeAuthSecretHash(authSecret),
        DECOY_HASH,
      );

      return { kind: 'invalid' };
    }

    const candidate = this.serverSecret.computeAuthSecretHash(
      authSecret,
      identity.authSecretVersion,
    );

    const matches = this.serverSecret.matchesAuthSecretHash(candidate, identity.authSecretHash);

    if (!matches) {
      await this.registerFailure(identity, input.now);

      return { kind: 'invalid' };
    }

    // A partir daqui o chamador provou conhecer a credencial, e só a partir daqui
    // o estado da conta pode aparecer na resposta.
    const lockedFor = this.remainingLockSeconds(identity, input.now);

    if (lockedFor > 0) {
      return { kind: 'locked', retryAfterSeconds: lockedFor };
    }

    if (!identity.isActive) {
      return { kind: 'disabled' };
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: identity.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
          // Rotação preguiçosa do segredo do servidor: o verificador é
          // recalculado com a versão corrente sem que ninguém troque de senha
          // (ADR 0022).
          ...(this.serverSecret.needsRehash(identity.authSecretVersion)
            ? {
                authSecretHash: this.serverSecret.computeAuthSecretHash(authSecret),
                authSecretVersion: this.serverSecret.currentVersion,
              }
            : {}),
        },
      });

      const session = await this.sessionIssuer.issue(
        { userId: identity.id, client: input.client },
        tx,
      );

      return {
        kind: 'authenticated' as const,
        user: { id: identity.id, name: identity.name, email: identity.email },
        session,
      };
    });
  }

  /**
   * Contabiliza a falha e aplica a espera progressiva.
   *
   * A espera dobra a cada falha a partir do limite, até o teto, e zera no
   * sucesso. **Nunca é permanente**: um bloqueio sem prazo disparável por
   * terceiros é negação de serviço contra o dono da conta (`SECURITY.md` secao 26).
   */
  private async registerFailure(identity: UserIdentity, now: Date): Promise<void> {
    const { maxAttempts, initialSeconds, maxSeconds } = this.appConfig.loginLockPolicy;
    const attempts = identity.failedLoginAttempts + 1;

    if (attempts < maxAttempts) {
      await this.prisma.user.update({
        where: { id: identity.id },
        data: { failedLoginAttempts: attempts },
      });

      return;
    }

    const doublings = attempts - maxAttempts;
    const waitSeconds = Math.min(initialSeconds * 2 ** doublings, maxSeconds);

    await this.prisma.user.update({
      where: { id: identity.id },
      data: {
        failedLoginAttempts: attempts,
        lockedUntil: new Date(now.getTime() + waitSeconds * 1000),
      },
    });
  }

  private remainingLockSeconds(identity: UserIdentity, now: Date): number {
    if (identity.lockedUntil === null) {
      return 0;
    }

    const remaining = identity.lockedUntil.getTime() - now.getTime();

    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
  }
}
