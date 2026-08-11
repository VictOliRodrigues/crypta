import { useEffect, useId, useRef } from 'react';

/**
 * W08 — Confirmar exclusão de cofre (TELAS.md secao 13).
 *
 * A confirmação não é formalidade: a exclusão é **física** (ADR 0020). Não há
 * lixeira, não há `deleted_at`, e o cofre, seus sites e suas credenciais somem
 * do banco. Um clique errado apaga de verdade.
 *
 * O texto diz o que será removido e mostra as contagens, para que a decisão
 * seja tomada com o tamanho do estrago à vista.
 */

type DeleteVaultDialogProps = {
  vaultName: string;
  siteCount: number;
  isPending: boolean;
  errorMessage?: string | undefined;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DeleteVaultDialog({
  vaultName,
  siteCount,
  isPending,
  errorMessage,
  onConfirm,
  onCancel,
}: DeleteVaultDialogProps): React.JSX.Element {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;

    if (dialog === null || dialog.open) {
      return;
    }

    dialog.showModal();

    return () => {
      dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      className="w-full max-w-md rounded border border-slate-700 bg-slate-900 p-6 text-slate-100 backdrop:bg-slate-950/70"
    >
      <h2 id={titleId} className="text-lg font-semibold">
        Excluir cofre
      </h2>

      <p className="mt-3 text-sm text-slate-300">
        <strong className="text-slate-100">{vaultName}</strong>
      </p>

      <p className="mt-2 text-sm text-slate-300">
        {siteCount === 1 ? '1 site' : `${String(siteCount)} sites`} neste cofre.
      </p>

      <p className="mt-3 text-sm text-rose-300">
        Esta ação removerá o cofre, seus sites e suas credenciais. A exclusão não poderá ser
        desfeita.
      </p>

      {errorMessage !== undefined && (
        <p role="alert" className="mt-3 text-sm text-rose-400">
          {errorMessage}
        </p>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-slate-700 px-4 py-2 text-sm text-slate-200"
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={onConfirm}
          disabled={isPending}
          className="rounded bg-rose-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {isPending ? 'Excluindo…' : 'Excluir cofre'}
        </button>
      </div>
    </dialog>
  );
}
