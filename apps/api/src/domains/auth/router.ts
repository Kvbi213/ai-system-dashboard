import { Router, Request, Response } from 'express';
import { AuthenticatedRequest } from '../../core/authMiddleware.js';

export const authRouter = Router();

authRouter.post('/dev-login', (req: Request, res: Response) => {
  res.json({
    token: 'dev-operator-token',
    user: {
      id: 'operator-system-core',
      email: 'operator@omnidash.internal',
      role: 'ADMIN'
    }
  });
});

authRouter.post('/login', (req: Request, res: Response) => {
  const { idToken } = req.body;
  if (!idToken) {
    res.status(400).json({ error: 'MISSING_TOKEN', message: 'Wymagany token Google idToken.' });
    return;
  }

  // Simulated Google Auth validation
  res.json({
    token: `jwt_session_${Date.now()}`,
    user: {
      id: 'google-user-1',
      email: 'user@omnidash.internal',
      role: 'USER'
    }
  });
});

authRouter.get('/session', (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'UNAUTHORIZED' });
    return;
  }
  res.json({
    user: req.user,
    sessionExpiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString()
  });
});
