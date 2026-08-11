import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter, useRoutes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSessionStore } from '@/features/auth/stores/session-store';

import { routes } from './routes';

/**
 * O grafo de rotas real, montado.
 *
 * Este arquivo existe por causa de um defeito que chegou a development: o
 * `signIn` completava — parâmetros, `POST /auth/login`, key bundle, desbloqueio
 * — e a tela continuava sendo o formulário de login, porque nada tirava de
 * `/login` quem já tinha sessão. Não havia erro para exibir, então autenticar
 * com sucesso ficava indistinguível de errar a senha.
 *
 * Nenhum teste montava as rotas, e por isso nenhum reprovou. Testar as guardas
 * isoladamente não bastaria: o defeito era a guarda **ausente do roteador**, e
 * só montar o grafo de verdade pega isso.
 *
 * Usa `useRoutes` sob `MemoryRouter` em vez de `createMemoryRouter`: o data
 * router do React Router falha no jsdom com um `AbortSignal` de outro realm.
 */

vi.mock('@/features/auth/services/auth-api', () => ({
  fetchSetupStatus: vi.fn().mockResolvedValue({ setupRequired: false }),
  fetchKdfParameters: vi.fn(),
  createFirstUser: vi.fn(),
  login: vi.fn(),
  fetchKeyBundle: vi.fn(),
  logout: vi.fn(),
}));

vi.mock('@/features/sessions/services/sessions-api', () => ({
  fetchSessions: vi.fn().mockResolvedValue([]),
  revokeSession: vi.fn(),
  revokeOtherSessions: vi.fn(),
  revokeAllSessions: vi.fn(),
}));

vi.mock('@/features/diagnostics/services/diagnostics-api', () => ({
  fetchApiVersion: vi.fn().mockResolvedValue({
    service: 'crypta-api',
    version: '0.1.0',
    commit: 'abc1234',
    environment: 'development',
    builtAt: '2026-08-05T00:00:00.000Z',
  }),
  fetchApiReadiness: vi.fn().mockResolvedValue({ status: 'ready', database: 'ok' }),
}));

const SESSION = {
  accessToken: 'token',
  user: { id: 'u1', name: 'Alice', email: 'alice@example.test' },
  keyPair: null,
  userEncryptionKey: null,
};

const EMPTY = { accessToken: null, user: null, keyPair: null, userEncryptionKey: null };

function Routed() {
  return useRoutes(routes);
}

function renderAt(path: string): void {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routed />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('rotas da aplicação', () => {
  beforeEach(() => {
    useSessionStore.setState(EMPTY);
  });

  it('mostra o login para quem não tem sessão', async () => {
    renderAt('/login');

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
  });

  /** O defeito. Com sessão viva, `/login` não pode continuar sendo o login. */
  it('tira de /login quem já tem sessão', async () => {
    useSessionStore.setState(SESSION);

    renderAt('/login');

    expect(await screen.findByRole('heading', { name: 'Crypta' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Entrar' })).not.toBeInTheDocument();
  });

  it('tira de /setup quem já tem sessão', async () => {
    useSessionStore.setState(SESSION);

    renderAt('/setup');

    expect(await screen.findByRole('heading', { name: 'Crypta' })).toBeInTheDocument();
  });

  it('manda para o login quem tenta uma rota protegida sem sessão', async () => {
    renderAt('/configuracoes');

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('deixa passar quem tem sessão numa rota protegida', async () => {
    useSessionStore.setState(SESSION);

    renderAt('/configuracoes');

    expect(
      await screen.findByRole('heading', { name: 'Configurações da conta' }),
    ).toBeInTheDocument();
  });

  /** Tenta uma rota protegida, é mandado ao login, autentica e volta para lá. */
  it('devolve o usuário à rota que ele tentou abrir', async () => {
    renderAt('/configuracoes');

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();

    act(() => {
      useSessionStore.setState(SESSION);
    });

    expect(
      await screen.findByRole('heading', { name: 'Configurações da conta' }),
    ).toBeInTheDocument();
  });
});
