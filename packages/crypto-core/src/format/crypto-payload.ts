import { toBase64Url } from '../encoding/base64url';
import { CryptoAlgorithmError, CryptoFormatError, CryptoVersionError } from '../errors';

/**
 * Formato de payload criptografado (ARCHITECTURE.md secoes 14.8 e 14.10).
 *
 * Todo conteúdo protegido trafega e é persistido nesta forma. `cryptoVersion`
 * identifica o conjunto de algoritmos; `schemaVersion` identifica a forma do
 * objeto em texto claro que existe apenas dentro do cliente.
 *
 * Mudar qualquer um dos dois exige nova versão explícita, leitor da versão
 * anterior e migração — nunca substituição silenciosa (CLAUDE.md secao 9).
 */

/** Versão criptográfica corrente. */
export const CURRENT_CRYPTO_VERSION = 1 as const;

/** Versões que este cliente ainda consegue ler. */
export const SUPPORTED_CRYPTO_VERSIONS: readonly number[] = [1];

/** AEAD definida em ARCHITECTURE.md secao 3.6. */
export const AEAD_ALGORITHM = 'XCHACHA20-POLY1305' as const;

export type AeadAlgorithm = typeof AEAD_ALGORITHM;

/**
 * Tamanho do nonce da XChaCha20-Poly1305, em bytes.
 *
 * Os 24 bytes são o que torna seguro sortear o nonce em vez de contar: o espaço
 * é grande o bastante para que a colisão seja desprezível (SECURITY.md secao 17).
 */
export const AEAD_NONCE_BYTES = 24;

export type CipherPayload = {
  cryptoVersion: number;
  schemaVersion: number;
  algorithm: AeadAlgorithm;
  /** Nonce em base64url, sem padding. Nunca reutilizado com a mesma chave. */
  nonce: string;
  /** Ciphertext com tag de autenticação, em base64url sem padding. */
  ciphertext: string;
};

function requireString(source: Record<string, unknown>, field: string): string {
  const value = source[field];

  if (typeof value !== 'string' || value.length === 0) {
    throw new CryptoFormatError(`Campo "${field}" ausente ou inválido no payload criptografado.`);
  }

  return value;
}

function requireInteger(source: Record<string, unknown>, field: string): number {
  const value = source[field];

  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    throw new CryptoFormatError(`Campo "${field}" ausente ou inválido no payload criptografado.`);
  }

  return value;
}

/**
 * Valida um payload vindo da API ou do banco.
 *
 * A API armazena blobs opacos e não valida conteúdo; a checagem estrutural é
 * responsabilidade do cliente, antes de qualquer tentativa de decrypt.
 */
export function parseCipherPayload(value: unknown): CipherPayload {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new CryptoFormatError('Payload criptografado deve ser um objeto.');
  }

  const source: Record<string, unknown> = { ...value };

  const cryptoVersion = requireInteger(source, 'cryptoVersion');
  const schemaVersion = requireInteger(source, 'schemaVersion');
  const algorithm = requireString(source, 'algorithm');
  const nonce = requireString(source, 'nonce');
  const ciphertext = requireString(source, 'ciphertext');

  assertSupportedCryptoVersion(cryptoVersion);

  if (algorithm !== AEAD_ALGORITHM) {
    throw new CryptoAlgorithmError('Algoritmo não suportado por este cliente.');
  }

  return { cryptoVersion, schemaVersion, algorithm, nonce, ciphertext };
}

/**
 * Monta um payload a partir do que a AEAD acabou de produzir.
 *
 * Existe para que `cryptoVersion` e `algorithm` não sejam escritos à mão em
 * cada chamador: um deles divergir do que a AEAD realmente usou produziria um
 * payload que só falha na hora de abrir, possivelmente em outro dispositivo.
 */
export function buildCipherPayload(input: {
  schemaVersion: number;
  nonce: Uint8Array;
  ciphertext: Uint8Array;
}): CipherPayload {
  if (!Number.isInteger(input.schemaVersion) || input.schemaVersion < 1) {
    throw new CryptoFormatError('`schemaVersion` deve ser um inteiro positivo.');
  }

  if (input.nonce.length === 0 || input.ciphertext.length === 0) {
    throw new CryptoFormatError('Nonce e ciphertext não podem ser vazios.');
  }

  return {
    cryptoVersion: CURRENT_CRYPTO_VERSION,
    schemaVersion: input.schemaVersion,
    algorithm: AEAD_ALGORITHM,
    nonce: toBase64Url(input.nonce),
    ciphertext: toBase64Url(input.ciphertext),
  };
}

/**
 * Rejeita versões desconhecidas antes de decrypt.
 *
 * Um cliente antigo diante de uma versão futura precisa parar e pedir
 * atualização, jamais tentar interpretar os bytes.
 */
export function assertSupportedCryptoVersion(cryptoVersion: number): void {
  if (!SUPPORTED_CRYPTO_VERSIONS.includes(cryptoVersion)) {
    throw new CryptoVersionError(
      `Versão criptográfica ${String(cryptoVersion)} não é suportada por este cliente.`,
    );
  }
}
