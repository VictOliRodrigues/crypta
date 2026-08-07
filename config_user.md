# CONFIG_USER.md

# Crypta — Configurações Manuais do GitHub e Coolify

> **Responsável:** Proprietário do repositório e da infraestrutura  
> **Status:** Fases 1 a 4 e 7 executadas; Coolify pendente na R0.1  
> **Versão:** 0.2.0  
> **Última atualização:** 7 de agosto de 2026

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

O repositório local já possui o histórico completo em `develop`, e o repositório do GitHub foi
criado vazio conforme a secao 3. Portanto **`main` não existe em lugar nenhum** — nem local, nem
remoto. As três branches nascem aqui, todas apontando para o mesmo commit.

Conecte o remoto e envie:

```bash
git remote add origin https://github.com/<owner>/crypta.git

git push -u origin develop

git branch main develop
git branch staging develop
git push origin main staging
```

`git branch main develop` cria a branch sem trocar de contexto: não há motivo para sair de
`develop`, e `git switch -c` deixaria você em outra branch ao final.

Resultado esperado:

```text
develop
main
staging
```

Confirme que as três apontam para o mesmo commit:

```bash
git rev-parse develop main staging
```

Checklist:

- [ ] Remoto `origin` configurado.
- [ ] `develop` enviada.
- [ ] `main` criada e enviada.
- [ ] `staging` criada e enviada.
- [ ] As três apontam para o mesmo commit.

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

- [x] Default branch alterada para `develop`.
- [x] Novos PRs sugerem `develop` como destino.

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

- [x] Allow squash merging.
- [x] Allow merge commits.

Desabilitar inicialmente:

- [x] Allow rebase merging.

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

- [x] Exclusão automática nativa desabilitada.

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

Os workflows declaram permissões mínimas em YAML.

- [x] Manter `Read repository contents and packages permissions`.
- [x] Habilitar `Allow GitHub Actions to create and approve pull requests`.

**Não selecione `Read and write permissions`.** Ela concede escrita global ao `GITHUB_TOKEN` em todos os escopos, para todos os workflows, e não é necessária: um workflow pode declarar permissão maior no próprio YAML, mesmo com o default restrito.

Isto está confirmado neste repositório. O `cleanup-temporary-branches.yml` declara `permissions: contents: write` e apagou a branch `chore/restore-green-ci` com sucesso, com o default em `Read repository contents and packages permissions`.

A automação deverá apenas criar PRs; aprovação automática não deve ser utilizada.

Se o repositório estiver em uma organização, confirme se a política da organização permite estas opções.

Checklist:

- [x] Actions habilitadas.
- [x] Workflows podem criar PR de sincronização.
- [ ] Workflows podem criar tags — confirmar na primeira RC.
- [ ] Workflows podem criar releases — confirmar na primeira RC.
- [ ] Workflows podem publicar packages — R0.1.

---

## 8. Adicionar os workflows antes dos checks obrigatórios

Os seguintes arquivos precisam existir na branch padrão:

```text
.github/workflows/ci.yml
.github/workflows/validate-pr-flow.yml
.github/workflows/cleanup-temporary-branches.yml
.github/workflows/start-release.yml
.github/workflows/deploy-development.yml
.github/release.yml
```

`publish-prerelease.yml` e `publish-production.yml` entram na **R0.8**, junto com os projetos
Coolify de staging e production. Não são pré-requisito para fechar a R0 e não devem ser
esperados aqui.

Checklist:

- [x] Workflows commitados em `develop`.
- [x] `ci.yml` executado pelo menos uma vez.
- [x] `validate-pr-flow.yml` executado pelo menos uma vez.
- [x] Nomes reais dos checks anotados — os três estão na secao 25.

Não configure um required check antes de ele aparecer pelo menos uma vez no GitHub.

O GitHub oferece na lista os checks que já viu executar, independentemente do resultado. Ter rodado é o que registra o nome; ter passado é o que você precisa confirmar antes de tornar o check obrigatório, para não travar a branch padrão com uma exigência que ninguém consegue cumprir.

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

### Consequência de criar estas variables

`deploy-development.yml` tem `if: vars.WEB_IMAGE != '' && vars.API_IMAGE != ''`. Enquanto as duas não existirem, o workflow é pulado. No instante em que existirem, ele passa a rodar a cada push em `develop` — e falha até a R0.1, porque os secrets do Coolify ainda não existem.

Isso deixa a branch padrão com um workflow vermelho de forma permanente, o que atrapalha distinguir regressão real de ruído esperado. Se você ainda não vai configurar o Coolify, crie as duas variables só na R0.1.

Elas não fazem parte do gate de saída da R0.

Checklist:

- [x] `WEB_IMAGE` criada.
- [x] `API_IMAGE` criada.
- [x] Nomes em minúsculas.
- [x] Nenhum secret colocado em variável pública.

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

- [x] Environment criado.
- [x] Branch `develop` autorizada.
- [ ] URLs configuradas. — vazias até a R0.1.
- [ ] Secrets configurados. — dependem do Coolify, R0.1.

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

- [x] Environment criado.
- [x] Branch/tag autorizada. — `staging` e `v*-rc.*`.
- [ ] URLs configuradas. — R0.8.
- [ ] Secrets de staging configurados. — R0.8.

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

- [x] Environment criado.
- [x] Branch/tag autorizada. — `main` e `v*`.
- [ ] URLs configuradas. — R0.8.
- [ ] Secrets de produção configurados. — R0.8.
- [x] Proteção compatível com a quantidade de revisores. — sem required reviewers enquanto houver um único mantenedor.

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

- [x] Labels criadas.
- [x] Nomes iguais ao `.github/release.yml`.

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

- [x] Milestone inicial criado.
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

Marque os **três** checks abaixo. São os nomes exatos dos jobs, como aparecem na lista depois de
cada workflow rodar pelo menos uma vez:

```text
Validar origem e destino
Lint, tipos, testes e builds
Auditoria de dependências
```

No GitHub, um check obrigatório é registrado por _check run_, não por workflow. `ci.yml` produz
dois jobs distintos: marcar apenas `Lint, tipos, testes e builds` deixaria `Auditoria de
dependências` rodando sem poder de bloqueio — uma vulnerabilidade conhecida em dependência
apareceria vermelha e o merge seguiria assim mesmo.

O check `Validar origem e destino` só aparece nesta lista **depois** que existir um pull request
que o tenha executado, porque `validate-pr-flow.yml` dispara apenas em `pull_request`. Faça o PR
de teste da secao 31 antes de criar este ruleset.

Antes de marcar `Validar origem e destino` como obrigatório, confirme que o `validate-pr-flow.yml`
aceita `dependabot/*:develop`. Sem essa entrada o check reprova todo PR do Dependabot, e o PR fica
immergeável no momento em que a regra passa a valer — inclusive as atualizações de segurança, que
são justamente as que não podem esperar.

Cuidado com o que a lista oferece além desses três. O check chamado `Dependabot` aparece ali, mas
vem do workflow dinâmico `dynamic/dependabot/dependabot-updates` e só reporta nas execuções do
próprio Dependabot. Marcado como obrigatório, ele nunca reporta num pull request comum, fica
_pending_ para sempre e **bloqueia todo merge**.

### Configuração aplicada

```text
Permanent branches   target=branch   refs/heads/{develop,staging,main}
  Restrict deletions
  Block force pushes
  Require a pull request        aprovações = 0, conversation resolution = on
  Require status checks         Auditoria de dependências
                                Lint, tipos, testes e builds
                                Validar origem e destino
```

`Allowed merge methods` deve ficar em `Merge, Squash` — o rebase já está desabilitado no
repositório pela secao 6, e deixá-lo no ruleset reintroduz a terceira estratégia caso alguém
reabilite a opção global.

Checklist:

- [x] Ruleset ativo.
- [x] Targets corretos.
- [x] Force push bloqueado.
- [x] Exclusão bloqueada.
- [x] PR obrigatório, com zero aprovações exigidas.
- [x] Conversation resolution exigida.
- [x] Os três checks obrigatórios, e somente eles.
- [x] Linear history desabilitado.
- [ ] `Allowed merge methods` reduzido a `Merge, Squash`.

---

## 26. Ruleset de `release/*`

Criar em `New branch ruleset`. **Não** use `New tag ruleset`: o alvo é a branch `release/x.y.z`, e um ruleset de tag com o mesmo padrão fica ativo, aparece verde na tela e não protege nada.

Nome:

```text
Release branches
```

Target pattern:

```text
release/*
```

Ativar:

- [x] Restrict deletions.
- [x] Block force pushes.
- [x] Require status checks — os mesmos três da secao 25.
- [x] Do not require status checks on creation.

Não ativar:

- [ ] Require a pull request before merging.

### Por que sem exigência de pull request

`start-release.yml` cria a branch `release/x.y.z` e empurra nela o commit que atualiza o `VERSION`, usando o `GITHUB_TOKEN`. Exigir pull request nesse alvo bloquearia esse push.

A saída natural seria colocar a automação na bypass list, mas ela não existe: os atores elegíveis são administradores do repositório, da organização e da empresa, papéis `maintain` e `write`, times, GitHub Apps e o Dependabot. O `GITHUB_TOKEN` executa como `github-actions[bot]`, que **não** é um ator elegível, e um bypass por papel de administrador não cobre o token do workflow.

As alternativas seriam trocar o `GITHUB_TOKEN` por um PAT ou GitHub App guardado em secret, o que amplia a superfície de ataque de um repositório de cofre de senhas, ou reescrever o workflow para não empurrar direto — sem ganho real, porque a criação da branch é um push por definição.

O que o `CLAUDE.md` secao 64 exige de `release/*` é que ela não seja apagada durante a homologação e que a RC não seja reescrita. `Restrict deletions` e `Block force pushes` entregam exatamente isso. A disciplina de `fix/* → release/*` continua garantida pelo `validate-pr-flow.yml`, que reprova qualquer outra origem.

`Do not require status checks on creation` é obrigatório junto de `Require status checks`: o commit do `VERSION` nasce sem check algum, e sem essa opção a criação da branch pode ser barrada.

A branch será excluída manualmente apenas depois de:

```text
produção publicada
+
main sincronizada com develop
```

Checklist:

- [x] Criado como **branch** ruleset, não tag.
- [x] Pattern correto.
- [x] Exclusão bloqueada durante homologação.
- [x] Force push bloqueado.
- [x] `Do not require status checks on creation` marcado.
- [ ] Comportamento confirmado na primeira release real — ver secao 33.

`Applies to 0 targets` é o resultado esperado enquanto nenhuma branch `release/*` existir.

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

- [x] Restrict deletions.
- [x] Restrict updates.
- [x] Block force pushes.

Não marque `Restrict creations`: a automação de release precisa criar a tag, e o `GITHUB_TOKEN` não pode entrar na bypass list — o motivo está na secao 26.

### Não teste com uma tag fictícia

Com `Restrict deletions` e `Restrict updates` ativos e a bypass list vazia, uma tag `v*` criada para teste fica **permanentemente impossível de apagar** — nem o proprietário do repositório consegue, porque administrador só ganha bypass se estiver explicitamente na lista.

A validação correta é a primeira release candidate real, na secao 33. Até lá, confira a configuração pela tela do ruleset em vez de exercitá-la.

Isto também não faz parte do gate de saída da R0: `ROADMAP.md` secao 8 não exige imutabilidade de tag para fechar a fase.

Checklist:

- [x] Ruleset criado com target `v*`.
- [x] Exclusão e atualização restritas.
- [x] `Restrict creations` **não** marcado.
- [ ] Tags publicadas são imutáveis — confirmar na primeira RC.
- [ ] Workflow consegue criar nova tag — confirmar na primeira RC.

---

# FASE 8 — SECURITY E REPOSITORY SETTINGS

---

## 28. Ativar segurança do repositório

No repositório:

```text
Settings
→ Advanced Security
```

O menu já se chamou `Code security`. Se a interface mudar de novo, procure por `Dependabot` e `Secret scanning` nas configurações.

Repositório público já vem com secret scanning, push protection, dependency graph e Dependabot habilitados:

- [x] Dependabot alerts.
- [x] Dependabot security updates.
- [x] Secret scanning.
- [x] Push protection.
- [ ] Code scanning, quando o workflow estiver configurado — R0.8.

Como o repositório é público, revise qualquer alerta antes de publicar credenciais reais.

---

## 29. Configurar canal de vulnerabilidade

No GitHub, habilite Private vulnerability reporting quando disponível.

Checklist:

- [x] Reporte privado habilitado.
- [x] `SECURITY.md` aponta o canal correto.
- [x] Issues públicas não são usadas para segredos.

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

- [x] Workflow aceita.
- [x] CI executa.
- [x] Merge por squash disponível.
- [x] Branch temporária é excluída pelo workflow.

Validado pelos pull requests #5 e #6, ambos `chore/* → develop`. O `Validar origem e destino`
aprovou, o `cleanup-temporary-branches.yml` apagou a branch integrada sozinho e o registro está no
run `Excluir branch integrada`.

---

## 32. Teste de PR inválido

Tentar, sem fazer merge:

```text
feature/test-invalid-flow → main
```

Crie a branch a partir de `develop` com um commit vazio; não é preciso alterar arquivo nenhum:

```bash
git switch -c feature/test-invalid-flow develop
git commit --allow-empty -m "test: check that the flow gate blocks feature to main"
git push -u origin feature/test-invalid-flow
```

Validar:

- [ ] `Validar origem e destino` falha com `Fluxo inválido: feature/test-invalid-flow:main`.
- [ ] Merge fica bloqueado pelo ruleset da secao 25.

Este teste não depende de a CI estar verde: o check de fluxo não instala dependências e falha antes
de qualquer outro job terminar.

Fechar o PR sem mergear e **apagar a branch manualmente** — o `cleanup-temporary-branches.yml` só
roda em pull request mergeado.

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

- [x] Repositório criado.
- [x] `develop`, `staging`, `main` criadas.
- [x] `develop` como default.
- [x] Squash e merge commit habilitados.
- [x] Rebase desabilitado.
- [x] Auto delete desabilitado.
- [x] Actions configuradas.
- [x] Variables de imagens criadas.
- [x] Environments criados.
- [x] Labels criadas.
- [x] Milestone criado.
- [x] Rulesets ativos.
- [x] Tag ruleset ativo.
- [x] Dependabot ativo.
- [x] Secret scanning ativo.
- [x] Reporte privado ativo.
- [ ] Secrets por Environment criados. — dependem do Coolify, R0.1.
- [ ] Apps de terceiros revisados. — `railway-app` e `vercel` removidos; resta apenas o app do
      Coolify, que precisa ficar com `Auto deploy` desabilitado para não duplicar o deploy feito
      pelas Actions (secao 17 e secao 41).

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
