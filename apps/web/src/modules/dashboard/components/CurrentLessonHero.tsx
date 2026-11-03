import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Badge } from '../../../components/ui/Badge';
import { Clock, MapPin, UserCheck, ArrowUpRight } from 'lucide-react';
import { schoolApi } from '../../../api/client';

interface CurrentLessonHeroProps {
  status?: 'in_progress' | 'upcoming' | 'finished';
  subject?: string;
  timeRange?: string;
  room?: string;
  teacher?: string;
  remainingMinutes?: number;
  substitutionNote?: string | null;
}

export const CurrentLessonHero: React.FC<CurrentLessonHeroProps> = (props) => {
  const [lessonData, setLessonData] = useState<{
    status: 'in_progress' | 'upcoming' | 'finished';
    subject: string;
    timeRange: string;
    room: string;
    teacher: string;
    remainingMinutes: number;
    substitutionNote: string | null;
  }>({
    status: props.status || 'in_progress',
    subject: props.subject || 'Projektowanie Oprogramowania',
    timeRange: props.timeRange || '10:45 - 11:30',
    room: props.room || 'Pracownia A-204',
    teacher: props.teacher || 'Wykładowca prowadzący',
    remainingMinutes: props.remainingMinutes || 24,
    substitutionNote: props.substitutionNote || null
  });

  useEffect(() => {
    const computeCurrentLesson = () => {
      const now = new Date();
      const day = now.getDay(); // 0 = Sun, 1 = Mon, ..., 5 = Fri
      const currentDay = (day >= 1 && day <= 5) ? day : 1;
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      schoolApi.getTimetable(currentDay)
        .then((res) => {
          if (!res?.lessons || res.lessons.length === 0) return;

          const parsed = res.lessons.map((l) => {
            const range = l.timeRange || `${l.time_start} - ${l.time_end}`;
            const parts = range.split('-').map((s: string) => s.trim());
            const [sh, sm] = (parts[0] || '08:00').split(':').map((n: string) => parseInt(n, 10));
            const [eh, em] = (parts[1] || '08:45').split(':').map((n: string) => parseInt(n, 10));
            const startMins = sh * 60 + sm;
            const endMins = eh * 60 + em;

            return {
              ...l,
              timeRange: range,
              startMins,
              endMins
            };
          });

          // 1. Sprawdź czy trwa lekcja
          const active = parsed.find((l) => currentMinutes >= l.startMins && currentMinutes < l.endMins);
          if (active) {
            setLessonData({
              status: 'in_progress',
              subject: active.subject,
              timeRange: active.timeRange,
              room: active.classroom || active.room || 'Sala lekcyjna',
              teacher: active.cleanTeacher || active.teacher || 'Nauczyciel',
              remainingMinutes: Math.max(1, active.endMins - currentMinutes),
              substitutionNote: active.isSubstitution ? 'Zastępstwo' : null
            });
            return;
          }

          // 2. Jeśli nie, znajdź najbliższą nadchodzącą lekcję dzisiaj
          const upcoming = parsed.find((l) => currentMinutes < l.startMins);
          if (upcoming) {
            setLessonData({
              status: 'upcoming',
              subject: upcoming.subject,
              timeRange: upcoming.timeRange,
              room: upcoming.classroom || upcoming.room || 'Sala lekcyjna',
              teacher: upcoming.cleanTeacher || upcoming.teacher || 'Nauczyciel',
              remainingMinutes: Math.max(1, upcoming.startMins - currentMinutes),
              substitutionNote: upcoming.isSubstitution ? 'Zastępstwo' : null
            });
            return;
          }

          // 3. Po lekcjach: weź pierwszą lekcję z planu na kolejny dzień / pierwszą lekcję
          const first = parsed[0];
          if (first) {
            setLessonData({
              status: 'finished',
              subject: first.subject,
              timeRange: first.timeRange,
              room: first.classroom || first.room || 'Sala lekcyjna',
              teacher: first.cleanTeacher || first.teacher || 'Nauczyciel',
              remainingMinutes: 45,
              substitutionNote: null
            });
          }
        })
        .catch(() => {});
    };

    computeCurrentLesson();
    const interval = setInterval(computeCurrentLesson, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <GlassCard data-testid="current-lesson-hero" className="p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden w-full h-full" glow="sky">
      {/* Decorative backdrop light */}
      <div className="absolute -top-16 -right-16 w-44 h-44 bg-sky-200/40 rounded-full blur-2xl pointer-events-none" />

      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                lessonData.status === 'in_progress' ? 'bg-emerald-500 animate-pulse' : 'bg-sky-500'
              }`}
            />
            <span className="text-xs font-bold uppercase tracking-wider text-sky-700">
              {lessonData.status === 'in_progress'
                ? 'Trwa blok zajęć (Librus)'
                : lessonData.status === 'upcoming'
                ? 'Następna lekcja z planu'
                : 'Zajęcia zakończone'}
            </span>
          </div>
          <NavLink
            to="/school"
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-sky-700 font-semibold transition"
          >
            <span>Plan</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>

        <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-snug">
          {lessonData.subject}
        </h2>

        {lessonData.substitutionNote && (
          <div className="mt-1.5">
            <Badge variant="warning">{lessonData.substitutionNote}</Badge>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-3 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-200/60 shadow-sm">
            <Clock className="w-3.5 h-3.5 text-sky-600" />
            <span>{lessonData.timeRange}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-700">{lessonData.room}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-700">{lessonData.teacher}</span>
          </div>
        </div>
      </div>

      {/* Progress & Remaining Time Capsule */}
      <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center font-bold text-xs text-sky-700 font-mono shadow-sm">
            {lessonData.remainingMinutes}m
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium">
              {lessonData.status === 'in_progress' ? 'Do dzwonka pozostało' : 'Czas do rozpoczęcia'}
            </p>
            <p className="text-xs font-bold text-slate-800">{lessonData.remainingMinutes} minut</p>
          </div>
        </div>

        <div className="w-28 sm:w-36 bg-slate-200/80 rounded-full h-2 overflow-hidden border border-white">
          <div
            className="bg-gradient-to-r from-sky-500 to-indigo-600 h-full rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${Math.min(100, Math.max(10, ((45 - lessonData.remainingMinutes) / 45) * 100))}%` }}
          />
        </div>
      </div>
    </GlassCard>
  );
};
