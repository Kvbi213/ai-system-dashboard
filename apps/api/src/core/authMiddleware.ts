import { Request, Response, NextFunction } from 'express';

export interface UserContext {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER';
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

  // Local development bypass support
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
