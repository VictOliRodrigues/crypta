import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { type Argon2idParameters, type UserKeyBundle } from '@crypta/crypto-core';

import { changePassword, fetchKeyBundle } from '../services/auth-api';
import { deriveIdentity, resealKeyBundle, rotateKdfSalt } from '../services/identity';
import { useSessionStore } from '../stores/session-store';
import { useChangePassword, VaultLockedError } from './use-change-password';

/**
 * Orquestração da troca de senha.
 *
 * A criptografia real é provada em `@crypta/crypto-web`, contra `@noble/*`. O
 * que se prova aqui é a **ordem**, e ela é o que importa em segurança: derivar
 * antes de enviar, reproteger com o par que já está em memória, e mandar para a
 * rede apenas o que é derivado. Uma ordem errada neste fluxo significa mandar a
 * senha.
 *
 * O ambiente é jsdom, por causa do React, e por isso os módulos de identidade
 * são dublês: o libsodium recusa um `Uint8Array` que não seja do próprio realm,
 * o mesmo motivo pelo qual `identity.test.ts` roda em node.
 */

vi.mock('../services/auth-api', () => ({
  fetchKeyBundle: vi.fn(),
  changePassword: vi.fn(),
}));

vi.mock('../services/identity', () => ({
  deriveIdentity: vi.fn(),
  resealKeyBundle: vi.fn(),
  rotateKdfSalt: vi.fn(),
}));

const CURRENT_PARAMETERS: Argon2idParameters = {
  memoryKib: 65536,
  iterations: 3,
  parallelism: 1,
  salt: 'AQIDBAUGBwgJCgsMDQ4PEA',
};

const ROTATED_PARAMETERS: Argon2idParameters = {
  ...CURRENT_PARAMETERS,
  salt: 'EA8ODQwLCgkIBwYFBAMCAQ',
};

const CURRENT_BUNDLE: UserKeyBundle = {
  kdfAlgorithm: 'ARGON2ID',
  kdfVersion: 1,
  kdfSalt: CURRENT_PARAMETERS.salt,
  kdfMemory: CURRENT_PARAMETERS.memoryKib,
  kdfIterations: CURRENT_PARAMETERS.iterations,
  kdfParallelism: CURRENT_PARAMETERS.parallelism,
  publicKey: 'AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE',
  encryptedPrivateKey: 'AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC',
  privateKeyNonce: 'AwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD',
  cryptoVersion: 1,
  schemaVersion: 1,
};

const RESEALED_BUNDLE: UserKeyBundle = { ...CURRENT_BUNDLE, kdfSalt: ROTATED_PARAMETERS.salt };

const KEY_PAIR = {
  publicKey: new Uint8Array(32).fill(0xaa),
  privateKey: new Uint8Array(32).fill(0xbb),
};

const OLD_ENCRYPTION_KEY = new Uint8Array(32).fill(0x01);
const NEW_ENCRYPTION_KEY = new Uint8Array(32).fill(0x02);

const CURRENT_PASSWORD = 'senha-atual-que-serve';
const NEW_PASSWORD = 'senha-nova-bem-comprida';

const CURRENT_AUTH_SECRET = 'auth-secret-atual';
const NEW_AUTH_SECRET = 'auth-secret-novo';

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

async function changeWith(revokeOtherSessions = true): Promise<void> {
  const { result } = renderHook(() => useChangePassword(), { wrapper });

  await result.current.mutateAsync({
    currentPassword: CURRENT_PASSWORD,
    newPassword: NEW_PASSWORD,
    revokeOtherSessions,
  });
}

describe('useChangePassword', () => {
  beforeEach(() => {
    // Limpa o histórico de chamadas, não as implementações: sem isto os testes
    // que contam chamadas leem as das rodadas anteriores.
    vi.clearAllMocks();

    vi.mocked(fetchKeyBundle).mockResolvedValue(CURRENT_BUNDLE);
    vi.mocked(changePassword).mockResolvedValue(undefined);
    vi.mocked(rotateKdfSalt).mockResolvedValue(ROTATED_PARAMETERS);
    vi.mocked(resealKeyBundle).mockResolvedValue(RESEALED_BUNDLE);
    vi.mocked(deriveIdentity).mockImplementation(({ parameters }) =>
      Promise.resolve(
        parameters.salt === CURRENT_PARAMETERS.salt
          ? { authSecret: CURRENT_AUTH_SECRET, userEncryptionKey: OLD_ENCRYPTION_KEY }
          : { authSecret: NEW_AUTH_SECRET, userEncryptionKey: NEW_ENCRYPTION_KEY },
      ),
    );

    useSessionStore.setState({
      accessToken: 'token',
      user: { id: 'u1', name: 'Alice', email: 'alice@example.test' },
      keyPair: KEY_PAIR,
      userEncryptionKey: OLD_ENCRYPTION_KEY,
    });
  });

  /** O item de gate desta tela: nenhuma das duas senhas chega à rede. */
  it('envia AuthSecret, nunca senha', async () => {
    await changeWith();

    const [sent] = vi.mocked(changePassword).mock.calls[0] ?? [];
    const serialized = JSON.stringify(sent);

    expect(serialized).not.toContain(CURRENT_PASSWORD);
    expect(serialized).not.toContain(NEW_PASSWORD);
    expect(sent?.currentAuthSecret).toBe(CURRENT_AUTH_SECRET);
    expect(sent?.newAuthSecret).toBe(NEW_AUTH_SECRET);
  });

  /**
   * Os parâmetros vêm do bundle do servidor, não de um padrão local: o ADR 0018
   * permite que uma conta antiga tenha custo diferente do de hoje, e derivar com
   * o parâmetro errado apareceria ao usuário como "senha incorreta".
   */
  it('deriva a senha atual com os parâmetros gravados na conta', async () => {
    await changeWith();

    expect(deriveIdentity).toHaveBeenCalledWith({
      password: CURRENT_PASSWORD,
      parameters: CURRENT_PARAMETERS,
    });
  });

  it('deriva a senha nova sob um salt rotacionado', async () => {
    await changeWith();

    expect(rotateKdfSalt).toHaveBeenCalledWith(CURRENT_PARAMETERS);
    expect(deriveIdentity).toHaveBeenCalledWith({
      password: NEW_PASSWORD,
      parameters: ROTATED_PARAMETERS,
    });
  });

  it('reprotege o par que já está em memória, com a chave nova', async () => {
    await changeWith();

    expect(resealKeyBundle).toHaveBeenCalledWith({
      keyPair: KEY_PAIR,
      userEncryptionKey: NEW_ENCRYPTION_KEY,
      parameters: ROTATED_PARAMETERS,
    });
  });

  it('deriva antes de enviar', async () => {
    await changeWith();

    const derivedAt = vi.mocked(deriveIdentity).mock.invocationCallOrder[0] ?? Infinity;
    const sentAt = vi.mocked(changePassword).mock.invocationCallOrder[0] ?? 0;

    expect(derivedAt).toBeLessThan(sentAt);
  });

  /**
   * A sessão sobrevive à troca, mas a chave que abre o cofre é outra. Deixar a
   * antiga no store faria a próxima abertura falhar com erro de autenticação da
   * AEAD — sintoma que não aponta para a causa.
   */
  it('substitui a UserEncryptionKey do store, preservando o par', async () => {
    await changeWith();

    await waitFor(() => {
      expect(useSessionStore.getState().userEncryptionKey).toBe(NEW_ENCRYPTION_KEY);
    });
    expect(useSessionStore.getState().keyPair).toBe(KEY_PAIR);
  });

  it('repassa a escolha de encerrar as outras sessões', async () => {
    await changeWith(false);

    expect(vi.mocked(changePassword).mock.calls[0]?.[0].revokeOtherSessions).toBe(false);
  });

  /**
   * Cofre trancado: a página foi recarregada e o par se perdeu. Sem ele não há o
   * que reproteger, e seguir adiante geraria um par novo — que a API recusa, e
   * que tornaria ilegível todo cofre existente.
   */
  it('recusa quando o cofre está bloqueado, antes de qualquer derivação', async () => {
    useSessionStore.setState({ keyPair: null, userEncryptionKey: null });

    await expect(changeWith()).rejects.toBeInstanceOf(VaultLockedError);

    expect(deriveIdentity).not.toHaveBeenCalled();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it('não mexe no store quando a API recusa', async () => {
    vi.mocked(changePassword).mockRejectedValue(new Error('recusado'));

    await expect(changeWith()).rejects.toThrow();

    expect(useSessionStore.getState().userEncryptionKey).toBe(OLD_ENCRYPTION_KEY);
  });
});
