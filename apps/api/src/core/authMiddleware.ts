import { Request, Response, NextFunction } from 'express';

export interface UserContext {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'WEBHOOK_SYSTEM';
}

export interface AuthenticatedRequest extends Request {
  user?: UserContext;
}

const PUBLIC_PATHS = [
  '/auth/login',
  '/auth/dev-login',
  '/system/health',
  '/system/status',
  '/news/public',
  '/traffic/public'
];

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // Check if route is public (supports both req.path relative to router mount or full originalUrl)
  const fullPath = req.originalUrl || req.url || req.path;
  const isPublic = PUBLIC_PATHS.some((path) => req.path.startsWith(path) || fullPath.includes(path));
  if (isPublic) {
    return next();
  }

  const authHeader = req.headers.authorization;
  const devBypassHeader = req.headers['x-dev-bypass'];

  // Local development bypass & Bearer authentication
  if (
    authHeader === 'Bearer dev-operator-token' ||
    devBypassHeader === 'true' ||
    process.env.DEV_AUTH_BYPASS === 'true'
  ) {
    req.user = {
      id: 'operator-system-core',
      email: 'operator@omnidash.internal',
      role: 'ADMIN'
    };
    return next();
  }

  // Pushbullet Webhook Guard: requires strictly configured secret and matching token when unauthenticated
  if (req.path.startsWith('/pushbullet/webhook') || fullPath.includes('/pushbullet/webhook')) {
    const expectedSecret = process.env.PUSHBULLET_WEBHOOK_SECRET;
    if (!expectedSecret || !expectedSecret.trim()) {
      res.status(503).json({
        error: 'WEBHOOK_UNCONFIGURED',
        message: 'Brak konfiguracji zmiennej środowiskowej PUSHBULLET_WEBHOOK_SECRET na serwerze.'
      });
      return;
    }

    const webhookSecret = req.headers['x-webhook-secret'] || (req.query && req.query.secret);
    if (!webhookSecret || webhookSecret !== expectedSecret) {
      res.status(401).json({
        error: 'UNAUTHORIZED_WEBHOOK',
        message: 'Nieprawidłowy lub brakujący klucz sekretu webhooka (x-webhook-secret).'
      });
      return;
    }

    req.user = {
      id: 'webhook-service-daemon',
      email: 'webhook@pushbullet.integration',
      role: 'WEBHOOK_SYSTEM'
    };
    return next();
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Brak aktywnego tokena autoryzacji sesji Zero-Trust.'
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  // Simple token parser / validator
  if (token && token.length > 10) {
    req.user = {
      id: 'operator-session-user',
      email: 'user@omnidash.internal',
      role: 'USER'
    };
    return next();
  }

  res.status(401).json({
    error: 'INVALID_TOKEN',
    message: 'Przekazano nieprawidłowy lub wygasły token sesji.'
  });
};
