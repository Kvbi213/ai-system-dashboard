import { describe, it, expect } from 'vitest';
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
  getDemoTimetableData
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
      expect(absentLesson.teacher).toBe('Negowska Alicja');
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
});


