import {
  type Argon2idParameters,
  HKDF_INFO,
  type KdfAdapter,
  type KeyMaterial,
} from '../adapters/crypto-adapters';

/**
 * Derivação da identidade a partir da senha (ARCHITECTURE.md secao 14.3).
 *
 * ```text
 * UserPassword
 *     │ Argon2id + kdfSalt
 *     ▼
 *  RootKey
 *     ├── HKDF(info="auth")            → AuthSecret
 *     └── HKDF(info="user-encryption") → UserEncryptionKey
 * ```
 *
 * Este módulo é o único lugar que escolhe os rótulos de HKDF. Antes dele o
 * `HKDF_INFO` era exportado e ninguém o importava, então nada impedia um
 * chamador de passar a mesma `info` nas duas derivações e anular a separação de
 * domínio que o ADR 0004 existe para garantir.
 *
 * Nenhuma primitiva é implementada aqui: o `KdfAdapter` vem da plataforma
 * (`@crypta/crypto-web` ou `@crypta/crypto-mobile`), o que mantém este package
 * portável e testável contra qualquer implementação.
 */

/** Tamanho da `RootKey`, em bytes. */
export const ROOT_KEY_BYTES = 32;

/** Tamanho do `AuthSecret`, em bytes. Casa com `SECURITY.md` secao 14. */
export const AUTH_SECRET_BYTES = 32;

/** Tamanho da `UserEncryptionKey`, em bytes. Chave da XChaCha20-Poly1305. */
export const USER_ENCRYPTION_KEY_BYTES = 32;

export type IdentitySecrets = {
  /**
   * Enviado à API como credencial autenticadora, nunca persistido no cliente.
   * O servidor guarda apenas um verificador dele (ADR 0022).
   */
  authSecret: KeyMaterial;
  /**
   * Protege a chave privada do usuário. **Nunca sai do cliente** e vive apenas
   * em memória: é ela que faz uma sessão roubada autenticar sem descriptografar.
   */
  userEncryptionKey: KeyMaterial;
};

/**
 * Deriva os dois segredos da senha, em uma passagem só de Argon2id.
 *
 * A `RootKey` intermediária não é devolvida de propósito: ela deriva os dois
 * segredos e não tem uso próprio, então mantê-la fora do retorno reduz o número
 * de referências vivas a material de chave.
 */
export async function deriveIdentitySecrets(input: {
  kdf: KdfAdapter;
  password: string;
  parameters: Argon2idParameters;
}): Promise<IdentitySecrets> {
  const rootKey = await input.kdf.deriveRootKey({
    password: input.password,
    parameters: input.parameters,
    keyLength: ROOT_KEY_BYTES,
  });

  const [authSecret, userEncryptionKey] = await Promise.all([
    input.kdf.deriveSubKey({
      rootKey,
      info: HKDF_INFO.auth,
      keyLength: AUTH_SECRET_BYTES,
    }),
    input.kdf.deriveSubKey({
      rootKey,
      info: HKDF_INFO.userEncryption,
      keyLength: USER_ENCRYPTION_KEY_BYTES,
    }),
  ]);

  return { authSecret, userEncryptionKey };
}
