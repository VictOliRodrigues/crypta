/**
 * Carregamento do libsodium e self-test de integridade.
 *
 * O ADR 0016 fixa `libsodium-wrappers-sumo` e proíbe o build CommonJS, cujo
 * fallback `wasm2js` devolve chave errada acima de cerca de 72 MiB sem lançar
 * erro. Este módulo é o único ponto do package que importa a biblioteca, para
 * que a proteção não tenha como ser contornada por engano.
 */

import sodium from 'libsodium-wrappers-sumo';

import { ARGON2ID_KAT } from './vectors';

/** Instância pronta do libsodium. Só existe depois de `initSodium()`. */
export type Sodium = typeof sodium;

let readyPromise: Promise<Sodium> | undefined;

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Erro de inicialização. Não estende os erros de `crypto-core` porque não é
 * falha de um payload: é a plataforma se recusando a operar.
 */
export class CryptoInitializationError extends Error {
  readonly code = 'CRYPTO_INITIALIZATION_FAILED';

  constructor(message: string) {
    super(message);
    this.name = 'CryptoInitializationError';
  }
}

/**
 * Deriva um vetor conhecido e compara com o valor esperado.
 *
 * Usa o vetor barato de propósito. Detectar o fallback `wasm2js` exigiria
 * memória acima de ~72 MiB, o que custaria centenas de milissegundos em toda
 * inicialização; essa garantia vem do teste de bundle em `apps/web`, que
 * reprova se o módulo de reserva entrar no artefato. O que este self-test cobre
 * é o caso geral: uma implementação que mudou de comportamento não deriva
 * chave nenhuma.
 */
function runSelfTest(instance: Sodium): void {
  const vector = ARGON2ID_KAT;

  const derived = instance.crypto_pwhash(
    vector.outputBytes,
    vector.password,
    vector.salt,
    vector.iterations,
    vector.memoryKib * 1024,
    instance.crypto_pwhash_ALG_ARGON2ID13,
  );

  if (toHex(derived) !== vector.expectedHex) {
    throw new CryptoInitializationError(
      `Self-test criptográfico falhou no vetor "${vector.name}". ` +
        'A implementação de Argon2id diverge do valor esperado; ' +
        'derivar chaves aqui produziria um cofre irrecuperável.',
    );
  }
}

/**
 * Teto para o carregamento do WebAssembly.
 *
 * A inicialização real leva dezenas de milissegundos, e um aparelho lento não
 * chega perto disto. O valor não é uma estimativa de duração: é o ponto a
 * partir do qual "ainda carregando" deixa de ser uma explicação plausível.
 */
const INIT_TIMEOUT_MS = 10_000;

/**
 * `sodium.ready` que **sempre** termina.
 *
 * Quando o navegador recusa compilar o WebAssembly — CSP sem
 * `'wasm-unsafe-eval'`, extensão interferindo, política corporativa —
 * `libsodium-wrappers` deixa a promise `ready` **pendente para sempre** em vez
 * de rejeitá-la. Sem este teto, quem chamou fica esperando indefinidamente: na
 * Web isso significa um botão preso em "Entrando…", sem erro, sem requisição e
 * sem nada no console que aponte para a causa.
 *
 * Falhar fechado aqui é o que o `CLAUDE.md` secao 9 exige. Um cofre que não
 * consegue derivar chave precisa dizer isso, não parecer lento.
 */
async function awaitSodiumReady(): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      reject(
        new CryptoInitializationError(
          'O navegador não concluiu o carregamento do WebAssembly criptográfico. ' +
            'A causa mais comum é a execução de WebAssembly estar bloqueada — por ' +
            'extensão do navegador ou por política de segurança. Tente numa janela ' +
            'privativa, sem extensões.',
        ),
      );
    }, INIT_TIMEOUT_MS);
  });

  try {
    await Promise.race([sodium.ready, timeout]);
  } finally {
    // Sem isto o timer segura o processo vivo no Node e vaza entre testes.
    clearTimeout(timer);
  }
}

/**
 * Carrega o libsodium, roda o self-test e devolve a instância.
 *
 * Idempotente: chamadas concorrentes compartilham a mesma promise. Se o
 * self-test ou o carregamento falhar, a promise é rejeitada e descartada, para
 * que uma nova tentativa não receba um resultado inválido em cache.
 */
export async function initSodium(): Promise<Sodium> {
  readyPromise ??= (async (): Promise<Sodium> => {
    await awaitSodiumReady();
    runSelfTest(sodium);
    return sodium;
  })().catch((error: unknown) => {
    readyPromise = undefined;
    throw error;
  });

  return readyPromise;
}

/** Apenas para teste: descarta a instância memoizada. */
export function resetSodiumForTests(): void {
  readyPromise = undefined;
}
