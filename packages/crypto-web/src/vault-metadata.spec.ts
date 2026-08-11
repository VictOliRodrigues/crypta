/**
 * Metadata do cofre, exercitada contra as primitivas reais.
 *
 * O teste que dá sentido a todo o resto é o da troca: a metadata de um cofre
 * apresentada sob o id de outro precisa falhar. É para isso que a AAD existe, e
 * é por isso que o [ADR 0025](../../../docs/decisions/0025-client-generated-identifiers.md)
 * fez o id nascer no cliente — sem ele não haveria a que amarrar.
 */

import { describe, expect, it } from 'vitest';

import {
  createEntityId,
  createVaultKey,
  CryptoAuthenticationError,
  CryptoFormatError,
  decryptVaultMetadata,
  encryptVaultMetadata,
  fromBase64Url,
  toBase64Url,
  type VaultMetadata,
} from '@crypta/crypto-core';

import { webAeadAdapter } from './aead';
import { webRandomSource } from './random';
import { initSodium } from './sodium';

const UUID_V7_SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const METADATA: VaultMetadata = { name: 'Pessoal', description: 'Contas do dia a dia' };

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

async function sealMetadata(metadata: VaultMetadata = METADATA) {
  await initSodium();

  const vaultId = createEntityId(webRandomSource);
  const vaultKey = createVaultKey(webRandomSource);

  const payload = await encryptVaultMetadata({
    aead: webAeadAdapter,
    random: webRandomSource,
    vaultKey,
    vaultId,
    metadata,
  });

  return { vaultId, vaultKey, payload };
}

describe('identificador gerado no navegador', () => {
  it('produz UUIDv7 a partir do CSPRNG da plataforma', () => {
    expect(createEntityId(webRandomSource)).toMatch(UUID_V7_SHAPE);
  });

  it('não repete um identificador', () => {
    const ids = new Set(Array.from({ length: 256 }, () => createEntityId(webRandomSource)));

    expect(ids.size).toBe(256);
  });
});

describe('metadata do cofre com primitivas reais', () => {
  it('faz roundtrip de nome e descrição', async () => {
    const { vaultId, vaultKey, payload } = await sealMetadata();

    await expect(
      decryptVaultMetadata({ aead: webAeadAdapter, vaultKey, vaultId, payload }),
    ).resolves.toEqual(METADATA);
  });

  it('faz roundtrip sem descrição', async () => {
    const { vaultId, vaultKey, payload } = await sealMetadata({ name: 'Só o nome' });

    await expect(
      decryptVaultMetadata({ aead: webAeadAdapter, vaultKey, vaultId, payload }),
    ).resolves.toEqual({ name: 'Só o nome' });
  });

  it('preserva acentuação e emoji', async () => {
    const metadata = { name: 'Cofre da família 🔐', description: 'Ação, coração, não' };
    const { vaultId, vaultKey, payload } = await sealMetadata(metadata);

    await expect(
      decryptVaultMetadata({ aead: webAeadAdapter, vaultKey, vaultId, payload }),
    ).resolves.toEqual(metadata);
  });

  it('não deixa o nome nem a descrição no payload', async () => {
    const { payload } = await sealMetadata();

    expect(JSON.stringify(payload)).not.toContain('Pessoal');
    expect(JSON.stringify(payload)).not.toContain('dia a dia');
  });

  it('gera nonce e ciphertext diferentes a cada cifragem do mesmo conteúdo', async () => {
    const { vaultId, vaultKey, payload } = await sealMetadata();

    const again = await encryptVaultMetadata({
      aead: webAeadAdapter,
      random: webRandomSource,
      vaultKey,
      vaultId,
      metadata: METADATA,
    });

    expect(again.nonce).not.toBe(payload.nonce);
    expect(again.ciphertext).not.toBe(payload.ciphertext);
  });

  /**
   * O ataque que a AAD existe para impedir: um servidor devolve a metadata do
   * cofre A na resposta do cofre B. O usuário veria o nome errado e poderia
   * guardar a senha no cofre errado — que, com compartilhamento, é entregá-la a
   * quem não deveria.
   */
  it('falha fechado quando a metadata é apresentada sob outro id de cofre', async () => {
    const { vaultKey, payload } = await sealMetadata();
    const otherVaultId = createEntityId(webRandomSource);

    await expectAuthenticationFailure(
      decryptVaultMetadata({
        aead: webAeadAdapter,
        vaultKey,
        vaultId: otherVaultId,
        payload,
      }),
    );
  });

  it('falha fechado com a VaultKey de outro cofre', async () => {
    const { vaultId, payload } = await sealMetadata();
    const otherVaultKey = createVaultKey(webRandomSource);

    await expectAuthenticationFailure(
      decryptVaultMetadata({
        aead: webAeadAdapter,
        vaultKey: otherVaultKey,
        vaultId,
        payload,
      }),
    );
  });

  it('falha fechado com o ciphertext adulterado, byte a byte', async () => {
    const { vaultId, vaultKey, payload } = await sealMetadata({ name: 'Curto' });
    const ciphertext = fromBase64Url(payload.ciphertext);

    for (let index = 0; index < ciphertext.length; index += 1) {
      await expectAuthenticationFailure(
        decryptVaultMetadata({
          aead: webAeadAdapter,
          vaultKey,
          vaultId,
          payload: { ...payload, ciphertext: toBase64Url(flipByte(ciphertext, index)) },
        }),
      );
    }
  });

  it('falha fechado com o nonce adulterado, byte a byte', async () => {
    const { vaultId, vaultKey, payload } = await sealMetadata({ name: 'Curto' });
    const nonce = fromBase64Url(payload.nonce);

    for (let index = 0; index < nonce.length; index += 1) {
      await expectAuthenticationFailure(
        decryptVaultMetadata({
          aead: webAeadAdapter,
          vaultKey,
          vaultId,
          payload: { ...payload, nonce: toBase64Url(flipByte(nonce, index)) },
        }),
      );
    }
  });

  /**
   * A versão declarada não é campo autenticado do payload, mas é lida antes do
   * decrypt: alterá-la faz o cliente parar, e não interpretar bytes sob uma
   * forma que ele não conhece.
   */
  it('recusa versão de schema desconhecida sem tentar decifrar', async () => {
    const { vaultId, vaultKey, payload } = await sealMetadata();

    await expect(
      decryptVaultMetadata({
        aead: webAeadAdapter,
        vaultKey,
        vaultId,
        payload: { ...payload, schemaVersion: 99 },
      }),
    ).rejects.toThrow(CryptoFormatError);
  });
});
