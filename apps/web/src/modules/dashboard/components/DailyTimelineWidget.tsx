import React, { useState, useEffect } from 'react';
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

export const DailyTimelineWidget: React.FC = () => {
  const [events, setEvents] = useState<TimelineBlock[]>([]);
  const [filterMode, setFilterMode] = useState<'all' | 'school' | 'private'>('all');

  useEffect(() => {
    const fetchAndMergeSchedules = async () => {
      const now = new Date();
      const day = now.getDay();
      const currentDay = (day >= 1 && day <= 5) ? day : 1;
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      try {
        // 1. Pobierz plan lekcji z API Librusa
        const schoolRes = await schoolApi.getTimetable(currentDay).catch(() => null);
        // 2. Pobierz rutyny/plan prywatny z API
        const privateRes = await privateApi.getRoutines().catch(() => null);

        const schoolBlocks: (TimelineBlock & { startMins: number; endMins: number })[] = [];
        if (schoolRes?.lessons && Array.isArray(schoolRes.lessons)) {
          schoolRes.lessons.forEach((lesson: any, idx: number) => {
            const timeRange = lesson.timeRange || `${lesson.time_start} - ${lesson.time_end}`;
            const parts = timeRange.split('-').map((s: string) => s.trim());
            const [sh, sm] = (parts[0] || '08:00').split(':').map((n: string) => parseInt(n, 10));
            const [eh, em] = (parts[1] || '08:45').split(':').map((n: string) => parseInt(n, 10));
            const startMins = sh * 60 + sm;
            const endMins = eh * 60 + em;

            let status: 'done' | 'current' | 'upcoming' = 'upcoming';
            if (currentMinutes >= endMins) status = 'done';
            else if (currentMinutes >= startMins && currentMinutes < endMins) status = 'current';

            schoolBlocks.push({
              id: `school_${idx}_${lesson.id || idx}`,
              time: timeRange,
              title: lesson.subject,
              category: 'SZKOŁA',
              status,
              room: lesson.classroom || lesson.room,
              sourceType: 'school',
              startMins,
              endMins
            });
          });
        }

        // Prywatne bloki dnia (stały cykl dobowy + nawyki)
        const basePrivateBlocks: (TimelineBlock & { startMins: number; endMins: number })[] = [
          {
            id: 'priv_1',
            time: '06:30 - 07:15',
            title: 'Poranny rozruch stawowy, nawodnienie i plan dnia',
            category: 'PRYWATNE',
            status: currentMinutes >= 435 ? 'done' : (currentMinutes >= 390 ? 'current' : 'upcoming'),
            sourceType: 'private',
            startMins: 390,
            endMins: 435
          },
          {
            id: 'priv_2',
            time: '07:15 - 07:45',
            title: 'Tranzyt, przegląd kamer i monitoring tras drogowych',
            category: 'LOGISTYKA',
            status: currentMinutes >= 465 ? 'done' : (currentMinutes >= 435 ? 'current' : 'upcoming'),
            sourceType: 'private',
            startMins: 435,
            endMins: 465
          },
          {
            id: 'priv_3',
            time: '16:00 - 17:00',
            title: 'Trening siłowy FBW na strychu (Drążek & Dipy)',
            category: 'SPORT',
            status: currentMinutes >= 1020 ? 'done' : (currentMinutes >= 960 ? 'current' : 'upcoming'),
            sourceType: 'private',
            startMins: 960,
            endMins: 1020
          },
          {
            id: 'priv_4',
            time: '19:30 - 20:30',
            title: 'Przegląd finansów 50/30/20 & kognitywny sprint dev',
            category: 'PRYWATNE',
            status: currentMinutes >= 1230 ? 'done' : (currentMinutes >= 1170 ? 'current' : 'upcoming'),
            sourceType: 'private',
            startMins: 1170,
            endMins: 1230
          },
          {
            id: 'priv_5',
            time: '20:00 - 20:30',
            title: 'Ostatni posiłek dnia (3h przed planowanym snem)',
            category: 'PRYWATNE',
            status: currentMinutes >= 1230 ? 'done' : (currentMinutes >= 1200 ? 'current' : 'upcoming'),
            sourceType: 'private',
            startMins: 1200,
            endMins: 1230
          }
        ];

        const routineBlocks: (TimelineBlock & { startMins: number; endMins: number })[] = [];
        if (privateRes?.routines && Array.isArray(privateRes.routines)) {
          privateRes.routines.forEach((rt: any, idx: number) => {
            const isMorning = rt.timeOfDay === 'morning';
            const startMins = isMorning ? 420 + idx * 15 : 1260 + idx * 15;
            const endMins = startMins + 15;
            const sh = String(Math.floor(startMins / 60)).padStart(2, '0');
            const sm = String(startMins % 60).padStart(2, '0');
            const eh = String(Math.floor(endMins / 60)).padStart(2, '0');
            const em = String(endMins % 60).padStart(2, '0');

            routineBlocks.push({
              id: `priv_rt_${rt.id || idx}`,
              time: `${sh}:${sm} - ${eh}:${em}`,
              title: rt.title,
              category: 'PRYWATNE',
              status: rt.completed
                ? 'done'
                : currentMinutes >= endMins
                ? 'done'
                : currentMinutes >= startMins
                ? 'current'
                : 'upcoming',
              sourceType: 'private',
              startMins,
              endMins
            });
          });
        }

        const privateBlocks = routineBlocks.length > 0 ? [...basePrivateBlocks, ...routineBlocks] : basePrivateBlocks;

        // Scalenie i posortowanie chronologiczne
        const merged = [...schoolBlocks, ...privateBlocks].sort((a, b) => a.startMins - b.startMins);
        setEvents(merged);
      } catch (e) {
        console.warn('[!] Nie udało się pobrać harmonogramów osi czasu:', e);
      }
    };

    fetchAndMergeSchedules();
    const interval = setInterval(fetchAndMergeSchedules, 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredEvents = events.filter((e) => {
    if (filterMode === 'all') return true;
    if (filterMode === 'school') return e.sourceType === 'school';
    if (filterMode === 'private') return e.sourceType === 'private';
    return true;
  });

  return (
    <GlassCard className="p-3 sm:p-4" glow="sky">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-sky-100 text-sky-700 border border-sky-200 shadow-sm">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Oś Czasu Dnia (Timeline)</h3>
            <p className="text-xs text-slate-500 font-medium">Zsynchronizowany harmonogram dobowy</p>
          </div>
        </div>

        {/* Filtr Szkolne / Prywatne / Wszystkie */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
              filterMode === 'all'
                ? 'bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-300 shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Wszystkie ({events.length})
          </button>
          <button
            onClick={() => setFilterMode('school')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
              filterMode === 'school'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Szkolne
          </button>
          <button
            onClick={() => setFilterMode('private')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
              filterMode === 'private'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Prywatne
          </button>
        </div>
      </div>

      <div className="space-y-2.5 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800 max-h-[380px] overflow-y-auto pr-1">
        {filteredEvents.map((event) => {
          const isDone = event.status === 'done';
          const isCurrent = event.status === 'current';

          return (
            <div key={event.id} className="relative flex items-start gap-3 pl-1 group">
              {/* Node Indicator */}
              <div className="relative z-10 shrink-0 mt-0.5">
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 bg-white dark:bg-slate-900 rounded-full" />
                ) : isCurrent ? (
                  <div className="relative flex items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-sky-400 opacity-75"></span>
                    <CircleDot className="w-5 h-5 text-sky-600 bg-white dark:bg-slate-900 rounded-full relative" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center" />
                )}
              </div>

              {/* Event Content Box */}
              <div
                className={`flex-1 p-2.5 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-sky-50/90 dark:bg-sky-950/70 border-sky-300 dark:border-sky-500 shadow-sm ring-1 ring-sky-300/60'
                    : isDone
                    ? 'bg-slate-50/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 opacity-75'
                    : 'bg-white/70 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800/80 hover:bg-white dark:hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">{event.time}</span>
                  <div className="flex items-center gap-1.5">
                    {event.room && (
                      <span className="text-[10px] font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                        {event.room}
                      </span>
                    )}
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        isCurrent
                          ? 'bg-sky-600 text-white'
                          : event.sourceType === 'school'
                          ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                          : 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                      }`}
                    >
                      {isCurrent ? 'Trwa teraz' : event.category}
                    </span>
                  </div>
                </div>

                <div className={`text-xs font-bold mt-1 ${isCurrent ? 'text-sky-950 dark:text-sky-200 font-extrabold' : 'text-slate-800 dark:text-slate-100'}`}>
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
