import React, { useState } from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Download, Database, Check } from 'lucide-react';

export const DataBackupExportCard: React.FC = () => {
  const [downloaded, setDownloaded] = useState(false);

  const handleExportJson = () => {
    const backupData = {
      system: 'OmniDash Reborn',
      version: 'v4.0.0',
      timestamp: new Date().toISOString(),
      tenant: 'operator-system-core',
      modules: ['timetable', 'grades', 'finance_50_30_20', 'workouts_fbw', 'canard_traffic', 'ai_chat'],
      integrityCheck: 'SHA256:4b22c7f0b8d5e1a3e9c'
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnidash-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <GlassCard className="p-4 sm:p-5" glow="none">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Kopia Zapasowa i Eksport Danych</h3>
            <p className="text-xs text-slate-500 font-medium">Baza relacyjna Drizzle / SQLite snapshot</p>
          </div>
        </div>

        <button
          onClick={handleExportJson}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/20 active:scale-95 transition"
        >
          {downloaded ? <Check className="w-4 h-4 text-white" /> : <Download className="w-4 h-4" />}
          <span>{downloaded ? 'Pobrano snapshot!' : 'Eksportuj JSON'}</span>
        </button>
      </div>

      <div className="p-3.5 rounded-2xl bg-white/70 border border-slate-200/80 shadow-sm text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-700">Tabela transakcji finansowych:</span>
          <span className="font-mono font-bold text-slate-900">42 rekordy</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-700">Tabela serii treningowych FBW:</span>
          <span className="font-mono font-bold text-slate-900">128 rekordów</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-700">Bufor lekcji i ocen Librus:</span>
          <span className="font-mono font-bold text-slate-900">Zsynchronizowany (Semestr 2)</span>
        </div>
      </div>
    </GlassCard>
  );
};
