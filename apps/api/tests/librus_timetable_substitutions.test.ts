import { describe, it, expect, beforeEach } from 'vitest';
import {
  parseLibrusTimetable,
  extractSubstitutions,
  cleanTeacherName,
  matchTeacherNames,
  checkTimeOverlap,
  inferLessonOrder
} from '../src/domains/school/librusTimetableParser.js';
import { dbStore } from '../src/db/store.js';
import { SchoolEvent } from '../src/db/types.js';

describe('Librus Timetable & Substitutions Engine Suite', () => {
  describe('Teacher Helpers', () => {
    it('cleans raw teacher strings from class groups and degrees', () => {
      expect(cleanTeacherName('Ziemba Joanna (j.ang 2 TI gr 1)')).toBe('Ziemba Joanna');
      expect(cleanTeacherName('mgr inż. Gembiak Bartosz')).toBe('Gembiak Bartosz');
      expect(cleanTeacherName('Becker Adam - gr 2')).toBe('Becker Adam');
      expect(cleanTeacherName('AN')).toBe('Negowska Alicja');
    });

    it('matches teacher names irrespective of order or formatting', () => {
      expect(matchTeacherNames('Alicja Negowska', 'Negowska Alicja')).toBe(true);
      expect(matchTeacherNames('Bahr Zbigniew', 'Zbigniew Bahr (2 TI)')).toBe(true);
      expect(matchTeacherNames('Wojnarowski Przemysław', 'PW')).toBe(true);
      expect(matchTeacherNames('Alicja Czarna', 'Alicja Negowska')).toBe(false);
    });

    it('detects time overlaps correctly', () => {
      expect(checkTimeOverlap('08:50 - 09:35', '08:00 - 10:00')).toBe(true);
      expect(checkTimeOverlap('10:40 - 11:25', '12:00 - 14:00')).toBe(false);
      expect(checkTimeOverlap('10:40 - 11:25', undefined)).toBe(true);
    });

    it('infers lesson order from time slots', () => {
      expect(inferLessonOrder('08:00 - 08:45', 0)).toBe(1);
      expect(inferLessonOrder('08:50 - 09:35', 1)).toBe(2);
      expect(inferLessonOrder('10:40 - 11:25', 3)).toBe(4);
    });
  });

  describe('Timetable Parsing & Substitution Extraction', () => {
    it('parses structured table with flags and cancellations', () => {
      const mockTableData = {
        table: {
          Wednesday: [
            null,
            {
              subject: 'pracownia urządzeń techniki komputerowej',
              teacher: 'Gembiak Bartosz',
              room: '1.2',
              time: '13:15 - 14:00',
              cancelled: false,
              flag: 'zastępstwo',
              original: null
            }
          ],
          Friday: [
            null,
            {
              subject: 'język polski',
              teacher: 'Alicja Negowska',
              room: 's. 19',
              time: '11:30 - 12:15',
              cancelled: false,
              flag: 'odwołane, przesunięcie',
              original: {
                subject: 'chemia',
                teacher: 'Kolasińska Paulina',
                room: '11',
                time: '11:30 - 12:15'
              }
            },
            {
              subject: 'język polski',
              teacher: 'Negowska Alicja',
              room: '19',
              time: '13:15 - 14:00',
              cancelled: true,
              flag: 'przesunięcie',
              original: null
            }
          ]
        }
      };

      const parsed = parseLibrusTimetable(mockTableData, []);

      // Wednesday
      expect(parsed[3].length).toBe(1);
      const wedSub = parsed[3][0];
      expect(wedSub.subject).toBe('Pracownia urządzeń techniki komputerowej');
      expect(wedSub.isSubstitution).toBe(true);
      expect(wedSub.isCancelled).toBe(false);
      expect(wedSub.substitutionNote).toContain('Gembiak Bartosz');

      // Friday
      expect(parsed[5].length).toBe(2);
      const friPol = parsed[5][0];
      expect(friPol.subject).toBe('Język polski');
      expect(friPol.isSubstitution).toBe(true);
      expect(friPol.isCancelled).toBe(true);
      expect(friPol.originalSubject).toBe('Chemia');
      expect(friPol.substitutionNote).toContain('Chemia');

      const friCancelled = parsed[5][1];
      expect(friCancelled.isCancelled).toBe(true);
      expect(friCancelled.substitutionNote).toContain('przesunięcie');
    });

    it('correlates teacher absences from calendar with timetable lessons', () => {
      const mockTableData = {
        table: {
          Monday: [
            {
              subject: 'matematyka',
              teacher: 'Bahr Zbigniew',
              room: 's. 26',
              time: '08:50 - 09:35',
              cancelled: false
            }
          ]
        }
      };

      // Absence on Monday (2026-11-02 was Monday)
      const mockEvents: SchoolEvent[] = [
        {
          id: 'abs_1',
          date: '2026-11-02',
          type: 'absence',
          category: 'Nieobecność',
          title: 'Nieobecność: Zbigniew Bahr',
          teacher: 'Bahr Zbigniew',
          time: '08:00 - 14:00'
        }
      ];

      const parsed = parseLibrusTimetable(mockTableData, mockEvents);
      expect(parsed[1].length).toBe(1);
      const mathLesson = parsed[1][0];
      expect(mathLesson.isCancelled).toBe(true);
      expect(mathLesson.substitutionNote).toContain('Nieobecność nauczyciela: Bahr Zbigniew');
    });

    it('extracts all substitutions across all days', () => {
      const mockTimetable = {
        1: [
          { id: '1', order: 1, timeRange: '08:00 - 08:45', subject: 'Polski', teacher: 'AN', classroom: 's. 1' }
        ],
        2: [
          {
            id: '2',
            order: 2,
            timeRange: '08:50 - 09:35',
            subject: 'Angielski',
            teacher: 'ZJ',
            classroom: 's. 2',
            isSubstitution: true,
            substitutionNote: 'Zastępstwo: Ziemba'
          }
        ],
        3: [],
        4: [],
        5: []
      };

      const subs = extractSubstitutions(mockTimetable);
      expect(subs.length).toBe(1);
      expect(subs[0].day).toBe(2);
      expect(subs[0].isSubstitution).toBe(true);
    });
  });

  describe('DatabaseStore Ground Truth Integration', () => {
    beforeEach(() => {
      dbStore.refreshFromGroundTruth();
    });

    it('loads ground truth timetable and exposes real substitutions', () => {
      const allSubs = dbStore.getSubstitutions();
      expect(allSubs.length).toBeGreaterThanOrEqual(3);

      // Verify Wednesday or Thursday has Gembiak Bartosz substitution
      const gembiakSub = allSubs.find((s) => s.teacher.includes('Gembiak') || s.substitutionNote?.includes('Gembiak'));
      expect(gembiakSub).toBeDefined();
      expect(gembiakSub?.isSubstitution).toBe(true);

      // Verify Friday has cancelled/moved lessons
      const friSubs = dbStore.getSubstitutions(5);
      expect(friSubs.length).toBeGreaterThanOrEqual(1);
      const cancelledOrMoved = friSubs.find((s) => s.isCancelled);
      expect(cancelledOrMoved).toBeDefined();
    });
  });
});
