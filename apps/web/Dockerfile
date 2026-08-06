# syntax=docker/dockerfile:1

# =============================================================================
# apps/web — Imagem da aplicação Web (build Vite servido por Nginx)
#
# O contexto de build é a RAIZ do monorepo:
#   docker build -f apps/web/Dockerfile .
#
# ATENÇÃO: todo VITE_* vira conteúdo público dentro do bundle. Nenhum segredo
# pode ser passado como build arg aqui (STYLE_GUIDE.md secao 66).
# =============================================================================

ARG NODE_IMAGE=node:24.14.0-alpine3.22
ARG NGINX_IMAGE=nginxinc/nginx-unprivileged:1.29-alpine

FROM ${NODE_IMAGE} AS base
ENV PNPM_HOME=/pnpm
ENV PATH="${PNPM_HOME}:${PATH}"
RUN corepack enable
WORKDIR /repo

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

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter "@crypta/web..."

FROM deps AS build

# Configuração pública embutida no bundle.
ARG VITE_API_BASE_URL
ARG VITE_APP_ENVIRONMENT=development
ARG VITE_APP_VERSION=0.0.0-local
ARG VITE_APP_COMMIT=local

ENV VITE_API_BASE_URL=${VITE_API_BASE_URL} \
    VITE_APP_ENVIRONMENT=${VITE_APP_ENVIRONMENT} \
    VITE_APP_VERSION=${VITE_APP_VERSION} \
    VITE_APP_COMMIT=${VITE_APP_COMMIT}

COPY scripts ./scripts
COPY packages ./packages
COPY apps/web ./apps/web

RUN pnpm --filter "@crypta/web^..." run build \
 && pnpm --filter "@crypta/web" run build

# -----------------------------------------------------------------------------
# Runtime: Nginx unprivileged, que roda como não-root na porta 8080.
# -----------------------------------------------------------------------------
FROM ${NGINX_IMAGE} AS runtime

ARG VITE_APP_VERSION=0.0.0-local
ARG VITE_APP_COMMIT=local
ARG APP_BUILT_AT=1970-01-01T00:00:00.000Z

LABEL org.opencontainers.image.title="crypta-web" \
      org.opencontainers.image.version="${VITE_APP_VERSION}" \
      org.opencontainers.image.revision="${VITE_APP_COMMIT}" \
      org.opencontainers.image.created="${APP_BUILT_AT}"

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD ["/bin/sh", "-c", "wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1"]
