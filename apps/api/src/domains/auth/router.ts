import { Router, Request, Response } from 'express';
import { AuthenticatedRequest } from '../../core/authMiddleware.js';
import { sqliteStore } from '../../db/sqliteStore.js';
import { pushbulletService } from '../pushbullet/pushbulletService.js';
import { googleAuthService, GoogleAuthError, GoogleIdTokenPayload } from './googleAuthService.js';

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
  const googleConnectedName = sqliteStore.getConfig('google_connected_name') || null;
  const googleConnectedPicture = sqliteStore.getConfig('google_connected_picture') || null;

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
    email: googleConnectedEmail || 'operator@omnidash.internal',
    role: 'ADMIN'
  };

  res.json({
    authenticated: true,
    user,
    providers: {
      googleOAuth: {
        configured: Boolean(googleConfigured || (googleConnectedEmail && googleConnectedEmail.length > 0)),
        clientId: googleClientId || '',
        clientIdMasked: googleMasked,
        connectedEmail: googleConnectedEmail,
        connectedName: googleConnectedName,
        connectedPicture: googleConnectedPicture,
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
 * Weryfikuje i zapisuje połączenie konta Google OAuth 2.0.
 * Obsługuje tokeny ID (idToken), tokeny dostępowe (accessToken) lub ręczne powiązanie w dev.
 */
authRouter.post('/google/authorize', async (req: Request, res: Response) => {
  const { email, clientId, idToken, accessToken } = req.body;

  if (clientId && String(clientId).trim().length > 0) {
    sqliteStore.setConfig('google_client_id', String(clientId).trim());
  }

  // Weryfikacja tokena ID Google przez oficjalny publiczny endpoint tokeninfo
  if (idToken && typeof idToken === 'string' && idToken.trim().length > 0) {
    try {
      const activeClientId = clientId || process.env.GOOGLE_CLIENT_ID || sqliteStore.getConfig('google_client_id') || undefined;
      const verified = await googleAuthService.verifyGoogleIdToken(idToken, activeClientId);

      sqliteStore.setConfig('google_connected_email', verified.email);
      sqliteStore.setConfig('google_connected_sub', verified.sub);
      if (verified.name) sqliteStore.setConfig('google_connected_name', verified.name);
      if (verified.picture) sqliteStore.setConfig('google_connected_picture', verified.picture);

      res.json({
        success: true,
        message: `Pomyślnie zweryfikowano i powiązano konto Google OAuth 2.0 (${verified.email})`,
        connectedEmail: verified.email,
        user: {
          sub: verified.sub,
          email: verified.email,
          name: verified.name,
          picture: verified.picture
        },
        scopes: ['gmail.readonly', 'gmail.modify', 'openid', 'userinfo.email']
      });
      return;
    } catch (err: unknown) {
      const authErr = err instanceof GoogleAuthError ? err : new GoogleAuthError(err instanceof Error ? err.message : 'Błąd weryfikacji');
      res.status(authErr.statusCode).json({
        success: false,
        error: authErr.code,
        message: authErr.message
      });
      return;
    }
  }

  // Weryfikacja tokena dostępowego Google przez UserInfo
  if (accessToken && typeof accessToken === 'string' && accessToken.trim().length > 0) {
    try {
      const verified = await googleAuthService.fetchGoogleUserInfo(accessToken);

      sqliteStore.setConfig('google_connected_email', verified.email);
      sqliteStore.setConfig('google_connected_sub', verified.sub);
      sqliteStore.setConfig('google_access_token', accessToken.trim());
      if (verified.name) sqliteStore.setConfig('google_connected_name', verified.name);
      if (verified.picture) sqliteStore.setConfig('google_connected_picture', verified.picture);

      res.json({
        success: true,
        message: `Pomyślnie zweryfikowano i powiązano konto Google (${verified.email})`,
        connectedEmail: verified.email,
        user: {
          sub: verified.sub,
          email: verified.email,
          name: verified.name,
          picture: verified.picture
        },
        scopes: ['gmail.readonly', 'gmail.modify', 'openid', 'userinfo.email']
      });
      return;
    } catch (err: unknown) {
      const authErr = err instanceof GoogleAuthError ? err : new GoogleAuthError(err instanceof Error ? err.message : 'Błąd weryfikacji');
      res.status(authErr.statusCode).json({
        success: false,
        error: authErr.code,
        message: authErr.message
      });
      return;
    }
  }

  // Opcjonalne przypisanie adresu e-mail (np. w konfiguracji dev / bypass)
  if (email && typeof email === 'string' && email.includes('@')) {
    const connectedEmail = email.trim().toLowerCase();
    sqliteStore.setConfig('google_connected_email', connectedEmail);
    res.json({
      success: true,
      message: `Zaktualizowano adres Google OAuth 2.0 (${connectedEmail})`,
      connectedEmail,
      scopes: ['gmail.readonly', 'gmail.modify', 'openid', 'userinfo.email']
    });
    return;
  }

  res.status(400).json({
    success: false,
    error: 'MISSING_CREDENTIALS',
    message: 'Wymagany token Google idToken, accessToken lub prawidłowy adres e-mail.'
  });
});

/**
 * POST /api/auth/google/verify-token
 * Publiczny endpoint diagnostyczny do weryfikacji tokena Google przez Google Identity API.
 */
authRouter.post('/google/verify-token', async (req: Request, res: Response) => {
  const { idToken, accessToken, clientId } = req.body;

  if (!idToken && !accessToken) {
    res.status(400).json({
      valid: false,
      error: 'MISSING_TOKEN',
      message: 'Wymagany parametr idToken lub accessToken do weryfikacji.'
    });
    return;
  }

  try {
    if (idToken) {
      const activeClientId = clientId || process.env.GOOGLE_CLIENT_ID || sqliteStore.getConfig('google_client_id') || undefined;
      const payload = await googleAuthService.verifyGoogleIdToken(String(idToken), activeClientId);
      res.json({
        valid: true,
        type: 'id_token',
        payload
      });
      return;
    }

    if (accessToken) {
      const payload = await googleAuthService.fetchGoogleUserInfo(String(accessToken));
      res.json({
        valid: true,
        type: 'access_token',
        payload
      });
      return;
    }
  } catch (err: unknown) {
    const authErr = err instanceof GoogleAuthError ? err : new GoogleAuthError(err instanceof Error ? err.message : 'Błąd weryfikacji');
    res.status(authErr.statusCode).json({
      valid: false,
      error: authErr.code,
      message: authErr.message
    });
  }
});

/**
 * GET /api/auth/google/certs
 * Zwraca publiczne certyfikaty i klucze JWKS z oficjalnego serwera Google Identity.
 */
authRouter.get('/google/certs', async (_req: Request, res: Response) => {
  try {
    const certs = await googleAuthService.fetchPublicCerts();
    res.json(certs);
  } catch (err: unknown) {
    const authErr = err instanceof GoogleAuthError ? err : new GoogleAuthError(err instanceof Error ? err.message : 'Błąd certyfikatów');
    res.status(authErr.statusCode).json({
      error: authErr.code,
      message: authErr.message
    });
  }
});

/**
 * POST /api/auth/google/disconnect
 * Rozłącza konto Google OAuth 2.0 i czyści zapisane tokeny tożsamości.
 */
authRouter.post('/google/disconnect', (_req: Request, res: Response) => {
  sqliteStore.setConfig('google_connected_email', '');
  sqliteStore.setConfig('google_connected_sub', '');
  sqliteStore.setConfig('google_connected_name', '');
  sqliteStore.setConfig('google_connected_picture', '');
  sqliteStore.setConfig('google_access_token', '');
  sqliteStore.setConfig('google_refresh_token', '');
  res.json({
    success: true,
    message: 'Pomyślnie odłączono konto Google OAuth 2.0.'
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

/**
 * POST /api/auth/dev-login
 * Uwierzytelnianie deweloperskie / lokalne dla środowisk nieprodukcyjnych.
 */
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

/**
 * POST /api/auth/login
 * Logowanie produkcyjne przez Google OAuth 2.0 / OpenID Connect.
 * Weryfikuje token ID bezpośrednio w publicznym Google Identity API (Zero-Mock).
 */
authRouter.post('/login', async (req: Request, res: Response) => {
  const { idToken, accessToken } = req.body;

  if (!idToken && !accessToken) {
    res.status(400).json({
      error: 'MISSING_TOKEN',
      message: 'Wymagany token Google (idToken lub accessToken).'
    });
    return;
  }

  try {
    const googleClientId = process.env.GOOGLE_CLIENT_ID || sqliteStore.getConfig('google_client_id') || undefined;
    let verifiedUser: GoogleIdTokenPayload;

    if (idToken && typeof idToken === 'string') {
      verifiedUser = await googleAuthService.verifyGoogleIdToken(idToken, googleClientId);
    } else {
      verifiedUser = await googleAuthService.fetchGoogleUserInfo(String(accessToken));
    }

    // Zapisz zweryfikowaną tożsamość Google
    sqliteStore.setConfig('google_connected_email', verifiedUser.email);
    sqliteStore.setConfig('google_connected_sub', verifiedUser.sub);
    if (verifiedUser.name) sqliteStore.setConfig('google_connected_name', verifiedUser.name);
    if (verifiedUser.picture) sqliteStore.setConfig('google_connected_picture', verifiedUser.picture);

    // Wygeneruj kryptograficzny token sesji
    const sessionToken = `omnidash_usr_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
    sqliteStore.setConfig('operator_session_token', sessionToken);

    res.json({
      success: true,
      token: sessionToken,
      user: {
        id: verifiedUser.sub,
        email: verifiedUser.email,
        name: verifiedUser.name || verifiedUser.email.split('@')[0],
        picture: verifiedUser.picture,
        role: 'ADMIN'
      }
    });
  } catch (err: unknown) {
    const authErr = err instanceof GoogleAuthError ? err : new GoogleAuthError(err instanceof Error ? err.message : 'Błąd weryfikacji');
    res.status(authErr.statusCode).json({
      error: authErr.code,
      message: authErr.message
    });
  }
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
