import { dbStore, LessonItem } from '../../db/store.js';
import { pushbulletService } from '../pushbullet/pushbulletService.js';
import {
  ScriptExecutionContext,
  ScriptExecutionResult,
  CurrentLessonInfo
} from './types.js';

const POLISH_DAYS = [
  'Niedziela',
  'Poniedziałek',
  'Wtorek',
  'Środa',
  'Czwartek',
  'Piątek',
  'Sobota'
];

/**
 * Parsuje zakres godzinowy 'HH:MM - HH:MM' na minuty od północy.
 */
export function parseTimeRangeToMinutes(rawRange: string): { startMins: number; endMins: number } | null {
  if (!rawRange) return null;
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

/**
 * Oblicza stan bieżącej lekcji, dzwonka i kolejnej lekcji na podstawie przekazanej daty.
 */
export function calculateLessonInfo(date = new Date()): CurrentLessonInfo {
  const day = date.getDay();
  // Jeśli weekend, dzień domyślny 1 (poniedziałek)
  const currentDay = day >= 1 && day <= 5 ? day : 1;
  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const timetable = dbStore.getTimetable(currentDay);

  if (timetable.length === 0 || day === 0 || day === 6) {
    return {
      currentLesson: null,
      nextLesson: null,
      minutesToBell: 0,
      bellType: 'OUTSIDE_HOURS',
      timeUntilNextEventFormatted: 'Poza godzinami lekcyjnymi (weekend / brak lekcji)'
    };
  }

  // Posortowane lekcje z parsed ranges
  const parsedLessons = timetable
    .map((l) => {
      const parsed = parseTimeRangeToMinutes(l.timeRange);
      return { lesson: l, parsed };
    })
    .filter((item): item is { lesson: LessonItem; parsed: { startMins: number; endMins: number } } => item.parsed !== null)
    .sort((a, b) => a.parsed.startMins - b.parsed.startMins);

  if (parsedLessons.length === 0) {
    return {
      currentLesson: null,
      nextLesson: null,
      minutesToBell: 0,
      bellType: 'OUTSIDE_HOURS',
      timeUntilNextEventFormatted: 'Brak zdefiniowanych godzin lekcyjnych'
    };
  }

  const firstLesson = parsedLessons[0];
  const lastLesson = parsedLessons[parsedLessons.length - 1];

  // Przed pierwszą lekcją
  if (currentMinutes < firstLesson.parsed.startMins) {
    const diff = firstLesson.parsed.startMins - currentMinutes;
    return {
      currentLesson: null,
      nextLesson: firstLesson.lesson,
      minutesToBell: diff,
      bellType: 'BREAK_END',
      timeUntilNextEventFormatted: `${diff} min do pierwszej lekcji (${firstLesson.lesson.subject})`
    };
  }

  // Po ostatniej lekcji
  if (currentMinutes >= lastLesson.parsed.endMins) {
    return {
      currentLesson: null,
      nextLesson: null,
      minutesToBell: 0,
      bellType: 'OUTSIDE_HOURS',
      timeUntilNextEventFormatted: 'Koniec zajęć na dzisiaj'
    };
  }

  // Szukanie w trakcie lekcji lub w trakcie przerwy
  for (let i = 0; i < parsedLessons.length; i++) {
    const cur = parsedLessons[i];
    const next = parsedLessons[i + 1] ? parsedLessons[i + 1] : null;

    // Trwa bieżąca lekcja
    if (currentMinutes >= cur.parsed.startMins && currentMinutes < cur.parsed.endMins) {
      const diff = cur.parsed.endMins - currentMinutes;
      const isConsecutiveSameSubject = Boolean(
        next &&
          cur.lesson.subject.trim().toLowerCase() === next.lesson.subject.trim().toLowerCase()
      );
      const currentLessonLabel = `Lekcja ${cur.lesson.order}. ${cur.lesson.subject} (${cur.lesson.timeRange}${cur.lesson.classroom ? `, s. ${cur.lesson.classroom}` : ''})`;
      const nextLessonLabel = next
        ? `Lekcja ${next.lesson.order}. ${next.lesson.subject} (${next.lesson.timeRange}${next.lesson.classroom ? `, s. ${next.lesson.classroom}` : ''}${isConsecutiveSameSubject ? ' - blok 2' : ''})`
        : null;
      const blockDescription = isConsecutiveSameSubject && next
        ? `Blok dwugodzinny przedmiotu: ${cur.lesson.subject} (lekcja ${cur.lesson.order} i ${next.lesson.order})`
        : undefined;

      return {
        currentLesson: cur.lesson,
        nextLesson: next ? next.lesson : null,
        minutesToBell: diff,
        bellType: 'LESSON_END',
        timeUntilNextEventFormatted: `${diff} min do dzwonka na przerwę`,
        isConsecutiveSameSubject,
        blockDescription,
        currentLessonLabel,
        nextLessonLabel: nextLessonLabel || undefined
      };
    }

    // Trwa przerwa między lekcją i następną
    if (next && currentMinutes >= cur.parsed.endMins && currentMinutes < next.parsed.startMins) {
      const diff = next.parsed.startMins - currentMinutes;
      const isConsecutiveSameSubject = Boolean(
        cur.lesson.subject.trim().toLowerCase() === next.lesson.subject.trim().toLowerCase()
      );
      const nextLessonLabel = `Lekcja ${next.lesson.order}. ${next.lesson.subject} (${next.lesson.timeRange}${next.lesson.classroom ? `, s. ${next.lesson.classroom}` : ''}${isConsecutiveSameSubject ? ' - blok 2' : ''})`;

      return {
        currentLesson: null,
        nextLesson: next.lesson,
        minutesToBell: diff,
        bellType: 'BREAK_END',
        timeUntilNextEventFormatted: `${diff} min przerwy (do lekcji ${next.lesson.subject})`,
        isConsecutiveSameSubject,
        nextLessonLabel
      };
    }
  }

  return {
    currentLesson: null,
    nextLesson: null,
    minutesToBell: 0,
    bellType: 'OUTSIDE_HOURS',
    timeUntilNextEventFormatted: 'Poza godzinami lekcyjnymi'
  };
}

/**
 * Buduje autorytatywny kontekst wykonawczy skryptu.
 */
export function buildScriptContext(now = new Date()): {
  context: ScriptExecutionContext;
  logs: string[];
  notificationsSent: Array<{ title: string; body: string; priority: string }>;
} {
  const logs: string[] = [];
  const notificationsSent: Array<{ title: string; body: string; priority: string }> = [];

  const dayOfWeek = now.getDay();
  const dayName = POLISH_DAYS[dayOfWeek] || 'Dzień';
  const formattedTime = now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const minutesFromMidnight = now.getHours() * 60 + now.getMinutes();

  const context: ScriptExecutionContext = {
    time: {
      now,
      formattedTime,
      dateStr,
      dayOfWeek,
      dayName,
      minutesFromMidnight
    },
    school: {
      getCurrentLesson: () => calculateLessonInfo(now).currentLesson,
      getNextLesson: () => calculateLessonInfo(now).nextLesson,
      getMinutesToBell: () => calculateLessonInfo(now).minutesToBell,
      getLessonInfo: () => calculateLessonInfo(now),
      getTodayLessons: () => dbStore.getTimetable(dayOfWeek >= 1 && dayOfWeek <= 5 ? dayOfWeek : 1),
      getTodayExams: () => {
        const events = dbStore.getEvents();
        return events.filter((e) => e.date === dateStr);
      },
      isSchoolHours: () => {
        const info = calculateLessonInfo(now);
        return info.bellType !== 'OUTSIDE_HOURS';
      }
    },
    pushbullet: {
      send: async (title: string, body: string, priority: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW' = 'NORMAL') => {
        notificationsSent.push({ title, body, priority });
        try {
          return await pushbulletService.sendPush({ title, body, priority });
        } catch (err: any) {
          logs.push(`[!] Błąd wysyłania Pushbullet: ${err.message}`);
          return { success: false, error: err.message, simulated: true };
        }
      }
    },
    tasks: {
      getPending: () => dbStore.getTasks('operator-system-core').filter((t) => !t.completed),
      add: (title: string, priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH') => {
        return dbStore.addTask('operator-system-core', { title, priority, category: 'Automatyzacja' });
      }
    },
    habits: {
      getIncomplete: () => dbStore.getHabits().filter((h) => !h.completedToday),
      getHabits: () => dbStore.getHabits()
    },
    log: (msg: string) => {
      logs.push(`[${now.toLocaleTimeString('pl-PL')}] ${String(msg)}`);
    },
    notify: async (title: string, body: string, priority = 'NORMAL') => {
      return await context.pushbullet.send(title, body, priority);
    }
  };

  return { context, logs, notificationsSent };
}

/**
 * Bezpiecznie uruchamia skrypt JavaScript z wstrzykniętym obiektem ctx.
 */
export async function executeScript(
  code: string,
  customDate?: Date,
  timeoutMs = 4000
): Promise<ScriptExecutionResult> {
  const startTime = Date.now();
  const { context, logs, notificationsSent } = buildScriptContext(customDate);

  try {
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    const userFn = new AsyncFunction('ctx', code);

    const execPromise = userFn(context);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Przekroczono limit czasu wykonania skryptu (${timeoutMs}ms)`)), timeoutMs)
    );

    const result = await Promise.race([execPromise, timeoutPromise]);
    const durationMs = Date.now() - startTime;

    return {
      success: true,
      result,
      logs,
      notificationsSent,
      durationMs
    };
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    const errMsg = err instanceof Error ? err.message : String(err);
    logs.push(`[!] Błąd wykonania skryptu: ${errMsg}`);

    return {
      success: false,
      logs,
      notificationsSent,
      error: errMsg,
      durationMs
    };
  }
}
