import { type ApiSuccessResponse } from '../api/envelope';

/**
 * Contratos de sessão (docs/API.md secoes 30 a 32).
 *
 * Nada aqui carrega refresh token, hash ou família: a resposta descreve a
 * sessão o suficiente para o usuário reconhecer o que revogar, e nada além
 * disso (`SECURITY.md` secao 36).
 */

/**
 * Uma sessão do próprio usuário, como a interface a exibe.
 *
 * `clientName`, `ipAddress` e `userAgent` vêm do cliente e **não são
 * confiáveis** — nenhum participa de decisão de autorização. São exibidos
 * porque são o que permite ao dono reconhecer um acesso que não é dele.
 *
 * Não há `expiresAt` nem `status`. Sessão revogada é apagada, não marcada
 * ([ADR 0020](../../../../docs/decisions/0020-deletion-policy.md)), então toda
 * linha desta lista está viva; e a expiração é derivada de `createdAt` mais o
 * teto absoluto e de `lastUsedAt` mais a inatividade (ADR 0021), sem coluna
 * própria que pudesse discordar das duas.
 */
export type SessionView = {
  id: string;
  /**
   * Normalmente um `ClientType`, mas tipado como `string` de propósito: a
   * coluna é livre, e o valor foi gravado por uma versão anterior do cliente
   * que pode não conhecer os tipos de hoje. Quem exibe precisa tratar
   * desconhecido, e prometer a união faria o `strict` acreditar no contrário.
   */
  clientType: string;
  clientName: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  /** ISO 8601. Âncora do teto absoluto; nenhuma rotação a move. */
  createdAt: string;
  /** ISO 8601. Âncora da inatividade; cada rotação a renova. */
  lastUsedAt: string;
  /** Distingue "esta é a sessão que você está usando agora" na interface. */
  isCurrent: boolean;
};

/** `GET /sessions`. */
export type SessionListResponse = ApiSuccessResponse<SessionView[]>;
