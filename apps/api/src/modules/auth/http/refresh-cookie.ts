import { type Request, type Response } from 'express';

/**
 * Cookie de refresh da Web (ADR 0021, `SECURITY.md` secao 31).
 *
 * ```http
 * Set-Cookie: refresh_token=<opaco>; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth
 * ```
 *
 * **A leitura é do header `Cookie` cru, de propósito.** O `cookie-parser` — e o
 * `req.cookies` de qualquer biblioteca equivalente — colapsa ocorrências
 * repetidas e devolve uma só, o que tornaria impossível cumprir a regra do ADR
 * 0021 de recusar a requisição que traz mais de um `refresh_token`. Um
 * subdomínio irmão comprometido pode gravar um cookie de mesmo nome com escopo
 * mais amplo, e a ordem em que os dois chegam não é garantida por especificação:
 * escolher um deles seria escolher no escuro.
 */

export const REFRESH_COOKIE_NAME = 'refresh_token';

/** `Path` restrito: fora das rotas de autenticação o cookie não é enviado. */
export const REFRESH_COOKIE_PATH = '/api/v1/auth';

export type RefreshCookieRead =
  | { kind: 'absent' }
  | { kind: 'single'; value: string }
  /** Mais de uma ocorrência. A requisição é recusada, sem escolher entre elas. */
  | { kind: 'duplicated' };

/**
 * Todas as ocorrências do cookie de refresh, na ordem em que o navegador enviou.
 *
 * O header é uma lista separada por `; `. Um valor vazio conta como ocorrência:
 * um atacante que sobrescreva o cookie com string vazia estaria justamente
 * tentando fazer a contagem passar despercebida.
 */
export function readRefreshCookie(request: Request): RefreshCookieRead {
  const header = request.headers.cookie;

  if (typeof header !== 'string' || header.length === 0) {
    return { kind: 'absent' };
  }

  const values: string[] = [];

  for (const pair of header.split(';')) {
    const separator = pair.indexOf('=');

    if (separator === -1) {
      continue;
    }

    if (pair.slice(0, separator).trim() === REFRESH_COOKIE_NAME) {
      values.push(pair.slice(separator + 1).trim());
    }
  }

  if (values.length === 0) {
    return { kind: 'absent' };
  }

  if (values.length > 1) {
    return { kind: 'duplicated' };
  }

  const value = values.at(0) ?? '';

  return value.length === 0 ? { kind: 'absent' } : { kind: 'single', value };
}

export type RefreshCookieOptions = {
  sameSite: 'Strict' | 'Lax' | 'None';
  maxAgeSeconds: number;
};

/**
 * Emite o cookie.
 *
 * **Sem atributo `Domain`** — host-only. Um `Domain` no apex enviaria o cookie a
 * todo subdomínio, compartilhando sessão entre `development`, `staging` e
 * `production`, contra o `CLAUDE.md` secao 65.
 *
 * `Secure` é incondicional, inclusive em desenvolvimento. Com `SameSite=None` o
 * navegador exige `Secure`; nos demais casos, tornar isso condicional criaria
 * uma configuração em que a proteção some sem que nada falhe.
 */
export function setRefreshCookie(
  response: Response,
  token: string,
  options: RefreshCookieOptions,
): void {
  response.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: options.sameSite.toLowerCase() as 'strict' | 'lax' | 'none',
    path: REFRESH_COOKIE_PATH,
    maxAge: options.maxAgeSeconds * 1000,
  });
}

/**
 * Remove o cookie no logout.
 *
 * `Path` e `SameSite` precisam ser os mesmos da emissão: o navegador identifica
 * o cookie por nome, domínio e path, e uma limpeza com path diferente deixaria o
 * original intacto.
 */
export function clearRefreshCookie(
  response: Response,
  options: Pick<RefreshCookieOptions, 'sameSite'>,
): void {
  response.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: true,
    sameSite: options.sameSite.toLowerCase() as 'strict' | 'lax' | 'none',
    path: REFRESH_COOKIE_PATH,
  });
}
