import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * O libsodium é substituído por um dublê cujo `ready` **nunca resolve**.
 *
 * É exatamente o que acontece no navegador quando a compilação de WebAssembly é
 * recusada: `libsodium-wrappers` deixa a promise pendente em vez de rejeitá-la.
 * Sem um teto, quem chamou espera para sempre — na Web, um botão preso em
 * "Entrando…", sem erro, sem requisição e sem pista no console.
 */
vi.mock('libsodium-wrappers-sumo', () => ({
  default: {
    ready: new Promise(() => undefined),
    crypto_pwhash: () => new Uint8Array(32),
    crypto_pwhash_ALG_ARGON2ID13: 2,
  },
}));

import { CryptoInitializationError, initSodium, resetSodiumForTests } from './sodium';

describe('initSodium quando o WebAssembly não fica pronto', () => {
  beforeEach(() => {
    resetSodiumForTests();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    resetSodiumForTests();
  });

  /** A propriedade central: a promise termina. Antes desta correção, não terminava. */
  it('rejeita em vez de esperar para sempre', async () => {
    const pending = initSodium();
    const assertion = expect(pending).rejects.toBeInstanceOf(CryptoInitializationError);

    await vi.advanceTimersByTimeAsync(10_000);

    await assertion;
  });

  it('explica a causa provável e o contorno, em vez de falhar em branco', async () => {
    const pending = initSodium();
    const assertion = expect(pending).rejects.toThrow(/WebAssembly/);

    await vi.advanceTimersByTimeAsync(10_000);

    await assertion;
  });

  /** Antes do teto, nada acontecia neste intervalo — e continua não acontecendo. */
  it('não desiste antes do prazo', async () => {
    let settled = false;
    const pending = initSodium().catch(() => {
      settled = true;
    });

    await vi.advanceTimersByTimeAsync(9_000);
    expect(settled).toBe(false);

    await vi.advanceTimersByTimeAsync(2_000);
    await pending;
    expect(settled).toBe(true);
  });

  /**
   * A promise memoizada é descartada na falha.
   *
   * Sem isso, uma segunda tentativa receberia a rejeição em cache e o usuário
   * nunca conseguiria se recuperar sem recarregar a página — mesmo depois de
   * desativar a extensão que causou o bloqueio.
   */
  it('permite nova tentativa depois de falhar', async () => {
    const first = initSodium();
    const firstAssertion = expect(first).rejects.toBeInstanceOf(CryptoInitializationError);
    await vi.advanceTimersByTimeAsync(10_000);
    await firstAssertion;

    const second = initSodium();
    const secondAssertion = expect(second).rejects.toBeInstanceOf(CryptoInitializationError);
    await vi.advanceTimersByTimeAsync(10_000);
    await secondAssertion;

    expect(second).not.toBe(first);
  });
});
