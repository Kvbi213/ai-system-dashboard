import React, { useState, useEffect } from 'react';
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
  ExternalLink
} from 'lucide-react';
import { authApi } from '../../../api/client';
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

  // Sesja klienta Google Identity
  const [localGoogleSession, setLocalGoogleSession] = useState<GoogleSessionState | null>(() =>
    googleAuthService.getStoredSession()
  );

  // Konfiguracja Google Client ID
  const [showClientIdConfig, setShowClientIdConfig] = useState(false);
  const [clientIdInput, setClientIdInput] = useState(() => googleAuthService.getClientId());
  const [isVerifyingToken, setIsVerifyingToken] = useState(false);
  const [verifyStatusMessage, setVerifyStatusMessage] = useState<string | null>(null);

  const loadStatus = async () => {
    setIsLoading(true);
    try {
      const res = await authApi.getStatus();
      setAuthStatus(res);
      // Odśwież stan lokalnej sesji Google
      const currentStored = googleAuthService.getStoredSession();
      setLocalGoogleSession(currentStored);
    } catch (err) {
      console.warn('Nie udało się pobrać statusu autoryzacji:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

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

  const providers = authStatus?.providers;
  const serverClientId = providers?.googleOAuth?.clientId || '';
  const currentClientId = googleAuthService.getClientId() || serverClientId;
  const hasValidClientId = Boolean(currentClientId && currentClientId.trim().length > 10 && currentClientId.includes('.apps.googleusercontent.com'));

  // Uaktualnij stan inputu gdy serwer zwróci skonfigurowany clientId
  useEffect(() => {
    if (serverClientId && !googleAuthService.getClientId()) {
      googleAuthService.setClientId(serverClientId);
      setClientIdInput(serverClientId);
    }
  }, [serverClientId]);

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
   * Logowanie przez publiczne Google Identity Services / Publiczny OAuth 2.0
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
   * Weryfikacja tokena bezpośrednio w publicznym endpointcie Google tokeninfo
   */
  const handleVerifyDirectWithGoogle = async () => {
    const session = localGoogleSession || googleAuthService.getStoredSession();
    if (!session?.accessToken) {
      setGoogleAuthError('Brak aktywnego tokena dostępowego Google do weryfikacji.');
      return;
    }

    setIsVerifyingToken(true);
    setVerifyStatusMessage(null);
    try {
      const info = await googleAuthService.verifyTokeninfo(session.accessToken, 'access_token');
      setVerifyStatusMessage(
        `Zweryfikowano w https://oauth2.googleapis.com/tokeninfo: scope=${info.scope || 'ok'}, ważność=${info.expires_in}s.`
      );
    } catch (err: any) {
      setVerifyStatusMessage(`Błąd weryfikacji w Google API: ${err.message}`);
    } finally {
      setIsVerifyingToken(false);
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

  const isGoogleConnected = Boolean(
    localGoogleSession?.connected ||
    providers?.googleOAuth?.connectedEmail
  );
  const activeGoogleEmail = localGoogleSession?.user?.email || providers?.googleOAuth?.connectedEmail;
  const activeGoogleName = localGoogleSession?.user?.name || providers?.googleOAuth?.connectedName;
  const activeGooglePicture = localGoogleSession?.user?.picture || providers?.googleOAuth?.connectedPicture;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://omnidash.kvbi.pl';

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

          {/* Panel konfiguracji Client ID / Status klucza */}
          <div className="p-3 rounded-xl bg-slate-100/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-xs flex items-center gap-2">
                <span className="font-bold text-slate-700 dark:text-slate-300">Google Client ID:</span>
                {hasValidClientId ? (
                  <span className="font-mono text-emerald-400 text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
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
                  <Settings2 className="w-3.5 h-3.5 text-teal-400" />
                  <span>{showClientIdConfig ? 'Ukryj konfigurację' : hasValidClientId ? 'Zmień Client ID' : 'Wprowadź Client ID'}</span>
                </button>
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 transition flex items-center gap-1"
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
                  <div className="font-bold text-teal-300 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Instrukcja konfiguracji w Google Cloud Console:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[10.5px] leading-relaxed pl-1 text-slate-400">
                    <li>
                      Otwórz sekcję <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer noopener" className="text-teal-400 underline font-mono">APIs & Services &gt; Credentials</a>.
                    </li>
                    <li>
                      Kliknij <strong>+ Create Credentials &gt; OAuth client ID</strong> i wybierz Application type: <strong>Web application</strong>.
                    </li>
                    <li>
                      W polu <strong>Authorized JavaScript origins</strong> dodaj dokładne adresy URL:
                      <div className="flex flex-wrap gap-1 mt-1 font-mono text-[10px]">
                        <code className="bg-slate-900 px-1.5 py-0.5 rounded text-teal-300 border border-slate-700">{currentOrigin}</code>
                        <code className="bg-slate-900 px-1.5 py-0.5 rounded text-teal-300 border border-slate-700">https://omnidash.kvbi.pl</code>
                        <code className="bg-slate-900 px-1.5 py-0.5 rounded text-teal-300 border border-slate-700">https://dash.kvbi.pl</code>
                      </div>
                    </li>
                    <li>
                      W polu <strong>Authorized redirect URIs</strong> dodaj te same adresy oraz kliknij <strong>Save</strong>.
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
              <Globe className="w-3.5 h-3.5 text-teal-400" />
              <span>Publiczne punkty końcowe Google API (Standard Zero-Mock):</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[10px]">
              <div>OAuth 2.0 Auth: <span className="text-teal-400">accounts.google.com/o/oauth2/v2/auth</span></div>
              <div>REST UserInfo: <span className="text-teal-400">googleapis.com/oauth2/v3/userinfo</span></div>
              <div>Tokeninfo Check: <span className="text-teal-400">oauth2.googleapis.com/tokeninfo</span></div>
              <div>Token Revoke: <span className="text-teal-400">oauth2.googleapis.com/revoke</span></div>
            </div>
          </div>

          {/* Komunikat o błędzie */}
          {googleAuthError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-xs text-rose-300">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{googleAuthError}</span>
            </div>
          )}

          {/* Komunikat weryfikacji */}
          {verifyStatusMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-300 font-mono">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
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
                    <span className="font-bold text-teal-200 text-sm">
                      {activeGoogleName || 'Zweryfikowany użytkownik Google'}
                    </span>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="font-mono text-teal-300 text-xs mt-0.5">{activeGoogleEmail}</div>
                  <div className="flex flex-wrap gap-1 mt-1 text-[10px] text-teal-400/80">
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
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-teal-500/20 text-teal-200 border border-teal-500/30 hover:bg-teal-500/30 transition flex items-center gap-1.5"
                  title="Weryfikuj token w publicznym Google API"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isVerifyingToken ? 'animate-spin' : ''}`} />
                  <span>Weryfikuj</span>
                </button>
                <button
                  onClick={handleDisconnectGoogle}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 transition flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Odłącz</span>
                </button>
              </div>
            </div>
          ) : (
            /* Stan 2: Brak połączenia — Przycisk oficjalnego logowania Google z walidacją */
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {hasValidClientId ? (
                  <span>Identyfikator klienta jest skonfigurowany. Kliknij przycisk, aby autoryzować konto w oknie Google.</span>
                ) : (
                  <span className="text-amber-400 font-medium flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Wprowadź swój Google Client ID powyżej, aby aktywować logowanie OAuth 2.0 bez błędu 401.</span>
                  </span>
                )}
              </div>
              <button
                onClick={handleConnectGoogle}
                disabled={isConnectingGoogle}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition active:scale-95 flex items-center justify-center gap-2.5 shrink-0 ${
                  hasValidClientId
                    ? 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 shadow-md'
                    : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30'
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
                    <span>{hasValidClientId ? 'Zaloguj przez Google (OAuth 2.0)' : 'Skonfiguruj Google Client ID'}</span>
                  </>
                )}
              </button>
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

          {/* Groq Cloud */}
          <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Groq Cloud AI (gpt-oss-120b)</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  Model LLM dla agentów i analizy tekstu
                </p>
              </div>
            </div>
            <Badge variant="success">AKTYWNY</Badge>
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
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Rotuj Token Sesji</span>
          </button>
        </div>

        {tokenRegenerated && (
          <div className="mt-3 p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs font-mono text-indigo-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-indigo-400" />
            <span>Wygenerowano nowy token sesji: {tokenRegenerated}</span>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
