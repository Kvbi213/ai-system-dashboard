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
          ? 'opacity-60 border-rose-200 bg-rose-50/40'
          : lesson.isSubstitution
          ? 'border-amber-300 bg-amber-50/40'
          : 'hover:border-slate-300'
      }`}
      glow={lesson.isSubstitution ? 'amber' : 'none'}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Lesson Number & Subject */}
        <div className="flex gap-3 items-start">
          <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-mono font-bold text-xs text-sky-700 shadow-sm shrink-0">
            {lesson.order}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                className={`text-sm sm:text-base font-bold tracking-tight ${
                  lesson.isCancelled ? 'line-through text-slate-400' : 'text-slate-900'
                }`}
              >
                {lesson.subject}
              </h3>
              {lesson.isCancelled && <Badge variant="danger">Odwołana</Badge>}
              {lesson.isSubstitution && <Badge variant="warning">Zastępstwo</Badge>}
              {lesson.hasExam && <Badge variant="info">Sprawdzian</Badge>}
            </div>

            {lesson.substitutionNote && (
              <p className="text-xs text-amber-800 font-semibold mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                {lesson.substitutionNote}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-600">
              <span className="flex items-center gap-1 font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-200/60 shadow-sm">
                <Clock className="w-3.5 h-3.5 text-sky-600" />
                {lesson.timeRange}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium text-slate-700">{lesson.classroom}</span>
              </span>
              <span className="flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium text-slate-700">{lesson.teacher}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};
