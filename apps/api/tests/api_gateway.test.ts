import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../src/index';
import http from 'http';

describe('OmniDash API Gateway Integration Suite', () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
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
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('GET /api/system/health returns 200 OK', async () => {
    const res = await fetch(`${baseUrl}/api/system/health`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('ok');
    expect(data.version).toBe('4.0.0');
  });

  it('POST /api/auth/dev-login returns dev token', async () => {
    const res = await fetch(`${baseUrl}/api/auth/dev-login`, {
      method: 'POST'
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.token).toBe('dev-operator-token');
    expect(data.user.role).toBe('ADMIN');
  });

  it('POST & GET /api/tasks with dev token', async () => {
    const createRes = await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer dev-operator-token'
      },
      body: JSON.stringify({
        title: 'Przetestować API Gateway',
        priority: 'HIGH',
        category: 'Test'
      })
    });
    expect(createRes.status).toBe(201);
    const createData = await createRes.json();
    expect(createData.task.title).toBe('Przetestować API Gateway');

    const getRes = await fetch(`${baseUrl}/api/tasks`, {
      headers: { Authorization: 'Bearer dev-operator-token' }
    });
    expect(getRes.status).toBe(200);
    const getData = await getRes.json();
    expect(getData.tasks.length).toBeGreaterThan(0);
  });

  it('GET /api/finance/overview returns 50/30/20 breakdown', async () => {
    const res = await fetch(`${baseUrl}/api/finance/overview`, {
      headers: { Authorization: 'Bearer dev-operator-token' }
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.summary.envelopes.needs).toBeDefined();
    expect(data.subscriptions.length).toBeGreaterThan(0);
  });

  it('POST /api/ai/chat returns intelligent reasoning reply', async () => {
    const res = await fetch(`${baseUrl}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer dev-operator-token'
      },
      body: JSON.stringify({ message: 'Jaki mam dzisiaj plan lekcji?' })
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.reply).toBeDefined();
    expect(data.toolCall).toBeDefined();
    expect(data.toolCall.toolName).toBe('timetable_get_schedule');
  });

  it('POST /api/pushbullet/webhook parses bank SMS and creates transaction', async () => {
    const res = await fetch(`${baseUrl}/api/pushbullet/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer dev-operator-token'
      },
      body: JSON.stringify({
        title: 'Bank Alert',
        body: 'Płatność kartą: 54,90 PLN w Księgarni Dnia'
      })
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.classifiedAs).toBe('TRANSACTION');
    expect(data.transaction.amount).toBe(54.90);
  });
});
