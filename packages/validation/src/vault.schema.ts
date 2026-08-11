import { z } from 'zod';

import { base64UrlOfBytes, base64UrlUpTo } from './auth.schema';
import { uuidV7Schema } from './common.schema';

/**
 * Estruturas criptografadas que trafegam nas rotas de cofre.
 *
 * Estes schemas validam **forma**, nunca conteúdo: a API não abre nada do que
 * valida aqui. A garantia de que o formato é o mesmo dos dois lados vem de
 * `@crypta/crypto-core`, que produz e reconhece exatamente estes campos.
 *
 * As mensagens ficam em português porque o formulário da Web usa os mesmos
 * schemas (STYLE_GUIDE.md secao 3).
 */

/** Limites de campo do cofre, em caracteres do texto claro. */
export const VAULT_LIMITS = {
  name: 200,
  description: 2000,
  /**
   * Teto do ciphertext em **bytes decodificados**.
   *
   * O pior caso do formato — 200 caracteres de nome e 2000 de descrição, todos
   * de quatro bytes, mais o enquadramento JSON e a tag — fica perto de 8,9 mil
   * bytes. O teto é o dobro disso, e não os 65536 sugeridos em `API.md` secao
   * 74: o limite genérico existe para o maior payload do sistema, e usá-lo aqui
   * aceitaria um cofre com dez vezes o conteúdo que o formato permite.
   */
  encryptedPayloadBytes: 18_000,
} as const;

const AEAD_ALGORITHM = 'XCHACHA20-POLY1305';
const KEY_ENVELOPE_ALGORITHM = 'X25519-HKDF-SHA256-XCHACHA20-POLY1305';

const AEAD_NONCE_BYTES = 24;
const X25519_PUBLIC_KEY_BYTES = 32;

/** `VaultKey` de 32 bytes mais a tag Poly1305 de 16. Tamanho fixo. */
const SEALED_VAULT_KEY_BYTES = 48;

/** Versão criptográfica corrente. Um payload de outra versão é recusado. */
const SUPPORTED_CRYPTO_VERSION = 1;

const cryptoVersionSchema = z.literal(SUPPORTED_CRYPTO_VERSION, {
  message: 'Versão criptográfica não suportada.',
});

const schemaVersionSchema = z
  .number({ message: 'Versão de schema inválida.' })
  .int({ message: 'Versão de schema inválida.' })
  .min(1, { message: 'Versão de schema inválida.' })
  .max(65535, { message: 'Versão de schema inválida.' });

/**
 * Payload criptografado (docs/API.md secao 14).
 *
 * `.strict()` recusa campo desconhecido em vez de descartá-lo. É o que faz um
 * `name` em texto aberto parar na porta, em vez de ser ignorado em silêncio
 * enquanto o cliente acredita tê-lo enviado.
 */
export const encryptedPayloadSchema = z
  .object({
    cryptoVersion: cryptoVersionSchema,
    schemaVersion: schemaVersionSchema,
    algorithm: z.literal(AEAD_ALGORITHM, { message: 'Algoritmo não suportado.' }),
    nonce: base64UrlOfBytes(AEAD_NONCE_BYTES, 'nonce'),
    ciphertext: base64UrlUpTo(VAULT_LIMITS.encryptedPayloadBytes, 'ciphertext'),
  })
  .strict();

export type EncryptedPayloadInput = z.infer<typeof encryptedPayloadSchema>;

/**
 * Envelope da `VaultKey` (docs/API.md secao 15).
 *
 * **Sem campo `nonce`**, e o `.strict()` faz disso uma recusa, não uma omissão:
 * um cliente que enviasse o nonce receberia `400`. Ele é derivado junto com a
 * chave da AEAD e não trafega (ADR 0023); aceitar um valor escolhido por quem
 * envia seria aceitar uma segunda fonte de verdade.
 */
export const keyEnvelopeSchema = z
  .object({
    keyVersion: z
      .number({ message: 'Versão de chave inválida.' })
      .int({ message: 'Versão de chave inválida.' })
      .min(1, { message: 'Versão de chave inválida.' }),
    cryptoVersion: cryptoVersionSchema,
    algorithm: z.literal(KEY_ENVELOPE_ALGORITHM, {
      message: 'Algoritmo de envelope não suportado.',
    }),
    ephemeralPublicKey: base64UrlOfBytes(X25519_PUBLIC_KEY_BYTES, 'ephemeralPublicKey'),
    encryptedVaultKey: base64UrlOfBytes(SEALED_VAULT_KEY_BYTES, 'encryptedVaultKey'),
  })
  .strict();

export type KeyEnvelopeInput = z.infer<typeof keyEnvelopeSchema>;

/**
 * Versão esperada pelo cliente (docs/API.md secao 13).
 *
 * Obrigatória em toda mutação. Torná-la opcional devolveria o "último a
 * escrever vence" que a coluna `version` existe para impedir.
 */
export const expectedVersionSchema = z
  .number({ message: 'Informe a versão esperada do cofre.' })
  .int({ message: 'Versão esperada inválida.' })
  .min(1, { message: 'Versão esperada inválida.' });

/** Identificador de cofre: UUIDv7 gerado pelo cliente (ADR 0025). */
export const vaultIdSchema = uuidV7Schema;
