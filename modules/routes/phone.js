import express from 'express';
import { executeQuery } from '../database.js';

const router = express.Router();

router.get('/notifications', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const notifications = await executeQuery('SELECT * FROM phone_notifications ORDER BY created_at DESC LIMIT ?', [limit]);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
