/**
 * X25519 e envelope da `VaultKey`.
 *
 * O par de chaves vem do WebCrypto, que é nativo e constant-time. Os sealed
 * boxes do libsodium estão **proibidos** pelo ADR 0017: o
 * `crypto_box_curve25519xchacha20poly1305_seal_open` falha aberto — devolve
 * conteúdo em ciphertext adulterado sem lançar erro — e o `crypto_box_seal` usa
 * XSalsa20, que não corresponde ao algoritmo declarado em `docs/API.md`.
 *
 * O envelope é composto no padrão do RFC 9180: X25519 efêmero, HKDF-SHA-256 e
 * XChaCha20-Poly1305. Não é construção nova; é a composição padrão de ECDH com
 * KDF e AEAD.
 */

import { type KeyExchangeAdapter, type KeyPair } from '@crypta/crypto-core';

import { webAeadAdapter } from './aead';

/**
 * Prefixo PKCS#8 de uma chave privada X25519.
 *
 * O WebCrypto não exporta X25519 em `raw`, só em `pkcs8`, mas o envoltório é
 * constante: 16 bytes de cabeçalho seguidos dos 32 bytes da chave. Converter
 * nos dois sentidos é uma emenda, o que preserva a interoperabilidade em bytes
 * crus com o Android (ADR 0017).
 */
const PKCS8_X25519_PREFIX = new Uint8Array([
  0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x6e, 0x04, 0x22, 0x04, 0x20,
]);

const X25519_KEY_BYTES = 32;
const XCHACHA20_NONCE_BYTES = 24;

/**
 * Rótulo HKDF do envelope. Constante de protocolo: alterá-lo invalida todo
 * envelope existente.
 */
const ENVELOPE_INFO = 'crypta-vault-key-envelope/v1';

const ALGORITHM = { name: 'X25519' } as const;

function concat(...parts: readonly Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;

  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }

  return out;
}

function toPkcs8(rawPrivateKey: Uint8Array): Uint8Array {
  return concat(PKCS8_X25519_PREFIX, rawPrivateKey);
}

function assertKeyLength(value: Uint8Array, field: string): void {
  if (value.length !== X25519_KEY_BYTES) {
    throw new RangeError(
      `${field} precisa ter ${String(X25519_KEY_BYTES)} bytes; recebido ${String(value.length)}.`,
    );
  }
}

async function importPrivateKey(rawPrivateKey: Uint8Array): Promise<CryptoKey> {
  assertKeyLength(rawPrivateKey, 'A chave privada');

  return crypto.subtle.importKey(
    'pkcs8',
    toPkcs8(rawPrivateKey) as BufferSource,
    ALGORITHM,
    false,
    ['deriveBits'],
  );
}

async function importPublicKey(rawPublicKey: Uint8Array): Promise<CryptoKey> {
  assertKeyLength(rawPublicKey, 'A chave pública');

  return crypto.subtle.importKey('raw', rawPublicKey as BufferSource, ALGORITHM, true, []);
}

/**
 * Deriva a chave e o nonce do envelope a partir do segredo compartilhado.
 *
 * As duas chaves públicas entram no material de entrada para vincular o
 * ciphertext ao par exato de remetente efêmero e destinatário — é o mesmo papel
 * que o contexto do KEM cumpre no RFC 9180.
 */
async function deriveEnvelopeSecrets(
  sharedSecret: Uint8Array,
  ephemeralPublicKey: Uint8Array,
  recipientPublicKey: Uint8Array,
): Promise<{ key: Uint8Array; nonce: Uint8Array }> {
  const ikm = concat(sharedSecret, ephemeralPublicKey, recipientPublicKey);

  const hkdfKey = await crypto.subtle.importKey('raw', ikm as BufferSource, 'HKDF', false, [
    'deriveBits',
  ]);

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(0),
      info: new TextEncoder().encode(ENVELOPE_INFO),
    },
    hkdfKey,
    (X25519_KEY_BYTES + XCHACHA20_NONCE_BYTES) * 8,
  );

  const derived = new Uint8Array(bits);

  return {
    key: derived.subarray(0, X25519_KEY_BYTES),
    nonce: derived.subarray(X25519_KEY_BYTES),
  };
}

export const webKeyExchangeAdapter: KeyExchangeAdapter = {
  async generateKeyPair(): Promise<KeyPair> {
    const pair = (await crypto.subtle.generateKey(ALGORITHM, true, [
      'deriveBits',
    ])) as CryptoKeyPair;

    const publicKey = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
    const pkcs8 = new Uint8Array(await crypto.subtle.exportKey('pkcs8', pair.privateKey));

    return {
      publicKey,
      privateKey: pkcs8.slice(PKCS8_X25519_PREFIX.length),
    };
  },

  async sealForPublicKey(input): Promise<Uint8Array> {
    assertKeyLength(input.recipientPublicKey, 'A chave pública do destinatário');

    // Par efêmero por envelope: garante que a chave da AEAD nunca se repita,
    // então o nonce derivado também nunca se repete com a mesma chave.
    const ephemeral = (await crypto.subtle.generateKey(ALGORITHM, true, [
      'deriveBits',
    ])) as CryptoKeyPair;

    const ephemeralPublicKey = new Uint8Array(
      await crypto.subtle.exportKey('raw', ephemeral.publicKey),
    );

    const sharedSecret = new Uint8Array(
      await crypto.subtle.deriveBits(
        { name: 'X25519', public: await importPublicKey(input.recipientPublicKey) },
        ephemeral.privateKey,
        X25519_KEY_BYTES * 8,
      ),
    );

    const { key, nonce } = await deriveEnvelopeSecrets(
      sharedSecret,
      ephemeralPublicKey,
      input.recipientPublicKey,
    );

    const ciphertext = await webAeadAdapter.encrypt({
      key,
      nonce,
      plaintext: input.plaintext,
      aad: new Uint8Array(0),
    });

    // Enquadramento: chave pública efêmera, depois o ciphertext com a tag. O
    // nonce não trafega porque é derivado — a API pode fatiar este blob nos
    // campos que `docs/API.md` documenta.
    return concat(ephemeralPublicKey, ciphertext);
  },

  async openWithPrivateKey(input): Promise<Uint8Array> {
    if (input.ciphertext.length <= X25519_KEY_BYTES) {
      throw new RangeError('Envelope curto demais para conter uma chave pública efêmera.');
    }

    const ephemeralPublicKey = input.ciphertext.subarray(0, X25519_KEY_BYTES);
    const ciphertext = input.ciphertext.subarray(X25519_KEY_BYTES);

    const privateKey = await importPrivateKey(input.recipientKeyPair.privateKey);

    const sharedSecret = new Uint8Array(
      await crypto.subtle.deriveBits(
        { name: 'X25519', public: await importPublicKey(ephemeralPublicKey) },
        privateKey,
        X25519_KEY_BYTES * 8,
      ),
    );

    const { key, nonce } = await deriveEnvelopeSecrets(
      sharedSecret,
      ephemeralPublicKey,
      input.recipientKeyPair.publicKey,
    );

    // Falha fechada: `webAeadAdapter.decrypt` lança `CryptoAuthenticationError`
    // quando a tag não confere, incluindo o caso de envelope destinado a outra
    // chave pública.
    return webAeadAdapter.decrypt({
      key,
      nonce,
      ciphertext,
      aad: new Uint8Array(0),
    });
  },
};
