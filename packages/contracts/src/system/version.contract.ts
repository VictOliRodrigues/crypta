import { type AppEnvironment } from '../api/api.constants';
import { type ApiSuccessResponse } from '../api/envelope';

/**
 * `GET /version` — identifica exatamente o artefato implantado
 * (docs/API.md secao 18).
 *
 * Os valores vêm dos metadados imutáveis do build (APP_VERSION, APP_COMMIT,
 * APP_ENVIRONMENT, APP_BUILT_AT) e são usados para confirmar que produção
 * executa o mesmo digest homologado em staging.
 */
export type VersionData = {
  service: string;
  /** `MAJOR.MINOR.PATCH`, com sufixo de RC quando aplicável. */
  version: string;
  /** SHA curto do commit que originou a imagem. */
  commit: string;
  environment: AppEnvironment;
  /** ISO 8601 em UTC, momento do build. */
  builtAt: string;
};

export type VersionResponse = ApiSuccessResponse<VersionData>;
