import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

import {
  type ApiErrorCode,
  isApiErrorResponse,
  REQUEST_HEADERS,
  RESPONSE_HEADERS,
} from '@crypta/contracts';

import { buildInfo, env } from '@/lib/env';

import { createRefreshQueue } from './refresh-queue';

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

/**
 * Rotas que **não** devem disparar refresh ao receber `401`.
 *
 * O próprio refresh está na lista pelo motivo óbvio: um `401` nele significa que
 * a sessão acabou, e tentar renovar a partir dali seria laço infinito. O login
 * está pela mesma razão em outra forma — o `401` ali é credencial errada, não
 * token expirado, e renovar não tem o que consertar.
 */
const NO_REFRESH_PATHS = ['/auth/refresh', '/auth/login', '/setup'];

function shouldSkipRefresh(url: string | undefined): boolean {
  return url !== undefined && NO_REFRESH_PATHS.some((path) => url.startsWith(path));
}

/** Marca a requisição que já foi reexecutada, para não repetir indefinidamente. */
type RetriableConfig = InternalAxiosRequestConfig & { retriedAfterRefresh?: boolean };

export type AuthBridge = {
  getAccessToken: () => string | null;
  setAccessToken: (token: string) => void;
  /** Chamado quando a renovação falha: limpa sessão, cache e volta ao login. */
  onSessionLost: () => void;
};

/**
 * Liga o cliente à sessão.
 *
 * Recebe o acesso ao estado por parâmetro em vez de importá-lo: assim os testes
 * exercitam a fila de refresh sem montar o store, e o módulo do cliente não
 * passa a depender do de sessão — que depende dele.
 */
export function installAuthInterceptors(client: AxiosInstance, bridge: AuthBridge): () => void {
  const queue = createRefreshQueue(async () => {
    try {
      const response = await client.post<{ data: { accessToken: string } }>('/auth/refresh');

      bridge.setAccessToken(response.data.data.accessToken);

      return true;
    } catch {
      return false;
    }
  });

  const requestId = client.interceptors.request.use((config) => {
    const token = bridge.getAccessToken();

    if (token !== null) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }

    return config;
  });

  const responseId = client.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      if (!axios.isAxiosError(error) || error.response?.status !== 401) {
        throw error;
      }

      const config = error.config as RetriableConfig | undefined;

      if (config === undefined || config.retriedAfterRefresh === true) {
        throw error;
      }

      if (shouldSkipRefresh(config.url)) {
        throw error;
      }

      // Um único refresh em voo. As demais requisições que falharem enquanto ele
      // corre aguardam o mesmo resultado, em vez de disparar o próprio.
      const renewed = await queue.run();

      if (!renewed) {
        bridge.onSessionLost();

        throw error;
      }

      config.retriedAfterRefresh = true;

      return client.request(config);
    },
  );

  return () => {
    client.interceptors.request.eject(requestId);
    client.interceptors.response.eject(responseId);
    queue.reset();
  };
}
