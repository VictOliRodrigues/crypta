import { type ApiSuccessResponse } from '../api/envelope';

/**
 * Contratos de setup e autenticação (docs/API.md secoes 19 a 22).
 *
 * Nenhum deles carrega senha, `RootKey` ou `UserEncryptionKey`: o cliente envia
 * apenas o `AuthSecret`, e o material que descriptografa nunca sai dele
 * (ADR 0003, ADR 0004).
 */

/** `GET /setup/status` — o primeiro usuário ainda precisa ser criado? */
export type SetupStatusData = {
  setupRequired: boolean;
};

export type SetupStatusResponse = ApiSuccessResponse<SetupStatusData>;

/**
 * Material criptográfico que o cliente gera e envia no setup.
 *
 * Os parâmetros KDF viajam junto porque o cliente precisa deles antes de
 * autenticar, e ficam por usuário para que a recalibração do ADR 0018 não
 * invalide conta existente.
 */
export type KeyBundlePayload = {
  kdfAlgorithm: 'ARGON2ID';
  kdfVersion: number;
  kdfSalt: string;
  kdfMemory: number;
  kdfIterations: number;
  kdfParallelism: number;
  publicKey: string;
  encryptedPrivateKey: string;
  privateKeyNonce: string;
  cryptoVersion: number;
  schemaVersion: number;
};

/**
 * `GET /auth/parameters` — o que o cliente precisa para reproduzir a derivação.
 *
 * Para e-mail inexistente a resposta é sintética, **estável por e-mail** e
 * estruturalmente idêntica à real. Parâmetros sorteados a cada requisição seriam
 * por si só o oráculo de enumeração que a `SECURITY.md` secao 25 manda evitar.
 */
export type AuthParametersData = {
  kdfAlgorithm: 'ARGON2ID';
  kdfVersion: number;
  kdfSalt: string;
  kdfMemory: number;
  kdfIterations: number;
  kdfParallelism: number;
};

export type AuthParametersResponse = ApiSuccessResponse<AuthParametersData>;

/** Perfil devolvido junto de uma autenticação bem-sucedida. */
export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
};

/**
 * Resposta de `POST /setup` e `POST /auth/login`.
 *
 * `refreshToken` só aparece para o cliente Android. Na Web ele vai em cookie
 * `HttpOnly`, fora do alcance do JavaScript (ADR 0021).
 */
export type AuthSessionData = {
  user: AuthenticatedUser;
  accessToken: string;
  /** Segundos até a expiração do access token. */
  expiresIn: number;
  refreshToken?: string;
};

export type AuthSessionResponse = ApiSuccessResponse<AuthSessionData>;

/**
 * Resposta de `POST /auth/refresh` (docs/API.md secao 23).
 *
 * Sem `user`, de propósito: o refresh renova credencial, não devolve perfil.
 * Quem precisa do perfil chama `GET /users/me`, e repeti-lo aqui faria toda
 * renovação carregar dado que ninguém pediu.
 */
export type RefreshSessionData = {
  accessToken: string;
  expiresIn: number;
  refreshToken?: string;
};

export type RefreshSessionResponse = ApiSuccessResponse<RefreshSessionData>;
