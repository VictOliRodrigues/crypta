import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';

import { useSessionStore } from '../stores/session-store';

/**
 * Tira de `/login` e `/setup` quem já tem sessão.
 *
 * ## O defeito que isto corrige
 *
 * `RequireSession` mandava quem não tinha sessão para o login, e não existia o
 * caminho inverso. A consequência não era um erro: era **silêncio**. O
 * `signIn` percorria tudo — parâmetros, `POST /auth/login`, key bundle,
 * desbloqueio — e a tela continuava sendo o formulário de login, com o botão
 * voltando de "Entrando…" para "Entrar".
 *
 * Ou seja: a autenticação funcionava e o usuário via exatamente o que veria se
 * ela tivesse falhado, sem nem a mensagem de senha errada para se guiar. O
 * mesmo valia depois do `POST /setup`.
 *
 * A guarda vive na rota, e não num `navigate` dentro do formulário, porque a
 * condição não é "o login acabou de dar certo" e sim "esta sessão não tem o que
 * fazer aqui" — o que também cobre voltar para `/login` pelo histórico do
 * navegador com a sessão viva.
 */
export function RedirectAuthenticated({ children }: { children: ReactNode }): React.JSX.Element {
  const accessToken = useSessionStore((state) => state.accessToken);
  const location = useLocation();

  if (accessToken !== null) {
    return <Navigate to={intendedPath(location.state)} replace />;
  }

  return <>{children}</>;
}

/**
 * Rota que o usuário tentou abrir antes de ser mandado ao login.
 *
 * `RequireSession` a deixa no `state` da navegação. Sem isso, quem clicasse num
 * link para as configurações e precisasse entrar cairia na raiz depois do
 * login, e teria de navegar de novo até onde já estava indo.
 *
 * O valor vem do histórico do navegador, que é gravável por qualquer página, e
 * por isso é tratado como entrada não confiável: só um caminho relativo é
 * aceito. Um `//host` ou `https://host` seria redirecionamento aberto, e numa
 * tela de login é o ponto exato onde ele vale mais para quem ataca.
 */
function intendedPath(state: unknown): string {
  const fallback = '/';

  if (typeof state !== 'object' || state === null || !('from' in state)) {
    return fallback;
  }

  const { from } = state;

  if (typeof from !== 'string' || !from.startsWith('/') || from.startsWith('//')) {
    return fallback;
  }

  return from;
}
