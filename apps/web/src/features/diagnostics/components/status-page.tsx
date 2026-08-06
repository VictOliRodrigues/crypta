import { buildInfo } from '@/lib/env';
import { ApiRequestError } from '@/services/api-client';

import { useApiReadiness, useApiVersion } from '../hooks/use-diagnostics';
import { StatusRow, type StatusTone } from './status-row';

/**
 * Tela de status da integração (ROADMAP.md secao 10, marco A).
 *
 * Confirma o caminho Web -> API -> MySQL e identifica exatamente qual artefato
 * está implantado. É a primeira coisa a conferir depois de um deploy ou de um
 * rollback.
 */
export function StatusPage() {
  const version = useApiVersion();
  const readiness = useApiReadiness();

  const isLoading = version.isPending || readiness.isPending;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4 py-10">
      <section
        aria-labelledby="status-title"
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <header className="mb-6">
          <h1 id="status-title" className="text-xl font-semibold text-slate-900 dark:text-slate-50">
            Cofre de Senhas
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Diagnóstico da integração entre a aplicação Web, a API e o banco de dados.
          </p>
        </header>

        <dl aria-busy={isLoading} aria-live="polite">
          <StatusRow label="Aplicação Web" value={buildInfo.version} tone="ok" />
          <StatusRow label="Ambiente da Web" value={buildInfo.environment} tone="ok" />
          <StatusRow label="Commit da Web" value={buildInfo.commit} tone="ok" />

          <StatusRow
            label="API"
            value={describeQuery(version.isPending, version.error, () => version.data?.version)}
            tone={toneFor(version.isPending, version.error)}
          />
          <StatusRow
            label="Ambiente da API"
            value={describeQuery(version.isPending, version.error, () => version.data?.environment)}
            tone={toneFor(version.isPending, version.error)}
          />
          <StatusRow
            label="Commit da API"
            value={describeQuery(version.isPending, version.error, () => version.data?.commit)}
            tone={toneFor(version.isPending, version.error)}
          />
          <StatusRow
            label="Banco de dados"
            value={describeQuery(readiness.isPending, readiness.error, () =>
              readiness.data === undefined ? undefined : 'conectado',
            )}
            tone={toneFor(readiness.isPending, readiness.error)}
          />
        </dl>

        {version.data !== undefined && version.data.environment !== buildInfo.environment ? (
          <p
            role="alert"
            className="mt-6 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-950 dark:text-amber-100 dark:ring-amber-400/30"
          >
            Esta aplicação Web foi construída para o ambiente{' '}
            <strong>{buildInfo.environment}</strong>, mas está conversando com uma API de{' '}
            <strong>{version.data.environment}</strong>. Verifique a configuração antes de
            continuar.
          </p>
        ) : null}

        {readiness.error !== null ? (
          <p
            role="alert"
            className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-900 ring-1 ring-inset ring-red-600/20 dark:bg-red-950 dark:text-red-100 dark:ring-red-400/30"
          >
            {describeError(readiness.error)}
          </p>
        ) : null}
      </section>
    </main>
  );
}

function toneFor(isPending: boolean, error: unknown): StatusTone {
  if (isPending) {
    return 'pending';
  }

  return error === null ? 'ok' : 'error';
}

function describeQuery(
  isPending: boolean,
  error: unknown,
  readValue: () => string | undefined,
): string {
  if (isPending) {
    return 'consultando';
  }

  if (error !== null) {
    return 'indisponível';
  }

  return readValue() ?? 'indisponível';
}

/**
 * Mostra o `requestId` quando existir: é o que liga o erro visto pelo usuário
 * ao log do servidor, sem expor nada sensível.
 */
function describeError(error: unknown): string {
  if (!(error instanceof ApiRequestError)) {
    return 'Não foi possível concluir a operação.';
  }

  return error.requestId === null
    ? error.userMessage
    : `${error.userMessage} (requisição ${error.requestId})`;
}
