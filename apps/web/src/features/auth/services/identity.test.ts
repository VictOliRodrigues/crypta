/**
 * @vitest-environment node
 *
 * O jsdom substitui os globais por versões do próprio realm, e o libsodium
 * recusa um `Uint8Array` que não seja o dele — "unsupported input type for
 * password". O mesmo motivo pelo qual `crypto-bundle.test.ts` roda em node.
 *
 * Isso não enfraquece o teste: a corretude no navegador é garantida pelos
 * adapters, que `@crypta/crypto-web` exercita contra `@noble/*`, e pelo teste
 * de bundle que recusa o fallback `wasm2js`.
 */

import { describe, expect, it } from 'vitest';

import { IDENTITY_PRODUCTION_VECTOR } from '@crypta/crypto-core';

import { buildKeyBundle, deriveIdentity, generateKdfParameters } from './identity';

/**
 * Derivação no navegador.
 *
 * O item de gate: **a senha original não é enviada à API**. O que sai daqui é o
 * `AuthSecret` em base64url e a `UserEncryptionKey`, que fica em memória.
 *
 * A corretude das primitivas é provada em `@crypta/crypto-web`, contra
 * `@noble/*`. O que este arquivo confere é a fronteira: o que entra, o que sai, e
 * o que não sai.
 */

const VECTOR = IDENTITY_PRODUCTION_VECTOR;

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

describe('deriveIdentity', () => {
  it('reproduz o vetor congelado no navegador', async () => {
    const identity = await deriveIdentity({
      password: VECTOR.password,
      parameters: VECTOR.parameters,
    });

    expect(Buffer.from(identity.authSecret, 'base64url').toString('hex')).toBe(
      VECTOR.authSecretHex,
    );
    expect(toHex(identity.userEncryptionKey)).toBe(VECTOR.userEncryptionKeyHex);
  }, 60_000);

  it('devolve o AuthSecret em base64url, pronto para trafegar', async () => {
    const identity = await deriveIdentity({
      password: VECTOR.password,
      parameters: VECTOR.parameters,
    });

    expect(identity.authSecret).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(Buffer.from(identity.authSecret, 'base64url')).toHaveLength(32);
  }, 60_000);

  /**
   * O que o gate da fase exige: nada do que sai desta função permite reconstruir
   * a senha, e a senha não aparece em nenhum dos valores devolvidos.
   */
  it('não devolve a senha, nem nada que a contenha', async () => {
    const password = 'senha-muito-secreta-de-teste';

    const identity = await deriveIdentity({
      password,
      parameters: VECTOR.parameters,
    });

    expect(JSON.stringify(identity)).not.toContain(password);
    expect(identity.authSecret).not.toContain(password);
  }, 60_000);
});

describe('generateKdfParameters', () => {
  it('usa os parâmetros do ADR 0018', async () => {
    const parameters = await generateKdfParameters();

    expect(parameters.memoryKib).toBe(65536);
    expect(parameters.iterations).toBe(3);
    expect(parameters.parallelism).toBe(1);
  });

  it('gera salt de 16 bytes, que é o que o libsodium aceita', async () => {
    const parameters = await generateKdfParameters();

    expect(Buffer.from(parameters.salt, 'base64url')).toHaveLength(16);
  });

  it('gera um salt diferente a cada chamada', async () => {
    const first = await generateKdfParameters();
    const second = await generateKdfParameters();

    expect(second.salt).not.toBe(first.salt);
  });
});

describe('buildKeyBundle', () => {
  it('produz um bundle sem a chave privada em texto aberto', async () => {
    const userEncryptionKey = new Uint8Array(32).fill(0x11);

    const { bundle, keyPair } = await buildKeyBundle({
      userEncryptionKey,
      parameters: VECTOR.parameters,
    });

    const serialized = JSON.stringify(bundle);

    expect(serialized).not.toContain(Buffer.from(keyPair.privateKey).toString('base64url'));
    expect(bundle.encryptedPrivateKey.length).toBeGreaterThan(0);
    expect(bundle.publicKey).toBe(Buffer.from(keyPair.publicKey).toString('base64url'));
  });

  it('carrega os parâmetros KDF que o cliente vai precisar no próximo login', async () => {
    const { bundle } = await buildKeyBundle({
      userEncryptionKey: new Uint8Array(32).fill(0x22),
      parameters: VECTOR.parameters,
    });

    expect(bundle.kdfSalt).toBe(VECTOR.parameters.salt);
    expect(bundle.kdfMemory).toBe(VECTOR.parameters.memoryKib);
    expect(bundle.kdfAlgorithm).toBe('ARGON2ID');
  });
});
