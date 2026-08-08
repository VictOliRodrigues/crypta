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

O estado da R0.2 é rastreado na secao 7, que passou a existir quando `@crypta/crypto-web` (PR #16) adiantou parte do ÉPICO 07. Nenhuma tarefa da R0.3 em diante foi iniciada.

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

> Atualizado em 8 de agosto de 2026.

A R0.2 constrói a fundação de confiança do produto: identidade, sessões e o material criptográfico que protege todo o conteúdo das fases seguintes.

Nada da fase foi implementado ainda. O que já existe é a base sobre a qual ela é construída: `@crypta/crypto-web` com os adapters e a suíte de vetores diferenciais (PR #16), e os ADRs 0016 a 0021, que fecharam biblioteca, parâmetros, identificadores, exclusão e duração de tokens.

Esta secao é o **gate único** da fase. Cada linha nasce `PENDENTE` e só vira `OK` acompanhada da evidência que a comprova, no pull request que a produziu. Não existe segundo lugar para conferir.

### Gate de segurança da R0.2

Conforme `ROADMAP.md` secao 17. Os itens do roadmap são objetivos; a coluna do meio é o que os torna verificáveis — um item sem forma de medir não é gate, é intenção.

Os nove primeiros vêm da secao 17. O décimo vem do [ADR 0021](decisions/0021-session-token-lifetimes.md), que atribuiu explicitamente ao gate desta fase a validação do ciclo completo de refresh, e não apenas do login.

| Item do gate                     | Critério verificável                                                                                                                                                                                                                   | Estado                                                                                                            |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Senha original não enviada à API | O corpo de `POST /setup` e de `POST /auth/login` carrega `authSecret` e nenhum campo derivado da senha. Teste na Web espiona o adapter do axios; o DTO da API rejeita qualquer campo fora dele.                                        | PENDENTE — depende das branches de auth e de Web                                                                  |
| AuthSecret não logado            | O `LogFields` fechado do `StructuredLogger` não admite o campo, então não existe caminho para registrá-lo; e2e confirma que o log de uma requisição de auth não contém o valor.                                                        | PENDENTE — depende da branch do módulo de auth                                                                    |
| Private key nunca enviada aberta | O DTO de `POST /setup` aceita `encryptedPrivateKey` e `privateKeyNonce`; `forbidNonWhitelisted` responde `400` a um campo `privateKey`.                                                                                                | PENDENTE — depende da branch do módulo de auth                                                                    |
| Vetores passam                   | `pnpm --filter @crypta/crypto-core test` e `pnpm --filter @crypta/crypto-web test` verdes, incluindo os vetores de derivação de identidade, do payload da chave privada e do envelope.                                                 | OK — 116 e 41 testes; `IDENTITY_PRODUCTION_VECTOR` reproduzido pelo libsodium e conferido contra `@noble/hashes`  |
| Ciphertext adulterado falha      | Loop byte a byte sobre o payload de identidade e sobre o envelope: toda posição alterada resulta em `CryptoAuthenticationError`, no padrão que o ADR 0017 já exigiu do envelope.                                                       | OK — quatro loops em `identity.spec.ts`: chave privada cifrada, nonce, chave pública efêmera e `VaultKey` cifrada |
| AAD incorreta falha              | Decrypt com escopo, `entityType` ou `entityId` trocados falha fechado, sem devolver conteúdo parcial.                                                                                                                                  | OK — `publicKey` trocada e `schemaVersion` alterada rejeitadas; chave pública de intruso não abre o envelope      |
| Refresh reuse revoga sessão      | e2e: rotaciona, apresenta o token antigo fora da janela de 10 s do ADR 0021, recebe `401` e a família deixa de existir. Dentro da janela, duas rotações concorrentes devolvem o mesmo par.                                             | PENDENTE — depende da branch do ciclo de sessão                                                                   |
| localStorage não contém segredo  | O eslint da Web já proíbe `localStorage` e `sessionStorage` por `no-restricted-globals`; mais teste de que o store de sessão vive só em memória e não sobrevive ao reload.                                                             | PENDENTE — depende da branch de Web                                                                               |
| Arquitetura revisada             | Checklist do `BLG-0707` executado e o resultado registrado nesta secao, item a item.                                                                                                                                                   | PENDENTE — último passo da fase                                                                                   |
| Ciclo de refresh no navegador    | Login, expiração do access token e refresh bem-sucedido exercitados em navegador real contra development. O `SameSite=Strict` entre `crypta-dev` e `crypta-api-dev` foi deduzido da especificação e nunca exercitado; jsdom não cobre. | PENDENTE — depende do deploy da branch de Web                                                                     |

### Por que a ordem das branches é essa

`SECURITY.md` secao 18 registra que mudar o formato da AAD "hoje ainda é barato, porque nenhum cofre existe; depois do primeiro conteúdo gravado, não é". A mesma janela vale para o envelope de chave, cuja forma em `docs/API.md` secao 15 ainda não corresponde ao que `@crypta/crypto-web` produz.

Por isso o formato criptográfico é fechado **antes** da primeira migration, e a migration vem antes de qualquer endpoint que grave. Inverter a ordem transformaria uma decisão de projeto em migração de dado criptografado.

### Tarefas da R0.2

| Item     | Status  | Observação                                                                                                                       |
| -------- | ------- | -------------------------------------------------------------------------------------------------------------------------------- |
| BLG-0502 | BACKLOG | `User`, `UserKeyBundle` e `Session`. Primeira migration do projeto; abre também o harness e2e com MySQL real.                    |
| BLG-0701 | PARCIAL | ADRs 0016, 0017 e 0018 fecharam a Web. Faltam a biblioteca do Android (`PEND-003`) e o Keystore, ambos na R0.7.                  |
| BLG-0702 | DONE    | Payload versionado, AAD de dois escopos, envelope enquadrado, `buildCipherPayload` e erros. ADR 0023.                            |
| BLG-0703 | DONE    | `deriveIdentitySecrets` orquestra Argon2id e os dois HKDF, com vetor congelado em `crypto-core`. Benchmark Android fica na R0.7. |
| BLG-0704 | DONE    | `createUserKeyBundle` e `openUserKeyBundle`, com AAD amarrada à chave pública e adulteração testada byte a byte.                 |
| BLG-0705 | PARCIAL | Formato do envelope fechado e testado. Geração da `VaultKey` e envelopes OWNER/EDITOR entram na R0.3, com o cofre.               |
| BLG-0706 | BACKLOG | Depende do formato fechado. Vault, site e credential só ganham payload real a partir da R0.3.                                    |
| BLG-0707 | BACKLOG | Revisão criptográfica interna. É o último item do gate e bloqueia o uso real.                                                    |
| BLG-0801 | BACKLOG | `GET /setup/status`.                                                                                                             |
| BLG-0802 | BACKLOG | Tela W01 e `POST /setup`, em transação e com idempotência.                                                                       |
| BLG-0803 | BACKLOG | `GET /auth/parameters`. Os parâmetros sintéticos precisam ser estáveis por e-mail, ou viram oráculo de enumeração.               |
| BLG-0804 | BACKLOG | Tela W02 e `POST /auth/login`.                                                                                                   |
| BLG-0805 | BACKLOG | Rotação, família e detecção de reuso, com a janela de 10 s do ADR 0021.                                                          |
| BLG-0806 | BACKLOG | Logout e logout global.                                                                                                          |
| BLG-0807 | BACKLOG | Alteração de senha. **Fora das branches planejadas para a fase** — ver abaixo.                                                   |
| BLG-0901 | BACKLOG | `GET /sessions`.                                                                                                                 |
| BLG-0902 | BACKLOG | `DELETE /sessions/:sessionId`, com teste de IDOR obrigatório.                                                                    |
| BLG-0903 | BACKLOG | `DELETE /sessions`.                                                                                                              |
| BLG-0904 | BACKLOG | Interface de sessões na Web. **Fora das branches planejadas para a fase** — ver abaixo.                                          |

### Trabalho da fase fora das branches planejadas

As branches previstas cobrem criptografia, schema, setup, autenticação, ciclo de sessão e as telas W01 e W02. Dois itens da fase ficam de fora, e são registrados aqui em vez de aparecerem como surpresa no fechamento:

- **`BLG-0807` — alteração de senha.** Recriptografa a chave privada com uma `UserEncryptionKey` nova, substitui o `AuthSecret` e revoga as demais sessões, tudo em transação. Encosta em criptografia, banco, autenticação e sessões ao mesmo tempo.
- **`BLG-0904` — interface de sessões na Web.** A API de sessões entra na fase; a tela que a consome, não.

O gate não fecha sem os dois. Reduzir o escopo da R0.2 para excluí-los é decisão de produto e exigiria atualizar `ROADMAP.md` secao 14 e `PROJECT_SCOPE.md` secao 5.

### Pendências que atravessam a fase

- **`PEND-003`, biblioteca libsodium no Android.** Os vetores desta fase nascem exercitados só na Web. A compatibilidade com o Android é garantida por construção — parâmetros e algoritmos fixados nos ADRs 0016 e 0017 — e só será **medida** na R0.7. Um vetor que roda em uma plataforma só prova metade do que `SECURITY.md` secao 22 exige.
- **Parâmetros do Argon2id.** O [ADR 0018](decisions/0018-argon2id-parameters.md) declara os valores provisórios até a medição em Android. Cada usuário guarda os próprios parâmetros na sua linha, então recalibrar depois não invalida conta nenhuma — foi exatamente para isso que eles ficaram por usuário.
- **Check obrigatório novo.** O job de integração com MySQL cria um quarto nome de check. Enquanto ele não for registrado à mão nos rulesets (`GITHUB_RELEASE_FLOW.md` secoes 17 e 18), o job pode reprovar sem bloquear merge.

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

---

## BLG-0504 — Migration de conteúdo

- **Tipo:** TECH
- **Prioridade:** P1
- **Estimativa:** M

### Entidades

- [ ] Site.
- [ ] Credential.
- [ ] Versionamento.
- [ ] Soft delete técnico.

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
- [ ] AuditLog.

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

- [ ] Revisar fluxos.
- [ ] Revisar nonce.
- [ ] Revisar AAD.
- [ ] Revisar separação.
- [ ] Revisar logs.
- [ ] Revisar storage.
- [ ] Bloquear uso real até aprovação.

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

- [ ] Tela W02.
- [ ] Derivação no cliente.
- [ ] AuthSecret.
- [ ] Access token.
- [ ] Refresh cookie.
- [ ] Key bundle.
- [ ] Desbloqueio.
- [ ] Erros.
- [ ] Testes.

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

- [ ] Tela.
- [ ] Validar senha atual.
- [ ] Novo KDF salt.
- [ ] Novo AuthSecret.
- [ ] Recriptografar chave privada.
- [ ] Transação.
- [ ] Revogar sessões.
- [ ] Testes.

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

- [ ] Modal destrutivo.
- [ ] OWNER only.
- [ ] Soft delete técnico.
- [ ] Purge.
- [ ] Auditoria.
- [ ] Testes.

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
