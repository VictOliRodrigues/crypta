import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';

import { useSetupStatus } from '../hooks/use-setup-status';

/**
 * Decide entre configuração inicial e login, antes de qualquer rota.
 *
 * Uma instalação nova sem esta checagem cairia direto no login e responderia
 * "e-mail ou senha inválidos" a quem ainda não tem conta para criar — sintoma
 * que não aponta para a causa.
 *
 * O caminho contrário também importa: com o cofre já configurado, `/setup` não
 * pode continuar acessível.
 */
export function AuthGate({ children }: { children: ReactNode }): React.JSX.Element {
  const { data, isPending, isError, refetch } = useSetupStatus();
  const location = useLocation();

  if (isPending) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <p role="status" className="text-sm text-slate-400">
          Carregando…
        </p>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6">
        <p role="alert" className="text-sm text-rose-300">
          Não foi possível falar com o servidor.
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="rounded bg-sky-600 px-4 py-2 text-sm font-medium text-white"
        >
          Tentar de novo
        </button>
      </main>
    );
  }

  const isSetupRoute = location.pathname === '/setup';

  if (data.setupRequired && !isSetupRoute) {
    return <Navigate to="/setup" replace />;
  }

  if (!data.setupRequired && isSetupRoute) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
