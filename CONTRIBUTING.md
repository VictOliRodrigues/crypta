# CONTRIBUTING.md

# Crypta — Guia de Contribuição

> **Status:** Documento inicial para revisão  
> **Versão:** 0.2.0  
> **Última atualização:** 31 de julho de 2026

---

## 1. Objetivo

Este documento define como contribuir com o projeto do cofre de senhas.

O projeto será mantido em um repositório público e deverá preservar:

- segurança;
- consistência arquitetural;
- qualidade de código;
- rastreabilidade;
- documentação atualizada;
- compatibilidade entre Web, API e Android;
- ausência de segredos no histórico Git.

Antes de contribuir, leia:

- `README.md`;
- `PROJECT_SCOPE.md`;
- `ARCHITECTURE.md`;
- `DATABASE.md`;
- `API.md`;
- `SECURITY.md`;
- `STYLE_GUIDE.md`;
- `BACKLOG.md`;
- `ROADMAP.md`;
- `GITHUB_RELEASE_FLOW.md`;
- `config_user.md`, quando a contribuição envolver configuração;
- `docs/DECISIONS.md`;
- `CLAUDE.md`.

---

## 2. Código de conduta

Contribuições devem ocorrer com:

- respeito;
- clareza;
- objetividade;
- boa-fé;
- foco técnico;
- abertura para revisão.

Não serão aceitos:

- ataques pessoais;
- assédio;
- divulgação pública de vulnerabilidades antes de correção;
- inclusão deliberada de código malicioso;
- inclusão de segredos;
- manipulação de dependências sem justificativa;
- mudanças de arquitetura sem documentação.

---

## 3. Tipos de contribuição

São aceitas contribuições de:

- correção de bugs;
- melhoria de testes;
- melhoria de documentação;
- melhoria de acessibilidade;
- melhoria de desempenho;
- correção de segurança;
- novas funcionalidades previstas no backlog;
- propostas arquiteturais;
- revisão de segurança;
- tradução e revisão textual.

Funcionalidades fora do escopo devem ser discutidas antes da implementação.

---

## 4. Antes de começar

### 4.1 Verifique o backlog

Consulte `BACKLOG.md`.

Priorize itens:

```text
READY
```

Evite iniciar itens:

```text
BLOCKED
CANCELLED
DONE
```

### 4.2 Verifique decisões existentes

Consulte:

```text
docs/DECISIONS.md
docs/decisions/
```

Não reabra decisões sem apresentar:

- novo contexto;
- risco identificado;
- limitação concreta;
- alternativa melhor;
- impacto de migração.

### 4.3 Abra uma issue quando necessário

Abra uma issue antes de implementar:

- nova funcionalidade;
- mudança de arquitetura;
- mudança de banco;
- mudança de criptografia;
- mudança de autenticação;
- dependência relevante;
- alteração incompatível;
- migration destrutiva;
- mudança de escopo.

Correções pequenas e evidentes podem ir direto para pull request.

---

## 5. Segurança antes da contribuição

### 5.1 Nunca envie dados reais

Não utilize em:

- testes;
- fixtures;
- screenshots;
- documentação;
- logs;
- issues;
- pull requests;
- commits;
- exemplos.

São proibidos:

- senhas reais;
- tokens reais;
- chaves SSH;
- private keys;
- certificados;
- dumps;
- backups;
- arquivos CSV reais;
- e-mails pessoais reais;
- credenciais de banco;
- secrets do Coolify;
- APK signing keys.

### 5.2 Dados de exemplo

Use:

```text
alice@example.test
bob@example.test
https://example.com
ciphertext-base64url
token-placeholder
```

### 5.3 Segredo commitado

Caso um segredo seja commitado:

1. interrompa o uso do segredo;
2. revogue ou rotacione;
3. informe o mantenedor;
4. remova do histórico quando aplicável;
5. não considere a simples exclusão suficiente;
6. registre o incidente de forma privada.

---

## 6. Vulnerabilidades

### 6.1 Não abra issue pública

Vulnerabilidades não devem ser divulgadas em issue pública antes da correção.

### 6.2 Informações recomendadas

O reporte deve incluir:

- descrição;
- impacto;
- versão;
- passos de reprodução;
- evidência sanitizada;
- cenário de exploração;
- sugestão de correção, se houver.

### 6.3 Não inclua

- credenciais reais;
- dumps;
- tokens válidos;
- dados de usuários;
- segredos de produção.

### 6.4 Severidade

Classificação inicial:

```text
CRITICAL
HIGH
MEDIUM
LOW
```

Exemplos críticos:

- leitura de credenciais sem autorização;
- chave privada exposta;
- VaultKey exposta;
- bypass de criptografia;
- banco público;
- execução remota;
- frontend malicioso publicado.

---

## 7. Ambiente de desenvolvimento

### 7.1 Requisitos

- Git;
- Node.js na versão definida pelo projeto;
- pnpm;
- MySQL;
- Docker para ambiente local, quando adotado;
- editor com suporte a TypeScript;
- Android Studio quando trabalhar no mobile.

### 7.2 Instalação

```bash
git clone <repository-url>
cd <repository-folder>
pnpm install
```

### 7.3 Variáveis

Copie apenas os arquivos de exemplo:

```bash
cp .env.example .env
```

Nunca versione o `.env`.

### 7.4 Banco

Use banco exclusivo de desenvolvimento.

Não aponte o ambiente local para produção.

### 7.5 Migrations

```bash
pnpm --filter api prisma migrate dev
```

O comando final poderá variar conforme os scripts definidos no projeto.

### 7.6 Execução

Exemplo conceitual:

```bash
pnpm dev
```

Ou por workspace:

```bash
pnpm --filter web dev
pnpm --filter api dev
pnpm --filter mobile start
```

---

## 8. Estrutura do repositório

A árvore completa e comentada está em [`README.md`](README.md#estrutura-do-repositório).

Ela não é duplicada aqui de propósito: duas cópias da mesma estrutura divergem na primeira pasta
nova que alguém cria, e a cópia desatualizada acaba sendo a que o contribuidor externo lê.

Os pontos que importam para contribuir:

| Onde                | O que vive ali                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------------------- |
| `apps/api`          | API NestJS. Um módulo por domínio, com controllers, services, repositories, policies, dto e mappers. |
| `apps/web`          | Aplicação React. Organizada por feature, não por tipo de arquivo.                                    |
| `apps/mobile`       | Reservado para a R0.7. Hoje contém apenas documentação.                                              |
| `packages/`         | Código compartilhado entre os clientes e a API. Nada de framework aqui.                              |
| `docs/`             | Documentação do produto. `docs/decisions/` guarda os ADRs.                                           |
| `.github/workflows` | CI, validação do fluxo de PR e deploys.                                                              |

## 9. Branches

O fluxo completo está em `GITHUB_RELEASE_FLOW.md`.

### 9.1 Branches permanentes

```text
develop
staging
main
```

#### `develop`

- branch padrão;
- desenvolvimento contínuo;
- deploy no Environment `development`;
- recebe funcionalidades, bugs de desenvolvimento, documentação, tarefas técnicas e correções de segurança ainda não publicadas.

#### `staging`

- conteúdo atualmente em homologação;
- recebe somente `release/*`;
- cada promoção válida gera uma tag `vX.Y.Z-rc.N`;
- não recebe correções diretamente.

#### `main`

- produção;
- recebe `staging` ou `hotfix/*`;
- cada versão publicada possui tag estável e GitHub Release.

### 9.2 Branches temporárias

| Finalidade                    | Padrão          | Origem          | Destino         |
| ----------------------------- | --------------- | --------------- | --------------- |
| Funcionalidade                | `feature/*`     | `develop`       | `develop`       |
| Bug em desenvolvimento        | `bugfix/*`      | `develop`       | `develop`       |
| Tarefa técnica                | `chore/*`       | `develop`       | `develop`       |
| Refatoração                   | `refactor/*`    | `develop`       | `develop`       |
| Documentação                  | `docs/*`        | `develop`       | `develop`       |
| Segurança ainda não publicada | `security/*`    | `develop`       | `develop`       |
| Atualização de dependência    | `dependabot/*`  | `develop`       | `develop`       |
| Release                       | `release/x.y.z` | `develop`       | `staging`       |
| Correção de homologação       | `fix/*`         | `release/x.y.z` | `release/x.y.z` |
| Hotfix de produção            | `hotfix/*`      | `main`          | `main`          |

### 9.3 Nomes

- nomes em inglês;
- kebab-case;
- uma finalidade por branch;
- sem dados sensíveis;
- não usar prefixo `v` em `release/x.y.z`.

### 9.4 Exclusão

Podem ser apagadas automaticamente após merge:

```text
feature/*
bugfix/*
fix/*
chore/*
refactor/*
docs/*
security/*
hotfix/*
```

Não apagar automaticamente:

```text
develop
staging
main
release/*
```

As branches `dependabot/*` não entram em nenhuma das duas listas: o próprio Dependabot as apaga depois do merge.

A branch `release/*` permanece ativa até a publicação, sincronização `main → develop` e confirmação de que não existem correções exclusivas pendentes.

---

## 10. Fluxo Git

### 10.1 Funcionalidade ou bug em desenvolvimento

```bash
git switch develop
git pull --ff-only
git switch -c feature/create-vault
```

Abra:

```text
feature/create-vault → develop
```

Para bug ainda não publicado:

```text
bugfix/refresh-session → develop
```

Use **Squash and merge**.

### 10.2 Iniciar release

Preferencialmente use o workflow manual `Iniciar release`.

Fluxo:

```text
develop
→ release/x.y.z
→ staging
```

O workflow deverá:

- validar Semantic Versioning;
- criar `release/x.y.z`;
- atualizar `VERSION`;
- abrir PR para `staging`.

Use **Create a merge commit** em `release/* → staging`.

### 10.3 Corrigir homologação

A correção nasce da release ativa:

```bash
git switch release/0.4.0
git pull --ff-only
git switch -c fix/credential-copy
```

Abra:

```text
fix/credential-copy → release/0.4.0
```

Depois promova novamente:

```text
release/0.4.0 → staging
```

Isso cria uma nova RC.

Nunca corrija diretamente em `staging`.

### 10.4 Publicar produção

Após aprovação da RC:

```text
staging → main
```

Use **Create a merge commit**.

Depois da publicação:

```text
main → develop
```

Use **Create a merge commit**.

Somente após essa sincronização a branch `release/x.y.z` pode ser excluída.

### 10.5 Hotfix

Hotfix nasce de `main`:

```bash
git switch main
git pull --ff-only
git switch -c hotfix/session-reuse
```

Atualize `VERSION` para uma nova versão PATCH e abra:

```text
hotfix/session-reuse → main
```

Após publicar:

```text
main → develop
```

Se houver release ativa:

```text
main → release/x.y.z
```

Ao resolver conflito, preserve no arquivo `VERSION` a versão da release ativa.

### 10.6 Estratégia de merge

| PR                                               | Estratégia                                       |
| ------------------------------------------------ | ------------------------------------------------ |
| Branch temporária de desenvolvimento → `develop` | Squash and merge                                 |
| `fix/* → release/*`                              | Squash and merge                                 |
| `release/* → staging`                            | Create a merge commit                            |
| `staging → main`                                 | Create a merge commit                            |
| `main → develop`                                 | Create a merge commit                            |
| `main → release/*`                               | Create a merge commit                            |
| `hotfix/* → main`                                | Squash and merge ou merge commit conforme o caso |

Não exigir histórico linear nas branches permanentes.

### 10.7 Validação automática

O workflow `validate-pr-flow.yml` deve impedir combinações não previstas.

Exemplos inválidos:

```text
feature/* → main
feature/* → staging
fix/* → develop
release/* → main
```

Não tente contornar o check sem registrar uma decisão.

## 11. Conventional Commits

Formato:

```text
type(scope): description
```

Exemplos:

```text
feat(vaults): add vault creation flow
fix(auth): revoke reused refresh token family
security(logs): redact authorization headers
test(crypto): add cross-platform envelope vectors
docs(api): document invitation endpoints
refactor(database): extract vault repository
```

### Tipos permitidos

```text
feat
fix
security
docs
test
refactor
perf
build
ci
chore
revert
```

### Escopos sugeridos

```text
auth
sessions
users
vaults
sites
credentials
invitations
imports
rekey
crypto
database
api
web
mobile
infra
docs
ci
```

### Descrição

- imperativa;
- clara;
- curta;
- sem ponto final;
- em inglês.

---

## 12. Pull requests

### 12.1 Título

Utilize Conventional Commits.

Exemplo:

```text
feat(vaults): add encrypted vault creation
```

### 12.2 Descrição

Inclua:

- objetivo;
- contexto;
- principais mudanças;
- impacto em segurança;
- testes executados;
- documentação atualizada;
- migrations;
- screenshots quando UI;
- riscos;
- rollback quando aplicável.

### 12.3 Template sugerido

```markdown
## Objetivo

Descreva o problema e a solução.

## Alterações

- Alteração 1
- Alteração 2

## Segurança

- Impactos avaliados
- Dados sensíveis envolvidos
- Controles aplicados

## Testes

- [ ] Unitários
- [ ] Integração
- [ ] E2E
- [ ] Manual

## Documentação

- [ ] API
- [ ] Banco
- [ ] Arquitetura
- [ ] Segurança
- [ ] Telas
- [ ] Backlog

## Migration

Descreva ou informe que não há.

## Evidências

Screenshots, logs sanitizados ou resultados.
```

---

## 13. Tamanho do pull request

Preferir PRs pequenos.

Dividir quando houver:

- múltiplos domínios;
- migration grande;
- refatoração e funcionalidade misturadas;
- alteração de crypto;
- alteração de infraestrutura;
- mais de uma decisão arquitetural.

PR grande deve justificar por que não pode ser dividido.

---

## 14. Revisão

### 14.1 O autor deve

- revisar o próprio diff;
- remover debug;
- atualizar docs;
- executar testes;
- verificar segredos;
- responder comentários;
- não resolver comentários sem tratar o ponto.

### 14.2 O revisor deve verificar

- correção;
- segurança;
- autorização;
- tratamento de erros;
- transações;
- testes;
- documentação;
- performance;
- consistência;
- impacto em mobile e Web;
- compatibilidade de contratos.

### 14.3 Mudanças sensíveis

Exigem revisão adicional:

- crypto;
- auth;
- sessions;
- permissions;
- rekey;
- importação;
- cookies;
- CORS;
- CSP;
- banco;
- backups;
- CI/CD;
- signing do APK.

---

## 15. Requisitos de qualidade

Antes de abrir PR:

```bash
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
```

Os nomes finais dos scripts poderão variar.

A execução deve ocorrer na raiz quando possível.

---

## 16. Testes

### 16.1 Obrigatórios

Toda alteração de comportamento deve incluir teste.

### 16.2 Backend

- unitários;
- integração;
- autorização;
- banco real MySQL;
- Supertest.

**Os testes de integração exigem um MySQL de verdade.** SQLite não é substituto: o schema depende de comportamento específico do MySQL, incluindo a collation que a migration fixa à mão (`CLAUDE.md` secao 42, `DATABASE.md` secao 3).

Suba um descartável, na 3308 para não conflitar com um MySQL local:

```bash
docker run -d --name crypta-mysql-test \
  -e MYSQL_ROOT_PASSWORD=crypta_local_test -e MYSQL_DATABASE=crypta_test \
  -p 3308:3306 mysql:8.0 \
  --character-set-server=utf8mb4 --collation-server=utf8mb4_0900_ai_ci \
  --default-time-zone=+00:00
```

Depois, com `TEST_DATABASE_URL` no `.env` da raiz:

```bash
pnpm --filter @crypta/api run prisma:migrate:deploy
pnpm --filter @crypta/api test:e2e
```

`TEST_DATABASE_URL` é separada de `DATABASE_URL` de propósito: a suíte apaga tabelas, e o harness **recusa rodar** se o nome do banco não terminar em `_test`. Não aponte as duas para o mesmo banco.

`pnpm test` e `pnpm verify` **não** rodam a suíte de integração — ela precisa do banco no ar. Na CI ela é um job próprio, `Testes de integração com MySQL`, com o MySQL vindo de um bloco `services:`.

### 16.3 Web

- componentes;
- hooks;
- formulários;
- estados;
- permissões visuais;
- integração com API mockada ou ambiente de teste.

### 16.4 Mobile

- lógica;
- navegação;
- storage;
- crypto;
- integração em dispositivo.

### 16.5 Criptografia

Mudanças exigem:

- vetores;
- compatibilidade Web/Android;
- adulteração;
- AAD incorreta;
- versionamento;
- migração.

---

## 17. Banco e migrations

### 17.1 Nunca use `db push` em produção

Produção deve usar migrations versionadas.

### 17.2 Migration deve

- ter nome descritivo;
- ser revisada;
- funcionar em banco vazio;
- funcionar em banco existente;
- possuir rollback ou plano de recuperação;
- atualizar `DATABASE.md`.

### 17.3 Alteração destrutiva

Requer:

- issue;
- ADR quando relevante;
- backup;
- migration em etapas;
- teste no Coolify;
- plano de rollback.

### 17.4 Seeds

Somente dados fictícios.

---

## 18. API

Mudanças na API devem atualizar:

- DTO;
- OpenAPI;
- `API.md`;
- contracts;
- testes;
- Web;
- Mobile, quando aplicável.

Breaking changes exigem:

- versão nova; ou
- período de compatibilidade;
- ADR;
- plano de migração.

---

## 19. Criptografia

### Proibido

- criar algoritmo próprio;
- mudar AAD sem versionar;
- trocar biblioteca sem ADR;
- alterar formato sem migration;
- adicionar fallback inseguro;
- registrar chaves;
- persistir chave aberta.

### Obrigatório

- revisar `SECURITY.md`;
- revisar `ARCHITECTURE.md`;
- adicionar vetores;
- testar Web;
- testar Android;
- documentar `cryptoVersion`;
- documentar `schemaVersion`.

---

## 20. Dependências

Antes de adicionar dependência:

- verificar necessidade;
- verificar solução existente;
- verificar manutenção;
- verificar licença;
- verificar vulnerabilidades;
- verificar tamanho;
- verificar compatibilidade;
- justificar no PR.

Dependência de segurança exige revisão adicional.

---

## 21. Interface

Mudanças visuais devem:

- seguir `TELAS.md`;
- seguir `STYLE_GUIDE.md`;
- possuir estados de loading;
- possuir erro;
- possuir estado vazio;
- possuir acessibilidade;
- possuir responsividade;
- possuir screenshots sanitizados;
- não exibir senhas.

---

## 22. Documentação

Atualize a documentação no mesmo PR.

Matriz de impacto:

| Mudança          | Documentos             |
| ---------------- | ---------------------- |
| Nova feature     | Escopo, Backlog, Telas |
| Novo endpoint    | API                    |
| Nova tabela      | Database               |
| Nova decisão     | Decisions + ADR        |
| Segurança        | Security               |
| Arquitetura      | Architecture           |
| Padrão de código | Style Guide            |
| Release          | Roadmap + Changelog    |
| Setup            | README + Contributing  |

---

## 23. Ambientes de deploy

Existem três ambientes isolados:

| GitHub Environment | Branch/tag           | Coolify              |
| ------------------ | -------------------- | -------------------- |
| `development`      | `develop`, `dev-*`   | `crypta-development` |
| `staging`          | `staging`, `v*-rc.*` | `crypta-staging`     |
| `production`       | `main`, `v*` estável | `crypta-production`  |

Cada ambiente deve possuir:

- Web própria;
- API própria;
- MySQL próprio;
- URLs próprias;
- secrets próprios;
- variáveis próprias;
- histórico de deployment.

Mudanças integradas devem ser validadas no ambiente correto quando afetarem:

- build;
- Dockerfile;
- imagem;
- GHCR;
- env;
- CORS;
- cookie;
- banco;
- migration;
- proxy;
- autenticação;
- API;
- Android backend.

### Development

Recebe automaticamente o HEAD de `develop`.

### Staging

Recebe somente uma release promovida e identificada por tag RC.

Correções devem entrar na branch `release/*`, nunca diretamente em `staging`.

### Production

Recebe uma tag estável após aprovação da RC.

Em release normal, deve promover os mesmos digests homologados, sem reconstrução.

A configuração manual está em `config_user.md`.

## 24. Observabilidade

Contribuições devem preservar:

- request ID;
- logs estruturados;
- redaction;
- health checks;
- métricas;
- auditoria.

Nunca adicionar log de body sensível para facilitar debug.

---

## 25. Performance

Otimizações devem incluir:

- medição;
- motivo;
- benchmark quando relevante;
- teste de regressão;
- impacto de memória;
- impacto em crypto.

Não reduzir parâmetros de segurança para melhorar desempenho sem decisão formal.

---

## 26. Acessibilidade

Contribuições de UI devem verificar:

- teclado;
- foco;
- contraste;
- leitor de tela;
- labels;
- mensagens;
- área de toque;
- não depender de cor.

---

## 27. Assistentes de IA

Contribuições geradas com IA devem ser revisadas integralmente.

A IA não deve:

- decidir arquitetura sem ADR;
- adicionar dependência sem análise;
- inventar endpoint;
- alterar crypto;
- inserir segredo;
- remover teste;
- reduzir validação;
- misturar escopo.

O autor continua responsável pelo código enviado.

---

## 28. Checklist antes do pull request

### Código

- [ ] Código segue `STYLE_GUIDE.md`.
- [ ] Não há `any` injustificado.
- [ ] Não há debug.
- [ ] Não há código morto.
- [ ] Erros são tratados.
- [ ] Autorização está no backend.

### Segurança

- [ ] Nenhum segredo.
- [ ] Nenhum dado real.
- [ ] Logs sanitizados.
- [ ] Storage revisado.
- [ ] Input validado.
- [ ] Falha fechada.
- [ ] IDOR testado.

### Testes

- [ ] Unitários.
- [ ] Integração.
- [ ] E2E quando necessário.
- [ ] MySQL real quando aplicável.
- [ ] Web/Android para crypto.

### Documentação

- [ ] Documentos atualizados.
- [ ] OpenAPI atualizado.
- [ ] ADR criado quando necessário.
- [ ] Backlog atualizado.
- [ ] Roadmap atualizado quando houver impacto.

### Build

- [ ] Lint passa.
- [ ] Typecheck passa.
- [ ] Testes passam.
- [ ] Build passa.
- [ ] Deploy no ambiente correspondente validado.

### Fluxo GitHub

- [ ] Origem e destino do PR são permitidos.
- [ ] Estratégia de merge está correta.
- [ ] Label de release notes foi aplicada.
- [ ] Milestone foi associado quando aplicável.
- [ ] `VERSION` foi alterado somente quando necessário.
- [ ] Branch `release/*` não será apagada antes da publicação.
- [ ] Produção não reconstruirá o artefato homologado.

---

## 29. Critérios de merge

O PR poderá ser integrado quando:

- revisão aprovada;
- CI aprovado;
- conflitos resolvidos;
- documentação atualizada;
- nenhum segredo detectado;
- testes suficientes;
- migration validada;
- impacto de segurança aceito;
- checklist concluído;
- combinação de branches aprovada pelo check de fluxo;
- promoção, quando aplicável, respeita a tag e o artefato imutável.

---

## 30. Releases

O fluxo oficial está em `GITHUB_RELEASE_FLOW.md`.

### 30.1 Versionamento

Usar Semantic Versioning:

```text
MAJOR.MINOR.PATCH
```

A raiz do repositório deve possuir o arquivo:

```text
VERSION
```

Ele contém somente a versão, sem prefixo `v`.

### 30.2 Release candidate

Uma release em homologação usa:

```text
Branch: release/0.4.0
Tag: v0.4.0-rc.1
GitHub Pre-release: v0.4.0-rc.1
Environment: staging
```

Cada nova promoção de `release/* → staging` cria a próxima RC.

### 30.3 Release estável

Após aprovação:

```text
staging → main
Tag: v0.4.0
GitHub Release: v0.4.0
Environment: production
```

### 30.4 Artefato imutável

Web e API devem ser construídas na RC e publicadas no GHCR.

Os digests aprovados devem ser registrados em:

```text
release-manifest.json
```

Produção deve utilizar os mesmos digests.

Não reconstruir uma release normal após a homologação.

### 30.5 GitHub Release

A release deve incluir:

- tag;
- notas geradas por labels;
- manifesto com imagens e digests;
- commit;
- migrations;
- instruções;
- riscos conhecidos;
- rollback;
- APK e hash quando o mobile fizer parte da versão.

### 30.6 Rollback

Rollback utiliza:

- tag estável anterior; ou
- digest de imagem anterior.

Nunca mover ou reutilizar uma tag publicada.

Após rollback:

1. registrar incidente;
2. criar `hotfix/*` a partir de `main`;
3. publicar nova versão PATCH.

### 30.7 Condição para produção

Somente após:

- RC aprovada;
- testes concluídos;
- migration validada em staging;
- backup disponível;
- rollback validado;
- gate de segurança;
- aprovação do Environment `production`, quando configurada.

## 31. Suporte e issues

Ao abrir bug, inclua:

- versão;
- ambiente;
- passos;
- resultado esperado;
- resultado atual;
- logs sanitizados;
- screenshot sem segredo;
- frequência.

Não inclua:

- senha;
- token;
- cookie;
- ciphertext completo;
- dado pessoal real.

---

## 32. Resumo

Uma boa contribuição para este projeto:

```text
resolve um problema claro
→ preserva segurança
→ segue arquitetura
→ inclui testes
→ atualiza documentação
→ funciona no ambiente real
→ não expõe segredos
```

A prioridade do projeto é construir um cofre pequeno, seguro e sustentável.
