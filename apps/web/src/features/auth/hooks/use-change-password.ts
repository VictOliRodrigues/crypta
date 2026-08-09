import { useMutation, useQueryClient } from '@tanstack/react-query';

import { kdfParametersFromBundle, parseUserKeyBundle } from '@crypta/crypto-core';

import { changePassword, fetchKeyBundle } from '../services/auth-api';
import { deriveIdentity, resealKeyBundle, rotateKdfSalt } from '../services/identity';
import { useSessionStore } from '../stores/session-store';

/**
 * Troca de senha (W24, aba Segurança).
 *
 * A ordem inteira vive aqui, e não no componente, pelo mesmo motivo das demais
 * ações de autenticação: uma ordem errada neste fluxo significa mandar a senha
 * para a rede. As duas senhas entram; o que sai são dois `AuthSecret` e um
 * bundle já cifrado.
 *
 * ```text
 * senha atual → Argon2id(salt atual) → AuthSecret atual
 * senha nova  → Argon2id(salt novo)  → AuthSecret novo + UserEncryptionKey nova
 *                                       └→ reprotege o MESMO par de chaves
 * ```
 */

/**
 * O par aberto precisa estar em memória.
 *
 * Ele só existe enquanto o cofre está destrancado, e um reload o perde — o
 * store não persiste nada (`SECURITY.md` secoes 29 e 52). Sem o par não há o
 * que reproteger, e seguir adiante produziria um bundle novo com uma chave
 * pública nova, que a API recusa e que tornaria ilegível todo cofre existente.
 */
export class VaultLockedError extends Error {
  constructor() {
    super('O cofre está bloqueado.');
    this.name = 'VaultLockedError';
  }
}

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
  revokeOtherSessions: boolean;
};

export function useChangePassword() {
  const queryClient = useQueryClient();
  const keyPair = useSessionStore((state) => state.keyPair);
  const unlock = useSessionStore((state) => state.unlock);

  return useMutation({
    mutationFn: async (input: ChangePasswordInput): Promise<void> => {
      if (keyPair === null) {
        throw new VaultLockedError();
      }

      // Os parâmetros vêm do bundle do servidor, não de um valor local: são por
      // usuário, e o ADR 0018 permite que uma conta antiga tenha custo diferente
      // do padrão de hoje. Derivar com o parâmetro errado produziria um
      // `AuthSecret` que não confere, e o erro apareceria como "senha incorreta".
      // `parseUserKeyBundle` antes de ler qualquer campo: o bundle vem do
      // servidor, que é exatamente quem não deve poder alterá-lo sem ser notado.
      const currentBundle = parseUserKeyBundle(await fetchKeyBundle());
      const currentParameters = kdfParametersFromBundle(currentBundle);

      const current = await deriveIdentity({
        password: input.currentPassword,
        parameters: currentParameters,
      });

      const newParameters = await rotateKdfSalt(currentParameters);
      const next = await deriveIdentity({
        password: input.newPassword,
        parameters: newParameters,
      });

      const newKeyBundle = await resealKeyBundle({
        keyPair,
        userEncryptionKey: next.userEncryptionKey,
        parameters: newParameters,
      });

      await changePassword({
        currentAuthSecret: current.authSecret,
        newAuthSecret: next.authSecret,
        newKeyBundle,
        revokeOtherSessions: input.revokeOtherSessions,
      });

      // A sessão sobrevive à troca, mas a chave que abre o cofre é outra a
      // partir daqui. Deixar a antiga no store faria a próxima abertura falhar
      // com erro de autenticação da AEAD — sintoma que não aponta para a causa.
      unlock({ keyPair, userEncryptionKey: next.userEncryptionKey });

      // O bundle em cache é o antigo, e quem o lesse depois tentaria abrir com a
      // chave errada.
      await queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
}
