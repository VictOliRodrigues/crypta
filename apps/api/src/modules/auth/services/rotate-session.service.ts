import { Injectable } from '@nestjs/common';

import { AppConfigService } from '@/config/app-config.service';

import { SessionRepository } from '../repositories/session.repository';
import { AccessTokenService } from './access-token.service';
import { RefreshTokenService } from './refresh-token.service';
import { type IssuedSession } from './session-issuer.service';

/**
 * Rotação do refresh token, detecção de reuso e os dois prazos (ADR 0021).
 *
 * ## A janela de tolerância
 *
 * O ADR 0021 diz que um token rotacionado há 10 segundos ou menos "devolve o
 * mesmo par que a rotação original emitiu". Isso **não é implementável**: o
 * servidor guarda apenas o `SHA-256` do token, e reproduzir o texto aberto
 * exigiria persistir o token em claro — anulando o hash em repouso do ADR 0022 e
 * fazendo um dump entregar sessões vivas.
 *
 * O ADR 0024 registra a leitura adotada: apresentar o token anterior dentro da
 * janela **não é reuso**. A sessão sobrevive, a família não cai, e o chamador
 * recebe um par novo. O propósito do ADR 0021 — nenhuma revogação por falso
 * positivo quando duas abas renovam juntas — é preservado.
 *
 * A rotação dentro da janela **não estende a inatividade**, como o ADR 0021
 * exige: `last_used_at` fica onde estava.
 *
 * ## Os dois prazos
 *
 * Nenhum vencimento é gravado. Inatividade conta de `last_used_at`, teto
 * absoluto conta de `created_at`, e os dois usam os valores de ambiente
 * vigentes. Gravar congelaria a configuração no instante do login.
 */

/** Janela de tolerância do ADR 0021, em milissegundos. */
const ROTATION_GRACE_MS = 10_000;

export type RotationOutcome =
  | { kind: 'rotated'; session: IssuedSession }
  /** Token desconhecido, sessão inexistente ou prazo estourado. */
  | { kind: 'invalid' }
  /** Token anterior fora da janela: a família inteira cai. */
  | { kind: 'reused' };

@Injectable()
export class RotateSessionService {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly accessTokens: AccessTokenService,
    private readonly refreshTokens: RefreshTokenService,
    private readonly appConfig: AppConfigService,
  ) {}

  async execute(input: { refreshToken: string; now: Date }): Promise<RotationOutcome> {
    const presentedHash = this.refreshTokens.hash(input.refreshToken);

    const session = await this.sessions.findByAnyTokenHash(presentedHash);

    if (session === null) {
      return { kind: 'invalid' };
    }

    // Token anterior fora da janela é reuso: alguém está apresentando um token
    // que já foi trocado, e a única explicação segura é que ele foi copiado.
    const isPrevious = session.previousTokenHash === presentedHash;

    if (isPrevious && !this.isWithinGrace(session.rotatedAt, input.now)) {
      await this.sessions.deleteFamily(session.familyId);

      return { kind: 'reused' };
    }

    if (this.hasExpired(session, input.now)) {
      await this.sessions.deleteById(session.id);

      return { kind: 'invalid' };
    }

    const refreshToken = this.refreshTokens.generate();

    const rotated = await this.sessions.rotate({
      id: session.id,
      refreshTokenHash: this.refreshTokens.hash(refreshToken),
      previousTokenHash: presentedHash,
      rotatedAt: input.now,
      // Dentro da janela a inatividade não é renovada: a rotação existe para
      // não derrubar a aba concorrente, não para dar sobrevida à sessão.
      lastUsedAt: isPrevious ? session.lastUsedAt : input.now,
    });

    if (!rotated) {
      // Outra requisição rotacionou entre a leitura e a escrita. Recusar é
      // correto: o cliente repete com o cookie novo, que o navegador já tem.
      return { kind: 'invalid' };
    }

    const { token, expiresIn } = await this.accessTokens.issue({
      sub: session.userId,
      sid: session.id,
    });

    return {
      kind: 'rotated',
      session: { sessionId: session.id, accessToken: token, expiresIn, refreshToken },
    };
  }

  /** Encerra a sessão corrente. Revogar é apagar a linha (ADR 0020). */
  async revokeCurrent(sessionId: string): Promise<void> {
    await this.sessions.deleteById(sessionId);
  }

  /** Revoga todas as sessões do usuário, opcionalmente preservando a atual. */
  async revokeAll(input: { userId: string; exceptSessionId?: string }): Promise<number> {
    return this.sessions.deleteAllForUser(input.userId, input.exceptSessionId);
  }

  /**
   * Sessão válida agora, pelos dois limites ao mesmo tempo.
   *
   * Usado pelo guard a cada requisição: é isso que torna a revogação imediata em
   * vez de esperar os 15 minutos do access token (`SECURITY.md` secao 29).
   */
  async isSessionValid(sessionId: string, now: Date): Promise<boolean> {
    const session = await this.sessions.findById(sessionId);

    if (session === null) {
      return false;
    }

    if (this.hasExpired(session, now)) {
      await this.sessions.deleteById(session.id);

      return false;
    }

    return true;
  }

  private isWithinGrace(rotatedAt: Date | null, now: Date): boolean {
    return rotatedAt !== null && now.getTime() - rotatedAt.getTime() <= ROTATION_GRACE_MS;
  }

  /**
   * Os dois limites valem juntos.
   *
   * Só inatividade produziria sessão perpétua para um cliente que renova
   * sozinho; só o absoluto manteria viva uma sessão abandonada em dispositivo
   * emprestado.
   */
  private hasExpired(session: { createdAt: Date; lastUsedAt: Date }, now: Date): boolean {
    const { refreshIdle, refreshAbsolute } = this.appConfig.tokenTtl;

    const idleDeadline = session.lastUsedAt.getTime() + refreshIdle * 1000;
    const absoluteDeadline = session.createdAt.getTime() + refreshAbsolute * 1000;

    return now.getTime() > idleDeadline || now.getTime() > absoluteDeadline;
  }
}
