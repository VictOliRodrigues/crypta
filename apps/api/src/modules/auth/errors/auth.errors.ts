import { HttpStatus } from '@nestjs/common';

import { ApiException } from '@/common/errors/api.exception';

/**
 * Erros de domínio da autenticação.
 *
 * Todos carregam mensagem pública já em português e sem detalhe interno: o
 * cliente ramifica pelo `code`, o usuário lê a mensagem, e nenhum dos dois
 * recebe informação que ajude a enumerar contas (`SECURITY.md` secao 25).
 */

export class SetupAlreadyCompletedException extends ApiException {
  constructor() {
    super(
      'SETUP_ALREADY_COMPLETED',
      HttpStatus.CONFLICT,
      'A configuração inicial já foi concluída.',
    );
  }
}

export class InvalidKeyBundleException extends ApiException {
  constructor(reason: string) {
    super('INVALID_KEY_BUNDLE', HttpStatus.BAD_REQUEST, 'O material criptográfico é inválido.', [
      { field: 'keyBundle', code: reason },
    ]);
  }
}

export class IdempotencyConflictException extends ApiException {
  constructor() {
    super(
      'IDEMPOTENCY_CONFLICT',
      HttpStatus.CONFLICT,
      'A mesma chave de idempotência já foi usada com outro conteúdo.',
      [{ field: 'Idempotency-Key', code: 'PAYLOAD_MISMATCH' }],
    );
  }
}

/**
 * Recusa uniforme do login.
 *
 * Credencial errada, conta inexistente e conta bloqueada devolvem exatamente
 * isto. Distinguir os casos aqui transformaria o bloqueio em oráculo de
 * enumeração (`SECURITY.md` secao 25, ADR 0022).
 */
export class InvalidCredentialsException extends ApiException {
  constructor() {
    super('INVALID_CREDENTIALS', HttpStatus.UNAUTHORIZED, 'E-mail ou senha inválidos.');
  }
}

/**
 * Só é lançada **depois** de o `AuthSecret` conferir.
 *
 * Nesse ponto o chamador já provou ter a senha, então dizer que a conta está
 * bloqueada não entrega nada que ele não soubesse.
 */
export class AccountLockedException extends ApiException {
  constructor(retryAfterSeconds: number) {
    super(
      'ACCOUNT_LOCKED',
      HttpStatus.UNAUTHORIZED,
      'Muitas tentativas. Aguarde alguns minutos e tente de novo.',
      [{ field: 'retryAfter', code: 'SECONDS', message: String(retryAfterSeconds) }],
    );
  }
}

/** Também condicionada à autenticação bem-sucedida. */
export class AccountDisabledException extends ApiException {
  constructor() {
    super('ACCOUNT_DISABLED', HttpStatus.UNAUTHORIZED, 'Esta conta está indisponível.');
  }
}

export class RefreshTokenInvalidException extends ApiException {
  constructor() {
    super('TOKEN_INVALID', HttpStatus.UNAUTHORIZED, 'Sua sessão não está mais válida.');
  }
}

/**
 * Reutilização detectada: a família inteira já foi revogada quando isto é
 * lançado. O código é distinto do anterior porque o cliente precisa saber que
 * não adianta tentar de novo.
 */
export class RefreshTokenReusedException extends ApiException {
  constructor() {
    super('SESSION_REVOKED', HttpStatus.UNAUTHORIZED, 'Sua sessão foi encerrada por segurança.');
  }
}

/**
 * `POST /users/me/change-password` com o `AuthSecret` atual errado.
 *
 * Distinta de `InvalidCredentialsException`, e a diferença é deliberada: aqui
 * não existe oráculo de enumeração a evitar. Quem chama já está autenticado, a
 * conta é a dele, e a tela não tem campo de e-mail para o texto do login fazer
 * sentido.
 */
export class CurrentCredentialInvalidException extends ApiException {
  constructor() {
    super('CURRENT_CREDENTIAL_INVALID', HttpStatus.UNAUTHORIZED, 'A senha atual está incorreta.');
  }
}

/**
 * Tentativa de trocar a chave pública durante a alteração de senha.
 *
 * A chave pública é o endereço para o qual todo `VaultKeyEnvelope` existente
 * foi selado. Aceitar uma nova aqui tornaria ilegível todo cofre que o usuário
 * tem ou que compartilharam com ele, e o estrago só apareceria na próxima
 * abertura — depois de a transação ter sido confirmada.
 *
 * A troca de senha reprotege o **mesmo** par com uma `UserEncryptionKey` nova.
 * Substituir o par é outra operação, que a V1 não tem (`SECURITY.md` secao 28).
 */
export class PublicKeyChangeNotAllowedException extends ApiException {
  constructor() {
    super(
      'PUBLIC_KEY_CHANGE_NOT_ALLOWED',
      HttpStatus.CONFLICT,
      'A alteração de senha não pode trocar seu par de chaves.',
      [{ field: 'newKeyBundle.publicKey', code: 'IMMUTABLE' }],
    );
  }
}
