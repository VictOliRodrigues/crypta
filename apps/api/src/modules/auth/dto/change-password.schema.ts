import { z } from 'zod';

import { authSecretSchema, keyBundleSchema } from '@crypta/validation';

/**
 * Corpo de `POST /users/me/change-password` (docs/API.md secao 29).
 *
 * `.strict()`, como as demais rotas de autenticação: um campo desconhecido é
 * recusado com `400`, nunca ignorado. Aqui isso vale duplo — um cliente que
 * enviasse `password` ou `privateKey` por engano precisa bater na porta, e não
 * ter o campo descartado em silêncio enquanto acredita tê-lo mandado
 * (`SECURITY.md` secao 10).
 *
 * A senha não aparece em lugar nenhum deste schema, e não é acidente: o que
 * trafega são dois `AuthSecret` derivados no cliente, o atual e o novo.
 */
export const changePasswordRequestSchema = z
  .object({
    currentAuthSecret: authSecretSchema,
    newAuthSecret: authSecretSchema,
    newKeyBundle: keyBundleSchema,
    /**
     * Padrão `true`: o caso normal de troca de senha é o de quem suspeita que
     * alguém mais tem acesso, e manter as outras sessões vivas por omissão
     * contraria o motivo da troca. Quem quiser o contrário precisa dizer.
     */
    revokeOtherSessions: z.boolean().default(true),
  })
  .strict();

export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>;
