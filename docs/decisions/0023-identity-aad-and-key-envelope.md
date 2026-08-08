# ADR 0023 — AAD de identidade e formato do envelope de chave

## Status

ACCEPTED

## Data

2026-08-08

## Contexto

A R0.2 é a primeira fase que grava ciphertext. Antes dela, dois pontos do formato criptográfico não fechavam, e os dois só são baratos de corrigir enquanto nenhum cofre existe — `SECURITY.md` secao 18 diz isso com todas as letras: "hoje ainda é barato, porque nenhum cofre existe; depois do primeiro conteúdo gravado, não é".

### A AAD não tem lugar para a identidade

A `AadContext` implementada exige `entityType` em `vault | site | credential` e `vaultId` não-vazio. Isso cobre conteúdo de cofre e mais nada.

A primeira coisa que a R0.2 vai cifrar não é conteúdo de cofre: é a **chave privada do usuário**, protegida pela `UserEncryptionKey` no `POST /setup` (`ARCHITECTURE.md` secao 14.5). Ela não pertence a cofre nenhum. Com a AAD atual só restariam dois caminhos ruins: passar uma string vazia num campo obrigatório, ou inventar um `vaultId` sentinela. Os dois deixam um campo sem significado dentro de um formato criptográfico, para sempre.

Há ainda um problema de ordem prática: o candidato natural a identificador seria o `userId`, e no `POST /setup` ele não existe ainda. O id é UUIDv7 gerado pelo Prisma (ADR 0019), do lado do servidor, enquanto a chave privada é cifrada no cliente antes do envio.

### O envelope documentado não é o envelope implementado

`docs/API.md` secao 15 declarava:

```json
{
  "keyVersion": 1,
  "cryptoVersion": 1,
  "algorithm": "X25519-XCHACHA20-POLY1305",
  "ephemeralPublicKey": "base64url",
  "nonce": "base64url",
  "encryptedVaultKey": "base64url"
}
```

O que `packages/crypto-web/src/key-exchange.ts` produz é um blob opaco `ephemeralPublicKey || ciphertext`, com o nonce **derivado** por HKDF junto da chave da AEAD e nunca transmitido. E a composição real inclui o HKDF, que o nome do algoritmo omitia.

Nada reconciliava os dois. Não existe em `crypto-core` um `parseKeyEnvelope` equivalente ao `parseCipherPayload`, então cada chamador futuro fatiaria o blob por conta própria — que foi exatamente como a divergência apareceu.

## Decisão

### 1. A AAD ganha escopo, e o prefixo de domínio vira `crypta-aad/v2`

`AadContext` passa a ser união discriminada por `scope`, e o escopo é o primeiro segmento serializado:

```text
crypta-aad/v2|5:vault|10:credential|36:<entityId>|36:<vaultId>|1:1|1:1
crypta-aad/v2|4:user|15:user-key-bundle|43:<publicKey>|1:1|1:1
```

Os dois escopos produzem quantidades diferentes de segmentos, e o discriminador é o primeiro deles. Um contexto de usuário simplesmente **não carrega cofre** — não há campo vazio a preencher.

Acrescentar um campo à AAD é mudança de formato e exige nova versão do prefixo (`SECURITY.md` secao 18). Daí `v1` → `v2`, e daí também o nome deixar de ser `vault-aad`: o domínio não é mais só de cofre.

**A `v1` nunca produziu ciphertext persistido.** Não existe usuário, tabela nem migration. É por isso que esta troca custa apenas reescrever um vetor congelado, e é por isso que ela acontece agora e não depois.

O vetor de `aad.spec.ts` é regerado. O comentário do arquivo diz que alterar um vetor é defeito a investigar, e continua valendo: esta alteração é consequência de decisão registrada, e é a única razão legítima para trocá-lo.

### 2. No escopo `user`, a AAD amarra a chave pública, não um identificador

```ts
{ scope: 'user', entityType: 'user-key-bundle', publicKey, schemaVersion, cryptoVersion }
```

Resolve o problema prático — a chave pública existe no cliente no instante em que a privada é cifrada, sem depender do servidor — mas o motivo principal é outro, e é uma proteção que o `userId` não daria.

O ciphertext passa a declarar **de qual metade pública ele é a metade privada**. Um servidor malicioso que troque `publicKey` mantendo `encryptedPrivateKey` seria detectado no desbloqueio, e não depois. Sem esse vínculo, a troca é silenciosa: o usuário desbloqueia normalmente, e a chave pública falsa passa a ser a que os outros membros usam para endereçar envelopes de `VaultKey` — que iriam para a chave do atacante.

Amarrar ao `userId` não cobriria isso. A chave privada continuaria abrindo, e a `publicKey` adulterada seguiria sendo distribuída.

### 3. O envelope é documentado como implementado, não o contrário

```json
{
  "keyVersion": 1,
  "cryptoVersion": 1,
  "algorithm": "X25519-HKDF-SHA256-XCHACHA20-POLY1305",
  "ephemeralPublicKey": "base64url",
  "encryptedVaultKey": "base64url"
}
```

**`nonce` sai.** Ele é derivado do segredo compartilhado junto com a chave da AEAD. Como o par efêmero é novo a cada envelope, a chave da AEAD nunca se repete e o nonce derivado tampouco — a propriedade que `SECURITY.md` secao 17 exige já vale por construção. Transmiti-lo criaria uma segunda fonte de verdade capaz de discordar da primeira, e um receptor que confiasse no valor transmitido em vez de derivar estaria aceitando um nonce escolhido por quem enviou.

**O nome do algoritmo passa a descrever a composição real**, com o HKDF que estava faltando. `X25519-XCHACHA20-POLY1305` sugeria uma construção diferente da implementada, e `parseKeyEnvelope` recusa esse nome explicitamente — um envelope com o nome antigo é um envelope de outra coisa.

**`crypto-core` ganha `key-envelope.ts`**, com `buildKeyEnvelope`, `parseKeyEnvelope` e `sealedBytesFromEnvelope`. É o único lugar que conhece o enquadramento `ephemeralPublicKey || ciphertext`, o que impede a divergência de reaparecer em cada chamador.

### 4. `cryptoVersion` continua 1

A versão criptográfica identifica o conjunto de algoritmos, e ele não mudou. O que mudou foi o formato da AAD e o enquadramento do envelope, ambos versionados no próprio prefixo de domínio e no nome do algoritmo.

A partir daqui, `cryptoVersion: 1` significa: Argon2id, HKDF-SHA-256, XChaCha20-Poly1305, X25519, AAD `crypta-aad/v2` e envelope `X25519-HKDF-SHA256-XCHACHA20-POLY1305`. Nenhum payload com outra combinação jamais existiu.

### 5. `crypto-core` ganha a orquestração de identidade

`deriveIdentitySecrets` e `createUserKeyBundle`/`openUserKeyBundle` passam a existir em `crypto-core`, recebendo os adapters por injeção. O package continua sem primitivas e sem dependências.

Isso fecha uma lacuna real: `HKDF_INFO` era exportado e **nenhum código o importava**. Os rótulos `auth` e `user-encryption` são constantes de protocolo, e nada impedia um chamador de passar a mesma `info` nas duas derivações — o que anularia em silêncio a separação de domínio que o ADR 0004 existe para garantir. Agora existe um único lugar que os escolhe.

Os vetores de identidade ficam em `crypto-core`, e não em `crypto-web`: `@crypta/crypto-mobile` precisará dos mesmos bytes e não pode depender do package da Web.

## Alternativas consideradas

**Acrescentar `user-key-bundle` a `AAD_ENTITY_TYPES` e aceitar `vaultId` vazio.** É a mudança mínima: preservaria o prefixo `vault-aad/v1` e o vetor congelado, porque nenhuma saída existente mudaria. Rejeitada. Deixaria um campo obrigatório semanticamente vazio dentro do formato criptográfico, permanentemente, e a validação teria que virar condicional ao tipo de entidade — a mesma complexidade da união discriminada, sem a clareza. O custo de fazer certo, agora, é reescrever um vetor.

**Usar o `userId` como identificador do escopo `user`.** Rejeitada por dois motivos independentes. O id não existe quando a chave privada é cifrada, e resolvê-lo exigiria gerar o UUID no cliente — contra o ADR 0019 — ou uma segunda requisição depois do setup, com uma janela em que a conta existe sem chave protegida. E amarrar ao id não detectaria a troca de `publicKey`, que é o ataque que mais importa aqui.

**Usar o e-mail normalizado.** Rejeitada. O e-mail é alterável por `PATCH /users/me`, e uma alteração tornaria a chave privada permanentemente indecifrável — perda de dados a partir de uma operação que o produto oferece como rotineira.

**Deixar a AAD do bundle sem identificador**, só com escopo e versões. Defensável: a `UserEncryptionKey` já é única por usuário, então um bundle de outro usuário não abriria de qualquer forma. Rejeitada porque abre mão da detecção da troca de `publicKey` sem economizar nada — o campo está disponível no momento da cifragem.

**Manter `nonce` no envelope e passar a transmiti-lo.** Rejeitada. Exigiria que a implementação parasse de derivar o nonce e passasse a sorteá-lo, trocando uma garantia estrutural — chave efêmera nova a cada envelope, logo nonce nunca repetido — por uma disciplina de geração. É mais formato e menos segurança.

**Manter o nome `X25519-XCHACHA20-POLY1305` na `API.md`.** Rejeitada. É um nome que descreve outra construção. O ADR 0017 proibiu o sealed box do libsodium justamente porque ele falha aberto; deixar o nome que sugere aquela família convida a alguém a "simplificar" de volta para ela.

**Adiar a decisão para a R0.3, quando os envelopes de fato são usados.** Rejeitada. A R0.2 grava o key bundle, e o key bundle é o primeiro ciphertext. Depois dele, mudar a AAD deixa de ser reescrever um vetor e passa a ser migrar material criptográfico de conta real.

## Consequências positivas

- O material de identidade ganha AAD própria, sem campo vazio nem sentinela.
- A troca de `publicKey` por um servidor malicioso passa a ser detectada no desbloqueio, antes de qualquer envelope ser endereçado.
- Documentação e implementação do envelope voltam a descrever a mesma coisa, com um parser em `crypto-core` que impede a divergência de voltar.
- O nome do algoritmo passa a dizer o que a construção realmente faz.
- `HKDF_INFO` deixa de ser constante decorativa e passa a ser usada em um único lugar, o que torna a separação de domínio do ADR 0004 verificável.
- Os vetores de identidade ficam onde `@crypta/crypto-mobile` poderá importá-los na R0.7.
- Toda a mudança de formato acontece com custo de reescrever um vetor, porque acontece antes da primeira migration.

## Consequências negativas

- Um vetor congelado foi reescrito. O comentário do arquivo diz que isso é defeito a investigar, e agora existe uma exceção registrada — precisa continuar sendo exceção.
- A união discriminada torna `serializeAad` mais longa do que a versão de campos fixos.
- Amarrar a `publicKey` significa que trocar o par de chaves do usuário exige recifrar o bundle. Não é problema hoje, porque trocar o par já implicaria refazer todos os envelopes, mas é um acoplamento a mais.
- O envelope perde um campo que a `API.md` prometia. Qualquer leitor que já tenha escrito código contra aquela forma precisa ajustar — hoje, ninguém.
- `crypto-core` cresce de formato puro para formato mais orquestração. Continua sem dependências e sem primitivas, mas passa a ter fluxo.

## Riscos

- **`@crypta/crypto-mobile` divergir da AAD.** É o risco central e não é mitigável agora: `PEND-003` está aberta e não há implementação Android. Mitigação: o vetor `USER_KEY_BUNDLE_AAD_VECTOR` congela a string canônica em `crypto-core`, e a suíte do Android terá que reproduzi-la byte a byte antes de qualquer conta ser criada por lá.
- **Alguém "consertar" a ausência do nonce no envelope**, achando que é omissão. Mitigação: o comentário no tipo e o `parseKeyEnvelope` recusando o algoritmo antigo; e este ADR, referenciado do código.
- **Um terceiro escopo de AAD aparecer** e a decisão de não ter campo comum obrigar a rever a serialização. Aceito: é o preço de não ter campo vazio, e cada escopo novo é uma decisão consciente.
- **Vetores exercitados só na Web.** Como no ADR 0016, a compatibilidade com Android é garantida por construção e medida só na R0.7.

## Impactos

- **Código:** `format/aad.ts` reescrito; `format/key-envelope.ts` novo; `buildCipherPayload` e `AEAD_NONCE_BYTES` em `format/crypto-payload.ts`; `identity/derive-identity.ts` e `identity/user-key-bundle.ts` novos; `vectors/identity.ts` novo; suíte de identidade em `@crypta/crypto-web`.
- **Banco:** nenhum. As colunas do `UserKeyBundle` entram na migration de identidade (BLG-0502) já neste formato.
- **API:** `docs/API.md` secao 15 muda de forma e de nome de algoritmo; a secao 20 passa a referenciar o bundle validado por `parseUserKeyBundle`.
- **Segurança:** `SECURITY.md` secoes 18, 19 e 22.
- **Deploy:** nenhum.
- **Documentação:** `ARCHITECTURE.md` secoes 14.7, 14.9 e 14.10; `DECISIONS.md` DEC-050; `BACKLOG.md` secao 7.

## Plano de migração

Não se aplica, e essa é a razão de o ADR existir agora e não depois.

Não existe conta, cofre, envelope nem migration. `vault-aad/v1` nunca cifrou nada que tenha sido persistido, e a forma antiga do envelope nunca foi produzida por implementação alguma — ela só existia no documento.

Depois da primeira conta, a mesma mudança exigiria: nova versão do prefixo convivendo com a anterior, leitor das duas, recifragem de todo material sob a chave do usuário — que só o próprio usuário consegue fazer, com a senha em mãos — e uma janela em que os dois formatos coexistem no banco.

## Referências internas

- [ADR 0003](0003-client-side-encryption.md) — criptografia no cliente e payload versionado.
- [ADR 0004](0004-auth-secret-domain-separation.md) — a separação de domínio que `HKDF_INFO` passa a tornar verificável.
- [ADR 0005](0005-shared-vault-key-envelopes.md) — `VaultKey` por cofre e envelope por membro, que este formato enquadra.
- [ADR 0017](0017-web-crypto-primitives.md) — o sealed box proibido e a composição que substituiu, cujo nome esta decisão corrige.
- [ADR 0018](0018-argon2id-parameters.md) — os parâmetros que o vetor de identidade usa.
- [ADR 0019](0019-database-identifiers.md) — o `userId` gerado pelo servidor, que é por que a AAD do bundle não o usa.
- [ADR 0022](0022-server-side-credentials.md) — o `AuthSecret` de 32 bytes que `deriveIdentitySecrets` produz.
- `SECURITY.md` secoes 15, 17, 18, 19 e 22 — chave privada, nonces, AAD, envelope e vetores.
- `docs/API.md` secoes 14, 15 e 20 — payload, envelope e setup.
- `docs/ARCHITECTURE.md` secoes 14.5, 14.7, 14.9 e 14.10.
- `CLAUDE.md` secoes 9, 54 e 81 — regras criptográficas, testes de crypto e checklist de mudança de formato.
- `docs/DECISIONS.md` DEC-050.
