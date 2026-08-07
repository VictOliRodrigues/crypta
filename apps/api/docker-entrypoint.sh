#!/bin/sh
#
# Entrypoint da API.
#
# Aplica as migrations pendentes ANTES de o processo passar a aceitar tráfego
# (ARCHITECTURE.md secao 39.9). Subir a versão nova contra um schema antigo
# produziria erro em tempo de request — mais difícil de diagnosticar, e com o
# agravante de já ter atendido usuários pela metade.
#
# Falhar aqui é deliberado: `set -e` derruba o container antes do `exec`, e o
# orquestrador mantém a versão anterior no ar em vez de promover uma que não
# consegue migrar.
#
# `prisma migrate deploy` só aplica migrations já versionadas no repositório.
# Nunca gera migration nova e nunca executa `db push` (CLAUDE.md secao 68.4).
# Com o diretório de migrations vazio ele reporta "No pending migrations to
# apply" e encerra com 0, o que mantém este caminho exercitado desde a R0.1,
# antes de existir a primeira tabela.
set -eu

./node_modules/.bin/prisma migrate deploy

# `exec` substitui o shell pelo processo do Node, que passa a ser o PID 1 e
# recebe o SIGTERM do orquestrador. Sem isso o sinal morreria no shell e o
# enableShutdownHooks() do Nest não rodaria no encerramento.
exec "$@"
