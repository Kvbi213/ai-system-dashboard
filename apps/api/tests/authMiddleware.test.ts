import { describe, it, expect, vi } from 'vitest';
import { authMiddleware, AuthenticatedRequest, sanitizeSecret } from '../src/core/authMiddleware';
import { Response } from 'express';

describe('Zero-Trust Auth Middleware', () => {
  const mockResponse = () => {
    const res: Partial<Response> = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res as Response;
  };

  it('allows public endpoints without authorization header', () => {
    const req = { path: '/api/auth/login', headers: {} } as AuthenticatedRequest;
    const res = mockResponse();
    const next = vi.fn();

    authMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('blocks protected endpoints when no token is provided', () => {
    const req = { path: '/api/finance/transactions', headers: {} } as AuthenticatedRequest;
    const res = mockResponse();
    const next = vi.fn();

    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('accepts dev operator token and assigns user context', () => {
    const req = {
      path: '/api/finance/transactions',
      headers: { authorization: 'Bearer dev-operator-token' }
    } as AuthenticatedRequest;
    const res = mockResponse();
    const next = vi.fn();

    authMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user?.role).toBe('ADMIN');
  });

  describe('sanitizeSecret helper unit verification', () => {
    it('unwraps valid strings and trims whitespace', () => {
      expect(sanitizeSecret('  my_secret_token  ')).toBe('my_secret_token');
    });

    it('unwraps array and nested array values safely', () => {
      expect(sanitizeSecret(['secret_in_array'])).toBe('secret_in_array');
      expect(sanitizeSecret([['deep_nested_secret']])).toBe('deep_nested_secret');
    });

    it('returns undefined for empty arrays, null, undefined', () => {
      expect(sanitizeSecret([])).toBeUndefined();
      expect(sanitizeSecret(null)).toBeUndefined();
      expect(sanitizeSecret(undefined)).toBeUndefined();
    });

    it('returns undefined for objects, functions, symbols', () => {
      expect(sanitizeSecret({ token: 'abc' })).toBeUndefined();
      expect(sanitizeSecret(() => 'evil')).toBeUndefined();
      expect(sanitizeSecret(Symbol('secret'))).toBeUndefined();
      expect(sanitizeSecret([{ token: 'x' }])).toBeUndefined();
    });

    it('safely handles bigint primitives', () => {
      expect(sanitizeSecret(12345678901234567890n)).toBe('12345678901234567890');
    });

    it('disallows literal strings "undefined" and "null"', () => {
      expect(sanitizeSecret('undefined')).toBeUndefined();
      expect(sanitizeSecret('null')).toBeUndefined();
      expect(sanitizeSecret('   ')).toBeUndefined();
    });
  });
});
