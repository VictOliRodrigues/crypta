import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import {
  createFirstUser,
  fetchKdfParameters,
  fetchKeyBundle,
  login as loginRequest,
  logout as logoutRequest,
} from '../services/auth-api';
import {
  buildKeyBundle,
  deriveIdentity,
  generateKdfParameters,
  openKeyBundle,
} from '../services/identity';
import { useSessionStore } from '../stores/session-store';

/**
 * Ações de autenticação: criar a primeira conta, entrar e sair.
 *
 * Cada uma delas é a sequência completa — derivar, chamar a API, desbloquear —
 * em um lugar só. Espalhá-la pelos componentes faria cada tela repetir a ordem, e
 * uma ordem errada aqui é grave: enviar antes de derivar significaria mandar a
 * senha.
 */
export function useAuthActions() {
  const queryClient = useQueryClient();
  const startSession = useSessionStore((state) => state.startSession);
  const unlock = useSessionStore((state) => state.unlock);
  const clear = useSessionStore((state) => state.clear);

  /**
   * `POST /setup` (W01).
   *
   * Os parâmetros KDF são gerados aqui, no cliente: a conta ainda não existe,
   * então não há nada a consultar. O par de chaves é criado e a metade privada
   * cifrada **antes** do envio.
   */
  const setup = useCallback(
    async (input: { name: string; email: string; password: string }) => {
      const parameters = await generateKdfParameters();
      const { authSecret, userEncryptionKey } = await deriveIdentity({
        password: input.password,
        parameters,
      });

      const { bundle, keyPair } = await buildKeyBundle({ userEncryptionKey, parameters });

      const session = await createFirstUser({
        name: input.name,
        email: input.email,
        authSecret,
        keyBundle: bundle,
        // A chave protege contra o retry de rede: o cliente não recebeu a
        // resposta, repete, e a API devolve a mesma conta em vez de recusar.
        idempotencyKey: crypto.randomUUID(),
      });

      startSession({ accessToken: session.accessToken, user: session.user });
      unlock({ keyPair, userEncryptionKey });

      await queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
    [queryClient, startSession, unlock],
  );

  /**
   * `POST /auth/login` (W02).
   *
   * Consulta os parâmetros antes de derivar — eles são por usuário, e para
   * e-mail inexistente a API devolve parâmetros sintéticos válidos, de forma que
   * este caminho não distingue os dois casos.
   */
  const signIn = useCallback(
    async (input: { email: string; password: string }) => {
      const parameters = await fetchKdfParameters(input.email);
      const { authSecret, userEncryptionKey } = await deriveIdentity({
        password: input.password,
        parameters,
      });

      const session = await loginRequest({ email: input.email, authSecret });

      startSession({ accessToken: session.accessToken, user: session.user });

      // O bundle só é buscado depois de autenticar: a rota é protegida. Abrir a
      // chave privada aqui também valida que o servidor não trocou a pública.
      const bundle = await fetchKeyBundle();
      const keyPair = await openKeyBundle({ userEncryptionKey, bundle });

      unlock({ keyPair, userEncryptionKey });

      await queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
    [queryClient, startSession, unlock],
  );

  /**
   * Encerra a sessão.
   *
   * A ordem importa: limpar o estado local acontece **sempre**, mesmo que a
   * chamada à API falhe. Uma falha de rede não pode deixar chaves abertas em
   * memória depois de o usuário ter pedido para sair.
   */
  const signOut = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      clear();
      queryClient.clear();
    }
  }, [clear, queryClient]);

  return { setup, signIn, signOut };
}
