# @crypta/crypto-web

Implementação dos adapters criptográficos para o navegador.

## Estado atual

**Não implementado.** Este package existe apenas como fronteira reservada do monorepo.

Nenhuma linha de criptografia será escrita aqui antes das decisões abaixo, porque a escolha da biblioteca determina o formato dos parâmetros persistidos por usuário e, uma vez que exista um cofre real, mudá-la exige migração criptográfica.

| Pendência | Tema                            | Referência                                     |
| --------- | ------------------------------- | ---------------------------------------------- |
| PEND-001  | Biblioteca Argon2id para Web    | [`docs/DECISIONS.md`](../../docs/DECISIONS.md) |
| PEND-002  | Biblioteca libsodium para Web   | [`docs/DECISIONS.md`](../../docs/DECISIONS.md) |
| PEND-004  | Parâmetros iniciais do Argon2id | [`docs/DECISIONS.md`](../../docs/DECISIONS.md) |

## O que este package deverá implementar

As interfaces já definidas em [`@crypta/crypto-core`](../crypto-core/src/adapters/crypto-adapters.ts):

- `RandomSource` — sobre `crypto.getRandomValues`, nunca `Math.random()`;
- `KdfAdapter` — Argon2id e HKDF-SHA-256;
- `AeadAdapter` — XChaCha20-Poly1305;
- `KeyExchangeAdapter` — X25519 e envelopes de `VaultKey`.

## Critérios de aceite quando for implementado

- vetores determinísticos idênticos aos de `@crypta/crypto-mobile`;
- decrypt falha com ciphertext adulterado;
- decrypt falha com AAD incorreta;
- nenhum nonce reutilizado;
- nenhuma chave persistida fora da memória;
- ADR correspondente criado em `docs/decisions/`.

Ver `CLAUDE.md` secoes 8, 9 e 81, e o checklist "Mudança de crypto" (secao 81).
