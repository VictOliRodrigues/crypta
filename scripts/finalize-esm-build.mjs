import { existsSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * Marca um diretório de saída como ESM.
 *
 * Os packages compartilhados são publicados em dois formatos: CommonJS para a
 * API NestJS e para o Jest, ESM para o bundler da Web e do mobile. Como o
 * `package.json` do package é CommonJS, os arquivos `.js` gerados em
 * `dist/esm` seriam interpretados como CommonJS pelo Node. Este marcador
 * corrige isso sem renomear tudo para `.mjs`.
 *
 * Uso: node scripts/finalize-esm-build.mjs dist/esm
 */
const target = process.argv[2];

if (target === undefined) {
  throw new Error(
    'Informe o diretório de saída ESM. Exemplo: node scripts/finalize-esm-build.mjs dist/esm',
  );
}

const directory = resolve(process.cwd(), target);

if (!existsSync(directory)) {
  throw new Error(`Diretório não encontrado: ${directory}. Rode o build de ESM antes.`);
}

writeFileSync(join(directory, 'package.json'), `${JSON.stringify({ type: 'module' }, null, 2)}\n`);
