import { describe, it, expect } from 'vitest';
import { isOriginAllowed } from '../src/core/corsConfig';

describe('Security: CORS Whitelist Validation', () => {
  it('strictly rejects wildcard origin *', () => {
    expect(isOriginAllowed('*')).toBe(false);
  });

  it('rejects unauthorized third-party origins', () => {
    expect(isOriginAllowed('http://malicious-attacker.com')).toBe(false);
    expect(isOriginAllowed('https://evil-site.org')).toBe(false);
  });

  it('allows verified local development ports', () => {
    expect(isOriginAllowed('http://localhost:3000')).toBe(true);
    expect(isOriginAllowed('http://127.0.0.1:3000')).toBe(true);
    expect(isOriginAllowed('http://localhost:4173')).toBe(true);
  });

  it('allows production domains and environment whitelist', () => {
    expect(isOriginAllowed('https://omnidash.internal')).toBe(true);
  });
});
