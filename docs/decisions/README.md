# Architecture Decision Records

Registro das decisões arquiteturais do cofre de senhas.

O índice resumido com status fica em [`../DECISIONS.md`](../DECISIONS.md). Este diretório guarda o detalhamento: contexto, alternativas descartadas, consequências e riscos.

## Convenção

Arquivos seguem `NNNN-titulo-curto.md`. A estrutura obrigatória está em [`../DECISIONS.md`](../DECISIONS.md) secao 4.

Um ADR publicado não é reescrito. Quando uma decisão muda, cria-se um novo ADR e o anterior é marcado como `SUPERSEDED`, com referência ao substituto. O histórico das escolhas erradas é tão útil quanto o das certas: evita repetir a mesma discussão sem contexto novo.

## Índice

| ADR                                           | Título                                        | Status   |
| --------------------------------------------- | --------------------------------------------- | -------- |
| [0001](0001-monorepo.md)                      | Monorepo com pnpm workspaces                  | ACCEPTED |
| [0002](0002-modular-monolith.md)              | Monólito modular no backend                   | ACCEPTED |
| [0003](0003-client-side-encryption.md)        | Criptografia no cliente                       | ACCEPTED |
| [0004](0004-auth-secret-domain-separation.md) | Separação entre autenticação e criptografia   | ACCEPTED |
| [0005](0005-shared-vault-key-envelopes.md)    | VaultKey por cofre e envelope por membro      | ACCEPTED |
| [0006](0006-client-side-csv-import.md)        | Importação CSV processada no navegador        | ACCEPTED |
| [0007](0007-rest-api.md)                      | API REST versionada                           | ACCEPTED |
| [0008](0008-mysql-prisma.md)                  | MySQL com Prisma                              | ACCEPTED |
| [0009](0009-coolify-deployment.md)            | Deploy no Coolify sem Docker Compose          | ACCEPTED |
| [0010](0010-session-strategy.md)              | Sessões com refresh token rotacionado         | ACCEPTED |
| [0011](0011-github-release-flow.md)           | Fluxo de branches, versões e releases         | ACCEPTED |
| [0012](0012-immutable-artifact-promotion.md)  | Build único na RC e promoção por digest       | ACCEPTED |
| [0013](0013-agpl-license.md)                  | Licença AGPL-3.0                              | ACCEPTED |
| [0014](0014-js-yaml-override.md)              | Override de `js-yaml` para a versão corrigida | ACCEPTED |
| [0015](0015-migrations-on-container-start.md) | Migrations aplicadas no start do container    | ACCEPTED |
| [0016](0016-argon2id-libsodium-wasm.md)       | Argon2id pelo libsodium em WebAssembly        | ACCEPTED |
| [0017](0017-web-crypto-primitives.md)         | Primitivas da Web por origem especializada    | ACCEPTED |
| [0018](0018-argon2id-parameters.md)           | Parâmetros iniciais do Argon2id               | ACCEPTED |
| [0019](0019-database-identifiers.md)          | Identificadores UUIDv7 em `CHAR(36)`          | ACCEPTED |
| [0020](0020-deletion-policy.md)               | Exclusão física com auditoria preservada      | ACCEPTED |
| [0021](0021-session-token-lifetimes.md)       | Duração dos tokens e cookie de refresh        | ACCEPTED |

## Decisões ainda em aberto

As pendências estão listadas em [`../DECISIONS.md`](../DECISIONS.md) secao 7. Cada uma precisa virar ADR antes da implementação que ela bloqueia.

**Nenhuma pendência bloqueia a R0.2.** As três últimas — `PEND-007` e `PEND-008`, duração dos tokens, e `PEND-009`, `SameSite` e domínio do cookie — foram fechadas pelo [ADR 0021](0021-session-token-lifetimes.md).

Histórico do desbloqueio da fase: `PEND-001`, `PEND-002` e `PEND-004` foram fechadas pelos ADRs 0016, 0017 e 0018, liberando `@crypta/crypto-web`. `PEND-005`, `PEND-006` e `PEND-014` foram fechadas pelos ADRs 0019 e 0020, liberando o `schema.prisma`.

`PEND-003`, a biblioteca do Android, continua aberta e entra na R0.7 — os ADRs 0016 e 0017 registram as invariantes que a escolha do Android precisa respeitar para manter os vetores compatíveis. As demais pendências abertas dizem respeito a fases posteriores.
