/**
 * Códigos de erro globais da API.
 *
 * Os códigos são estáveis: um cliente pode ramificar comportamento a partir
 * deles. Renomear ou remover um código é mudança incompatível e exige ADR
 * (docs/API.md secao 10, CLAUDE.md secao 35).
 *
 * Códigos específicos de domínio (por exemplo `VAULT_ACCESS_DENIED`) serão
 * adicionados junto com o módulo correspondente.
 */
export const API_ERROR_CODES = [
  'VALIDATION_ERROR',
  'INVALID_REQUEST',
  'UNAUTHORIZED',
  'TOKEN_EXPIRED',
  'TOKEN_INVALID',
  'SESSION_REVOKED',
  'SESSION_EXPIRED',
  'ACCESS_DENIED',
  'RESOURCE_NOT_FOUND',
  'VERSION_CONFLICT',
  'IDEMPOTENCY_CONFLICT',
  'RATE_LIMIT_EXCEEDED',
  'PAYLOAD_TOO_LARGE',
  'SERVICE_UNAVAILABLE',
  'INTERNAL_ERROR',

  // Setup e autenticação (docs/API.md secoes 20 a 22).
  //
  // `ACCOUNT_DISABLED` e `ACCOUNT_LOCKED` existem, mas o login só os devolve a
  // quem já apresentou o `AuthSecret` correto. Antes disso a resposta é sempre
  // `INVALID_CREDENTIALS`, para que o bloqueio não vire oráculo de enumeração
  // (ADR 0022, SECURITY.md secao 25).
  'SETUP_ALREADY_COMPLETED',
  'INVALID_KDF_PARAMETERS',
  'INVALID_KEY_BUNDLE',
  'INVALID_CREDENTIALS',
  'ACCOUNT_DISABLED',
  'ACCOUNT_LOCKED',

  // Alteração de senha (docs/API.md secao 29).
  //
  // `CURRENT_CREDENTIAL_INVALID` é distinto de `INVALID_CREDENTIALS` porque
  // aqui não há oráculo a evitar: quem chama já está autenticado, e a conta é
  // a dele. Reaproveitar o código do login faria o cliente exibir "e-mail ou
  // senha inválidos" numa tela que não tem campo de e-mail.
  // Cofres (docs/API.md secoes 33 a 38).
  //
  // `IDENTIFIER_CONFLICT` existe porque o id do cofre vem do cliente
  // (ADR 0025): é o `409` de identificador já usado, no mesmo padrão de
  // `VERSION_CONFLICT` e `IDEMPOTENCY_CONFLICT`.
  //
  // Não existe `VAULT_NOT_FOUND`. Cofre de outro usuário responde
  // `RESOURCE_NOT_FOUND`, igual a cofre inexistente: um código próprio
  // diria que o recurso existe e não é seu.
  'IDENTIFIER_CONFLICT',
  'VAULT_ACCESS_DENIED',
  'VAULT_LIMIT_REACHED',
  'INVALID_ENVELOPE',
  'VAULT_LOCKED_FOR_REKEY',

  'CURRENT_CREDENTIAL_INVALID',
  'PUBLIC_KEY_CHANGE_NOT_ALLOWED',
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

const API_ERROR_CODE_SET: ReadonlySet<string> = new Set(API_ERROR_CODES);

/** Type guard usado por clientes ao tratar respostas de erro desconhecidas. */
export function isApiErrorCode(value: unknown): value is ApiErrorCode {
  return typeof value === 'string' && API_ERROR_CODE_SET.has(value);
}
