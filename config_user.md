# CONFIG_USER.md

# Crypta — Configurações Manuais do GitHub e Coolify

> **Responsável:** Proprietário do repositório e da infraestrutura  
> **Status:** Checklist inicial para execução  
> **Versão:** 0.1.0  
> **Última atualização:** 31 de julho de 2026

---

## 1. Objetivo

Este documento lista as configurações que precisam ser feitas manualmente pelo proprietário do projeto.

As automações do repositório não substituem estas configurações.

Use este arquivo junto com:

- `GITHUB_RELEASE_FLOW.md`;
- `SECURITY.md`;
- `CONTRIBUTING.md`;
- `ARCHITECTURE.md`;
- `BACKLOG.md`.

Marque cada item somente depois de validar o resultado.

---

## 2. Informações que você precisa separar

Antes de começar, registre em local seguro:

```text
GitHub owner ou organização:
Nome do repositório:
URL do repositório:
URL do Coolify:
Usuário administrador do Coolify:
Domínio Web development:
Domínio API development:
Domínio Web staging:
Domínio API staging:
Domínio Web production:
Domínio API production:
```

Sugestão de domínios:

```text
dev-crypta.seudominio.com.br
dev-api-crypta.seudominio.com.br

staging-crypta.seudominio.com.br
staging-api-crypta.seudominio.com.br

crypta.seudominio.com.br
api-crypta.seudominio.com.br
```

Não coloque tokens, senhas ou webhooks neste arquivo.

---

# FASE 1 — REPOSITÓRIO

---

## 3. Criar o repositório

No GitHub:

```text
New repository
```

Configuração recomendada:

- [ ] Repositório público.
- [ ] Nome definido.
- [ ] Descrição definida.
- [ ] README inicial desabilitado se você já possui os arquivos locais.
- [ ] `.gitignore` inicial desabilitado se já existe no projeto.
- [ ] Licença selecionada somente depois da decisão formal.

Depois do primeiro push:

- [ ] Conferir se não existe `.env`.
- [ ] Conferir se não existem chaves.
- [ ] Conferir se não existem dumps.
- [ ] Conferir se não existem dados reais.

---

## 4. Criar as branches permanentes

A branch `main` normalmente já existe.

Depois do primeiro push:

```bash
git switch main
git pull --ff-only

git switch -c develop
git push -u origin develop

git switch -c staging
git push -u origin staging
```

Resultado esperado:

```text
main
develop
staging
```

Checklist:

- [ ] `main` criada.
- [ ] `develop` criada.
- [ ] `staging` criada.
- [ ] As três apontam inicialmente para um commit válido.

---

## 5. Definir `develop` como branch padrão

No repositório:

```text
Settings
→ Branches
→ Default branch
→ develop
```

O caminho visual pode mudar no GitHub. Procure por `Default branch` nas configurações do repositório.

Checklist:

- [ ] Default branch alterada para `develop`.
- [ ] Novos PRs sugerem `develop` como destino.

Não apague `main`.

---

## 6. Configurar métodos de merge

No repositório:

```text
Settings
→ General
→ Pull Requests
```

Habilitar:

- [ ] Allow squash merging.
- [ ] Allow merge commits.

Desabilitar inicialmente:

- [ ] Allow rebase merging.

Motivo:

- branches temporárias usam squash;
- promoções entre branches permanentes usam merge commit;
- rebase adicionaria uma terceira estratégia sem necessidade.

### Exclusão automática de branches

Mantenha desabilitado:

```text
Automatically delete head branches
```

Checklist:

- [ ] Exclusão automática nativa desabilitada.

O projeto utilizará workflow seletivo para apagar somente branches temporárias. Isso evita apagar `release/*` durante homologação.

---

# FASE 2 — ACTIONS

---

## 7. Configurar permissões das Actions

No repositório:

```text
Settings
→ Actions
→ General
```

### Actions permissions

Recomendação inicial:

- [ ] Permitir actions e reusable workflows necessários.
- [ ] Restringir actions de terceiros quando a política estiver madura.

### Workflow permissions

Os workflows declaram permissões mínimas em YAML. Para permitir as automações de release:

- [ ] Selecionar `Read and write permissions`, se a política do repositório exigir essa concessão global.
- [ ] Habilitar `Allow GitHub Actions to create and approve pull requests`.

A automação deverá apenas criar PRs; aprovação automática não deve ser utilizada.

Se o repositório estiver em uma organização, confirme se a política da organização permite estas opções.

Checklist:

- [ ] Actions habilitadas.
- [ ] Workflows podem criar tags.
- [ ] Workflows podem criar releases.
- [ ] Workflows podem publicar packages.
- [ ] Workflows podem criar PR de sincronização.

---

## 8. Adicionar os workflows antes dos checks obrigatórios

Os seguintes arquivos precisam existir na branch padrão:

```text
.github/workflows/ci.yml
.github/workflows/validate-pr-flow.yml
.github/workflows/cleanup-temporary-branches.yml
.github/workflows/start-release.yml
.github/workflows/deploy-development.yml
.github/workflows/publish-prerelease.yml
.github/workflows/publish-production.yml
.github/release.yml
```

Checklist:

- [ ] Workflows commitados em `develop`.
- [ ] `ci.yml` executado pelo menos uma vez.
- [ ] `validate-pr-flow.yml` executado pelo menos uma vez.
- [ ] Nomes reais dos checks anotados.

Não configure um required check antes de ele aparecer pelo menos uma vez no GitHub.

---

# FASE 3 — VARIABLES E PACKAGES

---

## 9. Criar repository variables

No repositório:

```text
Settings
→ Secrets and variables
→ Actions
→ Variables
```

Criar:

### `WEB_IMAGE`

Valor:

```text
ghcr.io/<owner>/<repository>-web
```

### `API_IMAGE`

Valor:

```text
ghcr.io/<owner>/<repository>-api
```

Use letras minúsculas.

Exemplo:

```text
ghcr.io/VictOliRodrigues/crypta-web
ghcr.io/VictOliRodrigues/crypta-api
```

Checklist:

- [ ] `WEB_IMAGE` criada.
- [ ] `API_IMAGE` criada.
- [ ] Nomes em minúsculas.
- [ ] Nenhum secret colocado em variável pública.

---

## 10. Configurar GitHub Container Registry

O primeiro workflow com `packages: write` criará os packages.

Depois da primeira publicação:

```text
GitHub profile ou organization
→ Packages
→ package Web
→ Package settings
```

Faça o mesmo para API.

### Opção recomendada para este repositório público

Tornar as imagens públicas, desde que:

- não contenham `.env`;
- não contenham segredos;
- não contenham source maps sensíveis;
- não contenham arquivos de desenvolvimento.

Checklist:

- [ ] Package Web criado.
- [ ] Package API criado.
- [ ] Visibilidade revisada.
- [ ] Coolify consegue baixar as imagens.
- [ ] Imagens não possuem segredos.

Se optar por packages privados, configure autenticação do GHCR no servidor do Coolify com token de leitura de packages.

---

# FASE 4 — GITHUB ENVIRONMENTS

---

## 11. Criar Environment `development`

No repositório:

```text
Settings
→ Environments
→ New environment
→ development
```

### Deployment branches and tags

Permitir:

```text
develop
```

### Variables

Criar:

```text
APP_URL=<URL Web development>
API_BASE_URL=<URL API development>/api/v1
```

`API_BASE_URL` **inclui o prefixo `/api/v1`**. O workflow usa esse valor em dois lugares: como `VITE_API_BASE_URL` no build da imagem Web e para confirmar, depois do deploy, que `GET /version` reporta o commit esperado.

### Secrets

Criar depois da configuração do Coolify:

```text
COOLIFY_TOKEN
COOLIFY_WEBHOOK_WEB
COOLIFY_WEBHOOK_API
```

### Proteção

- sem aprovação manual inicialmente;
- deploy automático;
- concorrência controlada pelo workflow.

Checklist:

- [ ] Environment criado.
- [ ] Branch `develop` autorizada.
- [ ] URLs configuradas.
- [ ] Secrets configurados.

---

## 12. Criar Environment `staging`

```text
Settings
→ Environments
→ New environment
→ staging
```

### Deployment branches and tags

Permitir:

```text
staging
v*-rc.*
```

Dependendo da interface do GitHub, configure branch e tag separadamente.

### Variables

```text
APP_URL=<URL Web staging>
API_BASE_URL=<URL API staging>/api/v1
```

### Secrets

```text
COOLIFY_TOKEN
COOLIFY_WEBHOOK_WEB
COOLIFY_WEBHOOK_API
```

### Proteção

- aprovação manual opcional;
- nenhuma secret de produção;
- deploy somente de RC.

Checklist:

- [ ] Environment criado.
- [ ] Branch/tag autorizada.
- [ ] URLs configuradas.
- [ ] Secrets de staging configurados.

---

## 13. Criar Environment `production`

```text
Settings
→ Environments
→ New environment
→ production
```

### Deployment branches and tags

Permitir:

```text
main
v*
```

O workflow também deve rejeitar tags `-rc` como versão estável.

### Variables

```text
APP_URL=<URL Web production>
API_BASE_URL=<URL API production>/api/v1
```

### Secrets

```text
COOLIFY_TOKEN
COOLIFY_WEBHOOK_WEB
COOLIFY_WEBHOOK_API
```

### Proteção recomendada

- [ ] Required reviewers, quando disponível no plano e houver outro aprovador.
- [ ] Prevent self-review, quando disponível e aplicável.
- [ ] Deployment branch policy restrita.
- [ ] Secrets exclusivos de produção.

Se você for o único usuário com acesso ao repositório, não configure uma aprovação impossível de cumprir. Nesse caso, mantenha o gate manual pelo PR `staging → main` até existir outro revisor.

Checklist:

- [ ] Environment criado.
- [ ] Branch/tag autorizada.
- [ ] URLs configuradas.
- [ ] Secrets de produção configurados.
- [ ] Proteção compatível com a quantidade de revisores.

---

# FASE 5 — COOLIFY

---

## 14. Ativar acesso à API do Coolify

No Coolify:

```text
Settings
→ Configuration
→ Advanced
→ API Access
```

Checklist:

- [ ] API Access habilitado.

---

## 15. Criar token de deploy

No Coolify:

```text
Keys & Tokens
→ API Tokens
→ Create
```

Permissão mínima:

```text
Deploy
```

Crie um token com nome identificável, por exemplo:

```text
github-actions-crypta
```

Checklist:

- [ ] Token criado.
- [ ] Permissão limitada a deploy.
- [ ] Token guardado em gerenciador seguro.
- [ ] Token não adicionado ao repositório.

Você pode usar um token por ambiente ou um token controlado para todos. A opção mais segura é separar quando o Coolify permitir granularidade suficiente.

---

## 16. Criar os projetos do Coolify

Criar:

```text
crypta-development
crypta-staging
crypta-production
```

Cada projeto deverá possuir:

```text
Web
API
MySQL
```

Checklist:

- [ ] Projeto development criado.
- [ ] Projeto staging criado.
- [ ] Projeto production criado.
- [ ] Bancos separados.
- [ ] Volumes separados.
- [ ] Redes separadas.

---

## 17. Configurar os recursos de imagem

A estratégia de release usa imagens prontas do GHCR.

Configure os recursos do Coolify como aplicações baseadas em imagem Docker.

### Development

```text
Web image: <WEB_IMAGE>:development
API image: <API_IMAGE>:development
```

### Staging

```text
Web image: <WEB_IMAGE>:staging
API image: <API_IMAGE>:staging
```

### Production

```text
Web image: <WEB_IMAGE>:production
API image: <API_IMAGE>:production
```

Checklist:

- [ ] Recursos Web configurados.
- [ ] Recursos API configurados.
- [ ] Portas internas configuradas.
- [ ] Health checks configurados.
- [ ] Imagens acessíveis.
- [ ] Auto deploy por Git push desabilitado para evitar deploy duplicado.

O deploy será disparado pelas GitHub Actions depois dos testes.

---

## 18. Configurar os bancos

Para cada ambiente:

- [ ] Criar MySQL.
- [ ] Não publicar porta externa.
- [ ] Criar volume persistente.
- [ ] Criar credenciais próprias.
- [ ] Configurar `DATABASE_URL` somente na API daquele ambiente.
- [ ] Configurar backup.
- [ ] Não reutilizar banco de outro ambiente.

---

## 19. Configurar domínios e HTTPS

Para cada ambiente:

- [ ] Domínio Web.
- [ ] Domínio API.
- [ ] DNS apontado.
- [ ] HTTPS válido.
- [ ] Redirect HTTP para HTTPS.
- [ ] CORS da API restrito à Web correta.
- [ ] Cookie configurado para o domínio correto.

---

## 20. Copiar deploy webhooks

Em cada aplicação Web e API:

```text
Application
→ Webhooks
→ Deploy Webhook
```

Você terá dois webhooks por ambiente:

```text
Web
API
```

Adicione no GitHub Environment correspondente:

```text
COOLIFY_WEBHOOK_WEB
COOLIFY_WEBHOOK_API
```

Adicione também:

```text
COOLIFY_TOKEN
```

Checklist por ambiente:

- [ ] Webhook Web copiado.
- [ ] Webhook API copiado.
- [ ] Token adicionado.
- [ ] Nenhum valor exposto em repository variable.
- [ ] Nenhum valor commitado.

---

## 21. Autenticar GHCR no servidor, se necessário

Se as imagens forem privadas, o servidor precisa conseguir baixar do GHCR.

Crie um token GitHub com somente:

```text
read:packages
```

Configure o registry no Coolify ou faça login no host conforme a estratégia adotada.

Checklist:

- [ ] Token apenas de leitura.
- [ ] Token guardado no Coolify.
- [ ] Token não commitado.
- [ ] Pull de imagem validado.

Se as imagens forem públicas, esta etapa pode não ser necessária.

---

# FASE 6 — LABELS E MILESTONES

---

## 22. Criar labels

No repositório:

```text
Issues
→ Labels
```

Criar ou ajustar:

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

Sugestão de uso:

| Label             | Uso                   |
| ----------------- | --------------------- |
| `feature`         | Nova funcionalidade   |
| `bug`             | Bug normal            |
| `fix`             | Correção de release   |
| `security`        | Segurança             |
| `performance`     | Desempenho            |
| `documentation`   | Documentação          |
| `breaking-change` | Mudança incompatível  |
| `dependencies`    | Dependências          |
| `release`         | PR de release         |
| `skip-changelog`  | Não incluir nas notas |

Checklist:

- [ ] Labels criadas.
- [ ] Nomes iguais ao `.github/release.yml`.

---

## 23. Criar milestone inicial

No repositório:

```text
Issues
→ Milestones
→ New milestone
```

Crie o milestone da primeira versão planejada.

Exemplo:

```text
0.1.0
```

Depois crie novos milestones conforme o roadmap.

Checklist:

- [ ] Milestone inicial criado.
- [ ] Issues da versão associadas.
- [ ] PRs da versão associados.

---

# FASE 7 — RULESETS

---

## 24. Ordem correta

Configure required checks somente depois de:

1. adicionar workflows;
2. abrir um PR de teste;
3. executar os jobs;
4. confirmar os nomes dos checks.

---

## 25. Ruleset das branches permanentes

No repositório:

```text
Settings
→ Rules
→ Rulesets
→ New branch ruleset
```

Nome sugerido:

```text
Permanent branches
```

Targets:

```text
develop
staging
main
```

Ativar:

- [ ] Restrict deletions.
- [ ] Block force pushes.
- [ ] Require a pull request before merging.
- [ ] Require status checks to pass.
- [ ] Require conversation resolution.
- [ ] Require branches to be up to date, se o fluxo e o custo permitirem.

Não ativar:

- [ ] Require linear history.

### Aprovações

Se houver dois ou mais revisores:

- exigir pelo menos uma aprovação.

Se houver somente o proprietário:

- não configurar uma regra que impeça o próprio fluxo;
- manter PR obrigatório e checks obrigatórios;
- adicionar aprovação quando houver outro colaborador.

### Checks sugeridos

Os nomes exatos dependem dos workflows. Exemplos:

```text
Validar origem e destino
Lint, tipos, testes e builds
```

Checklist:

- [ ] Ruleset ativo.
- [ ] Targets corretos.
- [ ] Force push bloqueado.
- [ ] Exclusão bloqueada.
- [ ] PR obrigatório.
- [ ] Checks obrigatórios.
- [ ] Linear history desabilitado.

---

## 26. Ruleset de `release/*`

Criar novo branch ruleset.

Nome:

```text
Release branches
```

Target pattern:

```text
release/*
```

Ativar:

- [ ] Restrict deletions.
- [ ] Block force pushes.
- [ ] Require pull request.
- [ ] Require status checks.
- [ ] Require conversation resolution.

A branch será excluída manualmente apenas depois de:

```text
produção publicada
+
main sincronizada com develop
```

Checklist:

- [ ] Pattern correto.
- [ ] Exclusão bloqueada durante homologação.
- [ ] Correções entram por PR.

---

## 27. Ruleset de tags

Criar tag ruleset.

Nome:

```text
Release tags
```

Target:

```text
v*
```

Regras recomendadas:

- [ ] Restringir exclusão.
- [ ] Restringir atualização.
- [ ] Permitir criação pela automação de release.

Teste com uma tag fictícia antes de ativar em modo estrito.

Não configure um ruleset que bloqueie o `GITHUB_TOKEN` sem fornecer bypass seguro à automação.

Checklist:

- [ ] Tags publicadas são imutáveis.
- [ ] Workflow consegue criar nova tag.
- [ ] Workflow não consegue mover tag existente.

---

# FASE 8 — SECURITY E REPOSITORY SETTINGS

---

## 28. Ativar segurança do repositório

No repositório:

```text
Settings
→ Code security
```

Ativar quando disponível:

- [ ] Dependabot alerts.
- [ ] Dependabot security updates.
- [ ] Secret scanning.
- [ ] Push protection.
- [ ] Code scanning, quando o workflow estiver configurado.

Como o repositório será público, revise qualquer alerta antes de publicar credenciais reais.

---

## 29. Configurar canal de vulnerabilidade

No GitHub, habilite Private vulnerability reporting quando disponível.

Checklist:

- [ ] Reporte privado habilitado.
- [ ] `SECURITY.md` aponta o canal correto.
- [ ] Issues públicas não são usadas para segredos.

---

## 30. Configurar colaboradores

Conceda somente o nível necessário.

Sugestão:

| Papel         | Permissão                            |
| ------------- | ------------------------------------ |
| Proprietário  | Admin                                |
| Desenvolvedor | Write                                |
| Revisor       | Triage ou Write conforme necessidade |
| Leitor        | Read                                 |

Checklist:

- [ ] Sem usuários antigos com acesso.
- [ ] 2FA exigido na organização, se aplicável.
- [ ] Bypass de ruleset limitado.

---

# FASE 9 — VALIDAÇÃO DO FLUXO

---

## 31. Teste de PR válido

Criar:

```text
feature/test-flow → develop
```

Validar:

- [ ] Workflow aceita.
- [ ] CI executa.
- [ ] Merge por squash disponível.
- [ ] Branch temporária é excluída pelo workflow.

---

## 32. Teste de PR inválido

Tentar, sem fazer merge:

```text
feature/test-flow → main
```

Validar:

- [ ] `Validar origem e destino` falha.
- [ ] Merge fica bloqueado.

Fechar o PR.

---

## 33. Teste de release fictícia

Use uma versão de teste coerente com o projeto.

Exemplo:

```text
0.1.0
```

Passos:

- [ ] Criar milestone.
- [ ] Executar `Iniciar release`.
- [ ] Confirmar branch `release/0.1.0`.
- [ ] Confirmar `VERSION`.
- [ ] Confirmar PR para `staging`.
- [ ] Fazer merge commit.
- [ ] Confirmar tag `v0.1.0-rc.1`.
- [ ] Confirmar GitHub Pre-release.
- [ ] Confirmar imagens RC.
- [ ] Confirmar deploy staging.
- [ ] Confirmar endpoint `/version`.

Não faça este teste em produção real antes de os Dockerfiles e ambientes estarem prontos.

---

## 34. Teste de correção de homologação

- [ ] Criar `fix/test-release-fix` a partir da release.
- [ ] Abrir PR para `release/0.1.0`.
- [ ] Fazer squash merge.
- [ ] Promover novamente para `staging`.
- [ ] Confirmar `v0.1.0-rc.2`.
- [ ] Confirmar que a branch release continua existente.

---

## 35. Teste de produção

Somente em ambiente controlado:

- [ ] Aprovar a RC.
- [ ] Abrir `staging → main`.
- [ ] Fazer merge commit.
- [ ] Confirmar tag estável.
- [ ] Confirmar GitHub Release.
- [ ] Confirmar mesmo digest da RC.
- [ ] Confirmar deploy production.
- [ ] Confirmar PR `main → develop`.
- [ ] Fazer merge commit.
- [ ] Excluir branch release.
- [ ] Fechar milestone.

---

## 36. Teste de rollback

- [ ] Registrar digest atual.
- [ ] Selecionar release anterior.
- [ ] Executar rollback no Coolify.
- [ ] Confirmar `/version`.
- [ ] Confirmar banco compatível.
- [ ] Retornar à versão atual.
- [ ] Documentar o procedimento.

---

# FASE 10 — ANDROID

---

## 37. Configurações futuras para APK

Somente quando o épico Android iniciar.

Será necessário configurar:

- [ ] Keystore de assinatura.
- [ ] Alias.
- [ ] Senha da keystore.
- [ ] Senha da key.
- [ ] Build release.
- [ ] Secrets de Actions ou serviço externo seguro.
- [ ] Hash SHA-256.
- [ ] Assets da Pre-release e Release.

Nunca coloque a keystore no repositório.

Os nomes finais dos secrets deverão ser definidos em ADR e documentação de release Android.

---

# CHECKLIST RESUMIDO

---

## 38. GitHub

- [ ] Repositório criado.
- [ ] `develop`, `staging`, `main` criadas.
- [ ] `develop` como default.
- [ ] Squash e merge commit habilitados.
- [ ] Rebase desabilitado.
- [ ] Auto delete desabilitado.
- [ ] Actions configuradas.
- [ ] Variables de imagens criadas.
- [ ] Environments criados.
- [ ] Secrets por Environment criados.
- [ ] Labels criadas.
- [ ] Milestone criado.
- [ ] Rulesets ativos.
- [ ] Tag ruleset ativo.
- [ ] Dependabot ativo.
- [ ] Secret scanning ativo.
- [ ] Reporte privado ativo.

## 39. Coolify

- [ ] API access habilitado.
- [ ] Token de deploy criado.
- [ ] Três projetos criados.
- [ ] Web/API/MySQL por ambiente.
- [ ] Bancos separados.
- [ ] Recursos apontando para tags móveis corretas.
- [ ] Deploy webhooks copiados.
- [ ] GHCR acessível.
- [ ] Domínios e HTTPS configurados.
- [ ] Backups configurados.

## 40. Validação

- [ ] PR válido testado.
- [ ] PR inválido bloqueado.
- [ ] Development deploy testado.
- [ ] Release RC testada.
- [ ] Correção de homologação testada.
- [ ] Produção testada.
- [ ] Mesmo digest promovido.
- [ ] Sincronização `main → develop` testada.
- [ ] Rollback testado.

---

## 41. O que não deve ser configurado ainda

Não crie antes da necessidade:

- secrets de APK;
- aprovação impossível de produção;
- token amplo de administração;
- registry privado sem necessidade;
- ruleset que bloqueia a própria automação;
- deploy automático direto do GitHub App do Coolify e deploy por Action ao mesmo tempo;
- banco compartilhado entre ambientes;
- secrets de produção em nível de repositório.

---

## 42. Referências

- GitHub Rulesets: <https://docs.github.com/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets>
- GitHub Environments: <https://docs.github.com/actions/reference/workflows-and-actions/deployments-and-environments>
- GitHub Actions: <https://docs.github.com/actions>
- GitHub Releases: <https://docs.github.com/repositories/releasing-projects-on-github>
- Coolify GitHub Actions: <https://coolify.io/docs/applications/ci-cd/github/actions/>
- Semantic Versioning: <https://semver.org/>
