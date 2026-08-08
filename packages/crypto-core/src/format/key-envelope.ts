import { fromBase64Url, toBase64Url } from '../encoding/base64url';
import { CryptoAlgorithmError, CryptoFormatError } from '../errors';
import { assertSupportedCryptoVersion, CURRENT_CRYPTO_VERSION } from './crypto-payload';

/**
 * Formato do envelope da `VaultKey` (docs/API.md secao 15, ADR 0023).
 *
 * O envelope é o que entrega a `VaultKey` a um membro: ela é protegida para a
 * chave pública dele e só a privada correspondente a recupera (ADR 0005).
 *
 * O adapter de plataforma devolve um blob opaco `ephemeralPublicKey || ciphertext`.
 * Este módulo é o único lugar que conhece esse enquadramento — ele existe para
 * que a fatia não seja reescrita em cada chamador, que foi como a implementação
 * e a `API.md` divergiram antes do ADR 0023.
 */

/**
 * Composição real do envelope: X25519 efêmero, HKDF-SHA-256 e XChaCha20-Poly1305,
 * no formato do RFC 9180.
 *
 * O nome anterior na `API.md`, `X25519-XCHACHA20-POLY1305`, omitia o HKDF e
 * descrevia uma construção que não é a implementada. Sealed box do libsodium
 * está proibido pelo ADR 0017: o `seal_open` falha aberto.
 */
export const KEY_ENVELOPE_ALGORITHM = 'X25519-HKDF-SHA256-XCHACHA20-POLY1305' as const;

export type KeyEnvelopeAlgorithm = typeof KEY_ENVELOPE_ALGORITHM;

/** Tamanho de uma chave pública X25519 crua. */
const X25519_PUBLIC_KEY_BYTES = 32;

/**
 * Tamanho mínimo do blob selado: chave pública efêmera mais a tag Poly1305.
 *
 * Um envelope de `VaultKey` real tem 32 bytes de chave, mas o piso aqui é
 * estrutural — abaixo dele o blob não contém nem enquadramento nem tag.
 */
const POLY1305_TAG_BYTES = 16;

/**
 * O nonce **não** faz parte do envelope.
 *
 * Ele é derivado junto com a chave da AEAD, a partir do segredo compartilhado e
 * das duas chaves públicas. Como o par efêmero é novo a cada envelope, a chave
 * da AEAD nunca se repete e o nonce derivado tampouco — transmiti-lo criaria
 * uma segunda fonte de verdade capaz de discordar da primeira.
 */
export type KeyEnvelope = {
  keyVersion: number;
  cryptoVersion: number;
  algorithm: KeyEnvelopeAlgorithm;
  /** Chave pública X25519 efêmera, em base64url sem padding. Uma por envelope. */
  ephemeralPublicKey: string;
  /** `VaultKey` cifrada, com a tag de autenticação, em base64url sem padding. */
  encryptedVaultKey: string;
};

function requireString(source: Record<string, unknown>, field: string): string {
  const value = source[field];

  if (typeof value !== 'string' || value.length === 0) {
    throw new CryptoFormatError(`Campo "${field}" ausente ou inválido no envelope de chave.`);
  }

  return value;
}

function requireInteger(source: Record<string, unknown>, field: string): number {
  const value = source[field];

  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    throw new CryptoFormatError(`Campo "${field}" ausente ou inválido no envelope de chave.`);
  }

  return value;
}

/**
 * Valida um envelope vindo da API ou do banco.
 *
 * A API guarda o envelope como blob opaco e não o interpreta; a checagem
 * estrutural é do cliente, antes de qualquer tentativa de abertura.
 */
export function parseKeyEnvelope(value: unknown): KeyEnvelope {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new CryptoFormatError('Envelope de chave deve ser um objeto.');
  }

  const source: Record<string, unknown> = { ...value };

  const keyVersion = requireInteger(source, 'keyVersion');
  const cryptoVersion = requireInteger(source, 'cryptoVersion');
  const algorithm = requireString(source, 'algorithm');
  const ephemeralPublicKey = requireString(source, 'ephemeralPublicKey');
  const encryptedVaultKey = requireString(source, 'encryptedVaultKey');

  assertSupportedCryptoVersion(cryptoVersion);

  if (algorithm !== KEY_ENVELOPE_ALGORITHM) {
    throw new CryptoAlgorithmError('Algoritmo de envelope não suportado por este cliente.');
  }

  if (fromBase64Url(ephemeralPublicKey).length !== X25519_PUBLIC_KEY_BYTES) {
    throw new CryptoFormatError('Chave pública efêmera do envelope não tem 32 bytes.');
  }

  if (fromBase64Url(encryptedVaultKey).length <= POLY1305_TAG_BYTES) {
    throw new CryptoFormatError('Envelope de chave curto demais para conter tag de autenticação.');
  }

  return { keyVersion, cryptoVersion, algorithm, ephemeralPublicKey, encryptedVaultKey };
}

/**
 * Enquadra o blob devolvido por `KeyExchangeAdapter.sealForPublicKey`.
 *
 * O adapter devolve `ephemeralPublicKey || ciphertext`; aqui a fatia vira os
 * campos que `docs/API.md` secao 15 documenta.
 */
export function buildKeyEnvelope(input: { keyVersion: number; sealed: Uint8Array }): KeyEnvelope {
  if (!Number.isInteger(input.keyVersion) || input.keyVersion < 1) {
    throw new CryptoFormatError('`keyVersion` do envelope deve ser um inteiro positivo.');
  }

  if (input.sealed.length <= X25519_PUBLIC_KEY_BYTES + POLY1305_TAG_BYTES) {
    throw new CryptoFormatError('Blob selado curto demais para formar um envelope.');
  }

  return {
    keyVersion: input.keyVersion,
    cryptoVersion: CURRENT_CRYPTO_VERSION,
    algorithm: KEY_ENVELOPE_ALGORITHM,
    ephemeralPublicKey: toBase64Url(input.sealed.subarray(0, X25519_PUBLIC_KEY_BYTES)),
    encryptedVaultKey: toBase64Url(input.sealed.subarray(X25519_PUBLIC_KEY_BYTES)),
  };
}

/**
 * Recompõe o blob que `KeyExchangeAdapter.openWithPrivateKey` espera.
 *
 * Inverso exato de `buildKeyEnvelope`. Recebe o envelope já validado para que a
 * checagem estrutural não seja pulada por um chamador apressado.
 */
export function sealedBytesFromEnvelope(envelope: KeyEnvelope): Uint8Array {
  const ephemeralPublicKey = fromBase64Url(envelope.ephemeralPublicKey);
  const encryptedVaultKey = fromBase64Url(envelope.encryptedVaultKey);

  const sealed = new Uint8Array(ephemeralPublicKey.length + encryptedVaultKey.length);
  sealed.set(ephemeralPublicKey, 0);
  sealed.set(encryptedVaultKey, ephemeralPublicKey.length);

  return sealed;
}
