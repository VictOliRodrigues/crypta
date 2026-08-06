import { type ApiErrorCode, type ApiErrorDetail } from '@vault/contracts';

/**
 * Exceção de domínio da API.
 *
 * Carrega um código estável, um status HTTP e uma mensagem pública em
 * português. A causa interna nunca entra na mensagem pública
 * (STYLE_GUIDE.md secao 9.2).
 */
export class ApiException extends Error {
  constructor(
    readonly code: ApiErrorCode,
    readonly status: number,
    /** Mensagem exibível ao usuário. Não pode revelar estado interno. */
    readonly publicMessage: string,
    readonly details: ApiErrorDetail[] = [],
  ) {
    super(publicMessage);
    this.name = new.target.name;
  }
}

/** `503` — alguma dependência obrigatória não respondeu. */
export class ServiceUnavailableException extends ApiException {
  constructor() {
    super('SERVICE_UNAVAILABLE', 503, 'O serviço ainda não está disponível.');
  }
}
