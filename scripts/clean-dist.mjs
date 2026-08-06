import { rmSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Remove os diretórios de build de um workspace.
 *
 * Existe como arquivo em vez de um `node -e` inline porque o objeto de opções
 * do `rmSync` é reinterpretado pelo parser de argumentos do pnpm.
 *
 * Uso: node scripts/clean-dist.mjs [diretório...]  (padrão: dist)
 */
const targets = process.argv.slice(2);
const directories = targets.length > 0 ? targets : ['dist'];

for (const target of directories) {
  rmSync(resolve(process.cwd(), target), { recursive: true, force: true });
}
