import { z } from 'zod';

import { APP_ENVIRONMENTS } from '@vault/contracts';

/**
 * Configuração pública da Web.
 *
 * Tudo aqui é embutido no bundle e visível para qualquer pessoa que abrir o
 * DevTools. Nenhum segredo pode entrar nesta lista (STYLE_GUIDE.md secao 66).
 */
const webEnvSchema = z.object({
  VITE_API_BASE_URL: z.url({ message: 'VITE_API_BASE_URL deve ser uma URL absoluta.' }),
  VITE_APP_ENVIRONMENT: z.enum(APP_ENVIRONMENTS),
  VITE_APP_VERSION: z.string().min(1).default('0.0.0-local'),
  VITE_APP_COMMIT: z.string().min(1).default('local'),
});

export type WebEnv = z.infer<typeof webEnvSchema>;

/**
 * Valida na inicialização do módulo.
 *
 * Falhar aqui é melhor do que descobrir uma `VITE_API_BASE_URL` apontando para
 * o ambiente errado depois do deploy — em um cofre de senhas, isso significaria
 * o cliente conversando com o backend errado.
 */
function loadEnv(): WebEnv {
  const result = webEnvSchema.safeParse(import.meta.env);

  if (!result.success) {
    const fields = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');

    throw new Error(`Configuração da aplicação Web inválida: ${fields}`);
  }

  return result.data;
}

export const env: WebEnv = loadEnv();

export const buildInfo = {
  environment: env.VITE_APP_ENVIRONMENT,
  version: env.VITE_APP_VERSION,
  commit: env.VITE_APP_COMMIT,
} as const;
