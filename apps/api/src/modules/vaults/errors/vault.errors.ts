import { HttpStatus } from '@nestjs/common';

import { ApiException } from '@/common/errors/api.exception';

/**
 * Erros de domínio dos cofres.
 *
 * **Não existe `VaultNotFoundException`.** Cofre inexistente e cofre de outro
 * usuário devolvem exatamente o mesmo `404 RESOURCE_NOT_FOUND`, produzido por
 * `VaultAccessDeniedException`. Um código próprio para "existe mas não é seu"
 * seria um oráculo: bastaria varrer ids para descobrir quais existem
 * (`CLAUDE.md` secao 40).
 */

/**
 * Recusa uniforme de acesso a cofre.
 *
 * O `404` é deliberado, e o nome da classe é sobre a decisão, não sobre a
 * resposta: quem chega aqui não tem acesso, e a API não diz se o motivo é
 * ausência de recurso ou ausência de permissão.
 */
export class VaultAccessDeniedException extends ApiException {
  constructor() {
    super('RESOURCE_NOT_FOUND', HttpStatus.NOT_FOUND, 'Cofre não encontrado.');
  }
}

/**
 * Ação que exige ser dono, pedida por quem é membro.
 *
 * Aqui o `403` é correto e não vaza nada: o chamador já provou ter acesso ao
 * cofre, então saber que a ação é restrita ao dono não lhe diz nada novo.
 */
export class VaultOwnerRequiredException extends ApiException {
  constructor() {
    super(
      'VAULT_ACCESS_DENIED',
      HttpStatus.FORBIDDEN,
      'Somente o proprietário do cofre pode fazer isso.',
    );
  }
}

export class VaultVersionConflictException extends ApiException {
  constructor(currentVersion: number) {
    super(
      'VERSION_CONFLICT',
      HttpStatus.CONFLICT,
      'O cofre foi alterado por outra sessão. Recarregue e tente de novo.',
      [
        {
          field: 'expectedVersion',
          code: 'STALE',
          message: `A versão atual é ${String(currentVersion)}.`,
        },
      ],
    );
  }
}

/**
 * Id de cofre já usado.
 *
 * O id vem do cliente (ADR 0025), então a colisão é possível e precisa de
 * resposta própria — o cliente refaz a operação com outro identificador.
 */
export class VaultIdentifierConflictException extends ApiException {
  constructor() {
    super(
      'IDENTIFIER_CONFLICT',
      HttpStatus.CONFLICT,
      'Este identificador de cofre já está em uso.',
      [{ field: 'id', code: 'IN_USE' }],
    );
  }
}

export class VaultLimitReachedException extends ApiException {
  constructor(limit: number) {
    super(
      'VAULT_LIMIT_REACHED',
      HttpStatus.CONFLICT,
      `Você atingiu o limite de ${String(limit)} cofres.`,
    );
  }
}

/**
 * Envelope que não corresponde ao cofre criado.
 *
 * A API não abre o envelope, mas confere o que é conferível sem abrir: a
 * `keyVersion` declarada precisa ser a do cofre. Um envelope de outra geração
 * gravado agora só seria descoberto quando alguém tentasse abrir o cofre.
 */
export class InvalidEnvelopeException extends ApiException {
  constructor(reason: string) {
    super('INVALID_ENVELOPE', HttpStatus.BAD_REQUEST, 'O envelope de chave é inválido.', [
      { field: 'ownerEnvelope', code: reason },
    ]);
  }
}
