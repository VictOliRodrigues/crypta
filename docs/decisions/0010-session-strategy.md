# ADR 0010 — Sessões com refresh token rotacionado

## Status

ACCEPTED

## Data

2026-08-05

## Contexto

O usuário precisa permanecer autenticado sem redigitar a senha a cada requisição — e, neste produto, redigitar a senha é especialmente caro, porque ela passa por Argon2id e reabre a chave privada.

Ao mesmo tempo, o escopo exige sessões revogáveis: consultar sessões ativas, encerrar outras e encerrar todas. Isso é incompatível com um token autocontido de vida longa, que só expira sozinho.

Há dois clientes com capacidades diferentes: o navegador tem cookies `HttpOnly`, que o JavaScript não lê; o Android tem o Keystore, mas não tem cookie `HttpOnly`.

## Decisão

Dois tokens com papéis distintos.

**Access token:** JWT assinado, de curta duração, enviado em `Authorization: Bearer`, mantido apenas em memória. Nunca em `localStorage` nem em `sessionStorage`.

**Refresh token:** valor aleatório e opaco, de duração longa e controlada. O banco guarda apenas o hash. É rotacionado a cada uso, revogável individualmente e associado a uma sessão e a um dispositivo.

Armazenamento por cliente:

| Cliente | Access token | Refresh token                                                      |
| ------- | ------------ | ------------------------------------------------------------------ |
| Web     | memória      | cookie `HttpOnly`, `Secure`, `SameSite`, com `Path` restrito à API |
| Android | memória      | Android Keystore                                                   |

**Detecção de reuso:** se um refresh token já rotacionado for apresentado novamente, a sessão é revogada, o evento é registrado e um novo login é exigido. Um token já usado voltando significa que alguém tem uma cópia — a única resposta segura é invalidar.

No logout: limpar o cache de queries, as chaves em memória, o access token, remover o refresh token e invalidar as telas sensíveis.

Após alteração de senha, as demais sessões são revogadas.

## Alternativas consideradas

**JWT único de vida longa.** Rejeitada. Não é revogável sem lista de bloqueio, e uma cópia roubada vale até expirar. Incompatível com o requisito de revogar sessões.

**Refresh token em `localStorage`.** Rejeitada. Fica ao alcance de qualquer XSS. Como o cliente Web é onde as chaves são derivadas, XSS já é o cenário mais grave — não faz sentido facilitá-lo.

**Sessão de servidor com cookie de sessão apenas.** Rejeitada. Funcionaria bem na Web, mas o Android teria que emular cookie, e a extensão futura complicaria mais. O par access/refresh serve os três clientes com o mesmo modelo.

**Refresh token sem rotação.** Rejeitada. Sem rotação não existe sinal de reuso, e um token vazado permanece válido até expirar sem que ninguém perceba.

## Consequências positivas

- Sessões revogáveis individualmente, em lote ou por alteração de senha.
- A rotação transforma o roubo de token em evento detectável.
- O access token curto limita a janela de uso de uma cópia.
- O cookie `HttpOnly` mantém o refresh token fora do alcance do JavaScript na Web.

## Consequências negativas

- Implementação mais complexa: rotação, famílias de token, detecção de reuso e limpeza.
- Requisições concorrentes durante a expiração do access token exigem uma fila de refresh no cliente, sob risco de rotações simultâneas invalidarem a sessão.
- O cookie exige `credentials: true` no CORS e, portanto, lista explícita de origens — curinga fica proibido.
- Fluxos diferentes de armazenamento entre Web e Android precisam ser distinguidos com segurança no servidor.

## Riscos

- **Rotação concorrente causando logout indevido.** Mitigado pela fila de refresh no cliente e por uma janela de tolerância no servidor, a ser definida na implementação.
- **CSRF em endpoints baseados em cookie.** Mitigado por `SameSite`, validação de origem e proteção específica nos endpoints de refresh.
- **Duração dos tokens ainda em aberto** (`PEND-007`, `PEND-008`) e política de `SameSite` dependente dos domínios finais (`PEND-009`).
- **Falso positivo de reuso derrubando a sessão do usuário legítimo.** Preferimos o falso positivo ao falso negativo: revogar indevidamente custa um login, não revogar custa o cofre.

## Impactos

- **Código:** módulos `auth` e `sessions`, interceptor do cliente HTTP na Web.
- **Banco:** tabela de sessões com hash do refresh token, família e estado de revogação.
- **API:** `/auth/login`, `/auth/refresh`, `/auth/logout`, `/sessions`.
- **Mobile:** integração com o Android Keystore.

## Plano de migração

Não se aplica.

## Referências internas

- `docs/ARCHITECTURE.md` secao 17
- `docs/DECISIONS.md` DEC-014, DEC-R003, DEC-R004, PEND-007, PEND-008, PEND-009
- `docs/API.md` secao 5
