import { type ApiListResponse, type ApiSuccessResponse } from '../api/envelope';

/**
 * Contratos de cofre (docs/API.md secoes 33 a 38).
 *
 * **Nada aqui é legível pelo servidor.** Nome e descrição viajam dentro de
 * `encryptedMetadata`, e a `VaultKey` que os abre viaja selada para a chave
 * pública do membro. O que a API conhece são identificadores, contagens,
 * versões e papéis — o suficiente para autorizar, e nada que descreva o
 * conteúdo (`CLAUDE.md` secao 7).
 */

/** Papéis da V1. `READER` está fora do escopo (`CLAUDE.md` secao 11). */
export const VAULT_ROLES = ['OWNER', 'EDITOR'] as const;

export type VaultRole = (typeof VAULT_ROLES)[number];

/**
 * Payload criptografado comum (docs/API.md secao 14).
 *
 * A API valida a estrutura com `parseCipherPayload` e nunca o conteúdo. A AAD
 * não trafega: ela é reconstruída pelo cliente a partir do contexto da
 * entidade, e é justamente isso que a faz amarrar.
 */
export type EncryptedPayload = {
  cryptoVersion: number;
  schemaVersion: number;
  algorithm: string;
  /** base64url. */
  nonce: string;
  /** base64url. */
  ciphertext: string;
};

/**
 * Envelope da `VaultKey` (docs/API.md secao 15).
 *
 * **Não existe campo `nonce`**, e a ausência é decisão do ADR 0023: ele é
 * derivado junto com a chave da AEAD e não trafega.
 */
export type KeyEnvelopeView = {
  keyVersion: number;
  cryptoVersion: number;
  algorithm: string;
  /** base64url, 32 bytes. */
  ephemeralPublicKey: string;
  /** base64url, com a tag de autenticação. */
  encryptedVaultKey: string;
};

/**
 * Um cofre na listagem (`GET /vaults`).
 *
 * `memberCount` e `siteCount` são contagens, não conteúdo: a API sabe **quantos**
 * sites existem e não sabe o nome de nenhum.
 */
export type VaultSummary = {
  id: string;
  encryptedMetadata: EncryptedPayload;
  role: VaultRole;
  memberCount: number;
  siteCount: number;
  version: number;
  keyVersion: number;
  /** ISO 8601. */
  updatedAt: string;
};

/** `GET /vaults/:vaultId`. */
export type VaultDetail = VaultSummary & {
  /**
   * Sempre `false` na R0.3: o rekey entra na R0.5. O campo existe desde já
   * porque a interface precisa saber bloquear mutações, e acrescentá-lo depois
   * faria o cliente antigo tratar cofre travado como cofre normal.
   */
  isLockedForRekey: boolean;
  /** ISO 8601. */
  createdAt: string;
};

/** `POST /vaults`, resposta `201`. */
export type VaultCreatedData = {
  id: string;
  role: VaultRole;
  version: number;
  keyVersion: number;
  /** ISO 8601. */
  createdAt: string;
};

/** `PATCH /vaults/:vaultId`. */
export type VaultUpdatedData = {
  id: string;
  version: number;
  /** ISO 8601. */
  updatedAt: string;
};

/** Um membro, como o snapshot o descreve. Sem e-mail nem chave pública. */
export type VaultMemberView = {
  userId: string;
  role: VaultRole;
  /** ISO 8601. */
  joinedAt: string;
};

/**
 * `GET /vaults/:vaultId/snapshot`.
 *
 * `sites` e `credentials` existem vazios na R0.3 e passam a ter conteúdo na
 * R0.4. O cursor e os limites precisam existir antes de haver o que paginar,
 * para que a forma da resposta não mude quando houver.
 *
 * **Só o envelope do chamador vem aqui.** Devolver o de outro membro não daria
 * acesso a nada — ele é selado para outra chave pública — mas entregaria o mapa
 * de quem tem acesso a quê para qualquer um que capturasse a resposta.
 */
export type VaultSnapshotData = {
  vault: {
    id: string;
    encryptedMetadata: EncryptedPayload;
    version: number;
    keyVersion: number;
  };
  currentUserEnvelope: KeyEnvelopeView;
  sites: never[];
  credentials: never[];
  members: VaultMemberView[];
  /** Opaco. O cliente devolve o valor sem interpretá-lo. */
  syncCursor: string | null;
};

export type VaultListResponse = ApiListResponse<VaultSummary>;
export type VaultDetailResponse = ApiSuccessResponse<VaultDetail>;
export type VaultCreatedResponse = ApiSuccessResponse<VaultCreatedData>;
export type VaultUpdatedResponse = ApiSuccessResponse<VaultUpdatedData>;
export type VaultSnapshotResponse = ApiSuccessResponse<VaultSnapshotData>;
