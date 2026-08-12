import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useId, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { type VaultMetadata } from '@crypta/crypto-core';
import { VAULT_LIMITS } from '@crypta/validation';

import { TextField } from '@/features/auth/components/text-field';

/**
 * W06 e W07 — criar e editar cofre (TELAS.md secoes 11 e 12).
 *
 * As duas telas são o mesmo formulário com título e rótulo de botão
 * diferentes. Separá-las em dois componentes duplicaria validação, limites e
 * acessibilidade — e é assim que um dos dois acaba com um limite diferente do
 * outro.
 *
 * `<dialog>` nativo com `showModal()`: prende o foco, fecha no `Escape` e torna
 * o resto da página inerte por conta do navegador.
 *
 * **O que é digitado aqui nunca sai em texto aberto.** O nome vira ciphertext
 * antes de qualquer requisição, e o `.strict()` do DTO da API recusaria um
 * campo `name` no corpo (`CLAUDE.md` secao 7).
 */

const vaultFormSchema = z.object({
  name: z
    .string({ message: 'Informe um nome para o cofre.' })
    .trim()
    .min(1, { message: 'Informe um nome para o cofre.' })
    .max(VAULT_LIMITS.name, {
      message: `O nome deve ter no máximo ${String(VAULT_LIMITS.name)} caracteres.`,
    }),
  description: z
    .string()
    .trim()
    .max(VAULT_LIMITS.description, {
      message: `A descrição deve ter no máximo ${String(VAULT_LIMITS.description)} caracteres.`,
    })
    .optional(),
});

type VaultFormValues = z.infer<typeof vaultFormSchema>;

type VaultFormDialogProps = {
  title: string;
  submitLabel: string;
  initialValues?: VaultMetadata | undefined;
  isPending: boolean;
  errorMessage?: string | undefined;
  onSubmit: (metadata: VaultMetadata) => void;
  onCancel: () => void;
};

export function VaultFormDialog({
  title,
  submitLabel,
  initialValues,
  isPending,
  errorMessage,
  onSubmit,
  onCancel,
}: VaultFormDialogProps): React.JSX.Element {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VaultFormValues>({
    resolver: zodResolver(vaultFormSchema),
    defaultValues: {
      name: initialValues?.name ?? '',
      description: initialValues?.description ?? '',
    },
  });

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
        {title}
      </h2>

      <form
        className="mt-4 flex flex-col gap-4"
        onSubmit={(event) => {
          void handleSubmit((values) => {
            onSubmit({
              name: values.name,
              // Descrição vazia é ausência, não string vazia: os dois
              // descreveriam o mesmo estado com ciphertexts diferentes.
              ...(values.description === undefined || values.description.length === 0
                ? {}
                : { description: values.description }),
            });
          })(event);
        }}
      >
        <TextField
          label="Nome"
          autoComplete="off"
          maxLength={VAULT_LIMITS.name}
          error={errors.name?.message}
          {...register('name')}
        />

        <TextField
          label="Descrição (opcional)"
          autoComplete="off"
          maxLength={VAULT_LIMITS.description}
          error={errors.description?.message}
          {...register('description')}
        />

        {errorMessage !== undefined && (
          <p role="alert" className="text-sm text-rose-400">
            {errorMessage}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-slate-700 px-4 py-2 text-sm text-slate-200"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={isPending}
            className="rounded bg-sky-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {isPending ? 'Salvando…' : submitLabel}
          </button>
        </div>
      </form>
    </dialog>
  );
}
