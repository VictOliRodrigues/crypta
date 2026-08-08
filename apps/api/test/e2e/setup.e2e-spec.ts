import { randomUUID } from 'node:crypto';

import request from 'supertest';

import { API_PREFIX } from '@crypta/contracts';

import { resetDatabase } from '../support/database';
import { readData } from '../support/http';
import { createTestApp, type TestContext } from '../support/test-app';

/**
 * `GET /setup/status` e `POST /setup`, contra a aplicação e o MySQL reais.
 *
 * O que estes testes protegem, além do caminho feliz: que a senha nunca apareça
 * no corpo, que um `privateKey` em texto aberto seja recusado e não ignorado, e
 * que a idempotência distinga replay de conflito.
 */

/** Key bundle bem formado. Os bytes não precisam ser criptograficamente reais:
 *  a API valida estrutura, nunca conteúdo (docs/API.md secao 20). */
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

/** 32 bytes em base64url, o tamanho que o ADR 0022 exige do `AuthSecret`. */
const AUTH_SECRET = 'BAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQ';

const VALID_BODY = {
  name: 'Alice',
  email: 'alice@example.test',
  authSecret: AUTH_SECRET,
  keyBundle: KEY_BUNDLE,
};

describe('setup', () => {
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

  function postSetup(body: object, idempotencyKey: string = randomUUID()) {
    return request(context.httpServer)
      .post(`/${API_PREFIX}/setup`)
      .set('Idempotency-Key', idempotencyKey)
      .send(body);
  }

  describe('GET /setup/status', () => {
    it('pede configuração enquanto não existe usuário', async () => {
      const response = await request(context.httpServer).get(`/${API_PREFIX}/setup/status`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual({ setupRequired: true });
    });

    it('deixa de pedir depois do primeiro usuário', async () => {
      await postSetup(VALID_BODY);

      const response = await request(context.httpServer).get(`/${API_PREFIX}/setup/status`);

      expect(response.body.data).toEqual({ setupRequired: false });
    });

    it('não revela quantidade de usuários nem detalhe interno', async () => {
      const response = await request(context.httpServer).get(`/${API_PREFIX}/setup/status`);

      expect(Object.keys(readData(response))).toEqual(['setupRequired']);
    });
  });

  describe('POST /setup', () => {
    it('cria o primeiro usuário e devolve uma sessão', async () => {
      const response = await postSetup(VALID_BODY);

      expect(response.status).toBe(201);
      expect(response.body.data.user).toEqual({
        id: expect.stringMatching(/^[0-9a-f-]{36}$/),
        name: 'Alice',
        email: 'alice@example.test',
      });
      expect(typeof response.body.data.accessToken).toBe('string');
      expect(response.body.data.expiresIn).toBe(900);
    });

    it('grava usuário, key bundle e sessão na mesma transação', async () => {
      await postSetup(VALID_BODY);

      await expect(context.prisma.user.count()).resolves.toBe(1);
      await expect(context.prisma.userKeyBundle.count()).resolves.toBe(1);
      await expect(context.prisma.session.count()).resolves.toBe(1);
    });

    it('guarda o verificador do AuthSecret, nunca o valor apresentado', async () => {
      await postSetup(VALID_BODY);

      const user = await context.prisma.user.findFirstOrThrow({
        select: { authSecretHash: true, authSecretVersion: true },
      });

      expect(user.authSecretHash).toMatch(/^[0-9a-f]{64}$/);
      expect(user.authSecretHash).not.toContain(AUTH_SECRET);
      expect(user.authSecretVersion).toBe(1);
    });

    it('normaliza o e-mail para minúsculas', async () => {
      await postSetup({ ...VALID_BODY, email: '  Alice@Example.TEST  ' });

      const user = await context.prisma.user.findFirstOrThrow({ select: { email: true } });

      expect(user.email).toBe('alice@example.test');
    });

    it('recusa o segundo setup', async () => {
      await postSetup(VALID_BODY);

      const response = await postSetup({ ...VALID_BODY, email: 'bob@example.test' });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('SETUP_ALREADY_COMPLETED');
      await expect(context.prisma.user.count()).resolves.toBe(1);
    });

    it('exige o header Idempotency-Key', async () => {
      const response = await request(context.httpServer)
        .post(`/${API_PREFIX}/setup`)
        .send(VALID_BODY);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('recusa Idempotency-Key que não seja UUID', async () => {
      const response = await postSetup(VALID_BODY, 'nao-e-uuid');

      expect(response.status).toBe(400);
    });
  });

  describe('POST /setup — o que o DTO precisa recusar', () => {
    /**
     * O item do gate: uma chave privada em texto aberto no corpo tem que parar
     * na porta. Ignorá-la em silêncio seria pior do que aceitá-la — o cliente
     * acreditaria tê-la enviado.
     */
    it('recusa um campo privateKey em texto aberto, em vez de ignorá-lo', async () => {
      const response = await postSetup({
        ...VALID_BODY,
        keyBundle: { ...KEY_BUNDLE, privateKey: 'AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE' },
      });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      await expect(context.prisma.user.count()).resolves.toBe(0);
    });

    it('recusa campo desconhecido na raiz do corpo', async () => {
      const response = await postSetup({ ...VALID_BODY, password: 'senha-em-texto-aberto' });

      expect(response.status).toBe(400);
      await expect(context.prisma.user.count()).resolves.toBe(0);
    });

    it.each([
      ['authSecret de tamanho errado', { authSecret: 'AQEB' }],
      ['authSecret fora do base64url', { authSecret: 'a'.repeat(42) + '+' }],
    ])('recusa %s', async (_name, override) => {
      const response = await postSetup({ ...VALID_BODY, ...override });

      expect(response.status).toBe(400);
    });

    it.each([
      ['salt fora de 16 bytes', { kdfSalt: 'AQIDBAUGBwgJCgsMDQ4PEAER' }],
      ['chave pública fora de 32 bytes', { publicKey: 'AQEB' }],
      ['nonce fora de 24 bytes', { privateKeyNonce: 'AwMD' }],
      ['paralelismo diferente de 1', { kdfParallelism: 4 }],
      ['memória abaixo do mínimo', { kdfMemory: 1024 }],
      ['algoritmo de KDF desconhecido', { kdfAlgorithm: 'PBKDF2' }],
    ])('recusa key bundle com %s', async (_name, override) => {
      const response = await postSetup({
        ...VALID_BODY,
        keyBundle: { ...KEY_BUNDLE, ...override },
      });

      expect(response.status).toBe(400);
      await expect(context.prisma.user.count()).resolves.toBe(0);
    });

    it('não ecoa o valor recebido na resposta de erro', async () => {
      const response = await postSetup({ ...VALID_BODY, authSecret: 'valor-invalido-visivel' });

      expect(JSON.stringify(response.body)).not.toContain('valor-invalido-visivel');
    });
  });

  describe('POST /setup — idempotência', () => {
    it('devolve a mesma conta quando a chave e o payload se repetem', async () => {
      const key = randomUUID();

      const first = await postSetup(VALID_BODY, key);
      const second = await postSetup(VALID_BODY, key);

      expect(second.status).toBe(201);
      expect(second.body.data.user.id).toBe(first.body.data.user.id);
      await expect(context.prisma.user.count()).resolves.toBe(1);
    });

    /**
     * O replay emite uma sessão nova em vez de repetir o access token anterior.
     * Guardar o token para devolvê-lo transformaria `idempotency_records` em
     * depósito de credencial viva (ADR 0022).
     */
    it('emite uma sessão nova no replay, em vez de guardar o token anterior', async () => {
      const key = randomUUID();

      const first = await postSetup(VALID_BODY, key);
      const second = await postSetup(VALID_BODY, key);

      expect(second.body.data.accessToken).not.toBe(first.body.data.accessToken);
      await expect(context.prisma.session.count()).resolves.toBe(2);
    });

    it('responde 409 quando a mesma chave chega com payload diferente', async () => {
      const key = randomUUID();

      await postSetup(VALID_BODY, key);
      const response = await postSetup({ ...VALID_BODY, name: 'Outro nome' }, key);

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('IDEMPOTENCY_CONFLICT');
    });

    it('trata a ordem dos campos do corpo como irrelevante', async () => {
      const key = randomUUID();

      await postSetup(VALID_BODY, key);

      const reordered = {
        keyBundle: KEY_BUNDLE,
        authSecret: AUTH_SECRET,
        email: VALID_BODY.email,
        name: VALID_BODY.name,
      };

      const response = await postSetup(reordered, key);

      expect(response.status).toBe(201);
    });

    it('guarda o registro sem corpo de resposta', async () => {
      await postSetup(VALID_BODY);

      const record = await context.prisma.idempotencyRecord.findFirstOrThrow();

      expect(record.resourceId).toMatch(/^[0-9a-f-]{36}$/);
      expect(JSON.stringify(record)).not.toContain('accessToken');
    });
  });
});
