import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SqliteStore } from '../src/db/sqliteStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('SqliteStore Relational Database Engine Suite', () => {
  let store: SqliteStore;

  beforeEach(() => {
    store = new SqliteStore(':memory:');
  });

  describe('System Config & Setup Wizard', () => {
    it('initializes with unconfigured status by default', () => {
      expect(store.isConfigured()).toBe(false);
    });

    it('sets and retrieves configured status with operator details', () => {
      store.setConfigured(true, {
        operatorName: 'Jakub Lis',
        schoolClass: '2 Ti-gr1',
        theme: 'dark'
      });

      expect(store.isConfigured()).toBe(true);
      expect(store.getConfig('operatorName')).toBe('Jakub Lis');
      expect(store.getConfig('schoolClass')).toBe('2 Ti-gr1');

      const all = store.getAllConfig();
      expect(all.is_configured).toBe('true');
      expect(all.theme).toBe('dark');
    });
  });

  describe('Habits & Streaks Engine', () => {
    it('seeds default habits on first query', () => {
      const habits = store.getHabits();
      expect(habits.length).toBeGreaterThan(0);
      expect(habits[0]).toHaveProperty('streak');
      expect(habits[0]).toHaveProperty('bestStreak');
      expect(habits[0]).toHaveProperty('completedToday');
    });

    it('toggles habit completion for today and increments streak consecutively', () => {
      const newHabit = store.saveHabit({
        title: 'Bieganie 5km',
        category: 'sport',
        frequency: 'daily'
      });

      expect(newHabit.streak).toBe(0);

      // Toggle dzisiaj
      const today = new Date().toISOString().split('T')[0];
      const toggleRes = store.toggleHabit(newHabit.id, today);
      expect(toggleRes.completedToday).toBe(true);
      expect(toggleRes.streak).toBe(1);

      // Un-toggle
      const untoggleRes = store.toggleHabit(newHabit.id, today);
      expect(untoggleRes.completedToday).toBe(false);
      expect(untoggleRes.streak).toBe(0);
    });

    it('determines consecutive streak across multiple days', () => {
      const h = store.saveHabit({
        title: 'Medytacja',
        category: 'zdrowie'
      });

      // Ukończenie wczoraj
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const resYesterday = store.toggleHabit(h.id, yesterday);
      expect(resYesterday.streak).toBe(1);

      // Ukończenie dzisiaj -> ciągłość = 2
      const today = new Date().toISOString().split('T')[0];
      const resToday = store.toggleHabit(h.id, today);
      expect(resToday.streak).toBe(2);
      expect(resToday.habit.bestStreak).toBe(2);
    });

    it('resets streak to 1 after a skipped day gap', () => {
      const h = store.saveHabit({
        title: 'Czytanie książki',
        category: 'nauka'
      });

      // Ukończenie 3 dni temu
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      store.toggleHabit(h.id, threeDaysAgo);

      // Ukończenie dzisiaj (przerwa 3 dni) -> reset do 1
      const today = new Date().toISOString().split('T')[0];
      const resToday = store.toggleHabit(h.id, today);
      expect(resToday.streak).toBe(1);
    });

    it('updates and deletes habits', () => {
      const h = store.saveHabit({ title: 'Zimny prysznic' });
      store.saveHabit({ id: h.id, title: 'Zimny prysznic rano', category: 'zdrowie' });

      const updated = store.getHabits().find((x) => x.id === h.id);
      expect(updated?.title).toBe('Zimny prysznic rano');

      store.deleteHabit(h.id);
      const afterDel = store.getHabits().find((x) => x.id === h.id);
      expect(afterDel).toBeUndefined();
    });
  });

  describe('Finances & Envelopes 50/30/20 Engine', () => {
    it('seeds initial transactions and calculates initial balances', () => {
      const txs = store.getTransactions();
      expect(txs.length).toBeGreaterThan(0);

      const envs = store.getFinanceEnvelopes();
      expect(envs.needsTarget).toBe(50);
      expect(envs.wantsTarget).toBe(30);
      expect(envs.savingsTarget).toBe(20);
    });

    it('adds income and expenses and updates balances dynamically', () => {
      store.resetFinances();
      const emptyTxs = store.getTransactions();
      expect(emptyTxs.length).toBe(0);

      const envsReset = store.getFinanceEnvelopes();
      expect(envsReset.totalBalance).toBe(0);

      // Dodaj przychód 1000 PLN (podział 50/30/20: Needs=500, Wants=300, Savings=200)
      store.addTransaction({
        title: 'Wypłata / Stypendium',
        amount: 1000,
        type: 'INCOME',
        category: 'Wynagrodzenie',
        envelope: 'NEEDS',
        date: '2026-11-01'
      });

      const envsAfterIncome = store.getFinanceEnvelopes();
      expect(envsAfterIncome.needsBalance).toBe(500);
      expect(envsAfterIncome.wantsBalance).toBe(300);
      expect(envsAfterIncome.savingsBalance).toBe(200);
      expect(envsAfterIncome.totalBalance).toBe(1000);

      // Wydatek Wants - 100 PLN
      store.addTransaction({
        title: 'Gra na Steam',
        amount: 100,
        type: 'EXPENSE',
        category: 'Rozrywka',
        envelope: 'WANTS',
        date: '2026-11-02'
      });

      const envsAfterExpense = store.getFinanceEnvelopes();
      expect(envsAfterExpense.wantsBalance).toBe(200);
      expect(envsAfterExpense.totalBalance).toBe(900);
    });

    it('supports full CRUD on transactions and resets finances cleanly', () => {
      const tx = store.addTransaction({
        title: 'Testowy wydatek',
        amount: 50,
        type: 'EXPENSE',
        category: 'Test',
        envelope: 'NEEDS'
      });

      const updated = store.updateTransaction(tx.id, {
        amount: 75,
        title: 'Zaktualizowany wydatek'
      });
      expect(updated?.amount).toBe(75);
      expect(updated?.title).toBe('Zaktualizowany wydatek');

      store.deleteTransaction(tx.id);
      const remaining = store.getTransactions().find((t) => t.id === tx.id);
      expect(remaining).toBeUndefined();

      const resetRes = store.resetFinances();
      expect(resetRes.success).toBe(true);
      expect(store.getTransactions().length).toBe(0);
    });
  });

  describe('Tasks Engine', () => {
    it('manages task lifecycle (create, update, delete)', () => {
      const t = store.saveTask({
        title: 'Zrobić projekt z SO',
        priority: 'HIGH',
        category: 'Szkoła',
        dueDate: '2026-11-10'
      });

      expect(t.completed).toBe(false);
      expect(t.priority).toBe('HIGH');

      const updated = store.updateTask(t.id, { completed: true });
      expect(updated?.completed).toBe(true);

      store.deleteTask(t.id);
      const after = store.getTasks().find((x) => x.id === t.id);
      expect(after).toBeUndefined();
    });
  });

  describe('Automation Scripts Engine', () => {
    it('manages automation scripts and records execution runs', () => {
      const script = store.saveAutomationScript({
        name: 'Dzwonek Lekcyjny Alert',
        triggerType: 'lesson_bell',
        code: 'ctx.pushbullet.send("Dzwonek", "Uwaga zmiana sali");'
      });

      expect(script.enabled).toBe(true);
      expect(script.triggerType).toBe('lesson_bell');

      const updated = store.saveAutomationScript({
        id: script.id,
        name: script.name,
        code: script.code,
        lastRunAt: new Date().toISOString(),
        lastStatus: 'SUCCESS'
      });

      expect(updated.lastStatus).toBe('SUCCESS');
      expect(store.getAutomationScripts().length).toBeGreaterThan(0);

      store.deleteAutomationScript(script.id);
      const after = store.getAutomationScripts().find((s) => s.id === script.id);
      expect(after).toBeUndefined();
    });
  });
});
