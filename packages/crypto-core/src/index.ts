export {
  type AeadAdapter,
  type Argon2idParameters,
  type CryptoAdapter,
  HKDF_INFO,
  type KdfAdapter,
  type KeyExchangeAdapter,
  type KeyMaterial,
  type KeyPair,
  type RandomSource,
} from './adapters/crypto-adapters';
export { fromBase64Url, toBase64Url } from './encoding/base64url';
export { decodeUtf8, encodeUtf8, utf8ByteLength } from './encoding/utf8';
export {
  CryptoAlgorithmError,
  CryptoAuthenticationError,
  CryptoFormatError,
  CryptoVersionError,
} from './errors';
export {
  AAD_SCOPES,
  type AadContext,
  type AadScope,
  buildAad,
  serializeAad,
  USER_AAD_ENTITY_TYPES,
  type UserAadContext,
  type UserAadEntityType,
  VAULT_AAD_ENTITY_TYPES,
  type VaultAadContext,
  type VaultAadEntityType,
} from './format/aad';
export {
  AEAD_ALGORITHM,
  AEAD_NONCE_BYTES,
  type AeadAlgorithm,
  assertSupportedCryptoVersion,
  buildCipherPayload,
  type CipherPayload,
  CURRENT_CRYPTO_VERSION,
  parseCipherPayload,
  SUPPORTED_CRYPTO_VERSIONS,
} from './format/crypto-payload';
export {
  buildKeyEnvelope,
  KEY_ENVELOPE_ALGORITHM,
  type KeyEnvelope,
  type KeyEnvelopeAlgorithm,
  parseKeyEnvelope,
  sealedBytesFromEnvelope,
} from './format/key-envelope';
export { createEntityId } from './identifier/entity-id';
export {
  AUTH_SECRET_BYTES,
  deriveIdentitySecrets,
  type IdentitySecrets,
  ROOT_KEY_BYTES,
  USER_ENCRYPTION_KEY_BYTES,
} from './identity/derive-identity';
export {
  createUserKeyBundle,
  KDF_ALGORITHM,
  KDF_VERSION,
  type KdfAlgorithm,
  kdfParametersFromBundle,
  openUserKeyBundle,
  parseUserKeyBundle,
  resealUserKeyBundle,
  USER_KEY_BUNDLE_SCHEMA_VERSION,
  type UserKeyBundle,
} from './identity/user-key-bundle';
export {
  createVaultKey,
  createVaultKeyEnvelope,
  INITIAL_KEY_VERSION,
  openVaultKeyEnvelope,
  VAULT_KEY_BYTES,
} from './vault/vault-key';
export {
  decryptVaultMetadata,
  encryptVaultMetadata,
  VAULT_METADATA_LIMITS,
  VAULT_METADATA_SCHEMA_VERSION,
  type VaultMetadata,
} from './vault/vault-metadata';
export {
  IDENTITY_PRODUCTION_VECTOR,
  type IdentityVector,
  USER_KEY_BUNDLE_AAD_VECTOR,
} from './vectors/identity';
