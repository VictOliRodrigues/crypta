import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

import '@testing-library/jest-dom/vitest';

/**
 * O auto-cleanup do Testing Library depende dos hooks globais do runner.
 * Como `globals` está desligado, ele precisa ser registrado explicitamente —
 * sem isso o DOM acumula entre os testes e as queries passam a encontrar
 * elementos de renders anteriores.
 */
afterEach(() => {
  cleanup();
});

/**
 * `<dialog>` no jsdom: só o suficiente para o elemento aparecer e sumir.
 *
 * O jsdom não implementa `showModal`/`close`, e sem eles qualquer teste que
 * abra o W25 lança. O stub mexe apenas no atributo `open` e no evento `close`,
 * que é o que o React observa.
 *
 * **O que ele não prova, e não deve ser lido como se provasse:** prender o foco,
 * tornar o resto da página inerte e fechar no `Escape` são responsabilidade do
 * navegador. Essa garantia vem de usar o elemento nativo, não destes testes, e
 * só é verificável em navegador real.
 */
const dialogPrototype = globalThis.HTMLDialogElement?.prototype;

if (dialogPrototype !== undefined && typeof dialogPrototype.showModal !== 'function') {
  dialogPrototype.showModal = function showModal(this: HTMLDialogElement): void {
    this.open = true;
  };

  dialogPrototype.close = function close(this: HTMLDialogElement, returnValue?: string): void {
    this.open = false;

    if (returnValue !== undefined) {
      this.returnValue = returnValue;
    }

    this.dispatchEvent(new Event('close'));
  };
}
