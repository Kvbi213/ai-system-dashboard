import express from 'express';
import { executeQuery, executeRun } from '../database.js';
import { logError, getScheduleQueue } from '../scheduler.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const events = await executeQuery('SELECT * FROM calendar_events ORDER BY event_date ASC');
    res.json(events);
  } catch (err) {
    logError('GET /api/calendar', err);
    res.status(500).json({ error: 'Błąd pobierania kalendarza.' });
  }
});

router.post('/', async (req, res) => {
  const { title, event_date, event_time, description, recurrence_rule, reminder_minutes } = req.body;
  try {
    const result = await executeRun(
      'INSERT INTO calendar_events (title, event_date, event_time, description, recurrence_rule, reminder_minutes) VALUES (?, ?, ?, ?, ?, ?)',
      [title, event_date, event_time || null, description || null, recurrence_rule || null, reminder_minutes || null]
    );
    res.json({ success: true, id: result.id });
  } catch (err) {
    logError('POST /api/calendar', err);
    res.status(500).json({ error: 'Błąd dodawania wydarzenia.' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (id === 'all') await executeRun('DELETE FROM calendar_events');
    else await executeRun('DELETE FROM calendar_events WHERE id = ?', [parseInt(id, 10)]);
    res.json({ success: true });
  } catch (err) {
    logError('DELETE /api/calendar/:id', err);
    res.status(500).json({ error: 'Błąd usuwania wydarzenia.' });
  }
});

router.get('/schedule', (req, res) => {
  try {
    const queue = getScheduleQueue();
    res.json({ jobs: queue, count: queue.length });
  } catch (err) {
    logError('GET /api/schedule', err);
    res.status(500).json({ error: 'Błąd pobierania kolejki schedulera.' });
  }
});

export default router;
