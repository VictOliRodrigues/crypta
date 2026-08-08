import { encodeUtf8, utf8ByteLength } from '../encoding/utf8';
import { CryptoFormatError } from '../errors';

/**
 * Additional Authenticated Data (ARCHITECTURE.md secao 14.9).
 *
 * A AAD amarra um ciphertext ao seu contexto. Sem ela, um ciphertext válido de
 * uma credencial poderia ser copiado para outra credencial, ou de um cofre para
 * outro, e ainda assim decifrar com sucesso.
 *
 * A serialização é canônica e prefixada por tamanho: dois contextos diferentes
 * nunca produzem os mesmos bytes, mesmo que algum identificador contenha o
 * separador. Depender da ordem de propriedades de um objeto seria frágil
 * (STYLE_GUIDE.md secao 40).
 *
 * O contexto tem dois escopos, decididos no ADR 0023. Conteúdo de cofre vive
 * sob `vault` e é amarrado ao cofre; o material de identidade do usuário vive
 * sob `user` e não tem cofre nenhum a que se amarrar.
 */

/**
 * Prefixo de domínio. Muda apenas se o formato da AAD mudar.
 *
 * A `v1` chamava-se `vault-aad/v1`, tinha cinco segmentos e exigia `vaultId`
 * não-vazio. Nunca produziu ciphertext persistido: foi substituída pela `v2`
 * antes da primeira migration, que é o único momento em que trocar o formato
 * não custa migração de dado (SECURITY.md secao 18).
 */
const AAD_DOMAIN = 'crypta-aad/v2';

const FIELD_SEPARATOR = '|';

/** Escopos de AAD. O escopo é o primeiro segmento e determina os demais. */
export const AAD_SCOPES = ['vault', 'user'] as const;

export type AadScope = (typeof AAD_SCOPES)[number];

/** Entidades cujo conteúdo é protegido pela `VaultKey` de um cofre. */
export const VAULT_AAD_ENTITY_TYPES = ['vault', 'site', 'credential'] as const;

export type VaultAadEntityType = (typeof VAULT_AAD_ENTITY_TYPES)[number];

/** Entidades protegidas pela `UserEncryptionKey` do próprio usuário. */
export const USER_AAD_ENTITY_TYPES = ['user-key-bundle'] as const;

export type UserAadEntityType = (typeof USER_AAD_ENTITY_TYPES)[number];

export type VaultAadContext = {
  scope: 'vault';
  entityType: VaultAadEntityType;
  entityId: string;
  vaultId: string;
  schemaVersion: number;
  cryptoVersion: number;
};

export type UserAadContext = {
  scope: 'user';
  entityType: UserAadEntityType;
  /**
   * Chave pública X25519 do usuário, em base64url.
   *
   * Ocupa o lugar que o escopo `vault` dá ao identificador da entidade, e não é
   * um `userId` por dois motivos. O primeiro é prático: no `POST /setup` o
   * cliente cifra a chave privada antes de o servidor existir para gerar o id
   * (ADR 0019). O segundo é que amarrar à chave pública protege mais — o
   * ciphertext passa a declarar de qual metade pública ele é a metade privada,
   * então um servidor que troque `publicKey` mantendo `encryptedPrivateKey` é
   * detectado no desbloqueio, e não depois de um envelope ter sido endereçado
   * à chave errada.
   */
  publicKey: string;
  schemaVersion: number;
  cryptoVersion: number;
};

export type AadContext = VaultAadContext | UserAadContext;

function assertNonEmpty(value: string, field: string): void {
  if (value.length === 0) {
    throw new CryptoFormatError(`Campo "${field}" da AAD não pode ser vazio.`);
  }
}

function assertPositiveInteger(value: number, field: string): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new CryptoFormatError(`Campo "${field}" da AAD deve ser um inteiro positivo.`);
  }
}

/**
 * Segmentos de cada escopo, sem o prefixo de domínio.
 *
 * Os dois escopos produzem quantidades diferentes de segmentos, e o escopo é o
 * primeiro deles. Não existe campo vazio para preencher lacuna: um contexto de
 * usuário simplesmente não carrega cofre.
 */
function contextSegments(context: AadContext): string[] {
  assertPositiveInteger(context.schemaVersion, 'schemaVersion');
  assertPositiveInteger(context.cryptoVersion, 'cryptoVersion');

  if (context.scope === 'vault') {
    if (!VAULT_AAD_ENTITY_TYPES.includes(context.entityType)) {
      throw new CryptoFormatError('Tipo de entidade desconhecido no escopo "vault" da AAD.');
    }

    assertNonEmpty(context.entityId, 'entityId');
    assertNonEmpty(context.vaultId, 'vaultId');

    return [
      context.scope,
      context.entityType,
      context.entityId,
      context.vaultId,
      String(context.schemaVersion),
      String(context.cryptoVersion),
    ];
  }

  if (context.scope === 'user') {
    if (!USER_AAD_ENTITY_TYPES.includes(context.entityType)) {
      throw new CryptoFormatError('Tipo de entidade desconhecido no escopo "user" da AAD.');
    }

    assertNonEmpty(context.publicKey, 'publicKey');

    return [
      context.scope,
      context.entityType,
      context.publicKey,
      String(context.schemaVersion),
      String(context.cryptoVersion),
    ];
  }

  throw new CryptoFormatError('Escopo desconhecido na AAD.');
}

/**
 * Serializa a AAD em uma string canônica.
 *
 * Cada segmento vira `<tamanho em bytes>:<valor>`, tornando a serialização
 * injetiva: `{a: 'x|y', b: 'z'}` e `{a: 'x', b: 'y|z'}` produzem strings
 * distintas.
 */
export function serializeAad(context: AadContext): string {
  const encodedSegments = contextSegments(context).map(
    (segment) => `${String(utf8ByteLength(segment))}:${segment}`,
  );

  return [AAD_DOMAIN, ...encodedSegments].join(FIELD_SEPARATOR);
}

/** Bytes da AAD, prontos para serem passados à AEAD. */
export function buildAad(context: AadContext): Uint8Array {
  return encodeUtf8(serializeAad(context));
}
