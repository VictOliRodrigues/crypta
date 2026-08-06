import { z } from 'zod';

/**
 * Schemas primitivos reutilizados por formulários da Web, telas do Android e
 * DTOs da API.
 *
 * Estes schemas validam ESTRUTURA. Autorização continua exclusiva do backend
 * (CLAUDE.md secao 32) e nenhum deles pode ser usado como substituto de policy.
 *
 * As mensagens ficam em português do Brasil porque são exibidas ao usuário
 * (STYLE_GUIDE.md secao 3).
 */

/** Comprimentos máximos de campos não sensíveis, em caracteres. */
export const FIELD_LIMITS = {
  email: 254,
  displayName: 120,
} as const;

/**
 * A normalização acontece ANTES da validação: colar um e-mail com espaço no
 * fim ou com maiúsculas é comum e não deve virar erro de formulário. Validar
 * primeiro rejeitaria entradas perfeitamente recuperáveis.
 */
export const emailSchema = z
  .string({ message: 'Informe um e-mail válido.' })
  .trim()
  .transform((value) => value.toLowerCase())
  .pipe(
    z.email({ message: 'Informe um e-mail válido.' }).max(FIELD_LIMITS.email, {
      message: `O e-mail deve ter no máximo ${FIELD_LIMITS.email} caracteres.`,
    }),
  );

export const displayNameSchema = z
  .string({ message: 'Informe um nome.' })
  .trim()
  .min(1, { message: 'Informe um nome.' })
  .max(FIELD_LIMITS.displayName, {
    message: `O nome deve ter no máximo ${FIELD_LIMITS.displayName} caracteres.`,
  });

/** Identificador de recurso. Todo ID público do sistema é um UUID. */
export const uuidSchema = z.uuid({ message: 'Identificador inválido.' });

/**
 * Link de site.
 *
 * Somente `http` e `https` são aceitos: esquemas como `javascript:` ou `data:`
 * viram vetor de XSS quando o link é renderizado como âncora clicável.
 */
export const httpUrlSchema = z.url({ message: 'Informe um endereço válido.' }).refine(
  (value) => {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  },
  { message: 'O endereço deve começar com http:// ou https://.' },
);
