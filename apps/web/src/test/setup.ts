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
