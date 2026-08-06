# Crypta

Cofre de senhas multiusuário, self-hosted, com aplicação Web, aplicativo Android e backend centralizado.

O produto permite criar cofres privados e compartilhados, organizar sites e armazenar várias credenciais por site. O conteúdo sensível é criptografado no cliente antes de ser enviado à API.

> **Status:** R0 — fundação técnica implementada, sem funcionalidades de produto  
> **Versão da documentação:** 0.2.1  
> **Última atualização:** 5 de agosto de 2026

> **Aviso:** este sistema ainda não deve armazenar credenciais reais. Ver [Gate para credenciais reais](#gate-para-credenciais-reais).

---

## Visão geral

A estrutura principal do produto é:

```text
Usuário
└── Cofre privado ou compartilhado
    └── Site
        └── Uma ou mais credenciais
```

Cada site possui:

- nome obrigatório;
- link opcional;
- uma ou mais credenciais.

Cada credencial possui:

- usuário;
- senha;
- observação opcional.

O sistema será disponibilizado inicialmente em:

- aplicação Web;
- aplicativo Android distribuído por APK.

A extensão de navegador e o preenchimento automático no Android ficarão para versões futuras.

---

## Objetivos

O projeto prioriza:

1. segurança;
2. isolamento entre usuários;
3. simplicidade;
4. integridade dos dados;
5. facilidade de manutenção;
6. documentação contínua;
7. testes automatizados;
8. implantação self-hosted.

---

## Funcionalidades da primeira versão

### Contas e autenticação

- configuração controlada do primeiro usuário;
- criação de novos usuários por convite;
- login;
- logout;
- alteração de senha;
- sessões revogáveis;
- encerramento de outras sessões;
- encerramento de todas as sessões.

### Cofres

- criação de cofre privado;
- edição;
- exclusão;
- listagem;
- compartilhamento;
- papéis `OWNER` e `EDITOR`;
- convites;
- remoção de membros;
- saída voluntária de editor.

### Sites

- nome obrigatório;
- link opcional;
- criação;
- edição;
- exclusão;
- listagem;
- busca.

### Credenciais

- usuário;
- senha;
- observação opcional;
- criação;
- visualização;
- edição;
- exclusão;
- copiar usuário;
- copiar senha;
- revelar senha temporariamente.

### Importação CSV

Disponível somente na Web.

Formato:

```csv
cofre,nome,usuario,senha,obs,link
```

As colunas `obs` e `link` são opcionais.

Fluxo:

```text
Selecionar arquivo
→ Validar
→ Pré-visualizar
→ Resolver cofres e duplicidades
→ Confirmar
→ Criptografar
→ Importar
→ Exibir relatório
```

O CSV é processado no navegador e não deve ser enviado à API em texto aberto.

### Android

- login;
- cofres;
- sites;
- credenciais;
- compartilhamento;
- convites;
- sessões;
- conta;
- distribuição por APK.

A importação CSV não estará disponível no Android.

---

## Segurança

Este projeto armazena credenciais. Não utilize dados reais enquanto o gate de segurança da V1 não estiver concluído.

### Modelo principal

```text
Senha do usuário
→ Argon2id
→ RootKey
→ chaves derivadas por contexto
→ chave privada protegida
→ VaultKey por cofre
→ envelope por membro
→ conteúdo criptografado
```

O backend será responsável por:

- autenticação;
- autorização;
- sessões;
- memberships;
- convites;
- persistência;
- auditoria;
- consistência transacional.

O backend não deverá receber ou armazenar em texto aberto:

- senha original da conta;
- chave privada aberta;
- VaultKey;
- nome do cofre;
- descrição;
- nome do site;
- link;
- usuário da credencial;
- senha da credencial;
- observação;
- CSV.

### Controles principais

- criptografia no cliente;
- Argon2id;
- HKDF-SHA-256;
- XChaCha20-Poly1305;
- X25519;
- refresh token rotacionado;
- sessões revogáveis;
- autorização por membership;
- prevenção de IDOR;
- rate limit;
- CORS restrito;
- CSP;
- HTTPS;
- logs sanitizados;
- banco não exposto;
- backups protegidos;
- rekey após remoção de membro.

Leia `SECURITY.md` antes de implementar qualquer fluxo sensível.

---

## Stack

### Monorepo

- Node.js;
- TypeScript;
- pnpm workspaces;
- GitHub;
- GitHub Actions.

### Web

- React;
- Vite;
- TypeScript;
- React Router;
- TanStack Query;
- Zustand;
- Axios;
- React Hook Form;
- Zod;
- Tailwind CSS;
- shadcn/ui;
- Vitest;
- React Testing Library.

### API

- Node.js;
- NestJS;
- TypeScript;
- Prisma ORM;
- MySQL;
- Swagger/OpenAPI;
- Jest;
- Supertest.

### Android

- React Native;
- Expo;
- TypeScript;
- TanStack Query;
- Zustand;
- React Hook Form;
- Zod;
- Android Keystore;
- Expo Development Build ou prebuild quando necessário.

### Infraestrutura

- VPS Linux;
- Coolify;
- GitHub Actions;
- GitHub Container Registry — GHCR;
- Dockerfile por aplicação;
- Nginx para servir o frontend;
- MySQL em rede privada;
- HTTPS obrigatório;
- três ambientes isolados: `development`, `staging` e `production`;
- promoção para produção usando os mesmos digests homologados.

---

## Arquitetura resumida

```mermaid
flowchart LR
    W[React Web] -->|HTTPS REST| A[NestJS API]
    M[React Native Android] -->|HTTPS REST| A
    E[Extensão futura] -.->|HTTPS REST| A

    A -->|Prisma| D[(MySQL)]

    W --> CW[Crypto Web]
    M --> CM[Crypto Mobile]

    CW --> C[Crypto Core]
    CM --> C
```

O backend será um monólito modular.

Não serão utilizados inicialmente:

- microserviços;
- filas;
- Redis;
- event sourcing;
- CQRS completo;
- múltiplos bancos;
- Docker Compose no deploy.

---

## Estrutura do repositório

```text
/
├── apps/
│   ├── web/            React + Vite (Dockerfile + nginx.conf)
│   ├── api/            NestJS + Prisma (Dockerfile)
│   └── mobile/         reservado para a R0.7
│
├── packages/
│   ├── contracts/      envelopes, códigos de erro e tipos da API
│   ├── crypto-core/    formatos, AAD e interfaces — sem API de plataforma
│   ├── crypto-web/     bloqueado por PEND-001/PEND-002
│   ├── crypto-mobile/  bloqueado por PEND-003
│   ├── validation/     schemas Zod compartilhados
│   ├── eslint-config/  flat config: base, react e nest
│   └── tsconfig/       base, node e react
│
├── docs/
│   ├── decisions/      ADRs 0001 a 0012
│   ├── telas/          mockups gerados na fase de design
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── BACKLOG.md
│   ├── DATABASE.md
│   ├── DECISIONS.md
│   ├── PROJECT_SCOPE.md
│   ├── ROADMAP.md
│   ├── STYLE_GUIDE.md
│   └── TELAS.md
│
├── scripts/            utilitários de build do monorepo
│
├── .github/
│   ├── release.yml
│   ├── dependabot.yml
│   ├── pull_request_template.md
│   ├── ISSUE_TEMPLATE/
│   │   ├── config.yml
│   │   ├── bug_report.yml
│   │   └── feature_request.yml
│   └── workflows/
│       ├── ci.yml
│       ├── validate-pr-flow.yml
│       ├── cleanup-temporary-branches.yml
│       ├── start-release.yml
│       └── deploy-development.yml
│
├── .dockerignore
├── .editorconfig
├── .env.example
├── .gitignore
├── .npmrc
├── .nvmrc
├── VERSION
├── CLAUDE.md
├── CONTRIBUTING.md
├── GITHUB_RELEASE_FLOW.md
├── README.md
├── SECURITY.md
├── config_user.md
├── package.json
├── prettier.config.js
├── pnpm-lock.yaml
└── pnpm-workspace.yaml
```

`publish-prerelease.yml` e `publish-production.yml` entram na R0.8, quando os projetos de staging e production existirem no Coolify.

## Documentação

| Documento                                          | Finalidade                                                 |
| -------------------------------------------------- | ---------------------------------------------------------- |
| [`docs/PROJECT_SCOPE.md`](docs/PROJECT_SCOPE.md)   | Escopo funcional e limites                                 |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)     | Arquitetura técnica                                        |
| [`docs/DATABASE.md`](docs/DATABASE.md)             | Modelo relacional                                          |
| [`docs/API.md`](docs/API.md)                       | Contratos REST                                             |
| [`SECURITY.md`](SECURITY.md)                       | Modelo de segurança                                        |
| [`docs/TELAS.md`](docs/TELAS.md)                   | Especificação das interfaces                               |
| [`docs/BACKLOG.md`](docs/BACKLOG.md)               | Trabalho detalhado                                         |
| [`docs/ROADMAP.md`](docs/ROADMAP.md)               | Releases e gates do produto                                |
| [`GITHUB_RELEASE_FLOW.md`](GITHUB_RELEASE_FLOW.md) | Fluxo oficial de branches, RCs, releases e deploys         |
| [`config_user.md`](config_user.md)                 | Checklist de configuração manual no GitHub, GHCR e Coolify |
| [`docs/STYLE_GUIDE.md`](docs/STYLE_GUIDE.md)       | Padrões de código                                          |
| [`CONTRIBUTING.md`](CONTRIBUTING.md)               | Fluxo de contribuição                                      |
| [`docs/DECISIONS.md`](docs/DECISIONS.md)           | Índice de decisões e pendências                            |
| [`docs/decisions/`](docs/decisions/)               | ADRs detalhados                                            |
| [`CLAUDE.md`](CLAUDE.md)                           | Regras para Claude Code                                    |

Os mockups de tela gerados na fase de design ficam em [`docs/telas/`](docs/telas/).

Toda alteração relevante deve atualizar os documentos afetados.

Mudanças no processo de branches, versionamento, GitHub Actions, GHCR ou deploy também devem atualizar `GITHUB_RELEASE_FLOW.md` e, quando houver ação manual, `config_user.md`.

## Requisitos locais

| Ferramenta | Versão                      | Observação                                           |
| ---------- | --------------------------- | ---------------------------------------------------- |
| Node.js    | 24 (ver [`.nvmrc`](.nvmrc)) | `corepack enable` para ativar o pnpm da versão certa |
| pnpm       | 11 (campo `packageManager`) | não instale outra versão manualmente                 |
| Git        | qualquer versão recente     |                                                      |
| MySQL      | 8                           | necessário a partir da R0.2                          |
| Docker     | opcional                    | apenas para construir as imagens localmente          |

Android Studio e JDK só serão necessários na R0.7, quando o aplicativo entrar.

---

## Instalação

```bash
git clone <repository-url>
cd <repository-folder>

corepack enable
pnpm install

cp .env.example .env
```

O `.env` fica na **raiz** do monorepo e serve tanto a Web quanto a API. Nunca o versione.

---

## Variáveis de ambiente

A lista completa, com comentários, está em [`.env.example`](.env.example). Resumo:

```dotenv
# apps/api
NODE_ENV=development
APP_ENVIRONMENT=development          # development | staging | production
APP_VERSION=0.0.0-local
APP_COMMIT=local
APP_BUILT_AT=1970-01-01T00:00:00.000Z
API_PORT=3000
DATABASE_URL="mysql://crypta:CHANGE_ME@localhost:3306/crypta_development"
CORS_ORIGINS=http://localhost:5173   # lista por vírgula; curinga é rejeitado
LOG_LEVEL=debug

# apps/web — tudo aqui é público dentro do bundle
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_APP_ENVIRONMENT=development
VITE_APP_VERSION=0.0.0-local
VITE_APP_COMMIT=local
```

A API **valida a configuração no startup e não sobe** se algo estiver faltando ou inválido. A mensagem de erro cita apenas o nome da variável, nunca o valor — `DATABASE_URL` carrega a senha do banco.

As variáveis de autenticação (`JWT_*`, TTLs, cookie) entram na R0.2, junto com o módulo de auth.

---

## Execução local

```bash
# API em http://localhost:3000/api/v1
pnpm --filter @crypta/api dev

# Web em http://localhost:5173
pnpm --filter @crypta/web dev
```

A tela inicial da Web é o diagnóstico da integração: mostra versão, commit e ambiente da Web e da API, e o estado do banco. É a forma mais rápida de confirmar que o caminho Web → API → MySQL está de pé.

Endpoints disponíveis hoje:

```text
GET /api/v1/health/live     processo ativo
GET /api/v1/health/ready    banco respondendo (503 quando não)
GET /api/v1/version         versão, commit, ambiente e horário do build
GET /api/v1/docs            Swagger (desabilitado em produção)
```

---

## Banco de dados

```bash
pnpm --filter @crypta/api run prisma:generate       # gerar client
pnpm --filter @crypta/api run prisma:validate       # validar schema
pnpm --filter @crypta/api run prisma:migrate:dev    # criar migration local
pnpm --filter @crypta/api run prisma:migrate:deploy # aplicar em ambiente implantado
```

O schema ainda não tem entidades — ver [`docs/DATABASE.md`](docs/DATABASE.md) para o motivo e para as decisões que precisam ser fechadas antes.

Seeds devem usar somente dados fictícios. Nunca use `prisma db push` em produção.

---

## Scripts da raiz

```bash
pnpm lint            # ESLint em todos os workspaces
pnpm lint:fix
pnpm format          # Prettier
pnpm format:check
pnpm typecheck       # tsc --noEmit
pnpm test            # Vitest nos packages e na Web, Jest na API
pnpm build           # packages primeiro, depois as aplicações
pnpm clean

pnpm verify          # format:check + lint + typecheck + test + build
```

`pnpm verify` roda a mesma sequência da CI. Use antes de abrir um pull request.

Testes end-to-end da API (`pnpm --filter @crypta/api run test:e2e`) exigem MySQL real e entram na R0.2.

---

## Imagens Docker

O contexto de build é a **raiz** do monorepo:

```bash
docker build -f apps/api/Dockerfile -t crypta-api:local .
docker build -f apps/web/Dockerfile -t crypta-web:local \
  --build-arg VITE_API_BASE_URL=http://localhost:3000/api/v1 .
```

A API roda como usuário não-root na porta 3000. A Web é servida por Nginx unprivileged na porta 8080.

---

## Testes

### Web

- Vitest;
- React Testing Library;
- testes de componentes;
- testes de hooks;
- testes de formulários;
- testes de estado;
- testes de permissões visuais.

### API

- Jest;
- Supertest;
- MySQL real em integração;
- autenticação;
- autorização;
- transações;
- IDOR;
- sessões;
- convites;
- importação;
- rekey.

### Crypto

- vetores determinísticos;
- compatibilidade Web/Android;
- adulteração;
- AAD incorreta;
- versionamento;
- envelopes;
- rotação.

### E2E

Fluxos mínimos:

1. setup inicial;
2. login;
3. criação de cofre;
4. criação de site;
5. criação de credencial;
6. logout e login;
7. convite;
8. aceite;
9. edição compartilhada;
10. remoção de membro;
11. rekey;
12. importação CSV;
13. revogação de sessão.

---

## Qualidade

Antes de abrir pull request:

```bash
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
```

Nenhuma alteração deve reduzir testes ou segurança sem decisão formal.

---

## Deploy no Coolify

O projeto utilizará três ambientes completamente separados:

```text
crypta-development
├── web
├── api
└── mysql-development

crypta-staging
├── web
├── api
└── mysql-staging

crypta-production
├── web
├── api
└── mysql-production
```

Cada ambiente deverá possuir:

- recursos Web, API e MySQL próprios;
- banco independente;
- domínios próprios;
- variáveis e secrets próprios;
- GitHub Environment correspondente;
- histórico de deployment;
- backups compatíveis com sua finalidade.

### Development

```text
Branch: develop
GitHub Environment: development
Imagem móvel: development
Imagem imutável: dev-<commit-sha>
```

É o ambiente de integração contínua. Recebe automaticamente o HEAD de `develop`.

### Staging

```text
Branch implantada: staging
Origem: release/x.y.z
GitHub Environment: staging
Tag imutável: vX.Y.Z-rc.N
Tag móvel: staging
```

Homologa uma versão congelada. Novas funcionalidades podem continuar entrando em `develop` sem alterar o conteúdo em homologação.

### Production

```text
Branch: main
GitHub Environment: production
Tag estável: vX.Y.Z
Tag móvel: production
```

Produção executa somente versões estáveis publicadas como GitHub Release.

### Imagens

As imagens oficiais serão publicadas no GHCR:

```text
ghcr.io/<owner>/<repository>-web
ghcr.io/<owner>/<repository>-api
```

Não será utilizado Docker Compose como mecanismo de deploy.

O banco MySQL não poderá publicar porta na internet.

## Primeiro deploy

O primeiro ambiente criado será `development`, assim que existirem:

- uma tela Web;
- um endpoint da API;
- conexão com MySQL;
- integração real entre os três componentes;
- Dockerfiles de Web e API;
- workflow de CI funcional.

Primeiro fluxo sugerido:

```text
Tela de status
→ GET /api/v1/health/ready
→ consulta ao mysql-development
```

Também deverá ser criado:

```http
GET /api/v1/version
```

para identificar:

- versão;
- commit;
- ambiente;
- horário do build.

O objetivo do deploy antecipado é validar:

- Dockerfiles;
- build context do monorepo;
- GHCR;
- webhooks ou API do Coolify;
- CORS;
- DNS;
- HTTPS;
- rede;
- migrations;
- variáveis;
- proxy;
- metadados de versão.

## CI/CD e fluxo de releases

O fluxo oficial está documentado em `GITHUB_RELEASE_FLOW.md`.

A configuração manual necessária está em `config_user.md`.

### Branches permanentes

```text
develop
staging
main
```

### Fluxos permitidos

```text
feature/*  ─────────► develop
bugfix/*   ─────────► develop
chore/*    ─────────► develop
refactor/* ─────────► develop
docs/*     ─────────► develop
security/* ─────────► develop

fix/*      ─────────► release/*
release/*  ─────────► staging
staging    ─────────► main
main       ─────────► develop

hotfix/*   ─────────► main
main       ─────────► release/*   somente quando houver release ativa
```

### Ciclo de release

```text
develop
→ release/x.y.z
→ staging
→ vX.Y.Z-rc.N
→ homologação
→ staging → main
→ vX.Y.Z
→ GitHub Release
→ main → develop
→ exclusão de release/x.y.z
```

A branch `release/*` não deve ser apagada durante a homologação.

Correções encontradas em staging devem seguir:

```text
release/x.y.z
→ fix/*
→ release/x.y.z
→ staging
→ nova RC
```

### Versionamento

A raiz do repositório deverá possuir:

```text
VERSION
```

O arquivo contém apenas:

```text
MAJOR.MINOR.PATCH
```

Exemplos:

```text
release/0.4.0
v0.4.0-rc.1
v0.4.0
```

### Build único e promoção

Em uma release normal:

1. Web e API são construídas ao publicar a RC;
2. as imagens são publicadas no GHCR;
3. os digests são registrados em `release-manifest.json`;
4. staging homologa esses digests;
5. produção recebe os mesmos digests;
6. não ocorre novo build para produção.

Tags publicadas são imutáveis.

Rollback deve utilizar uma tag ou digest já identificado.

### Workflows previstos

```text
.github/workflows/ci.yml
.github/workflows/validate-pr-flow.yml
.github/workflows/cleanup-temporary-branches.yml
.github/workflows/start-release.yml
.github/workflows/deploy-development.yml
.github/workflows/publish-prerelease.yml
.github/workflows/publish-production.yml
```

O pipeline comum deverá executar:

- instalação imutável;
- format check;
- lint;
- typecheck;
- testes;
- builds;
- auditoria de dependências;
- secret scanning;
- container scan quando configurado.

## Importação CSV

A importação existirá apenas na Web.

O navegador será responsável por:

- ler o arquivo;
- validar;
- exibir preview;
- mapear cofres;
- detectar duplicidades;
- criptografar;
- enviar lotes cifrados.

A API não deverá receber o CSV original.

---

## Compartilhamento

Fluxo resumido:

```text
OWNER gera convite
→ cliente protege VaultKey
→ API armazena convite cifrado
→ convidado abre link
→ cliente recupera VaultKey
→ cliente cria envelope próprio
→ API cria membership
```

Ao remover um membro:

```text
membership bloqueado
→ cofre bloqueado para rekey
→ nova VaultKey
→ recriptografia
→ novos envelopes
→ commit transacional
```

---

## Status do projeto

O projeto está dividido nas releases:

```text
R0   — Fundação                    ← estamos aqui
R0.1 — Deploy antecipado
R0.2 — Identidade e criptografia
R0.3 — Cofres privados
R0.4 — Sites e credenciais
R0.5 — Compartilhamento
R0.6 — Importação Web
R0.7 — Android
R0.8 — Hardening
R1.0 — Primeira versão utilizável
```

Consulte [`docs/ROADMAP.md`](docs/ROADMAP.md).

### O que já existe

- monorepo pnpm com os workspaces previstos;
- TypeScript estrito, ESLint, Prettier e testes configurados em todos os workspaces;
- `@crypta/contracts` — envelopes, códigos de erro e contratos de health e version;
- `@crypta/validation` — schemas compartilhados;
- `@crypta/crypto-core` — formato de payload versionado, AAD determinística, base64url e UTF-8 portáveis, e as interfaces dos adapters;
- API NestJS com validação de ambiente no startup, logger estruturado, request ID, filtro global de erros e os endpoints de health e version;
- Web React + Vite com a tela de diagnóstico da integração;
- `Dockerfile` multi-stage para Web e API;
- workflows de CI, validação do fluxo de PR, limpeza de branches, início de release e deploy de development;
- ADRs 0001 a 0012.

### O que ainda não existe

- **nenhuma entidade no banco** — depende de `PEND-005`, `PEND-006` e `PEND-014` ([`docs/DATABASE.md`](docs/DATABASE.md));
- **nenhuma implementação criptográfica** — `@crypta/crypto-web` e `@crypta/crypto-mobile` estão bloqueados por `PEND-001`, `PEND-002` e `PEND-003`;
- autenticação, cofres, sites, credenciais, convites e importação;
- `apps/mobile` — entra na R0.7;
- `publish-prerelease.yml` e `publish-production.yml` — entram na R0.8, junto com os projetos Coolify de staging e production;
- os ambientes no Coolify e a configuração manual do GitHub — ver [`config_user.md`](config_user.md).

---

## Gate para credenciais reais

Não armazenar credenciais verdadeiras antes de:

- crypto revisada;
- vetores Web/Android aprovados;
- autorização testada;
- rekey funcional;
- refresh rotation funcional;
- logs sanitizados;
- MySQL privado;
- HTTPS;
- backups ativos;
- restauração testada;
- APK release;
- testes E2E;
- checklist de produção aprovado.

---

## Repositório público

Nunca versione:

```text
.env
tokens
senhas
private keys
certificados
dumps
backups
CSV real
logs reais
APK signing keys
credenciais do Coolify
credenciais do banco
```

Use dados fictícios:

```text
alice@example.test
bob@example.test
https://example.com
```

Segredo commitado deve ser considerado comprometido e rotacionado.

---

## Contribuição

Leia:

- `CONTRIBUTING.md`;
- `GITHUB_RELEASE_FLOW.md`;
- `config_user.md` quando estiver configurando o repositório ou ambientes.

Novas funcionalidades e correções de desenvolvimento devem partir de `develop`.

Padrão de commit:

```text
type(scope): description
```

Exemplos:

```text
feat(vaults): add encrypted vault creation
fix(auth): revoke reused refresh token family
security(logs): redact authorization headers
docs(api): document invitation endpoints
```

Os destinos de pull request são validados por GitHub Actions. Não promova feature diretamente para `staging` ou `main`.

## Decisões arquiteturais

Consulte:

- [`docs/DECISIONS.md`](docs/DECISIONS.md) — índice das decisões, status e pendências abertas
- [`docs/decisions/`](docs/decisions/) — os 12 ADRs registrados, do 0001 ao 0012

Mudanças relevantes exigem ADR.

---

## Limitações da primeira versão

Não fazem parte da V1:

- extensão de navegador;
- Android Autofill;
- iOS;
- desktop;
- modo offline;
- exportação;
- lixeira;
- histórico completo;
- TOTP;
- SSH keys;
- cartões;
- documentos;
- anexos;
- passkeys;
- recuperação avançada;
- perfil leitor;
- transferência de propriedade.

---

## Divulgação responsável

Não abra issue pública para vulnerabilidades sensíveis.

Utilize o canal privado definido no repositório.

Nunca inclua credenciais reais no reporte.

---

## Licença

A licença open source ainda deverá ser formalmente definida em ADR.

Até essa decisão, consulte o arquivo `LICENSE` do repositório quando ele existir.

---

## Aviso

Este projeto é um cofre de senhas em desenvolvimento.

Não deve ser considerado pronto para uso real até que os gates técnicos e de segurança da release R1.0 estejam concluídos.
