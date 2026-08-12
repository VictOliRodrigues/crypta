import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router';

import { useAuthActions } from '@/features/auth/hooks/use-auth-actions';
import { useSessionStore } from '@/features/auth/stores/session-store';

/**
 * Menu de perfil da topbar (TELAS.md secao 31).
 *
 * É o único caminho da interface para `Sair` e para as Configurações. Sem ele o
 * W24 inteiro — perfil, alteração de senha e sessões — ficava alcançável apenas
 * digitando a URL, e a única forma de encerrar a sessão era recarregar a página,
 * que perde as chaves sem avisar a API que a sessão acabou.
 *
 * **Padrão de divulgação, e não `role="menu"`.** O `role="menu"` promete
 * semântica de aplicação: o leitor de tela passa a anunciar itens de menu e o
 * teclado deveria navegar por setas, com `Tab` saindo do conjunto. Prometer isso
 * sem implementar a navegação inteira é pior do que não prometer — o usuário de
 * teclado fica com um componente que se anuncia de um jeito e responde de outro.
 * Aqui o gatilho declara `aria-expanded` sobre um grupo de links e botões
 * comuns, e `Tab` percorre os itens como percorreria qualquer outro trecho da
 * página (`CLAUDE.md` secao 27).
 */
export function ProfileMenu(): React.JSX.Element | null {
  const user = useSessionStore((state) => state.user);
  const { signOut } = useAuthActions();

  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    // `mousedown`, e não `click`: fechar só no `click` deixaria o menu aberto
    // durante o pressionar do botão sobre o resto da página, e um item que
    // desaparece entre o `mousedown` e o `mouseup` engole o clique seguinte.
    function handlePointerDown(event: MouseEvent): void {
      const target = event.target;

      if (target instanceof Node && containerRef.current?.contains(target) === true) {
        return;
      }

      setIsOpen(false);
    }

    // O foco volta ao gatilho: quem abriu pelo teclado precisa continuar de onde
    // estava, e não ser devolvido ao início da página.
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key !== 'Escape') {
        return;
      }

      setIsOpen(false);
      triggerRef.current?.focus();
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // `RequireSession` já garante sessão viva, e `startSession` grava token e
  // usuário juntos. A guarda existe porque o tipo permite o nulo, e um menu de
  // perfil sem perfil não tem o que exibir.
  if (user === null) {
    return null;
  }

  /**
   * `signOut` limpa o estado local mesmo se a chamada à API falhar, então a
   * sessão sempre termina e o componente sempre desmonta — não há caminho de
   * volta que precise restaurar `isSigningOut`.
   */
  function handleSignOut(): void {
    setIsSigningOut(true);

    // A rejeição é tratada aqui porque `signOut` limpa o estado local no
    // `finally`: quando a chamada falha, o usuário sai deste dispositivo de
    // qualquer forma e não há o que exibir numa tela que já vai desmontar.
    // O custo é a sessão sobreviver no servidor, que é o mesmo limite do
    // recarregamento e está registrado no `BACKLOG.md`. Sem o `catch`, isso
    // viraria uma unhandled rejection e nada mais.
    void signOut().catch(() => undefined);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => {
          setIsOpen((open) => !open);
        }}
        className="rounded px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        {user.name}
      </button>

      {isOpen ? (
        <div
          id={menuId}
          className="absolute right-0 z-10 mt-2 w-64 rounded border border-slate-300 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
              {user.name}
            </p>
            <p className="truncate text-xs text-slate-600 dark:text-slate-400">{user.email}</p>
          </div>

          <div className="flex flex-col p-1">
            <Link
              to="/configuracoes"
              onClick={() => {
                setIsOpen(false);
              }}
              className="rounded px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Configurações
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="rounded px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-60 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {isSigningOut ? 'Saindo…' : 'Sair'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
