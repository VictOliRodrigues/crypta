import { resetDatabase } from '../support/database';
import { createTestApp, type TestContext } from '../support/test-app';

/**
 * Invariantes do schema de cofres, exercitadas contra o MySQL real.
 *
 * O que se prova aqui é o que **o banco** garante, e não o que a aplicação
 * lembra de garantir: um dono por cofre, o que a exclusão leva junto, o que ela
 * é obrigada a deixar para trás e a ausência de `DEFAULT` no id.
 *
 * Nenhuma destas garantias pode ser verificada com mock. Um mock provaria
 * apenas que ele concorda com quem o escreveu.
 */

const VAULT_ID = '0198e4c1-1111-7000-8000-000000000001';
const OTHER_VAULT_ID = '0198e4c1-1111-7000-8000-000000000002';

const METADATA = {
  metadataNonce: 'AwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD',
  metadataCiphertext: 'BAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE',
  metadataAlgorithm: 'XCHACHA20-POLY1305',
  cryptoVersion: 1,
  schemaVersion: 1,
};

const ENVELOPE = {
  keyVersion: 1,
  cryptoVersion: 1,
  algorithm: 'X25519-HKDF-SHA256-XCHACHA20-POLY1305',
  ephemeralPublicKey: 'AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE',
  encryptedVaultKey: 'AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC',
};

describe('schema de cofres', () => {
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

  async function createUser(email: string) {
    return context.prisma.user.create({
      data: {
        name: email.split('@')[0] ?? 'usuário',
        email,
        authSecretHash: 'a'.repeat(64),
      },
    });
  }

  async function createVault(id = VAULT_ID) {
    return context.prisma.vault.create({ data: { id, ...METADATA } });
  }

  describe('um dono por cofre', () => {
    it('preenche `owner_vault_id` sozinho, sem a aplicação informar', async () => {
      const owner = await createUser('alice@example.test');
      await createVault();

      await context.prisma.vaultMember.create({
        data: { vaultId: VAULT_ID, userId: owner.id, role: 'OWNER' },
      });

      const member = await context.prisma.vaultMember.findFirstOrThrow({
        where: { vaultId: VAULT_ID },
      });

      expect(member.ownerVaultId).toBe(VAULT_ID);
    });

    it('deixa `owner_vault_id` nulo para EDITOR', async () => {
      const editor = await createUser('bob@example.test');
      await createVault();

      const member = await context.prisma.vaultMember.create({
        data: { vaultId: VAULT_ID, userId: editor.id, role: 'EDITOR' },
      });

      expect(member.ownerVaultId).toBeNull();
    });

    /** A recusa vem do MySQL, não de uma verificação da aplicação. */
    it('recusa um segundo OWNER no mesmo cofre', async () => {
      const owner = await createUser('alice@example.test');
      const intruder = await createUser('bob@example.test');
      await createVault();

      await context.prisma.vaultMember.create({
        data: { vaultId: VAULT_ID, userId: owner.id, role: 'OWNER' },
      });

      await expect(
        context.prisma.vaultMember.create({
          data: { vaultId: VAULT_ID, userId: intruder.id, role: 'OWNER' },
        }),
      ).rejects.toThrow();
    });

    it('recusa promover um EDITOR a OWNER enquanto houver dono', async () => {
      const owner = await createUser('alice@example.test');
      const editor = await createUser('bob@example.test');
      await createVault();

      await context.prisma.vaultMember.create({
        data: { vaultId: VAULT_ID, userId: owner.id, role: 'OWNER' },
      });

      const member = await context.prisma.vaultMember.create({
        data: { vaultId: VAULT_ID, userId: editor.id, role: 'EDITOR' },
      });

      await expect(
        context.prisma.vaultMember.update({
          where: { id: member.id },
          data: { role: 'OWNER' },
        }),
      ).rejects.toThrow();
    });

    it('permite que o mesmo usuário seja OWNER de cofres diferentes', async () => {
      const owner = await createUser('alice@example.test');
      await createVault();
      await createVault(OTHER_VAULT_ID);

      await context.prisma.vaultMember.create({
        data: { vaultId: VAULT_ID, userId: owner.id, role: 'OWNER' },
      });

      await expect(
        context.prisma.vaultMember.create({
          data: { vaultId: OTHER_VAULT_ID, userId: owner.id, role: 'OWNER' },
        }),
      ).resolves.toMatchObject({ ownerVaultId: OTHER_VAULT_ID });
    });

    it('recusa a mesma pessoa duas vezes no mesmo cofre', async () => {
      const editor = await createUser('bob@example.test');
      await createVault();

      await context.prisma.vaultMember.create({
        data: { vaultId: VAULT_ID, userId: editor.id, role: 'EDITOR' },
      });

      await expect(
        context.prisma.vaultMember.create({
          data: { vaultId: VAULT_ID, userId: editor.id, role: 'EDITOR' },
        }),
      ).rejects.toThrow();
    });
  });

  describe('identificador do cofre', () => {
    /**
     * A coluna não tem `DEFAULT` de propósito (ADR 0025): com um, um `INSERT`
     * sem id gravaria uma linha cuja metadata ninguém consegue abrir, porque a
     * AAD do cliente foi amarrada a um id que o banco descartou.
     */
    it('recusa inserção sem id', async () => {
      await expect(
        context.prisma.$executeRaw`
          INSERT INTO vaults (metadata_nonce, metadata_ciphertext, metadata_algorithm,
                              crypto_version, schema_version, updated_at)
          VALUES ('n', 'c', 'XCHACHA20-POLY1305', 1, 1, NOW(3))
        `,
      ).rejects.toThrow();
    });

    it('aceita o id que o cliente escolheu, sem alterá-lo', async () => {
      const vault = await createVault();

      expect(vault.id).toBe(VAULT_ID);
    });
  });

  describe('exclusão', () => {
    it('leva membros e envelopes junto com o cofre', async () => {
      const owner = await createUser('alice@example.test');
      await createVault();

      await context.prisma.vaultMember.create({
        data: { vaultId: VAULT_ID, userId: owner.id, role: 'OWNER' },
      });

      await context.prisma.vaultKeyEnvelope.create({
        data: { vaultId: VAULT_ID, userId: owner.id, ...ENVELOPE },
      });

      await context.prisma.vault.delete({ where: { id: VAULT_ID } });

      await expect(context.prisma.vaultMember.count()).resolves.toBe(0);
      await expect(context.prisma.vaultKeyEnvelope.count()).resolves.toBe(0);
    });

    /**
     * `Restrict` (ADR 0020): apagar quem ainda é dono deixaria o cofre sem
     * ninguém que possa fazer rekey. A exclusão precisa falhar e obrigar a
     * apagar o cofre antes.
     */
    it('recusa apagar usuário que ainda é membro', async () => {
      const owner = await createUser('alice@example.test');
      await createVault();

      await context.prisma.vaultMember.create({
        data: { vaultId: VAULT_ID, userId: owner.id, role: 'OWNER' },
      });

      await expect(context.prisma.user.delete({ where: { id: owner.id } })).rejects.toThrow();
    });

    it('preserva a auditoria depois de o cofre sumir', async () => {
      const owner = await createUser('alice@example.test');
      await createVault();

      await context.prisma.auditLog.create({
        data: {
          actorId: owner.id,
          action: 'VAULT_CREATED',
          entityType: 'vault',
          entityId: VAULT_ID,
          vaultId: VAULT_ID,
          result: 'SUCCESS',
        },
      });

      await context.prisma.vault.delete({ where: { id: VAULT_ID } });

      const logs = await context.prisma.auditLog.findMany();

      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({ action: 'VAULT_CREATED', entityId: VAULT_ID });
    });
  });

  describe('envelopes', () => {
    it('recusa dois envelopes do mesmo membro na mesma geração de chave', async () => {
      const owner = await createUser('alice@example.test');
      await createVault();

      await context.prisma.vaultKeyEnvelope.create({
        data: { vaultId: VAULT_ID, userId: owner.id, ...ENVELOPE },
      });

      await expect(
        context.prisma.vaultKeyEnvelope.create({
          data: { vaultId: VAULT_ID, userId: owner.id, ...ENVELOPE },
        }),
      ).rejects.toThrow();
    });

    it('aceita a geração seguinte, que é o que o rekey grava', async () => {
      const owner = await createUser('alice@example.test');
      await createVault();

      await context.prisma.vaultKeyEnvelope.create({
        data: { vaultId: VAULT_ID, userId: owner.id, ...ENVELOPE },
      });

      await expect(
        context.prisma.vaultKeyEnvelope.create({
          data: { vaultId: VAULT_ID, userId: owner.id, ...ENVELOPE, keyVersion: 2 },
        }),
      ).resolves.toMatchObject({ keyVersion: 2 });
    });
  });
});
