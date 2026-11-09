import { Router, Request, Response } from 'express';
import { dbStore } from '../../db/store.js';
import { sqliteStore } from '../../db/sqliteStore.js';
import { pushbulletService, SendPushSchema } from './pushbulletService.js';

export const pushbulletRouter = Router();

/**
 * GET /api/pushbullet/config
 * Zwraca status konfiguracji klucza Pushbullet (czy pochodzi z .env, bazy SQLite, oraz maskowaną wartość).
 */
pushbulletRouter.get('/config', (_req: Request, res: Response) => {
  const status = pushbulletService.getConfigStatus();
  res.json({
    ...status,
    activeKeyPreview: status.maskedKey
  });
});

/**
 * POST /api/pushbullet/config
 * Zapisuje lub aktualizuje token Pushbullet w lokalnej bazie danych SQLite.
 */
pushbulletRouter.post('/config', (req: Request, res: Response) => {
  const { token } = req.body;
  if (typeof token === 'string') {
    sqliteStore.setConfig('pushbullet_api_key', token.trim());
    res.json({
      success: true,
      message: 'Zaktualizowano token Pushbullet w bazie danych.',
      status: pushbulletService.getConfigStatus()
    });
  } else {
    res.status(400).json({ error: 'INVALID_TOKEN', message: 'Token musi być ciągiem znaków.' });
  }
});

/**
 * POST /api/pushbullet/send
 * Wysyła powiadomienie Push na smartfon operatora.
 */
pushbulletRouter.post('/send', async (req: Request, res: Response) => {
  try {
    const payload = SendPushSchema.parse(req.body);
    const result = await pushbulletService.sendPush(payload);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(502).json(result);
    }
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: err.issues ? err.issues.map((i: any) => `${i.path.join('.')}: ${i.message}`).join(', ') : err.message
    });
  }
});

/**
 * POST /api/pushbullet/test
 * Testuje łączność i ważność tokena Access-Token z Pushbullet API.
 */
pushbulletRouter.post('/test', async (req: Request, res: Response) => {
  const token = req.body?.token || req.headers['x-pushbullet-token'];
  const result = await pushbulletService.verifyToken(typeof token === 'string' ? token : undefined);

  if (result.valid) {
    res.json({
      success: true,
      user: result.user
    });
  } else {
    res.status(401).json({
      success: false,
      error: result.error
    });
  }
});

/**
 * GET /api/pushbullet/history
 * Zwraca historię ostatnich powiadomień.
 */
pushbulletRouter.get('/history', (_req: Request, res: Response) => {
  res.json({
    history: pushbulletService.getHistory()
  });
});

/**
 * POST /api/pushbullet/webhook
 * Odbiór powiadomień efemerycznych (SMS bankowe, notatki zadań).
 */
pushbulletRouter.post('/webhook', (req: Request, res: Response) => {
  const userId = (req as any).user?.id || 'operator-system-core';
  const { title, body } = req.body;

  if (!body || typeof body !== 'string') {
    res.status(400).json({ error: 'INVALID_PAYLOAD', message: 'Treść powiadomienia nie może być pusta.' });
    return;
  }

  // Wykrywanie płatności bankowej SMS (np. "Płatność kartą: 45,20 PLN")
  const paymentRegex = /Płatność kartą:\s*([\d,.]+)\s*PLN/i;
  const match = body.match(paymentRegex);

  if (match) {
    const rawAmount = match[1].replace(',', '.');
    const amount = parseFloat(rawAmount);
    if (!isNaN(amount) && amount > 0) {
      const tx = dbStore.addTransaction(userId, {
        title: title || 'Płatność automatyczna SMS',
        amount,
        envelope: 'NEEDS',
        category: 'Zakupy SMS',
        type: 'EXPENSE'
      });

      res.status(201).json({
        classifiedAs: 'TRANSACTION',
        transaction: tx
      });
      return;
    }
  }

  // Wykrywanie notatki jako zadania
  if (body.toLowerCase().startsWith('zadanie:')) {
    const taskTitle = body.replace(/zadanie:/i, '').trim();
    const task = dbStore.addTask(userId, {
      title: taskTitle,
      priority: 'HIGH',
      category: 'Pushbullet'
    });

    res.status(201).json({
      classifiedAs: 'TASK',
      task
    });
    return;
  }

  res.json({
    classifiedAs: 'GENERIC_NOTIFICATION',
    receivedAt: new Date().toISOString()
  });
});
