import {
  type AeadAdapter,
  type Argon2idParameters,
  type KeyExchangeAdapter,
  type KeyMaterial,
  type KeyPair,
  type RandomSource,
} from '../adapters/crypto-adapters';
import { fromBase64Url, toBase64Url } from '../encoding/base64url';
import { CryptoFormatError } from '../errors';
import { buildAad } from '../format/aad';
import {
  AEAD_NONCE_BYTES,
  assertSupportedCryptoVersion,
  CURRENT_CRYPTO_VERSION,
} from '../format/crypto-payload';

/**
 * Par de chaves do usuário e sua proteção (ARCHITECTURE.md secao 14.5).
 *
 * O cliente gera o par X25519, envia a pública em texto aberto e a privada
 * cifrada com a `UserEncryptionKey`. O backend guarda os dois lados sem ter como
 * abrir o privado: a `UserEncryptionKey` deriva da senha e nunca sai do cliente
 * (ADR 0003, ADR 0004).
 *
 * A AAD amarra o ciphertext à **chave pública do próprio par**. Isso vale mais
 * do que amarrar a um `userId`, e não só porque no `POST /setup` o id ainda não
 * existe: um servidor que troque `publicKey` mantendo `encryptedPrivateKey`
 * passaria a receber envelopes endereçados a uma chave que o usuário não abre —
 * ou, pior, a uma chave de terceiro. Com a AAD, a troca é detectada no
 * desbloqueio, antes de qualquer cofre ser compartilhado.
 */

/** Versão da forma deste bundle. Independente da versão criptográfica. */
export const USER_KEY_BUNDLE_SCHEMA_VERSION = 1;

/** Versão do conjunto de parâmetros KDF aceito (ADR 0018). */
export const KDF_VERSION = 1;

export const KDF_ALGORITHM = 'ARGON2ID' as const;

export type KdfAlgorithm = typeof KDF_ALGORITHM;

/**
 * O que trafega no `POST /setup` e volta em `GET /users/me/key-bundle`
 * (docs/API.md secoes 20 e 28).
 *
 * Os parâmetros KDF viajam junto porque o cliente precisa deles **antes** de
 * autenticar, para reproduzir a derivação. Ficam por usuário para que a
 * recalibração do ADR 0018 não invalide conta nenhuma.
 */
export type UserKeyBundle = {
  kdfAlgorithm: KdfAlgorithm;
  kdfVersion: number;
  /** Salt do Argon2id, base64url. Exatamente 16 bytes. */
  kdfSalt: string;
  /** Custo de memória em KiB. */
  kdfMemory: number;
  kdfIterations: number;
  kdfParallelism: number;
  /** Chave pública X25519 crua, base64url. */
  publicKey: string;
  /** Chave privada X25519 cifrada com a `UserEncryptionKey`, base64url. */
  encryptedPrivateKey: string;
  /** Nonce da XChaCha20-Poly1305, base64url. */
  privateKeyNonce: string;
  cryptoVersion: number;
  schemaVersion: number;
};

const X25519_KEY_BYTES = 32;
const ARGON2ID_SALT_BYTES = 16;

function requireString(source: Record<string, unknown>, field: string): string {
  const value = source[field];

  if (typeof value !== 'string' || value.length === 0) {
    throw new CryptoFormatError(`Campo "${field}" ausente ou inválido no key bundle.`);
  }

  return value;
}

function requireInteger(source: Record<string, unknown>, field: string): number {
  const value = source[field];

  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    throw new CryptoFormatError(`Campo "${field}" ausente ou inválido no key bundle.`);
  }

  return value;
}

/**
 * Valida um bundle vindo da API.
 *
 * O bundle chega do servidor, que é justamente quem não deve ser capaz de
 * alterá-lo sem ser notado. A validação estrutural acontece antes de qualquer
 * tentativa de decrypt, e a AAD cobre o resto.
 */
export function parseUserKeyBundle(value: unknown): UserKeyBundle {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new CryptoFormatError('Key bundle deve ser um objeto.');
  }

  const source: Record<string, unknown> = { ...value };

  const kdfAlgorithm = requireString(source, 'kdfAlgorithm');

  if (kdfAlgorithm !== KDF_ALGORITHM) {
    throw new CryptoFormatError('Algoritmo de KDF não suportado por este cliente.');
  }

  const bundle: UserKeyBundle = {
    kdfAlgorithm,
    kdfVersion: requireInteger(source, 'kdfVersion'),
    kdfSalt: requireString(source, 'kdfSalt'),
    kdfMemory: requireInteger(source, 'kdfMemory'),
    kdfIterations: requireInteger(source, 'kdfIterations'),
    kdfParallelism: requireInteger(source, 'kdfParallelism'),
    publicKey: requireString(source, 'publicKey'),
    encryptedPrivateKey: requireString(source, 'encryptedPrivateKey'),
    privateKeyNonce: requireString(source, 'privateKeyNonce'),
    cryptoVersion: requireInteger(source, 'cryptoVersion'),
    schemaVersion: requireInteger(source, 'schemaVersion'),
  };

  assertSupportedCryptoVersion(bundle.cryptoVersion);

  if (fromBase64Url(bundle.kdfSalt).length !== ARGON2ID_SALT_BYTES) {
    throw new CryptoFormatError('Salt do KDF não tem 16 bytes.');
  }

  if (fromBase64Url(bundle.publicKey).length !== X25519_KEY_BYTES) {
    throw new CryptoFormatError('Chave pública do key bundle não tem 32 bytes.');
  }

  if (fromBase64Url(bundle.privateKeyNonce).length !== AEAD_NONCE_BYTES) {
    throw new CryptoFormatError('Nonce da chave privada não tem 24 bytes.');
  }

  return bundle;
}

/** Parâmetros do Argon2id no formato do adapter, a partir do bundle. */
export function kdfParametersFromBundle(bundle: UserKeyBundle): Argon2idParameters {
  return {
    memoryKib: bundle.kdfMemory,
    iterations: bundle.kdfIterations,
    parallelism: bundle.kdfParallelism,
    salt: bundle.kdfSalt,
  };
}

/**
 * Gera o par do usuário e protege a metade privada.
 *
 * Devolve o par aberto junto do bundle porque o chamador precisa dele em memória
 * logo em seguida — no setup, para criar o primeiro envelope. Quem recebe é
 * responsável por não persistir a metade privada (SECURITY.md secao 15).
 */
export async function createUserKeyBundle(input: {
  aead: AeadAdapter;
  keyExchange: KeyExchangeAdapter;
  random: RandomSource;
  userEncryptionKey: KeyMaterial;
  parameters: Argon2idParameters;
}): Promise<{ bundle: UserKeyBundle; keyPair: KeyPair }> {
  const keyPair = await input.keyExchange.generateKeyPair();
  const publicKey = toBase64Url(keyPair.publicKey);
  const nonce = input.random.getRandomBytes(AEAD_NONCE_BYTES);

  const encryptedPrivateKey = await input.aead.encrypt({
    key: input.userEncryptionKey,
    nonce,
    plaintext: keyPair.privateKey,
    aad: buildAad({
      scope: 'user',
      entityType: 'user-key-bundle',
      publicKey,
      schemaVersion: USER_KEY_BUNDLE_SCHEMA_VERSION,
      cryptoVersion: CURRENT_CRYPTO_VERSION,
    }),
  });

  return {
    keyPair,
    bundle: {
      kdfAlgorithm: KDF_ALGORITHM,
      kdfVersion: KDF_VERSION,
      kdfSalt: input.parameters.salt,
      kdfMemory: input.parameters.memoryKib,
      kdfIterations: input.parameters.iterations,
      kdfParallelism: input.parameters.parallelism,
      publicKey,
      encryptedPrivateKey: toBase64Url(encryptedPrivateKey),
      privateKeyNonce: toBase64Url(nonce),
      cryptoVersion: CURRENT_CRYPTO_VERSION,
      schemaVersion: USER_KEY_BUNDLE_SCHEMA_VERSION,
    },
  };
}

/**
 * Abre o bundle e devolve o par do usuário.
 *
 * Falha fechado: senha errada, ciphertext adulterado ou `publicKey` trocada
 * lançam `CryptoAuthenticationError` vindo do adapter, sem devolver nada parcial.
 */
export async function openUserKeyBundle(input: {
  aead: AeadAdapter;
  userEncryptionKey: KeyMaterial;
  bundle: UserKeyBundle;
}): Promise<KeyPair> {
  const bundle = parseUserKeyBundle(input.bundle);

  const privateKey = await input.aead.decrypt({
    key: input.userEncryptionKey,
    nonce: fromBase64Url(bundle.privateKeyNonce),
    ciphertext: fromBase64Url(bundle.encryptedPrivateKey),
    aad: buildAad({
      scope: 'user',
      entityType: 'user-key-bundle',
      publicKey: bundle.publicKey,
      schemaVersion: bundle.schemaVersion,
      cryptoVersion: bundle.cryptoVersion,
    }),
  });

  if (privateKey.length !== X25519_KEY_BYTES) {
    throw new CryptoFormatError('Chave privada aberta não tem 32 bytes.');
  }

  return { publicKey: fromBase64Url(bundle.publicKey), privateKey };
}
