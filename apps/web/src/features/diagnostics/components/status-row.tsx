type StatusTone = 'ok' | 'error' | 'pending';

const TONE_STYLES: Record<StatusTone, string> = {
  ok: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-400/30',
  error:
    'bg-red-50 text-red-800 ring-red-600/20 dark:bg-red-950 dark:text-red-200 dark:ring-red-400/30',
  pending:
    'bg-slate-100 text-slate-700 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-400/30',
};

/** Símbolo textual junto da cor: a informação não pode depender só de cor. */
const TONE_SYMBOL: Record<StatusTone, string> = {
  ok: '✓',
  error: '✕',
  pending: '…',
};

type StatusRowProps = {
  label: string;
  value: string;
  tone: StatusTone;
};

/**
 * Linha de diagnóstico.
 *
 * O estado é comunicado por cor E por símbolo textual, para não depender de
 * percepção de cor (STYLE_GUIDE.md secao 21).
 */
export function StatusRow({ label, value, tone }: StatusRowProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 py-3 last:border-b-0 dark:border-slate-700">
      <dt className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</dt>
      <dd
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-sm ring-1 ring-inset ${TONE_STYLES[tone]}`}
      >
        <span aria-hidden="true">{TONE_SYMBOL[tone]}</span>
        {value}
      </dd>
    </div>
  );
}

export type { StatusTone };
