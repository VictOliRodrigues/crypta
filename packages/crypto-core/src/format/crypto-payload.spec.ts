import { describe, expect, it } from 'vitest';

import { CryptoAlgorithmError, CryptoFormatError, CryptoVersionError } from '../errors';
import { assertSupportedCryptoVersion, parseCipherPayload } from './crypto-payload';

const VALID_PAYLOAD = {
  cryptoVersion: 1,
  schemaVersion: 1,
  algorithm: 'XCHACHA20-POLY1305',
  nonce: 'bm9uY2UtYmFzZTY0dXJs',
  ciphertext: 'Y2lwaGVydGV4dC1iYXNlNjR1cmw',
};

describe('parseCipherPayload', () => {
  it('accepts a well formed payload', () => {
    expect(parseCipherPayload(VALID_PAYLOAD)).toEqual(VALID_PAYLOAD);
  });

  it('rejects a payload that is not an object', () => {
    expect(() => parseCipherPayload('ciphertext')).toThrow(CryptoFormatError);
    expect(() => parseCipherPayload(null)).toThrow(CryptoFormatError);
    expect(() => parseCipherPayload([VALID_PAYLOAD])).toThrow(CryptoFormatError);
  });

  it.each(['cryptoVersion', 'schemaVersion', 'algorithm', 'nonce', 'ciphertext'])(
    'rejects a payload missing %s',
    (field) => {
      const payload: Record<string, unknown> = { ...VALID_PAYLOAD };
      delete payload[field];

      expect(() => parseCipherPayload(payload)).toThrow(CryptoFormatError);
    },
  );

  it('rejects an empty nonce', () => {
    expect(() => parseCipherPayload({ ...VALID_PAYLOAD, nonce: '' })).toThrow(CryptoFormatError);
  });

  it('rejects an unknown algorithm instead of attempting to decrypt', () => {
    expect(() => parseCipherPayload({ ...VALID_PAYLOAD, algorithm: 'AES-256-GCM' })).toThrow(
      CryptoAlgorithmError,
    );
  });

  it('rejects a future crypto version', () => {
    expect(() => parseCipherPayload({ ...VALID_PAYLOAD, cryptoVersion: 2 })).toThrow(
      CryptoVersionError,
    );
  });

  it('rejects a non-integer version', () => {
    expect(() => parseCipherPayload({ ...VALID_PAYLOAD, schemaVersion: 1.2 })).toThrow(
      CryptoFormatError,
    );
  });
});

describe('assertSupportedCryptoVersion', () => {
  it('accepts the current version', () => {
    expect(() => assertSupportedCryptoVersion(1)).not.toThrow();
  });

  it('fails closed for an unknown version', () => {
    expect(() => assertSupportedCryptoVersion(99)).toThrow(CryptoVersionError);
  });
});
