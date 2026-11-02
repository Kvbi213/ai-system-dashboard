import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../core/authMiddleware.js';
import { dbStore } from '../../db/store.js';

export const workoutsRouter = Router();

// Exercises
workoutsRouter.get('/exercises', (_req: AuthenticatedRequest, res: Response) => {
  res.json({ exercises: dbStore.getExercises() });
});

workoutsRouter.post('/exercises', (req: AuthenticatedRequest, res: Response) => {
  const { name, sets, reps, weightKg } = req.body;
  if (!name) {
    res.status(400).json({ error: 'INVALID_EXERCISE', message: 'Nazwa ćwiczenia jest wymagana.' });
    return;
  }
  const exercise = dbStore.addExercise({
    name: name.trim(),
    sets: parseInt(sets, 10) || 3,
    reps: parseInt(reps, 10) || 10,
    weightKg: parseFloat(weightKg) || 0
  });
  res.status(201).json({ exercise });
});

workoutsRouter.post('/exercises/:id/increment', (req: AuthenticatedRequest, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
  const updated = dbStore.incrementWorkoutSet(id);
  if (!updated) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Ćwiczenie nie zostało znalezione.' });
    return;
  }
  res.json({ exercise: updated, restTimerSeconds: 90 });
});

workoutsRouter.post('/exercises/:id/reset', (req: AuthenticatedRequest, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
  const updated = dbStore.resetExercise(id);
  if (!updated) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Ćwiczenie nie zostało znalezione.' });
    return;
  }
  res.json({ exercise: updated });
});

workoutsRouter.delete('/exercises/:id', (req: AuthenticatedRequest, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
  const success = dbStore.deleteExercise(id);
  res.json({ success });
});

// Habits
workoutsRouter.get('/habits', (_req: AuthenticatedRequest, res: Response) => {
  res.json({ habits: dbStore.getHabits() });
});

workoutsRouter.post('/habits', (req: AuthenticatedRequest, res: Response) => {
  const { title } = req.body;
  if (!title) {
    res.status(400).json({ error: 'INVALID_HABIT', message: 'Tytuł nawyku jest wymagany.' });
    return;
  }
  const habit = dbStore.addHabit(title.trim());
  res.status(201).json({ habit });
});

workoutsRouter.post('/habits/:id/toggle', (req: AuthenticatedRequest, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
  const updated = dbStore.toggleHabit(id);
  if (!updated) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Nawyk nie został znaleziony.' });
    return;
  }
  res.json({ habit: updated });
});

workoutsRouter.delete('/habits/:id', (req: AuthenticatedRequest, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
  const success = dbStore.deleteHabit(id);
  res.json({ success });
});

// Records
workoutsRouter.get('/records', (_req: AuthenticatedRequest, res: Response) => {
  res.json({ records: dbStore.getRecords() });
});

workoutsRouter.post('/records', (req: AuthenticatedRequest, res: Response) => {
  const { exercise, record, extra } = req.body;
  if (!exercise || !record) {
    res.status(400).json({ error: 'INVALID_RECORD', message: 'Ćwiczenie i wynik są wymagane.' });
    return;
  }
  const rec = dbStore.addRecord({
    exercise: exercise.trim(),
    record: record.trim(),
    extra: extra ? extra.trim() : 'Zapisany rekord',
    date: 'Dzisiaj'
  });
  res.status(201).json({ record: rec });
});

workoutsRouter.delete('/records/:exercise', (req: AuthenticatedRequest, res: Response) => {
  const exercise = Array.isArray(req.params.exercise) ? req.params.exercise[0] : String(req.params.exercise);
  const success = dbStore.deleteRecord(decodeURIComponent(exercise));
  res.json({ success });
});
