import { describe, it, expect, beforeEach } from 'vitest';
import { authMiddleware, activeSessions } from '../modules/routes/auth.js';
import { readProjectFile } from '../modules/fs_explorer.js';

describe('Security Audit & Zero-Trust Hardening (v2.28.0)', () => {
  beforeEach(() => {
    process.env.DASHBOARD_PIN = '7721';
  });

  describe('authMiddleware Security Boundaries', () => {
    it('should bypass authentication for Google Cloud Pub/Sub budget webhook', () => {
      let nextCalled = false;
      const req = { path: '/gcp/budget-webhook', headers: {} };
      const res = { status: () => res, json: () => {} };
      const next = () => { nextCalled = true; };

      authMiddleware(req, res, next);
      expect(nextCalled).toBe(true);
    });

    it('should authorize requests presenting a valid x-system-pin header', () => {
      let nextCalled = false;
      const req = {
        path: '/secure/data',
        headers: { 'x-system-pin': '7721' }
      };
      const res = { status: () => res, json: () => {} };
      const next = () => { nextCalled = true; };

      authMiddleware(req, res, next);
      expect(nextCalled).toBe(true);
    });

    it('should reject requests with invalid x-system-pin and no session token', () => {
      let statusCode = 0;
      let errorBody = null;
      let nextCalled = false;

      const req = {
        path: '/secure/data',
        headers: { 'x-system-pin': '9999' }
      };
      const res = {
        status: (code) => {
          statusCode = code;
          return {
            json: (data) => { errorBody = data; }
          };
        }
      };
      const next = () => { nextCalled = true; };

      authMiddleware(req, res, next);
      expect(nextCalled).toBe(false);
      expect(statusCode).toBe(401);
      expect(errorBody).toEqual({ error: 'Brak autoryzacji' });
    });

    it('should authorize requests presenting a valid activeSession bearer token', () => {
      const mockToken = 'sec_test_valid_session_token_123';
      activeSessions.add(mockToken);

      let nextCalled = false;
      const req = {
        path: '/secure/data',
        headers: { authorization: `Bearer ${mockToken}` }
      };
      const res = { status: () => res, json: () => {} };
      const next = () => { nextCalled = true; };

      authMiddleware(req, res, next);
      expect(nextCalled).toBe(true);
      activeSessions.delete(mockToken);
    });
  });

  describe('AI Agent File System Guard (readProjectFile)', () => {
    it('should block reading .env and sensitive environment files', async () => {
      const resEnv = await readProjectFile('.env');
      expect(resEnv.success).toBe(false);
      expect(resEnv.error).toMatch(/Odmowa dostępu: plik chroniony/);

      const resEnvEx = await readProjectFile('.env.example');
      expect(resEnvEx.success).toBe(false);
      expect(resEnvEx.error).toMatch(/Odmowa dostępu: plik chroniony/);
    });

    it('should block reading firebase service account credentials', async () => {
      const res = await readProjectFile('firebase-service-account.json');
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Odmowa dostępu: plik chroniony/);
    });

    it('should block directory traversal attempts outside project root', async () => {
      const res = await readProjectFile('../../windows/system32/cmd.exe');
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Próba dostępu poza katalog projektowy/);
    });
  });
});
