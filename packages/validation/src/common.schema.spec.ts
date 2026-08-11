import { describe, expect, it } from 'vitest';

import {
  displayNameSchema,
  emailSchema,
  httpUrlSchema,
  uuidSchema,
  uuidV7Schema,
} from './common.schema';

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

describe('uuidV7Schema', () => {
  it('aceita um UUIDv7', () => {
    expect(uuidV7Schema.safeParse('0198e4c1-7f3a-7bcd-8f01-2c4a6b8d0e12').success).toBe(true);
  });

  /**
   * O formato precisa ser o mesmo que o Prisma produz nas demais tabelas. Um
   * v4 passaria por `uuidSchema` e entraria como id de origem desconhecida.
   */
  it('recusa outras versões de UUID', () => {
    expect(uuidV7Schema.safeParse('9f1b2c3d-4e5f-4a6b-8c9d-0e1f2a3b4c5d').success).toBe(false);
    expect(uuidSchema.safeParse('9f1b2c3d-4e5f-4a6b-8c9d-0e1f2a3b4c5d').success).toBe(true);
  });

  it('recusa texto que não é UUID', () => {
    for (const value of ['', 'cofre-1', '0198e4c17f3a7bcd8f012c4a6b8d0e12']) {
      expect(uuidV7Schema.safeParse(value).success).toBe(false);
    }
  });
});
