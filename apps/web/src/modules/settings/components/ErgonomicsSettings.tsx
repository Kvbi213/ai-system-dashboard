import React, { useState } from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Smartphone, Sparkles, SlidersHorizontal, Hand, Check } from 'lucide-react';

const DEFAULT_ERGO = {
  blurPx: 16,
  thumbZone: true,
  reducedMotion: false,
  compactDensity: true
};

export const ErgonomicsSettings: React.FC = () => {
  const [ergo, setErgo] = useState(() => {
    try {
      const saved = localStorage.getItem('omnidash_ergonomics_settings');
      return saved ? { ...DEFAULT_ERGO, ...JSON.parse(saved) } : DEFAULT_ERGO;
    } catch {
      return DEFAULT_ERGO;
    }
  });

  const { blurPx, thumbZone, reducedMotion, compactDensity } = ergo;

  const updateErgo = (key: keyof typeof DEFAULT_ERGO, val: any) => {
    setErgo((prev: typeof DEFAULT_ERGO) => {
      const updated = { ...prev, [key]: val };
      try {
        localStorage.setItem('omnidash_ergonomics_settings', JSON.stringify(updated));
        if (key === 'blurPx') {
          document.documentElement.style.setProperty('--glass-blur', `${val}px`);
        } else if (key === 'reducedMotion') {
          document.documentElement.classList.toggle('reduce-motion', val);
        } else if (key === 'compactDensity') {
          document.documentElement.classList.toggle('compact-density', val);
        }
      } catch {}
      return updated;
    });
  };

  return (
    <GlassCard className="p-4 sm:p-5" glow="sky">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 shadow-sm">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Ergonomia & Liquid Glass UI</h3>
            <p className="text-xs text-slate-500 font-medium">Rozmycie akrylu, strefa kciuka i dynamika interfejsu</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span>Głębia Rozmycia Tła (Backdrop Blur):</span>
            </span>
            <span className="font-mono text-sky-700">{blurPx} px</span>
          </div>
          <input
            type="range"
            min="0"
            max="32"
            step="2"
            value={blurPx}
            onChange={(e) => updateErgo('blurPx', parseInt(e.target.value, 10))}
            className="w-full accent-sky-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
            <span>0 px (Czysty flat)</span>
            <span>16 px (Liquid Glass Standard)</span>
            <span>32 px (Maksymalna dyfuzja)</span>
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <Hand className="w-4 h-4 text-emerald-600" />
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Dolna Strefa Kciuka (Thumb Zone)</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Przyciski akcji na smartfonie w zasięgu jednego kciuka</p>
              </div>
            </div>
            <button
              onClick={() => updateErgo('thumbZone', !thumbZone)}
              className={`px-3 py-1 rounded-xl text-xs font-bold font-mono transition ${
                thumbZone ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              {thumbZone ? 'WŁĄCZONE' : 'WYŁĄCZONE'}
            </button>
          </div>

          <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <SlidersHorizontal className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Zwarty Układ Pulpitu (Zero-Scroll Viewport)</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Dopasowanie siatki widżetów do pionowej przestrzeni ekranu</p>
              </div>
            </div>
            <button
              onClick={() => updateErgo('compactDensity', !compactDensity)}
              className={`px-3 py-1 rounded-xl text-xs font-bold font-mono transition ${
                compactDensity ? 'bg-sky-100 text-sky-800 border border-sky-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              {compactDensity ? 'AKTYWNY' : 'STANDARD'}
            </button>
          </div>

          <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Ograniczenie Animacji (Reduced Motion)</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Wyłączenie przejść spring i optymalizacja FPS na słabszych CPU</p>
            </div>
            <button
              onClick={() => updateErgo('reducedMotion', !reducedMotion)}
              className={`px-3 py-1 rounded-xl text-xs font-bold font-mono transition ${
                reducedMotion ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              {reducedMotion ? 'WŁĄCZONE' : 'WYŁĄCZONE'}
            </button>
          </div>
        </div>

        <div className="pt-2 text-right">
          <span className="text-[11px] text-emerald-600 font-bold inline-flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            <span>Style Liquid Glass synchronizowane na bieżąco</span>
          </span>
        </div>
      </div>
    </GlassCard>
  );
};
