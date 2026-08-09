import { beforeEach, describe, expect, it } from 'vitest';

import { useSessionStore } from './session-store';

/**
 * Sessão em memória.
 *
 * Cobertura acrescentada pela revisão criptográfica do `BLG-0707`. O que se
 * prova aqui é que `clear` desmonta o material de chave de verdade — soltar a
 * referência e sobrescrever os bytes.
 */

const EMPTY_STATE = {
  accessToken: null,
  user: null,
  keyPair: null,
  userEncryptionKey: null,
};

function unlockedSession() {
  const privateKey = new Uint8Array(32).fill(0xbb);
  const userEncryptionKey = new Uint8Array(32).fill(0xcc);

  useSessionStore.setState({
    accessToken: 'token',
    user: { id: 'u1', name: 'Alice', email: 'alice@example.test' },
    keyPair: { publicKey: new Uint8Array(32).fill(0xaa), privateKey },
    userEncryptionKey,
  });

  return { privateKey, userEncryptionKey };
}

describe('sessionStore', () => {
  beforeEach(() => {
    useSessionStore.setState(EMPTY_STATE);
  });

  it('solta o material de chave no clear', () => {
    unlockedSession();

    useSessionStore.getState().clear();

    const state = useSessionStore.getState();

    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
    expect(state.keyPair).toBeNull();
    expect(state.userEncryptionKey).toBeNull();
  });

  /**
   * Sobrescrever não garante que o segredo sumiu da memória — o motor pode ter
   * copiado o buffer. Encurta a janela em que um heap dump depois do logout
   * ainda traria a chave, e é defesa em profundidade, não substituto de não
   * persistir.
   */
  it('zera os bytes da UserEncryptionKey e da chave privada', () => {
    const { privateKey, userEncryptionKey } = unlockedSession();

    useSessionStore.getState().clear();

    expect(Array.from(userEncryptionKey).every((byte) => byte === 0)).toBe(true);
    expect(Array.from(privateKey).every((byte) => byte === 0)).toBe(true);
  });

  it('não quebra ao limpar uma sessão que nunca foi desbloqueada', () => {
    useSessionStore.setState({ ...EMPTY_STATE, accessToken: 'token' });

    expect(() => {
      useSessionStore.getState().clear();
    }).not.toThrow();
  });

  /** A chave pública não é segredo, e zerá-la esconderia um erro de troca. */
  it('não zera a chave pública', () => {
    const publicKey = new Uint8Array(32).fill(0xaa);
    useSessionStore.setState({
      keyPair: { publicKey, privateKey: new Uint8Array(32).fill(0xbb) },
    });

    useSessionStore.getState().clear();

    expect(Array.from(publicKey).every((byte) => byte === 0xaa)).toBe(true);
  });
});
