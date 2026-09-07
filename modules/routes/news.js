import express from 'express';
import { executeWebSearch } from '../search.js';
import { executeQuery } from '../database.js';
import { logError } from '../scheduler.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const query = req.query.q || 'AI technology news 2026';
  try {
    const results = await executeWebSearch(query);
    res.json({ results });
  } catch (err) {
    logError('GET /api/news', err);
    res.status(500).json({ error: 'Błąd pobierania newsów.', results: [] });
  }
});

router.get('/brief', async (req, res) => {
  try {
    const rows = await executeQuery(
      "SELECT content, created_at FROM system_logs WHERE type = 'agent_summary' ORDER BY created_at DESC LIMIT 1"
    );
    res.json(rows[0] || { content: 'Brak podsumowania.', created_at: null });
  } catch (err) {
    logError('GET /api/news-brief', err);
    res.status(500).json({ error: 'Błąd pobierania podsumowania.' });
  }
});

export default router;
