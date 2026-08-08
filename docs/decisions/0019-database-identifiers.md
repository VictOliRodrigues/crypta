# ADR 0019 — Identificadores UUIDv7 em `CHAR(36)`

## Status

ACCEPTED

## Data

2026-08-07

## Contexto

`apps/api/prisma/schema.prisma` não tem nenhum model, e o comentário no topo do arquivo diz o motivo: `PEND-005` e `PEND-006` decidem o tipo de toda chave primária e estrangeira do sistema. Criar tabela antes disso significaria migration destrutiva logo em seguida.

`DATABASE.md` secao 5 já fixa que todo ID público é UUID, para não facilitar enumeração nem inferência de volume, e registra que a autorização é verificada em toda consulta independentemente do formato. O que faltava era a versão do UUID e o tipo da coluna.

`DEC-030` propunha `CHAR(36)` com os motivos "simplicidade, debug, Prisma", em `PROPOSED`, sem análise das alternativas. Este ADR resolve a proposta.

**O que foi verificado, com o Prisma 6.19.3 do próprio repositório:**

| Verificação                                  | Resultado             |
| -------------------------------------------- | --------------------- |
| `String @id @default(uuid(7)) @db.Char(36)`  | schema válido         |
| `Bytes @id @db.Binary(16)`                   | schema válido         |
| `Bytes @id @default(uuid(7)) @db.Binary(16)` | **erro de validação** |
| Tipo do `id` no client gerado, `CHAR(36)`    | `string`              |
| Tipo do `id` no client gerado, `BINARY(16)`  | `Bytes`               |

Ou seja: o Prisma gera UUIDv7 nativamente para `CHAR(36)` e **não gera nada** para `BINARY(16)` — com coluna binária, toda inserção do sistema precisa produzir o ID em código de aplicação.

**O que não foi possível medir.** Tentei quantificar a localidade de índice em MySQL 8.4 real, com 200.000 linhas por variante em containers isolados. A primeira bateria deu resultados que contradiziam o InnoDB documentado; isolando por container, `CHAR(36)` com v7 ficou mais rápido e menor que com v4, na direção esperada. Mas ao repetir, a mesma carga variou de 22 s para 43 s e de 12,55 MB para 16,55 MB. Esta máquina tem outros containers ativos, e a contenção de I/O torna a medição não reproduzível. **Nenhum número de desempenho meu entra nesta decisão.** O argumento de localidade abaixo se apoia no comportamento documentado do InnoDB para inserção em ordem crescente de chave primária, não em medição própria.

## Decisão

Todo identificador do sistema é **UUIDv7 armazenado em `CHAR(36)`**, na forma canônica com hifens, gerado pelo Prisma com `@default(uuid(7))`.

```prisma
id String @id @default(uuid(7)) @db.Char(36)
```

Chaves estrangeiras usam o mesmo tipo, nomeadas `<entidade>_id` conforme `DATABASE.md` secao 5.

**UUIDv7 e não v4** porque os 48 bits mais significativos são o timestamp em milissegundos, o que torna os IDs crescentes no tempo. Em InnoDB a chave primária é o índice clusterizado: inserir em ordem crescente preenche as páginas sequencialmente, enquanto uma chave aleatória insere em pontos arbitrários e provoca divisão de página. Além disso, a chave primária é replicada em todo índice secundário, então o efeito se multiplica.

**`CHAR(36)` e não `BINARY(16)`** porque a economia de espaço não paga o custo que a coluna binária impõe a todas as fronteiras do sistema. Com `BINARY(16)`, o `id` vira `Bytes` no client do Prisma e, a partir daí, em todo DTO, contrato, parâmetro de rota e linha de log — cada um exigindo conversão explícita, cada conversão sendo um lugar onde errar. E, como o Prisma não gera valor para coluna binária, o sistema passaria a depender de código de aplicação para produzir cada ID.

`CLAUDE.md` secao 43.2 coloca "segurança antes de micro-otimização", e o produto é um cofre self-hosted em VPS única, com volume de dados de uma pessoa ou de uma família. Trocar clareza por bytes nessa escala é a troca errada.

## Alternativas consideradas

**UUIDv4 em `CHAR(36)`.** Rejeitada. É a opção do `DEC-030` mantendo aleatoriedade total, e não tem vantagem sobre a v7: o Prisma gera as duas, o tipo é o mesmo, e a v4 abre mão da localidade de índice sem ganhar nada além de não revelar o horário de criação — ver Riscos.

**UUIDv7 em `BINARY(16)`.** A opção tecnicamente mais compacta, e a única em que a economia é relevante, já que o ID é replicado em cada índice secundário. Rejeitada pelo custo de fronteira descrito acima, agravado pela ausência de `@default`. Continua sendo a escolha certa se o volume um dia justificar — e a migração é mecânica, porque `UUID_TO_BIN`/`BIN_TO_UUID` do MySQL convertem nos dois sentidos sem perda.

**Chave primária sequencial interna com UUID público separado.** Daria a melhor localidade possível e IDs públicos opacos. Rejeitada por dobrar a chave de toda tabela e todo join, complicando exatamente o modelo de autorização que `DATABASE.md` secao 5 quer manter simples. Reconsiderável com ADR próprio se o volume mudar.

**ULID ou outro identificador ordenável não-UUID.** Rejeitada. `DATABASE.md` secao 5 fixa UUID, o Prisma não gera ULID nativamente, e a diferença prática em relação à v7 é de codificação, não de propriedade.

## Consequências positivas

- Inserção em ordem crescente na chave clusterizada, que é o padrão de acesso de praticamente toda tabela do sistema.
- O Prisma gera o ID: nenhuma inserção depende de código de aplicação lembrar de produzir a chave.
- `id` é `string` em todo o caminho — client, DTO, contrato, rota e log — sem conversão em fronteira nenhuma.
- Ordenar por `id` aproxima a ordem de criação, o que dispensa índice adicional em alguns casos de paginação.
- Migrar para `BINARY(16)` depois continua possível, com conversão sem perda no próprio MySQL.

## Consequências negativas

- `CHAR(36)` ocupa 36 bytes contra 16, e a chave primária é replicada em cada índice secundário, então o custo aparece multiplicado.
- UUIDv7 revela o instante de criação do registro, com resolução de milissegundos.
- A ordenação por `id` é apenas aproximada: dentro do mesmo milissegundo a ordem vem dos bits aleatórios.
- Fica uma decisão de espaço adiada, que precisará ser revisitada se o volume crescer muito além do previsto.

## Riscos

- **Vazamento do horário de criação.** UUIDv7 carrega o timestamp, então um ID exposto revela quando o registro nasceu. Não permite enumeração — os bits restantes continuam aleatórios — mas é metadado que a v4 não entregaria. Para um cofre, saber que um cofre foi criado em certo instante é informação de baixo valor perto do conteúdo, que é criptografado no cliente. Registrado por ser uma perda real, ainda que pequena.
- **Crescimento inesperado do volume.** Se o produto sair da escala de VPS única, `CHAR(36)` vira custo relevante. Mitigação: a conversão para `BINARY(16)` é mecânica e reversível, e este ADR registra o gatilho.
- **Dependência de `@default(uuid(7))` do Prisma.** Se uma versão futura mudar o comportamento, todo ID novo muda de forma. Mitigação: o formato canônico do UUID é normativo, e uma mudança dessas apareceria imediatamente em teste de integração.

## Impactos

- **Código:** `schema.prisma` ganha os primeiros models; nenhum código gera ID manualmente.
- **Banco:** define o tipo de toda chave primária e estrangeira do sistema.
- **API:** IDs em `string` nos contratos, como `docs/API.md` já assume.
- **Segurança:** mantém o requisito de `DATABASE.md` secao 5 de não usar ID sequencial público; acrescenta o vazamento de horário de criação, avaliado nos Riscos.
- **Deploy:** nenhum.
- **Documentação:** `DATABASE.md` secao 5; `DECISIONS.md` DEC-046, PEND-005 e PEND-006, e `DEC-030` passa a `SUPERSEDED`.

## Plano de migração

Não se aplica. Não existe tabela, migration nem dado.

Para uma conversão futura para `BINARY(16)`: `UUID_TO_BIN(id, 1)` converte preservando a ordenação temporal — o segundo argumento troca os campos de tempo para que o binário fique crescente —, e `BIN_TO_UUID` volta. A migração exigiria alterar todas as FKs na mesma transação e teria ADR próprio.

## Referências internas

- `apps/api/prisma/schema.prisma` — o comentário que bloqueia a criação de models.
- `docs/DATABASE.md` secoes 5, 6 e 10 — convenções, modelo previsto e checklist de tabela.
- `CLAUDE.md` secoes 41, 43 e 80 — Prisma, schema e checklist de nova tabela.
- `CLAUDE.md` secao 43.2 — segurança antes de micro-otimização.
- [ADR 0008](0008-mysql-prisma.md) — MySQL com Prisma, que fixa o ORM e o banco.
- [ADR 0020](0020-deletion-policy.md) — política de exclusão, que define o comportamento das FKs declaradas com estes tipos.
