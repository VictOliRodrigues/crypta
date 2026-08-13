import { type PrismaService } from '@/database/prisma/prisma.service';

/**
 * Limpeza entre specs.
 *
 * `DELETE` em ordem filho→pai, e não `TRUNCATE`.
 *
 * `TRUNCATE` obrigaria a desligar `FOREIGN_KEY_CHECKS`, porque o MySQL o recusa
 * em qualquer tabela referenciada por uma FK — mesmo com a tabela filha vazia,
 * já que a recusa olha a constraint e não os dados. O problema é que
 * `FOREIGN_KEY_CHECKS` é variável de **sessão**, válida por conexão: o Prisma
 * distribui cada chamada pelo pool, o `SET` e os `TRUNCATE` caíam em conexões
 * diferentes e o MySQL respondia `1701` de forma intermitente. A falha crescia
 * com o número de tabelas, então aparecia em specs que não tinham mudado.
 *
 * `DELETE` respeita FK, então apagar filho antes de pai basta — é a ordem de
 * `TABLES`. Nenhuma coluna do schema é AUTO_INCREMENT (todo id é `uuid(7)` ou
 * cunhado no cliente), portanto não há contador que só `TRUNCATE` zeraria e a
 * troca não perde nada. O custo maior do `DELETE` é irrelevante em tabelas com
 * dezenas de linhas.
 *
 * O `$transaction` prende o lote inteiro a uma única conexão e torna a limpeza
 * atômica — nenhuma spec observa o banco pela metade. `DELETE` é DML e não
 * provoca commit implícito, ao contrário de `TRUNCATE`, que quebraria a
 * transação por dentro.
 *
 * `_prisma_migrations` **nunca** é limpa: apagá-la faria a próxima consulta de
 * readiness reportar que nenhuma migration rodou, o que é verdade sobre a
 * tabela e mentira sobre o schema.
 */

/**
 * Ordem topológica: toda tabela vem antes daquelas que ela referencia. Inverter
 * duas linhas quebra a limpeza com erro de FK, então acrescentar tabela aqui
 * exige olhar as `@relation` do schema.
 *
 * Exportada para que `harness-guard.e2e-spec.ts` a compare com o schema vivo.
 * Esquecer uma tabela aqui não quebra nada de imediato: a suíte continua verde
 * e passa a vazar estado entre specs, e a falha aparece depois, em um teste que
 * não mudou. O guard existe para transformar esse silêncio em erro.
 */
export const TABLES = [
  'audit_logs',
  'vault_key_envelopes',
  'vault_members',
  'vaults',
  'sessions',
  'user_key_bundles',
  'idempotency_records',
  'users',
] as const;

export async function resetDatabase(prisma: PrismaService): Promise<void> {
  // Os nomes vêm da constante acima, nunca de entrada. `$executeRawUnsafe` é
  // necessário porque identificador de tabela não é parametrizável.
  await prisma.$transaction(
    TABLES.map((table) => prisma.$executeRawUnsafe(`DELETE FROM \`${table}\``)),
  );
}

/**
 * Recusa rodar contra um banco que não seja de teste.
 *
 * O harness apaga tabelas. Um `DATABASE_URL` apontando para development por
 * engano — copiado de um `.env` real, por exemplo — destruiria dados sem aviso.
 * O nome do banco precisa terminar em `_test`.
 */
export function assertTestDatabase(databaseUrl: string): void {
  const database = new URL(databaseUrl).pathname.replace(/^\//, '');

  if (!database.endsWith('_test')) {
    throw new Error(
      `Os testes e2e apagam tabelas e recusam rodar fora de um banco de teste. ` +
        `O banco configurado é "${database}", e o nome precisa terminar em "_test".`,
    );
  }
}
