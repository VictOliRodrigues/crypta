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
