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
 */

/** Prefixo de domínio. Muda apenas se o formato da AAD mudar. */
const AAD_DOMAIN = 'vault-aad/v1';

const FIELD_SEPARATOR = '|';

export const AAD_ENTITY_TYPES = ['vault', 'site', 'credential'] as const;

export type AadEntityType = (typeof AAD_ENTITY_TYPES)[number];

export type AadContext = {
  entityType: AadEntityType;
  entityId: string;
  vaultId: string;
  schemaVersion: number;
  cryptoVersion: number;
};

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
 * Serializa a AAD em uma string canônica.
 *
 * Cada segmento vira `<tamanho em bytes>:<valor>`, tornando a serialização
 * injetiva: `{a: 'x|y', b: 'z'}` e `{a: 'x', b: 'y|z'}` produzem strings
 * distintas.
 */
export function serializeAad(context: AadContext): string {
  assertNonEmpty(context.entityId, 'entityId');
  assertNonEmpty(context.vaultId, 'vaultId');
  assertPositiveInteger(context.schemaVersion, 'schemaVersion');
  assertPositiveInteger(context.cryptoVersion, 'cryptoVersion');

  if (!AAD_ENTITY_TYPES.includes(context.entityType)) {
    throw new CryptoFormatError('Tipo de entidade desconhecido na AAD.');
  }

  const segments = [
    context.entityType,
    context.entityId,
    context.vaultId,
    String(context.schemaVersion),
    String(context.cryptoVersion),
  ];

  const encodedSegments = segments.map(
    (segment) => `${String(utf8ByteLength(segment))}:${segment}`,
  );

  return [AAD_DOMAIN, ...encodedSegments].join(FIELD_SEPARATOR);
}

/** Bytes da AAD, prontos para serem passados à AEAD. */
export function buildAad(context: AadContext): Uint8Array {
  return encodeUtf8(serializeAad(context));
}
