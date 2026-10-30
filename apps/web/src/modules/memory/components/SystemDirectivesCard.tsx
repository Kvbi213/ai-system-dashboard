import React from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

interface Directive {
  id: string;
  name: string;
  level: string;
  text: string;
}

const DIRECTIVES: Directive[] = [
  {
    id: 'DIR_01',
    name: 'PROTOKÓŁ ANTIGRAVITY v4.0',
    level: 'Priorytet 0',
    text: 'Odpowiedzi agenta muszą być deterministyczne, produkcyjne w pierwszym podejściu i pozbawione konwersacyjnego szumu.'
  },
  {
    id: 'DIR_02',
    name: 'REGUŁA 21: Symetria z Obsidianem',
    level: 'Architektura',
    text: 'Wszelka dokumentacja techniczna i rejestry wydań są symetrycznie utrzymywane w skarbcu Obsidian PROJEKTY.'
  },
  {
    id: 'DIR_03',
    name: 'BEZPIECZEŃSTWO: Zero-Trust Sandboxing',
    level: 'Krytyczna',
    text: 'Brak ekspozycji sekretów i tokenów do bundla przeglądarki. Całkowity zakaz wieloznaczników CORS (*).'
  }
];

export const SystemDirectivesCard: React.FC = () => {
  return (
    <GlassCard className="p-4 sm:p-5" glow="sky">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-sky-100 text-sky-700 border border-sky-200 shadow-sm">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Dyrektywy Systemowe Kognitywne</h3>
            <p className="text-xs text-slate-500 font-medium">Niezmienniki operacyjne silnika OmniDash</p>
          </div>
        </div>

        <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          100% Zgodności
        </span>
      </div>

      <div className="space-y-3">
        {DIRECTIVES.map((dir) => (
          <div
            key={dir.id}
            className="p-3 rounded-xl bg-white/80 border border-slate-200 shadow-xs space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 font-mono">{dir.name}</span>
              <span className="text-[10px] font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                {dir.level}
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">{dir.text}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};
