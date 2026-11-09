import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Badge } from '../../../components/ui/Badge';
import {
  ShieldCheck,
  KeyRound,
  Mail,
  Smartphone,
  Lock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Bot,
  GraduationCap,
  LogOut,
  Sparkles
} from 'lucide-react';
import { authApi, pushbulletApi } from '../../../api/client';

export const AuthenticationSettings: React.FC = () => {
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTestingImap, setIsTestingImap] = useState(false);
  const [imapResult, setImapResult] = useState<{ success: boolean; message: string } | null>(null);
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [tokenRegenerated, setTokenRegenerated] = useState<string | null>(null);

  const loadStatus = async () => {
    setIsLoading(true);
    try {
      const res = await authApi.getStatus();
      setAuthStatus(res);
      if (res.providers?.googleOAuth?.connectedEmail) {
        setGoogleEmailInput(res.providers.googleOAuth.connectedEmail);
      }
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

  const handleConnectGoogle = async () => {
    setIsConnectingGoogle(true);
    try {
      const targetEmail = googleEmailInput.trim() || 'jakub.lis@omnidash.ai';
      await authApi.authorizeGoogle({ email: targetEmail });
      await loadStatus();
    } catch (err: any) {
      console.error('Błąd połączenia Google OAuth:', err);
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    try {
      await authApi.disconnectGoogle();
      await loadStatus();
    } catch (err) {
      console.error('Błąd odłączania Google:', err);
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

  const providers = authStatus?.providers;

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
                Google OAuth 2.0, konektory poczty IMAP, Pushbullet, Librus i rotacja kluczy sesji
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

      {/* 2. Google OAuth 2.0 & Gmail Integration */}
      <GlassCard className="p-4 sm:p-5" glow="teal">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-500 border border-teal-500/20 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Google Authentication (OAuth 2.0 & Gmail REST API v1)
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Oficjalna autoryzacja Google Identity dla pobierania i sortowania poczty
              </p>
            </div>
          </div>
          <Badge variant={providers?.googleOAuth?.connectedEmail ? 'success' : 'slate'}>
            {providers?.googleOAuth?.connectedEmail ? 'POŁĄCZONO' : 'OPCJONALNE'}
          </Badge>
        </div>

        <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Zamiast generowania haseł aplikacji Google, logujesz się raz kontem Google (&quot;Zezwól aplikacji OmniDash&quot;).
            Serwer otrzymuje token i bezpiecznie pobiera pocztę przez oficjalne Gmail REST API.
          </p>

          {providers?.googleOAuth?.connectedEmail ? (
            <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-teal-300">Aktywne konto Google: </span>
                  <span className="font-mono text-teal-200">{providers.googleOAuth.connectedEmail}</span>
                  <p className="text-[10px] text-teal-400/80 mt-0.5">Uprawnienia: gmail.readonly, gmail.modify, userinfo.email</p>
                </div>
              </div>
              <button
                onClick={handleDisconnectGoogle}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 transition flex items-center gap-1.5 self-start sm:self-auto"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Odłącz</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
              <input
                type="email"
                placeholder="twoj.adres@gmail.com"
                value={googleEmailInput}
                onChange={(e) => setGoogleEmailInput(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
              <button
                onClick={handleConnectGoogle}
                disabled={isConnectingGoogle}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-sm transition active:scale-95 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isConnectingGoogle ? 'Łączenie...' : 'Zaloguj przez Google (OAuth 2.0)'}</span>
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
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Serwer IMAP</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                {providers?.imap?.host || 'imap.gmail.com'}:{providers?.imap?.port || 993}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Użytkownik (.env)</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                {providers?.imap?.userMasked || 'Skonfigurowany w .env'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Szyfrowanie TLS</span>
              <span className="font-bold text-emerald-400 font-mono">
                {providers?.imap?.tls ? 'WŁĄCZONE (TLSv1.3)' : 'WYŁĄCZONE'}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Wymaga 16-znakowego Hasła do Aplikacji Google (App Password) zapisanego w <code className="font-mono bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">.env</code> na serwerze Mikrus.
            </p>
            <button
              onClick={handleTestImap}
              disabled={isTestingImap}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30 hover:bg-sky-500/30 transition flex items-center gap-1.5 self-end sm:self-auto shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTestingImap ? 'animate-spin' : ''}`} />
              <span>{isTestingImap ? 'Testowanie...' : 'Testuj połączenie IMAP'}</span>
            </button>
          </div>

          {imapResult && (
            <div className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 ${
              imapResult.success
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              {imapResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
              <span>{imapResult.message}</span>
            </div>
          )}
        </div>
      </GlassCard>

      {/* 4. External Services & Vault Summary */}
      <GlassCard className="p-4 sm:p-5" glow="amber">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
          Mosty Usług Zewnętrznych & Tokeny API
        </h4>

        <div className="space-y-2">
          {/* Pushbullet */}
          <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Pushbullet Mobile Dispatcher</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  {providers?.pushbullet?.configured
                    ? `Klucz: ${providers.pushbullet.maskedKey} (${providers.pushbullet.source === 'env' ? 'Zmienna .env' : 'Baza SQLite'})`
                    : 'Brak klucza API w systemie'}
                </p>
              </div>
            </div>
            <Badge variant={providers?.pushbullet?.configured ? 'success' : 'slate'}>
              {providers?.pushbullet?.configured ? 'AKTYWNY (.ENV)' : 'NIEPOŁĄCZONY'}
            </Badge>
          </div>

          {/* Librus Synergia */}
          <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500 border border-sky-500/20">
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
              {authStatus?.user?.email || 'operator@omnidash.internal'}
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
