import React from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';

export interface SubjectGradeItem {
  id: string;
  name: string;
  average: number;
  grades: Array<{
    id: string;
    value: number;
    weight: number;
    category: string;
  }>;
}

interface SubjectGradesGridProps {
  subjects: SubjectGradeItem[];
}

const getGradeColor = (val: number) => {
  if (val >= 5) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  if (val === 4) return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
  if (val === 3) return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
  return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
};

export const SubjectGradesGrid: React.FC<SubjectGradesGridProps> = ({ subjects }) => {
  return (
    <div className="space-y-3">
      {subjects.map((sub) => (
        <GlassCard key={sub.id} className="p-4" glow="none">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-100 tracking-tight">{sub.name}</h3>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
              <span className="text-slate-400">Śr:</span>
              <span className="font-bold text-sky-400">{sub.average.toFixed(2)}</span>
            </div>
          </div>

          {/* Grades pills */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {sub.grades.map((g) => (
              <div
                key={g.id}
                title={`${g.category} (waga ${g.weight})`}
                className={`px-2.5 py-1 rounded-xl border text-xs font-mono font-bold flex items-center gap-1 cursor-default ${getGradeColor(
                  g.value
                )}`}
              >
                <span>{g.value}</span>
                <span className="text-[9px] opacity-70 font-normal">w{g.weight}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      ))}
    </div>
  );
};
