# ADR 0020 — Exclusão física do conteúdo e auditoria preservada

## Status

ACCEPTED

## Data

2026-08-07

## Contexto

`PEND-014` bloqueava o schema junto com os identificadores: a política de exclusão define quais colunas cada tabela tem e qual o comportamento de toda chave estrangeira.

`DATABASE.md` secao 7 já fixa duas restrições, independentes do que fosse decidido:

1. segredo excluído não pode continuar acessível pela aplicação — um cofre ou credencial marcado como excluído não pode seguir retornando `encryptedPayload` por rota nenhuma;
2. auditoria não é apagada junto com a entidade — o registro de que algo foi excluído precisa sobreviver à exclusão.

E acrescenta que `ON DELETE CASCADE` não é aplicado indiscriminadamente: cada relação tem comportamento decidido individualmente.

Essas duas restrições estão em tensão direta. A primeira empurra para exclusão física; a segunda exige que algo permaneça. Soft delete resolve a segunda de graça, mas transforma a primeira em disciplina: basta um `findMany` sem o filtro de exclusão para devolver um segredo que o usuário mandou apagar. Em um cofre, essa é a falha que não pode acontecer.

Há ainda a restrição do ADR 0005: remover um membro obriga rotação da `VaultKey`, porque revogar acesso no banco não desfaz o que a pessoa já copiou. O mesmo raciocínio se aplica à exclusão — apagar a linha é o que torna o dado inacessível a partir de um dump futuro.

## Decisão

**Conteúdo do cofre é excluído fisicamente.** `Vault`, `Site`, `Credential` e `VaultKeyEnvelope` são removidos com `DELETE`. Nenhuma coluna `deleted_at`, nenhum filtro de exclusão em consulta.

**Auditoria é uma tabela independente**, sem chave estrangeira para as entidades que ela descreve. `AuditLog` guarda os identificadores como valores, não como referências:

```text
actor_id      quem executou
entity_type   'vault' | 'site' | 'credential' | ...
entity_id     o UUID da entidade, sem FK
action        o que aconteceu
occurred_at   quando
```

Sem FK, apagar a entidade não tem como apagar nem invalidar o registro de auditoria. É o que satisfaz a segunda restrição sem reintroduzir a primeira.

**Comportamento de cada relação**, declarado explicitamente:

| Relação                      | Ao excluir o pai | Motivo                                             |
| ---------------------------- | ---------------- | -------------------------------------------------- |
| `Vault` → `Site`             | `Cascade`        | site não existe fora do cofre                      |
| `Site` → `Credential`        | `Cascade`        | credencial não existe fora do site                 |
| `Vault` → `VaultKeyEnvelope` | `Cascade`        | envelope sem cofre não abre nada                   |
| `Vault` → `VaultMember`      | `Cascade`        | associação sem cofre não concede nada              |
| `Vault` → `Invitation`       | `Cascade`        | convite para cofre inexistente não pode ser aceito |
| `User` → `Session`           | `Cascade`        | sessão sem usuário não autentica                   |
| `User` → `UserKeyBundle`     | `Cascade`        | relação 1:1; o bundle é parte da identidade        |
| `User` → `VaultMember`       | `Restrict`       | ver abaixo                                         |
| `User` → `AuditLog`          | sem FK           | auditoria sobrevive ao usuário                     |

**`User` → `VaultMember` é `Restrict`, não `Cascade`.** Excluir um usuário que ainda é `OWNER` de um cofre compartilhado apagaria a associação em silêncio e deixaria o cofre sem dono, com os demais membros sem quem faça rekey. A exclusão precisa falhar e obrigar a transferir ou apagar o cofre primeiro. Transferência de propriedade está fora do escopo da V1 (`CLAUDE.md` secao 11), então na prática o usuário precisa excluir os cofres antes — o que é comportamento aceitável e explícito, em vez de um cofre órfão.

**Sessões e convites são removidos, não marcados.** Revogar sessão apaga a linha; a auditoria registra a revogação. Vale o mesmo para convite expirado ou recusado.

## Alternativas consideradas

**Soft delete em todas as entidades.** É o padrão mais comum e o mais fácil de auditar, porque o histórico fica na própria tabela. Rejeitada. Converte a restrição 1 de `DATABASE.md` secao 7 — invariante estrutural — em disciplina de consulta: cada `findMany`, cada join, cada relatório futuro precisa lembrar do filtro, e um esquecimento devolve segredo que o usuário mandou apagar. Além disso, um dump do banco continuaria contendo o `encryptedPayload` de tudo que já foi excluído, o que contraria o raciocínio de revogação efetiva do ADR 0005.

**Soft delete só no `Vault`, hard delete abaixo.** Rejeitada. Preserva o pior dos dois: o cofre continua no banco com seu conteúdo, e ainda cria a assimetria de um cofre excluído cujos sites já sumiram.

**`AuditLog` com FK para `User` e `ON DELETE SET NULL`.** Rejeitada. Manteria a integridade referencial enquanto o usuário existe, mas anular o `actor_id` destrói justamente a informação que a auditoria existe para guardar. Guardar o identificador como valor preserva o registro completo.

**Lixeira com retenção por prazo.** É funcionalidade de produto, não política de banco, e está fora do escopo (`CLAUDE.md` secao 11). Se algum dia entrar, será com ADR próprio e provavelmente como conteúdo recriptografado em outra tabela, não como flag na tabela original.

## Consequências positivas

- Segredo excluído deixa de existir no banco, então nenhum caminho de consulta — nem um futuro — pode devolvê-lo.
- A restrição 1 de `DATABASE.md` secao 7 passa a ser garantida pela estrutura, não por disciplina.
- Um dump obtido depois da exclusão não contém o conteúdo excluído.
- As tabelas não carregam linhas mortas, e nenhum índice precisa de coluna de exclusão.
- A auditoria fica desacoplada, o que também a torna simples de reter por prazo diferente (`PEND-015`).

## Consequências negativas

- Exclusão é irreversível. Sem lixeira, um clique errado apaga de verdade, e a interface precisa confirmar de forma inequívoca.
- Auditoria sem FK pode referenciar entidade que não existe mais, o que é intencional mas exige cuidado em qualquer relatório que tente juntar as duas.
- `Restrict` em `User` → `VaultMember` torna a exclusão de conta um fluxo com passo anterior, em vez de uma operação única.
- `Cascade` no banco significa que um `DELETE` errado propaga longe; a autorização precisa ser verificada antes, e a exclusão precisa ser transacional.

## Riscos

- **Exclusão acidental sem recuperação.** É o risco principal e é consequência direta da decisão. Mitigação: confirmação explícita na interface, autorização verificada por policy, e backup do banco conforme `DATABASE.md` secao 9 — que é recuperação operacional, não funcionalidade do produto.
- **Cascade removendo mais do que se esperava.** Mitigação: cada relação está declarada nesta tabela e nenhuma outra recebe `Cascade` sem passar por ADR; `CLAUDE.md` secao 80 exige revisar delete behavior ao criar tabela.
- **Auditoria crescendo sem limite**, agora que não é apagada com a entidade. Fica explicitamente sob `PEND-015`, retenção de auditoria, que este ADR não resolve.
- **Conta que não consegue ser excluída** por ser `OWNER` de cofre compartilhado. É deliberado, mas precisa de mensagem de erro que diga o que fazer, não um `500`.

## Impactos

- **Código:** services de exclusão em transação; policies verificando propriedade antes.
- **Banco:** define `onDelete` de toda FK e a ausência de coluna de exclusão; `AuditLog` sem FK.
- **API:** rotas de exclusão respondem de forma definitiva; erro específico para conta que ainda é proprietária.
- **Segurança:** torna a exclusão efetiva contra dump posterior, alinhado ao ADR 0005.
- **Deploy:** nenhum.
- **Documentação:** `DATABASE.md` secao 7; `DECISIONS.md` DEC-047 e PEND-014.

## Plano de migração

Não se aplica. Não existe tabela nem dado.

Adotar soft delete depois seria mudança estrutural: exigiria coluna nova, revisão de toda consulta e uma decisão nova sobre o que fazer com o que já foi apagado. Este ADR seria substituído, não editado.

## Referências internas

- `docs/DATABASE.md` secoes 6, 7, 9 e 10 — modelo previsto, exclusões, backups e checklist.
- `CLAUDE.md` secoes 37, 45 e 80 — transações, exclusões e checklist de nova tabela.
- `SECURITY.md` — auditoria e retenção.
- [ADR 0005](0005-shared-vault-key-envelopes.md) — rotação ao remover membro, mesmo raciocínio de revogação efetiva.
- [ADR 0008](0008-mysql-prisma.md) — MySQL com Prisma.
- [ADR 0019](0019-database-identifiers.md) — o tipo das chaves que estas FKs usam.
