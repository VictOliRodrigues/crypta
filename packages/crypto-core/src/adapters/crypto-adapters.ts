/**
 * Interfaces dos adapters criptográficos.
 *
 * crypto-core define O QUE precisa acontecer. `@crypta/crypto-web` e
 * `@crypta/crypto-mobile` implementam COMO, cada um com a biblioteca da sua
 * plataforma (ARCHITECTURE.md secoes 8.2 a 8.4).
 *
 * A escolha das bibliotecas da Web está fechada: ADR 0016 (Argon2id pelo
 * `libsodium-wrappers-sumo`) e ADR 0017 (XChaCha20-Poly1305 pelo libsodium,
 * HKDF-SHA-256 e X25519 pelo `crypto.subtle`).
 *
 * A do Android continua em aberto: DECISIONS.md PEND-003, na R0.7. Ela precisa
 * respeitar as invariantes dos ADRs 0016 e 0017 para os vetores continuarem
 * compatíveis.
 */

/** Chave simétrica ou material de chave bruto. Sempre em memória, nunca persistido. */
export type KeyMaterial = Uint8Array;

/** Fonte de aleatoriedade criptograficamente segura da plataforma. */
export type RandomSource = {
  /** Nunca pode ser implementado com `Math.random()` (CLAUDE.md secao 9). */
  getRandomBytes(length: number): Uint8Array;
};

/**
 * Parâmetros Argon2id armazenados por usuário, para permitir recalibração futura.
 *
 * Os valores iniciais estão no ADR 0018 e são provisórios até a medição em
 * Android na R0.7.
 */
export type Argon2idParameters = {
  /** Custo de memória em KiB. */
  memoryKib: number;
  /** Número de passagens. */
  iterations: number;
  /**
   * Grau de paralelismo. Fixo em 1: o `crypto_pwhash` do libsodium não expõe o
   * parâmetro e crava 1 lane, então outro valor quebraria a compatibilidade de
   * bytes entre Web e Android (ADR 0016).
   */
  parallelism: number;
  /** Salt em base64url. Exatamente 16 bytes — o libsodium rejeita outros tamanhos. */
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
  /**
   * Prepara a plataforma e valida a implementação antes do primeiro uso.
   *
   * Existe porque o libsodium exige `await sodium.ready` (ADR 0016), mas o
   * contrato é mais amplo: cabe aqui o self-test de vetor conhecido que recusa
   * operar quando a implementação diverge. Precisa ser idempotente, e nenhum
   * outro método pode ser chamado antes que a promise resolva.
   */
  init(): Promise<void>;
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
