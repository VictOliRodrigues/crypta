import { CryptoFormatError } from '../errors';

/**
 * Base64url sem padding (RFC 4648 secao 5).
 *
 * É o encoding de transporte de nonce, ciphertext e chaves públicas
 * (ARCHITECTURE.md secao 14.8). A implementação é manual para não depender de
 * `Buffer` (Node) nem de `btoa` (navegador) e para produzir exatamente o mesmo
 * resultado na Web e no Android.
 */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

const DECODE_TABLE: ReadonlyMap<string, number> = new Map(
  [...ALPHABET].map((character, index) => [character, index]),
);

function symbolAt(index: number): string {
  const character = ALPHABET[index];

  if (character === undefined) {
    throw new CryptoFormatError('Índice fora do alfabeto base64url.');
  }

  return character;
}

export function toBase64Url(bytes: Uint8Array): string {
  let output = '';

  for (let index = 0; index < bytes.length; index += 3) {
    const byte0 = bytes[index] ?? 0;
    const hasByte1 = index + 1 < bytes.length;
    const hasByte2 = index + 2 < bytes.length;
    const byte1 = bytes[index + 1] ?? 0;
    const byte2 = bytes[index + 2] ?? 0;

    output += symbolAt(byte0 >> 2);
    output += symbolAt(((byte0 & 0x03) << 4) | (hasByte1 ? byte1 >> 4 : 0));

    if (hasByte1) {
      output += symbolAt(((byte1 & 0x0f) << 2) | (hasByte2 ? byte2 >> 6 : 0));
    }

    if (hasByte2) {
      output += symbolAt(byte2 & 0x3f);
    }
  }

  return output;
}

/**
 * Decodifica base64url estrito.
 *
 * Falha fechada: padding `=`, caracteres fora do alfabeto, espaços em branco e
 * comprimento impossível são rejeitados em vez de tolerados. Aceitar variações
 * abriria espaço para dois encodings do mesmo ciphertext.
 */
export function fromBase64Url(value: string): Uint8Array {
  if (value.length % 4 === 1) {
    throw new CryptoFormatError('Comprimento inválido para base64url.');
  }

  const bytes: number[] = [];
  let buffer = 0;
  let bitsCollected = 0;

  for (const character of value) {
    const sextet = DECODE_TABLE.get(character);

    if (sextet === undefined) {
      throw new CryptoFormatError('Caractere inválido em base64url.');
    }

    buffer = (buffer << 6) | sextet;
    bitsCollected += 6;

    if (bitsCollected >= 8) {
      bitsCollected -= 8;
      bytes.push((buffer >> bitsCollected) & 0xff);

      // Descarta os bits já consumidos. Sem isso o acumulador cresce a cada
      // caractere e estoura os 32 bits dos operadores bitwise do JavaScript,
      // corrompendo o resultado a partir de entradas longas.
      buffer &= (1 << bitsCollected) - 1;
    }
  }

  // Os bits restantes são padding do último grupo e precisam ser todos zero.
  // Bits diferentes de zero indicam um encoding não canônico.
  if (bitsCollected > 0 && (buffer & ((1 << bitsCollected) - 1)) !== 0) {
    throw new CryptoFormatError('Encoding base64url não canônico.');
  }

  return Uint8Array.from(bytes);
}
