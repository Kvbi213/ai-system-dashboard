import React from 'react';
import { SecurityCheckCard } from './components/SecurityCheckCard';
import { Sliders, RefreshCw, KeyRound, LogOut } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-sky-400" />
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Ustawienia i Środowisko Systemu
            </h2>
            <p className="text-xs text-slate-400 font-mono">OmniDash Reborn v4.0.0 :: Mikr.us Node</p>
          </div>
        </div>

        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white transition">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Odśwież stan</span>
        </button>
      </div>

      {/* Security Zero-Trust Audit */}
      <SecurityCheckCard />

      {/* Cloud & Tenant Session */}
      <div className="p-4 rounded-2xl glass-card border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-100">Zalogowano jako Kvbi213</p>
            <p className="text-[11px] text-slate-400 font-mono">Tenant ID: kvbi213-core-edge</p>
          </div>
        </div>

        <button className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition active:scale-95">
          <LogOut className="w-4 h-4" />
          <span>Wyloguj sesję Zero-Trust</span>
        </button>
      </div>
    </div>
  );
};
