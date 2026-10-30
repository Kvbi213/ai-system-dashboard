import React from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Wallet, ShieldCheck, Heart, Sparkles } from 'lucide-react';

export const EnvelopeOverview: React.FC = () => {
  const envelopes = [
    {
      label: '50% Potrzeby (Rachunki, serwer, dom)',
      allocated: 1200,
      spent: 850,
      color: 'bg-sky-500',
      icon: ShieldCheck,
      textColor: 'text-sky-700'
    },
    {
      label: '30% Zachcianki (Książki, kawa, hobby)',
      allocated: 720,
      spent: 410,
      color: 'bg-indigo-500',
      icon: Sparkles,
      textColor: 'text-indigo-700'
    },
    {
      label: '20% Oszczędności & Inwestycje',
      allocated: 480,
      spent: 480,
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
            <p className="text-xs text-slate-500 font-medium">Podział miesięczny dochodów</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 font-medium">Saldo wolne</p>
          <p className="text-base font-bold font-mono text-emerald-700">660.00 PLN</p>
        </div>
      </div>

      <div className="space-y-3.5">
        {envelopes.map((env, idx) => {
          const percent = Math.min(100, Math.round((env.spent / env.allocated) * 100));
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
    </GlassCard>
  );
};
