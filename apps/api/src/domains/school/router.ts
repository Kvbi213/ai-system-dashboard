import { Router, Request, Response } from 'express';
import { dbStore, GradeItem } from '../../db/store.js';

export const schoolRouter = Router();

schoolRouter.get('/timetable', (req: Request, res: Response) => {
  const day = parseInt(req.query.day as string, 10) || 1;
  const lessons = dbStore.getTimetable(day);
  res.json({
    day,
    lessons,
    meta: {
      provider: 'System Dydaktyczny Sync',
      lastSynced: new Date().toISOString()
    }
  });
});

schoolRouter.get('/grades', (_req: Request, res: Response) => {
  const grades = dbStore.getGrades();
  const gpa = dbStore.calculateGpa();
  res.json({
    grades,
    stats: {
      gpa,
      luckyNumber: 21,
      totalGradesCount: grades.length,
      excellentCount: grades.filter((g: GradeItem) => g.grade >= 5).length
    }
  });
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

schoolRouter.get('/events', (_req: Request, res: Response) => {
  res.json({ events: dbStore.getEvents() });
});

// Full parity with legacy api/librus.js read-all
schoolRouter.get('/read-all', (_req: Request, res: Response) => {
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
});
