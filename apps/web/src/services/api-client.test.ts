import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';

import { ApiRequestError, normalizeApiError } from './api-client';

function buildAxiosError(status: number, data: unknown, headers: Record<string, string> = {}) {
  const error = new AxiosError('Request failed with status code ' + String(status));

  error.response = {
    status,
    statusText: '',
    data,
    headers: new AxiosHeaders(headers),
    config: { headers: new AxiosHeaders() },
  };

  return error;
}

describe('normalizeApiError', () => {
  it('preserves the API error code, public message and requestId', () => {
    const error = normalizeApiError(
      buildAxiosError(409, {
        error: {
          code: 'VERSION_CONFLICT',
          message: 'O registro foi alterado por outro usuário.',
          requestId: 'req-1',
          details: [],
        },
      }),
    );

    expect(error).toBeInstanceOf(ApiRequestError);
    expect(error.code).toBe('VERSION_CONFLICT');
    expect(error.userMessage).toBe('O registro foi alterado por outro usuário.');
    expect(error.requestId).toBe('req-1');
    expect(error.status).toBe(409);
  });

  it('falls back to a generic message when the body is not an API error envelope', () => {
    const error = normalizeApiError(buildAxiosError(502, '<html>Bad Gateway</html>'));

    expect(error.code).toBe('INTERNAL_ERROR');
    expect(error.userMessage).toBe('Não foi possível concluir a operação.');
  });

  it('does not leak the raw response body into the user message', () => {
    const error = normalizeApiError(buildAxiosError(500, { stack: 'at PrismaService.connect' }));

    expect(error.userMessage).not.toContain('Prisma');
  });

  it('reads the requestId from the response header when the body has none', () => {
    const error = normalizeApiError(buildAxiosError(500, 'boom', { 'x-request-id': 'req-header' }));

    expect(error.requestId).toBe('req-header');
  });

  it('reports a network failure when there is no response', () => {
    const error = normalizeApiError(new AxiosError('Network Error'));

    expect(error.code).toBe('NETWORK_ERROR');
    expect(error.userMessage).toContain('conexão');
  });

  it('handles a non-axios throwable', () => {
    const error = normalizeApiError(new Error('unexpected'));

    expect(error.code).toBe('INTERNAL_ERROR');
    expect(error.userMessage).toBe('Não foi possível concluir a operação.');
  });
});
