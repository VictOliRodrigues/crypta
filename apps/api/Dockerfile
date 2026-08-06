# syntax=docker/dockerfile:1

# =============================================================================
# apps/api — Imagem da API NestJS
#
# O contexto de build é a RAIZ do monorepo, não esta pasta:
#   docker build -f apps/api/Dockerfile .
#
# Regras aplicadas (ARCHITECTURE.md secao 37, CLAUDE.md secao 66):
#   - multi-stage;
#   - usuário não-root;
#   - somente dependências de produção no runtime;
#   - sem .env e sem segredo na imagem;
#   - metadados de versão injetados por build arg.
# =============================================================================

ARG NODE_IMAGE=node:24.14.0-alpine3.22

# -----------------------------------------------------------------------------
# Base: Node + pnpm na versão declarada em packageManager.
# -----------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS base
ENV PNPM_HOME=/pnpm
ENV PATH="${PNPM_HOME}:${PATH}"
RUN corepack enable
WORKDIR /repo

# -----------------------------------------------------------------------------
# Dependências: só os manifests, para aproveitar cache de camada.
# O lockfile exige que TODOS os workspaces estejam presentes, mesmo os que esta
# imagem não constrói.
# -----------------------------------------------------------------------------
FROM base AS deps

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/validation/package.json ./packages/validation/
COPY packages/crypto-core/package.json ./packages/crypto-core/
COPY packages/crypto-web/package.json ./packages/crypto-web/
COPY packages/crypto-mobile/package.json ./packages/crypto-mobile/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# `--frozen-lockfile` garante que a imagem usa exatamente as versões revisadas.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter "@crypta/api..."

# -----------------------------------------------------------------------------
# Build: compila os packages compartilhados e depois a API.
# -----------------------------------------------------------------------------
FROM deps AS build

COPY scripts ./scripts
COPY packages ./packages
COPY apps/api ./apps/api

RUN pnpm --filter "@crypta/api^..." run build \
 && pnpm --filter "@crypta/api" run build

# `pnpm deploy` monta uma árvore autocontida com apenas as dependências de
# produção, resolvendo os workspace: links para o conteúdo real.
RUN pnpm --filter "@crypta/api" --prod --legacy deploy /prod/api

# O client do Prisma vive dentro de node_modules e é recriado do zero pelo
# deploy. Sem este generate, o artefato final sobe sem client.
RUN cd /prod/api && ./node_modules/.bin/prisma generate

# -----------------------------------------------------------------------------
# Runtime
# -----------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS runtime

ARG APP_VERSION=0.0.0-local
ARG APP_COMMIT=local
ARG APP_ENVIRONMENT=development
ARG APP_BUILT_AT=1970-01-01T00:00:00.000Z

ENV NODE_ENV=production \
    APP_VERSION=${APP_VERSION} \
    APP_COMMIT=${APP_COMMIT} \
    APP_ENVIRONMENT=${APP_ENVIRONMENT} \
    APP_BUILT_AT=${APP_BUILT_AT} \
    API_PORT=3000

# Rótulos OCI: ligam a imagem ao commit que a originou, o que sustenta a
# promoção por digest e o rollback.
LABEL org.opencontainers.image.title="crypta-api" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.revision="${APP_COMMIT}" \
      org.opencontainers.image.created="${APP_BUILT_AT}"

WORKDIR /app

RUN addgroup -S vault && adduser -S -G vault vault

COPY --from=build --chown=vault:vault /prod/api ./

USER vault

EXPOSE 3000

# O readiness confere o banco; o healthcheck do container confere o processo.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.API_PORT||3000)+'/api/v1/health/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/main.js"]
