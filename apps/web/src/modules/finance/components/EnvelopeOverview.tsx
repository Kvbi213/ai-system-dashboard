import React from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Wallet, ShieldCheck, Heart, Sparkles } from 'lucide-react';

export const EnvelopeOverview: React.FC = () => {
  const envelopes = [
    {
      label: '50% Potrzeby (Rachunki, serwer, dom)',
      allocated: 1200,
      spent: 850,
      color: 'bg-sky-400',
      icon: ShieldCheck,
      textColor: 'text-sky-300'
    },
    {
      label: '30% Zachcianki (Książki, kawa, hobby)',
      allocated: 720,
      spent: 410,
      color: 'bg-indigo-400',
      icon: Sparkles,
      textColor: 'text-indigo-300'
    },
    {
      label: '20% Oszczędności & Inwestycje',
      allocated: 480,
      spent: 480,
      color: 'bg-emerald-400',
      icon: Heart,
      textColor: 'text-emerald-300'
    }
  ];

  return (
    <GlassCard className="p-4 sm:p-5" glow="sky">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Koperty Budżetowe 50/30/20</h3>
            <p className="text-xs text-slate-400">Podział miesięczny dochodów</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Saldo wolne</p>
          <p className="text-base font-bold font-mono text-emerald-400">660.00 PLN</p>
        </div>
      </div>

      <div className="space-y-3.5">
        {envelopes.map((env, idx) => {
          const percent = Math.min(100, Math.round((env.spent / env.allocated) * 100));
          return (
            <div key={idx} className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-1.5 font-medium text-slate-200">
                  <env.icon className={`w-3.5 h-3.5 ${env.textColor}`} />
                  <span>{env.label}</span>
                </div>
                <span className="font-mono text-slate-300">
                  {env.spent} / {env.allocated} PLN ({percent}%)
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className={`${env.color} h-full rounded-full transition-all duration-300`}
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
