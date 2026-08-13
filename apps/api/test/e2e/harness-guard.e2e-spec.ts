import { resetDatabase, TABLES } from '../support/database';
import { createTestApp, type TestContext } from '../support/test-app';

/**
 * Guard do próprio harness.
 *
 * As demais specs provam coisas sobre a aplicação. Esta prova uma coisa sobre a
 * suíte: que a lista de tabelas que ela limpa entre specs corresponde ao schema
 * que existe no banco.
 *
 * O defeito que ele existe para pegar não falha onde é causado. Uma migration
 * que acrescenta tabela sem que `TABLES` acompanhe deixa a suíte **verde**: a
 * limpeza continua funcionando para as tabelas que conhece, e a tabela nova
 * simplesmente acumula linhas de uma spec para a outra. A falha aparece depois,
 * em um teste que ninguém tocou, e o rastro leva ao teste — não à migration.
 *
 * As mensagens de erro são montadas à mão porque o `toEqual([])` sozinho diria
 * apenas que um array não está vazio. Quem lê a falha precisa saber qual tabela
 * faltou e onde corrigir, sem abrir o guard para descobrir.
 *
 * `_prisma_migrations` fica de fora nos dois sentidos, e é a única exceção:
 * `resetDatabase` nunca a limpa de propósito, porque apagá-la faria a consulta
 * de readiness reportar que nenhuma migration rodou — verdade sobre a tabela e
 * mentira sobre o schema.
 */

/** Tabela de controle do Prisma. Existe no banco e nunca entra em `TABLES`. */
const MIGRATIONS_TABLE = '_prisma_migrations';

type TableRow = { name: string };
type CountRow = { total: bigint };

describe('guard do harness de testes', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await createTestApp();
  });

  afterAll(async () => {
    await context.close();
  });

  /**
   * Tabelas base do schema da conexão corrente.
   *
   * `TABLE_TYPE = 'BASE TABLE'` exclui views, que não têm linha para apagar.
   * `DATABASE()` resolve o schema da própria conexão, então o guard acompanha o
   * `TEST_DATABASE_URL` em vez de depender de um nome fixado aqui.
   */
  async function listSchemaTables(): Promise<string[]> {
    const rows = await context.prisma.$queryRaw<TableRow[]>`
      SELECT TABLE_NAME AS name
      FROM information_schema.tables
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_TYPE = 'BASE TABLE'
    `;

    return rows.map((row) => row.name).filter((name) => name !== MIGRATIONS_TABLE);
  }

  it('limpa toda tabela que existe no schema', async () => {
    const schemaTables = await listSchemaTables();
    const cleaned: readonly string[] = TABLES;

    const missing = schemaTables.filter((table) => !cleaned.includes(table)).sort();

    if (missing.length > 0) {
      throw new Error(
        `Tabelas no schema e ausentes de TABLES, em apps/api/test/support/database.ts: ` +
          `${missing.join(', ')}.\n` +
          `Sem elas a limpeza entre specs deixa estado para trás, e a falha aparece ` +
          `depois, em uma spec que não mudou. Acrescente cada uma na posição topológica ` +
          `certa — filha antes da tabela que ela referencia —, conferindo as @relation ` +
          `do schema.`,
      );
    }

    expect(missing).toEqual([]);
  });

  it('não lista tabela que o schema não tem', async () => {
    const schemaTables = await listSchemaTables();

    const stale = TABLES.filter((table) => !schemaTables.includes(table)).sort();

    if (stale.length > 0) {
      throw new Error(
        `Tabelas em TABLES e ausentes do schema: ${stale.join(', ')}.\n` +
          `Um DELETE contra tabela inexistente derruba a limpeza inteira, porque o lote ` +
          `roda em uma transação. Remova a linha, ou confirme que a migration ` +
          `correspondente foi aplicada neste banco.`,
      );
    }

    expect(stale).toEqual([]);
  });

  it('mantém `_prisma_migrations` fora da limpeza', () => {
    const cleaned: readonly string[] = TABLES;

    expect(cleaned).not.toContain(MIGRATIONS_TABLE);
  });

  it('esvazia de fato as tabelas que declara', async () => {
    // Prova que a lista não é só uma declaração: a limpeza roda e o banco fica
    // vazio. Sem isto, o guard aprovaria uma `TABLES` correta ligada a um
    // `resetDatabase` quebrado — a lista certa não garante a limpeza certa.
    await resetDatabase(context.prisma);

    const schemaTables = await listSchemaTables();

    // Os nomes vêm de `information_schema`, nunca de entrada. `$queryRawUnsafe`
    // é necessário porque identificador de tabela não é parametrizável — mesma
    // razão de `resetDatabase`.
    const counts = await Promise.all(
      schemaTables.map(async (table) => {
        const rows = await context.prisma.$queryRawUnsafe<CountRow[]>(
          `SELECT COUNT(*) AS total FROM \`${table}\``,
        );

        return { table, rows: Number(rows[0]?.total ?? 0) };
      }),
    );

    const remaining = counts.filter((entry) => entry.rows > 0);

    if (remaining.length > 0) {
      const detail = remaining.map((entry) => `${entry.table} (${String(entry.rows)})`).join(', ');

      throw new Error(
        `resetDatabase rodou e estas tabelas continuam com linhas: ${detail}.\n` +
          `A lista pode estar certa e a limpeza errada — confira a ordem de TABLES e ` +
          `se o $transaction está cobrindo todos os DELETE.`,
      );
    }

    expect(remaining).toEqual([]);
  });
});
