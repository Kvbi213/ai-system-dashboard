import { LessonItem, SchoolEvent } from '../../db/types.js';

export const TEACHER_INITIALS_MAP: Record<string, string> = {
  AN: 'Negowska Alicja',
  NA: 'Negowska Alicja',
  PW: 'Wojnarowski Przemysław',
  WP: 'Wojnarowski Przemysław',
  KP: 'Kolasińska Paulina',
  PK: 'Kolasińska Paulina',
  AC: 'Czarna Alicja',
  CA: 'Czarna Alicja',
  GŁ: 'Łysakowski Grzegorz',
  ŁG: 'Łysakowski Grzegorz',
  GL: 'Łysakowski Grzegorz',
  LG: 'Łysakowski Grzegorz',
  ZJ: 'Ziemba Joanna',
  JZ: 'Ziemba Joanna',
  ZB: 'Bahr Zbigniew',
  BZ: 'Bahr Zbigniew',
  KŁ: 'Kryła Łukasz',
  ŁK: 'Kryła Łukasz',
  BG: 'Gembiak Bartosz',
  GB: 'Gembiak Bartosz',
  WW: 'Wardyn Wojciech',
  PS: 'Sokół Paweł',
  SP: 'Sokół Paweł',
  JŁ: 'Łukaszczyk-Wulgaris Joanna',
  ŁJ: 'Łukaszczyk-Wulgaris Joanna',
  JL: 'Łukaszczyk-Wulgaris Joanna',
  LJ: 'Łukaszczyk-Wulgaris Joanna',
  SR: 'Reszka Sławomir',
  RS: 'Reszka Sławomir',
  AB: 'Becker Adam',
  BA: 'Becker Adam',
  MS: 'Spych Monika',
  SM: 'Spych Monika',
  BC: 'Chyła Beata',
  CB: 'Chyła Beata'
};

export const COMMON_FIRST_NAMES = new Set([
  'adam', 'alicja', 'andrzej', 'anna', 'bartosz', 'beata', 'grzegorz', 'jan',
  'joanna', 'krzysztof', 'łukasz', 'maciej', 'monika', 'paulina', 'paweł',
  'piotr', 'przemysław', 'sławomir', 'wojciech', 'zbigniew'
]);

export const DAY_NAME_TO_NUMBER: Record<string, number> = {
  monday: 1,
  poniedziałek: 1,
  mon: 1,
  tuesday: 2,
  wtorek: 2,
  tue: 2,
  wednesday: 3,
  środa: 3,
  sroda: 3,
  wed: 3,
  thursday: 4,
  czwartek: 4,
  thu: 4,
  friday: 5,
  piątek: 5,
  piatek: 5,
  fri: 5
};

const STANDARD_TIME_SLOTS: Array<{ start: string; end: string; order: number }> = [
  { start: '07:10', end: '07:55', order: 0 },
  { start: '08:00', end: '08:45', order: 1 },
  { start: '08:50', end: '09:35', order: 2 },
  { start: '09:40', end: '10:25', order: 3 },
  { start: '10:40', end: '11:25', order: 4 },
  { start: '11:30', end: '12:15', order: 5 },
  { start: '12:20', end: '13:05', order: 6 },
  { start: '13:15', end: '14:00', order: 7 },
  { start: '14:05', end: '14:50', order: 8 },
  { start: '14:55', end: '15:40', order: 9 },
  { start: '15:45', end: '16:30', order: 10 }
];

export function capitalize(str: string): string {
  if (!str) return '';
  const trimmed = str.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/**
 * Czyści surowy ciąg nauczyciela z dopisków grup, klas, sal i stopni naukowych.
 */
export function cleanTeacherName(rawTeacher?: string | null): string {
  if (!rawTeacher || typeof rawTeacher !== 'string') return '';
  const cleaned = rawTeacher
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s*-\s*gr\s*\d+/gi, '')
    .replace(/\s*gr\s*\.?\s*\d+/gi, '')
    .replace(/(?:^|\s)(?:mgr|inż|dr|prof|hab|p)\.?(?=\s|$)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  const upper = cleaned.toUpperCase();
  if (TEACHER_INITIALS_MAP[upper]) {
    return TEACHER_INITIALS_MAP[upper];
  }
  return cleaned;
}

/**
 * Sprawdza czy dwie reprezentacje nauczyciela odnoszą się do tej samej osoby.
 */
export function matchTeacherNames(teacherA?: string | null, teacherB?: string | null): boolean {
  const cleanA = cleanTeacherName(teacherA).toLowerCase();
  const cleanB = cleanTeacherName(teacherB).toLowerCase();
  if (!cleanA || !cleanB) return false;
  if (cleanA === cleanB) return true;

  const wordsA = cleanA.split(/[\s,.-]+/).filter((w) => w.length >= 2);
  const wordsB = cleanB.split(/[\s,.-]+/).filter((w) => w.length >= 2);
  if (wordsA.length === 0 || wordsB.length === 0) return false;

  const commonWords = wordsA.filter((w) => wordsB.includes(w));
  if (wordsA.length >= 2 && wordsB.length >= 2) {
    return commonWords.length >= 2;
  }

  if (commonWords.length >= 1) {
    const matchedWord = commonWords[0];
    if (COMMON_FIRST_NAMES.has(matchedWord)) {
      return false;
    }
    return matchedWord.length >= 4;
  }

  return false;
}

/**
 * Sprawdza czy przedział czasu nakłada się na inny.
 */
export function checkTimeOverlap(lessonRange: string, eventRange?: string): boolean {
  if (!eventRange || !lessonRange) return true; // Domyślnie brak zakresu oznacza cały dzień
  const cleanL = lessonRange.replace(/\u00a0/g, ' ').trim();
  const cleanE = eventRange.replace(/\u00a0/g, ' ').trim();

  const parseMins = (rangeStr: string) => {
    const parts = rangeStr.split('-').map((s) => s.trim());
    if (parts.length < 2) return null;
    const [sh, sm] = (parts[0] || '').split(':').map((n) => parseInt(n, 10));
    const [eh, em] = (parts[1] || '').split(':').map((n) => parseInt(n, 10));
    if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return null;
    return { start: sh * 60 + sm, end: eh * 60 + em };
  };

  const lMins = parseMins(cleanL);
  const eMins = parseMins(cleanE);
  if (!lMins || !eMins) return true;

  return Math.max(lMins.start, eMins.start) < Math.min(lMins.end, eMins.end);
}

/**
 * Ustala numer lekcji (order) na podstawie przedziału czasowego.
 */
export function inferLessonOrder(timeRange: string, fallbackIndex: number): number {
  const cleanRange = timeRange.replace(/\u00a0/g, ' ').trim();
  const slot = STANDARD_TIME_SLOTS.find((s) => cleanRange.includes(s.start));
  if (slot) return slot.order;
  return fallbackIndex + 1;
}

/**
 * Formatuje numer sali do estetycznej postaci 's. XX'.
 */
export function formatClassroom(rawRoom?: string | null): string {
  if (!rawRoom) return '';
  const trimmed = rawRoom.trim();
  if (!trimmed) return '';
  if (trimmed.toLowerCase().startsWith('s.') || trimmed.toLowerCase().startsWith('sala')) {
    return trimmed;
  }
  return `s. ${trimmed}`;
}

/**
 * Parsuje autorytatywne dane planu lekcji Librus Synergia i koreluje z nieobecnościami nauczycieli.
 */
export function parseLibrusTimetable(
  timetableData: any,
  calendarEvents: SchoolEvent[] = []
): Record<number, LessonItem[]> {
  const result: Record<number, LessonItem[]> = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: []
  };

  if (!timetableData) return result;

  // Filtracja zdarzeń absencji nauczycieli
  const teacherAbsences = calendarEvents.filter(
    (e) => (e.type === 'absence' || /nieobecn/i.test(e.category || '') || /zastęp/i.test(e.category || '')) && e.teacher
  );

  // Przypadek 1: Struktura z mapą dni (np. timetable.table: { Monday: [...], Tuesday: [...] })
  const tableSource = timetableData.table || (typeof timetableData === 'object' && !Array.isArray(timetableData) ? timetableData : null);

  if (tableSource && typeof tableSource === 'object') {
    for (const [dayKey, rawLessons] of Object.entries(tableSource)) {
      const normalizedDayKey = dayKey.toLowerCase().trim();
      const dayNum = DAY_NAME_TO_NUMBER[normalizedDayKey] || parseInt(normalizedDayKey, 10);
      if (!dayNum || dayNum < 1 || dayNum > 5) continue;

      if (!Array.isArray(rawLessons)) continue;

      const dayLessons: LessonItem[] = [];
      let visualOrderCounter = 1;

      rawLessons.forEach((rawLesson: any, slotIdx: number) => {
        if (!rawLesson) return;

        const rawTime = String(rawLesson.time || rawLesson.timeRange || '').replace(/\u00a0/g, ' ').trim();
        const timeRange = (rawTime && rawTime.includes('-'))
          ? rawTime
          : (STANDARD_TIME_SLOTS[slotIdx]
              ? `${STANDARD_TIME_SLOTS[slotIdx].start} - ${STANDARD_TIME_SLOTS[slotIdx].end}`
              : '08:00 - 08:45');

        const order = typeof rawLesson.order === 'number' && rawLesson.order >= 0
          ? rawLesson.order
          : inferLessonOrder(timeRange, slotIdx);
        const subject = capitalize(rawLesson.subject || rawLesson.title || 'Lekcja');
        const teacher = cleanTeacherName(rawLesson.teacher);
        const classroom = formatClassroom(rawLesson.room || rawLesson.classroom);

        const flag = rawLesson.flag ? String(rawLesson.flag).trim() : undefined;
        const original = rawLesson.original ? rawLesson.original : null;
        const rawCancelled = Boolean(rawLesson.cancelled);

        // Wykrywanie zastępstwa
        const isSubstitutionByFlag = Boolean(flag && /zastęp/i.test(flag));
        const isSubstitutionByOriginal = Boolean(
          !rawCancelled && original && (original.subject !== rawLesson.subject || original.teacher !== rawLesson.teacher)
        );
        const isSubstitution = !rawCancelled && (isSubstitutionByFlag || isSubstitutionByOriginal);

        // Wykrywanie odwołania: aktywne lekcje zastępcze NIE są odwołane
        const isCancelledByFlag = Boolean(flag && /odwołan/i.test(flag));
        const isCancelled = rawCancelled || (!isSubstitution && isCancelledByFlag);

        // Formułowanie notatki o zastępstwie / odwołaniu
        let substitutionNote: string | undefined = undefined;
        let originalSubject: string | undefined = undefined;
        let originalTeacher: string | undefined = undefined;

        if (original) {
          originalSubject = capitalize(original.subject);
          originalTeacher = cleanTeacherName(original.teacher);
          if (isSubstitution) {
            substitutionNote = `Zastępstwo za: ${originalSubject}${originalTeacher ? ` (${originalTeacher})` : ''}`;
          } else if (isCancelled) {
            substitutionNote = `Lekcja odwołana: ${originalSubject}`;
          }
        } else if (isSubstitution) {
          substitutionNote = teacher ? `Zastępstwo prowadzi: ${teacher}` : 'Zastępstwo w Librus Synergia';
        } else if (isCancelled) {
          substitutionNote = flag ? `Odwołana (${flag})` : 'Lekcja odwołana w Librus Synergia';
        }

        const lessonItem: LessonItem = {
          id: rawLesson.id || `librus_day${dayNum}_slot${slotIdx}_${order}`,
          order,
          timeRange,
          subject,
          teacher: teacher || rawLesson.teacher || '',
          classroom,
          isSubstitution,
          substitutionNote,
          isCancelled,
          originalSubject,
          originalTeacher,
          flag
        };

        dayLessons.push(lessonItem);
        visualOrderCounter++;
      });

      result[dayNum] = dayLessons;
    }
  }

  // Przypadek 2: Tablica lekcji (lessons: [...])
  const flatLessons = Array.isArray(timetableData.lessons)
    ? timetableData.lessons
    : (Array.isArray(timetableData) ? timetableData : null);

  if (flatLessons && Object.values(result).every((arr) => arr.length === 0)) {
    flatLessons.forEach((l: any, idx: number) => {
      const dayVal = l.day !== undefined ? l.day : l.dayOfWeek;
      let dayNum = 1;
      if (typeof dayVal === 'number' && dayVal >= 1 && dayVal <= 5) {
        dayNum = dayVal;
      } else if (typeof dayVal === 'string') {
        dayNum = DAY_NAME_TO_NUMBER[dayVal.toLowerCase().trim()] || 1;
      }

      const rawTime = String(l.timeRange || l.time || `${l.time_start || '08:00'} - ${l.time_end || '08:45'}`)
        .replace(/\u00a0/g, ' ')
        .trim();
      const order = l.order || inferLessonOrder(rawTime, idx);
      const subject = capitalize(l.subject || l.title || 'Lekcja');
      const teacher = cleanTeacherName(l.cleanTeacher || l.teacher);
      const classroom = formatClassroom(l.classroom || l.room);

      const flag = l.flag ? String(l.flag).trim() : undefined;
      const isSubstitution = Boolean(l.isSubstitution || (flag && /zastęp/i.test(flag)));
      const isCancelled = Boolean(
        l.isCancelled || l.status === 'cancelled' || (!isSubstitution && flag && /odwołan/i.test(flag))
      );

      result[dayNum].push({
        id: l.id || `librus_flat_${dayNum}_${idx}`,
        order,
        timeRange: rawTime,
        subject,
        teacher: teacher || l.teacher || '',
        classroom,
        isSubstitution,
        substitutionNote: l.substitutionNote || (isSubstitution ? (teacher ? `Zastępstwo: ${teacher}` : 'Zastępstwo') : undefined),
        isCancelled,
        originalSubject: l.originalSubject,
        originalTeacher: l.originalTeacher,
        flag
      });
    });
  }

  // 3. Korelacja z nieobecnościami nauczycieli z terminarza (Absence Correlation Engine)
  if (teacherAbsences.length > 0) {
    for (let dayNum = 1; dayNum <= 5; dayNum++) {
      const lessons = result[dayNum] || [];

      result[dayNum] = lessons.map((lesson) => {
        // Jeśli lekcja już jest zastępstwem lub jest odwołana, pomijamy
        if (lesson.isSubstitution || lesson.isCancelled) return lesson;

        // Szukamy absencji nauczyciela odpowiadającej dniu tygodnia
        const matchedAbsence = teacherAbsences.find((abs) => {
          if (!matchTeacherNames(lesson.teacher, abs.teacher)) return false;

          if (abs.date) {
            try {
              const absDate = new Date(abs.date + 'T12:00:00Z');
              const absDay = absDate.getUTCDay(); // 0 = Sun, 1 = Mon, ..., 5 = Fri
              if (absDay !== dayNum) return false;
            } catch {
              // Błąd parsowania daty
            }
          }

          return checkTimeOverlap(lesson.timeRange, abs.time);
        });

        if (matchedAbsence) {
          const absenceTeacher = cleanTeacherName(matchedAbsence.teacher);
          const absenceTime = matchedAbsence.time || 'cały dzień';
          return {
            ...lesson,
            isCancelled: true,
            substitutionNote: `Nieobecność nauczyciela: ${absenceTeacher} (${absenceTime})`
          };
        }

        return lesson;
      });
    }
  }

  // Sortuj lekcje w każdym dniu według order lub czasu rozpoczęcia
  for (let dayNum = 1; dayNum <= 5; dayNum++) {
    result[dayNum].sort((a, b) => a.order - b.order);
  }

  return result;
}

/**
 * Wyciąga listę wszystkich wykrytych zastępstw i odwołanych lekcji.
 */
export function extractSubstitutions(
  timetable: Record<number, LessonItem[]>,
  targetDay?: number
): Array<LessonItem & { day: number }> {
  const result: Array<LessonItem & { day: number }> = [];

  const daysToCheck = targetDay && targetDay >= 1 && targetDay <= 5 ? [targetDay] : [1, 2, 3, 4, 5];

  for (const day of daysToCheck) {
    const lessons = timetable[day] || [];
    for (const l of lessons) {
      if (l.isSubstitution || l.isCancelled) {
        result.push({
          ...l,
          day
        });
      }
    }
  }

  return result;
}
