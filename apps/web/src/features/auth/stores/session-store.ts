import { create } from 'zustand';

import { type KeyPair } from '@crypta/crypto-core';

/**
 * Sessão em memória.
 *
 * **Nada aqui é persistido.** Não há `persist`, `localStorage` nem
 * `sessionStorage` — o eslint da Web proíbe os dois últimos por
 * `no-restricted-globals`, e o access token e as chaves abertas não podem
 * sobreviver ao fechamento da aba (`SECURITY.md` secoes 29 e 52).
 *
 * A consequência é deliberada: recarregar a página perde as chaves e o usuário
 * digita a senha de novo. É o que o ADR 0021 descreve ao dizer que uma sessão
 * autentica mas não descriptografa — a `UserEncryptionKey` deriva da senha e não
 * é recuperável a partir de token nenhum.
 */

export type SessionUser = {
  id: string;
  name: string;
  email: string;
};

export type SessionState = {
  /** `null` quando não autenticado, ou entre a expiração e a renovação. */
  accessToken: string | null;
  user: SessionUser | null;
  /**
   * Par X25519 aberto. Só existe enquanto o cofre está desbloqueado.
   *
   * Fica separado do `accessToken` porque os dois têm ciclos de vida
   * diferentes: o token é renovado sozinho pela fila de refresh, e o par só
   * reaparece quando a senha é digitada.
   */
  keyPair: KeyPair | null;
  /** Chave que abre o conteúdo dos cofres. Nunca sai desta memória. */
  userEncryptionKey: Uint8Array | null;

  startSession: (input: { accessToken: string; user: SessionUser }) => void;
  unlock: (input: { keyPair: KeyPair; userEncryptionKey: Uint8Array }) => void;
  setAccessToken: (accessToken: string) => void;
  clear: () => void;
};

const EMPTY = {
  accessToken: null,
  user: null,
  keyPair: null,
  userEncryptionKey: null,
} as const;

export const useSessionStore = create<SessionState>((set) => ({
  ...EMPTY,

  startSession: ({ accessToken, user }) => {
    set({ accessToken, user });
  },

  unlock: ({ keyPair, userEncryptionKey }) => {
    set({ keyPair, userEncryptionKey });
  },

  setAccessToken: (accessToken) => {
    set({ accessToken });
  },

  /**
   * Limpa tudo, inclusive o material de chave.
   *
   * Chamada no logout e sempre que o refresh falha. Deixar o `keyPair` para trás
   * manteria o conteúdo do cofre acessível a um código que rodasse depois da
   * sessão cair.
   */
  clear: () => {
    set({ ...EMPTY });
  },
}));

/**
 * Leitura fora de componente React, para o interceptor do Axios.
 *
 * O interceptor roda fora da árvore, então não pode usar o hook. `getState` é a
 * forma que o Zustand oferece para isso, e mantém uma única fonte de verdade em
 * vez de uma cópia do token viajando por outro caminho.
 */
export const sessionStore = {
  getAccessToken: (): string | null => useSessionStore.getState().accessToken,
  setAccessToken: (token: string): void => {
    useSessionStore.getState().setAccessToken(token);
  },
  clear: (): void => {
    useSessionStore.getState().clear();
  },
};
