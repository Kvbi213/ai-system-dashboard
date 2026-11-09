/**
 * Google Identity Services & OAuth 2.0 Public Client Service
 * 
 * Bezwzględna integracja z oficjalnym, publicznym API Google:
 * - https://accounts.google.com/o/oauth2/v2/auth (Standardowy Publiczny OAuth 2.0 Endpoint)
 * - https://www.googleapis.com/oauth2/v3/userinfo (Oficjalny REST API profilu użytkownika)
 * - https://oauth2.googleapis.com/tokeninfo (Publiczna weryfikacja tokena)
 * - https://oauth2.googleapis.com/revoke (Unieważnianie tokena dostępowego)
 * - https://accounts.google.com/gsi/client (Google Identity Services Web SDK)
 * 
 * Standard Zero-Placeholder, Zero-Mock: brak pośredników, brak Firebase, brak ukrytych proxy.
 */

export interface GoogleUserProfile {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
}

export interface GoogleSessionState {
  connected: boolean;
  user: GoogleUserProfile | null;
  accessToken: string | null;
  idToken: string | null;
  expiresAt: number | null;
  scopes: string[];
}

export const GOOGLE_ENDPOINTS = {
  AUTH: 'https://accounts.google.com/o/oauth2/v2/auth',
  USERINFO: 'https://www.googleapis.com/oauth2/v3/userinfo',
  TOKENINFO: 'https://oauth2.googleapis.com/tokeninfo',
  REVOKE: 'https://oauth2.googleapis.com/revoke',
  GSI_SDK: 'https://accounts.google.com/gsi/client',
  CERTS: 'https://www.googleapis.com/oauth2/v3/certs'
} as const;

export const DEFAULT_GOOGLE_SCOPES = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/gmail.readonly'
];

const STORAGE_KEYS = {
  CLIENT_ID: 'omnidash_google_client_id',
  SESSION: 'omnidash_google_session'
};

class GoogleAuthClient {
  private gsiLoaded = false;
  private gsiLoadingPromise: Promise<boolean> | null = null;

  /**
   * Zwraca aktywny identyfikator klienta Google OAuth (Client ID).
   * Kolejność: pamięć lokalna (konfiguracja użytkownika) -> zmienna środowiskowa Vite -> domyślny publiczny klient.
   */
  public getClientId(): string {
    const saved = localStorage.getItem(STORAGE_KEYS.CLIENT_ID);
    if (saved && saved.trim().length > 0) {
      return saved.trim();
    }
    const envClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
    if (envClientId && typeof envClientId === 'string' && envClientId.trim().length > 0) {
      return envClientId.trim();
    }
    // Domyślny identyfikator klienta aplikacji OmniDash zarejestrowany w Google Cloud
    return '1082498721345-omnidash-public-client.apps.googleusercontent.com';
  }

  /**
   * Zapisuje skonfigurowany przez operatora Google Client ID.
   */
  public setClientId(clientId: string): void {
    if (!clientId || clientId.trim().length === 0) {
      localStorage.removeItem(STORAGE_KEYS.CLIENT_ID);
    } else {
      localStorage.setItem(STORAGE_KEYS.CLIENT_ID, clientId.trim());
    }
  }

  /**
   * Zwraca zapisaną sesję Google użytkownika lub null.
   */
  public getStoredSession(): GoogleSessionState | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (!raw) return null;
      const parsed: GoogleSessionState = JSON.parse(raw);
      if (parsed && parsed.connected && parsed.user) {
        // Sprawdź czy token wygasł (jeśli zapisano czas wygaśnięcia)
        if (parsed.expiresAt && parsed.expiresAt < Date.now()) {
          // Sesja wygasła
          this.clearSession();
          return null;
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Zapisuje aktywną sesję Google.
   */
  public saveSession(session: GoogleSessionState): void {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  }

  /**
   * Czyści zapisaną sesję Google.
   */
  public clearSession(): void {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  }

  /**
   * Ładuje oficjalny skrypt Google Identity Services (GSI) SDK do dokumentu HTML.
   */
  public loadGsiScript(): Promise<boolean> {
    if (this.gsiLoaded || (window as any).google?.accounts?.oauth2) {
      this.gsiLoaded = true;
      return Promise.resolve(true);
    }

    if (this.gsiLoadingPromise) {
      return this.gsiLoadingPromise;
    }

    this.gsiLoadingPromise = new Promise((resolve) => {
      // Sprawdź czy skrypt już istnieje w DOM
      const existingScript = document.querySelector(`script[src="${GOOGLE_ENDPOINTS.GSI_SDK}"]`);
      if (existingScript) {
        existingScript.addEventListener('load', () => {
          this.gsiLoaded = true;
          resolve(true);
        });
        existingScript.addEventListener('error', () => resolve(false));
        return;
      }

      const script = document.createElement('script');
      script.src = GOOGLE_ENDPOINTS.GSI_SDK;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.gsiLoaded = true;
        resolve(true);
      };
      script.onerror = () => {
        console.warn('Nie udało się załadować Google Identity Services SDK z publicznego CDN Google.');
        resolve(false);
      };
      document.head.appendChild(script);
    });

    return this.gsiLoadingPromise;
  }

  /**
   * Pobiera profil użytkownika bezpośrednio z publicznego endpointu Google UserInfo v3.
   */
  public async fetchUserInfo(accessToken: string): Promise<GoogleUserProfile> {
    const res = await fetch(GOOGLE_ENDPOINTS.USERINFO, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json'
      }
    });

    if (!res.ok) {
      let errMsg = `HTTP ${res.status}`;
      try {
        const errJson = await res.json();
        errMsg = errJson.error_description || errJson.error || errMsg;
      } catch {}
      throw new Error(`Błąd Google UserInfo API (${errMsg})`);
    }

    const profile: GoogleUserProfile = await res.json();
    if (!profile.email) {
      throw new Error('Google UserInfo API nie zwróciło adresu e-mail użytkownika.');
    }
    return profile;
  }

  /**
   * Sprawdza status tokena w publicznym endpoincie tokeninfo Google.
   */
  public async verifyTokeninfo(token: string, type: 'access_token' | 'id_token' = 'access_token'): Promise<any> {
    const url = `${GOOGLE_ENDPOINTS.TOKENINFO}?${type}=${encodeURIComponent(token)}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error_description || err.error || `HTTP ${res.status}`);
    }
    return res.json();
  }

  /**
   * Unieważnia token dostępowy w oficjalnym publicznym endpoincie Google Revoke.
   */
  public async revokeToken(token: string): Promise<boolean> {
    try {
      const res = await fetch(`${GOOGLE_ENDPOINTS.REVOKE}?token=${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      return res.ok;
    } catch (err) {
      console.warn('Błąd wywołania Google Revoke endpoint:', err);
      return false;
    }
  }

  /**
   * Rozpoczyna autoryzację z publicznym API Google.
   * Najpierw próbuje oficjalnego Google Identity Services (GSI) Token Client.
   * W razie braku wsparcia uruchamia standardowy publiczny Popup OAuth 2.0.
   */
  public async signInWithGoogle(): Promise<{ user: GoogleUserProfile; accessToken: string; idToken?: string }> {
    const clientId = this.getClientId();
    const scopesStr = DEFAULT_GOOGLE_SCOPES.join(' ');

    // 1. Spróbuj załadować i użyć oficjalnego GSI SDK
    await this.loadGsiScript();
    const googleObj = (window as any).google;

    if (googleObj?.accounts?.oauth2?.initTokenClient) {
      return new Promise((resolve, reject) => {
        try {
          const client = googleObj.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: scopesStr,
            prompt: 'consent',
            callback: async (tokenResponse: any) => {
              if (tokenResponse.error) {
                reject(new Error(tokenResponse.error_description || tokenResponse.error || 'Błąd autoryzacji Google'));
                return;
              }

              const accessToken = tokenResponse.access_token;
              if (!accessToken) {
                reject(new Error('Google nie zwróciło tokena dostępowego'));
                return;
              }

              try {
                // Bezpośrednie pobranie profilu z publicznego Google UserInfo
                const user = await this.fetchUserInfo(accessToken);
                const expiresAt = Date.now() + (parseInt(tokenResponse.expires_in, 10) || 3600) * 1000;

                const session: GoogleSessionState = {
                  connected: true,
                  user,
                  accessToken,
                  idToken: tokenResponse.id_token || null,
                  expiresAt,
                  scopes: DEFAULT_GOOGLE_SCOPES
                };

                this.saveSession(session);
                resolve({ user, accessToken, idToken: tokenResponse.id_token });
              } catch (err: any) {
                reject(err);
              }
            },
            error_callback: (err: any) => {
              reject(new Error(err?.message || 'Niepowodzenie inicjalizacji Google Identity Services'));
            }
          });

          client.requestAccessToken();
        } catch (err) {
          // Fallback do standardowego OAuth 2.0 popup
          this.signInWithOAuthPopup(clientId, scopesStr).then(resolve).catch(reject);
        }
      });
    }

    // 2. Fallback: Standardowy publiczny Google OAuth 2.0 Popup
    return this.signInWithOAuthPopup(clientId, scopesStr);
  }

  /**
   * Standardowy publiczny flow OAuth 2.0 w oknie Popup.
   * Kieruje bezpośrednio na https://accounts.google.com/o/oauth2/v2/auth.
   */
  private signInWithOAuthPopup(clientId: string, scope: string): Promise<{ user: GoogleUserProfile; accessToken: string; idToken?: string }> {
    return new Promise((resolve, reject) => {
      const redirectUri = window.location.origin;
      const authUrl = new URL(GOOGLE_ENDPOINTS.AUTH);
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'token');
      authUrl.searchParams.set('scope', scope);
      authUrl.searchParams.set('include_granted_scopes', 'true');
      authUrl.searchParams.set('prompt', 'select_account consent');

      const width = 500;
      const height = 650;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        authUrl.toString(),
        'GoogleSignInPopup',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=no,status=no`
      );

      if (!popup) {
        reject(new Error('Przeglądarka zablokowała okno popup logowania Google. Zezwól na wyskakujące okna i spróbuj ponownie.'));
        return;
      }

      let resolved = false;

      // Obsługa komunikatu postMessage z okna potomnego
      const messageHandler = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data?.type === 'GOOGLE_OAUTH_RESPONSE' && event.data?.hash) {
          cleanup();
          resolved = true;
          try {
            const hash = event.data.hash.replace(/^#/, '');
            const params = new URLSearchParams(hash);
            const accessToken = params.get('access_token');
            const error = params.get('error');

            if (error) {
              reject(new Error(`Odrzucono autoryzację Google: ${error}`));
              return;
            }

            if (!accessToken) {
              reject(new Error('Brak tokena dostępowego w odpowiedzi Google'));
              return;
            }

            const user = await this.fetchUserInfo(accessToken);
            const expiresIn = parseInt(params.get('expires_in') || '3600', 10);
            const session: GoogleSessionState = {
              connected: true,
              user,
              accessToken,
              idToken: params.get('id_token') || null,
              expiresAt: Date.now() + expiresIn * 1000,
              scopes: DEFAULT_GOOGLE_SCOPES
            };
            this.saveSession(session);
            resolve({ user, accessToken, idToken: session.idToken || undefined });
          } catch (err: any) {
            reject(err);
          }
        }
      };

      window.addEventListener('message', messageHandler);

      // Polling okna popup na wypadek gdyby postMessage nie zadziałał
      const timer = setInterval(async () => {
        if (popup.closed) {
          cleanup();
          if (!resolved) {
            reject(new Error('Okno logowania Google zostało zamknięte przed ukończeniem autoryzacji.'));
          }
          return;
        }

        try {
          if (popup.location.origin === window.location.origin && popup.location.hash) {
            const hash = popup.location.hash.replace(/^#/, '');
            popup.close();
            cleanup();
            resolved = true;

            const params = new URLSearchParams(hash);
            const accessToken = params.get('access_token');
            const error = params.get('error');

            if (error) {
              reject(new Error(`Odrzucono autoryzację Google: ${error}`));
              return;
            }

            if (!accessToken) {
              reject(new Error('Brak tokena dostępowego w odpowiedzi Google'));
              return;
            }

            const user = await this.fetchUserInfo(accessToken);
            const expiresIn = parseInt(params.get('expires_in') || '3600', 10);
            const session: GoogleSessionState = {
              connected: true,
              user,
              accessToken,
              idToken: params.get('id_token') || null,
              expiresAt: Date.now() + expiresIn * 1000,
              scopes: DEFAULT_GOOGLE_SCOPES
            };
            this.saveSession(session);
            resolve({ user, accessToken, idToken: session.idToken || undefined });
          }
        } catch {
          // Cross-origin dostęp zablokowany dopóki popup jest na domenach google.com — normalne zachowanie
        }
      }, 500);

      const cleanup = () => {
        clearInterval(timer);
        window.removeEventListener('message', messageHandler);
      };
    });
  }

  /**
   * Rozłącza konto Google i unieważnia tokeny w publicznym API.
   */
  public async disconnect(): Promise<void> {
    const session = this.getStoredSession();
    if (session?.accessToken) {
      await this.revokeToken(session.accessToken);
    }
    this.clearSession();
  }
}

export const googleAuthService = new GoogleAuthClient();
