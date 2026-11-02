import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../core/authMiddleware.js';
import { dbStore } from '../../db/store.js';

export const privateRouter = Router();

// Routines
privateRouter.get('/routines', (_req: AuthenticatedRequest, res: Response) => {
  res.json({ routines: dbStore.getRoutines() });
});

privateRouter.post('/routines', (req: AuthenticatedRequest, res: Response) => {
  const { title, detail, timeOfDay } = req.body;
  if (!title) {
    res.status(400).json({ error: 'INVALID_ROUTINE', message: 'Tytuł rutyny jest wymagany.' });
    return;
  }
  const routine = dbStore.addRoutine({
    title: title.trim(),
    detail: detail ? detail.trim() : '',
    timeOfDay: timeOfDay === 'evening' ? 'evening' : 'morning'
  });
  res.status(201).json({ routine });
});

privateRouter.patch('/routines/:id/toggle', (req: AuthenticatedRequest, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
  const updated = dbStore.toggleRoutine(id);
  if (!updated) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Rutyna nie została znaleziona.' });
    return;
  }
  res.json({ routine: updated });
});

privateRouter.delete('/routines/:id', (req: AuthenticatedRequest, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
  const success = dbStore.deleteRoutine(id);
  res.json({ success });
});

// Goals
privateRouter.get('/goals', (_req: AuthenticatedRequest, res: Response) => {
  res.json({ goals: dbStore.getPersonalGoals() });
});

privateRouter.post('/goals', (req: AuthenticatedRequest, res: Response) => {
  const { title, category, current, target, unit, deadline } = req.body;
  if (!title || isNaN(parseFloat(target))) {
    res.status(400).json({ error: 'INVALID_GOAL', message: 'Tytuł oraz cel są wymagane.' });
    return;
  }
  const goal = dbStore.addPersonalGoal({
    title: title.trim(),
    category: category ? category.trim() : 'Osobiste',
    current: parseFloat(current) || 0,
    target: parseFloat(target),
    unit: unit ? unit.trim() : '%',
    deadline: deadline ? deadline.trim() : 'W tym roku'
  });
  res.status(201).json({ goal });
});

privateRouter.patch('/goals/:id/progress', (req: AuthenticatedRequest, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
  const delta = parseFloat(req.body.delta) || 1;
  const updated = dbStore.updateGoalProgress(id, delta);
  if (!updated) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Cel nie został znaleziony.' });
    return;
  }
  res.json({ goal: updated });
});

privateRouter.delete('/goals/:id', (req: AuthenticatedRequest, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
  const success = dbStore.deletePersonalGoal(id);
  res.json({ success });
});

// Journal
privateRouter.get('/journal', (_req: AuthenticatedRequest, res: Response) => {
  res.json({ entries: dbStore.getJournalEntries() });
});

privateRouter.post('/journal', (req: AuthenticatedRequest, res: Response) => {
  const { title, content, category } = req.body;
  if (!title || !content) {
    res.status(400).json({ error: 'INVALID_JOURNAL', message: 'Tytuł oraz treść wpisu są wymagane.' });
    return;
  }
  const entry = dbStore.addJournalEntry({
    title: title.trim(),
    content: content.trim(),
    category: category ? category.trim() : 'Refleksje'
  });
  res.status(201).json({ entry });
});

privateRouter.delete('/journal/:id', (req: AuthenticatedRequest, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
  const success = dbStore.deleteJournalEntry(id);
  res.json({ success });
});
