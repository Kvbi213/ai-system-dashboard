import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../core/authMiddleware.js';
import { dbStore } from '../../db/store.js';
import { sqliteStore } from '../../db/sqliteStore.js';

export const tasksRouter = Router();

tasksRouter.get('/', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || 'operator-system-core';
  try {
    const tasks = sqliteStore.getTasks();
    res.json({ tasks });
  } catch {
    const tasks = dbStore.getTasks(userId);
    res.json({ tasks });
  }
});

tasksRouter.post('/', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || 'operator-system-core';
  const { title, priority, category, dueDate } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    res.status(400).json({ error: 'INVALID_TITLE', message: 'Tytuł zadania nie może być pusty.' });
    return;
  }

  const validPriority = ['HIGH', 'MEDIUM', 'LOW'].includes(priority) ? priority : 'MEDIUM';
  const validCategory = category && typeof category === 'string' ? category : 'General';

  const task = sqliteStore.saveTask({
    title: title.trim(),
    priority: validPriority,
    category: validCategory,
    dueDate
  });

  dbStore.addTask(userId, {
    title: title.trim(),
    priority: validPriority,
    category: validCategory
  });

  res.status(201).json({ task });
});

tasksRouter.patch('/:id/toggle', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || 'operator-system-core';
  const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);

  const existing = sqliteStore.getTasks().find((t) => t.id === id);
  if (existing) {
    const updated = sqliteStore.updateTask(id, { completed: !existing.completed });
    dbStore.toggleTask(userId, id);
    res.json({ task: updated });
    return;
  }

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

  sqliteStore.deleteTask(id);
  const deleted = dbStore.deleteTask(userId, id);
  res.json({ success: true, id });
});
