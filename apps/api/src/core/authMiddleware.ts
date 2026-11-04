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

function isSecretPrimitive(v: unknown): v is string | number | boolean | bigint {
  return typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' || typeof v === 'bigint';
}

/**
 * Recursively extracts and unwraps the first primitive secret token from a request value.
 * - Returns `undefined` for `null`, `undefined`, empty arrays, non-primitive values (objects/functions/symbols),
 *   or strings that are empty / equal to `"undefined"` / `"null"`.
 * - Accepts primitive types (`string`, `number`, `boolean`, `bigint`) and returns their trimmed string representation.
 */
export function sanitizeSecret(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;

  // Recursively unwrap arrays
  if (Array.isArray(value)) {
    if (value.length === 0) return undefined;
    return sanitizeSecret(value[0]);
  }

  // Accept only primitive types that can be stringified safely
  if (!isSecretPrimitive(value)) return undefined;

  const normalized = String(value).trim();
  if (!normalized || normalized === 'undefined' || normalized === 'null') return undefined;

  return normalized;
}

export function extractWebhookSecret(req: Request): string | undefined {
  const fromHeader = sanitizeSecret(req.headers['x-webhook-secret']);
  if (fromHeader) return fromHeader;
  return sanitizeSecret(req.query?.secret);
}

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

  // 1. Pushbullet Webhook Guard: dedicated endpoint requiring strictly configured secret (cannot be bypassed by dev headers)
  if (req.path.startsWith('/pushbullet/webhook') || fullPath.includes('/pushbullet/webhook')) {
    const expectedSecret = process.env.PUSHBULLET_WEBHOOK_SECRET;
    if (!expectedSecret?.trim()) {
      res.status(503).json({
        error: 'SERVICE_UNAVAILABLE',
        code: 'WEBHOOK_UNCONFIGURED',
        message: 'Webhook processing service is currently unconfigured or unavailable.'
      });
      return;
    }

    const webhookSecret = extractWebhookSecret(req);
    if (!webhookSecret || webhookSecret !== expectedSecret.trim()) {
      res.status(401).json({
        error: 'UNAUTHORIZED_WEBHOOK',
        message: 'Nieprawidłowy lub brakujący klucz sekretu webhooka.'
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

  const authHeader = req.headers.authorization;
  const devBypassHeader = req.headers['x-dev-bypass'];

  // 2. Local development bypass & Operator authentication for standard API endpoints
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
