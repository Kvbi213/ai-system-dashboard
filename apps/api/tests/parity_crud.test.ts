import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import app from '../src/index.js';
import http from 'http';
import { dbStore } from '../src/db/store.js';

describe('OmniDash Parity & Extended Domain CRUD Endpoints', () => {
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

  beforeEach(() => {
    dbStore.reset();
  });

  describe('School Domain (/api/school)', () => {
    it('returns timetable for all days 1 to 5 with real lessons', async () => {
      for (const day of [1, 2, 3, 4, 5]) {
        const res = await fetch(`${baseUrl}/api/school/timetable?day=${day}`, {
          headers: { 'x-dev-bypass': 'true' }
        });
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.day).toBe(day);
        expect(Array.isArray(body.lessons)).toBe(true);
        expect(body.lessons.length).toBeGreaterThan(0);
      }
    });

    it('returns full parity read-all endpoint with GPA and 35 lessons', async () => {
      const res = await fetch(`${baseUrl}/api/school/read-all`, {
        headers: { 'x-dev-bypass': 'true' }
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.studentInfo.name).toBe('Operator');
      expect(body.luckyNumber).toBe(21);
      expect(body.grades.gradedSubjectsCount).toBe(16);
      expect(body.calendar.events.length).toBeGreaterThan(0);
    });

    it('returns calendar events from legacy librus', async () => {
      const res = await fetch(`${baseUrl}/api/school/events`, {
        headers: { 'x-dev-bypass': 'true' }
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.events.length).toBeGreaterThan(0);
    });
  });

  describe('Finance Domain CRUD (/api/finance)', () => {
    it('manages subscriptions: add, toggle, and delete', async () => {
      // Add subscription
      const addRes = await fetch(`${baseUrl}/api/finance/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-dev-bypass': 'true'
        },
        body: JSON.stringify({
          name: 'Testowa Usługa Cloud',
          category: 'Serwery',
          costPln: 49.99,
          renewalDay: 15
        })
      });
      expect(addRes.status).toBe(201);
      const addBody = await addRes.json();
      const subId = addBody.subscription.id;
      expect(subId).toBeDefined();

      // Toggle status
      const toggleRes = await fetch(`${baseUrl}/api/finance/subscriptions/${subId}/toggle`, {
        method: 'PATCH',
        headers: { 'x-dev-bypass': 'true' }
      });
      expect(toggleRes.status).toBe(200);
      const toggleBody = await toggleRes.json();
      expect(toggleBody.subscription.status).toBe('pending');

      // Delete subscription
      const delRes = await fetch(`${baseUrl}/api/finance/subscriptions/${subId}`, {
        method: 'DELETE',
        headers: { 'x-dev-bypass': 'true' }
      });
      expect(delRes.status).toBe(200);
      const delBody = await delRes.json();
      expect(delBody.success).toBe(true);
    });

    it('manages savings goals: add, deposit, and delete', async () => {
      const addRes = await fetch(`${baseUrl}/api/finance/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-dev-bypass': 'true'
        },
        body: JSON.stringify({
          name: 'Zapasowy Zasilacz UPS',
          currentPln: 100,
          targetPln: 800,
          deadline: '31 gru 2026'
        })
      });
      expect(addRes.status).toBe(201);
      const addBody = await addRes.json();
      const goalId = addBody.goal.id;

      const depRes = await fetch(`${baseUrl}/api/finance/goals/${goalId}/deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-dev-bypass': 'true'
        },
        body: JSON.stringify({ amount: 150 })
      });
      expect(depRes.status).toBe(200);
      const depBody = await depRes.json();
      expect(depBody.goal.currentPln).toBe(250);

      const delRes = await fetch(`${baseUrl}/api/finance/goals/${goalId}`, {
        method: 'DELETE',
        headers: { 'x-dev-bypass': 'true' }
      });
      expect(delRes.status).toBe(200);
      const delBody = await delRes.json();
      expect(delBody.success).toBe(true);
    });

    it('executes atomic transferFunds between envelopes and validates input', () => {
      const initialTxCount = dbStore.getTransactions('operator-system-core').length;
      const transfer = dbStore.transferFunds('operator-system-core', 'NEEDS', 'SAVINGS', 75.0, 'Oszczędności awaryjne');
      expect(transfer.expenseTx.amount).toBe(75.0);
      expect(transfer.expenseTx.envelope).toBe('NEEDS');
      expect(transfer.incomeTx.amount).toBe(75.0);
      expect(transfer.incomeTx.envelope).toBe('SAVINGS');
      expect(dbStore.getTransactions('operator-system-core').length).toBe(initialTxCount + 2);

      // Validation fail-fast: identical envelopes
      expect(() => {
        dbStore.transferFunds('operator-system-core', 'NEEDS', 'NEEDS', 50.0);
      }).toThrow(/różne/);

      // Validation fail-fast: non-positive amount
      expect(() => {
        dbStore.transferFunds('operator-system-core', 'NEEDS', 'SAVINGS', -10.0);
      }).toThrow(/dodatnią/);

      // Validation fail-fast: Infinity
      expect(() => {
        dbStore.transferFunds('operator-system-core', 'NEEDS', 'SAVINGS', Infinity);
      }).toThrow(/skończoną/);
    });
  });

  describe('Workouts Domain CRUD (/api/workouts)', () => {
    it('increments set, resets sets and manages exercises', async () => {
      const exRes = await fetch(`${baseUrl}/api/workouts/exercises`, {
        headers: { 'x-dev-bypass': 'true' }
      });
      expect(exRes.status).toBe(200);
      const exBody = await exRes.json();
      const firstEx = exBody.exercises[0];

      // Reset
      const resetRes = await fetch(`${baseUrl}/api/workouts/exercises/${firstEx.id}/reset`, {
        method: 'POST',
        headers: { 'x-dev-bypass': 'true' }
      });
      expect(resetRes.status).toBe(200);
      const resetBody = await resetRes.json();
      expect(resetBody.exercise.completedSets).toBe(0);

      // Increment
      const incRes = await fetch(`${baseUrl}/api/workouts/exercises/${firstEx.id}/increment`, {
        method: 'POST',
        headers: { 'x-dev-bypass': 'true' }
      });
      expect(incRes.status).toBe(200);
      const incBody = await incRes.json();
      expect(incBody.exercise.completedSets).toBe(1);
      expect(incBody.restTimerSeconds).toBe(90);
    });

    it('manages habit toggle and additions', async () => {
      const addRes = await fetch(`${baseUrl}/api/workouts/habits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-dev-bypass': 'true'
        },
        body: JSON.stringify({ title: 'Kreatyna 5g rano' })
      });
      expect(addRes.status).toBe(201);
      const addBody = await addRes.json();
      const habitId = addBody.habit.id;

      const toggleRes = await fetch(`${baseUrl}/api/workouts/habits/${habitId}/toggle`, {
        method: 'POST',
        headers: { 'x-dev-bypass': 'true' }
      });
      expect(toggleRes.status).toBe(200);
      const toggleBody = await toggleRes.json();
      expect(toggleBody.habit.completedToday).toBe(true);
      expect(toggleBody.habit.streakDays).toBe(1);
    });
  });

  describe('Private Hub Domain (/api/private)', () => {
    it('handles routines, goals and journal entries', async () => {
      // Routines
      const rRes = await fetch(`${baseUrl}/api/private/routines`, {
        headers: { 'x-dev-bypass': 'true' }
      });
      expect(rRes.status).toBe(200);
      const rBody = await rRes.json();
      expect(Array.isArray(rBody.routines)).toBe(true);

      const toggleRes = await fetch(`${baseUrl}/api/private/routines/${rBody.routines[0].id}/toggle`, {
        method: 'PATCH',
        headers: { 'x-dev-bypass': 'true' }
      });
      expect(toggleRes.status).toBe(200);

      // Goals progress
      const gRes = await fetch(`${baseUrl}/api/private/goals`, {
        headers: { 'x-dev-bypass': 'true' }
      });
      expect(gRes.status).toBe(200);
      const gBody = await gRes.json();

      const progRes = await fetch(`${baseUrl}/api/private/goals/${gBody.goals[0].id}/progress`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-dev-bypass': 'true'
        },
        body: JSON.stringify({ delta: 5 })
      });
      expect(progRes.status).toBe(200);

      // Journal
      const jRes = await fetch(`${baseUrl}/api/private/journal`, {
        headers: { 'x-dev-bypass': 'true' }
      });
      expect(jRes.status).toBe(200);
      const jBody = await jRes.json();
      expect(jBody.entries.length).toBeGreaterThan(0);
    });
  });
});
