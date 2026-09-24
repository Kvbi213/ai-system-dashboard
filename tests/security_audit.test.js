import { describe, it, expect, beforeEach } from 'vitest';
import { authMiddleware, activeSessions } from '../modules/routes/auth.js';
import { readProjectFile } from '../modules/fs_explorer.js';
import { isPrivateOrReservedIP, performOSINTScan } from '../modules/osint.js';
import { parseGradeInfo } from '../modules/services/librusService.js';

describe('Security Audit & Zero-Trust Hardening (v2.28.1)', () => {
  beforeEach(() => {
    process.env.DASHBOARD_PIN = '7721';
    process.env.INTERNAL_SERVICE_KEY = 'super_secret_machine_key_987654';
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

    it('should authorize requests presenting a high-entropy x-internal-key header', () => {
      let nextCalled = false;
      const req = {
        path: '/secure/data',
        headers: { 'x-internal-key': 'super_secret_machine_key_987654' }
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

  describe('OSINT SSRF Prevention (isPrivateOrReservedIP)', () => {
    it('should detect loopback, private RFC1918, and cloud metadata addresses', () => {
      expect(isPrivateOrReservedIP('127.0.0.1')).toBe(true);
      expect(isPrivateOrReservedIP('localhost')).toBe(true);
      expect(isPrivateOrReservedIP('10.0.0.1')).toBe(true);
      expect(isPrivateOrReservedIP('172.16.0.5')).toBe(true);
      expect(isPrivateOrReservedIP('192.168.1.1')).toBe(true);
      expect(isPrivateOrReservedIP('169.254.169.254')).toBe(true); // AWS / GCP metadata
      expect(isPrivateOrReservedIP('8.8.8.8')).toBe(false);
      expect(isPrivateOrReservedIP('1.1.1.1')).toBe(false);
    });

    it('should block scanning private IPs and metadata endpoints in performOSINTScan', async () => {
      const scanRes = await performOSINTScan('169.254.169.254');
      expect(scanRes.blocked).toBe(true);
      expect(scanRes.error).toMatch(/blokada SSRF/);
    });
  });

  describe('Librus Synergia Grade Parsing Integrity', () => {
    it('should correctly parse inAverage: true when "Licz do średniej: tak" is present', () => {
      const sample = "Kategoria: sprawdzian\nData: 2026-09-24 (czw.)\nNauczyciel: Bahr Zbigniew\nLicz do średniej: tak\nWaga: 2\nDodał: Bahr Zbigniew\n";
      const info = parseGradeInfo(sample);
      expect(info.inAverage).toBe(true);
      expect(info.weight).toBe(2);
      expect(info.category).toBe('sprawdzian');
    });

    it('should correctly parse inAverage: false when "Licz do średniej: nie" is present', () => {
      const sample = "Kategoria: diagnoza\nData: 2026-09-10\nLicz do średniej: nie\nWaga: 0\n";
      const info = parseGradeInfo(sample);
      expect(info.inAverage).toBe(false);
      expect(info.weight).toBe(0);
    });
  });
});
