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
      <div className="absolute -top-16 -right-16 w-36 h-36 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
              {status === 'in_progress' ? 'Trwa lekcja w ZSE' : 'Następna lekcja'}
            </span>
          </div>
          <NavLink
            to="/timetable"
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-sky-300 transition"
          >
            <span>Plan</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>

        <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug">
          {subject}
        </h2>

        {substitutionNote && (
          <div className="mt-1.5">
            <Badge variant="warning">{substitutionNote}</Badge>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-3 text-xs text-slate-300">
          <div className="flex items-center gap-1.5 font-mono text-sky-300">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span>{timeRange}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{room}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>{teacher}</span>
          </div>
        </div>
      </div>

      {/* Progress & Remaining Time Capsule */}
      <div className="mt-4 pt-3 border-t border-slate-800/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center font-bold text-xs text-sky-400 font-mono">
            {remainingMinutes}m
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Do dzwonka pozostało</p>
            <p className="text-xs font-semibold text-slate-200">{remainingMinutes} minut</p>
          </div>
        </div>

        <div className="w-24 sm:w-32 bg-slate-800/80 rounded-full h-2 overflow-hidden border border-slate-700/60">
          <div
            className="bg-gradient-to-r from-sky-500 to-indigo-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(10, ((45 - remainingMinutes) / 45) * 100))}%` }}
          />
        </div>
      </div>
    </GlassCard>
  );
};
