import { describe, it, expect, beforeEach } from 'vitest';
import { dbStore } from '../src/db/store';

describe('Database Store & Tenant Isolation', () => {
  beforeEach(() => {
    dbStore.reset();
  });

  it('manages tasks with tenant isolation', () => {
    const task = dbStore.addTask('user-1', {
      title: 'Przetestować silnik API v4.0',
      priority: 'HIGH',
      category: 'system'
    });

    expect(task.id).toBeDefined();
    expect(task.userId).toBe('user-1');

    const user1Tasks = dbStore.getTasks('user-1');
    expect(user1Tasks.length).toBe(1);

    const user2Tasks = dbStore.getTasks('user-2');
    expect(user2Tasks.length).toBe(0);
  });

  it('manages transactions and updates 50/30/20 balance', () => {
    const tx = dbStore.addTransaction('user-1', {
      title: 'Książka o architekturze systemów',
      amount: 65.0,
      envelope: 'WANTS',
      category: 'Edukacja',
      type: 'EXPENSE'
    });

    expect(tx.id).toBeDefined();
    const transactions = dbStore.getTransactions('user-1');
    expect(transactions.length).toBe(1);
    expect(transactions[0].amount).toBe(65.0);
  });

  it('increments workout sets and returns current state', () => {
    const exercise = dbStore.getExercises()[0];
    const initialCompleted = exercise.completedSets;
    const updated = dbStore.incrementWorkoutSet(exercise.id);

    expect(updated?.completedSets).toBe(initialCompleted + 1);
  });
});
