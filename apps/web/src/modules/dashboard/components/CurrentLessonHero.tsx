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

      if (day === 0 || day === 6) {
        // Weekend: załaduj poniedziałek jako kolejny dzień zajęć
        schoolApi.getTimetable(1)
          .then((res) => {
            const first = res?.lessons?.[0];
            if (first) {
              setLessonData({
                status: 'finished',
                subject: `Weekend (Następna: ${first.subject})`,
                timeRange: `Poniedziałek, ${first.timeRange || `${first.time_start} - ${first.time_end}`}`,
                room: first.classroom || first.room || 'Sala lekcyjna',
                teacher: first.cleanTeacher || first.teacher || 'Nauczyciel',
                remainingMinutes: 0,
                substitutionNote: null
              });
            }
          })
          .catch(() => {});
        return;
      }

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
              substitutionNote: active.substitutionNote || (active.isSubstitution ? 'Zastępstwo' : null)
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
              substitutionNote: upcoming.substitutionNote || (upcoming.isSubstitution ? 'Zastępstwo' : null)
            });
            return;
          }

          // 3. Po lekcjach: pobierz pierwszą lekcję z planu na kolejny dzień szkolny
          const nextSchoolDay = (day >= 1 && day <= 4) ? day + 1 : 1;
          const dayNames = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
          const nextDayName = dayNames[nextSchoolDay];

          schoolApi.getTimetable(nextSchoolDay)
            .then((nextRes) => {
              const nextLessons = nextRes?.lessons || [];
              const firstNext = nextLessons[0];
              if (firstNext) {
                setLessonData({
                  status: 'finished',
                  subject: `Koniec zajęć (Następna: ${firstNext.subject})`,
                  timeRange: `${nextDayName}, ${firstNext.timeRange || `${firstNext.time_start} - ${firstNext.time_end}`}`,
                  room: firstNext.classroom || firstNext.room || 'Sala lekcyjna',
                  teacher: firstNext.cleanTeacher || firstNext.teacher || 'Nauczyciel',
                  remainingMinutes: 0,
                  substitutionNote: null
                });
              } else {
                setLessonData({
                  status: 'finished',
                  subject: 'Zajęcia na dziś zakończone',
                  timeRange: nextDayName,
                  room: 'Brak zajęć',
                  teacher: '-',
                  remainingMinutes: 0,
                  substitutionNote: null
                });
              }
            })
            .catch(() => {
              setLessonData({
                status: 'finished',
                subject: 'Zajęcia na dziś zakończone',
                timeRange: 'Jutro',
                room: 'Sala lekcyjna',
                teacher: 'Nauczyciel',
                remainingMinutes: 0,
                substitutionNote: null
              });
            });
        })
        .catch(() => {});
    };

    computeCurrentLesson();
    const interval = setInterval(computeCurrentLesson, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <GlassCard data-testid="current-lesson-hero" className="p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden w-full h-full">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                lessonData.status === 'in_progress'
                  ? 'bg-emerald-500'
                  : lessonData.status === 'finished'
                  ? 'bg-slate-400'
                  : 'bg-sky-500'
              }`}
            />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {lessonData.status === 'in_progress'
                ? 'Trwa lekcja'
                : lessonData.status === 'upcoming'
                ? 'Następna lekcja'
                : 'Zajęcia zakończone'}
            </span>
          </div>
          <NavLink
            to="/school"
            className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium transition focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none rounded"
          >
            <span>Plan zajęć</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>

        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
          {lessonData.subject}
        </h2>

        {lessonData.substitutionNote && (
          <div className="mt-1.5">
            <Badge variant="warning">{lessonData.substitutionNote}</Badge>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-3 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-1.5 font-mono font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{lessonData.timeRange}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-700 dark:text-slate-200">{lessonData.room}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-700 dark:text-slate-200">{lessonData.teacher}</span>
          </div>
        </div>
      </div>

      {/* Progress & Remaining Time Capsule */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        {lessonData.status === 'finished' ? (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-sm text-slate-600 dark:text-slate-300">
              ✓
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Harmonogram</p>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Koniec lekcji na dziś</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-800 dark:text-slate-200 font-mono">
              {lessonData.remainingMinutes}m
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">
                {lessonData.status === 'in_progress' ? 'Do dzwonka pozostało' : 'Czas do rozpoczęcia'}
              </p>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{lessonData.remainingMinutes} minut</p>
            </div>
          </div>
        )}

        <div className="w-28 sm:w-36 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-200 dark:border-slate-700">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              lessonData.status === 'finished'
                ? 'bg-emerald-500 w-full'
                : 'bg-slate-800 dark:bg-slate-200'
            }`}
            style={{
              width:
                lessonData.status === 'finished'
                  ? '100%'
                  : `${Math.min(100, Math.max(10, ((45 - lessonData.remainingMinutes) / 45) * 100))}%`
            }}
          />
        </div>
      </div>
    </GlassCard>
  );
};
