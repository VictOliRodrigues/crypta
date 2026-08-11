import { describe, expect, it } from 'vitest';

import { CryptoFormatError } from '../errors';
import { decodeUtf8, encodeUtf8, utf8ByteLength } from './utf8';

describe('encodeUtf8', () => {
  it.each([
    { label: 'empty string', input: '', expected: [] },
    { label: 'ascii', input: 'a', expected: [0x61] },
    { label: 'latin-1 accent', input: 'á', expected: [0xc3, 0xa1] },
    { label: 'three-byte code point', input: '€', expected: [0xe2, 0x82, 0xac] },
    { label: 'astral plane emoji', input: '🔐', expected: [0xf0, 0x9f, 0x94, 0x90] },
  ])('encodes $label', ({ input, expected }) => {
    expect([...encodeUtf8(input)]).toEqual(expected);
  });

  it('replaces a lone surrogate with U+FFFD instead of emitting invalid UTF-8', () => {
    expect([...encodeUtf8('\ud800')]).toEqual([0xef, 0xbf, 0xbd]);
  });

  it('encodes mixed portuguese text used across the interface', () => {
    expect([...encodeUtf8('Cofre pessoal — não compartilhado')]).toEqual([
      ...encodeUtf8('Cofre pessoal '),
      0xe2,
      0x80,
      0x94,
      ...encodeUtf8(' não compartilhado'),
    ]);
  });
});

describe('utf8ByteLength', () => {
  it('counts bytes, not code units', () => {
    expect(utf8ByteLength('🔐')).toBe(4);
    expect('🔐'.length).toBe(2);
  });

  it('matches the encoded length for accented text', () => {
    expect(utf8ByteLength('senha válida')).toBe(encodeUtf8('senha válida').length);
  });
});

describe('decodeUtf8', () => {
  it('faz roundtrip de ASCII, acentuação e emoji', () => {
    for (const value of ['', 'vault', 'senha válida', 'Cofre 🔐 da família', '—']) {
      expect(decodeUtf8(encodeUtf8(value))).toBe(value);
    }
  });

  it('recusa byte de continuação solto', () => {
    expect(() => decodeUtf8(Uint8Array.from([0x80]))).toThrow(CryptoFormatError);
  });

  it('recusa sequência truncada no fim da entrada', () => {
    expect(() => decodeUtf8(Uint8Array.from([0xe2, 0x80]))).toThrow(CryptoFormatError);
  });

  it('recusa continuação com os bits altos errados', () => {
    expect(() => decodeUtf8(Uint8Array.from([0xc3, 0x28]))).toThrow(CryptoFormatError);
  });

  /**
   * `0xc0 0x80` decodifica para U+0000 num decodificador permissivo. É a forma
   * clássica de fazer dois bytes diferentes virarem o mesmo texto.
   */
  it('recusa codificação overlong', () => {
    expect(() => decodeUtf8(Uint8Array.from([0xc0, 0x80]))).toThrow(CryptoFormatError);
    expect(() => decodeUtf8(Uint8Array.from([0xe0, 0x80, 0x80]))).toThrow(CryptoFormatError);
  });

  it('recusa surrogate codificado', () => {
    expect(() => decodeUtf8(Uint8Array.from([0xed, 0xa0, 0x80]))).toThrow(CryptoFormatError);
  });

  it('recusa ponto de código acima de U+10FFFF', () => {
    expect(() => decodeUtf8(Uint8Array.from([0xf7, 0xbf, 0xbf, 0xbf]))).toThrow(CryptoFormatError);
  });

  it('recusa byte inicial fora das faixas válidas', () => {
    expect(() => decodeUtf8(Uint8Array.from([0xf8, 0x80, 0x80, 0x80, 0x80]))).toThrow(
      CryptoFormatError,
    );
  });

  it('decodifica texto maior que o lote interno', () => {
    const long = 'á'.repeat(10_000);

    expect(decodeUtf8(encodeUtf8(long))).toBe(long);
  });
});
