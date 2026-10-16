import express from 'express';
import { executeQuery, executeRun } from '../database.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const lessons = await executeQuery('SELECT * FROM timetable ORDER BY day ASC, time_start ASC');
    const mapped = (lessons || []).map(l => ({
      ...l,
      category: l.category || (String(l.id).startsWith('personal_') || l.type === 'Osobiste' ? 'personal' : 'school'),
      isPersonal: l.category === 'personal' || String(l.id).startsWith('personal_') || l.type === 'Osobiste'
    }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { id, day, subject, time_start, time_end, room, teacher, type, color, notes, category } = req.body;
    const lessonId = String(id || Date.now());
    const isPersonal = category === 'personal' || String(lessonId).startsWith('personal_') || type === 'Osobiste';
    const finalCategory = isPersonal ? 'personal' : (category || 'school');
    const result = await executeRun(
      'INSERT INTO timetable (id, day, subject, time_start, time_end, room, teacher, type, color, notes, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [lessonId, day || 'monday', subject, time_start || '08:00', time_end || '09:30', room || '', teacher || '', type || 'Wykład', color || 'indigo', notes || '', finalCategory]
    );
    res.json({ success: true, id: lessonId, category: finalCategory, ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { day, subject, time_start, time_end, room, teacher, type, color, notes, category } = req.body;
    const isPersonal = category === 'personal' || String(id).startsWith('personal_') || type === 'Osobiste';
    const finalCategory = isPersonal ? 'personal' : (category || 'school');
    await executeRun(
      'UPDATE timetable SET day = ?, subject = ?, time_start = ?, time_end = ?, room = ?, teacher = ?, type = ?, color = ?, notes = ?, category = ? WHERE id = ?',
      [day, subject, time_start, time_end, room, teacher, type, color, notes, finalCategory, id]
    );
    res.json({ success: true, id, category: finalCategory });
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
