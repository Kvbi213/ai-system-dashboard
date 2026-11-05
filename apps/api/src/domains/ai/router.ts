import { Router, Request, Response } from 'express';
import { llmGateway } from './llmGateway.js';

export const aiRouter = Router();

aiRouter.get('/models', (_req: Request, res: Response) => {
  res.json({
    models: [
      { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B (Groq Engine)', speed: '500 t/s', recommended: true },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Google Cloud)', speed: '240 t/s', recommended: false },
      { id: 'openai/gpt-oss-20b', name: 'GPT-OSS 20B (Groq Edge Fast)', speed: '750 t/s', recommended: false },
      { id: 'omnidash-deterministic-core-v4', name: 'Lokalny Rdzeń Zero-Trust', speed: 'Instant (<5ms)', recommended: false }
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

  try {
    const result = await llmGateway.complete({
      message,
      userId: (req as any).user?.id,
      history: Array.isArray(history) ? history : []
    });

    // Check if client requests SSE streaming
    if (req.headers.accept === 'text/event-stream') {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const words = result.reply.split(' ');
      for (const word of words) {
        res.write(`data: ${JSON.stringify({ token: word + ' ' })}\n\n`);
        await new Promise((resolve) => setTimeout(resolve, 20));
      }

      if (result.toolCall) {
        res.write(`data: ${JSON.stringify({ toolCall: result.toolCall })}\n\n`);
      }

      res.write(`data: ${JSON.stringify({ meta: { provider: result.provider, model: result.model, latencyMs: result.latencyMs, fallbackCount: result.fallbackCount } })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    // Standard JSON response
    res.json({
      reply: result.reply,
      provider: result.provider,
      model: result.model,
      latencyMs: result.latencyMs,
      tokensUsed: result.tokensUsed,
      toolCall: result.toolCall,
      fallbackCount: result.fallbackCount,
      timestamp: new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
    });
  } catch (error) {
    console.error('[!] AI Gateway error:', error);
    res.status(500).json({
      error: 'AI_ROUTING_FAILED',
      message: error instanceof Error ? error.message : 'Nieoczekiwany błąd silnika AI.'
    });
  }
});
