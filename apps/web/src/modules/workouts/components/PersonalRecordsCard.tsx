import React from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Trophy, TrendingUp, Calendar } from 'lucide-react';

export const PersonalRecordsCard: React.FC = () => {
  const records = [
    { exercise: 'Podciąganie na drążku (nachwyt)', record: '14 powtórzeń', date: '18 paź 2026', extra: 'Czysta forma bez bujania' },
    { exercise: 'Dipy na poręczach (kalistenika)', record: '22 powtórzenia', date: '22 paź 2026', extra: 'Masa ciała + głębokie zejście' },
    { exercise: 'Dipy z obciążeniem zewnętrznym', record: '+15 kg x 6 powt.', date: '14 paź 2026', extra: 'Pas obciążeniowy' },
    { exercise: 'Wznosy prostych nóg do drążka', record: '16 powtórzeń', date: '26 paź 2026', extra: 'Dotknięcie stóp do drążka' }
  ];

  return (
    <GlassCard className="p-4 sm:p-5" glow="sky">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-100 text-sky-700 border border-sky-200 shadow-sm">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Rekordy Siłowe i Osiągnięcia</h3>
            <p className="text-xs text-slate-500 font-medium">Osobiste maksima w kalistenice</p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs text-sky-700 font-bold bg-sky-50 px-2.5 py-1 rounded-xl border border-sky-200 shadow-sm">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>PROGRES</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {records.map((rec, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-2xl bg-white/70 border border-slate-200/80 shadow-sm flex flex-col justify-between"
          >
            <div>
              <p className="text-xs font-bold text-slate-900">{rec.exercise}</p>
              <p className="text-lg font-bold font-mono text-sky-800 mt-1">{rec.record}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{rec.extra}</p>
            </div>

            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mt-3 pt-2 border-t border-slate-100">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>Osiągnięto: {rec.date}</span>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};
