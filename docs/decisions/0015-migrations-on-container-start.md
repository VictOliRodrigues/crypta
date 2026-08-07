# ADR 0015 — Migrations aplicadas no start do container da API

## Status

ACCEPTED

## Data

2026-08-07

## Contexto

`ARCHITECTURE.md` secao 39.9 exige que as migrations sejam executadas com `prisma migrate deploy` e **antes do tráfego da versão dependente**. O documento define a exigência, mas não define onde esse comando roda.

A R0.1 precisa fechar essa lacuna porque `ROADMAP.md` secao 11 lista "migrations" entre os riscos que a fase existe para medir, e porque a topologia do deploy foi definida na R0: o Coolify implanta uma imagem pronta do GHCR (ADR 0009, DEC-033), disparada por webhook a partir do `deploy-development.yml`. O Coolify recebe apenas o sinal de deploy — não existe, nessa topologia, uma etapa intermediária onde um comando pudesse rodar contra o banco do ambiente antes do container subir.

Isso deixa três lugares possíveis para o `prisma migrate deploy`: no job da GitHub Actions, num recurso separado do Coolify, ou no start do próprio container da API.

O estado atual do schema torna a decisão mais barata de tomar agora do que depois. `apps/api/prisma/schema.prisma` não declara nenhum model — as entidades estão bloqueadas por `PEND-005`, `PEND-006` e `PEND-014` e entram na R0.2. Não existe `prisma/migrations/`. Verificado nesta data contra um MySQL 8.4 real, `prisma migrate deploy` sem diretório de migrations conecta ao banco, reporta `No pending migrations to apply` e encerra com código 0.

Ou seja: o caminho pode ser instalado e exercitado agora — provando conectividade, credenciais e permissões do usuário do banco — antes de existir a primeira tabela. Instalá-lo junto com a primeira migration real significaria estrear o mecanismo e o conteúdo no mesmo deploy.

## Decisão

A imagem da API passa a ter um entrypoint, `apps/api/docker-entrypoint.sh`, que executa `prisma migrate deploy` e só então entrega o controle ao comando da imagem:

```sh
set -eu

./node_modules/.bin/prisma migrate deploy

exec "$@"
```

`ENTRYPOINT` aponta para o script e `CMD` permanece `["node", "dist/main.js"]`. O `exec "$@"` preserva o `CMD` como ponto de override e faz do Node o PID 1, para que o SIGTERM do orquestrador chegue ao processo e o `enableShutdownHooks()` do Nest execute.

`set -e` é a parte deliberada: se a migration falhar, o container morre antes do `exec` e o orquestrador mantém a versão anterior no ar.

O `prisma` CLI já está em `dependencies` de `apps/api/package.json` e `prisma/` já consta no campo `files`, então ambos sobrevivem ao `pnpm deploy --prod` que monta a árvore de runtime. Nenhuma dependência nova é adicionada.

## Alternativas consideradas

**Rodar `prisma migrate deploy` no job do `deploy-development.yml`.** Rejeitada. Exigiria que o runner da GitHub Actions alcançasse o MySQL do ambiente, e `CLAUDE.md` secao 65 e `config_user.md` secao 18 determinam que o banco fique em rede privada, sem porta pública. Atender a isso significaria expor o banco ou manter um túnel — trocar uma garantia de segurança por conveniência de deploy, o que `CLAUDE.md` secao 89 resolve na direção oposta.

**Um recurso separado no Coolify executando a migration antes do deploy.** Rejeitada para a R0.1. Resolve o problema de rede, mas cria um segundo artefato a versionar, promover por digest e submeter a rollback — e a promoção por digest (DEC-034, ADR 0012) fica mais frágil quanto mais artefatos precisam andar juntos. Continua sendo a saída natural se o acoplamento entre subida e migration incomodar mais adiante.

**Comando manual antes de cada deploy.** Rejeitada. Depende de disciplina humana num passo que não pode ser esquecido, e `ROADMAP.md` secao 12 exige deploy automático por `develop`.

**Adiar a decisão para a R0.2, junto da primeira migration.** Rejeitada. É exatamente o que a R0.1 existe para evitar: `ROADMAP.md` secao 9 define a fase como a validação do caminho real antes das funcionalidades críticas. Adiar estrearia o mecanismo junto com a primeira migration com conteúdo, misturando "o caminho não funciona" com "esta migration está errada" num único deploy vermelho.

**Uma flag de ambiente para desligar a execução automática.** Rejeitada por ora. Adiciona superfície de configuração cujo único uso seria pular uma etapa que precisa acontecer, e uma flag de escape tende a virar o estado permanente do ambiente em que alguém a ligou.

## Consequências positivas

- O caminho de migration passa a ser exercitado a cada deploy desde a R0.1, com o banco em rede privada e sem porta pública.
- Conectividade, credenciais e permissões DDL do usuário do banco são validadas antes de existir a primeira tabela — quando a falha ainda é barata.
- Migration e código da versão sobem juntos, no mesmo artefato: não existe janela em que uma esteja aplicada e o outro não.
- Falha de migration impede a subida da versão nova, em vez de produzir erro em tempo de request com usuários já atendidos.
- Nenhuma dependência nova, nenhum artefato novo a promover.

## Consequências negativas

- A subida do container fica acoplada ao banco: MySQL indisponível no boot vira crashloop, mesmo que a aplicação pudesse servir `/health/live`.
- Com mais de uma réplica, todas executam `prisma migrate deploy` ao subir. O Prisma serializa por advisory lock, mas o comportamento sob réplicas concorrentes não foi testado — a R0.1 roda com réplica única.
- Migration destrutiva passa a ser aplicada por um deploy automático. `CLAUDE.md` secao 68.4 e `ARCHITECTURE.md` secao 46.1 continuam exigindo backup e rollback documentados antes, e essa exigência agora depende de processo, não de um passo manual que forçasse a pausa.
- O tempo de partida do container passa a incluir o tempo da migration, o que conta contra o `start-period` do healthcheck quando a migration for longa.
- Rollback de imagem não desfaz migration aplicada. Voltar para um `dev-<sha>` anterior devolve o código, não o schema — a compatibilidade temporária exigida por `ARCHITECTURE.md` secao 46.1 passa a ser a única proteção.
