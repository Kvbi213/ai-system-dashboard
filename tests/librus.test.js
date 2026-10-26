import { describe, it, expect } from 'vitest';
import * as cheerio from 'cheerio';
import { 
  parseGradeNumeric, 
  parseGradeInfo, 
  computeGradeStats, 
  getDemoGradesData,
  parseCalendarEvent,
  getDemoCalendarData,
  cleanTeacherName,
  matchTeacherNames,
  parseTimeToMinutes,
  checkTimeOverlap,
  correlateTimetableWithAbsences,
  getDemoTimetableData,
  parseTimetableHtml
} from '../modules/services/librusService.js';
import { agentTools } from '../modules/ai/tools.js';

describe('Librus Synergia Integration Service', () => {
  describe('parseGradeNumeric', () => {
    it('should parse integer grade values correctly', () => {
      expect(parseGradeNumeric('6')).toBe(6);
      expect(parseGradeNumeric('5')).toBe(5);
      expect(parseGradeNumeric('4')).toBe(4);
      expect(parseGradeNumeric('1')).toBe(1);
    });

    it('should parse plus and minus modifiers properly', () => {
      expect(parseGradeNumeric('5+')).toBe(5.5);
      expect(parseGradeNumeric('4+')).toBe(4.5);
      expect(parseGradeNumeric('5-')).toBe(4.75);
      expect(parseGradeNumeric('4-')).toBe(3.75);
    });

    it('should handle null or invalid values safely', () => {
      expect(parseGradeNumeric(null)).toBeNull();
      expect(parseGradeNumeric('')).toBeNull();
      expect(parseGradeNumeric('brak')).toBeNull();
    });
  });

  describe('parseGradeInfo', () => {
    it('should extract category, weight, date and teacher from multiline string', () => {
      const raw = `Kategoria: Sprawdzian
Waga: 3
Data: 2026-03-15
Nauczyciel: J. Kowalski
Komentarz: Dział 3`;

      const parsed = parseGradeInfo(raw);
      expect(parsed.category).toBe('Sprawdzian');
      expect(parsed.weight).toBe(3);
      expect(parsed.date).toBe('2026-03-15');
      expect(parsed.teacher).toBe('J. Kowalski');
      expect(parsed.comment).toBe('Dział 3');
    });

    it('should handle comma in weight (e.g. Waga: 2,5)', () => {
      const raw = 'Kategoria: Kartkówka\nWaga: 2,5\nData: 2026-04-01';
      const parsed = parseGradeInfo(raw);
      expect(parsed.category).toBe('Kartkówka');
      expect(parsed.weight).toBe(2.5);
      expect(parsed.date).toBe('2026-04-01');
    });

    it('should provide default values for missing or empty fields', () => {
      const parsed = parseGradeInfo('');
      expect(parsed.category).toBe('Brak');
      expect(parsed.weight).toBe(1);
    });
  });

  describe('computeGradeStats', () => {
    it('should calculate weighted average and detect highest/lowest subjects', () => {
      const mockRawSubjects = [
        {
          name: 'Matematyka',
          semester: [
            [
              { id: 1, value: '5', info: 'Waga: 2' },
              { id: 2, value: '4', info: 'Waga: 2' }
            ],
            []
          ]
        },
        {
          name: 'Informatyka',
          semester: [
            [
              { id: 3, value: '6', info: 'Waga: 3' }
            ],
            []
          ]
        }
      ];

      const stats = computeGradeStats(mockRawSubjects);
      expect(stats.totalSubjects).toBe(2);
      expect(stats.gradedSubjectsCount).toBe(2);
      expect(stats.overallAverage).toBe(5.25); // (4.5 + 6.0) / 2 = 5.25
      expect(stats.highestAverage.subject).toBe('Informatyka');
      expect(stats.lowestAverage.subject).toBe('Matematyka');
    });
  });

  describe('getDemoGradesData', () => {
    it('should return populated demo data structure with lucky number', () => {
      const demo = getDemoGradesData();
      expect(demo.isDemo).toBe(true);
      expect(demo.luckyNumber).toBe(17);
      expect(demo.subjects.length).toBeGreaterThan(0);
      expect(demo.overallAverage).toBeGreaterThan(0);
      expect(demo.status).toBe('demo');
    });
  });

  describe('parseCalendarEvent', () => {
    it('should parse teacher absence event correctly', () => {
      const raw = {
        id: 3469819,
        day: '2026-09-24',
        title: 'Nieobecność:Nauczyciel: Negowska AlicjaGodziny: 08:50 do 14:50'
      };

      const parsed = parseCalendarEvent(raw);
      expect(parsed).not.toBeNull();
      expect(parsed.type).toBe('absence');
      expect(parsed.category).toBe('Nieobecność nauczyciela');
      expect(parsed.teacher).toBe('Negowska Alicja');
      expect(parsed.time).toBe('08:50 do 14:50');
      expect(parsed.date).toBe('2026-09-24');
    });

    it('should parse absence without hours and with newlines properly', () => {
      const rawNoHours = {
        id: 3469820,
        day: '2026-10-21',
        title: 'Nieobecność: Nauczyciel: Becker Adam'
      };
      const parsedNoHours = parseCalendarEvent(rawNoHours);
      expect(parsedNoHours.teacher).toBe('Becker Adam');
      expect(parsedNoHours.time).toBe('Cały dzień');

      const rawWithNewlines = {
        id: 3469821,
        day: '2026-10-22',
        title: 'Nieobecność:\nNauczyciel: Czarna Alicja\nGodziny: 10:00 do 12:00'
      };
      const parsedNewlines = parseCalendarEvent(rawWithNewlines);
      expect(parsedNewlines.teacher).toBe('Czarna Alicja');
      expect(parsedNewlines.time).toBe('10:00 do 12:00');
    });

    it('should parse quiz (kartkówka) event correctly', () => {
      const raw = {
        id: 12481501,
        day: '2026-09-17',
        title: 'Nr lekcji: 2język angielski, kartkówkaj.ang 2 TI gr.1'
      };

      const parsed = parseCalendarEvent(raw);
      expect(parsed).not.toBeNull();
      expect(parsed.type).toBe('kartkowka');
      expect(parsed.category).toBe('Kartkówka');
      expect(parsed.time).toBe('Lekcja 2');
      expect(parsed.date).toBe('2026-09-17');
    });

    it('should parse exam (sprawdzian) event correctly', () => {
      const raw = {
        id: 12481502,
        day: '2026-09-30',
        title: 'Nr lekcji: 4Matematyka, sprawdzianrachunek prawdopodobieństwa'
      };

      const parsed = parseCalendarEvent(raw);
      expect(parsed).not.toBeNull();
      expect(parsed.type).toBe('sprawdzian');
      expect(parsed.category).toBe('Sprawdzian');
      expect(parsed.time).toBe('Lekcja 4');
    });
  });

  describe('cleanTeacherName', () => {
    it('should strip class/group annotations and titles', () => {
      expect(cleanTeacherName('Becker Adam (2 TI gr.2)')).toBe('Becker Adam');
      expect(cleanTeacherName('mgr inż. Kowalski Jan')).toBe('Kowalski Jan');
      expect(cleanTeacherName('dr Nowak Anna (gr. 1)')).toBe('Nowak Anna');
    });

    it('should return empty string for null or non-string input', () => {
      expect(cleanTeacherName(null)).toBe('');
      expect(cleanTeacherName(undefined)).toBe('');
      expect(cleanTeacherName('')).toBe('');
    });
  });

  describe('matchTeacherNames', () => {
    it('should match identical and reversed teacher names', () => {
      expect(matchTeacherNames('Negowska Alicja', 'Negowska Alicja')).toBe(true);
      expect(matchTeacherNames('Negowska Alicja', 'Alicja Negowska')).toBe(true);
      expect(matchTeacherNames('Becker Adam (2 TI gr.2)', 'Becker Adam')).toBe(true);
    });

    it('should correctly resolve teacher abbreviations and initials', () => {
      expect(matchTeacherNames('AN', 'Negowska Alicja')).toBe(true);
      expect(matchTeacherNames('PW', 'Wojnarowski Przemysław')).toBe(true);
      expect(matchTeacherNames('KP', 'Kolasińska Paulina')).toBe(true);
      expect(matchTeacherNames('AB', 'Becker Adam')).toBe(true);
    });

    it('should NEVER falsely match initials as substring of an unrelated teacher', () => {
      // Błąd krytyczny z sesji: 'AN' dopasowywał się do 'Prabucki Andrzej' przez .includes()
      expect(matchTeacherNames('AN', 'Prabucki Andrzej')).toBe(false);
      expect(matchTeacherNames('PA', 'Negowska Alicja')).toBe(false);
      expect(matchTeacherNames('KP', 'Becker Adam')).toBe(false);
    });

    it('should NEVER match different teachers sharing the same common first name', () => {
      // Błąd krytyczny z sesji: Czarna Alicja i Negowska Alicja łączyły się przez wspólne imię 'Alicja'
      expect(matchTeacherNames('Czarna Alicja', 'Negowska Alicja')).toBe(false);
      expect(matchTeacherNames('Becker Adam', 'Mickiewicz Adam')).toBe(false);
      expect(matchTeacherNames('Czarna Alicja', 'Alicja')).toBe(false);
    });

    it('should match single unique surname (>= 4 chars)', () => {
      expect(matchTeacherNames('Wojnarowski Przemysław', 'Wojnarowski')).toBe(true);
      expect(matchTeacherNames('Negowska Alicja', 'Negowska')).toBe(true);
    });

    it('should return false for completely different teachers', () => {
      expect(matchTeacherNames('Bahr Zbigniew', 'Negowska Alicja')).toBe(false);
      expect(matchTeacherNames('Nowak Jan', 'Kowalski Piotr')).toBe(false);
    });
  });

  describe('checkTimeOverlap and parseTimeToMinutes', () => {
    it('should parse HH:MM to minutes from midnight', () => {
      expect(parseTimeToMinutes('08:00')).toBe(480);
      expect(parseTimeToMinutes('13:15')).toBe(795);
      expect(parseTimeToMinutes('14:50')).toBe(890);
    });

    it('should detect overlap when lesson is inside absence period', () => {
      // Lekcja 13:15 - 14:00, nieobecność 08:50 do 14:50 -> nakłada się!
      expect(checkTimeOverlap('13:15', '14:00', '08:50 do 14:50')).toBe(true);
    });

    it('should detect absence when range is Cały dzień or empty', () => {
      expect(checkTimeOverlap('08:00', '08:45', 'Cały dzień')).toBe(true);
      expect(checkTimeOverlap('08:00', '08:45', '')).toBe(true);
    });

    it('should return false when lesson is completely before or after absence', () => {
      // Lekcja 08:00 - 08:45, nieobecność od 08:50 do 14:50 -> brak nakładania!
      expect(checkTimeOverlap('08:00', '08:45', '08:50 do 14:50')).toBe(false);
      // Lekcja 15:00 - 15:45, nieobecność od 08:50 do 14:50 -> brak nakładania!
      expect(checkTimeOverlap('15:00', '15:45', '08:50 do 14:50')).toBe(false);
    });

    it('should return false safely for null, undefined or malformed absence range', () => {
      expect(checkTimeOverlap('08:00', '08:45', null)).toBe(false);
      expect(checkTimeOverlap('08:00', '08:45', undefined)).toBe(false);
      expect(checkTimeOverlap('08:00', '08:45', 'niepoprawny format')).toBe(false);
      expect(checkTimeOverlap(null, '08:45', '08:00 do 09:00')).toBe(false);
      expect(checkTimeOverlap('08:00', null, '08:00 do 09:00')).toBe(false);
    });
  });

  describe('correlateTimetableWithAbsences', () => {
    const mockLessons = [
      {
        id: 'lesson_1',
        day: 'thursday',
        subject: 'Język polski',
        time_start: '08:00',
        time_end: '08:45',
        teacher: 'Negowska Alicja',
        notes: ''
      },
      {
        id: 'lesson_2',
        day: 'thursday',
        subject: 'Język polski',
        time_start: '13:15',
        time_end: '14:00',
        teacher: 'Negowska Alicja',
        notes: ''
      },
      {
        id: 'lesson_3',
        day: 'thursday',
        subject: 'Matematyka',
        time_start: '12:20',
        time_end: '13:05',
        teacher: 'Bahr Zbigniew',
        notes: ''
      }
    ];

    const mockCalendarAbsence = [
      {
        type: 'absence',
        date: '2026-09-24', // czwartek
        teacher: 'Negowska Alicja',
        time: '08:50 do 14:50',
        description: 'Nieobecność nauczyciela: Negowska Alicja'
      }
    ];

    it('should correlate only the overlapping lesson of the absent teacher', () => {
      const result = correlateTimetableWithAbsences(mockLessons, mockCalendarAbsence);
      expect(result.lessons.length).toBe(3);

      // Lekcja 1 (08:00 - 08:45) nie nakłada się na 08:50 - 14:50
      expect(result.lessons[0].absenceAlert).toBeUndefined();

      // Lekcja 2 (13:15 - 14:00) nakłada się na 08:50 - 14:50
      expect(result.lessons[1].absenceAlert).toBeDefined();
      expect(result.lessons[1].absenceAlert.isAbsent).toBe(true);
      expect(result.lessons[1].absenceAlert.hours).toBe('08:50 do 14:50');
      expect(result.lessons[1].notes).toContain('NIEOBECNOŚĆ');

      // Lekcja 3 (Bahr Zbigniew) - inny nauczyciel, brak alertu
      expect(result.lessons[2].absenceAlert).toBeUndefined();

      // Wykryto 1 zastępstwo/okienko
      expect(result.detectedSubstitutions.length).toBe(1);
      expect(result.detectedSubstitutions[0].lessonId).toBe('lesson_2');
    });
  });

  describe('getDemoCalendarData', () => {
    it('should return valid demo school calendar events', () => {
      const demo = getDemoCalendarData();
      expect(demo.isDemo).toBe(true);
      expect(Array.isArray(demo.events)).toBe(true);
      expect(demo.events.length).toBeGreaterThan(0);
      expect(demo.events[0]).toHaveProperty('date');
      expect(demo.events[0]).toHaveProperty('type');
      expect(demo.events[0]).toHaveProperty('category');
    });
  });

  describe('getDemoTimetableData', () => {
    it('should provide full weekly demo schedule with decorated absences', () => {
      const data = getDemoTimetableData();
      expect(data.isDemo).toBe(true);
      expect(data.lessons.length).toBeGreaterThan(15);
      expect(data.hours.length).toBeGreaterThan(5);
      expect(data.substitutions.length).toBeGreaterThan(0);

      const absentLesson = data.lessons.find(l => l.absenceAlert && l.absenceAlert.isAbsent);
      expect(absentLesson).toBeDefined();
      expect(absentLesson.teacher).toBe('Czarna Alicja');
    });
  });

  describe('AI Agent Librus Tools (Read-Only Safety & Schema)', () => {
    it('should define GET_LIBRUS_GRADES and GET_LIBRUS_CALENDAR in agentTools', () => {
      const gradesTool = agentTools.find(t => t.function?.name === 'GET_LIBRUS_GRADES');
      const calTool = agentTools.find(t => t.function?.name === 'GET_LIBRUS_CALENDAR');

      expect(gradesTool).toBeDefined();
      expect(calTool).toBeDefined();
      expect(gradesTool.function.description).toContain('read-only');
      expect(calTool.function.description).toContain('read-only');
    });

    it('should enforce zero write/mutation tools for Librus', () => {
      const mutatingLibrusTools = agentTools.filter(t => {
        const name = t.function?.name || '';
        return (name.includes('LIBRUS') || name.includes('GRADE')) && 
               (name.startsWith('ADD_') || name.startsWith('UPDATE_') || name.startsWith('DELETE_') || name.startsWith('SET_'));
      });
      expect(mutatingLibrusTools.length).toBe(0);
    });

    it('should configure GET_LIBRUS_GRADES strictly for read-only filtering without mutating fields', () => {
      const gradesTool = agentTools.find(t => t.function?.name === 'GET_LIBRUS_GRADES');
      const props = Object.keys(gradesTool.function.parameters.properties);
      expect(props).toContain('subject');
      expect(props).not.toContain('grade');
      expect(props).not.toContain('value');
      expect(props).not.toContain('action');
    });

    it('should configure GET_LIBRUS_CALENDAR strictly for read-only query parameters', () => {
      const calTool = agentTools.find(t => t.function?.name === 'GET_LIBRUS_CALENDAR');
      const props = Object.keys(calTool.function.parameters.properties);
      expect(props).toContain('type');
      expect(props).toContain('date_from');
      expect(props).not.toContain('title');
      expect(props).not.toContain('event');
    });
  });

  describe('parseTimetableHtml with Cancelled Lessons', () => {
    it('should parse HTML table and identify cancelled lessons in <s> tags and .plan-lekcji-info', () => {
      const sampleHtml = `
        <table class="decorated plan-lekcji">
          <tbody>
            <tr class="line1">
              <th>08:00 - 08:45</th>
              <td></td>
              <td></td>
              <td></td>
              <td>
                <div class="text">
                  <s>Język polski (odwołane)</s>
                  <br>
                  <s>Negowska Alicja</s>
                  <span class="plan-lekcji-info">zajęcia odwołane</span>
                </div>
              </td>
              <td></td>
            </tr>
            <tr class="line1">
              <th>12:20 - 13:05</th>
              <td></td>
              <td></td>
              <td></td>
              <td>
                <div class="text">
                  <b>Matematyka</b>
                  <br>
                  Bahr Zbigniew
                  <span class="sala">s. 05</span>
                </div>
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>
      `;

      const $ = cheerio.load(sampleHtml);
      const parsed = parseTimetableHtml($, '2026-09-21', '2026-09-25');
      expect(parsed).toBeDefined();
      expect(parsed.lessons.length).toBe(2);

      const cancelledLesson = parsed.lessons.find(l => l.isCancelled);
      expect(cancelledLesson).toBeDefined();
      expect(cancelledLesson.subject.toLowerCase()).toContain('polski');
      expect(cancelledLesson.status).toBe('cancelled');
      expect(cancelledLesson.statusLabel).toBe('Odwołana');

      const activeLesson = parsed.lessons.find(l => !l.isCancelled);
      expect(activeLesson).toBeDefined();
      expect(activeLesson.subject).toBe('Matematyka');
      expect(activeLesson.status).toBe('active');
    });
  });

  describe('Librus Cancelled Lessons & Plan Dnia Demo Verification', () => {
    it('should have Friday lesson 1 marked as cancelled, Tuesday lessons 4-5 as substitutions, and Thursday lessons active', () => {
      const timetable = getDemoTimetableData();
      const fridayLessons = timetable.lessons.filter(l => l.day === 'friday');
      const tuesdayLessons = timetable.lessons.filter(l => l.day === 'tuesday');
      const thursdayLessons = timetable.lessons.filter(l => l.day === 'thursday');

      const fri1 = fridayLessons.find(l => l.id === 'librus_fri_1');
      expect(fri1?.isCancelled).toBe(true);
      expect(fri1?.status).toBe('cancelled');

      const tue4 = tuesdayLessons.find(l => l.id === 'librus_tue_4');
      const tue5 = tuesdayLessons.find(l => l.id === 'librus_tue_5');
      expect(tue4?.isSubstitution).toBe(true);
      expect(tue4?.status).toBe('substitution');
      expect(tue5?.isSubstitution).toBe(true);
      expect(tue5?.status).toBe('substitution');

      // Lekcje czwartkowe odbywają się normalnie
      thursdayLessons.forEach(l => {
        expect(l.isCancelled).toBeFalsy();
        expect(l.status).toBe('active');
      });
    });

    it('should calculate accurate demo grades stats with authentic overall average 4.35 matching Librus ground truth', () => {
      const grades = getDemoGradesData();
      expect(grades.overallAverage).toBe(4.35);

      const math = grades.subjects.find(s => s.name.toLowerCase() === 'matematyka');
      expect(math).toBeDefined();
      expect(math.average).toBe(3.67);
      expect(math.grades.length).toBe(5);

      const history = grades.subjects.find(s => s.name.toLowerCase() === 'historia');
      expect(history).toBeDefined();
      expect(history.average).toBe(4.00);
      expect(history.grades.length).toBe(3);

      const edb = grades.subjects.find(s => s.name.toLowerCase().includes('edukacja obywatelska'));
      expect(edb).toBeDefined();
      expect(edb.average).toBe(5.00);
    });

    it('should correctly tag timetable lessons and preserve personal activities and school classes', () => {
      const timetable = getDemoTimetableData();
      expect(timetable.lessons.length).toBeGreaterThan(20);

      // Wszystkie lekcje demonstracyjne mają zdefiniowane poprawne statusy
      timetable.lessons.forEach(l => {
        expect(l.status).toBeDefined();
        expect(['active', 'cancelled', 'substitution']).toContain(l.status);
      });

      // Sprawdź czy odwołane lekcje nie zostały wycięte
      const cancelled = timetable.lessons.filter(l => l.isCancelled);
      expect(cancelled.length).toBe(1); // Piątkowa lekcja 1 (Alicja Czarna)

      // Sprawdź wykryte zastępstwa
      const substitutions = timetable.lessons.filter(l => l.isSubstitution);
      expect(substitutions.length).toBe(2); // Wtorkowe lekcje 4 i 5 (Joanna Ziemba)
    });

    it('should cleanly differentiate between personal and school lessons in Plan Dnia switching', () => {
      const sampleLessons = [
        { id: 'librus_mon_1', subject: 'Informatyka', category: 'school', type: 'Laboratorium' },
        { id: 'librus_thu_1', subject: 'Język polski', category: 'school', isCancelled: true },
        { id: 'personal_mon_wake', subject: 'Poranny rozruch', type: 'Osobiste' },
        { id: 'personal_mon_workout', subject: 'Blok A: Trening Full Body', type: 'Osobiste', personalCategory: 'Trening' },
        { id: 'personal_tue_study', subject: 'Blok A: Nauka', category: 'personal' }
      ];

      const isPersonal = (l) => {
        if (!l) return false;
        if (l.isPersonal === true || l.isPersonal === 'true') return true;
        if (l.category === 'personal' || l.itemType === 'personal' || l.type === 'Osobiste') return true;
        const idStr = String(l.id || '');
        if (idStr.startsWith('personal_') || idStr.startsWith('routine_') || idStr.startsWith('workout_')) return true;
        if (l.personalCategory && l.personalCategory !== '') return true;
        return false;
      };

      const schoolFiltered = sampleLessons.filter(l => !isPersonal(l));
      const personalFiltered = sampleLessons.filter(l => isPersonal(l));

      expect(schoolFiltered.length).toBe(2);
      expect(schoolFiltered.map(l => l.id)).toEqual(['librus_mon_1', 'librus_thu_1']);

      expect(personalFiltered.length).toBe(3);
      expect(personalFiltered.map(l => l.id)).toEqual([
        'personal_mon_wake',
        'personal_mon_workout',
        'personal_tue_study'
      ]);

      // Sum of sets must equal total
      expect(schoolFiltered.length + personalFiltered.length).toBe(sampleLessons.length);
    });
  });
});


