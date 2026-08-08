# @crypta/crypto-web

Implementação dos adapters criptográficos para o navegador.

## Estado atual

**Implementado.** Os adapters existem e passam a suíte de vetores.

As versões de `libsodium-wrappers-sumo` e `@noble/*` são fixas, sem `^`: uma subida silenciosa de minor numa biblioteca criptográfica pode mudar a saída, e a saída aqui é o que abre o cofre.

| Decisão                                                          | Fecha    | Assunto                          |
| ---------------------------------------------------------------- | -------- | -------------------------------- |
| [ADR 0016](../../docs/decisions/0016-argon2id-libsodium-wasm.md) | PEND-001 | Argon2id pelo libsodium em WASM  |
| [ADR 0017](../../docs/decisions/0017-web-crypto-primitives.md)   | PEND-002 | as demais primitivas             |
| [ADR 0018](../../docs/decisions/0018-argon2id-parameters.md)     | PEND-004 | parâmetros iniciais, provisórios |

## O que este package implementa

As interfaces já definidas em [`@crypta/crypto-core`](../crypto-core/src/adapters/crypto-adapters.ts), com a origem fixada pelos ADRs 0016 e 0017:

- `RandomSource` — sobre `crypto.getRandomValues`, nunca `Math.random()`;
- `KdfAdapter` — Argon2id pelo `libsodium-wrappers-sumo`, HKDF-SHA-256 pelo `crypto.subtle`;
- `AeadAdapter` — XChaCha20-Poly1305 pelo `libsodium-wrappers-sumo`;
- `KeyExchangeAdapter` — X25519 pelo `crypto.subtle`, com envelope composto; os sealed boxes do libsodium estão proibidos (ADR 0017).

Invariantes que não podem ser alteradas sem novo ADR: `parallelism = 1`, salt de 16 bytes, apenas o build ESM do libsodium, e self-test de vetor conhecido na inicialização.

## Critérios de aceite

- vetores determinísticos idênticos aos de `@crypta/crypto-mobile`, incluindo o vetor conhecido do RFC 9106 secao 5.3;
- decrypt falha com ciphertext adulterado;
- decrypt falha com AAD incorreta;
- nenhum nonce reutilizado;
- nenhuma chave persistida fora da memória;
- ADR correspondente criado em `docs/decisions/`.

Ver `CLAUDE.md` secoes 8, 9 e 81, e o checklist "Mudança de crypto" (secao 81).
