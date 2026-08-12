import { describe, expect, it } from 'vitest';

import { type AeadAdapter, type RandomSource } from '../adapters/crypto-adapters';
import { fromBase64Url, toBase64Url } from '../encoding/base64url';
import { encodeUtf8 } from '../encoding/utf8';
import { CryptoFormatError, CryptoVersionError } from '../errors';
import { serializeAad } from '../format/aad';
import { AEAD_ALGORITHM, AEAD_NONCE_BYTES, CURRENT_CRYPTO_VERSION } from '../format/crypto-payload';
import {
  decryptVaultMetadata,
  encryptVaultMetadata,
  VAULT_METADATA_LIMITS,
  VAULT_METADATA_SCHEMA_VERSION,
} from './vault-metadata';

/**
 * Adapters de registro. O que se prova aqui é qual AAD foi construída, o que
 * entra no texto claro e o que a validação recusa — nos dois sentidos. A falha
 * diante de adulteração é provada em `@crypta/crypto-web`, com as primitivas.
 */
const VAULT_ID = '0198e4c1-7f3a-7bcd-8f01-2c4a6b8d0e12';
const VAULT_KEY = new Uint8Array(32).fill(0x5c);
const NONCE_FILL = 0x7f;

function stubs(): { aead: AeadAdapter; random: RandomSource; aadSeen: string[] } {
  const aadSeen: string[] = [];
  const decoder = new TextDecoder();

  const aead: AeadAdapter = {
    encrypt({ plaintext, aad }) {
      aadSeen.push(decoder.decode(aad));

      return Promise.resolve(plaintext.map((byte) => byte ^ 0xff));
    },
    decrypt({ ciphertext, aad }) {
      aadSeen.push(decoder.decode(aad));

      return Promise.resolve(ciphertext.map((byte) => byte ^ 0xff));
    },
  };

  const random: RandomSource = {
    getRandomBytes: (length) => new Uint8Array(length).fill(NONCE_FILL),
  };

  return { aead, random, aadSeen };
}

/** Texto claro no formato que o adapter de registro devolveria. */
function sealedFrom(json: string): string {
  return toBase64Url(encodeUtf8(json).map((byte) => byte ^ 0xff));
}

const EXPECTED_AAD = serializeAad({
  scope: 'vault',
  entityType: 'vault',
  entityId: VAULT_ID,
  vaultId: VAULT_ID,
  schemaVersion: VAULT_METADATA_SCHEMA_VERSION,
  cryptoVersion: CURRENT_CRYPTO_VERSION,
});

describe('cifragem da metadata do cofre', () => {
  it('amarra a AAD ao id do cofre, nos dois campos do escopo', async () => {
    const { aead, random, aadSeen } = stubs();

    await encryptVaultMetadata({
      aead,
      random,
      vaultKey: VAULT_KEY,
      vaultId: VAULT_ID,
      metadata: { name: 'Pessoal' },
    });

    expect(aadSeen).toEqual([EXPECTED_AAD]);
    expect(EXPECTED_AAD).toContain(`36:${VAULT_ID}|36:${VAULT_ID}`);
  });

  it('declara a versão de schema e o algoritmo no payload', async () => {
    const { aead, random } = stubs();

    const payload = await encryptVaultMetadata({
      aead,
      random,
      vaultKey: VAULT_KEY,
      vaultId: VAULT_ID,
      metadata: { name: 'Pessoal' },
    });

    expect(payload.schemaVersion).toBe(VAULT_METADATA_SCHEMA_VERSION);
    expect(payload.cryptoVersion).toBe(CURRENT_CRYPTO_VERSION);
    expect(payload.algorithm).toBe(AEAD_ALGORITHM);
    expect(fromBase64Url(payload.nonce)).toHaveLength(AEAD_NONCE_BYTES);
  });

  it('não deixa o nome em texto aberto em nenhum campo do payload', async () => {
    const { aead, random } = stubs();

    const payload = await encryptVaultMetadata({
      aead,
      random,
      vaultKey: VAULT_KEY,
      vaultId: VAULT_ID,
      metadata: { name: 'Pessoal', description: 'Contas do dia a dia' },
    });

    expect(JSON.stringify(payload)).not.toContain('Pessoal');
    expect(JSON.stringify(payload)).not.toContain('Contas');
  });

  it('faz roundtrip com descrição', async () => {
    const { aead, random } = stubs();
    const metadata = { name: 'Trabalho', description: 'Acessos da equipe' };

    const payload = await encryptVaultMetadata({
      aead,
      random,
      vaultKey: VAULT_KEY,
      vaultId: VAULT_ID,
      metadata,
    });

    await expect(
      decryptVaultMetadata({ aead, vaultKey: VAULT_KEY, vaultId: VAULT_ID, payload }),
    ).resolves.toEqual(metadata);
  });

  /**
   * Campo ausente e campo com string vazia descreveriam o mesmo estado com
   * ciphertexts diferentes, e a diferença sobreviveria a toda edição futura.
   */
  it('trata descrição vazia como ausente', async () => {
    const { aead, random } = stubs();

    const payload = await encryptVaultMetadata({
      aead,
      random,
      vaultKey: VAULT_KEY,
      vaultId: VAULT_ID,
      metadata: { name: 'Pessoal', description: '' },
    });

    await expect(
      decryptVaultMetadata({ aead, vaultKey: VAULT_KEY, vaultId: VAULT_ID, payload }),
    ).resolves.toEqual({ name: 'Pessoal' });
  });

  it('recusa cofre sem nome', async () => {
    const { aead, random } = stubs();

    for (const name of ['', '   ']) {
      await expect(
        encryptVaultMetadata({
          aead,
          random,
          vaultKey: VAULT_KEY,
          vaultId: VAULT_ID,
          metadata: { name },
        }),
      ).rejects.toThrow(CryptoFormatError);
    }
  });

  it('recusa nome e descrição acima do limite do formato', async () => {
    const { aead, random } = stubs();

    await expect(
      encryptVaultMetadata({
        aead,
        random,
        vaultKey: VAULT_KEY,
        vaultId: VAULT_ID,
        metadata: { name: 'a'.repeat(VAULT_METADATA_LIMITS.name + 1) },
      }),
    ).rejects.toThrow(CryptoFormatError);

    await expect(
      encryptVaultMetadata({
        aead,
        random,
        vaultKey: VAULT_KEY,
        vaultId: VAULT_ID,
        metadata: {
          name: 'Pessoal',
          description: 'a'.repeat(VAULT_METADATA_LIMITS.description + 1),
        },
      }),
    ).rejects.toThrow(CryptoFormatError);
  });

  it('recusa nonce de tamanho errado vindo da fonte', async () => {
    const { aead } = stubs();

    await expect(
      encryptVaultMetadata({
        aead,
        random: { getRandomBytes: () => new Uint8Array(8) },
        vaultKey: VAULT_KEY,
        vaultId: VAULT_ID,
        metadata: { name: 'Pessoal' },
      }),
    ).rejects.toThrow(CryptoFormatError);
  });
});

describe('abertura da metadata do cofre', () => {
  async function payloadOf(metadata: { name: string; description?: string }) {
    const { aead, random } = stubs();

    return encryptVaultMetadata({
      aead,
      random,
      vaultKey: VAULT_KEY,
      vaultId: VAULT_ID,
      metadata,
    });
  }

  it('reconstrói a AAD com o id que o chamador pediu', async () => {
    const payload = await payloadOf({ name: 'Pessoal' });
    const { aead, aadSeen } = stubs();

    await decryptVaultMetadata({ aead, vaultKey: VAULT_KEY, vaultId: VAULT_ID, payload });

    expect(aadSeen).toEqual([EXPECTED_AAD]);
  });

  /**
   * Um cliente antigo diante de uma forma futura precisa parar, não interpretar
   * campos que ele não conhece.
   */
  it('recusa versão de schema desconhecida antes de decifrar', async () => {
    const payload = await payloadOf({ name: 'Pessoal' });
    const { aead, aadSeen } = stubs();

    await expect(
      decryptVaultMetadata({
        aead,
        vaultKey: VAULT_KEY,
        vaultId: VAULT_ID,
        payload: { ...payload, schemaVersion: 2 },
      }),
    ).rejects.toThrow(CryptoFormatError);

    expect(aadSeen).toEqual([]);
  });

  it('recusa versão criptográfica desconhecida', async () => {
    const payload = await payloadOf({ name: 'Pessoal' });
    const { aead } = stubs();

    await expect(
      decryptVaultMetadata({
        aead,
        vaultKey: VAULT_KEY,
        vaultId: VAULT_ID,
        payload: { ...payload, cryptoVersion: 2 },
      }),
    ).rejects.toThrow(CryptoVersionError);
  });

  it('recusa payload sem os campos obrigatórios', async () => {
    const payload = await payloadOf({ name: 'Pessoal' });
    const { aead } = stubs();

    await expect(
      decryptVaultMetadata({
        aead,
        vaultKey: VAULT_KEY,
        vaultId: VAULT_ID,
        payload: { ...payload, nonce: undefined },
      }),
    ).rejects.toThrow(CryptoFormatError);
  });

  /**
   * A AEAD garante que ninguém alterou os bytes; não garante que eles descrevem
   * uma metadata. Um payload legítimo de outra coisa abriria sem erro.
   */
  it('recusa texto claro que não descreve uma metadata', async () => {
    const payload = await payloadOf({ name: 'Pessoal' });
    const { aead } = stubs();

    const invalid = [
      'não é json',
      '[]',
      '"texto"',
      '{}',
      '{"name":""}',
      '{"name":"a","description":7}',
    ];

    for (const json of invalid) {
      await expect(
        decryptVaultMetadata({
          aead,
          vaultKey: VAULT_KEY,
          vaultId: VAULT_ID,
          payload: { ...payload, ciphertext: sealedFrom(json) },
        }),
      ).rejects.toThrow(CryptoFormatError);
    }
  });
});
