import { describe, it, expect, vi } from 'vitest';
import { authMiddleware, AuthenticatedRequest } from '../src/core/authMiddleware';
import { Response, NextFunction } from 'express';

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
});
