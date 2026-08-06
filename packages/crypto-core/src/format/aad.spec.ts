import { describe, expect, it } from 'vitest';

import { CryptoFormatError } from '../errors';
import { buildAad, serializeAad } from './aad';

const BASE_CONTEXT = {
  entityType: 'credential',
  entityId: '018f0000-0000-7000-8000-000000000002',
  vaultId: '018f0000-0000-7000-8000-000000000001',
  schemaVersion: 1,
  cryptoVersion: 1,
} as const;

describe('serializeAad', () => {
  it('produces the exact canonical string for a fixed context', () => {
    expect(serializeAad(BASE_CONTEXT)).toBe(
      'vault-aad/v1|10:credential|36:018f0000-0000-7000-8000-000000000002|36:018f0000-0000-7000-8000-000000000001|1:1|1:1',
    );
  });

  it('is deterministic across calls', () => {
    expect(serializeAad(BASE_CONTEXT)).toBe(serializeAad({ ...BASE_CONTEXT }));
  });

  it('changes when the entity changes, so a ciphertext cannot be moved between records', () => {
    const other = serializeAad({ ...BASE_CONTEXT, entityId: 'other-credential-id' });

    expect(other).not.toBe(serializeAad(BASE_CONTEXT));
  });

  it('changes when the vault changes, so a ciphertext cannot be moved between vaults', () => {
    const other = serializeAad({ ...BASE_CONTEXT, vaultId: 'other-vault-id' });

    expect(other).not.toBe(serializeAad(BASE_CONTEXT));
  });

  it('changes when the schema version changes', () => {
    expect(serializeAad({ ...BASE_CONTEXT, schemaVersion: 2 })).not.toBe(
      serializeAad(BASE_CONTEXT),
    );
  });

  it('is injective even when an identifier contains the field separator', () => {
    const first = serializeAad({ ...BASE_CONTEXT, entityId: 'a|b', vaultId: 'c' });
    const second = serializeAad({ ...BASE_CONTEXT, entityId: 'a', vaultId: 'b|c' });

    expect(first).not.toBe(second);
  });

  it('rejects an empty entityId', () => {
    expect(() => serializeAad({ ...BASE_CONTEXT, entityId: '' })).toThrow(CryptoFormatError);
  });

  it('rejects a non-integer schemaVersion', () => {
    expect(() => serializeAad({ ...BASE_CONTEXT, schemaVersion: 1.5 })).toThrow(CryptoFormatError);
  });

  it('rejects a zero cryptoVersion', () => {
    expect(() => serializeAad({ ...BASE_CONTEXT, cryptoVersion: 0 })).toThrow(CryptoFormatError);
  });
});

describe('buildAad', () => {
  it('returns the UTF-8 bytes of the canonical string', () => {
    const bytes = buildAad(BASE_CONTEXT);

    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBe(serializeAad(BASE_CONTEXT).length);
  });
});
