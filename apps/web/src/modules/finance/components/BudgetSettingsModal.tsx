import React, { useState } from 'react';
import { X, Sliders, AlertCircle, Check } from 'lucide-react';

export interface BudgetConfig {
  monthlyIncome: number;
  needsPercent: number;
  wantsPercent: number;
  savingsPercent: number;
}

interface BudgetSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BudgetConfig;
  onSave: (newConfig: BudgetConfig) => void;
}

export const BudgetSettingsModal: React.FC<BudgetSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave
}) => {
  const [income, setIncome] = useState(config.monthlyIncome.toString());
  const [needs, setNeeds] = useState(config.needsPercent);
  const [wants, setWants] = useState(config.wantsPercent);
  const [savings, setSavings] = useState(config.savingsPercent);

  if (!isOpen) return null;

  const totalPercent = Number(needs) + Number(wants) + Number(savings);
  const isValid = totalPercent === 100 && (parseFloat(income) || 0) > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onSave({
      monthlyIncome: parseFloat(income) || 5000,
      needsPercent: Number(needs),
      wantsPercent: Number(wants),
      savingsPercent: Number(savings)
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md p-5 rounded-3xl glass-panel-elevated bg-white/95 border border-white shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-100 text-sky-700">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Konfiguracja Budżetu 50/30/20</h3>
              <p className="text-xs text-slate-500">Ręczna edycja procentów i dochodu</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Miesięczny Dochód (PLN)</label>
            <input
              type="number"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-sm font-mono font-bold text-slate-900"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>Potrzeby (Koszty Stałe)</span>
              <span className="font-mono text-sky-600">{needs}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={needs}
              onChange={(e) => setNeeds(Number(e.target.value))}
              className="w-full accent-sky-600"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>Zachcianki (Styl Życia & Hobby)</span>
              <span className="font-mono text-indigo-600">{wants}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={wants}
              onChange={(e) => setWants(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>Oszczędności & Inwestycje</span>
              <span className="font-mono text-emerald-600">{savings}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={savings}
              onChange={(e) => setSavings(Number(e.target.value))}
              className="w-full accent-emerald-600"
            />
          </div>

          <div
            className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono font-bold ${
              totalPercent === 100
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-1.5">
              {totalPercent === 100 ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
              <span>Suma podziału: {totalPercent}%</span>
            </div>
            <span>{totalPercent === 100 ? 'Wymagane 100% OK' : 'Musi równać się 100%'}</span>
          </div>

          <button
            type="submit"
            disabled={!isValid}
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-md shadow-sky-600/20"
          >
            Zapisz podział budżetu
          </button>
        </form>
      </div>
    </div>
  );
};
