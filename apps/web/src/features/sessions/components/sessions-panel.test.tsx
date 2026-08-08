import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { type SessionView } from '@crypta/contracts';

import { ApiRequestError } from '@/services/api-client';

import {
  fetchSessions,
  revokeAllSessions,
  revokeOtherSessions,
  revokeSession,
} from '../services/sessions-api';
import { SessionsPanel } from './sessions-panel';

/**
 * W24, aba Sessões.
 *
 * O que estes testes protegem, além da renderização: revogar a **própria**
 * sessão precisa desmontar o estado local. Sem isso a interface continuaria
 * exibindo uma lista que o servidor já não deixa recarregar, e as chaves
 * abertas continuariam em memória depois de a sessão ter caído.
 */

vi.mock('../services/sessions-api', () => ({
  fetchSessions: vi.fn(),
  revokeSession: vi.fn(),
  revokeOtherSessions: vi.fn(),
  revokeAllSessions: vi.fn(),
}));

const endLocalSession = vi.fn();

vi.mock('@/features/auth/hooks/use-auth-actions', () => ({
  useAuthActions: () => ({
    endLocalSession,
    setup: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}));

const fetchMock = vi.mocked(fetchSessions);
const revokeMock = vi.mocked(revokeSession);
const revokeOthersMock = vi.mocked(revokeOtherSessions);
const revokeAllMock = vi.mocked(revokeAllSessions);

const CHROME_WINDOWS =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const FIREFOX_LINUX = 'Mozilla/5.0 (X11; Linux x86_64; rv:135.0) Gecko/20100101 Firefox/135.0';

const CURRENT: SessionView = {
  id: '0198f0c2-0000-7000-8000-000000000001',
  clientType: 'web',
  clientName: null,
  ipAddress: '192.0.2.10',
  userAgent: CHROME_WINDOWS,
  createdAt: '2026-08-08T12:00:00.000Z',
  lastUsedAt: '2026-08-08T15:30:00.000Z',
  isCurrent: true,
};

const OTHER: SessionView = {
  id: '0198f0c2-0000-7000-8000-000000000002',
  clientType: 'web',
  clientName: null,
  ipAddress: '198.51.100.7',
  userAgent: FIREFOX_LINUX,
  createdAt: '2026-08-07T09:00:00.000Z',
  lastUsedAt: '2026-08-07T10:00:00.000Z',
  isCurrent: false,
};

function renderPanel(): void {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <SessionsPanel />
    </QueryClientProvider>,
  );
}

async function openRevokeDialogFor(deviceLabel: string): Promise<void> {
  const user = userEvent.setup();

  await user.click(await screen.findByRole('button', { name: `Revogar sessão ${deviceLabel}` }));
}

describe('SessionsPanel', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    endLocalSession.mockReset();
    fetchMock.mockResolvedValue([CURRENT, OTHER]);
    revokeMock.mockResolvedValue(undefined);
    revokeOthersMock.mockResolvedValue(undefined);
    revokeAllMock.mockResolvedValue(undefined);
  });

  it('lista as sessões com dispositivo, navegador e sistema', async () => {
    renderPanel();

    expect(await screen.findByText('Chrome no Windows')).toBeInTheDocument();
    expect(screen.getByText('Firefox no Linux')).toBeInTheDocument();
    expect(screen.getByText('198.51.100.7')).toBeInTheDocument();
  });

  it('marca qual é a sessão atual', async () => {
    renderPanel();

    const row = (await screen.findByText('Chrome no Windows')).closest('tr');

    expect(row).not.toBeNull();
    expect(within(row as HTMLElement).getByText('Sessão atual')).toBeInTheDocument();
  });

  it('mostra o estado de carregamento antes da resposta', () => {
    fetchMock.mockReturnValue(new Promise(() => undefined));
    renderPanel();

    expect(screen.getByText('Carregando sessões…')).toBeInTheDocument();
  });

  it('distingue lista vazia de falha', async () => {
    fetchMock.mockResolvedValue([]);
    renderPanel();

    expect(await screen.findByText('Nenhuma sessão ativa.')).toBeInTheDocument();
  });

  it('oferece nova tentativa quando a consulta falha', async () => {
    fetchMock.mockRejectedValue(
      new ApiRequestError('INTERNAL_ERROR', 'Falha ao carregar.', null, 500),
    );
    renderPanel();

    expect(await screen.findByText('Falha ao carregar.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument();
  });

  it('pede confirmação antes de revogar, com os dados da sessão', async () => {
    renderPanel();
    await openRevokeDialogFor('Firefox no Linux');

    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).getByRole('heading', { name: 'Revogar sessão' })).toBeInTheDocument();
    expect(within(dialog).getByText('Firefox no Linux')).toBeInTheDocument();
    expect(within(dialog).getByText('198.51.100.7')).toBeInTheDocument();
    expect(revokeMock).not.toHaveBeenCalled();
  });

  it('cancelar fecha o diálogo sem revogar', async () => {
    const user = userEvent.setup();
    renderPanel();
    await openRevokeDialogFor('Firefox no Linux');

    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancelar' }),
    );

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(revokeMock).not.toHaveBeenCalled();
  });

  it('revoga outra sessão e recarrega a lista, sem encerrar a local', async () => {
    const user = userEvent.setup();
    renderPanel();
    await openRevokeDialogFor('Firefox no Linux');

    fetchMock.mockResolvedValue([CURRENT]);

    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Revogar sessão' }),
    );

    await waitFor(() => {
      expect(revokeMock).toHaveBeenCalledWith(OTHER.id);
    });
    await waitFor(() => {
      expect(screen.queryByText('Firefox no Linux')).not.toBeInTheDocument();
    });
    expect(endLocalSession).not.toHaveBeenCalled();
  });

  it('avisa que a sessão já havia caído em vez de culpar o usuário', async () => {
    const user = userEvent.setup();
    revokeMock.mockRejectedValue(
      new ApiRequestError('RESOURCE_NOT_FOUND', 'Sessão não encontrada.', null, 404),
    );
    renderPanel();
    await openRevokeDialogFor('Firefox no Linux');

    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Revogar sessão' }),
    );

    expect(await screen.findByText('Esta sessão já havia sido encerrada.')).toBeInTheDocument();
  });

  it('revogar a própria sessão desmonta o estado local', async () => {
    const user = userEvent.setup();
    renderPanel();
    await openRevokeDialogFor('Chrome no Windows');

    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Revogar sessão' }),
    );

    await waitFor(() => {
      expect(endLocalSession).toHaveBeenCalledTimes(1);
    });
  });

  it('encerrar outras sessões preserva a atual', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(await screen.findByRole('button', { name: 'Encerrar outras sessões' }));

    await waitFor(() => {
      expect(revokeOthersMock).toHaveBeenCalledTimes(1);
    });
    expect(endLocalSession).not.toHaveBeenCalled();
  });

  it('encerrar todas as sessões derruba também a atual', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(await screen.findByRole('button', { name: 'Encerrar todas as sessões' }));

    await waitFor(() => {
      expect(revokeAllMock).toHaveBeenCalledTimes(1);
    });
    expect(endLocalSession).toHaveBeenCalledTimes(1);
  });
});
