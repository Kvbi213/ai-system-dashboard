import express from 'express';
import { executeQuery } from '../database.js';
import { logError } from '../scheduler.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const logs = await executeQuery(
      "SELECT * FROM system_logs WHERE type = 'agent_summary' ORDER BY created_at DESC LIMIT 5"
    );
    res.json(logs);
  } catch (err) {
    logError('GET /api/logs', err);
    res.status(500).json({ error: 'Błąd pobierania logów.' });
  }
});

export default router;
