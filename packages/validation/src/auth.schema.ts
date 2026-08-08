import { z } from 'zod';

/**
 * Schemas de material criptográfico que trafega na API.
 *
 * Validam **estrutura e tamanho**, nunca conteúdo: o servidor não tem como
 * conferir que um `encryptedPrivateKey` realmente contém a chave privada
 * correspondente à `publicKey` — quem confere é o cliente, no desbloqueio, pela
 * AAD (ADR 0023).
 *
 * Ficam aqui, e não em cada aplicação, porque o DTO da API e o formulário da Web
 * precisam recusar exatamente as mesmas entradas. Dois schemas equivalentes
 * escritos separadamente divergem no primeiro ajuste.
 */

/** Alfabeto do base64url sem padding (RFC 4648 secao 5). */
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;

/**
 * Quantos bytes um base64url sem padding representa.
 *
 * Comprimento `% 4 === 1` é impossível: nenhuma quantidade de bytes produz isso.
 */
function decodedByteLength(value: string): number | null {
  const remainder = value.length % 4;

  if (remainder === 1) {
    return null;
  }

  return Math.floor((value.length * 3) / 4);
}

/** Base64url com tamanho decodificado exato, em bytes. */
export function base64UrlOfBytes(bytes: number, field: string) {
  return z
    .string({ message: `Campo "${field}" inválido.` })
    .regex(BASE64URL_PATTERN, { message: `Campo "${field}" deve ser base64url sem padding.` })
    .refine((value) => decodedByteLength(value) === bytes, {
      message: `Campo "${field}" deve ter exatamente ${String(bytes)} bytes.`,
    });
}

/** Base64url de tamanho variável, com teto para não virar caminho de payload grande. */
export function base64UrlUpTo(maxBytes: number, field: string) {
  return z
    .string({ message: `Campo "${field}" inválido.` })
    .regex(BASE64URL_PATTERN, { message: `Campo "${field}" deve ser base64url sem padding.` })
    .refine(
      (value) => {
        const length = decodedByteLength(value);
        return length !== null && length > 0 && length <= maxBytes;
      },
      { message: `Campo "${field}" excede o tamanho permitido.` },
    );
}

/**
 * `AuthSecret` — 32 bytes, saída de `HKDF-SHA-256(RootKey, info="auth")`.
 *
 * O tamanho é verificado antes de qualquer comparação: um valor de outro
 * tamanho não é um `AuthSecret` errado, é um payload malformado (ADR 0022).
 */
export const authSecretSchema = base64UrlOfBytes(32, 'authSecret');

/** Salt do Argon2id. O libsodium recusa qualquer tamanho diferente de 16 bytes. */
export const kdfSaltSchema = base64UrlOfBytes(16, 'kdfSalt');

/** Chave pública X25519 crua. */
export const publicKeySchema = base64UrlOfBytes(32, 'publicKey');

/** Nonce da XChaCha20-Poly1305. */
export const aeadNonceSchema = base64UrlOfBytes(24, 'privateKeyNonce');

/**
 * Parâmetros do Argon2id (ADR 0018).
 *
 * As faixas são amplas de propósito: os valores são recalibráveis e ficam por
 * usuário. O que os limites impedem é o extremo — parâmetro baixo demais tornaria
 * a derivação barata para um atacante offline, e alto demais travaria o próprio
 * cliente que precisa reproduzi-la.
 */
export const kdfParametersSchema = z.object({
  kdfAlgorithm: z.literal('ARGON2ID', { message: 'Algoritmo de KDF não suportado.' }),
  kdfVersion: z.number().int().min(1).max(255),
  kdfSalt: kdfSaltSchema,
  kdfMemory: z
    .number()
    .int()
    .min(19456, { message: 'Custo de memória do Argon2id abaixo do mínimo aceito.' })
    .max(1048576),
  kdfIterations: z.number().int().min(2).max(10),
  // Fixo em 1: o `crypto_pwhash` do libsodium não expõe o parâmetro e crava uma
  // lane, então outro valor quebraria a compatibilidade de bytes com o Android.
  kdfParallelism: z.literal(1, { message: 'Paralelismo do Argon2id deve ser 1 (ADR 0016).' }),
});

/**
 * Key bundle completo (docs/API.md secao 20).
 *
 * `strict()` recusa campo desconhecido em vez de ignorá-lo. É o que impede um
 * `privateKey` em texto aberto de ser aceito e descartado em silêncio — o
 * servidor precisa **recusar**, não tolerar.
 */
export const keyBundleSchema = kdfParametersSchema
  .extend({
    publicKey: publicKeySchema,
    encryptedPrivateKey: base64UrlUpTo(1024, 'encryptedPrivateKey'),
    privateKeyNonce: aeadNonceSchema,
    cryptoVersion: z.number().int().min(1).max(255),
    schemaVersion: z.number().int().min(1).max(255),
  })
  .strict();

export type KeyBundleInput = z.infer<typeof keyBundleSchema>;
