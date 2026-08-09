/**
 * Identidade do usuário, exercitada contra as primitivas reais.
 *
 * `@crypta/crypto-core` não implementa criptografia: os testes de lá provam a
 * fiação com adapters de registro. Este arquivo é onde a derivação e o key
 * bundle passam pelo libsodium e pelo `crypto.subtle`, com `@noble/*` como
 * oráculo independente (ADR 0017).
 */

import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { describe, expect, it } from 'vitest';

import {
  buildKeyEnvelope,
  createUserKeyBundle,
  CryptoAuthenticationError,
  deriveIdentitySecrets,
  fromBase64Url,
  IDENTITY_PRODUCTION_VECTOR,
  kdfParametersFromBundle,
  openUserKeyBundle,
  parseKeyEnvelope,
  resealUserKeyBundle,
  sealedBytesFromEnvelope,
  serializeAad,
  toBase64Url,
  USER_KEY_BUNDLE_AAD_VECTOR,
} from '@crypta/crypto-core';

import { webAeadAdapter } from './aead';
import { webKdfAdapter } from './kdf';
import { webKeyExchangeAdapter } from './key-exchange';
import { webRandomSource } from './random';
import { initSodium } from './sodium';

/** Confere que a promise rejeitou com falha de autenticação, sem recorrer a `any`. */
async function expectAuthenticationFailure(promise: Promise<unknown>): Promise<void> {
  const error: unknown = await promise.then(
    () => undefined,
    (caught: unknown) => caught,
  );

  expect(error).toBeInstanceOf(CryptoAuthenticationError);
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

const VECTOR = IDENTITY_PRODUCTION_VECTOR;

/** Argon2id de 64 MiB custa centenas de milissegundos; cada suíte deriva uma vez. */
async function deriveOnce(): Promise<{ authSecret: Uint8Array; userEncryptionKey: Uint8Array }> {
  await initSodium();

  return deriveIdentitySecrets({
    kdf: webKdfAdapter,
    password: VECTOR.password,
    parameters: VECTOR.parameters,
  });
}

describe('derivação de identidade', () => {
  it(`reproduz o vetor congelado ${VECTOR.name}`, async () => {
    const secrets = await deriveOnce();

    expect(toHex(secrets.authSecret)).toBe(VECTOR.authSecretHex);
    expect(toHex(secrets.userEncryptionKey)).toBe(VECTOR.userEncryptionKeyHex);
  }, 60_000);

  it('confere com o oráculo @noble/hashes a partir da mesma RootKey', async () => {
    const rootKey = await webKdfAdapter.deriveRootKey({
      password: VECTOR.password,
      parameters: VECTOR.parameters,
      keyLength: 32,
    });

    expect(toHex(rootKey)).toBe(VECTOR.rootKeyHex);

    const encoder = new TextEncoder();
    const empty = new Uint8Array(0);

    expect(toHex(hkdf(sha256, rootKey, empty, encoder.encode('auth'), 32))).toBe(
      VECTOR.authSecretHex,
    );
    expect(toHex(hkdf(sha256, rootKey, empty, encoder.encode('user-encryption'), 32))).toBe(
      VECTOR.userEncryptionKeyHex,
    );
  }, 60_000);

  it('separa os domínios: o AuthSecret não serve como chave de criptografia', async () => {
    const secrets = await deriveOnce();

    expect(secrets.authSecret).not.toEqual(secrets.userEncryptionKey);
  }, 60_000);
});

describe('key bundle do usuário', () => {
  /**
   * Argon2id de produção é caro demais para rodar a cada caso. A chave usada
   * aqui é aleatória de 32 bytes, que é o que a derivação produziria — o vetor
   * acima é quem prova que a derivação chega nesse formato.
   */
  const userEncryptionKey = webRandomSource.getRandomBytes(32);

  async function createBundle() {
    await initSodium();

    return createUserKeyBundle({
      aead: webAeadAdapter,
      keyExchange: webKeyExchangeAdapter,
      random: webRandomSource,
      userEncryptionKey,
      parameters: VECTOR.parameters,
    });
  }

  it('congela a AAD do escopo de usuário', () => {
    expect(
      serializeAad({
        scope: 'user',
        entityType: 'user-key-bundle',
        publicKey: USER_KEY_BUNDLE_AAD_VECTOR.publicKey,
        schemaVersion: 1,
        cryptoVersion: 1,
      }),
    ).toBe(USER_KEY_BUNDLE_AAD_VECTOR.serialized);
  });

  it('faz roundtrip do par de chaves', async () => {
    const { bundle, keyPair } = await createBundle();

    const opened = await openUserKeyBundle({ aead: webAeadAdapter, userEncryptionKey, bundle });

    expect(opened.privateKey).toEqual(keyPair.privateKey);
    expect(opened.publicKey).toEqual(keyPair.publicKey);
  });

  it('nunca coloca a chave privada aberta no bundle', async () => {
    const { bundle, keyPair } = await createBundle();

    expect(JSON.stringify(bundle)).not.toContain(toBase64Url(keyPair.privateKey));
  });

  it('preserva os parâmetros KDF de ida e volta', async () => {
    const { bundle } = await createBundle();

    expect(kdfParametersFromBundle(bundle)).toEqual(VECTOR.parameters);
  });

  it('falha fechado com a UserEncryptionKey errada', async () => {
    const { bundle } = await createBundle();

    await expectAuthenticationFailure(
      openUserKeyBundle({
        aead: webAeadAdapter,
        userEncryptionKey: webRandomSource.getRandomBytes(32),
        bundle,
      }),
    );
  });

  /**
   * O ataque que a AAD de escopo `user` existe para barrar.
   *
   * Um servidor que troque `publicKey` mantendo `encryptedPrivateKey` faria
   * envelopes futuros serem endereçados a uma chave que o usuário não abre — ou
   * à chave de um terceiro. Sem a AAD, a troca só apareceria muito depois, no
   * primeiro cofre compartilhado.
   */
  it('falha fechado quando a chave pública do bundle é trocada', async () => {
    const { bundle } = await createBundle();
    const intruder = await webKeyExchangeAdapter.generateKeyPair();

    await expectAuthenticationFailure(
      openUserKeyBundle({
        aead: webAeadAdapter,
        userEncryptionKey,
        bundle: { ...bundle, publicKey: toBase64Url(intruder.publicKey) },
      }),
    );
  });

  it('falha fechado quando a versão de schema declarada é alterada', async () => {
    const { bundle } = await createBundle();

    await expectAuthenticationFailure(
      openUserKeyBundle({
        aead: webAeadAdapter,
        userEncryptionKey,
        bundle: { ...bundle, schemaVersion: 2 },
      }),
    );
  });

  it('falha fechado com a chave privada cifrada adulterada, byte a byte', async () => {
    const { bundle } = await createBundle();
    const ciphertext = fromBase64Url(bundle.encryptedPrivateKey);

    for (let index = 0; index < ciphertext.length; index += 1) {
      await expectAuthenticationFailure(
        openUserKeyBundle({
          aead: webAeadAdapter,
          userEncryptionKey,
          bundle: {
            ...bundle,
            encryptedPrivateKey: toBase64Url(flipByte(ciphertext, index)),
          },
        }),
      );
    }
  });

  it('falha fechado com o nonce adulterado, byte a byte', async () => {
    const { bundle } = await createBundle();
    const nonce = fromBase64Url(bundle.privateKeyNonce);

    for (let index = 0; index < nonce.length; index += 1) {
      await expectAuthenticationFailure(
        openUserKeyBundle({
          aead: webAeadAdapter,
          userEncryptionKey,
          bundle: { ...bundle, privateKeyNonce: toBase64Url(flipByte(nonce, index)) },
        }),
      );
    }
  });

  it('gera nonce diferente a cada bundle, com a mesma chave', async () => {
    const first = await createBundle();
    const second = await createBundle();

    expect(first.bundle.privateKeyNonce).not.toBe(second.bundle.privateKeyNonce);
  });
});

describe('reproteção do key bundle na troca de senha', () => {
  const originalKey = webRandomSource.getRandomBytes(32);
  const newKey = webRandomSource.getRandomBytes(32);

  const NEW_PARAMETERS = {
    ...VECTOR.parameters,
    salt: toBase64Url(webRandomSource.getRandomBytes(16)),
  };

  async function createThenReseal() {
    await initSodium();

    const created = await createUserKeyBundle({
      aead: webAeadAdapter,
      keyExchange: webKeyExchangeAdapter,
      random: webRandomSource,
      userEncryptionKey: originalKey,
      parameters: VECTOR.parameters,
    });

    const resealed = await resealUserKeyBundle({
      aead: webAeadAdapter,
      random: webRandomSource,
      keyPair: created.keyPair,
      userEncryptionKey: newKey,
      parameters: NEW_PARAMETERS,
    });

    return { ...created, resealed };
  }

  it('abre com a UserEncryptionKey nova e devolve o mesmo par', async () => {
    const { keyPair, resealed } = await createThenReseal();

    const opened = await openUserKeyBundle({
      aead: webAeadAdapter,
      userEncryptionKey: newKey,
      bundle: resealed,
    });

    expect(opened.privateKey).toEqual(keyPair.privateKey);
    expect(opened.publicKey).toEqual(keyPair.publicKey);
  });

  /**
   * A propriedade que dá sentido à troca de senha.
   *
   * Sem ela, quem tivesse a senha antiga continuaria abrindo a chave privada
   * depois da troca, e trocar a senha seria teatro.
   */
  it('deixa de abrir com a UserEncryptionKey antiga', async () => {
    const { resealed } = await createThenReseal();

    await expectAuthenticationFailure(
      openUserKeyBundle({
        aead: webAeadAdapter,
        userEncryptionKey: originalKey,
        bundle: resealed,
      }),
    );
  });

  /**
   * A propriedade que impede a troca de senha de destruir os cofres.
   *
   * A chave pública é o endereço de todo `VaultKeyEnvelope` já selado. Se ela
   * mudasse aqui, o usuário sairia da troca sem conseguir abrir nada do que
   * tinha, e a causa só apareceria no primeiro cofre aberto depois.
   */
  it('preserva a chave pública, que é o endereço dos envelopes existentes', async () => {
    const { bundle, resealed } = await createThenReseal();

    expect(resealed.publicKey).toBe(bundle.publicKey);
  });

  it('registra os parâmetros novos, e não os antigos', async () => {
    const { resealed } = await createThenReseal();

    expect(kdfParametersFromBundle(resealed)).toEqual(NEW_PARAMETERS);
  });

  it('produz ciphertext e nonce diferentes dos originais', async () => {
    const { bundle, resealed } = await createThenReseal();

    expect(resealed.privateKeyNonce).not.toBe(bundle.privateKeyNonce);
    expect(resealed.encryptedPrivateKey).not.toBe(bundle.encryptedPrivateKey);
  });

  it('falha fechado com o ciphertext reprotegido adulterado, byte a byte', async () => {
    const { resealed } = await createThenReseal();
    const ciphertext = fromBase64Url(resealed.encryptedPrivateKey);

    for (let index = 0; index < ciphertext.length; index += 1) {
      await expectAuthenticationFailure(
        openUserKeyBundle({
          aead: webAeadAdapter,
          userEncryptionKey: newKey,
          bundle: {
            ...resealed,
            encryptedPrivateKey: toBase64Url(flipByte(ciphertext, index)),
          },
        }),
      );
    }
  });

  it('falha fechado quando a chave pública do bundle reprotegido é trocada', async () => {
    const { resealed } = await createThenReseal();
    const intruder = await webKeyExchangeAdapter.generateKeyPair();

    await expectAuthenticationFailure(
      openUserKeyBundle({
        aead: webAeadAdapter,
        userEncryptionKey: newKey,
        bundle: { ...resealed, publicKey: toBase64Url(intruder.publicKey) },
      }),
    );
  });

  /**
   * Misturar os dois bundles não abre nada.
   *
   * Um servidor que devolvesse o nonce novo com o ciphertext antigo, ou o
   * contrário, estaria montando um bundle que nunca existiu. A AEAD recusa.
   */
  it('falha fechado ao misturar ciphertext e nonce dos dois bundles', async () => {
    const { bundle, resealed } = await createThenReseal();

    await expectAuthenticationFailure(
      openUserKeyBundle({
        aead: webAeadAdapter,
        userEncryptionKey: newKey,
        bundle: { ...resealed, privateKeyNonce: bundle.privateKeyNonce },
      }),
    );

    await expectAuthenticationFailure(
      openUserKeyBundle({
        aead: webAeadAdapter,
        userEncryptionKey: newKey,
        bundle: { ...resealed, encryptedPrivateKey: bundle.encryptedPrivateKey },
      }),
    );
  });
});

describe('envelope de chave enquadrado', () => {
  async function sealEnvelope() {
    await initSodium();

    const recipient = await webKeyExchangeAdapter.generateKeyPair();
    const vaultKey = webRandomSource.getRandomBytes(32);

    const sealed = await webKeyExchangeAdapter.sealForPublicKey({
      recipientPublicKey: recipient.publicKey,
      plaintext: vaultKey,
    });

    return { recipient, vaultKey, envelope: buildKeyEnvelope({ keyVersion: 1, sealed }) };
  }

  it('produz um envelope que parseKeyEnvelope aceita', async () => {
    const { envelope } = await sealEnvelope();

    expect(parseKeyEnvelope({ ...envelope })).toEqual(envelope);
  });

  it('faz roundtrip da VaultKey pelo enquadramento', async () => {
    const { recipient, vaultKey, envelope } = await sealEnvelope();

    const opened = await webKeyExchangeAdapter.openWithPrivateKey({
      recipientKeyPair: recipient,
      ciphertext: sealedBytesFromEnvelope(envelope),
    });

    expect(opened).toEqual(vaultKey);
  });

  it('falha fechado com a chave pública efêmera adulterada, byte a byte', async () => {
    const { recipient, envelope } = await sealEnvelope();
    const ephemeral = fromBase64Url(envelope.ephemeralPublicKey);

    for (let index = 0; index < ephemeral.length; index += 1) {
      await expectAuthenticationFailure(
        webKeyExchangeAdapter.openWithPrivateKey({
          recipientKeyPair: recipient,
          ciphertext: sealedBytesFromEnvelope({
            ...envelope,
            ephemeralPublicKey: toBase64Url(flipByte(ephemeral, index)),
          }),
        }),
      );
    }
  });

  it('falha fechado com a VaultKey cifrada adulterada, byte a byte', async () => {
    const { recipient, envelope } = await sealEnvelope();
    const encrypted = fromBase64Url(envelope.encryptedVaultKey);

    for (let index = 0; index < encrypted.length; index += 1) {
      await expectAuthenticationFailure(
        webKeyExchangeAdapter.openWithPrivateKey({
          recipientKeyPair: recipient,
          ciphertext: sealedBytesFromEnvelope({
            ...envelope,
            encryptedVaultKey: toBase64Url(flipByte(encrypted, index)),
          }),
        }),
      );
    }
  });

  it('não abre com a chave privada de outro usuário', async () => {
    const { envelope } = await sealEnvelope();
    const intruder = await webKeyExchangeAdapter.generateKeyPair();

    await expectAuthenticationFailure(
      webKeyExchangeAdapter.openWithPrivateKey({
        recipientKeyPair: intruder,
        ciphertext: sealedBytesFromEnvelope(envelope),
      }),
    );
  });
});
