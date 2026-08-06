# CLAUDE.md

# Instruções Operacionais para Claude Code

> **Status:** Obrigatório  
> **Versão:** 0.2.0  
> **Última atualização:** 31 de julho de 2026

---

## 1. Finalidade

Este arquivo define como o Claude Code deve trabalhar neste repositório.

As regras são obrigatórias para:

- criação de código;
- alteração de código;
- testes;
- documentação;
- migrations;
- dependências;
- segurança;
- refatorações;
- análise de bugs;
- deploy;
- revisão.

O objetivo é impedir:

- mudanças arquiteturais acidentais;
- regressões de segurança;
- código duplicado;
- dependências desnecessárias;
- divergência entre documentação e implementação;
- exposição de segredos;
- funcionalidades fora do escopo.

---

## 2. Hierarquia de autoridade

Ao tomar decisões, siga esta ordem:

1. instrução explícita do responsável pelo projeto;
2. `SECURITY.md`;
3. `PROJECT_SCOPE.md`;
4. `ARCHITECTURE.md`;
5. `DECISIONS.md` e ADRs;
6. `GITHUB_RELEASE_FLOW.md`;
7. `API.md`;
8. `DATABASE.md`;
9. `STYLE_GUIDE.md`;
10. `TELAS.md`;
11. `BACKLOG.md`;
12. `ROADMAP.md`;
13. `CONTRIBUTING.md`;
14. `config_user.md`, apenas para tarefas de configuração manual;
15. convenções existentes no código.

Em caso de conflito:

- não escolha silenciosamente;
- identifique o conflito;
- explique o impacto;
- proponha correção;
- não altere arquitetura crítica sem autorização.

---

## 3. Resumo do projeto

O produto é um cofre de senhas multiusuário e self-hosted.

Estrutura:

```text
User
→ Vault
→ Site
→ Credential
```

Um cofre pode ser:

- privado;
- compartilhado.

Papéis da V1:

```text
OWNER
EDITOR
```

Cada site possui:

- nome obrigatório;
- link opcional;
- várias credenciais.

Cada credencial possui:

- usuário;
- senha;
- observação opcional.

Clientes:

- Web;
- Android;
- extensão futura.

---

## 4. Stack fixa

### Monorepo

- Node.js;
- TypeScript;
- pnpm workspaces.

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

- NestJS;
- TypeScript;
- Prisma ORM;
- MySQL;
- Swagger/OpenAPI;
- Jest;
- Supertest.

### Mobile

- React Native;
- Expo;
- TypeScript;
- Android Keystore.

### Infra

- GitHub Actions;
- GitHub Container Registry — GHCR;
- Coolify;
- Dockerfile por app;
- MySQL em rede privada;
- Environments `development`, `staging` e `production`;
- três projetos isolados no Coolify;
- promoção do mesmo artefato homologado;
- sem Docker Compose no deploy.

Não substitua nenhuma tecnologia sem:

- justificativa;
- análise de impacto;
- ADR;
- autorização explícita.

---

## 5. Arquitetura fixa

O backend será um monólito modular.

Não introduzir:

- microserviços;
- filas;
- Redis;
- Kafka;
- RabbitMQ;
- CQRS completo;
- event sourcing;
- GraphQL;
- banco adicional;
- service mesh;
- Kubernetes;
- Docker Compose no deploy;

sem decisão formal.

---

## 6. Estrutura do monorepo

```text
/
├── apps/
│   ├── web/
│   ├── api/
│   └── mobile/
│
├── packages/
│   ├── contracts/
│   ├── crypto-core/
│   ├── crypto-web/
│   ├── crypto-mobile/
│   ├── validation/
│   ├── eslint-config/
│   └── tsconfig/
│
├── docs/
│   └── decisions/
│
├── .github/
│   ├── release.yml
│   └── workflows/
│       ├── ci.yml
│       ├── validate-pr-flow.yml
│       ├── cleanup-temporary-branches.yml
│       ├── start-release.yml
│       ├── deploy-development.yml
│       ├── publish-prerelease.yml
│       └── publish-production.yml
│
├── VERSION
├── GITHUB_RELEASE_FLOW.md
├── config_user.md
├── README.md
├── CLAUDE.md
└── pnpm-workspace.yaml
```

Não criar novas pastas raiz sem necessidade documentada.

Não remover ou renomear arquivos de workflow sem verificar:

- rulesets;
- checks obrigatórios;
- Environments;
- secrets;
- webhooks do Coolify;
- documentação.

## 7. Regra principal de segurança

O backend não deve receber ou armazenar em texto aberto:

- senha original da conta;
- RootKey;
- UserEncryptionKey;
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

O conteúdo sensível é criptografado no cliente.

Qualquer implementação que viole essa regra deve ser interrompida.

---

## 8. Modelo criptográfico

A implementação deverá seguir:

```text
UserPassword
→ Argon2id
→ RootKey
→ HKDF("auth")
→ AuthSecret

RootKey
→ HKDF("user-encryption")
→ UserEncryptionKey
```

Chaves:

```text
UserKeyPair
VaultKey
VaultKeyEnvelope
```

Algoritmos definidos:

- Argon2id;
- HKDF-SHA-256;
- XChaCha20-Poly1305;
- X25519.

Não criar criptografia própria.

Não substituir algoritmos sem ADR.

---

## 9. Regras criptográficas obrigatórias

Nunca:

- reutilizar nonce;
- usar `Math.random()`;
- ignorar erro de autenticação;
- aceitar ciphertext adulterado;
- remover AAD;
- alterar formato sem versionar;
- persistir chave aberta;
- registrar segredo;
- adicionar fallback inseguro.

Sempre:

- usar CSPRNG;
- versionar payload;
- usar AAD;
- falhar fechado;
- testar adulteração;
- manter vetores cross-platform;
- testar Web e Android.

---

## 10. Fluxo de trabalho obrigatório

Antes de alterar código:

1. leia os documentos relacionados;
2. inspecione a implementação existente;
3. identifique dependências;
4. identifique impacto em segurança;
5. identifique impacto em API, banco, Web e Android;
6. defina um plano curto;
7. altere o mínimo necessário.

Depois de alterar:

1. execute lint;
2. execute typecheck;
3. execute testes relevantes;
4. execute build;
5. atualize documentação;
6. revise o diff;
7. confirme que não há segredo;
8. resuma mudanças e riscos.

---

## 11. Não inventar requisitos

Não adicionar automaticamente:

- favoritos;
- tags;
- TOTP;
- cartões;
- SSH keys;
- anexos;
- lixeira;
- histórico;
- exportação;
- biometria;
- offline;
- extensão;
- autofill;
- perfil leitor;
- transferência de propriedade.

Se uma ideia for útil, registre como sugestão. Não implemente sem aprovação.

---

## 12. Não alterar escopo silenciosamente

Mudanças de escopo devem atualizar:

- `PROJECT_SCOPE.md`;
- `BACKLOG.md`;
- `ROADMAP.md`;
- `TELAS.md`;
- outros documentos impactados.

---

## 13. Padrões TypeScript

Obrigatório:

- `strict`;
- tipos explícitos em fronteiras;
- `unknown` em vez de `any`;
- type guards;
- schemas;
- retorno previsível;
- tratamento de nulidade.

Evitar:

- `any`;
- `as` sem validação;
- non-null assertion;
- casts encadeados;
- tipos duplicados;
- enums divergentes.

---

## 14. Nomenclatura

Código em inglês.

Interface em português do Brasil.

### Variáveis e funções

```text
camelCase
```

### Tipos e classes

```text
PascalCase
```

### Arquivos

```text
kebab-case
```

### Constantes globais

```text
UPPER_SNAKE_CASE
```

### Booleans

```text
isActive
hasAccess
canEdit
shouldRefresh
```

---

## 15. Imports

Ordem:

1. Node;
2. dependências externas;
3. packages internos;
4. aliases;
5. relativos;
6. tipos;
7. estilos.

Evite imports relativos profundos.

---

## 16. Funções

Funções devem:

- ter uma responsabilidade;
- ter nome explícito;
- usar early return;
- evitar efeitos ocultos;
- evitar muitos parâmetros;
- evitar complexidade desnecessária.

Mais de três parâmetros: considere objeto.

Não transforme toda lógica em abstração genérica.

---

## 17. Comentários

Comente:

- motivo;
- risco;
- decisão;
- workaround;
- invariável.

Não comente o óbvio.

Não escreva comentários que contradigam o código.

---

## 18. TODOs

Não adicionar TODO genérico.

Formato:

```ts
// TODO(issue-123): Add incremental vault synchronization.
```

Se não houver issue, não deixar TODO permanente.

---

# REGRAS DA WEB

---

## 19. Organização Web

Organize por feature:

```text
features/
├── auth/
├── vaults/
├── sites/
├── credentials/
├── invitations/
├── import/
├── sessions/
└── settings/
```

---

## 20. Componentes React

Componentes devem:

- ser funcionais;
- ter props tipadas;
- ter responsabilidade clara;
- não chamar Prisma;
- não acessar diretamente storage sensível;
- não conter crypto espalhada;
- não conter regra de autorização real.

---

## 21. Estado remoto

Use TanStack Query.

Não duplicar server state no Zustand.

Query keys devem ser centralizadas por feature.

Limpar cache no logout.

Não persistir conteúdo descriptografado.

---

## 22. Estado global

Use Zustand apenas para:

- sessão em memória;
- desbloqueio;
- chaves temporárias;
- preferências visuais;
- estado global real.

Não usar Zustand como banco de dados do frontend.

---

## 23. Formulários

Use:

- React Hook Form;
- Zod;
- mensagens em português;
- validação cliente;
- validação servidor.

Não perder valores do formulário após erro de API.

---

## 24. API client Web

Centralizar Axios.

Obrigatório:

- base URL por env;
- request ID;
- access token em memória;
- refresh cookie;
- fila para refresh concorrente;
- normalização de erros;
- limpeza no logout.

Não armazenar access token em localStorage.

---

## 25. Senhas na interface

Senha deve:

- ficar mascarada;
- revelar somente por ação;
- voltar a ficar oculta;
- não aparecer em toast;
- não aparecer em URL;
- não aparecer em logs;
- poder ser copiada sem revelar.

---

## 26. Importação CSV

O arquivo deve ser processado no navegador.

Não criar endpoint de upload de CSV.

Fluxo:

```text
parse
→ validate
→ preview
→ resolve
→ encrypt
→ commit
```

Limpar dados temporários após uso.

---

## 27. Acessibilidade

Toda UI deve considerar:

- teclado;
- foco;
- labels;
- aria;
- contraste;
- leitor de tela;
- mensagens de erro;
- área de toque.

---

# REGRAS DA API

---

## 28. Estrutura NestJS

```text
module/
├── controllers/
├── services/
├── repositories/
├── policies/
├── dto/
├── mappers/
├── errors/
└── tests/
```

---

## 29. Controllers

Controllers devem:

- receber request;
- validar DTO;
- obter contexto;
- chamar caso de uso;
- retornar contrato.

Controllers não devem:

- conter query Prisma;
- conter regra de negócio complexa;
- conter autorização completa;
- descriptografar conteúdo.

---

## 30. Services

Services coordenam casos de uso.

Separar services quando o módulo ficar amplo.

Preferir:

```text
create-vault.service.ts
delete-vault.service.ts
accept-invitation.service.ts
```

em vez de um único service gigantesco.

---

## 31. Repositories

Todo acesso Prisma deve ficar em repositories.

Exceção somente com justificativa e revisão.

Usar:

- selects mínimos;
- consultas contextualizadas;
- transações;
- filtros de autorização.

---

## 32. Policies

Autorização deve ser centralizada.

Verificar:

```text
user
session
membership
role
vault
resource
state
```

Nunca depender do frontend.

---

## 33. DTOs

DTOs:

- declaram somente campos aceitos;
- validam tipos;
- validam tamanho;
- rejeitam campos indevidos quando aplicável;
- não são modelos Prisma;
- não incluem campos internos.

---

## 34. Mappers

Não retornar objetos Prisma diretamente.

Mapear:

```text
database
→ domain
→ API response
```

---

## 35. Erros

Usar códigos estáveis.

Exemplos:

```text
INVALID_CREDENTIALS
VAULT_ACCESS_DENIED
VERSION_CONFLICT
SESSION_REVOKED
```

Nunca retornar:

- stack;
- query;
- segredo;
- variável interna;
- path interno;
- body sensível.

---

## 36. Logs

Logs estruturados.

Permitido:

- request ID;
- actor ID;
- action;
- entity ID;
- status;
- duração.

Proibido:

- password;
- authSecret;
- refreshToken;
- accessToken;
- cookie;
- privateKey;
- VaultKey;
- inviteSecret;
- CSV;
- credential username;
- notes;
- ciphertext completo.

---

## 37. Transações

Obrigatórias em:

- setup;
- criação de cofre;
- aceite de convite;
- remoção;
- rekey;
- importação por cofre;
- mudança de senha;
- revogação em massa;
- purge.

---

## 38. Idempotência

Implementar em operações críticas conforme `API.md`.

Mesma chave + mesmo payload:

- retornar resposta anterior.

Mesma chave + payload diferente:

- `409 IDEMPOTENCY_CONFLICT`.

---

## 39. Concorrência

Vault, Site e Credential usam `version`.

Toda mutation relevante recebe:

```text
expectedVersion
```

Não sobrescrever silenciosamente.

---

## 40. IDOR

Toda rota deve ser testada com:

- recurso de outro usuário;
- recurso de outro cofre;
- membership removido;
- editor executando ação de owner;
- IDs cruzados.

---

# REGRAS DO BANCO

---

## 41. Prisma

Use Prisma.

Não usar SQL direto sem necessidade.

Não usar `db push` em produção.

Migrations devem ser versionadas.

---

## 42. MySQL

Testes de integração usam MySQL real.

Não usar SQLite como substituto.

---

## 43. Schema

Ao alterar schema:

1. atualizar `DATABASE.md`;
2. criar migration;
3. testar banco vazio;
4. testar banco existente;
5. revisar índices;
6. revisar foreign keys;
7. revisar delete behavior;
8. validar no Coolify.

---

## 44. Dados sensíveis

Nunca criar colunas plaintext para:

- vault name;
- site name;
- link;
- credential username;
- password;
- notes;
- VaultKey;
- private key.

---

## 45. Exclusões

Siga `DATABASE.md`.

Não adicionar cascade indiscriminado.

Não apagar auditoria sem decisão.

---

# REGRAS DO MOBILE

---

## 46. React Native

Reutilize:

- contracts;
- validation;
- crypto-core;
- lógica pura.

Não tente compartilhar componentes DOM com React Native.

---

## 47. Android Keystore

Refresh token deve ficar no Keystore.

Não usar AsyncStorage para segredo.

---

## 48. APK

Somente release build para uso real.

Nunca versionar signing key.

Não publicar APK debug como release.

---

## 49. Screenshots

Aplicar proteção conforme a decisão definida.

Não desabilitar proteção sem revisão.

---

# TESTES

---

## 50. Regra geral

Toda mudança de comportamento precisa de teste.

Não remover teste para fazer CI passar.

Corrija a causa.

---

## 51. Unitários

Criar para:

- regras;
- policies;
- validators;
- mappers;
- hooks;
- crypto;
- serializers;
- error mapping.

---

## 52. Integração

Criar para:

- banco;
- API;
- autenticação;
- autorização;
- sessions;
- invitations;
- import;
- rekey;
- concurrency.

---

## 53. E2E

Criar ou atualizar quando a mudança afeta fluxo crítico.

---

## 54. Crypto

Mudanças de crypto exigem:

- vetores;
- Web;
- Android;
- adulteração;
- AAD incorreta;
- nonce;
- versionamento;
- migration.

---

## 55. Test data

Use somente dados fictícios.

Permitido:

```text
alice@example.test
bob@example.test
https://example.com
```

Proibido usar dados reais do responsável pelo projeto.

---

# DOCUMENTAÇÃO

---

## 56. Atualização obrigatória

Quando alterar:

### Feature

Atualize:

- Scope;
- Backlog;
- Telas.

### API

Atualize:

- API;
- contracts;
- Swagger.

### Banco

Atualize:

- Database;
- Architecture.

### Segurança

Atualize:

- Security;
- Architecture;
- Decisions.

### Release ou fluxo GitHub

Atualize:

- `ROADMAP.md`;
- `GITHUB_RELEASE_FLOW.md`;
- `config_user.md`, quando houver configuração manual;
- `BACKLOG.md`;
- changelog futuro;
- arquivo `VERSION`, somente no início de release ou hotfix.

---

## 57. ADR

Criar ADR para:

- mudança de stack;
- crypto;
- auth;
- banco;
- sessão;
- deploy;
- dependência estrutural;
- migration destrutiva;
- quebra de API;
- recuperação;
- offline;
- extensão.

---

## 58. Exemplos

Nunca incluir segredo real.

Use placeholders explícitos.

---

# DEPENDÊNCIAS

---

## 59. Antes de adicionar

Verifique:

- já existe solução?
- é realmente necessária?
- é mantida?
- licença é compatível?
- possui vulnerabilidades?
- aumenta bundle?
- funciona no mobile?
- duplica outra biblioteca?

---

## 60. Dependências críticas

Mudanças em:

- crypto;
- auth;
- CSV;
- cookies;
- storage;
- database;
- CI;
- container;

exigem análise adicional.

---

## 61. Lockfile

Preservar `pnpm-lock.yaml`.

Não regenerar sem motivo.

---

# GIT, BRANCHES E RELEASES

---

## 62. Conventional Commits

Formato:

```text
type(scope): description
```

Exemplos:

```text
feat(vaults): add encrypted vault creation
fix(auth): handle reused refresh token
security(logs): redact sensitive headers
test(crypto): add mobile compatibility vectors
docs(database): describe rekey tables
```

---

## 63. Commits

Devem ser:

- pequenos;
- coerentes;
- revisáveis;
- sem segredo;
- com testes quando aplicável.

Não misturar refatoração ampla e feature sem necessidade.

---

## 64. Pull requests

Ao preparar PR, informar:

- objetivo;
- mudanças;
- segurança;
- testes;
- docs;
- migrations;
- riscos;
- rollback;
- ambiente afetado;
- versão ou RC, quando aplicável.

Claude deve verificar se a origem e o destino respeitam `GITHUB_RELEASE_FLOW.md`.

### Fluxos permitidos

```text
feature/*  → develop
bugfix/*   → develop
chore/*    → develop
refactor/* → develop
docs/*     → develop
security/* → develop

fix/*      → release/*
release/*  → staging
staging    → main
main       → develop

hotfix/*   → main
main       → release/*   somente quando houver release ativa
```

Não sugerir:

```text
feature/* → staging
feature/* → main
fix/* → develop
release/* → main
```

### Estratégias de merge

```text
branches temporárias → Squash and merge
release/* → staging  → Create a merge commit
staging → main       → Create a merge commit
main → develop       → Create a merge commit
main → release/*     → Create a merge commit
```

### Regras absolutas

Claude não deve:

- fazer push direto em branch protegida;
- contornar `validate-pr-flow.yml`;
- corrigir homologação diretamente em `staging`;
- apagar `release/*` após a primeira RC;
- mover tag publicada;
- reutilizar uma versão já publicada;
- esquecer a sincronização `main → develop`;
- misturar versão PATCH do hotfix com o `VERSION` de uma release futura.

---

## 64.1 Arquivo `VERSION`

O arquivo contém somente:

```text
MAJOR.MINOR.PATCH
```

Alterar apenas ao:

- iniciar `release/x.y.z`;
- criar hotfix com nova versão PATCH;
- executar migração de versionamento formalmente aprovada.

Não adicionar prefixo `v`.

---

## 64.2 Release candidate

Ao trabalhar em release:

```text
develop
→ release/x.y.z
→ staging
→ vX.Y.Z-rc.N
```

Correção:

```text
release/x.y.z
→ fix/*
→ release/x.y.z
→ staging
→ próxima RC
```

A branch `release/*` permanece até:

- publicação em produção;
- sincronização `main → develop`;
- confirmação de que não há correções exclusivas.

---

## 64.3 Release estável

Fluxo:

```text
staging
→ main
→ vX.Y.Z
→ GitHub Release
→ main → develop
```

Produção não deve reconstruir uma release normal.

Deve promover os mesmos digests registrados na RC aprovada.

---

## 64.4 Hotfix

Fluxo:

```text
main
→ hotfix/*
→ main
→ nova versão PATCH
→ main → develop
```

Se existir release ativa:

```text
main → release/x.y.z
```

Preservar no `VERSION` a versão futura da release ativa.

# DEPLOY E INFRA

---

## 65. Ambientes no Coolify

Estrutura obrigatória:

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

Não compartilhar banco, secrets ou domínios entre ambientes.

Não criar Docker Compose para deploy.

---

## 66. Dockerfiles

Cada aplicação possui seu Dockerfile.

Requisitos:

- multi-stage;
- usuário não-root quando possível;
- sem `.env`;
- sem segredo;
- build reproduzível;
- health check;
- `.dockerignore`;
- build args de versão sem incluir segredo.

Build metadata:

```text
APP_VERSION
APP_COMMIT
APP_ENVIRONMENT
APP_BUILT_AT
```

---

## 67. GHCR

Imagens oficiais:

```text
ghcr.io/<owner>/<repository>-web
ghcr.io/<owner>/<repository>-api
```

Tags:

```text
development
dev-<sha>
vX.Y.Z-rc.N
staging
vX.Y.Z
production
```

Tags RC e estáveis são imutáveis.

---

## 68. Development

Fonte:

```text
develop
```

Environment:

```text
development
```

Objetivo:

- integração contínua;
- primeira validação real;
- identificação de problemas de rede, build e configuração.

---

## 68.1 Staging

Fonte:

```text
release/x.y.z → staging
```

Environment:

```text
staging
```

Cada promoção gera:

```text
vX.Y.Z-rc.N
GitHub Pre-release
release-manifest.json
```

Staging deve registrar versão, commit e digests.

---

## 68.2 Production

Fonte:

```text
staging → main
```

Environment:

```text
production
```

Release normal deve:

- recuperar o manifesto da RC aprovada;
- promover os mesmos digests;
- criar tag `vX.Y.Z`;
- criar GitHub Release;
- não executar novo build.

---

## 68.3 Endpoint de versão

A API deverá expor:

```http
GET /api/v1/version
```

A resposta deve informar:

- versão;
- commit;
- ambiente;
- horário do build.

A Web deverá exibir essas informações em diagnóstico ou rodapé técnico.

---

## 68.4 Migrations

Claude deve garantir:

- teste em development;
- teste em staging;
- `prisma migrate deploy`;
- backup antes de migration destrutiva;
- rollback documentado;
- nenhuma execução de `prisma db push` em produção.

---

## 68.5 Rollback

Rollback usa:

- tag anterior; ou
- digest anterior.

Nunca:

- reconstruir versão antiga;
- mover tag;
- reutilizar tag defeituosa.

Após rollback, criar hotfix e nova versão PATCH.

# COMPORTAMENTO DO CLAUDE CODE

---

## 69. Antes de codificar

Claude deve:

1. ler arquivos relevantes;
2. inspecionar código existente;
3. procurar implementação reutilizável;
4. identificar riscos;
5. informar plano curto;
6. evitar mudança ampla.

---

## 70. Durante a alteração

Claude deve:

- modificar poucos arquivos por vez;
- preservar padrões;
- evitar duplicação;
- não adicionar dependência sem necessidade;
- não criar abstração prematura;
- não remover código sem entender;
- não alterar contrato silenciosamente;
- não adicionar fallback inseguro.

---

## 71. Após a alteração

Claude deve:

- executar validações;
- revisar diff;
- procurar segredo;
- atualizar docs;
- verificar impacto em branches, workflows e Environments;
- confirmar se `VERSION` foi alterado corretamente;
- informar arquivos alterados;
- informar testes;
- informar ambiente validado;
- informar pendências reais;
- não declarar sucesso sem executar verificação.

---

## 72. Transparência

Não afirmar:

- “testes passaram” sem executar;
- “build funciona” sem executar;
- “seguro” sem evidência;
- “compatível” sem testar;
- “migration funciona” sem validar.

Quando não for possível executar algo, declarar claramente.

---

## 73. Não produzir trabalho falso

Não criar:

- implementação vazia apresentada como pronta;
- teste que não testa comportamento;
- mock excessivo que mascara falha;
- endpoint sem autorização;
- migration sem revisão;
- documentação divergente;
- TODO para esconder falta de implementação.

---

## 74. Perguntas

Não interromper por detalhes menores.

Usar decisões existentes e padrões do projeto.

Perguntar somente quando houver bloqueio real, por exemplo:

- decisão de segurança ausente;
- requisito contraditório;
- migration destrutiva;
- perda de dados;
- mudança de stack;
- comportamento de produto não definido.

---

## 75. Refatoração

Refatorar quando:

- reduzir duplicação real;
- melhorar segurança;
- melhorar testabilidade;
- separar responsabilidade;
- facilitar manutenção.

Não refatorar módulos não relacionados durante uma feature pequena.

---

## 76. Bugs

Ao corrigir bug:

1. reproduzir;
2. identificar causa;
3. criar teste de regressão;
4. corrigir;
5. executar testes relacionados;
6. atualizar docs se o comportamento mudar.

Não corrigir apenas o sintoma.

---

## 77. Segurança

Ao detectar risco:

- interromper a implementação insegura;
- explicar o risco;
- propor alternativa;
- criar teste;
- atualizar `SECURITY.md` ou ADR quando relevante.

---

# CHECKLIST POR TIPO DE TAREFA

---

## 78. Nova tela Web

- [ ] Ler `TELAS.md`.
- [ ] Criar rota.
- [ ] Criar estados loading/error/empty.
- [ ] Criar validação.
- [ ] Criar acessibilidade.
- [ ] Criar responsividade.
- [ ] Criar testes.
- [ ] Integrar API.
- [ ] Não expor segredo.
- [ ] Atualizar docs.

---

## 79. Novo endpoint

- [ ] Ler `API.md`.
- [ ] Criar DTO.
- [ ] Criar service.
- [ ] Criar policy.
- [ ] Criar repository.
- [ ] Criar mapper.
- [ ] Criar erros.
- [ ] Criar Swagger.
- [ ] Criar testes.
- [ ] Revisar rate limit.
- [ ] Revisar logs.
- [ ] Atualizar docs.

---

## 80. Nova tabela

- [ ] Ler `DATABASE.md`.
- [ ] Criar model.
- [ ] Criar migration.
- [ ] Criar FK.
- [ ] Criar índices.
- [ ] Definir delete behavior.
- [ ] Testar banco vazio.
- [ ] Testar banco existente.
- [ ] Atualizar docs.
- [ ] Criar ADR se necessário.

---

## 81. Mudança de crypto

- [ ] Parar.
- [ ] Ler `SECURITY.md`.
- [ ] Criar ADR.
- [ ] Versionar formato.
- [ ] Criar migration.
- [ ] Criar vetores.
- [ ] Testar Web.
- [ ] Testar Android.
- [ ] Testar adulteração.
- [ ] Atualizar docs.
- [ ] Obter autorização.

---

## 82. Mudança de autenticação

- [ ] Revisar threat model.
- [ ] Revisar sessions.
- [ ] Revisar cookies.
- [ ] Revisar Android storage.
- [ ] Criar testes de reuse.
- [ ] Criar testes de revogação.
- [ ] Atualizar API.
- [ ] Atualizar Security.
- [ ] Criar ADR.

---

## 83. Importação CSV

- [ ] Processar localmente.
- [ ] Não enviar arquivo.
- [ ] Aplicar limites.
- [ ] Tratar conteúdo como texto.
- [ ] Não logar.
- [ ] Criar preview.
- [ ] Criptografar antes do commit.
- [ ] Usar idempotência.
- [ ] Testar falha parcial.
- [ ] Limpar memória.

---

## 84. Mobile

- [ ] Usar contracts.
- [ ] Usar crypto-mobile.
- [ ] Usar Keystore.
- [ ] Não usar AsyncStorage para segredo.
- [ ] Testar dispositivo.
- [ ] Testar release build.
- [ ] Revisar screenshots.
- [ ] Atualizar docs.

---

## 84.1 Iniciar release

- [ ] Confirmar milestone.
- [ ] Confirmar escopo congelado.
- [ ] Validar `MAJOR.MINOR.PATCH`.
- [ ] Criar `release/x.y.z` de `develop`.
- [ ] Atualizar `VERSION`.
- [ ] Abrir `release/x.y.z → staging`.
- [ ] Não incluir feature nova após o congelamento.

---

## 84.2 Publicar RC

- [ ] Confirmar merge `release/* → staging`.
- [ ] Criar próxima tag `vX.Y.Z-rc.N`.
- [ ] Construir Web e API uma única vez.
- [ ] Publicar imagens no GHCR.
- [ ] Registrar digests.
- [ ] Criar `release-manifest.json`.
- [ ] Criar GitHub Pre-release.
- [ ] Implantar no Environment `staging`.
- [ ] Validar `/api/v1/version`.

---

## 84.3 Publicar produção

- [ ] Confirmar RC aprovada.
- [ ] Confirmar migration em staging.
- [ ] Confirmar backup e rollback.
- [ ] Abrir `staging → main`.
- [ ] Reutilizar os mesmos digests.
- [ ] Criar tag estável.
- [ ] Criar GitHub Release.
- [ ] Implantar em `production`.
- [ ] Abrir `main → develop`.
- [ ] Excluir `release/*` somente no final.

---

## 84.4 Hotfix

- [ ] Criar de `main`.
- [ ] Incrementar PATCH.
- [ ] Atualizar `VERSION`.
- [ ] Testar correção.
- [ ] Publicar nova tag.
- [ ] Sincronizar `main → develop`.
- [ ] Levar correção à release ativa, se houver.
- [ ] Preservar a versão futura no `VERSION` da release.

# COMANDOS DE VALIDAÇÃO

---

## 85. Comandos esperados

Na raiz:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
```

Por app:

```bash
pnpm --filter web test
pnpm --filter web build

pnpm --filter api test
pnpm --filter api build

pnpm --filter mobile test
```

Prisma:

```bash
pnpm --filter api prisma validate
pnpm --filter api prisma generate
pnpm --filter api prisma migrate dev
```

Não executar migration destrutiva sem autorização.

---

# DEFINITION OF DONE

---

## 86. Tarefa concluída

Uma tarefa está concluída quando:

- implementação completa;
- lint passa;
- typecheck passa;
- testes passam;
- build passa;
- docs atualizadas;
- segurança revisada;
- sem segredo;
- diff revisado;
- deploy de teste validado quando necessário;
- critérios de aceite cumpridos.

---

## 87. Feature concluída

Além do anterior:

- fluxo completo;
- autorização;
- estados de interface;
- observabilidade;
- tratamento de falha;
- integração Web/API;
- Android quando aplicável;
- migration;
- E2E quando crítico.

---

# FORMATO DA RESPOSTA FINAL DO CLAUDE

---

## 88. Ao concluir uma tarefa

Responder com:

### Alterações

- arquivos principais;
- comportamento implementado.

### Validações

- comandos executados;
- resultado real.

### Documentação

- documentos atualizados.

### Riscos ou pendências

- apenas riscos reais;
- sem esconder falhas;
- sem prometer trabalho futuro automático.

---

## 89. Resumo final

Claude Code deve trabalhar de forma:

```text
conservadora
→ orientada por documentação
→ segura
→ testável
→ incremental
→ transparente
```

Regras absolutas:

```text
não expor segredos
não alterar crypto sem ADR
não alterar stack sem autorização
não adicionar feature fora do escopo
não remover testes para fazer CI passar
não declarar validação que não foi executada
não enviar dados sensíveis ao backend
não promover feature diretamente para staging ou main
não corrigir staging diretamente
não apagar release/* durante homologação
não reconstruir produção após homologação
não mover tags publicadas
não compartilhar banco entre ambientes
```

Em caso de conflito entre rapidez e segurança, segurança prevalece.
