# ADR 0009 — Deploy no Coolify sem Docker Compose

## Status

ACCEPTED

## Data

2026-08-05

## Contexto

O sistema é self-hosted em uma VPS Linux operada pelo próprio responsável do projeto. Precisa de três ambientes isolados — development, staging e production — porque a estratégia de release depende de homologar em staging exatamente o artefato que irá para produção.

Isolamento aqui não é organizacional, é de segurança: um cofre de senhas de produção não pode compartilhar banco, secrets, domínio de cookie ou backup com um ambiente onde se testa livremente.

## Decisão

Coolify na VPS, com três projetos separados:

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

Web, API e MySQL são recursos distintos dentro de cada projeto. Os ambientes não compartilham banco, volume, credenciais, domínio de cookie, secrets, URLs nem backups.

Cada aplicação tem seu próprio `Dockerfile` multi-stage, com o contexto de build na raiz do monorepo. As imagens são publicadas no GHCR e o Coolify as consome — o Coolify não constrói o código.

**Docker Compose não é usado como mecanismo de deploy.** Os recursos são declarados no Coolify.

A Web é servida por Nginx dentro da própria imagem, com fallback de SPA e cabeçalhos de segurança. O TLS é terminado pelo proxy reverso do Coolify.

O MySQL de cada ambiente fica na rede privada do projeto, sem porta publicada.

Toda a configuração manual — projetos, domínios, variáveis, secrets, webhooks — está em `config_user.md`. Nenhum identificador real de recurso, token ou webhook entra no repositório.

## Alternativas consideradas

**Docker Compose direto na VPS.** Rejeitada. Funciona, mas empurra para o repositório a responsabilidade de descrever infraestrutura e secrets, e torna mais fácil compartilhar acidentalmente rede ou volume entre ambientes. O Coolify já oferece isolamento por projeto, gestão de secrets, TLS automático e histórico de deployment.

**Kubernetes.** Rejeitada. Complexidade operacional desproporcional para uma VPS e dois usuários.

**PaaS gerenciado (Fly, Render, Railway).** Rejeitada. O produto é explicitamente self-hosted; hospedar as senhas em um provedor gerenciado contraria a premissa.

**Build no servidor a partir do código-fonte.** Rejeitada. Impediria a promoção do mesmo artefato homologado entre ambientes (ADR 0012).

**Um único projeto Coolify com três ambientes internos.** Rejeitada. Aumenta o risco de um recurso de produção ser alcançado por engano a partir de um ambiente inferior.

## Consequências positivas

- Isolamento real entre ambientes: banco, secrets, domínio e histórico próprios.
- Deploy, rollback e histórico por recurso.
- TLS e proxy reverso gerenciados.
- O Coolify apenas consome imagens já construídas e assinadas pelo pipeline, o que mantém a cadeia de entrega no GitHub Actions.

## Consequências negativas

- Configuração manual significativa, que precisa ser documentada e mantida em `config_user.md`.
- O Coolify vira dependência operacional: uma indisponibilidade dele afeta a capacidade de implantar.
- Três projetos significam três conjuntos de domínios, variáveis e backups para manter.
- Sem Compose, não existe um arquivo único no repositório que descreva a topologia; ela vive na documentação.

## Riscos

- **Divergência entre a documentação e a configuração real do Coolify.** Mitigada pela regra de atualizar `config_user.md` no mesmo pull request que muda qualquer coisa de deploy.
- **Secrets de produção reutilizados em ambiente inferior.** Proibido explicitamente; cada Environment do GitHub tem seus próprios secrets.
- **Autenticação do GitHub Actions no Coolify.** Ainda em aberto (`PEND-021`).
- **Banco exposto por configuração equivocada.** Verificação explícita nos gates de saída de cada release.

## Impactos

- **Deploy:** toda a topologia.
- **Segurança:** isolamento de banco e secrets.
- **Documentação:** `config_user.md` e `GITHUB_RELEASE_FLOW.md`.
- **Código:** `apps/api/Dockerfile`, `apps/web/Dockerfile`, `apps/web/nginx.conf`.

## Plano de migração

Não se aplica.

## Referências internas

- `docs/ARCHITECTURE.md` secoes 36 e 37
- `docs/DECISIONS.md` DEC-009, DEC-010, DEC-R008, DEC-R014, PEND-021
- `config_user.md`
