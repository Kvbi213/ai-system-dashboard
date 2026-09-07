import express from 'express';
import { executeQuery, executeRun } from '../database.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const lessons = await executeQuery('SELECT * FROM timetable ORDER BY day ASC, time_start ASC');
    res.json(lessons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { id, day, subject, time_start, time_end, room, teacher, type, color, notes } = req.body;
    const lessonId = String(id || Date.now());
    const result = await executeRun(
      'INSERT INTO timetable (id, day, subject, time_start, time_end, room, teacher, type, color, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [lessonId, day || 'monday', subject, time_start || '08:00', time_end || '09:30', room || '', teacher || '', type || 'Wykład', color || 'indigo', notes || '']
    );
    res.json({ success: true, id: lessonId, ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { day, subject, time_start, time_end, room, teacher, type, color, notes } = req.body;
    await executeRun(
      'UPDATE timetable SET day = ?, subject = ?, time_start = ?, time_end = ?, room = ?, teacher = ?, type = ?, color = ?, notes = ? WHERE id = ?',
      [day, subject, time_start, time_end, room, teacher, type, color, notes, id]
    );
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await executeRun('DELETE FROM timetable WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
