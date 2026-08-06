import { describe, expect, it } from 'vitest';

import { displayNameSchema, emailSchema, httpUrlSchema, uuidSchema } from './common.schema';

describe('emailSchema', () => {
  it('normalizes case and surrounding whitespace', () => {
    expect(emailSchema.parse('  Alice@Example.Test  ')).toBe('alice@example.test');
  });

  it('rejects a value without a domain', () => {
    expect(emailSchema.safeParse('alice@').success).toBe(false);
  });

  it('rejects an address longer than the storage limit', () => {
    const oversized = `${'a'.repeat(250)}@example.test`;

    expect(emailSchema.safeParse(oversized).success).toBe(false);
  });
});

describe('displayNameSchema', () => {
  it('trims the value', () => {
    expect(displayNameSchema.parse('  Alice  ')).toBe('Alice');
  });

  it('rejects a value that is only whitespace', () => {
    expect(displayNameSchema.safeParse('   ').success).toBe(false);
  });
});

describe('httpUrlSchema', () => {
  it('accepts https', () => {
    expect(httpUrlSchema.parse('https://example.com/login')).toBe('https://example.com/login');
  });

  it('accepts http', () => {
    expect(httpUrlSchema.safeParse('http://example.com').success).toBe(true);
  });

  it('rejects javascript: so a stored link cannot become an XSS vector', () => {
    expect(httpUrlSchema.safeParse('javascript:alert(1)').success).toBe(false);
  });

  it('rejects data: URLs', () => {
    expect(httpUrlSchema.safeParse('data:text/html,<script>alert(1)</script>').success).toBe(false);
  });
});

describe('uuidSchema', () => {
  it('accepts a UUID', () => {
    expect(uuidSchema.safeParse('018f0000-0000-7000-8000-000000000001').success).toBe(true);
  });

  it('rejects a sequential identifier', () => {
    expect(uuidSchema.safeParse('1').success).toBe(false);
  });
});
