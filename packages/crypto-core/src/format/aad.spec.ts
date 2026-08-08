import { describe, expect, it } from 'vitest';

import { CryptoFormatError } from '../errors';
import { type AadContext, buildAad, serializeAad } from './aad';

const VAULT_CONTEXT = {
  scope: 'vault',
  entityType: 'credential',
  entityId: '018f0000-0000-7000-8000-000000000002',
  vaultId: '018f0000-0000-7000-8000-000000000001',
  schemaVersion: 1,
  cryptoVersion: 1,
} as const;

/** Chave pública fictícia, 32 bytes de 0x01 em base64url. */
const USER_CONTEXT = {
  scope: 'user',
  entityType: 'user-key-bundle',
  publicKey: 'AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE',
  schemaVersion: 1,
  cryptoVersion: 1,
} as const;

describe('serializeAad no escopo vault', () => {
  it('produces the exact canonical string for a fixed context', () => {
    expect(serializeAad(VAULT_CONTEXT)).toBe(
      'crypta-aad/v2|5:vault|10:credential|36:018f0000-0000-7000-8000-000000000002|36:018f0000-0000-7000-8000-000000000001|1:1|1:1',
    );
  });

  it('is deterministic across calls', () => {
    expect(serializeAad(VAULT_CONTEXT)).toBe(serializeAad({ ...VAULT_CONTEXT }));
  });

  it('changes when the entity changes, so a ciphertext cannot be moved between records', () => {
    const other = serializeAad({ ...VAULT_CONTEXT, entityId: 'other-credential-id' });

    expect(other).not.toBe(serializeAad(VAULT_CONTEXT));
  });

  it('changes when the vault changes, so a ciphertext cannot be moved between vaults', () => {
    const other = serializeAad({ ...VAULT_CONTEXT, vaultId: 'other-vault-id' });

    expect(other).not.toBe(serializeAad(VAULT_CONTEXT));
  });

  it('changes when the schema version changes', () => {
    expect(serializeAad({ ...VAULT_CONTEXT, schemaVersion: 2 })).not.toBe(
      serializeAad(VAULT_CONTEXT),
    );
  });

  it('is injective even when an identifier contains the field separator', () => {
    const first = serializeAad({ ...VAULT_CONTEXT, entityId: 'a|b', vaultId: 'c' });
    const second = serializeAad({ ...VAULT_CONTEXT, entityId: 'a', vaultId: 'b|c' });

    expect(first).not.toBe(second);
  });

  it('rejects an empty entityId', () => {
    expect(() => serializeAad({ ...VAULT_CONTEXT, entityId: '' })).toThrow(CryptoFormatError);
  });

  it('rejects an empty vaultId', () => {
    expect(() => serializeAad({ ...VAULT_CONTEXT, vaultId: '' })).toThrow(CryptoFormatError);
  });

  it('rejects a non-integer schemaVersion', () => {
    expect(() => serializeAad({ ...VAULT_CONTEXT, schemaVersion: 1.5 })).toThrow(CryptoFormatError);
  });

  it('rejects a zero cryptoVersion', () => {
    expect(() => serializeAad({ ...VAULT_CONTEXT, cryptoVersion: 0 })).toThrow(CryptoFormatError);
  });

  it('rejects an unknown entity type', () => {
    const context = { ...VAULT_CONTEXT, entityType: 'session' } as unknown as AadContext;

    expect(() => serializeAad(context)).toThrow(CryptoFormatError);
  });
});

describe('serializeAad no escopo user', () => {
  it('produces the exact canonical string for a fixed context', () => {
    expect(serializeAad(USER_CONTEXT)).toBe(
      'crypta-aad/v2|4:user|15:user-key-bundle|43:AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE|1:1|1:1',
    );
  });

  it('carries no vault segment, so identity material has no empty field to fill', () => {
    const segments = serializeAad(USER_CONTEXT).split('|');
    const vaultSegments = serializeAad(VAULT_CONTEXT).split('|');

    expect(segments).toHaveLength(6);
    expect(vaultSegments).toHaveLength(7);
  });

  it('changes when the public key changes, so a bundle cannot be paired with another key', () => {
    const other = serializeAad({ ...USER_CONTEXT, publicKey: 'AgICAgICAgICAgICAgICAgICAgI' });

    expect(other).not.toBe(serializeAad(USER_CONTEXT));
  });

  it('rejects an empty publicKey', () => {
    expect(() => serializeAad({ ...USER_CONTEXT, publicKey: '' })).toThrow(CryptoFormatError);
  });

  it('rejects an unknown entity type', () => {
    const context = { ...USER_CONTEXT, entityType: 'vault' } as unknown as AadContext;

    expect(() => serializeAad(context)).toThrow(CryptoFormatError);
  });
});

describe('serializeAad entre escopos', () => {
  it('rejects an unknown scope', () => {
    const context = { ...VAULT_CONTEXT, scope: 'session' } as unknown as AadContext;

    expect(() => serializeAad(context)).toThrow(CryptoFormatError);
  });

  it('never collides between scopes, because the scope is the first segment', () => {
    const collidingUser = serializeAad({
      ...USER_CONTEXT,
      publicKey: VAULT_CONTEXT.entityId,
    });

    expect(collidingUser).not.toBe(serializeAad(VAULT_CONTEXT));
  });
});

describe('buildAad', () => {
  it('returns the UTF-8 bytes of the canonical string', () => {
    const bytes = buildAad(VAULT_CONTEXT);

    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBe(serializeAad(VAULT_CONTEXT).length);
  });

  it('differs between scopes for the same versions', () => {
    expect(buildAad(USER_CONTEXT)).not.toEqual(buildAad(VAULT_CONTEXT));
  });
});
