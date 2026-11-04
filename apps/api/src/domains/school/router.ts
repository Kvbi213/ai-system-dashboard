import { Router, Request, Response } from 'express';
import { dbStore, GradeItem } from '../../db/store.js';
import { redisCache } from '../../core/redisCache.js';

export const schoolRouter = Router();

schoolRouter.get('/timetable', async (req: Request, res: Response) => {
  const day = parseInt(req.query.day as string, 10) || 1;
  const cacheKey = `school:timetable:${day}`;

  try {
    const data = await redisCache.getOrSet(cacheKey, 300, async () => {
      const lessons = dbStore.getTimetable(day);
      return {
        day,
        lessons,
        meta: {
          provider: 'System Dydaktyczny Sync',
          lastSynced: new Date().toISOString()
        }
      };
    });
    res.json(data);
  } catch {
    const lessons = dbStore.getTimetable(day);
    res.json({
      day,
      lessons,
      meta: {
        provider: 'System Dydaktyczny Sync',
        lastSynced: new Date().toISOString()
      }
    });
  }
});

schoolRouter.get('/grades', async (_req: Request, res: Response) => {
  try {
    const data = await redisCache.getOrSet('school:grades', 300, async () => {
      const grades = dbStore.getGrades();
      const subjects = dbStore.getSubjectsWithGrades();
      const gpa = dbStore.calculateGpa();
      return {
        grades,
        subjects,
        stats: {
          gpa,
          luckyNumber: 21,
          totalGradesCount: grades.length,
          excellentCount: grades.filter((g: GradeItem) => g.grade >= 5).length,
          threatsCount: grades.filter((g: GradeItem) => g.grade <= 1.5).length
        }
      };
    });
    res.json(data);
  } catch {
    const grades = dbStore.getGrades();
    const subjects = dbStore.getSubjectsWithGrades();
    const gpa = dbStore.calculateGpa();
    res.json({
      grades,
      subjects,
      stats: {
        gpa,
        luckyNumber: 21,
        totalGradesCount: grades.length,
        excellentCount: grades.filter((g: GradeItem) => g.grade >= 5).length,
        threatsCount: grades.filter((g: GradeItem) => g.grade <= 1.5).length
      }
    });
  }
});

schoolRouter.get('/attendance', (_req: Request, res: Response) => {
  res.json({
    percentage: 95.4,
    presentHours: 342,
    excusedHours: 14,
    unexcusedHours: 2,
    lateCount: 3,
    exams: [
      { id: 'ex1', subject: 'Inżynieria Oprogramowania', title: 'Architektura Monorepo i Docker', date: '31 paź 2026', type: 'Sprawdzian' },
      { id: 'ex2', subject: 'Bazy Danych SQL', title: 'Projekt schematu i optymalizacja indeksów', date: '04 lis 2026', type: 'Projekt' }
    ]
  });
});

schoolRouter.get('/events', async (_req: Request, res: Response) => {
  try {
    const data = await redisCache.getOrSet('school:events', 300, async () => {
      return { events: dbStore.getEvents() };
    });
    res.json(data);
  } catch {
    res.json({ events: dbStore.getEvents() });
  }
});

// Full parity with legacy api/librus.js read-all
schoolRouter.get('/read-all', async (_req: Request, res: Response) => {
  try {
    const data = await redisCache.getOrSet('school:read-all', 300, async () => {
      const grades = dbStore.getGrades();
      const gpa = dbStore.calculateGpa();
      return {
        success: true,
        isConfigured: true,
        isDemo: false,
        timestamp: new Date().toISOString(),
        studentInfo: { name: 'Operator', class: '2 TI T' },
        luckyNumber: 21,
        grades: {
          overallAverage: gpa.toString(),
          totalSubjects: 21,
          gradedSubjectsCount: grades.length,
          subjects: grades
        },
        timetable: dbStore.getAllTimetable(),
        calendar: {
          events: dbStore.getEvents()
        }
      };
    });
    res.json(data);
  } catch {
    const grades = dbStore.getGrades();
    const gpa = dbStore.calculateGpa();
    res.json({
      success: true,
      isConfigured: true,
      isDemo: false,
      timestamp: new Date().toISOString(),
      studentInfo: { name: 'Operator', class: '2 TI T' },
      luckyNumber: 21,
      grades: {
        overallAverage: gpa.toString(),
        totalSubjects: 21,
        gradedSubjectsCount: grades.length,
        subjects: grades
      },
      timetable: dbStore.getAllTimetable(),
      calendar: {
        events: dbStore.getEvents()
      }
    });
  }
});
