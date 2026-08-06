# STYLE_GUIDE.md

# Crypta — Guia de Estilo e Padrões de Desenvolvimento

> **Status:** Documento inicial para revisão  
> **Versão:** 0.2.0  
> **Última atualização:** 31 de julho de 2026

---

## 1. Objetivo

Este documento define os padrões de:

- código;
- nomenclatura;
- organização;
- arquitetura;
- testes;
- documentação;
- commits;
- revisão;
- segurança;
- interface.

Todos os contribuidores e assistentes de IA deverão seguir este guia.

---

## 2. Princípios gerais

Priorizar:

1. segurança;
2. legibilidade;
3. correção;
4. simplicidade;
5. consistência;
6. testabilidade;
7. manutenção;
8. desempenho.

Evitar:

- abstração prematura;
- arquitetura excessiva;
- código “mágico”;
- duplicação;
- dependência desnecessária;
- comentários que explicam código confuso em vez de melhorá-lo;
- funções com múltiplas responsabilidades;
- estados implícitos;
- comportamento silencioso.

---

## 3. Idioma

### Código

Usar inglês para:

- nomes de arquivos;
- variáveis;
- funções;
- classes;
- interfaces;
- tipos;
- enums;
- commits técnicos;
- mensagens internas;
- códigos de erro.

### Interface

Usar português do Brasil para:

- labels;
- botões;
- mensagens;
- toasts;
- validações;
- textos ao usuário.

### Documentação

Documentação principal poderá permanecer em português.

Termos técnicos poderão ficar em inglês quando forem padrão do ecossistema.

---

## 4. TypeScript

### 4.1 Modo estrito

Obrigatório:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

A configuração final poderá variar conforme compatibilidade, mas não deverá reduzir segurança sem ADR.

### 4.2 `any`

Evitar `any`.

Preferir:

- `unknown`;
- generics;
- union types;
- type guards;
- schemas.

`any` somente com justificativa documentada e escopo mínimo.

### 4.3 Type assertions

Evitar:

```ts
value as SomeType;
```

Preferir validação real.

Assertions permitidas somente quando:

- invariável comprovada;
- biblioteca externa;
- teste;
- motivo documentado.

### 4.4 Non-null assertion

Evitar:

```ts
value!;
```

Resolver o fluxo de nulidade.

### 4.5 Enums

Preferir union literal ou `as const` em contracts quando adequado.

Usar enum Prisma quando necessário para banco.

---

## 5. Nomenclatura

### 5.1 Variáveis e funções

camelCase:

```ts
vaultId;
encryptedPayload;
createVault;
validateMembership;
```

### 5.2 Classes e tipos

PascalCase:

```ts
VaultService;
CreateVaultRequest;
EncryptedPayload;
```

### 5.3 Constantes

UPPER_SNAKE_CASE apenas para constantes globais reais:

```ts
MAX_IMPORT_ROWS;
DEFAULT_PAGE_SIZE;
```

Constantes locais podem usar camelCase.

### 5.4 Booleanos

Usar prefixos claros:

```ts
isActive;
hasAccess;
canEdit;
shouldRefresh;
```

Evitar:

```ts
active;
access;
edit;
```

### 5.5 Funções

Usar verbo:

```ts
createVault;
getSession;
revokeToken;
encryptPayload;
```

### 5.6 Arrays

Usar plural:

```ts
vaults;
members;
credentials;
```

### 5.7 IDs

Sempre indicar a entidade:

```ts
userId;
vaultId;
siteId;
credentialId;
```

Evitar `id` fora do contexto imediato.

---

## 6. Arquivos e pastas

### Arquivos TypeScript

kebab-case:

```text
create-vault.dto.ts
vault.service.ts
vault.repository.ts
use-vaults.ts
credential-card.tsx
```

### Componentes React

Nome exportado em PascalCase.

Arquivo em kebab-case.

```text
credential-card.tsx
```

```ts
export function CredentialCard() {}
```

### Testes

```text
vault.service.spec.ts
credential-card.test.tsx
auth.e2e-spec.ts
```

### Barrel files

Evitar `index.ts` excessivo.

Permitido apenas em fronteiras estáveis de package.

---

## 7. Imports

Ordem:

1. Node;
2. bibliotecas externas;
3. packages internos;
4. aliases da aplicação;
5. imports relativos;
6. tipos;
7. estilos.

Preferir aliases.

Exemplo:

```ts
import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import type { EncryptedPayload } from '@crypta/contracts';

import { VaultRepository } from '@/modules/vaults/vault.repository';
```

Evitar caminhos relativos profundos:

```text
../../../../common
```

---

## 8. Funções

### Regras

- uma responsabilidade;
- nome explícito;
- poucos parâmetros;
- retorno previsível;
- sem efeitos colaterais ocultos;
- early return;
- baixa complexidade.

### Limite sugerido

Funções acima de aproximadamente 40–60 linhas devem ser revisadas.

Esse limite não é mecânico, mas é sinal de possível refatoração.

### Parâmetros

Para mais de três parâmetros, preferir objeto:

```ts
createVault({
  userId,
  encryptedMetadata,
  ownerEnvelope,
});
```

---

## 9. Erros

### 9.1 Códigos estáveis

Usar códigos:

```text
VAULT_ACCESS_DENIED
VERSION_CONFLICT
INVALID_CREDENTIALS
```

### 9.2 Mensagem interna e pública

Separar:

- código;
- mensagem pública;
- causa interna;
- request ID.

### 9.3 Nunca lançar string

Errado:

```ts
throw 'error';
```

Correto:

```ts
throw new VaultAccessDeniedError();
```

### 9.4 Falha fechada

Em segurança:

- negar por padrão;
- não continuar após erro criptográfico;
- não assumir permissão.

---

## 10. Comentários

Comentar:

- motivo;
- decisão;
- limitação;
- risco;
- workaround;
- invariável.

Não comentar o óbvio.

Ruim:

```ts
// Increment version
version++;
```

Melhor:

```ts
// Optimistic concurrency requires every successful mutation
// to advance the entity version exactly once.
version++;
```

---

## 11. TODOs

Formato:

```ts
// TODO(issue-123): Replace polling with incremental sync.
```

Todo TODO deverá possuir:

- contexto;
- issue;
- ação clara.

Evitar TODO genérico.

---

# PARTE I — FRONTEND WEB

---

## 12. Organização por feature

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

Cada feature poderá conter:

```text
components/
hooks/
services/
schemas/
types/
utils/
tests/
```

---

## 13. Componentes React

### Regras

- componentes funcionais;
- props tipadas;
- composição;
- sem lógica de API direta;
- sem acesso direto a storage;
- sem criptografia espalhada.

### Props

```ts
type CredentialCardProps = {
  credential: DecryptedCredential;
  onCopyUsername: () => void;
  onCopyPassword: () => void;
};
```

### Componentes grandes

Separar quando houver:

- múltiplas responsabilidades;
- muitos estados;
- lógica de domínio;
- várias seções independentes.

---

## 14. Hooks

Nomes:

```ts
useVaults;
useCreateVault;
useCredentialSearch;
useAutoLock;
```

Regras:

- prefixo `use`;
- responsabilidade única;
- não esconder efeitos críticos;
- limpar efeitos;
- testar hooks relevantes.

---

## 15. TanStack Query

Usar para estado remoto.

Query keys padronizadas:

```ts
export const vaultKeys = {
  all: ['vaults'] as const,
  list: (filters: VaultFilters) => ['vaults', 'list', filters] as const,
  detail: (vaultId: string) => ['vaults', 'detail', vaultId] as const,
};
```

Regras:

- invalidar de forma específica;
- não duplicar server state no Zustand;
- limpar cache no logout;
- não persistir dados descriptografados.

---

## 16. Zustand

Usar somente para:

- estado de sessão em memória;
- estado de desbloqueio;
- chaves temporárias;
- preferências visuais;
- estado global realmente necessário.

Não usar para:

- listas remotas;
- cache duplicado;
- formulários locais simples.

---

## 17. Formulários

Usar:

- React Hook Form;
- Zod;
- mensagens em português;
- schemas reutilizáveis;
- validação cliente e servidor.

Não confiar apenas na validação cliente.

---

## 18. Services HTTP

Centralizar Axios.

```text
services/
├── api-client.ts
├── auth-api.ts
├── vault-api.ts
└── credential-api.ts
```

Regras:

- interceptors mínimos;
- refresh controlado;
- erros normalizados;
- nenhum log de body sensível;
- access token em memória.

---

## 19. Criptografia no frontend

Toda chamada deve passar por adapters.

Não chamar libsodium diretamente em componentes.

Exemplo:

```ts
const encryptedCredential = await credentialCrypto.encrypt({
  vaultKey,
  credentialId,
  payload,
});
```

---

## 20. UI

### Botões

Usar verbos:

```text
Criar cofre
Salvar alterações
Excluir credencial
Copiar senha
```

Evitar:

```text
OK
Confirmar
Enviar
```

quando houver ação mais específica.

### Ações perigosas

- variante destructive;
- confirmação;
- texto claro;
- não colocar como ação padrão.

---

## 21. Acessibilidade

Obrigatório:

- labels;
- foco;
- navegação por teclado;
- aria-label em ícones;
- contraste;
- mensagens associadas;
- não depender de cor;
- modal com focus trap.

---

# PARTE II — BACKEND

---

## 22. Organização modular

Cada módulo deve representar domínio.

```text
modules/vaults/
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

## 23. Controllers

Responsáveis por:

- receber request;
- validar DTO;
- obter contexto;
- chamar service;
- retornar response.

Não responsáveis por:

- query Prisma;
- autorização complexa;
- transação;
- regra de negócio;
- criptografia de conteúdo.

---

## 24. Services

Responsáveis por casos de uso.

Exemplo:

```ts
@Injectable()
export class CreateVaultService {
  async execute(input: CreateVaultInput): Promise<CreateVaultResult> {
    // authorization and orchestration
  }
}
```

Evitar “God service”.

Separar por caso de uso quando necessário:

```text
create-vault.service.ts
delete-vault.service.ts
accept-invitation.service.ts
```

---

## 25. Repositories

Responsáveis por Prisma.

Regras:

- queries explícitas;
- selects mínimos;
- contexto de autorização;
- transações recebidas quando necessário;
- sem retorno de campos desnecessários.

---

## 26. Policies

Centralizar autorização.

Exemplo:

```ts
vaultPolicy.assertCanEdit({
  membership,
  vault,
});
```

Não duplicar regras em controllers.

---

## 27. DTOs

DTOs devem:

- declarar campos;
- validar;
- rejeitar extras quando aplicável;
- não incluir propriedades internas;
- não ser modelos Prisma.

---

## 28. Mappers

Separar:

- Prisma model;
- domínio;
- API response.

Não retornar objeto Prisma diretamente.

---

## 29. Transações

Casos obrigatórios:

- setup;
- criação de cofre;
- aceite de convite;
- remoção de membro;
- rekey;
- import;
- mudança de senha;
- revogação em massa.

A transação deve ser a menor possível.

Não realizar criptografia client-side dentro da transação.

---

## 30. Prisma

### Regras

- acesso em repositories;
- select explícito;
- evitar include amplo;
- migration versionada;
- sem `db push` em produção;
- seed fictício.

### SQL direto

Somente:

- necessário;
- parametrizado;
- revisado;
- coberto por testes;
- documentado.

---

## 31. Guards e interceptors

Usar para:

- autenticação;
- request ID;
- logging;
- rate limit;
- serialização;
- sanitização.

Não colocar regra de domínio complexa em guard genérico.

---

## 32. Logs

Usar logger estruturado.

Exemplo:

```ts
logger.info({
  action: 'VAULT_CREATED',
  actorUserId,
  vaultId,
  requestId,
});
```

Nunca incluir payload completo.

---

# PARTE III — MOBILE

---

## 33. Organização

Mesma divisão por feature da Web.

Reutilizar:

- contracts;
- schemas;
- crypto-core;
- regras de domínio puras.

Não tentar compartilhar componentes visuais Web com React Native.

---

## 34. Armazenamento

- Keystore para refresh token;
- memória para access token;
- nada sensível em AsyncStorage;
- limpar no logout.

---

## 35. Navegação

Rotas tipadas.

Parâmetros devem conter IDs, nunca segredos.

---

## 36. Build

Separar:

- development;
- test;
- release.

Nunca distribuir APK debug para uso real.

---

# PARTE IV — CONTRACTS E CRYPTO

---

## 37. Contracts

`packages/contracts` deve ser:

- independente de framework;
- sem efeitos colaterais;
- sem secrets;
- versionado;
- testado.

---

## 38. Crypto core

Regras:

- funções puras quando possível;
- versionamento explícito;
- AAD centralizada;
- vetores;
- sem algoritmo customizado;
- sem fallback inseguro;
- falhar fechado.

---

## 39. Tipos de marca

Usar branded types quando ajudar:

```ts
type VaultId = string & { readonly __brand: 'VaultId' };
type Ciphertext = string & { readonly __brand: 'Ciphertext' };
```

Não exagerar em branding que prejudique manutenção.

---

## 40. Serialização

Formato determinístico.

Não depender de ordem implícita de propriedades para AAD.

Criar serializer explícito.

---

# PARTE V — TESTES

---

## 41. Nomenclatura

```text
describe('CreateVaultService', ...)
it('creates an owner membership in the same transaction', ...)
```

O nome deve descrever comportamento.

---

## 42. Estrutura AAA

```ts
// Arrange
// Act
// Assert
```

Comentários podem ser omitidos quando a estrutura estiver clara.

---

## 43. Unitários

Testar:

- regra;
- transformação;
- policy;
- validator;
- crypto;
- mapper;
- hook.

---

## 44. Integração

Testar com:

- MySQL real;
- API real;
- transações;
- constraints;
- autenticação;
- autorização.

Não usar SQLite para substituir MySQL.

---

## 45. E2E

Cobrir fluxos críticos descritos em `ARCHITECTURE.md`.

---

## 46. Fixtures

Fixtures devem:

- ser pequenas;
- ser fictícias;
- não conter segredo real;
- ser determinísticas;
- usar builders.

---

## 47. Mocks

Não mockar tudo.

Preferir:

- unitários com dependências isoladas;
- integração com banco real;
- API real em E2E.

---

## 48. Cobertura

Cobertura é indicador, não objetivo isolado.

Priorizar:

- segurança;
- autorização;
- crypto;
- sessões;
- rekey;
- importação.

---

# PARTE VI — DOCUMENTAÇÃO

---

## 49. Atualização obrigatória

Toda mudança relevante deverá atualizar:

- API;
- banco;
- arquitetura;
- segurança;
- telas;
- backlog;
- changelog, quando aplicável.

---

## 50. Exemplos

Usar:

```text
user@example.test
https://example.com
ciphertext-base64url
```

Nunca usar dado real.

---

## 51. Mermaid

Diagramas deverão:

- ser simples;
- usar nomes consistentes;
- refletir o código;
- evitar detalhes que envelheçam rápido.

---

## 52. ADR

Criar ADR quando houver decisão sobre:

- stack;
- segurança;
- banco;
- criptografia;
- deploy;
- sessão;
- mudança incompatível.

---

# PARTE VII — GIT, BRANCHES E RELEASES

---

## 53. Branches permanentes

```text
develop
staging
main
```

### `develop`

- branch padrão;
- desenvolvimento contínuo;
- fonte do Environment `development`.

### `staging`

- versão atualmente em homologação;
- recebe apenas `release/*`;
- não recebe correções diretas.

### `main`

- produção;
- recebe `staging` ou `hotfix/*`;
- toda publicação possui tag estável.

---

## 54. Branches temporárias

| Finalidade              | Padrão          | Origem          | Destino         |
| ----------------------- | --------------- | --------------- | --------------- |
| Feature                 | `feature/*`     | `develop`       | `develop`       |
| Bug de desenvolvimento  | `bugfix/*`      | `develop`       | `develop`       |
| Tarefa técnica          | `chore/*`       | `develop`       | `develop`       |
| Refatoração             | `refactor/*`    | `develop`       | `develop`       |
| Documentação            | `docs/*`        | `develop`       | `develop`       |
| Segurança não publicada | `security/*`    | `develop`       | `develop`       |
| Release                 | `release/x.y.z` | `develop`       | `staging`       |
| Correção de homologação | `fix/*`         | `release/x.y.z` | `release/x.y.z` |
| Hotfix                  | `hotfix/*`      | `main`          | `main`          |

Nomes:

- inglês;
- kebab-case;
- curtos;
- sem issue inteira no nome;
- sem segredo;
- sem prefixo `v` em release.

---

## 55. Fluxos permitidos

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
main       → release/*   somente com release ativa
```

O check `Validar origem e destino` deverá ser obrigatório.

Não documentar ou sugerir combinações alternativas sem atualizar `GITHUB_RELEASE_FLOW.md`.

---

## 56. Estratégias de merge

| PR                            | Estratégia                                              |
| ----------------------------- | ------------------------------------------------------- |
| Branch temporária → `develop` | Squash and merge                                        |
| `fix/* → release/*`           | Squash and merge                                        |
| `release/* → staging`         | Create a merge commit                                   |
| `staging → main`              | Create a merge commit                                   |
| `main → develop`              | Create a merge commit                                   |
| `main → release/*`            | Create a merge commit                                   |
| `hotfix/* → main`             | Squash and merge ou merge commit conforme decisão do PR |

Não exigir histórico linear nas branches permanentes.

A ancestralidade entre promoções deve ser preservada.

---

## 57. Commits

Usar Conventional Commits:

```text
type(scope): description
```

Exemplos:

```text
feat(vaults): add vault creation endpoint
fix(auth): revoke reused refresh token family
security(ci): restrict production environment
docs(releases): document rc promotion
test(crypto): add cross-platform envelope vectors
```

Tipos:

```text
feat
fix
docs
test
refactor
perf
build
ci
chore
security
revert
```

Escopos sugeridos:

```text
auth
sessions
vaults
sites
credentials
invitations
imports
crypto
web
mobile
api
database
infra
release
ci
docs
```

Cada commit deve:

- possuir objetivo;
- compilar quando possível;
- incluir teste;
- incluir docs;
- não misturar refatoração ampla com feature;
- não alterar `VERSION` sem motivo de release.

---

## 58. Pull requests

PR deve conter:

- resumo;
- motivo;
- mudanças;
- testes;
- impacto de segurança;
- migration;
- screenshots, quando UI;
- documentação;
- ambiente afetado;
- risco de deploy;
- rollback quando aplicável.

Adicionar:

- milestone da versão;
- label para release notes;
- link da issue;
- informação sobre `VERSION` quando alterado.

---

## 59. Versionamento

Usar Semantic Versioning:

```text
MAJOR.MINOR.PATCH
```

Arquivo na raiz:

```text
VERSION
```

Conteúdo:

```text
0.4.0
```

Não usar prefixo `v` no arquivo ou na branch.

Tags:

```text
v0.4.0-rc.1
v0.4.0
```

Tags publicadas são imutáveis.

---

## 60. Release candidate e produção

### RC

```text
develop
→ release/0.4.0
→ staging
→ v0.4.0-rc.1
```

Correções:

```text
release/0.4.0
→ fix/*
→ release/0.4.0
→ staging
→ v0.4.0-rc.2
```

### Produção

```text
staging
→ main
→ v0.4.0
→ GitHub Release
→ main → develop
```

A branch `release/*` permanece até o fim da sincronização.

---

## 61. Artefatos e nomes de imagem

Imagens:

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

Manifesto:

```text
release-manifest.json
```

Campos esperados:

```json
{
  "version": "0.4.0-rc.2",
  "commit": "b85c091",
  "webImage": "ghcr.io/example/crypta-web@sha256:...",
  "apiImage": "ghcr.io/example/crypta-api@sha256:..."
}
```

O manifesto não contém secrets.

Produção promove os mesmos digests homologados.

---

## 62. Workflows

Nomes padronizados:

```text
ci.yml
validate-pr-flow.yml
cleanup-temporary-branches.yml
start-release.yml
deploy-development.yml
publish-prerelease.yml
publish-production.yml
```

Regras:

- nomes em kebab-case;
- `permissions` explícitas;
- permissões mínimas;
- `concurrency` em deploy;
- `set -euo pipefail` em shell;
- não imprimir secrets;
- validar entradas de `workflow_dispatch`;
- fixar Actions em versões revisadas;
- usar Environment no job de deploy;
- não misturar build de RC e rebuild de produção.

---

## 63. Rulesets e branch protection

Exigir:

- PR;
- CI;
- validação do fluxo;
- revisão;
- resolução de conversas;
- sem force push;
- sem exclusão das branches permanentes;
- tags protegidas;
- secret scan.

A exclusão automática deve atingir apenas branches temporárias.

Não habilitar exclusão automática indiscriminada para `release/*`.

# PARTE VIII — DEPENDÊNCIAS

---

## 59. Adição

Antes de adicionar:

1. verificar se já existe solução;
2. avaliar manutenção;
3. avaliar licença;
4. avaliar tamanho;
5. avaliar segurança;
6. justificar no PR.

---

## 60. Versões

- usar lockfile;
- evitar `latest`;
- atualizar conscientemente;
- não fixar versões arbitrárias em documentação sem necessidade.

---

## 61. Bibliotecas de segurança

Alteração em:

- crypto;
- auth;
- tokens;
- cookies;
- parser CSV;
- sanitização;

exige revisão adicional.

---

# PARTE IX — CONFIGURAÇÃO E AMBIENTES

---

## 66. Environment variables

Nomes em UPPER_SNAKE_CASE:

```text
DATABASE_URL
JWT_PRIVATE_KEY
CORS_ORIGINS
MAX_IMPORT_ROWS
APP_VERSION
APP_COMMIT
APP_ENVIRONMENT
APP_BUILT_AT
```

Variáveis públicas de build Web devem usar o prefixo exigido pelo Vite e nunca conter segredo.

---

## 67. Ambientes

Nomes oficiais:

```text
development
staging
production
```

Não usar nomes alternativos no código sem necessidade:

```text
dev
hml
prod
```

Esses termos podem existir apenas como tags técnicas quando documentados.

Cada ambiente deve possuir:

- env próprio;
- banco próprio;
- URLs próprias;
- secrets próprios;
- GitHub Environment próprio;
- recursos Coolify próprios.

---

## 68. Validação

A aplicação deverá validar env no startup.

Falhar imediatamente quando variável obrigatória estiver ausente.

Validar também:

- `APP_ENVIRONMENT` pertence aos valores aceitos;
- `APP_VERSION` está preenchida;
- `APP_COMMIT` está preenchido em builds implantados;
- URL da API corresponde ao ambiente;
- CORS não mistura ambientes.

---

## 69. `.env.example`

Deve conter:

- nome;
- placeholder;
- comentário;
- sem valor real;
- separação por aplicação;
- indicação do ambiente.

Não incluir:

- token do Coolify;
- token do GHCR;
- secret de GitHub Environment;
- chave de assinatura real.

# PARTE X — SEGURANÇA NO CÓDIGO

---

## 65. Dados sensíveis

Nunca colocar em:

- nome de variável logada;
- URL;
- query string;
- exception message;
- analytics;
- snapshot de teste;
- screenshot;
- fixture pública.

---

## 66. Redaction

Criar utilitário central.

Não depender de cada desenvolvedor lembrar manualmente.

---

## 67. Falha fechada

Exemplos:

- membership ausente → negar;
- keyVersion divergente → negar;
- decrypt falhou → negar;
- sessão incerta → negar;
- convite inválido → negar.

---

## 68. Defaults

Defaults devem ser seguros.

Exemplos:

- senha oculta;
- cofre privado;
- CORS restrito;
- logging mínimo;
- banco privado;
- convite expirável.

---

# PARTE XI — PERFORMANCE

---

## 69. Otimização

Não otimizar antes de medir.

Mas evitar:

- N+1;
- payload excessivo;
- rerender desnecessário;
- decrypt repetido;
- query ampla;
- índice ausente.

---

## 70. Memoização

Usar somente quando houver benefício medido.

Não aplicar `useMemo` e `useCallback` indiscriminadamente.

---

## 71. Paginação

Listas grandes devem usar cursor.

Snapshot poderá ser usado enquanto o volume for pequeno.

---

# PARTE XII — REVISÃO DE CÓDIGO

---

## 77. Checklist

### Correção

- [ ] O comportamento está correto?
- [ ] Há caso limite?
- [ ] Há conflito de versão?
- [ ] Há transação?

### Segurança

- [ ] A autorização está no backend?
- [ ] Existe risco de IDOR?
- [ ] Há dado sensível em log?
- [ ] A entrada é validada?
- [ ] A falha é fechada?
- [ ] O storage é seguro?
- [ ] O workflow usa permissions mínimas?
- [ ] Secrets estão no Environment correto?

### Git e release

- [ ] Origem e destino do PR são permitidos?
- [ ] A estratégia de merge está correta?
- [ ] A branch `release/*` será preservada?
- [ ] `VERSION` foi alterado corretamente?
- [ ] Labels e milestone foram aplicados?
- [ ] A alteração afeta build, tag ou manifesto?
- [ ] Produção continuará usando o mesmo digest homologado?
- [ ] Rollback está documentado?

### Qualidade

- [ ] O nome é claro?
- [ ] Há duplicação?
- [ ] A abstração é necessária?
- [ ] Os testes cobrem risco?
- [ ] A documentação foi atualizada?
- [ ] `GITHUB_RELEASE_FLOW.md` foi atualizado quando necessário?
- [ ] `config_user.md` foi atualizado quando houve configuração manual?

# PARTE XIII — DEFINITION OF DONE

---

## 78. Tarefa concluída

Uma tarefa só está concluída quando:

- código implementado;
- lint passa;
- typecheck passa;
- testes passam;
- build passa;
- documentação atualizada;
- segurança revisada;
- deploy no ambiente correspondente validado quando aplicável;
- versão implantada confirmada por `/api/v1/version`;
- nenhum segredo incluído;
- fluxo de PR respeitado;
- critérios de aceite atendidos.

---

## 79. Feature concluída

Além dos itens anteriores:

- fluxo completo;
- loading;
- erro;
- vazio;
- autorização;
- acessibilidade;
- observabilidade;
- rollback ou tratamento de falha;
- integração Web/API;
- integração Android quando aplicável;
- milestone atualizado.

---

## 80. Release concluída

Uma release só está concluída quando:

- branch `release/x.y.z` foi criada de `develop`;
- `VERSION` corresponde à versão;
- RC foi criada;
- Pre-release foi publicada;
- staging homologou os digests;
- migration foi validada;
- produção promoveu os mesmos digests;
- tag estável foi criada;
- GitHub Release foi publicada;
- `/api/v1/version` foi validado;
- `main → develop` foi sincronizado;
- a branch de release foi excluída somente ao final;
- milestone foi fechado;
- rollback permanece disponível.

# PARTE XIV — REGRAS PARA ASSISTENTES DE IA

---

## 81. Escopo

Assistentes não devem:

- adicionar feature não solicitada;
- trocar stack sem decisão;
- alterar crypto sem ADR;
- remover teste;
- reduzir segurança por conveniência;
- inserir segredo;
- usar dado real;
- criar dependência sem justificar;
- alterar fluxo de branches sem atualizar `GITHUB_RELEASE_FLOW.md`;
- inventar secret, URL, token ou identificador do Coolify.

---

## 82. Alterações

Antes de alterar arquitetura, CI/CD ou release:

- consultar docs;
- identificar impacto;
- manter contratos;
- atualizar documentação;
- escrever testes;
- verificar `config_user.md`;
- verificar checks obrigatórios;
- verificar Environments;
- verificar se a mudança afeta o mesmo artefato homologado.

---

## 83. Código gerado

Deverá:

- seguir TypeScript strict;
- usar padrões do projeto;
- evitar `any`;
- incluir tratamento de erro;
- incluir teste;
- não incluir TODO sem issue;
- não hardcodar segredo;
- usar nomes de branch e ambiente oficiais;
- usar `VERSION` apenas conforme o fluxo.

---

## 84. Git e deploy

Assistentes não devem:

- sugerir push direto em branch protegida;
- promover feature para staging ou main;
- corrigir diretamente em staging;
- apagar release durante homologação;
- mover tag publicada;
- reconstruir produção depois da aprovação da RC;
- compartilhar banco entre ambientes;
- afirmar que deploy ocorreu sem verificar;
- afirmar que digest foi promovido sem evidência.

---

## 85. Dúvidas

Quando uma decisão não estiver documentada:

- não inventar comportamento crítico;
- criar proposta;
- marcar decisão pendente;
- sugerir ADR.

Perguntar quando faltar:

- aprovação de produção;
- identificador real do recurso Coolify;
- URL real;
- secret;
- política de retenção;
- decisão que possa causar perda ou exposição.

# PARTE XV — EXEMPLOS

---

## 79. Service

```ts
type CreateSiteInput = {
  actorUserId: string;
  vaultId: string;
  siteId: string;
  encryptedPayload: EncryptedPayload;
  keyVersion: number;
  idempotencyKey: string;
};

@Injectable()
export class CreateSiteService {
  constructor(
    private readonly vaultPolicy: VaultPolicy,
    private readonly siteRepository: SiteRepository,
  ) {}

  async execute(input: CreateSiteInput): Promise<CreateSiteResult> {
    const membership = await this.siteRepository.findActiveMembership({
      userId: input.actorUserId,
      vaultId: input.vaultId,
    });

    this.vaultPolicy.assertCanEditContent(membership);

    return this.siteRepository.create(input);
  }
}
```

---

## 80. React component

```tsx
type CopyPasswordButtonProps = {
  encryptedCredentialId: string;
  onCopy: () => Promise<void>;
};

export function CopyPasswordButton({ encryptedCredentialId, onCopy }: CopyPasswordButtonProps) {
  const [isCopying, setIsCopying] = useState(false);

  async function handleCopy() {
    try {
      setIsCopying(true);
      await onCopy();
    } finally {
      setIsCopying(false);
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={handleCopy}
      disabled={isCopying}
      aria-label={`Copiar senha da credencial ${encryptedCredentialId}`}
    >
      {isCopying ? 'Copiando...' : 'Copiar senha'}
    </Button>
  );
}
```

Observação: IDs técnicos não deverão ser expostos ao usuário visualmente.

---

## 81. Error

```ts
export class VersionConflictError extends Error {
  readonly code = 'VERSION_CONFLICT';

  constructor() {
    super('The resource version is outdated.');
  }
}
```

---

## 82. Teste

```ts
describe('VaultPolicy', () => {
  it('denies vault deletion for an editor', () => {
    const membership = buildMembership({ role: 'EDITOR' });

    expect(() => policy.assertCanDeleteVault(membership)).toThrow(VaultAccessDeniedError);
  });
});
```

---

## 83. Resumo

O código do projeto deverá ser:

- estrito;
- explícito;
- modular;
- testável;
- documentado;
- seguro;
- consistente;
- sem segredos;
- sem abstração desnecessária.

Em caso de conflito entre conveniência e segurança, segurança prevalece.
