# @crypta/crypto-mobile

Implementação dos adapters criptográficos para Android (React Native + Expo).

## Estado atual

**Não implementado.** Este package existe apenas como fronteira reservada do monorepo.

O Android entra na R0.7 do roadmap, mas a compatibilidade criptográfica com a Web precisa ser provada antes: um cofre criado no navegador tem que abrir no aplicativo e vice-versa.

| Pendência | Tema                                   | Referência                                     |
| --------- | -------------------------------------- | ---------------------------------------------- |
| PEND-003  | Biblioteca libsodium para React Native | [`docs/DECISIONS.md`](../../docs/DECISIONS.md) |
| PEND-004  | Parâmetros iniciais do Argon2id        | [`docs/DECISIONS.md`](../../docs/DECISIONS.md) |
| PEND-013  | Bloqueio de screenshot no Android      | [`docs/DECISIONS.md`](../../docs/DECISIONS.md) |

## O que este package deverá implementar

As mesmas interfaces de [`@crypta/crypto-core`](../crypto-core/src/adapters/crypto-adapters.ts) implementadas por `@crypta/crypto-web`, mais:

- proteção do refresh token pelo Android Keystore;
- limpeza de material de chave ao sair do aplicativo.

## Critérios de aceite quando for implementado

- os mesmos vetores determinísticos de `@crypta/crypto-web` passam aqui;
- refresh token no Keystore, nunca em `AsyncStorage`;
- nenhum segredo em log nativo;
- testado em pelo menos dois dispositivos;
- ADR correspondente criado em `docs/decisions/`.

Pode ser necessário Expo Development Build ou prebuild — Expo Go não cobre módulos nativos (DEC-013).
