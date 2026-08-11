import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { CryptoAuthenticationError } from '@crypta/crypto-core';
import { CryptoInitializationError } from '@crypta/crypto-web';
import { emailSchema } from '@crypta/validation';

import { ApiRequestError } from '@/services/api-client';

import { useAuthActions } from '../hooks/use-auth-actions';
import { PasswordField } from './password-field';
import { TextField } from './text-field';

/**
 * W02 — Login (TELAS.md secao 7).
 *
 * A senha não sai do formulário: ela vai para `deriveIdentity`, e o que a API
 * recebe é o `AuthSecret`. Nenhum estado desta tela guarda a senha depois do
 * envio, e o React Hook Form preserva o e-mail digitado quando a API recusa —
 * `CLAUDE.md` secao 23 proíbe perder os valores após erro.
 */

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: 'Informe sua senha.' }),
});

type LoginForm = z.infer<typeof loginSchema>;

/**
 * Mensagem exibida ao usuário.
 *
 * `INVALID_CREDENTIALS` cobre senha errada, conta inexistente e conta bloqueada:
 * a API não distingue os três de propósito, e a interface não pode inventar uma
 * distinção que o servidor recusa dar (`SECURITY.md` secao 25).
 */
function messageFor(error: unknown): string {
  /**
   * Falha ao abrir o key bundle **depois** de a API aceitar o login.
   *
   * Não é senha errada: o `AuthSecret` e a `UserEncryptionKey` vêm da mesma
   * `RootKey`, então uma senha que autenticou também abriria o bundle. Chegar
   * aqui significa que o material recebido não corresponde ao que foi gravado —
   * é a proteção do ADR 0023 disparando, e merece mensagem própria.
   */
  if (error instanceof CryptoAuthenticationError) {
    return 'Seu material criptográfico não confere com o que o servidor devolveu. Não continue e procure o responsável pela instalação.';
  }

  /**
   * O navegador recusou carregar o WebAssembly.
   *
   * Merece mensagem própria porque não há nada de errado com a credencial nem
   * com o servidor, e a ação de contorno é específica. Sem isto o usuário lê
   * "tente novamente" e tenta a mesma coisa indefinidamente.
   */
  if (error instanceof CryptoInitializationError) {
    return error.message;
  }

  if (!(error instanceof ApiRequestError)) {
    return 'Não foi possível entrar. Tente novamente.';
  }

  switch (error.code) {
    case 'INVALID_CREDENTIALS':
      return 'E-mail ou senha inválidos.';
    case 'ACCOUNT_LOCKED':
      return 'Muitas tentativas. Aguarde alguns minutos e tente de novo.';
    case 'ACCOUNT_DISABLED':
      return 'Esta conta está indisponível.';
    case 'RATE_LIMIT_EXCEEDED':
      return 'Muitas tentativas. Aguarde um momento.';
    default:
      return error.userMessage;
  }
}

export function LoginPage(): React.JSX.Element {
  const { signIn } = useAuthActions();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);

    try {
      await signIn(values);
    } catch (error) {
      setSubmitError(messageFor(error));
    }
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-100">Entrar</h1>
        <p className="text-sm text-slate-400">O acesso a este cofre é somente por convite.</p>
      </header>

      <form onSubmit={(event) => void onSubmit(event)} noValidate className="flex flex-col gap-4">
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
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />

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
          {isSubmitting ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}
