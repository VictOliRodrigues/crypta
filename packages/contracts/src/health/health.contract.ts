import { type ApiSuccessResponse } from '../api/envelope';

/**
 * Contratos de health check (docs/API.md secoes 16 e 17).
 *
 * Nenhum dos dois endpoints exige autenticação e nenhum pode expor hostname,
 * versão de dependência, string de conexão ou stack.
 */

/** `GET /health/live` — o processo está de pé. */
export type LivenessData = {
  status: 'ok';
  service: string;
  /** ISO 8601 em UTC. */
  timestamp: string;
};

export type LivenessResponse = ApiSuccessResponse<LivenessData>;

/**
 * `GET /health/ready` — a API pode receber tráfego.
 *
 * Responde `503 SERVICE_UNAVAILABLE` quando alguma verificação falha; o corpo
 * de falha usa o envelope de erro padrão e não descreve a causa.
 */
export type ReadinessData = {
  status: 'ready';
  database: 'ok';
};

export type ReadinessResponse = ApiSuccessResponse<ReadinessData>;
