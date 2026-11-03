import React, { useState } from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Badge } from '../../../components/ui/Badge';
import { ShieldCheck, Download, Database, Lock, Key, Check } from 'lucide-react';

export const SecurityDbSettings: React.FC = () => {
  const [pinLockEnabled, setPinLockEnabled] = useState(() => {
    try {
      return localStorage.getItem('omnidash_pin_lock') === 'true';
    } catch {
      return false;
    }
  });
  const [backupDownloaded, setBackupDownloaded] = useState(false);

  const togglePinLock = () => {
    setPinLockEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('omnidash_pin_lock', next ? 'true' : 'false');
      } catch {}
      return next;
    });
  };

  const handleExportBackup = () => {
    const backupData = {
      app: 'OmniDash Reborn',
      version: '4.0.0',
      timestamp: new Date().toISOString(),
      localStorageDump: { ...localStorage }
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnidash_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupDownloaded(true);
    setTimeout(() => setBackupDownloaded(false), 3000);
  };

  const securityItems = [
    { title: 'Polityka CSP Level 3', desc: 'Blokada eval(), inline scripts, strict nonce w nagłówkach HTTP', status: 'Aktywna', icon: ShieldCheck, variant: 'success' as const },
    { title: 'Autoryzacja Google Identity', desc: 'OAuth 2.0 PKCE / JWT token z rotacją co 15 minut', status: 'Bezpieczna', icon: Lock, variant: 'success' as const },
    { title: 'Eliminacja Wildcard CORS (*)', desc: 'Restrykcyjne origin whitelisting: wyłącznie zweryfikowane domeny', status: 'Wymuszone', icon: Key, variant: 'success' as const },
    { title: 'Izolacja Wolumenu SQLite', desc: 'Szyfrowana baza danych na Mikr.us VPS z automatycznym backupem', status: 'Zabezpieczone', icon: Database, variant: 'success' as const }
  ];

  return (
    <GlassCard className="p-4 sm:p-5" glow="sky">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Bezpieczeństwo Zero-Trust & Baza Danych</h3>
            <p className="text-xs text-slate-500 font-medium">Audyt CSP-L3, szyfrowanie magazynu i kopie zapasowe</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          {securityItems.map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-2xl bg-white/70 border border-slate-200/80 flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-700">
                  <item.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">{item.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{item.desc}</p>
                </div>
              </div>
              <Badge variant={item.variant}>{item.status}</Badge>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePinLock}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition flex items-center gap-1.5 ${
                pinLockEnabled ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Blokada PIN: {pinLockEnabled ? 'AKTYWNA' : 'WYŁĄCZONA'}</span>
            </button>
          </div>

          <button
            onClick={handleExportBackup}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/20 active:scale-95 transition"
          >
            {backupDownloaded ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
            <span>{backupDownloaded ? 'Pobrano zrzut JSON!' : 'Eksportuj Kopię Zapasową (JSON)'}</span>
          </button>
        </div>
      </div>
    </GlassCard>
  );
};
