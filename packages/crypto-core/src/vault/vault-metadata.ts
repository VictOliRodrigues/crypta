import { type AeadAdapter, type KeyMaterial, type RandomSource } from '../adapters/crypto-adapters';
import { fromBase64Url } from '../encoding/base64url';
import { decodeUtf8, encodeUtf8 } from '../encoding/utf8';
import { CryptoFormatError } from '../errors';
import { buildAad } from '../format/aad';
import {
  AEAD_NONCE_BYTES,
  buildCipherPayload,
  type CipherPayload,
  CURRENT_CRYPTO_VERSION,
  parseCipherPayload,
} from '../format/crypto-payload';

/**
 * Nome e descrição do cofre, protegidos pela `VaultKey` (ARCHITECTURE.md
 * secao 19, `BLG-0706`).
 *
 * É o primeiro conteúdo de produto que o sistema cifra. A API guarda o
 * resultado como blob opaco e não tem como saber como o cofre se chama —
 * `CLAUDE.md` secao 7 lista o nome do cofre entre o que o backend jamais pode
 * receber em texto aberto.
 *
 * A AAD amarra o ciphertext ao **id do cofre** (ADR 0023). Sem ela, um servidor
 * poderia devolver a metadata do cofre A na resposta do cofre B, e o usuário
 * veria o nome errado — num produto em que o cofre certo decide com quem a
 * credencial é compartilhada, guardar senha no cofre errado é o dano.
 *
 * O id vir do cliente (ADR 0025) é o que torna essa amarração possível: a
 * metadata é cifrada antes do `POST`, quando um id gerado pelo servidor ainda
 * não existiria.
 */

/**
 * Versão da forma do objeto em texto claro.
 *
 * Independente da versão criptográfica. Acrescentar campo aqui exige nova
 * versão e um leitor da anterior — nunca substituição silenciosa.
 */
export const VAULT_METADATA_SCHEMA_VERSION = 1;

export type VaultMetadata = {
  name: string;
  /** Ausente quando o usuário não preencheu. Nunca string vazia. */
  description?: string;
};

/**
 * Limites do texto claro, em unidades de código UTF-16.
 *
 * Existem para que um cliente defeituoso não produza um payload que a API
 * recusa por tamanho depois de o usuário ter digitado tudo. Os limites de
 * formulário vivem em `@crypta/validation`; estes são o piso do formato.
 */
export const VAULT_METADATA_LIMITS = {
  name: 200,
  description: 2000,
} as const;

function assertMetadata(metadata: VaultMetadata): void {
  if (typeof metadata.name !== 'string' || metadata.name.trim().length === 0) {
    throw new CryptoFormatError('O cofre precisa de um nome.');
  }

  if (metadata.name.length > VAULT_METADATA_LIMITS.name) {
    throw new CryptoFormatError('O nome do cofre excede o limite do formato.');
  }

  if (metadata.description !== undefined) {
    if (typeof metadata.description !== 'string') {
      throw new CryptoFormatError('A descrição do cofre deve ser texto.');
    }

    if (metadata.description.length > VAULT_METADATA_LIMITS.description) {
      throw new CryptoFormatError('A descrição do cofre excede o limite do formato.');
    }
  }
}

/**
 * A AAD do escopo `vault` para a metadata do próprio cofre.
 *
 * `entityId` e `vaultId` são o mesmo valor aqui, e isso não é redundância a
 * simplificar: site e credencial usam a mesma forma com `entityId` próprio, e
 * um caminho separado para o cofre faria duas serializações conviverem.
 */
function metadataAad(input: {
  vaultId: string;
  schemaVersion: number;
  cryptoVersion: number;
}): Uint8Array {
  return buildAad({
    scope: 'vault',
    entityType: 'vault',
    entityId: input.vaultId,
    vaultId: input.vaultId,
    schemaVersion: input.schemaVersion,
    cryptoVersion: input.cryptoVersion,
  });
}

/**
 * Cifra a metadata do cofre com a `VaultKey`.
 *
 * O nonce é novo a cada chamada. Editar o cofre produz um payload inteiro novo,
 * nunca uma reescrita parcial sobre o nonce anterior.
 */
export async function encryptVaultMetadata(input: {
  aead: AeadAdapter;
  random: RandomSource;
  vaultKey: KeyMaterial;
  vaultId: string;
  metadata: VaultMetadata;
}): Promise<CipherPayload> {
  assertMetadata(input.metadata);

  const plaintext: VaultMetadata = { name: input.metadata.name };

  // Descrição vazia não é gravada. Um campo presente com string vazia e um
  // campo ausente descreveriam o mesmo estado com dois bytes diferentes de
  // ciphertext, e a diferença sobreviveria a toda edição futura.
  if (input.metadata.description !== undefined && input.metadata.description.length > 0) {
    plaintext.description = input.metadata.description;
  }

  const nonce = input.random.getRandomBytes(AEAD_NONCE_BYTES);

  if (nonce.length !== AEAD_NONCE_BYTES) {
    throw new CryptoFormatError('A fonte de aleatoriedade devolveu um nonce de tamanho errado.');
  }

  const ciphertext = await input.aead.encrypt({
    key: input.vaultKey,
    nonce,
    plaintext: encodeUtf8(JSON.stringify(plaintext)),
    aad: metadataAad({
      vaultId: input.vaultId,
      schemaVersion: VAULT_METADATA_SCHEMA_VERSION,
      cryptoVersion: CURRENT_CRYPTO_VERSION,
    }),
  });

  return buildCipherPayload({
    schemaVersion: VAULT_METADATA_SCHEMA_VERSION,
    nonce,
    ciphertext,
  });
}

/**
 * Abre a metadata de um cofre.
 *
 * Falha fechado. `VaultKey` errada, ciphertext adulterado ou payload apresentado
 * sob outro `vaultId` lançam `CryptoAuthenticationError` vindo do adapter, sem
 * devolver nada parcial.
 *
 * O `vaultId` que entra aqui precisa ser o que o chamador **pediu**, não um que
 * tenha vindo dentro da resposta. Reaproveitar o id do corpo devolvido pelo
 * servidor anularia a amarração: ele passaria a poder trocar os dois juntos.
 */
export async function decryptVaultMetadata(input: {
  aead: AeadAdapter;
  vaultKey: KeyMaterial;
  vaultId: string;
  payload: unknown;
}): Promise<VaultMetadata> {
  const payload = parseCipherPayload(input.payload);

  if (payload.schemaVersion !== VAULT_METADATA_SCHEMA_VERSION) {
    throw new CryptoFormatError(
      `Versão de schema ${String(payload.schemaVersion)} da metadata não é suportada por este cliente.`,
    );
  }

  const plaintext = await input.aead.decrypt({
    key: input.vaultKey,
    nonce: fromBase64Url(payload.nonce),
    ciphertext: fromBase64Url(payload.ciphertext),
    aad: metadataAad({
      vaultId: input.vaultId,
      schemaVersion: payload.schemaVersion,
      cryptoVersion: payload.cryptoVersion,
    }),
  });

  return parseVaultMetadata(decodeUtf8(plaintext));
}

/**
 * Valida o texto claro que saiu da AEAD.
 *
 * A AEAD garante que ninguém alterou os bytes; não garante que eles descrevem
 * uma metadata. Um payload legítimo de outra coisa, cifrado com a mesma chave e
 * o mesmo contexto, abriria sem erro.
 */
function parseVaultMetadata(json: string): VaultMetadata {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch {
    throw new CryptoFormatError('A metadata aberta não é JSON válido.');
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new CryptoFormatError('A metadata aberta deve ser um objeto.');
  }

  const source = parsed as Record<string, unknown>;
  const name = source.name;

  if (typeof name !== 'string' || name.length === 0) {
    throw new CryptoFormatError('A metadata aberta não tem nome.');
  }

  const description = source.description;

  if (description === undefined) {
    return { name };
  }

  if (typeof description !== 'string') {
    throw new CryptoFormatError('A descrição da metadata aberta deve ser texto.');
  }

  return { name, description };
}
