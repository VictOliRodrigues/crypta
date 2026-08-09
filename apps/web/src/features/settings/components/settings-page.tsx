import { type ReactNode, useId, useState } from 'react';

import { ChangePasswordForm } from '@/features/auth/components/change-password-form';
import { SessionsPanel } from '@/features/sessions/components/sessions-panel';

/**
 * W24 — Configurações da conta (TELAS.md secao 29).
 *
 * A tela tem três abas na especificação: Perfil, Segurança e Sessões. Aqui
 * existe a casca e apenas as abas cujas features já foram entregues. Renderizar
 * uma aba Perfil vazia seria prometer na interface algo que não existe, e o
 * Perfil não está entre as entregas da fase (`ROADMAP.md` secao 14).
 *
 * Acrescentar uma aba é acrescentar uma entrada em `TABS`.
 */

type SettingsTab = {
  id: string;
  label: string;
  render: () => ReactNode;
};

const TABS: readonly SettingsTab[] = [
  { id: 'seguranca', label: 'Segurança', render: () => <ChangePasswordForm /> },
  { id: 'sessoes', label: 'Sessões', render: () => <SessionsPanel /> },
];

export function SettingsPage(): React.JSX.Element {
  const [activeTabId, setActiveTabId] = useState(TABS[0]?.id ?? '');
  const baseId = useId();

  const activeTab = TABS.find((tab) => tab.id === activeTabId) ?? TABS[0];

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-100">Configurações da conta</h1>
      </header>

      <div
        role="tablist"
        aria-label="Seções das configurações"
        className="flex gap-2 border-b border-slate-800"
        // Setas navegam entre abas; `Tab` sai do conjunto. É o comportamento que
        // o padrão de tabs exige e que uma lista de botões comuns não tem.
        onKeyDown={(event) => {
          const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;

          if (step === 0) {
            return;
          }

          event.preventDefault();

          const current = TABS.findIndex((tab) => tab.id === activeTabId);
          const next = TABS[(current + step + TABS.length) % TABS.length];

          if (next !== undefined) {
            setActiveTabId(next.id);
          }
        }}
      >
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab?.id;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`${baseId}-panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => {
                setActiveTabId(tab.id);
              }}
              className={
                isActive
                  ? 'border-b-2 border-sky-500 px-4 py-2 text-sm font-medium text-slate-100'
                  : 'px-4 py-2 text-sm text-slate-400'
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab !== undefined && (
        <div
          role="tabpanel"
          id={`${baseId}-panel-${activeTab.id}`}
          aria-labelledby={`${baseId}-tab-${activeTab.id}`}
        >
          {activeTab.render()}
        </div>
      )}
    </main>
  );
}
