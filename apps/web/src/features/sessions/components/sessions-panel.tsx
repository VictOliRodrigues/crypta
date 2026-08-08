import { useState } from 'react';

import { type SessionView } from '@crypta/contracts';

import { ApiRequestError } from '@/services/api-client';

import {
  useRevokeAllSessions,
  useRevokeOtherSessions,
  useRevokeSession,
  useSessions,
} from '../hooks/use-sessions';
import {
  describeSession,
  formatIpAddress,
  formatSessionMoment,
} from '../services/describe-session';
import { RevokeSessionDialog } from './revoke-session-dialog';

/**
 * W24, aba Sessões (TELAS.md secao 29).
 *
 * A lista é o instrumento que o usuário tem para reagir a um acesso que não
 * reconhece, então ela precisa dos três estados — carregando, erro e vazio —
 * distinguíveis entre si. Uma tabela vazia por falha de rede e uma tabela vazia
 * de verdade levam a decisões opostas.
 */

function messageFor(error: unknown): string {
  if (error instanceof ApiRequestError) {
    /**
     * `RESOURCE_NOT_FOUND` aqui quase sempre é corrida, não engano: a sessão
     * caiu entre o carregamento da lista e o clique. O texto diz isso em vez de
     * sugerir que o usuário errou.
     */
    if (error.code === 'RESOURCE_NOT_FOUND') {
      return 'Esta sessão já havia sido encerrada.';
    }

    return error.userMessage;
  }

  return 'Não foi possível concluir a operação.';
}

export function SessionsPanel(): React.JSX.Element {
  const sessions = useSessions();
  const revokeOne = useRevokeSession();
  const revokeOthers = useRevokeOtherSessions();
  const revokeAll = useRevokeAllSessions();

  const [pendingRevoke, setPendingRevoke] = useState<SessionView | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const isBulkPending = revokeOthers.isPending || revokeAll.isPending;

  async function confirmRevoke(session: SessionView): Promise<void> {
    setActionError(null);

    try {
      await revokeOne.mutateAsync(session);
      setFeedback('Sessão revogada.');
    } catch (error) {
      setActionError(messageFor(error));
    } finally {
      setPendingRevoke(null);
    }
  }

  async function endOtherSessions(): Promise<void> {
    setActionError(null);

    try {
      await revokeOthers.mutateAsync();
      setFeedback('As demais sessões foram encerradas.');
    } catch (error) {
      setActionError(messageFor(error));
    }
  }

  async function endAllSessions(): Promise<void> {
    setActionError(null);

    try {
      await revokeAll.mutateAsync();
    } catch (error) {
      setActionError(messageFor(error));
    }
  }

  return (
    <section className="flex flex-col gap-4" aria-labelledby="sessions-heading">
      <header className="flex flex-col gap-1">
        <h2 id="sessions-heading" className="text-lg font-semibold text-slate-100">
          Sessões
        </h2>
        <p className="text-sm text-slate-400">
          Dispositivos com acesso à sua conta. Revogar uma sessão tem efeito imediato.
        </p>
      </header>

      {/*
        Resultado das ações. `aria-live` porque a mudança acontece longe do foco:
        quem usa leitor de tela não percebe uma linha desaparecer da tabela.
      */}
      <p aria-live="polite" className="sr-only">
        {feedback}
      </p>

      {actionError !== null && (
        <p role="alert" className="rounded bg-rose-950 px-3 py-2 text-sm text-rose-200">
          {actionError}
        </p>
      )}

      {sessions.isPending && <p className="text-sm text-slate-400">Carregando sessões…</p>}

      {sessions.isError && (
        <div role="alert" className="flex flex-col items-start gap-2">
          <p className="rounded bg-rose-950 px-3 py-2 text-sm text-rose-200">
            {messageFor(sessions.error)}
          </p>
          <button
            type="button"
            onClick={() => void sessions.refetch()}
            className="rounded border border-slate-700 px-3 py-1 text-sm text-slate-200"
          >
            Tentar de novo
          </button>
        </div>
      )}

      {sessions.isSuccess && sessions.data.length === 0 && (
        <p className="text-sm text-slate-400">Nenhuma sessão ativa.</p>
      )}

      {sessions.isSuccess && sessions.data.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Sessões ativas da sua conta</caption>
            <thead className="text-slate-400">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">
                  Dispositivo
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Navegador
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Sistema
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  IP
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Criada em
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Último uso
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody className="text-slate-100">
              {sessions.data.map((session) => {
                const description = describeSession(session);

                return (
                  <tr key={session.id} className="border-t border-slate-800">
                    <th scope="row" className="px-3 py-2 font-normal">
                      {description.device}
                      {session.isCurrent && (
                        <span className="ml-2 rounded bg-sky-900 px-2 py-0.5 text-xs text-sky-200">
                          Sessão atual
                        </span>
                      )}
                    </th>
                    <td className="px-3 py-2">{description.browser}</td>
                    <td className="px-3 py-2">{description.operatingSystem}</td>
                    <td className="px-3 py-2">{formatIpAddress(session.ipAddress)}</td>
                    <td className="px-3 py-2">{formatSessionMoment(session.createdAt)}</td>
                    <td className="px-3 py-2">{formatSessionMoment(session.lastUsedAt)}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setPendingRevoke(session);
                        }}
                        className="rounded border border-slate-700 px-3 py-1 text-slate-200"
                      >
                        {/*
                          O nome acessível carrega o dispositivo: numa tabela com
                          várias linhas, sete botões chamados "Revogar" são
                          indistinguíveis fora do contexto visual.
                        */}
                        <span aria-hidden="true">Revogar</span>
                        <span className="sr-only">Revogar sessão {description.device}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap gap-3 border-t border-slate-800 pt-4">
        <button
          type="button"
          onClick={() => void endOtherSessions()}
          disabled={isBulkPending}
          className="rounded border border-slate-700 px-4 py-2 text-sm text-slate-200 disabled:opacity-60"
        >
          {revokeOthers.isPending ? 'Encerrando…' : 'Encerrar outras sessões'}
        </button>

        <button
          type="button"
          onClick={() => void endAllSessions()}
          disabled={isBulkPending}
          className="rounded bg-rose-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {revokeAll.isPending ? 'Encerrando…' : 'Encerrar todas as sessões'}
        </button>
      </div>

      {pendingRevoke !== null && (
        <RevokeSessionDialog
          session={pendingRevoke}
          isPending={revokeOne.isPending}
          onConfirm={() => void confirmRevoke(pendingRevoke)}
          onCancel={() => {
            setPendingRevoke(null);
          }}
        />
      )}
    </section>
  );
}
