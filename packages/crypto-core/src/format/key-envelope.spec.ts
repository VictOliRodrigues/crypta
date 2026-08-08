import { describe, expect, it } from 'vitest';

import { toBase64Url } from '../encoding/base64url';
import { CryptoAlgorithmError, CryptoFormatError, CryptoVersionError } from '../errors';
import {
  buildKeyEnvelope,
  KEY_ENVELOPE_ALGORITHM,
  parseKeyEnvelope,
  sealedBytesFromEnvelope,
} from './key-envelope';

/** Blob no formato que `sealForPublicKey` devolve: 32 bytes de chave, depois o ciphertext. */
function sealedBlob(ciphertextLength: number): Uint8Array {
  const sealed = new Uint8Array(32 + ciphertextLength);

  for (let index = 0; index < sealed.length; index += 1) {
    sealed[index] = index % 251;
  }

  return sealed;
}

const SEALED = sealedBlob(48);
const ENVELOPE = buildKeyEnvelope({ keyVersion: 1, sealed: SEALED });

describe('buildKeyEnvelope', () => {
  it('splits the sealed blob into the fields docs/API.md secao 15 documents', () => {
    expect(ENVELOPE.algorithm).toBe(KEY_ENVELOPE_ALGORITHM);
    expect(ENVELOPE.cryptoVersion).toBe(1);
    expect(ENVELOPE.keyVersion).toBe(1);
    expect(ENVELOPE.ephemeralPublicKey).toBe(toBase64Url(SEALED.subarray(0, 32)));
    expect(ENVELOPE.encryptedVaultKey).toBe(toBase64Url(SEALED.subarray(32)));
  });

  it('carries no nonce field, because the nonce is derived and never travels', () => {
    expect(ENVELOPE).not.toHaveProperty('nonce');
  });

  it('rejects a blob too short to hold a key and a tag', () => {
    expect(() => buildKeyEnvelope({ keyVersion: 1, sealed: sealedBlob(16) })).toThrow(
      CryptoFormatError,
    );
  });

  it('rejects a non-positive keyVersion', () => {
    expect(() => buildKeyEnvelope({ keyVersion: 0, sealed: SEALED })).toThrow(CryptoFormatError);
  });
});

describe('sealedBytesFromEnvelope', () => {
  it('is the exact inverse of buildKeyEnvelope', () => {
    expect(sealedBytesFromEnvelope(ENVELOPE)).toEqual(SEALED);
  });
});

describe('parseKeyEnvelope', () => {
  it('accepts a well-formed envelope', () => {
    expect(parseKeyEnvelope({ ...ENVELOPE })).toEqual(ENVELOPE);
  });

  it('rejects a non-object', () => {
    expect(() => parseKeyEnvelope('envelope')).toThrow(CryptoFormatError);
    expect(() => parseKeyEnvelope(null)).toThrow(CryptoFormatError);
    expect(() => parseKeyEnvelope([ENVELOPE])).toThrow(CryptoFormatError);
  });

  it.each(['keyVersion', 'cryptoVersion', 'algorithm', 'ephemeralPublicKey', 'encryptedVaultKey'])(
    'rejects an envelope missing %s',
    (field) => {
      const incomplete: Record<string, unknown> = { ...ENVELOPE };
      delete incomplete[field];

      expect(() => parseKeyEnvelope(incomplete)).toThrow(CryptoFormatError);
    },
  );

  it('rejects the algorithm name that docs/API.md carried before the ADR 0023', () => {
    expect(() => parseKeyEnvelope({ ...ENVELOPE, algorithm: 'X25519-XCHACHA20-POLY1305' })).toThrow(
      CryptoAlgorithmError,
    );
  });

  it('rejects an unsupported cryptoVersion', () => {
    expect(() => parseKeyEnvelope({ ...ENVELOPE, cryptoVersion: 2 })).toThrow(CryptoVersionError);
  });

  it('rejects an ephemeral public key that is not 32 bytes', () => {
    expect(() =>
      parseKeyEnvelope({ ...ENVELOPE, ephemeralPublicKey: toBase64Url(new Uint8Array(31)) }),
    ).toThrow(CryptoFormatError);
  });

  it('rejects a payload too short to carry an authentication tag', () => {
    expect(() =>
      parseKeyEnvelope({ ...ENVELOPE, encryptedVaultKey: toBase64Url(new Uint8Array(16)) }),
    ).toThrow(CryptoFormatError);
  });
});
