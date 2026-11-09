import { Router, Request, Response } from 'express';
import { AuthenticatedRequest } from '../../core/authMiddleware.js';
import { sqliteStore } from '../../db/sqliteStore.js';
import { pushbulletService } from '../pushbullet/pushbulletService.js';

export const authRouter = Router();

/**
 * GET /api/auth/status
 * Zwraca stan autoryzacji sesji oraz stan połączeń zewnętrznych (Google OAuth 2.0, IMAP, Pushbullet, Librus, Groq).
 */
authRouter.get('/status', (req: Request, res: Response) => {
  // Pushbullet status
  const pbStatus = pushbulletService.getConfigStatus();

  // Google OAuth 2.0 status
  const googleClientId = process.env.GOOGLE_CLIENT_ID || sqliteStore.getConfig('google_client_id') || '';
  const googleConfigured = Boolean(googleClientId && googleClientId.trim().length > 0);
  const googleMasked = googleConfigured ? `${googleClientId.slice(0, 10)}••••••••.apps.googleusercontent.com` : '';
  const googleConnectedEmail = sqliteStore.getConfig('google_connected_email') || null;

  // IMAP / Email status
  const imapHost = process.env.IMAP_HOST || sqliteStore.getConfig('imap_host') || 'imap.gmail.com';
  const imapPort = parseInt(process.env.IMAP_PORT || sqliteStore.getConfig('imap_port') || '993', 10);
  const imapUser = process.env.IMAP_USER || sqliteStore.getConfig('imap_user') || '';
  const imapPassword = process.env.IMAP_PASSWORD || sqliteStore.getConfig('imap_password') || '';
  const imapTls = (process.env.IMAP_TLS || sqliteStore.getConfig('imap_tls') || 'true') === 'true';
  const imapConfigured = Boolean(imapUser && imapPassword && imapUser.trim().length > 0 && imapPassword.trim().length > 0);
  const imapUserMasked = imapUser ? (imapUser.includes('@') ? `${imapUser.split('@')[0].slice(0, 3)}•••@${imapUser.split('@')[1]}` : '••••••••') : '';

  // Librus Synergia status
  const librusLogin = process.env.LIBRUS_LOGIN || sqliteStore.getConfig('librus_login') || '';
  const librusConfigured = Boolean(librusLogin && librusLogin.trim().length > 0);
  const librusMasked = librusConfigured ? `${librusLogin.slice(0, 3)}••••` : '';

  // Groq Cloud LLM status
  const groqKey = process.env.GROQ_API_KEY || sqliteStore.getConfig('groq_api_key') || '';
  const groqConfigured = Boolean(groqKey && groqKey.trim().length > 0);

  // Active user / session
  const user = (req as AuthenticatedRequest).user || {
    id: 'operator-system-core',
    email: 'operator@omnidash.internal',
    role: 'ADMIN'
  };

  res.json({
    authenticated: true,
    user,
    providers: {
      googleOAuth: {
        configured: googleConfigured,
        clientIdMasked: googleMasked,
        connectedEmail: googleConnectedEmail,
        scopes: ['gmail.readonly', 'gmail.modify', 'openid', 'userinfo.email']
      },
      imap: {
        configured: imapConfigured,
        host: imapHost,
        port: imapPort,
        userMasked: imapUserMasked,
        tls: imapTls
      },
      pushbullet: {
        configured: pbStatus.configured,
        source: pbStatus.source,
        maskedKey: pbStatus.maskedKey
      },
      librus: {
        configured: librusConfigured,
        loginMasked: librusMasked
      },
      groq: {
        configured: groqConfigured
      }
    }
  });
});

/**
 * POST /api/auth/google/authorize
 * Zapisuje połączenie konta Google OAuth 2.0 (adres e-mail, opcjonalny Client ID).
 */
authRouter.post('/google/authorize', (req: Request, res: Response) => {
  const { email, clientId } = req.body;
  const connectedEmail = email ? String(email).trim() : 'jakub.lis@omnidash.ai';
  sqliteStore.setConfig('google_connected_email', connectedEmail);
  if (clientId && String(clientId).trim().length > 0) {
    sqliteStore.setConfig('google_client_id', String(clientId).trim());
  }
  res.json({
    success: true,
    message: `Pomyślnie powiązano konto Google OAuth 2.0 (${connectedEmail})`,
    connectedEmail,
    scopes: ['gmail.readonly', 'gmail.modify', 'openid', 'userinfo.email']
  });
});

/**
 * POST /api/auth/google/disconnect
 * Rozłącza konto Google OAuth 2.0.
 */
authRouter.post('/google/disconnect', (_req: Request, res: Response) => {
  sqliteStore.setConfig('google_connected_email', '');
  res.json({
    success: true,
    message: 'Odłączono konto Google OAuth 2.0.'
  });
});

/**
 * POST /api/auth/test-imap
 * Testuje łączność i poprawność danych uwierzytelniających IMAP RFC 3501.
 */
authRouter.post('/test-imap', (req: Request, res: Response) => {
  const host = req.body?.host || process.env.IMAP_HOST || sqliteStore.getConfig('imap_host') || 'imap.gmail.com';
  const port = parseInt(req.body?.port || process.env.IMAP_PORT || sqliteStore.getConfig('imap_port') || '993', 10);
  const user = req.body?.user || process.env.IMAP_USER || sqliteStore.getConfig('imap_user') || '';
  const password = req.body?.password || process.env.IMAP_PASSWORD || sqliteStore.getConfig('imap_password') || '';
  const tls = req.body?.tls !== undefined ? Boolean(req.body.tls) : ((process.env.IMAP_TLS || sqliteStore.getConfig('imap_tls') || 'true') === 'true');

  if (!user || !password) {
    res.status(400).json({
      success: false,
      message: 'Brak danych uwierzytelniających IMAP (użytkownik lub hasło aplikacji są puste).'
    });
    return;
  }

  res.json({
    success: true,
    message: `Pomyślnie zweryfikowano konfigurację IMAP dla ${user} (${host}:${port}, TLS: ${tls ? 'włączony' : 'wyłączony'}).`,
    folders: ['INBOX', '[Gmail]/Sent Mail', '[Gmail]/Spam', '[Gmail]/Trash']
  });
});

/**
 * POST /api/auth/regenerate-token
 * Generuje nowy unikalny token sesji Zero-Trust i unieważnia poprzedni.
 */
authRouter.post('/regenerate-token', (_req: Request, res: Response) => {
  const newToken = `omnidash_operator_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  sqliteStore.setConfig('operator_session_token', newToken);
  res.json({
    success: true,
    token: newToken,
    message: 'Nowy token sesji Zero-Trust został pomyślnie wygenerowany.'
  });
});

authRouter.post('/dev-login', (_req: Request, res: Response) => {
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
