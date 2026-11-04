import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../core/authMiddleware.js';
import { dbStore, SchoolEvent } from '../../db/store.js';
import { redisCache } from '../../core/redisCache.js';

export const calendarRouter = Router();

// GET /api/calendar/events - Zwraca listę wszystkich wydarzeń (szkolne + osobiste) z bufora cache
calendarRouter.get('/events', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const data = await redisCache.getOrSet('calendar:events:all', 300, async () => {
      const events = dbStore.getEvents();
      return {
        events,
        total: events.length,
        cachedAt: new Date().toISOString()
      };
    });

    res.json(data);
  } catch (err: any) {
    console.warn('[!] Błąd cache kalendarza, fallback do store:', err);
    const events = dbStore.getEvents();
    res.json({
      events,
      total: events.length,
      cachedAt: new Date().toISOString()
    });
  }
});

// POST /api/calendar/events - Dodaje nowe wydarzenie i inwaliduje cache
calendarRouter.post('/events', async (req: AuthenticatedRequest, res: Response) => {
  const { title, date, category, description, type, teacher, time, subject } = req.body;

  if (!title || !date) {
    res.status(400).json({
      error: 'INVALID_EVENT',
      message: 'Parametry "title" oraz "date" (format YYYY-MM-DD) są wymagane.'
    });
    return;
  }

  const newEvent = dbStore.addSchoolEvent({
    title: String(title).trim(),
    date: String(date).trim(),
    category: category ? String(category).trim() : 'Wydarzenie osobiste',
    type: (type || (category === 'Sprawdzian' ? 'sprawdzian' : category === 'Kartkówka' ? 'kartkowka' : 'inne')) as any,
    description: description ? String(description).trim() : undefined,
    teacher: teacher ? String(teacher).trim() : undefined,
    time: time ? String(time).trim() : undefined,
    subject: subject ? String(subject).trim() : undefined
  });

  // Inwalidacja cache
  await redisCache.invalidatePattern('calendar:*');
  await redisCache.invalidatePattern('school:*');

  res.status(201).json({
    success: true,
    event: newEvent
  });
});

// DELETE /api/calendar/events/:id - Usuwa wydarzenie i inwaliduje cache
calendarRouter.delete('/events/:id', async (req: AuthenticatedRequest, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
  const success = dbStore.deleteSchoolEvent(id);

  if (success) {
    await redisCache.invalidatePattern('calendar:*');
    await redisCache.invalidatePattern('school:*');
  }

  res.json({ success });
});
