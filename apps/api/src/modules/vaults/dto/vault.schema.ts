import { z } from 'zod';

import { PAGINATION, VAULT_ROLES } from '@crypta/contracts';
import {
  encryptedPayloadSchema,
  expectedVersionSchema,
  keyEnvelopeSchema,
  vaultIdSchema,
} from '@crypta/validation';

/**
 * Entradas das rotas de cofre (docs/API.md secoes 33 a 37).
 *
 * `.strict()` em todos os corpos: campo desconhecido é `400`, nunca descartado
 * em silêncio. É o que faz um `name` em texto aberto parar na porta — o cofre
 * tem nome, e o servidor não pode recebê-lo (`CLAUDE.md` secao 7).
 */

export const createVaultRequestSchema = z
  .object({
    /**
     * Gerado pelo cliente (ADR 0025). A API valida e não corrige: um id que ela
     * escolhesse produziria metadata que ninguém abre, porque a AAD já foi
     * amarrada ao id que o cliente usou para cifrar.
     */
    id: vaultIdSchema,
    encryptedMetadata: encryptedPayloadSchema,
    ownerEnvelope: keyEnvelopeSchema,
  })
  .strict();

export type CreateVaultRequest = z.infer<typeof createVaultRequestSchema>;

export const updateVaultRequestSchema = z
  .object({
    expectedVersion: expectedVersionSchema,
    encryptedMetadata: encryptedPayloadSchema,
  })
  .strict();

export type UpdateVaultRequest = z.infer<typeof updateVaultRequestSchema>;

/**
 * Corpo da exclusão.
 *
 * `confirmation` é exigido pela `API.md` secao 37 e existe porque a exclusão é
 * física e irreversível (ADR 0020). Não substitui a confirmação da interface —
 * é a garantia de que um `DELETE` disparado por engano, sem corpo, não apague
 * um cofre.
 */
export const deleteVaultRequestSchema = z
  .object({
    expectedVersion: expectedVersionSchema,
    confirmation: z.literal(true, { message: 'Confirme a exclusão do cofre.' }),
  })
  .strict();

export type DeleteVaultRequest = z.infer<typeof deleteVaultRequestSchema>;

const vaultTypeFilterSchema = z.enum(['all', 'private', 'shared']).default('all');

/**
 * Query de listagem.
 *
 * `type` filtra por forma de acesso e não por papel: `private` é o cofre em que
 * o usuário é o único membro. Na R0.3 todo cofre é privado — o filtro nasce
 * junto porque a W05 já o exibe, e acrescentá-lo depois mudaria o contrato de
 * uma rota publicada.
 */
export const listVaultsQuerySchema = z
  .object({
    cursor: vaultIdSchema.optional(),
    limit: z.coerce
      .number({ message: 'Limite inválido.' })
      .int({ message: 'Limite inválido.' })
      .min(1, { message: 'Limite inválido.' })
      .max(PAGINATION.maxLimit, { message: `O limite máximo é ${String(PAGINATION.maxLimit)}.` })
      .default(PAGINATION.defaultLimit),
    type: vaultTypeFilterSchema,
    role: z.enum(VAULT_ROLES).optional(),
  })
  .strict();

export type ListVaultsQuery = z.infer<typeof listVaultsQuerySchema>;
