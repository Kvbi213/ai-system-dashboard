import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../core/authMiddleware.js';
import { dbStore } from '../../db/store.js';

export const tasksRouter = Router();

tasksRouter.get('/', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || 'operator-system-core';
  const tasks = dbStore.getTasks(userId);
  res.json({ tasks });
});

tasksRouter.post('/', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || 'operator-system-core';
  const { title, priority, category } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    res.status(400).json({ error: 'INVALID_TITLE', message: 'Tytuł zadania nie może być pusty.' });
    return;
  }

  const validPriority = ['HIGH', 'MEDIUM', 'LOW'].includes(priority) ? priority : 'MEDIUM';
  const validCategory = category && typeof category === 'string' ? category : 'General';

  const task = dbStore.addTask(userId, {
    title: title.trim(),
    priority: validPriority,
    category: validCategory
  });

  res.status(201).json({ task });
});

tasksRouter.patch('/:id/toggle', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || 'operator-system-core';
  const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);

  const task = dbStore.toggleTask(userId, id);
  if (!task) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Zadanie nie zostało znalezione.' });
    return;
  }

  res.json({ task });
});

tasksRouter.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || 'operator-system-core';
  const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);

  const deleted = dbStore.deleteTask(userId, id);
  if (!deleted) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Zadanie nie zostało znalezione.' });
    return;
  }

  res.json({ success: true, id });
});
