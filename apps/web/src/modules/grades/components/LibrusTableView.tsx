import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Info } from 'lucide-react';
import { SubjectGradeItem, SingleGradeItem } from './SubjectGradesGrid';

interface LibrusTableViewProps {
  subjects: SubjectGradeItem[];
  activeSemester?: 1 | 2;
}

export const isLightColor = (hexColor: string): boolean => {
  const cleanHex = hexColor.replace('#', '').trim();
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.55;
  }
  return true;
};

/**
 * Zwraca autentyczny styl CSS dla plakietki oceny z Librusa (kolor HEX z systemu).
 */
export const getBadgeInlineStyle = (g: SingleGradeItem): React.CSSProperties => {
  if (g.color) {
    const isLight = isLightColor(g.color);
    return {
      backgroundColor: g.color,
      color: g.textColor || (isLight ? '#0f172a' : '#ffffff'),
      borderColor: 'rgba(0, 0, 0, 0.18)'
    };
  }
  return {};
};

/**
 * Rezerwowa paleta barw Librus Synergia dla etykiet ocen (w przypadku braku koloru HEX).
 */
export const formatGradeBadgeText = (g: SingleGradeItem): string => {
  const d = (g.displayValue || '').trim();
  if (d && d !== '0') return d;
  if (g.value === 0) {
    if (d === '-' || g.category?.toLowerCase().includes('minus') || g.comment?.includes('-')) return '-';
    return '+';
  }
  return String(g.value);
};

export const getLibrusBadgeColor = (val: number, displayVal?: string): string => {
  const d = (displayVal || String(val)).trim();
  if (d === '+' || d === '-' || val === 0) {
    return 'bg-lime-300 text-slate-900 border-lime-400 font-bold';
  }
  if (d === '6') {
    return 'bg-cyan-300 text-slate-950 border-cyan-400';
  }
  if (d === '5' || d === '5+') {
    return 'bg-emerald-300 text-slate-950 border-emerald-400';
  }
  if (d === '4' || d === '4+') {
    return 'bg-amber-300 text-slate-950 border-amber-400';
  }
  if (d === '3' || d === '3-') {
    return 'bg-sky-200 text-slate-950 border-sky-300';
  }
  if (d === '2' || d === '2+') {
    return 'bg-orange-300 text-slate-950 border-orange-400';
  }
  return 'bg-rose-400 text-white border-rose-500';
};

const createGradeTooltip = (g: SingleGradeItem): string => {
  const parts = [
    `Ocena: ${g.displayValue || g.value}`,
    g.category ? `Kategoria: ${g.category}` : null,
    g.weight !== undefined ? `Waga: ${g.weight}` : null,
    g.date ? `Data: ${g.date}` : null,
    g.teacher ? `Nauczyciel: ${g.teacher}` : null,
    g.inAverage === false ? 'Licz do średniej: nie' : 'Licz do średniej: tak',
    g.isImprovement ? `Poprawa oceny: ${g.improvedValue || ''}` : null,
    g.comment ? `Komentarz: ${g.comment}` : null
  ].filter(Boolean);
  return parts.join(' | ');
};

export const LibrusTableView: React.FC<LibrusTableViewProps> = ({ subjects, activeSemester = 1 }) => {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAll = () => {
    const allExpanded = subjects.every((s) => expandedRows[s.id]);
    if (allExpanded) {
      setExpandedRows({});
    } else {
      const next: Record<string, boolean> = {};
      subjects.forEach((s) => {
        next[s.id] = true;
      });
      setExpandedRows(next);
    }
  };

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm">
      <table className="w-full border-collapse text-left text-xs">
        {/* Table Header 1:1 Librus Synergia */}
        <thead>
          <tr className="bg-slate-100/90 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-semibold select-none">
            <th className="w-9 px-2 py-2.5 text-center border-r border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={toggleAll}
                className="w-5 h-5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                title="Rozwiń / zwiń wszystkie przedmioty"
              >
                {subjects.every((s) => expandedRows[s.id]) ? '−' : '+'}
              </button>
            </th>
            <th className="px-3 py-2.5 min-w-[200px] border-r border-slate-200 dark:border-slate-800 font-bold text-slate-800 dark:text-slate-200">
              Przedmiot
            </th>
            <th
              colSpan={3}
              className={`px-3 py-2 text-center border-r border-slate-200 dark:border-slate-800 font-bold ${
                activeSemester === 1
                  ? 'bg-sky-100/70 dark:bg-sky-950/50 text-sky-900 dark:text-sky-200'
                  : 'bg-slate-200/50 dark:bg-slate-800/50'
              }`}
            >
              Okres 1
            </th>
            <th
              colSpan={3}
              className={`px-3 py-2 text-center border-r border-slate-200 dark:border-slate-800 font-bold ${
                activeSemester === 2
                  ? 'bg-sky-100/70 dark:bg-sky-950/50 text-sky-900 dark:text-sky-200'
                  : ''
              }`}
            >
              Okres 2
            </th>
            <th colSpan={2} className="px-3 py-2 text-center font-bold bg-slate-200/40 dark:bg-slate-800/40">
              Koniec roku
            </th>
          </tr>
          <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold select-none">
            <th className="border-r border-slate-200 dark:border-slate-800"></th>
            <th className="border-r border-slate-200 dark:border-slate-800"></th>
            {/* Okres 1 */}
            <th className="px-3 py-1.5 min-w-[190px] border-r border-slate-200 dark:border-slate-800">Oceny bieżące</th>
            <th className="px-2 py-1.5 w-14 text-center border-r border-slate-200 dark:border-slate-800 font-mono">Śr. I</th>
            <th className="px-2 py-1.5 w-10 text-center border-r border-slate-200 dark:border-slate-800 font-mono">I</th>
            {/* Okres 2 */}
            <th className="px-3 py-1.5 min-w-[110px] border-r border-slate-200 dark:border-slate-800">Oceny bieżące</th>
            <th className="px-2 py-1.5 w-14 text-center border-r border-slate-200 dark:border-slate-800 font-mono">Śr. II</th>
            <th className="px-2 py-1.5 w-10 text-center border-r border-slate-200 dark:border-slate-800 font-mono">II</th>
            {/* Koniec roku */}
            <th className="px-2 py-1.5 w-14 text-center border-r border-slate-200 dark:border-slate-800 font-mono">Śr. R</th>
            <th className="px-2 py-1.5 w-10 text-center font-mono">R</th>
          </tr>
        </thead>

        {/* Rows */}
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
          {subjects.map((sub) => {
            const isExpanded = Boolean(expandedRows[sub.id]);
            const sem1Grades = sub.grades.filter((g) => !g.semester || g.semester === 1);
            const sem2Grades = sub.grades.filter((g) => g.semester === 2);

            const sem1AvgStr = sub.semester1Average !== undefined && sub.semester1Average > 0
              ? sub.semester1Average.toFixed(2)
              : (sub.average > 0 && sem1Grades.length > 0 ? sub.average.toFixed(2) : '-');

            const sem2AvgStr = sub.semester2Average !== undefined && sub.semester2Average > 0
              ? sub.semester2Average.toFixed(2)
              : '-';

            const yearAvgStr = sem1AvgStr !== '-' ? sem1AvgStr : (sem2AvgStr !== '-' ? sem2AvgStr : '-');

            // Renderowanie ocen semestru 1 z obsługą klamer
            const renderedIds = new Set<string>();

            return (
              <React.Fragment key={sub.id}>
                <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                  {/* Expand toggle */}
                  <td className="px-2 py-2 text-center border-r border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => toggleRow(sub.id)}
                      className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-[10px] text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 transition"
                      title="Szczegóły ocen przedmiotu"
                    >
                      {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </button>
                  </td>

                  {/* Przedmiot */}
                  <td className="px-3 py-2 border-r border-slate-100 dark:border-slate-800 font-medium text-slate-900 dark:text-slate-100">
                    <button
                      type="button"
                      onClick={() => toggleRow(sub.id)}
                      className="text-left hover:text-sky-600 dark:hover:text-sky-400 transition focus:outline-none"
                    >
                      {sub.name}
                    </button>
                  </td>

                  {/* Okres 1: Oceny bieżące */}
                  <td className="px-3 py-2 border-r border-slate-100 dark:border-slate-800">
                    {sem1Grades.length === 0 ? (
                      <span className="text-slate-400 text-xs italic">Brak ocen</span>
                    ) : (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {sem1Grades.map((g) => {
                          if (renderedIds.has(g.id)) return null;

                          // Sprawdzenie czy ocena stanowi parę poprawkową
                          let retakeGrade: SingleGradeItem | undefined;
                          if (g.improvedGradeId && !g.isImprovement) {
                            retakeGrade = sem1Grades.find(
                              (cand) => cand.id === g.improvedGradeId || (cand.isImprovement && cand.improvedGradeId === g.id)
                            );
                          } else if (g.isInsideBracket) {
                            retakeGrade = sem1Grades.find(
                              (cand) => cand.isInsideBracket && cand.id !== g.id && !renderedIds.has(cand.id)
                            );
                          }

                          if (retakeGrade) {
                            renderedIds.add(g.id);
                            renderedIds.add(retakeGrade.id);

                            return (
                              <div
                                key={`pair_${g.id}_${retakeGrade.id}`}
                                className="inline-flex items-center gap-0.5 select-none"
                                title={`Poprawa oceny: pierwotna ${formatGradeBadgeText(g)} poprawiona na ${formatGradeBadgeText(retakeGrade)}`}
                              >
                                <span className="text-slate-700 dark:text-slate-300 font-bold select-none text-[13px] mr-0.5">[</span>
                                <span
                                  title={createGradeTooltip(g)}
                                  style={getBadgeInlineStyle(g)}
                                  className={`min-w-[20px] h-[22px] px-1 rounded-[3px] inline-flex items-center justify-center font-sans font-bold text-[12px] border cursor-help ${!g.color ? getLibrusBadgeColor(g.value, g.displayValue) : ''}`}
                                >
                                  {formatGradeBadgeText(g)}
                                </span>
                                <span className="w-0.5"></span>
                                <span
                                  title={createGradeTooltip(retakeGrade)}
                                  style={getBadgeInlineStyle(retakeGrade)}
                                  className={`min-w-[20px] h-[22px] px-1 rounded-[3px] inline-flex items-center justify-center font-sans font-bold text-[12px] border cursor-help ${!retakeGrade.color ? getLibrusBadgeColor(retakeGrade.value, retakeGrade.displayValue) : ''}`}
                                >
                                  {formatGradeBadgeText(retakeGrade)}
                                </span>
                                <span className="text-slate-700 dark:text-slate-300 font-bold select-none text-[13px] ml-0.5">]</span>
                              </div>
                            );
                          }

                          renderedIds.add(g.id);

                          return (
                            <span
                              key={g.id}
                              title={createGradeTooltip(g)}
                              style={getBadgeInlineStyle(g)}
                              className={`min-w-[20px] h-[22px] px-1 rounded-[3px] inline-flex items-center justify-center font-sans font-bold text-[12px] border cursor-help transition-transform hover:scale-110 shadow-xs ${!g.color ? getLibrusBadgeColor(g.value, g.displayValue) : ''}`}
                            >
                              {formatGradeBadgeText(g)}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </td>

                  {/* Śr. I */}
                  <td className="px-2 py-2 text-center border-r border-slate-100 dark:border-slate-800 font-mono text-slate-700 dark:text-slate-300">
                    {sem1AvgStr}
                  </td>

                  {/* I */}
                  <td className="px-2 py-2 text-center border-r border-slate-100 dark:border-slate-800 font-mono text-slate-400">
                    -
                  </td>

                  {/* Okres 2: Oceny bieżące */}
                  <td className="px-3 py-2 border-r border-slate-100 dark:border-slate-800">
                    {sem2Grades.length === 0 ? (
                      <span className="text-slate-400 text-xs italic">Brak ocen</span>
                    ) : (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {sem2Grades.map((g) => (
                          <span
                            key={g.id}
                            title={createGradeTooltip(g)}
                            style={getBadgeInlineStyle(g)}
                            className={`min-w-[20px] h-[22px] px-1 rounded-[3px] inline-flex items-center justify-center font-sans font-bold text-[12px] border cursor-help transition-transform hover:scale-110 shadow-xs ${!g.color ? getLibrusBadgeColor(g.value, g.displayValue) : ''}`}
                          >
                            {formatGradeBadgeText(g)}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* Śr. II */}
                  <td className="px-2 py-2 text-center border-r border-slate-100 dark:border-slate-800 font-mono text-slate-700 dark:text-slate-300">
                    {sem2AvgStr}
                  </td>

                  {/* II */}
                  <td className="px-2 py-2 text-center border-r border-slate-100 dark:border-slate-800 font-mono text-slate-400">
                    -
                  </td>

                  {/* Koniec roku: Śr. R */}
                  <td className="px-2 py-2 text-center border-r border-slate-100 dark:border-slate-800 font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {yearAvgStr}
                  </td>

                  {/* R */}
                  <td className="px-2 py-2 text-center font-mono text-slate-400">
                    -
                  </td>
                </tr>

                {/* Rozwinięcie szczegółów ocen dla przedmiotu */}
                {isExpanded && (
                  <tr className="bg-slate-50/95 dark:bg-slate-850/90 border-b border-slate-200 dark:border-slate-800">
                    <td colSpan={10} className="p-3">
                      <div className="rounded-xl border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-900 p-3 shadow-inner">
                        <div className="flex items-center gap-2 mb-2 font-semibold text-slate-800 dark:text-slate-200">
                          <Info className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                          <span>Szczegółowy wykaz ocen: {sub.name}</span>
                        </div>
                        {sub.grades.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">Brak zarejestrowanych ocen w systemie.</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-1">
                                  <th className="py-1 px-2 text-left">Ocena</th>
                                  <th className="py-1 px-2 text-left">Kategoria</th>
                                  <th className="py-1 px-2 text-center">Waga</th>
                                  <th className="py-1 px-2 text-left">Data</th>
                                  <th className="py-1 px-2 text-left">Nauczyciel</th>
                                  <th className="py-1 px-2 text-center">Licz do średniej</th>
                                  <th className="py-1 px-2 text-left">Komentarz / Poprawa</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {sub.grades.map((g) => (
                                  <tr key={`detail_${g.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                    <td className="py-1.5 px-2">
                                      <span
                                        style={getBadgeInlineStyle(g)}
                                        className={`inline-block min-w-[22px] h-[22px] px-1 rounded-[3px] font-sans font-bold text-center border text-[12px] leading-[20px] ${!g.color ? getLibrusBadgeColor(g.value, g.displayValue) : ''}`}
                                      >
                                        {formatGradeBadgeText(g)}
                                      </span>
                                    </td>
                                    <td className="py-1.5 px-2 font-medium text-slate-700 dark:text-slate-300">
                                      {g.category || 'Brak kategorii'}
                                    </td>
                                    <td className="py-1.5 px-2 text-center font-mono font-bold text-slate-600 dark:text-slate-400">
                                      {g.weight}
                                    </td>
                                    <td className="py-1.5 px-2 font-mono text-slate-500">
                                      {g.date || '-'}
                                    </td>
                                    <td className="py-1.5 px-2 text-slate-600 dark:text-slate-400">
                                      {g.teacher || '-'}
                                    </td>
                                    <td className="py-1.5 px-2 text-center">
                                      <span
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                          g.inAverage === false
                                            ? 'bg-slate-150 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                        }`}
                                      >
                                        {g.inAverage === false ? 'nie' : 'tak'}
                                      </span>
                                    </td>
                                    <td className="py-1.5 px-2 text-slate-500 italic">
                                      {g.isImprovement && (
                                        <span className="text-sky-600 dark:text-sky-400 font-semibold not-italic mr-1">
                                          [Poprawa oceny: {g.improvedValue || ''}]
                                        </span>
                                      )}
                                      {g.comment || '-'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}

          {/* Wiersz Zachowanie 1:1 z portalu Librus */}
          <tr className="bg-slate-50/60 dark:bg-slate-850/40 font-medium">
            <td className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800 text-slate-400">−</td>
            <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800 font-bold text-slate-800 dark:text-slate-200">
              Zachowanie
            </td>
            <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800 text-slate-400 italic">Brak ocen</td>
            <td className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800 font-mono text-slate-400">-</td>
            <td className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800 font-mono text-slate-400">-</td>
            <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800 text-slate-400 italic">Brak ocen</td>
            <td className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800 font-mono text-slate-400">-</td>
            <td className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800 font-mono text-slate-400">-</td>
            <td className="px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800 font-mono text-slate-400">-</td>
            <td className="px-2 py-2 text-center font-mono text-slate-400">-</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
