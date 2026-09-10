import express from 'express';
import { executeQuery } from '../database.js';
import { sendPushNotification } from '../pushbullet.js';

const router = express.Router();

router.get('/notifications', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const notifications = await executeQuery('SELECT * FROM phone_notifications ORDER BY created_at DESC LIMIT ?', [limit]);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/status', (req, res) => {
  const apiKey = process.env.PUSHBULLET_API_KEY;
  const isConfigured = Boolean(apiKey && apiKey !== 'twój_klucz_pushbullet_tutaj' && apiKey !== 'your_pushbullet_api_key');
  res.json({
    service: 'pushbullet',
    configured: isConfigured,
    timestamp: new Date().toISOString()
  });
});

router.post('/push', async (req, res) => {
  const { title, body } = req.body;
  if (!body) {
    return res.status(400).json({ error: 'Treść powiadomienia (body) jest wymagana.' });
  }

  try {
    const result = await sendPushNotification(title || 'OmniDash System', body);
    if (result.success) {
      res.json({ success: true, iden: result.iden, message: 'Pomyślnie wysłano powiadomienie na telefon.' });
    } else {
      res.status(502).json({ success: false, error: result.error || 'Błąd dostarczenia wiadomości przez bramę Pushbullet.' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Błąd wewnętrzny serwera podczas wysyłania powiadomienia.', details: err.message });
  }
});

router.post('/test', async (req, res) => {
  try {
    const result = await sendPushNotification('OmniDash Test 📲', 'To jest testowe powiadomienie z systemu OmniDash.');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

