import React from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Target, TrendingUp, ShieldCheck } from 'lucide-react';

export const SavingsGoalCard: React.FC = () => {
  const goals = [
    {
      name: 'Fundusz Awaryjny (Poduszka 3-mc)',
      current: 3200,
      target: 5000,
      category: 'Bezpieczeństwo',
      color: 'bg-emerald-500'
    },
    {
      name: 'Inwestycje i Narzędzia Sprzętowe',
      current: 1450,
      target: 3000,
      category: 'Rozwój IT',
      color: 'bg-sky-500'
    }
  ];

  return (
    <GlassCard className="p-4 sm:p-5" glow="emerald">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Cele Oszczędnościowe (20%)</h3>
            <p className="text-xs text-slate-500 font-medium">Budowa kapitału i poduszki finansowej</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 font-mono shadow-sm">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>+480 PLN/mc</span>
        </div>
      </div>

      <div className="space-y-3.5">
        {goals.map((goal, idx) => {
          const percent = Math.min(100, Math.round((goal.current / goal.target) * 100));
          return (
            <div key={idx} className="p-3.5 rounded-2xl bg-white/70 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{goal.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-700">
                  {goal.current} / {goal.target} PLN ({percent}%)
                </span>
              </div>
              <div className="w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden border border-white">
                <div
                  className={`${goal.color} h-full rounded-full transition-all duration-500 shadow-sm`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
};
