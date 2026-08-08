import request from 'supertest';

import { API_PREFIX } from '@crypta/contracts';

import { ServerSecretService } from '@/modules/auth/services/server-secret.service';

import { resetDatabase } from '../support/database';
import { readData } from '../support/http';
import { createTestApp, type TestContext } from '../support/test-app';

/**
 * Login, rotação, reuso, logout e sessões, contra a aplicação e o MySQL reais.
 *
 * O que estes testes protegem, além do caminho feliz: que o bloqueio não vire
 * oráculo de enumeração, que a reutilização derrube a família, que a janela de
 * tolerância não derrube ninguém, e que a revogação tenha efeito imediato em vez
 * de esperar os 15 minutos do access token.
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

const AUTH_SECRET = 'BAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQ';
const WRONG_SECRET = 'CAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQ';
const EMAIL = 'alice@example.test';

describe('ciclo de sessão', () => {
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

  /**
   * Cria a conta direto pelo Prisma, com o verificador calculado pelo mesmo
   * serviço que a aplicação usa.
   *
   * Passar pelo `POST /setup` só funcionaria para a primeira conta — a segunda
   * receberia `SETUP_ALREADY_COMPLETED` — e deixaria uma sessão extra em toda a
   * suíte, tornando as contagens sobre login mais difíceis de ler do que o
   * comportamento que elas descrevem.
   */
  async function createAccount(email = EMAIL) {
    const serverSecret = context.app.get(ServerSecretService);

    await context.prisma.user.create({
      data: {
        name: 'Alice',
        email,
        authSecretHash: serverSecret.computeAuthSecretHash(Buffer.from(AUTH_SECRET, 'base64url')),
        authSecretVersion: serverSecret.currentVersion,
        keyBundle: { create: KEY_BUNDLE },
      },
    });
  }

  function login(overrides: { email?: string; authSecret?: string } = {}) {
    return request(context.httpServer)
      .post(`/${API_PREFIX}/auth/login`)
      .send({
        email: overrides.email ?? EMAIL,
        authSecret: overrides.authSecret ?? AUTH_SECRET,
      });
  }

  /** O cookie de refresh, extraído do `Set-Cookie` da resposta. */
  function refreshCookie(response: request.Response): string {
    const header = response.headers['set-cookie'];
    const cookies: unknown[] = Array.isArray(header) ? header : [header];
    const found = cookies.find(
      (cookie): cookie is string =>
        typeof cookie === 'string' && cookie.startsWith('refresh_token='),
    );

    if (found === undefined) {
      throw new Error('A resposta não trouxe o cookie de refresh.');
    }

    return found.split(';')[0] ?? '';
  }

  function postRefresh(cookie: string) {
    return request(context.httpServer).post(`/${API_PREFIX}/auth/refresh`).set('Cookie', cookie);
  }

  async function authenticate() {
    await createAccount();
    const response = await login();

    return {
      accessToken: String(readData(response).accessToken),
      cookie: refreshCookie(response),
    };
  }

  describe('POST /auth/login', () => {
    it('autentica e devolve perfil e access token', async () => {
      await createAccount();

      const response = await login();

      expect(response.status).toBe(200);
      expect(readData(response).user).toEqual({
        id: expect.stringMatching(/^[0-9a-f-]{36}$/),
        name: 'Alice',
        email: EMAIL,
      });
      expect(readData(response).expiresIn).toBe(900);
    });

    it('entrega o refresh em cookie HttpOnly, com os atributos do ADR 0021', async () => {
      await createAccount();

      const cookie = (await login()).headers['set-cookie'];
      const raw = (Array.isArray(cookie) ? cookie : [cookie]).join(';');

      expect(raw).toContain('HttpOnly');
      expect(raw).toContain('Secure');
      expect(raw).toContain('SameSite=Strict');
      expect(raw).toContain('Path=/api/v1/auth');
      expect(raw).not.toContain('Domain=');
    });

    it('não devolve o refresh token no corpo para a Web', async () => {
      await createAccount();

      const response = await login();

      expect(readData(response).refreshToken).toBeUndefined();
    });

    it('devolve o refresh no corpo para o Android, que não tem cookie', async () => {
      await createAccount();

      const response = await request(context.httpServer)
        .post(`/${API_PREFIX}/auth/login`)
        .set('x-client-type', 'android')
        .send({ email: EMAIL, authSecret: AUTH_SECRET });

      expect(typeof readData(response).refreshToken).toBe('string');
      expect(response.headers['set-cookie']).toBeUndefined();
    });

    it('recusa AuthSecret errado', async () => {
      await createAccount();

      const response = await login({ authSecret: WRONG_SECRET });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    /**
     * O item central: a resposta precisa ser indistinguível entre conta que não
     * existe e senha errada. Qualquer diferença aqui permite enumerar a base.
     */
    it('responde igual para conta inexistente e para senha errada', async () => {
      await createAccount();

      const wrongSecret = await login({ authSecret: WRONG_SECRET });
      const noAccount = await login({ email: 'ninguem@example.test' });

      expect(noAccount.status).toBe(wrongSecret.status);
      expect(noAccount.body.error.code).toBe(wrongSecret.body.error.code);
      expect(noAccount.body.error.message).toBe(wrongSecret.body.error.message);
    });

    it('não guarda o AuthSecret apresentado em lugar nenhum da resposta', async () => {
      await createAccount();

      const response = await login();

      expect(JSON.stringify(response.body)).not.toContain(AUTH_SECRET);
    });
  });

  describe('bloqueio progressivo', () => {
    it('bloqueia depois do limite de falhas consecutivas', async () => {
      await createAccount();

      for (let attempt = 0; attempt < 5; attempt += 1) {
        await login({ authSecret: WRONG_SECRET });
      }

      const user = await context.prisma.user.findFirstOrThrow({
        select: { failedLoginAttempts: true, lockedUntil: true },
      });

      expect(user.failedLoginAttempts).toBe(5);
      expect(user.lockedUntil).not.toBeNull();
    });

    /**
     * Enquanto o `AuthSecret` está errado, a conta bloqueada continua devolvendo
     * `INVALID_CREDENTIALS`. Devolver `ACCOUNT_LOCKED` aqui revelaria que o
     * e-mail está cadastrado.
     */
    it('não revela o bloqueio a quem não apresentou a credencial correta', async () => {
      await createAccount();

      for (let attempt = 0; attempt < 5; attempt += 1) {
        await login({ authSecret: WRONG_SECRET });
      }

      const response = await login({ authSecret: WRONG_SECRET });

      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    /** Com a credencial correta, o motivo pode aparecer: ele já sabe a senha. */
    it('revela o bloqueio a quem apresentou a credencial correta', async () => {
      await createAccount();

      for (let attempt = 0; attempt < 5; attempt += 1) {
        await login({ authSecret: WRONG_SECRET });
      }

      const response = await login();

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('ACCOUNT_LOCKED');
    });

    it('zera a contagem depois de um login bem-sucedido', async () => {
      await createAccount();

      await login({ authSecret: WRONG_SECRET });
      await login({ authSecret: WRONG_SECRET });
      await login();

      const user = await context.prisma.user.findFirstOrThrow({
        select: { failedLoginAttempts: true, lockedUntil: true },
      });

      expect(user.failedLoginAttempts).toBe(0);
      expect(user.lockedUntil).toBeNull();
    });

    it('não acumula falhas para e-mail inexistente, que não tem linha', async () => {
      await createAccount();

      await login({ email: 'ninguem@example.test' });

      const user = await context.prisma.user.findFirstOrThrow({
        select: { failedLoginAttempts: true },
      });

      expect(user.failedLoginAttempts).toBe(0);
    });
  });

  describe('POST /auth/refresh', () => {
    it('rotaciona e devolve um par novo', async () => {
      const { cookie } = await authenticate();

      const response = await postRefresh(cookie);

      expect(response.status).toBe(200);
      expect(typeof readData(response).accessToken).toBe('string');
      expect(refreshCookie(response)).not.toBe(cookie);
    });

    it('não devolve perfil no refresh', async () => {
      const { cookie } = await authenticate();

      expect(readData(await postRefresh(cookie)).user).toBeUndefined();
    });

    it('renova a inatividade numa rotação normal', async () => {
      const { cookie } = await authenticate();
      const before = await context.prisma.session.findFirstOrThrow({
        select: { lastUsedAt: true },
      });

      await postRefresh(cookie);

      const after = await context.prisma.session.findFirstOrThrow({ select: { lastUsedAt: true } });

      expect(after.lastUsedAt.getTime()).toBeGreaterThanOrEqual(before.lastUsedAt.getTime());
    });

    it('mantém a sessão e a família após uma rotação', async () => {
      const { cookie } = await authenticate();

      await postRefresh(cookie);

      await expect(context.prisma.session.count()).resolves.toBe(1);
    });

    it('recusa token desconhecido', async () => {
      await authenticate();

      const response = await postRefresh('refresh_token=nao-existe');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('TOKEN_INVALID');
    });

    it('recusa requisição sem cookie e sem corpo', async () => {
      await authenticate();

      const response = await request(context.httpServer).post(`/${API_PREFIX}/auth/refresh`);

      expect(response.status).toBe(401);
    });

    /**
     * Cookie tossing: um subdomínio irmão comprometido grava um `refresh_token`
     * de escopo mais amplo, e o navegador manda os dois. A ordem não é garantida
     * por especificação, então escolher um seria escolher no escuro (ADR 0021).
     */
    it('recusa a requisição que traz dois cookies refresh_token', async () => {
      const { cookie } = await authenticate();

      const response = await request(context.httpServer)
        .post(`/${API_PREFIX}/auth/refresh`)
        .set('Cookie', `${cookie}; refresh_token=intruso`);

      expect(response.status).toBe(401);
      // A sessão continua de pé: a requisição foi recusada, não a sessão revogada.
      await expect(context.prisma.session.count()).resolves.toBe(1);
    });
  });

  describe('detecção de reuso', () => {
    /**
     * Dentro da janela de 10 s o token anterior ainda serve: é o caso de duas
     * abas renovando ao mesmo tempo, e derrubar a sessão aqui seria falso
     * positivo. O par devolvido é novo, porque o servidor não guarda o token em
     * claro para repetir o anterior (ADR 0024).
     */
    it('aceita o token anterior dentro da janela de tolerância', async () => {
      const { cookie } = await authenticate();

      await postRefresh(cookie);
      const response = await postRefresh(cookie);

      expect(response.status).toBe(200);
      await expect(context.prisma.session.count()).resolves.toBe(1);
    });

    it('não estende a inatividade na rotação dentro da janela', async () => {
      const { cookie } = await authenticate();

      await postRefresh(cookie);
      const afterFirst = await context.prisma.session.findFirstOrThrow({
        select: { lastUsedAt: true },
      });

      await postRefresh(cookie);
      const afterGrace = await context.prisma.session.findFirstOrThrow({
        select: { lastUsedAt: true },
      });

      expect(afterGrace.lastUsedAt.getTime()).toBe(afterFirst.lastUsedAt.getTime());
    });

    it('derruba a família quando o token anterior volta fora da janela', async () => {
      const { cookie } = await authenticate();

      await postRefresh(cookie);

      // Envelhece a rotação para além dos 10 segundos, sem esperar de verdade.
      await context.prisma.session.updateMany({
        data: { rotatedAt: new Date(Date.now() - 60_000) },
      });

      const response = await postRefresh(cookie);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('SESSION_REVOKED');
      await expect(context.prisma.session.count()).resolves.toBe(0);
    });

    it('derruba apenas a família comprometida, não as demais sessões', async () => {
      await createAccount();

      const first = await login();
      const second = await login();

      await postRefresh(refreshCookie(first));
      await context.prisma.session.updateMany({
        where: { previousTokenHash: { not: null } },
        data: { rotatedAt: new Date(Date.now() - 60_000) },
      });

      await postRefresh(refreshCookie(first));

      const remaining = await context.prisma.session.findMany({ select: { id: true } });

      expect(remaining).toHaveLength(1);
      expect(readData(second).accessToken).toBeDefined();
    });
  });

  describe('prazos', () => {
    it('recusa sessão parada além do limite de inatividade', async () => {
      const { cookie } = await authenticate();

      await context.prisma.session.updateMany({
        data: { lastUsedAt: new Date(Date.now() - 8 * 24 * 3600 * 1000) },
      });

      const response = await postRefresh(cookie);

      expect(response.status).toBe(401);
      await expect(context.prisma.session.count()).resolves.toBe(0);
    });

    /** O teto absoluto conta da criação, e nenhuma rotação o estende. */
    it('recusa sessão além do teto absoluto, mesmo em uso', async () => {
      const { cookie } = await authenticate();

      await context.prisma.session.updateMany({
        data: {
          createdAt: new Date(Date.now() - 31 * 24 * 3600 * 1000),
          lastUsedAt: new Date(),
        },
      });

      const response = await postRefresh(cookie);

      expect(response.status).toBe(401);
    });
  });

  describe('rotas protegidas', () => {
    it('recusa requisição sem token', async () => {
      const response = await request(context.httpServer).get(`/${API_PREFIX}/sessions`);

      expect(response.status).toBe(401);
    });

    it('recusa token malformado', async () => {
      const response = await request(context.httpServer)
        .get(`/${API_PREFIX}/sessions`)
        .set('Authorization', 'Bearer nao-e-um-jwt');

      expect(response.status).toBe(401);
    });

    it('aceita o access token emitido no login', async () => {
      const { accessToken } = await authenticate();

      const response = await request(context.httpServer)
        .get(`/${API_PREFIX}/users/me`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(readData(response).email).toBe(EMAIL);
    });

    /**
     * A invariante que sustenta os 15 minutos do ADR 0021: revogar tem efeito
     * imediato, porque o guard consulta o `sid` a cada requisição.
     */
    it('recusa o access token no instante em que a sessão é revogada', async () => {
      const { accessToken } = await authenticate();

      await context.prisma.session.deleteMany({});

      const response = await request(context.httpServer)
        .get(`/${API_PREFIX}/users/me`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('SESSION_REVOKED');
    });

    it('devolve o key bundle com a chave privada cifrada', async () => {
      const { accessToken } = await authenticate();

      const response = await request(context.httpServer)
        .get(`/${API_PREFIX}/users/me/key-bundle`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(readData(response).encryptedPrivateKey).toBe(KEY_BUNDLE.encryptedPrivateKey);
      expect(readData(response).publicKey).toBe(KEY_BUNDLE.publicKey);
    });
  });

  describe('logout', () => {
    it('encerra a sessão atual e limpa o cookie', async () => {
      const { accessToken } = await authenticate();

      const response = await request(context.httpServer)
        .post(`/${API_PREFIX}/auth/logout`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(204);
      await expect(context.prisma.session.count()).resolves.toBe(0);
      expect(String(response.headers['set-cookie'])).toContain('refresh_token=;');
    });

    it('logout-all derruba todas as sessões, inclusive a atual', async () => {
      await createAccount();
      await login();
      const third = await login();

      const response = await request(context.httpServer)
        .post(`/${API_PREFIX}/auth/logout-all`)
        .set('Authorization', `Bearer ${String(readData(third).accessToken)}`);

      expect(response.status).toBe(204);
      await expect(context.prisma.session.count()).resolves.toBe(0);
    });
  });

  describe('GET e DELETE /sessions', () => {
    it('lista apenas as sessões do próprio usuário', async () => {
      await createAccount();
      await createAccount('bob@example.test');

      const alice = await login();
      await login({ email: 'bob@example.test' });

      const response = await request(context.httpServer)
        .get(`/${API_PREFIX}/sessions`)
        .set('Authorization', `Bearer ${String(readData(alice).accessToken)}`);

      const sessions = response.body.data as { isCurrent: boolean }[];

      expect(sessions).toHaveLength(1);
      expect(sessions.at(0)?.isCurrent).toBe(true);
    });

    it('marca qual sessão é a atual', async () => {
      await createAccount();
      await login();
      const second = await login();

      const response = await request(context.httpServer)
        .get(`/${API_PREFIX}/sessions`)
        .set('Authorization', `Bearer ${String(readData(second).accessToken)}`);

      const sessions = response.body.data as { isCurrent: boolean }[];

      expect(sessions).toHaveLength(2);
      expect(sessions.filter((session) => session.isCurrent)).toHaveLength(1);
    });

    it('revoga uma sessão do próprio usuário', async () => {
      await createAccount();
      const first = await login();
      const second = await login();

      const list = await request(context.httpServer)
        .get(`/${API_PREFIX}/sessions`)
        .set('Authorization', `Bearer ${String(readData(second).accessToken)}`);

      const target = (list.body.data as { id: string; isCurrent: boolean }[]).find(
        (session) => !session.isCurrent,
      );

      const response = await request(context.httpServer)
        .delete(`/${API_PREFIX}/sessions/${String(target?.id)}`)
        .set('Authorization', `Bearer ${String(readData(second).accessToken)}`);

      expect(response.status).toBe(204);
      await expect(context.prisma.session.count()).resolves.toBe(1);
      expect(readData(first).accessToken).toBeDefined();
    });

    /**
     * IDOR: `CLAUDE.md` secao 40 exige o teste com recurso de outro usuário. O
     * `404` é deliberado — um `403` confirmaria que a sessão existe.
     */
    it('não revoga sessão de outro usuário', async () => {
      await createAccount();
      await createAccount('bob@example.test');

      const alice = await login();
      const bob = await login({ email: 'bob@example.test' });

      const bobSessions = await request(context.httpServer)
        .get(`/${API_PREFIX}/sessions`)
        .set('Authorization', `Bearer ${String(readData(bob).accessToken)}`);

      const bobSessionId = (bobSessions.body.data as { id: string }[]).at(0)?.id;

      const response = await request(context.httpServer)
        .delete(`/${API_PREFIX}/sessions/${String(bobSessionId)}`)
        .set('Authorization', `Bearer ${String(readData(alice).accessToken)}`);

      expect(response.status).toBe(404);
      await expect(context.prisma.session.count()).resolves.toBe(2);
    });

    it('revoga as demais sessões, preservando a atual', async () => {
      await createAccount();
      await login();
      await login();
      const current = await login();

      const response = await request(context.httpServer)
        .delete(`/${API_PREFIX}/sessions`)
        .set('Authorization', `Bearer ${String(readData(current).accessToken)}`);

      expect(response.status).toBe(204);
      await expect(context.prisma.session.count()).resolves.toBe(1);
    });
  });
});
