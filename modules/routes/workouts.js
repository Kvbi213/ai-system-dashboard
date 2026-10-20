import express from 'express';
import { executeQuery, executeRun } from '../database.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const workouts = await executeQuery('SELECT * FROM workouts ORDER BY date DESC, created_at DESC');
    const formatted = workouts.map(w => {
      let extra = {};
      try {
        if (w.description && w.description.startsWith('{')) {
          extra = JSON.parse(w.description);
        }
      } catch {}
      return {
        ...w,
        duration_minutes: w.duration_minutes || extra.duration_minutes || 45,
        completed_sets: w.completed_sets || extra.completed_sets || 12,
        total_sets: w.total_sets || extra.total_sets || 12,
        weight_kg: w.weight_kg || extra.weight_kg || 78.4,
        description: extra.note || w.description || 'Sesja treningowa FBW Strych'
      };
    });
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { 
      title, 
      type, 
      description, 
      date, 
      duration_minutes, 
      completed_sets, 
      total_sets, 
      weight_kg 
    } = req.body;

    const extraData = JSON.stringify({
      duration_minutes: duration_minutes || 0,
      completed_sets: completed_sets || 0,
      total_sets: total_sets || 12,
      weight_kg: weight_kg || 0,
      note: description || ''
    });

    const result = await executeRun(
      'INSERT INTO workouts (title, type, description, date) VALUES (?, ?, ?, ?)',
      [
        title || 'Full Body Workout (FBW) — Split Strych', 
        type || 'Siłowy', 
        extraData, 
        date || new Date().toISOString().split('T')[0]
      ]
    );
    res.json({ success: true, id: result.lastID, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await executeRun('DELETE FROM workouts WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
