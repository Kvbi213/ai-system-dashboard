import React from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Award, Sparkles, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface GradeStatsSummaryProps {
  gpa?: number;
  luckyNumber?: number;
  threatsCount?: number;
  totalGrades?: number;
  semester?: 1 | 2;
}

export const GradeStatsSummary: React.FC<GradeStatsSummaryProps> = ({
  gpa = 4.29,
  luckyNumber = 3,
  threatsCount = 0,
  totalGrades = 40,
  semester = 1
}) => {
  let gpaBadgeText = 'Dobre wyniki (≥3.00)';
  let gpaBadgeColor = 'text-amber-700 dark:text-amber-400';

  if (gpa >= 4.75) {
    gpaBadgeText = 'Pasek z wyróżnieniem (≥4.75)';
    gpaBadgeColor = 'text-emerald-700 dark:text-emerald-400';
  } else if (gpa >= 4.00) {
    gpaBadgeText = 'Średnia wysoka (≥4.00)';
    gpaBadgeColor = 'text-sky-700 dark:text-sky-400';
  } else if (gpa < 3.00) {
    gpaBadgeText = 'Wymaga uwagi (<3.00)';
    gpaBadgeColor = 'text-rose-700 dark:text-rose-400';
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {/* GPA Hero Card */}
      <GlassCard className="p-4" glow="sky">
        <div className="flex items-center gap-2 mb-1">
          <Award className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Średnia ocen (GPA)</span>
        </div>
        <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight">{gpa.toFixed(2)}</p>
        <span className={`text-[10px] font-mono font-bold ${gpaBadgeColor}`}>{gpaBadgeText}</span>
      </GlassCard>

      {/* Lucky Number */}
      <GlassCard className="p-4" glow="none">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Szczęśliwy nr</span>
        </div>
        <p className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-400 tracking-tight">{luckyNumber}</p>
        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-medium">Brak pytań z ławki</span>
      </GlassCard>

      {/* Threats / Warnings */}
      <GlassCard className="p-4" glow="none">
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Zagrożenia</span>
        </div>
        <p className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400 tracking-tight">
          {threatsCount}
        </p>
        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-bold">Wszystkie przedmioty OK</span>
      </GlassCard>

      {/* Total Grades */}
      <GlassCard className="p-4" glow="none">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Liczba ocen</span>
        </div>
        <p className="text-2xl font-bold font-mono text-indigo-700 dark:text-indigo-400 tracking-tight">{totalGrades}</p>
        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-medium">Okres {semester} (2026/2027)</span>
      </GlassCard>
    </div>
  );
};
