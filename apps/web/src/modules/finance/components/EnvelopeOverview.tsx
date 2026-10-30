import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Wallet, ShieldCheck, Heart, Sparkles, Sliders } from 'lucide-react';
import { BudgetSettingsModal, BudgetConfig } from './BudgetSettingsModal';

const DEFAULT_CONFIG: BudgetConfig = {
  monthlyIncome: 5200,
  needsPercent: 50,
  wantsPercent: 30,
  savingsPercent: 20
};

const STORAGE_KEY = 'omnidash_finance_budget_config';

export const EnvelopeOverview: React.FC = () => {
  const [config, setConfig] = useState<BudgetConfig>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  const needsAllocated = Math.round((config.monthlyIncome * config.needsPercent) / 100);
  const wantsAllocated = Math.round((config.monthlyIncome * config.wantsPercent) / 100);
  const savingsAllocated = Math.round((config.monthlyIncome * config.savingsPercent) / 100);

  const needsSpent = 850;
  const wantsSpent = 410;
  const savingsSpent = savingsAllocated;

  const totalSpent = needsSpent + wantsSpent + savingsSpent;
  const freeBalance = config.monthlyIncome - totalSpent;

  const envelopes = [
    {
      label: `${config.needsPercent}% Potrzeby (Rachunki, serwer, dom)`,
      allocated: needsAllocated,
      spent: needsSpent,
      color: 'bg-sky-500',
      icon: ShieldCheck,
      textColor: 'text-sky-700'
    },
    {
      label: `${config.wantsPercent}% Zachcianki (Książki, kawa, hobby)`,
      allocated: wantsAllocated,
      spent: wantsSpent,
      color: 'bg-indigo-500',
      icon: Sparkles,
      textColor: 'text-indigo-700'
    },
    {
      label: `${config.savingsPercent}% Oszczędności & Inwestycje`,
      allocated: savingsAllocated,
      spent: savingsSpent,
      color: 'bg-emerald-500',
      icon: Heart,
      textColor: 'text-emerald-700'
    }
  ];

  return (
    <GlassCard className="p-4 sm:p-5" glow="sky">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-sky-100 text-sky-700 border border-sky-200 shadow-sm">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Koperty Budżetowe 50/30/20</h3>
            <p className="text-xs text-slate-500 font-medium">Dochód: {config.monthlyIncome.toLocaleString('pl-PL')} PLN / mc</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-slate-900 shadow-xs transition"
          >
            <Sliders className="w-3.5 h-3.5 text-sky-600" />
            <span>Edytuj podział</span>
          </button>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-medium font-mono">Wolne saldo</p>
            <p className="text-sm font-bold font-mono text-emerald-700">{freeBalance.toFixed(2)} PLN</p>
          </div>
        </div>
      </div>

      <div className="space-y-3.5">
        {envelopes.map((env, idx) => {
          const percent = env.allocated > 0 ? Math.min(100, Math.round((env.spent / env.allocated) * 100)) : 0;
          return (
            <div key={idx} className="p-3 rounded-2xl bg-white/70 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <env.icon className={`w-3.5 h-3.5 ${env.textColor}`} />
                  <span>{env.label}</span>
                </div>
                <span className="font-mono font-bold text-slate-700">
                  {env.spent} / {env.allocated} PLN ({percent}%)
                </span>
              </div>
              <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden border border-white">
                <div
                  className={`${env.color} h-full rounded-full transition-all duration-300 shadow-sm`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <BudgetSettingsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        config={config}
        onSave={(newCfg) => setConfig(newCfg)}
      />
    </GlassCard>
  );
};
