import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { googleAuthService, GoogleAuthError } from '../src/domains/auth/googleAuthService';

describe('Google Auth Service (Public Google Identity API)', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('verifyGoogleIdToken', () => {
    it('throws MISSING_TOKEN when idToken is empty or whitespace', async () => {
      await expect(googleAuthService.verifyGoogleIdToken('')).rejects.toThrow(GoogleAuthError);
      await expect(googleAuthService.verifyGoogleIdToken('   ')).rejects.toThrow('Brakujący lub pusty token ID Google');
    });

    it('verifies valid Google ID token successfully against public tokeninfo', async () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const mockGoogleResponse = {
        iss: 'https://accounts.google.com',
        sub: '109876543210987654321',
        aud: 'test-client-id.apps.googleusercontent.com',
        email: 'operator@gmail.com',
        email_verified: 'true',
        name: 'Jan Kowalski',
        picture: 'https://lh3.googleusercontent.com/a/test-avatar',
        given_name: 'Jan',
        family_name: 'Kowalski',
        exp: String(futureExp)
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockGoogleResponse
      } as any);

      const result = await googleAuthService.verifyGoogleIdToken(
        'valid-mock-jwt-token',
        'test-client-id.apps.googleusercontent.com'
      );

      expect(result.email).toBe('operator@gmail.com');
      expect(result.sub).toBe('109876543210987654321');
      expect(result.emailVerified).toBe(true);
      expect(result.name).toBe('Jan Kowalski');
      expect(result.aud).toBe('test-client-id.apps.googleusercontent.com');
      expect(result.exp).toBe(futureExp);
    });

    it('rejects token when Google returns 400 Bad Request (invalid token)', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({
          error: 'invalid_token',
          error_description: 'Invalid Value'
        })
      } as any);

      await expect(
        googleAuthService.verifyGoogleIdToken('invalid-token')
      ).rejects.toThrow('Weryfikacja tokena Google nie powiodła się: Invalid Value');
    });

    it('rejects token from untrusted issuer (not accounts.google.com)', async () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          iss: 'https://fake-accounts.attacker.com',
          sub: '12345',
          email: 'victim@gmail.com',
          email_verified: 'true',
          exp: String(futureExp)
        })
      } as any);

      await expect(
        googleAuthService.verifyGoogleIdToken('token-with-bad-issuer')
      ).rejects.toThrow('Nieprawidłowy wystawca tokena Google');
    });

    it('rejects token if email is not verified', async () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          iss: 'accounts.google.com',
          sub: '12345',
          email: 'unverified@gmail.com',
          email_verified: 'false',
          exp: String(futureExp)
        })
      } as any);

      await expect(
        googleAuthService.verifyGoogleIdToken('unverified-email-token')
      ).rejects.toThrow('Adres e-mail powiązany z kontem Google nie jest zweryfikowany');
    });

    it('rejects expired Google token', async () => {
      const pastExp = Math.floor(Date.now() / 1000) - 60; // 1 minute ago
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          iss: 'https://accounts.google.com',
          sub: '12345',
          email: 'expired@gmail.com',
          email_verified: 'true',
          exp: String(pastExp)
        })
      } as any);

      await expect(
        googleAuthService.verifyGoogleIdToken('expired-token')
      ).rejects.toThrow('Token ID Google utracił ważność');
    });

    it('rejects token with audience mismatch', async () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          iss: 'https://accounts.google.com',
          sub: '12345',
          aud: 'rogue-app.apps.googleusercontent.com',
          email: 'user@gmail.com',
          email_verified: 'true',
          exp: String(futureExp)
        })
      } as any);

      await expect(
        googleAuthService.verifyGoogleIdToken(
          'token-with-other-aud',
          'expected-app.apps.googleusercontent.com'
        )
      ).rejects.toThrow('Niezgodność identyfikatora aplikacji (aud');
    });
  });

  describe('verifyGoogleAccessToken & fetchGoogleUserInfo', () => {
    it('verifies access token through tokeninfo', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          sub: '987654321',
          email: 'test@gmail.com',
          email_verified: true,
          scope: 'https://mail.google.com/',
          expires_in: '3599'
        })
      } as any);

      const result = await googleAuthService.verifyGoogleAccessToken('mock-access-token');
      expect(result.email).toBe('test@gmail.com');
      expect(result.emailVerified).toBe(true);
      expect(result.expiresIn).toBe(3599);
    });

    it('fetches user info from Google v3 userinfo endpoint', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          sub: 'user-sub-123',
          name: 'Jan Testowy',
          email: 'jan.test@gmail.com',
          email_verified: true,
          picture: 'https://avatar.url/123.jpg'
        })
      } as any);

      const user = await googleAuthService.fetchGoogleUserInfo('valid-access-token');
      expect(user.sub).toBe('user-sub-123');
      expect(user.email).toBe('jan.test@gmail.com');
      expect(user.name).toBe('Jan Testowy');
      expect(user.picture).toBe('https://avatar.url/123.jpg');
    });
  });

  describe('fetchPublicCerts', () => {
    it('returns JWKS keys from Google public certs endpoint', async () => {
      const mockKeys = [
        {
          kty: 'RSA',
          alg: 'RS256',
          use: 'sig',
          kid: 'key-id-1',
          n: 'modulus',
          e: 'AQAB'
        }
      ];

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ keys: mockKeys })
      } as any);

      const certs = await googleAuthService.fetchPublicCerts();
      expect(certs.keys).toHaveLength(1);
      expect(certs.keys[0].kid).toBe('key-id-1');
    });
  });
});
