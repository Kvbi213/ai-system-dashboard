import React from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { getLibrusBadgeColor, getBadgeInlineStyle } from './LibrusTableView';

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
  color?: string;
  textColor?: string;
  isInsideBracket?: boolean;
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

const createTooltip = (g: SingleGradeItem): string => {
  const parts = [
    `Ocena: ${g.displayValue || g.value}`,
    g.category ? `Kategoria: ${g.category}` : null,
    g.weight > 0 ? `Waga: ${g.weight}` : null,
    g.date ? `Data: ${g.date}` : null,
    g.teacher ? `Nauczyciel: ${g.teacher}` : null,
    g.comment ? `Komentarz: ${g.comment}` : null,
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
                <span className="text-slate-400 font-semibold">{semester === 2 ? 'Śr. II:' : 'Śr. I:'}</span>
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
                  let retakeGrade: SingleGradeItem | undefined;
                  if (g.improvedGradeId && !g.isImprovement) {
                    retakeGrade = displayedGrades.find(
                      (cand) => cand.id === g.improvedGradeId || (cand.isImprovement && cand.improvedGradeId === g.id)
                    );
                  }

                  if (retakeGrade) {
                    renderedIds.add(g.id);
                    renderedIds.add(retakeGrade.id);

                    const pairTooltip = `Poprawa: ocena pierwotna ${g.displayValue || g.value} poprawiona na ${
                      retakeGrade.displayValue || retakeGrade.value
                    } | ${retakeGrade.category} | waga: ${retakeGrade.weight}`;

                    return (
                      <div
                        key={`pair_${g.id}_${retakeGrade.id}`}
                        title={pairTooltip}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 font-mono text-xs select-none"
                      >
                        <span className="font-bold text-slate-400 select-none">[</span>
                        {/* Pierwotna ocena */}
                        <div
                          title={createTooltip(g)}
                          style={getBadgeInlineStyle(g)}
                          className={`min-w-[22px] h-5 px-1 rounded flex items-center justify-center font-bold text-xs border cursor-help ${!g.color ? getLibrusBadgeColor(
                            g.value,
                            g.displayValue
                          ) : ''}`}
                        >
                          <span>{g.displayValue || g.value}</span>
                        </div>
                        {/* Nowa ocena z poprawy */}
                        <div
                          title={createTooltip(retakeGrade)}
                          style={getBadgeInlineStyle(retakeGrade)}
                          className={`min-w-[22px] h-5 px-1 rounded flex items-center justify-center font-bold text-xs border cursor-help ${!retakeGrade.color ? getLibrusBadgeColor(
                            retakeGrade.value,
                            retakeGrade.displayValue
                          ) : ''}`}
                        >
                          <span>{retakeGrade.displayValue || retakeGrade.value}</span>
                        </div>
                        <span className="font-bold text-slate-400 select-none">]</span>
                      </div>
                    );
                  }

                  renderedIds.add(g.id);

                  return (
                    <div
                      key={g.id}
                      title={createTooltip(g)}
                      style={getBadgeInlineStyle(g)}
                      className={`min-w-[24px] h-6 px-1.5 rounded-md border text-xs font-mono font-bold flex items-center justify-center cursor-help transition hover:scale-105 ${!g.color ? getLibrusBadgeColor(
                        g.value,
                        g.displayValue
                      ) : ''}`}
                    >
                      <span>{g.displayValue || g.value}</span>
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
