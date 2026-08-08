/**
 * Vetores determinísticos de Argon2id.
 *
 * Todos os valores abaixo foram produzidos por duas implementações
 * independentes — `libsodium-wrappers-sumo` 0.8.4 e `@noble/hashes` 2.2.0 — e
 * conferem byte a byte. São constantes de protocolo: `@crypta/crypto-mobile`
 * precisa reproduzi-los para que um cofre criado no navegador abra no
 * aplicativo (CLAUDE.md secao 54, SECURITY.md secao 22).
 *
 * Alterar qualquer valor aqui significa que a implementação mudou de
 * comportamento. Isso é um defeito a investigar, não um vetor a atualizar.
 */

export type Argon2idVector = {
  name: string;
  password: Uint8Array;
  salt: Uint8Array;
  memoryKib: number;
  iterations: number;
  outputBytes: number;
  expectedHex: string;
};

const encoder = new TextEncoder();

const SELF_TEST_PASSWORD = encoder.encode('crypta-self-test');

/** Salt fixo dos vetores. Nunca usado para derivar chave real. */
const SELF_TEST_SALT = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);

/**
 * Vetor do self-test de inicialização.
 *
 * Usa memória baixa de propósito: roda em poucos milissegundos e valida que a
 * implementação de Argon2id está correta. Não precisa usar os parâmetros de
 * produção — o que ele prova é a corretude do algoritmo, não a escolha de
 * custo, que é decisão do ADR 0018.
 */
export const ARGON2ID_KAT: Argon2idVector = {
  name: 'argon2id-8mib-t1',
  password: SELF_TEST_PASSWORD,
  salt: SELF_TEST_SALT,
  memoryKib: 8192,
  iterations: 1,
  outputBytes: 32,
  expectedHex: '5ba83ccf1f3897b86aee365c5ca1bbc44cd8a1420a43dd97ba1e8dd22fb4d3f3',
};

/** Vetor nos parâmetros de produção do ADR 0018. Exercitado nos testes. */
export const ARGON2ID_PRODUCTION_VECTOR: Argon2idVector = {
  name: 'argon2id-64mib-t3',
  password: SELF_TEST_PASSWORD,
  salt: SELF_TEST_SALT,
  memoryKib: 65536,
  iterations: 3,
  outputBytes: 32,
  expectedHex: '609895bb0a3269cc30a3d2c465cf70b74f2c893937842ce01d6a9dd252a3a682',
};

/**
 * Vetor acima da faixa em que o fallback `wasm2js` do libsodium corrompe a
 * derivação, medida em cerca de 72 MiB (ADR 0016).
 *
 * Só é exercitado nos testes, nunca na inicialização: custa centenas de
 * milissegundos em WebAssembly e vários segundos no fallback. O caminho barato
 * para garantir que o fallback não foi embutido é o teste de bundle em
 * `apps/web`, que falha se o artefato contiver o módulo de reserva.
 */
export const WASM2JS_PROBE: Argon2idVector = {
  name: 'argon2id-96mib-t1',
  password: SELF_TEST_PASSWORD,
  salt: SELF_TEST_SALT,
  memoryKib: 98304,
  iterations: 1,
  outputBytes: 32,
  expectedHex: '8d37b4b7893a9ff1bd8206ebff33a190811123bbccd2b4de03de385c1df48de9',
};
