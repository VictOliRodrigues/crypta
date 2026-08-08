# ADR 0021 — Duração dos tokens e atributos do cookie de refresh

## Status

ACCEPTED

## Data

2026-08-08

## Contexto

O [ADR 0010](0010-session-strategy.md) decidiu a _forma_ das sessões: access token JWT curto em memória, refresh token opaco rotacionado, hash no banco, detecção de reuso. Deixou três parâmetros em aberto, registrados como `PEND-007`, `PEND-008` e `PEND-009`, e a própria seção de riscos daquele ADR os cita como pendência.

Os três bloqueiam a R0.2 inteira. `ROADMAP.md` secao 14 coloca access token, refresh token, rotação e sessões entre as entregas da fase, e `.env.example` já reserva `ACCESS_TOKEN_TTL`, `REFRESH_TOKEN_TTL`, `REFRESH_COOKIE_DOMAIN` e `REFRESH_COOKIE_SAMESITE` como variáveis que a aplicação ainda não lê. Não dá para escrever o módulo `auth` sem fechá-los.

Duas condições que não existiam quando o ADR 0010 foi escrito agora existem:

1. **Os domínios são reais.** A R0.1 subiu `crypta-dev.vorodrigues.com.br` (Web) e `crypta-api-dev.vorodrigues.com.br` (API), ambos sob HTTPS. São hosts distintos sob o mesmo domínio registrável, que era exatamente a informação que faltava para decidir `SameSite` — o ADR 0010 registrou a política como dependente dos domínios finais.
2. **A criptografia da Web está implementada.** Os adapters de `@crypta/crypto-web` existem, o que torna concreto o raciocínio abaixo sobre o que uma sessão roubada consegue e não consegue fazer.

### O que uma sessão vale neste produto

Este é o ponto que dimensiona todos os prazos, e ele é diferente do de um produto comum.

A `UserEncryptionKey` deriva da senha por Argon2id (ADR 0016) e vive **apenas em memória**. Ela não é derivável a partir de nenhum token. Uma sessão válida, portanto, autentica mas **não descriptografa**: quem rouba o refresh token consegue falar com a API como o usuário, listar cofres, ler metadata e **destruir** conteúdo, mas recebe apenas blobs cifrados que não abre.

Duas consequências diretas:

- **O prazo do refresh token não protege o segredo.** Quem protege é a senha, que o atacante não tem. Prazo longo não vaza credencial; vaza metadata e permite estrago destrutivo.
- **Prazo longo compra pouca conveniência.** Como a chave de descriptografia morre ao fechar a aba, o usuário digita a senha de novo em toda carga limpa da aplicação — com ou sem sessão viva. O refresh token serve para atravessar a expiração do access token durante o uso ativo e ausências curtas, não para evitar que a senha seja digitada.

Ou seja: os dois lados da balança são mais leves do que o normal. Isso permite prazos moderados sem penalizar ninguém.

## Decisão

### 1. Access token — 15 minutos (`PEND-007`)

`SECURITY.md` secao 29 já registrava 15 minutos como sugestão inicial. Este ADR a torna vinculante, sem alteração de valor.

**Invariante que sustenta esse prazo:** a expiração do access token **não** é o mecanismo de revogação. `CLAUDE.md` secao 32 exige que a autorização verifique `session` a cada requisição, então o access token carrega o identificador da sessão (`sid`) e a camada de policy recusa token cujo `sid` esteja revogado. Revogar sessão, revogar as demais sessões e trocar a senha têm efeito **imediato**, não em até 15 minutos.

Com essa invariante, os 15 minutos são defesa em profundidade — limitam uma cópia usada contra um caminho que porventura não consulte a sessão — e não a janela de revogação. Sem ela, o valor teria que ser bem menor, e mesmo assim deixaria uma janela indefensável para um cofre.

### 2. Refresh token — 7 dias de inatividade, 30 dias absolutos (`PEND-008`)

Dois limites, ambos aplicados:

| Limite      | Valor   | Efeito                                                                           |
| ----------- | ------- | -------------------------------------------------------------------------------- |
| Inatividade | 7 dias  | cada rotação renova a contagem; sessão parada por 7 dias expira                  |
| Absoluto    | 30 dias | contado da criação da sessão; nenhuma rotação o estende, nem uma sequência delas |

O limite absoluto existe porque só o de inatividade produziria sessão perpétua: um cliente que renova sozinho a cada 15 minutos nunca fica inativo, e a sessão sobreviveria indefinidamente sem nenhuma reapresentação de senha.

Os valores são **iniciais e por deployment**, no mesmo espírito do [ADR 0018](0018-argon2id-parameters.md): configuráveis, com limites validados na partida, revisáveis sem novo ADR desde que fiquem dentro das faixas abaixo.

| Variável                     | Padrão | Faixa aceita | Falha na partida se           |
| ---------------------------- | ------ | ------------ | ----------------------------- |
| `ACCESS_TOKEN_TTL`           | `15m`  | `1m`–`60m`   | fora da faixa                 |
| `REFRESH_TOKEN_TTL`          | `7d`   | `1h`–`90d`   | fora da faixa                 |
| `REFRESH_TOKEN_ABSOLUTE_TTL` | `30d`  | `1d`–`365d`  | menor que `REFRESH_TOKEN_TTL` |

Fora da faixa, a API **não sobe**. É a mesma política de validação de ambiente que a R0.1 já aplica às demais variáveis: falhar fechado na partida, não degradar em silêncio.

### 3. Janela de tolerância na rotação — 10 segundos

O ADR 0010 previu uma janela de tolerância no servidor "a ser definida na implementação" e apontou o risco de rotações concorrentes derrubarem a sessão do usuário legítimo. Sem um valor, a detecção de reuso produz falso positivo toda vez que duas abas renovam ao mesmo tempo.

**Um refresh token já rotacionado há 10 segundos ou menos é aceito e devolve o mesmo par que a rotação original emitiu.** Sob condições estritas:

- não gera nova rotação;
- não estende o limite de inatividade;
- não vale para token cuja rotação já saiu da janela — aí é reuso, e a sessão cai;
- não vale para token de sessão já revogada.

Dez segundos cobrem concorrência entre abas e o retry de uma requisição, e continuam curtos demais para servir a um atacante que roubou o token e o apresenta depois.

### 4. Cookie de refresh da Web (`PEND-009`)

```http
Set-Cookie: refresh_token=<opaco>; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth
```

Sem atributo `Domain`. Item a item:

**`SameSite=Strict` como padrão.** `crypta-dev.vorodrigues.com.br` e `crypta-api-dev.vorodrigues.com.br` são hosts diferentes sob o mesmo domínio registrável (`vorodrigues.com.br`), sob o mesmo esquema. Para efeito de `SameSite`, isso é _same-site_ — a requisição da Web para a API é cross-origin, mas não cross-site, então o cookie acompanha `fetch` e XHR mesmo em `Strict`. O motivo clássico para preferir `Lax` (o usuário chega por link externo e aparece deslogado) não se aplica: este cookie nunca é usado em navegação de topo, apenas em requisição da própria aplicação.

**`SameSite` configurável, para deployments que separam o domínio registrável.** Sendo self-hosted, nada garante que todo operador ponha Web e API sob o mesmo domínio registrável. Quem puser em domínios registráveis distintos precisa de `SameSite=None`, senão o cookie simplesmente não é enviado e o refresh nunca funciona. `REFRESH_COOKIE_SAMESITE` aceita `Strict`, `Lax` ou `None`; com `None`, `Secure` continua obrigatório — o navegador exige — e a **validação de `Origin` no endpoint de refresh passa a ser a única barreira de CSRF**, conforme `API.md` secao 76.

**Sem atributo `Domain` — cookie host-only.** É o que `SECURITY.md` secao 31 chama de "Domain não excessivo", na forma mais restritiva possível. Fixar `Domain=vorodrigues.com.br` faria o cookie ser enviado a todo subdomínio do apex, incluindo o de `staging` e o de produção — compartilhamento de credencial entre ambientes, proibido por `CLAUDE.md` secao 65. Host-only não custa nada em funcionamento: o navegador escolhe o cookie pelo host de **destino** da requisição, e o destino do refresh é sempre o próprio host da API que o emitiu.

**`Path=/api/v1/auth`.** Mantém o cookie fora de toda requisição que não seja de autenticação. Cobre `login`, `refresh` e `logout`, que são os três que precisam dele.

**Mais de um cookie `refresh_token` na mesma requisição é rejeitado.** Um subdomínio irmão comprometido — ou um subdomínio pendente sequestrado — pode gravar um `refresh_token` com `Domain=vorodrigues.com.br`, e o navegador então envia dois valores para a API, sem que a ordem seja garantida por especificação. A API conta as ocorrências e responde `401` quando houver mais de uma, em vez de escolher. Falhar fechado (`CLAUDE.md` secao 9).

### 5. Android

Nada da seção 4 se aplica ao Android: não há cookie. O refresh token vai no corpo da resposta e é guardado no Keystore (ADR 0010, `SECURITY.md` secao 32). Os prazos das seções 1 a 3 são os mesmos nos dois clientes — a duração de uma sessão não é atributo de plataforma.

## Alternativas consideradas

**Prefixo `__Host-` no nome do cookie.** É tecnicamente a opção mais forte: o navegador _impõe_ `Secure`, ausência de `Domain` e host-only, o que resolveria o cenário de cookie tossing por estrutura em vez de por contagem no servidor — e, para um produto self-hosted que muitos operadores porão num domínio compartilhado com outros serviços, isso vale bastante. **Rejeitada nesta versão** porque o prefixo obriga `Path=/`, e `SECURITY.md` secao 31 exige Path restrito. Na hierarquia do `CLAUDE.md` secao 2, `SECURITY.md` está acima dos ADRs; um ADR não a contorna em silêncio. A mitigação da seção 4 cobre o mesmo ataque com uma verificação testável. Adotar `__Host-` continua sendo uma melhoria possível, mas exige emenda explícita ao `SECURITY.md` e ADR próprio.

**Access token de 5 minutos.** Reduziria a janela residual, mas triplicaria a frequência de rotação e, com ela, a exposição ao falso positivo de reuso concorrente descrito no ADR 0010. Como a revogação já é imediata pelo `sid`, o ganho é marginal e o custo em confiabilidade não é.

**Access token de 1 hora.** Rejeitada. Deixaria uma janela longa demais para qualquer caminho que venha a não consultar a sessão, e transformaria um erro de implementação em uma hora de acesso indevido.

**Refresh token só com limite de inatividade.** Rejeitada. Produz sessão perpétua para qualquer cliente que renove sozinho, e nunca força a reapresentação da senha.

**Refresh token só com limite absoluto.** Rejeitada. Uma sessão abandonada em um dispositivo emprestado continuaria válida até o prazo absoluto, mesmo sem uso nenhum.

**`SameSite=Lax` fixo.** Funcionaria igualmente bem no deployment de referência, já que a requisição é same-site. Rejeitada por ser estritamente mais permissiva sem nenhum benefício correspondente aqui.

**`Domain` no apex.** Rejeitada, e não por elegância: compartilharia o cookie entre os três ambientes, contra `CLAUDE.md` secao 65.

**Sem janela de tolerância.** Rejeitada. O ADR 0010 já identificou o risco; deixar em zero significa escolher o falso positivo como comportamento padrão, e derrubar a sessão do usuário legítimo sempre que duas abas renovarem juntas.

## Consequências positivas

- O módulo `auth` da R0.2 fica desbloqueado; era o único bloqueio formal restante da fase.
- Revogação passa a ser imediata por decisão explícita, e não "em até 15 minutos".
- O limite absoluto garante que nenhuma sessão sobreviva a 30 dias sem que a senha reapareça.
- Cookie host-only torna estruturalmente impossível vazar sessão entre `development`, `staging` e `production`.
- `Strict` no deployment de referência elimina a superfície de CSRF do refresh sem custo de usabilidade.
- Prazos por variável de ambiente permitem que um self-hoster mais rigoroso aperte os valores sem alterar código nem ADR.

## Consequências negativas

- Cookie sem `__Host-` depende de uma verificação no servidor — a contagem de ocorrências — em vez de uma garantia do navegador. É disciplina, não estrutura, e precisa de teste que a prove.
- `REFRESH_COOKIE_SAMESITE` configurável significa que um operador pode escolher `None` e reduzir a própria proteção de CSRF. A validação de `Origin` deixa de ser defesa em profundidade e vira defesa única.
- A janela de tolerância de 10 segundos é, por construção, um intervalo em que um token rotacionado ainda é aceito. Reduz a sensibilidade da detecção de reuso nesse intervalo.
- Três variáveis novas a provisionar em cada ambiente do Coolify, com o risco de divergência entre ambientes que toda variável traz.
- O limite absoluto de 30 dias produz um logout que o usuário não pediu e que, sem mensagem adequada, parece defeito.

## Riscos

- **Sessão revogada continuar aceita** porque algum caminho não verifica o `sid`. É o risco central desta decisão, já que ela troca janela curta por verificação por requisição. Mitigação: a verificação vive na camada de policy (`CLAUDE.md` secao 32), e `CLAUDE.md` secao 40 exige teste de acesso com membership removido — o teste de sessão revogada entra na mesma suíte.
- **Cookie tossing por subdomínio irmão**, mitigado pela rejeição de múltiplas ocorrências, que é código e pode ser esquecido em refatoração. Mitigação: teste de regressão com duas ocorrências do cookie na mesma requisição.
- **`SameSite=Strict` quebrar um deployment com domínios registráveis distintos**, com sintoma confuso: login funciona, refresh falha silenciosamente na virada dos 15 minutos. Mitigação: documentar em `config_user.md` e validar o ciclo completo de refresh no gate da R0.2, não apenas o login.
- **Relógio divergente** afetando `exp` e a janela de 10 segundos. Mitigação: a API é instância única por ambiente (ADR 0009) e os prazos são grandes o bastante para absorver deriva normal de NTP.
- **Prazos calibrados sem uso real.** Não há usuário para medir; os valores vêm de raciocínio sobre o modelo de ameaça, não de telemetria. Assumido explicitamente, como no ADR 0018 — e revisável dentro das faixas sem novo ADR.

## Impactos

- **Código:** módulo `auth` (emissão, rotação, tolerância, contagem do cookie), policies verificando `sid`, validação de startup das três variáveis; na Web, a fila de refresh do cliente Axios.
- **Banco:** a tabela de sessões precisa de `created_at` para o limite absoluto e de `last_used_at` para o de inatividade, além do hash, da família e do estado de revogação já previstos no ADR 0010. Entra na migration de identidade (BLG-0502).
- **API:** fixa o `Set-Cookie` de `/auth/login` e `/auth/refresh`; acrescenta a rejeição por cookie duplicado e o `401` correspondente.
- **Segurança:** torna vinculantes os valores de `SECURITY.md` secoes 29 a 31; a revogação imediata passa a ser requisito, não consequência do prazo.
- **Deploy:** três variáveis novas por ambiente no Coolify; `REFRESH_COOKIE_DOMAIN` deixa de existir.
- **Documentação:** `SECURITY.md` secoes 29 a 31, `API.md` secao 5, `ARCHITECTURE.md` secao 17, `.env.example`, `DECISIONS.md` DEC-048 e as três pendências.

## Plano de migração

Não se aplica. Não existe módulo de autenticação, tabela de sessões nem sessão emitida.

Apertar qualquer prazo depois é seguro: sessões acima do novo limite passam a ser recusadas na próxima requisição, e o custo é um login. Afrouxar exige o caminho inverso e nenhuma migração de dados. Trocar `SameSite` ou `Path` invalida na prática os cookies já emitidos, porque o navegador passa a tratá-los como cookie distinto — o efeito é um logout geral, não perda de dado.

## Referências internas

- [ADR 0010](0010-session-strategy.md) — a forma da sessão, que este ADR parametriza; fecha os três riscos que ele deixou abertos.
- [ADR 0016](0016-argon2id-libsodium-wasm.md) — Argon2id, e o motivo de a senha ser necessária para descriptografar mesmo com sessão válida.
- [ADR 0018](0018-argon2id-parameters.md) — mesmo padrão de parâmetro inicial configurável com faixa validada.
- [ADR 0009](0009-coolify-deployment.md) — instância única por ambiente e isolamento entre ambientes.
- `SECURITY.md` secoes 29, 30, 31, 32 e 33 — access token, refresh token, Web, Android e revogação.
- `docs/API.md` secoes 5 e 76 — cookie de refresh e CSRF.
- `docs/ARCHITECTURE.md` secao 17 — sessões e tokens.
- `CLAUDE.md` secoes 9, 32, 40, 65 e 82 — falhar fechado, autorização, IDOR, isolamento de ambientes e checklist de mudança de autenticação.
- `docs/DECISIONS.md` DEC-014, DEC-048, PEND-007, PEND-008, PEND-009.
