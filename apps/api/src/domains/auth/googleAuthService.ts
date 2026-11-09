/**
 * Usługa autoryzacji Google OAuth 2.0 / OpenID Connect
 * Wykorzystuje oficjalne, publiczne endpointy Google Identity:
 * - https://oauth2.googleapis.com/tokeninfo?id_token=... (Weryfikacja tokena ID)
 * - https://oauth2.googleapis.com/tokeninfo?access_token=... (Weryfikacja tokena dostępowego)
 * - https://www.googleapis.com/oauth2/v3/userinfo (Oficjalny profil użytkownika)
 * - https://www.googleapis.com/oauth2/v3/certs (Publiczne klucze JWKS Google)
 * 
 * Bezwzględna polityka Zero-Placeholder: pełne typowanie, obsługa błędów sieciowych,
 * sprawdzanie wygasania, audyt wystawcy (iss) i audytora (aud).
 */

export interface GoogleTokenInfoRawResponse {
  iss?: string;
  sub?: string;
  azp?: string;
  aud?: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  locale?: string;
  iat?: string;
  exp?: string;
  error?: string;
  error_description?: string;
  scope?: string;
  expires_in?: string;
}

export interface GoogleIdTokenPayload {
  sub: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  picture?: string;
  givenName?: string;
  familyName?: string;
  locale?: string;
  aud: string;
  iss: string;
  exp: number;
}

export interface GoogleAccessTokenPayload {
  sub?: string;
  email?: string;
  emailVerified: boolean;
  scope?: string;
  aud?: string;
  expiresIn?: number;
}

export interface GoogleJwkKey {
  kty: string;
  alg: string;
  use: string;
  kid: string;
  n: string;
  e: string;
}

export interface GooglePublicCertsResponse {
  keys: GoogleJwkKey[];
}

export class GoogleAuthError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, code = 'GOOGLE_AUTH_ERROR', statusCode = 401) {
    super(message);
    this.name = 'GoogleAuthError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class GoogleAuthService {
  private static readonly GOOGLE_TOKENINFO_ENDPOINT = 'https://oauth2.googleapis.com/tokeninfo';
  private static readonly GOOGLE_USERINFO_ENDPOINT = 'https://www.googleapis.com/oauth2/v3/userinfo';
  private static readonly GOOGLE_CERTS_ENDPOINT = 'https://www.googleapis.com/oauth2/v3/certs';
  private static readonly VALID_ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];

  /**
   * Weryfikuje token ID Google za pośrednictwem publicznego endpointu tokeninfo.
   * Sprawdza podpis kryptograficzny po stronie Google, wystawcę, czas ważności i odbiorcę.
   */
  public async verifyGoogleIdToken(
    idToken: string,
    expectedClientId?: string
  ): Promise<GoogleIdTokenPayload> {
    const trimmedToken = idToken ? idToken.trim() : '';
    if (!trimmedToken) {
      throw new GoogleAuthError('Brakujący lub pusty token ID Google.', 'MISSING_TOKEN', 400);
    }

    const targetUrl = `${GoogleAuthService.GOOGLE_TOKENINFO_ENDPOINT}?id_token=${encodeURIComponent(trimmedToken)}`;

    let response: globalThis.Response;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json'
        },
        signal: controller.signal
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new GoogleAuthError('Przekroczono limit czasu oczekiwania na odpowiedź Google OAuth API.', 'TIMEOUT', 504);
      }
      const message = err instanceof Error ? err.message : 'Błąd połączenia sieciowego z Google API.';
      throw new GoogleAuthError(`Błąd sieciowy podczas weryfikacji tokena Google: ${message}`, 'NETWORK_ERROR', 502);
    } finally {
      clearTimeout(timeoutId);
    }

    let data: GoogleTokenInfoRawResponse;
    try {
      data = (await response.json()) as GoogleTokenInfoRawResponse;
    } catch {
      throw new GoogleAuthError('Nieprawidłowy format odpowiedzi z serwera Google OAuth.', 'INVALID_RESPONSE_FORMAT', 502);
    }

    if (!response.ok) {
      const errorMsg = data.error_description || data.error || `HTTP ${response.status} ${response.statusText}`;
      throw new GoogleAuthError(`Weryfikacja tokena Google nie powiodła się: ${errorMsg}`, 'INVALID_TOKEN', 401);
    }

    // 1. Walidacja wystawcy (iss)
    if (!data.iss || !GoogleAuthService.VALID_ISSUERS.includes(data.iss)) {
      throw new GoogleAuthError(
        `Nieprawidłowy wystawca tokena Google (iss: ${data.iss || 'brak'}). Oczekiwano accounts.google.com.`,
        'INVALID_ISSUER',
        401
      );
    }

    // 2. Walidacja podmiotu (sub)
    if (!data.sub || typeof data.sub !== 'string' || data.sub.trim().length === 0) {
      throw new GoogleAuthError('Brak unikalnego identyfikatora podmiotu Google (sub).', 'INVALID_SUBJECT', 401);
    }

    // 3. Walidacja adresu e-mail
    if (!data.email || typeof data.email !== 'string' || !data.email.includes('@')) {
      throw new GoogleAuthError('Brak prawidłowego adresu e-mail w tokenie Google.', 'INVALID_EMAIL', 401);
    }

    // 4. Walidacja weryfikacji adresu e-mail
    const isEmailVerified = data.email_verified === 'true' || data.email_verified === true;
    if (!isEmailVerified) {
      throw new GoogleAuthError('Adres e-mail powiązany z kontem Google nie jest zweryfikowany.', 'UNVERIFIED_EMAIL', 403);
    }

    // 5. Walidacja wygaśnięcia tokena (exp)
    const expSeconds = parseInt(data.exp || '0', 10);
    if (isNaN(expSeconds) || expSeconds * 1000 <= Date.now()) {
      throw new GoogleAuthError('Token ID Google utracił ważność (wygasł).', 'TOKEN_EXPIRED', 401);
    }

    // 6. Walidacja Audience (aud), jeśli skonfigurowano oczekiwany Client ID
    if (expectedClientId && expectedClientId.trim().length > 0) {
      const normalizedExpected = expectedClientId.trim();
      if (data.aud !== normalizedExpected) {
        throw new GoogleAuthError(
          `Niezgodność identyfikatora aplikacji (aud: ${data.aud || 'brak'}, oczekiwano: ${normalizedExpected}).`,
          'AUDIENCE_MISMATCH',
          403
        );
      }
    }

    return {
      sub: data.sub,
      email: data.email.toLowerCase(),
      emailVerified: isEmailVerified,
      name: data.name,
      picture: data.picture,
      givenName: data.given_name,
      familyName: data.family_name,
      locale: data.locale,
      aud: data.aud || '',
      iss: data.iss,
      exp: expSeconds
    };
  }

  /**
   * Weryfikuje token dostępowy OAuth 2.0 (access_token) za pośrednictwem tokeninfo.
   */
  public async verifyGoogleAccessToken(accessToken: string): Promise<GoogleAccessTokenPayload> {
    const trimmed = accessToken ? accessToken.trim() : '';
    if (!trimmed) {
      throw new GoogleAuthError('Brakujący token dostępowy Google.', 'MISSING_TOKEN', 400);
    }

    const targetUrl = `${GoogleAuthService.GOOGLE_TOKENINFO_ENDPOINT}?access_token=${encodeURIComponent(trimmed)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal
      });

      const data = (await response.json()) as GoogleTokenInfoRawResponse;
      if (!response.ok) {
        const errorMsg = data.error_description || data.error || `HTTP ${response.status}`;
        throw new GoogleAuthError(`Weryfikacja tokena dostępowego Google nie powiodła się: ${errorMsg}`, 'INVALID_TOKEN', 401);
      }

      return {
        sub: data.sub,
        email: data.email?.toLowerCase(),
        emailVerified: data.email_verified === 'true' || data.email_verified === true,
        scope: data.scope,
        aud: data.aud,
        expiresIn: data.expires_in ? parseInt(data.expires_in, 10) : undefined
      };
    } catch (err: unknown) {
      if (err instanceof GoogleAuthError) throw err;
      const message = err instanceof Error ? err.message : 'Błąd komunikacji z Google API.';
      throw new GoogleAuthError(`Nie udało się zweryfikować tokena dostępowego Google: ${message}`, 'NETWORK_ERROR', 502);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Pobiera profil użytkownika z publicznego endpointu UserInfo przy użyciu tokena dostępowego.
   */
  public async fetchGoogleUserInfo(accessToken: string): Promise<GoogleIdTokenPayload> {
    const trimmed = accessToken ? accessToken.trim() : '';
    if (!trimmed) {
      throw new GoogleAuthError('Brakujący token dostępowy Google.', 'MISSING_TOKEN', 400);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(GoogleAuthService.GOOGLE_USERINFO_ENDPOINT, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${trimmed}`,
          Accept: 'application/json'
        },
        signal: controller.signal
      });

      const data = (await response.json()) as GoogleTokenInfoRawResponse;
      if (!response.ok) {
        const errorMsg = data.error_description || data.error || `HTTP ${response.status}`;
        throw new GoogleAuthError(`Błąd pobierania profilu Google UserInfo: ${errorMsg}`, 'USERINFO_ERROR', 401);
      }

      if (!data.sub || !data.email) {
        throw new GoogleAuthError('Niekompletne dane profilu użytkownika Google.', 'INCOMPLETE_USERINFO', 401);
      }

      return {
        sub: data.sub,
        email: data.email.toLowerCase(),
        emailVerified: data.email_verified === 'true' || data.email_verified === true,
        name: data.name,
        picture: data.picture,
        givenName: data.given_name,
        familyName: data.family_name,
        locale: data.locale,
        aud: data.aud || '',
        iss: 'https://accounts.google.com',
        exp: Math.floor(Date.now() / 1000) + 3600
      };
    } catch (err: unknown) {
      if (err instanceof GoogleAuthError) throw err;
      const message = err instanceof Error ? err.message : 'Błąd komunikacji z Google API.';
      throw new GoogleAuthError(`Nie udało się pobrać profilu Google UserInfo: ${message}`, 'NETWORK_ERROR', 502);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Pobiera aktualny zestaw oficjalnych certyfikatów i publicznych kluczy JWKS Google.
   */
  public async fetchPublicCerts(): Promise<GooglePublicCertsResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(GoogleAuthService.GOOGLE_CERTS_ENDPOINT, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal
      });

      if (!response.ok) {
        throw new GoogleAuthError(`Nie udało się pobrać certyfikatów Google: HTTP ${response.status}`, 'CERTS_FETCH_FAILED', 502);
      }

      const data = (await response.json()) as GooglePublicCertsResponse;
      if (!data || !Array.isArray(data.keys)) {
        throw new GoogleAuthError('Nieprawidłowa struktura certyfikatów Google JWKS.', 'INVALID_CERTS_FORMAT', 502);
      }

      return data;
    } catch (err: unknown) {
      if (err instanceof GoogleAuthError) throw err;
      const message = err instanceof Error ? err.message : 'Błąd sieciowy podczas pobierania certyfikatów.';
      throw new GoogleAuthError(`Błąd pobierania certyfikatów Google: ${message}`, 'NETWORK_ERROR', 502);
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

export const googleAuthService = new GoogleAuthService();
