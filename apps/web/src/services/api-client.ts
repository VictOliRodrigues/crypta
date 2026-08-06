import axios, { type AxiosInstance, type AxiosResponse } from 'axios';

import {
  type ApiErrorCode,
  isApiErrorResponse,
  REQUEST_HEADERS,
  RESPONSE_HEADERS,
} from '@vault/contracts';

import { buildInfo, env } from '@/lib/env';

/**
 * Cliente HTTP único da aplicação (STYLE_GUIDE.md secao 18).
 *
 * Nenhum componente instancia axios por conta própria: a centralização é o que
 * garante um único lugar onde token, cookie de refresh e normalização de erro
 * são tratados.
 *
 * O access token fica em memória. `withCredentials` existe para o cookie
 * `HttpOnly` de refresh — por isso a API nunca pode usar CORS com curinga.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  withCredentials: true,
  timeout: 15_000,
  headers: {
    Accept: 'application/json',
    [REQUEST_HEADERS.clientType]: 'web',
    [REQUEST_HEADERS.clientVersion]: buildInfo.version,
  },
});

/** Erro normalizado que a interface consome. */
export class ApiRequestError extends Error {
  constructor(
    readonly code: ApiErrorCode | 'NETWORK_ERROR',
    /** Mensagem já em português, segura para exibir ao usuário. */
    readonly userMessage: string,
    readonly requestId: string | null,
    readonly status: number | null,
  ) {
    super(userMessage);
    this.name = 'ApiRequestError';
  }
}

const NETWORK_MESSAGE = 'Não foi possível falar com o servidor. Verifique sua conexão.';
const UNEXPECTED_MESSAGE = 'Não foi possível concluir a operação.';

/**
 * Converte qualquer falha no mesmo formato.
 *
 * A mensagem exibida vem sempre da API ou de um texto fixo. Mensagens cruas do
 * axios podem conter a URL completa e detalhes de infraestrutura.
 */
export function normalizeApiError(error: unknown): ApiRequestError {
  if (!axios.isAxiosError(error)) {
    return new ApiRequestError('INTERNAL_ERROR', UNEXPECTED_MESSAGE, null, null);
  }

  const response: AxiosResponse<unknown> | undefined = error.response;

  if (response === undefined) {
    return new ApiRequestError('NETWORK_ERROR', NETWORK_MESSAGE, null, null);
  }

  const requestId = readRequestId(response);

  if (isApiErrorResponse(response.data)) {
    return new ApiRequestError(
      response.data.error.code,
      response.data.error.message,
      response.data.error.requestId,
      response.status,
    );
  }

  return new ApiRequestError('INTERNAL_ERROR', UNEXPECTED_MESSAGE, requestId, response.status);
}

function readRequestId(response: AxiosResponse<unknown>): string | null {
  const header: unknown = response.headers[RESPONSE_HEADERS.requestId];

  return typeof header === 'string' ? header : null;
}
