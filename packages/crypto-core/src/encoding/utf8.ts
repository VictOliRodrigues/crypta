import { CryptoFormatError } from '../errors';

/**
 * Codificação UTF-8 implementada sem depender de `TextEncoder`.
 *
 * `TextEncoder` é um global de plataforma. crypto-core precisa produzir
 * exatamente os mesmos bytes na Web e no Android para que a AAD e os vetores
 * de teste sejam idênticos nos dois clientes (ARCHITECTURE.md secao 8.2).
 */

const REPLACEMENT_CODE_POINT = 0xfffd;

const SURROGATE_START = 0xd800;
const SURROGATE_END = 0xdfff;

/**
 * Converte uma string em bytes UTF-8.
 *
 * Surrogates isolados são substituídos por U+FFFD, igual ao comportamento de
 * `TextEncoder`, evitando produzir CESU-8 inválido.
 */
export function encodeUtf8(value: string): Uint8Array {
  const bytes: number[] = [];

  for (const character of value) {
    const rawCodePoint = character.codePointAt(0);

    if (rawCodePoint === undefined) {
      continue;
    }

    const codePoint =
      rawCodePoint >= SURROGATE_START && rawCodePoint <= SURROGATE_END
        ? REPLACEMENT_CODE_POINT
        : rawCodePoint;

    if (codePoint < 0x80) {
      bytes.push(codePoint);
      continue;
    }

    if (codePoint < 0x800) {
      bytes.push(0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f));
      continue;
    }

    if (codePoint < 0x10000) {
      bytes.push(
        0xe0 | (codePoint >> 12),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f),
      );
      continue;
    }

    bytes.push(
      0xf0 | (codePoint >> 18),
      0x80 | ((codePoint >> 12) & 0x3f),
      0x80 | ((codePoint >> 6) & 0x3f),
      0x80 | (codePoint & 0x3f),
    );
  }

  return Uint8Array.from(bytes);
}

/** Comprimento em bytes UTF-8, usado nos prefixos de tamanho da AAD. */
export function utf8ByteLength(value: string): number {
  return encodeUtf8(value).length;
}

/** Tamanho do lote de `String.fromCodePoint`, para não estourar a pilha. */
const CHUNK_CODE_POINTS = 4096;

function invalid(): never {
  throw new CryptoFormatError('Sequência UTF-8 inválida.');
}

/**
 * Converte bytes UTF-8 em string.
 *
 * **Recusa entrada malformada**, e essa é a diferença deliberada em relação ao
 * `TextDecoder`, que substitui bytes inválidos por U+FFFD e segue adiante. Aqui
 * a entrada é sempre texto claro recém-saído de uma AEAD: os bytes já foram
 * autenticados, então malformação não significa dado corrompido em trânsito —
 * significa que quem escreveu não escreveu texto. Substituir em silêncio
 * transformaria isso num nome de cofre com caracteres estranhos.
 *
 * Sequência overlong, surrogate codificado e ponto acima de U+10FFFF são
 * recusados pelo mesmo motivo: são as três formas clássicas de fazer dois bytes
 * diferentes decodificarem para o mesmo texto, e nada aqui precisa disso.
 */
export function decodeUtf8(bytes: Uint8Array): string {
  const codePoints: number[] = [];
  let index = 0;

  while (index < bytes.length) {
    const first = bytes[index] ?? invalid();

    let codePoint: number;
    let continuationCount: number;
    let smallest: number;

    if (first < 0x80) {
      codePoint = first;
      continuationCount = 0;
      smallest = 0;
    } else if ((first & 0xe0) === 0xc0) {
      codePoint = first & 0x1f;
      continuationCount = 1;
      smallest = 0x80;
    } else if ((first & 0xf0) === 0xe0) {
      codePoint = first & 0x0f;
      continuationCount = 2;
      smallest = 0x800;
    } else if ((first & 0xf8) === 0xf0) {
      codePoint = first & 0x07;
      continuationCount = 3;
      smallest = 0x10000;
    } else {
      invalid();
    }

    if (index + continuationCount >= bytes.length) {
      invalid();
    }

    for (let offset = 1; offset <= continuationCount; offset += 1) {
      const continuation = bytes[index + offset] ?? invalid();

      if ((continuation & 0xc0) !== 0x80) {
        invalid();
      }

      codePoint = (codePoint << 6) | (continuation & 0x3f);
    }

    if (codePoint < smallest || codePoint > 0x10ffff) {
      invalid();
    }

    if (codePoint >= SURROGATE_START && codePoint <= SURROGATE_END) {
      invalid();
    }

    codePoints.push(codePoint);
    index += continuationCount + 1;
  }

  let decoded = '';

  for (let start = 0; start < codePoints.length; start += CHUNK_CODE_POINTS) {
    decoded += String.fromCodePoint(...codePoints.slice(start, start + CHUNK_CODE_POINTS));
  }

  return decoded;
}
