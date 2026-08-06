# ADR 0008 — MySQL com Prisma

## Status

ACCEPTED

## Data

2026-08-05

## Contexto

O domínio é claramente relacional: usuários pertencem a cofres através de memberships, cofres contêm sites, sites contêm credenciais, convites referenciam cofres e usuários. As operações críticas exigem transação e integridade referencial.

O volume previsto é pequeno — dois usuários, poucos cofres, milhares de credenciais no máximo — e o sistema roda em uma VPS única gerenciada pelo Coolify.

O conteúdo armazenado é opaco: blobs criptografados. O banco nunca precisa consultar, indexar ou filtrar por conteúdo sensível.

## Decisão

MySQL 8 com InnoDB, `utf8mb4` e timestamps em UTC. Prisma como ORM e como ferramenta de migrations.

Regras fixas:

- todo acesso ao Prisma fica em `repositories/`; uma regra de lint impede instanciar `PrismaClient` fora de `database/prisma`;
- `select` explícito, evitando `include` amplo;
- migrations versionadas; `prisma migrate deploy` nos ambientes, nunca `db push` em produção;
- o banco não tem porta pública e só aceita conexão do backend na rede interna do projeto;
- testes de integração rodam contra MySQL real — SQLite não é substituto aceitável, porque o comportamento de constraints e de tipos difere;
- nenhuma coluna em texto aberto para nome de cofre, descrição, nome de site, link, usuário da credencial, senha, observação, `VaultKey` ou chave privada.

Na R0 o `schema.prisma` contém apenas datasource e generator, sem models. As entidades entram na R0.2 e R0.3, depois de fechadas as pendências que definem o tipo das chaves primárias.

## Alternativas consideradas

**PostgreSQL.** Tecnicamente adequado e com melhor suporte a índices parciais e tipos. Rejeitada por preferência e familiaridade do responsável pelo projeto, que é quem vai operar a VPS. Em um sistema self-hosted mantido por uma pessoa, familiaridade operacional vale mais do que recursos que este domínio não usa.

**SQLite.** Rejeitada. Simplificaria a operação, mas dificulta backup consistente sob escrita, acesso concorrente e o modelo de recursos separados do Coolify.

**ORM alternativo (TypeORM, Drizzle, Knex).** Prisma foi escolhido pelo schema declarativo, migrations versionadas de primeira classe e tipagem gerada — que, num projeto com TypeScript estrito, elimina uma classe inteira de erro.

**Sem ORM, SQL direto.** Rejeitada. Aumentaria a superfície para erro de escaping e tornaria as migrations um processo manual.

## Consequências positivas

- Integridade referencial e transações reais nas operações críticas.
- Tipos gerados a partir do schema, alinhados com o TypeScript estrito.
- Migrations versionadas, revisáveis em pull request e aplicáveis com um comando em cada ambiente.
- Ferramental de backup e restauração maduro.

## Consequências negativas

- Testes de integração exigem uma instância real de MySQL, também na CI.
- O client do Prisma é gerado dentro de `node_modules`, o que obriga regerar depois de montar a árvore de produção na imagem Docker.
- Constraints únicas parciais exigem tratamento específico no MySQL.
- O CLI do Prisma é dependência de produção, porque `prisma migrate deploy` roda no artefato implantado.

## Riscos

- **Migration destrutiva.** Exige backup prévio, revisão e rollback documentado. Nenhuma migration destrutiva sem autorização explícita.
- **Divergência entre schema e `DATABASE.md`.** Mitigada pela regra de atualizar o documento no mesmo pull request.
- **Client do Prisma ausente no artefato final.** Endereçado no `Dockerfile`, que roda `prisma generate` depois do `pnpm deploy`.
- **Escolha de identificadores ainda aberta** (`PEND-005`, `PEND-006`): precisa ser fechada antes da primeira migration, porque mudar depois é destrutivo.

## Impactos

- **Código:** `apps/api/src/database/prisma`.
- **Banco:** todo o `DATABASE.md`.
- **Deploy:** recurso MySQL próprio por ambiente no Coolify, sem porta pública.
- **CI:** job de integração com serviço MySQL, a partir da R0.2.

## Plano de migração

Não se aplica. A primeira migration real será criada na R0.2, depois de fechar `PEND-005`, `PEND-006` e `PEND-014`.

## Referências internas

- `docs/ARCHITECTURE.md` secoes 3.5 e 32
- `docs/DECISIONS.md` DEC-008, DEC-030, PEND-005, PEND-006, PEND-014
- `CLAUDE.md` secoes 41 a 45
