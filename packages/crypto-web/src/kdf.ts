/**
 * Derivação de chaves da Web.
 *
 * `deriveRootKey` usa Argon2id do libsodium (ADR 0016); `deriveSubKey` usa
 * HKDF-SHA-256 do WebCrypto, porque nenhum build do libsodium.js expõe HKDF
 * chamável (ADR 0017).
 */

import {
  type Argon2idParameters,
  fromBase64Url,
  type KdfAdapter,
  type KeyMaterial,
} from '@crypta/crypto-core';

import { initSodium } from './sodium';

/** O `crypto_pwhash` do libsodium aceita salt de exatamente 16 bytes. */
const SALT_BYTES = 16;

/** Fixo em 1: o libsodium não expõe o parâmetro e crava 1 lane (ADR 0016). */
const REQUIRED_PARALLELISM = 1;

function assertParameters(parameters: Argon2idParameters, saltBytes: Uint8Array): void {
  if (parameters.parallelism !== REQUIRED_PARALLELISM) {
    throw new RangeError(
      `Argon2id exige parallelism = ${String(REQUIRED_PARALLELISM)} nesta plataforma; ` +
        `recebido ${String(parameters.parallelism)}. Outro valor quebraria a ` +
        'compatibilidade de bytes com o Android (ADR 0016).',
    );
  }

  if (saltBytes.length !== SALT_BYTES) {
    throw new RangeError(
      `O salt precisa ter ${String(SALT_BYTES)} bytes; recebido ${String(saltBytes.length)}.`,
    );
  }

  if (!Number.isInteger(parameters.memoryKib) || parameters.memoryKib <= 0) {
    throw new RangeError('memoryKib deve ser inteiro e positivo.');
  }

  if (!Number.isInteger(parameters.iterations) || parameters.iterations <= 0) {
    throw new RangeError('iterations deve ser inteiro e positivo.');
  }
}

export const webKdfAdapter: KdfAdapter = {
  async deriveRootKey(input): Promise<KeyMaterial> {
    const sodium = await initSodium();
    const salt = fromBase64Url(input.parameters.salt);

    assertParameters(input.parameters, salt);

    return sodium.crypto_pwhash(
      input.keyLength,
      input.password,
      salt,
      input.parameters.iterations,
      // O libsodium recebe o limite de memória em bytes; o contrato guarda KiB.
      input.parameters.memoryKib * 1024,
      sodium.crypto_pwhash_ALG_ARGON2ID13,
    );
  },

  async deriveSubKey(input): Promise<KeyMaterial> {
    // Chave HKDF é não-extraível por especificação: o material derivado sai por
    // `deriveBits`, e a RootKey nunca entra no armazenamento do WebCrypto.
    const key = await crypto.subtle.importKey('raw', input.rootKey as BufferSource, 'HKDF', false, [
      'deriveBits',
    ]);

    const bits = await crypto.subtle.deriveBits(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        // Salt vazio é deliberado: a separação de domínio vem inteiramente de
        // `info`, e a RootKey já é saída de um KDF com salt por usuário
        // (ARCHITECTURE.md secao 14.3).
        salt: new Uint8Array(0),
        info: new TextEncoder().encode(input.info),
      },
      key,
      input.keyLength * 8,
    );

    return new Uint8Array(bits);
  },
};
