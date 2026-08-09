import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { CryptoInitializationError } from '@crypta/crypto-web';

import { ApiRequestError } from '@/services/api-client';

import { useChangePassword, VaultLockedError } from '../hooks/use-change-password';
import { PasswordField } from './password-field';

/**
 * W24, aba Segurança — alterar senha (TELAS.md secao 29).
 *
 * A senha não sai deste formulário: ela vai para `useChangePassword`, que a
 * entrega a `identity.ts` e recebe de volta `AuthSecret`. Nenhum estado desta
 * tela guarda a senha depois do envio, e o React Hook Form preserva os campos
 * quando a API recusa (`CLAUDE.md` secao 23).
 */

/**
 * Comprimento mínimo, e só.
 *
 * Nenhuma regra de composição — maiúscula obrigatória, símbolo obrigatório. Elas
 * reduzem o espaço de busca real ao empurrar o usuário para padrões previsíveis,
 * e o fator de trabalho aqui vem do Argon2id, não do alfabeto.
 */
const MIN_PASSWORD_LENGTH = 12;

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { message: 'Informe sua senha atual.' }),
    newPassword: z.string().min(MIN_PASSWORD_LENGTH, {
      message: `A nova senha precisa ter ao menos ${String(MIN_PASSWORD_LENGTH)} caracteres.`,
    }),
    confirmPassword: z.string().min(1, { message: 'Repita a nova senha.' }),
    revokeOtherSessions: z.boolean(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não conferem.',
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    path: ['newPassword'],
    message: 'A nova senha precisa ser diferente da atual.',
  });

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

function messageFor(error: unknown): string {
  /**
   * O cofre está trancado: a página foi recarregada e o par de chaves, que só
   * vive em memória, se perdeu. Não há o que reproteger sem ele, e a mensagem
   * diz o que fazer em vez de falhar com erro de criptografia.
   */
  if (error instanceof VaultLockedError) {
    return 'Sua sessão perdeu o acesso ao cofre. Entre de novo para alterar a senha.';
  }

  /** O navegador recusou carregar o WebAssembly; sem ele não há como rederivar. */
  if (error instanceof CryptoInitializationError) {
    return error.message;
  }

  if (!(error instanceof ApiRequestError)) {
    return 'Não foi possível alterar a senha. Tente novamente.';
  }

  switch (error.code) {
    case 'CURRENT_CREDENTIAL_INVALID':
      return 'A senha atual está incorreta.';
    case 'PUBLIC_KEY_CHANGE_NOT_ALLOWED':
      return 'Seu material criptográfico não confere com o do servidor. Não continue e procure o responsável pela instalação.';
    case 'RATE_LIMIT_EXCEEDED':
      return 'Muitas tentativas. Aguarde um momento.';
    default:
      return error.userMessage;
  }
}

export function ChangePasswordForm(): React.JSX.Element {
  const changePassword = useChangePassword();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { revokeOtherSessions: true },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    setSucceeded(false);

    try {
      await changePassword.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        revokeOtherSessions: values.revokeOtherSessions,
      });

      // Limpa os três campos: eles contêm as duas senhas, e não há motivo para
      // mantê-las no DOM depois do sucesso. Os nomes são listados um a um em vez
      // de omitidos — `reset` com objeto parcial deixa no DOM o valor de quem
      // ficou de fora, que aqui seriam justamente as senhas.
      reset({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        revokeOtherSessions: values.revokeOtherSessions,
      });
      setSucceeded(true);
    } catch (error) {
      setSubmitError(messageFor(error));
    }
  });

  return (
    <section className="flex max-w-md flex-col gap-4" aria-labelledby="security-heading">
      <header className="flex flex-col gap-1">
        <h2 id="security-heading" className="text-lg font-semibold text-slate-100">
          Alterar senha
        </h2>
        <p className="text-sm text-slate-400">
          Sua senha também protege o conteúdo dos cofres. Trocá-la recriptografa suas chaves neste
          navegador — não há como recuperá-las se você esquecer a nova senha.
        </p>
      </header>

      <form onSubmit={(event) => void onSubmit(event)} noValidate className="flex flex-col gap-4">
        <PasswordField
          label="Senha atual"
          autoComplete="current-password"
          error={errors.currentPassword?.message}
          {...register('currentPassword')}
        />

        <PasswordField
          label="Nova senha"
          autoComplete="new-password"
          error={errors.newPassword?.message}
          {...register('newPassword')}
        />

        <PasswordField
          label="Confirmar nova senha"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" {...register('revokeOtherSessions')} />
          Encerrar minhas outras sessões
        </label>

        {submitError !== null && (
          <p role="alert" className="rounded bg-rose-950 px-3 py-2 text-sm text-rose-200">
            {submitError}
          </p>
        )}

        {succeeded && (
          <p role="status" className="rounded bg-emerald-950 px-3 py-2 text-sm text-emerald-200">
            Senha alterada.
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-sky-600 px-4 py-2 font-medium text-white disabled:opacity-60"
        >
          {isSubmitting ? 'Alterando…' : 'Alterar senha'}
        </button>
      </form>
    </section>
  );
}
