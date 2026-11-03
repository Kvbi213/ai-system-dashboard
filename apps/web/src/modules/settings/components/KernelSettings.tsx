import React, { useState } from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Cpu, Sun, Moon, Check, RotateCcw, Sparkles } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';

const DEFAULT_NAV = {
  dashboard: true,
  school: true,
  private: true,
  finance: true,
  workouts: true,
  chat: true,
  cameras: true
};

export const KernelSettings: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [navVisible, setNavVisible] = useState<typeof DEFAULT_NAV>(() => {
    try {
      const saved = localStorage.getItem('omnidash_nav_visible');
      return saved ? { ...DEFAULT_NAV, ...JSON.parse(saved) } : DEFAULT_NAV;
    } catch {
      return DEFAULT_NAV;
    }
  });
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const toggleNav = (key: keyof typeof navVisible) => {
    setNavVisible((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem('omnidash_nav_visible', JSON.stringify(updated));
        window.dispatchEvent(new Event('omnidash_nav_changed'));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleRunWizard = () => {
    setStatusMsg('Kreator wstępnej konfiguracji: Wszystkie moduły bazowe, telemetria i silnik AI aktywne (100% nominalnie).');
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleResetDefaults = () => {
    setTheme('light');
    setNavVisible(DEFAULT_NAV);
    try {
      localStorage.setItem('omnidash_nav_visible', JSON.stringify(DEFAULT_NAV));
      window.dispatchEvent(new Event('omnidash_nav_changed'));
    } catch {
      // ignore
    }
    setStatusMsg('Przywrócono domyślne parametry jądra i widoczność modułów.');
    setTimeout(() => setStatusMsg(null), 3000);
  };

  return (
    <GlassCard className="p-4 sm:p-5" glow="sky">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 shadow-sm">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Kernel & Jądro Systemu</h3>
            <p className="text-xs text-slate-500 font-medium">Motyw wizualny, moduły bazowe i kreator</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-2">Styl Wizualny Powłoki:</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setTheme('light')}
              className={`p-3 rounded-2xl border flex items-center justify-center gap-2.5 text-xs font-bold transition shadow-sm ${
                theme === 'light'
                  ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-300 dark:border-sky-600 text-sky-800 dark:text-sky-300 ring-2 ring-sky-400/20'
                  : 'bg-white/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Liquid Glass Light</span>
              {theme === 'light' && <Check className="w-3.5 h-3.5 ml-auto text-sky-600 dark:text-sky-400" />}
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`p-3 rounded-2xl border flex items-center justify-center gap-2.5 text-xs font-bold transition shadow-sm ${
                theme === 'dark'
                  ? 'bg-slate-900 border-slate-700 text-white ring-2 ring-sky-400/30'
                  : 'bg-white/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <Moon className="w-4 h-4 text-sky-400" />
              <span>Obsidian Dark Mode</span>
              {theme === 'dark' && <Check className="w-3.5 h-3.5 ml-auto text-sky-400" />}
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-2">Widoczność Modułów w Pasku Bocznym:</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(navVisible).map(([k, v]) => (
              <button
                key={k}
                onClick={() => toggleNav(k as keyof typeof navVisible)}
                className={`p-2 rounded-xl border text-xs font-medium flex items-center justify-between transition ${
                  v ? 'bg-white border-sky-200 text-slate-800 shadow-sm' : 'bg-slate-100 border-slate-200 text-slate-400'
                }`}
              >
                <span className="capitalize">{k}</span>
                <span className={`text-[10px] font-mono font-bold ${v ? 'text-sky-600' : 'text-slate-400'}`}>
                  {v ? 'ON' : 'OFF'}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between">
          <button
            onClick={handleRunWizard}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Uruchom Kreator Setup Wizard</span>
          </button>
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset domyślnych</span>
          </button>
        </div>

        {statusMsg && (
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
            {statusMsg}
          </div>
        )}
      </div>
    </GlassCard>
  );
};
