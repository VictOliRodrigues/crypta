# BACKLOG.md

# Crypta — Backlog do Produto

> **Status:** Backlog inicial para revisão  
> **Versão:** 0.2.0  
> **Última atualização:** 31 de julho de 2026

---

## 1. Objetivo

Este documento organiza o trabalho necessário para desenvolver, testar, documentar e implantar o cofre de senhas descrito em:

- `PROJECT_SCOPE.md`;
- `ARCHITECTURE.md`;
- `DATABASE.md`;
- `API.md`;
- `SECURITY.md`;
- `TELAS.md`;
- `STYLE_GUIDE.md`;
- `ROADMAP.md`;
- `GITHUB_RELEASE_FLOW.md`;
- `config_user.md`.

O backlog deverá ser mantido como fonte operacional do projeto.

---

## 2. Convenções

### 2.1 Prioridade

| Código | Significado                           |
| ------ | ------------------------------------- |
| `P0`   | Bloqueador de segurança ou produção   |
| `P1`   | Obrigatório para a V1                 |
| `P2`   | Importante, mas pode entrar após a V1 |
| `P3`   | Evolução futura                       |

### 2.2 Tipo

| Código     | Significado                |
| ---------- | -------------------------- |
| `EPIC`     | Conjunto amplo de entregas |
| `FEAT`     | Funcionalidade             |
| `SEC`      | Segurança                  |
| `TECH`     | Fundação técnica           |
| `TEST`     | Testes                     |
| `DOC`      | Documentação               |
| `INFRA`    | Infraestrutura             |
| `BUG`      | Correção                   |
| `RESEARCH` | Pesquisa/decisão           |
| `ADR`      | Decisão arquitetural       |

### 2.3 Status

```text
BACKLOG
READY
IN_PROGRESS
BLOCKED
REVIEW
DONE
CANCELLED
```

### 2.4 Estimativa

Usar tamanho relativo:

```text
XS
S
M
L
XL
```

Itens `XL` deverão ser divididos antes de entrarem em desenvolvimento.

---

## 3. Definition of Ready

Uma tarefa poderá ir para `READY` quando:

- objetivo estiver claro;
- dependências estiverem identificadas;
- critérios de aceite existirem;
- impacto de segurança estiver avaliado;
- contratos afetados estiverem identificados;
- documentação afetada estiver identificada;
- não houver decisão arquitetural pendente bloqueadora.

---

## 4. Definition of Done

Uma tarefa somente poderá ser considerada `DONE` quando:

- código implementado;
- lint aprovado;
- typecheck aprovado;
- testes criados e aprovados;
- documentação atualizada;
- segurança revisada;
- nenhum segredo incluído;
- build aprovado;
- deploy no ambiente de testes validado quando aplicável;
- critérios de aceite atendidos;
- PR revisado;
- migration validada quando aplicável.

---

## 5. Estado da R0

> Atualizado em 7 de agosto de 2026.

| Item     | Status  | Observação                                                                                                                                                                                                  |
| -------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BLG-0001 | DONE    | Repositório público em `VictOliRodrigues/crypta`, com `develop`, `staging` e `main` criadas e `develop` como padrão.                                                                                        |
| BLG-0002 | DONE    | `.gitignore`, `.editorconfig`, `.env.example`, `VERSION`, `LICENSE`, `docs/decisions/`, a documentação reorganizada e os templates de `.github/` (PR, issues e `release.yml`).                              |
| BLG-0003 | DONE    | Configuração manual do GitHub concluída para a R0: merge methods, permissões das Actions, três Environments, labels, milestone `0.1.0` e reporte privado. Coolify e variables de imagem são escopo da R0.1. |
| BLG-0004 | DONE    | `Permanent branches`, `Release branches` e `Release tags` ativos, com os três checks obrigatórios. Fluxo inválido validado no PR #8.                                                                        |
| BLG-0005 | DONE    | ADRs 0001 a 0014 em `docs/decisions/`, linkados no `README.md`, em `DECISIONS.md` e em `ARCHITECTURE.md` secao 51.                                                                                          |
| BLG-0101 | DONE    | Workspaces criados. `apps/mobile` é apenas README: entra na R0.7.                                                                                                                                           |
| BLG-0102 | DONE    | `@crypta/tsconfig` com `strict`, `noUncheckedIndexedAccess` e `exactOptionalPropertyTypes`; aliases configurados.                                                                                           |
| BLG-0103 | DONE    | `@crypta/eslint-config` (flat config) com variantes React e Nest; Prettier na raiz.                                                                                                                         |
| BLG-0104 | DONE    | Vitest nos packages e na Web, Jest e Supertest na API. Testes de integração com MySQL real entram na R0.2, em job próprio da CI.                                                                            |
| BLG-0105 | BACKLOG | Hooks locais (Husky/lint-staged) ainda não avaliados.                                                                                                                                                       |
| BLG-0201 | DONE    | `ci.yml` com format, lint, typecheck, test, build e validação do schema Prisma. Os três checks estão registrados como obrigatórios nas branches permanentes.                                                |
| BLG-0202 | PARCIAL | `pnpm audit --audit-level high` na CI e Dependabot configurado. Falta container scan (`PEND-019`).                                                                                                          |

Licença definida em DEC-040 / [ADR 0013](decisions/0013-agpl-license.md): `AGPL-3.0-only`, com o `LICENSE` na raiz e o identificador SPDX no `package.json`.

Override de `js-yaml` definido em DEC-041 / [ADR 0014](decisions/0014-js-yaml-override.md), fechando GHSA-pm4m-ph32-ghv5 numa transitiva de `@nestjs/swagger` que não tem correção upstream.

### Gate de saída da R0

Conforme `ROADMAP.md` secao 8:

| Item do gate                                 | Estado                                                                     |
| -------------------------------------------- | -------------------------------------------------------------------------- |
| Configuração do `config_user.md` para a fase | OK — fases 1 a 4 e 7 a 9; Coolify e variables de imagem são escopo da R0.1 |
| Branches permanentes criadas                 | OK — `develop`, `staging` e `main`, com ruleset ativo nas três             |
| `develop` definido como padrão               | OK                                                                         |
| PR inválido bloqueado                        | OK — PR #8, `feature/* → main`, reprovado por `Validar origem e destino`   |
| Branch temporária correta pode ser apagada   | OK — validado nos PRs #5, #6 e #7                                          |
| `release/*` não é apagada automaticamente    | OK — fora do `cleanup-temporary-branches.yml` e sob `Restrict deletions`   |
| `VERSION` validado                           | OK — `0.1.0`, sem prefixo `v`                                              |
| `pnpm install` funcional                     | OK — `--frozen-lockfile` passa na política de supply chain                 |
| Lint passa                                   | OK — CI verde em `develop`                                                 |
| Typecheck passa                              | OK — CI verde em `develop`                                                 |
| Testes de exemplo passam                     | OK — 106 testes                                                            |
| Web builda                                   | OK — CI verde em `develop`                                                 |
| API builda                                   | OK — CI verde em `develop`                                                 |
| Documentação principal versionada            | OK                                                                         |
| Nenhum segredo no repositório                | OK — secret scanning e push protection ativos                              |

**O gate de saída da R0 está cumprido.**

Fora do gate, herdado para a R0.1: `staging` e `main` continuam no baseline anterior às correções
de CI e recebem esse conteúdo na promoção da `release/0.1.0`; as variables `WEB_IMAGE` e
`API_IMAGE` e os secrets do Coolify entram junto do primeiro deploy real.

O estado da R0.2 é rastreado na secao 7, que passou a existir quando `@crypta/crypto-web` (PR #16) adiantou parte do ÉPICO 07. O da R0.3 está na secao 8. Nenhuma tarefa da R0.4 em diante foi iniciada.

---

## 6. Estado da R0.1

> Atualizado em 7 de agosto de 2026.

O ambiente de development está no ar:

```text
Web   https://crypta-dev.vorodrigues.com.br
API   https://crypta-api-dev.vorodrigues.com.br
```

### Gate de saída da R0.1

Conforme `ROADMAP.md` secao 12. Verificado contra o ambiente implantado, no commit `b286bbe`.

| Item do gate                                | Estado                                                                                |
| ------------------------------------------- | ------------------------------------------------------------------------------------- |
| Web acessível por HTTPS                     | OK — certificado Let's Encrypt, redirect `http → https`                               |
| API acessível por HTTPS                     | OK — certificado Let's Encrypt, redirect `http → https`                               |
| Web consulta API                            | OK — CORS validado no servidor e chamada confirmada no navegador, sem bloqueio de CSP |
| API consulta MySQL                          | OK — `/health/ready` responde `{"status":"ready","database":"ok"}`                    |
| MySQL sem porta pública                     | OK — 3306 fechada a partir da internet                                                |
| Imagem identificada por commit              | OK — `X-App-Commit: b286bbe` e tag `dev-<sha>` no GHCR                                |
| `/api/v1/version` corresponde ao deployment | OK — `commit: b286bbe`, `environment: development`                                    |
| Deploy automático por `develop`             | OK — `deploy-development.yml` concluído com sucesso em `115920c` e `b286bbe`          |
| Rollback para um `dev-<sha>` anterior       | OK — `dev-b286bbe…` revertido para `dev-115920c…` e restaurado, sem rebuild           |
| Nenhum Docker Compose usado                 | OK — nenhum arquivo compose versionado                                                |

**O gate de saída da R0.1 está cumprido.**

Também verificado, fora do gate: preflight `OPTIONS` devolve `204`; origem não autorizada não recebe `Access-Control-Allow-Origin`; a Web serve os sete cabeçalhos de segurança em todas as rotas; SPA fallback responde `200` em rota profunda; `index.html` com `Cache-Control: no-store`.

### Riscos que a fase existia para medir

`ROADMAP.md` secao 11. Todos exercitados contra infraestrutura real:

| Risco                     | Resultado                                                                                           |
| ------------------------- | --------------------------------------------------------------------------------------------------- |
| Build context do monorepo | Resolvido — as duas imagens constroem com a raiz como contexto                                      |
| Autenticação no GHCR      | Resolvido — packages públicos, sem credencial no servidor (DEC em `config_user.md` secao 10)        |
| Disparo do Coolify        | Resolvido — webhook por token de API, sobre o FQDN do painel (`config_user.md` secao 14)            |
| CORS                      | Resolvido — origem única por ambiente, sem curinga                                                  |
| DNS                       | Resolvido                                                                                           |
| HTTPS                     | Resolvido — Let's Encrypt nos dois domínios                                                         |
| Proxy                     | Resolvido — Traefik do Coolify roteando os dois recursos                                            |
| Conexão com MySQL         | Resolvido — rede privada, sem porta pública                                                         |
| Migrations                | Parcial — o caminho executa a cada partida (ADR 0015), mas não há migration com conteúdo até a R0.2 |
| Env vars                  | Resolvido — validação de startup falha fechado                                                      |
| Rede                      | Resolvido                                                                                           |
| Nginx SPA fallback        | Resolvido                                                                                           |
| Metadata de versão        | Resolvido — `/version` e cabeçalhos `X-App-*`                                                       |

### Defeitos encontrados e corrigidos durante a fase

| Defeito                                                                                                     | Correção                          |
| ----------------------------------------------------------------------------------------------------------- | --------------------------------- |
| A Web servia **zero** cabeçalhos de segurança: `add_header` num `location` descarta os herdados do `server` | PR #10, com teste de regressão    |
| `deploy-development.yml` validava sem `build:packages`, reprovando código correto com 23 erros de tipo      | PR #12                            |
| Migrations não tinham lugar definido para rodar                                                             | ADR 0015, entrypoint do container |

As armadilhas de configuração manual encontradas nesta fase estão registradas em `config_user.md` secao 41.1.

---

## 7. Estado da R0.2

> Atualizado em 11 de agosto de 2026.

A R0.2 constrói a fundação de confiança do produto: identidade, sessões e o material criptográfico que protege todo o conteúdo das fases seguintes.

Todo o escopo da fase está implementado e as dez linhas do gate estão cumpridas. A última delas era a única que não dependia de código: o ciclo de refresh em navegador real, que só podia ser exercitado depois do deploy da Web em development.

Esta secao é o **gate único** da fase. Cada linha nasce `PENDENTE` e só vira `OK` acompanhada da evidência que a comprova, no pull request que a produziu. Não existe segundo lugar para conferir.

### Gate de segurança da R0.2

Conforme `ROADMAP.md` secao 17. Os itens do roadmap são objetivos; a coluna do meio é o que os torna verificáveis — um item sem forma de medir não é gate, é intenção.

Os nove primeiros vêm da secao 17. O décimo vem do [ADR 0021](decisions/0021-session-token-lifetimes.md), que atribuiu explicitamente ao gate desta fase a validação do ciclo completo de refresh, e não apenas do login.

| Item do gate                     | Critério verificável                                                                                                                                                                                                                   | Estado                                                                                                                                                                                                                                                                                                                      |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Senha original não enviada à API | O corpo de `POST /setup` e de `POST /auth/login` carrega `authSecret` e nenhum campo derivado da senha. Teste na Web sobre a fronteira de derivação; o DTO da API rejeita qualquer campo fora dele.                                    | OK — `identity.test.ts` confere que nada devolvido por `deriveIdentity` contém a senha; `setup.e2e-spec.ts` recusa `password` no corpo                                                                                                                                                                                      |
| AuthSecret não logado            | O `LogFields` fechado do `StructuredLogger` não admite o campo, então não existe caminho para registrá-lo; e2e confirma que o log de uma requisição de auth não contém o valor.                                                        | OK — o tipo `LogFields` não tem campo livre, e `session-lifecycle.e2e-spec.ts` confere que o `AuthSecret` não aparece na resposta                                                                                                                                                                                           |
| Private key nunca enviada aberta | O DTO de `POST /setup` aceita `encryptedPrivateKey` e `privateKeyNonce`; `forbidNonWhitelisted` responde `400` a um campo `privateKey`.                                                                                                | OK — `setup.e2e-spec.ts` recusa `privateKey` no bundle, e `change-password.e2e-spec.ts` faz o mesmo na segunda rota que grava material                                                                                                                                                                                      |
| Vetores passam                   | `pnpm --filter @crypta/crypto-core test` e `pnpm --filter @crypta/crypto-web test` verdes, incluindo os vetores de derivação de identidade, do payload da chave privada e do envelope.                                                 | OK — 126 e 55 testes verdes, com o vetor `identity-argon2id-64mib-t3` congelado e conferido contra `@noble/hashes`                                                                                                                                                                                                          |
| Ciphertext adulterado falha      | Loop byte a byte sobre o payload de identidade e sobre o envelope: toda posição alterada resulta em `CryptoAuthenticationError`, no padrão que o ADR 0017 já exigiu do envelope.                                                       | OK — cinco loops byte a byte em `identity.spec.ts`: chave privada, nonce, chave pública efêmera, `VaultKey` cifrada e o bundle reprotegido                                                                                                                                                                                  |
| AAD incorreta falha              | Decrypt com escopo, `entityType` ou `entityId` trocados falha fechado, sem devolver conteúdo parcial.                                                                                                                                  | OK — escopo `user` já coberto; o escopo `vault` ganhou decrypt real na revisão, com escopo, `entityType`, `entityId`, `vaultId` e `schemaVersion` trocados um a um                                                                                                                                                          |
| Refresh reuse revoga sessão      | e2e: rotaciona, apresenta o token antigo fora da janela de 10 s do ADR 0021, recebe `401` e a família deixa de existir. Dentro da janela, duas rotações concorrentes devolvem o mesmo par.                                             | OK — `session-lifecycle.e2e-spec.ts` cobre os dois lados da janela e confere que só a família comprometida cai                                                                                                                                                                                                              |
| localStorage não contém segredo  | O eslint da Web já proíbe `localStorage` e `sessionStorage` por `no-restricted-globals`; mais teste de que o store de sessão vive só em memória e não sobrevive ao reload.                                                             | OK — `session-store` sem `persist`, e `api-client.auth.test.ts` confere os dois storages vazios após um ciclo completo. O bundle contém uma referência a `sessionStorage`, do react-router, que guarda posição de rolagem e nenhum segredo                                                                                  |
| Arquitetura revisada             | Checklist do `BLG-0707` executado e o resultado registrado nesta secao, item a item.                                                                                                                                                   | OK — resultado logo abaixo, com os dois achados e o que foi feito com cada um                                                                                                                                                                                                                                               |
| Ciclo de refresh no navegador    | Login, expiração do access token e refresh bem-sucedido exercitados em navegador real contra development. O `SameSite=Strict` entre `crypta-dev` e `crypta-api-dev` foi deduzido da especificação e nunca exercitado; jsdom não cobre. | OK — exercitado em navegador real contra development em 11 de agosto de 2026: login, os 15 minutos do access token vencidos por espera e o refresh subsequente aceito, com o cookie atravessando `crypta-dev` → `crypta-api-dev`. É evidência de uso relatado, não artefato automatizado — nenhum teste reproduz este ciclo |

**As dez linhas do gate de segurança da R0.2 estão cumpridas.**

O que a última linha mediu, e que nenhuma outra podia medir: o `SameSite=Strict` do ADR 0021 sobrevive à separação entre `crypta-dev` e `crypta-api-dev`. O risco registrado naquele ADR era um deployment em domínios registráveis distintos, cujo sintoma seria justamente este — login funciona, refresh falha calado na virada dos 15 minutos. Os dois subdomínios compartilham `vorodrigues.com.br`, então o cookie é same-site e o ciclo fecha. A conclusão vale para esta topologia de domínio, não para qualquer uma: separar a API para outro domínio registrável reabre o risco e exige medir de novo.

**A fase, porém, ainda não está inteira em `develop`.** As três correções de `security/kdf-parameters-oracle` — o oráculo de enumeração do achado 3, o `initSodium` sem teto e a violação de CSP do Zod — nasceram do primeiro uso real e continuam fora da branch de integração. Não são linhas do gate, e por isso não alteram o veredito acima; mas a R0.3 sai de `develop`, e uma delas é um vazamento de existência de conta. **Essa branch precisa entrar antes do primeiro commit da fase seguinte.**

### Revisão criptográfica interna — `BLG-0707`

> Executada em 8 de agosto de 2026, sobre `security/crypto-review`.

Cada eixo do `BLG-0707`, o que foi conferido e o que se encontrou. Um eixo sem achado é registrado assim mesmo: "não encontrei nada" só vale se estiver dito qual foi a busca.

| Eixo                 | O que foi conferido                                                                                                                           | Resultado                                                                                                                                                                                            |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fluxos               | Setup, login, refresh, abertura do bundle e troca de senha. Onde cada segredo nasce, vive e morre.                                            | Sem achado. A senha entra em `identity.ts` e não sai: a varredura por `password` na Web só encontra formulários e hooks que a repassam para lá, e a API não tem o campo em rota nenhuma              |
| Nonce                | Toda origem de bytes aleatórios do repositório.                                                                                               | Sem achado. Um único ponto gera nonce de AEAD (`sealKeyPair`), sempre do CSPRNG e no tamanho da primitiva; o refresh token usa `randomBytes` do Node; `Math.random()` não aparece fora de comentário |
| Nonce do envelope    | O nonce derivado do ADR 0023, que não trafega.                                                                                                | Sem achado. Par efêmero novo por envelope faz a chave da AEAD nunca se repetir, e o nonce derivado junto dela tampouco                                                                               |
| AAD                  | Todo `buildAad` de produção e o par encrypt/decrypt correspondente.                                                                           | **Achado 1** — o escopo `vault` só tinha teste de serialização. Corrigido nesta branch                                                                                                               |
| Separação de domínio | Os dois HKDF da `RootKey` e os dois do segredo do servidor.                                                                                   | Sem achado. `auth` e `user-encryption` divergem e estão congelados em vetor; `auth-secret-pepper` e `kdf-parameters-decoy` seguem o mesmo padrão                                                     |
| Logs                 | `LogFields`, todo `logger.*` do repositório e o filtro global de exceções.                                                                    | Sem achado. O tipo não tem campo livre, nenhuma chamada passa material sensível, e nenhuma resposta de erro carrega stack, query ou path interno                                                     |
| Storage              | `localStorage`, `sessionStorage`, IndexedDB, Cache Storage e `document.cookie` no código da Web; o que o `clear` do store desmonta.           | **Achado 2** — o lint cobria dois dos cinco meios que a `SECURITY.md` secao 52 proíbe. Corrigido nesta branch                                                                                        |
| Cache HTTP           | `Cache-Control: no-store` nas rotas que devolvem material sensível.                                                                           | Sem achado. Toda rota com corpo tem o header; as que não têm devolvem `204`                                                                                                                          |
| Serialização         | **Eixo acrescentado depois do achado 3.** Rotas com caminho de decoy precisam devolver corpos indistinguíveis também na **ordem das chaves**. | **Achado 3** — `GET /auth/parameters` vazava a existência da conta pela posição do `kdfSalt`. Corrigido; é a única rota com decoy hoje                                                               |

#### Achado 1 — o escopo `vault` da AAD nunca passou por um decrypt

`aad.spec.ts` provava que a string canônica muda quando o contexto muda. Isso não é a mesma coisa que provar que a AEAD **recusa** o conteúdo, e a linha do gate fala em decrypt.

A lacuna existia porque `BLG-0706` é da R0.3: não há cofre nem credencial para cifrar ainda. Mas o formato está congelado agora, e descobrir na R0.3 que a amarração não segura obrigaria a migrar dado cifrado em vez de corrigir uma decisão de projeto — exatamente o que a `SECURITY.md` secao 18 manda evitar.

Fechado com conteúdo sintético e primitivas reais, em `crypto-web/src/identity.spec.ts`: escopo, `entityType`, `entityId`, `vaultId` e `schemaVersion` trocados um a um, todos falhando fechado.

#### Achado 2 — o lint cobria dois dos cinco meios de persistência proibidos

`SECURITY.md` secao 52 proíbe `localStorage`, `sessionStorage`, **IndexedDB**, cache persistente e cache de service worker. O `no-restricted-globals` da Web listava os dois primeiros.

Nada usava IndexedDB — o comentário do `query-provider` até o cita como coisa a evitar. Mas a proteção era um comentário, não uma barreira: o primeiro uso passaria pelo lint sem uma palavra, e a `SECURITY.md` cita IndexedDB **por nome**.

`indexedDB` e `caches` entraram na regra, com mensagem apontando a secao. Verificado com um arquivo de sondagem que o lint agora reprova.

#### Higiene de memória, fora do checklist

O `clear` do store soltava a referência do material de chave sem sobrescrever os bytes. Passou a zerar a `UserEncryptionKey` e a chave privada antes de soltar.

O comentário no código diz o que isso **não** garante, e vale repetir aqui: não prova que o segredo sumiu da memória. O motor pode ter copiado o buffer ao movê-lo entre gerações, e a senha é uma `string` imutável, que não há como sobrescrever em JavaScript. É defesa em profundidade; a garantia real continua sendo não persistir nada.

#### Achado 3 — oráculo de enumeração pela ordem das chaves (encontrado depois)

> Registrado em 9 de agosto de 2026, durante o primeiro uso real do ambiente de development.

`GET /auth/parameters` devolvia as chaves do JSON em ordem diferente conforme a conta existisse ou não:

```text
conta real   → kdfAlgorithm, kdfVersion, kdfSalt, kdfMemory, kdfIterations, kdfParallelism
inexistente  → kdfAlgorithm, kdfVersion, kdfMemory, kdfIterations, kdfParallelism, kdfSalt
```

Determinístico, verificado três vezes de cada lado contra o ambiente implantado. Nenhum valor diferia — a **posição** do `kdfSalt` entregava a existência da conta com 100% de precisão, em uma requisição, sem medir tempo. É exatamente o oráculo que a rota inteira existe para fechar (`SECURITY.md` secao 25, ADR 0022).

A causa: dois literais em vez de um. O caminho real montava o objeto campo a campo; o decoy espalhava `DECOY_PARAMETERS` e acrescentava o salt no fim. `JSON.stringify` preserva ordem de inserção.

**Por que a revisão não pegou.** Os sete eixos do `BLG-0707` — fluxos, nonce, AAD, separação, logs, storage, cache — olham o que é calculado e o que é guardado. Nenhum olha **como a resposta é serializada**. A revisão examinou o conteúdo dos corpos e não a forma deles, e este vazamento vive só na forma.

**Por que o teste não pegou.** Existia um caso chamado "responde com a mesma forma nos dois casos", e ele fazia:

```ts
expect(Object.keys(readData(existing)).sort()).toEqual(Object.keys(readData(missing)).sort());
```

O `.sort()` destrói precisamente a informação que vaza. O teste estava correto no que afirmava — o conjunto de campos é o mesmo — e vazio contra este ataque. É o pior formato de falso negativo: um teste com o nome certo cobrindo a propriedade errada.

Corrigido: os dois caminhos passam por uma única função de montagem, e o teste ganhou duas asserções — chaves sem ordenar, e corpo serializado comparado byte a byte com o salt normalizado. Verificado que ambas reprovam com a correção revertida.

#### Liberação para uso real

Com os dois achados corrigidos, **a revisão libera o uso real do material criptográfico** e desbloqueia a R0.3.

A liberação tem um limite explícito, que não é ressalva de formalidade: os vetores foram exercitados **apenas na Web**. `PEND-003` mantém o Android por medir até a R0.7, e a `SECURITY.md` secao 22 exige as duas plataformas. A compatibilidade é garantida por construção — algoritmos e parâmetros fixados nos ADRs 0016 e 0017 — mas garantida não é o mesmo que medida.

### Defeitos encontrados no primeiro uso real

| Defeito                                                                                                                                         | Correção                         | Estado                                   |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ---------------------------------------- |
| **Login bem-sucedido não saía da tela de login.** `RequireSession` mandava quem não tinha sessão para `/login`, e não existia o caminho inverso | `bugfix/post-login-redirect`     | Em `develop` — PR #28                    |
| `GET /auth/parameters` distinguia conta existente pela **ordem das chaves** do JSON, um oráculo de enumeração                                   | `security/kdf-parameters-oracle` | Fora de `develop` — branch não publicada |
| `initSodium` esperava `sodium.ready` sem teto: um bloqueio de WebAssembly travava a interface em silêncio                                       | `security/kdf-parameters-oracle` | Fora de `develop` — branch não publicada |
| A sonda de JIT do Zod disparava violação de CSP na tela de login                                                                                | `security/kdf-parameters-oracle` | Fora de `develop` — branch não publicada |

O primeiro merece registro além da linha da tabela, porque o modo de falhar foi pior do que o defeito.

O `signIn` completava inteiro — parâmetros, `POST /auth/login`, key bundle, desbloqueio — e a tela continuava sendo o formulário. Não havia erro para exibir, então **autenticar com sucesso ficava indistinguível de errar a senha**: o botão voltava de "Entrando…" para "Entrar" e nada mais acontecia. O mesmo valia depois do `POST /setup`.

Nenhum teste reprovava. Os testes de W01 e W02 dublam o `useAuthActions`, então nunca exercitam o que vem depois do sucesso, e nenhum teste montava o grafo de rotas. Testar as guardas isoladamente também não teria pego: o que faltava era a guarda **no roteador**. Por isso o grafo passou a viver em `routes.tsx`, montável por `useRoutes` num teste.

Custou quatro rodadas de diagnóstico contra hipóteses erradas — WebAssembly bloqueado, extensão, CSP, autopreenchimento — todas descartadas com medida antes de a instrumentação de `XMLHttpRequest` no navegador mostrar as quatro requisições saindo normalmente. A lição que fica registrada: **um sintoma silencioso na interface esconde um caminho feliz que funcionou**, e a primeira pergunta deveria ter sido "a requisição sai?", não "o que está bloqueando?".

### Por que a ordem das branches é essa

`SECURITY.md` secao 18 registra que mudar o formato da AAD "hoje ainda é barato, porque nenhum cofre existe; depois do primeiro conteúdo gravado, não é". A mesma janela valeu para o envelope de chave, cuja forma em `docs/API.md` secao 15 não correspondia ao que `@crypta/crypto-web` produz — o documento trazia um campo `nonce` que implementação nenhuma jamais gerou. A divergência foi fechada a favor do código, ainda dentro da janela, e hoje `KeyEnvelope` e a secao 15 têm os mesmos cinco campos.

Por isso o formato criptográfico é fechado **antes** da primeira migration, e a migration vem antes de qualquer endpoint que grave. Inverter a ordem transformaria uma decisão de projeto em migração de dado criptografado.

### Tarefas da R0.2

| Item     | Status  | Observação                                                                                                                                                                               |
| -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BLG-0502 | DONE    | `users`, `user_key_bundles`, `sessions` e `idempotency_records` na migration `20260808181037_identity`, testada em banco vazio e em banco com dados. Abriu o harness e2e com MySQL real. |
| BLG-0701 | PARCIAL | ADRs 0016, 0017 e 0018 fecharam a Web. Faltam a biblioteca do Android (`PEND-003`) e o Keystore, ambos na R0.7.                                                                          |
| BLG-0702 | DONE    | Payload versionado, AAD de dois escopos, envelope enquadrado, `buildCipherPayload` e erros. ADR 0023.                                                                                    |
| BLG-0703 | DONE    | `deriveIdentitySecrets` orquestra Argon2id e os dois HKDF, com vetor congelado em `crypto-core`. Benchmark Android fica na R0.7.                                                         |
| BLG-0704 | DONE    | `createUserKeyBundle` e `openUserKeyBundle`, com AAD amarrada à chave pública e adulteração testada byte a byte.                                                                         |
| BLG-0705 | PARCIAL | Formato do envelope fechado e testado. Geração da `VaultKey` e envelopes OWNER/EDITOR entram na R0.3, com o cofre.                                                                       |
| BLG-0706 | BACKLOG | Depende do formato fechado. Vault, site e credential só ganham payload real a partir da R0.3.                                                                                            |
| BLG-0707 | DONE    | Revisão executada e registrada acima. **Três** achados, os três corrigidos — o terceiro encontrado em development, depois do fechamento. Uso real liberado.                              |
| BLG-0801 | DONE    | `GET /setup/status`, devolvendo só o booleano.                                                                                                                                           |
| BLG-0802 | DONE    | Tela W01 e `POST /setup`, em transação e com idempotência.                                                                                                                               |
| BLG-0803 | DONE    | `GET /auth/parameters`, com parâmetros sintéticos derivados do e-mail e estáveis entre chamadas.                                                                                         |
| BLG-0804 | DONE    | Tela W02 e `POST /auth/login`, com bloqueio progressivo, cookie de refresh e fila de refresh no cliente. Faltava sair da tela após o sucesso; corrigido em `bugfix/post-login-redirect`. |
| BLG-0805 | DONE    | Rotação, família e detecção de reuso, com a janela de 10 s lida conforme o ADR 0024.                                                                                                     |
| BLG-0806 | DONE    | `POST /auth/logout` e `POST /auth/logout-all`, com limpeza do cookie.                                                                                                                    |
| BLG-0807 | DONE    | `POST /users/me/change-password` e a aba Segurança do W24. `resealUserKeyBundle` reprotege o mesmo par; a API recusa troca de chave pública e salt reaproveitado.                        |
| BLG-0901 | DONE    | `GET /sessions`, escopado ao dono e marcando a sessão atual.                                                                                                                             |
| BLG-0902 | DONE    | `DELETE /sessions/:sessionId`, com `404` para sessão de outro usuário e teste de IDOR.                                                                                                   |
| BLG-0903 | DONE    | `DELETE /sessions`, preservando a sessão que fez a chamada.                                                                                                                              |
| BLG-0904 | DONE    | Casca do W24 e aba Sessões, com o W25 em `<dialog>` nativo. `SessionView` passou para `@crypta/contracts`.                                                                               |

### Trabalho da fase fora das branches planejadas

As branches previstas cobriam criptografia, schema, setup, autenticação, ciclo de sessão e as telas W01 e W02. Dois itens da fase ficavam de fora, e foram registrados aqui em vez de aparecerem como surpresa no fechamento. **Os dois foram recuperados**, em branches empilhadas sobre `develop`:

- **`BLG-0904` — interface de sessões na Web**, em `feature/web-sessions-ui`. Além da tela, é o que dá à Web a primeira consulta autenticada recorrente — sem ela não havia requisição que pudesse receber `401`, e a linha "ciclo de refresh no navegador" do gate não tinha como ser exercitada.
- **`BLG-0807` — alteração de senha**, em `feature/change-password`. Recriptografa a chave privada com uma `UserEncryptionKey` nova, substitui o `AuthSecret` e revoga as demais sessões, tudo em transação.

Nenhum escopo da fase precisou ser reduzido.

### Pendências que atravessam a fase

- **`PEND-003`, biblioteca libsodium no Android.** Os vetores desta fase nascem exercitados só na Web. A compatibilidade com o Android é garantida por construção — parâmetros e algoritmos fixados nos ADRs 0016 e 0017 — e só será **medida** na R0.7. Um vetor que roda em uma plataforma só prova metade do que `SECURITY.md` secao 22 exige.
- **Parâmetros do Argon2id.** O [ADR 0018](decisions/0018-argon2id-parameters.md) declara os valores provisórios até a medição em Android. Cada usuário guarda os próprios parâmetros na sua linha, então recalibrar depois não invalida conta nenhuma — foi exatamente para isso que eles ficaram por usuário.
- ~~**Check obrigatório novo.**~~ Resolvida em 8 de agosto de 2026: o check "Testes de integração com MySQL" foi registrado nos rulesets (`GITHUB_RELEASE_FLOW.md` secoes 17 e 18) e agora bloqueia merge.

---

## 8. Estado da R0.3

> Aberta em 11 de agosto de 2026.

A R0.3 entrega o primeiro conteúdo que o usuário cria: um cofre privado, cujo nome o servidor não pode conhecer. É onde o material criptográfico fechado na R0.2 passa a proteger dado real.

Esta secao é o **gate único** da fase, no mesmo regime da secao 7: cada linha nasce `PENDENTE` e só vira `OK` acompanhada da evidência que a comprova, no pull request que a produziu. A tabela é escrita **antes** do código, não no fechamento — foi ter o critério verificável definido desde o começo que fez a R0.2 fechar sem discussão.

### Gate de saída da R0.3

Conforme `ROADMAP.md` secao 21. Os seis primeiros itens vêm de lá. O sétimo vem do [ADR 0020](decisions/0020-deletion-policy.md), cuja decisão de exclusão física só se sustenta se a auditoria sobreviver à entidade — é a razão de o `AuditLog` ter sido puxado para o `BLG-0503`.

| Item do gate                   | Critério verificável                                                                                                                                                                                                                                       | Estado   |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| API não conhece nome do cofre  | Nenhuma coluna de `vaults` guarda texto claro. O DTO de `POST /vaults` e de `PATCH /vaults/:vaultId` aceita apenas `encryptedMetadata`, e `forbidNonWhitelisted` responde `400` a um campo `name`. e2e confere que nenhuma resposta de cofre carrega nome. | PENDENTE |
| OWNER único                    | Constraint no banco recusa um segundo `OWNER` no mesmo cofre — teste de integração tenta inserir e recebe erro do MySQL, não da aplicação. A criação sempre grava o criador como `OWNER`.                                                                  | PENDENTE |
| Acesso cruzado negado          | As cinco rotas de cofre exercitadas com cofre de outro usuário devolvem `404`, nunca `403`: a existência do recurso não vaza. Inclui membership ausente e ID cruzado entre dois cofres do mesmo chamador.                                                  | PENDENTE |
| Version conflict testado       | `PATCH` e `DELETE` com `expectedVersion` defasado devolvem `409 VERSION_CONFLICT` **sem gravar**. Duas escritas concorrentes partindo da mesma versão: uma vence, a outra recebe o conflito.                                                               | PENDENTE |
| Snapshot protegido             | `GET /vaults/:vaultId/snapshot` exige membro ativo; não-membro recebe `404`. O envelope devolvido é o do chamador e de nenhum outro membro.                                                                                                                | PENDENTE |
| Logs sanitizados               | `LogFields` continua sem campo livre. Nenhuma chamada de log recebe `encryptedMetadata`, envelope ou ciphertext, e o e2e confere que o log de criação de cofre carrega apenas identificadores.                                                             | PENDENTE |
| Auditoria sobrevive à exclusão | Excluir um cofre remove a linha de `vaults` e mantém o registro em `audit_logs`, que não tem chave estrangeira para ela. Teste de integração confere as duas metades: a entidade some, o registro fica.                                                    | PENDENTE |

### Decisões fechadas antes do código

| Decisão                                                 | Onde                                               |
| ------------------------------------------------------- | -------------------------------------------------- |
| `AuditLog` sai do `BLG-0506` e entra no `BLG-0503`      | `BLG-0503`, com a justificativa                    |
| `BLG-1005` deixa de pedir soft delete e purge           | `BLG-1005`, pela hierarquia da `CLAUDE.md` secao 2 |
| Envelope de chave corrigido nas rotas que o transportam | `API.md` secoes 34, 38, 48 e 68                    |

### Tarefas da R0.3

| Item     | Status | Observação                                                                                                                  |
| -------- | ------ | --------------------------------------------------------------------------------------------------------------------------- |
| BLG-0503 | DONE   | Migration `20260811203308_vaults`, testada em banco vazio e em banco com dados. Um dono por cofre virou restrição de banco. |
| BLG-0705 | DONE   | `createVaultKey`, `createVaultKeyEnvelope` e `openVaultKeyEnvelope`. O mesmo caminho serve OWNER e EDITOR.                  |
| BLG-0706 | DONE   | Metadata do cofre cifrada com AAD amarrada ao id. Site e credential entram na R0.4.                                         |
| BLG-1001 | DONE   | W06, `POST /vaults` em transação, com idempotência e auditoria. O id vem do cliente (ADR 0025).                             |
| BLG-1002 | DONE   | `GET /vaults` e W05, com decifragem no cliente. A listagem passou a devolver o envelope do chamador.                        |
| BLG-1003 | DONE   | `GET /vaults/:vaultId`, com `404` indistinguível para cofre alheio e inexistente.                                           |
| BLG-1004 | DONE   | W07 e `PATCH /vaults/:vaultId`, OWNER only, com `expectedVersion` no `WHERE`.                                               |
| BLG-1005 | DONE   | W08 e `DELETE /vaults/:vaultId`, exclusão física com auditoria preservada.                                                  |
| BLG-1006 | DONE   | `GET /vaults/:vaultId/snapshot`, só com o envelope do chamador. `sites` e `credentials` vazios até a R0.4.                  |

### Limites conhecidos da fase

- **O snapshot nasce parcial.** `BLG-1006` prevê sites e credenciais, que só existem na R0.4. Na R0.3 o endpoint responde com as listas vazias — e isso é entrega, não pendência: o cursor e os limites precisam existir antes de haver conteúdo para paginar.
- **`EDITOR` fica declarado e não exercitado.** O papel existe no schema desde o `BLG-0503`, mas convite, membership e envelope por membro são da R0.5. A linha "acesso cruzado negado" do gate cobre não-membro, não o `EDITOR`.
- **`MAX_VAULTS_PER_USER=100`** é o valor sugerido em `API.md` secao 74 e sustenta o `VAULT_LIMIT_REACHED`. Continua sugerido até a configuração por ambiente.

---

# ÉPICO 00 — GOVERNANÇA DO PROJETO

---

## BLG-0001 — Criar repositório público

- **Tipo:** TECH
- **Prioridade:** P1
- **Estimativa:** XS
- **Dependências:** nenhuma

### Tarefas

- [ ] Criar repositório no GitHub.
- [x] Definir licença inicial ou registrar a decisão pendente. — `AGPL-3.0-only`, ADR 0013.
- [ ] Adicionar descrição do projeto.
- [ ] Configurar visibilidade pública.
- [ ] Revisar o conteúdo antes do primeiro push.
- [ ] Confirmar ausência de secrets, dumps, backups e dados reais.

### Critérios de aceite

- Repositório acessível publicamente.
- Nenhum segredo presente.
- Licença definida ou decisão documentada.

---

## BLG-0002 — Configurar arquivos básicos do repositório

- **Tipo:** TECH
- **Prioridade:** P1
- **Estimativa:** S
- **Dependências:** BLG-0001

### Tarefas

- [ ] Criar `.gitignore`.
- [ ] Criar `.editorconfig`.
- [ ] Criar `.env.example`.
- [x] Criar `LICENSE` quando a decisão estiver fechada. — texto literal da FSF.
- [ ] Criar `README.md`.
- [ ] Criar `CONTRIBUTING.md`.
- [ ] Criar `CLAUDE.md`.
- [ ] Criar `GITHUB_RELEASE_FLOW.md`.
- [ ] Criar `config_user.md`.
- [ ] Adicionar documentos existentes.
- [ ] Criar pasta `docs/decisions`.
- [ ] Criar arquivo `VERSION` com versão inicial válida.

### Critérios de aceite

- Arquivos básicos presentes.
- `.env` real ignorado.
- Chaves, certificados, APK signing keys e dumps ignorados.
- Documentação navegável.
- `VERSION` contém somente `MAJOR.MINOR.PATCH`.

---

## BLG-0003 — Executar configuração manual inicial do GitHub

- **Tipo:** INFRA
- **Prioridade:** P1
- **Estimativa:** M
- **Dependências:** BLG-0001, BLG-0002
- **Responsável:** Proprietário do repositório
- **Referência:** `config_user.md`

### Tarefas

- [ ] Criar branches permanentes `develop`, `staging` e `main`.
- [ ] Definir `develop` como branch padrão.
- [ ] Habilitar Squash and merge.
- [ ] Habilitar Create a merge commit.
- [ ] Desabilitar rebase merge inicialmente.
- [ ] Desabilitar exclusão automática nativa de branches.
- [ ] Configurar permissões do GitHub Actions.
- [ ] Permitir que Actions criem pull requests.
- [ ] Criar repository variables `WEB_IMAGE` e `API_IMAGE`.
- [ ] Criar Environments `development`, `staging` e `production`.
- [ ] Criar labels de release notes.
- [ ] Criar milestone da primeira versão.
- [ ] Ativar Dependabot alerts.
- [ ] Ativar secret scanning e push protection quando disponíveis.
- [ ] Habilitar reporte privado de vulnerabilidades quando disponível.

### Critérios de aceite

- Branches permanentes existem.
- `develop` é a branch padrão.
- Estratégias de merge estão alinhadas ao fluxo.
- Environments existem, ainda que os secrets do Coolify sejam adicionados depois.
- Labels e milestone inicial existem.
- Configurações executadas estão marcadas em `config_user.md`.

---

## BLG-0004 — Configurar rulesets e proteção do repositório

- **Tipo:** SEC
- **Prioridade:** P1
- **Estimativa:** M
- **Dependências:** BLG-0003, BLG-0201, BLG-0205

### Tarefas

- [ ] Executar os workflows pelo menos uma vez para registrar os checks.
- [ ] Criar ruleset para `develop`, `staging` e `main`.
- [ ] Criar ruleset para `release/*`.
- [ ] Criar ruleset para tags `v*`.
- [ ] Exigir pull request.
- [ ] Exigir checks obrigatórios.
- [ ] Exigir resolução das conversas.
- [ ] Bloquear force push.
- [ ] Restringir exclusão.
- [ ] Não exigir histórico linear.
- [ ] Configurar aprovações de acordo com a quantidade real de revisores.
- [ ] Testar criação de tag pela automação.
- [ ] Testar bloqueio de alteração ou exclusão de tag publicada.

### Critérios de aceite

- PR inválido não pode ser integrado.
- CI falhando bloqueia merge.
- Branch permanente não pode ser excluída ou receber force push.
- `release/*` permanece protegida durante homologação.
- Tags publicadas são tratadas como imutáveis.
- Rulesets não bloqueiam a automação legítima de release.

---

## BLG-0005 — Definir ADRs iniciais

- **Tipo:** ADR
- **Prioridade:** P1
- **Estimativa:** M

### Tarefas

- [ ] ADR 0001 — Monorepo.
- [ ] ADR 0002 — Monólito modular.
- [ ] ADR 0003 — Criptografia no cliente.
- [ ] ADR 0004 — Separação AuthSecret/UserEncryptionKey.
- [ ] ADR 0005 — Envelopes por membro.
- [ ] ADR 0006 — CSV processado no cliente.
- [ ] ADR 0007 — API REST.
- [ ] ADR 0008 — MySQL + Prisma.
- [ ] ADR 0009 — Deploy no Coolify.
- [ ] ADR 0010 — Sessões e refresh rotation.
- [ ] ADR — Fluxo GitHub com `develop`, `staging`, `main` e `release/*`.
- [ ] ADR — Build único e promoção do mesmo artefato por digest.

### Critérios de aceite

- Cada ADR contém contexto, decisão, alternativas e consequências.
- ADRs estão linkados no README, em `DECISIONS.md` e na arquitetura.

---

# ÉPICO 01 — MONOREPO E FUNDAÇÃO

---

## BLG-0101 — Criar monorepo com pnpm workspaces

- **Tipo:** TECH
- **Prioridade:** P1
- **Estimativa:** M

### Tarefas

- [ ] Criar `pnpm-workspace.yaml`.
- [ ] Criar `apps/web`.
- [ ] Criar `apps/api`.
- [ ] Criar `apps/mobile`.
- [ ] Criar `packages/contracts`.
- [ ] Criar `packages/crypto-core`.
- [ ] Criar `packages/crypto-web`.
- [ ] Criar `packages/crypto-mobile`.
- [ ] Criar `packages/validation`.
- [ ] Criar `packages/eslint-config`.
- [ ] Criar `packages/tsconfig`.

### Critérios de aceite

- `pnpm install` funciona na raiz.
- Workspaces resolvem dependências internas.
- Builds podem ser executados separadamente.

---

## BLG-0102 — Configurar TypeScript strict

- **Tipo:** TECH
- **Prioridade:** P1
- **Estimativa:** S

### Tarefas

- [ ] Criar tsconfig base.
- [ ] Habilitar strict.
- [ ] Habilitar `noUncheckedIndexedAccess`.
- [ ] Habilitar `exactOptionalPropertyTypes`.
- [ ] Criar tsconfig por app.
- [ ] Configurar aliases.

### Critérios de aceite

- Typecheck passa em todos os workspaces.
- Nenhum `any` não justificado.

---

## BLG-0103 — Configurar ESLint e Prettier

- **Tipo:** TECH
- **Prioridade:** P1
- **Estimativa:** S

### Tarefas

- [ ] Configurar ESLint compartilhado.
- [ ] Configurar regras para React.
- [ ] Configurar regras para NestJS.
- [ ] Configurar regras de TypeScript.
- [ ] Configurar Prettier.
- [ ] Criar scripts `lint` e `format:check`.
- [ ] Integrar ao CI.

---

## BLG-0104 — Configurar testes por workspace

- **Tipo:** TEST
- **Prioridade:** P1
- **Estimativa:** M

### Tarefas

- [ ] Vitest na Web.
- [ ] React Testing Library.
- [ ] Jest na API.
- [ ] Supertest.
- [ ] Configuração de testes dos packages.
- [ ] Estratégia de testes Mobile.
- [ ] Coverage reports.
- [ ] Scripts de teste na raiz.

---

## BLG-0105 — Configurar hooks locais opcionais

- **Tipo:** TECH
- **Prioridade:** P2
- **Estimativa:** S

### Tarefas

- [ ] Avaliar Husky ou alternativa.
- [ ] Configurar lint-staged.
- [ ] Não bloquear contribuições por configuração frágil.
- [ ] Documentar bypass emergencial.

---

# ÉPICO 02 — CI/CD

---

## BLG-0201 — Criar pipeline de validação

- **Tipo:** INFRA
- **Prioridade:** P1
- **Estimativa:** M

### Tarefas

- [ ] Checkout.
- [ ] Configurar Node e pnpm.
- [ ] Instalação imutável.
- [ ] Lint.
- [ ] Format check.
- [ ] Typecheck.
- [ ] Testes unitários.
- [ ] Testes de integração.
- [ ] Build Web.
- [ ] Build API.
- [ ] Build packages.
- [ ] Cache seguro.

### Critérios de aceite

- Pipeline roda em PR.
- Falha impede merge.
- Logs não contêm segredos.

---

## BLG-0202 — Adicionar auditoria de dependências

- **Tipo:** SEC
- **Prioridade:** P1
- **Estimativa:** S

### Tarefas

- [ ] `pnpm audit` ou ferramenta definida.
- [ ] Dependabot.
- [ ] Política de severidade.
- [ ] Procedimento de exceção.
- [ ] Revisão manual de dependências criptográficas.

---

## BLG-0203 — Adicionar secret scanning

- **Tipo:** SEC
- **Prioridade:** P1
- **Estimativa:** S

### Tarefas

- [ ] GitHub secret scanning.
- [ ] Scanner adicional no CI, se necessário.
- [ ] Testar detecção com segredo fictício.
- [ ] Documentar rotação.

---

## BLG-0204 — Container scan

- **Tipo:** SEC
- **Prioridade:** P2
- **Estimativa:** M

### Tarefas

- [ ] Selecionar scanner.
- [ ] Escanear imagem Web.
- [ ] Escanear imagem API.
- [ ] Definir severidade bloqueadora.
- [ ] Documentar exceções.

---

## BLG-0205 — Validar fluxo de branches nos pull requests

- **Tipo:** INFRA
- **Prioridade:** P1
- **Estimativa:** M
- **Dependências:** BLG-0201
- **Referência:** `GITHUB_RELEASE_FLOW.md`

### Tarefas

- [ ] Criar `.github/workflows/validate-pr-flow.yml`.
- [ ] Permitir branches temporárias para `develop`.
- [ ] Permitir `fix/* → release/*`.
- [ ] Permitir `release/* → staging`.
- [ ] Permitir `staging → main`.
- [ ] Permitir `main → develop`.
- [ ] Permitir `hotfix/* → main`.
- [ ] Permitir `main → release/*` somente para sincronização de hotfix.
- [ ] Rejeitar combinações não documentadas.
- [ ] Criar testes manuais de PR válido e inválido.

### Critérios de aceite

- O check `Validar origem e destino` aparece no GitHub.
- Um PR inválido falha de forma clara.
- O check pode ser exigido pelos rulesets.

---

## BLG-0206 — Excluir somente branches temporárias

- **Tipo:** INFRA
- **Prioridade:** P1
- **Estimativa:** S
- **Dependências:** BLG-0205

### Tarefas

- [ ] Criar `.github/workflows/cleanup-temporary-branches.yml`.
- [ ] Excluir `feature/*` após merge.
- [ ] Excluir `bugfix/*` após merge.
- [ ] Excluir `fix/*` após merge.
- [ ] Excluir `chore/*`, `refactor/*`, `docs/*` e `security/*` após merge.
- [ ] Excluir `hotfix/*` após merge.
- [ ] Nunca excluir `develop`, `staging`, `main` ou `release/*`.
- [ ] Manter auto-delete nativo desabilitado.

---

## BLG-0207 — Automatizar início de release

- **Tipo:** INFRA
- **Prioridade:** P1
- **Estimativa:** M
- **Dependências:** BLG-0003, BLG-0201, BLG-0205

### Tarefas

- [ ] Criar `.github/workflows/start-release.yml`.
- [ ] Receber versão por `workflow_dispatch`.
- [ ] Validar Semantic Versioning.
- [ ] Criar `release/x.y.z` a partir de `develop`.
- [ ] Atualizar `VERSION`.
- [ ] Impedir branch ou tag duplicada.
- [ ] Abrir PR `release/x.y.z → staging`.
- [ ] Aplicar label `release`.
- [ ] Associar milestone quando existente.

### Critérios de aceite

- Uma release pode ser iniciada pela interface Actions.
- O arquivo `VERSION` é atualizado corretamente.
- A branch de release não é apagada após a primeira promoção.

---

## BLG-0208 — Automatizar release candidate e GitHub Pre-release

- **Tipo:** INFRA
- **Prioridade:** P1
- **Estimativa:** L
- **Dependências:** BLG-0201, BLG-0207, BLG-0601, BLG-0602, BLG-0605

### Tarefas

- [ ] Criar `.github/workflows/publish-prerelease.yml`.
- [ ] Disparar somente após merge `release/* → staging`.
- [ ] Calcular `vX.Y.Z-rc.N`.
- [ ] Executar validações completas.
- [ ] Construir Web e API uma única vez.
- [ ] Publicar imagens imutáveis no GHCR.
- [ ] Atualizar tags móveis `staging`.
- [ ] Gerar `release-manifest.json` com digests.
- [ ] Criar tag anotada RC.
- [ ] Criar GitHub Pre-release.
- [ ] Anexar manifesto.
- [ ] Implantar no Environment `staging`.
- [ ] Registrar deployment e URL.

### Critérios de aceite

- Cada nova promoção gera RC incremental.
- A RC possui manifesto com commit e digests.
- Staging executa exatamente as imagens da RC.

---

## BLG-0209 — Automatizar release estável e produção

- **Tipo:** INFRA
- **Prioridade:** P1
- **Estimativa:** L
- **Dependências:** BLG-0208, BLG-0606

### Tarefas

- [ ] Criar `.github/workflows/publish-production.yml`.
- [ ] Aceitar apenas `staging → main` e `hotfix/* → main`.
- [ ] Em release normal, recuperar o manifesto da RC aprovada.
- [ ] Promover os mesmos digests para tag estável e `production`.
- [ ] Não reconstruir release normal.
- [ ] Criar tag estável.
- [ ] Criar GitHub Release.
- [ ] Implantar no Environment `production`.
- [ ] Abrir PR `main → develop`.
- [ ] Informar sincronização com release ativa em caso de hotfix.
- [ ] Registrar rollback por tag e digest.

### Critérios de aceite

- Produção utiliza o mesmo digest homologado.
- Tag estável e GitHub Release são criadas.
- A sincronização `main → develop` é obrigatória.

---

## BLG-0210 — Configurar release notes por categoria

- **Tipo:** DOC
- **Prioridade:** P1
- **Estimativa:** S
- **Dependências:** BLG-0003

### Tarefas

- [ ] Criar `.github/release.yml`.
- [ ] Mapear labels de feature, bug, fix, security, performance, dependencies e documentation.
- [ ] Excluir `skip-changelog`.
- [ ] Testar geração automática de notas.

---

## BLG-0211 — Expor versão e commit da aplicação

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** M
- **Dependências:** BLG-0401, BLG-0601, BLG-0602

### Tarefas

- [ ] Adicionar build args `APP_VERSION`, `APP_COMMIT`, `APP_ENVIRONMENT` e `APP_BUILT_AT`.
- [ ] Criar `GET /api/v1/version`.
- [ ] Exibir versão em diagnóstico ou rodapé técnico da Web.
- [ ] Adicionar versão ao Android quando o app existir.
- [ ] Testar informações em development, staging e production.

### Critérios de aceite

- É possível confirmar versão, commit e ambiente em execução.
- Nenhum dado sensível é retornado.

---

# ÉPICO 03 — WEB BASE

---

## BLG-0301 — Criar aplicação React + Vite

- **Tipo:** TECH
- **Prioridade:** P1
- **Estimativa:** S

### Tarefas

- [ ] React.
- [ ] Vite.
- [ ] TypeScript.
- [ ] React Router.
- [ ] Estrutura por feature.
- [ ] Página inicial temporária.

---

## BLG-0302 — Configurar Tailwind e shadcn/ui

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** M

### Tarefas

- [ ] Tailwind.
- [ ] Tokens.
- [ ] Tema claro.
- [ ] Tema escuro.
- [ ] Botão.
- [ ] Input.
- [ ] Dialog.
- [ ] Toast.
- [ ] Dropdown.
- [ ] Skeleton.
- [ ] Form components.

---

## BLG-0303 — Configurar providers

- **Tipo:** TECH
- **Prioridade:** P1
- **Estimativa:** S

### Tarefas

- [ ] QueryClient.
- [ ] Router.
- [ ] Toast provider.
- [ ] Error boundary.
- [ ] Theme provider.
- [ ] Session provider.

---

## BLG-0304 — Criar API client

- **Tipo:** TECH
- **Prioridade:** P1
- **Estimativa:** M

### Tarefas

- [ ] Axios instance.
- [ ] Base URL por env.
- [ ] Request ID.
- [ ] Client type/version.
- [ ] Access token em memória.
- [ ] Normalização de erros.
- [ ] Refresh controlado.
- [ ] Proteção contra refresh concorrente.
- [ ] Limpeza no logout.

---

## BLG-0305 — Criar layout autenticado

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** M

### Tarefas

- [ ] Sidebar.
- [ ] Topbar.
- [ ] Menu de perfil.
- [ ] Responsividade.
- [ ] Drawer mobile Web.
- [ ] Rotas protegidas.
- [ ] Estado de sessão expirada.

---

# ÉPICO 04 — API BASE

---

## BLG-0401 — Criar aplicação NestJS

- **Tipo:** TECH
- **Prioridade:** P1
- **Estimativa:** S

### Tarefas

- [ ] NestJS.
- [ ] Estrutura modular.
- [ ] Config module.
- [ ] Validation pipe.
- [ ] Exception filter.
- [ ] Request ID.
- [ ] Logger estruturado.
- [ ] Prefixo `/api/v1`.

---

## BLG-0402 — Configurar Swagger

- **Tipo:** DOC
- **Prioridade:** P1
- **Estimativa:** S

### Tarefas

- [ ] Swagger.
- [ ] Auth scheme.
- [ ] DTO examples fictícios.
- [ ] Códigos de erro.
- [ ] Endpoint protegido por ambiente.
- [ ] Exportar OpenAPI.

---

## BLG-0403 — Configurar headers e CORS

- **Tipo:** SEC
- **Prioridade:** P1
- **Estimativa:** M

### Tarefas

- [ ] Helmet.
- [ ] CORS restrito.
- [ ] HSTS.
- [ ] Content type protection.
- [ ] Referrer policy.
- [ ] Body limit.
- [ ] Origin validation.
- [ ] CSRF assessment.

---

## BLG-0404 — Configurar erros padronizados

- **Tipo:** TECH
- **Prioridade:** P1
- **Estimativa:** M

### Tarefas

- [ ] Base application error.
- [ ] Error codes.
- [ ] Public messages.
- [ ] Request ID.
- [ ] Validation details.
- [ ] Redaction.
- [ ] Testes.

---

## BLG-0405 — Configurar logging seguro

- **Tipo:** SEC
- **Prioridade:** P1
- **Estimativa:** M

### Tarefas

- [ ] JSON logs.
- [ ] Redaction de headers.
- [ ] Redaction de campos.
- [ ] Proibir body completo.
- [ ] Auditoria separada.
- [ ] Testar ausência de segredo.

---

# ÉPICO 05 — BANCO E PRISMA

---

## BLG-0501 — Configurar Prisma e MySQL

- **Tipo:** TECH
- **Prioridade:** P1
- **Estimativa:** M

### Tarefas

- [ ] Instalar Prisma.
- [ ] Criar schema.
- [ ] Configurar `DATABASE_URL`.
- [ ] Criar PrismaService.
- [ ] Health query.
- [ ] Documentar setup local.
- [ ] Configurar MySQL de testes.

---

## BLG-0502 — Migration de identidade

- **Tipo:** TECH
- **Prioridade:** P1
- **Estimativa:** M

### Entidades

- [ ] User.
- [ ] UserKeyBundle.
- [ ] Session.

### Critérios de aceite

- Unique de e-mail.
- Bundle 1:1.
- Sessões revogáveis.
- Índices documentados.

---

## BLG-0503 — Migration de cofres

- **Tipo:** TECH
- **Prioridade:** P1
- **Estimativa:** M

### Entidades

- [ ] Vault.
- [ ] VaultMember.
- [ ] VaultKeyEnvelope.
- [ ] AuditLog. — Puxado do `BLG-0506` em 11 de agosto de 2026.

### Por que o `AuditLog` entra aqui

`ROADMAP.md` secao 19 lista auditoria entre as entregas da R0.3, e o `BLG-1001` a exige já na criação do cofre. A tabela estava no `BLG-0506`, junto de `ImportJob` e `ImportVaultBatch`, que são da R0.6.

Deixá-la lá obrigaria a R0.3 a gravar cofre sem trilha e a acrescentar a trilha depois, sobre dado existente. O [ADR 0020](decisions/0020-deletion-policy.md) fez a exclusão ser física justamente contando com uma auditoria que sobrevive à entidade: sem a tabela, excluir um cofre não deixa registro nenhum.

O `BLG-0506` permanece, com as duas entidades de importação.

---

## BLG-0504 — Migration de conteúdo

- **Tipo:** TECH
- **Prioridade:** P1
- **Estimativa:** M

### Entidades

- [ ] Site.
- [ ] Credential.
- [ ] Versionamento.
- [ ] Exclusão física, sem `deleted_at`. — Corrigido em 11 de agosto de 2026; dizia "soft delete técnico", contra o [ADR 0020](decisions/0020-deletion-policy.md).

---

## BLG-0505 — Migration de compartilhamento

- **Tipo:** TECH
- **Prioridade:** P1
- **Estimativa:** M

### Entidades

- [ ] Invitation.
- [ ] VaultRekey.

---

## BLG-0506 — Migration operacional

- **Tipo:** TECH
- **Prioridade:** P1
- **Estimativa:** M

### Entidades

- [ ] ImportJob.
- [ ] ImportVaultBatch.
- ~~AuditLog.~~ — Passou para o `BLG-0503` em 11 de agosto de 2026, porque a R0.3 já grava auditoria.

---

## BLG-0507 — Seed fictício

- **Tipo:** TECH
- **Prioridade:** P2
- **Estimativa:** S

### Tarefas

- [ ] Usuários `example.test`.
- [ ] Ciphertexts fictícios.
- [ ] Nenhum segredo real.
- [ ] Seed idempotente.

---

# ÉPICO 06 — DOCKER E COOLIFY

---

## BLG-0601 — Dockerfile Web

- **Tipo:** INFRA
- **Prioridade:** P1
- **Estimativa:** M

### Tarefas

- [ ] Multi-stage.
- [ ] Build Vite.
- [ ] Nginx.
- [ ] SPA fallback.
- [ ] Usuário não-root quando viável.
- [ ] `.dockerignore`.
- [ ] Health endpoint.
- [ ] Headers.

---

## BLG-0602 — Dockerfile API

- **Tipo:** INFRA
- **Prioridade:** P1
- **Estimativa:** M

### Tarefas

- [ ] Multi-stage.
- [ ] Build NestJS.
- [ ] Prisma generate.
- [ ] Dependências de produção.
- [ ] Usuário não-root.
- [ ] Health check.
- [ ] `.dockerignore`.
- [ ] Startup seguro.

---

## BLG-0603 — Criar ambientes separados no Coolify

- **Tipo:** INFRA
- **Prioridade:** P1
- **Estimativa:** L
- **Dependências:** BLG-0003, BLG-0601, BLG-0602
- **Responsável:** Proprietário da infraestrutura
- **Referência:** `config_user.md`

### Projetos

- [ ] `crypta-development`.
- [ ] `crypta-staging`.
- [ ] `crypta-production`.

### Recursos por projeto

- [ ] Web.
- [ ] API.
- [ ] MySQL.

### Critérios de aceite

- Os três ambientes são independentes.
- Cada ambiente possui banco próprio.
- Bancos não possuem porta pública.
- Variáveis e secrets não são compartilhados indevidamente.
- Domínios e HTTPS estão definidos.

---

## BLG-0604 — Primeiro deploy antecipado em development

- **Tipo:** INFRA
- **Prioridade:** P1
- **Estimativa:** M
- **Dependências:** BLG-0301, BLG-0401, BLG-0501, BLG-0601, BLG-0602, BLG-0603

### Tarefas

- [ ] Tela Web de status.
- [ ] Endpoint `/health/ready`.
- [ ] Endpoint `/version` ou estrutura inicial equivalente.
- [ ] Verificação MySQL.
- [ ] HTTPS.
- [ ] CORS.
- [ ] Logs.
- [ ] Rede.
- [ ] Deploy automático de `develop`.
- [ ] Registro no GitHub Environment `development`.

### Critérios de aceite

- Web consulta API.
- API consulta banco.
- Fluxo funciona no Coolify.
- Development não interfere em staging.
- Nenhum Docker Compose utilizado no deploy.

---

## BLG-0605 — Configurar GHCR e recursos baseados em imagem

- **Tipo:** INFRA
- **Prioridade:** P1
- **Estimativa:** M
- **Dependências:** BLG-0003, BLG-0603

### Tarefas

- [ ] Publicar package Web no GHCR.
- [ ] Publicar package API no GHCR.
- [ ] Revisar visibilidade dos packages.
- [ ] Garantir ausência de secrets nas imagens.
- [ ] Configurar Coolify para tags `development`, `staging` e `production`.
- [ ] Configurar autenticação de leitura caso os packages sejam privados.
- [ ] Desabilitar deploy duplicado por integração Git quando Actions controlar o deploy.
- [ ] Copiar deploy webhooks Web/API por ambiente.
- [ ] Adicionar `COOLIFY_TOKEN`, `COOLIFY_WEBHOOK_WEB` e `COOLIFY_WEBHOOK_API` aos Environments.

### Critérios de aceite

- Coolify consegue baixar Web e API do GHCR.
- Cada ambiente acompanha somente sua tag móvel.
- Webhooks e token não aparecem no repositório ou em logs.

---

## BLG-0606 — Validar homologação por release candidate

- **Tipo:** TEST
- **Prioridade:** P1
- **Estimativa:** M
- **Dependências:** BLG-0208, BLG-0605

### Tarefas

- [ ] Criar release fictícia controlada.
- [ ] Gerar `vX.Y.Z-rc.1`.
- [ ] Confirmar GitHub Pre-release.
- [ ] Confirmar manifesto.
- [ ] Confirmar digests no GHCR.
- [ ] Confirmar deploy staging.
- [ ] Confirmar endpoint `/version`.
- [ ] Criar correção `fix/*`.
- [ ] Gerar `rc.2`.
- [ ] Confirmar que `release/*` permanece existente.

---

## BLG-0607 — Validar promoção do mesmo artefato para produção

- **Tipo:** TEST
- **Prioridade:** P0
- **Estimativa:** L
- **Dependências:** BLG-0209, BLG-0606

### Tarefas

- [ ] Promover `staging → main` em ambiente controlado.
- [ ] Confirmar tag estável.
- [ ] Confirmar GitHub Release.
- [ ] Comparar digests da RC e produção.
- [ ] Confirmar deploy production.
- [ ] Confirmar PR `main → develop`.
- [ ] Testar rollback por tag/digest.
- [ ] Documentar resultado.

### Critérios de aceite

- Produção usa exatamente os digests homologados.
- Rollback não exige reconstrução.
- Sincronização de produção volta para desenvolvimento.

---

# ÉPICO 07 — CRIPTOGRAFIA

---

## BLG-0701 — Selecionar bibliotecas criptográficas

- **Tipo:** RESEARCH
- **Prioridade:** P0
- **Estimativa:** M

### Tarefas

- [x] Avaliar Argon2id Web. — ADR 0016, com medição das três candidatas.
- [x] Avaliar libsodium Web. — ADR 0017.
- [ ] Avaliar libsodium React Native. — PEND-003, R0.7.
- [ ] Avaliar Android Keystore.
- [x] Verificar manutenção.
- [x] Verificar licença. — ISC e MIT, compatíveis com AGPL-3.0-only.
- [x] Criar ADR. — 0016, 0017 e 0018.

### Critérios de aceite

- Bibliotecas compatíveis entre Web e Android.
- Vetores possíveis.
- Sem crypto customizada.

---

## BLG-0702 — Implementar crypto-core

- **Tipo:** SEC
- **Prioridade:** P0
- **Estimativa:** L

### Tarefas

- [ ] Tipos.
- [ ] Payload versionado.
- [ ] AAD.
- [ ] Serialização determinística.
- [ ] Envelopes.
- [ ] Erros.
- [ ] Testes.

---

## BLG-0703 — Implementar derivação de chaves

- **Tipo:** SEC
- **Prioridade:** P0
- **Estimativa:** L

### Tarefas

- [ ] Argon2id.
- [ ] RootKey.
- [ ] HKDF AuthSecret.
- [ ] HKDF UserEncryptionKey.
- [ ] Parâmetros KDF.
- [ ] Vetores.
- [ ] Benchmarks Web.
- [ ] Benchmarks Android.

---

## BLG-0704 — Implementar keypair do usuário

- **Tipo:** SEC
- **Prioridade:** P0
- **Estimativa:** L

### Tarefas

- [ ] X25519.
- [ ] Geração no cliente.
- [ ] Proteção da chave privada.
- [ ] Desbloqueio.
- [ ] Testes de adulteração.
- [ ] Compatibilidade.

---

## BLG-0705 — Implementar VaultKey e envelopes

- **Tipo:** SEC
- **Prioridade:** P0
- **Estimativa:** L

### Tarefas

- [ ] Geração de VaultKey.
- [ ] Envelope OWNER.
- [ ] Envelope EDITOR.
- [ ] Abertura.
- [ ] KeyVersion.
- [ ] Testes.

---

## BLG-0706 — Implementar criptografia de payloads

- **Tipo:** SEC
- **Prioridade:** P0
- **Estimativa:** L

### Tarefas

- [ ] Vault metadata.
- [ ] Site.
- [ ] Credential.
- [ ] XChaCha20-Poly1305.
- [ ] AAD.
- [ ] Falha fechada.
- [ ] Vetores.

---

## BLG-0707 — Revisão criptográfica interna

- **Tipo:** SEC
- **Prioridade:** P0
- **Estimativa:** M

### Tarefas

- [x] Revisar fluxos. — Setup, login, refresh, abertura do bundle e troca de senha.
- [x] Revisar nonce. — Uma origem só, sempre CSPRNG; o do envelope é derivado e não trafega.
- [x] Revisar AAD. — **Achado:** o escopo `vault` só tinha teste de serialização. Corrigido.
- [x] Revisar separação. — Os dois HKDF da `RootKey` e os dois do segredo do servidor.
- [x] Revisar logs. — `LogFields` fechado, nenhuma chamada com segredo, filtro sem stack.
- [x] Revisar storage. — **Achado:** o lint cobria 2 dos 5 meios proibidos. Corrigido.
- [x] Bloquear uso real até aprovação. — Liberado; limite registrado: vetores só medidos na Web.

---

# ÉPICO 08 — SETUP E AUTENTICAÇÃO

---

## BLG-0801 — Endpoint de setup status

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** S

---

## BLG-0802 — Setup do primeiro usuário

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** L

### Tarefas

- [ ] Tela W01.
- [ ] Derivação.
- [ ] Keypair.
- [ ] Endpoint.
- [ ] Transação.
- [ ] Sessão inicial.
- [ ] Rate limit.
- [ ] Testes.

---

## BLG-0803 — Endpoint de parâmetros KDF

- **Tipo:** SEC
- **Prioridade:** P1
- **Estimativa:** M

### Tarefas

- [ ] Conta existente.
- [ ] Parâmetros sintéticos.
- [ ] Resposta uniforme.
- [ ] Rate limit.
- [ ] Testes de enumeração.

---

## BLG-0804 — Login Web

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** L

### Tarefas

- [x] Tela W02.
- [x] Derivação no cliente.
- [x] AuthSecret.
- [x] Access token.
- [x] Refresh cookie.
- [x] Key bundle.
- [x] Desbloqueio.
- [x] Erros.
- [x] Sair da tela de login após o sucesso. — Faltava; era o defeito silencioso.
- [x] Testes. — Inclui o grafo de rotas montado, que é o que reprova sem a guarda.

---

## BLG-0805 — Refresh rotation

- **Tipo:** SEC
- **Prioridade:** P0
- **Estimativa:** L

### Tarefas

- [ ] Token opaco.
- [ ] Hash.
- [ ] Family ID.
- [ ] Rotação.
- [ ] Reuse detection.
- [ ] Revogação.
- [ ] Testes concorrentes.

---

## BLG-0806 — Logout e logout global

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** M

### Tarefas

- [ ] Logout atual.
- [ ] Limpar cliente.
- [ ] Outras sessões.
- [ ] Todas as sessões.
- [ ] Testes.

---

## BLG-0807 — Alteração de senha

- **Tipo:** SEC
- **Prioridade:** P1
- **Estimativa:** L

### Tarefas

- [x] Tela. — W24, aba Segurança.
- [x] Validar senha atual. — `currentAuthSecret`, antes de qualquer escrita.
- [x] Novo KDF salt. — `rotateKdfSalt`; a API recusa salt reaproveitado.
- [x] Novo AuthSecret. — Gravado sempre na versão corrente do segredo do servidor.
- [x] Recriptografar chave privada. — `resealUserKeyBundle`, preservando a chave pública.
- [x] Transação. — Credencial, bundle e revogação em uma só.
- [x] Revogar sessões. — Padrão `true`; a sessão que chamou sobrevive.
- [x] Testes. — 10 em `crypto-core`, 8 em `crypto-web`, 18 e2e, 21 na Web.

---

# ÉPICO 09 — SESSÕES

---

## BLG-0901 — Listar sessões

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** M

---

## BLG-0902 — Revogar sessão

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** M

---

## BLG-0903 — Revogar outras sessões

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** S

---

## BLG-0904 — Interface de sessões Web

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** M

### Tarefas

- [x] Casca do W24 com abas. — Só as abas entregues; Perfil e Segurança entram com as features.
- [x] Aba Sessões com dispositivo, navegador, sistema, IP, criação e último uso.
- [x] Marcar a sessão atual.
- [x] Modal W25 de confirmação, em `<dialog>` nativo.
- [x] Revogar sessão, encerrar outras e encerrar todas.
- [x] Desmontar o estado local ao derrubar a própria sessão.
- [x] Estados de carregando, erro e vazio distinguíveis.
- [x] Acessibilidade: tabela semântica, `aria-live`, nome acessível por linha.
- [x] Testes.

---

# ÉPICO 10 — COFRES

---

## BLG-1001 — Criar cofre

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** L

### Tarefas

- [ ] Modal W06.
- [ ] Gerar VaultKey.
- [ ] Criptografar metadata.
- [ ] Criar envelope OWNER.
- [ ] Endpoint.
- [ ] Transação.
- [ ] Auditoria.
- [ ] Testes.

---

## BLG-1002 — Listar cofres

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** M

### Tarefas

- [ ] Endpoint.
- [ ] Dashboard W05.
- [ ] Decrypt metadata.
- [ ] Filtros.
- [ ] Estado vazio.
- [ ] Testes.

---

## BLG-1003 — Visualizar cofre

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** M

---

## BLG-1004 — Editar cofre

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** M

### Tarefas

- [ ] OWNER only.
- [ ] Recriptografar metadata.
- [ ] expectedVersion.
- [ ] Teste de conflito.

---

## BLG-1005 — Excluir cofre

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** M

### Tarefas

- [ ] Modal destrutivo W08.
- [ ] OWNER only.
- [ ] Exclusão física do cofre e do que depende dele.
- [ ] Registro de auditoria que sobrevive à exclusão.
- [ ] Testes.

### Correção de 11 de agosto de 2026

As tarefas diziam "soft delete técnico" e "purge". O [ADR 0020](decisions/0020-deletion-policy.md), aceito em 7 de agosto, decidiu **exclusão física, sem `deleted_at` e sem filtro de exclusão em consulta** — e `DATABASE.md` secao 7 já refletia a decisão.

Pela hierarquia da `CLAUDE.md` secao 2, o ADR prevalece sobre o backlog. Implementar o item como estava escrito manteria `encryptedPayload` recuperável por uma consulta que esquecesse o filtro, que é exatamente a primeira restrição que o ADR fecha.

O que substitui o par soft delete/purge é a assimetria do ADR: a entidade some do banco, o `AuditLog` fica, sem chave estrangeira para ela.

---

## BLG-1006 — Snapshot do cofre

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** L

### Tarefas

- [ ] Endpoint.
- [ ] Envelope atual.
- [ ] Sites.
- [ ] Credentials.
- [ ] Members.
- [ ] Cursor.
- [ ] Limites.
- [ ] Testes.

---

# ÉPICO 11 — SITES

---

## BLG-1101 — Criar site

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** M

### Tarefas

- [ ] Modal W10.
- [ ] Nome obrigatório.
- [ ] Link opcional.
- [ ] Criptografia.
- [ ] Endpoint.
- [ ] Idempotência.
- [ ] Auditoria.
- [ ] Testes.

---

## BLG-1102 — Listar sites

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** M

---

## BLG-1103 — Visualizar site

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** M

---

## BLG-1104 — Editar site

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** M

---

## BLG-1105 — Excluir site

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** M

---

## BLG-1106 — Aviso de possível duplicidade

- **Tipo:** FEAT
- **Prioridade:** P2
- **Estimativa:** S

---

# ÉPICO 12 — CREDENCIAIS

---

## BLG-1201 — Criar credencial

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** L

### Tarefas

- [ ] Modal W14.
- [ ] Usuário.
- [ ] Senha.
- [ ] Observação.
- [ ] Criptografia.
- [ ] Endpoint.
- [ ] Idempotência.
- [ ] Testes.

---

## BLG-1202 — Listar credenciais

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** M

---

## BLG-1203 — Visualizar credencial

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** M

### Tarefas

- [ ] Modal W17.
- [ ] Senha mascarada.
- [ ] Revelar temporariamente.
- [ ] Observação.
- [ ] Última alteração.

---

## BLG-1204 — Copiar usuário

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** S

---

## BLG-1205 — Copiar senha

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** M

### Tarefas

- [ ] Copiar sem revelar.
- [ ] Toast sem valor.
- [ ] Limpeza de clipboard quando possível.
- [ ] Testes.

---

## BLG-1206 — Editar credencial

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** M

---

## BLG-1207 — Excluir credencial

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** M

---

## BLG-1208 — Gerador de senha

- **Tipo:** FEAT
- **Prioridade:** P2
- **Estimativa:** M

### Observação

Não é requisito essencial do escopo mínimo, mas é candidato forte à V1.1.

---

# ÉPICO 13 — BUSCA

---

## BLG-1301 — Busca local no cofre

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** M

### Tarefas

- [ ] Nome do site.
- [ ] Usuário.
- [ ] Debounce.
- [ ] Sem persistência do índice.
- [ ] Estado vazio.
- [ ] Testes.

---

## BLG-1302 — Busca global

- **Tipo:** FEAT
- **Prioridade:** P2
- **Estimativa:** L

### Dependências

- Estratégia de carregamento.
- Impacto de memória.
- Autolock.

---

# ÉPICO 14 — COMPARTILHAMENTO

---

## BLG-1401 — Criar convite

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** L

### Tarefas

- [ ] Modal W19.
- [ ] inviteToken.
- [ ] inviteSecret.
- [ ] Encrypt VaultKey.
- [ ] Endpoint.
- [ ] Link com fragmento.
- [ ] Expiração.
- [ ] Idempotência.
- [ ] Testes.

---

## BLG-1402 — Listar convites emitidos

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** M

---

## BLG-1403 — Cancelar convite

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** S

---

## BLG-1404 — Abrir convite

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** L

### Tarefas

- [ ] Ler token.
- [ ] Ler secret do fragmento.
- [ ] Remover fragmento da URL.
- [ ] Validar status.
- [ ] Estado expirado.
- [ ] Estado cancelado.

---

## BLG-1405 — Criar conta via convite

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** L

---

## BLG-1406 — Aceitar convite

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** L

### Tarefas

- [ ] Validar e-mail.
- [ ] Recuperar VaultKey.
- [ ] Criar envelope.
- [ ] Endpoint transacional.
- [ ] Membership.
- [ ] Auditoria.
- [ ] Testes.

---

## BLG-1407 — Recusar convite

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** S

---

## BLG-1408 — Sair do cofre

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** M

---

# ÉPICO 15 — REMOÇÃO E REKEY

---

## BLG-1501 — Iniciar remoção de membro

- **Tipo:** SEC
- **Prioridade:** P0
- **Estimativa:** L

### Tarefas

- [ ] OWNER only.
- [ ] Bloquear membership.
- [ ] Criar VaultRekey.
- [ ] Bloquear mutações.
- [ ] Auditoria.
- [ ] Testes.

---

## BLG-1502 — Snapshot de rekey

- **Tipo:** SEC
- **Prioridade:** P0
- **Estimativa:** L

---

## BLG-1503 — Recriptografar conteúdo

- **Tipo:** SEC
- **Prioridade:** P0
- **Estimativa:** XL

### Deve ser dividido em

- [ ] Vault metadata.
- [ ] Sites.
- [ ] Credentials.
- [ ] Novos envelopes.
- [ ] Progress UI.
- [ ] Tratamento de falha.

---

## BLG-1504 — Commit transacional de rekey

- **Tipo:** SEC
- **Prioridade:** P0
- **Estimativa:** L

---

## BLG-1505 — Cancelar ou recuperar rekey

- **Tipo:** SEC
- **Prioridade:** P1
- **Estimativa:** M

---

# ÉPICO 16 — IMPORTAÇÃO CSV WEB

---

## BLG-1601 — Definir parser e limites

- **Tipo:** RESEARCH
- **Prioridade:** P1
- **Estimativa:** M

### Tarefas

- [ ] Biblioteca.
- [ ] Licença.
- [ ] UTF-8.
- [ ] Delimitador.
- [ ] Aspas.
- [ ] Quebra de linha.
- [ ] Limite de bytes.
- [ ] Limite de linhas.
- [ ] ADR.

---

## BLG-1602 — Tela de seleção

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** M

---

## BLG-1603 — Arquivo modelo

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** S

### Colunas

```text
cofre,nome,usuario,senha,obs,link
```

---

## BLG-1604 — Parsing local

- **Tipo:** SEC
- **Prioridade:** P1
- **Estimativa:** L

### Tarefas

- [ ] Não enviar CSV.
- [ ] Sem logs.
- [ ] Tratar fórmulas como texto.
- [ ] Limites.
- [ ] Erros.
- [ ] Testes.

---

## BLG-1605 — Pré-visualização

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** L

---

## BLG-1606 — Mapear cofres

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** L

### Opções

- [ ] Criar cofre privado.
- [ ] Mapear existente.
- [ ] Ignorar.

---

## BLG-1607 — Detectar duplicidades

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** L

### Chave

```text
cofre + site normalizado + usuário normalizado
```

---

## BLG-1608 — Criptografar lote

- **Tipo:** SEC
- **Prioridade:** P1
- **Estimativa:** L

---

## BLG-1609 — Criar ImportJob

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** M

---

## BLG-1610 — Commit por cofre

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** L

### Tarefas

- [ ] Idempotência.
- [ ] Transação.
- [ ] Permissão.
- [ ] Contagens.
- [ ] Falha parcial por cofre.
- [ ] Testes.

---

## BLG-1611 — Relatório final

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** M

---

# ÉPICO 17 — AUDITORIA

---

## BLG-1701 — Serviço de auditoria

- **Tipo:** SEC
- **Prioridade:** P1
- **Estimativa:** M

---

## BLG-1702 — Eventos de autenticação

- **Tipo:** SEC
- **Prioridade:** P1
- **Estimativa:** S

---

## BLG-1703 — Eventos de cofre e conteúdo

- **Tipo:** SEC
- **Prioridade:** P1
- **Estimativa:** M

---

## BLG-1704 — Eventos de compartilhamento

- **Tipo:** SEC
- **Prioridade:** P1
- **Estimativa:** M

---

## BLG-1705 — Sanitização de metadata

- **Tipo:** SEC
- **Prioridade:** P0
- **Estimativa:** M

---

## BLG-1706 — Tela de auditoria

- **Tipo:** FEAT
- **Prioridade:** P2
- **Estimativa:** L

---

# ÉPICO 18 — ANDROID

---

## BLG-1801 — Criar app React Native + Expo

- **Tipo:** TECH
- **Prioridade:** P1
- **Estimativa:** M

---

## BLG-1802 — Configurar navegação

- **Tipo:** TECH
- **Prioridade:** P1
- **Estimativa:** M

---

## BLG-1803 — Configurar tema e componentes

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** M

---

## BLG-1804 — Integrar API client

- **Tipo:** TECH
- **Prioridade:** P1
- **Estimativa:** M

---

## BLG-1805 — Integrar crypto-mobile

- **Tipo:** SEC
- **Prioridade:** P0
- **Estimativa:** L

---

## BLG-1806 — Integrar Android Keystore

- **Tipo:** SEC
- **Prioridade:** P0
- **Estimativa:** L

---

## BLG-1807 — Login Android

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** L

---

## BLG-1808 — Cofres Android

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** L

---

## BLG-1809 — Sites Android

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** L

---

## BLG-1810 — Credenciais Android

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** L

---

## BLG-1811 — Convites Android

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** M

---

## BLG-1812 — Sessões Android

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** M

---

## BLG-1813 — Bloqueio de screenshot

- **Tipo:** SEC
- **Prioridade:** P1
- **Estimativa:** M

---

## BLG-1814 — Build release APK

- **Tipo:** INFRA
- **Prioridade:** P1
- **Estimativa:** L

### Tarefas

- [ ] Keystore de assinatura.
- [ ] Secret fora do Git.
- [ ] Versionamento.
- [ ] Build release.
- [ ] Hash.
- [ ] Instalação em dois dispositivos.
- [ ] Canal de distribuição.

---

# ÉPICO 19 — SEGURANÇA OPERACIONAL

---

## BLG-1901 — Rate limit

- **Tipo:** SEC
- **Prioridade:** P0
- **Estimativa:** M

---

## BLG-1902 — Bloqueio progressivo

- **Tipo:** SEC
- **Prioridade:** P1
- **Estimativa:** M

---

## BLG-1903 — CSP Web

- **Tipo:** SEC
- **Prioridade:** P0
- **Estimativa:** M

---

## BLG-1904 — CSRF no refresh Web

- **Tipo:** SEC
- **Prioridade:** P0
- **Estimativa:** M

---

## BLG-1905 — Autolock

- **Tipo:** SEC
- **Prioridade:** P2
- **Estimativa:** L

---

## BLG-1906 — Checklist de produção

- **Tipo:** SEC
- **Prioridade:** P0
- **Estimativa:** M

---

## BLG-1907 — Teste manual de storage

- **Tipo:** TEST
- **Prioridade:** P0
- **Estimativa:** M

### Verificar

- [ ] localStorage.
- [ ] sessionStorage.
- [ ] IndexedDB.
- [ ] AsyncStorage.
- [ ] logs.
- [ ] cookies.
- [ ] cache.

---

# ÉPICO 20 — BACKUPS E OPERAÇÃO

---

## BLG-2001 — Configurar backup MySQL

- **Tipo:** INFRA
- **Prioridade:** P0
- **Estimativa:** M

---

## BLG-2002 — Configurar retenção

- **Tipo:** INFRA
- **Prioridade:** P1
- **Estimativa:** S

---

## BLG-2003 — Backup externo à VPS

- **Tipo:** INFRA
- **Prioridade:** P1
- **Estimativa:** M

---

## BLG-2004 — Testar restauração

- **Tipo:** TEST
- **Prioridade:** P0
- **Estimativa:** L

---

## BLG-2005 — Jobs de manutenção

- **Tipo:** TECH
- **Prioridade:** P1
- **Estimativa:** L

### Jobs

- [ ] Expirar sessões.
- [ ] Expirar convites.
- [ ] Purge.
- [ ] Limpar import jobs.
- [ ] Retenção de auditoria.
- [ ] Detectar rekey abandonado.

---

# ÉPICO 21 — TESTES E2E

---

## BLG-2101 — Setup E2E

- **Tipo:** TEST
- **Prioridade:** P1
- **Estimativa:** M

---

## BLG-2102 — Fluxo primeiro usuário

- **Tipo:** TEST
- **Prioridade:** P1
- **Estimativa:** M

---

## BLG-2103 — Fluxo cofre privado

- **Tipo:** TEST
- **Prioridade:** P1
- **Estimativa:** M

---

## BLG-2104 — Fluxo compartilhado

- **Tipo:** TEST
- **Prioridade:** P0
- **Estimativa:** L

---

## BLG-2105 — Fluxo remoção e rekey

- **Tipo:** TEST
- **Prioridade:** P0
- **Estimativa:** L

---

## BLG-2106 — Fluxo importação

- **Tipo:** TEST
- **Prioridade:** P1
- **Estimativa:** L

---

## BLG-2107 — Fluxo sessão comprometida

- **Tipo:** TEST
- **Prioridade:** P0
- **Estimativa:** M

---

# ÉPICO 22 — DOCUMENTAÇÃO

---

## BLG-2201 — README

- **Tipo:** DOC
- **Prioridade:** P1
- **Estimativa:** M

---

## BLG-2202 — CLAUDE.md

- **Tipo:** DOC
- **Prioridade:** P1
- **Estimativa:** M

---

## BLG-2203 — CONTRIBUTING.md

- **Tipo:** DOC
- **Prioridade:** P1
- **Estimativa:** M

---

## BLG-2204 — Documentação de setup local

- **Tipo:** DOC
- **Prioridade:** P1
- **Estimativa:** M

---

## BLG-2205 — Documentação de Coolify

- **Tipo:** DOC
- **Prioridade:** P1
- **Estimativa:** M

---

## BLG-2206 — Documentação de release APK

- **Tipo:** DOC
- **Prioridade:** P1
- **Estimativa:** M

---

## BLG-2207 — Changelog

- **Tipo:** DOC
- **Prioridade:** P2
- **Estimativa:** S

---

# ÉPICO 23 — ACESSIBILIDADE E UX

---

## BLG-2301 — Navegação por teclado

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** M

---

## BLG-2302 — Leitor de tela

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** M

---

## BLG-2303 — Contraste

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** S

---

## BLG-2304 — Estados vazios e erros

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** M

---

## BLG-2305 — Responsividade Web

- **Tipo:** FEAT
- **Prioridade:** P1
- **Estimativa:** L

---

# ÉPICO 24 — ESTABILIZAÇÃO DA V1

---

## BLG-2401 — Revisão de performance

- **Tipo:** TECH
- **Prioridade:** P1
- **Estimativa:** M

---

## BLG-2402 — Revisão de segurança

- **Tipo:** SEC
- **Prioridade:** P0
- **Estimativa:** L

---

## BLG-2403 — Revisão de documentação

- **Tipo:** DOC
- **Prioridade:** P1
- **Estimativa:** M

---

## BLG-2404 — Teste em dois usuários reais

- **Tipo:** TEST
- **Prioridade:** P0
- **Estimativa:** L

### Regra

Usar credenciais fictícias até aprovação final.

---

## BLG-2405 — Gate para credenciais reais

- **Tipo:** SEC
- **Prioridade:** P0
- **Estimativa:** M

### Critérios

- [ ] Crypto revisada.
- [ ] Autorização testada.
- [ ] Backups ativos.
- [ ] Restauração testada.
- [ ] Logs sanitizados.
- [ ] MySQL privado.
- [ ] APK release.
- [ ] Sessões revogáveis.
- [ ] Reuse detection.
- [ ] Rekey funcional.
- [ ] Checklist de produção aprovado.

---

# BACKLOG PÓS-V1

---

## V1.1

- [ ] Gerador de senha.
- [ ] Autolock.
- [ ] Busca global.
- [ ] Tela de auditoria.
- [ ] Melhorias de UX.
- [ ] Import report download.
- [ ] Tema refinado.
- [ ] Melhor detecção de duplicidade.

## V1.2

- [ ] Perfil LEITOR.
- [ ] Transferência de propriedade.
- [ ] Lixeira.
- [ ] Histórico de versões.
- [ ] Exportação.
- [ ] Recovery kit.
- [ ] Biometria Android.

## V2

- [ ] Extensão Chrome.
- [ ] Extensão Firefox.
- [ ] Extensão Opera.
- [ ] Detecção de domínio.
- [ ] Preenchimento manual.
- [ ] Autofill no navegador.

## V3

- [ ] Android Autofill Service.
- [ ] Desbloqueio biométrico.
- [ ] Passkeys.
- [ ] Recuperação avançada.
- [ ] Offline criptografado.
- [ ] Sincronização incremental robusta.

---

## 25. Dependências críticas

```text
Repositório e configuração GitHub
→ Monorepo
→ CI e validação do fluxo de branches
→ Web/API base
→ MySQL
→ Dockerfiles
→ GHCR e Coolify development
→ Deploy antecipado
→ Release candidate em staging
→ Promoção do mesmo artefato para production

Crypto libraries
→ Crypto core
→ Setup/Login
→ Cofres
→ Sites/Credenciais
→ Compartilhamento
→ Rekey
→ Android

Cofres + Sites + Credentials
→ Importação

Sessões + Auth
→ Uso real

Backups + Segurança + E2E
→ Gate de produção
```

---

## 26. Caminho crítico da V1

1. Repositório e documentação base.
2. Configuração manual do GitHub.
3. Monorepo e fundação.
4. CI e validação do fluxo de branches.
5. Ambientes development, staging e production.
6. Deploy antecipado em development.
7. Banco.
8. Criptografia.
9. Setup e autenticação.
10. Sessões.
11. Cofres.
12. Sites.
13. Credenciais.
14. Compartilhamento.
15. Rekey.
16. Importação.
17. Android.
18. Release candidate em staging.
19. Promoção do mesmo artefato para production.
20. Backups.
21. Testes E2E.
22. Revisão de segurança.
23. Liberação para credenciais reais.

---

## 27. Itens bloqueadores de produção

São bloqueadores absolutos:

- criptografia não revisada;
- API recebendo segredo em texto aberto;
- MySQL público;
- refresh token sem rotação;
- ausência de rekey;
- ausência de testes de autorização;
- dados sensíveis em logs;
- backup sem restauração testada;
- APK debug;
- segredo no Git;
- ausência de HTTPS;
- ausência de rate limit;
- ausência de revogação de sessão;
- ausência de rulesets e checks obrigatórios;
- deploy direto em `main` sem release e tag estável;
- produção reconstruída depois da homologação;
- ausência de manifesto com digests da RC;
- bancos compartilhados entre ambientes;
- tags publicadas mutáveis;
- ausência de rollback por tag ou digest.

---

## 28. Processo de atualização do backlog

Ao criar nova funcionalidade:

1. adicionar item;
2. classificar prioridade;
3. identificar dependências;
4. definir critérios de aceite;
5. avaliar segurança;
6. atualizar roadmap quando alterar release;
7. atualizar documentos impactados.

---

## 29. Resumo

O backlog prioriza uma sequência segura:

```text
configuração do GitHub
→ fundação
→ CI e fluxo de branches
→ deploy development
→ release candidate staging
→ promoção por digest
→ identidade
→ criptografia
→ cofres
→ conteúdo
→ compartilhamento
→ rekey
→ importação
→ Android
→ estabilização
```

Nenhuma funcionalidade de conveniência deverá ultrapassar controles de segurança no caminho crítico.
