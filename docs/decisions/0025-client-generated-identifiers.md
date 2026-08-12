# ADR 0025 — Identificador gerado no cliente para entidades cifradas

## Status

ACCEPTED

## Data

2026-08-11

## Contexto

O [ADR 0019](0019-database-identifiers.md) fixou UUIDv7 em `CHAR(36)`, **gerado pelo Prisma**. O [ADR 0023](0023-identity-aad-and-key-envelope.md) fixou a AAD do escopo `vault` com seis segmentos, dois deles obrigatoriamente não-vazios:

```text
crypta-aad/v2|5:vault|5:vault|36:<entityId>|36:<vaultId>|1:1|1:1
```

Para a metadata do próprio cofre, `entityId` e `vaultId` são o mesmo valor: o id do cofre.

`ARCHITECTURE.md` secao 19 descreve a criação assim, e a ordem importa:

```text
cliente gera VaultKey
cliente cifra nome e descrição      <- precisa da AAD, que precisa do id
cliente cria o envelope
POST /vaults                        <- só aqui o servidor gera o id
```

**O cliente precisa do id para cifrar e só recebe o id depois de gravar.** Nenhum documento resolve isso. A `API.md` secao 34 não tem campo de id no request, e a secao 19 da `ARCHITECTURE.md` desenha o fluxo sem notar que ele não fecha.

O projeto já enfrentou o mesmo impasse uma vez. A secao 14.9 da `ARCHITECTURE.md` registra, sobre o escopo `user`, que o id "ainda não existe quando o cliente cifra", e resolveu amarrando a AAD à chave pública do par. O escopo `vault` nunca ganhou resposta equivalente — a lacuna só apareceu ao começar o `BLG-0706`, porque até a R0.2 nada de cofre havia sido cifrado.

### Por que não serve amarrar a outra coisa

A AAD da metadata existe para impedir que o ciphertext de um cofre seja aceito no lugar do de outro. Um servidor malicioso que troque a metadata do cofre A pela do cofre B faz o usuário ver o nome errado — e, num produto onde o cofre certo decide com quem a credencial é compartilhada, guardar uma senha no cofre errado é o dano.

Isso descarta amarrar a um valor opaco qualquer gravado ao lado do ciphertext. Se o vínculo for uma coluna que o servidor controla, ele troca as duas coisas juntas e a AAD confere. **O vínculo precisa ser algo que o cliente conheça por fora da resposta**, e a única coisa nessa condição é o identificador que ele usou para pedir aquele cofre.

## Decisão

**O cliente gera o identificador das entidades cujo conteúdo ele cifra.**

Na R0.3 isso é o cofre. Na R0.4 passa a valer para site e credencial, que têm exatamente o mesmo impasse — `entityId` da AAD é o id deles, e o payload é cifrado antes do `POST`.

```text
POST /vaults
{
  "id": "0198e4c1-....-7abc",     <- UUIDv7 gerado no cliente
  "encryptedMetadata": { ... },   <- AAD amarrada a esse id
  "ownerEnvelope": { ... }
}
```

### Regras

1. **O formato continua UUIDv7 em `CHAR(36)`.** O ADR 0019 não muda de formato; muda de origem, e só para estas entidades.
2. **Os bytes aleatórios vêm do CSPRNG da plataforma**, pelo `RandomSource` que os adapters já expõem. `Math.random()` continua proibido (`CLAUDE.md` secao 9).
3. **A API valida e não corrige.** Um id ausente, malformado ou de outra versão é `400`. A API nunca gera um id no lugar do cliente para estas tabelas — um id que o cliente não escolheu produz metadata que ninguém consegue abrir.
4. **A coluna não tem `@default`.** É a mesma regra dita no schema: sem default, um `INSERT` sem id falha alto, em vez de gravar um cofre ilegível.
5. **Colisão é `409 IDENTIFIER_CONFLICT`.** O id é chave primária; o cliente refaz a operação com outro. O código segue o padrão dos demais `409` da API — `VERSION_CONFLICT` e `IDEMPOTENCY_CONFLICT`.
6. **As demais tabelas continuam com id gerado pelo Prisma.** `users`, `sessions`, `user_key_bundles`, `audit_logs` e `idempotency_records` não têm conteúdo cifrado pelo cliente e não ganham nada com a troca.

## Alternativas consideradas

```text
criar o cofre e cifrar a metadata num segundo passo
reservar o id num endpoint próprio antes de criar
mudar o formato da AAD do escopo vault
manter o id do servidor e amarrar a AAD a uma coluna opaca
```

**Criar e depois cifrar.** `POST /vaults` grava sem metadata e devolve o id; o cliente cifra e manda um `PATCH`. Preserva o ADR 0019 intacto, e foi a alternativa mais séria. Rejeitada por três motivos que se somam: são duas idas para uma operação que o usuário percebe como uma; existe um intervalo em que o cofre está no banco sem nome; e uma falha entre os dois passos deixa esse estado gravado, exigindo que toda leitura saiba lidar com "cofre sem metadata" — um estado inválido que passaria a ser representável para sempre, em troca de nada.

**Reservar o id antes.** Um `POST /vaults/reservations` devolveria ids para o cliente usar. Mesma quantidade de idas da alternativa anterior, mais uma tabela de reservas, mais expiração de reserva não usada. Complexidade maior para o mesmo resultado.

**Mudar a AAD.** Ainda seria barato: nenhum cofre existe, e `SECURITY.md` secao 18 diz que essa janela está aberta até o primeiro conteúdo gravado. Rejeitada por não haver candidato — o vínculo precisa ser conhecido pelo cliente antes de cifrar e não pode ser reescrito pelo servidor junto com o ciphertext, e nada além do id satisfaz as duas.

**Coluna opaca.** É a alternativa que parece funcionar e não funciona: o servidor troca a coluna junto com o ciphertext e a AAD confere. Está registrada aqui porque é a saída intuitiva, e alguém vai propô-la de novo.

## Consequências

- a criação do cofre volta a ser uma requisição só, com a AAD funcionando como o ADR 0023 a projetou;
- o mesmo caminho serve site e credencial na R0.4, sem decisão nova;
- o ADR 0019 passa a ter exceção declarada, e a `DATABASE.md` precisa dizer, por tabela, quem gera o id;
- a API ganha validação de UUIDv7 nas rotas que criam entidade cifrada;
- o cliente ganha um gerador de UUIDv7 em `@crypta/crypto-core`, compartilhado com o Android;
- um cliente defeituoso pode repetir um id e receber `409` em vez de criar o cofre;
- `POST /vaults` passa a ter um modo de falha que não existia: id inválido ou repetido, antes de qualquer verificação de conteúdo.

## Riscos

- **Oráculo de existência pelo `409`.** Um id já usado responde diferente de um id livre, então a rota diz se aquele identificador existe **em algum lugar do sistema**. O espaço é de 2¹²² e a autorização continua por membership, então saber que um id existe não dá acesso a nada; e a v7 embute o milissegundo de criação, o que reduz o espaço de busca de um cofre criado num instante conhecido para cerca de 2⁷⁴ — ainda inatingível. Assumido e registrado, não descartado: é o mesmo tipo de vazamento que o achado 3 do `BLG-0707` encontrou em `GET /auth/parameters`, e o que muda aqui é que o ganho do atacante é nulo.
- **Id escolhido por cliente malicioso**, com timestamp mentiroso ou não aleatório. A v7 não é usada como prova de nada — nem ordenação, nem autorização, nem unicidade além da chave primária. Um id torto só prejudica quem o escolheu.
- **Cliente antigo sem o campo.** Não existe cliente publicado. A rota nasce exigindo o campo.

## Impactos

- **Código:** `@crypta/crypto-core` ganha `createEntityId`; a Web passa a gerá-lo antes de cifrar; a API valida.
- **Banco:** `vaults.id` sem `@default`. As tabelas da R0.4 seguirão a mesma regra.
- **API:** `docs/API.md` secao 34 passa a receber `id`. Id malformado é `VALIDATION_ERROR`, como qualquer outro campo; id repetido é `IDENTIFIER_CONFLICT`.
- **Segurança:** o vínculo criptográfico entre metadata e cofre passa a existir de fato; sem esta decisão ele não existiria.
- **Deploy:** nenhum.
- **Documentação:** `docs/DATABASE.md` secao 5, `docs/API.md` secoes 34 e 10, `docs/ARCHITECTURE.md` secao 19, `DECISIONS.md` DEC-052.

## Plano de migração

Não se aplica. Nenhum cofre existe em nenhum ambiente, e a tabela entra com a migration do `BLG-0503`.

## Referências internas

- [ADR 0019](0019-database-identifiers.md) — UUIDv7 em `CHAR(36)`, cuja origem este ADR excetua.
- [ADR 0023](0023-identity-aad-and-key-envelope.md) — a AAD de dois escopos, e o precedente do escopo `user` para o mesmo impasse.
- [ADR 0003](0003-client-side-encryption.md) — o conteúdo é cifrado no cliente, que é a razão de o id precisar existir antes do `POST`.
- `docs/ARCHITECTURE.md` secoes 14.9 e 19 — a AAD e o fluxo de criação de cofre.
- `SECURITY.md` secao 18 — a janela em que trocar formato criptográfico ainda é barato.
- `CLAUDE.md` secao 9 — CSPRNG obrigatório.
- `docs/DECISIONS.md` DEC-052.
