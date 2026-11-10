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

/**
 * Bezpieczne dekodowanie payloadu tokena JWT bez zewnętrznych bibliotek (Zero-Placeholder).
 */
export function parseJwtPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.warn('Nie udało się zdekodować tokena JWT Google:', err);
    return null;
  }
}

class GoogleAuthClient {
  private gsiLoaded = false;
  private gsiLoadingPromise: Promise<boolean> | null = null;

  /**
   * Zwraca aktywny identyfikator klienta Google OAuth (Client ID).
   * Kolejność: pamięć lokalna (konfiguracja użytkownika) -> zmienna środowiskowa Vite.
   * Zwraca pusty ciąg, jeżeli Client ID nie został jeszcze skonfigurowany (Zero-Placeholder).
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
    return '';
  }

  /**
   * Sprawdza, czy skonfigurowany jest poprawny Google Client ID.
   * Format Google Web Client ID kończy się na .apps.googleusercontent.com
   */
  public hasValidClientId(): boolean {
    const id = this.getClientId();
    return Boolean(id && id.trim().length > 10 && id.includes('.apps.googleusercontent.com'));
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
        if (parsed.expiresAt && parsed.expiresAt < Date.now()) {
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
    if (this.gsiLoaded || (window as any).google?.accounts?.oauth2 || (window as any).google?.accounts?.id) {
      this.gsiLoaded = true;
      return Promise.resolve(true);
    }

    if (this.gsiLoadingPromise) {
      return this.gsiLoadingPromise;
    }

    this.gsiLoadingPromise = new Promise((resolve) => {
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
   * Inicjalizuje oficjalny moduł Google Identity Services (google.accounts.id) dla renderButton i One Tap.
   */
  public async initializeGoogleIdentity(
    clientId: string,
    callback: (response: { credential: string; select_by?: string }) => void
  ): Promise<boolean> {
    const loaded = await this.loadGsiScript();
    if (!loaded) return false;

    const googleObj = (window as any).google;
    if (!googleObj?.accounts?.id) {
      console.warn('Brak google.accounts.id w załadowanym SDK Google Identity Services.');
      return false;
    }

    try {
      googleObj.accounts.id.initialize({
        client_id: clientId,
        callback: (response: any) => {
          if (response?.credential) {
            callback(response);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        itp_support: true
      });
      return true;
    } catch (err) {
      console.error('Błąd inicjalizacji google.accounts.id:', err);
      return false;
    }
  }

  /**
   * Renderuje oficjalny przycisk logowania Google Identity Services (google.accounts.id.renderButton).
   * Działa bezpośrednio na stronie, osadzony w iframe, znacznie bardziej odporny na błędy popupów.
   */
  public renderGoogleButton(
    container: HTMLElement,
    options?: {
      theme?: 'outline' | 'filled_blue' | 'filled_black';
      size?: 'large' | 'medium' | 'small';
      text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
      shape?: 'rectangular' | 'pill' | 'circle' | 'square';
      width?: string | number;
      logo_alignment?: 'left' | 'center';
    }
  ): boolean {
    const googleObj = (window as any).google;
    if (!googleObj?.accounts?.id?.renderButton) {
      return false;
    }

    try {
      container.innerHTML = '';
      googleObj.accounts.id.renderButton(container, {
        type: 'standard',
        theme: options?.theme || 'outline',
        size: options?.size || 'large',
        text: options?.text || 'signin_with',
        shape: options?.shape || 'rectangular',
        logo_alignment: options?.logo_alignment || 'left',
        width: options?.width || 280
      });
      return true;
    } catch (err) {
      console.error('Błąd renderowania google.accounts.id.renderButton:', err);
      return false;
    }
  }

  /**
   * Przetwarza zweryfikowany token ID (JWT) z Google Identity Services i tworzy sesję użytkownika.
   */
  public handleCredentialResponse(credential: string): { user: GoogleUserProfile; idToken: string } {
    const payload = parseJwtPayload(credential);
    if (!payload || !payload.email) {
      throw new Error('Google Identity Services nie zwróciło prawidłowego profilu użytkownika w tokenie ID.');
    }

    const user: GoogleUserProfile = {
      sub: payload.sub,
      email: payload.email,
      email_verified: Boolean(payload.email_verified),
      name: payload.name || payload.email,
      given_name: payload.given_name,
      family_name: payload.family_name,
      picture: payload.picture,
      locale: payload.locale
    };

    const expiresAt = payload.exp ? payload.exp * 1000 : Date.now() + 3600 * 1000;

    const session: GoogleSessionState = {
      connected: true,
      user,
      accessToken: null,
      idToken: credential,
      expiresAt,
      scopes: DEFAULT_GOOGLE_SCOPES
    };

    this.saveSession(session);
    return { user, idToken: credential };
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
    if (!clientId || clientId.trim().length === 0) {
      throw new Error(
        'Brak skonfigurowanego Google Client ID. Wprowadź identyfikator klienta z Google Cloud Console przed rozpoczęciem logowania.'
      );
    }
    const scopesStr = DEFAULT_GOOGLE_SCOPES.join(' ');
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://omni.kvbi.pl';

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
                const isOriginMismatch =
                  tokenResponse.error === 'origin_mismatch' ||
                  tokenResponse.error_description?.toLowerCase().includes('origin_mismatch') ||
                  tokenResponse.error?.toLowerCase().includes('origin_mismatch');

                if (isOriginMismatch) {
                  reject(
                    new Error(
                      `Błąd autoryzacji Google (400: origin_mismatch): Bieżący adres ${currentOrigin} nie jest zarejestrowany w Google Cloud Console w sekcji „Autoryzowane źródła JavaScript” dla Client ID: ${clientId}.`
                    )
                  );
                } else {
                  reject(new Error(tokenResponse.error_description || tokenResponse.error || 'Błąd autoryzacji Google'));
                }
                return;
              }

              const accessToken = tokenResponse.access_token;
              if (!accessToken) {
                reject(new Error('Google nie zwróciło tokena dostępowego'));
                return;
              }

              try {
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
              const errMsg = err?.message || String(err);
              if (errMsg.toLowerCase().includes('origin_mismatch') || errMsg.toLowerCase().includes('idpiframe_initialization_failed')) {
                reject(
                  new Error(
                    `Błąd autoryzacji Google (400: origin_mismatch): Bieżący adres ${currentOrigin} nie jest zarejestrowany w Google Cloud Console w sekcji „Autoryzowane źródła JavaScript” dla Client ID: ${clientId}.`
                  )
                );
              } else {
                reject(new Error(errMsg || 'Niepowodzenie inicjalizacji Google Identity Services'));
              }
            }
          });

          client.requestAccessToken();
        } catch (err: any) {
          console.warn('Przełączanie na standardowy OAuth 2.0 popup:', err);
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
      const redirectUri = typeof window !== 'undefined' ? window.location.origin : 'https://omni.kvbi.pl';
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
              const isOriginMismatch = error.toLowerCase().includes('origin_mismatch');
              const errorMsg = isOriginMismatch
                ? `Błąd autoryzacji Google (400: origin_mismatch): Bieżący adres ${redirectUri} nie jest zarejestrowany w Google Cloud Console dla Client ID: ${clientId}.`
                : `Odrzucono autoryzację Google: ${error}`;
              reject(new Error(errorMsg));
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

      const timer = setInterval(async () => {
        if (popup.closed) {
          cleanup();
          if (!resolved) {
            reject(
              new Error(
                `Okno logowania Google zostało zamknięte przed ukończeniem autoryzacji. Jeżeli w oknie Google pojawił się błąd „Błąd 400: origin_mismatch”, zarejestruj adres ${redirectUri} w Google Cloud Console w sekcji „Autoryzowane źródła JavaScript”.`
              )
            );
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
              const isOriginMismatch = error.toLowerCase().includes('origin_mismatch');
              const errorMsg = isOriginMismatch
                ? `Błąd autoryzacji Google (400: origin_mismatch): Bieżący adres ${redirectUri} nie jest zarejestrowany w Google Cloud Console dla Client ID: ${clientId}.`
                : `Odrzucono autoryzację Google: ${error}`;
              reject(new Error(errorMsg));
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
          // Cross-origin dostęp zablokowany dopóki popup jest na domenach google.com — zachowanie oczekiwane
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
