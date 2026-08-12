import { createHash, randomBytes } from 'node:crypto';

import { resetDatabase } from '../support/database';
import { createTestApp, type TestContext } from '../support/test-app';

/**
 * Invariantes do schema de identidade, exercitadas contra o MySQL real.
 *
 * São as garantias que `DATABASE.md` e os ADRs 0019, 0020, 0021 e 0022 afirmam
 * e que só o banco pode confirmar: tipo de identificador, unicidade,
 * cardinalidade e comportamento de exclusão. Testar isso com mock provaria
 * apenas que o mock concorda com quem o escreveu.
 */

const KEY_BUNDLE = {
  kdfAlgorithm: 'ARGON2ID',
  kdfVersion: 1,
  kdfSalt: 'AQIDBAUGBwgJCgsMDQ4PEA',
  kdfMemory: 65536,
  kdfIterations: 3,
  kdfParallelism: 1,
  publicKey: 'AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE',
  encryptedPrivateKey: 'AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC',
  privateKeyNonce: 'AwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD',
  cryptoVersion: 1,
  schemaVersion: 1,
};

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

describe('schema de identidade', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(context.prisma);
  });

  afterAll(async () => {
    await context.close();
  });

  async function createUser(email = 'alice@example.test') {
    return context.prisma.user.create({
      data: {
        name: 'Alice',
        email,
        authSecretHash: hash(`verificador-de-${email}`),
        authSecretVersion: 1,
      },
    });
  }

  describe('identificadores', () => {
    it('gera UUIDv7 em CHAR(36), como o ADR 0019 fixa', async () => {
      const user = await createUser();

      expect(user.id).toHaveLength(36);
      // O nibble de versão do UUID fica na posição 14. `7` é o que distingue a
      // v7 da v4, e é dele que vem o instante de criação embutido.
      expect(user.id.charAt(14)).toBe('7');
    });

    it('produz ids ordenáveis por criação, que é a razão de ser da v7', async () => {
      const first = await createUser('primeiro@example.test');
      const second = await createUser('segundo@example.test');

      expect(first.id < second.id).toBe(true);
    });
  });

  describe('users', () => {
    it('recusa e-mail duplicado', async () => {
      await createUser('duplicado@example.test');

      await expect(createUser('duplicado@example.test')).rejects.toThrow();
    });

    it('nasce ativo, destravado e sem falhas acumuladas', async () => {
      const user = await createUser();

      expect(user.isActive).toBe(true);
      expect(user.failedLoginAttempts).toBe(0);
      expect(user.lockedUntil).toBeNull();
      expect(user.authSecretVersion).toBe(1);
    });

    it('não tem coluna de exclusão lógica (ADR 0020)', async () => {
      const columns = await context.prisma.$queryRaw<{ COLUMN_NAME: string }[]>`
        SELECT COLUMN_NAME FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
      `;

      const names = columns.map((column) => column.COLUMN_NAME);

      expect(names).not.toContain('deleted_at');
      expect(names).toContain('auth_secret_hash');
    });

    it('guarda apenas o verificador, nunca o AuthSecret apresentado', async () => {
      const user = await createUser();

      // O verificador é HMAC-SHA-256 em hexadecimal: 64 caracteres, e nada que
      // se pareça com o valor de entrada.
      expect(user.authSecretHash).toHaveLength(64);
      expect(user.authSecretHash).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe('user_key_bundles', () => {
    it('é 1:1 com a conta', async () => {
      const user = await createUser();

      await context.prisma.userKeyBundle.create({ data: { userId: user.id, ...KEY_BUNDLE } });

      await expect(
        context.prisma.userKeyBundle.create({ data: { userId: user.id, ...KEY_BUNDLE } }),
      ).rejects.toThrow();
    });

    it('some junto com a conta, por Cascade (ADR 0020)', async () => {
      const user = await createUser();
      await context.prisma.userKeyBundle.create({ data: { userId: user.id, ...KEY_BUNDLE } });

      await context.prisma.user.delete({ where: { id: user.id } });

      await expect(context.prisma.userKeyBundle.count()).resolves.toBe(0);
    });

    it('não aceita bundle órfão', async () => {
      await expect(
        context.prisma.userKeyBundle.create({
          data: { userId: '018f0000-0000-7000-8000-00000000dead', ...KEY_BUNDLE },
        }),
      ).rejects.toThrow();
    });

    it('preserva os parâmetros KDF exatamente como gravados', async () => {
      const user = await createUser();

      const bundle = await context.prisma.userKeyBundle.create({
        data: { userId: user.id, ...KEY_BUNDLE },
      });

      expect(bundle.kdfMemory).toBe(65536);
      expect(bundle.kdfIterations).toBe(3);
      expect(bundle.kdfParallelism).toBe(1);
      expect(bundle.kdfSalt).toBe(KEY_BUNDLE.kdfSalt);
      expect(bundle.publicKey).toBe(KEY_BUNDLE.publicKey);
    });
  });

  describe('sessions', () => {
    async function createSession(user: { id: string }, familyId?: string) {
      return context.prisma.session.create({
        data: {
          userId: user.id,
          familyId: familyId ?? randomBytes(16).toString('hex').padEnd(36, '0').slice(0, 36),
          refreshTokenHash: hash(randomBytes(32).toString('base64url')),
          clientType: 'web',
          clientName: 'Firefox no Windows',
        },
      });
    }

    it('recusa dois registros com o mesmo hash de refresh token', async () => {
      const user = await createUser();
      const duplicated = hash('token-repetido');

      await context.prisma.session.create({
        data: {
          userId: user.id,
          familyId: '018f0000-0000-7000-8000-000000000001',
          refreshTokenHash: duplicated,
          clientType: 'web',
        },
      });

      await expect(
        context.prisma.session.create({
          data: {
            userId: user.id,
            familyId: '018f0000-0000-7000-8000-000000000002',
            refreshTokenHash: duplicated,
            clientType: 'web',
          },
        }),
      ).rejects.toThrow();
    });

    it('carrega as duas âncoras que o ADR 0021 exige', async () => {
      const user = await createUser();
      const session = await createSession(user);

      expect(session.createdAt).toBeInstanceOf(Date);
      expect(session.lastUsedAt).toBeInstanceOf(Date);
    });

    it('não guarda prazo calculado, para que apertar a configuração valha para sessões abertas', async () => {
      const columns = await context.prisma.$queryRaw<{ COLUMN_NAME: string }[]>`
        SELECT COLUMN_NAME FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sessions'
      `;

      const names = columns.map((column) => column.COLUMN_NAME);

      expect(names).not.toContain('expires_at');
      expect(names).not.toContain('revoked_at');
      expect(names).toContain('created_at');
      expect(names).toContain('last_used_at');
    });

    it('some junto com a conta, por Cascade (ADR 0020)', async () => {
      const user = await createUser();
      await createSession(user);
      await createSession(user);

      await context.prisma.user.delete({ where: { id: user.id } });

      await expect(context.prisma.session.count()).resolves.toBe(0);
    });

    it('revogar é apagar a linha, não marcar', async () => {
      const user = await createUser();
      const session = await createSession(user);

      await context.prisma.session.delete({ where: { id: session.id } });

      await expect(
        context.prisma.session.findUnique({ where: { id: session.id } }),
      ).resolves.toBeNull();
    });

    it('permite derrubar uma família inteira de uma vez', async () => {
      const user = await createUser();
      const familyId = '018f0000-0000-7000-8000-0000000000fa';

      await createSession(user, familyId);
      await createSession(user, familyId);
      await createSession(user);

      await context.prisma.session.deleteMany({ where: { familyId } });

      await expect(context.prisma.session.count()).resolves.toBe(1);
    });

    it('isola sessões entre usuários', async () => {
      const alice = await createUser('alice@example.test');
      const bob = await createUser('bob@example.test');

      await createSession(alice);
      await createSession(bob);

      const aliceSessions = await context.prisma.session.findMany({
        where: { userId: alice.id },
      });

      expect(aliceSessions).toHaveLength(1);
      expect(aliceSessions.at(0)?.userId).toBe(alice.id);
    });
  });

  describe('idempotency_records', () => {
    it('recusa a mesma chave duas vezes no mesmo escopo', async () => {
      await context.prisma.idempotencyRecord.create({
        data: {
          scope: 'setup',
          idempotencyKey: 'chave-repetida',
          requestHash: hash('payload'),
          responseStatus: 201,
        },
      });

      await expect(
        context.prisma.idempotencyRecord.create({
          data: {
            scope: 'setup',
            idempotencyKey: 'chave-repetida',
            requestHash: hash('outro-payload'),
            responseStatus: 201,
          },
        }),
      ).rejects.toThrow();
    });

    it('aceita a mesma chave em escopos diferentes', async () => {
      await context.prisma.idempotencyRecord.create({
        data: {
          scope: 'setup',
          idempotencyKey: 'mesma-chave',
          requestHash: hash('payload'),
          responseStatus: 201,
        },
      });

      await expect(
        context.prisma.idempotencyRecord.create({
          data: {
            scope: 'import',
            idempotencyKey: 'mesma-chave',
            requestHash: hash('payload'),
            responseStatus: 201,
          },
        }),
      ).resolves.toBeDefined();
    });

    it('não guarda corpo de resposta, que carregaria um access token vivo', async () => {
      const columns = await context.prisma.$queryRaw<{ COLUMN_NAME: string }[]>`
        SELECT COLUMN_NAME FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'idempotency_records'
      `;

      const names = columns.map((column) => column.COLUMN_NAME);

      expect(names).not.toContain('response_body');
      expect(names).toContain('resource_id');
    });

    it('sobrevive à exclusão do recurso que descreve, por não ter FK', async () => {
      const user = await createUser();

      await context.prisma.idempotencyRecord.create({
        data: {
          scope: 'setup',
          idempotencyKey: 'chave-do-setup',
          requestHash: hash('payload'),
          resourceId: user.id,
          responseStatus: 201,
        },
      });

      await context.prisma.user.delete({ where: { id: user.id } });

      await expect(context.prisma.idempotencyRecord.count()).resolves.toBe(1);
    });
  });

  describe('convenções do banco', () => {
    it('usa utf8mb4_0900_ai_ci e InnoDB em todas as tabelas do domínio', async () => {
      const tables = await context.prisma.$queryRaw<
        { TABLE_NAME: string; TABLE_COLLATION: string; ENGINE: string }[]
      >`
        SELECT TABLE_NAME, TABLE_COLLATION, ENGINE FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME NOT LIKE '\\_%'
      `;

      // Conferir o conjunto, e não a quantidade: uma tabela que suma do schema
      // reprova aqui, o que uma contagem atualizada a cada migration não faria.
      expect(tables.map((table) => table.TABLE_NAME).sort()).toEqual([
        'audit_logs',
        'idempotency_records',
        'sessions',
        'user_key_bundles',
        'users',
        'vault_key_envelopes',
        'vault_members',
        'vaults',
      ]);

      for (const table of tables) {
        expect(table.ENGINE).toBe('InnoDB');
        expect(table.TABLE_COLLATION).toBe('utf8mb4_0900_ai_ci');
      }
    });

    it('não tem coluna em texto aberto para chave privada', async () => {
      const columns = await context.prisma.$queryRaw<{ COLUMN_NAME: string }[]>`
        SELECT COLUMN_NAME FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_key_bundles'
      `;

      const names = columns.map((column) => column.COLUMN_NAME);

      expect(names).toContain('encrypted_private_key');
      expect(names).not.toContain('private_key');
    });
  });
});
