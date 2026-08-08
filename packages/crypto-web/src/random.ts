/**
 * Fonte de aleatoriedade da Web.
 *
 * `crypto.getRandomValues` é o CSPRNG da plataforma (ADR 0017). `Math.random()`
 * é proibido (CLAUDE.md secao 9).
 */

import type { RandomSource } from '@crypta/crypto-core';

/** Limite por chamada imposto pela especificação do WebCrypto. */
const MAX_BYTES_PER_CALL = 65536;

export const webRandomSource: RandomSource = {
  getRandomBytes(length: number): Uint8Array {
    if (!Number.isInteger(length) || length <= 0) {
      throw new RangeError('O número de bytes aleatórios deve ser inteiro e positivo.');
    }

    const bytes = new Uint8Array(length);

    // `getRandomValues` rejeita mais de 65536 bytes por chamada. Preencher em
    // blocos mantém a mesma fonte, sem inventar expansão própria.
    for (let offset = 0; offset < length; offset += MAX_BYTES_PER_CALL) {
      const chunk = bytes.subarray(offset, Math.min(offset + MAX_BYTES_PER_CALL, length));
      crypto.getRandomValues(chunk);
    }

    return bytes;
  },
};
