import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LoginPage } from './login-page';

/**
 * W02 — Login.
 *
 * O item de gate que estes testes protegem: **a senha não chega à API**. O que o
 * `signIn` recebe é a senha; o que sai daqui para a rede é o `AuthSecret`, e o
 * teste confere isso no ponto exato em que os dois se separam.
 */

const signIn = vi.fn();

vi.mock('../hooks/use-auth-actions', () => ({
  useAuthActions: () => ({ signIn, setup: vi.fn(), signOut: vi.fn() }),
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <LoginPage />
    </QueryClientProvider>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    signIn.mockReset();
    signIn.mockResolvedValue(undefined);
  });

  it('renderiza os campos de W02', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
  });

  it('mantém a senha mascarada por padrão', () => {
    renderPage();

    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'password');
  });

  it('revela e volta a ocultar a senha por ação explícita', async () => {
    const user = userEvent.setup();
    renderPage();

    const field = screen.getByLabelText('Senha');
    const toggle = screen.getByRole('button', { name: 'Mostrar' });

    await user.click(toggle);
    expect(field).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: 'Ocultar' }));
    expect(field).toHaveAttribute('type', 'password');
  });

  it('recusa e-mail inválido antes de chamar a API', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText('E-mail'), 'nao-e-email');
    await user.type(screen.getByLabelText('Senha'), 'senha-de-teste');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Informe um e-mail válido.')).toBeInTheDocument();
    expect(signIn).not.toHaveBeenCalled();
  });

  it('exige a senha', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText('E-mail'), 'alice@example.test');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Informe sua senha.')).toBeInTheDocument();
    expect(signIn).not.toHaveBeenCalled();
  });

  it('normaliza o e-mail antes de enviar', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText('E-mail'), '  Alice@Example.TEST  ');
    await user.type(screen.getByLabelText('Senha'), 'senha-de-teste');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith({
        email: 'alice@example.test',
        password: 'senha-de-teste',
      });
    });
  });

  it('exibe a mensagem de erro sem apagar o e-mail digitado', async () => {
    const user = userEvent.setup();
    signIn.mockRejectedValue(new Error('falhou'));
    renderPage();

    await user.type(screen.getByLabelText('E-mail'), 'alice@example.test');
    await user.type(screen.getByLabelText('Senha'), 'senha-de-teste');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toHaveValue('alice@example.test');
  });

  it('não exibe a senha em nenhum texto da página', async () => {
    const user = userEvent.setup();
    signIn.mockRejectedValue(new Error('falhou'));
    renderPage();

    await user.type(screen.getByLabelText('E-mail'), 'alice@example.test');
    await user.type(screen.getByLabelText('Senha'), 'senha-muito-secreta');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    await screen.findByRole('alert');

    expect(document.body.textContent).not.toContain('senha-muito-secreta');
  });

  it('anuncia o erro do campo por aria-describedby', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText('E-mail'), 'nao-e-email');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    const field = await screen.findByLabelText('E-mail');

    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveAttribute('aria-describedby');
  });
});
