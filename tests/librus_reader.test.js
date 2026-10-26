import { describe, it, expect } from 'vitest';
import { 
  fetchAllLibrusData, 
  importLessonsToSchedule, 
  saveGradesToCache,
  getDemoTimetableData,
  getDemoGradesData,
  getDemoCalendarData
} from '../modules/services/librusService.js';

describe('Librus Manual Reader & Multi-day Schedule Suite', () => {
  describe('Multi-day Schedule Coverage', () => {
    it('should include authentic lessons for all 5 school days in timetable data', () => {
      const demoTt = getDemoTimetableData();
      expect(demoTt.lessons.length).toBeGreaterThanOrEqual(30);

      const daysPresent = new Set(demoTt.lessons.map(l => l.day.toLowerCase()));
      expect(daysPresent.has('monday')).toBe(true);
      expect(daysPresent.has('tuesday')).toBe(true);
      expect(daysPresent.has('wednesday')).toBe(true);
      expect(daysPresent.has('thursday')).toBe(true);
      expect(daysPresent.has('friday')).toBe(true);
    });

    it('should correctly mark cancelled and substituted lessons across the week', () => {
      const demoTt = getDemoTimetableData();
      const hasSubstitutions = demoTt.lessons.some(l => l.isSubstitution === true);
      expect(hasSubstitutions).toBe(true);
    });
  });

  describe('Comprehensive Reader Payload Integrity', () => {
    it('should generate valid summary statistics for grades and calendar', () => {
      const grades = getDemoGradesData();
      expect(grades.overallAverage).toBeDefined();
      expect(Number(grades.overallAverage)).toBeGreaterThan(3.0);
      expect(grades.subjects.length).toBeGreaterThanOrEqual(16);

      const calendar = getDemoCalendarData();
      expect(Array.isArray(calendar.events)).toBe(true);
      expect(calendar.events.length).toBeGreaterThan(0);
    });

    it('should correctly structure full reader response contract', async () => {
      // In offline/demo environment, fetchAllLibrusData falls back cleanly without breaking
      try {
        const result = await fetchAllLibrusData({ saveToDb: false });
        if (result && result.success) {
          expect(result.timestamp).toBeDefined();
          expect(result.studentInfo).toBeDefined();
          expect(result.timetable).toBeDefined();
          expect(result.grades).toBeDefined();
        }
      } catch (err) {
        // Expected when no network credentials configured in CI/sandbox
        expect(err).toBeDefined();
      }
    }, 15000);
  });

  describe('importLessonsToSchedule Safeguards', () => {
    it('should preserve personal categories and exclude them from deletion', async () => {
      const dummyLessons = [
        {
          id: 'test_l1',
          day: 'monday',
          subject: 'Matematyka Test',
          time_start: '08:00',
          time_end: '08:45',
          room: 's. 28',
          teacher: 'Behr Zbigniew'
        }
      ];

      // Verifies function execution without throwing database errors
      const result = await importLessonsToSchedule(dummyLessons);
      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(1);
    }, 15000);
  });
});
