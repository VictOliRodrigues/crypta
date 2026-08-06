import { describe, expect, it } from 'vitest';

import { encodeUtf8, utf8ByteLength } from './utf8';

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
