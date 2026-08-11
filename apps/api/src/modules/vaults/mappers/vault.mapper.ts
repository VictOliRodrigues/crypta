import {
  type EncryptedPayload,
  type KeyEnvelopeView,
  type VaultDetail,
  type VaultSummary,
} from '@crypta/contracts';

import { InvalidEnvelopeException } from '../errors/vault.errors';
import {
  type OwnerEnvelopeInput,
  type VaultRecord,
  type VaultWithRole,
} from '../repositories/vault.repository';

/**
 * Banco → domínio → resposta (`CLAUDE.md` secao 34).
 *
 * Nenhum objeto Prisma sai daqui. O mapeamento explícito é o que garante que
 * uma coluna acrescentada amanhã não apareça sozinha na resposta — o que, numa
 * tabela que guarda material criptográfico, é diferença de segurança e não de
 * estilo.
 */

/**
 * `siteCount` é constante zero na R0.3.
 *
 * Sites entram na R0.4. O campo existe agora porque a W05 já o exibe, e é
 * `0` de verdade — não um placeholder que a interface precise tratar.
 */
const SITE_COUNT_UNTIL_R04 = 0;

function toEncryptedPayload(vault: VaultRecord): EncryptedPayload {
  return {
    cryptoVersion: vault.cryptoVersion,
    schemaVersion: vault.schemaVersion,
    algorithm: vault.metadataAlgorithm,
    nonce: vault.metadataNonce,
    ciphertext: vault.metadataCiphertext,
  };
}

export function toVaultSummary(vault: VaultWithRole): VaultSummary {
  if (vault.currentUserEnvelope === null) {
    // Membro sem envelope na geração corrente é estado inválido: a associação e
    // o envelope nascem na mesma transação. Devolver a listagem sem ele
    // entregaria metadata que o cliente não tem como abrir, e o sintoma seria
    // "falha ao descriptografar" — que não aponta para a causa.
    throw new InvalidEnvelopeException('MISSING_FOR_CURRENT_KEY_VERSION');
  }

  return {
    id: vault.id,
    encryptedMetadata: toEncryptedPayload(vault),
    currentUserEnvelope: toKeyEnvelopeView(vault.currentUserEnvelope),
    role: vault.role,
    memberCount: vault.memberCount,
    siteCount: SITE_COUNT_UNTIL_R04,
    version: vault.version,
    keyVersion: vault.keyVersion,
    updatedAt: vault.updatedAt.toISOString(),
  };
}

export function toVaultDetail(vault: VaultWithRole): VaultDetail {
  return {
    ...toVaultSummary(vault),
    // Sempre `false` até a R0.5. O rekey é quem passa a alterná-lo.
    isLockedForRekey: false,
    createdAt: vault.createdAt.toISOString(),
  };
}

export function toKeyEnvelopeView(envelope: OwnerEnvelopeInput): KeyEnvelopeView {
  return {
    keyVersion: envelope.keyVersion,
    cryptoVersion: envelope.cryptoVersion,
    algorithm: envelope.algorithm,
    ephemeralPublicKey: envelope.ephemeralPublicKey,
    encryptedVaultKey: envelope.encryptedVaultKey,
  };
}
