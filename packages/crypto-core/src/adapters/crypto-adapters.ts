/**
 * Interfaces dos adapters criptográficos.
 *
 * crypto-core define O QUE precisa acontecer. `@vault/crypto-web` e
 * `@vault/crypto-mobile` implementam COMO, cada um com a biblioteca da sua
 * plataforma (ARCHITECTURE.md secoes 8.2 a 8.4).
 *
 * A escolha das bibliotecas está em aberto: DECISIONS.md PEND-001, PEND-002 e
 * PEND-003. Nenhuma implementação será escrita antes desses ADRs.
 */

/** Chave simétrica ou material de chave bruto. Sempre em memória, nunca persistido. */
export type KeyMaterial = Uint8Array;

/** Fonte de aleatoriedade criptograficamente segura da plataforma. */
export type RandomSource = {
  /** Nunca pode ser implementado com `Math.random()` (CLAUDE.md secao 9). */
  getRandomBytes(length: number): Uint8Array;
};

/** Parâmetros Argon2id armazenados por usuário, para permitir recalibração futura. */
export type Argon2idParameters = {
  /** Custo de memória em KiB. */
  memoryKib: number;
  /** Número de passagens. */
  iterations: number;
  /** Grau de paralelismo. */
  parallelism: number;
  /** Salt em base64url. */
  salt: string;
};

export type KdfAdapter = {
  /** `UserPassword` + salt -> `RootKey` via Argon2id. */
  deriveRootKey(input: {
    password: string;
    parameters: Argon2idParameters;
    keyLength: number;
  }): Promise<KeyMaterial>;

  /**
   * Separação de domínio via HKDF-SHA-256.
   *
   * `info` distingue `auth` de `user-encryption`; usar o mesmo valor para os
   * dois anularia a separação exigida por ARCHITECTURE.md secao 14.3.
   */
  deriveSubKey(input: {
    rootKey: KeyMaterial;
    info: string;
    keyLength: number;
  }): Promise<KeyMaterial>;
};

export type AeadAdapter = {
  /** XChaCha20-Poly1305. O nonce nunca pode ser reutilizado com a mesma chave. */
  encrypt(input: {
    key: KeyMaterial;
    nonce: Uint8Array;
    plaintext: Uint8Array;
    aad: Uint8Array;
  }): Promise<Uint8Array>;

  /** Lança erro quando a tag ou a AAD não conferem. Nunca retorna dado parcial. */
  decrypt(input: {
    key: KeyMaterial;
    nonce: Uint8Array;
    ciphertext: Uint8Array;
    aad: Uint8Array;
  }): Promise<Uint8Array>;
};

export type KeyPair = {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
};

export type KeyExchangeAdapter = {
  /** Par X25519 do usuário. */
  generateKeyPair(): Promise<KeyPair>;

  /** Protege a `VaultKey` para a chave pública de um membro (envelope). */
  sealForPublicKey(input: {
    recipientPublicKey: Uint8Array;
    plaintext: Uint8Array;
  }): Promise<Uint8Array>;

  /** Abre um envelope com a chave privada do próprio usuário. */
  openWithPrivateKey(input: {
    recipientKeyPair: KeyPair;
    ciphertext: Uint8Array;
  }): Promise<Uint8Array>;
};

/** Conjunto completo que cada plataforma precisa fornecer. */
export type CryptoAdapter = {
  random: RandomSource;
  kdf: KdfAdapter;
  aead: AeadAdapter;
  keyExchange: KeyExchangeAdapter;
};

/**
 * Rótulos HKDF. São constantes de protocolo: alterá-los invalida todo material
 * derivado já existente e exige migração (ARCHITECTURE.md secao 14.3).
 */
export const HKDF_INFO = {
  auth: 'auth',
  userEncryption: 'user-encryption',
} as const;
