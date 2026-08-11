import {
  type KeyExchangeAdapter,
  type KeyMaterial,
  type KeyPair,
  type RandomSource,
} from '../adapters/crypto-adapters';
import { CryptoFormatError } from '../errors';
import {
  buildKeyEnvelope,
  type KeyEnvelope,
  parseKeyEnvelope,
  sealedBytesFromEnvelope,
} from '../format/key-envelope';

/**
 * `VaultKey` e a distribuição dela por envelope (ARCHITECTURE.md secao 14.6,
 * ADR 0005).
 *
 * Cada cofre tem uma chave simétrica própria, que protege todo o conteúdo dele.
 * Ela nunca chega à API: cada membro recebe a mesma `VaultKey` selada para a
 * sua chave pública, e só a privada correspondente a recupera.
 *
 * Este módulo é a camada que o aplicativo chama. O enquadramento do blob mora
 * em `format/key-envelope`, e as primitivas moram no adapter da plataforma —
 * quem cria um cofre não deveria precisar conhecer nenhum dos dois, que é como
 * um chamador acaba fatiando bytes por conta própria.
 */

/** Tamanho da `VaultKey`. É a chave de uma XChaCha20-Poly1305. */
export const VAULT_KEY_BYTES = 32;

/**
 * Versão de chave de um cofre recém-criado.
 *
 * Incrementa a cada rekey (R0.5), quando a `VaultKey` é trocada e todos os
 * envelopes são refeitos. O número existe para que um envelope antigo, colhido
 * antes da troca, seja reconhecível como antigo em vez de simplesmente falhar.
 */
export const INITIAL_KEY_VERSION = 1;

const X25519_PUBLIC_KEY_BYTES = 32;

function assertKeyVersion(keyVersion: number): void {
  if (!Number.isInteger(keyVersion) || keyVersion < 1) {
    throw new CryptoFormatError('`keyVersion` do envelope deve ser um inteiro positivo.');
  }
}

/**
 * Gera uma `VaultKey` nova.
 *
 * As duas conferências não são sobre probabilidade — 32 bytes zerados têm
 * chance de 2⁻²⁵⁶ de sair de um CSPRNG. São sobre um adapter defeituoso: um
 * `Uint8Array` alocado e nunca preenchido tem exatamente esta cara, e cifrar o
 * cofre inteiro com uma chave de zeros falharia em silêncio, produzindo
 * ciphertext que abre para qualquer um que tente a chave óbvia.
 */
export function createVaultKey(random: RandomSource): KeyMaterial {
  const vaultKey = random.getRandomBytes(VAULT_KEY_BYTES);

  if (vaultKey.length !== VAULT_KEY_BYTES) {
    throw new CryptoFormatError(
      `A fonte de aleatoriedade devolveu ${String(vaultKey.length)} bytes; a VaultKey tem ${String(VAULT_KEY_BYTES)}.`,
    );
  }

  if (vaultKey.every((byte) => byte === 0)) {
    throw new CryptoFormatError('A fonte de aleatoriedade devolveu apenas zeros.');
  }

  return vaultKey;
}

/**
 * Sela a `VaultKey` para a chave pública de um membro.
 *
 * É o mesmo caminho para o envelope OWNER, criado junto do cofre, e para o
 * envelope EDITOR, criado ao aceitar um convite (R0.5): muda o destinatário, e
 * mais nada. Ter um único caminho é o que garante que os dois papéis recebam
 * envelopes com o mesmo formato — e que um rekey não precise saber quem é quem.
 *
 * O envelope não leva AAD. O vínculo com o destinatário vem do próprio KEM: a
 * chave da AEAD é derivada do segredo compartilhado e das duas chaves públicas,
 * então um envelope selado para outra pessoa não abre aqui.
 */
export async function createVaultKeyEnvelope(input: {
  keyExchange: KeyExchangeAdapter;
  vaultKey: KeyMaterial;
  /** Chave pública X25519 crua do destinatário. */
  recipientPublicKey: Uint8Array;
  keyVersion?: number;
}): Promise<KeyEnvelope> {
  const keyVersion = input.keyVersion ?? INITIAL_KEY_VERSION;

  assertKeyVersion(keyVersion);

  if (input.vaultKey.length !== VAULT_KEY_BYTES) {
    throw new CryptoFormatError('A VaultKey a selar não tem 32 bytes.');
  }

  if (input.recipientPublicKey.length !== X25519_PUBLIC_KEY_BYTES) {
    throw new CryptoFormatError('A chave pública do destinatário não tem 32 bytes.');
  }

  const sealed = await input.keyExchange.sealForPublicKey({
    recipientPublicKey: input.recipientPublicKey,
    plaintext: input.vaultKey,
  });

  return buildKeyEnvelope({ keyVersion, sealed });
}

/**
 * Abre um envelope e devolve a `VaultKey`.
 *
 * A validação estrutural vem antes de qualquer primitiva, de propósito: o
 * envelope chega do servidor, que é justamente quem não deveria conseguir
 * alterá-lo sem ser notado. Um envelope com algoritmo desconhecido é recusado
 * aqui, e não entregue ao adapter para ver o que acontece.
 *
 * Falha fechado. Envelope adulterado, endereçado a outra chave pública ou
 * aberto por outra chave privada lança `CryptoAuthenticationError` vindo do
 * adapter, sem devolver nada parcial.
 */
export async function openVaultKeyEnvelope(input: {
  keyExchange: KeyExchangeAdapter;
  recipientKeyPair: KeyPair;
  envelope: unknown;
}): Promise<KeyMaterial> {
  const envelope = parseKeyEnvelope(input.envelope);

  const vaultKey = await input.keyExchange.openWithPrivateKey({
    recipientKeyPair: input.recipientKeyPair,
    ciphertext: sealedBytesFromEnvelope(envelope),
  });

  // A AEAD já autenticou o conteúdo; o que resta conferir é se o que estava lá
  // dentro tem mesmo o tamanho de uma VaultKey. Um envelope legítimo de outra
  // coisa — construído por um cliente futuro com outro uso — abriria sem erro e
  // devolveria material do tamanho errado para cifrar o cofre.
  if (vaultKey.length !== VAULT_KEY_BYTES) {
    throw new CryptoFormatError('O envelope não continha uma VaultKey de 32 bytes.');
  }

  return vaultKey;
}
