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
