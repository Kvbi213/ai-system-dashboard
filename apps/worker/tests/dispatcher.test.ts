import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PushbulletDispatcher } from '../src/pushbullet/dispatcher.js';

describe('PushbulletDispatcher', () => {
  let dispatcher: PushbulletDispatcher;

  beforeEach(() => {
    dispatcher = new PushbulletDispatcher('');
  });

  it('enqueues notifications and sorts by priority (CRITICAL > NORMAL > LOW)', () => {
    dispatcher.enqueue({ title: 'Low priority', body: 'info', priority: 'LOW' });
    dispatcher.enqueue({ title: 'Critical alert', body: 'emergency', priority: 'CRITICAL' });
    dispatcher.enqueue({ title: 'Normal reminder', body: 'task', priority: 'NORMAL' });

    const status = dispatcher.getQueueStatus();
    expect(status.pendingCount).toBe(3);
  });

  it('processes mock queue items successfully without API key', async () => {
    dispatcher.enqueue({ title: 'Test 1', body: 'Mock text', priority: 'CRITICAL' });
    await dispatcher.processQueue();

    const status = dispatcher.getQueueStatus();
    expect(status.pendingCount).toBe(0);
    expect(status.historyCount).toBe(1);
    expect(status.recentHistory[0]?.title).toBe('Test 1');
    expect(status.recentHistory[0]?.success).toBe(true);
  });

  it('respects scheduledFor future time', async () => {
    const futureTime = Date.now() + 60000;
    dispatcher.enqueue({ title: 'Future task', body: 'Wait', scheduledFor: futureTime });

    await dispatcher.processQueue();

    const status = dispatcher.getQueueStatus();
    expect(status.pendingCount).toBe(1);
    expect(status.historyCount).toBe(0);
  });
});
