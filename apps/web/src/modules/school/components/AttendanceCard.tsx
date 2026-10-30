import React from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { UserCheck, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface AttendanceProps {
  percentage?: number;
  presentHours?: number;
  excusedHours?: number;
  unexcusedHours?: number;
  lateCount?: number;
}

export const AttendanceCard: React.FC<AttendanceProps> = ({
  percentage = 95.4,
  presentHours = 342,
  excusedHours = 14,
  unexcusedHours = 2,
  lateCount = 3
}) => {
  return (
    <GlassCard className="p-4 sm:p-5" glow="emerald">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Wskaźnik Frekwencji Zajęć</h3>
            <p className="text-xs text-slate-500 font-medium">Bieżący semestr akademicki / dydaktyczny</p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-xs text-slate-400 font-medium">Wskaźnik ogólny</p>
          <p className="text-2xl font-bold font-mono text-emerald-700">{percentage}%</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden mb-4 border border-white">
        <div
          className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full rounded-full transition-all duration-500 shadow-sm"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Stat Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-2.5 rounded-xl bg-white/70 border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Obecności</span>
          </div>
          <p className="text-base font-bold font-mono text-slate-900">{presentHours}h</p>
        </div>

        <div className="p-2.5 rounded-xl bg-white/70 border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <Clock className="w-3.5 h-3.5 text-sky-600" />
            <span>Usprawiedliwione</span>
          </div>
          <p className="text-base font-bold font-mono text-slate-900">{excusedHours}h</p>
        </div>

        <div className="p-2.5 rounded-xl bg-white/70 border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Nieusprawiedliwione</span>
          </div>
          <p className="text-base font-bold font-mono text-rose-700">{unexcusedHours}h</p>
        </div>

        <div className="p-2.5 rounded-xl bg-white/70 border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Spóźnienia</span>
          </div>
          <p className="text-base font-bold font-mono text-amber-700">{lateCount}</p>
        </div>
      </div>
    </GlassCard>
  );
};
