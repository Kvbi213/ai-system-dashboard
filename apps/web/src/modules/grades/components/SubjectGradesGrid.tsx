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
  if (val >= 5) return 'bg-emerald-50 text-emerald-800 border-emerald-200/90 shadow-sm';
  if (val === 4) return 'bg-sky-50 text-sky-800 border-sky-200/90 shadow-sm';
  if (val === 3) return 'bg-amber-50 text-amber-850 border-amber-200/90 shadow-sm';
  return 'bg-rose-50 text-rose-800 border-rose-200/90 shadow-sm';
};

export const SubjectGradesGrid: React.FC<SubjectGradesGridProps> = ({ subjects }) => {
  return (
    <div className="space-y-3">
      {subjects.map((sub) => (
        <GlassCard key={sub.id} className="p-4" glow="none">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">{sub.name}</h3>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs font-mono shadow-sm">
              <span className="text-slate-400 font-semibold">Śr:</span>
              <span className="font-bold text-sky-700">{sub.average.toFixed(2)}</span>
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
