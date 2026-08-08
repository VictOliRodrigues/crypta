import { forwardRef, useId } from 'react';

/** Campo de texto com rótulo, erro e `aria-describedby` (CLAUDE.md secao 27). */
type TextFieldProps = {
  label: string;
  error?: string | undefined;
} & React.InputHTMLAttributes<HTMLInputElement>;

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, ...inputProps },
  ref,
) {
  const inputId = useId();
  const errorId = `${inputId}-error`;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-slate-200">
        {label}
      </label>

      <input
        {...inputProps}
        ref={ref}
        id={inputId}
        aria-invalid={error !== undefined}
        aria-describedby={error === undefined ? undefined : errorId}
        className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-sky-500"
      />

      {error !== undefined && (
        <p id={errorId} role="alert" className="text-xs text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
});
