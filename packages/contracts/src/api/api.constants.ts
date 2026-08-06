/**
 * Constantes de transporte compartilhadas por Web, Android e API.
 *
 * Referência: docs/API.md secoes 4, 5 e 6.
 */

/** Prefixo obrigatório de toda rota versionada. */
export const API_PREFIX = 'api/v1' as const;

/** Nome lógico do serviço, retornado em `/health/live` e `/version`. */
export const API_SERVICE_NAME = 'crypta-api' as const;

/**
 * Headers de request reconhecidos pela API.
 *
 * `X-Request-Id` é gerado pela API quando o cliente não envia.
 */
export const REQUEST_HEADERS = {
  requestId: 'x-request-id',
  idempotencyKey: 'idempotency-key',
  clientType: 'x-client-type',
  clientVersion: 'x-client-version',
} as const;

/**
 * Headers informativos de deployment.
 *
 * Não substituem `GET /version` e nunca podem conter hostname, path interno
 * ou qualquer detalhe de infraestrutura (docs/API.md secao 6).
 */
export const RESPONSE_HEADERS = {
  requestId: 'x-request-id',
  appVersion: 'x-app-version',
  appCommit: 'x-app-commit',
  appEnvironment: 'x-app-environment',
} as const;

/** Clientes autorizados a se identificar via `X-Client-Type`. */
export const CLIENT_TYPES = ['web', 'android', 'extension'] as const;

export type ClientType = (typeof CLIENT_TYPES)[number];

/** Ambientes lógicos oficiais. Apelidos como `dev` ou `prod` não são aceitos. */
export const APP_ENVIRONMENTS = ['development', 'staging', 'production'] as const;

export type AppEnvironment = (typeof APP_ENVIRONMENTS)[number];

/** Limites de paginação por cursor (docs/API.md secao 11). */
export const PAGINATION = {
  defaultLimit: 50,
  maxLimit: 100,
} as const;
