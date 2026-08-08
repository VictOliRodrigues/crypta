/**
 * @vitest-environment node
 *
 * Precisa rodar fora do jsdom: o `TextEncoder` do jsdom produz `Uint8Array` de
 * outro realm, o que quebra uma invariante interna do esbuild e impede o build
 * do Vite dentro do teste.
 */

import { rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { build } from 'vite';
import { beforeAll, describe, expect, it } from 'vitest';

/**
 * Garante que o bundle da Web carrega o libsodium por WebAssembly, e nunca pelo
 * fallback `wasm2js`.
 *
 * Esta é a mitigação principal do ADR 0016 e ela não é teórica: o build
 * CommonJS do libsodium embute um segundo interpretador que, acima de cerca de
 * 72 MiB, devolve uma chave de Argon2id **errada sem lançar erro**. Um usuário
 * que caísse nesse caminho gravaria o cofre sob uma chave irreproduzível.
 *
 * O ADR decidiu usar somente o build ESM, que não tem fallback e falha alto.
 * Quem garante isso é a condição `import` do `exports` do pacote — resolvida
 * pelo bundler, não por nós. Este teste trava esse comportamento: se uma
 * mudança de configuração, de bundler ou de versão fizer a resolução cair no
 * CommonJS, ele reprova.
 */
describe('bundle criptográfico da Web', () => {
  const outDir = fileURLToPath(new URL('../../.vitest-crypto-bundle/', import.meta.url));
  let bundle = '';

  beforeAll(async () => {
    const result = await build({
      configFile: fileURLToPath(new URL('../../vite.config.ts', import.meta.url)),
      logLevel: 'error',
      build: {
        outDir,
        emptyOutDir: true,
        sourcemap: false,
        rollupOptions: {
          input: fileURLToPath(new URL('./fixtures/crypto-bundle-probe.ts', import.meta.url)),
          output: { entryFileNames: 'probe.js' },
          preserveEntrySignatures: 'strict',
        },
      },
    });

    const outputs = Array.isArray(result) ? result : [result];
    const chunks = outputs.flatMap((item) => ('output' in item ? item.output : []));

    bundle = chunks
      .map((chunk) => (chunk.type === 'chunk' ? chunk.code : String(chunk.source)))
      .join('\n');

    await rm(outDir, { recursive: true, force: true });
  }, 180_000);

  /**
   * Marcadores presentes duas vezes no build CommonJS do `libsodium-sumo` e
   * nenhuma vez no ESM — verificado contra os dois artefatos publicados.
   */
  it.each(['useBackupModule', 'isWasm2js'])('não embute o fallback wasm2js (%s)', (marker) => {
    expect(bundle).not.toContain(marker);
  });

  /**
   * Sem isto o teste acima seria vacuoso: um bundle onde o tree-shaking removeu
   * o libsodium também não conteria os marcadores.
   */
  it('embute de fato o libsodium por WebAssembly', () => {
    expect(bundle).toContain('WebAssembly.instantiate');
    expect(bundle).toContain('crypto_pwhash');
  });
});
