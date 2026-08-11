import { type PrismaService } from '@/database/prisma/prisma.service';

/**
 * Limpeza entre specs.
 *
 * `TRUNCATE` em vez de `DELETE` porque é o que devolve o banco ao estado de
 * banco vazio, incluindo contadores. `FOREIGN_KEY_CHECKS` desligado durante a
 * operação porque `TRUNCATE` não respeita `ON DELETE CASCADE` — ele falharia na
 * primeira tabela referenciada, e a ordem de limpeza passaria a ser
 * conhecimento implícito espalhado pelos testes.
 *
 * `_prisma_migrations` **nunca** é limpa: apagá-la faria a próxima consulta de
 * readiness reportar que nenhuma migration rodou, o que é verdade sobre a
 * tabela e mentira sobre o schema.
 */
const TABLES = [
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
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0');

  try {
    for (const table of TABLES) {
      // Os nomes vêm da constante acima, nunca de entrada. `$executeRawUnsafe`
      // é necessário porque identificador de tabela não é parametrizável.
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${table}\``);
    }
  } finally {
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1');
  }
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
