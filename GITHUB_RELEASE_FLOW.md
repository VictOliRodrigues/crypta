# GITHUB_RELEASE_FLOW.md

# Crypta — Fluxo de Desenvolvimento, Homologação e Releases

> **Status:** Documento inicial para revisão  
> **Versão:** 0.1.0  
> **Última atualização:** 31 de julho de 2026  
> **Origem:** Adaptado do fluxo genérico de desenvolvimento, homologação e releases fornecido para o projeto.

---

## 1. Objetivo

Este documento define o fluxo oficial de branches, homologação, versionamento, releases, artefatos e deploys do Crypta.

O fluxo deve permitir que três estados existam simultaneamente:

| Estado                   | Fonte de verdade                           | Ambiente      |
| ------------------------ | ------------------------------------------ | ------------- |
| Desenvolvimento contínuo | HEAD de `develop`                          | `development` |
| Versão em homologação    | branch `release/x.y.z` + tag `vX.Y.Z-rc.N` | `staging`     |
| Versão publicada         | tag `vX.Y.Z` + GitHub Release              | `production`  |

A finalidade principal é impedir que funcionalidades novas entrem acidentalmente em uma versão que já está sendo homologada.

---

## 2. Relação com o roadmap

O roadmap utiliza nomes conceituais como:

```text
R0
R0.1
R0.2
R1.0
```

As tags Git seguem Semantic Versioning:

```text
v0.1.0
v0.2.0
v0.3.0
v1.0.0
```

A primeira versão oficialmente liberada para credenciais reais deverá ser representada pela tag:

```text
v1.0.0
```

Os nomes do roadmap não substituem o arquivo `VERSION` nem as tags Git.

---

## 3. Branches permanentes

```text
develop
staging
main
```

### `develop`

Representa o desenvolvimento contínuo.

Recebe:

- `feature/*`;
- `bugfix/*`;
- `chore/*`;
- `refactor/*`;
- `docs/*`;
- `security/*` quando a correção ainda não está publicada.

Deploy:

```text
development
```

### `staging`

Representa o conteúdo atualmente promovido para homologação.

Recebe apenas:

```text
release/* → staging
```

Deploy:

```text
staging
```

Cada promoção válida cria uma nova tag RC.

### `main`

Representa produção.

Recebe apenas:

```text
staging → main
hotfix/* → main
```

Deploy:

```text
production
```

---

## 4. Branches temporárias

### Funcionalidades

```text
feature/nome-da-funcionalidade
```

Fluxo:

```text
develop → feature/* → develop
```

### Bugs em desenvolvimento

```text
bugfix/nome-da-correcao
```

Fluxo:

```text
develop → bugfix/* → develop
```

### Tarefas técnicas

```text
chore/nome-da-tarefa
refactor/nome-da-refatoracao
docs/nome-da-documentacao
security/nome-da-correcao
```

Fluxo:

```text
develop → branch temporária → develop
```

### Atualizações de dependência

```text
dependabot/*
```

Fluxo:

```text
develop → dependabot/* → develop
```

A branch é criada pelo Dependabot, com prefixo fixo e não configurável. O destino é `develop`, definido por `target-branch` em `.github/dependabot.yml`.

O Dependabot apaga a própria branch depois do merge. Ela não entra no `cleanup-temporary-branches.yml`.

### Release em homologação

```text
release/x.y.z
```

A branch nasce de `develop` quando o escopo de uma versão estiver congelado.

Depois de criada:

- não recebe novas features;
- recebe somente correções da própria release;
- permanece até a publicação;
- não é apagada no primeiro merge para `staging`.

### Correção de homologação

```text
fix/nome-da-correcao
```

Fluxo:

```text
release/x.y.z → fix/* → release/x.y.z
```

Depois:

```text
release/x.y.z → staging
```

### Hotfix de produção

```text
hotfix/nome-da-correcao
```

Fluxo:

```text
main → hotfix/* → main
```

Após publicação:

```text
main → develop
```

Se existir release ativa:

```text
main → release/x.y.z
release/x.y.z → staging
```

O arquivo `VERSION` da release ativa deve continuar com a versão da release, não com a versão PATCH do hotfix.

---

## 5. Fluxo permitido

```text
feature/*  ─────────► develop
bugfix/*   ─────────► develop
chore/*    ─────────► develop
refactor/* ─────────► develop
docs/*     ─────────► develop
security/* ─────────► develop
dependabot/* ───────► develop

fix/*      ─────────► release/*
release/*  ─────────► staging
staging    ─────────► main
main       ─────────► develop

hotfix/*   ─────────► main
main       ─────────► release/*   somente quando houver release ativa
```

Qualquer outra combinação deve ser bloqueada por GitHub Actions.

---

## 6. Visão do ciclo completo

```text
feature/* ───────────────┐
bugfix/* ────────────────┼──► develop ──► ambiente development
chore/* ─────────────────┤
refactor/* ──────────────┤
docs/* ──────────────────┤
security/* ──────────────┘
                                 │
                                 │ iniciar release
                                 ▼
                          release/0.4.0
                                 │
                                 │ PR com merge commit
                                 ▼
                              staging
                                 │
                    tag v0.4.0-rc.1
                    GitHub Pre-release
                    deploy staging
                                 │
                        homologação e testes
                                 │
                 ┌───────────────┴───────────────┐
                 │                               │
              aprovado                        problema
                 │                               │
                 │                    fix/* → release/0.4.0
                 │                               │
                 │                    release/0.4.0 → staging
                 │                               │
                 │                    tag v0.4.0-rc.2
                 │                               │
                 └───────────────┬───────────────┘
                                 ▼
                         staging → main
                                 │
                         tag estável v0.4.0
                         GitHub Release
                         deploy production
                                 │
                          main → develop
                                 │
                       excluir release/0.4.0
```

---

## 7. Estratégia de merge

| Pull request           | Estratégia                                       |
| ---------------------- | ------------------------------------------------ |
| `feature/* → develop`  | Squash and merge                                 |
| `bugfix/* → develop`   | Squash and merge                                 |
| `chore/* → develop`    | Squash and merge                                 |
| `refactor/* → develop` | Squash and merge                                 |
| `docs/* → develop`     | Squash and merge                                 |
| `security/* → develop` | Squash and merge                                 |
| `fix/* → release/*`    | Squash and merge                                 |
| `release/* → staging`  | Create a merge commit                            |
| `staging → main`       | Create a merge commit                            |
| `main → develop`       | Create a merge commit                            |
| `main → release/*`     | Create a merge commit                            |
| `hotfix/* → main`      | Squash and merge ou merge commit conforme o caso |

Não habilitar a exigência de histórico linear, porque as promoções entre branches permanentes usam merge commits.

---

## 8. Versionamento

O projeto usará Semantic Versioning:

```text
MAJOR.MINOR.PATCH
```

| Alteração                 | Incremento | Exemplo         |
| ------------------------- | ---------- | --------------- |
| Correção compatível       | PATCH      | `0.4.0 → 0.4.1` |
| Funcionalidade compatível | MINOR      | `0.4.1 → 0.5.0` |
| Mudança incompatível      | MAJOR      | `1.4.0 → 2.0.0` |

### Nomes

```text
Branch: release/0.4.0
RC 1:   v0.4.0-rc.1
RC 2:   v0.4.0-rc.2
Estável: v0.4.0
```

O prefixo `v` é usado apenas nas tags e releases, nunca no arquivo `VERSION` nem no nome da branch.

---

## 9. Arquivo `VERSION`

A raiz do repositório deverá possuir:

```text
VERSION
```

Conteúdo inicial sugerido:

```text
0.1.0
```

Regras:

- conter somente `MAJOR.MINOR.PATCH`;
- não possuir prefixo `v`;
- ser atualizado ao iniciar uma release;
- ser atualizado em hotfix;
- ser validado por workflow;
- ser incluído nos metadados de build.

---

## 10. Ambientes

O fluxo exige três ambientes separados.

### Development

```text
Git branch: develop
GitHub Environment: development
Coolify project: crypta-development
Image tags móveis: development
```

Objetivo:

- integração contínua;
- validação de mudanças recentes;
- não representa versão congelada.

### Staging

```text
Git branch: staging
GitHub Environment: staging
Coolify project: crypta-staging
Image tags imutáveis: vX.Y.Z-rc.N
Image tags móveis: staging
```

Objetivo:

- homologar uma versão específica;
- continuar independente de `develop`;
- registrar exatamente qual RC está implantada.

### Production

```text
Git branch: main
GitHub Environment: production
Coolify project: crypta-production
Image tags imutáveis: vX.Y.Z
Image tags móveis: production
```

Objetivo:

- executar somente versões estáveis;
- permitir rollback para tag ou digest anterior.

### Bancos

Cada ambiente deve possuir banco próprio:

```text
mysql-development
mysql-staging
mysql-production
```

Nunca compartilhar banco entre ambientes.

---

## 11. Artefatos oficiais

O projeto gera dois artefatos de servidor:

```text
Web Docker image
API Docker image
```

Nomes sugeridos no GHCR:

```text
ghcr.io/<owner>/<repository>-web
ghcr.io/<owner>/<repository>-api
```

A partir da release Android, também haverá:

```text
APK assinado
```

### Tags de desenvolvimento

```text
development
dev-<commit-sha>
```

### Tags de homologação

```text
v0.4.0-rc.1
staging
```

As duas tags devem apontar para o mesmo digest.

### Tags de produção

```text
v0.4.0
production
```

As duas tags devem apontar para o mesmo digest já homologado.

---

## 12. Regra de build único

Para uma release normal:

1. construir Web e API uma vez ao criar a RC;
2. publicar imagens imutáveis com a tag RC;
3. registrar os digests em `release-manifest.json`;
4. homologar esses digests;
5. promover os mesmos digests para as tags estável e `production`;
6. não executar novo build para produção.

Exemplo:

```text
web:v0.4.0-rc.2 ──────┐
web:v0.4.0 ───────────┼── sha256:abc123
web:production ───────┘

api:v0.4.0-rc.2 ──────┐
api:v0.4.0 ───────────┼── sha256:def456
api:production ───────┘
```

O manifesto deverá conter:

```json
{
  "version": "0.4.0",
  "releaseCandidate": "v0.4.0-rc.2",
  "commit": "b85c091",
  "web": {
    "image": "ghcr.io/example/crypta-web",
    "digest": "sha256:abc123"
  },
  "api": {
    "image": "ghcr.io/example/crypta-api",
    "digest": "sha256:def456"
  },
  "builtAt": "2026-07-31T17:00:00Z"
}
```

---

## 13. Endpoint de versão

A API deverá expor:

```http
GET /api/v1/version
```

Resposta sugerida:

```json
{
  "data": {
    "version": "0.4.0-rc.2",
    "commit": "b85c091",
    "environment": "staging",
    "builtAt": "2026-07-31T17:00:00Z"
  }
}
```

A Web deverá exibir esses dados em uma tela de diagnóstico ou rodapé técnico.

Os valores devem ser inseridos no build por variáveis:

```text
APP_VERSION
APP_COMMIT
APP_ENVIRONMENT
APP_BUILT_AT
```

---

## 14. Milestones e labels

### Milestones

Criar um milestone para cada versão planejada:

```text
0.1.0
0.2.0
0.3.0
1.0.0
```

### Labels de release notes

```text
feature
bug
fix
security
performance
documentation
breaking-change
dependencies
release
skip-changelog
```

PRs devem receber labels consistentes para geração automática das notas.

A label `release` é obrigatória, não apenas convencional: `start-release.yml` a aplica ao pull
request que abre com `gh pr create --label "release"`. Se ela não existir no repositório, o passo
falha **depois** de a branch `release/x.y.z` já ter sido criada e enviada, deixando uma branch
órfã que precisa ser removida à mão.

---

# AUTOMAÇÕES DO GITHUB

---

## 15. Arquivos previstos

```text
.github/
├── release.yml
└── workflows/
    ├── ci.yml
    ├── validate-pr-flow.yml
    ├── cleanup-temporary-branches.yml
    ├── start-release.yml
    ├── deploy-development.yml
    ├── publish-prerelease.yml
    └── publish-production.yml
```

Os workflows devem usar permissões mínimas por job.

---

## 16. CI comum

Arquivo:

```text
.github/workflows/ci.yml
```

```yaml
name: CI

on:
  pull_request:
  push:
    branches:
      - develop
      - staging
      - main
      - 'release/**'

permissions:
  contents: read

concurrency:
  group: ci-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  validate:
    name: Lint, tipos, testes e builds
    runs-on: ubuntu-latest

    steps:
      - name: Baixar código
        uses: actions/checkout@v6
        with:
          # Este job não executa nenhuma operação git depois do checkout, mas
          # roda `pnpm install`, que executa scripts de instalação de terceiros
          # (ver `allowBuilds` em pnpm-workspace.yaml). Sem isto, o token do job
          # fica legível no filesystem do runner durante essa janela.
          persist-credentials: false

      - name: Configurar pnpm
        uses: pnpm/action-setup@v4
        with:
          run_install: false

      - name: Configurar Node
        uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: pnpm

      - name: Instalar dependências
        run: pnpm install --frozen-lockfile

      # Precisa vir antes de typecheck e testes: as aplicações consomem os
      # packages compartilhados pelo `dist` publicado no workspace, não pelo
      # código-fonte. Em um clone limpo esse `dist` não existe, e tanto o
      # typecheck quanto os testes da API falhariam por módulo não encontrado.
      - name: Construir packages compartilhados
        run: pnpm build:packages

      - name: Validar formatação
        run: pnpm format:check

      - name: Executar lint
        run: pnpm lint

      - name: Validar tipos
        run: pnpm typecheck

      - name: Executar testes
        run: pnpm test

      - name: Construir aplicações
        run: pnpm build

      # O schema é a fonte das migrations; um schema inválido só apareceria no
      # deploy, quando `prisma migrate deploy` roda.
      - name: Validar schema do Prisma
        run: pnpm --filter @crypta/api run prisma:validate

  audit:
    name: Auditoria de dependências
    runs-on: ubuntu-latest

    steps:
      - name: Baixar código
        uses: actions/checkout@v6
        with:
          # Este job não executa nenhuma operação git depois do checkout, mas
          # roda `pnpm install`, que executa scripts de instalação de terceiros
          # (ver `allowBuilds` em pnpm-workspace.yaml). Sem isto, o token do job
          # fica legível no filesystem do runner durante essa janela.
          persist-credentials: false

      - name: Configurar pnpm
        uses: pnpm/action-setup@v4
        with:
          run_install: false

      - name: Configurar Node
        uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: pnpm

      - name: Instalar dependências
        run: pnpm install --frozen-lockfile

      # Este projeto armazena credenciais: uma vulnerabilidade alta em
      # dependência bloqueia o merge (ROADMAP.md secao 42).
      - name: Auditar vulnerabilidades
        run: pnpm audit --audit-level high
# Os testes de integração com MySQL entram como job separado quando o primeiro
# schema existir (R0.2).
```

Os testes de integração com MySQL poderão ser adicionados como job separado quando a infraestrutura estiver pronta.

---

## 17. Validar origem e destino dos PRs

Arquivo:

```text
.github/workflows/validate-pr-flow.yml
```

```yaml
name: Validar fluxo de branches

on:
  pull_request:
    types: [opened, reopened, synchronize, edited]

permissions:
  contents: read

jobs:
  validate:
    name: Validar origem e destino
    runs-on: ubuntu-latest

    steps:
      - name: Verificar combinação de branches
        shell: bash
        env:
          HEAD_BRANCH: ${{ github.head_ref }}
          BASE_BRANCH: ${{ github.base_ref }}
        run: |
          set -euo pipefail

          FLOW="${HEAD_BRANCH}:${BASE_BRANCH}"

          case "$FLOW" in
            feature/*:develop|\
            bugfix/*:develop|\
            chore/*:develop|\
            refactor/*:develop|\
            docs/*:develop|\
            security/*:develop)
              echo "Fluxo de desenvolvimento válido: $FLOW"
              ;;

            fix/*:release/*)
              echo "Correção válida para release: $FLOW"
              ;;

            release/*:staging)
              echo "Promoção válida para homologação: $FLOW"
              ;;

            staging:main)
              echo "Promoção válida para produção: $FLOW"
              ;;

            main:develop)
              echo "Sincronização válida: $FLOW"
              ;;

            hotfix/*:main)
              echo "Hotfix válido: $FLOW"
              ;;

            main:release/*)
              echo "Sincronização de hotfix com release válida: $FLOW"
              ;;

            *)
              echo "::error::Fluxo inválido: $FLOW"
              echo "::error::Consulte GITHUB_RELEASE_FLOW.md"
              exit 1
              ;;
          esac
```

O check `Validar origem e destino` deve ser obrigatório nos rulesets.

---

## 18. Limpeza seletiva de branches

Arquivo:

```text
.github/workflows/cleanup-temporary-branches.yml
```

```yaml
name: Excluir branch temporária

on:
  pull_request:
    types: [closed]

permissions:
  contents: write

jobs:
  delete-branch:
    name: Excluir branch integrada
    if: >
      github.event.pull_request.merged == true &&
      github.event.pull_request.head.repo.full_name == github.repository &&
      (
        startsWith(github.event.pull_request.head.ref, 'feature/') ||
        startsWith(github.event.pull_request.head.ref, 'bugfix/') ||
        startsWith(github.event.pull_request.head.ref, 'fix/') ||
        startsWith(github.event.pull_request.head.ref, 'chore/') ||
        startsWith(github.event.pull_request.head.ref, 'refactor/') ||
        startsWith(github.event.pull_request.head.ref, 'docs/') ||
        startsWith(github.event.pull_request.head.ref, 'security/') ||
        startsWith(github.event.pull_request.head.ref, 'hotfix/')
      )
    runs-on: ubuntu-latest

    steps:
      - name: Excluir referência
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          HEAD_BRANCH: ${{ github.event.pull_request.head.ref }}
        run: |
          set -euo pipefail

          gh api \
            --method DELETE \
            "repos/${GITHUB_REPOSITORY}/git/refs/heads/${HEAD_BRANCH}"
```

Este workflow não exclui:

```text
develop
staging
main
release/*
```

A exclusão automática nativa de branches do GitHub deve permanecer desabilitada.

As branches `dependabot/*` também não entram na lista: o próprio Dependabot as apaga depois do merge.

### Proteção de `release/*` pelos rulesets

O workflow acima é apenas metade da proteção — ele deixa de apagar, mas não impede que alguém apague. A outra metade é o ruleset `Release branches`, com target `release/*`:

```text
Restrict deletions
Block force pushes
Require status checks           os mesmos três das branches permanentes
Do not require status checks on creation
```

**`Require a pull request` não é ativado neste alvo, deliberadamente.**

`start-release.yml` cria a branch `release/x.y.z` e empurra nela o commit do `VERSION` usando o `GITHUB_TOKEN`. Exigir pull request bloquearia esse push, e não existe forma limpa de liberar a automação: a bypass list de um ruleset aceita administradores, papéis `maintain` e `write`, times, GitHub Apps e o Dependabot, mas o `GITHUB_TOKEN` executa como `github-actions[bot]`, que não é ator elegível. Um bypass por papel de administrador não alcança o token do workflow.

As saídas restantes seriam guardar um PAT ou um GitHub App em secret — superfície de ataque adicional num repositório de cofre de senhas — ou reescrever o workflow para não empurrar direto, o que não é possível, já que criar uma branch é um push por definição.

O que a secao 3 e o `CLAUDE.md` secao 64 exigem de `release/*` é que ela sobreviva à homologação inteira e que a RC não seja reescrita. `Restrict deletions` e `Block force pushes` entregam as duas coisas. A disciplina de que correções entrem por `fix/* → release/*` continua garantida pelo `validate-pr-flow.yml` da secao 17, que reprova qualquer outra origem.

`Do not require status checks on creation` acompanha obrigatoriamente o `Require status checks`: o commit do `VERSION` nasce sem check algum, e sem essa opção a criação da branch pode ser barrada.

O ruleset precisa ser criado em `New branch ruleset`. Criado como ruleset de tag com o mesmo padrão, ele fica ativo, aparece verde na interface e não protege coisa alguma.

---

## 19. Iniciar release

Arquivo:

```text
.github/workflows/start-release.yml
```

```yaml
name: Iniciar release

on:
  workflow_dispatch:
    inputs:
      version:
        description: Versão sem prefixo v, por exemplo 0.4.0
        required: true
        type: string

permissions:
  contents: write
  pull-requests: write

jobs:
  create-release:
    name: Criar branch e PR de release
    runs-on: ubuntu-latest

    steps:
      - name: Baixar develop
        uses: actions/checkout@v6
        with:
          ref: develop
          fetch-depth: 0

      - name: Validar versão
        shell: bash
        env:
          VERSION_INPUT: ${{ inputs.version }}
        run: |
          set -euo pipefail

          if [[ ! "$VERSION_INPUT" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            echo "::error::Use MAJOR.MINOR.PATCH, por exemplo 0.4.0"
            exit 1
          fi

          if git rev-parse "refs/tags/v${VERSION_INPUT}" >/dev/null 2>&1; then
            echo "::error::A tag v${VERSION_INPUT} já existe"
            exit 1
          fi

      - name: Criar branch e atualizar VERSION
        shell: bash
        env:
          VERSION_INPUT: ${{ inputs.version }}
        run: |
          set -euo pipefail

          BRANCH="release/${VERSION_INPUT}"

          if git ls-remote --exit-code --heads origin "$BRANCH" >/dev/null 2>&1; then
            echo "::error::A branch $BRANCH já existe"
            exit 1
          fi

          git switch -c "$BRANCH"
          printf '%s\n' "$VERSION_INPUT" > VERSION

          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

          git add VERSION
          git commit -m "chore(release): iniciar v${VERSION_INPUT}"
          git push origin "$BRANCH"

      - name: Abrir PR para staging
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          VERSION_INPUT: ${{ inputs.version }}
        run: |
          set -euo pipefail

          gh pr create \
            --base staging \
            --head "release/${VERSION_INPUT}" \
            --title "release: v${VERSION_INPUT}" \
            --label "release" \
            --milestone "${VERSION_INPUT}" \
            --body "Promove a release v${VERSION_INPUT} para homologação. Não apague a branch release/${VERSION_INPUT} durante os testes."
```

O milestone deve existir antes da execução. Caso ainda não exista, o parâmetro `--milestone` deverá ser removido ou o workflow deverá criá-lo.

---

## 20. Deploy contínuo de desenvolvimento

Arquivo:

```text
.github/workflows/deploy-development.yml
```

```yaml
name: Deploy de desenvolvimento

on:
  push:
    branches: [develop]

permissions:
  contents: read
  packages: write

concurrency:
  group: deploy-development
  cancel-in-progress: true

env:
  REGISTRY: ghcr.io
  WEB_IMAGE: ${{ vars.WEB_IMAGE }}
  API_IMAGE: ${{ vars.API_IMAGE }}

jobs:
  build-and-deploy:
    name: Construir e implantar development
    runs-on: ubuntu-latest

    # Pulado enquanto as repository variables não existirem, para não deixar a
    # branch padrão com um run vermelho permanente antes da R0.1.
    if: vars.WEB_IMAGE != '' && vars.API_IMAGE != ''

    environment:
      name: development
      url: ${{ vars.APP_URL }}

    steps:
      - name: Baixar código
        uses: actions/checkout@v6
        with:
          persist-credentials: false

      - name: Configurar pnpm
        uses: pnpm/action-setup@v4

      - name: Configurar Node
        uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: pnpm

      - name: Instalar dependências
        run: pnpm install --frozen-lockfile

      # `pnpm verify` em vez da lista de passos. O script começa por
      # `build:packages`, e lint e typecheck dependem das declarações de tipo
      # que ele gera: sem elas, os imports de `@crypta/contracts` resolvem
      # como `any` e as regras type-aware do ESLint reprovam código correto.
      #
      # Enumerar os passos aqui já custou um deploy — a lista foi copiada do
      # `verify` sem o primeiro item, e o run reportou 23 erros de tipo não
      # resolvido. Chamar o script mantém uma única definição do que é validar.
      - name: Validar projeto
        run: pnpm verify

      - name: Calcular metadados do build
        id: meta
        shell: bash
        run: |
          set -euo pipefail

          {
            echo "version=$(cat VERSION)-dev"
            echo "commit=${GITHUB_SHA::7}"
            echo "built_at=$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"
          } >> "$GITHUB_OUTPUT"

      - name: Login no GHCR
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Configurar Buildx
        uses: docker/setup-buildx-action@v3

      - name: Construir Web
        uses: docker/build-push-action@v6
        with:
          context: .
          file: apps/web/Dockerfile
          push: true
          tags: |
            ${{ env.WEB_IMAGE }}:development
            ${{ env.WEB_IMAGE }}:dev-${{ github.sha }}
          build-args: |
            VITE_API_BASE_URL=${{ vars.API_BASE_URL }}
            VITE_APP_ENVIRONMENT=development
            VITE_APP_VERSION=${{ steps.meta.outputs.version }}
            VITE_APP_COMMIT=${{ steps.meta.outputs.commit }}
            APP_BUILT_AT=${{ steps.meta.outputs.built_at }}

      - name: Construir API
        uses: docker/build-push-action@v6
        with:
          context: .
          file: apps/api/Dockerfile
          push: true
          tags: |
            ${{ env.API_IMAGE }}:development
            ${{ env.API_IMAGE }}:dev-${{ github.sha }}
          build-args: |
            APP_VERSION=${{ steps.meta.outputs.version }}
            APP_COMMIT=${{ steps.meta.outputs.commit }}
            APP_ENVIRONMENT=development
            APP_BUILT_AT=${{ steps.meta.outputs.built_at }}

      - name: Implantar Web no Coolify
        run: |
          curl --fail-with-body --request GET "${{ secrets.COOLIFY_WEBHOOK_WEB }}" \
            --header "Authorization: Bearer ${{ secrets.COOLIFY_TOKEN }}"

      - name: Implantar API no Coolify
        run: |
          curl --fail-with-body --request GET "${{ secrets.COOLIFY_WEBHOOK_API }}" \
            --header "Authorization: Bearer ${{ secrets.COOLIFY_TOKEN }}"
```

---

## 21. Publicar release candidate

Arquivo:

```text
.github/workflows/publish-prerelease.yml
```

O workflow deverá:

1. executar após merge de `release/* → staging`;
2. validar o arquivo `VERSION`;
3. calcular a próxima RC;
4. executar testes;
5. construir Web e API;
6. publicar imagens no GHCR;
7. registrar digests;
8. criar tag RC;
9. criar GitHub Pre-release;
10. anexar `release-manifest.json`;
11. implantar no Environment `staging`.

Modelo:

```yaml
name: Publicar release candidate

on:
  pull_request:
    branches: [staging]
    types: [closed]

permissions:
  contents: write
  packages: write

concurrency:
  group: publish-staging
  cancel-in-progress: false

env:
  REGISTRY: ghcr.io
  WEB_IMAGE: ${{ vars.WEB_IMAGE }}
  API_IMAGE: ${{ vars.API_IMAGE }}

jobs:
  publish:
    name: Construir e publicar RC
    if: >
      github.event.pull_request.merged == true &&
      startsWith(github.event.pull_request.head.ref, 'release/')
    runs-on: ubuntu-latest

    outputs:
      tag: ${{ steps.rc.outputs.tag }}
      web_digest: ${{ steps.web.outputs.digest }}
      api_digest: ${{ steps.api.outputs.digest }}

    steps:
      - name: Baixar commit homologado
        uses: actions/checkout@v6
        with:
          ref: ${{ github.event.pull_request.merge_commit_sha }}
          fetch-depth: 0

      - name: Calcular próxima RC
        id: rc
        shell: bash
        run: |
          set -euo pipefail

          VERSION="$(tr -d '[:space:]' < VERSION)"

          if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            echo "::error::Versão inválida: $VERSION"
            exit 1
          fi

          git fetch --tags --force

          LAST_RC="$(
            git tag --list "v${VERSION}-rc.*" |
            sed -nE "s/^v${VERSION}-rc\.([0-9]+)$/\1/p" |
            sort -n |
            tail -1
          )"

          NEXT_RC="$(( ${LAST_RC:-0} + 1 ))"
          TAG="v${VERSION}-rc.${NEXT_RC}"

          echo "version=$VERSION" >> "$GITHUB_OUTPUT"
          echo "tag=$TAG" >> "$GITHUB_OUTPUT"

      - name: Configurar pnpm
        uses: pnpm/action-setup@v4

      - name: Configurar Node
        uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: pnpm

      - name: Instalar e validar
        run: |
          pnpm install --frozen-lockfile
          pnpm format:check
          pnpm lint
          pnpm typecheck
          pnpm test
          pnpm build

      - name: Login no GHCR
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Configurar Buildx
        uses: docker/setup-buildx-action@v3

      - name: Construir e publicar Web
        id: web
        uses: docker/build-push-action@v6
        with:
          context: .
          file: apps/web/Dockerfile
          push: true
          tags: |
            ${{ env.WEB_IMAGE }}:${{ steps.rc.outputs.tag }}
            ${{ env.WEB_IMAGE }}:staging
          build-args: |
            APP_VERSION=${{ steps.rc.outputs.tag }}
            APP_COMMIT=${{ github.event.pull_request.merge_commit_sha }}
            APP_ENVIRONMENT=staging

      - name: Construir e publicar API
        id: api
        uses: docker/build-push-action@v6
        with:
          context: .
          file: apps/api/Dockerfile
          push: true
          tags: |
            ${{ env.API_IMAGE }}:${{ steps.rc.outputs.tag }}
            ${{ env.API_IMAGE }}:staging
          build-args: |
            APP_VERSION=${{ steps.rc.outputs.tag }}
            APP_COMMIT=${{ github.event.pull_request.merge_commit_sha }}
            APP_ENVIRONMENT=staging

      - name: Criar manifesto
        env:
          TAG: ${{ steps.rc.outputs.tag }}
          VERSION: ${{ steps.rc.outputs.version }}
          WEB_DIGEST: ${{ steps.web.outputs.digest }}
          API_DIGEST: ${{ steps.api.outputs.digest }}
        run: |
          cat > release-manifest.json <<JSON
          {
            "version": "${VERSION}",
            "releaseCandidate": "${TAG}",
            "commit": "${{ github.event.pull_request.merge_commit_sha }}",
            "web": {
              "image": "${WEB_IMAGE}",
              "digest": "${WEB_DIGEST}"
            },
            "api": {
              "image": "${API_IMAGE}",
              "digest": "${API_DIGEST}"
            },
            "builtAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
          }
          JSON

      - name: Criar tag RC
        env:
          TAG: ${{ steps.rc.outputs.tag }}
          MERGE_SHA: ${{ github.event.pull_request.merge_commit_sha }}
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git tag -a "$TAG" "$MERGE_SHA" -m "Release candidate $TAG"
          git push origin "$TAG"

      - name: Criar GitHub Pre-release
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          TAG: ${{ steps.rc.outputs.tag }}
        run: |
          gh release create "$TAG" \
            release-manifest.json \
            --verify-tag \
            --prerelease \
            --generate-notes \
            --title "$TAG"

  deploy:
    name: Implantar RC em staging
    needs: publish
    runs-on: ubuntu-latest
    environment:
      name: staging
      url: ${{ vars.APP_URL }}

    steps:
      - name: Implantar Web
        run: |
          curl --fail-with-body --request GET "${{ secrets.COOLIFY_WEBHOOK_WEB }}" \
            --header "Authorization: Bearer ${{ secrets.COOLIFY_TOKEN }}"

      - name: Implantar API
        run: |
          curl --fail-with-body --request GET "${{ secrets.COOLIFY_WEBHOOK_API }}" \
            --header "Authorization: Bearer ${{ secrets.COOLIFY_TOKEN }}"
```

O workflow final deverá validar que o Coolify realmente puxou o digest esperado.

---

## 22. Publicar produção

Arquivo:

```text
.github/workflows/publish-production.yml
```

### Release normal

Quando o PR for:

```text
staging → main
```

O workflow deverá:

1. ler `VERSION`;
2. localizar a RC mais recente da versão que esteja contida no commit promovido;
3. baixar `release-manifest.json` da pre-release;
4. promover os mesmos digests para `vX.Y.Z` e `production`;
5. criar tag estável;
6. criar GitHub Release;
7. implantar no Environment `production`;
8. abrir PR `main → develop`.

### Hotfix

Quando o PR for:

```text
hotfix/* → main
```

O workflow deverá:

1. validar a nova versão PATCH no arquivo `VERSION`;
2. executar todos os testes;
3. construir uma única vez os artefatos do hotfix;
4. publicar tags estável e `production`;
5. criar GitHub Release;
6. implantar;
7. abrir PR `main → develop`;
8. lembrar a sincronização com a release ativa, caso exista.

### Promoção por digest

Exemplo conceitual:

```bash
docker buildx imagetools create \
  --tag "${WEB_IMAGE}:v${VERSION}" \
  --tag "${WEB_IMAGE}:production" \
  "${WEB_IMAGE}@${WEB_DIGEST}"

docker buildx imagetools create \
  --tag "${API_IMAGE}:v${VERSION}" \
  --tag "${API_IMAGE}:production" \
  "${API_IMAGE}@${API_DIGEST}"
```

Não reconstruir uma release normal em produção.

---

## 23. Configuração das release notes

Arquivo:

```text
.github/release.yml
```

```yaml
changelog:
  exclude:
    labels:
      - skip-changelog
    authors:
      - dependabot

  categories:
    - title: Mudanças incompatíveis
      labels:
        - breaking-change

    - title: Novas funcionalidades
      labels:
        - feature
        - enhancement

    - title: Correções
      labels:
        - bug
        - fix

    - title: Segurança
      labels:
        - security

    - title: Desempenho
      labels:
        - performance

    - title: Dependências
      labels:
        - dependencies

    - title: Documentação
      labels:
        - documentation

    - title: Outras alterações
      labels:
        - '*'
```

---

# OPERAÇÃO

---

## 24. Criar uma feature

```bash
git switch develop
git pull --ff-only
git switch -c feature/create-vault
```

Após desenvolver:

```bash
git add .
git commit -m "feat(vaults): add encrypted vault creation"
git push -u origin feature/create-vault
```

Abrir:

```text
feature/create-vault → develop
```

Usar Squash and merge.

---

## 25. Iniciar uma release

Preferência: executar o workflow manual `Iniciar release`.

Alternativa manual:

```bash
git switch develop
git pull --ff-only
git switch -c release/0.4.0
printf '0.4.0\n' > VERSION
git add VERSION
git commit -m "chore(release): iniciar v0.4.0"
git push -u origin release/0.4.0
```

Abrir:

```text
release/0.4.0 → staging
```

Usar Create a merge commit.

---

## 26. Corrigir homologação

```bash
git switch release/0.4.0
git pull --ff-only
git switch -c fix/credential-copy
```

Abrir:

```text
fix/credential-copy → release/0.4.0
```

Depois:

```text
release/0.4.0 → staging
```

Uma nova RC será criada.

---

## 27. Aprovar produção

Antes do PR:

- confirmar a tag RC aprovada;
- confirmar Web e API por versão e commit;
- validar migrations;
- validar rollback;
- validar backup;
- aprovar checklist de segurança.

Abrir:

```text
staging → main
```

Usar Create a merge commit.

Após publicação:

```text
main → develop
```

Usar Create a merge commit.

Somente depois excluir:

```text
release/0.4.0
```

---

## 28. Hotfix

```bash
git switch main
git pull --ff-only
git switch -c hotfix/session-reuse
```

Atualizar:

```text
VERSION
```

Exemplo:

```text
0.4.0 → 0.4.1
```

Abrir:

```text
hotfix/session-reuse → main
```

Depois:

```text
main → develop
```

Se houver `release/0.5.0` ativa:

```text
main → release/0.5.0
```

Resolver o conflito do `VERSION` preservando `0.5.0` na release.

---

## 29. Rollback

Rollback deve usar tag ou digest imutável.

Exemplo:

```text
Produção atual: v0.4.0
Rollback: v0.3.2
```

Para containers:

```text
ghcr.io/<owner>/<repository>-web@sha256:...
ghcr.io/<owner>/<repository>-api@sha256:...
```

Nunca mover uma tag já publicada.

Depois do rollback:

1. registrar incidente;
2. criar `hotfix/*` de `main`;
3. publicar nova versão PATCH;
4. não reutilizar tag defeituosa.

---

## 30. Migrations de banco

Migrations fazem parte da release, mas não são artefatos independentes.

Regras:

- migration testada em development;
- migration testada em staging;
- backup antes de migration destrutiva;
- `prisma migrate deploy` em ambiente implantado;
- compatibilidade entre aplicação antiga e migration quando necessário;
- rollback documentado;
- produção não deve executar `prisma db push`.

`prisma migrate deploy` roda no entrypoint do container da API, a cada partida, antes de o processo aceitar tráfego (ADR 0015). Nenhum passo de workflow executa migration: o banco de cada ambiente fica em rede privada e o runner não o alcança.

Consequências para a release:

- migration e código sobem no mesmo artefato, e a promoção por digest carrega os dois juntos;
- migration que falha impede a subida da versão nova, e o ambiente permanece na anterior;
- rollback por digest devolve o código, não o schema.

A aprovação da RC deve incluir a validação da migration no banco de staging.

---

## 31. Android APK

A partir da release Android:

- o APK release deve ser construído na criação da RC;
- deve ser assinado fora do repositório;
- deve ser anexado à GitHub Pre-release;
- homologação deve usar exatamente esse APK;
- a GitHub Release estável deve reutilizar o mesmo APK;
- não reconstruir o APK depois da aprovação;
- publicar hash SHA-256.

Secrets de assinatura devem existir apenas no Environment apropriado ou em mecanismo externo seguro.

---

## 32. Regras de segurança do pipeline

- permissões mínimas por workflow;
- secrets por Environment;
- nenhum secret em variável pública;
- nenhum secret em build argument persistido na imagem;
- nenhuma imagem deve conter `.env`;
- produção deve exigir aprovação quando disponível;
- tags estáveis e RCs são imutáveis;
- branch `release/*` não é excluída automaticamente;
- logs de Actions não devem imprimir webhooks ou tokens;
- ações de terceiros devem ser fixadas em major revisado ou commit quando exigido pela política.

---

## 33. Fonte de verdade operacional

### Development

```text
Branch: develop
Commit: HEAD de develop
Imagem: development + dev-<sha>
Environment: development
```

### Staging

```text
Branch de origem: release/x.y.z
Branch implantada: staging
Tag: vX.Y.Z-rc.N
Manifesto: release-manifest.json
Environment: staging
```

### Production

```text
Branch: main
Tag: vX.Y.Z
GitHub Release: vX.Y.Z
Manifesto: release-manifest.json
Environment: production
```

---

## 34. Checklist de início

- [ ] Criar `develop`.
- [ ] Criar `staging`.
- [ ] Manter `main` como produção.
- [ ] Definir `develop` como default branch.
- [ ] Criar `VERSION`.
- [ ] Criar Environments.
- [ ] Criar variables e secrets.
- [ ] Criar labels.
- [ ] Criar milestone inicial.
- [ ] Adicionar workflows.
- [ ] Executar CI pela primeira vez.
- [ ] Configurar rulesets com os checks reais.
- [ ] Configurar GHCR.
- [ ] Configurar Coolify.
- [ ] Testar release fictícia.
- [ ] Testar rollback fictício.

A configuração manual detalhada está em `config_user.md`.

---

## 35. Erros proibidos

### Usar `develop` como staging

Isso impede a continuidade do desenvolvimento durante homologação.

### Corrigir diretamente em `staging`

A correção deve entrar em `release/*`.

### Apagar `release/*` após a primeira RC

A branch ainda será necessária para correções.

### Publicar sem tag

Impede rastrear exatamente o commit implantado.

### Reconstruir para produção

Pode gerar artefato diferente do homologado.

### Esquecer `main → develop`

Pode fazer correções desaparecerem em versões futuras.

### Mover uma tag

Tags publicadas são imutáveis.

### Compartilhar banco entre ambientes

Pode provocar perda, vazamento e migrations conflitantes.

---

## 36. Arquivos dependentes deste fluxo

Devem ser mantidos alinhados:

- `README.md`;
- `CONTRIBUTING.md`;
- `CLAUDE.md`;
- `STYLE_GUIDE.md`;
- `ARCHITECTURE.md`;
- `SECURITY.md`;
- `ROADMAP.md`;
- `BACKLOG.md`;
- `DECISIONS.md`;
- `API.md`;
- `config_user.md`;
- `.github/workflows/*`;
- `.github/release.yml`;
- `VERSION`.

---

## 37. Referências oficiais

- GitHub Actions: <https://docs.github.com/actions>
- GitHub Environments: <https://docs.github.com/actions/reference/workflows-and-actions/deployments-and-environments>
- GitHub Rulesets: <https://docs.github.com/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets>
- GitHub Releases: <https://docs.github.com/repositories/releasing-projects-on-github>
- GitHub Release Notes: <https://docs.github.com/repositories/releasing-projects-on-github/automatically-generated-release-notes>
- Coolify GitHub Actions: <https://coolify.io/docs/applications/ci-cd/github/actions/>
- Semantic Versioning: <https://semver.org/>
