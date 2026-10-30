import React from 'react';
import { NavLink } from 'react-router-dom';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Badge } from '../../../components/ui/Badge';
import { Clock, MapPin, UserCheck, ArrowUpRight } from 'lucide-react';

interface CurrentLessonHeroProps {
  status?: 'in_progress' | 'upcoming' | 'finished';
  subject?: string;
  timeRange?: string;
  room?: string;
  teacher?: string;
  remainingMinutes?: number;
  substitutionNote?: string | null;
}

export const CurrentLessonHero: React.FC<CurrentLessonHeroProps> = ({
  status = 'in_progress',
  subject = 'Projektowanie Oprogramowania',
  timeRange = '10:45 - 11:30',
  room = 'Pracownia 204',
  teacher = 'inż. K. Wiśniewski',
  remainingMinutes = 24,
  substitutionNote = null
}) => {
  return (
    <GlassCard className="p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden" glow="sky">
      {/* Decorative backdrop light */}
      <div className="absolute -top-16 -right-16 w-44 h-44 bg-sky-200/40 rounded-full blur-2xl pointer-events-none" />

      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-sky-700">
              {status === 'in_progress' ? 'Trwa lekcja w ZSE' : 'Następna lekcja'}
            </span>
          </div>
          <NavLink
            to="/timetable"
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-sky-700 font-semibold transition"
          >
            <span>Plan</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>

        <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-snug">
          {subject}
        </h2>

        {substitutionNote && (
          <div className="mt-1.5">
            <Badge variant="warning">{substitutionNote}</Badge>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-3 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-200/60 shadow-sm">
            <Clock className="w-3.5 h-3.5 text-sky-600" />
            <span>{timeRange}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-700">{room}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-700">{teacher}</span>
          </div>
        </div>
      </div>

      {/* Progress & Remaining Time Capsule */}
      <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center font-bold text-xs text-sky-700 font-mono shadow-sm">
            {remainingMinutes}m
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium">Do dzwonka pozostało</p>
            <p className="text-xs font-bold text-slate-800">{remainingMinutes} minut</p>
          </div>
        </div>

        <div className="w-28 sm:w-36 bg-slate-200/80 rounded-full h-2 overflow-hidden border border-white">
          <div
            className="bg-gradient-to-r from-sky-500 to-indigo-600 h-full rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${Math.min(100, Math.max(10, ((45 - remainingMinutes) / 45) * 100))}%` }}
          />
        </div>
      </div>
    </GlassCard>
  );
};
