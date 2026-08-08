/**
 * Implementação dos adapters criptográficos para o navegador.
 *
 * Origem de cada primitiva, fixada pelos ADRs 0016 e 0017:
 *
 * ```text
 * CSPRNG               crypto.getRandomValues
 * Argon2id             libsodium-wrappers-sumo (WebAssembly)
 * XChaCha20-Poly1305   libsodium-wrappers-sumo
 * HKDF-SHA-256         crypto.subtle
 * X25519               crypto.subtle
 * ```
 */

import type { CryptoAdapter } from '@crypta/crypto-core';

import { webAeadAdapter } from './aead';
import { webKdfAdapter } from './kdf';
import { webKeyExchangeAdapter } from './key-exchange';
import { webRandomSource } from './random';
import { initSodium } from './sodium';

export { webAeadAdapter } from './aead';
export { webKdfAdapter } from './kdf';
export { webKeyExchangeAdapter } from './key-exchange';
export { webRandomSource } from './random';
export { CryptoInitializationError, initSodium, resetSodiumForTests } from './sodium';
export {
  ARGON2ID_KAT,
  ARGON2ID_PRODUCTION_VECTOR,
  type Argon2idVector,
  WASM2JS_PROBE,
} from './vectors';

/**
 * Adapter completo da Web.
 *
 * `init()` precisa resolver antes de qualquer outro método: ele carrega o
 * WebAssembly do libsodium e roda o self-test que recusa operar se a
 * implementação divergir do vetor conhecido.
 */
export const webCryptoAdapter: CryptoAdapter = {
  async init(): Promise<void> {
    await initSodium();
  },
  random: webRandomSource,
  kdf: webKdfAdapter,
  aead: webAeadAdapter,
  keyExchange: webKeyExchangeAdapter,
};
