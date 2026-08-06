import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
// `vitest/config` estende o defineConfig do Vite com a chave `test`,
// mantendo build e testes em um único arquivo de configuração.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Um único .env na raiz do monorepo serve Web e API, evitando dois arquivos
  // de configuração local divergindo em silêncio.
  envDir: fileURLToPath(new URL('../..', import.meta.url)),
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    // Source maps não são publicados: expõem a estrutura do cliente, que é
    // parte crítica do modelo de segurança (ARCHITECTURE.md secao 48.1).
    sourcemap: false,
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    // Configuração fixa para os testes, independente do .env da máquina.
    env: {
      VITE_API_BASE_URL: 'http://localhost:3000/api/v1',
      VITE_APP_ENVIRONMENT: 'development',
      VITE_APP_VERSION: '0.0.0-test',
      VITE_APP_COMMIT: 'testcommit',
    },
  },
});
