import { Router, Request, Response } from 'express';
import { dbStore, GradeItem } from '../../db/store.js';
import { redisCache } from '../../core/redisCache.js';
import { syncLibrusData } from './librusSyncService.js';

export const schoolRouter = Router();

schoolRouter.post('/sync', async (_req: Request, res: Response) => {
  try {
    const result = await syncLibrusData();
    if (!result.success && result.error === 'CREDENTIALS_MISSING') {
      return res.status(400).json(result);
    }
    if (!result.success) {
      return res.status(502).json(result);
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: `Nieoczekiwany błąd serwisu synchronizacji: ${err.message}`,
      error: err.message
    });
  }
});

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
      const luckyNumber = dbStore.getLuckyNumber();
      return {
        grades,
        subjects,
        stats: {
          gpa,
          luckyNumber,
          totalGradesCount: grades.filter((g: GradeItem) => g.grade > 0).length,
          excellentCount: grades.filter((g: GradeItem) => g.grade >= 5).length,
          threatsCount: subjects.filter((s) => s.average > 0 && s.average < 2.0).length
        }
      };
    });
    res.json(data);
  } catch {
    const grades = dbStore.getGrades();
    const subjects = dbStore.getSubjectsWithGrades();
    const gpa = dbStore.calculateGpa();
    const luckyNumber = dbStore.getLuckyNumber();
    res.json({
      grades,
      subjects,
      stats: {
        gpa,
        luckyNumber,
        totalGradesCount: grades.filter((g: GradeItem) => g.grade > 0).length,
        excellentCount: grades.filter((g: GradeItem) => g.grade >= 5).length,
        threatsCount: subjects.filter((s) => s.average > 0 && s.average < 2.0).length
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
      const subjects = dbStore.getSubjectsWithGrades();
      const gpa = dbStore.calculateGpa();
      const luckyNumber = dbStore.getLuckyNumber();
      return {
        success: true,
        isConfigured: true,
        isDemo: false,
        timestamp: new Date().toISOString(),
        studentInfo: { name: 'Jakub Lis', class: '2 TI T' },
        luckyNumber,
        grades: {
          overallAverage: gpa.toString(),
          totalSubjects: subjects.length,
          gradedSubjectsCount: subjects.filter((s) => s.average > 0 || (s.semester1Average && s.semester1Average > 0)).length,
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
    const subjects = dbStore.getSubjectsWithGrades();
    const gpa = dbStore.calculateGpa();
    const luckyNumber = dbStore.getLuckyNumber();
    res.json({
      success: true,
      isConfigured: true,
      isDemo: false,
      timestamp: new Date().toISOString(),
      studentInfo: { name: 'Jakub Lis', class: '2 TI T' },
      luckyNumber,
      grades: {
        overallAverage: gpa.toString(),
        totalSubjects: subjects.length,
        gradedSubjectsCount: subjects.filter((s) => s.average > 0 || (s.semester1Average && s.semester1Average > 0)).length,
        subjects: grades
      },
      timetable: dbStore.getAllTimetable(),
      calendar: {
        events: dbStore.getEvents()
      }
    });
  }
});
