# DECISIONS.md

# Crypta — Registro de Decisões

> **Status:** Registro inicial para revisão  
> **Versão:** 0.2.0  
> **Última atualização:** 31 de julho de 2026

---

## 1. Objetivo

Este documento funciona como índice central e registro resumido das decisões técnicas e de produto.

Decisões detalhadas deverão ser documentadas como ADRs em:

```text
docs/decisions/
```

Este arquivo deverá:

- listar decisões;
- informar status;
- registrar contexto resumido;
- apontar consequências;
- indicar ADR relacionado;
- evitar que decisões importantes fiquem apenas em conversas ou commits.

---

## 2. Status possíveis

```text
PROPOSED
ACCEPTED
SUPERSEDED
DEPRECATED
REJECTED
REVIEW_REQUIRED
```

---

## 3. Convenção de ADR

Formato de arquivo:

```text
NNNN-short-title.md
```

Exemplo:

```text
0001-monorepo.md
0002-modular-monolith.md
```

---

## 4. Estrutura obrigatória de um ADR

```markdown
# ADR NNNN — Título

## Status

ACCEPTED

## Data

YYYY-MM-DD

## Contexto

Descreva o problema.

## Decisão

Descreva a decisão.

## Alternativas consideradas

- Alternativa A
- Alternativa B

## Consequências positivas

- Consequência

## Consequências negativas

- Consequência

## Riscos

- Risco

## Impactos

- Código
- Banco
- API
- Segurança
- Deploy
- Documentação

## Plano de migração

Quando aplicável.

## Referências internas

- ARCHITECTURE.md
- SECURITY.md
```

---

## 5. Regras de decisão

Uma decisão deverá gerar ADR quando:

- alterar stack;
- alterar arquitetura;
- alterar crypto;
- alterar autenticação;
- alterar banco;
- alterar estratégia de sessão;
- alterar contratos públicos;
- alterar deploy;
- adicionar dependência estrutural;
- criar migration destrutiva;
- mudar o modelo de compartilhamento;
- mudar o modelo de recuperação;
- mudar o escopo relevante.

---

## 6. Índice de decisões

| ID      | Decisão                                             | Status   | ADR        |
| ------- | --------------------------------------------------- | -------- | ---------- |
| DEC-001 | Monorepo com pnpm workspaces                        | ACCEPTED | ADR 0001   |
| DEC-002 | Monólito modular no backend                         | ACCEPTED | ADR 0002   |
| DEC-003 | Criptografia no cliente                             | ACCEPTED | ADR 0003   |
| DEC-004 | Separação entre autenticação e criptografia         | ACCEPTED | ADR 0004   |
| DEC-005 | VaultKey individual por cofre                       | ACCEPTED | ADR 0005   |
| DEC-006 | Envelope de chave por membro                        | ACCEPTED | ADR 0005   |
| DEC-007 | API REST versionada                                 | ACCEPTED | ADR 0007   |
| DEC-008 | MySQL com Prisma                                    | ACCEPTED | ADR 0008   |
| DEC-009 | Deploy no Coolify sem Docker Compose                | ACCEPTED | ADR 0009   |
| DEC-010 | Web, API e banco separados por ambiente             | ACCEPTED | ADR 0009   |
| DEC-011 | React + Vite para Web                               | ACCEPTED | ADR 0001   |
| DEC-012 | NestJS para API                                     | ACCEPTED | ADR 0002   |
| DEC-013 | React Native + Expo para Android                    | ACCEPTED | ADR futuro |
| DEC-014 | Refresh token rotacionado e revogável               | ACCEPTED | ADR 0010   |
| DEC-015 | CSV processado no navegador                         | ACCEPTED | ADR 0006   |
| DEC-016 | Busca local em conteúdo descriptografado            | ACCEPTED | ADR futuro |
| DEC-017 | Repositório público                                 | ACCEPTED | ADR futuro |
| DEC-018 | Deploy antecipado em development                    | ACCEPTED | ADR futuro |
| DEC-019 | Testes e documentação contínuos                     | ACCEPTED | ADR futuro |
| DEC-020 | OWNER e EDITOR na V1                                | ACCEPTED | ADR futuro |
| DEC-021 | Link opcional pertence ao site                      | ACCEPTED | ADR futuro |
| DEC-022 | Um site possui várias credenciais                   | ACCEPTED | ADR futuro |
| DEC-023 | Importação CSV somente na Web                       | ACCEPTED | ADR 0006   |
| DEC-024 | Android distribuído inicialmente por APK            | ACCEPTED | ADR futuro |
| DEC-025 | Sem recuperação automática na V1                    | ACCEPTED | ADR futuro |
| DEC-026 | Sem modo offline na V1                              | ACCEPTED | ADR futuro |
| DEC-027 | Sem extensão na V1                                  | ACCEPTED | ADR futuro |
| DEC-028 | Rekey após remoção de membro                        | ACCEPTED | ADR futuro |
| DEC-029 | Controle de concorrência por versão                 | ACCEPTED | ADR futuro |
| DEC-030 | IDs UUID em string inicialmente                     | PROPOSED | ADR futuro |
| DEC-031 | Branches permanentes `develop`, `staging` e `main`  | ACCEPTED | ADR 0011   |
| DEC-032 | GitHub Environments e Coolify isolados por ambiente | ACCEPTED | ADR 0011   |
| DEC-033 | GHCR como registry oficial de Web e API             | ACCEPTED | ADR 0012   |
| DEC-034 | Construir na RC e promover os mesmos digests        | ACCEPTED | ADR 0012   |
| DEC-035 | Semantic Versioning com arquivo `VERSION`           | ACCEPTED | ADR 0011   |
| DEC-036 | RCs, tags estáveis e releases imutáveis             | ACCEPTED | ADR 0011   |
| DEC-037 | Hotfix nasce de `main` e retorna às linhas ativas   | ACCEPTED | ADR 0011   |
| DEC-038 | Branch `release/*` permanece durante a homologação  | ACCEPTED | ADR 0011   |
| DEC-039 | Correções de staging passam por `fix/* → release/*` | ACCEPTED | ADR 0011   |

---

# DECISÕES DETALHADAS

---

## DEC-001 — Monorepo com pnpm workspaces

### Status

ACCEPTED

### Decisão

O projeto será organizado em monorepo.

Estrutura:

```text
apps/web
apps/api
apps/mobile
packages/*
```

### Motivos

- compartilhar contracts;
- compartilhar crypto;
- compartilhar validações;
- manter versões alinhadas;
- facilitar CI;
- facilitar revisão.

### Consequências

Positivas:

- menor duplicação;
- contratos consistentes;
- um repositório.

Negativas:

- build context maior;
- configuração inicial mais complexa;
- Dockerfiles precisam considerar workspaces.

### ADR

[`docs/decisions/0001-monorepo.md`](decisions/0001-monorepo.md)

---

## DEC-002 — Monólito modular no backend

### Status

ACCEPTED

### Decisão

A API será um monólito modular em NestJS.

### Motivos

- equipe pequena;
- domínio limitado;
- menor custo operacional;
- transações simples;
- deploy único;
- observabilidade simples.

### Rejeitado

- microserviços;
- filas desde o início;
- múltiplos bancos;
- service mesh.

### Consequências

O código deverá preservar módulos internos claros para evitar monólito desorganizado.

### ADR

[`docs/decisions/0002-modular-monolith.md`](decisions/0002-modular-monolith.md)

---

## DEC-003 — Criptografia no cliente

### Status

ACCEPTED

### Decisão

Conteúdo sensível será criptografado antes de ser enviado à API.

### Dados protegidos

- nome do cofre;
- descrição;
- site;
- link;
- usuário;
- senha;
- observação.

### Motivos

- reduzir impacto de vazamento do banco;
- reduzir confiança no servidor;
- alinhar o produto a um cofre de senhas real.

### Consequências

- busca server-side limitada;
- compartilhamento mais complexo;
- recuperação mais difícil;
- crypto cross-platform obrigatória;
- cliente Web torna-se parte crítica da segurança.

### ADR

[`docs/decisions/0003-client-side-encryption.md`](decisions/0003-client-side-encryption.md)

---

## DEC-004 — Separação de domínios criptográficos

### Status

ACCEPTED

### Decisão

A senha do usuário não gerará uma única chave reutilizada.

Fluxo:

```text
UserPassword
→ Argon2id
→ RootKey
→ HKDF auth
→ HKDF user-encryption
```

### Motivos

- evitar reutilização;
- separar autenticação;
- separar proteção da chave privada;
- permitir evolução.

### Consequências

- contratos mais complexos;
- vetores obrigatórios;
- alteração de senha requer novo bundle.

### ADR

[`docs/decisions/0004-auth-secret-domain-separation.md`](decisions/0004-auth-secret-domain-separation.md)

---

## DEC-005 — VaultKey por cofre

### Status

ACCEPTED

### Decisão

Cada cofre possuirá uma chave simétrica independente.

### Motivos

- isolamento;
- compartilhamento por cofre;
- rotação independente;
- redução do impacto de comprometimento.

### Consequências

- mais envelopes;
- gerenciamento de keyVersion;
- rekey por cofre.

### ADR

[`docs/decisions/0005-shared-vault-key-envelopes.md`](decisions/0005-shared-vault-key-envelopes.md)

---

## DEC-006 — Envelope por membro

### Status

ACCEPTED

### Decisão

Cada membro ativo terá um envelope da VaultKey protegido para sua chave pública.

### Motivos

- compartilhar sem enviar chave aberta;
- remover membro;
- emitir acesso individual;
- suportar rekey.

### Consequências

- membership ativo exige envelope válido;
- remoção exige rotação;
- convite exige fluxo criptográfico.

### ADR

Mesmo ADR da decisão anterior:

```text
docs/decisions/0005-shared-vault-key-envelopes.md
```

---

## DEC-007 — API REST versionada

### Status

ACCEPTED

### Decisão

A API utilizará REST JSON com prefixo:

```text
/api/v1
```

### Motivos

- simplicidade;
- documentação OpenAPI;
- compatibilidade Web/Mobile/Extensão;
- familiaridade da stack.

### Rejeitado

- GraphQL na V1;
- RPC proprietário;
- WebSocket como canal principal.

### ADR

[`docs/decisions/0007-rest-api.md`](decisions/0007-rest-api.md)

---

## DEC-008 — MySQL com Prisma

### Status

ACCEPTED

### Decisão

O banco será MySQL com Prisma ORM.

### Motivos

- preferência e familiaridade;
- domínio relacional;
- migrations;
- tipagem;
- integração com NestJS.

### Consequências

- testes de integração devem usar MySQL;
- não usar SQLite como substituto;
- partial unique constraints exigem tratamento específico.

### ADR

[`docs/decisions/0008-mysql-prisma.md`](decisions/0008-mysql-prisma.md)

---

## DEC-009 — Deploy no Coolify

### Status

ACCEPTED

### Decisão

A VPS utilizará Coolify.

Não será utilizado Docker Compose como mecanismo de deploy.

A entrega será coordenada por GitHub Actions e imagens publicadas no GHCR.

### Recursos

Cada ambiente possuirá:

- Web;
- API;
- MySQL.

Ambientes:

```text
development
staging
production
```

### Motivos

- isolamento;
- variáveis separadas;
- domínio separado;
- deploy independente;
- promoção controlada;
- compatibilidade com evolução.

### Consequências

- Dockerfile por aplicação;
- build context de monorepo;
- rede interna configurada no Coolify;
- três projetos separados;
- configuração manual documentada em `config_user.md`;
- workflows documentados em `GITHUB_RELEASE_FLOW.md`.

### ADR

[`docs/decisions/0009-coolify-deployment.md`](decisions/0009-coolify-deployment.md)

## DEC-010 — Serviços e ambientes separados no Coolify

### Status

ACCEPTED

### Decisão

Web, API e banco serão recursos distintos.

Também existirão três projetos isolados:

```text
crypta-development
crypta-staging
crypta-production
```

Cada projeto terá banco, secrets, domínios e histórico próprios.

### Motivos

- evitar vazamento entre ambientes;
- desacoplamento;
- deploy independente;
- homologação realista;
- rollback;
- futuro mobile;
- escalabilidade operacional.

### Consequências

- CORS por ambiente;
- cookies por ambiente;
- domínios próprios;
- health checks;
- env vars separadas;
- backups separados;
- proibição de dados reais em development e staging.

## DEC-011 — React + Vite para Web

### Status

ACCEPTED

### Decisão

A aplicação Web será uma SPA React com Vite.

### Motivos

- experiência prévia;
- desacoplamento total;
- build estático;
- uso da mesma API por outros clientes.

### Rejeitado

- Next.js fullstack;
- backend acoplado ao frontend.

---

## DEC-012 — NestJS para API

### Status

ACCEPTED

### Decisão

A API será implementada em NestJS.

### Motivos

- módulos;
- guards;
- validação;
- injeção de dependência;
- organização;
- testes.

---

## DEC-013 — React Native + Expo para Android

### Status

ACCEPTED

### Decisão

O cliente Android será React Native com Expo.

### Condição

Módulos nativos serão permitidos quando necessários para:

- Keystore;
- screenshot protection;
- autofill futuro;
- crypto.

### Consequências

- poderá ser necessário development build ou prebuild;
- Expo Go não será suficiente para todas as fases.

### ADR pendente

```text
docs/decisions/0020-react-native-expo.md
```

---

## DEC-014 — Refresh token rotacionado

### Status

ACCEPTED

### Decisão

Refresh tokens serão:

- opacos;
- hasheados;
- rotacionados;
- revogáveis;
- agrupados em família;
- monitorados para reutilização.

### Web

Cookie `HttpOnly`.

### Android

Android Keystore.

### ADR

[`docs/decisions/0010-session-strategy.md`](decisions/0010-session-strategy.md)

---

## DEC-015 — CSV processado no navegador

### Status

ACCEPTED

### Decisão

O arquivo CSV será processado no cliente Web.

A API receberá apenas lotes criptografados.

### Motivos

- evitar envio de senha aberta;
- manter o servidor sem acesso ao CSV;
- permitir preview local.

### Consequências

- limite de memória;
- validação local;
- duplicidade calculada no cliente;
- sem importação no Android.

### ADR

[`docs/decisions/0006-client-side-csv-import.md`](decisions/0006-client-side-csv-import.md)

---

## DEC-016 — Busca local

### Status

ACCEPTED

### Decisão

A busca inicial ocorrerá no cliente após descriptografia.

### Campos

- nome do site;
- usuário.

Observações não entram na busca da V1.

### Motivos

- API não conhece conteúdo;
- evita índice pesquisável de dados sensíveis.

### Consequências

- cofre deve estar desbloqueado;
- dados precisam estar carregados;
- busca global fica para fase posterior.

### ADR pendente

```text
docs/decisions/0021-client-side-search.md
```

---

## DEC-017 — Repositório público

### Status

ACCEPTED

### Decisão

O projeto ficará público no GitHub.

### Requisitos

- nenhum segredo;
- dados fictícios;
- `.env.example`;
- secret scanning;
- documentação de segurança;
- divulgação responsável.

### Consequências

- código, histórico e decisões serão públicos;
- qualquer segredo commitado é comprometido;
- exemplos precisam ser sanitizados.

### ADR pendente

```text
docs/decisions/0022-public-repository.md
```

---

## DEC-018 — Deploy antecipado em development

### Status

ACCEPTED

### Decisão

O Environment `development` será criado assim que existirem:

- primeira tela;
- primeira API;
- conexão com banco;
- Dockerfiles;
- CI funcional;
- publicação inicial no GHCR.

A integração mínima será:

```text
Web
→ GET /api/v1/health/ready
→ API
→ mysql-development
```

Também será disponibilizado:

```text
GET /api/v1/version
```

### Motivos

Validar cedo:

- CORS;
- cookies;
- Dockerfiles;
- GHCR;
- rede;
- SSL;
- migrations;
- Coolify;
- metadata de versão;
- webhooks ou API de deploy.

### Consequências

- infraestrutura entra antes das funcionalidades críticas;
- development será integração contínua;
- staging e production serão criados antes do hardening final;
- deploy não fica para o final.

### ADR pendente

```text
docs/decisions/0023-early-development-deployment.md
```

## DEC-019 — Testes e documentação contínuos

### Status

ACCEPTED

### Decisão

Testes e documentação fazem parte da Definition of Done.

### Consequências

Nenhuma funcionalidade relevante será concluída sem:

- teste;
- docs;
- build;
- validação.

---

## DEC-020 — OWNER e EDITOR

### Status

ACCEPTED

### Decisão

Papéis da V1:

```text
OWNER
EDITOR
```

### OWNER

Gerencia cofre, conteúdo, membros e convites.

### EDITOR

Gerencia conteúdo, mas não membros.

### Fora da V1

- READER;
- ADMIN;
- custom permissions.

---

## DEC-021 — Link pertence ao site

### Status

ACCEPTED

### Decisão

O campo `link` pertence à entidade Site.

Ele é opcional.

### Motivos

Um site pode possuir várias credenciais, mas normalmente compartilha o mesmo endereço.

---

## DEC-022 — Site com várias credenciais

### Status

ACCEPTED

### Decisão

A relação será:

```text
Vault
→ Site
→ Credential[]
```

### Motivos

Permitir várias contas para o mesmo serviço.

---

## DEC-023 — Importação somente na Web

### Status

ACCEPTED

### Decisão

O Android não terá importação CSV na V1.

### Motivos

- menor complexidade;
- melhor preview em tela grande;
- menor risco operacional;
- parsing concentrado no navegador.

---

## DEC-024 — APK como distribuição inicial

### Status

ACCEPTED

### Decisão

O Android será distribuído inicialmente por APK assinado.

### Requisitos

- build release;
- signing key fora do Git;
- hash publicado;
- canal confiável;
- versionamento.

### ADR pendente

```text
docs/decisions/0024-android-apk-distribution.md
```

---

## DEC-025 — Sem recuperação automática na V1

### Status

ACCEPTED

### Decisão

Não haverá recuperação de senha que preserve automaticamente o conteúdo.

### Motivo

O servidor não possui a chave privada aberta.

### Consequências

- perda de senha pode causar perda de acesso;
- interface deve avisar;
- recuperação avançada fica para versão futura.

### ADR pendente

```text
docs/decisions/0025-account-recovery.md
```

---

## DEC-026 — Sem modo offline na V1

### Status

ACCEPTED

### Decisão

O sistema será online-first.

### Motivos

- reduzir risco;
- evitar banco local;
- evitar conflito complexo;
- simplificar mobile.

---

## DEC-027 — Sem extensão na V1

### Status

ACCEPTED

### Decisão

Extensões serão desenvolvidas após a estabilização da Web, API e Android.

### Plataformas futuras

- Chrome;
- Firefox;
- Opera.

---

## DEC-028 — Rekey após remoção de membro

### Status

ACCEPTED

### Decisão

Remover membership bloqueia acesso imediato, mas a remoção criptográfica exige nova VaultKey.

### Consequências

- cofre pode ficar temporariamente bloqueado;
- conteúdos são recriptografados;
- envelopes antigos são removidos;
- keyVersion aumenta.

### ADR pendente

```text
docs/decisions/0026-vault-rekey.md
```

---

## DEC-029 — Controle de concorrência por versão

### Status

ACCEPTED

### Decisão

Vault, Site e Credential possuirão `version`.

O cliente envia `expectedVersion`.

### Motivos

- evitar sobrescrita silenciosa;
- suportar cofre compartilhado;
- simplificar conflitos.

### Consequências

- API retorna `409`;
- interface precisa tratar conflito;
- mutations devem incrementar versão.

### ADR pendente

```text
docs/decisions/0027-optimistic-concurrency.md
```

---

## DEC-030 — UUID em string inicialmente

### Status

PROPOSED

### Proposta

Usar:

```text
CHAR(36)
```

com UUID em string.

### Alternativa

```text
BINARY(16)
```

### Motivos da proposta

- simplicidade;
- debug;
- Prisma;
- menor complexidade inicial.

### Pendente

Definir antes da primeira migration de produção.

### ADR pendente

```text
docs/decisions/0028-database-identifiers.md
```

---

## DEC-031 — Branches permanentes `develop`, `staging` e `main`

### Status

ACCEPTED

### Decisão

As branches permanentes serão:

```text
develop
staging
main
```

Responsabilidades:

- `develop`: integração contínua;
- `staging`: conteúdo atualmente homologado;
- `main`: produção.

### Fluxos principais

```text
feature/* → develop
release/* → staging
staging → main
main → develop
```

### Motivos

- separar desenvolvimento, homologação e produção;
- permitir que `develop` continue evoluindo durante a homologação;
- preservar rastreabilidade;
- impedir promoção direta de features.

### Consequências

- `develop` será a branch padrão;
- rulesets serão necessários;
- `validate-pr-flow.yml` será check obrigatório;
- branches permanentes usarão merge commits nas promoções.

### ADR

[`docs/decisions/0011-github-release-flow.md`](decisions/0011-github-release-flow.md)

---

## DEC-032 — GitHub Environments e Coolify isolados por ambiente

### Status

ACCEPTED

### Decisão

Serão criados GitHub Environments:

```text
development
staging
production
```

Cada um será associado a um projeto Coolify separado.

### Motivos

- secrets isolados;
- proteção de produção;
- URLs de deployment;
- auditoria;
- aprovação;
- menor risco de mistura de bancos.

### Consequências

- configuração manual obrigatória;
- secrets não serão compartilhados;
- produção poderá exigir reviewer;
- branches e tags autorizadas serão restritas.

### ADR

[`docs/decisions/0011-github-release-flow.md`](decisions/0011-github-release-flow.md)

---

## DEC-033 — GHCR como registry oficial

### Status

ACCEPTED

### Decisão

As imagens oficiais serão publicadas em:

```text
ghcr.io/<owner>/<repository>-web
ghcr.io/<owner>/<repository>-api
```

### Tags

```text
development
dev-<sha>
vX.Y.Z-rc.N
staging
vX.Y.Z
production
```

### Motivos

- integração com GitHub Actions;
- identificação de artefatos;
- promoção por digest;
- rollback;
- rastreabilidade entre commit e imagem.

### Consequências

- permissões de packages precisam ser configuradas;
- Coolify precisa autenticar no registry quando necessário;
- imagens devem passar por scan;
- tags móveis não substituem o uso de digest em homologação e produção.

### ADR

[`docs/decisions/0012-immutable-artifact-promotion.md`](decisions/0012-immutable-artifact-promotion.md)

---

## DEC-034 — Construir na RC e promover os mesmos digests

### Status

ACCEPTED

### Decisão

Em uma release normal:

1. Web e API são construídas ao publicar a RC;
2. as imagens são enviadas ao GHCR;
3. os digests são registrados;
4. staging homologa esses digests;
5. produção recebe os mesmos digests;
6. não ocorre novo build para produção.

### Manifesto

```text
release-manifest.json
```

Deverá registrar:

- versão;
- commit;
- imagem Web;
- digest Web;
- imagem API;
- digest API;
- horário;
- migration relacionada, quando aplicável.

### Motivos

- o que foi homologado é o que será executado;
- reduzir risco de supply chain;
- permitir rollback confiável;
- melhorar auditoria.

### Consequências

- workflows de prerelease e produção ficam ligados;
- produção depende do manifesto da RC aprovada;
- tags RC e estáveis são imutáveis;
- rebuild de produção é rejeitado.

### ADR

[`docs/decisions/0012-immutable-artifact-promotion.md`](decisions/0012-immutable-artifact-promotion.md)

---

## DEC-035 — Semantic Versioning com arquivo `VERSION`

### Status

ACCEPTED

### Decisão

O projeto utilizará:

```text
MAJOR.MINOR.PATCH
```

A raiz do repositório terá:

```text
VERSION
```

O arquivo contém apenas a versão, sem prefixo `v`.

### Uso

```text
release/0.4.0
v0.4.0-rc.1
v0.4.0
```

### Consequências

- o arquivo muda no início de release;
- hotfix incrementa PATCH;
- workflows validam formato;
- uma versão publicada não pode ser reutilizada.

### ADR

[`docs/decisions/0011-github-release-flow.md`](decisions/0011-github-release-flow.md)

---

## DEC-036 — RCs, tags estáveis e releases imutáveis

### Status

ACCEPTED

### Decisão

Cada promoção para staging gera:

```text
vX.Y.Z-rc.N
GitHub Pre-release
```

Cada publicação em produção gera:

```text
vX.Y.Z
GitHub Release
```

Tags já publicadas não podem ser movidas, apagadas para reutilização ou sobrescritas.

### Motivos

- rastreabilidade;
- confiança no rollback;
- relação estável entre código e artefato;
- auditoria.

### Consequências

- uma correção gera nova RC ou nova versão PATCH;
- tags `v*` precisam de ruleset;
- release defeituosa permanece registrada, ainda que seja substituída.

### ADR

[`docs/decisions/0011-github-release-flow.md`](decisions/0011-github-release-flow.md)

---

## DEC-037 — Hotfix nasce de `main` e retorna às linhas ativas

### Status

ACCEPTED

### Decisão

Hotfix seguirá:

```text
main
→ hotfix/*
→ main
→ nova versão PATCH
→ main → develop
```

Se houver release ativa:

```text
main → release/x.y.z
```

### Regra de versão

Ao sincronizar com uma release futura, o código do hotfix entra na release, mas o arquivo `VERSION` mantém a versão futura.

### Motivos

- corrigir o código realmente publicado;
- impedir perda da correção;
- manter desenvolvimento e release ativa sincronizados.

### ADR

[`docs/decisions/0011-github-release-flow.md`](decisions/0011-github-release-flow.md)

---

## DEC-038 — Branch `release/*` permanece durante a homologação

### Status

ACCEPTED

### Decisão

A branch `release/x.y.z` não será apagada após a primeira promoção para staging.

Ela permanece até:

- publicação em produção;
- sincronização `main → develop`;
- confirmação de que nenhuma correção exclusiva ficou pendente.

### Motivos

- local correto para correções de homologação;
- preservar versão congelada;
- permitir múltiplas RCs;
- evitar correções diretas em staging.

### Consequências

- limpeza automática não inclui `release/*`;
- o encerramento da release possui checklist;
- uma release ativa precisa ser claramente identificada.

### ADR

[`docs/decisions/0011-github-release-flow.md`](decisions/0011-github-release-flow.md)

---

## DEC-039 — Correções de staging passam por `fix/* → release/*`

### Status

ACCEPTED

### Decisão

Um erro encontrado em homologação será corrigido assim:

```text
release/x.y.z
→ fix/*
→ release/x.y.z
→ staging
→ nova RC
```

### Rejeitado

```text
fix/* → staging
commit direto em staging
fix/* → develop
```

durante a correção da versão homologada.

### Motivos

- preservar a fonte da release;
- evitar divergência entre staging e branch de release;
- produzir RC reproduzível.

### ADR

[`docs/decisions/0011-github-release-flow.md`](decisions/0011-github-release-flow.md)

---

# DECISÕES REJEITADAS

---

## DEC-R001 — Backend descriptografando credenciais

### Status

REJECTED

### Motivo

Daria ao servidor acesso a todos os segredos e aumentaria o impacto de comprometimento.

---

## DEC-R002 — Senhas em colunas plaintext

### Status

REJECTED

### Motivo

Incompatível com o objetivo do produto.

---

## DEC-R003 — Refresh token em localStorage

### Status

REJECTED

### Motivo

Aumenta exposição a XSS.

---

## DEC-R004 — JWT sem expiração curta

### Status

REJECTED

### Motivo

Dificulta revogação e amplia impacto de roubo.

---

## DEC-R005 — Banco acessível pelo frontend

### Status

REJECTED

### Motivo

Quebra autorização e arquitetura.

---

## DEC-R006 — CSV enviado para a API

### Status

REJECTED

### Motivo

Exporia credenciais em texto aberto ao servidor.

---

## DEC-R007 — Microserviços na V1

### Status

REJECTED

### Motivo

Complexidade operacional sem necessidade.

---

## DEC-R008 — Docker Compose no deploy

### Status

REJECTED

### Motivo

A implantação será feita com recursos separados no Coolify.

---

## DEC-R009 — Busca server-side em plaintext

### Status

REJECTED

### Motivo

A API não deverá possuir o conteúdo descriptografado.

---

## DEC-R010 — Cadastro público irrestrito

### Status

REJECTED

### Motivo

O sistema será controlado e baseado em setup inicial e convites.

---

## DEC-R011 — Reconstruir produção após homologação

### Status

REJECTED

### Motivo

O novo build pode divergir do artefato aprovado em staging.

Produção deverá promover os mesmos digests registrados na RC.

---

## DEC-R012 — Corrigir diretamente em `staging`

### Status

REJECTED

### Motivo

A correção ficaria fora da branch de release e quebraria a rastreabilidade.

---

## DEC-R013 — Promover feature diretamente para `staging` ou `main`

### Status

REJECTED

### Motivo

Ignora congelamento, homologação e gates de segurança.

---

## DEC-R014 — Compartilhar banco e secrets entre ambientes

### Status

REJECTED

### Motivo

Aumenta o risco de vazamento, perda de dados e execução acidental em produção.

---

# DECISÕES PENDENTES

---

## 7. Lista de pendências

| ID       | Tema                                          | Status          | Bloqueia         |
| -------- | --------------------------------------------- | --------------- | ---------------- |
| PEND-001 | Biblioteca Argon2id Web                       | REVIEW_REQUIRED | Crypto           |
| PEND-002 | Biblioteca libsodium Web                      | REVIEW_REQUIRED | Crypto           |
| PEND-003 | Biblioteca libsodium Mobile                   | REVIEW_REQUIRED | Mobile           |
| PEND-004 | Parâmetros Argon2id                           | REVIEW_REQUIRED | Login            |
| PEND-005 | UUIDv4 ou UUIDv7                              | REVIEW_REQUIRED | Banco            |
| PEND-006 | `CHAR(36)` ou `BINARY(16)`                    | REVIEW_REQUIRED | Banco            |
| PEND-007 | Duração do access token                       | REVIEW_REQUIRED | Auth             |
| PEND-008 | Duração do refresh token                      | REVIEW_REQUIRED | Auth             |
| PEND-009 | SameSite e domínio do cookie                  | REVIEW_REQUIRED | Deploy           |
| PEND-010 | Limites de CSV                                | REVIEW_REQUIRED | Importação       |
| PEND-011 | Expiração de convite                          | REVIEW_REQUIRED | Compartilhamento |
| PEND-012 | Estratégia de envio do convite                | REVIEW_REQUIRED | Compartilhamento |
| PEND-013 | Bloqueio de screenshot Android                | REVIEW_REQUIRED | Mobile           |
| PEND-014 | Política de hard/soft delete                  | REVIEW_REQUIRED | Banco            |
| PEND-015 | Retenção de auditoria                         | REVIEW_REQUIRED | Operação         |
| PEND-016 | Licença open source                           | REVIEW_REQUIRED | Repositório      |
| PEND-017 | Estratégia de recuperação                     | REVIEW_REQUIRED | Pós-V1           |
| PEND-018 | Biblioteca de CSV                             | REVIEW_REQUIRED | Importação       |
| PEND-019 | Ferramenta de container scan                  | REVIEW_REQUIRED | CI               |
| PEND-020 | Estratégia de autolock                        | REVIEW_REQUIRED | V1.1             |
| PEND-021 | Autenticação GitHub Actions → Coolify         | REVIEW_REQUIRED | Deploy           |
| PEND-022 | Visibilidade dos packages no GHCR             | REVIEW_REQUIRED | Deploy           |
| PEND-023 | Reviewers do Environment `production`         | REVIEW_REQUIRED | Release          |
| PEND-024 | Retenção de manifests e artefatos de RC       | REVIEW_REQUIRED | Operação         |
| PEND-025 | Política final de proteção e retenção de tags | REVIEW_REQUIRED | Release          |

---

## 8. Processo de decisão

Para fechar uma decisão pendente:

1. definir o problema;
2. listar requisitos;
3. identificar riscos;
4. pesquisar alternativas;
5. comparar;
6. registrar recomendação;
7. criar ADR;
8. atualizar este índice;
9. atualizar documentos afetados;
10. implementar apenas após aceite.

---

## 9. Matriz de impacto

| Tipo de decisão    | Documentos afetados                                       |
| ------------------ | --------------------------------------------------------- |
| Stack              | Architecture, Style Guide, README                         |
| Banco              | Database, API, Architecture                               |
| Crypto             | Security, Architecture, API                               |
| Auth               | Security, API, Database                                   |
| UI                 | Telas, Escopo                                             |
| Deploy             | Architecture, Security, README, Contributing, config_user |
| Branches e release | GitHub Release Flow, Contributing, Style Guide, Claude    |
| Artefatos          | Architecture, Security, GitHub Release Flow               |
| Escopo             | Project Scope, Backlog, Roadmap                           |
| Mobile             | Architecture, Telas, Security                             |
| Importação         | Scope, API, Security, Telas                               |
| Recuperação        | Security, Architecture, Roadmap                           |

---

## 10. Revisão periódica

O registro deverá ser revisado:

- antes de cada release;
- antes de migration relevante;
- antes de mudança de crypto;
- antes de produção;
- após incidente;
- quando dependência crítica mudar.

---

## 11. Decisão substituída

Quando uma decisão for substituída:

- não apagar o registro;
- marcar como `SUPERSEDED`;
- informar a decisão nova;
- explicar a migração;
- preservar histórico.

Exemplo:

```text
DEC-030 SUPERSEDED BY DEC-045
```

---

## 12. Decisão rejeitada

Decisões rejeitadas devem permanecer registradas quando houver chance de serem propostas novamente.

Isso evita repetir discussões sem novo contexto.

---

## 13. Critérios de qualidade de ADR

Um ADR adequado deve ser:

- específico;
- objetivo;
- rastreável;
- honesto sobre desvantagens;
- claro sobre riscos;
- claro sobre migração;
- ligado ao código e à documentação.

Evitar ADR que apenas diga:

```text
Escolhemos X porque é melhor.
```

---

## 14. Resumo

As decisões centrais do projeto são:

```text
monorepo
→ clientes desacoplados
→ API REST
→ monólito modular
→ MySQL + Prisma
→ criptografia no cliente
→ VaultKey por cofre
→ envelope por membro
→ refresh token rotacionado
→ CSV processado localmente
```

A cadeia de entrega seguirá:

```text
feature/*
→ develop
→ development

develop
→ release/x.y.z
→ staging
→ vX.Y.Z-rc.N
→ GitHub Pre-release

staging
→ main
→ vX.Y.Z
→ GitHub Release
→ production
→ main → develop
```

Artefatos:

```text
build único na RC
→ imagens no GHCR
→ release-manifest.json
→ homologação por digest
→ promoção dos mesmos digests
```

O objetivo deste registro é manter escolhas de produto, segurança, arquitetura e entrega explícitas, revisáveis e consistentes.
