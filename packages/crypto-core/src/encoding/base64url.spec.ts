import { describe, expect, it } from 'vitest';

import { CryptoFormatError } from '../errors';
import { fromBase64Url, toBase64Url } from './base64url';

/**
 * Vetores fixos. Estes valores precisam permanecer idênticos na Web e no
 * Android; qualquer divergência quebra a leitura cruzada de cofres
 * (CLAUDE.md secao 54).
 */
const VECTORS: ReadonlyArray<{ bytes: number[]; encoded: string }> = [
  { bytes: [], encoded: '' },
  { bytes: [0x66], encoded: 'Zg' },
  { bytes: [0x66, 0x6f], encoded: 'Zm8' },
  { bytes: [0x66, 0x6f, 0x6f], encoded: 'Zm9v' },
  { bytes: [0x66, 0x6f, 0x6f, 0x62], encoded: 'Zm9vYg' },
  { bytes: [0x66, 0x6f, 0x6f, 0x62, 0x61], encoded: 'Zm9vYmE' },
  { bytes: [0x66, 0x6f, 0x6f, 0x62, 0x61, 0x72], encoded: 'Zm9vYmFy' },
  // Bytes que produzem os símbolos `-` e `_`, distinguindo base64url de base64.
  { bytes: [0xfb, 0xef], encoded: '--8' },
  { bytes: [0xff, 0xff, 0xff], encoded: '____' },
];

describe('toBase64Url', () => {
  it.each(VECTORS)('encodes $encoded', ({ bytes, encoded }) => {
    expect(toBase64Url(Uint8Array.from(bytes))).toBe(encoded);
  });

  it('never emits padding or the base64 symbols + and /', () => {
    const allBytes = Uint8Array.from({ length: 256 }, (_value, index) => index);

    expect(toBase64Url(allBytes)).not.toMatch(/[+/=]/);
  });
});

describe('fromBase64Url', () => {
  it.each(VECTORS)('decodes $encoded', ({ bytes, encoded }) => {
    expect([...fromBase64Url(encoded)]).toEqual(bytes);
  });

  it('round-trips every possible byte value', () => {
    const allBytes = Uint8Array.from({ length: 256 }, (_value, index) => index);

    expect([...fromBase64Url(toBase64Url(allBytes))]).toEqual([...allBytes]);
  });

  it('rejects standard base64 padding', () => {
    expect(() => fromBase64Url('Zm8=')).toThrow(CryptoFormatError);
  });

  it('rejects the standard base64 alphabet', () => {
    expect(() => fromBase64Url('++//')).toThrow(CryptoFormatError);
  });

  it('rejects whitespace', () => {
    expect(() => fromBase64Url('Zm9v Zm9v')).toThrow(CryptoFormatError);
  });

  it('rejects an impossible length', () => {
    expect(() => fromBase64Url('Zm9vZ')).toThrow(CryptoFormatError);
  });

  it('rejects a non-canonical encoding with non-zero padding bits', () => {
    // 'Zh' decodifica os mesmos bytes que 'Zg', mas com bits de padding sujos.
    expect(() => fromBase64Url('Zh')).toThrow(CryptoFormatError);
  });
});
