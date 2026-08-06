/**
 * Erros criptográficos.
 *
 * Todo caminho criptográfico falha fechado: um payload malformado, uma versão
 * desconhecida ou uma AAD divergente lançam erro em vez de retornar um valor
 * degradado (STYLE_GUIDE.md secao 67, CLAUDE.md secao 9).
 *
 * Nenhuma mensagem pode conter chave, nonce, ciphertext ou plaintext.
 */

/** Formato do payload inválido: campo ausente, tipo errado ou encoding inválido. */
export class CryptoFormatError extends Error {
  readonly code = 'CRYPTO_FORMAT_INVALID';

  constructor(message: string) {
    super(message);
    this.name = 'CryptoFormatError';
  }
}

/** Versão criptográfica ou de schema não suportada por este cliente. */
export class CryptoVersionError extends Error {
  readonly code = 'CRYPTO_VERSION_UNSUPPORTED';

  constructor(message: string) {
    super(message);
    this.name = 'CryptoVersionError';
  }
}

/** Algoritmo declarado no payload diferente do algoritmo suportado. */
export class CryptoAlgorithmError extends Error {
  readonly code = 'CRYPTO_ALGORITHM_UNSUPPORTED';

  constructor(message: string) {
    super(message);
    this.name = 'CryptoAlgorithmError';
  }
}
