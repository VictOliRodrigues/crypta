# CONFIG_USER.md

# Crypta — Configurações Manuais do GitHub e Coolify

> **Responsável:** Proprietário do repositório e da infraestrutura  
> **Status:** configuração da R0 concluída; Coolify e variables de imagem na R0.1  
> **Versão:** 0.3.0  
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

Foi o que aconteceu aqui: as duas foram criadas durante a R0, o `deploy-development.yml` passou a rodar e falhou em `Instalar dependências` e depois no webhook do Coolify, deixando `develop` com um vermelho permanente. Foram removidas e voltam na R0.1, junto dos secrets.

### Ordem obrigatória na R0.1

Criar estas duas variables é o **último** passo da R0.1. No instante em que existirem, o próximo push em `develop` executa o pipeline inteiro — build, push no GHCR, webhook do Coolify e verificação de `/api/v1/version`.

Tudo de que esse run depende precisa existir antes:

```text
1. Coolify provisionado           secoes 14 a 19
2. Webhooks copiados              secao 20
3. Environment development        secao 11
   variables APP_URL e API_BASE_URL
   secrets COOLIFY_TOKEN, COOLIFY_WEBHOOK_WEB, COOLIFY_WEBHOOK_API
4. WEB_IMAGE e API_IMAGE          esta secao

O primeiro run cria os packages e falha no passo de confirmação, porque eles nascem privados. A visibilidade é alterada nessa janela — a sequência está na secao 10.
```

Inverter essa ordem produz exatamente a falha registrada acima.

Checklist:

- [ ] Passos 1 a 4 concluídos antes desta secao.
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

### Visibilidade escolhida na R0.1: públicos

Os packages são tornados **públicos**, e o Coolify baixa as imagens sem credencial nenhuma.

A decisão inicial foi o oposto — privados, com um token `read:packages` guardado no Coolify — partindo da suposição de que o Coolify tivesse uma tela para credencial de registry. Ele não tem. A [documentação](https://coolify.io/docs/knowledge-base/docker/registry) define o mecanismo como `docker login` no host, e o Coolify reaproveita o `config.json` do daemon.

Isso muda o custo da alternativa privada:

- exige acesso SSH ao servidor;
- exige que o login seja feito com o **mesmo usuário** que o Coolify usa como destino de deploy, senão o pull falha com `unauthorized` ([issue #6398](https://github.com/coollabsio/coolify/issues/6398));
- a credencial não aparece em lugar nenhum da UI, então a falha não tem pista;
- cria um token a rotacionar.

Nada disso existe com packages públicos.

O conteúdo permite — verificado nesta data:

- `.dockerignore` exclui `.env`, `.env.*`, `*.pem`, `*.key`, `*.p12`, `*.jks` e `secrets`;
- `vite.config.ts` define `build.sourcemap: false`;
- a imagem da API contém apenas `dist`, `prisma` e dependências de produção;
- nenhum `VITE_*` do build carrega segredo — todos são metadados de versão e a URL pública da API.

O repositório é público e AGPL-3.0; as imagens declaram `org.opencontainers.image.source` e `org.opencontainers.image.licenses`.

### Sequência, porque a ordem importa

Packages nascem privados e só passam a existir depois do primeiro `docker push`. Quem os cria é o workflow, na Etapa 4 — e isso é deliberado: um package publicado pelo workflow fica vinculado ao repositório, e um package vinculado herda as permissões dele, o que preserva o acesso de push das publicações seguintes. Criá-los à mão, sem vínculo, arriscaria o contrário.

Então o primeiro run vai falhar, e o ponto exato é previsível:

```text
build Web e API      ok
push no GHCR         ok — os packages passam a existir, privados
webhook do Coolify   ok — o webhook só enfileira, devolve 200
confirmar versão     FALHA — o Coolify não conseguiu puxar a imagem
```

O passo `Confirmar versão implantada` tenta 20 vezes com 15 s de intervalo, então demora cerca de 5 minutos até falhar. Nessa janela:

1. tornar os dois packages públicos;
2. no Coolify, **Redeploy** nos dois recursos;
3. se o passo já tiver falhado, **Re-run failed jobs** no GitHub.

Um run vermelho no histórico é o custo aceito, e ele tem causa registrada aqui.

Checklist:

- [ ] Package Web criado pelo workflow.
- [ ] Package API criado pelo workflow.
- [ ] Visibilidade dos dois alterada para pública.
- [ ] Packages vinculados ao repositório `crypta`.
- [ ] Coolify consegue baixar as imagens sem credencial.
- [ ] Imagens não possuem segredos.

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
APP_URL=https://crypta-dev.vorodrigues.com.br
API_BASE_URL=https://crypta-api-dev.vorodrigues.com.br/api/v1
```

`API_BASE_URL` **inclui o prefixo `/api/v1`**. O workflow usa esse valor em dois lugares: como `VITE_API_BASE_URL` no build da imagem Web e para confirmar, depois do deploy, que `GET /version` reporta o commit esperado — o passo concatena `"${API_URL}/version"`, então uma barra no final produz `//version`.

Ambos com `https://`. O gate de saída exige HTTPS nos dois (`ROADMAP.md` secao 12), o cookie de refresh da R0.2 exige `Secure`, e o host da API fica embutido no bundle da Web em tempo de build: trocar o esquema depois obriga a reconstruir a imagem, não basta mexer no DNS.

Os domínios de staging e production precisam ser distintos destes (`CLAUDE.md` secao 65).

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

### A instância precisa de FQDN com TLS

Por padrão o Coolify só se expõe em `http://<ip>:8000`. Isso **não serve** para o disparo por GitHub Actions, por dois motivos independentes:

- o runner do GitHub não alcança essa porta quando há filtro de origem, e a falha aparece como timeout de mais de dois minutos, sem mensagem que indique a causa;
- a chamada leva o token do Coolify no cabeçalho `Authorization`, e sem TLS ele trafega em texto aberto pela internet.

Configure antes de copiar qualquer webhook:

```text
1. DNS: registro A do subdomínio do painel → IP do servidor
2. Coolify → Settings → Configuration → Instance Settings
     Instance's Domain (FQDN): https://<subdominio>
```

Com `https://`. O Coolify passa a se servir pelo próprio proxy na 443 e pede o certificado sozinho.

Confirmar:

```bash
curl -sI https://<subdominio> | head -1
```

Só depois disso copie os Deploy Webhooks: as URLs são geradas a partir do FQDN, e recopiá-las é obrigatório se o FQDN for definido depois.

Se o painel já esteve exposto em HTTP antes dessa mudança, rotacione o token do Coolify — ele trafegou em claro.

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

### Portas internas

Valores fixos nas imagens, verificados em execução local:

```text
Web  8080
API  3000
```

A Web roda como `nginx-unprivileged`; por isso 8080 e não 80.

### Variáveis de ambiente da API

A API valida a configuração no startup e **recusa subir** se faltar algo (`env.schema.ts`). Configure antes do primeiro deploy, senão o container entra em crashloop:

```text
DATABASE_URL=mysql://<usuário>:<senha>@<host interno do MySQL>:3306/<banco>
CORS_ORIGINS=<URL da Web daquele ambiente>
LOG_LEVEL=info
```

Em development:

```text
CORS_ORIGINS=https://crypta-dev.vorodrigues.com.br
```

Idêntico ao `APP_URL` da secao 11, caractere por caractere.

Regras que a validação aplica:

- `DATABASE_URL` precisa começar com `mysql://` e usar o host interno da rede privada, nunca um endereço público;
- `CORS_ORIGINS` precisa listar ao menos uma URL absoluta e **não aceita `*`** — a API usa cookie de refresh e um curinga tornaria qualquer site capaz de originar requisição autenticada;
- múltiplas origens são separadas por vírgula.

`APP_ENVIRONMENT`, `APP_VERSION`, `APP_COMMIT` e `APP_BUILT_AT` **não** devem ser configuradas no Coolify: já vêm embutidas na imagem pelos build args do workflow. Defini-las manualmente faria `/api/v1/version` mentir sobre o que está implantado.

#### A partir da R0.2 — autenticação

A API **lê** estas variáveis desde a R0.2 e valida a faixa de cada uma na partida. Sem as três obrigatórias — `AUTH_SERVER_SECRET`, `JWT_PRIVATE_KEY` e `JWT_PUBLIC_KEY` — ou com qualquer valor fora da faixa, ela **não sobe**. Os valores estão fixados pelo [ADR 0021](docs/decisions/0021-session-token-lifetimes.md) e pelo [ADR 0022](docs/decisions/0022-server-side-credentials.md).

```text
JWT_PRIVATE_KEY=<base64 do PEM, uma linha, por ambiente>
JWT_PUBLIC_KEY=<par da anterior, mesmo formato>
AUTH_SERVER_SECRET=v1:<32 bytes em base64url>
AUTH_SERVER_SECRET_PREVIOUS=<vazio, exceto durante uma rotação>
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d
REFRESH_TOKEN_ABSOLUTE_TTL=30d
REFRESH_COOKIE_SAMESITE=Strict
LOGIN_MAX_ATTEMPTS=5
LOGIN_LOCK_INITIAL_SECONDS=60
LOGIN_LOCK_MAX_SECONDS=900
AUTH_IP_RATE_LIMIT=60
```

Como gerar os dois segredos, em qualquer máquina com Node:

```bash
# Par Ed25519, já em base64 do PEM numa linha só
node -e "const{generateKeyPairSync}=require('node:crypto');const{publicKey,privateKey}=generateKeyPairSync('ed25519');console.log('JWT_PRIVATE_KEY='+Buffer.from(privateKey.export({type:'pkcs8',format:'pem'})).toString('base64'));console.log('JWT_PUBLIC_KEY='+Buffer.from(publicKey.export({type:'spki',format:'pem'})).toString('base64'))"

# Segredo do servidor, 32 bytes em base64url
node -e "console.log('AUTH_SERVER_SECRET=v1:'+require('node:crypto').randomBytes(32).toString('base64url'))"
```

Quatro pontos que dão trabalho se passarem despercebidos:

- **Perder o `AUTH_SERVER_SECRET` torna todas as contas daquele ambiente inacessíveis, de forma definitiva.** Ele é o pepper do verificador do `AuthSecret`, e a V1 não tem recuperação de conta (`SECURITY.md` secao 28). Guarde-o no mesmo backup das chaves JWT, **fora** do backup do banco — se os dois estiverem no mesmo lugar, o pepper deixa de proteger contra o vazamento do banco, que é a única coisa que ele existe para fazer. Rotacionar é possível e não exige que ninguém troque de senha; perder sem rotacionar, não.
- **O par de chaves JWT é por ambiente.** Reaproveitar o de development em produção faria um token emitido no ambiente de testes ser aceito no ambiente real. A API assina e verifica um valor de prova na partida, então par incompleto ou trocado falha no deploy — mas par _válido de outro ambiente_ passa, porque é um par legítimo. Essa conferência é sua.
- **O PEM cru é multilinha; aqui ele vai em base64, numa linha só.** A secao 41.1 já registra uma repository variable com quebra de linha invisível como causa de run perdido. Uma linha só elimina a classe inteira — mas confira que não sobrou espaço ou quebra ao colar.
- **`REFRESH_COOKIE_SAMESITE=Strict` só funciona porque Web e API ficam sob o mesmo domínio registrável** — `crypta-dev` e `crypta-api-dev` são hosts diferentes sob `vorodrigues.com.br`, o que para efeito de cookie é same-site. Se algum ambiente for para um domínio registrável diferente do da sua Web, `Strict` faz o cookie deixar de ser enviado e o sintoma é traiçoeiro: o login funciona e a sessão morre na primeira renovação, cerca de 15 minutos depois. Nesse caso, e só nesse, use `None`.

Não existe `REFRESH_COOKIE_DOMAIN`. O cookie é host-only de propósito, para que a sessão de um ambiente não seja aceita em outro.

### Migrations

O container da API executa `prisma migrate deploy` no entrypoint, antes de aceitar tráfego (ADR 0015). Nenhuma configuração adicional é necessária no Coolify.

Duas consequências operacionais:

- o usuário do MySQL precisa de permissão de DDL no banco daquele ambiente, não só de leitura e escrita;
- migration que falha derruba o container, e o Coolify mantém a versão anterior no ar. Isso é o comportamento desejado — verifique os logs do recurso antes de concluir que o deploy "não rodou".

### Health checks

```text
Web  GET /            → 200
API  GET /api/v1/health/live   → processo vivo
API  GET /api/v1/health/ready  → processo vivo E MySQL alcançável
```

Use `/health/ready` como health check do recurso da API no Coolify: é ele que confirma a rede privada até o banco.

Checklist:

- [ ] Recursos Web configurados.
- [ ] Recursos API configurados.
- [ ] Portas internas configuradas — Web 8080, API 3000.
- [ ] Health checks configurados.
- [ ] Variáveis de ambiente da API configuradas antes do primeiro deploy.
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
- [ ] **Liberar a criação de gatilhos** — ver abaixo.
- [ ] Configurar `DATABASE_URL` somente na API daquele ambiente.
- [ ] Configurar backup.
- [ ] Não reutilizar banco de outro ambiente.

### Liberar a criação de gatilhos

A migration `20260811203308_vaults` cria dois gatilhos. São eles que garantem **um único `OWNER` por cofre no banco**, em vez de depender de todo caminho de escrita da aplicação lembrar de calcular a coluna.

O MySQL recusa `CREATE TRIGGER` para usuário sem `SUPER` quando o log binário está ligado — que é o padrão do serviço provisionado pelo Coolify:

```text
Database error code: 1419
You do not have the SUPER privilege and binary logging is enabled
```

O usuário da aplicação tem DDL sobre o próprio banco e mesmo assim esbarra nisto: a restrição não é sobre o banco, é sobre o servidor. É o caso que a exigência de DDL da secao 17 não cobre.

Como root, uma vez por ambiente:

```sql
SET PERSIST log_bin_trust_function_creators = 1;
SELECT @@global.log_bin_trust_function_creators;
```

`SET PERSIST`, e não `SET GLOBAL`: grava em `mysqld-auto.cnf`, dentro do volume de dados, e sobrevive ao restart do container. Com `SET GLOBAL` a liberação evapora no próximo restart e o deploy volta a falhar sem nada ter mudado.

**Faça isto antes do primeiro deploy da API do ambiente.** O entrypoint aplica as migrations antes de aceitar tráfego e derruba o container quando elas falham — o que é deliberado, para não promover uma versão que não consegue migrar. Só que DDL no MySQL não é transacional: uma tentativa que falhe no gatilho deixa as tabelas já criadas e a migration registrada como falha, e a partir daí **todo deploy aborta com `P3009` sem sequer tentar**. Recuperar exige apagar as tabelas parciais e a linha correspondente de `_prisma_migrations` à mão.

---

## 19. Configurar domínios e HTTPS

### Development

```text
recurso Web  → Domains → https://crypta-dev.vorodrigues.com.br
recurso API  → Domains → https://crypta-api-dev.vorodrigues.com.br
```

Declare o domínio **com `https://`**: é isso que faz o Coolify emitir o certificado Let's Encrypt. Declarar com `http://` deixa o recurso sem certificado e reprova o gate de saída (`ROADMAP.md` secao 12).

Estado verificado em 7 de agosto de 2026, antes de criar os recursos: os dois nomes resolvem para o host do Coolify, HTTPS ainda não responde e HTTP devolve 404. Isso é o esperado — DNS e proxy prontos, sem recurso configurado para esses hostnames.

### Como confirmar depois

```bash
curl -s https://crypta-api-dev.vorodrigues.com.br/api/v1/version

curl -si https://crypta-api-dev.vorodrigues.com.br/api/v1/version \n  -H "Origin: https://crypta-dev.vorodrigues.com.br" | grep -i access-control-allow-origin
```

A segunda precisa devolver exatamente a origem da Web. Resposta vazia significa `CORS_ORIGINS` diferente do que o navegador envia — uma barra no final basta para quebrar.

Para cada ambiente:

- [ ] Domínio Web.
- [ ] Domínio API.
- [ ] DNS apontado.
- [ ] Domínio declarado com `https://` no Coolify.
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

## 21. Autenticar GHCR no servidor

**Não é necessário.** Os packages são públicos (secao 10), e o Coolify baixa as imagens sem credencial.

Registrado aqui porque a conclusão não é óbvia e custou uma tentativa errada: **o Coolify não tem UI para credencial de pull de registry privado**. A [documentação](https://coolify.io/docs/knowledge-base/docker/registry) define o mecanismo como `docker login` executado no host, com o Coolify reaproveitando o `config.json` do daemon Docker.

Se algum dia for necessário voltar a packages privados, o caminho é:

```bash
ssh <usuário>@<servidor-coolify>
docker login ghcr.io -u <usuário do GitHub>
# senha: token com somente read:packages

cat ~/.docker/config.json   # precisa conter a entrada ghcr.io
```

O login precisa ser feito com o **mesmo usuário que o Coolify usa como destino de deploy**. Logar como outro usuário grava a credencial no `~/.docker/config.json` errado e o pull falha com `unauthorized`, sem nenhuma indicação na interface ([issue #6398](https://github.com/coollabsio/coolify/issues/6398)).

O webhook de deploy **não** resolve isso: ele apenas dispara o deploy. A autenticação do `docker pull` é etapa separada e posterior.

Checklist:

- [x] Decidido: packages públicos, sem credencial no servidor.
- [ ] Pull de imagem validado na Etapa 4.

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

Marque os **quatro** checks abaixo. São os nomes exatos dos jobs, como aparecem na lista depois de
cada workflow rodar pelo menos uma vez:

```text
Validar origem e destino
Lint, tipos, testes e builds
Auditoria de dependências
Testes de integração com MySQL
```

> **`Testes de integração com MySQL` é novo na R0.2** e precisa ser marcado à mão, aqui e no
> ruleset de `release/*` da secao seguinte. Enquanto não estiver marcado, ele roda, aparece
> vermelho quando falha e **não impede o merge** — que é o pior estado possível para um check que
> valida migration e schema.

No GitHub, um check obrigatório é registrado por _check run_, não por workflow. `ci.yml` produz
três jobs distintos: marcar apenas `Lint, tipos, testes e builds` deixaria `Auditoria de
dependências` e `Testes de integração com MySQL` rodando sem poder de bloqueio — uma
vulnerabilidade conhecida em dependência, ou uma migration quebrada, apareceriam vermelhas e o
merge seguiria assim mesmo.

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
                                Testes de integração com MySQL
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
- [x] `Allowed merge methods` reduzido a `Merge, Squash`.

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
- [x] Require status checks — os mesmos **quatro** da secao 25, incluindo `Testes de integração com MySQL`, novo na R0.2.
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

- [x] `Validar origem e destino` falha com `Fluxo inválido: feature/test-invalid-flow:main`.
- [x] Merge fica bloqueado pelo ruleset da secao 25.

Validado pelo pull request #8. O job `Validar origem e destino` reprovou no passo `Verificar
combinação de branches`, o merge ficou bloqueado, o PR foi fechado sem integrar e a branch foi
removida à mão. O `Excluir branch temporária` registrou `skipped`, que é o comportamento correto
para pull request não mergeado.

O `Lint, tipos, testes e builds` passou no mesmo PR: o conteúdo estava íntegro e só o destino era
inválido, que é exatamente o que este teste precisa demonstrar.

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
- [x] Environments criados.
- [x] Labels criadas.
- [x] Milestone criado.
- [x] Rulesets ativos.
- [x] Tag ruleset ativo.
- [x] Dependabot ativo.
- [x] Secret scanning ativo.
- [x] Reporte privado ativo.
- [ ] Variables de imagens criadas. — adiadas para a R0.1; ver secao 9.
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

- [x] PR válido testado. — pull requests #5, #6 e #7, com exclusão automática da branch.
- [x] PR inválido bloqueado. — pull request #8, `feature/* → main`.
- [ ] Development deploy testado. — R0.1.
- [ ] Release RC testada. — R0.8.
- [ ] Correção de homologação testada. — R0.8.
- [ ] Produção testada. — R0.8.
- [ ] Mesmo digest promovido. — R0.8.
- [ ] Sincronização `main → develop` testada. — R0.8.
- [ ] Rollback testado. — R0.8.

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

## 41.1 Armadilhas encontradas na R0.1

Quatro erros de configuração custaram runs e depuração durante o primeiro deploy real. Nenhum deles produz mensagem que aponte a causa. Registrados aqui porque staging e production repetem os mesmos passos.

### Campo de imagem e campo de tag são separados no Coolify

O recurso Docker Image tem **dois** campos. Colocar a referência completa no primeiro deixa o segundo com o valor padrão, e o Coolify concatena os dois:

```text
ERRADO   Docker Image: ghcr.io/<owner>/<repo>-api:development
         Docker Image Tag: latest
         → ghcr.io/<owner>/<repo>-api:development:latest
         → "invalid reference format"

CERTO    Docker Image: ghcr.io/<owner>/<repo>-api
         Docker Image Tag: development
```

### A tag `latest` não existe

O pipeline publica `development`, `staging`, `vX.Y.Z-rc.N`, `vX.Y.Z` e `production` — nunca `latest`. Deixar o campo de tag no padrão produz:

```text
failed to resolve reference "...:latest": not found
```

Cada ambiente precisa da sua tag preenchida explicitamente.

### Repository variable com quebra de linha

O campo de variable é uma textarea e aceita `Enter` sem avisar. Uma quebra de linha no fim de `WEB_IMAGE` faz `${IMAGE}:development` virar duas linhas, e o `tags:` do `build-push-action`, que separa por linha, produz a tag inválida `:development`:

```text
ERROR: failed to build: invalid tag ":development": invalid reference format
```

Ao criar ou editar, digite sem tocar em `Enter` e sem espaço no fim.

### `COOLIFY_TOKEN` incompleto

O token tem o formato `<id>|<secret>` e **as duas partes são obrigatórias**. Perder o `<id>|` ao copiar devolve:

```text
401 {"message":"Unauthenticated."}
```

Distinção que economiza tempo: **401 é token não reconhecido; 403 é token válido sem permissão.** Diante de um 401, não recrie o token com outro escopo — confira o valor. O teste que separa os casos:

```bash
TOKEN='<id>|<secret>'   # aspas simples: o shell interpreta | como pipe
curl -i "https://<host-do-coolify>/api/v1/teams" -H "Authorization: Bearer $TOKEN"
```

`200` ou `403` provam que o token é válido; `401` não.

### Webhook apontando para `http://<ip>:8000`

O Coolify gera as URLs de webhook a partir do endereço da instância. Se o painel ainda não tiver FQDN, as URLs saem com IP e porta, e o passo de deploy falha assim:

```text
curl: (28) Failed to connect to <ip> port 8000 after 135135 ms
```

Timeout, não recusa — a porta responde de outras origens, mas não do runner. E a chamada leva o token em texto aberto.

Resolvido definindo o FQDN da instância (secao 14) **antes** de copiar os webhooks. Definir depois exige recopiar as duas URLs e atualizar os secrets.

### Duas coisas que não deram problema

- **Senha do MySQL:** o Coolify gera senhas sem caractere especial, então o `DATABASE_URL` não precisou de percent-encoding. Se a senha for definida à mão com `@`, `:`, `/`, `?` ou `#`, o encoding volta a ser necessário — a falha aparece como erro de parsing do Prisma, não como credencial inválida.
- **Rede entre API e MySQL:** funcionou sem ajuste adicional; `/health/ready` respondeu `database: ok` na primeira partida do container.

---

## 42. Referências

- GitHub Rulesets: <https://docs.github.com/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets>
- GitHub Environments: <https://docs.github.com/actions/reference/workflows-and-actions/deployments-and-environments>
- GitHub Actions: <https://docs.github.com/actions>
- GitHub Releases: <https://docs.github.com/repositories/releasing-projects-on-github>
- Coolify GitHub Actions: <https://coolify.io/docs/applications/ci-cd/github/actions/>
- Semantic Versioning: <https://semver.org/>
