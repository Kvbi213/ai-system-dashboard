import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Calendar, CheckCircle2 } from 'lucide-react';
import { schoolApi, calendarApi } from '../../../api/client';

export interface TimelineBlock {
  id: string;
  time: string;
  title: string;
  category: 'SZKOŁA' | 'PRYWATNE' | 'SPORT' | 'LOGISTYKA' | 'SPRAWDZIAN' | 'KARTKÓWKA';
  status: 'done' | 'current' | 'upcoming';
  room?: string;
  isSubstitution?: boolean;
  isCancelled?: boolean;
  substitutionNote?: string;
  sourceType: 'school' | 'private' | 'exam';
  startMins: number;
  endMins: number;
}

interface LessonItemDTO {
  id?: string;
  timeRange?: string;
  time_start?: string;
  time_end?: string;
  subject?: string;
  classroom?: string;
  room?: string;
  isSubstitution?: boolean;
  isCancelled?: boolean;
  substitutionNote?: string;
  flag?: string;
}

const POLISH_DAYS = [
  'Niedziela',
  'Poniedziałek',
  'Wtorek',
  'Środa',
  'Czwartek',
  'Piątek',
  'Sobota'
];

const POLISH_MONTHS = [
  'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
  'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'
];

/**
 * Autentyczne stałe bloki kotwiczące dnia (bez zaśmiecania mikro-nawykami).
 * Wszystkie nawyki, woda, rozruch i rutyny dobowe są scentralizowane w Strefie Prywatnej (/private).
 */
const DAILY_ANCHOR_BLOCKS = [
  {
    id: 'anchor_workout',
    time: '16:00 - 17:00',
    title: 'Trening siłowy FBW na strychu (Drążek & Dipy)',
    category: 'SPORT' as const,
    startMins: 960,
    endMins: 1020,
    sourceType: 'private' as const
  },
  {
    id: 'anchor_dev',
    time: '19:30 - 20:30',
    title: 'Przegląd projektów & kognitywny sprint dev',
    category: 'PRYWATNE' as const,
    startMins: 1170,
    endMins: 1230,
    sourceType: 'private' as const
  }
];

const WEEKDAY_FALLBACK_LESSONS: Record<number, { timeRange: string; subject: string; room: string }[]> = {
  1: [
    { timeRange: '08:00 - 08:45', subject: 'Informatyka', room: 's. 1.20' },
    { timeRange: '08:50 - 09:35', subject: 'Informatyka', room: 's. 1.20' },
    { timeRange: '09:40 - 10:25', subject: 'Biznes i zarządzanie', room: 's. 06' },
    { timeRange: '10:40 - 11:25', subject: 'Lokalne sieci komputerowe', room: 's. 1.16' },
    { timeRange: '11:30 - 12:15', subject: 'Historia', room: 's. 13' },
    { timeRange: '12:20 - 13:05', subject: 'Język polski', room: 's. 17' },
    { timeRange: '13:15 - 14:00', subject: 'Język angielski', room: 's. 22' }
  ],
  2: [
    { timeRange: '08:00 - 08:45', subject: 'Pracownia urządzeń techniki komputerowej', room: 's. 1.18' },
    { timeRange: '08:50 - 09:35', subject: 'Pracownia urządzeń techniki komputerowej', room: 's. 1.18' },
    { timeRange: '09:40 - 10:25', subject: 'Zajęcia z wychowawcą', room: 's. 22' },
    { timeRange: '10:40 - 11:25', subject: 'Wychowanie fizyczne', room: 'SG 2' },
    { timeRange: '11:30 - 12:15', subject: 'Wychowanie fizyczne', room: 'SG 2' },
    { timeRange: '12:20 - 13:05', subject: 'Język niemiecki', room: 's. 20' },
    { timeRange: '13:15 - 14:00', subject: 'Chemia', room: 's. 11' }
  ],
  3: [
    { timeRange: '08:00 - 08:45', subject: 'Biologia', room: 's. 06' },
    { timeRange: '08:50 - 09:35', subject: 'Biologia', room: 's. 06' },
    { timeRange: '09:40 - 10:25', subject: 'Systemy operacyjne', room: 's. 1.2' },
    { timeRange: '10:40 - 11:25', subject: 'Systemy operacyjne', room: 's. 1.2' },
    { timeRange: '11:30 - 12:15', subject: 'Język polski', room: 's. 17' },
    { timeRange: '12:20 - 13:05', subject: 'Język polski', room: 's. 17' },
    { timeRange: '13:15 - 14:00', subject: 'Historia', room: 's. 13' }
  ],
  4: [
    { timeRange: '08:50 - 09:35', subject: 'Język angielski', room: 's. 22' },
    { timeRange: '09:40 - 10:25', subject: 'Język angielski', room: 's. 22' },
    { timeRange: '10:40 - 11:25', subject: 'Pracownia lokalnych sieci komputerowych', room: 's. 1.16' },
    { timeRange: '11:30 - 12:15', subject: 'Pracownia lokalnych sieci komputerowych', room: 's. 1.16' },
    { timeRange: '12:20 - 13:05', subject: 'Matematyka', room: 's. 05' },
    { timeRange: '13:15 - 14:00', subject: 'Matematyka', room: 's. 05' },
    { timeRange: '14:05 - 14:50', subject: 'Język angielski zawodowy', room: 's. 22' }
  ],
  5: [
    { timeRange: '08:00 - 08:45', subject: 'Edukacja obywatelska', room: 's. 03' },
    { timeRange: '08:50 - 09:35', subject: 'Wychowanie fizyczne', room: 'SG 1' },
    { timeRange: '09:40 - 10:25', subject: 'Język niemiecki', room: 's. 20' },
    { timeRange: '10:40 - 11:25', subject: 'Matematyka', room: 's. 05' },
    { timeRange: '11:30 - 12:15', subject: 'Religia', room: 's. 08' },
    { timeRange: '12:20 - 13:05', subject: 'Urządzenia techniki komputerowej', room: 's. 1.18' }
  ]
};

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

function getTodayDateKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

const getTimelineCacheKey = () => `omnidash_timeline_v5_${getTodayDateKey()}`;

function getInitialTimeline(): TimelineBlock[] {
  if (typeof window === 'undefined') return [];
  try {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    try {
      if (localStorage.getItem('omnidash_timeline_cache_v4')) {
        localStorage.removeItem('omnidash_timeline_cache_v4');
      }
    } catch {
      // Ignoruj błędy dostępu do storage
    }
    const raw = localStorage.getItem(getTimelineCacheKey());

    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((b: any) => {
          const p = parseTimeRange(b.time);
          const startMins = p ? p.startMins : b.startMins || 0;
          const endMins = p ? p.endMins : b.endMins || 0;
          return {
            ...b,
            startMins,
            endMins,
            status: p ? computeStatus(currentMinutes, startMins, endMins) : b.status
          };
        });
      }
    }

    // Natychmiastowy deterministyczny fallback dla bieżącego dnia tygodnia
    const day = now.getDay();
    const fallbackLessons = (day >= 1 && day <= 5) ? WEEKDAY_FALLBACK_LESSONS[day] || [] : [];
    const schoolBlocks: TimelineBlock[] = fallbackLessons.map((l, idx) => {
      const p = parseTimeRange(l.timeRange) || { startMins: 480 + idx * 50, endMins: 525 + idx * 50 };
      return {
        id: `fb_school_${day}_${idx}`,
        time: l.timeRange,
        title: l.subject,
        category: 'SZKOŁA',
        room: l.room,
        status: computeStatus(currentMinutes, p.startMins, p.endMins),
        sourceType: 'school',
        startMins: p.startMins,
        endMins: p.endMins
      };
    });

    const anchorBlocks: TimelineBlock[] = DAILY_ANCHOR_BLOCKS.map((b) => ({
      id: b.id,
      time: b.time,
      title: b.title,
      category: b.category,
      status: computeStatus(currentMinutes, b.startMins, b.endMins),
      sourceType: 'private',
      startMins: b.startMins,
      endMins: b.endMins
    }));

    return [...schoolBlocks, ...anchorBlocks].sort((a, b) => a.startMins - b.startMins);
  } catch {
    return [];
  }
}

export const DailyTimelineWidget: React.FC = () => {
  const [events, setEvents] = useState<TimelineBlock[]>(getInitialTimeline);
  const [filterMode, setFilterMode] = useState<'all' | 'now' | 'school' | 'private'>('all');
  const currentEventRef = useRef<HTMLDivElement | null>(null);
  const firstActiveRef = useRef<HTMLDivElement | null>(null);
  const timelineContainerRef = useRef<HTMLDivElement | null>(null);
  const isRunningRef = useRef(false);

  const now = new Date();
  const dayName = POLISH_DAYS[now.getDay()] || 'Dzień';
  const monthName = POLISH_MONTHS[now.getMonth()] || '';
  const dateFormatted = `${dayName}, ${now.getDate()} ${monthName} ${now.getFullYear()}`;

  const scrollToNow = () => {
    if (timelineContainerRef.current) {
      const target = currentEventRef.current || firstActiveRef.current;
      if (target) {
        const container = timelineContainerRef.current;
        const targetOffset = target.offsetTop - container.offsetTop - 12;
        container.scrollTo({ top: Math.max(0, targetOffset), behavior: 'smooth' });
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToNow();
    }, 150);
    return () => clearTimeout(timer);
  }, [events, filterMode]);

  useEffect(() => {
    let isMounted = true;

    const loadSchedules = async () => {
      if (isRunningRef.current) return;
      isRunningRef.current = true;

      const nowDate = new Date();
      const day = nowDate.getDay();
      const isWeekend = day === 0 || day === 6;
      const currentDay = isWeekend ? 1 : day;
      const currentMinutes = nowDate.getHours() * 60 + nowDate.getMinutes();
      const todayISO = getTodayDateKey();

      try {
        const [schoolRes, calRes] = await Promise.all([
          schoolApi.getTimetable(currentDay).catch(() => null),
          calendarApi.getEvents().catch(() => null)
        ]);

        if (!isMounted) return;

        const schoolBlocks: TimelineBlock[] = [];
        const rawLessons = (schoolRes as { lessons?: LessonItemDTO[] } | null)?.lessons;

        if (Array.isArray(rawLessons) && rawLessons.length > 0) {
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
              isSubstitution: Boolean(lesson?.isSubstitution),
              isCancelled: Boolean(lesson?.isCancelled),
              substitutionNote: lesson?.substitutionNote,
              sourceType: 'school',
              startMins,
              endMins
            });
          });
        } else if (!isWeekend && WEEKDAY_FALLBACK_LESSONS[currentDay]) {
          // Fallback na autorytatywną strukturę dnia tygodnia
          WEEKDAY_FALLBACK_LESSONS[currentDay].forEach((l, idx) => {
            const parsed = parseTimeRange(l.timeRange) || { startMins: 480 + idx * 50, endMins: 525 + idx * 50 };
            schoolBlocks.push({
              id: `fb_school_${currentDay}_${idx}`,
              time: l.timeRange,
              title: l.subject,
              category: 'SZKOŁA',
              room: l.room,
              status: computeStatus(currentMinutes, parsed.startMins, parsed.endMins),
              sourceType: 'school',
              startMins: parsed.startMins,
              endMins: parsed.endMins
            });
          });
        }

        // Wydarzenia sprawdzianów i kartkówek na dzisiejszy dzień z kalendarza
        const todayExamBlocks: TimelineBlock[] = [];
        const rawEvents = (calRes as { events?: any[] } | null)?.events;
        if (Array.isArray(rawEvents)) {
          rawEvents.forEach((ev, idx) => {
            if (ev.date === todayISO) {
              const catType = ev.type === 'sprawdzian' ? 'SPRAWDZIAN' : ev.type === 'kartkowka' ? 'KARTKÓWKA' : 'SZKOŁA';
              todayExamBlocks.push({
                id: `today_exam_${ev.id || idx}`,
                time: ev.time || 'W ciągu dnia',
                title: `${ev.type === 'sprawdzian' ? 'Sprawdzian' : ev.type === 'kartkowka' ? 'Kartkówka' : 'Wydarzenie'}: ${ev.title}`,
                category: catType,
                status: 'current',
                room: ev.subject,
                sourceType: 'exam',
                startMins: 480,
                endMins: 900
              });
            }
          });
        }

        const anchorBlocks: TimelineBlock[] = DAILY_ANCHOR_BLOCKS.map((b) => ({
          id: b.id,
          time: b.time,
          title: b.title,
          category: b.category,
          status: computeStatus(currentMinutes, b.startMins, b.endMins),
          sourceType: 'private',
          startMins: b.startMins,
          endMins: b.endMins
        }));

        const merged = [...todayExamBlocks, ...schoolBlocks, ...anchorBlocks].sort(
          (a, b) => a.startMins - b.startMins
        );

        if (isMounted) {
          setEvents(merged);
          try {
            // Czyść stare klucze z poprzednich dni
            for (let i = localStorage.length - 1; i >= 0; i--) {
              const k = localStorage.key(i);
              if (k && k.startsWith('omnidash_timeline_') && k !== getTimelineCacheKey()) {
                localStorage.removeItem(k);
              }
            }
            localStorage.setItem(getTimelineCacheKey(), JSON.stringify(merged));
          } catch {
            // Ignoruj błędy zapisu cache w przeglądarce
          }
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
      if (filterMode === 'now') return e.status === 'current' || e.status === 'upcoming';
      if (filterMode === 'school') return e.sourceType === 'school' || e.sourceType === 'exam';
      if (filterMode === 'private') return e.sourceType === 'private';
      return true;
    });
  }, [events, filterMode]);

  return (
    <GlassCard className="p-4 sm:p-5" glow="none" data-testid="timeline-widget">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Plan dnia</h3>
              <span className="px-2 py-0.5 rounded-md text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                {dateFormatted}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">Harmonogram lekcji i stałych zajęć</p>
          </div>
        </div>

        {/* Filtr Szkolne / Prywatne / Od teraz / Wszystkie + Skocz do teraz */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={scrollToNow}
            title="Przewiń do bieżącego lub nadchodzącego bloku"
            className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            Skocz do teraz
          </button>

          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                filterMode === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Wszystkie ({events.length})
            </button>
            <button
              onClick={() => setFilterMode('now')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                filterMode === 'now'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Od teraz ({events.filter((e) => e.status !== 'done').length})
            </button>
            <button
              onClick={() => setFilterMode('school')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                filterMode === 'school'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Szkolne
            </button>
            <button
              onClick={() => setFilterMode('private')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                filterMode === 'private'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Prywatne
            </button>
          </div>
        </div>
      </div>

      <div
        ref={timelineContainerRef}
        className="space-y-2.5 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800 max-h-[380px] overflow-y-auto pr-1"
      >
        {filteredEvents.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 italic">
            Brak zaplanowanych bloków na dzisiejszy dzień.
          </div>
        ) : (
          filteredEvents.map((event) => {
            const isDone = event.status === 'done';
            const isCurrent = event.status === 'current';

            return (
              <div
                key={event.id}
                ref={isCurrent ? currentEventRef : (event.status === 'upcoming' && !currentEventRef.current ? firstActiveRef : undefined)}
                className="relative flex items-start gap-3 pl-1 group"
              >
                {/* Node Indicator */}
                <div className="relative z-10 shrink-0 mt-0.5">
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900 rounded-full" />
                  ) : isCurrent ? (
                    <div className="relative flex items-center justify-center">
                      <div className="w-5 h-5 rounded-full bg-sky-50 dark:bg-sky-950 border-2 border-sky-600 dark:border-sky-400 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-sky-600 dark:bg-sky-400" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center" />
                  )}
                </div>

                {/* Event Content Box with high contrast */}
                <div
                  className={`flex-1 p-2.5 rounded-lg border transition-all ${
                    isCurrent
                      ? 'bg-sky-50/70 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800'
                      : isDone
                      ? 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800/80 hover:bg-slate-100/70 dark:hover:bg-slate-850'
                      : 'bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300">
                      {event.time}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {event.room && (
                        <span className="text-[11px] font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">
                          {event.room}
                        </span>
                      )}
                      {event.isCancelled && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          Odwołana
                        </span>
                      )}
                      {event.isSubstitution && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          Zastępstwo
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                          isCurrent
                            ? 'bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-200 border border-sky-300 dark:border-sky-700'
                            : event.category === 'SPRAWDZIAN'
                            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            : event.category === 'KARTKÓWKA'
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : event.sourceType === 'school'
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {isCurrent ? 'Trwa teraz' : event.category.toLowerCase()}
                      </span>
                    </div>
                  </div>

                  <div className={`text-xs mt-1 font-semibold ${event.isCancelled ? 'line-through text-slate-400 dark:text-slate-500' : isCurrent ? 'text-sky-950 dark:text-sky-100' : 'text-slate-900 dark:text-slate-100'}`}>
                    {event.title}
                  </div>

                  {event.substitutionNote && (
                    <div className="text-[11px] text-amber-700 dark:text-amber-400 font-normal mt-0.5">
                      {event.substitutionNote}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </GlassCard>
  );
};
