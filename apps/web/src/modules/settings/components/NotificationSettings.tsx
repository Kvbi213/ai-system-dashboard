import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Bell, Send, Check, ShieldAlert, Moon, Key, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { pushbulletApi } from '../../../api/client';

const DEFAULT_NOTIFS = {
  token: '',
  pushEnabled: true,
  quietHours: true,
  categories: {
    librus: true,
    finances: true,
    schedule: true,
    workouts: true,
    gcpBudget: true
  }
};

export const NotificationSettings: React.FC = () => {
  const [notifState, setNotifState] = useState(() => {
    try {
      const saved = localStorage.getItem('omnidash_notification_settings');
      return saved ? { ...DEFAULT_NOTIFS, ...JSON.parse(saved) } : DEFAULT_NOTIFS;
    } catch {
      return DEFAULT_NOTIFS;
    }
  });

  const { token, pushEnabled, quietHours, categories } = notifState;
  const [testSent, setTestSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ success: boolean; message: string } | null>(null);
  const [customTestMsg, setCustomTestMsg] = useState('OmniDash v4.0 Reborn: Wszystkie węzły operacyjne nominalne.');
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const [backendConfig, setBackendConfig] = useState<{
    configured: boolean;
    source: 'env' | 'database' | 'none';
    maskedKey: string;
    hasEnvKey: boolean;
    hasDbKey: boolean;
    activeKeyPreview: string;
  } | null>(null);

  const loadBackendConfig = async () => {
    try {
      const cfg = await pushbulletApi.getConfig();
      setBackendConfig(cfg);
    } catch (err) {
      console.warn('Nie udało się pobrać konfiguracji Pushbullet z backendu:', err);
    }
  };

  useEffect(() => {
    loadBackendConfig();
  }, []);

  const updateNotif = (key: keyof typeof DEFAULT_NOTIFS, val: any) => {
    setNotifState((prev: typeof DEFAULT_NOTIFS) => {
      const updated = { ...prev, [key]: val };
      try {
        localStorage.setItem('omnidash_notification_settings', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const toggleCategory = (catKey: keyof typeof DEFAULT_NOTIFS['categories']) => {
    setNotifState((prev: typeof DEFAULT_NOTIFS) => {
      const updatedCats = { ...prev.categories, [catKey]: !prev.categories[catKey] };
      const updated = { ...prev, categories: updatedCats };
      try {
        localStorage.setItem('omnidash_notification_settings', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleTestConnection = async () => {
    setIsVerifying(true);
    setVerifyResult(null);
    try {
      const res = await pushbulletApi.testToken(token || undefined);
      if (res.success && res.user) {
        setVerifyResult({
          success: true,
          message: `Połączono pomyślnie: ${res.user.name} (${res.user.email})`
        });
      } else {
        setVerifyResult({
          success: false,
          message: res.error || 'Błąd autoryzacji: Nieprawidłowy token Pushbullet.'
        });
      }
    } catch (err: any) {
      setVerifyResult({
        success: false,
        message: `Błąd sieci: ${err.message || 'Nie można nawiązać połączenia z API.'}`
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSendTestPush = async () => {
    setTestSent(true);
    try {
      const res = await pushbulletApi.send({
        title: 'OmniDash Alert Testowy',
        body: customTestMsg,
        priority: 'HIGH',
        tokenOverride: token || undefined
      });

      if (res.success) {
        setSaveMsg(res.simulated ? 'Wysłano alert testowy (tryb symulacji - brak klucza API).' : 'Wysłano fizyczny push na Twój smartfon!');
      } else {
        setSaveMsg(`Błąd wysyłki: ${res.message || 'Odmowa API'}`);
      }
    } catch (err: any) {
      setSaveMsg(`Błąd API: ${err.message}`);
    } finally {
      setTimeout(() => setTestSent(false), 3000);
      setTimeout(() => setSaveMsg(null), 5000);
    }
  };

  const handleSave = async () => {
    try {
      localStorage.setItem('omnidash_notification_settings', JSON.stringify(notifState));
      if (token && token.trim().length > 0) {
        await pushbulletApi.saveConfig(token.trim());
        await loadBackendConfig();
      }
      setSaveMsg('Zapisano konfigurację powiadomień Pushbullet!');
      setTimeout(() => setSaveMsg(null), 3000);
    } catch {}
  };

  return (
    <GlassCard className="p-4 sm:p-5" glow="sky">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-sm">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Powiadomienia Zewnętrzne (Pushbullet)</span>
              {backendConfig?.configured && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {backendConfig.source === 'env' ? '✓ SKONFIGUROWANO W .ENV' : '✓ ZAPISANO W BAZIE'}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Błyskawiczne alerty na smartfon, e-mail i webhook
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Active Environment Key Banner if present */}
        {backendConfig?.configured && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-emerald-300">Klucz Pushbullet jest aktywny:</span>
                  <span className="font-mono text-[11px] text-emerald-200 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                    {backendConfig.maskedKey}
                  </span>
                </div>
                <p className="text-[10px] text-emerald-400/80 mt-0.5">
                  Źródło: {backendConfig.source === 'env' ? 'Zmienna PUSHBULLET_API_KEY w .env serwera' : 'Lokalna baza danych SQLite'}. Pole poniżej służy wyłącznie do opcjonalnego nadpisania.
                </p>
              </div>
            </div>
            <button
              onClick={handleTestConnection}
              disabled={isVerifying}
              className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition flex items-center gap-1 self-end sm:self-auto shrink-0"
            >
              <RefreshCw className={`w-3 h-3 ${isVerifying ? 'animate-spin' : ''}`} />
              <span>{isVerifying ? 'Sprawdzanie...' : 'Sprawdź połączenie'}</span>
            </button>
          </div>
        )}

        {/* Token Input & Verify Button */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-500" />
              <span>Pushbullet Access Token:</span>
              {backendConfig?.configured && !token && (
                <span className="text-[10px] text-slate-400 font-normal">
                  (używa {backendConfig.source === 'env' ? '.env' : 'bazy'}: {backendConfig.maskedKey})
                </span>
              )}
            </label>
            <button
              onClick={handleTestConnection}
              disabled={isVerifying}
              className="text-[11px] font-bold text-sky-500 hover:text-sky-400 flex items-center gap-1 transition active:scale-95"
            >
              <RefreshCw className={`w-3 h-3 ${isVerifying ? 'animate-spin' : ''}`} />
              <span>{isVerifying ? 'Testowanie...' : 'Testuj połączenie'}</span>
            </button>
          </div>
          <input
            type="password"
            value={token}
            placeholder={
              backendConfig?.configured
                ? `Aktywny klucz z ${backendConfig.source === 'env' ? '.env' : 'bazy'}: ${backendConfig.maskedKey} (wprowadź nowy aby nadpisać)`
                : 'Wprowadź token o.xxxxxxxx (lub pozostaw puste dla domyślnego z .env)'
            }
            onChange={(e) => updateNotif('token', e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white shadow-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          <p className="text-[10px] text-slate-400 mt-1">
            Używany do wysyłania alertów o dzwonkach lekcyjnych, zmianach sal, radarach CANARD i budżecie.
          </p>
        </div>

        {/* Verification Status Banner */}
        {verifyResult && (
          <div className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 ${
            verifyResult.success
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}>
            {verifyResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
            <span>{verifyResult.message}</span>
          </div>
        )}

        {/* Global Toggles */}
        <div className="space-y-2">
          <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Alerty Krytyczne w Czasie Rzeczywistym</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Powiadomienia PUSH natychmiast po wystąpieniu zdarzenia</p>
              </div>
            </div>
            <button
              onClick={() => updateNotif('pushEnabled', !pushEnabled)}
              className={`px-3 py-1 rounded-xl text-xs font-bold font-mono transition ${
                pushEnabled ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-500'
              }`}
            >
              {pushEnabled ? 'WŁĄCZONE' : 'WYŁĄCZONE'}
            </button>
          </div>

          <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <Moon className="w-4 h-4 text-purple-400" />
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Cisza Nocna (Tryb DND: 22:30 - 06:30)</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Wyciszenie powiadomień dźwiękowych w godzinach snu</p>
              </div>
            </div>
            <button
              onClick={() => updateNotif('quietHours', !quietHours)}
              className={`px-3 py-1 rounded-xl text-xs font-bold font-mono transition ${
                quietHours ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-slate-800 text-slate-500'
              }`}
            >
              {quietHours ? 'AKTYWNE' : 'NIEAKTYWNE'}
            </button>
          </div>
        </div>

        {/* Categories Grid */}
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">Kategorie Alerty & Filtry:</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { id: 'schedule', label: 'Plan Lekcji & Dzwonki' },
              { id: 'librus', label: 'Oceny & Uwagi Librus' },
              { id: 'finances', label: 'Budżet 50/30/20' },
              { id: 'workouts', label: 'Sesje FBW & Nawyki' },
              { id: 'gcpBudget', label: 'FinOps & Chmura' }
            ].map((cat) => {
              const active = categories?.[cat.id as keyof typeof categories] ?? true;
              return (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id as any)}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    active
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      : 'bg-slate-900/40 border-slate-800 text-slate-500'
                  }`}
                >
                  <p className="text-[11px] font-bold">{cat.label}</p>
                  <p className="text-[9px] mt-0.5 opacity-70 font-mono">{active ? '[AKTYWNY]' : '[WYCISZONY]'}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Test Message */}
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Treść wiadomości testowej:</label>
          <input
            type="text"
            value={customTestMsg}
            onChange={(e) => setCustomTestMsg(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs font-sans text-slate-900 dark:text-white shadow-sm"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
          <button
            onClick={handleSave}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition active:scale-95"
          >
            <span>Zapisz</span>
          </button>

          <button
            onClick={handleSendTestPush}
            disabled={testSent}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/20 active:scale-95 transition"
          >
            {testSent ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
            <span>{testSent ? 'Wysyłanie alertu...' : 'Wyślij testowy PUSH'}</span>
          </button>
        </div>

        {saveMsg && (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
            {saveMsg}
          </div>
        )}
      </div>
    </GlassCard>
  );
};
