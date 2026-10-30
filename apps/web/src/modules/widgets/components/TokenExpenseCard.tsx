import React from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Sparkles, DollarSign, Zap } from 'lucide-react';

const MODELS_DATA = [
  { id: 'groq', name: 'Groq GPT-OSS-120B', tokens: 142500, limit: 1000000, rate: '< 400ms TTFT' },
  { id: 'gemini', name: 'Gemini 2.0 Flash', tokens: 48200, limit: 500000, rate: 'Multimodal Stream' }
];

export const TokenExpenseCard: React.FC = () => {
  const totalTokens = MODELS_DATA.reduce((acc, m) => acc + m.tokens, 0);

  return (
    <GlassCard className="p-4 sm:p-5" glow="indigo">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Zużycie Tokenów LLM</h3>
            <p className="text-xs text-slate-500 font-medium">Monitoring limitów Groq LPU & Gemini API</p>
          </div>
        </div>

        <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 shadow-sm">
          <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
          Koszt: 0.00 PLN
        </span>
      </div>

      <div className="space-y-3 mb-4">
        {MODELS_DATA.map((model) => {
          const pct = Math.round((model.tokens / model.limit) * 100);
          return (
            <div key={model.id} className="p-2.5 rounded-xl bg-white/80 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold text-slate-900 mb-1">
                <span>{model.name}</span>
                <span className="font-mono text-indigo-700">{model.tokens.toLocaleString()} tok</span>
              </div>

              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }}></div>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 font-semibold">
                <span>{model.rate}</span>
                <span>{pct}% limitu dziennego</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-2.5 flex items-center justify-between text-[11px] font-mono text-slate-500 border-t border-slate-100">
        <span>Łącznie w cyklu: {totalTokens.toLocaleString()} tokenów</span>
        <span className="flex items-center gap-1 text-emerald-700 font-bold">
          <Zap className="w-3 h-3" />
          Bezpiecznik 0 PLN aktywny
        </span>
      </div>
    </GlassCard>
  );
};
