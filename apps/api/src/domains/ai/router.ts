import { Router, Request, Response } from 'express';
import { dbStore, LessonItem } from '../../db/store.js';

export const aiRouter = Router();

aiRouter.get('/models', (_req: Request, res: Response) => {
  res.json({
    models: [
      { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B (Groq Engine)', speed: '500 t/s', recommended: true },
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', speed: '380 t/s', recommended: false },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Google Cloud)', speed: '240 t/s', recommended: false }
    ],
    activeModel: 'openai/gpt-oss-120b'
  });
});

aiRouter.post('/chat', async (req: Request, res: Response) => {
  const { message, history } = req.body;

  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: 'INVALID_MESSAGE', message: 'Wiadomość nie może być pusta.' });
    return;
  }

  const query = message.toLowerCase();
  let replyText = 'Zrozumiałem zapytanie. Przetwarzam polecenie w środowisku Zero-Trust.';
  let toolCall: { toolName: string; args: Record<string, unknown>; output: string } | undefined = undefined;

  if (query.includes('plan') || query.includes('lekcj')) {
    const timetable = dbStore.getTimetable(1);
    replyText = `W dzisiejszym harmonogramie masz zaplanowane ${timetable.length} bloków zajęć: ` +
      timetable.map((t: LessonItem) => `${t.subject} (${t.classroom})`).join(', ') + '.';
    toolCall = {
      toolName: 'timetable_get_schedule',
      args: { day: 1 },
      output: JSON.stringify({ count: timetable.length, status: 'synced' })
    };
  } else if (query.includes('radar') || query.includes('tras')) {
    const radars = dbStore.getSpeedRadars();
    replyText = `Sprawdziłem status tras i rejestr CANARD: ${radars.length} aktywnych stacji pomiarowych. Brak utrudnień na głównych odcinkach tranzytowych.`;
    toolCall = {
      toolName: 'canard_query_radars',
      args: { region: 'metropolitalny' },
      output: JSON.stringify({ activeRadars: radars.length, flow: 'smooth' })
    };
  } else if (query.includes('ocen') || query.includes('średni')) {
    const gpa = dbStore.calculateGpa();
    replyText = `Średnia ważona ocen wynosi obecnie ${gpa}. Szczęśliwy numerek na dzisiaj to 21.`;
    toolCall = {
      toolName: 'grades_get_gpa',
      args: { semester: 2 },
      output: JSON.stringify({ gpa, luckyNumber: 21 })
    };
  } else if (query.includes('zadanie') || query.includes('dodaj zadanie')) {
    const newTask = dbStore.addTask('operator-system-core', {
      title: message.replace(/dodaj zadanie/i, '').trim() || 'Nowe zadanie z asystenta AI',
      priority: 'HIGH',
      category: 'AI Assistant'
    });
    replyText = `Utworzyłem nowe zadanie w rejestrze wykonawczym: "${newTask.title}".`;
    toolCall = {
      toolName: 'task_create',
      args: { title: newTask.title, priority: 'HIGH' },
      output: JSON.stringify({ id: newTask.id, created: true })
    };
  }

  // Check if client supports SSE streaming
  if (req.headers.accept === 'text/event-stream') {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Stream tokens
    const words = replyText.split(' ');
    for (const word of words) {
      res.write(`data: ${JSON.stringify({ token: word + ' ' })}\n\n`);
      await new Promise((resolve) => setTimeout(resolve, 30));
    }

    if (toolCall) {
      res.write(`data: ${JSON.stringify({ toolCall })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }

  // Standard JSON response
  res.json({
    reply: replyText,
    toolCall,
    timestamp: new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
  });
});
