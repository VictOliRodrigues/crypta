import {
  type Argon2idParameters,
  createUserKeyBundle,
  deriveIdentitySecrets,
  type KeyPair,
  openUserKeyBundle,
  toBase64Url,
  type UserKeyBundle,
} from '@crypta/crypto-core';
import {
  webAeadAdapter,
  webCryptoAdapter,
  webKdfAdapter,
  webKeyExchangeAdapter,
  webRandomSource,
} from '@crypta/crypto-web';

/**
 * Derivação e material de identidade, no navegador.
 *
 * **A senha nunca sai daqui.** O que vai para a API é o `AuthSecret`, e a
 * `UserEncryptionKey` fica em memória (ADR 0003, ADR 0004). Este módulo é o
 * único ponto da Web que recebe a senha em texto aberto.
 *
 * `webCryptoAdapter.init()` precisa resolver antes de qualquer derivação: ele
 * carrega o WebAssembly do libsodium e roda o self-test que recusa operar se a
 * implementação divergir do vetor conhecido (ADR 0016).
 */

/** Parâmetros do ADR 0018, usados quando a conta ainda não existe. */
const ARGON2ID_MEMORY_KIB = 65536;
const ARGON2ID_ITERATIONS = 3;
const ARGON2ID_PARALLELISM = 1;
const ARGON2ID_SALT_BYTES = 16;

export type DerivedIdentity = {
  /** base64url. É o único derivado que trafega. */
  authSecret: string;
  userEncryptionKey: Uint8Array;
};

export async function deriveIdentity(input: {
  password: string;
  parameters: Argon2idParameters;
}): Promise<DerivedIdentity> {
  await webCryptoAdapter.init();

  const { authSecret, userEncryptionKey } = await deriveIdentitySecrets({
    kdf: webKdfAdapter,
    password: input.password,
    parameters: input.parameters,
  });

  return { authSecret: toBase64Url(authSecret), userEncryptionKey };
}

/** Parâmetros novos, para uma conta que ainda não existe. */
export async function generateKdfParameters(): Promise<Argon2idParameters> {
  await webCryptoAdapter.init();

  return {
    memoryKib: ARGON2ID_MEMORY_KIB,
    iterations: ARGON2ID_ITERATIONS,
    parallelism: ARGON2ID_PARALLELISM,
    salt: toBase64Url(webRandomSource.getRandomBytes(ARGON2ID_SALT_BYTES)),
  };
}

/**
 * Gera o par do usuário e protege a metade privada.
 *
 * Devolve as duas partes: o bundle vai para a API, o par aberto fica em memória
 * para desbloquear o cofre em seguida.
 */
export async function buildKeyBundle(input: {
  userEncryptionKey: Uint8Array;
  parameters: Argon2idParameters;
}): Promise<{ bundle: UserKeyBundle; keyPair: KeyPair }> {
  await webCryptoAdapter.init();

  return createUserKeyBundle({
    aead: webAeadAdapter,
    keyExchange: webKeyExchangeAdapter,
    random: webRandomSource,
    userEncryptionKey: input.userEncryptionKey,
    parameters: input.parameters,
  });
}

/**
 * Abre o bundle recebido da API.
 *
 * Falha fechado: senha errada, ciphertext adulterado ou `publicKey` trocada pelo
 * servidor lançam `CryptoAuthenticationError` (ADR 0023).
 */
export async function openKeyBundle(input: {
  userEncryptionKey: Uint8Array;
  bundle: UserKeyBundle;
}): Promise<KeyPair> {
  await webCryptoAdapter.init();

  return openUserKeyBundle({
    aead: webAeadAdapter,
    userEncryptionKey: input.userEncryptionKey,
    bundle: input.bundle,
  });
}
