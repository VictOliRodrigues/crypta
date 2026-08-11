import { type EncryptedPayload, type KeyEnvelopeView, type VaultSummary } from '@crypta/contracts';
import {
  createEntityId,
  createVaultKey,
  createVaultKeyEnvelope,
  decryptVaultMetadata,
  encryptVaultMetadata,
  type KeyPair,
  openVaultKeyEnvelope,
  type VaultMetadata,
} from '@crypta/crypto-core';
import { webAeadAdapter, webKeyExchangeAdapter, webRandomSource } from '@crypta/crypto-web';

/**
 * Criptografia dos cofres, no navegador.
 *
 * Este é o único lugar da Web que toca `VaultKey` e metadata em texto aberto.
 * Componentes não chamam `crypto-core` direto (`CLAUDE.md` secao 20): crypto
 * espalhada por componente é como um caminho acaba esquecendo a AAD.
 *
 * **A `VaultKey` não é guardada em lugar nenhum.** Ela é aberta do envelope a
 * cada uso e some quando a função retorna. Guardá-la num store manteria o
 * conteúdo do cofre acessível a código que rodasse depois — e o store de sessão
 * já carrega o que precisa carregar, que é o par do usuário.
 */

/** O que o cliente monta para criar um cofre. */
export type NewVaultMaterial = {
  id: string;
  encryptedMetadata: EncryptedPayload;
  ownerEnvelope: KeyEnvelopeView;
};

/**
 * Gera id, `VaultKey`, metadata cifrada e envelope do dono.
 *
 * O id nasce aqui porque a AAD da metadata se amarra a ele (ADR 0025), e a
 * ordem é obrigatória: sem o id, não há a que amarrar.
 */
export async function buildNewVault(input: {
  metadata: VaultMetadata;
  ownerPublicKey: Uint8Array;
}): Promise<NewVaultMaterial> {
  const id = createEntityId(webRandomSource);
  const vaultKey = createVaultKey(webRandomSource);

  const encryptedMetadata = await encryptVaultMetadata({
    aead: webAeadAdapter,
    random: webRandomSource,
    vaultKey,
    vaultId: id,
    metadata: input.metadata,
  });

  const ownerEnvelope = await createVaultKeyEnvelope({
    keyExchange: webKeyExchangeAdapter,
    vaultKey,
    recipientPublicKey: input.ownerPublicKey,
  });

  return { id, encryptedMetadata, ownerEnvelope };
}

/**
 * Abre a metadata de um cofre da listagem.
 *
 * O `vaultId` usado na AAD é o do próprio item — que é o id pelo qual o cliente
 * vai pedir aquele cofre. É essa amarração que impede o servidor de devolver a
 * metadata de um cofre na linha de outro.
 */
export async function openVaultMetadata(input: {
  vault: Pick<VaultSummary, 'id' | 'encryptedMetadata' | 'currentUserEnvelope'>;
  keyPair: KeyPair;
}): Promise<VaultMetadata> {
  const vaultKey = await openVaultKeyEnvelope({
    keyExchange: webKeyExchangeAdapter,
    recipientKeyPair: input.keyPair,
    envelope: input.vault.currentUserEnvelope,
  });

  try {
    return await decryptVaultMetadata({
      aead: webAeadAdapter,
      vaultKey,
      vaultId: input.vault.id,
      payload: input.vault.encryptedMetadata,
    });
  } finally {
    // Sobrescrever não prova que o segredo sumiu da memória — o motor pode ter
    // copiado o buffer. É defesa em profundidade, no mesmo espírito do `clear`
    // do store de sessão; a garantia real é não persistir nada.
    vaultKey.fill(0);
  }
}

/**
 * Recifra a metadata de um cofre existente, com a mesma `VaultKey`.
 *
 * Editar o nome não troca chave nem versão de chave: abre o envelope, cifra o
 * conteúdo novo e devolve o payload. Gerar uma chave nova aqui tornaria
 * ilegível todo conteúdo já gravado no cofre.
 */
export async function resealVaultMetadata(input: {
  vault: Pick<VaultSummary, 'id' | 'currentUserEnvelope'>;
  keyPair: KeyPair;
  metadata: VaultMetadata;
}): Promise<EncryptedPayload> {
  const vaultKey = await openVaultKeyEnvelope({
    keyExchange: webKeyExchangeAdapter,
    recipientKeyPair: input.keyPair,
    envelope: input.vault.currentUserEnvelope,
  });

  try {
    return await encryptVaultMetadata({
      aead: webAeadAdapter,
      random: webRandomSource,
      vaultKey,
      vaultId: input.vault.id,
      metadata: input.metadata,
    });
  } finally {
    vaultKey.fill(0);
  }
}
