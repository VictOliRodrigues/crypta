# ADR 0001 — Monorepo com pnpm workspaces

## Status

ACCEPTED

## Data

2026-08-05

## Contexto

O produto tem três clientes previstos — Web, Android e, no futuro, extensão de navegador — que precisam falar com a mesma API e, mais importante, produzir e consumir exatamente os mesmos formatos criptográficos.

Um cofre criado no navegador tem que abrir no aplicativo. Se o formato do payload, a composição da AAD ou o cálculo do envelope divergirem em um único byte entre os clientes, o usuário perde acesso ao próprio dado — e a falha só aparece quando alguém tenta abrir o cofre no outro dispositivo.

Repositórios separados tornam essa divergência silenciosa: a Web atualiza a versão do formato, o Android continua na anterior, e nada quebra até o momento errado.

## Decisão

Um único repositório com pnpm workspaces:

```text
apps/web
apps/api
apps/mobile
packages/contracts
packages/crypto-core
packages/crypto-web
packages/crypto-mobile
packages/validation
packages/eslint-config
packages/tsconfig
```

Os contratos da API, a lógica criptográfica independente de plataforma e os schemas de validação vivem em `packages/` e são consumidos pelos três clientes.

`packages/crypto-core` não pode acessar nenhuma API de plataforma. Isso é garantido no `tsconfig.json` do package com `"types": []`, que remove os tipos do Node do escopo global e faz o typecheck falhar caso alguém use `Buffer`, `process` ou `require`. As implementações concretas ficam em `crypto-web` e `crypto-mobile`.

Os packages compartilhados são publicados em dois formatos: CommonJS para a API NestJS e para o Jest, ESM para os bundlers da Web e do mobile.

Turborepo não é adotado nesta fase. O ganho de cache não compensa a configuração adicional enquanto o build completo leva menos de um minuto.

## Alternativas consideradas

**Repositórios separados com packages publicados em um registry.** Rejeitada. Exigiria publicar e versionar `crypto-core` a cada mudança e coordenar bumps entre três repositórios. Para dois desenvolvedores, o custo de coordenação supera qualquer benefício de isolamento.

**Repositório único sem workspaces, com código compartilhado copiado.** Rejeitada. Cópia diverge.

**npm ou yarn workspaces.** pnpm foi escolhido pelo store com hardlinks, pela instalação mais rápida em CI e por `node_modules` estrito, que impede depender acidentalmente de um pacote não declarado — problema real em monorepos.

## Consequências positivas

- Um único lugar define o formato criptográfico; divergência entre clientes vira erro de compilação, não perda de dados.
- Uma mudança de contrato da API e sua adoção pelos clientes cabem no mesmo pull request e são revisadas juntas.
- Uma única configuração de lint, TypeScript e CI.

## Consequências negativas

- O contexto de build do Docker é o repositório inteiro. Cada `Dockerfile` precisa copiar os manifests de todos os workspaces para satisfazer o lockfile, mesmo os que aquela imagem não constrói.
- `pnpm install` instala dependências de todos os workspaces por padrão; os builds de imagem usam `--filter` para limitar.
- Os packages compartilhados precisam ser construídos antes das aplicações.
- Build duplo CJS/ESM adiciona um passo e um marcador `package.json` em `dist/esm`.

## Riscos

- **Acoplamento acidental entre workspaces.** Mitigado por `node_modules` estrito do pnpm e pela regra de imports do ESLint.
- **Tempo de CI crescendo com o repositório.** Aceitável enquanto o build completo estiver na casa de um minuto. Turborepo permanece como opção.
- **`packages/crypto-core` ganhando dependência de plataforma sem que ninguém perceba.** Mitigado pelo `"types": []` no tsconfig do package.

## Impactos

- **Código:** estrutura de diretórios e resolução de imports.
- **Deploy:** contexto de build e `.dockerignore` na raiz.
- **Documentação:** `ARCHITECTURE.md` secoes 7 e 8.

## Plano de migração

Não se aplica: decisão tomada antes da primeira linha de código.

## Referências internas

- `docs/ARCHITECTURE.md` secoes 7 e 8
- `docs/DECISIONS.md` DEC-001
- `CLAUDE.md` secao 6
