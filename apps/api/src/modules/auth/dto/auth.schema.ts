import { z } from 'zod';

import { CLIENT_TYPES } from '@crypta/contracts';
import { authSecretSchema, emailSchema, FIELD_LIMITS } from '@crypta/validation';

/**
 * Entradas de login e refresh (docs/API.md secoes 22 e 23).
 */

const clientSchema = z
  .object({
    type: z.enum(CLIENT_TYPES),
    name: z.string().trim().min(1).max(FIELD_LIMITS.displayName).optional(),
  })
  .strict();

export const loginRequestSchema = z
  .object({
    email: emailSchema,
    authSecret: authSecretSchema,
    client: clientSchema.optional(),
  })
  .strict();

export type LoginRequest = z.infer<typeof loginRequestSchema>;

/**
 * Corpo do refresh.
 *
 * Vazio na Web, onde o token vem do cookie. O `refreshToken` no corpo existe
 * apenas para o Android, que guarda o valor no Keystore e não tem cookie.
 */
export const refreshRequestSchema = z
  .object({
    refreshToken: z.string().min(1).max(256).optional(),
  })
  .strict();
