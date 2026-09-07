import express from 'express';
import { executeQuery, executeRun } from '../database.js';
import { logError } from '../scheduler.js';

const router = express.Router();

router.get('/settings', async (req, res) => {
  try {
    const rows = await executeQuery('SELECT * FROM finance_settings ORDER BY id DESC LIMIT 1');
    if (rows.length === 0) {
      res.json(null);
    } else {
      res.json(rows[0]);
    }
  } catch (err) {
    logError('GET /api/finance/settings', err);
    res.status(500).json({ error: 'Błąd pobierania ustawień finansowych.' });
  }
});

router.post('/settings', async (req, res) => {
  const { monthly_income, needs_percent, wants_percent, savings_percent } = req.body;
  try {
    await executeRun('DELETE FROM finance_settings');
    const result = await executeRun(
      'INSERT INTO finance_settings (monthly_income, needs_percent, wants_percent, savings_percent) VALUES (?, ?, ?, ?)',
      [monthly_income, needs_percent, wants_percent, savings_percent]
    );
    res.json({ success: true, id: result.id });
  } catch (err) {
    logError('POST /api/finance/settings', err);
    res.status(500).json({ error: 'Błąd zapisu ustawień finansowych.' });
  }
});

router.get('/', async (req, res) => {
  try {
    const rows = await executeQuery('SELECT * FROM finances ORDER BY transaction_date DESC');
    res.json(rows);
  } catch (err) {
    logError('GET /api/finance', err);
    res.status(500).json({ error: 'Błąd pobierania finansów.' });
  }
});

router.post('/', async (req, res) => {
  const { type, amount, currency, category, bucket, description, transaction_date } = req.body;
  if (!type || !amount || !transaction_date) {
    return res.status(400).json({ error: 'Brak wymaganych pól (type, amount, transaction_date).' });
  }
  try {
    const result = await executeRun(
      'INSERT INTO finances (type, amount, currency, category, bucket, description, transaction_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [type, amount, currency || 'PLN', category || 'Inne', bucket || null, description || '', transaction_date]
    );
    res.json({ success: true, id: result.id });
  } catch (err) {
    logError('POST /api/finance', err);
    res.status(500).json({ error: 'Błąd dodawania wpisu finansowego.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await executeRun('DELETE FROM finances WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    logError('DELETE /api/finance/:id', err);
    res.status(500).json({ error: 'Błąd usuwania wpisu finansowego.' });
  }
});

export default router;
