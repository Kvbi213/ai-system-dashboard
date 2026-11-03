import React, { useState } from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Bell, Send, Check, ShieldAlert, Moon } from 'lucide-react';

const DEFAULT_NOTIFS = {
  token: 'o.4k29dmA8x9Z1...hidden_token',
  pushEnabled: true,
  quietHours: true
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

  const { token, pushEnabled, quietHours } = notifState;
  const [testSent, setTestSent] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const updateNotif = (key: keyof typeof DEFAULT_NOTIFS, val: any) => {
    setNotifState((prev: typeof DEFAULT_NOTIFS) => {
      const updated = { ...prev, [key]: val };
      try {
        localStorage.setItem('omnidash_notification_settings', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleSendTest = () => {
    setTestSent(true);
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('OmniDash Alert Testowy', { body: 'Wszystkie węzły operacyjne aktywne.' });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            new Notification('OmniDash Alert Testowy', { body: 'Wszystkie węzły operacyjne aktywne.' });
          }
        });
      }
    }
    setTimeout(() => setTestSent(false), 3000);
  };

  const handleSave = () => {
    try {
      localStorage.setItem('omnidash_notification_settings', JSON.stringify(notifState));
      setSaveMsg('Zapisano ustawienia powiadomień!');
      setTimeout(() => setSaveMsg(null), 3000);
    } catch {}
  };

  return (
    <GlassCard className="p-4 sm:p-5" glow="sky">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Powiadomienia Zewnętrzne (Pushbullet)</h3>
            <p className="text-xs text-slate-500 font-medium">Błyskawiczne alerty na smartfon, e-mail i webhook</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Pushbullet Access Token:</label>
          <input
            type="password"
            value={token}
            onChange={(e) => updateNotif('token', e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white shadow-sm"
          />
          <p className="text-[10px] text-slate-400 mt-1">Używany do wysyłania alertów o Librusie, radarach CANARD i budżecie.</p>
        </div>

        <div className="space-y-2.5">
          <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Alerty Krytyczne w Czasie Rzeczywistym</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Powiadomienia PUSH natychmiast po wystąpieniu zdarzenia</p>
              </div>
            </div>
            <button
              onClick={() => updateNotif('pushEnabled', !pushEnabled)}
              className={`px-3 py-1 rounded-xl text-xs font-bold font-mono transition ${
                pushEnabled ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              {pushEnabled ? 'WŁĄCZONE' : 'WYŁĄCZONE'}
            </button>
          </div>

          <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <Moon className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Cisza Nocna (Tryb DND: 22:30 - 06:30)</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Wyciszenie powiadomień dźwiękowych w godzinach snu</p>
              </div>
            </div>
            <button
              onClick={() => updateNotif('quietHours', !quietHours)}
              className={`px-3 py-1 rounded-xl text-xs font-bold font-mono transition ${
                quietHours ? 'bg-purple-100 text-purple-800 border border-purple-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              {quietHours ? 'AKTYWNE' : 'NIEAKTYWNE'}
            </button>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
          <button
            onClick={handleSave}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition active:scale-95"
          >
            <span>Zapisz</span>
          </button>

          <button
            onClick={handleSendTest}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/20 active:scale-95 transition"
          >
            {testSent ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
            <span>{testSent ? 'Wysłano alert testowy!' : 'Wyślij testowy PUSH'}</span>
          </button>
        </div>

        {saveMsg && (
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-medium">
            {saveMsg}
          </div>
        )}
      </div>
    </GlassCard>
  );
};
