import { randomUUID } from 'node:crypto';

import request from 'supertest';

import { API_PREFIX } from '@crypta/contracts';

import { resetDatabase } from '../support/database';
import { readData } from '../support/http';
import { createTestApp, type TestContext } from '../support/test-app';

/**
 * `GET /auth/parameters` (docs/API.md secao 21).
 *
 * O que estes testes protegem é a propriedade que a rota existe para ter: a
 * resposta não pode distinguir conta existente de conta inexistente. Nem pela
 * forma, nem pela instabilidade entre chamadas.
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

describe('GET /auth/parameters', () => {
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

  function getParameters(email: string) {
    return request(context.httpServer).get(`/${API_PREFIX}/auth/parameters`).query({ email });
  }

  async function createAccount(email: string) {
    await request(context.httpServer)
      .post(`/${API_PREFIX}/setup`)
      .set('Idempotency-Key', randomUUID())
      .send({
        name: 'Alice',
        email,
        authSecret: 'BAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQ',
        keyBundle: KEY_BUNDLE,
      });
  }

  it('devolve os parâmetros gravados de uma conta existente', async () => {
    await createAccount('alice@example.test');

    const response = await getParameters('alice@example.test');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      kdfAlgorithm: 'ARGON2ID',
      kdfVersion: 1,
      kdfSalt: KEY_BUNDLE.kdfSalt,
      kdfMemory: 65536,
      kdfIterations: 3,
      kdfParallelism: 1,
    });
  });

  it('devolve parâmetros para e-mail inexistente, sem erro', async () => {
    const response = await getParameters('ninguem@example.test');

    expect(response.status).toBe(200);
    expect(response.body.data.kdfAlgorithm).toBe('ARGON2ID');
  });

  it('responde com a mesma forma nos dois casos', async () => {
    await createAccount('alice@example.test');

    const existing = await getParameters('alice@example.test');
    const missing = await getParameters('ninguem@example.test');

    expect(Object.keys(readData(existing)).sort()).toEqual(Object.keys(readData(missing)).sort());
    expect(existing.body.data.kdfMemory).toBe(missing.body.data.kdfMemory);
    expect(existing.body.data.kdfIterations).toBe(missing.body.data.kdfIterations);
    expect(existing.body.data.kdfParallelism).toBe(missing.body.data.kdfParallelism);
  });

  /**
   * O oráculo mais fácil de introduzir sem perceber: sortear o salt a cada
   * requisição. Duas consultas ao mesmo endereço devolveriam valores diferentes,
   * e isso sozinho distingue conta inexistente de conta real.
   */
  it('devolve o MESMO salt sintético em chamadas repetidas', async () => {
    const first = await getParameters('ninguem@example.test');
    const second = await getParameters('ninguem@example.test');

    expect(second.body.data.kdfSalt).toBe(first.body.data.kdfSalt);
  });

  it('devolve salts sintéticos diferentes para e-mails diferentes', async () => {
    const first = await getParameters('ninguem@example.test');
    const second = await getParameters('tampouco@example.test');

    expect(second.body.data.kdfSalt).not.toBe(first.body.data.kdfSalt);
  });

  it('trata o e-mail de forma insensível a maiúsculas e espaços', async () => {
    const canonical = await getParameters('ninguem@example.test');
    const noisy = await getParameters('  Ninguem@Example.TEST  ');

    expect(noisy.body.data.kdfSalt).toBe(canonical.body.data.kdfSalt);
  });

  it('devolve um salt sintético com o mesmo tamanho de um salt real', async () => {
    await createAccount('alice@example.test');

    const existing = await getParameters('alice@example.test');
    const missing = await getParameters('ninguem@example.test');

    expect(missing.body.data.kdfSalt).toHaveLength(String(readData(existing).kdfSalt).length);
  });

  it('recusa e-mail malformado', async () => {
    const response = await getParameters('nao-e-email');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('recusa parâmetro de query desconhecido', async () => {
    const response = await request(context.httpServer)
      .get(`/${API_PREFIX}/auth/parameters`)
      .query({ email: 'alice@example.test', debug: 'true' });

    expect(response.status).toBe(400);
  });
});
