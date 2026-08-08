/**
 * Vetores determinísticos e conferência cruzada.
 *
 * O oráculo é o `@noble/*`, uma implementação independente e em JavaScript
 * puro, presente apenas em `devDependencies` (ADR 0017). Ele existe para
 * detectar uma mudança silenciosa de saída do libsodium entre versões — o
 * risco de manutenção que o ADR 0016 registra.
 */

import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { x25519 } from '@noble/curves/ed25519.js';
import { argon2id } from '@noble/hashes/argon2.js';
import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { describe, expect, it } from 'vitest';

import { CryptoAuthenticationError } from '@crypta/crypto-core';

import { webAeadAdapter } from './aead';
import { webKdfAdapter } from './kdf';
import { webKeyExchangeAdapter } from './key-exchange';
import { initSodium } from './sodium';
import { ARGON2ID_KAT, ARGON2ID_PRODUCTION_VECTOR, WASM2JS_PROBE } from './vectors';

/** Confere que a promise rejeitou com falha de autenticação, sem recorrer a `any`. */
async function expectAuthenticationFailure(promise: Promise<unknown>): Promise<void> {
  const error: unknown = await promise.then(
    () => undefined,
    (caught: unknown) => caught,
  );

  expect(error).toBeInstanceOf(CryptoAuthenticationError);
  expect((error as CryptoAuthenticationError).code).toBe('CRYPTO_AUTHENTICATION_FAILED');
}

/** Copia os bytes invertendo um deles. `noUncheckedIndexedAccess` proíbe o acesso direto. */
function flipByte(bytes: Uint8Array, index: number): Uint8Array {
  const copy = Uint8Array.from(bytes);
  copy.set([(copy.at(index) ?? 0) ^ 0xff], index);

  return copy;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

describe('vetores de Argon2id', () => {
  it.each([ARGON2ID_KAT, ARGON2ID_PRODUCTION_VECTOR, WASM2JS_PROBE])(
    'o libsodium reproduz $name',
    async (vector) => {
      const sodium = await initSodium();

      const derived = sodium.crypto_pwhash(
        vector.outputBytes,
        vector.password,
        vector.salt,
        vector.iterations,
        vector.memoryKib * 1024,
        sodium.crypto_pwhash_ALG_ARGON2ID13,
      );

      expect(toHex(derived)).toBe(vector.expectedHex);
    },
    60_000,
  );

  it.each([ARGON2ID_KAT, ARGON2ID_PRODUCTION_VECTOR, WASM2JS_PROBE])(
    '@noble/hashes concorda em $name',
    (vector) => {
      const derived = argon2id(vector.password, vector.salt, {
        m: vector.memoryKib,
        t: vector.iterations,
        p: 1,
        dkLen: vector.outputBytes,
      });

      expect(toHex(derived)).toBe(vector.expectedHex);
    },
    60_000,
  );

  /**
   * O vetor conhecido oficial do RFC 9106 secao 5.3 usa `secret` e `associated
   * data`, que o `crypto_pwhash` do libsodium não expõe. Por isso ele é
   * verificado contra o oráculo: o que se prova aqui é que a implementação de
   * referência do projeto está conforme a norma.
   */
  it('o oráculo reproduz o vetor oficial do RFC 9106 secao 5.3', () => {
    const derived = argon2id(new Uint8Array(32).fill(0x01), new Uint8Array(16).fill(0x02), {
      m: 32,
      t: 3,
      p: 4,
      dkLen: 32,
      version: 0x13,
      key: new Uint8Array(8).fill(0x03),
      personalization: new Uint8Array(12).fill(0x04),
    });

    expect(toHex(derived)).toBe('0d640df58d78766c08c037a34a8b53c9d01ef0452d75b65eb52520e96b01e659');
  });
});

describe('deriveRootKey', () => {
  it('deriva a RootKey nos parâmetros do ADR 0018', async () => {
    const rootKey = await webKdfAdapter.deriveRootKey({
      password: 'crypta-self-test',
      parameters: {
        memoryKib: ARGON2ID_PRODUCTION_VECTOR.memoryKib,
        iterations: ARGON2ID_PRODUCTION_VECTOR.iterations,
        parallelism: 1,
        salt: toBase64Url(ARGON2ID_PRODUCTION_VECTOR.salt),
      },
      keyLength: 32,
    });

    expect(toHex(rootKey)).toBe(ARGON2ID_PRODUCTION_VECTOR.expectedHex);
  }, 60_000);

  it('recusa parallelism diferente de 1', async () => {
    await expect(
      webKdfAdapter.deriveRootKey({
        password: 'x',
        parameters: {
          memoryKib: 8192,
          iterations: 1,
          parallelism: 4,
          salt: toBase64Url(ARGON2ID_KAT.salt),
        },
        keyLength: 32,
      }),
    ).rejects.toThrow(/parallelism/);
  });

  it('recusa salt que não tenha 16 bytes', async () => {
    await expect(
      webKdfAdapter.deriveRootKey({
        password: 'x',
        parameters: {
          memoryKib: 8192,
          iterations: 1,
          parallelism: 1,
          salt: toBase64Url(new Uint8Array(32).fill(7)),
        },
        keyLength: 32,
      }),
    ).rejects.toThrow(/16 bytes/);
  });
});

describe('deriveSubKey', () => {
  const rootKey = new Uint8Array(32).fill(0x5a);

  it.each(['auth', 'user-encryption'])('concorda com o oráculo para info="%s"', async (info) => {
    const derived = await webKdfAdapter.deriveSubKey({ rootKey, info, keyLength: 32 });
    const expected = hkdf(sha256, rootKey, new Uint8Array(0), new TextEncoder().encode(info), 32);

    expect(toHex(derived)).toBe(toHex(expected));
  });

  it('separa os domínios: auth e user-encryption divergem', async () => {
    const auth = await webKdfAdapter.deriveSubKey({ rootKey, info: 'auth', keyLength: 32 });
    const enc = await webKdfAdapter.deriveSubKey({
      rootKey,
      info: 'user-encryption',
      keyLength: 32,
    });

    expect(toHex(auth)).not.toBe(toHex(enc));
  });
});

describe('AEAD XChaCha20-Poly1305', () => {
  const key = new Uint8Array(32).fill(0x11);
  const nonce = new Uint8Array(24).fill(0x22);
  const plaintext = new TextEncoder().encode('conteudo-do-cofre');
  const aad = new TextEncoder().encode('crypta-aad/v2|5:vault');

  it('concorda com o oráculo @noble/ciphers', async () => {
    const mine = await webAeadAdapter.encrypt({ key, nonce, plaintext, aad });
    const theirs = xchacha20poly1305(key, nonce, aad).encrypt(plaintext);

    expect(toHex(mine)).toBe(toHex(theirs));
  });

  it('faz o roundtrip', async () => {
    const ciphertext = await webAeadAdapter.encrypt({ key, nonce, plaintext, aad });
    const opened = await webAeadAdapter.decrypt({ key, nonce, ciphertext, aad });

    expect(toHex(opened)).toBe(toHex(plaintext));
  });

  it('falha fechado com ciphertext adulterado', async () => {
    const ciphertext = await webAeadAdapter.encrypt({ key, nonce, plaintext, aad });
    const tampered = flipByte(ciphertext, 0);

    await expectAuthenticationFailure(
      webAeadAdapter.decrypt({ key, nonce, ciphertext: tampered, aad }),
    );
  });

  it('falha fechado com AAD incorreta', async () => {
    const ciphertext = await webAeadAdapter.encrypt({ key, nonce, plaintext, aad });

    await expectAuthenticationFailure(
      webAeadAdapter.decrypt({
        key,
        nonce,
        ciphertext,
        aad: new TextEncoder().encode('crypta-aad/v2|5:vault|4:site'),
      }),
    );
  });

  it('não vaza conteúdo na mensagem de erro', async () => {
    const ciphertext = await webAeadAdapter.encrypt({ key, nonce, plaintext, aad });
    const tampered = flipByte(ciphertext, 1);

    const caught: unknown = await webAeadAdapter
      .decrypt({ key, nonce, ciphertext: tampered, aad })
      .then(
        () => undefined,
        (error: unknown) => error,
      );

    expect(caught).toBeInstanceOf(Error);
    const message = caught instanceof Error ? caught.message : '';

    expect(message).not.toContain(toHex(key));
    expect(message).not.toContain('conteudo-do-cofre');
  });
});

describe('X25519 e envelope da VaultKey', () => {
  it('gera par compatível com o oráculo @noble/curves', async () => {
    const pair = await webKeyExchangeAdapter.generateKeyPair();

    expect(pair.publicKey).toHaveLength(32);
    expect(pair.privateKey).toHaveLength(32);
    // A pública precisa ser a que o noble deriva da mesma privada: prova que a
    // emenda entre `pkcs8` e `raw` está correta nos dois sentidos.
    expect(toHex(x25519.getPublicKey(pair.privateKey))).toBe(toHex(pair.publicKey));
  });

  it('abre o envelope com a chave privada correspondente', async () => {
    const pair = await webKeyExchangeAdapter.generateKeyPair();
    const vaultKey = new Uint8Array(32).fill(0x33);

    const envelope = await webKeyExchangeAdapter.sealForPublicKey({
      recipientPublicKey: pair.publicKey,
      plaintext: vaultKey,
    });

    const opened = await webKeyExchangeAdapter.openWithPrivateKey({
      recipientKeyPair: pair,
      ciphertext: envelope,
    });

    expect(toHex(opened)).toBe(toHex(vaultKey));
  });

  it('produz envelope diferente a cada chamada, pelo par efêmero', async () => {
    const pair = await webKeyExchangeAdapter.generateKeyPair();
    const vaultKey = new Uint8Array(32).fill(0x44);

    const first = await webKeyExchangeAdapter.sealForPublicKey({
      recipientPublicKey: pair.publicKey,
      plaintext: vaultKey,
    });
    const second = await webKeyExchangeAdapter.sealForPublicKey({
      recipientPublicKey: pair.publicKey,
      plaintext: vaultKey,
    });

    expect(toHex(first)).not.toBe(toHex(second));
  });

  it('falha fechado quando outra chave privada tenta abrir', async () => {
    const recipient = await webKeyExchangeAdapter.generateKeyPair();
    const intruder = await webKeyExchangeAdapter.generateKeyPair();

    const envelope = await webKeyExchangeAdapter.sealForPublicKey({
      recipientPublicKey: recipient.publicKey,
      plaintext: new Uint8Array(32).fill(0x55),
    });

    await expectAuthenticationFailure(
      webKeyExchangeAdapter.openWithPrivateKey({
        recipientKeyPair: intruder,
        ciphertext: envelope,
      }),
    );
  });

  /**
   * Este é o teste que o ADR 0017 exige: o sealed box do libsodium devolvia
   * conteúdo em 200 de 200 ciphertexts adulterados. A construção composta
   * precisa rejeitar todos.
   */
  it('falha fechado em envelope adulterado, byte a byte', async () => {
    const pair = await webKeyExchangeAdapter.generateKeyPair();
    const envelope = await webKeyExchangeAdapter.sealForPublicKey({
      recipientPublicKey: pair.publicKey,
      plaintext: new Uint8Array(32).fill(0x66),
    });

    for (let index = 0; index < envelope.length; index += 1) {
      const tampered = flipByte(envelope, index);

      await expect(
        webKeyExchangeAdapter.openWithPrivateKey({
          recipientKeyPair: pair,
          ciphertext: tampered,
        }),
      ).rejects.toThrow();
    }
  }, 60_000);
});
