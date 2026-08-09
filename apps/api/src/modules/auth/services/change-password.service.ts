import { Injectable } from '@nestjs/common';

import { type KeyBundlePayload } from '@crypta/contracts';

import { PrismaService } from '@/database/prisma/prisma.service';

import {
  AccountDisabledException,
  CurrentCredentialInvalidException,
  InvalidKeyBundleException,
  PublicKeyChangeNotAllowedException,
} from '../errors/auth.errors';
import { AuthRepository } from '../repositories/auth.repository';
import { RotateSessionService } from './rotate-session.service';
import { ServerSecretService } from './server-secret.service';

/**
 * `POST /users/me/change-password` (docs/API.md secao 29, SECURITY.md secao 27).
 *
 * ## O que a troca de senha é, de fato
 *
 * Não é "atualizar um campo". A senha é a raiz de duas coisas ao mesmo tempo:
 *
 * ```text
 * senha → Argon2id → RootKey ─┬─ HKDF("auth")            → AuthSecret
 *                             └─ HKDF("user-encryption") → UserEncryptionKey
 * ```
 *
 * O `AuthSecret` prova quem é; a `UserEncryptionKey` abre a chave privada.
 * Trocar a senha troca as duas, e o par de chaves precisa ser **reprotegido**
 * pela chave nova sem mudar de identidade. Por isso o cliente manda um bundle
 * novo já montado: o servidor não poderia produzi-lo nem se quisesse, porque
 * nunca viu a `UserEncryptionKey` de lado nenhum (ADR 0003).
 *
 * ## Por que tudo em uma transação
 *
 * Verificador e bundle são um par. Gravar um sem o outro deixa a conta em
 * estado sem volta: autentica e não abre, ou abre e não autentica — e a senha
 * antiga já não serve para desfazer. A revogação das demais sessões entra na
 * mesma transação pelo motivo espelhado: derrubar as sessões e falhar a escrita
 * deixaria o usuário fora de tudo com a credencial antiga ainda válida.
 *
 * ## Por que exigir o `AuthSecret` atual
 *
 * `SECURITY.md` secao 27 proíbe trocar a senha só com um access token. Um token
 * roubado dá acesso à sessão; deixá-lo trocar a senha daria a conta. O
 * `currentAuthSecret` é a confirmação adicional que a regra pede, e quem o
 * apresenta provou ter a senha, não apenas o token.
 */

export type ChangePasswordInput = {
  userId: string;
  sessionId: string;
  currentAuthSecret: string;
  newAuthSecret: string;
  newKeyBundle: KeyBundlePayload;
  revokeOtherSessions: boolean;
};

@Injectable()
export class ChangePasswordService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: AuthRepository,
    private readonly serverSecret: ServerSecretService,
    private readonly sessions: RotateSessionService,
  ) {}

  async execute(input: ChangePasswordInput): Promise<void> {
    const identity = await this.repository.findIdentityById(input.userId);

    if (identity === null) {
      // O token referencia um usuário que não existe mais. Não é credencial
      // errada, e tratá-la como tal esconderia um estado que não deveria
      // ocorrer.
      throw new CurrentCredentialInvalidException();
    }

    if (!identity.isActive) {
      throw new AccountDisabledException();
    }

    const presented = this.serverSecret.computeAuthSecretHash(
      Buffer.from(input.currentAuthSecret, 'base64url'),
      identity.authSecretVersion,
    );

    if (!this.serverSecret.matchesAuthSecretHash(presented, identity.authSecretHash)) {
      throw new CurrentCredentialInvalidException();
    }

    const currentBundle = await this.repository.findKeyBundleByUserId(input.userId);

    if (currentBundle === null) {
      throw new InvalidKeyBundleException('MISSING_CURRENT_BUNDLE');
    }

    this.assertBundleIsAReseal(currentBundle, input.newKeyBundle);

    await this.prisma.$transaction(async (tx) => {
      await this.repository.replaceCredential(
        {
          userId: input.userId,
          // Sempre na versão corrente do segredo do servidor. A troca de senha é
          // a oportunidade natural de tirar a linha de uma versão antiga, e
          // reaproveitar a anterior manteria a dívida viva sem motivo.
          authSecretHash: this.serverSecret.computeAuthSecretHash(
            Buffer.from(input.newAuthSecret, 'base64url'),
          ),
          authSecretVersion: this.serverSecret.currentVersion,
          keyBundle: input.newKeyBundle,
        },
        tx,
      );

      if (input.revokeOtherSessions) {
        await this.sessions.revokeAll(
          { userId: input.userId, exceptSessionId: input.sessionId },
          tx,
        );
      }
    });
  }

  /**
   * Confere que o bundle novo reprotege o mesmo par, e não substitui o par.
   *
   * A chave pública é o endereço para o qual todo `VaultKeyEnvelope` existente
   * foi selado. Aceitar uma nova aqui tornaria ilegível tudo o que o usuário
   * tem, e o estrago apareceria só na próxima abertura — depois do commit.
   *
   * O salt precisa mudar pelo motivo oposto: mantê-lo faria a senha nova derivar
   * sob o mesmo material da antiga, e uma tabela pré-computada contra aquele
   * salt continuaria valendo. Não é o servidor que escolhe o salt, mas é ele
   * quem pode recusar o descuido.
   */
  private assertBundleIsAReseal(
    current: { publicKey: string; kdfSalt: string },
    next: KeyBundlePayload,
  ): void {
    if (next.publicKey !== current.publicKey) {
      throw new PublicKeyChangeNotAllowedException();
    }

    if (next.kdfSalt === current.kdfSalt) {
      throw new InvalidKeyBundleException('SALT_NOT_ROTATED');
    }
  }
}
