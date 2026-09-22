import { describe, it, expect } from 'vitest';
import { 
  parseGradeNumeric, 
  parseGradeInfo, 
  computeGradeStats, 
  getDemoGradesData 
} from '../modules/services/librusService.js';

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
});
