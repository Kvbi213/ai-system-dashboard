import React from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Badge } from '../../../components/ui/Badge';
import { Clock, MapPin, UserCheck, AlertTriangle } from 'lucide-react';

export interface LessonItem {
  id: string;
  order: number;
  timeRange: string;
  subject: string;
  teacher: string;
  classroom: string;
  isSubstitution?: boolean;
  substitutionNote?: string;
  isCancelled?: boolean;
  hasExam?: boolean;
}

interface LessonCardProps {
  lesson: LessonItem;
}

export const LessonCard: React.FC<LessonCardProps> = ({ lesson }) => {
  return (
    <GlassCard
      className={`p-4 transition-all duration-200 ${
        lesson.isCancelled
          ? 'opacity-60 border-rose-900/50 bg-rose-950/10'
          : lesson.isSubstitution
          ? 'border-amber-500/30 bg-amber-950/10'
          : 'hover:border-slate-700'
      }`}
      glow={lesson.isSubstitution ? 'none' : 'none'}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Lesson Number & Subject */}
        <div className="flex gap-3 items-start">
          <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-mono font-bold text-xs text-sky-400 shrink-0">
            {lesson.order}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                className={`text-sm sm:text-base font-bold tracking-tight ${
                  lesson.isCancelled ? 'line-through text-slate-400' : 'text-slate-100'
                }`}
              >
                {lesson.subject}
              </h3>
              {lesson.isCancelled && <Badge variant="danger">Odwołana</Badge>}
              {lesson.isSubstitution && <Badge variant="warning">Zastępstwo</Badge>}
              {lesson.hasExam && <Badge variant="info">Sprawdzian</Badge>}
            </div>

            {lesson.substitutionNote && (
              <p className="text-xs text-amber-300/90 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {lesson.substitutionNote}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1 font-mono text-sky-300">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                {lesson.timeRange}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                {lesson.classroom}
              </span>
              <span className="flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                {lesson.teacher}
              </span>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};
