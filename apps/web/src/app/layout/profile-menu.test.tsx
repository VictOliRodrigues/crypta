import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { logout } from '@/features/auth/services/auth-api';
import { useSessionStore } from '@/features/auth/stores/session-store';

import { ProfileMenu } from './profile-menu';

/**
 * O que estes testes protegem é o comportamento que não aparece em captura de
 * tela: fechar ao clicar fora, fechar no `Escape` devolvendo o foco, e o `Sair`
 * avisando a API. Um menu que abre e fecha visualmente pode falhar em qualquer
 * um dos três sem que ninguém perceba olhando.
 */

vi.mock('@/features/auth/services/auth-api', () => ({
  fetchSetupStatus: vi.fn(),
  fetchKdfParameters: vi.fn(),
  createFirstUser: vi.fn(),
  login: vi.fn(),
  fetchKeyBundle: vi.fn(),
  logout: vi.fn().mockResolvedValue(undefined),
}));

const USER = { id: 'u1', name: 'Alice', email: 'alice@example.test' };

function renderMenu(): void {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <button type="button">Fora do menu</button>
        <ProfileMenu />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('menu de perfil', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSessionStore.setState({
      accessToken: 'token',
      user: USER,
      keyPair: null,
      userEncryptionKey: null,
    });
  });

  it('começa fechado e anuncia isso no gatilho', () => {
    renderMenu();

    expect(screen.getByRole('button', { name: 'Alice' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: 'Configurações' })).not.toBeInTheDocument();
  });

  it('mostra nome, e-mail, Configurações e Sair quando aberto', async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole('button', { name: 'Alice' }));

    expect(screen.getByText('alice@example.test')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Configurações' })).toHaveAttribute(
      'href',
      '/configuracoes',
    );
    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument();
  });

  it('fecha ao clicar fora', async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole('button', { name: 'Alice' }));
    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Fora do menu' }));

    expect(screen.queryByRole('button', { name: 'Sair' })).not.toBeInTheDocument();
  });

  /** Fechar sem devolver o foco larga quem usa teclado no início da página. */
  it('fecha no Escape e devolve o foco ao gatilho', async () => {
    const user = userEvent.setup();
    renderMenu();

    const trigger = screen.getByRole('button', { name: 'Alice' });

    await user.click(trigger);
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('button', { name: 'Sair' })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('alcança os itens pelo teclado', async () => {
    const user = userEvent.setup();
    renderMenu();

    const trigger = screen.getByRole('button', { name: 'Alice' });
    trigger.focus();
    await user.keyboard('{Enter}');

    await user.tab();

    expect(screen.getByRole('link', { name: 'Configurações' })).toHaveFocus();
  });

  /** O achado do primeiro uso real: recarregar a página não avisa a API. */
  it('avisa a API ao sair', async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole('button', { name: 'Alice' }));
    await user.click(screen.getByRole('button', { name: 'Sair' }));

    expect(logout).toHaveBeenCalledTimes(1);
    expect(useSessionStore.getState().accessToken).toBeNull();
  });
});
