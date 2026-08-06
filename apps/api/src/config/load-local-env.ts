import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Carrega o `.env` da raiz do monorepo em execução local.
 *
 * Usa `process.loadEnvFile` do Node, sem dependência adicional. Em imagem de
 * container não existe `.env` e a configuração vem inteiramente das variáveis
 * do ambiente — por isso a função é silenciosa quando o arquivo não existe, e
 * nunca sobrescreve o que já está definido no processo.
 */
export function loadLocalEnv(): void {
  if (process.env['NODE_ENV'] === 'production') {
    return;
  }

  const envFile = resolve(__dirname, '../../../../.env');

  if (!existsSync(envFile)) {
    return;
  }

  process.loadEnvFile(envFile);
}
