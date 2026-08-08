import { type Response } from 'supertest';

/**
 * Leitura tipada do corpo de uma resposta.
 *
 * `response.body` é `any` no supertest. As asserções diretas funcionam porque o
 * Jest aceita `any`, mas operações como `Object.keys` propagam o `any` e caem no
 * `no-unsafe-argument`. Resolver aqui, uma vez, evita anotação espalhada e
 * mantém a regra ligada — que é o que impede um `any` de verdade de passar
 * despercebido nas specs.
 */
export function readData(response: Response): Record<string, unknown> {
  const body: unknown = response.body;

  if (typeof body !== 'object' || body === null || !('data' in body)) {
    throw new Error('A resposta não tem o envelope `data` que a docs/API.md secao 7 define.');
  }

  const { data } = body;

  if (typeof data !== 'object' || data === null) {
    throw new Error('O campo `data` não é um objeto.');
  }

  return data as Record<string, unknown>;
}
