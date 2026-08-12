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

| ID      | Decisão                                             | Status     | ADR        |
| ------- | --------------------------------------------------- | ---------- | ---------- |
| DEC-001 | Monorepo com pnpm workspaces                        | ACCEPTED   | ADR 0001   |
| DEC-002 | Monólito modular no backend                         | ACCEPTED   | ADR 0002   |
| DEC-003 | Criptografia no cliente                             | ACCEPTED   | ADR 0003   |
| DEC-004 | Separação entre autenticação e criptografia         | ACCEPTED   | ADR 0004   |
| DEC-005 | VaultKey individual por cofre                       | ACCEPTED   | ADR 0005   |
| DEC-006 | Envelope de chave por membro                        | ACCEPTED   | ADR 0005   |
| DEC-007 | API REST versionada                                 | ACCEPTED   | ADR 0007   |
| DEC-008 | MySQL com Prisma                                    | ACCEPTED   | ADR 0008   |
| DEC-009 | Deploy no Coolify sem Docker Compose                | ACCEPTED   | ADR 0009   |
| DEC-010 | Web, API e banco separados por ambiente             | ACCEPTED   | ADR 0009   |
| DEC-011 | React + Vite para Web                               | ACCEPTED   | ADR 0001   |
| DEC-012 | NestJS para API                                     | ACCEPTED   | ADR 0002   |
| DEC-013 | React Native + Expo para Android                    | ACCEPTED   | ADR futuro |
| DEC-014 | Refresh token rotacionado e revogável               | ACCEPTED   | ADR 0010   |
| DEC-015 | CSV processado no navegador                         | ACCEPTED   | ADR 0006   |
| DEC-016 | Busca local em conteúdo descriptografado            | ACCEPTED   | ADR futuro |
| DEC-017 | Repositório público                                 | ACCEPTED   | ADR futuro |
| DEC-018 | Deploy antecipado em development                    | ACCEPTED   | ADR futuro |
| DEC-019 | Testes e documentação contínuos                     | ACCEPTED   | ADR futuro |
| DEC-020 | OWNER e EDITOR na V1                                | ACCEPTED   | ADR futuro |
| DEC-021 | Link opcional pertence ao site                      | ACCEPTED   | ADR futuro |
| DEC-022 | Um site possui várias credenciais                   | ACCEPTED   | ADR futuro |
| DEC-023 | Importação CSV somente na Web                       | ACCEPTED   | ADR 0006   |
| DEC-024 | Android distribuído inicialmente por APK            | ACCEPTED   | ADR futuro |
| DEC-025 | Sem recuperação automática na V1                    | ACCEPTED   | ADR futuro |
| DEC-026 | Sem modo offline na V1                              | ACCEPTED   | ADR futuro |
| DEC-027 | Sem extensão na V1                                  | ACCEPTED   | ADR futuro |
| DEC-028 | Rekey após remoção de membro                        | ACCEPTED   | ADR futuro |
| DEC-029 | Controle de concorrência por versão                 | ACCEPTED   | ADR futuro |
| DEC-030 | IDs UUID em string inicialmente                     | SUPERSEDED | ADR 0019   |
| DEC-031 | Branches permanentes `develop`, `staging` e `main`  | ACCEPTED   | ADR 0011   |
| DEC-032 | GitHub Environments e Coolify isolados por ambiente | ACCEPTED   | ADR 0011   |
| DEC-033 | GHCR como registry oficial de Web e API             | ACCEPTED   | ADR 0012   |
| DEC-034 | Construir na RC e promover os mesmos digests        | ACCEPTED   | ADR 0012   |
| DEC-035 | Semantic Versioning com arquivo `VERSION`           | ACCEPTED   | ADR 0011   |
| DEC-036 | RCs, tags estáveis e releases imutáveis             | ACCEPTED   | ADR 0011   |
| DEC-037 | Hotfix nasce de `main` e retorna às linhas ativas   | ACCEPTED   | ADR 0011   |
| DEC-038 | Branch `release/*` permanece durante a homologação  | ACCEPTED   | ADR 0011   |
| DEC-039 | Correções de staging passam por `fix/* → release/*` | ACCEPTED   | ADR 0011   |
| DEC-040 | Licença AGPL-3.0                                    | ACCEPTED   | ADR 0013   |
| DEC-041 | Override de `js-yaml` para a versão corrigida       | ACCEPTED   | ADR 0014   |
| DEC-042 | Migrations aplicadas no start do container da API   | ACCEPTED   | ADR 0015   |
| DEC-043 | Argon2id pelo libsodium em WebAssembly              | ACCEPTED   | ADR 0016   |
| DEC-044 | Primitivas da Web por origem especializada          | ACCEPTED   | ADR 0017   |
| DEC-045 | Parâmetros iniciais do Argon2id                     | ACCEPTED   | ADR 0018   |
| DEC-046 | Identificadores UUIDv7 em `CHAR(36)`                | ACCEPTED   | ADR 0019   |
| DEC-047 | Exclusão física com auditoria preservada            | ACCEPTED   | ADR 0020   |
| DEC-048 | Duração dos tokens e cookie de refresh host-only    | ACCEPTED   | ADR 0021   |
| DEC-049 | Credenciais e tokens no servidor                    | ACCEPTED   | ADR 0022   |
| DEC-050 | AAD de identidade e formato do envelope de chave    | ACCEPTED   | ADR 0023   |
| DEC-051 | Comportamento da janela de tolerância na rotação    | ACCEPTED   | ADR 0024   |

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

O número é atribuído quando o ADR for escrito, na ordem em que ele entrar. Os nomes abaixo eram reservas de numeração que a fila de decisões já ultrapassou.

```text
docs/decisions/NNNN-react-native-expo.md
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

O número é atribuído quando o ADR for escrito, na ordem em que ele entrar. Os nomes abaixo eram reservas de numeração que a fila de decisões já ultrapassou.

```text
docs/decisions/NNNN-client-side-search.md
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

O número é atribuído quando o ADR for escrito, na ordem em que ele entrar. Os nomes abaixo eram reservas de numeração que a fila de decisões já ultrapassou.

```text
docs/decisions/NNNN-public-repository.md
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

O número é atribuído quando o ADR for escrito, na ordem em que ele entrar. Os nomes abaixo eram reservas de numeração que a fila de decisões já ultrapassou.

```text
docs/decisions/NNNN-early-development-deployment.md
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

O número é atribuído quando o ADR for escrito, na ordem em que ele entrar. Os nomes abaixo eram reservas de numeração que a fila de decisões já ultrapassou.

```text
docs/decisions/NNNN-android-apk-distribution.md
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

O número é atribuído quando o ADR for escrito, na ordem em que ele entrar. Os nomes abaixo eram reservas de numeração que a fila de decisões já ultrapassou.

```text
docs/decisions/NNNN-account-recovery.md
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

O número é atribuído quando o ADR for escrito, na ordem em que ele entrar. Os nomes abaixo eram reservas de numeração que a fila de decisões já ultrapassou.

```text
docs/decisions/NNNN-vault-rekey.md
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

O número é atribuído quando o ADR for escrito, na ordem em que ele entrar. Os nomes abaixo eram reservas de numeração que a fila de decisões já ultrapassou.

```text
docs/decisions/NNNN-optimistic-concurrency.md
```

---

## DEC-030 — UUID em string inicialmente

### Status

SUPERSEDED pelo DEC-046

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

### Resolvido

O DEC-046 confirmou `CHAR(36)` e acrescentou o que faltava: a versão do UUID. A numeração de ADR prevista aqui (`0028`) era estimativa; o ADR saiu como `0019`.

### ADR

[`docs/decisions/0019-database-identifiers.md`](decisions/0019-database-identifiers.md)

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

## DEC-040 — Licença AGPL-3.0

### Status

ACCEPTED

### Decisão

O projeto é licenciado sob `AGPL-3.0-only`. O arquivo `LICENSE` na raiz contém a cópia literal do texto da FSF.

Fecha a pendência PEND-016.

### Motivos

O produto é um cofre de senhas self-hosted: o usuário confia que o código em execução é o código que ele consegue auditar.

A secao 13 da AGPL, _Remote Network Interaction_, obriga quem modificar o projeto e oferecê-lo por rede a disponibilizar o fonte correspondente aos usuários daquele serviço. Nenhuma licença permissiva impõe isso, e a GPL-3.0 também não — oferecer software como serviço não é distribuição.

### Rejeitado

```text
MIT
Apache-2.0
GPL-3.0
nenhuma licença
```

MIT e Apache-2.0 permitem um fork fechado hospedado como serviço. GPL-3.0 tem copyleft, mas a obrigação depende de distribuição, e é exatamente por rede que um cofre alterado chegaria ao usuário. Ausência de licença equivale a todos os direitos reservados e esvazia o `CONTRIBUTING.md`.

### Consequências

- contribuições passam a ter base jurídica;
- adoção corporativa reduzida: várias empresas proíbem AGPL por política;
- relicenciamento futuro exigiria concordância de todos os contribuidores;
- dependências com licença incompatível não podem ser incorporadas.

### ADR

[`docs/decisions/0013-agpl-license.md`](decisions/0013-agpl-license.md)

---

## DEC-041 — Override de `js-yaml` para a versão corrigida

### Status

ACCEPTED

### Decisão

`pnpm-workspace.yaml` força a resolução vulnerável de `js-yaml` para a versão corrigida:

```yaml
overrides:
  'js-yaml@5.2.1': '^5.2.3'
```

O seletor inclui a versão. `js-yaml` 3.15.1 e 4.3.1, fora da faixa do advisory, permanecem intactas.

### Motivos

[GHSA-pm4m-ph32-ghv5](https://github.com/advisories/GHSA-pm4m-ph32-ghv5) afeta `js-yaml` de `5.0.0` a `5.2.1`: análise de _flow collections_ em tempo exponencial, com negação de serviço. A cópia vulnerável entra por `@nestjs/swagger`, que crava `"5.2.1"` em versão exata. A `11.4.6` é a última versão publicada do pacote pai — não existe atualização que corrija.

O job `Auditoria de dependências` bloqueia o merge diante de vulnerabilidade alta, conforme `ROADMAP.md` secao 42. Sem o override, a R0 não fecha.

### Rejeitado

```text
atualizar @nestjs/swagger
trocar a biblioteca de OpenAPI
baixar o --audit-level ou excetuar o advisory
override pelo nome do pacote
```

Não há versão do pai que corrija. Swagger é stack fixa em `CLAUDE.md` secao 4. Afrouxar o portão o esvaziaria para toda vulnerabilidade alta futura, não só esta. Override pelo nome arrastaria `js-yaml` 3.x e 4.x para a linha 5.x sem ganho de segurança.

### Consequências

- `pnpm audit --audit-level high` volta a reportar ausência de vulnerabilidades conhecidas;
- alteração de uma linha no `pnpm-lock.yaml`;
- a entrada congela a resolução e precisa ser removida quando o upstream corrigir o pin;
- nenhuma automação vigia overrides obsoletos.

### ADR

[`docs/decisions/0014-js-yaml-override.md`](decisions/0014-js-yaml-override.md)

---

## DEC-042 — Migrations aplicadas no start do container da API

### Status

ACCEPTED

### Decisão

A imagem da API tem um entrypoint que executa `prisma migrate deploy` e só então entrega o controle ao `CMD`:

```sh
set -eu

./node_modules/.bin/prisma migrate deploy

exec "$@"
```

Migration que falha derruba o container antes da aplicação subir. O `exec` mantém o Node como PID 1, para que o SIGTERM chegue ao processo.

### Motivos

`ARCHITECTURE.md` secao 39.9 exige `prisma migrate deploy` antes do tráfego da versão dependente, mas não definia onde o comando roda. O Coolify implanta uma imagem pronta e recebe apenas o sinal de deploy (DEC-032, DEC-033): não existe etapa intermediária disponível.

Com o `schema.prisma` ainda sem models, `prisma migrate deploy` conecta, reporta `No pending migrations to apply` e encerra com 0. Isso permite exercitar conectividade, credenciais e permissões desde a R0.1, antes de existir a primeira tabela — em vez de estrear o mecanismo junto da primeira migration com conteúdo.

### Rejeitado

```text
migration no job da GitHub Actions
recurso separado no Coolify
comando manual antes de cada deploy
adiar para a R0.2
flag de ambiente para desligar
```

O runner não alcança o banco sem expor a rede privada (`CLAUDE.md` secao 65). Um recurso separado adiciona artefato a promover e versionar. Comando manual depende de disciplina num passo que não pode falhar, e `ROADMAP.md` secao 12 exige deploy automático.

### Consequências

- conectividade e permissões do banco validadas a cada deploy desde a R0.1;
- migration e código sobem no mesmo artefato, sem janela de divergência;
- subida do container fica acoplada ao banco: MySQL indisponível vira crashloop;
- migration destrutiva passa a ser aplicada por deploy automático, e a exigência de backup de `CLAUDE.md` secao 68.4 passa a depender de processo;
- rollback de imagem devolve o código, não o schema;
- comportamento sob múltiplas réplicas não testado; a R0.1 roda com réplica única.

### ADR

[`docs/decisions/0015-migrations-on-container-start.md`](decisions/0015-migrations-on-container-start.md)

---

## DEC-043 — Argon2id pelo libsodium em WebAssembly

### Status

ACCEPTED

### Decisão

A Web deriva a `RootKey` com `libsodium-wrappers-sumo`, por `crypto_pwhash` e `crypto_pwhash_ALG_ARGON2ID13`, sob três invariantes:

```text
parallelism = 1
salt        = 16 bytes
saída       = 32 bytes
```

Apenas o build ESM. `'wasm-unsafe-eval'` entra em `script-src`. O adapter roda um self-test de vetor conhecido na inicialização e recusa destravar em divergência. `CryptoAdapter` ganha `init(): Promise<void>` para acomodar o `await sodium.ready`.

### Motivos

Medido em `Intel i5-9400F @ 2.90 GHz`, Node v24.14.0: libsodium leva 55 ms em 19 MiB contra 1088 ms do `@noble/hashes` em JS puro, cerca de 20x. Como o custo do Argon2id fica no cliente (DEC-004), uma implementação lenta obriga a baixar o fator de trabalho, que é a única defesa contra o ataque descrito em `SECURITY.md` secao 8.2.

O build sumo é obrigatório porque o `libsodium-wrappers` padrão declara `crypto_pwhash` no `.d.ts` mas não o expõe em runtime. A restrição ao ESM existe porque o build CommonJS traz um fallback `wasm2js` que devolve chave errada acima de cerca de 72 MiB sem lançar erro — medido, a mesma chave incorreta para 80, 96 e 128 MiB.

### Rejeitado

```text
hash-wasm
@noble/hashes em produção
argon2-browser
manter JS puro para não mexer na CSP
```

`hash-wasm` está sem commits desde novembro de 2024, e `CLAUDE.md` secao 59 exige dependência mantida. `@noble/hashes` é a mais bem mantida, mas 20x mais lenta, e por isso entra apenas como oráculo de teste. `argon2-browser` não publica desde 2021. Manter JS puro foi descartado pelo responsável do projeto, com o custo medido apresentado.

### Consequências

- fator de trabalho passa a ser escolhido por resistência, não pela lentidão da biblioteca;
- a mesma implementação em C serve Web e Android, tornando a igualdade de bytes propriedade do build;
- a CSP ganha `'wasm-unsafe-eval'`, estritamente mais estreito que `'unsafe-eval'`;
- o bundle cresce cerca de 183 KiB gzip;
- sem WebAssembly o aplicativo não funciona, por decisão;
- a troca de biblioteca continua barata, porque as três candidatas são byte-idênticas em `p=1`.

### ADR

[`docs/decisions/0016-argon2id-libsodium-wasm.md`](decisions/0016-argon2id-libsodium-wasm.md)

---

## DEC-044 — Primitivas da Web por origem especializada

### Status

ACCEPTED

### Decisão

Cada primitiva vem da origem que a implementa melhor: CSPRNG de `crypto.getRandomValues`; Argon2id e XChaCha20-Poly1305 do `libsodium-wrappers-sumo`; HKDF-SHA-256 e X25519 do `crypto.subtle`.

Os sealed boxes do libsodium estão proibidos. O envelope da `VaultKey` é composto no padrão do RFC 9180: X25519 efêmero, HKDF-SHA-256 e XChaCha20-Poly1305. `@noble/hashes` e `@noble/ciphers` entram como `devDependencies`, fixados em `2.2.0`, apenas como oráculo de vetores. `errors.ts` ganha `CryptoAuthenticationError`.

### Motivos

`PEND-002` supunha que existisse uma biblioteca libsodium capaz de cobrir tudo. Não existe: nenhum build do `libsodium.js` expõe HKDF chamável, apenas as constantes, e `CLAUDE.md` secao 8 exige HKDF-SHA-256.

Pior, `crypto_box_curve25519xchacha20poly1305_seal_open` — a função cujo nome corresponde ao `"X25519-XCHACHA20-POLY1305"` que `docs/API.md` declara — **falha aberto**: com 200 ciphertexts adulterados devolveu conteúdo 200 vezes sem nunca lançar erro, enquanto `crypto_box_seal` lançou 200 de 200 e o AEAD lançou 50 de 50. Aceitar isso violaria `CLAUDE.md` secao 9.

`crypto.subtle` entrega HKDF-SHA-256 e X25519 em código nativo constant-time, sem bundle e sem supply chain, com saída verificada byte a byte contra `@noble`. O responsável autorizou o desvio de `ARCHITECTURE.md` secao 3.6.

### Rejeitado

```text
somente libsodium
somente @noble
@noble/ciphers para o AEAD
biblioteca de HPKE pronta
fallback em JS puro sem X25519 no WebCrypto
```

Somente libsodium é impossível, porque falta HKDF. Somente `@noble` foi rejeitada porque o próprio código documenta que o X25519 não é integralmente constant-time. `@noble/ciphers` duplicaria capacidade já carregada. Um fallback em JS puro anularia a razão de escolher o nativo.

### Consequências

- HKDF e X25519 saem nativos, constant-time, com zero bytes de bundle;
- nenhum caminho de código toca função que falha aberto;
- o envelope passa a ter a forma que `docs/API.md` já documenta;
- um oráculo independente detecta mudança silenciosa de saída do libsodium;
- três origens em vez de uma, o que aumenta o peso da suíte de vetores;
- navegador sem X25519 no WebCrypto recebe falha declarada, com piso em Chrome 133, Firefox 130 e Safari 17;
- a chave privada exige conversão entre `raw` e `pkcs8` por prefixo fixo de 16 bytes.

### ADR

[`docs/decisions/0017-web-crypto-primitives.md`](decisions/0017-web-crypto-primitives.md)

---

## DEC-045 — Parâmetros iniciais do Argon2id

### Status

ACCEPTED

### Decisão

Parâmetros padrão para contas novas, **provisórios** até a medição em Android na R0.7:

```text
memoryKib   = 65536      64 MiB
iterations  = 3
parallelism = 1
salt        = 16 bytes aleatórios por usuário
saída       = 32 bytes
```

Os parâmetros sintéticos de `GET /auth/parameters` precisam ser derivados do e-mail por HMAC com segredo do servidor, e emitir exatamente esse conjunto.

### Motivos

Custam 288 ms na máquina de referência do DEC-043, medidos em grade completa. Ficam acima do piso do OWASP para Argon2id e usam a memória e as passagens da segunda configuração recomendada pelo RFC 9106 secao 4; `p=1` vem da limitação do libsodium registrada no DEC-043, sem alterar memória nem número de passagens.

64 MiB fica ainda **abaixo do ponto em que o fallback `wasm2js` corrompe a derivação**, cerca de 72 MiB, o que dá uma segunda camada de proteção. Os presets `MODERATE` e `SENSITIVE` do libsodium, 256 MiB e 1 GiB, caem dentro da faixa corrompida.

Nenhum navegador e nenhum Android foram medidos: as medições usam o mesmo WebAssembly, mas em Node. `ARCHITECTURE.md` secao 43.3 exige as três superfícies, então a decisão sai declaradamente incompleta.

### Rejeitado

```text
19 MiB com t=2, o piso do OWASP
2 GiB com t=1, a primeira opção do RFC 9106
96 MiB com t=3
calibrar em tempo de execução no cadastro
adiar até haver Android
```

O piso do OWASP deixaria fator de trabalho na mesa sem ganho perceptível. 2 GiB é inviável em aba de navegador. 96 MiB já entra na faixa corrompida do fallback. Calibrar no cadastro amarra o parâmetro ao aparelho usado naquele momento e vira sinal de fingerprinting no endpoint público. Adiar bloquearia a R0.2 inteira por uma medição que só existe na R0.7.

### Consequências

- contas novas nascem bem acima do piso recomendado, a 288 ms medidos em desktop;
- a escolha fica fora da faixa em que o fallback do libsodium corrompe;
- os números coincidem com os que `docs/API.md` já usava como exemplo;
- 64 MiB é bastante memória para aba de celular, e isso não foi medido em celular nenhum;
- os valores são provisórios, com gatilho de revisão preso à R0.7;
- mudar o padrão obriga a atualizar o gerador de parâmetros sintéticos junto, sob risco de enumeração por valor.

### ADR

[`docs/decisions/0018-argon2id-parameters.md`](decisions/0018-argon2id-parameters.md)

---

## DEC-046 — Identificadores UUIDv7 em `CHAR(36)`

### Status

ACCEPTED

### Decisão

Todo identificador é UUIDv7 em `CHAR(36)`, na forma canônica com hifens, gerado pelo Prisma:

```prisma
id String @id @default(uuid(7)) @db.Char(36)
```

Chaves estrangeiras usam o mesmo tipo. Substitui o DEC-030, que propunha `CHAR(36)` sem definir a versão do UUID.

### Motivos

Verificado com o Prisma 6.19.3 do repositório: `String @default(uuid(7)) @db.Char(36)` valida e gera `string` no client; `Bytes @db.Binary(16)` valida mas gera `Bytes`, e `Bytes @default(uuid(7))` é **rejeitado** — com coluna binária, toda inserção precisa produzir o ID em código de aplicação.

A v7 carrega o timestamp nos 48 bits mais significativos, então os IDs crescem no tempo. Em InnoDB a chave primária é o índice clusterizado e é replicada em todo índice secundário, então inserir em ordem crescente evita divisão de página. Esse argumento vem do comportamento documentado do InnoDB: tentei medir em MySQL 8.4 real, mas a mesma carga variou de 22 s para 43 s entre repetições nesta máquina, e nenhum número meu entrou na decisão.

`CHAR(36)` custa mais espaço, mas `BINARY(16)` empurraria `Bytes` para todo DTO, contrato, rota e log. `CLAUDE.md` secao 43.2 põe segurança antes de micro-otimização, e a escala é de VPS única.

### Rejeitado

```text
UUIDv4 em CHAR(36)
UUIDv7 em BINARY(16)
chave sequencial interna com UUID público separado
ULID
```

A v4 abre mão da localidade sem ganhar nada além de não revelar o horário de criação. `BINARY(16)` é a opção mais compacta e continua correta se o volume mudar — a conversão por `UUID_TO_BIN`/`BIN_TO_UUID` é sem perda. Chave dupla complicaria o modelo de autorização. ULID difere da v7 só na codificação e não é gerado pelo Prisma.

### Consequências

- inserção em ordem crescente na chave clusterizada;
- o Prisma gera o ID, sem depender de código de aplicação;
- `id` é `string` em todas as fronteiras, sem conversão;
- `CHAR(36)` ocupa 36 bytes contra 16, multiplicado por índice secundário;
- o UUIDv7 revela o instante de criação com resolução de milissegundos;
- a migração para `BINARY(16)` continua possível, com ADR próprio.

### ADR

[`docs/decisions/0019-database-identifiers.md`](decisions/0019-database-identifiers.md)

---

## DEC-047 — Exclusão física com auditoria preservada

### Status

ACCEPTED

### Decisão

Conteúdo do cofre é excluído fisicamente, sem `deleted_at` e sem filtro de exclusão. `AuditLog` é tabela independente, sem chave estrangeira, guardando `actor_id` e `entity_id` como valores.

Cada relação tem `onDelete` declarado: `Cascade` de `Vault` para sites, credenciais, envelopes, membros e convites, e de `User` para sessões e key bundle; `Restrict` de `User` para `VaultMember`, para que excluir um proprietário não deixe cofre órfão.

### Motivos

`DATABASE.md` secao 7 impõe duas restrições em tensão: segredo excluído não pode continuar acessível, e auditoria não é apagada com a entidade. Soft delete resolve a segunda de graça e transforma a primeira em disciplina — um `findMany` sem o filtro devolve segredo que o usuário mandou apagar, e um dump posterior ainda conteria tudo que foi excluído.

Excluir a linha é o que torna o dado inacessível a partir de um dump futuro, que é o mesmo raciocínio de revogação efetiva do DEC-028. Auditoria sem FK satisfaz a segunda restrição sem reintroduzir a primeira.

### Rejeitado

```text
soft delete em todas as entidades
soft delete só no Vault
AuditLog com FK e ON DELETE SET NULL
lixeira com retenção por prazo
```

Soft delete converte invariante estrutural em disciplina de consulta. Soft delete parcial preserva o pior dos dois. Anular o `actor_id` destrói exatamente o que a auditoria guarda. Lixeira é funcionalidade de produto, fora do escopo pelo `CLAUDE.md` secao 11.

### Consequências

- segredo excluído deixa de existir, então nenhuma consulta futura pode devolvê-lo;
- a restrição 1 de `DATABASE.md` secao 7 passa a ser garantida pela estrutura;
- dump posterior à exclusão não contém o conteúdo excluído;
- exclusão é irreversível, e a interface precisa confirmar de forma inequívoca;
- excluir conta que ainda é proprietária falha por `Restrict`, exigindo passo anterior;
- auditoria passa a crescer sem ser podada pela exclusão, o que fica sob a PEND-015.

### ADR

[`docs/decisions/0020-deletion-policy.md`](decisions/0020-deletion-policy.md)

---

## DEC-048 — Duração dos tokens e cookie de refresh host-only

### Status

ACCEPTED

### Decisão

Access token de 15 minutos. Refresh token com dois limites simultâneos: 7 dias de inatividade, renovados a cada rotação, e 30 dias absolutos contados da criação da sessão, que nenhuma rotação estende. Um refresh token rotacionado há 10 segundos ou menos é aceito e devolve o mesmo par emitido pela rotação original, sem rotacionar de novo e sem estender a inatividade.

Cookie da Web: `refresh_token`, `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/api/v1/auth`, **sem atributo `Domain`**. Mais de uma ocorrência do cookie na mesma requisição é rejeitada com `401`. `SameSite` é configurável para `None`, necessário quando Web e API ficam em domínios registráveis distintos.

Os três prazos são variáveis de ambiente com faixa validada na partida: `ACCESS_TOKEN_TTL` (`1m`–`60m`), `REFRESH_TOKEN_TTL` (`1h`–`90d`) e `REFRESH_TOKEN_ABSOLUTE_TTL` (`1d`–`365d`, nunca menor que o anterior). Fora da faixa, a API não sobe. `REFRESH_COOKIE_DOMAIN` deixa de existir.

### Motivos

A `UserEncryptionKey` vive só em memória e deriva da senha por Argon2id, então sessão válida autentica mas não descriptografa: quem rouba o refresh token lê metadata e destrói conteúdo, mas recebe blobs que não abre. Isso corta os dois lados da balança — prazo longo não vaza credencial, e também não poupa o usuário de digitar a senha, que ele digita de qualquer forma em toda carga limpa da aplicação.

Os 15 minutos só se sustentam porque a revogação não depende deles: o access token carrega o `sid` e a policy recusa sessão revogada a cada requisição, como o `CLAUDE.md` secao 32 já exige. Revogação é imediata.

`Strict` é viável porque `crypta-dev` e `crypta-api-dev` são hosts distintos sob o mesmo domínio registrável — cross-origin, mas same-site. Cookie host-only impede estruturalmente que a sessão vaze entre `development`, `staging` e `production`, o que um `Domain` no apex faria, contra o `CLAUDE.md` secao 65.

### Rejeitado

```text
prefixo __Host- no nome do cookie
access token de 5 minutos ou de 1 hora
refresh token só com limite de inatividade
refresh token só com limite absoluto
SameSite=Lax fixo
Domain no apex
sem janela de tolerância
```

`__Host-` é a opção mais forte contra cookie tossing, mas obriga `Path=/` e colide com o Path restrito exigido pelo `SECURITY.md` secao 31, que está acima dos ADRs na hierarquia do `CLAUDE.md` secao 2. Fica como melhoria possível, com emenda explícita e ADR próprio. Só inatividade produz sessão perpétua; só absoluto mantém viva uma sessão abandonada. Sem tolerância, duas abas renovando juntas derrubam o usuário legítimo.

### Consequências

- o módulo `auth` da R0.2 fica desbloqueado, e era o último bloqueio formal da fase;
- revogação é imediata por decisão explícita, não em até 15 minutos;
- nenhuma sessão sobrevive a 30 dias sem que a senha reapareça;
- a tabela de sessões precisa de `created_at` e `last_used_at`, e entra na migration de identidade;
- a proteção contra cookie tossing passa a ser código no servidor, não garantia do navegador, e precisa de teste próprio;
- escolher `SameSite=None` num deployment torna a validação de `Origin` a única barreira de CSRF;
- os valores vêm do modelo de ameaça, não de telemetria, e são revisáveis dentro das faixas sem novo ADR.

### ADR

[`docs/decisions/0021-session-token-lifetimes.md`](decisions/0021-session-token-lifetimes.md)

---

## DEC-049 — Credenciais e tokens no servidor

### Status

ACCEPTED

### Decisão

O verificador do `AuthSecret` é `HMAC-SHA-256(pepper, authSecret)`, comparado em tempo constante, sobre um `AuthSecret` que precisa decodificar para exatamente 32 bytes. O pepper não fica no banco: deriva do `AUTH_SERVER_SECRET` por HKDF-SHA-256 com `info="auth-secret-pepper"`. O mesmo segredo, com `info="kdf-parameters-decoy"`, gera os parâmetros KDF sintéticos de `GET /auth/parameters`, que precisam ser determinísticos por e-mail.

O segredo é versionado (`v<N>:<base64url>`), com `AUTH_SERVER_SECRET_PREVIOUS` opcional. Cada usuário guarda a versão que gerou o seu verificador, e o login recalcula e regrava quando a versão não for a corrente. É o que torna a rotação possível sem que ninguém troque de senha.

Refresh token: 32 bytes de CSPRNG em base64url, `SHA-256` em repouso, índice único, busca pelo hash. Sem pepper — não há preimagem adivinhável a proteger.

Access token: `EdDSA` sobre Ed25519, pela `jose`, com `iss`, `aud`, `sub`, `sid`, `iat` e `exp`, e nada mais. `JWT_PRIVATE_KEY` e `JWT_PUBLIC_KEY` recebem o base64 do PEM em uma linha, e a partida assina e verifica um valor de prova para confirmar que formam par.

Bloqueio progressivo por conta no MySQL: `LOGIN_MAX_ATTEMPTS` falhas consecutivas iniciam uma espera de `LOGIN_LOCK_INITIAL_SECONDS`, que dobra a cada falha até `LOGIN_LOCK_MAX_SECONDS`, zera no sucesso e nunca é permanente. Filtro por IP em memória, `AUTH_IP_RATE_LIMIT` por minuto, pelo `@nestjs/throttler`.

`ACCOUNT_LOCKED` e `ACCOUNT_DISABLED` deixam de aparecer no login de quem não autenticou: só são devolvidos quando o `AuthSecret` confere e o acesso é negado mesmo assim.

### Motivos

O `AuthSecret` não é senha — é saída de Argon2id de 64 MiB e t=3 no cliente. Diante de um banco vazado, esse custo já domina cada tentativa offline; um segundo Argon2id no servidor somaria um fator próximo de dois ao atacante e dobraria a latência de toda requisição de login, que não é autenticada, virando vetor de exaustão de memória.

O que o pepper acrescenta é diferente e concreto: `DATABASE.md` secao 9 registra que os secrets da aplicação têm backup separado do banco, então o vazamento mais provável entrega o dump sem entregar o pepper — e sem ele o ataque offline contra a senha não começa.

Ed25519 não tem parâmetro para errar, ao contrário do tamanho de chave do RSA e do nonce por assinatura do ECDSA. A `jose` exige que o algoritmo esperado seja passado na verificação, o que fecha por construção a confusão de algoritmo que origina CVE recorrente em bibliotecas de JWT.

Devolver `ACCOUNT_LOCKED` a um login errado revela que o e-mail está cadastrado, contra `SECURITY.md` secao 25. Condicioná-lo à verificação bem-sucedida entrega a informação a quem já provou ter a senha, e a mais ninguém. Como `SECURITY.md` está acima da `API.md` na hierarquia do `CLAUDE.md` secao 2, quem cede é a `API.md`.

### Rejeitado

```text
Argon2id no servidor sobre o AuthSecret
Argon2id no servidor com parâmetros baratos
bcrypt
SHA-256 com salt por usuário, sem pepper
nenhum segredo de servidor
HS256 no access token
RS256
@nestjs/jwt com jsonwebtoken
bloqueio só por IP
bloqueio por conta em memória
ACCOUNT_LOCKED sempre visível no login
```

O bcrypt trunca em 72 bytes e limita a entropia do valor que deveria proteger. O salt por usuário não resolve nada aqui, porque o `kdfSalt` do cliente já é por usuário e não há tabela pré-computada a impedir. HS256 descartaria a verificação por chave pública que o `.env.example` já reservou. Bloqueio só por IP não protege o dono da conta contra um atacante com IPs rotativos; em memória, ele some a cada deploy.

### Consequências

- o módulo `auth` fica de fato desbloqueado, com valor para as quatro lacunas que impediam escrever o código;
- um dump sem os secrets da aplicação não permite iniciar o ataque offline contra as senhas;
- o login não executa KDF caro em rota não autenticada, então não vira vetor de negação de serviço;
- nasce um segredo cuja perda torna toda conta inacessível, já que a V1 não tem recuperação — mitigado pela rotação preguiçosa e pelo backup junto das chaves JWT;
- a tabela de usuários ganha verificador, versão do segredo, contador de falhas e instante de liberação, e a de sessões ganha o hash com índice único; entram na migration de identidade;
- uma tentativa de login falha passa a ser escrita no banco;
- o limite por IP degrada em silêncio com mais de uma réplica;
- duas dependências novas em ponto crítico, `jose` e `@nestjs/throttler`;
- a verificação do bloqueio precisa vir depois do cálculo do verificador, ou o oráculo volta pelo tempo de resposta.

### ADR

[`docs/decisions/0022-server-side-credentials.md`](decisions/0022-server-side-credentials.md)

---

## DEC-050 — AAD de identidade e formato do envelope de chave

### Status

ACCEPTED

### Decisão

A `AadContext` vira união discriminada por `scope`, e o prefixo de domínio passa de `vault-aad/v1` para `crypta-aad/v2`. O escopo é o primeiro segmento serializado:

```text
crypta-aad/v2|5:vault|10:credential|36:<entityId>|36:<vaultId>|1:1|1:1
crypta-aad/v2|4:user|15:user-key-bundle|43:<publicKey>|1:1|1:1
```

No escopo `user` a AAD amarra a **chave pública do próprio par**, não um `userId`. O ciphertext passa a declarar de qual metade pública ele é a metade privada.

O envelope de chave é documentado como implementado: o campo `nonce` sai da `API.md` secao 15, porque ele é derivado por HKDF e não trafega, e o algoritmo passa a se chamar `X25519-HKDF-SHA256-XCHACHA20-POLY1305`, que é a composição real. `crypto-core` ganha `key-envelope.ts` com `buildKeyEnvelope`, `parseKeyEnvelope` e `sealedBytesFromEnvelope`, único lugar que conhece o enquadramento `ephemeralPublicKey || ciphertext`.

> **Correção de 11 de agosto de 2026.** A troca acima alcançou a secao 15, que **define** o envelope, e deixou intactas as quatro secoes que o **transportam**: 34, 38, 48 e 68 seguiram exibindo `X25519-XCHACHA20-POLY1305` e um campo `nonce`. Encontrado ao abrir a R0.3, antes de o DTO de `POST /vaults` ser escrito a partir de um exemplo que `parseKeyEnvelope` recusaria. Corrigir a definição de um formato não corrige seus exemplos: quem escreve o endpoint lê a rota, não a secao de referência.

`cryptoVersion` continua 1: o conjunto de algoritmos não mudou, e nenhum payload com outra combinação chegou a existir.

`crypto-core` passa a orquestrar a identidade — `deriveIdentitySecrets`, `createUserKeyBundle` e `openUserKeyBundle` — recebendo os adapters por injeção, sem primitivas e sem dependências. Os vetores de identidade ficam em `crypto-core`, onde `@crypta/crypto-mobile` poderá importá-los.

### Motivos

A primeira coisa que a R0.2 cifra é a chave privada do usuário, que não pertence a cofre nenhum. A AAD anterior exigia `vaultId` não-vazio, então só restariam string vazia em campo obrigatório ou `vaultId` sentinela — campo sem significado dentro de formato criptográfico, para sempre.

O identificador natural seria o `userId`, e ele não existe quando o cliente cifra: é UUIDv7 gerado pelo Prisma no servidor (ADR 0019). Amarrar à chave pública resolve isso e protege mais. Um servidor que troque `publicKey` mantendo `encryptedPrivateKey` faria os envelopes de `VaultKey` dos outros membros serem endereçados a uma chave que o usuário não abre — ou à de um terceiro. Com a AAD, a troca aparece no desbloqueio; com `userId`, não apareceria nunca.

O envelope divergia: a `API.md` prometia um `nonce` que a implementação deriva e nunca transmite, sob um nome de algoritmo que omitia o HKDF e sugeria a família de sealed box que o ADR 0017 proibiu. Nada em `crypto-core` reconciliava os dois, então cada chamador futuro fatiaria o blob por conta própria — que foi como a divergência surgiu.

Tudo isso é gratuito agora e caro depois. Não existe conta, cofre, envelope nem migration: `vault-aad/v1` nunca produziu ciphertext persistido. A `SECURITY.md` secao 18 já registrava essa janela.

### Rejeitado

```text
acrescentar user-key-bundle a AAD_ENTITY_TYPES com vaultId vazio
usar userId como identificador do escopo user
usar o e-mail normalizado
AAD do bundle sem identificador nenhum
manter nonce no envelope e passar a transmiti-lo
manter o nome X25519-XCHACHA20-POLY1305
adiar para a R0.3
```

O e-mail é alterável por `PATCH /users/me`, e a alteração tornaria a chave privada permanentemente indecifrável. Transmitir o nonce exigiria trocar uma garantia estrutural — par efêmero novo a cada envelope, logo nonce nunca repetido — por disciplina de geração. Adiar para a R0.3 não funciona porque o key bundle da R0.2 já é o primeiro ciphertext.

### Consequências

- material de identidade ganha AAD própria, sem campo vazio nem sentinela;
- troca de `publicKey` por servidor malicioso passa a ser detectada no desbloqueio;
- documentação e implementação do envelope voltam a descrever a mesma coisa, com parser único em `crypto-core`;
- `HKDF_INFO` deixa de ser constante decorativa: existe um só lugar que escolhe os rótulos, o que torna a separação do ADR 0004 verificável;
- um vetor congelado foi reescrito, com exceção registrada — precisa continuar sendo exceção;
- amarrar a `publicKey` acopla o bundle ao par: trocar o par exige recifrar;
- `crypto-core` cresce de formato puro para formato mais orquestração, ainda sem primitivas e sem dependências;
- `@crypta/crypto-mobile` divergir da AAD continua sendo o risco aberto, mitigado pelo vetor canônico congelado e por `PEND-003`.

### ADR

[`docs/decisions/0023-identity-aad-and-key-envelope.md`](decisions/0023-identity-aad-and-key-envelope.md)

---

## DEC-051 — Comportamento da janela de tolerância na rotação

### Status

ACCEPTED

### Decisão

Dentro da janela de 10 segundos, apresentar o refresh token imediatamente anterior **não é reutilização**: a sessão sobrevive, a família não cai, e o chamador recebe um par **novo**, não o par que a rotação original emitiu. A rotação de tolerância **não move** `last_used_at`, então não estende o limite de inatividade.

Fora da janela, nada muda: o token anterior derruba a família inteira.

A troca do token é condicional no banco — o hash apresentado entra no `WHERE` do `UPDATE` —, então duas rotações simultâneas disputam a linha e apenas uma escreve. A perdedora recusa em vez de sobrescrever.

### Motivos

O ADR 0021 descreveu a janela dizendo que ela "devolve o mesmo par que a rotação original emitiu". Isso não é executável: o servidor guarda `SHA-256(token)` por decisão do ADR 0022, e hash não tem volta. Devolver o mesmo token exigiria persistir o valor em texto aberto — anulando a coluna `refresh_token_hash` e convertendo um dump do banco, que o ADR 0022 trata como o vazamento mais provável, em sessões prontas para uso.

O propósito do ADR 0021, porém, não depende de o par ser literalmente o mesmo: ele quer que duas abas renovando ao mesmo tempo não sejam tratadas como reutilização. Rotacionar de novo entrega isso, e as duas abas terminam com credencial funcionando.

Dentro da janela passam a valer dois tokens, o corrente e o anterior. Isso é inerente a qualquer janela de tolerância, inclusive à do ADR 0021, e não é introduzido aqui. Na Web a exposição real é ainda menor: o cookie é substituído pelo navegador na primeira rotação, então o token anterior só reaparece em requisição que já estava em voo.

### Rejeitado

```text
guardar o refresh token em texto aberto para poder repeti-lo
guardar em texto aberto apenas durante os 10 segundos
devolver só um access token novo, sem rotacionar
remover a janela
token de uso único com contador, no lugar da janela temporal
```

Guardar em claro por 10 segundos reduz a janela mas não o modo de falha, e cria um caminho de escrita de segredo que uma refatoração futura pode esquecer de limpar. Devolver só o access token deixaria o chamador com o token anterior, que sai da janela e vira reutilização — a aba concorrente cairia de qualquer forma, com atraso e sintoma pior.

### Consequências

- a janela passa a ser implementável sem persistir segredo em claro;
- duas abas renovando juntas continuam funcionando, que é o objetivo do ADR 0021;
- a inatividade não é estendida pela rotação de tolerância, como aquele ADR exige;
- a detecção de reutilização fora da janela fica intacta;
- o texto do ADR 0021 deixa de descrever o comportamento real e passa a depender deste para ser lido corretamente — ADR publicado não é reescrito;
- cada passagem pela janela custa uma escrita a mais no banco;
- dois tokens válidos dentro da janela, assumido e não introduzido aqui.

### ADR

[`docs/decisions/0024-rotation-grace-window.md`](decisions/0024-rotation-grace-window.md)

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

| ID           | Tema                                          | Status               | Bloqueia         |
| ------------ | --------------------------------------------- | -------------------- | ---------------- |
| ~~PEND-001~~ | ~~Biblioteca Argon2id Web~~                   | RESOLVIDA em DEC-043 | —                |
| ~~PEND-002~~ | ~~Biblioteca libsodium Web~~                  | RESOLVIDA em DEC-044 | —                |
| PEND-003     | Biblioteca libsodium Mobile                   | REVIEW_REQUIRED      | Mobile           |
| ~~PEND-004~~ | ~~Parâmetros Argon2id~~                       | RESOLVIDA em DEC-045 | —                |
| ~~PEND-005~~ | ~~UUIDv4 ou UUIDv7~~                          | RESOLVIDA em DEC-046 | —                |
| ~~PEND-006~~ | ~~`CHAR(36)` ou `BINARY(16)`~~                | RESOLVIDA em DEC-046 | —                |
| ~~PEND-007~~ | ~~Duração do access token~~                   | RESOLVIDA em DEC-048 | —                |
| ~~PEND-008~~ | ~~Duração do refresh token~~                  | RESOLVIDA em DEC-048 | —                |
| ~~PEND-009~~ | ~~SameSite e domínio do cookie~~              | RESOLVIDA em DEC-048 | —                |
| PEND-010     | Limites de CSV                                | REVIEW_REQUIRED      | Importação       |
| PEND-011     | Expiração de convite                          | REVIEW_REQUIRED      | Compartilhamento |
| PEND-012     | Estratégia de envio do convite                | REVIEW_REQUIRED      | Compartilhamento |
| PEND-013     | Bloqueio de screenshot Android                | REVIEW_REQUIRED      | Mobile           |
| ~~PEND-014~~ | ~~Política de hard/soft delete~~              | RESOLVIDA em DEC-047 | —                |
| PEND-015     | Retenção de auditoria                         | REVIEW_REQUIRED      | Operação         |
| ~~PEND-016~~ | ~~Licença open source~~                       | RESOLVIDA em DEC-040 | —                |
| PEND-017     | Estratégia de recuperação                     | REVIEW_REQUIRED      | Pós-V1           |
| PEND-018     | Biblioteca de CSV                             | REVIEW_REQUIRED      | Importação       |
| PEND-019     | Ferramenta de container scan                  | REVIEW_REQUIRED      | CI               |
| PEND-020     | Estratégia de autolock                        | REVIEW_REQUIRED      | V1.1             |
| PEND-021     | Autenticação GitHub Actions → Coolify         | REVIEW_REQUIRED      | Deploy           |
| PEND-022     | Visibilidade dos packages no GHCR             | REVIEW_REQUIRED      | Deploy           |
| PEND-023     | Reviewers do Environment `production`         | REVIEW_REQUIRED      | Release          |
| PEND-024     | Retenção de manifests e artefatos de RC       | REVIEW_REQUIRED      | Operação         |
| PEND-025     | Política final de proteção e retenção de tags | REVIEW_REQUIRED      | Release          |
| ~~PEND-026~~ | ~~Credenciais e tokens no servidor~~          | RESOLVIDA em DEC-049 | —                |

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

Exemplo, agora real:

```text
DEC-030 SUPERSEDED BY DEC-046
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
