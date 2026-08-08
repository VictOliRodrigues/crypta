import { describe, expect, it } from 'vitest';

import {
  type AeadAdapter,
  type Argon2idParameters,
  type KeyExchangeAdapter,
  type RandomSource,
} from '../adapters/crypto-adapters';
import { fromBase64Url, toBase64Url } from '../encoding/base64url';
import { CryptoFormatError, CryptoVersionError } from '../errors';
import { serializeAad } from '../format/aad';
import { AEAD_NONCE_BYTES } from '../format/crypto-payload';
import {
  createUserKeyBundle,
  KDF_ALGORITHM,
  kdfParametersFromBundle,
  openUserKeyBundle,
  parseUserKeyBundle,
  USER_KEY_BUNDLE_SCHEMA_VERSION,
} from './user-key-bundle';

/**
 * Adapters de registro, não de criptografia.
 *
 * O que se prova aqui é qual AAD foi construída, de onde veio o nonce e o que a
 * validação recusa. A corretude das primitivas — e a falha diante de ciphertext
 * adulterado — é provada em `@crypta/crypto-web`, contra `@noble/*`.
 */
const PUBLIC_KEY = new Uint8Array(32).fill(0xaa);
const PRIVATE_KEY = new Uint8Array(32).fill(0xbb);

function stubs(): {
  aead: AeadAdapter;
  keyExchange: KeyExchangeAdapter;
  random: RandomSource;
  aadSeen: string[];
} {
  const aadSeen: string[] = [];
  const decoder = new TextDecoder();

  const aead: AeadAdapter = {
    encrypt({ plaintext, aad }) {
      aadSeen.push(decoder.decode(aad));

      // XOR com 0xff: reversível, e diferente do plaintext, para que um retorno
      // acidental do plaintext não passe despercebido.
      return Promise.resolve(plaintext.map((byte) => byte ^ 0xff));
    },
    decrypt({ ciphertext, aad }) {
      aadSeen.push(decoder.decode(aad));

      return Promise.resolve(ciphertext.map((byte) => byte ^ 0xff));
    },
  };

  const keyExchange: KeyExchangeAdapter = {
    generateKeyPair: () => Promise.resolve({ publicKey: PUBLIC_KEY, privateKey: PRIVATE_KEY }),
    sealForPublicKey: () => Promise.reject(new Error('não usado')),
    openWithPrivateKey: () => Promise.reject(new Error('não usado')),
  };

  const random: RandomSource = {
    getRandomBytes: (length) => new Uint8Array(length).fill(0x7f),
  };

  return { aead, keyExchange, random, aadSeen };
}

const PARAMETERS: Argon2idParameters = {
  memoryKib: 65536,
  iterations: 3,
  parallelism: 1,
  salt: toBase64Url(new Uint8Array(16).fill(0x01)),
};

const USER_ENCRYPTION_KEY = new Uint8Array(32).fill(0xcc);

async function createBundle() {
  const { aead, keyExchange, random, aadSeen } = stubs();

  const created = await createUserKeyBundle({
    aead,
    keyExchange,
    random,
    userEncryptionKey: USER_ENCRYPTION_KEY,
    parameters: PARAMETERS,
  });

  return { ...created, aead, aadSeen };
}

describe('createUserKeyBundle', () => {
  it('produces the shape docs/API.md secao 20 declares', async () => {
    const { bundle } = await createBundle();

    expect(bundle).toEqual({
      kdfAlgorithm: KDF_ALGORITHM,
      kdfVersion: 1,
      kdfSalt: PARAMETERS.salt,
      kdfMemory: 65536,
      kdfIterations: 3,
      kdfParallelism: 1,
      publicKey: toBase64Url(PUBLIC_KEY),
      encryptedPrivateKey: toBase64Url(PRIVATE_KEY.map((byte) => byte ^ 0xff)),
      privateKeyNonce: toBase64Url(new Uint8Array(AEAD_NONCE_BYTES).fill(0x7f)),
      cryptoVersion: 1,
      schemaVersion: USER_KEY_BUNDLE_SCHEMA_VERSION,
    });
  });

  it('binds the ciphertext to its own public key, under the user scope', async () => {
    const { aadSeen } = await createBundle();

    expect(aadSeen).toEqual([
      serializeAad({
        scope: 'user',
        entityType: 'user-key-bundle',
        publicKey: toBase64Url(PUBLIC_KEY),
        schemaVersion: USER_KEY_BUNDLE_SCHEMA_VERSION,
        cryptoVersion: 1,
      }),
    ]);
  });

  it('takes the nonce from the platform CSPRNG, at the size the AEAD requires', async () => {
    const { bundle } = await createBundle();

    expect(fromBase64Url(bundle.privateKeyNonce)).toHaveLength(AEAD_NONCE_BYTES);
  });

  it('never puts the private key in the bundle in the clear', async () => {
    const { bundle } = await createBundle();

    expect(fromBase64Url(bundle.encryptedPrivateKey)).not.toEqual(PRIVATE_KEY);
    expect(JSON.stringify(bundle)).not.toContain(toBase64Url(PRIVATE_KEY));
  });
});

describe('openUserKeyBundle', () => {
  it('round-trips the key pair', async () => {
    const { bundle, aead } = await createBundle();

    const keyPair = await openUserKeyBundle({
      aead,
      userEncryptionKey: USER_ENCRYPTION_KEY,
      bundle,
    });

    expect(keyPair.privateKey).toEqual(PRIVATE_KEY);
    expect(keyPair.publicKey).toEqual(PUBLIC_KEY);
  });

  it('rebuilds the same AAD it encrypted with', async () => {
    const { bundle, aead, aadSeen } = await createBundle();

    await openUserKeyBundle({ aead, userEncryptionKey: USER_ENCRYPTION_KEY, bundle });

    expect(aadSeen).toHaveLength(2);
    expect(aadSeen[0]).toBe(aadSeen[1]);
  });

  it('validates the bundle before attempting to decrypt', async () => {
    const { bundle, aead } = await createBundle();

    await expect(
      openUserKeyBundle({
        aead,
        userEncryptionKey: USER_ENCRYPTION_KEY,
        bundle: { ...bundle, cryptoVersion: 2 },
      }),
    ).rejects.toThrow(CryptoVersionError);
  });
});

describe('parseUserKeyBundle', () => {
  it('rejects a non-object', async () => {
    const { bundle } = await createBundle();

    expect(() => parseUserKeyBundle('bundle')).toThrow(CryptoFormatError);
    expect(() => parseUserKeyBundle([bundle])).toThrow(CryptoFormatError);
  });

  it.each([
    'kdfAlgorithm',
    'kdfVersion',
    'kdfSalt',
    'kdfMemory',
    'kdfIterations',
    'kdfParallelism',
    'publicKey',
    'encryptedPrivateKey',
    'privateKeyNonce',
    'cryptoVersion',
    'schemaVersion',
  ])('rejects a bundle missing %s', async (field) => {
    const { bundle } = await createBundle();
    const incomplete: Record<string, unknown> = { ...bundle };
    delete incomplete[field];

    expect(() => parseUserKeyBundle(incomplete)).toThrow(CryptoFormatError);
  });

  it('rejects an unknown KDF algorithm', async () => {
    const { bundle } = await createBundle();

    expect(() => parseUserKeyBundle({ ...bundle, kdfAlgorithm: 'PBKDF2' })).toThrow(
      CryptoFormatError,
    );
  });

  it('rejects a salt that is not 16 bytes, which libsodium would refuse later', async () => {
    const { bundle } = await createBundle();

    expect(() =>
      parseUserKeyBundle({ ...bundle, kdfSalt: toBase64Url(new Uint8Array(32)) }),
    ).toThrow(CryptoFormatError);
  });

  it('rejects a public key that is not 32 bytes', async () => {
    const { bundle } = await createBundle();

    expect(() =>
      parseUserKeyBundle({ ...bundle, publicKey: toBase64Url(new Uint8Array(16)) }),
    ).toThrow(CryptoFormatError);
  });

  it('rejects a nonce of the wrong size', async () => {
    const { bundle } = await createBundle();

    expect(() =>
      parseUserKeyBundle({ ...bundle, privateKeyNonce: toBase64Url(new Uint8Array(12)) }),
    ).toThrow(CryptoFormatError);
  });
});

describe('kdfParametersFromBundle', () => {
  it('maps the wire fields back to the adapter shape', async () => {
    const { bundle } = await createBundle();

    expect(kdfParametersFromBundle(bundle)).toEqual(PARAMETERS);
  });
});
