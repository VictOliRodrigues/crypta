# ADR 0017 — Primitivas criptográficas da Web por origem especializada

## Status

ACCEPTED

## Data

2026-08-07

## Contexto

`PEND-002` estava escrita como "biblioteca libsodium Web", partindo de `ARCHITECTURE.md` secao 3.6, que fixa "bibliotecas da família libsodium" como stack. A investigação que fechou `PEND-001` mostrou que essa formulação não sobrevive ao contato com o runtime.

O contrato em `crypto-adapters.ts` pede quatro coisas além do Argon2id: CSPRNG, HKDF-SHA-256, XChaCha20-Poly1305 e X25519 com envelope de remetente anônimo. Três descobertas, todas medidas:

**Nenhum build do `libsodium.js` expõe HKDF chamável.** Tanto o padrão quanto o sumo trazem apenas as constantes `crypto_kdf_hkdf_sha256_BYTES_MAX`, `_BYTES_MIN` e `_KEYBYTES`; as funções `_extract` e `_expand` não existem no wrapper. `CLAUDE.md` secao 8 exige HKDF-SHA-256. Ou seja: mesmo uma decisão "só libsodium" precisaria de outra origem para HKDF.

**`crypto_box_curve25519xchacha20poly1305_seal_open` falha aberto.** É a função cujo nome corresponde ao `"X25519-XCHACHA20-POLY1305"` que `docs/API.md` já declara para os envelopes. Adulterando 200 ciphertexts, ela devolveu conteúdo 200 vezes e **nunca lançou erro**. Os controles no mesmo teste se comportaram corretamente: `crypto_box_seal` lançou 200 de 200, e o AEAD `crypto_aead_xchacha20poly1305_ietf_decrypt` lançou 50 de 50. O defeito é do wrapper JavaScript, não do C — mas é o wrapper que roda no navegador. Aceitar isso violaria `CLAUDE.md` secao 9: "nunca ignorar erro de autenticação", "nunca aceitar ciphertext adulterado", "sempre falhar fechado".

**`crypto.subtle` já entrega HKDF-SHA-256 e X25519 nativamente**, em código constant-time, dentro de Web Worker, sem bytes de bundle e sem superfície de supply chain. Verificado byte a byte contra `@noble/hashes` e `@noble/curves`: as saídas coincidem, e ambos rejeitam ponto de ordem baixa.

O responsável pelo projeto autorizou explicitamente o desvio de `ARCHITECTURE.md` secao 3.6 para escolher a melhor primitiva por tarefa.

## Decisão

Cada primitiva vem da origem que a implementa melhor:

| Primitiva          | Origem                    | Motivo                                                     |
| ------------------ | ------------------------- | ---------------------------------------------------------- |
| CSPRNG             | `crypto.getRandomValues`  | nativo e síncrono, casa com a assinatura de `RandomSource` |
| Argon2id           | `libsodium-wrappers-sumo` | ADR 0016                                                   |
| XChaCha20-Poly1305 | `libsodium-wrappers-sumo` | já carregado, e verificado que falha fechado               |
| HKDF-SHA-256       | `crypto.subtle`           | libsodium não expõe; nativo e sem bundle                   |
| X25519             | `crypto.subtle`           | nativo e constant-time                                     |

O AEAD fica no libsodium porque ele já está carregado para o Argon2id: adicionar uma segunda biblioteca para XChaCha20-Poly1305 duplicaria capacidade, o que `CLAUDE.md` secao 59 manda evitar.

**Os sealed boxes do libsodium estão proibidos.** Nem `crypto_box_curve25519xchacha20poly1305_seal_open`, pelo falha-aberto medido, nem `crypto_box_seal`, que é X25519-XSalsa20-Poly1305 e não corresponde ao algoritmo declarado.

**O envelope da `VaultKey` é composto**, no padrão do RFC 9180:

```text
X25519 efêmero + HKDF-SHA-256 -> chave de envelope
chave de envelope + XChaCha20-Poly1305 -> VaultKeyEnvelope
```

Isso não é criptografia nova: é a composição padrão de ECDH com KDF e AEAD, e é exatamente a forma que `docs/API.md` já documenta, com `ephemeralPublicKey`, `nonce` e `encryptedVaultKey` como campos separados. O sealed box do libsodium sequer conseguiria produzir essa forma, porque deriva o nonce de `blake2b(epk || pk_destinatário)` e não o expõe como valor independente.

**Chave privada X25519.** O `crypto.subtle` não exporta `raw`, apenas `pkcs8`. A conversão é um prefixo fixo de 16 bytes:

```text
302e020100300506032b656e04220420 || <32 bytes da chave>
```

Verificado nos dois sentidos contra `@noble/curves`. A interoperabilidade com o Android em bytes crus está preservada, e é esse detalhe que quebraria a implementação se ficasse sem registro.

**Gate de navegador, não fallback.** X25519 no WebCrypto é recente: Chrome 133 de fevereiro de 2025, Firefox 130, Safari 17, Samsung Internet 29. Navegador sem suporte recebe falha declarada. Um fallback em JS puro anularia a razão de escolher o WebCrypto, que é justamente ser constant-time.

**`@noble/hashes` e `@noble/ciphers` entram como `devDependencies`**, nunca em produção, como segunda implementação independente para conferir vetores na CI. Fixados em `2.2.0`, de 11 de abril de 2026: as versões `2.3.0` saíram em 6 de agosto de 2026 e seriam recusadas pelo `minimumReleaseAge` padrão do pnpm 11, que é o mesmo portão de supply chain descrito no ADR 0014.

**`errors.ts` ganha `CryptoAuthenticationError`.** Hoje existem apenas `CryptoFormatError`, `CryptoVersionError` e `CryptoAlgorithmError`. `AeadAdapter.decrypt` está documentado como "lança erro quando a tag ou a AAD não conferem", mas não há erro tipado para isso, e a interface não consegue distinguir ciphertext adulterado de JSON malformado sem comparar texto de mensagem de biblioteca.

## Alternativas consideradas

**Somente `libsodium-wrappers-sumo`.** Rejeitada por impossibilidade, não por preferência: o wrapper não expõe HKDF, então a opção não existe de fato. Ainda que existisse, obrigaria a usar um sealed box que falha aberto ou a compor o envelope à mão de qualquer forma.

**Somente `@noble/*` para tudo.** Coerente e muito bem mantida, com provenance SLSA. Rejeitada por dois motivos independentes: o Argon2id em JS puro é cerca de 20x mais lento (ADR 0016), e o próprio código do `@noble/curves` documenta que o X25519 não é integralmente constant-time — "JavaScript BigInt has no constant-time contract", com dependência residual medida em torno de 3%. Para a chave que abre todos os cofres do usuário, o WebCrypto nativo é a escolha melhor.

**`@noble/ciphers` para o XChaCha20-Poly1305.** Rejeitada por duplicar capacidade já presente no libsodium, que estará carregado de todo modo. Mantida como oráculo de teste.

**Uma biblioteca de HPKE pronta.** Rejeitada por acrescentar dependência para uma composição de três primitivas que o projeto já tem, e por atrelar o formato do envelope a decisões de uma biblioteca em vez de ao que `docs/API.md` já especifica.

**Fallback em JS puro quando o WebCrypto não tiver X25519.** Rejeitada. Reintroduz exatamente a característica de tempo que motivou escolher o nativo, e cria dois caminhos de código com a mesma chave.

## Consequências positivas

- HKDF-SHA-256 e X25519 saem em código nativo constant-time, com zero bytes de bundle e zero superfície de supply chain adicional.
- Nenhum caminho do código toca uma função que falha aberto, e a decisão está registrada com a evidência que a motivou.
- O envelope passa a ter a forma que a API já documenta, em vez de forçar a API a se adaptar a um formato opaco de biblioteca.
- Um oráculo independente em `devDependencies` detecta mudança silenciosa de saída do libsodium entre versões, que é o risco de manutenção apontado no ADR 0016.
- `crypto.subtle` funciona em Web Worker, o que mantém aberta a opção de tirar a derivação da thread principal.

## Consequências negativas

- Três origens de primitiva em vez de uma, o que aumenta a importância da suíte de vetores em vez de reduzi-la.
- Navegadores sem X25519 no WebCrypto ficam de fora, e a lista de suporte passa a ter um piso concreto e recente.
- Conversão manual entre `raw` e `pkcs8` para a chave privada, com um prefixo fixo que precisa de teste próprio.
- O desvio de `ARCHITECTURE.md` secao 3.6 exige manter esse documento e o título de `PEND-003` alinhados a esta decisão.
- `crypto-core` passa a ter um erro novo, e `crypto-web` depende de duas origens com ciclos de vida diferentes.

## Riscos

- **Divergência entre WebCrypto e a implementação do Android.** Mitigação: os vetores determinísticos são o critério de aceite, e a igualdade entre `crypto.subtle`, `@noble` e libsodium para HKDF-SHA-256 e X25519 já foi verificada byte a byte.
- **O gate de navegador excluir usuários reais.** Mitigação: mensagem explícita, e a lista de versões mínimas registrada aqui para revisão futura. É risco de produto assumido conscientemente, não defeito.
- **O prefixo `pkcs8` mudar de forma.** É definido por RFC e estável, mas a conversão precisa de teste que falhe alto, não de confiança.
- **Alguém reintroduzir o sealed box por parecer mais simples.** Mitigação: a proibição está na Decisão, com o resultado do teste que a motivou, e os vetores de adulteração cobrem o caminho.

## Impactos

- **Código:** `packages/crypto-web` implementa `RandomSource`, `KdfAdapter.deriveSubKey`, `AeadAdapter` e `KeyExchangeAdapter`; `packages/crypto-core/src/errors.ts` ganha `CryptoAuthenticationError`.
- **Banco:** nenhum.
- **API:** nenhum contrato muda. O envelope composto é o que `docs/API.md` já descreve.
- **Segurança:** nenhuma função que falha aberto entra no caminho de código; X25519 e HKDF passam a ser nativos.
- **Deploy:** nenhum.
- **Documentação:** `ARCHITECTURE.md` secoes 3.6, 50 e 51; `DECISIONS.md` DEC-044 e PEND-002.

## Plano de migração

Não se aplica. `packages/crypto-web` está vazio, nenhum envelope foi gerado e nenhuma chave X25519 existe.

Trocar a origem de uma primitiva no futuro não exige migração enquanto os bytes permanecerem iguais — condição verificável pelos vetores. Mudar o **formato** do envelope, ao contrário, exige nova `cryptoVersion`, leitor da anterior e recriptografia, conforme `ARCHITECTURE.md` secao 46.3.

## Referências internas

- `packages/crypto-core/src/adapters/crypto-adapters.ts` — `RandomSource`, `AeadAdapter`, `KeyExchangeAdapter` e `HKDF_INFO`.
- `packages/crypto-core/src/errors.ts` — onde entra `CryptoAuthenticationError`.
- `packages/crypto-core/src/format/aad.ts` — a AAD que acompanha cada operação de AEAD.
- `CLAUDE.md` secoes 8, 9 e 59 — modelo criptográfico, falhar fechado e checklist de dependências.
- `SECURITY.md` secoes 11, 17, 18, 19, 21 e 22 — algoritmos, nonces, AAD, envelope, falha de descriptografia e vetores.
- `ARCHITECTURE.md` secoes 3.6, 14.5, 14.7 e 14.8 — stack, par de chaves, envelope e payload.
- [ADR 0004](0004-auth-secret-domain-separation.md) — os rótulos HKDF `auth` e `user-encryption`.
- [ADR 0005](0005-shared-vault-key-envelopes.md) — `VaultKey` por cofre e envelope por membro.
- [ADR 0014](0014-js-yaml-override.md) — o mesmo portão de supply chain que motiva fixar `@noble` em `2.2.0`.
- [ADR 0016](0016-argon2id-libsodium-wasm.md) — Argon2id e a origem do `libsodium-wrappers-sumo`.
