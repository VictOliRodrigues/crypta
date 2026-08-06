import { randomUUID } from 'node:crypto';

import { Injectable, type NestMiddleware } from '@nestjs/common';
import { type NextFunction, type Request, type Response } from 'express';

import { REQUEST_HEADERS, RESPONSE_HEADERS } from '@vault/contracts';

/** Chave usada para carregar o request ID pelo ciclo da requisição. */
export const REQUEST_ID_KEY = 'vaultRequestId';

export type RequestWithId = Request & { [REQUEST_ID_KEY]?: string };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Correlaciona logs, respostas de erro e auditoria (docs/API.md secao 6).
 *
 * O valor enviado pelo cliente só é aceito quando é um UUID. Um `X-Request-Id`
 * arbitrário seria refletido na resposta e escrito nos logs, permitindo
 * injeção de conteúdo em quem consome esses logs.
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(request: RequestWithId, response: Response, next: NextFunction): void {
    const incoming = request.headers[REQUEST_HEADERS.requestId];
    const candidate = Array.isArray(incoming) ? incoming[0] : incoming;

    const requestId =
      typeof candidate === 'string' && UUID_PATTERN.test(candidate) ? candidate : randomUUID();

    request[REQUEST_ID_KEY] = requestId;
    response.setHeader(RESPONSE_HEADERS.requestId, requestId);

    next();
  }
}

/** Lê o request ID já atribuído pelo middleware. */
export function getRequestId(request: RequestWithId): string {
  return request[REQUEST_ID_KEY] ?? 'unknown';
}
