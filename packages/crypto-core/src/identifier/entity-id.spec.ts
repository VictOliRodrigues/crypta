import { describe, expect, it } from 'vitest';

import { type RandomSource } from '../adapters/crypto-adapters';
import { CryptoFormatError } from '../errors';
import { createEntityId } from './entity-id';

const UUID_SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function fixedRandom(fill: number, length = 10): RandomSource {
  return { getRandomBytes: () => new Uint8Array(length).fill(fill) };
}

/** Milissegundos de um instante conhecido, para conferir os 48 bits altos. */
const INSTANT = 1_754_900_000_000;

function timestampOf(id: string): number {
  return Number.parseInt(id.slice(0, 8) + id.slice(9, 13), 16);
}

describe('identificador de entidade cifrada', () => {
  it('tem a forma de um UUID', () => {
    expect(createEntityId(fixedRandom(0x5a), INSTANT)).toMatch(UUID_SHAPE);
  });

  it('declara a versão 7 e a variante RFC 4122', () => {
    const id = createEntityId(fixedRandom(0xff), INSTANT);

    expect(id[14]).toBe('7');
    expect(['8', '9', 'a', 'b']).toContain(id[19]);
  });

  /**
   * A variante fica nos dois bits altos do byte 8, e o resto do byte continua
   * aleatório. Zerar a fonte prova que os bits fixos são realmente fixos.
   */
  it('mantém os bits fixos com a fonte zerada', () => {
    const id = createEntityId(fixedRandom(0x00), INSTANT);

    expect(id[14]).toBe('7');
    expect(id[19]).toBe('8');
  });

  it('embute o instante nos 48 bits mais altos', () => {
    expect(timestampOf(createEntityId(fixedRandom(0x00), INSTANT))).toBe(INSTANT);
  });

  /**
   * O instante ocupa 48 bits, acima do que `>>` alcança. Um deslocamento de 32
   * bits truncaria o valor sem erro — este caso é o que reprova essa versão.
   */
  it('preserva instantes acima de 2³²', () => {
    const late = 2 ** 45 + 12_345;

    expect(timestampOf(createEntityId(fixedRandom(0x00), late))).toBe(late);
  });

  it('pede exatamente 10 bytes à fonte de aleatoriedade', () => {
    const requested: number[] = [];

    const random: RandomSource = {
      getRandomBytes: (length) => {
        requested.push(length);

        return new Uint8Array(length).fill(0x11);
      },
    };

    createEntityId(random, INSTANT);

    expect(requested).toEqual([10]);
  });

  it('recusa fonte que devolve menos bytes do que os pedidos', () => {
    expect(() => createEntityId(fixedRandom(0x11, 4), INSTANT)).toThrow(CryptoFormatError);
  });

  it('recusa instante fora da faixa representável', () => {
    expect(() => createEntityId(fixedRandom(0x11), 2 ** 48)).toThrow(CryptoFormatError);
    expect(() => createEntityId(fixedRandom(0x11), -1)).toThrow(CryptoFormatError);
    expect(() => createEntityId(fixedRandom(0x11), 1.5)).toThrow(CryptoFormatError);
  });

  it('produz ids diferentes no mesmo instante', () => {
    let counter = 0;

    const random: RandomSource = {
      getRandomBytes: (length) => {
        counter += 1;

        return new Uint8Array(length).fill(counter);
      },
    };

    expect(createEntityId(random, INSTANT)).not.toBe(createEntityId(random, INSTANT));
  });

  /** Propriedade da v7 que a v4 não tem, e a razão de o ADR 0019 tê-la escolhido. */
  it('ordena lexicograficamente na mesma ordem dos instantes', () => {
    const older = createEntityId(fixedRandom(0xff), INSTANT);
    const newer = createEntityId(fixedRandom(0x00), INSTANT + 1);

    expect(older < newer).toBe(true);
  });
});
