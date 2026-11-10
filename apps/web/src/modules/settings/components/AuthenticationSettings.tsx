import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Badge } from '../../../components/ui/Badge';
import {
  KeyRound,
  Mail,
  Lock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Bot,
  GraduationCap,
  LogOut,
  Sparkles,
  ShieldCheck,
  Settings2,
  Globe,
  ExternalLink,
  Copy,
  Check,
  Eye,
  EyeOff,
  Save
} from 'lucide-react';
import { authApi, aiApi, AiEngineStatus } from '../../../api/client';
import { googleAuthService, GoogleSessionState } from '../../../services/googleAuth';

// Oficjalna ikona Google SVG
const GoogleLogoSvg: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      fill="#EA4335"
    />
  </svg>
);

export const AuthenticationSettings: React.FC = () => {
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTestingImap, setIsTestingImap] = useState(false);
  const [imapResult, setImapResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [googleAuthError, setGoogleAuthError] = useState<string | null>(null);
  const [tokenRegenerated, setTokenRegenerated] = useState<string | null>(null);
  const [copiedOrigin, setCopiedOrigin] = useState(false);

  // Sesja klienta Google Identity
  const [localGoogleSession, setLocalGoogleSession] = useState<GoogleSessionState | null>(() =>
    googleAuthService.getStoredSession()
  );

  // Konfiguracja Google Client ID
  const [showClientIdConfig, setShowClientIdConfig] = useState(false);
  const [clientIdInput, setClientIdInput] = useState(() => googleAuthService.getClientId());
  const [isVerifyingToken, setIsVerifyingToken] = useState(false);
  const [verifyStatusMessage, setVerifyStatusMessage] = useState<string | null>(null);

  // Referencja do kontenera renderowania oficjalnego przycisku Google Identity Services
  const googleButtonContainerRef = useRef<HTMLDivElement | null>(null);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://omni.kvbi.pl';

  // Stan konfiguracji Groq AI
  const [aiStatus, setAiStatus] = useState<AiEngineStatus | null>(null);
  const [groqKeyInput, setGroqKeyInput] = useState('');
  const [showGroqConfig, setShowGroqConfig] = useState(false);
  const [isSavingGroqKey, setIsSavingGroqKey] = useState(false);
  const [groqKeyMasked, setGroqKeyMasked] = useState(true);
  const [groqSaveMessage, setGroqSaveMessage] = useState<{ success: boolean; text: string } | null>(null);

  const loadStatus = async () => {
    setIsLoading(true);
    try {
      const [res, aiRes] = await Promise.allSettled([
        authApi.getStatus(),
        aiApi.getStatus()
      ]);
      if (res.status === 'fulfilled') {
        setAuthStatus(res.value);
      }
      if (aiRes.status === 'fulfilled') {
        setAiStatus(aiRes.value);
      }
      // Odśwież stan lokalnej sesji Google
      const currentStored = googleAuthService.getStoredSession();
      setLocalGoogleSession(currentStored);
    } catch (err) {
      console.warn('Nie udało się pobrać statusu autoryzacji:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveGroqKey = async () => {
    if (!groqKeyInput.trim()) return;
    setIsSavingGroqKey(true);
    setGroqSaveMessage(null);
    try {
      const res = await aiApi.saveConfig({ apiKey: groqKeyInput.trim() });
      setAiStatus(res.status);
      setGroqSaveMessage({ success: true, text: res.message || 'Klucz Groq API zweryfikowany i zapisany.' });
      setGroqKeyInput('');
      setShowGroqConfig(false);
    } catch (err: any) {
      setGroqSaveMessage({
        success: false,
        text: err.message || 'Niepowodzenie weryfikacji klucza Groq (Błąd 401 Unauthorized).'
      });
      try {
        const fresh = await aiApi.getStatus();
        setAiStatus(fresh);
      } catch {}
    } finally {
      setIsSavingGroqKey(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const providers = authStatus?.providers;
  const serverClientId = providers?.googleOAuth?.clientId || '';
  const currentClientId = googleAuthService.getClientId() || serverClientId;
  const hasValidClientId = Boolean(
    currentClientId && currentClientId.trim().length > 10 && currentClientId.includes('.apps.googleusercontent.com')
  );

  const isGoogleConnected = Boolean(
    localGoogleSession?.connected ||
    providers?.googleOAuth?.connectedEmail
  );

  // Uaktualnij stan inputu gdy serwer zwróci skonfigurowany clientId
  useEffect(() => {
    if (serverClientId && !googleAuthService.getClientId()) {
      googleAuthService.setClientId(serverClientId);
      setClientIdInput(serverClientId);
    }
  }, [serverClientId]);

  // Inicjalizacja i renderowanie oficjalnego przycisku Google Identity Services (google.accounts.id.renderButton)
  useEffect(() => {
    let isCancelled = false;

    const setupGoogleIdentityButton = async () => {
      if (!hasValidClientId || isGoogleConnected || !googleButtonContainerRef.current) {
        return;
      }

      try {
        const initialized = await googleAuthService.initializeGoogleIdentity(
          currentClientId,
          async (credentialResponse) => {
            if (isCancelled) return;
            setIsConnectingGoogle(true);
            setGoogleAuthError(null);
            try {
              const { user, idToken } = googleAuthService.handleCredentialResponse(credentialResponse.credential);
              await authApi.authorizeGoogle({
                idToken,
                email: user.email,
                clientId: currentClientId
              });
              setLocalGoogleSession(googleAuthService.getStoredSession());
              await loadStatus();
              setVerifyStatusMessage(`Zalogowano pomyślnie jako ${user.name || user.email} przez oficjalny moduł Google Identity Services.`);
            } catch (err: any) {
              console.error('Błąd autoryzacji przez Google Identity Button:', err);
              setGoogleAuthError(err.message || 'Błąd przetwarzania tokena Google Identity Services.');
            } finally {
              setIsConnectingGoogle(false);
            }
          }
        );

        if (initialized && googleButtonContainerRef.current && !isCancelled) {
          googleAuthService.renderGoogleButton(googleButtonContainerRef.current, {
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            shape: 'rectangular',
            width: 280
          });
        }
      } catch (err: any) {
        console.warn('Nie udało się wyrenderować przycisku GIS renderButton:', err);
      }
    };

    setupGoogleIdentityButton();

    return () => {
      isCancelled = true;
    };
  }, [hasValidClientId, currentClientId, isGoogleConnected]);

  const handleCopyOrigin = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(currentOrigin);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = currentOrigin;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedOrigin(true);
      setTimeout(() => setCopiedOrigin(false), 3000);
    } catch (err) {
      console.warn('Nie udało się skopiować origin do schowka:', err);
    }
  };

  const handleSaveClientId = async () => {
    const trimmed = clientIdInput.trim();
    googleAuthService.setClientId(trimmed);
    setGoogleAuthError(null);
    try {
      if (trimmed.length > 0) {
        await authApi.authorizeGoogle({ clientId: trimmed });
      }
      setVerifyStatusMessage('Pomyślnie zaktualizowano Google Client ID.');
      setShowClientIdConfig(false);
      await loadStatus();
    } catch (err: any) {
      setGoogleAuthError(`Błąd synchronizacji Client ID: ${err.message}`);
    }
  };

  /**
   * Logowanie przez publiczne Google Identity Services / Publiczny OAuth 2.0 (Token Client / Popup)
   */
  const handleConnectGoogle = async () => {
    setGoogleAuthError(null);
    setVerifyStatusMessage(null);

    // Sprawdzenie czy Client ID został wprowadzony
    if (!hasValidClientId) {
      setShowClientIdConfig(true);
      setGoogleAuthError('Brak skonfigurowanego Google Client ID. Wprowadź Client ID z Google Cloud Console, aby aktywować logowanie.');
      return;
    }

    setIsConnectingGoogle(true);
    try {
      // 1. Wywołaj bezpośrednią autoryzację Google w przeglądarce
      const result = await googleAuthService.signInWithGoogle();

      // 2. Synchronizuj zweryfikowaną tożsamość z serwerem OmniDash
      await authApi.authorizeGoogle({
        accessToken: result.accessToken,
        idToken: result.idToken,
        email: result.user.email,
        clientId: currentClientId
      });

      // 3. Załaduj zaktualizowany stan
      await loadStatus();
      setVerifyStatusMessage(`Zalogowano pomyślnie jako ${result.user.name || result.user.email} przez oficjalne Google Identity API.`);
    } catch (err: any) {
      console.error('Błąd autoryzacji Google OAuth 2.0:', err);
      setGoogleAuthError(err.message || 'Niepowodzenie autoryzacji przez Google Identity.');
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  /**
   * Odłączenie konta Google i unieważnienie tokenów
   */
  const handleDisconnectGoogle = async () => {
    try {
      await googleAuthService.disconnect();
      await authApi.disconnectGoogle();
      setLocalGoogleSession(null);
      setVerifyStatusMessage(null);
      await loadStatus();
    } catch (err: any) {
      console.error('Błąd odłączania konta Google:', err);
    }
  };

  /**
   * Weryfikacja tokena bezpośrednio w publicznym punkcie końcowym Google tokeninfo
   */
  const handleVerifyDirectWithGoogle = async () => {
    const session = localGoogleSession || googleAuthService.getStoredSession();
    if (!session?.accessToken && !session?.idToken) {
      setGoogleAuthError('Brak aktywnego tokena Google (Access lub ID) do weryfikacji.');
      return;
    }

    setIsVerifyingToken(true);
    setVerifyStatusMessage(null);
    try {
      if (session.accessToken) {
        const info = await googleAuthService.verifyTokeninfo(session.accessToken, 'access_token');
        setVerifyStatusMessage(
          `Zweryfikowano Access Token w Google tokeninfo: scope=${info.scope || 'ok'}, ważność=${info.expires_in}s.`
        );
      } else if (session.idToken) {
        const info = await googleAuthService.verifyTokeninfo(session.idToken, 'id_token');
        setVerifyStatusMessage(
          `Zweryfikowano ID Token w Google tokeninfo: email=${info.email}, issuer=${info.iss}.`
        );
      }
    } catch (err: any) {
      setVerifyStatusMessage(`Błąd weryfikacji w Google API: ${err.message}`);
    } finally {
      setIsVerifyingToken(false);
    }
  };

  const handleTestImap = async () => {
    setIsTestingImap(true);
    setImapResult(null);
    try {
      const res = await authApi.testImap();
      setImapResult({
        success: res.success,
        message: res.message
      });
    } catch (err: any) {
      setImapResult({
        success: false,
        message: err.message || 'Błąd testowania połączenia IMAP.'
      });
    } finally {
      setIsTestingImap(false);
    }
  };

  const handleRegenerateToken = async () => {
    try {
      const res = await authApi.regenerateToken();
      setTokenRegenerated(res.token);
      setTimeout(() => setTokenRegenerated(null), 6000);
    } catch (err: any) {
      console.error('Błąd generowania tokena:', err);
    }
  };

  const activeGoogleEmail = localGoogleSession?.user?.email || providers?.googleOAuth?.connectedEmail;
  const activeGoogleName = localGoogleSession?.user?.name || providers?.googleOAuth?.connectedName;
  const activeGooglePicture = localGoogleSession?.user?.picture || providers?.googleOAuth?.connectedPicture;

  const isOriginMismatchError = Boolean(
    googleAuthError &&
    (googleAuthError.includes('origin_mismatch') ||
      googleAuthError.includes('zamknięte przed ukończeniem autoryzacji') ||
      googleAuthError.includes('Błąd 400'))
  );

  return (
    <div className="space-y-4">
      {/* 1. Header Card */}
      <GlassCard className="p-4 sm:p-5" glow="sky">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-sky-500/10 text-sky-500 border border-sky-500/20 shadow-sm">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Centrum Uwierzytelniania & Integracji Zero-Trust</span>
                <Badge variant="cyan">Auth v4.0</Badge>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Publiczne Google Identity Services (OAuth 2.0), IMAP TLS, Pushbullet i rotacja sesji
              </p>
            </div>
          </div>
          <button
            onClick={loadStatus}
            disabled={isLoading}
            className="p-2 rounded-xl text-slate-400 hover:text-sky-500 transition active:scale-95 border border-slate-200 dark:border-slate-800"
            title="Odśwież status połączeń"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </GlassCard>

      {/* 2. Google OAuth 2.0 & Identity Services (Public API Zero-Mock) */}
      <GlassCard className="p-4 sm:p-5" glow="emerald">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-500 border border-teal-500/20 shadow-sm">
              <GoogleLogoSvg className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span>Google Identity Services (OAuth 2.0 & REST API)</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  PUBLIC API
                </span>
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Bezpośrednia autoryzacja przez publiczne endpointy Google bez serwerów pośredniczących
              </p>
            </div>
          </div>
          <Badge variant={isGoogleConnected ? 'success' : hasValidClientId ? 'cyan' : 'amber'}>
            {isGoogleConnected ? 'POŁĄCZONO' : hasValidClientId ? 'GOTOWY DO LOGOWANIA' : 'WYMAGA CLIENT ID'}
          </Badge>
        </div>

        <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
          {/* Opis architektury */}
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Standardowa integracja z oficjalnym <strong>Google Identity Services</strong> (OAuth 2.0 Implicit/PKCE).
            Bezpośrednia komunikacja z serwerami Google bez żadnych pośredników, proxy ani Firebase.
          </p>

          {/* DEDYKOWANA RAMKA: Bieżący Origin & Zapobieganie Błędowi 400 origin_mismatch */}
          <div className="p-3.5 rounded-xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/30 dark:border-amber-500/20 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                <Globe className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Wykryty JavaScript Origin dla Google OAuth:</span>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300">
                  {currentOrigin}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyOrigin}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition active:scale-95 shadow-sm flex items-center gap-1.5"
                  title="Skopiuj dokładny adres URL do wklejenia w Google Cloud Console"
                >
                  {copiedOrigin ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Skopiowano Origin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Kopiuj dokładny Origin do Google Console</span>
                    </>
                  )}
                </button>
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 transition flex items-center gap-1 text-xs"
                  title="Otwórz Google Cloud Console Credentials"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
            <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80 leading-relaxed font-medium">
              [!] <strong>Zalecenie konfiguracyjne:</strong> Aby uniknąć błędu <strong>400: origin_mismatch</strong>, wklej ten dokładny adres (
              <code className="font-mono bg-amber-500/10 px-1 py-0.5 rounded">{currentOrigin}</code>) w sekcji <strong>„Autoryzowane źródła JavaScript” (Authorized JavaScript origins)</strong> oraz <strong>„Autoryzowane identyfikatory URI przekierowania”</strong> dla Twojego identyfikatora klienta OAuth w Google Cloud Console.
            </p>
          </div>

          {/* Panel konfiguracji Client ID / Status klucza */}
          <div className="p-3 rounded-xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-xs flex items-center gap-2">
                <span className="font-bold text-slate-700 dark:text-slate-300">Google Client ID:</span>
                {hasValidClientId ? (
                  <span className="font-mono text-emerald-500 dark:text-emerald-400 text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {currentClientId.slice(0, 12)}••••••••{currentClientId.slice(-28)}
                  </span>
                ) : (
                  <span className="font-mono text-amber-400 text-[11px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Nie skonfigurowano</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowClientIdConfig(!showClientIdConfig)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition flex items-center gap-1.5"
                >
                  <Settings2 className="w-3.5 h-3.5 text-teal-500 dark:text-teal-400" />
                  <span>{showClientIdConfig ? 'Ukryj konfigurację' : hasValidClientId ? 'Zmień Client ID' : 'Wprowadź Client ID'}</span>
                </button>
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-300 border border-teal-500/30 transition flex items-center gap-1"
                  title="Otwórz Google Cloud Console Credentials"
                >
                  <span>Google Console</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Formularz edycji Client ID */}
            {showClientIdConfig && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2 animate-in fade-in duration-150">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block">
                    Identyfikator klienta aplikacji internetowej (OAuth 2.0 Web Client ID):
                  </label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      placeholder="np. 1234567890-abcdef.apps.googleusercontent.com"
                      value={clientIdInput}
                      onChange={(e) => setClientIdInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                    <button
                      onClick={handleSaveClientId}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white transition active:scale-95 shadow-sm"
                    >
                      Zapisz Client ID
                    </button>
                  </div>
                </div>

                {/* Czytelna instrukcja konfiguracji w Google Cloud Console */}
                <div className="p-2.5 rounded-xl bg-teal-500/5 border border-teal-500/20 text-[11px] text-slate-600 dark:text-slate-300 space-y-1.5">
                  <div className="font-bold text-teal-600 dark:text-teal-300 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Instrukcja konfiguracji w Google Cloud Console:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[10.5px] leading-relaxed pl-1 text-slate-600 dark:text-slate-400">
                    <li>
                      Otwórz sekcję{' '}
                      <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer noopener" className="text-teal-500 dark:text-teal-400 underline font-mono">
                        APIs & Services &gt; Credentials
                      </a>.
                    </li>
                    <li>
                      Wybierz istniejący <strong>OAuth 2.0 Client ID</strong> lub utwórz nowy: <strong>Web application</strong>.
                    </li>
                    <li>
                      W polu <strong>Authorized JavaScript origins</strong> dodaj dokładny adres aplikacji:
                      <div className="flex flex-wrap items-center gap-1.5 mt-1 font-mono text-[10px]">
                        <code className="bg-slate-200 dark:bg-slate-900 px-2 py-0.5 rounded text-teal-600 dark:text-teal-300 border border-slate-300 dark:border-slate-700 font-bold">
                          {currentOrigin}
                        </code>
                        <button
                          onClick={handleCopyOrigin}
                          className="px-2 py-0.5 rounded bg-teal-500/15 hover:bg-teal-500/25 text-teal-700 dark:text-teal-300 border border-teal-500/30 text-[10px]"
                        >
                          {copiedOrigin ? 'Skopiowano!' : 'Kopiuj'}
                        </button>
                      </div>
                    </li>
                    <li>
                      W polu <strong>Authorized redirect URIs</strong> wklej ten sam adres URL (np. <code className="font-mono text-teal-500">{currentOrigin}</code>) oraz zatwierdź przyciskiem <strong>Save</strong>.
                    </li>
                    <li>Skopiuj wygenerowany <strong>Client ID</strong> i wklej powyżej.</li>
                  </ol>
                </div>
              </div>
            )}
          </div>

          {/* Transparentny wykaz publicznych endpointów Google */}
          <div className="p-2.5 rounded-xl bg-slate-100/60 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/60 text-[10.5px] font-mono text-slate-600 dark:text-slate-400">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
              <Globe className="w-3.5 h-3.5 text-teal-500 dark:text-teal-400" />
              <span>Publiczne punkty końcowe Google API (Standard Zero-Mock):</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[10px]">
              <div>OAuth 2.0 Auth: <span className="text-teal-500 dark:text-teal-400">accounts.google.com/o/oauth2/v2/auth</span></div>
              <div>REST UserInfo: <span className="text-teal-500 dark:text-teal-400">googleapis.com/oauth2/v3/userinfo</span></div>
              <div>GIS Client SDK: <span className="text-teal-500 dark:text-teal-400">accounts.google.com/gsi/client</span></div>
              <div>Token Revoke: <span className="text-teal-500 dark:text-teal-400">oauth2.googleapis.com/revoke</span></div>
            </div>
          </div>

          {/* Dedykowany baner naprawczy błędu origin_mismatch */}
          {isOriginMismatchError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-rose-400">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>[!] Diagnostyka błędu autoryzacji Google (400: origin_mismatch)</span>
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11.5px]">
                Google zablokowało logowanie, ponieważ adres źródła JavaScript (<strong>{currentOrigin}</strong>) nie jest zarejestrowany na liście autoryzowanych adresów URI dla skonfigurowanego Google Client ID w Google Cloud Console.
              </p>
              <div className="p-2.5 rounded-lg bg-black/30 border border-rose-500/20 text-[11px] space-y-1 font-mono text-rose-200">
                <div className="font-bold text-white mb-1">Procedura naprawcza krok po kroku:</div>
                <div>1. Kliknij przycisk „Kopiuj dokładny Origin do Google Console” powyżej (wartość: <span className="text-teal-300">{currentOrigin}</span>).</div>
                <div>2. Otwórz <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer noopener" className="underline text-teal-400">Google Cloud Console &gt; Credentials</a>.</div>
                <div>3. Wejdź w edycję identyfikatora Web Client ID i wklej skopiowany adres w sekcji <strong>Autoryzowane źródła JavaScript</strong>.</div>
                <div>4. Wklej ten sam adres w sekcji <strong>Autoryzowane identyfikatory URI przekierowania</strong> i kliknij <strong>Zapisz</strong>.</div>
              </div>
            </div>
          )}

          {/* Standardowy komunikat o błędzie (gdy inny niż origin_mismatch) */}
          {googleAuthError && !isOriginMismatchError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-xs text-rose-300">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{googleAuthError}</span>
            </div>
          )}

          {/* Komunikat weryfikacji */}
          {verifyStatusMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-300 font-mono">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 dark:text-emerald-400" />
              <span>{verifyStatusMessage}</span>
            </div>
          )}

          {/* Stan 1: Połączono z kontem Google */}
          {isGoogleConnected ? (
            <div className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {activeGooglePicture ? (
                  <img
                    src={activeGooglePicture}
                    alt={activeGoogleName || 'Google User'}
                    className="w-10 h-10 rounded-full border border-teal-400/40 object-cover shadow-sm"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 font-bold">
                    {(activeGoogleName || activeGoogleEmail || 'G').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-teal-800 dark:text-teal-200 text-sm">
                      {activeGoogleName || 'Zweryfikowany użytkownik Google'}
                    </span>
                    <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                  </div>
                  <div className="font-mono text-teal-700 dark:text-teal-300 text-xs mt-0.5">{activeGoogleEmail}</div>
                  <div className="flex flex-wrap gap-1 mt-1 text-[10px] text-teal-700 dark:text-teal-400/80">
                    <span className="px-1.5 py-0.2 rounded bg-teal-500/20 font-mono">openid</span>
                    <span className="px-1.5 py-0.2 rounded bg-teal-500/20 font-mono">userinfo.email</span>
                    <span className="px-1.5 py-0.2 rounded bg-teal-500/20 font-mono">gmail.readonly</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={handleVerifyDirectWithGoogle}
                  disabled={isVerifyingToken}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-teal-500/20 text-teal-800 dark:text-teal-200 border border-teal-500/30 hover:bg-teal-500/30 transition flex items-center gap-1.5"
                  title="Weryfikuj token w publicznym Google API"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isVerifyingToken ? 'animate-spin' : ''}`} />
                  <span>Weryfikuj</span>
                </button>
                <button
                  onClick={handleDisconnectGoogle}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 transition flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Odłącz</span>
                </button>
              </div>
            </div>
          ) : (
            /* Stan 2: Brak połączenia — Oficjalny przycisk GIS renderButton oraz Token Client Popup */
            <div className="space-y-3 pt-1">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {hasValidClientId ? (
                  <span>Wybierz metodę autoryzacji Google. Oficjalny przycisk GIS osadzony bezpośrednio w stronie jest odporny na blokady wyskakujących okien (popup blocker):</span>
                ) : (
                  <span className="text-amber-500 dark:text-amber-400 font-medium flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Wprowadź swój Google Client ID powyżej, aby aktywować logowanie OAuth 2.0 bez błędu 401.</span>
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* 1. Oficjalny przycisk Google Identity Services (google.accounts.id.renderButton) */}
                {hasValidClientId && (
                  <div className="flex flex-col items-start gap-1">
                    <div ref={googleButtonContainerRef} className="min-h-[40px] flex items-center" />
                    <span className="text-[10px] text-slate-400 font-mono pl-1">
                      Zalecany: oficjalny komponent GIS renderButton (osadzony)
                    </span>
                  </div>
                )}

                {/* 2. Alternatywny przycisk Token Client / OAuth 2.0 Popup */}
                <div className="flex flex-col items-start gap-1">
                  <button
                    onClick={handleConnectGoogle}
                    disabled={isConnectingGoogle}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition active:scale-95 flex items-center justify-center gap-2.5 min-h-[40px] ${
                      hasValidClientId
                        ? 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 shadow-sm'
                        : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {isConnectingGoogle ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-teal-500" />
                        <span>Łączenie z Google...</span>
                      </>
                    ) : (
                      <>
                        <GoogleLogoSvg className="w-4 h-4" />
                        <span>{hasValidClientId ? 'Logowanie przez Popup / Token Client' : 'Skonfiguruj Google Client ID'}</span>
                      </>
                    )}
                  </button>
                  {hasValidClientId && (
                    <span className="text-[10px] text-slate-400 font-mono pl-1">
                      Alternatywny: standardowy przepływ w oknie popup
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* 3. IMAP Mail RFC 3501 (App Passwords) */}
      <GlassCard className="p-4 sm:p-5" glow="sky">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500 border border-sky-500/20 shadow-sm">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Klient Poczty IMAP (RFC 3501 TLS & App Passwords)
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Aktywny moduł Mail Triage w kontenerze omnidash-worker (port 993)
              </p>
            </div>
          </div>
          <Badge variant={providers?.imap?.configured ? 'success' : 'slate'}>
            {providers?.imap?.configured ? 'SKONFIGUROWANO (.ENV)' : 'BRAK DANYCH'}
          </Badge>
        </div>

        <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
              <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Serwer & Port</p>
              <p className="font-mono text-slate-800 dark:text-slate-200 mt-0.5">
                {providers?.imap?.host || 'imap.gmail.com'}:{providers?.imap?.port || 993}
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
              <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Konto Użytkownika</p>
              <p className="font-mono text-slate-800 dark:text-slate-200 mt-0.5">
                {providers?.imap?.userMasked || 'Brak w .env'}
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
              <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Szyfrowanie TLS</p>
              <p className="font-mono text-emerald-500 mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Wymuszone (Port 993)</span>
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Wymaga 16-znakowego Hasła do Aplikacji Google (App Password) zapisanego w <code className="font-mono bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">.env</code> na serwerze Mikrus.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <button
              onClick={handleTestImap}
              disabled={isTestingImap}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-sm transition active:scale-95 flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTestingImap ? 'animate-spin' : ''}`} />
              <span>{isTestingImap ? 'Weryfikacja IMAP...' : 'Przetestuj Połączenie IMAP'}</span>
            </button>

            {imapResult && (
              <div
                className={`text-xs p-2 rounded-xl border flex items-center gap-2 ${
                  imapResult.success
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}
              >
                {imapResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                <span className="truncate">{imapResult.message}</span>
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      {/* 4. Usługi Powiązane (Pushbullet, Librus, Groq) */}
      <GlassCard className="p-4 sm:p-5" glow="sky">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
          Pozostałe Mosty i Konektory Usług Zewnętrznych
        </h4>

        <div className="space-y-2">
          {/* Pushbullet */}
          <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Pushbullet WebSocket & REST API</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  {providers?.pushbullet?.configured
                    ? `Klucz: ${providers.pushbullet.maskedKey} (${providers.pushbullet.source})`
                    : 'Brak klucza API w konfiguracji'}
                </p>
              </div>
            </div>
            <Badge variant={providers?.pushbullet?.configured ? 'success' : 'slate'}>
              {providers?.pushbullet?.configured ? 'POŁĄCZONO' : 'BRAK'}
            </Badge>
          </div>

          {/* Librus Synergia */}
          <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Librus Synergia (E-Dziennik)</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  {providers?.librus?.configured
                    ? `Login: ${providers.librus.loginMasked} (Scraper synchronizacji ocen i zastępstw)`
                    : 'Logowanie skonfigurowane w .env'}
                </p>
              </div>
            </div>
            <Badge variant="success">SKONFIGUROWANO</Badge>
          </div>

          {/* Groq Cloud AI */}
          <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${aiStatus?.connected ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Groq Cloud AI (openai/gpt-oss-120b)
                    </p>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      LPU ENGINE
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    {aiStatus?.maskedKey
                      ? `Klucz: ${aiStatus.maskedKey} (${aiStatus.source === 'database' ? 'baza SQLite' : 'plik .env'})`
                      : 'Brak aktywnego klucza Groq w konfiguracji'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={aiStatus?.connected ? 'success' : aiStatus?.error?.includes('401') ? 'danger' : 'amber'}>
                  {aiStatus?.connected
                    ? 'POŁĄCZONO'
                    : aiStatus?.error?.includes('401')
                    ? 'BŁĄD 401 (NIEPRAWIDŁOWY KLUCZ)'
                    : 'WYMAGA KLUCZA API'}
                </Badge>
                <button
                  onClick={() => setShowGroqConfig(!showGroqConfig)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition flex items-center gap-1.5"
                >
                  <Settings2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>{showGroqConfig ? 'Ukryj' : aiStatus?.connected ? 'Zmień klucz' : 'Skonfiguruj'}</span>
                </button>
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition flex items-center gap-1"
                  title="Otwórz konsolę kluczy Groq (Darmowy klucz API)"
                >
                  <span>Groq Console</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {aiStatus?.error && !aiStatus.connected && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>{aiStatus.error}</span>
              </div>
            )}

            {groqSaveMessage && (
              <div
                className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 font-mono ${
                  groqSaveMessage.success
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                }`}
              >
                {groqSaveMessage.success ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                )}
                <span>{groqSaveMessage.text}</span>
              </div>
            )}

            {showGroqConfig && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2 animate-in fade-in duration-150">
                <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block">
                  Klucz API Groq Cloud (format: <code className="font-mono text-purple-400">gsk_...</code>):
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type={groqKeyMasked ? 'password' : 'text'}
                      placeholder="Wklej klucz Groq gsk_..."
                      value={groqKeyInput}
                      onChange={(e) => setGroqKeyInput(e.target.value)}
                      className="w-full px-3 py-1.5 pr-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => setGroqKeyMasked(!groqKeyMasked)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {groqKeyMasked ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <button
                    onClick={handleSaveGroqKey}
                    disabled={isSavingGroqKey || !groqKeyInput.trim()}
                    className="px-4 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition active:scale-95 shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {isSavingGroqKey ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Testowanie...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Zapisz i przetestuj połączenie</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Klucz jest bezpłatny i natychmiastowy. Możesz go wygenerować na{' '}
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-purple-400 underline font-mono"
                  >
                    console.groq.com/keys
                  </a>
                  . Po zapisaniu klucz zostanie zweryfikowany z endpointem Groq LPU i utrwalony w lokalnej bazie danych SQLite.
                </p>
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      {/* 5. Zero-Trust Session & Token Rotation */}
      <GlassCard className="p-4 sm:p-5" glow="sky">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Sesja Operatora Zero-Trust (Bearer Token)
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Tożsamość, uprawnienia administracyjne i rotacja tokenów dostępowych
              </p>
            </div>
          </div>
          <Badge variant="success">ADMIN (SYSTEM CORE)</Badge>
        </div>

        <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {activeGoogleEmail || authStatus?.user?.email || 'operator@omnidash.internal'}
            </div>
            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
              Rola: {authStatus?.user?.role || 'ADMIN'} • Tryb: Pełna autoryzacja Zero-Trust
            </div>
          </div>

          <button
            onClick={handleRegenerateToken}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Rotuj Token Sesji</span>
          </button>
        </div>

        {tokenRegenerated && (
          <div className="mt-3 p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs font-mono text-indigo-600 dark:text-indigo-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-indigo-500 dark:text-indigo-400" />
            <span>Wygenerowano nowy token sesji: {tokenRegenerated}</span>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
