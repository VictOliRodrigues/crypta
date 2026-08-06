import { describe, expect, it } from 'vitest';

import { type ApiErrorResponse, isApiErrorResponse } from './envelope';

describe('isApiErrorResponse', () => {
  it('identifies a well formed error envelope', () => {
    const response: ApiErrorResponse = {
      error: {
        code: 'VERSION_CONFLICT',
        message: 'O registro foi alterado por outro usuário.',
        requestId: '018f0000-0000-7000-8000-000000000999',
        details: [{ field: 'expectedVersion', code: 'OUTDATED_VERSION' }],
      },
    };

    expect(isApiErrorResponse(response)).toBe(true);
  });

  it('does not treat a success envelope as an error', () => {
    expect(isApiErrorResponse({ data: { status: 'ok' } })).toBe(false);
  });

  it('rejects an error envelope without a code', () => {
    expect(isApiErrorResponse({ error: { message: 'falhou' } })).toBe(false);
  });

  it('rejects values that are not objects', () => {
    expect(isApiErrorResponse(null)).toBe(false);
    expect(isApiErrorResponse('error')).toBe(false);
    expect(isApiErrorResponse(undefined)).toBe(false);
  });
});
