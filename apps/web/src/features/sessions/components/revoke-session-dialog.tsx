import { useEffect, useId, useRef } from 'react';

import { type SessionView } from '@crypta/contracts';

import {
  describeSession,
  formatIpAddress,
  formatSessionMoment,
} from '../services/describe-session';

/**
 * W25 — Confirmar encerramento de uma sessão (TELAS.md secao 30).
 *
 * Usa `<dialog>` nativo com `showModal()` em vez de um `div` com
 * `role="dialog"`: o elemento nativo prende o foco, fecha no `Escape` e torna o
 * resto da página inerte por conta do navegador. Reimplementar isso à mão é
 * onde acessibilidade costuma quebrar sem ninguém perceber (`CLAUDE.md` secao
 * 27).
 *
 * A confirmação existe porque a ação é irreversível: sessão revogada é apagada,
 * não desativada, e não há como desfazer.
 */

type RevokeSessionDialogProps = {
  session: SessionView;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function RevokeSessionDialog({
  session,
  isPending,
  onConfirm,
  onCancel,
}: RevokeSessionDialogProps): React.JSX.Element {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const description = describeSession(session);

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
      // `Escape` fecha o `<dialog>` nativo sem passar por React. Sem isto o
      // elemento sumiria da tela com o estado do pai ainda dizendo que está
      // aberto, e o diálogo não reabriria na próxima tentativa.
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      className="max-w-md rounded border border-slate-700 bg-slate-900 p-6 text-slate-100 backdrop:bg-slate-950/70"
    >
      <h2 id={titleId} className="text-lg font-semibold">
        Revogar sessão
      </h2>

      <p className="mt-2 text-sm text-slate-400">
        {session.isCurrent
          ? 'Esta é a sessão que você está usando agora. Ao revogar, você será desconectado imediatamente.'
          : 'O dispositivo abaixo perderá o acesso imediatamente e precisará entrar de novo.'}
      </p>

      <dl className="mt-4 flex flex-col gap-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-slate-400">Dispositivo</dt>
          <dd className="text-right">{description.device}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-400">Último uso</dt>
          <dd className="text-right">{formatSessionMoment(session.lastUsedAt)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-400">IP</dt>
          <dd className="text-right">{formatIpAddress(session.ipAddress)}</dd>
        </div>
      </dl>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="rounded border border-slate-700 px-4 py-2 text-sm disabled:opacity-60"
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={onConfirm}
          disabled={isPending}
          className="rounded bg-rose-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {isPending ? 'Revogando…' : 'Revogar sessão'}
        </button>
      </div>
    </dialog>
  );
}
