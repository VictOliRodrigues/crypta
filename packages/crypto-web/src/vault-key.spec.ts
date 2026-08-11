/**
 * `VaultKey` e envelopes, exercitados contra as primitivas reais.
 *
 * `@crypta/crypto-core` prova a fiação com adapters de registro: o que foi
 * passado, o que a validação recusa. Aqui a mesma orquestração passa pelo
 * `crypto.subtle` e pelo libsodium, que é onde adulteração precisa falhar.
 *
 * O que se prova é o caminho que a aplicação chama — `createVaultKey`,
 * `createVaultKeyEnvelope`, `openVaultKeyEnvelope` — e não o enquadramento
 * cru, já coberto em `identity.spec.ts`. Testar só a camada de baixo deixaria
 * a orquestração livre para montar o envelope errado com primitivas certas.
 */

import { describe, expect, it } from 'vitest';

import {
  createVaultKey,
  createVaultKeyEnvelope,
  CryptoAlgorithmError,
  CryptoAuthenticationError,
  fromBase64Url,
  INITIAL_KEY_VERSION,
  KEY_ENVELOPE_ALGORITHM,
  type KeyEnvelope,
  type KeyPair,
  openVaultKeyEnvelope,
  parseKeyEnvelope,
  toBase64Url,
  VAULT_KEY_BYTES,
} from '@crypta/crypto-core';

import { webKeyExchangeAdapter } from './key-exchange';
import { webRandomSource } from './random';
import { initSodium } from './sodium';

async function expectAuthenticationFailure(promise: Promise<unknown>): Promise<void> {
  const error: unknown = await promise.then(
    () => undefined,
    (caught: unknown) => caught,
  );

  expect(error).toBeInstanceOf(CryptoAuthenticationError);
}

function flipByte(bytes: Uint8Array, index: number): Uint8Array {
  const copy = Uint8Array.from(bytes);
  copy.set([(copy.at(index) ?? 0) ^ 0xff], index);

  return copy;
}

async function sealForOwner(): Promise<{
  owner: KeyPair;
  vaultKey: Uint8Array;
  envelope: KeyEnvelope;
}> {
  await initSodium();

  const owner = await webKeyExchangeAdapter.generateKeyPair();
  const vaultKey = createVaultKey(webRandomSource);

  const envelope = await createVaultKeyEnvelope({
    keyExchange: webKeyExchangeAdapter,
    vaultKey,
    recipientPublicKey: owner.publicKey,
  });

  return { owner, vaultKey, envelope };
}

describe('geração da VaultKey no navegador', () => {
  it('devolve 32 bytes do CSPRNG da plataforma', () => {
    const vaultKey = createVaultKey(webRandomSource);

    expect(vaultKey).toHaveLength(VAULT_KEY_BYTES);
  });

  it('nunca repete uma VaultKey', () => {
    const keys = new Set(
      Array.from({ length: 64 }, () => Array.from(createVaultKey(webRandomSource)).join()),
    );

    expect(keys.size).toBe(64);
  });
});

describe('envelope OWNER com primitivas reais', () => {
  it('faz roundtrip da VaultKey', async () => {
    const { owner, vaultKey, envelope } = await sealForOwner();

    const opened = await openVaultKeyEnvelope({
      keyExchange: webKeyExchangeAdapter,
      recipientKeyPair: owner,
      envelope,
    });

    expect(opened).toEqual(vaultKey);
  });

  it('produz um envelope no formato da API secao 15', async () => {
    const { envelope } = await sealForOwner();

    expect(parseKeyEnvelope({ ...envelope })).toEqual(envelope);
    expect(envelope.algorithm).toBe(KEY_ENVELOPE_ALGORITHM);
    expect(envelope.keyVersion).toBe(INITIAL_KEY_VERSION);
    expect(Object.keys(envelope)).not.toContain('nonce');
  });

  /**
   * Par efêmero novo por envelope. É o que garante que a chave da AEAD nunca se
   * repita — e, com ela, o nonce derivado.
   */
  it('gera chave efêmera diferente a cada envelope da mesma VaultKey', async () => {
    const { owner, vaultKey } = await sealForOwner();

    const first = await createVaultKeyEnvelope({
      keyExchange: webKeyExchangeAdapter,
      vaultKey,
      recipientPublicKey: owner.publicKey,
    });

    const second = await createVaultKeyEnvelope({
      keyExchange: webKeyExchangeAdapter,
      vaultKey,
      recipientPublicKey: owner.publicKey,
    });

    expect(second.ephemeralPublicKey).not.toBe(first.ephemeralPublicKey);
    expect(second.encryptedVaultKey).not.toBe(first.encryptedVaultKey);
  });

  it('não expõe a VaultKey em nenhum campo do envelope', async () => {
    const { vaultKey, envelope } = await sealForOwner();

    const serialized = JSON.stringify(envelope);

    expect(serialized).not.toContain(toBase64Url(vaultKey));
  });

  it('não abre com a chave privada de outro usuário', async () => {
    const { envelope } = await sealForOwner();
    const intruder = await webKeyExchangeAdapter.generateKeyPair();

    await expectAuthenticationFailure(
      openVaultKeyEnvelope({
        keyExchange: webKeyExchangeAdapter,
        recipientKeyPair: intruder,
        envelope,
      }),
    );
  });

  it('falha fechado com a VaultKey cifrada adulterada, byte a byte', async () => {
    const { owner, envelope } = await sealForOwner();
    const encrypted = fromBase64Url(envelope.encryptedVaultKey);

    for (let index = 0; index < encrypted.length; index += 1) {
      await expectAuthenticationFailure(
        openVaultKeyEnvelope({
          keyExchange: webKeyExchangeAdapter,
          recipientKeyPair: owner,
          envelope: { ...envelope, encryptedVaultKey: toBase64Url(flipByte(encrypted, index)) },
        }),
      );
    }
  });

  it('falha fechado com a chave pública efêmera adulterada, byte a byte', async () => {
    const { owner, envelope } = await sealForOwner();
    const ephemeral = fromBase64Url(envelope.ephemeralPublicKey);

    for (let index = 0; index < ephemeral.length; index += 1) {
      await expectAuthenticationFailure(
        openVaultKeyEnvelope({
          keyExchange: webKeyExchangeAdapter,
          recipientKeyPair: owner,
          envelope: { ...envelope, ephemeralPublicKey: toBase64Url(flipByte(ephemeral, index)) },
        }),
      );
    }
  });

  /**
   * Trocar a versão declarada não abre outro envelope, mas também não pode
   * passar despercebido: o campo não é autenticado, e é por isso que ele não
   * carrega decisão de segurança nenhuma — só diz qual geração de chave é.
   */
  it('abre com a versão de chave alterada, que não é campo autenticado', async () => {
    const { owner, vaultKey, envelope } = await sealForOwner();

    const opened = await openVaultKeyEnvelope({
      keyExchange: webKeyExchangeAdapter,
      recipientKeyPair: owner,
      envelope: { ...envelope, keyVersion: 2 },
    });

    expect(opened).toEqual(vaultKey);
  });

  it('recusa envelope de outro algoritmo antes de tocar nas primitivas', async () => {
    const { owner, envelope } = await sealForOwner();

    await expect(
      openVaultKeyEnvelope({
        keyExchange: webKeyExchangeAdapter,
        recipientKeyPair: owner,
        envelope: { ...envelope, algorithm: 'X25519-XCHACHA20-POLY1305' },
      }),
    ).rejects.toThrow(CryptoAlgorithmError);
  });
});

describe('envelope para um segundo membro', () => {
  /**
   * O caminho do EDITOR da R0.5 é este mesmo, com outro destinatário. Vale
   * exercitá-lo agora: se os dois papéis divergirem em formato, a divergência
   * aparece quando houver convite, não quando houver teste.
   */
  it('entrega a mesma VaultKey a dois destinatários diferentes', async () => {
    const { owner, vaultKey, envelope } = await sealForOwner();
    const member = await webKeyExchangeAdapter.generateKeyPair();

    const memberEnvelope = await createVaultKeyEnvelope({
      keyExchange: webKeyExchangeAdapter,
      vaultKey,
      recipientPublicKey: member.publicKey,
    });

    expect(memberEnvelope.encryptedVaultKey).not.toBe(envelope.encryptedVaultKey);

    const openedByOwner = await openVaultKeyEnvelope({
      keyExchange: webKeyExchangeAdapter,
      recipientKeyPair: owner,
      envelope,
    });

    const openedByMember = await openVaultKeyEnvelope({
      keyExchange: webKeyExchangeAdapter,
      recipientKeyPair: member,
      envelope: memberEnvelope,
    });

    expect(openedByOwner).toEqual(vaultKey);
    expect(openedByMember).toEqual(vaultKey);
  });

  it('não deixa um membro abrir o envelope do outro', async () => {
    const { vaultKey } = await sealForOwner();
    const member = await webKeyExchangeAdapter.generateKeyPair();
    const outsider = await webKeyExchangeAdapter.generateKeyPair();

    const memberEnvelope = await createVaultKeyEnvelope({
      keyExchange: webKeyExchangeAdapter,
      vaultKey,
      recipientPublicKey: member.publicKey,
    });

    await expectAuthenticationFailure(
      openVaultKeyEnvelope({
        keyExchange: webKeyExchangeAdapter,
        recipientKeyPair: outsider,
        envelope: memberEnvelope,
      }),
    );
  });
});
