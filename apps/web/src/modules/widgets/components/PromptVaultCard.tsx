import React, { useState } from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Bookmark, Copy, Check } from 'lucide-react';

interface PromptItem {
  id: string;
  title: string;
  category: string;
  prompt: string;
}

const VAULT_PROMPTS: PromptItem[] = [
  {
    id: '1',
    title: 'Senior Code Reviewer (Zero-Trust)',
    category: 'Jakość',
    prompt: 'Działasz jako Principal Senior Code Reviewer w Google Antigravity. Zbadaj kod pod kątem wycieków pamięci, wyścigów i podatności. Zero small-talku.'
  },
  {
    id: '2',
    title: 'Refaktoryzacja Modułowa (SRP)',
    category: 'Architektura',
    prompt: 'Podziel wskazany komponent na mikro-komponenty o wielkości poniżej 150 linii kodu. Logikę stanu wyodrębnij do dedykowanego hooka.'
  },
  {
    id: '3',
    title: 'One-Shot Root Cause Isolation',
    category: 'Debug',
    prompt: 'Przeanalizuj ślad błędu, odizoluj przyczynę źródłową, napisz deterministyczny test regresyjny w Vitest i dostarcz kompletną poprawkę.'
  }
];

export const PromptVaultCard: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <GlassCard className="p-4 sm:p-5" glow="sky">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-sky-100 text-sky-700 border border-sky-200 shadow-sm">
            <Bookmark className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Skarbiec Promptów (Vault)</h3>
            <p className="text-xs text-slate-500 font-medium">Sprawdzone formuły inżynieryjne AI</p>
          </div>
        </div>

        <span className="text-[11px] font-mono font-bold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-xl border border-sky-200">
          3 Szablony
        </span>
      </div>

      <div className="space-y-2.5">
        {VAULT_PROMPTS.map((item) => {
          const isCopied = copiedId === item.id;
          return (
            <div
              key={item.id}
              className="p-3 rounded-xl bg-white/80 border border-slate-200 hover:border-sky-300 transition-all shadow-xs"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-900">{item.title}</span>
                <span className="text-[10px] font-mono uppercase font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                  {item.category}
                </span>
              </div>

              <p className="text-[11px] text-slate-600 line-clamp-2 font-mono mb-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                {item.prompt}
              </p>

              <button
                onClick={() => handleCopy(item.id, item.prompt)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  isCopied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Skopiowano!' : 'Kopiuj prompt'}</span>
              </button>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
};
