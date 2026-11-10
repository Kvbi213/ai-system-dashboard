import { Router, Request, Response } from 'express';
import { llmGateway } from './llmGateway.js';
import { sqliteStore } from '../../db/sqliteStore.js';

export const aiRouter = Router();

function maskApiKey(key: string): string {
  if (!key) return '';
  const trimmed = key.trim();
  if (trimmed.length <= 8) return '••••••••';
  return `${trimmed.slice(0, 4)}••••••••${trimmed.slice(-4)}`;
}

function getActiveGroqKey(): { key: string; source: 'database' | 'env' | 'none' } {
  const dbKey = sqliteStore.getConfig('groq_api_key');
  if (dbKey && dbKey.trim().length > 0) {
    return { key: dbKey.trim(), source: 'database' };
  }
  const envKey = process.env.GROQ_API_KEY;
  if (envKey && envKey.trim().length > 0) {
    return { key: envKey.trim(), source: 'env' };
  }
  return { key: '', source: 'none' };
}

function getActiveGeminiKey(): { key: string; source: 'database' | 'env' | 'none' } {
  const dbKey = sqliteStore.getConfig('gemini_api_key');
  if (dbKey && dbKey.trim().length > 0) {
    return { key: dbKey.trim(), source: 'database' };
  }
  const envKey = process.env.GEMINI_API_KEY;
  if (envKey && envKey.trim().length > 0) {
    return { key: envKey.trim(), source: 'env' };
  }
  return { key: '', source: 'none' };
}

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

/**
 * GET /api/ai/status
 * Weryfikuje aktywny klucz AI i zwraca rzeczywisty stan połączenia.
 */
aiRouter.get('/status', async (_req: Request, res: Response) => {
  const groq = getActiveGroqKey();
  const gemini = getActiveGeminiKey();

  let groqStatus = { connected: false, error: 'Brak klucza API Groq' };
  if (groq.key) {
    const res = await llmGateway.testGroqKey(groq.key);
    groqStatus = { connected: res.ok, error: res.error || (res.ok ? null as any : 'Błąd połączenia') };
  }

  let geminiStatus = { connected: false, error: 'Brak klucza API Gemini' };
  if (gemini.key) {
    const res = await llmGateway.testGeminiKey(gemini.key);
    geminiStatus = { connected: res.ok, error: res.error || (res.ok ? null as any : 'Błąd połączenia') };
  }

  const isConnected = groqStatus.connected || geminiStatus.connected;
  const activeProvider = groqStatus.connected ? 'groq' : (geminiStatus.connected ? 'gemini' : (groq.key ? 'groq' : (gemini.key ? 'gemini' : 'local')));

  res.json({
    connected: isConnected,
    provider: activeProvider,
    model: activeProvider === 'gemini' ? 'gemini-2.0-flash' : (activeProvider === 'groq' ? 'openai/gpt-oss-120b' : 'omnidash-deterministic-core-v4'),
    source: groq.source !== 'none' ? groq.source : gemini.source,
    maskedKey: groq.key ? maskApiKey(groq.key) : (gemini.key ? maskApiKey(gemini.key) : ''),
    configured: Boolean(groq.key || gemini.key),
    groq: {
      configured: Boolean(groq.key),
      source: groq.source,
      maskedKey: maskApiKey(groq.key),
      connected: groqStatus.connected,
      error: groqStatus.error
    },
    gemini: {
      configured: Boolean(gemini.key),
      source: gemini.source,
      maskedKey: maskApiKey(gemini.key),
      connected: geminiStatus.connected,
      error: geminiStatus.error
    },
    error: isConnected ? null : (groq.key ? groqStatus.error : (gemini.key ? geminiStatus.error : 'Wymagany klucz API'))
  });
});

/**
 * POST /api/ai/config
 * Zapisuje nowy klucz API (Groq lub Gemini) w bazie SQLite po weryfikacji połączenia.
 */
aiRouter.post('/config', async (req: Request, res: Response) => {
  const { apiKey, groqApiKey, geminiApiKey, provider } = req.body || {};
  const targetProvider = provider === 'gemini' || geminiApiKey ? 'gemini' : 'groq';
  const rawKey = targetProvider === 'gemini' ? (geminiApiKey || apiKey) : (groqApiKey || apiKey);

  if (typeof rawKey !== 'string' || !rawKey.trim()) {
    res.status(400).json({
      success: false,
      message: 'Klucz API nie może być pusty.',
      status: {
        connected: false,
        provider: targetProvider,
        model: targetProvider === 'gemini' ? 'gemini-2.0-flash' : 'openai/gpt-oss-120b',
        source: 'none',
        maskedKey: '',
        error: 'Pusty klucz API'
      }
    });
    return;
  }

  const trimmedKey = rawKey.trim();
  if (targetProvider === 'gemini') {
    const test = await llmGateway.testGeminiKey(trimmedKey);
    if (test.ok) {
      sqliteStore.setConfig('gemini_api_key', trimmedKey);
      res.json({
        success: true,
        message: 'Klucz Gemini API zweryfikowany pomyślnie i zapisany w bazie danych.',
        status: {
          connected: true,
          provider: 'gemini',
          model: 'gemini-2.0-flash',
          source: 'database',
          maskedKey: maskApiKey(trimmedKey),
          error: null
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: test.error || 'Nieprawidłowy klucz API Gemini.',
        status: {
          connected: false,
          provider: 'gemini',
          model: 'gemini-2.0-flash',
          source: 'none',
          maskedKey: maskApiKey(trimmedKey),
          error: test.error || 'Nieprawidłowy klucz API Gemini'
        }
      });
    }
  } else {
    const test = await llmGateway.testGroqKey(trimmedKey);
    if (test.ok) {
      sqliteStore.setConfig('groq_api_key', trimmedKey);
      res.json({
        success: true,
        message: 'Klucz Groq API zweryfikowany pomyślnie i zapisany w bazie danych.',
        status: {
          connected: true,
          provider: 'groq',
          model: 'openai/gpt-oss-120b',
          source: 'database',
          maskedKey: maskApiKey(trimmedKey),
          error: null
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: test.error || 'Nieprawidłowy klucz API Groq.',
        status: {
          connected: false,
          provider: 'groq',
          model: 'openai/gpt-oss-120b',
          source: 'none',
          maskedKey: maskApiKey(trimmedKey),
          error: test.error || 'Nieprawidłowy klucz API Groq'
        }
      });
    }
  }
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

      if (result.widgets && result.widgets.length > 0) {
        res.write(`data: ${JSON.stringify({ widgets: result.widgets })}\n\n`);
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
      widgets: result.widgets || [],
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
