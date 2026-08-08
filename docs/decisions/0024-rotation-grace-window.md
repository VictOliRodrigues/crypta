# ADR 0024 — Comportamento da janela de tolerância na rotação

## Status

ACCEPTED

## Data

2026-08-08

## Contexto

O [ADR 0021](0021-session-token-lifetimes.md) fixou uma janela de tolerância de 10 segundos na rotação do refresh token, e descreveu o comportamento assim:

> Um refresh token já rotacionado há 10 segundos ou menos é aceito e devolve **o mesmo par que a rotação original emitiu**.

Ao implementar `BLG-0805` ficou claro que essa frase não é executável.

O servidor guarda `SHA-256(token)` — decisão do [ADR 0022](0022-server-side-credentials.md), reafirmando o que o [ADR 0010](0010-session-strategy.md) já pedia. **Um hash não tem volta.** Para devolver o mesmo refresh token que a rotação anterior emitiu, o servidor precisaria tê-lo guardado em texto aberto.

Isso não é um detalhe de implementação a contornar. Guardar o token em claro:

- anula o motivo de existir da coluna `refresh_token_hash`;
- transforma um dump do banco em um conjunto de sessões utilizáveis, exatamente o cenário que o ADR 0022 dimensiona como o vazamento mais provável;
- e, no caso da Web, o valor ficaria no banco **e** no cookie, sem que o segundo lugar adicione proteção nenhuma.

O ADR 0021 não errou no propósito. Ele errou ao descrever o mecanismo: o objetivo declarado é que "duas abas renovando ao mesmo tempo não sejam tratadas como reutilização", e esse objetivo não depende de o par ser literalmente o mesmo.

### O que a janela precisa garantir

1. Apresentar o token imediatamente anterior, dentro de 10 segundos, **não derruba a sessão**.
2. O chamador sai com credencial funcionando.
3. A janela **não estende** o limite de inatividade — ela existe para não derrubar ninguém, não para dar sobrevida à sessão.
4. Fora da janela, apresentar o token anterior continua sendo reutilização, e a família cai.

## Decisão

**Dentro da janela, a rotação acontece de novo, e o chamador recebe um par novo.**

```text
tab A → apresenta T1 → rotaciona → recebe T2   (previous = T1, rotated_at = agora)
tab B → apresenta T1 → dentro de 10 s → rotaciona → recebe T3   (previous = T1)
```

Nenhuma sessão é revogada, nenhuma família cai, e as duas abas terminam com credencial válida.

**A rotação dentro da janela não move `last_used_at`.** É o item 3 acima, cumprido literalmente: o relógio da inatividade fica onde a rotação original o deixou.

**Fora da janela, nada muda em relação ao ADR 0021.** O token anterior apresentado depois de 10 segundos derruba a família inteira, com `SESSION_REVOKED` e auditoria.

**A troca é condicional no banco.** O `UPDATE` inclui o hash apresentado no `WHERE`, então duas rotações que cheguem ao mesmo tempo disputam a linha e apenas uma escreve. A perdedora recusa em vez de sobrescrever, e o cliente repete com o cookie que o navegador já atualizou.

### Por que a exposição é menor do que parece

Dentro da janela, dois tokens valem: o corrente e o imediatamente anterior. Isso é inerente a qualquer janela de tolerância — inclusive à do ADR 0021 — e não é introduzido aqui.

Na Web a janela real é ainda mais estreita do que os 10 segundos sugerem. O refresh token vive em cookie compartilhado entre abas: quando a aba A rotaciona, o navegador substitui o cookie, e a próxima requisição de qualquer aba já leva o valor novo. O token anterior só reaparece em requisição que **já estava em voo** quando a rotação terminou.

## Alternativas consideradas

**Guardar o refresh token em texto aberto para poder repeti-lo.** É a única forma de cumprir o ADR 0021 ao pé da letra. Rejeitada. Anula o hash em repouso do ADR 0022 e converte um dump de banco — o vazamento que aquele ADR trata como mais provável — em sessões prontas para uso. Nenhuma leitura literal de um ADR justifica reintroduzir o risco que outro ADR foi escrito para eliminar.

**Guardar o token em claro apenas durante os 10 segundos**, apagando depois. Rejeitada. Reduz a janela mas não o modo de falha: um dump tirado dentro dela entrega sessões vivas, e passa a existir um caminho de escrita de segredo em claro que uma refatoração futura pode esquecer de limpar. Complexidade a mais para um risco que continua existindo.

**Devolver apenas um access token novo, sem rotacionar.** Rejeitada, e é a alternativa que parece mais próxima do texto do ADR 0021. Não funciona: o chamador continuaria com o token anterior, que sai da janela em 10 segundos e passa a ser reutilização. A aba concorrente seria derrubada — com atraso, e com sintoma mais confuso do que o falso positivo que a janela existe para evitar.

**Remover a janela.** Rejeitada. O ADR 0010 já apontou o falso positivo como risco, e o ADR 0021 já rejeitou explicitamente deixar a tolerância em zero.

**Sessão com token de uso único e contador**, em vez de janela temporal. Rejeitada como complexidade sem ganho: resolveria o mesmo problema com mais estado e a mesma exposição de dois valores válidos.

## Consequências positivas

- A janela de tolerância passa a ser implementável sem persistir segredo em claro.
- Duas abas renovando ao mesmo tempo continuam funcionando, que é o objetivo do ADR 0021.
- O limite de inatividade não é estendido pela rotação de tolerância, como aquele ADR exige.
- A detecção de reutilização fora da janela fica intacta.
- A troca condicional no banco elimina a corrida entre duas rotações simultâneas sem lock explícito.

## Consequências negativas

- O texto do ADR 0021 deixa de descrever o comportamento real. Ele não é reescrito — ADR publicado não se reescreve —, e passa a depender deste para ser lido corretamente.
- Um cliente que dependesse de receber literalmente o mesmo token não funcionaria. Nenhum cliente existe, e a Web guarda o refresh em cookie que o navegador substitui sozinho.
- Cada passagem pela janela produz uma rotação a mais, e portanto uma escrita a mais no banco. Em uso normal isso é raro.

## Riscos

- **Ping-pong de rotações entre duas abas**, cada uma renovando a partir do token que a outra tornou anterior. Mitigação: as duas continuam funcionando, e a fila de refresh do cliente Axios (`CLAUDE.md` secao 24) serializa as renovações dentro de cada aba, o que reduz a ocorrência ao caso de requisições já em voo.
- **Interpretação divergente no futuro**, se alguém ler o ADR 0021 sem este. Mitigação: o serviço de rotação cita este ADR no comentário de topo, e a `DATABASE.md` registra o ponto na descrição da tabela de sessões.
- **Dois tokens válidos dentro da janela.** Assumido, e não introduzido aqui: é o que qualquer janela de tolerância significa.

## Impactos

- **Código:** `RotateSessionService` e o `UPDATE` condicional em `SessionRepository`.
- **Banco:** nenhum. As colunas `previous_token_hash` e `rotated_at` já entraram com a migration de identidade, e servem às duas leituras.
- **API:** `docs/API.md` secao 23 passa a descrever o comportamento real da janela.
- **Segurança:** nenhuma mudança de postura. A decisão existe justamente para não abrir mão do hash em repouso.
- **Deploy:** nenhum.
- **Documentação:** `SECURITY.md` secao 30, `docs/API.md` secao 23, `docs/DATABASE.md` secao 6.1, `DECISIONS.md` DEC-051.

## Plano de migração

Não se aplica. Não existe sessão emitida em nenhum ambiente.

## Referências internas

- [ADR 0010](0010-session-strategy.md) — a rotação com detecção de reuso, e o falso positivo que ele já apontava.
- [ADR 0021](0021-session-token-lifetimes.md) — a janela de 10 segundos, cujo mecanismo este ADR corrige sem alterar o propósito.
- [ADR 0022](0022-server-side-credentials.md) — o `SHA-256` do refresh token em repouso, que é a restrição de onde tudo isto decorre.
- `SECURITY.md` secoes 29, 30 e 33 — access token, refresh token e revogação.
- `docs/API.md` secao 23 — `POST /auth/refresh`.
- `CLAUDE.md` secoes 9 e 24 — falhar fechado e a fila de refresh do cliente.
- `docs/DECISIONS.md` DEC-051.
