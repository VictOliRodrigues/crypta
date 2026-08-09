import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiRequestError } from '@/services/api-client';

import type * as UseChangePasswordModule from '../hooks/use-change-password';
import { VaultLockedError } from '../hooks/use-change-password';
import { ChangePasswordForm } from './change-password-form';

/**
 * W24, aba Segurança.
 *
 * O item de gate que estes testes protegem é o mesmo do login: **as senhas não
 * chegam à API**. O que `useChangePassword` recebe são as duas senhas; o que sai
 * para a rede são dois `AuthSecret`, e a separação é exercitada no ponto exato
 * em que ela acontece.
 */

const mutateAsync = vi.fn();

// `importActual` preserva `VaultLockedError`: o teste que cobre o cofre
// bloqueado precisa da classe real, senão `instanceof` no componente falharia
// contra um dublê e o caso passaria por acidente.
vi.mock('../hooks/use-change-password', async () => {
  const actual = await vi.importActual<typeof UseChangePasswordModule>(
    '../hooks/use-change-password',
  );

  return {
    ...actual,
    useChangePassword: () => ({ mutateAsync, isPending: false }),
  };
});

const CURRENT = 'senha-atual-que-serve';
const NEXT = 'senha-nova-bem-comprida';

function renderForm(): void {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(
    <QueryClientProvider client={queryClient}>
      <ChangePasswordForm />
    </QueryClientProvider>,
  );
}

async function fillAndSubmit(
  overrides: { current?: string; next?: string; confirm?: string } = {},
): Promise<void> {
  const user = userEvent.setup();

  await user.type(screen.getByLabelText('Senha atual'), overrides.current ?? CURRENT);
  await user.type(screen.getByLabelText('Nova senha'), overrides.next ?? NEXT);
  await user.type(screen.getByLabelText('Confirmar nova senha'), overrides.confirm ?? NEXT);
  await user.click(screen.getByRole('button', { name: 'Alterar senha' }));
}

describe('ChangePasswordForm', () => {
  beforeEach(() => {
    mutateAsync.mockReset();
    mutateAsync.mockResolvedValue(undefined);
  });

  it('renderiza os três campos da aba Segurança', () => {
    renderForm();

    expect(screen.getByLabelText('Senha atual')).toBeInTheDocument();
    expect(screen.getByLabelText('Nova senha')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirmar nova senha')).toBeInTheDocument();
  });

  it('mantém as três senhas mascaradas por padrão', () => {
    renderForm();

    for (const label of ['Senha atual', 'Nova senha', 'Confirmar nova senha']) {
      expect(screen.getByLabelText(label)).toHaveAttribute('type', 'password');
    }
  });

  it('encerra as outras sessões por padrão', () => {
    renderForm();

    expect(screen.getByLabelText('Encerrar minhas outras sessões')).toBeChecked();
  });

  it('recusa senha nova curta antes de chamar a API', async () => {
    renderForm();
    await fillAndSubmit({ next: 'curta', confirm: 'curta' });

    expect(await screen.findByText(/ao menos 12 caracteres/)).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('recusa confirmação divergente antes de chamar a API', async () => {
    renderForm();
    await fillAndSubmit({ confirm: 'outra-coisa-comprida' });

    expect(await screen.findByText('As senhas não conferem.')).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('recusa repetir a senha atual', async () => {
    renderForm();
    await fillAndSubmit({ next: CURRENT, confirm: CURRENT });

    expect(
      await screen.findByText('A nova senha precisa ser diferente da atual.'),
    ).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('entrega as senhas ao hook, e nada além disso', async () => {
    renderForm();
    await fillAndSubmit();

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        currentPassword: CURRENT,
        newPassword: NEXT,
        revokeOtherSessions: true,
      });
    });
  });

  it('limpa os campos depois do sucesso', async () => {
    renderForm();
    await fillAndSubmit();

    expect(await screen.findByText('Senha alterada.')).toBeInTheDocument();

    // `.value` direto: `toHaveValue('')` do jest-dom não distingue "vazio" de
    // "sem atributo", e passaria mesmo se o campo tivesse sumido da árvore.
    for (const label of ['Senha atual', 'Nova senha', 'Confirmar nova senha']) {
      expect(screen.getByLabelText<HTMLInputElement>(label).value).toBe('');
    }
  });

  it('não exibe nenhuma das senhas em texto da página', async () => {
    renderForm();
    await fillAndSubmit();

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalled();
    });

    expect(document.body.textContent).not.toContain(CURRENT);
    expect(document.body.textContent).not.toContain(NEXT);
  });

  it('mostra o erro de senha atual sem apagar o que foi digitado', async () => {
    mutateAsync.mockRejectedValue(
      new ApiRequestError('CURRENT_CREDENTIAL_INVALID', 'A senha atual está incorreta.', null, 401),
    );
    renderForm();
    await fillAndSubmit();

    expect(await screen.findByText('A senha atual está incorreta.')).toBeInTheDocument();
    expect(screen.getByLabelText('Nova senha')).toHaveValue(NEXT);
  });

  /**
   * O cofre trancado é o caso que o jsdom alcança e o navegador esconde: depois
   * de um reload o par de chaves se perdeu, e sem ele não há o que reproteger.
   */
  it('explica o cofre bloqueado em vez de falhar com erro de criptografia', async () => {
    mutateAsync.mockRejectedValue(new VaultLockedError());
    renderForm();
    await fillAndSubmit();

    expect(await screen.findByText(/Entre de novo para alterar a senha/)).toBeInTheDocument();
  });

  it('trata a recusa de troca de chave pública como alerta de integridade', async () => {
    mutateAsync.mockRejectedValue(
      new ApiRequestError('PUBLIC_KEY_CHANGE_NOT_ALLOWED', 'Recusado.', null, 409),
    );
    renderForm();
    await fillAndSubmit();

    expect(await screen.findByText(/procure o responsável pela instalação/)).toBeInTheDocument();
  });
});
