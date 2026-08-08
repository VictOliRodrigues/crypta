/**
 * XChaCha20-Poly1305 da Web, pelo libsodium (ADR 0017).
 *
 * Verificado que o `crypto_aead_xchacha20poly1305_ietf_decrypt` falha fechado:
 * ciphertext adulterado lança, nunca devolve conteúdo parcial. Isso não vale
 * para os sealed boxes do libsodium, que estão proibidos — ver `key-exchange.ts`.
 */

import { type AeadAdapter, CryptoAuthenticationError } from '@crypta/crypto-core';

import { initSodium } from './sodium';

export const webAeadAdapter: AeadAdapter = {
  async encrypt(input): Promise<Uint8Array> {
    const sodium = await initSodium();

    return sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
      input.plaintext,
      input.aad,
      // `nsec` não é usado por esta construção e precisa ser nulo.
      null,
      input.nonce,
      input.key,
    );
  },

  async decrypt(input): Promise<Uint8Array> {
    const sodium = await initSodium();

    try {
      return sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
        null,
        input.ciphertext,
        input.aad,
        input.nonce,
        input.key,
      );
    } catch {
      // A mensagem original do libsodium é descartada de propósito: ela não
      // acrescenta nada acionável e o erro tipado é o que a interface consome.
      // Nenhum dado do payload pode vazar para a mensagem (errors.ts).
      throw new CryptoAuthenticationError(
        'Falha ao autenticar o conteúdo criptografado. ' +
          'O ciphertext, o nonce ou a AAD não conferem com a chave.',
      );
    }
  },
};
