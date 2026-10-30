import React from 'react';
import { SecurityCheckCard } from './components/SecurityCheckCard';
import { Sliders, RefreshCw, KeyRound, LogOut } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-sky-600" />
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Ustawienia i Środowisko Systemu
            </h2>
            <p className="text-xs text-slate-500 font-mono">OmniDash Reborn v4.0.0 :: Mikr.us Node</p>
          </div>
        </div>

        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 hover:text-slate-900 font-semibold transition shadow-sm">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Odśwież stan</span>
        </button>
      </div>

      {/* Security Zero-Trust Audit */}
      <SecurityCheckCard />

      {/* Cloud & Tenant Session */}
      <div className="p-4 rounded-2xl glass-panel border-white/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 shadow-sm">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">Zalogowano jako Operator Systemu</p>
            <p className="text-[11px] text-slate-500 font-mono">Tenant ID: operator-system-core</p>
          </div>
        </div>

        <button className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition active:scale-95 shadow-sm">
          <LogOut className="w-4 h-4" />
          <span>Wyloguj sesję Zero-Trust</span>
        </button>
      </div>
    </div>
  );
};
