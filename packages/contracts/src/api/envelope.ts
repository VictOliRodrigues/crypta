import { type ApiErrorCode } from './error-codes';

/**
 * Envelopes de resposta da API (docs/API.md secoes 7 e 8).
 *
 * Toda resposta com corpo usa `data` em caso de sucesso e `error` em caso de
 * falha. Os dois nunca aparecem juntos.
 */

/** Metadados de listagem paginada por cursor. */
export type ApiListMeta = {
  /** Cursor opaco para a próxima página. `null` quando não há mais registros. */
  cursor: string | null;
  hasMore: boolean;
};

export type ApiSuccessResponse<TData, TMeta = never> = [TMeta] extends [never]
  ? { data: TData }
  : { data: TData; meta: TMeta };

export type ApiListResponse<TItem> = {
  data: TItem[];
  meta: ApiListMeta;
};

/**
 * Detalhe de erro por campo.
 *
 * Nunca pode conter valor enviado pelo usuário: um detalhe de validação de
 * senha jamais deve ecoar a senha.
 */
export type ApiErrorDetail = {
  field?: string | undefined;
  code: string;
  message?: string | undefined;
};

export type ApiErrorBody = {
  code: ApiErrorCode;
  /** Mensagem pública em português, segura para exibição ao usuário. */
  message: string;
  requestId: string;
  details: ApiErrorDetail[];
};

export type ApiErrorResponse = {
  error: ApiErrorBody;
};

export type ApiResponse<TData, TMeta = never> = ApiSuccessResponse<TData, TMeta> | ApiErrorResponse;

/** Type guard para separar sucesso de erro sem depender do status HTTP. */
export function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  if (typeof value !== 'object' || value === null || !('error' in value)) {
    return false;
  }

  const { error } = value;

  return (
    typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
  );
}
