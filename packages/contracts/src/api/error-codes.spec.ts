import { describe, expect, it } from 'vitest';

import { API_ERROR_CODES, isApiErrorCode } from './error-codes';

describe('isApiErrorCode', () => {
  it('accepts every documented global error code', () => {
    for (const code of API_ERROR_CODES) {
      expect(isApiErrorCode(code)).toBe(true);
    }
  });

  it('rejects an unknown code so clients fail closed', () => {
    expect(isApiErrorCode('SOMETHING_ELSE')).toBe(false);
  });

  it('rejects non-string values', () => {
    expect(isApiErrorCode(undefined)).toBe(false);
    expect(isApiErrorCode(null)).toBe(false);
    expect(isApiErrorCode(42)).toBe(false);
  });

  it('does not contain duplicated codes', () => {
    expect(new Set(API_ERROR_CODES).size).toBe(API_ERROR_CODES.length);
  });
});
