import React from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';

export interface SingleGradeItem {
  id: string;
  value: number;
  displayValue?: string;
  weight: number;
  category: string;
  date?: string;
  teacher?: string;
  comment?: string;
  semester?: 1 | 2;
  isImprovement?: boolean;
  improvedGradeId?: string;
  improvedValue?: string;
  inAverage?: boolean;
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

const getGradeColor = (val: number, displayVal?: string) => {
  const d = displayVal || String(val);
  if (d === '+') {
    return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700/60 shadow-sm';
  }
  if (d === '-') {
    return 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700/60 shadow-sm';
  }
  if (val >= 5) {
    return 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700/50 shadow-sm';
  }
  if (val >= 4) {
    return 'bg-sky-50 text-sky-800 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-700/50 shadow-sm';
  }
  if (val >= 3) {
    return 'bg-amber-50 text-amber-850 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700/50 shadow-sm';
  }
  if (val >= 2) {
    return 'bg-orange-50 text-orange-850 border-orange-300 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-700/50 shadow-sm';
  }
  return 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-700/50 shadow-sm';
};

const createTooltip = (g: SingleGradeItem): string => {
  const parts = [
    g.category || 'Ocena',
    g.weight > 0 ? `waga: ${g.weight}` : null,
    g.date ? `data: ${g.date}` : null,
    g.teacher ? `nauczyciel: ${g.teacher}` : null,
    g.comment ? `komentarz: ${g.comment}` : null,
    g.isImprovement ? `Poprawa oceny: ${g.improvedValue || ''}` : null
  ].filter(Boolean);
  return parts.join(' | ');
};

export const SubjectGradesGrid: React.FC<SubjectGradesGridProps> = ({ subjects, semester }) => {
  return (
    <div className="space-y-3">
      {subjects.map((sub) => {
        const displayedGrades = semester
          ? sub.grades.filter((g) => !g.semester || g.semester === semester)
          : sub.grades;

        let displayAverage = sub.average;
        if (semester === 1 && sub.semester1Average !== undefined && sub.semester1Average > 0) {
          displayAverage = sub.semester1Average;
        } else if (semester === 2 && sub.semester2Average !== undefined && sub.semester2Average > 0) {
          displayAverage = sub.semester2Average;
        }

        const renderedIds = new Set<string>();

        return (
          <GlassCard key={sub.id} className="p-4" glow="none">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">{sub.name}</h3>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono shadow-sm">
                <span className="text-slate-400 font-semibold">Śr. I:</span>
                <span className="font-bold text-sky-700 dark:text-sky-400">
                  {displayAverage > 0 ? displayAverage.toFixed(2) : '-'}
                </span>
              </div>
            </div>

            {/* Grades pills */}
            {displayedGrades.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-1">Brak ocen w wybranym semestrze.</p>
            ) : (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {displayedGrades.map((g) => {
                  if (renderedIds.has(g.id)) return null;

                  // Sprawdź czy ocena posiada powiązaną poprawę
                  let improvementGrade: SingleGradeItem | undefined;
                  if (g.improvedGradeId && !g.isImprovement) {
                    improvementGrade = displayedGrades.find(
                      (cand) => cand.id === g.improvedGradeId || (cand.isImprovement && cand.improvedGradeId === g.id)
                    );
                  }

                  if (improvementGrade) {
                    renderedIds.add(g.id);
                    renderedIds.add(improvementGrade.id);

                    const pairTooltip = `Poprawa: ocena pierwotna ${g.displayValue || g.value} poprawiona na ${
                      improvementGrade.displayValue || improvementGrade.value
                    } | ${improvementGrade.category} | waga: ${improvementGrade.weight}`;

                    return (
                      <div
                        key={`pair_${g.id}_${improvementGrade.id}`}
                        title={pairTooltip}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40"
                      >
                        <span className="text-xs font-mono font-bold text-slate-400 select-none">[</span>
                        {/* Pierwotna ocena */}
                        <div
                          title={createTooltip(g)}
                          className={`px-2 py-0.5 rounded-lg border text-xs font-mono font-medium opacity-60 line-through ${getGradeColor(
                            g.value,
                            g.displayValue
                          )}`}
                        >
                          <span>{g.displayValue || g.value}</span>
                        </div>
                        {/* Nowa ocena z poprawy */}
                        <div
                          title={createTooltip(improvementGrade)}
                          className={`px-2 py-0.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-1 ${getGradeColor(
                            improvementGrade.value,
                            improvementGrade.displayValue
                          )}`}
                        >
                          <span>{improvementGrade.displayValue || improvementGrade.value}</span>
                          {improvementGrade.weight > 0 && (
                            <span className="text-[9px] opacity-70 font-normal">w{improvementGrade.weight}</span>
                          )}
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-400 select-none">]</span>
                      </div>
                    );
                  }

                  renderedIds.add(g.id);

                  return (
                    <div
                      key={g.id}
                      title={createTooltip(g)}
                      className={`px-2.5 py-1 rounded-xl border text-xs font-mono font-bold flex items-center gap-1 cursor-help transition hover:scale-105 ${getGradeColor(
                        g.value,
                        g.displayValue
                      )}`}
                    >
                      <span>{g.displayValue || g.value}</span>
                      {g.weight > 0 && g.displayValue !== '+' && g.displayValue !== '-' && (
                        <span className="text-[9px] opacity-70 font-normal">w{g.weight}</span>
                      )}
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
