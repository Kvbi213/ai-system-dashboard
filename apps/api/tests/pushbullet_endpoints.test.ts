import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import app from '../src/index.js';
import http from 'http';
import { pushbulletService } from '../src/domains/pushbullet/pushbulletService.js';

describe('Pushbullet Domain Endpoints Suite', () => {
  let server: http.Server;
  let baseUrl: string;
  let originalWebhookSecret: string | undefined;
  const authHeaders = {
    'Content-Type': 'application/json',
    'x-dev-bypass': 'true'
  };

  beforeAll(async () => {
    originalWebhookSecret = process.env.PUSHBULLET_WEBHOOK_SECRET;
    process.env.PUSHBULLET_WEBHOOK_SECRET = 'omnidash-test-webhook-secret-999';
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        if (typeof addr === 'object' && addr) {
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (originalWebhookSecret !== undefined) {
      process.env.PUSHBULLET_WEBHOOK_SECRET = originalWebhookSecret;
    } else {
      delete process.env.PUSHBULLET_WEBHOOK_SECRET;
    }
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  beforeEach(() => {
    pushbulletService.clearHistory();
    process.env.PUSHBULLET_WEBHOOK_SECRET = 'omnidash-test-webhook-secret-999';
  });

  afterEach(() => {
    if (originalWebhookSecret !== undefined) {
      process.env.PUSHBULLET_WEBHOOK_SECRET = originalWebhookSecret;
    } else {
      delete process.env.PUSHBULLET_WEBHOOK_SECRET;
    }
  });

  it('POST /api/pushbullet/send sends push in simulated mode when no live API key', async () => {
    const res = await fetch(`${baseUrl}/api/pushbullet/send`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'Testowy Alert OmniDash',
        body: 'Treść testowa powiadomienia na smartfon.',
        priority: 'HIGH'
      })
    });

    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(data.success).toBe(true);
    expect(data.iden).toBeDefined();
    expect(data.sentAt).toBeDefined();

    const history = pushbulletService.getHistory();
    expect(history.length).toBe(1);
    expect(history[0].title).toBe('Testowy Alert OmniDash');
    expect(history[0].priority).toBe('HIGH');
  });

  it('POST /api/pushbullet/send returns 400 on invalid payload (missing body)', async () => {
    const res = await fetch(`${baseUrl}/api/pushbullet/send`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'Tylko tytuł'
      })
    });

    expect(res.status).toBe(400);
    const data: any = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('body');
  });

  it('POST /api/pushbullet/test verifies valid dev/mock token', async () => {
    const res = await fetch(`${baseUrl}/api/pushbullet/test`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        token: 'test_token_valid'
      })
    });

    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(data.success).toBe(true);
    expect(data.user).toBeDefined();
    expect(data.user.name).toContain('Jakub Lis');
  });

  it('POST /api/pushbullet/test returns 401 when token is missing and no env var', async () => {
    const originalKey = process.env.PUSHBULLET_API_KEY;
    delete process.env.PUSHBULLET_API_KEY;

    try {
      const res = await fetch(`${baseUrl}/api/pushbullet/test`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({})
      });

      expect(res.status).toBe(401);
      const data: any = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    } finally {
      process.env.PUSHBULLET_API_KEY = originalKey;
    }
  });

  it('GET /api/pushbullet/history returns recorded history', async () => {
    await fetch(`${baseUrl}/api/pushbullet/send`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'Historia 1',
        body: 'Wiadomość 1'
      })
    });

    const res = await fetch(`${baseUrl}/api/pushbullet/history`, {
      headers: authHeaders
    });
    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(Array.isArray(data.history)).toBe(true);
    expect(data.history.length).toBe(1);
    expect(data.history[0].title).toBe('Historia 1');
  });

  it('POST /api/pushbullet/webhook rejects unauthenticated access (no secret or token)', async () => {
    process.env.PUSHBULLET_WEBHOOK_SECRET = 'omnidash-test-webhook-secret-999';
    const res = await fetch(`${baseUrl}/api/pushbullet/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: 'zadanie: Zrobić zakupy' })
    });
    expect(res.status).toBe(401);
  });

  it('POST /api/pushbullet/webhook returns 503 when PUSHBULLET_WEBHOOK_SECRET is unconfigured', async () => {
    const orig = process.env.PUSHBULLET_WEBHOOK_SECRET;
    delete process.env.PUSHBULLET_WEBHOOK_SECRET;
    try {
      const res = await fetch(`${baseUrl}/api/pushbullet/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: 'zadanie: Test' })
      });
      expect(res.status).toBe(503);
    } finally {
      process.env.PUSHBULLET_WEBHOOK_SECRET = orig;
    }
  });

  it('POST /api/pushbullet/webhook cannot be bypassed by x-dev-bypass header without secret', async () => {
    const res = await fetch(`${baseUrl}/api/pushbullet/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-dev-bypass': 'true'
      },
      body: JSON.stringify({ body: 'zadanie: Próba ominięcia zabezpieczenia' })
    });
    expect(res.status).toBe(401);
  });

  it('POST /api/pushbullet/webhook accepts request with valid x-webhook-secret and classifies task', async () => {
    process.env.PUSHBULLET_WEBHOOK_SECRET = 'omnidash-test-webhook-secret-999';
    const res = await fetch(`${baseUrl}/api/pushbullet/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': 'omnidash-test-webhook-secret-999'
      },
      body: JSON.stringify({ body: 'zadanie: Przetestować webhook Zero-Trust' })
    });
    expect(res.status).toBe(201);
    const data: any = await res.json();
    expect(data.classifiedAs).toBe('TASK');
    expect(data.task.title).toBe('Przetestować webhook Zero-Trust');
  });
});
