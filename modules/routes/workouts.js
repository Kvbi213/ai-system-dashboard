import express from 'express';
import { executeQuery, executeRun } from '../database.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const workouts = await executeQuery('SELECT * FROM workouts ORDER BY date DESC, created_at DESC');
    res.json(workouts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, type, description, date } = req.body;
    const result = await executeRun(
      'INSERT INTO workouts (title, type, description, date) VALUES (?, ?, ?, ?)',
      [title, type || 'Inne', description || '', date || new Date().toISOString().split('T')[0]]
    );
    res.json(result);
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
