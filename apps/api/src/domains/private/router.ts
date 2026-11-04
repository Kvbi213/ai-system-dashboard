import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../core/authMiddleware.js';
import { dbStore } from '../../db/store.js';
import { redisCache } from '../../core/redisCache.js';

export const privateRouter = Router();

// Routines
privateRouter.get('/routines', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const data = await redisCache.getOrSet('private:routines', 600, async () => {
      return { routines: dbStore.getRoutines() };
    });
    res.json(data);
  } catch {
    res.json({ routines: dbStore.getRoutines() });
  }
});

privateRouter.post('/routines', async (req: AuthenticatedRequest, res: Response) => {
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
  await redisCache.invalidatePattern('private:routines*');
  res.status(201).json({ routine });
});

privateRouter.patch('/routines/:id/toggle', async (req: AuthenticatedRequest, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
  const updated = dbStore.toggleRoutine(id);
  if (!updated) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Rutyna nie została znaleziona.' });
    return;
  }
  await redisCache.invalidatePattern('private:routines*');
  res.json({ routine: updated });
});

privateRouter.delete('/routines/:id', async (req: AuthenticatedRequest, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
  const success = dbStore.deleteRoutine(id);
  if (success) {
    await redisCache.invalidatePattern('private:routines*');
  }
  res.json({ success });
});

// Goals
privateRouter.get('/goals', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const data = await redisCache.getOrSet('private:goals', 600, async () => {
      return { goals: dbStore.getPersonalGoals() };
    });
    res.json(data);
  } catch {
    res.json({ goals: dbStore.getPersonalGoals() });
  }
});

privateRouter.post('/goals', async (req: AuthenticatedRequest, res: Response) => {
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
  await redisCache.invalidatePattern('private:goals*');
  res.status(201).json({ goal });
});

privateRouter.patch('/goals/:id/progress', async (req: AuthenticatedRequest, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
  const delta = parseFloat(req.body.delta) || 1;
  const updated = dbStore.updateGoalProgress(id, delta);
  if (!updated) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Cel nie został znaleziony.' });
    return;
  }
  await redisCache.invalidatePattern('private:goals*');
  res.json({ goal: updated });
});

privateRouter.delete('/goals/:id', async (req: AuthenticatedRequest, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
  const success = dbStore.deletePersonalGoal(id);
  if (success) {
    await redisCache.invalidatePattern('private:goals*');
  }
  res.json({ success });
});

// Journal
privateRouter.get('/journal', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const data = await redisCache.getOrSet('private:journal', 600, async () => {
      return { entries: dbStore.getJournalEntries() };
    });
    res.json(data);
  } catch {
    res.json({ entries: dbStore.getJournalEntries() });
  }
});

privateRouter.post('/journal', async (req: AuthenticatedRequest, res: Response) => {
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
  await redisCache.invalidatePattern('private:journal*');
  res.status(201).json({ entry });
});

privateRouter.delete('/journal/:id', async (req: AuthenticatedRequest, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
  const success = dbStore.deleteJournalEntry(id);
  if (success) {
    await redisCache.invalidatePattern('private:journal*');
  }
  res.json({ success });
});
