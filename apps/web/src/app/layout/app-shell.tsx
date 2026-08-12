import { Link, Outlet } from 'react-router';

import { ProfileMenu } from './profile-menu';

/**
 * Casca das telas autenticadas.
 *
 * A topbar precisa existir uma vez, acima do `Outlet`, e não repetida em cada
 * tela: o menu de perfil é o caminho para Configurações e para `Sair`, e uma
 * tela que esquecesse de incluí-lo viraria um beco sem saída — foi exatamente o
 * que aconteceu com o dashboard de cofres na R0.3.
 *
 * Só envolve o grupo de rotas sob `RequireSession`. Login e setup ficam de fora
 * de propósito: não há perfil a exibir nem sessão a encerrar.
 *
 * O `min-h-screen` mora aqui. As telas de dentro usam `flex-1` para ocupar o que
 * sobra — se cada uma mantivesse a altura cheia, a soma com a topbar passaria a
 * viewport e a página rolaria sem ter conteúdo para isso.
 */
export function AppShell(): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-3">
          <Link to="/" className="rounded text-sm font-semibold text-slate-900 dark:text-slate-100">
            Crypta
          </Link>

          <ProfileMenu />
        </div>
      </header>

      <div className="flex flex-1 flex-col">
        <Outlet />
      </div>
    </div>
  );
}
