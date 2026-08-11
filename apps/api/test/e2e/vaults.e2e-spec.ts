import { randomUUID } from 'node:crypto';

import request from 'supertest';

import { API_PREFIX } from '@crypta/contracts';

import { ServerSecretService } from '@/modules/auth/services/server-secret.service';

import { resetDatabase } from '../support/database';
import { readData } from '../support/http';
import { createTestApp, type TestContext } from '../support/test-app';

/**
 * Rotas de cofre, contra a aplicação e o MySQL reais.
 *
 * O que estes testes protegem, além do caminho feliz:
 *
 * 1. a API nunca recebe nome de cofre — um campo em texto aberto é `400`;
 * 2. cofre de outro usuário responde `404`, igual a cofre inexistente;
 * 3. `expectedVersion` defasado não grava nada;
 * 4. a exclusão leva membros e envelopes e **deixa** a auditoria.
 */

const ALICE = 'alice@example.test';
const BOB = 'bob@example.test';

const AUTH_SECRET = 'BAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQ';

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

/** Bem formado. A API valida estrutura, nunca conteúdo. */
const ENCRYPTED_METADATA = {
  cryptoVersion: 1,
  schemaVersion: 1,
  algorithm: 'XCHACHA20-POLY1305',
  nonce: 'AwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD',
  ciphertext: 'BAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE',
};

/** 32 bytes de chave efêmera e 48 de `VaultKey` selada mais tag. */
const OWNER_ENVELOPE = {
  keyVersion: 1,
  cryptoVersion: 1,
  algorithm: 'X25519-HKDF-SHA256-XCHACHA20-POLY1305',
  ephemeralPublicKey: 'AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE',
  encryptedVaultKey: 'AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC',
};

/** UUIDv7 fixos: quem gera o id do cofre é o cliente (ADR 0025). */
const VAULT_ID = '0198e4c1-1111-7000-8000-000000000001';
const OTHER_VAULT_ID = '0198e4c1-1111-7000-8000-000000000002';

describe('cofres', () => {
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

  async function createAccount(email: string): Promise<void> {
    const serverSecret = context.app.get(ServerSecretService);

    await context.prisma.user.create({
      data: {
        name: email.split('@')[0] ?? 'usuário',
        email,
        authSecretHash: serverSecret.computeAuthSecretHash(Buffer.from(AUTH_SECRET, 'base64url')),
        authSecretVersion: serverSecret.currentVersion,
        keyBundle: { create: KEY_BUNDLE },
      },
    });
  }

  async function authenticate(email: string): Promise<string> {
    const response = await request(context.httpServer)
      .post(`/${API_PREFIX}/auth/login`)
      .send({ email, authSecret: AUTH_SECRET });

    return String(readData(response).accessToken);
  }

  function postVault(token: string, body: object, idempotencyKey = randomUUID()) {
    return request(context.httpServer)
      .post(`/${API_PREFIX}/vaults`)
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', idempotencyKey)
      .send(body);
  }

  function validBody(id = VAULT_ID) {
    return { id, encryptedMetadata: ENCRYPTED_METADATA, ownerEnvelope: OWNER_ENVELOPE };
  }

  async function createVaultFor(email: string, id = VAULT_ID): Promise<string> {
    const token = await authenticate(email);

    await postVault(token, validBody(id)).expect(201);

    return token;
  }

  describe('POST /vaults', () => {
    it('cria o cofre com o id que o cliente escolheu', async () => {
      await createAccount(ALICE);
      const token = await authenticate(ALICE);

      const response = await postVault(token, validBody()).expect(201);

      expect(readData(response)).toMatchObject({
        id: VAULT_ID,
        role: 'OWNER',
        version: 1,
        keyVersion: 1,
      });
    });

    it('grava o chamador como OWNER e o envelope dele', async () => {
      await createAccount(ALICE);
      await createVaultFor(ALICE);

      const members = await context.prisma.vaultMember.findMany({ where: { vaultId: VAULT_ID } });
      const envelopes = await context.prisma.vaultKeyEnvelope.findMany({
        where: { vaultId: VAULT_ID },
      });

      expect(members).toHaveLength(1);
      expect(members[0]).toMatchObject({ role: 'OWNER', ownerVaultId: VAULT_ID });
      expect(envelopes).toHaveLength(1);
      expect(envelopes[0]).toMatchObject({ keyVersion: 1 });
    });

    it('registra a criação na auditoria', async () => {
      await createAccount(ALICE);
      await createVaultFor(ALICE);

      const logs = await context.prisma.auditLog.findMany();

      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({ action: 'VAULT_CREATED', entityId: VAULT_ID });
    });

    /**
     * O nome do cofre não pode chegar à API (`CLAUDE.md` secao 7). O `.strict()`
     * transforma isso em recusa: o campo para na porta em vez de ser descartado
     * em silêncio enquanto o cliente acredita tê-lo enviado.
     */
    it('recusa nome em texto aberto no corpo', async () => {
      await createAccount(ALICE);
      const token = await authenticate(ALICE);

      await postVault(token, { ...validBody(), name: 'Pessoal' }).expect(400);
    });

    it('recusa envelope com campo nonce, que não existe no formato', async () => {
      await createAccount(ALICE);
      const token = await authenticate(ALICE);

      await postVault(token, {
        ...validBody(),
        ownerEnvelope: { ...OWNER_ENVELOPE, nonce: 'AwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD' },
      }).expect(400);
    });

    it('recusa id que não é UUIDv7', async () => {
      await createAccount(ALICE);
      const token = await authenticate(ALICE);

      await postVault(token, validBody('9f1b2c3d-4e5f-4a6b-8c9d-0e1f2a3b4c5d')).expect(400);
    });

    it('recusa id já usado, inclusive por outro usuário', async () => {
      await createAccount(ALICE);
      await createAccount(BOB);
      await createVaultFor(ALICE);

      const bobToken = await authenticate(BOB);
      const response = await postVault(bobToken, validBody()).expect(409);

      expect(response.body).toMatchObject({ error: { code: 'IDENTIFIER_CONFLICT' } });
    });

    it('recusa envelope de outra geração de chave', async () => {
      await createAccount(ALICE);
      const token = await authenticate(ALICE);

      const response = await postVault(token, {
        ...validBody(),
        ownerEnvelope: { ...OWNER_ENVELOPE, keyVersion: 2 },
      }).expect(400);

      expect(response.body).toMatchObject({ error: { code: 'INVALID_ENVELOPE' } });
    });

    it('exige o header de idempotência', async () => {
      await createAccount(ALICE);
      const token = await authenticate(ALICE);

      await request(context.httpServer)
        .post(`/${API_PREFIX}/vaults`)
        .set('Authorization', `Bearer ${token}`)
        .send(validBody())
        .expect(400);
    });

    it('devolve o mesmo cofre quando a chave de idempotência se repete', async () => {
      await createAccount(ALICE);
      const token = await authenticate(ALICE);
      const key = randomUUID();

      const first = await postVault(token, validBody(), key).expect(201);
      const second = await postVault(token, validBody(), key).expect(201);

      expect(readData(second)).toEqual(readData(first));
      await expect(context.prisma.vault.count()).resolves.toBe(1);
    });

    it('recusa a mesma chave de idempotência com corpo diferente', async () => {
      await createAccount(ALICE);
      const token = await authenticate(ALICE);
      const key = randomUUID();

      await postVault(token, validBody(), key).expect(201);

      const response = await postVault(token, validBody(OTHER_VAULT_ID), key).expect(409);

      expect(response.body).toMatchObject({ error: { code: 'IDEMPOTENCY_CONFLICT' } });
    });

    it('recusa sem autenticação', async () => {
      await request(context.httpServer)
        .post(`/${API_PREFIX}/vaults`)
        .set('Idempotency-Key', randomUUID())
        .send(validBody())
        .expect(401);
    });
  });

  describe('GET /vaults', () => {
    it('lista apenas os cofres do chamador', async () => {
      await createAccount(ALICE);
      await createAccount(BOB);
      await createVaultFor(ALICE);
      const bobToken = await createVaultFor(BOB, OTHER_VAULT_ID);

      const response = await request(context.httpServer)
        .get(`/${API_PREFIX}/vaults`)
        .set('Authorization', `Bearer ${bobToken}`)
        .expect(200);

      const data = response.body.data as { id: string }[];

      expect(data).toHaveLength(1);
      expect(data[0]?.id).toBe(OTHER_VAULT_ID);
    });

    it('devolve a metadata ainda criptografada, sem nome em lugar nenhum', async () => {
      await createAccount(ALICE);
      const token = await createVaultFor(ALICE);

      const response = await request(context.httpServer)
        .get(`/${API_PREFIX}/vaults`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data[0]).toMatchObject({
        encryptedMetadata: ENCRYPTED_METADATA,
        currentUserEnvelope: OWNER_ENVELOPE,
        role: 'OWNER',
        memberCount: 1,
        siteCount: 0,
      });

      expect(JSON.stringify(response.body)).not.toContain('name');
    });

    it('não guarda a resposta em cache', async () => {
      await createAccount(ALICE);
      const token = await createVaultFor(ALICE);

      const response = await request(context.httpServer)
        .get(`/${API_PREFIX}/vaults`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.headers['cache-control']).toBe('no-store');
    });

    it('pagina por cursor sem repetir nem perder cofre', async () => {
      await createAccount(ALICE);
      const token = await authenticate(ALICE);

      const ids = [
        '0198e4c1-1111-7000-8000-00000000000a',
        '0198e4c1-1111-7000-8000-00000000000b',
        '0198e4c1-1111-7000-8000-00000000000c',
      ];

      for (const id of ids) {
        await postVault(token, validBody(id)).expect(201);
      }

      const first = await request(context.httpServer)
        .get(`/${API_PREFIX}/vaults?limit=2`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(first.body.data).toHaveLength(2);
      expect(first.body.meta.hasMore).toBe(true);

      const second = await request(context.httpServer)
        .get(`/${API_PREFIX}/vaults?limit=2&cursor=${String(first.body.meta.cursor)}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const seen = [...first.body.data, ...second.body.data].map(
        (vault: { id: string }) => vault.id,
      );

      expect(new Set(seen).size).toBe(3);
      expect(second.body.meta.hasMore).toBe(false);
    });
  });

  describe('GET /vaults/:vaultId', () => {
    it('devolve o cofre do próprio usuário', async () => {
      await createAccount(ALICE);
      const token = await createVaultFor(ALICE);

      const response = await request(context.httpServer)
        .get(`/${API_PREFIX}/vaults/${VAULT_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(readData(response)).toMatchObject({ id: VAULT_ID, isLockedForRekey: false });
    });

    /**
     * IDOR. A resposta é `404`, e não `403`: distinguir "existe e não é seu" de
     * "não existe" entregaria a existência do cofre a quem varresse ids.
     */
    it('responde 404 para cofre de outro usuário', async () => {
      await createAccount(ALICE);
      await createAccount(BOB);
      await createVaultFor(ALICE);

      const bobToken = await authenticate(BOB);

      const response = await request(context.httpServer)
        .get(`/${API_PREFIX}/vaults/${VAULT_ID}`)
        .set('Authorization', `Bearer ${bobToken}`)
        .expect(404);

      expect(response.body).toMatchObject({ error: { code: 'RESOURCE_NOT_FOUND' } });
    });

    it('responde igual para cofre inexistente e cofre de outro', async () => {
      await createAccount(ALICE);
      await createAccount(BOB);
      await createVaultFor(ALICE);

      const bobToken = await authenticate(BOB);

      const foreign = await request(context.httpServer)
        .get(`/${API_PREFIX}/vaults/${VAULT_ID}`)
        .set('Authorization', `Bearer ${bobToken}`)
        .expect(404);

      const missing = await request(context.httpServer)
        .get(`/${API_PREFIX}/vaults/${OTHER_VAULT_ID}`)
        .set('Authorization', `Bearer ${bobToken}`)
        .expect(404);

      expect(foreign.body.error.code).toBe(missing.body.error.code);
      expect(foreign.body.error.message).toBe(missing.body.error.message);
    });
  });

  describe('PATCH /vaults/:vaultId', () => {
    const NEW_METADATA = {
      ...ENCRYPTED_METADATA,
      nonce: 'BQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUF',
      ciphertext: 'BgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgY',
    };

    function patchVault(token: string, body: object, vaultId = VAULT_ID) {
      return request(context.httpServer)
        .patch(`/${API_PREFIX}/vaults/${vaultId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(body);
    }

    it('atualiza a metadata e incrementa a versão exatamente uma vez', async () => {
      await createAccount(ALICE);
      const token = await createVaultFor(ALICE);

      const response = await patchVault(token, {
        expectedVersion: 1,
        encryptedMetadata: NEW_METADATA,
      }).expect(200);

      expect(readData(response)).toMatchObject({ id: VAULT_ID, version: 2 });

      const vault = await context.prisma.vault.findUniqueOrThrow({ where: { id: VAULT_ID } });

      expect(vault.metadataCiphertext).toBe(NEW_METADATA.ciphertext);
      expect(vault.keyVersion).toBe(1);
    });

    it('recusa versão defasada sem gravar nada', async () => {
      await createAccount(ALICE);
      const token = await createVaultFor(ALICE);

      await patchVault(token, { expectedVersion: 1, encryptedMetadata: NEW_METADATA }).expect(200);

      const response = await patchVault(token, {
        expectedVersion: 1,
        encryptedMetadata: { ...NEW_METADATA, ciphertext: 'BwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcH' },
      }).expect(409);

      expect(response.body).toMatchObject({ error: { code: 'VERSION_CONFLICT' } });

      const vault = await context.prisma.vault.findUniqueOrThrow({ where: { id: VAULT_ID } });

      expect(vault.metadataCiphertext).toBe(NEW_METADATA.ciphertext);
      expect(vault.version).toBe(2);
    });

    it('exige expectedVersion', async () => {
      await createAccount(ALICE);
      const token = await createVaultFor(ALICE);

      await patchVault(token, { encryptedMetadata: NEW_METADATA }).expect(400);
    });

    it('responde 404 para cofre de outro usuário', async () => {
      await createAccount(ALICE);
      await createAccount(BOB);
      await createVaultFor(ALICE);

      const bobToken = await authenticate(BOB);

      await patchVault(bobToken, {
        expectedVersion: 1,
        encryptedMetadata: NEW_METADATA,
      }).expect(404);
    });
  });

  describe('DELETE /vaults/:vaultId', () => {
    function deleteVault(token: string, body: object, vaultId = VAULT_ID) {
      return request(context.httpServer)
        .delete(`/${API_PREFIX}/vaults/${vaultId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(body);
    }

    it('exclui o cofre, os membros e os envelopes', async () => {
      await createAccount(ALICE);
      const token = await createVaultFor(ALICE);

      await deleteVault(token, { expectedVersion: 1, confirmation: true }).expect(204);

      await expect(context.prisma.vault.count()).resolves.toBe(0);
      await expect(context.prisma.vaultMember.count()).resolves.toBe(0);
      await expect(context.prisma.vaultKeyEnvelope.count()).resolves.toBe(0);
    });

    /** A exclusão é física; o registro de que ela aconteceu é tudo o que resta. */
    it('preserva a auditoria depois de o cofre sumir', async () => {
      await createAccount(ALICE);
      const token = await createVaultFor(ALICE);

      await deleteVault(token, { expectedVersion: 1, confirmation: true }).expect(204);

      const logs = await context.prisma.auditLog.findMany({ orderBy: { createdAt: 'asc' } });

      expect(logs.map((log) => log.action)).toEqual(['VAULT_CREATED', 'VAULT_DELETED']);
    });

    it('exige confirmação explícita', async () => {
      await createAccount(ALICE);
      const token = await createVaultFor(ALICE);

      await deleteVault(token, { expectedVersion: 1 }).expect(400);
      await deleteVault(token, { expectedVersion: 1, confirmation: false }).expect(400);

      await expect(context.prisma.vault.count()).resolves.toBe(1);
    });

    it('recusa versão defasada sem excluir', async () => {
      await createAccount(ALICE);
      const token = await createVaultFor(ALICE);

      const response = await deleteVault(token, {
        expectedVersion: 99,
        confirmation: true,
      }).expect(409);

      expect(response.body).toMatchObject({ error: { code: 'VERSION_CONFLICT' } });
      await expect(context.prisma.vault.count()).resolves.toBe(1);
    });

    it('responde 404 para cofre de outro usuário', async () => {
      await createAccount(ALICE);
      await createAccount(BOB);
      await createVaultFor(ALICE);

      const bobToken = await authenticate(BOB);

      await deleteVault(bobToken, { expectedVersion: 1, confirmation: true }).expect(404);
      await expect(context.prisma.vault.count()).resolves.toBe(1);
    });
  });
  describe('GET /vaults/:vaultId/snapshot', () => {
    function getSnapshot(token: string, vaultId = VAULT_ID) {
      return request(context.httpServer)
        .get(`/${API_PREFIX}/vaults/${vaultId}/snapshot`)
        .set('Authorization', `Bearer ${token}`);
    }

    it('devolve metadata, envelope do chamador e membros', async () => {
      await createAccount(ALICE);
      const token = await createVaultFor(ALICE);

      const response = await getSnapshot(token).expect(200);
      const data = readData(response);

      expect(data.vault).toMatchObject({
        id: VAULT_ID,
        encryptedMetadata: ENCRYPTED_METADATA,
        version: 1,
        keyVersion: 1,
      });

      expect(data.currentUserEnvelope).toEqual(OWNER_ENVELOPE);

      const members = data.members as { role: string }[];

      expect(members).toHaveLength(1);
      expect(members[0]).toMatchObject({ role: 'OWNER' });
    });

    /** Sites e credenciais entram na R0.4. A forma existe antes do conteúdo. */
    it('devolve listas vazias e cursor nulo enquanto não há conteúdo', async () => {
      await createAccount(ALICE);
      const token = await createVaultFor(ALICE);

      const data = readData(await getSnapshot(token).expect(200));

      expect(data.sites).toEqual([]);
      expect(data.credentials).toEqual([]);
      expect(data.syncCursor).toBeNull();
    });

    it('não devolve envelope de outro membro', async () => {
      await createAccount(ALICE);
      await createAccount(BOB);
      const token = await createVaultFor(ALICE);

      const bob = await context.prisma.user.findUniqueOrThrow({ where: { email: BOB } });

      await context.prisma.vaultMember.create({
        data: { vaultId: VAULT_ID, userId: bob.id, role: 'EDITOR' },
      });

      await context.prisma.vaultKeyEnvelope.create({
        data: {
          vaultId: VAULT_ID,
          userId: bob.id,
          ...OWNER_ENVELOPE,
          encryptedVaultKey: 'AwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD',
        },
      });

      const data = readData(await getSnapshot(token).expect(200));

      expect(data.currentUserEnvelope).toEqual(OWNER_ENVELOPE);
      expect(JSON.stringify(data)).not.toContain(
        'AwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD',
      );
      expect(data.members as unknown[]).toHaveLength(2);
    });

    it('responde 404 para quem não é membro', async () => {
      await createAccount(ALICE);
      await createAccount(BOB);
      await createVaultFor(ALICE);

      const bobToken = await authenticate(BOB);

      await getSnapshot(bobToken).expect(404);
    });

    it('recusa sem autenticação', async () => {
      await createAccount(ALICE);
      await createVaultFor(ALICE);

      await request(context.httpServer)
        .get(`/${API_PREFIX}/vaults/${VAULT_ID}/snapshot`)
        .expect(401);
    });
  });

  describe('gate da R0.3', () => {
    /**
     * A linha "logs sanitizados". `LogFields` não tem campo livre, então não
     * existe caminho para registrar ciphertext no log estruturado; o que resta
     * conferir é a auditoria, que é onde os eventos de cofre são gravados.
     */
    it('não grava ciphertext nem nonce na auditoria', async () => {
      await createAccount(ALICE);
      const token = await createVaultFor(ALICE);

      await request(context.httpServer)
        .delete(`/${API_PREFIX}/vaults/${VAULT_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ expectedVersion: 1, confirmation: true })
        .expect(204);

      const serialized = JSON.stringify(await context.prisma.auditLog.findMany());

      expect(serialized).not.toContain(ENCRYPTED_METADATA.ciphertext);
      expect(serialized).not.toContain(ENCRYPTED_METADATA.nonce);
      expect(serialized).not.toContain(OWNER_ENVELOPE.encryptedVaultKey);
      expect(serialized).toContain(VAULT_ID);
    });

    /**
     * A linha "version conflict testado", na metade que a escrita sequencial
     * não cobre: duas requisições partindo da mesma versão, ao mesmo tempo. Uma
     * vence, a outra recebe `409` — é a condição no `WHERE` decidindo, e não uma
     * checagem em memória que já estaria vencida no instante seguinte.
     */
    it('deixa apenas uma de duas escritas concorrentes vencer', async () => {
      await createAccount(ALICE);
      const token = await createVaultFor(ALICE);

      function patchWith(ciphertext: string) {
        return request(context.httpServer)
          .patch(`/${API_PREFIX}/vaults/${VAULT_ID}`)
          .set('Authorization', `Bearer ${token}`)
          .send({
            expectedVersion: 1,
            encryptedMetadata: { ...ENCRYPTED_METADATA, ciphertext },
          });
      }

      const results = await Promise.all([
        patchWith('BQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQU'),
        patchWith('BgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgY'),
      ]);

      const statuses = results
        .map((result) => result.status)
        .sort((first, second) => first - second);

      expect(statuses).toEqual([200, 409]);

      const vault = await context.prisma.vault.findUniqueOrThrow({ where: { id: VAULT_ID } });

      // Uma escrita, um incremento. Duas vencendo levariam a versão a 3.
      expect(vault.version).toBe(2);
    });
  });
});
