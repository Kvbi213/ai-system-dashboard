import React from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Award, Sparkles, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface GradeStatsSummaryProps {
  gpa?: number;
  luckyNumber?: number;
  threatsCount?: number;
  totalGrades?: number;
}

export const GradeStatsSummary: React.FC<GradeStatsSummaryProps> = ({
  gpa = 4.62,
  luckyNumber = 21,
  threatsCount = 0,
  totalGrades = 38
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {/* GPA Hero Card */}
      <GlassCard className="p-4" glow="sky">
        <div className="flex items-center gap-2 mb-1">
          <Award className="w-4 h-4 text-sky-400" />
          <span className="text-xs text-slate-400 font-medium">Średnia ocen</span>
        </div>
        <p className="text-2xl font-bold font-mono text-white tracking-tight">{gpa.toFixed(2)}</p>
        <span className="text-[10px] text-emerald-400 font-mono">Pasek wzorowy (&gt;4.75)</span>
      </GlassCard>

      {/* Lucky Number */}
      <GlassCard className="p-4" glow="none">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs text-slate-400 font-medium">Szczęśliwy nr</span>
        </div>
        <p className="text-2xl font-bold font-mono text-amber-300 tracking-tight">{luckyNumber}</p>
        <span className="text-[10px] text-slate-400 font-mono">Brak pytań z ławki</span>
      </GlassCard>

      {/* Threats / Warnings */}
      <GlassCard className="p-4" glow="none">
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert className="w-4 h-4 text-emerald-400" />
          <span className="text-xs text-slate-400 font-medium">Zagrożenia</span>
        </div>
        <p className="text-2xl font-bold font-mono text-emerald-400 tracking-tight">
          {threatsCount}
        </p>
        <span className="text-[10px] text-emerald-400 font-mono">Wszystkie przedmioty OK</span>
      </GlassCard>

      {/* Total Grades */}
      <GlassCard className="p-4" glow="none">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle2 className="w-4 h-4 text-indigo-400" />
          <span className="text-xs text-slate-400 font-medium">Liczba ocen</span>
        </div>
        <p className="text-2xl font-bold font-mono text-indigo-300 tracking-tight">{totalGrades}</p>
        <span className="text-[10px] text-slate-400 font-mono">Semestr 2 (2025/2026)</span>
      </GlassCard>
    </div>
  );
};
