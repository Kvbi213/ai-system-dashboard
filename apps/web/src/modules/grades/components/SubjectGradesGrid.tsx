import React from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';

export interface SingleGradeItem {
  id: string;
  value: number;
  weight: number;
  category: string;
  date?: string;
  teacher?: string;
  semester?: 1 | 2;
}

export interface SubjectGradeItem {
  id: string;
  name: string;
  average: number;
  semester1Average?: number;
  semester2Average?: number;
  grades: SingleGradeItem[];
}

interface SubjectGradesGridProps {
  subjects: SubjectGradeItem[];
  semester?: 1 | 2;
}

const getGradeColor = (val: number) => {
  if (val >= 5) return 'bg-emerald-50 text-emerald-800 border-emerald-200/90 shadow-sm';
  if (val >= 4) return 'bg-sky-50 text-sky-800 border-sky-200/90 shadow-sm';
  if (val >= 3) return 'bg-amber-50 text-amber-850 border-amber-200/90 shadow-sm';
  return 'bg-rose-50 text-rose-800 border-rose-200/90 shadow-sm';
};

export const SubjectGradesGrid: React.FC<SubjectGradesGridProps> = ({ subjects, semester }) => {
  return (
    <div className="space-y-3">
      {subjects.map((sub) => {
        const displayedGrades = semester
          ? sub.grades.filter((g) => !g.semester || g.semester === semester)
          : sub.grades;

        let displayAverage = sub.average;
        if (semester === 1 && sub.semester1Average) {
          displayAverage = sub.semester1Average;
        } else if (semester === 2 && sub.semester2Average) {
          displayAverage = sub.semester2Average;
        } else if (displayedGrades.length > 0) {
          let sumP = 0;
          let sumW = 0;
          for (const g of displayedGrades) {
            if (g.weight > 0) {
              sumP += g.value * g.weight;
              sumW += g.weight;
            }
          }
          if (sumW > 0) {
            displayAverage = Number((sumP / sumW).toFixed(2));
          }
        }

        return (
          <GlassCard key={sub.id} className="p-4" glow="none">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">{sub.name}</h3>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono shadow-sm">
                <span className="text-slate-400 font-semibold">Śr:</span>
                <span className="font-bold text-sky-700 dark:text-sky-400">
                  {displayAverage > 0 ? displayAverage.toFixed(2) : '-'}
                </span>
              </div>
            </div>

            {/* Grades pills */}
            {displayedGrades.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-1">Brak ocen w wybranym semestrze.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {displayedGrades.map((g) => {
                  const tooltip = [
                    g.category,
                    `waga: ${g.weight}`,
                    g.date ? `data: ${g.date}` : null,
                    g.teacher ? `nauczyciel: ${g.teacher}` : null
                  ]
                    .filter(Boolean)
                    .join(' | ');

                  return (
                    <div
                      key={g.id}
                      title={tooltip}
                      className={`px-2.5 py-1 rounded-xl border text-xs font-mono font-bold flex items-center gap-1 cursor-help transition hover:scale-105 ${getGradeColor(
                        g.value
                      )}`}
                    >
                      <span>{g.value}</span>
                      <span className="text-[9px] opacity-70 font-normal">w{g.weight}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        );
      })}
    </div>
  );
};
