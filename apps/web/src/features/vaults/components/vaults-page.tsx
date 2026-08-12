import { useMemo, useState } from 'react';

import { createEntityId, type VaultMetadata } from '@crypta/crypto-core';
import { webRandomSource } from '@crypta/crypto-web';

import {
  type DecryptedVault,
  useCreateVault,
  useDeleteVault,
  useUpdateVault,
  useVaults,
} from '../hooks/use-vaults';
import { DeleteVaultDialog } from './delete-vault-dialog';
import { VaultFormDialog } from './vault-form-dialog';

/**
 * W05 — Dashboard de cofres (TELAS.md secao 10).
 *
 * A busca e o filtro são **locais**, sobre a lista já decifrada. Não existe
 * busca no servidor por nome de cofre, e não pode existir: o servidor não
 * conhece nome nenhum (`CLAUDE.md` secao 7). É a mesma razão pela qual a busca
 * de sites, na R0.4, também será local.
 *
 * Os cinco estados que a especificação exige estão aqui: carregando, erro, sem
 * cofres, sem resultado de busca e lista preenchida.
 */

type VaultFilter = 'all' | 'private' | 'shared';

const FILTERS: readonly { id: VaultFilter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'private', label: 'Privados' },
  { id: 'shared', label: 'Compartilhados' },
];

type DialogState =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; vault: DecryptedVault }
  | { kind: 'delete'; vault: DecryptedVault };

function errorMessageOf(error: unknown): string | undefined {
  return error instanceof Error ? error.message : undefined;
}

export function VaultsPage(): React.JSX.Element {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<VaultFilter>('all');
  const [dialog, setDialog] = useState<DialogState>({ kind: 'closed' });

  /**
   * A chave de idempotência nasce com o diálogo, não com o clique em salvar.
   *
   * Um retry depois de falha de rede reaproveita a mesma chave e não cria dois
   * cofres. Gerá-la no clique faria cada tentativa parecer uma operação nova —
   * que é exatamente o que a idempotência existe para evitar.
   */
  const [idempotencyKey, setIdempotencyKey] = useState('');

  const { data: vaults, isPending, isError, error, refetch } = useVaults();

  const createVault = useCreateVault();
  const updateVault = useUpdateVault();
  const deleteVault = useDeleteVault();

  const visible = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');

    return (vaults ?? []).filter((vault) => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'private' ? vault.memberCount === 1 : vault.memberCount > 1);

      if (!matchesFilter) {
        return false;
      }

      if (term.length === 0) {
        return true;
      }

      // Cofre que não abriu não tem nome para casar com a busca. Ele fica de
      // fora do resultado filtrado, mas continua na lista sem busca.
      return (vault.metadata?.name ?? '').toLocaleLowerCase('pt-BR').includes(term);
    });
  }, [vaults, search, filter]);

  function openCreate(): void {
    setIdempotencyKey(createEntityId(webRandomSource));
    setDialog({ kind: 'create' });
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-slate-100">Meus cofres</h1>

        <button
          type="button"
          onClick={openCreate}
          className="rounded bg-sky-600 px-4 py-2 text-sm font-medium text-white"
        >
          Novo cofre
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex-1">
          <span className="sr-only">Buscar cofre</span>
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
            }}
            placeholder="Buscar cofre"
            className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-sky-500"
          />
        </label>

        <div role="group" aria-label="Filtrar cofres" className="flex gap-2">
          {FILTERS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={filter === option.id}
              onClick={() => {
                setFilter(option.id);
              }}
              className={`rounded border px-3 py-2 text-sm ${
                filter === option.id
                  ? 'border-sky-500 text-sky-300'
                  : 'border-slate-700 text-slate-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {isPending && <p className="text-slate-300">Carregando cofres…</p>}

      {isError && (
        <div role="alert" className="flex flex-col items-start gap-3">
          <p className="text-rose-400">
            {errorMessageOf(error) ?? 'Não foi possível carregar seus cofres.'}
          </p>
          <button
            type="button"
            onClick={() => {
              void refetch();
            }}
            className="rounded border border-slate-700 px-3 py-2 text-sm text-slate-200"
          >
            Tentar de novo
          </button>
        </div>
      )}

      {!isPending && !isError && vaults?.length === 0 && (
        <div className="flex flex-col items-start gap-3">
          <p className="text-slate-300">Você ainda não possui cofres.</p>
          <button
            type="button"
            onClick={openCreate}
            className="rounded bg-sky-600 px-4 py-2 text-sm font-medium text-white"
          >
            Criar primeiro cofre
          </button>
        </div>
      )}

      {!isPending && !isError && (vaults?.length ?? 0) > 0 && visible.length === 0 && (
        <p className="text-slate-300">Nenhum cofre corresponde à busca.</p>
      )}

      {visible.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {visible.map((vault) => (
            <li
              key={vault.id}
              className="flex flex-col gap-2 rounded border border-slate-800 bg-slate-900 p-4"
            >
              <h2 className="text-lg font-medium text-slate-100">
                {vault.metadata?.name ?? 'Cofre ilegível'}
              </h2>

              {vault.metadata === null ? (
                <p className="text-sm text-rose-300">
                  Não foi possível abrir este cofre com a sua chave.
                </p>
              ) : (
                vault.metadata.description !== undefined && (
                  <p className="text-sm text-slate-400">{vault.metadata.description}</p>
                )
              )}

              <dl className="flex flex-wrap gap-x-4 text-xs text-slate-400">
                <div className="flex gap-1">
                  <dt>Tipo:</dt>
                  <dd>{vault.memberCount > 1 ? 'compartilhado' : 'privado'}</dd>
                </div>
                <div className="flex gap-1">
                  <dt>Sites:</dt>
                  <dd>{vault.siteCount}</dd>
                </div>
                <div className="flex gap-1">
                  <dt>Papel:</dt>
                  <dd>{vault.role === 'OWNER' ? 'proprietário' : 'editor'}</dd>
                </div>
              </dl>

              {vault.role === 'OWNER' && (
                <div className="mt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDialog({ kind: 'edit', vault });
                    }}
                    className="rounded border border-slate-700 px-3 py-1 text-sm text-slate-200"
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDialog({ kind: 'delete', vault });
                    }}
                    className="rounded border border-rose-800 px-3 py-1 text-sm text-rose-300"
                  >
                    Excluir
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {dialog.kind === 'create' && (
        <VaultFormDialog
          title="Novo cofre"
          submitLabel="Criar cofre"
          isPending={createVault.isPending}
          errorMessage={errorMessageOf(createVault.error)}
          onCancel={() => {
            createVault.reset();
            setDialog({ kind: 'closed' });
          }}
          onSubmit={(metadata: VaultMetadata) => {
            createVault.mutate(
              { metadata, idempotencyKey },
              {
                onSuccess: () => {
                  setDialog({ kind: 'closed' });
                },
              },
            );
          }}
        />
      )}

      {dialog.kind === 'edit' && (
        <VaultFormDialog
          title="Editar cofre"
          submitLabel="Salvar alterações"
          initialValues={dialog.vault.metadata ?? undefined}
          isPending={updateVault.isPending}
          errorMessage={errorMessageOf(updateVault.error)}
          onCancel={() => {
            updateVault.reset();
            setDialog({ kind: 'closed' });
          }}
          onSubmit={(metadata: VaultMetadata) => {
            updateVault.mutate(
              { vault: dialog.vault, metadata },
              {
                onSuccess: () => {
                  setDialog({ kind: 'closed' });
                },
              },
            );
          }}
        />
      )}

      {dialog.kind === 'delete' && (
        <DeleteVaultDialog
          vaultName={dialog.vault.metadata?.name ?? 'Cofre ilegível'}
          siteCount={dialog.vault.siteCount}
          isPending={deleteVault.isPending}
          errorMessage={errorMessageOf(deleteVault.error)}
          onCancel={() => {
            deleteVault.reset();
            setDialog({ kind: 'closed' });
          }}
          onConfirm={() => {
            deleteVault.mutate(dialog.vault, {
              onSuccess: () => {
                setDialog({ kind: 'closed' });
              },
            });
          }}
        />
      )}
    </main>
  );
}
