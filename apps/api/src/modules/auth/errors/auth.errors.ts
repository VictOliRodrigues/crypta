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
