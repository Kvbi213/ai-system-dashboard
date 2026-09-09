import { describe, it, expect } from 'vitest';
import { detectTargetType } from '../modules/osint.js';

describe('OSINT Target Detection & Classifier Engine', () => {
  it('should accurately detect IPv4 addresses', () => {
    const res1 = detectTargetType('192.168.1.1');
    expect(res1.type).toBe('ip');
    expect(res1.value).toBe('192.168.1.1');

    const res2 = detectTargetType('8.8.8.8');
    expect(res2.type).toBe('ip');
    expect(res2.value).toBe('8.8.8.8');

    const res3 = detectTargetType('  1.1.1.1  ');
    expect(res3.type).toBe('ip');
    expect(res3.value).toBe('1.1.1.1');
  });

  it('should accurately detect domain names and subdomains', () => {
    const res1 = detectTargetType('github.com');
    expect(res1.type).toBe('domain');
    expect(res1.value).toBe('github.com');

    const res2 = detectTargetType('void-potato-7721.web.app');
    expect(res2.type).toBe('domain');
    expect(res2.value).toBe('void-potato-7721.web.app');

    const res3 = detectTargetType('portal.szkola.edu.pl');
    expect(res3.type).toBe('domain');
    expect(res3.value).toBe('portal.szkola.edu.pl');
  });

  it('should accurately detect MAC addresses with colons or hyphens', () => {
    const res1 = detectTargetType('00:1A:2B:3C:4D:5E');
    expect(res1.type).toBe('mac');
    expect(res1.value).toBe('00:1A:2B:3C:4D:5E');

    const res2 = detectTargetType('A1-B2-C3-D4-E5-F6');
    expect(res2.type).toBe('mac');
    expect(res2.value).toBe('A1-B2-C3-D4-E5-F6');
  });

  it('should accurately detect email addresses', () => {
    const res1 = detectTargetType('marektowarek21372137@gmail.com');
    expect(res1.type).toBe('email');
    expect(res1.value).toBe('marektowarek21372137@gmail.com');

    const res2 = detectTargetType('security@system.io');
    expect(res2.type).toBe('email');
    expect(res2.value).toBe('security@system.io');
  });

  it('should fallback to string type for keywords and unrecognized inputs', () => {
    const res1 = detectTargetType('analiza_systemu');
    expect(res1.type).toBe('string');
    expect(res1.value).toBe('analiza_systemu');

    const res2 = detectTargetType('SHA256_HASH_DUMMY');
    expect(res2.type).toBe('string');
  });
});
