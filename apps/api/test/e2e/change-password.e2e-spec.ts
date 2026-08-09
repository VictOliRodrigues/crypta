import request from 'supertest';

import { API_PREFIX } from '@crypta/contracts';

import { ServerSecretService } from '@/modules/auth/services/server-secret.service';

import { resetDatabase } from '../support/database';
import { readData } from '../support/http';
import { createTestApp, type TestContext } from '../support/test-app';

/**
 * `POST /users/me/change-password`, contra a aplicação e o MySQL reais.
 *
 * O que estes testes protegem, além do caminho feliz:
 *
 * 1. a senha nunca aparece no corpo — o que trafega são dois `AuthSecret`;
 * 2. um access token roubado, sozinho, não troca a senha;
 * 3. o par de chaves não muda, porque é o endereço de todo envelope existente;
 * 4. as duas escritas são atômicas: nenhuma recusa pode deixar metade gravada.
 */

const EMAIL = 'alice@example.test';
const OTHER_EMAIL = 'bob@example.test';

/** 32 bytes em base64url, o tamanho que o ADR 0022 exige do `AuthSecret`. */
const CURRENT_AUTH_SECRET = 'BAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQ';
const NEW_AUTH_SECRET = 'BQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQU';

const PUBLIC_KEY = 'AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE';

/** Bem formado. A API valida estrutura, nunca conteúdo (docs/API.md secao 20). */
const KEY_BUNDLE = {
  kdfAlgorithm: 'ARGON2ID',
  kdfVersion: 1,
  kdfSalt: 'AQIDBAUGBwgJCgsMDQ4PEA',
  kdfMemory: 65536,
  kdfIterations: 3,
  kdfParallelism: 1,
  publicKey: PUBLIC_KEY,
  encryptedPrivateKey: 'AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC',
  privateKeyNonce: 'AwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD',
  cryptoVersion: 1,
  schemaVersion: 1,
};

/**
 * O bundle que a Web produziria depois de reproteger o par.
 *
 * Mesma chave pública — é o mesmo par —, salt novo e ciphertext novo, porque a
 * `UserEncryptionKey` mudou.
 */
const NEW_KEY_BUNDLE = {
  ...KEY_BUNDLE,
  kdfSalt: 'EA8ODQwLCgkIBwYFBAMCAQ',
  encryptedPrivateKey: 'BAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE',
  privateKeyNonce: 'BQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUF',
};

describe('change password', () => {
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

  async function createAccount(email = EMAIL): Promise<void> {
    const serverSecret = context.app.get(ServerSecretService);

    await context.prisma.user.create({
      data: {
        name: 'Alice',
        email,
        authSecretHash: serverSecret.computeAuthSecretHash(
          Buffer.from(CURRENT_AUTH_SECRET, 'base64url'),
        ),
        authSecretVersion: serverSecret.currentVersion,
        keyBundle: { create: KEY_BUNDLE },
      },
    });
  }

  function login(email = EMAIL, authSecret = CURRENT_AUTH_SECRET) {
    return request(context.httpServer)
      .post(`/${API_PREFIX}/auth/login`)
      .send({ email, authSecret });
  }

  async function authenticate(email = EMAIL): Promise<string> {
    const response = await login(email);

    return String(readData(response).accessToken);
  }

  function postChangePassword(accessToken: string, body: object) {
    return request(context.httpServer)
      .post(`/${API_PREFIX}/users/me/change-password`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(body);
  }

  const VALID_BODY = {
    currentAuthSecret: CURRENT_AUTH_SECRET,
    newAuthSecret: NEW_AUTH_SECRET,
    newKeyBundle: NEW_KEY_BUNDLE,
  };

  describe('autorização', () => {
    it('recusa requisição sem token', async () => {
      await createAccount();

      await request(context.httpServer)
        .post(`/${API_PREFIX}/users/me/change-password`)
        .send(VALID_BODY)
        .expect(401);
    });

    /**
     * `SECURITY.md` secao 27: não permitir a troca só com um access token.
     *
     * Um token roubado dá a sessão. Deixá-lo trocar a senha daria a conta, e o
     * dono perderia o acesso sem nunca ter errado nada.
     */
    it('recusa quem tem o token mas não a senha atual', async () => {
      await createAccount();
      const accessToken = await authenticate();

      const response = await postChangePassword(accessToken, {
        ...VALID_BODY,
        currentAuthSecret: 'CQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQk',
      }).expect(401);

      expect(response.body.error.code).toBe('CURRENT_CREDENTIAL_INVALID');
    });

    it('não deixa metade gravada quando a senha atual está errada', async () => {
      await createAccount();
      const accessToken = await authenticate();

      await postChangePassword(accessToken, {
        ...VALID_BODY,
        currentAuthSecret: 'CQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQk',
      }).expect(401);

      const bundle = await context.prisma.userKeyBundle.findFirst({
        select: { kdfSalt: true, encryptedPrivateKey: true },
      });

      expect(bundle?.kdfSalt).toBe(KEY_BUNDLE.kdfSalt);
      expect(bundle?.encryptedPrivateKey).toBe(KEY_BUNDLE.encryptedPrivateKey);
    });
  });

  describe('validação do corpo', () => {
    it('recusa um campo password em texto aberto, em vez de ignorá-lo', async () => {
      await createAccount();
      const accessToken = await authenticate();

      await postChangePassword(accessToken, {
        ...VALID_BODY,
        password: 'senha-em-texto-aberto',
      }).expect(400);
    });

    it('recusa um privateKey em texto aberto dentro do bundle', async () => {
      await createAccount();
      const accessToken = await authenticate();

      await postChangePassword(accessToken, {
        ...VALID_BODY,
        newKeyBundle: { ...NEW_KEY_BUNDLE, privateKey: 'AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE' },
      }).expect(400);
    });

    /**
     * A chave pública é o endereço para o qual todo `VaultKeyEnvelope` foi
     * selado. Aceitar uma nova tornaria ilegível tudo o que o usuário tem, e o
     * estrago só apareceria na próxima abertura — depois do commit.
     */
    it('recusa a troca da chave pública', async () => {
      await createAccount();
      const accessToken = await authenticate();

      const response = await postChangePassword(accessToken, {
        ...VALID_BODY,
        newKeyBundle: {
          ...NEW_KEY_BUNDLE,
          publicKey: 'AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI',
        },
      }).expect(409);

      expect(response.body.error.code).toBe('PUBLIC_KEY_CHANGE_NOT_ALLOWED');
    });

    /**
     * Salt repetido faria a senha nova derivar sob o mesmo material da antiga,
     * e uma tabela pré-computada contra aquele salt continuaria valendo.
     */
    it('recusa um bundle que reaproveita o salt atual', async () => {
      await createAccount();
      const accessToken = await authenticate();

      const response = await postChangePassword(accessToken, {
        ...VALID_BODY,
        newKeyBundle: { ...NEW_KEY_BUNDLE, kdfSalt: KEY_BUNDLE.kdfSalt },
      }).expect(400);

      expect(response.body.error.code).toBe('INVALID_KEY_BUNDLE');
    });
  });

  describe('efeito da troca', () => {
    it('devolve 204 e grava o bundle novo', async () => {
      await createAccount();
      const accessToken = await authenticate();

      await postChangePassword(accessToken, VALID_BODY).expect(204);

      const bundle = await context.prisma.userKeyBundle.findFirst({
        select: { kdfSalt: true, encryptedPrivateKey: true, publicKey: true },
      });

      expect(bundle?.kdfSalt).toBe(NEW_KEY_BUNDLE.kdfSalt);
      expect(bundle?.encryptedPrivateKey).toBe(NEW_KEY_BUNDLE.encryptedPrivateKey);
      expect(bundle?.publicKey).toBe(PUBLIC_KEY);
    });

    it('o AuthSecret antigo deixa de autenticar', async () => {
      await createAccount();
      const accessToken = await authenticate();

      await postChangePassword(accessToken, VALID_BODY).expect(204);

      await login(EMAIL, CURRENT_AUTH_SECRET).expect(401);
    });

    it('o AuthSecret novo autentica', async () => {
      await createAccount();
      const accessToken = await authenticate();

      await postChangePassword(accessToken, VALID_BODY).expect(204);

      await login(EMAIL, NEW_AUTH_SECRET).expect(200);
    });

    it('os parâmetros KDF publicados passam a ser os novos', async () => {
      await createAccount();
      const accessToken = await authenticate();

      await postChangePassword(accessToken, VALID_BODY).expect(204);

      const response = await request(context.httpServer)
        .get(`/${API_PREFIX}/auth/parameters`)
        .query({ email: EMAIL })
        .expect(200);

      expect(readData(response).kdfSalt).toBe(NEW_KEY_BUNDLE.kdfSalt);
    });

    it('a sessão que fez a troca continua valendo', async () => {
      await createAccount();
      const accessToken = await authenticate();

      await postChangePassword(accessToken, VALID_BODY).expect(204);

      await request(context.httpServer)
        .get(`/${API_PREFIX}/users/me`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('as demais sessões do usuário caem', async () => {
      await createAccount();
      const doomed = await authenticate();
      const current = await authenticate();

      await postChangePassword(current, VALID_BODY).expect(204);

      await request(context.httpServer)
        .get(`/${API_PREFIX}/users/me`)
        .set('Authorization', `Bearer ${doomed}`)
        .expect(401);
    });

    it('preserva as demais sessões quando revokeOtherSessions é false', async () => {
      await createAccount();
      const spared = await authenticate();
      const current = await authenticate();

      await postChangePassword(current, { ...VALID_BODY, revokeOtherSessions: false }).expect(204);

      await request(context.httpServer)
        .get(`/${API_PREFIX}/users/me`)
        .set('Authorization', `Bearer ${spared}`)
        .expect(200);
    });

    it('não toca nas sessões de outro usuário', async () => {
      await createAccount();
      await createAccount(OTHER_EMAIL);

      const intruderView = await authenticate(OTHER_EMAIL);
      const current = await authenticate();

      await postChangePassword(current, VALID_BODY).expect(204);

      await request(context.httpServer)
        .get(`/${API_PREFIX}/users/me`)
        .set('Authorization', `Bearer ${intruderView}`)
        .expect(200);
    });

    it('não toca na credencial de outro usuário', async () => {
      await createAccount();
      await createAccount(OTHER_EMAIL);

      const accessToken = await authenticate();

      await postChangePassword(accessToken, VALID_BODY).expect(204);

      await login(OTHER_EMAIL, CURRENT_AUTH_SECRET).expect(200);
    });

    it('não devolve nenhum AuthSecret na resposta', async () => {
      await createAccount();
      const accessToken = await authenticate();

      const response = await postChangePassword(accessToken, VALID_BODY).expect(204);
      const serialized = JSON.stringify(response.body) + JSON.stringify(response.headers);

      expect(serialized).not.toContain(CURRENT_AUTH_SECRET);
      expect(serialized).not.toContain(NEW_AUTH_SECRET);
    });

    /**
     * O bloqueio por tentativas é zerado.
     *
     * Quem apresentou a credencial atual provou ser o dono. Manter a contagem
     * puniria a vítima justamente pelo ataque que ela acabou de responder.
     */
    it('zera o bloqueio em curso', async () => {
      await createAccount();
      const accessToken = await authenticate();

      await context.prisma.user.update({
        where: { email: EMAIL },
        data: { failedLoginAttempts: 4, lockedUntil: new Date(Date.now() + 600_000) },
      });

      await postChangePassword(accessToken, VALID_BODY).expect(204);

      const user = await context.prisma.user.findUnique({
        where: { email: EMAIL },
        select: { failedLoginAttempts: true, lockedUntil: true },
      });

      expect(user?.failedLoginAttempts).toBe(0);
      expect(user?.lockedUntil).toBeNull();
    });
  });
});
