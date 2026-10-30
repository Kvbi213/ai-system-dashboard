import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../core/authMiddleware.js';
import { dbStore } from '../../db/store.js';

export const workoutsRouter = Router();

workoutsRouter.get('/exercises', (_req: AuthenticatedRequest, res: Response) => {
  res.json({ exercises: dbStore.getExercises() });
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

workoutsRouter.get('/habits', (_req: AuthenticatedRequest, res: Response) => {
  res.json({ habits: dbStore.getHabits() });
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

workoutsRouter.get('/records', (_req: AuthenticatedRequest, res: Response) => {
  res.json({ records: dbStore.getRecords() });
});
