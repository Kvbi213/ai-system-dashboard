import express from 'express';
import { executeWebSearch } from '../search.js';
import { executeQuery } from '../database.js';
import { logError } from '../scheduler.js';

const router = express.Router();

// Pamięć podręczna w procesie Node.js chroniąca limit zapytań Brave Search
const newsMemoryCache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 godzina ważności

router.get('/', async (req, res) => {
  const query = req.query.q || 'AI technology news 2026';
  const category = req.query.category || 'ai';
  const force = req.query.force === 'true';
  const cacheKey = `${category}:${query}`;

  if (!force && newsMemoryCache.has(cacheKey)) {
    const entry = newsMemoryCache.get(cacheKey);
    if (Date.now() - entry.timestamp < CACHE_TTL_MS) {
      return res.json({ results: entry.results, cached: true, timestamp: entry.timestamp });
    }
  }

  try {
    const results = await executeWebSearch(query, { mode: 'news', count: 10 });
    newsMemoryCache.set(cacheKey, { results, timestamp: Date.now() });
    res.json({ results, cached: false, timestamp: Date.now() });
  } catch (err) {
    logError('GET /api/news', err);
    if (newsMemoryCache.has(cacheKey)) {
      return res.json({ results: newsMemoryCache.get(cacheKey).results, cached: true, fallback: true });
    }
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
