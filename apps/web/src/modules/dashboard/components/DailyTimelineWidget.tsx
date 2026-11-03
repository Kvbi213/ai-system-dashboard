import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Calendar, CheckCircle2, CircleDot } from 'lucide-react';
import { schoolApi, privateApi } from '../../../api/client';

export interface TimelineBlock {
  id: string;
  time: string;
  title: string;
  category: 'SZKOŁA' | 'PRYWATNE' | 'SPORT' | 'LOGISTYKA';
  status: 'done' | 'current' | 'upcoming';
  room?: string;
  sourceType: 'school' | 'private';
}

interface LessonItemDTO {
  id?: string;
  timeRange?: string;
  time_start?: string;
  time_end?: string;
  subject?: string;
  classroom?: string;
  room?: string;
}

interface RoutineItemDTO {
  id?: string;
  title?: string;
  timeOfDay?: 'morning' | 'evening';
}

const STATIC_PRIVATE_BLOCKS: {
  id: string;
  time: string;
  title: string;
  category: 'PRYWATNE' | 'SPORT' | 'LOGISTYKA';
  startMins: number;
  endMins: number;
}[] = [
  {
    id: 'priv_1',
    time: '06:30 - 07:15',
    title: 'Poranny rozruch stawowy, nawodnienie i plan dnia',
    category: 'PRYWATNE',
    startMins: 390,
    endMins: 435
  },
  {
    id: 'priv_2',
    time: '07:15 - 07:45',
    title: 'Tranzyt, przegląd kamer i monitoring tras drogowych',
    category: 'LOGISTYKA',
    startMins: 435,
    endMins: 465
  },
  {
    id: 'priv_3',
    time: '16:00 - 17:00',
    title: 'Trening siłowy FBW na strychu (Drążek & Dipy)',
    category: 'SPORT',
    startMins: 960,
    endMins: 1020
  },
  {
    id: 'priv_4',
    time: '19:30 - 20:30',
    title: 'Przegląd finansów 50/30/20 & kognitywny sprint dev',
    category: 'PRYWATNE',
    startMins: 1170,
    endMins: 1230
  },
  {
    id: 'priv_5',
    time: '22:15 - 22:45',
    title: 'Wyciszenie, czytanie dokumentacji i higiena snu',
    category: 'PRYWATNE',
    startMins: 1335,
    endMins: 1365
  }
];

function computeStatus(currentMinutes: number, startMins: number, endMins: number): 'done' | 'current' | 'upcoming' {
  if (currentMinutes >= endMins) return 'done';
  if (currentMinutes >= startMins && currentMinutes < endMins) return 'current';
  return 'upcoming';
}

function parseTimeRange(rawRange: string): { startMins: number; endMins: number } | null {
  const parts = rawRange.split('-').map((s) => s.trim());
  if (parts.length !== 2) return null;
  const [sh, sm] = (parts[0] || '').split(':').map((n) => parseInt(n, 10));
  const [eh, em] = (parts[1] || '').split(':').map((n) => parseInt(n, 10));
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return null;
  return {
    startMins: sh * 60 + sm,
    endMins: eh * 60 + em
  };
}

export const DailyTimelineWidget: React.FC = () => {
  const [events, setEvents] = useState<TimelineBlock[]>([]);
  const [filterMode, setFilterMode] = useState<'all' | 'school' | 'private'>('all');
  const currentEventRef = useRef<HTMLDivElement | null>(null);
  const isRunningRef = useRef(false);

  useEffect(() => {
    if (currentEventRef.current) {
      currentEventRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [events, filterMode]);

  useEffect(() => {
    let isMounted = true;

    const loadSchedules = async () => {
      if (isRunningRef.current) return;
      isRunningRef.current = true;

      const now = new Date();
      const day = now.getDay();
      const isWeekend = day === 0 || day === 6;
      const currentDay = isWeekend ? null : day;
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      try {
        const [schoolRes, privateRes] = await Promise.all([
          currentDay ? schoolApi.getTimetable(currentDay).catch(() => null) : Promise.resolve(null),
          privateApi.getRoutines().catch(() => null)
        ]);

        if (!isMounted) return;

        const schoolBlocks: (TimelineBlock & { startMins: number; endMins: number })[] = [];
        const rawLessons = (schoolRes as { lessons?: LessonItemDTO[] } | null)?.lessons;
        if (Array.isArray(rawLessons)) {
          rawLessons.forEach((lesson, idx) => {
            const timeRange = lesson?.timeRange || `${lesson?.time_start || '08:00'} - ${lesson?.time_end || '08:45'}`;
            const parsed = parseTimeRange(timeRange);
            if (!parsed) return;
            const { startMins, endMins } = parsed;
            const status = computeStatus(currentMinutes, startMins, endMins);

            schoolBlocks.push({
              id: `school_${idx}_${lesson?.id || idx}`,
              time: timeRange,
              title: lesson?.subject || 'Lekcja szkolna',
              category: 'SZKOŁA',
              status,
              room: lesson?.classroom || lesson?.room,
              sourceType: 'school',
              startMins,
              endMins
            });
          });
        }

        const staticPrivateBlocks: (TimelineBlock & { startMins: number; endMins: number })[] = STATIC_PRIVATE_BLOCKS.map((b) => ({
          id: b.id,
          time: b.time,
          title: b.title,
          category: b.category,
          status: computeStatus(currentMinutes, b.startMins, b.endMins),
          sourceType: 'private' as const,
          startMins: b.startMins,
          endMins: b.endMins
        }));

        const routineBlocks: (TimelineBlock & { startMins: number; endMins: number })[] = [];
        const rawRoutines = (privateRes as { routines?: RoutineItemDTO[] } | null)?.routines;
        if (Array.isArray(rawRoutines)) {
          rawRoutines.forEach((r, idx) => {
            const isMorning = r?.timeOfDay === 'morning';
            const startMins = isMorning ? (420 + idx * 15) : (1320 + idx * 15);
            const endMins = startMins + 15;
            const sh = Math.floor(startMins / 60).toString().padStart(2, '0');
            const sm = (startMins % 60).toString().padStart(2, '0');
            const eh = Math.floor(endMins / 60).toString().padStart(2, '0');
            const em = (endMins % 60).toString().padStart(2, '0');
            const status = computeStatus(currentMinutes, startMins, endMins);

            routineBlocks.push({
              id: `routine_${r?.id || idx}`,
              time: `${sh}:${sm} - ${eh}:${em}`,
              title: r?.title || 'Rutyna prywatna',
              category: 'PRYWATNE',
              status,
              sourceType: 'private' as const,
              startMins,
              endMins
            });
          });
        }

        const merged = [...schoolBlocks, ...staticPrivateBlocks, ...routineBlocks].sort(
          (a, b) => a.startMins - b.startMins
        );

        if (isMounted) {
          setEvents(merged);
        }
      } catch (e) {
        if (isMounted) {
          console.warn('[!] Nie udało się pobrać harmonogramów osi czasu:', e);
        }
      } finally {
        isRunningRef.current = false;
      }
    };

    loadSchedules();
    const interval = setInterval(loadSchedules, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (filterMode === 'all') return true;
      if (filterMode === 'school') return e.sourceType === 'school';
      if (filterMode === 'private') return e.sourceType === 'private';
      return true;
    });
  }, [events, filterMode]);

  return (
    <GlassCard className="p-3 sm:p-4" glow="sky">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 shadow-sm">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Oś Czasu Dnia (Timeline)</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Zsynchronizowany harmonogram dobowy</p>
          </div>
        </div>

        {/* Filtr Szkolne / Prywatne / Wszystkie */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
              filterMode === 'all'
                ? 'bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-300 shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Wszystkie ({events.length})
          </button>
          <button
            onClick={() => setFilterMode('school')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
              filterMode === 'school'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Szkolne
          </button>
          <button
            onClick={() => setFilterMode('private')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
              filterMode === 'private'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Prywatne
          </button>
        </div>
      </div>

      <div className="space-y-2.5 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-300 dark:before:bg-slate-700 max-h-[380px] overflow-y-auto pr-1">
        {filteredEvents.map((event) => {
          const isDone = event.status === 'done';
          const isCurrent = event.status === 'current';

          return (
            <div
              key={event.id}
              ref={isCurrent ? currentEventRef : undefined}
              className="relative flex items-start gap-3 pl-1 group"
            >
              {/* Node Indicator */}
              <div className="relative z-10 shrink-0 mt-0.5">
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 bg-white dark:bg-slate-900 rounded-full" />
                ) : isCurrent ? (
                  <div className="relative flex items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-sky-400 opacity-75"></span>
                    <CircleDot className="w-5 h-5 text-sky-500 bg-white dark:bg-slate-900 rounded-full relative" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center" />
                )}
              </div>

              {/* Event Content Box with high contrast */}
              <div
                className={`flex-1 p-2.5 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-sky-50 dark:bg-sky-950/80 border-sky-300 dark:border-sky-500 shadow-sm ring-1 ring-sky-300/60'
                    : isDone
                    ? 'bg-slate-50 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850'
                    : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-200">
                    {event.time}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {event.room && (
                      <span className="text-[10px] font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold">
                        {event.room}
                      </span>
                    )}
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        isCurrent
                          ? 'bg-sky-600 text-white'
                          : event.sourceType === 'school'
                          ? 'bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-200 border border-sky-300 dark:border-sky-700'
                          : 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700'
                      }`}
                    >
                      {isCurrent ? 'Trwa teraz' : event.category}
                    </span>
                  </div>
                </div>

                <div className={`text-xs font-bold mt-1 ${isCurrent ? 'text-sky-950 dark:text-sky-100 font-extrabold' : 'text-slate-900 dark:text-white'}`}>
                  {event.title}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
};
