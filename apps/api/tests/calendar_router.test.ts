import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import app from '../src/index.js';

describe('Calendar Domain Router (/api/calendar) & Redis Caching', () => {
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

  it('GET /api/calendar/events zwraca listę wydarzeń zawierającą listopad 2026', async () => {
    const res = await fetch(`${baseUrl}/api/calendar/events`, {
      headers: { 'x-dev-bypass': 'true' }
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('events');
    expect(Array.isArray(body.events)).toBe(true);
    expect(body.events.length).toBeGreaterThan(0);

    const novEvents = body.events.filter((e: any) => e.date && e.date.startsWith('2026-11'));
    expect(novEvents.length).toBeGreaterThanOrEqual(5);
  });

  it('POST /api/calendar/events dodaje nowe wydarzenie i inwaliduje cache', async () => {
    const payload = {
      title: 'Hackathon AI Antigravity v4',
      date: '2026-11-28',
      category: 'Wydarzenie osobiste',
      type: 'inne',
      description: 'Test integracji kalendarza'
    };

    const addRes = await fetch(`${baseUrl}/api/calendar/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-dev-bypass': 'true'
      },
      body: JSON.stringify(payload)
    });

    expect(addRes.status).toBe(201);
    const addBody = await addRes.json();
    expect(addBody.success).toBe(true);
    expect(addBody.event.title).toBe(payload.title);

    // Weryfikacja obecności w GET
    const getRes = await fetch(`${baseUrl}/api/calendar/events`, {
      headers: { 'x-dev-bypass': 'true' }
    });
    const getBody = await getRes.json();

    const added = getBody.events.find((e: any) => e.title === payload.title);
    expect(added).toBeDefined();

    // Czyszczenie
    const delRes = await fetch(`${baseUrl}/api/calendar/events/${addBody.event.id}`, {
      method: 'DELETE',
      headers: { 'x-dev-bypass': 'true' }
    });
    expect(delRes.status).toBe(200);
    const delBody = await delRes.json();
    expect(delBody.success).toBe(true);
  });

  it('GET /api/school/grades zwraca subjects ze strukturą ocen i statystykami', async () => {
    const res = await fetch(`${baseUrl}/api/school/grades`, {
      headers: { 'x-dev-bypass': 'true' }
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('grades');
    expect(body).toHaveProperty('subjects');
    expect(Array.isArray(body.subjects)).toBe(true);
    expect(body.subjects.length).toBeGreaterThan(0);

    const firstSubj = body.subjects[0];
    expect(firstSubj).toHaveProperty('name');
    expect(firstSubj).toHaveProperty('average');
    expect(firstSubj).toHaveProperty('grades');
  });
});
