/**
 * Fila de refresh concorrente (CLAUDE.md secao 24).
 *
 * Várias requisições podem receber `401` ao mesmo tempo — é o caso normal
 * quando o access token expira com a tela carregando vários dados. Sem fila,
 * cada uma dispararia o próprio `POST /auth/refresh`, e o servidor veria N
 * rotações concorrentes da mesma sessão.
 *
 * O ADR 0024 faz com que isso não derrube a sessão, mas continua sendo trabalho
 * desperdiçado e uma corrida desnecessária. A fila garante **um refresh em voo
 * por vez**: a primeira requisição a falhar dispara, as demais aguardam o mesmo
 * resultado, e todas são reexecutadas depois.
 *
 * A promise é compartilhada, não copiada. Um `Promise` já em andamento entrega o
 * mesmo valor a todos os `await`, que é exatamente a semântica desejada aqui.
 */

export type RefreshQueue = {
  /**
   * Executa o refresh, ou espera o que já está em voo.
   *
   * Resolve com `true` quando a sessão foi renovada. `false` significa que a
   * renovação falhou e o chamador deve desistir — nunca tentar de novo, ou o
   * `401` seguinte reiniciaria o ciclo.
   */
  run: () => Promise<boolean>;
  /** Existe para os testes: derruba o estado entre casos. */
  reset: () => void;
};

export function createRefreshQueue(refresh: () => Promise<boolean>): RefreshQueue {
  let inFlight: Promise<boolean> | null = null;

  return {
    run: () => {
      // `??=` não serve: seria preciso limpar `inFlight` no `finally`, e a
      // atribuição precisa acontecer antes de qualquer `await` para que uma
      // segunda chamada síncrona encontre a promise já registrada.
      if (inFlight === null) {
        inFlight = refresh().finally(() => {
          inFlight = null;
        });
      }

      return inFlight;
    },

    reset: () => {
      inFlight = null;
    },
  };
}
