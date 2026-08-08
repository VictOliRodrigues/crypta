import { forwardRef, useId, useState } from 'react';

/**
 * Campo de senha com revelar e ocultar (TELAS.md secao 53).
 *
 * A senha nasce mascarada e volta a ficar oculta a cada montagem. O botão de
 * revelar é `type="button"` — sem isso ele submeteria o formulário, e o
 * navegador enviaria a senha ao tentar mostrá-la.
 *
 * `aria-pressed` e o rótulo que muda existem para que um leitor de tela anuncie o
 * estado, e não apenas a existência do botão (`CLAUDE.md` secao 27).
 */
type PasswordFieldProps = {
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
  autoComplete: 'current-password' | 'new-password';
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>;

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField({ label, error, hint, autoComplete, ...inputProps }, ref) {
    const [isRevealed, setIsRevealed] = useState(false);
    const inputId = useId();
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    const describedBy = [hint === undefined ? null : hintId, error === undefined ? null : errorId]
      .filter((value): value is string => value !== null)
      .join(' ');

    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={inputId} className="text-sm font-medium text-slate-200">
          {label}
        </label>

        <div className="relative">
          <input
            {...inputProps}
            ref={ref}
            id={inputId}
            type={isRevealed ? 'text' : 'password'}
            autoComplete={autoComplete}
            aria-invalid={error !== undefined}
            aria-describedby={describedBy.length === 0 ? undefined : describedBy}
            className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 pr-20 text-slate-100 outline-none focus:border-sky-500"
          />

          <button
            type="button"
            onClick={() => {
              setIsRevealed((previous) => !previous);
            }}
            aria-pressed={isRevealed}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded px-2 py-1 text-xs text-slate-300 hover:text-slate-100 focus:outline focus:outline-sky-500"
          >
            {isRevealed ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>

        {hint !== undefined && (
          <p id={hintId} className="text-xs text-slate-400">
            {hint}
          </p>
        )}

        {error !== undefined && (
          <p id={errorId} role="alert" className="text-xs text-rose-400">
            {error}
          </p>
        )}
      </div>
    );
  },
);
