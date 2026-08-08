import { z } from 'zod';

import {
  authSecretSchema,
  displayNameSchema,
  emailSchema,
  keyBundleSchema,
} from '@crypta/validation';

/**
 * Entradas das rotas de setup e parâmetros.
 *
 * Os schemas de campo vêm de `@crypta/validation`, compartilhados com o
 * formulário da Web. O que é montado aqui é apenas a forma do corpo de cada
 * rota.
 *
 * `.strict()` em todos: campo desconhecido é recusado com `400`, nunca
 * ignorado. É o que garante que um `privateKey` em texto aberto no corpo do
 * setup pare na porta, em vez de ser descartado em silêncio enquanto o cliente
 * acredita tê-lo enviado (`SECURITY.md` secao 10).
 */

export const setupRequestSchema = z
  .object({
    name: displayNameSchema,
    email: emailSchema,
    authSecret: authSecretSchema,
    keyBundle: keyBundleSchema,
  })
  .strict();

export type SetupRequest = z.infer<typeof setupRequestSchema>;

export const authParametersQuerySchema = z
  .object({
    email: emailSchema,
  })
  .strict();

export type AuthParametersQuery = z.infer<typeof authParametersQuerySchema>;

/**
 * Header `Idempotency-Key` (docs/API.md secao 20).
 *
 * UUID em vez de string livre: a chave é o que distingue um retry de uma
 * requisição nova, e um cliente que mandasse um valor fixo transformaria toda
 * chamada seguinte em replay.
 */
export const idempotencyKeySchema = z.uuid({
  message: 'O header Idempotency-Key deve ser um UUID.',
});
