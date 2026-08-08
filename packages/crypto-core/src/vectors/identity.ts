import type { Argon2idParameters } from '../adapters/crypto-adapters';

/**
 * Vetor determinístico da derivação de identidade.
 *
 * É constante de protocolo. `@crypta/crypto-web` e `@crypta/crypto-mobile`
 * precisam reproduzir estes bytes para que uma conta criada no navegador abra no
 * aplicativo (CLAUDE.md secao 54, SECURITY.md secao 22). Mora aqui, e não em um
 * dos packages de plataforma, porque os dois precisam importá-lo e nenhum deles
 * pode depender do outro.
 *
 * Os valores foram produzidos por `@noble/hashes` 2.2.0 e são conferidos a cada
 * execução contra `libsodium-wrappers-sumo` e o `crypto.subtle`, na suíte de
 * `@crypta/crypto-web`.
 *
 * Alterar qualquer valor aqui significa que a implementação mudou de
 * comportamento. Isso é um defeito a investigar, não um vetor a atualizar.
 */

export type IdentityVector = {
  name: string;
  password: string;
  parameters: Argon2idParameters;
  /** `Argon2id(password, salt)`. Confere com `ARGON2ID_PRODUCTION_VECTOR`. */
  rootKeyHex: string;
  /** `HKDF-SHA-256(rootKey, info="auth")`. */
  authSecretHex: string;
  /** `HKDF-SHA-256(rootKey, info="user-encryption")`. */
  userEncryptionKeyHex: string;
};

/**
 * Vetor nos parâmetros de produção do ADR 0018.
 *
 * A senha e o salt são os mesmos dos vetores de Argon2id de `@crypta/crypto-web`,
 * de propósito: o `rootKeyHex` abaixo tem que ser idêntico ao
 * `ARGON2ID_PRODUCTION_VECTOR.expectedHex`, o que amarra os dois conjuntos e faz
 * uma divergência aparecer nos dois lugares.
 */
export const IDENTITY_PRODUCTION_VECTOR: IdentityVector = {
  name: 'identity-argon2id-64mib-t3',
  password: 'crypta-self-test',
  parameters: {
    memoryKib: 65536,
    iterations: 3,
    parallelism: 1,
    salt: 'AQIDBAUGBwgJCgsMDQ4PEA',
  },
  rootKeyHex: '609895bb0a3269cc30a3d2c465cf70b74f2c893937842ce01d6a9dd252a3a682',
  authSecretHex: '2f65afd4c480fe50e1463fef4904b6ed09fb15800a7a428c61c226d5183422c7',
  userEncryptionKeyHex: '69bc77e6d4aa40c208fc5016344ff0a3d1d8e4137846e6be654760211f679ced',
};

/**
 * AAD canônica do key bundle, congelada.
 *
 * A chave pública é fictícia — 32 bytes de `0x01`. O que o vetor prova é o
 * enquadramento: prefixo de domínio, escopo, tipo e versões, todos prefixados
 * por tamanho. Um cliente de outra plataforma que produza string diferente
 * gera ciphertext que este não abre.
 */
export const USER_KEY_BUNDLE_AAD_VECTOR = {
  publicKey: 'AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE',
  serialized:
    'crypta-aad/v2|4:user|15:user-key-bundle|43:AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE|1:1|1:1',
} as const;
