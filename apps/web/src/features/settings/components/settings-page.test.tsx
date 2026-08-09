import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

    // Perfil não aparece: a feature não existe, e uma aba vazia prometeria na
    // interface o que o produto não entrega.
    expect(tabs.map((tab) => tab.textContent)).toEqual(['Segurança', 'Sessões']);
  });

  it('liga a aba ativa ao painel correspondente', () => {
    renderPage();

    const tab = screen.getByRole('tab', { name: 'Segurança' });
    const panel = screen.getByRole('tabpanel');

    expect(tab).toHaveAttribute('aria-selected', 'true');
    expect(tab).toHaveAttribute('aria-controls', panel.id);
    expect(panel).toHaveAttribute('aria-labelledby', tab.id);
  });

  it('abre na aba Segurança', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Alterar senha', level: 2 })).toBeInTheDocument();
  });

  it('troca para o painel de sessões ao clicar na aba', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('tab', { name: 'Sessões' }));

    expect(screen.getByRole('heading', { name: 'Sessões', level: 2 })).toBeInTheDocument();
  });

  /** Setas navegam entre abas; é o que o padrão de tabs exige. */
  it('navega entre abas pelo teclado', async () => {
    const user = userEvent.setup();
    renderPage();

    screen.getByRole('tab', { name: 'Segurança' }).focus();
    await user.keyboard('{ArrowRight}');

    expect(screen.getByRole('tab', { name: 'Sessões' })).toHaveAttribute('aria-selected', 'true');
  });
});
