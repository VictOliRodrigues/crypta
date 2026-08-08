import request from 'supertest';

import { API_PREFIX } from '@crypta/contracts';

import { createTestApp, type TestContext } from '../support/test-app';

/**
 * Primeiro spec do harness.
 *
 * Prova que a aplicação sobe com a configuração real e fala com o MySQL real,
 * antes de qualquer regra de negócio. Um harness que não é exercitado é um
 * harness que se descobre quebrado no dia em que ele importa.
 */
describe('GET /health', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await createTestApp();
  });

  afterAll(async () => {
    await context.close();
  });

  it('reporta liveness sem tocar no banco', async () => {
    const response = await request(context.httpServer).get(`/${API_PREFIX}/health/live`);

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('ok');
  });

  it('reporta readiness com o MySQL real respondendo', async () => {
    const response = await request(context.httpServer).get(`/${API_PREFIX}/health/ready`);

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ status: 'ready', database: 'ok' });
  });

  it('confirma que as migrations foram aplicadas neste banco', async () => {
    await expect(context.prisma.areMigrationsApplied()).resolves.toBe(true);
  });

  it('não expõe hostname, versão de dependência nem string de conexão', async () => {
    const response = await request(context.httpServer).get(`/${API_PREFIX}/health/ready`);

    expect(JSON.stringify(response.body)).not.toContain('mysql://');
    expect(JSON.stringify(response.body)).not.toContain('3306');
  });
});
