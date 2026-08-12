import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { type VaultSummary } from '@crypta/contracts';

import { useSessionStore } from '@/features/auth/stores/session-store';

import { VaultsPage } from './vaults-page';

/**
 * W05, W06, W07 e W08.
 *
 * Rede e criptografia são dubladas, no mesmo padrão dos testes de troca de
 * senha: a criptografia real é provada em `@crypta/crypto-web`, contra as
 * primitivas, e a recusa de texto aberto pela API é provada no e2e com o
 * `.strict()` do DTO. O que se prova aqui é o que a **interface** faz.
 *
 * O ponto que não pode faltar: a página entrega ao cliente HTTP exatamente o
 * que a camada de criptografia devolveu, sem acrescentar campo nenhum. Um
 * `name` em texto aberto que a página inventasse apareceria nesta asserção.
 */

const { fetchVaults, createVault, updateVault, deleteVault } = vi.hoisted(() => ({
  fetchVaults: vi.fn(),
  createVault: vi.fn(),
  updateVault: vi.fn(),
  deleteVault: vi.fn(),
}));

const { buildNewVault, openVaultMetadata, resealVaultMetadata } = vi.hoisted(() => ({
  buildNewVault: vi.fn(),
  openVaultMetadata: vi.fn(),
  resealVaultMetadata: vi.fn(),
}));

vi.mock('../services/vaults-api', () => ({ fetchVaults, createVault, updateVault, deleteVault }));
vi.mock('../services/vault-crypto', () => ({
  buildNewVault,
  openVaultMetadata,
  resealVaultMetadata,
}));

const VAULT_ID = '0198e4c1-1111-7000-8000-000000000001';

const ENCRYPTED_METADATA = {
  cryptoVersion: 1,
  schemaVersion: 1,
  algorithm: 'XCHACHA20-POLY1305',
  nonce: 'AwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD',
  ciphertext: 'BAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE',
};

const ENVELOPE = {
  keyVersion: 1,
  cryptoVersion: 1,
  algorithm: 'X25519-HKDF-SHA256-XCHACHA20-POLY1305',
  ephemeralPublicKey: 'AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE',
  encryptedVaultKey: 'AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC',
};

const VAULT: VaultSummary = {
  id: VAULT_ID,
  encryptedMetadata: ENCRYPTED_METADATA,
  currentUserEnvelope: ENVELOPE,
  role: 'OWNER',
  memberCount: 1,
  siteCount: 0,
  version: 1,
  keyVersion: 1,
  updatedAt: '2026-08-11T12:00:00.000Z',
};

const OPEN_METADATA = { name: 'Pessoal', description: 'Contas do dia a dia' };

const KEY_PAIR = {
  publicKey: new Uint8Array(32).fill(0xaa),
  privateKey: new Uint8Array(32).fill(0xbb),
};

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={queryClient}>
      <VaultsPage />
    </QueryClientProvider>,
  );
}

describe('VaultsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useSessionStore.setState({ keyPair: KEY_PAIR, userEncryptionKey: new Uint8Array(32) });

    fetchVaults.mockResolvedValue([VAULT]);
    openVaultMetadata.mockResolvedValue(OPEN_METADATA);
    buildNewVault.mockResolvedValue({
      id: '0198e4c1-1111-7000-8000-0000000000ff',
      encryptedMetadata: ENCRYPTED_METADATA,
      ownerEnvelope: ENVELOPE,
    });
    resealVaultMetadata.mockResolvedValue({ ...ENCRYPTED_METADATA, ciphertext: 'BQUFBQUFBQUF' });
    createVault.mockResolvedValue(undefined);
    updateVault.mockResolvedValue(undefined);
    deleteVault.mockResolvedValue(undefined);
  });

  it('exibe o nome que a decifragem devolveu', async () => {
    renderPage();

    expect(await screen.findByText('Pessoal')).toBeInTheDocument();
    expect(screen.getByText('Contas do dia a dia')).toBeInTheDocument();
  });

  it('decifra amarrando a AAD ao cofre da própria linha', async () => {
    renderPage();

    await screen.findByText('Pessoal');

    expect(openVaultMetadata).toHaveBeenCalledWith({ vault: VAULT, keyPair: KEY_PAIR });
  });

  it('mostra o estado vazio quando não há cofres', async () => {
    fetchVaults.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText('Você ainda não possui cofres.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Criar primeiro cofre' })).toBeInTheDocument();
  });

  it('mostra o erro e permite tentar de novo', async () => {
    fetchVaults.mockRejectedValue(new Error('Não foi possível carregar seus cofres.'));

    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar seus cofres.',
    );
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument();
  });

  /**
   * Cofre que não abre continua na lista. Escondê-lo faria um cofre existente
   * sumir da interface, o que é pior do que mostrá-lo ilegível.
   */
  it('mantém na lista o cofre que não abre com a chave do usuário', async () => {
    openVaultMetadata.mockRejectedValue(new Error('autenticação falhou'));

    renderPage();

    expect(await screen.findByText('Cofre ilegível')).toBeInTheDocument();
    expect(
      screen.getByText('Não foi possível abrir este cofre com a sua chave.'),
    ).toBeInTheDocument();
  });

  it('filtra localmente pela busca', async () => {
    renderPage();

    await screen.findByText('Pessoal');

    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar cofre' }), 'trabalho');

    expect(await screen.findByText('Nenhum cofre corresponde à busca.')).toBeInTheDocument();
  });

  describe('W06 — criar cofre', () => {
    it('cifra o que foi digitado e envia só o resultado', async () => {
      renderPage();

      await screen.findByText('Pessoal');
      await userEvent.click(screen.getByRole('button', { name: 'Novo cofre' }));

      const dialog = screen.getByRole('dialog');

      await userEvent.type(within(dialog).getByLabelText('Nome'), 'Trabalho');
      await userEvent.click(within(dialog).getByRole('button', { name: 'Criar cofre' }));

      await waitFor(() => {
        expect(createVault).toHaveBeenCalledTimes(1);
      });

      expect(buildNewVault).toHaveBeenCalledWith({
        metadata: { name: 'Trabalho' },
        ownerPublicKey: KEY_PAIR.publicKey,
      });

      const payload = createVault.mock.calls[0]?.[0] as Record<string, unknown>;

      // Exatamente o que a criptografia devolveu, mais a chave de idempotência.
      // Um campo em texto aberto que a página acrescentasse apareceria aqui.
      expect(Object.keys(payload).sort()).toEqual([
        'encryptedMetadata',
        'id',
        'idempotencyKey',
        'ownerEnvelope',
      ]);
      expect(JSON.stringify(payload)).not.toContain('Trabalho');
    });

    it('trata descrição vazia como ausente', async () => {
      renderPage();

      await screen.findByText('Pessoal');
      await userEvent.click(screen.getByRole('button', { name: 'Novo cofre' }));

      const dialog = screen.getByRole('dialog');

      await userEvent.type(within(dialog).getByLabelText('Nome'), 'Trabalho');
      await userEvent.click(within(dialog).getByRole('button', { name: 'Criar cofre' }));

      await waitFor(() => {
        expect(buildNewVault).toHaveBeenCalled();
      });

      const input = buildNewVault.mock.calls[0]?.[0] as { metadata: Record<string, unknown> };

      expect(input.metadata).not.toHaveProperty('description');
    });

    it('exige um nome', async () => {
      renderPage();

      await screen.findByText('Pessoal');
      await userEvent.click(screen.getByRole('button', { name: 'Novo cofre' }));

      const dialog = screen.getByRole('dialog');

      await userEvent.click(within(dialog).getByRole('button', { name: 'Criar cofre' }));

      expect(await within(dialog).findByRole('alert')).toHaveTextContent(
        'Informe um nome para o cofre.',
      );
      expect(createVault).not.toHaveBeenCalled();
    });

    /** A chave nasce com o diálogo: um retry não pode criar dois cofres. */
    it('reaproveita a chave de idempotência entre tentativas do mesmo diálogo', async () => {
      createVault.mockRejectedValueOnce(new Error('Falha de rede.'));

      renderPage();

      await screen.findByText('Pessoal');
      await userEvent.click(screen.getByRole('button', { name: 'Novo cofre' }));

      const dialog = screen.getByRole('dialog');

      await userEvent.type(within(dialog).getByLabelText('Nome'), 'Trabalho');
      await userEvent.click(within(dialog).getByRole('button', { name: 'Criar cofre' }));

      await within(dialog).findByRole('alert');

      await userEvent.click(within(dialog).getByRole('button', { name: 'Criar cofre' }));

      await waitFor(() => {
        expect(createVault).toHaveBeenCalledTimes(2);
      });

      const first = createVault.mock.calls[0]?.[0] as { idempotencyKey: string };
      const second = createVault.mock.calls[1]?.[0] as { idempotencyKey: string };

      expect(second.idempotencyKey).toBe(first.idempotencyKey);
    });
  });

  describe('W07 — editar cofre', () => {
    it('abre o formulário com o nome atual', async () => {
      renderPage();

      await screen.findByText('Pessoal');
      await userEvent.click(screen.getByRole('button', { name: 'Editar' }));

      expect(within(screen.getByRole('dialog')).getByLabelText('Nome')).toHaveValue('Pessoal');
    });

    it('recifra com a mesma chave e envia a versão que a lista carregou', async () => {
      renderPage();

      await screen.findByText('Pessoal');
      await userEvent.click(screen.getByRole('button', { name: 'Editar' }));

      const dialog = screen.getByRole('dialog');
      const nameField = within(dialog).getByLabelText('Nome');

      await userEvent.clear(nameField);
      await userEvent.type(nameField, 'Renomeado');
      await userEvent.click(within(dialog).getByRole('button', { name: 'Salvar alterações' }));

      await waitFor(() => {
        expect(updateVault).toHaveBeenCalledTimes(1);
      });

      expect(resealVaultMetadata).toHaveBeenCalledWith(
        expect.objectContaining({
          keyPair: KEY_PAIR,
          // A descrição não foi tocada e é preservada: editar o nome não
          // apaga o que o usuário não mexeu.
          metadata: { name: 'Renomeado', description: 'Contas do dia a dia' },
        }),
      );

      const payload = updateVault.mock.calls[0]?.[0] as {
        vaultId: string;
        expectedVersion: number;
      };

      expect(payload).toMatchObject({ vaultId: VAULT_ID, expectedVersion: 1 });
      expect(JSON.stringify(payload)).not.toContain('Renomeado');
    });
  });

  describe('W08 — excluir cofre', () => {
    it('avisa que a exclusão não pode ser desfeita', async () => {
      renderPage();

      await screen.findByText('Pessoal');
      await userEvent.click(screen.getByRole('button', { name: 'Excluir' }));

      const dialog = screen.getByRole('dialog');

      expect(within(dialog).getByText(/não poderá ser desfeita/)).toBeInTheDocument();
      expect(within(dialog).getByText('Pessoal')).toBeInTheDocument();
    });

    it('só exclui depois da confirmação', async () => {
      renderPage();

      await screen.findByText('Pessoal');
      await userEvent.click(screen.getByRole('button', { name: 'Excluir' }));

      await userEvent.click(
        within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar' }),
      );

      expect(deleteVault).not.toHaveBeenCalled();

      await userEvent.click(screen.getByRole('button', { name: 'Excluir' }));
      await userEvent.click(
        within(screen.getByRole('dialog')).getByRole('button', { name: 'Excluir cofre' }),
      );

      await waitFor(() => {
        expect(deleteVault).toHaveBeenCalledWith({ vaultId: VAULT_ID, expectedVersion: 1 });
      });
    });
  });
});
