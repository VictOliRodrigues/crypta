import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchSessions } from '@/features/sessions/services/sessions-api';

import { SettingsPage } from './settings-page';

/**
 * W24 — casca das configurações.
 *
 * O que estes testes protegem é a ligação aria entre aba e painel: quebrá-la
 * não muda nada visualmente e deixa a tela inutilizável para leitor de tela.
 */

vi.mock('@/features/sessions/services/sessions-api', () => ({
  fetchSessions: vi.fn(),
  revokeSession: vi.fn(),
  revokeOtherSessions: vi.fn(),
  revokeAllSessions: vi.fn(),
}));

vi.mock('@/features/auth/hooks/use-auth-actions', () => ({
  useAuthActions: () => ({
    endLocalSession: vi.fn(),
    setup: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}));

function renderPage(): void {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <SettingsPage />
    </QueryClientProvider>,
  );
}

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.mocked(fetchSessions).mockResolvedValue([]);
  });

  it('renderiza o título do W24', () => {
    renderPage();

    expect(
      screen.getByRole('heading', { name: 'Configurações da conta', level: 1 }),
    ).toBeInTheDocument();
  });

  it('expõe as abas entregues, e só elas', () => {
    renderPage();

    const tabs = screen.getAllByRole('tab');

    expect(tabs).toHaveLength(1);
    expect(tabs[0]).toHaveAccessibleName('Sessões');
  });

  it('liga a aba ativa ao painel correspondente', () => {
    renderPage();

    const tab = screen.getByRole('tab', { name: 'Sessões' });
    const panel = screen.getByRole('tabpanel');

    expect(tab).toHaveAttribute('aria-selected', 'true');
    expect(tab).toHaveAttribute('aria-controls', panel.id);
    expect(panel).toHaveAttribute('aria-labelledby', tab.id);
  });

  it('mostra o painel de sessões dentro da aba', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Sessões', level: 2 })).toBeInTheDocument();
  });
});
