import axios, { type AxiosInstance } from 'axios';
import { beforeEach, describe, expect, it } from 'vitest';

import { type AuthBridge, installAuthInterceptors } from './api-client';

/**
 * Fila de refresh do cliente HTTP (CLAUDE.md secao 24).
 *
 * O item que estes testes protegem é o central: **um único refresh em voo**.
 * Sem ele, uma tela que carrega cinco recursos com o token expirado dispara
 * cinco rotações concorrentes da mesma sessão.
 *
 * O adapter do axios é substituído em vez de a rede ser interceptada: assim o
 * teste conta exatamente quantas requisições saíram, e para onde.
 */

type RecordedRequest = {
  url: string;
  headers: Record<string, unknown>;
};

/**
 * Cliente com adapter controlado.
 *
 * `respond` decide o status de cada requisição pela URL e pela ordem, o que
 * permite montar o cenário de "expira, renova, repete" sem timers.
 */
function buildClient(respond: (request: RecordedRequest, callIndex: number) => number): {
  client: AxiosInstance;
  requests: RecordedRequest[];
} {
  const requests: RecordedRequest[] = [];

  const client = axios.create({ baseURL: 'http://api.test' });

  client.defaults.adapter = (config) => {
    const request: RecordedRequest = {
      url: config.url ?? '',
      headers: { ...config.headers },
    };

    requests.push(request);

    const status = respond(request, requests.length - 1);

    const response = {
      data: status === 200 ? { data: { accessToken: 'token-renovado' } } : { error: {} },
      status,
      statusText: '',
      headers: {},
      config,
    };

    if (status >= 400) {
      return Promise.reject(
        Object.assign(new axios.AxiosError('falhou', undefined, config, {}, response), {
          isAxiosError: true,
        }),
      );
    }

    return Promise.resolve(response);
  };

  return { client, requests };
}

function buildBridge(initialToken: string | null = 'token-inicial'): AuthBridge & {
  tokens: string[];
  lostCount: number;
} {
  let token = initialToken;
  const tokens: string[] = [];
  const state = { lostCount: 0 };

  return {
    tokens,
    get lostCount() {
      return state.lostCount;
    },
    getAccessToken: () => token,
    setAccessToken: (value: string) => {
      token = value;
      tokens.push(value);
    },
    onSessionLost: () => {
      token = null;
      state.lostCount += 1;
    },
  };
}

describe('interceptor de autenticação', () => {
  let uninstall: (() => void) | null = null;

  beforeEach(() => {
    uninstall?.();
    uninstall = null;
  });

  it('anexa o access token em memória a cada requisição', async () => {
    const { client, requests } = buildClient(() => 200);
    uninstall = installAuthInterceptors(client, buildBridge());

    await client.get('/vaults');

    expect(requests.at(0)?.headers.Authorization).toBe('Bearer token-inicial');
  });

  it('não anexa nada quando não há sessão', async () => {
    const { client, requests } = buildClient(() => 200);
    uninstall = installAuthInterceptors(client, buildBridge(null));

    await client.get('/setup/status');

    expect(requests.at(0)?.headers.Authorization).toBeUndefined();
  });

  it('renova e repete a requisição após um 401', async () => {
    const { client, requests } = buildClient((request, index) => {
      if (request.url === '/auth/refresh') {
        return 200;
      }

      return index === 0 ? 401 : 200;
    });

    const bridge = buildBridge();
    uninstall = installAuthInterceptors(client, bridge);

    const response = await client.get('/vaults');

    expect(response.status).toBe(200);
    expect(requests.map((entry) => entry.url)).toEqual(['/vaults', '/auth/refresh', '/vaults']);
    expect(bridge.tokens).toEqual(['token-renovado']);
  });

  it('usa o token novo na requisição repetida', async () => {
    const { client, requests } = buildClient((request, index) =>
      request.url === '/auth/refresh' || index > 0 ? 200 : 401,
    );

    uninstall = installAuthInterceptors(client, buildBridge());

    await client.get('/vaults');

    expect(requests.at(2)?.headers.Authorization).toBe('Bearer token-renovado');
  });

  /**
   * O caso que a fila existe para resolver: cinco requisições recebem `401` ao
   * mesmo tempo e apenas **um** refresh sai.
   */
  it('dispara exatamente um refresh para N requisições concorrentes em 401', async () => {
    const failed = new Set<string>();

    const { client, requests } = buildClient((request) => {
      if (request.url === '/auth/refresh') {
        return 200;
      }

      if (failed.has(request.url)) {
        return 200;
      }

      failed.add(request.url);

      return 401;
    });

    uninstall = installAuthInterceptors(client, buildBridge());

    await Promise.all([
      client.get('/vaults'),
      client.get('/sites'),
      client.get('/credentials'),
      client.get('/sessions'),
      client.get('/users/me'),
    ]);

    const refreshCalls = requests.filter((entry) => entry.url === '/auth/refresh');

    expect(refreshCalls).toHaveLength(1);
  });

  it('repete todas as requisições que aguardaram o mesmo refresh', async () => {
    const failed = new Set<string>();

    const { client, requests } = buildClient((request) => {
      if (request.url === '/auth/refresh') {
        return 200;
      }

      if (failed.has(request.url)) {
        return 200;
      }

      failed.add(request.url);

      return 401;
    });

    uninstall = installAuthInterceptors(client, buildBridge());

    const responses = await Promise.all([client.get('/vaults'), client.get('/sites')]);

    expect(responses.map((response) => response.status)).toEqual([200, 200]);
    expect(requests.filter((entry) => entry.url === '/vaults')).toHaveLength(2);
    expect(requests.filter((entry) => entry.url === '/sites')).toHaveLength(2);
  });

  it('permite um refresh novo depois que o anterior terminou', async () => {
    let failNext = true;

    const { client, requests } = buildClient((request) => {
      if (request.url === '/auth/refresh') {
        return 200;
      }

      if (failNext) {
        failNext = false;
        return 401;
      }

      return 200;
    });

    uninstall = installAuthInterceptors(client, buildBridge());

    await client.get('/vaults');
    failNext = true;
    await client.get('/vaults');

    expect(requests.filter((entry) => entry.url === '/auth/refresh')).toHaveLength(2);
  });

  /**
   * Sem isto, um `401` no próprio refresh dispararia outro refresh, e assim por
   * diante.
   */
  it('não tenta renovar quando o próprio refresh devolve 401', async () => {
    const { client, requests } = buildClient(() => 401);
    const bridge = buildBridge();
    uninstall = installAuthInterceptors(client, bridge);

    await expect(client.post('/auth/refresh')).rejects.toThrow();

    expect(requests).toHaveLength(1);
  });

  it('não tenta renovar quando o login devolve 401', async () => {
    const { client, requests } = buildClient(() => 401);
    uninstall = installAuthInterceptors(client, buildBridge());

    await expect(client.post('/auth/login')).rejects.toThrow();

    expect(requests.map((entry) => entry.url)).toEqual(['/auth/login']);
  });

  it('desiste e reporta perda de sessão quando a renovação falha', async () => {
    const { client, requests } = buildClient(() => 401);
    const bridge = buildBridge();
    uninstall = installAuthInterceptors(client, bridge);

    await expect(client.get('/vaults')).rejects.toThrow();

    expect(requests.map((entry) => entry.url)).toEqual(['/vaults', '/auth/refresh']);
    expect(bridge.lostCount).toBe(1);
  });

  it('não repete a mesma requisição mais de uma vez', async () => {
    const { client, requests } = buildClient((request) =>
      request.url === '/auth/refresh' ? 200 : 401,
    );

    uninstall = installAuthInterceptors(client, buildBridge());

    await expect(client.get('/vaults')).rejects.toThrow();

    expect(requests.filter((entry) => entry.url === '/vaults')).toHaveLength(2);
    expect(requests.filter((entry) => entry.url === '/auth/refresh')).toHaveLength(1);
  });

  it('não interfere em erro que não seja 401', async () => {
    const { client, requests } = buildClient(() => 500);
    const bridge = buildBridge();
    uninstall = installAuthInterceptors(client, bridge);

    await expect(client.get('/vaults')).rejects.toThrow();

    expect(requests).toHaveLength(1);
    expect(bridge.lostCount).toBe(0);
  });

  it('para de agir depois de desinstalado', async () => {
    const { client, requests } = buildClient(() => 401);
    const bridge = buildBridge();
    const remove = installAuthInterceptors(client, bridge);

    remove();

    await expect(client.get('/vaults')).rejects.toThrow();

    expect(requests).toHaveLength(1);
    expect(bridge.lostCount).toBe(0);
  });

  it('não guarda o token em storage do navegador', async () => {
    const { client } = buildClient(() => 200);
    uninstall = installAuthInterceptors(client, buildBridge());

    await client.get('/vaults');

    // O eslint já proíbe `localStorage` e `sessionStorage` no código da Web; o
    // teste confirma que nenhuma dependência os usou por baixo.
    expect(Object.keys(globalThis.localStorage ?? {})).toHaveLength(0);
    expect(Object.keys(globalThis.sessionStorage ?? {})).toHaveLength(0);
  });
});
