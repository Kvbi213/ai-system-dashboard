import { Router, Request, Response } from 'express';
import { dbStore } from '../../db/store.js';

export const pushbulletRouter = Router();

pushbulletRouter.post('/webhook', (req: Request, res: Response) => {
  const { title, body } = req.body;

  if (!body || typeof body !== 'string') {
    res.status(400).json({ error: 'INVALID_PAYLOAD', message: 'Treść powiadomienia nie może być pusta.' });
    return;
  }

  // Detect bank payment SMS (e.g. "Płatność kartą: 45,20 PLN")
  const paymentRegex = /Płatność kartą:\s*([\d,.]+)\s*PLN/i;
  const match = body.match(paymentRegex);

  if (match) {
    const rawAmount = match[1].replace(',', '.');
    const amount = parseFloat(rawAmount);
    if (!isNaN(amount) && amount > 0) {
      const tx = dbStore.addTransaction('operator-system-core', {
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

  // Detect task note
  if (body.toLowerCase().startsWith('zadanie:')) {
    const taskTitle = body.replace(/zadanie:/i, '').trim();
    const task = dbStore.addTask('operator-system-core', {
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
