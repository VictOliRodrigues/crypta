import { type RandomSource } from '../adapters/crypto-adapters';
import { CryptoFormatError } from '../errors';

/**
 * Identificador de entidade cifrada no cliente (ADR 0025).
 *
 * A regra geral do projeto é o Prisma gerar os ids (ADR 0019). As entidades
 * cujo conteúdo o cliente cifra são a exceção, e não por conveniência: a AAD do
 * escopo `vault` amarra ao id da entidade, e o cliente cifra **antes** do
 * `POST`. Com o id nascendo no servidor, o cliente teria que amarrar a metadata
 * a um valor que ainda não conhece.
 *
 * Vale para o cofre na R0.3, e para site e credencial na R0.4.
 *
 * O formato é UUIDv7 do RFC 9562, o mesmo que o Prisma produz nas demais
 * tabelas — muda a origem, não o formato, para que uma coluna `CHAR(36)` sirva
 * às duas e nenhuma consulta precise saber de onde veio o id.
 */

/** Bytes de um UUID. */
const UUID_BYTES = 16;

/** Bytes que o RFC deixa aleatórios: 12 bits de `rand_a` e 62 de `rand_b`. */
const RANDOM_BYTES = 10;

const TIMESTAMP_BYTES = 6;

/** Instante máximo representável nos 48 bits de timestamp: ano 10889. */
const MAX_TIMESTAMP_MS = 2 ** 48 - 1;

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Gera um UUIDv7.
 *
 * ```text
 * unix_ts_ms   48 bits   milissegundos desde a época
 * ver           4 bits   0b0111
 * rand_a       12 bits   aleatório
 * var           2 bits   0b10
 * rand_b       62 bits   aleatório
 * ```
 *
 * Os 74 bits aleatórios vêm do CSPRNG da plataforma. `Math.random()` está
 * proibido (`CLAUDE.md` secao 9) e aqui a proibição vale igual: embora o id não
 * seja segredo, ele é o valor a que a AAD da metadata se amarra, e um gerador
 * previsível facilitaria produzir colisão de propósito.
 *
 * O timestamp entra como metadado, não como prova. Nada no sistema lê o
 * instante embutido para decidir ordem, autorização ou unicidade — um cliente
 * que mentisse nele só prejudicaria a si mesmo.
 */
export function createEntityId(random: RandomSource, nowMs: number = Date.now()): string {
  if (!Number.isInteger(nowMs) || nowMs < 0 || nowMs > MAX_TIMESTAMP_MS) {
    throw new CryptoFormatError('Instante fora da faixa representável por um UUIDv7.');
  }

  const randomBytes = random.getRandomBytes(RANDOM_BYTES);

  if (randomBytes.length !== RANDOM_BYTES) {
    throw new CryptoFormatError(
      `A fonte de aleatoriedade devolveu ${String(randomBytes.length)} bytes; o identificador precisa de ${String(RANDOM_BYTES)}.`,
    );
  }

  const bytes = new Uint8Array(UUID_BYTES);

  // Timestamp big-endian nos 48 bits mais significativos. A divisão em vez de
  // deslocamento é obrigatória: `>>` opera em 32 bits e truncaria o valor.
  let remaining = nowMs;

  for (let index = TIMESTAMP_BYTES - 1; index >= 0; index -= 1) {
    bytes[index] = remaining % 256;
    remaining = Math.floor(remaining / 256);
  }

  bytes.set(randomBytes, TIMESTAMP_BYTES);

  // Versão 7 no nibble alto do byte 6, variante RFC 4122 nos dois bits altos do
  // byte 8. Os bits restantes desses bytes continuam sendo os aleatórios.
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x70;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;

  const hex = toHex(bytes);

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-');
}
