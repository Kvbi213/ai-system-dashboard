import express from 'express';
import { executeQuery, executeRun } from '../database.js';
import { logError } from '../scheduler.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const tasks = await executeQuery('SELECT * FROM tasks ORDER BY created_at DESC');
    res.json(tasks);
  } catch (err) {
    logError('GET /api/tasks', err);
    res.status(500).json({ error: 'Błąd pobierania zadań.' });
  }
});

router.post('/', async (req, res) => {
  const { title, target_date, target_time, priority, category, recurrence_rule } = req.body;
  
  if (!title || typeof title !== 'string' || title.length > 500) {
    return res.status(400).json({ error: 'Nieprawidłowy lub zbyt długi tytuł zadania.' });
  }
  const validPriorities = ['HIGH', 'MEDIUM', 'LOW'];
  const p = validPriorities.includes(priority) ? priority : 'MEDIUM';
  try {
    const result = await executeRun(
      'INSERT INTO tasks (title, target_date, target_time, priority, category, recurrence_rule) VALUES (?, ?, ?, ?, ?, ?)',
      [title, target_date || null, target_time || null, p, category || 'jednorazowe', recurrence_rule || null]
    );
    res.json({ success: true, id: result.id });
  } catch (err) {
    logError('POST /api/tasks', err);
    res.status(500).json({ error: 'Błąd dodawania zadania.' });
  }
});

router.patch('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await executeRun('UPDATE tasks SET status = ? WHERE id = ?', [status, id]);
    res.json({ success: true });
  } catch (err) {
    logError('PATCH /api/tasks/:id/status', err);
    res.status(500).json({ error: 'Błąd aktualizacji zadania.' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (id === 'all') await executeRun('DELETE FROM tasks');
    else await executeRun('DELETE FROM tasks WHERE id = ?', [parseInt(id, 10)]);
    res.json({ success: true });
  } catch (err) {
    logError('DELETE /api/tasks/:id', err);
    res.status(500).json({ error: 'Błąd usuwania zadania.' });
  }
});

export default router;
