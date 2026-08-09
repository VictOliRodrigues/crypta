import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { CryptoInitializationError } from '@crypta/crypto-web';
import { displayNameSchema, emailSchema } from '@crypta/validation';

import { ApiRequestError } from '@/services/api-client';

import { useAuthActions } from '../hooks/use-auth-actions';
import { PasswordField } from './password-field';
import { TextField } from './text-field';

/**
 * W01 — Configuração inicial (TELAS.md secao 6).
 *
 * Cria o primeiro usuário. A senha é derivada aqui e **não** é enviada: a API
 * recebe o `AuthSecret` e o key bundle, com a chave privada já cifrada.
 *
 * O aviso sobre a impossibilidade de recuperação é obrigatório, não decorativo:
 * a V1 não tem recuperação que preserve os dados (`SECURITY.md` secao 28), e
 * esquecer a senha significa perder o cofre.
 */

/** Mínimo de 12 caracteres, conforme `SECURITY.md` secao 23. */
const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_LENGTH = 256;

const setupSchema = z
  .object({
    name: displayNameSchema,
    email: emailSchema,
    password: z
      .string()
      .min(MIN_PASSWORD_LENGTH, {
        message: `A senha deve ter ao menos ${String(MIN_PASSWORD_LENGTH)} caracteres.`,
      })
      .max(MAX_PASSWORD_LENGTH, {
        message: `A senha deve ter no máximo ${String(MAX_PASSWORD_LENGTH)} caracteres.`,
      }),
    passwordConfirmation: z.string(),
  })
  .refine((values) => values.password === values.passwordConfirmation, {
    message: 'As senhas não conferem.',
    path: ['passwordConfirmation'],
  });

type SetupForm = z.infer<typeof setupSchema>;

function messageFor(error: unknown): string {
  /**
   * O navegador recusou carregar o WebAssembly. Sem ele não há derivação, e a
   * ação de contorno é específica — não adianta "tentar novamente".
   */
  if (error instanceof CryptoInitializationError) {
    return error.message;
  }

  if (!(error instanceof ApiRequestError)) {
    return 'Não foi possível concluir a configuração. Tente novamente.';
  }

  if (error.code === 'SETUP_ALREADY_COMPLETED') {
    return 'Este cofre já foi configurado. Use a tela de login.';
  }

  return error.userMessage;
}

export function SetupPage(): React.JSX.Element {
  const { setup } = useAuthActions();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SetupForm>({ resolver: zodResolver(setupSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);

    try {
      await setup({ name: values.name, email: values.email, password: values.password });
    } catch (error) {
      setSubmitError(messageFor(error));
    }
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-100">Configurar cofre</h1>
        <p className="text-sm text-slate-400">
          Esta é a primeira conta do cofre. Ela será a proprietária.
        </p>
      </header>

      <form onSubmit={(event) => void onSubmit(event)} noValidate className="flex flex-col gap-4">
        <TextField
          label="Nome"
          autoComplete="name"
          error={errors.name?.message}
          {...register('name')}
        />

        <TextField
          label="E-mail"
          type="email"
          inputMode="email"
          autoComplete="username"
          error={errors.email?.message}
          {...register('email')}
        />

        <PasswordField
          label="Senha"
          autoComplete="new-password"
          hint={`Mínimo de ${String(MIN_PASSWORD_LENGTH)} caracteres. Ela não pode ser recuperada.`}
          error={errors.password?.message}
          {...register('password')}
        />

        <PasswordField
          label="Confirmar senha"
          autoComplete="new-password"
          error={errors.passwordConfirmation?.message}
          {...register('passwordConfirmation')}
        />

        <p className="rounded bg-amber-950 px-3 py-2 text-sm text-amber-200">
          Guarde esta senha. Ela é a única forma de abrir o cofre — não existe recuperação que
          preserve os dados.
        </p>

        {submitError !== null && (
          <p role="alert" className="rounded bg-rose-950 px-3 py-2 text-sm text-rose-200">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-sky-600 px-4 py-2 font-medium text-white disabled:opacity-60"
        >
          {isSubmitting ? 'Criando conta…' : 'Criar conta inicial'}
        </button>
      </form>
    </main>
  );
}
