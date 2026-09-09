import { describe, it, expect } from 'vitest';
import {
  validateBudgetPercentages,
  calculateBudgetDistribution,
  calculateFinanceStats,
  cycleSplitMode
} from '../modules/services/budgetCalculator.js';

describe('Budget Calculator & 50/30/20 Envelope Engine', () => {
  describe('validateBudgetPercentages', () => {
    it('should validate standard 50/30/20 rule', () => {
      const res = validateBudgetPercentages(50, 30, 20);
      expect(res.valid).toBe(true);
      expect(res.sum).toBe(100);
      expect(res.error).toBeNull();
    });

    it('should allow 0% allocation for a bucket (e.g., 70/0/30)', () => {
      const res = validateBudgetPercentages(70, 0, 30);
      expect(res.valid).toBe(true);
      expect(res.sum).toBe(100);
      expect(res.error).toBeNull();
    });

    it('should reject invalid sum not equaling 100%', () => {
      const res = validateBudgetPercentages(50, 40, 20);
      expect(res.valid).toBe(false);
      expect(res.sum).toBe(110);
      expect(res.error).toContain('Suma alokacji musi wynosić dokładnie 100%');
    });

    it('should reject negative percentages', () => {
      const res = validateBudgetPercentages(-10, 60, 50);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('nie mogą być ujemne');
    });

    it('should reject non-numeric inputs', () => {
      const res = validateBudgetPercentages('abc', 50, 50);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('muszą być liczbami');
    });
  });

  describe('calculateBudgetDistribution', () => {
    it('should correctly split 1000 PLN into 500, 300, 200 PLN', () => {
      const dist = calculateBudgetDistribution(1000, 50, 30, 20);
      expect(dist.needs).toBe(500);
      expect(dist.wants).toBe(300);
      expect(dist.savings).toBe(200);
    });

    it('should handle zero allocation for wants (70/0/30 on 2000 PLN)', () => {
      const dist = calculateBudgetDistribution(2000, 70, 0, 30);
      expect(dist.needs).toBe(1400);
      expect(dist.wants).toBe(0);
      expect(dist.savings).toBe(600);
    });

    it('should handle 100% allocation into single bucket (0/0/100)', () => {
      const dist = calculateBudgetDistribution(1500, 0, 0, 100);
      expect(dist.needs).toBe(0);
      expect(dist.wants).toBe(0);
      expect(dist.savings).toBe(1500);
    });

    it('should safely handle 0 or negative amounts', () => {
      const distZero = calculateBudgetDistribution(0, 50, 30, 20);
      expect(distZero.needs).toBe(0);
      expect(distZero.wants).toBe(0);
      expect(distZero.savings).toBe(0);

      const distNeg = calculateBudgetDistribution(-500, 50, 30, 20);
      expect(distNeg.needs).toBe(0);
      expect(distNeg.wants).toBe(0);
      expect(distNeg.savings).toBe(0);
    });
  });

  describe('calculateFinanceStats', () => {
    it('should calculate complete net balance, allocations, expenses, and envelope remainders', () => {
      const transactions = [
        { id: '1', type: 'income', amount: 5000, transaction_date: '2026-09-01' },
        { id: '2', type: 'expense', amount: 1200, bucket: 'needs', transaction_date: '2026-09-02' },
        { id: '3', type: 'expense', amount: 400, bucket: 'wants', transaction_date: '2026-09-03' },
        { id: '4', type: 'expense', amount: 300, bucket: 'savings', transaction_date: '2026-09-04' }
      ];

      const stats = calculateFinanceStats(transactions, {
        monthlyIncome: 5000,
        targetNeeds: 50,
        targetWants: 30,
        targetSavings: 20
      });

      expect(stats.income).toBe(5000);
      expect(stats.expenses).toBe(1900);
      expect(stats.net).toBe(3100);

      // Allocated: 50% = 2500, 30% = 1500, 20% = 1000
      expect(stats.allocated.needs).toBe(2500);
      expect(stats.allocated.wants).toBe(1500);
      expect(stats.allocated.savings).toBe(1000);

      // Spent
      expect(stats.spent.needs).toBe(1200);
      expect(stats.spent.wants).toBe(400);
      expect(stats.spent.savings).toBe(300);

      // Available envelope remainders
      expect(stats.available.needs).toBe(1300); // 2500 - 1200
      expect(stats.available.wants).toBe(1100); // 1500 - 400
      expect(stats.available.savings).toBe(700); // 1000 - 300
    });

    it('should correctly process inter-bucket transfers', () => {
      const transactions = [
        { id: '1', type: 'income', amount: 2000, transaction_date: '2026-09-01' }, // 1000 needs, 600 wants, 400 savings
        { id: '2', type: 'transfer', amount: 200, fromBucket: 'wants', toBucket: 'savings', transaction_date: '2026-09-02' }
      ];

      const stats = calculateFinanceStats(transactions, {
        monthlyIncome: 2000,
        targetNeeds: 50,
        targetWants: 30,
        targetSavings: 20
      });

      expect(stats.income).toBe(2000);
      expect(stats.expenses).toBe(0);
      expect(stats.allocated.needs).toBe(1000);
      expect(stats.allocated.wants).toBe(400); // 600 - 200
      expect(stats.allocated.savings).toBe(600); // 400 + 200
    });

    it('should support single-bucket income routing (splitMode: single)', () => {
      const transactions = [
        { id: '1', type: 'income', amount: 1000, splitMode: 'single', bucket: 'savings', transaction_date: '2026-09-01' }
      ];

      const stats = calculateFinanceStats(transactions, {
        monthlyIncome: 1000,
        targetNeeds: 50,
        targetWants: 30,
        targetSavings: 20
      });

      expect(stats.allocated.needs).toBe(0);
      expect(stats.allocated.wants).toBe(0);
      expect(stats.allocated.savings).toBe(1000);
    });

    it('should dynamically recalculate split incomes when budget targets change (e.g. 30/0/70)', () => {
      const transactions = [
        // Transaction originally created with old distribution snapshot
        {
          id: '1',
          type: 'income',
          amount: 517.50,
          splitMode: 'split',
          distribution: { needs: 258.75, wants: 155.25, savings: 103.50 },
          transaction_date: '2026-09-01'
        },
        {
          id: '2',
          type: 'expense',
          amount: 23.24,
          bucket: 'needs',
          transaction_date: '2026-09-02'
        }
      ];

      const stats = calculateFinanceStats(transactions, {
        monthlyIncome: 0,
        targetNeeds: 30,
        targetWants: 0,
        targetSavings: 70
      });

      expect(stats.income).toBe(517.50);
      expect(stats.expenses).toBe(23.24);
      expect(stats.net).toBe(494.26);

      // Dynamic 30/0/70 allocation: 30% of 517.50 = 155.25, 0% = 0, 70% = 362.25
      expect(stats.allocated.needs).toBe(155.25);
      expect(stats.allocated.wants).toBe(0);
      expect(stats.allocated.savings).toBe(362.25);

      // Remaining envelope balances
      expect(stats.available.needs).toBe(132.01); // 155.25 - 23.24
      expect(stats.available.wants).toBe(0);
      expect(stats.available.savings).toBe(362.25);

      // Mathematical consistency check
      expect(stats.available.needs + stats.available.wants + stats.available.savings).toBe(stats.net);

      // Expense percentage: 100% needs
      expect(stats.percentages.needs).toBe(100);
      expect(stats.percentages.wants).toBe(0);
      expect(stats.percentages.savings).toBe(0);

      // Allocation percentage of pools: 30% needs, 0% wants, 70% savings
      expect(stats.allocationPercentages.needs).toBe(30);
      expect(stats.allocationPercentages.wants).toBe(0);
      expect(stats.allocationPercentages.savings).toBe(70);
    });

    it('should preserve fixed user amounts when splitMode is custom', () => {
      const transactions = [
        {
          id: '1',
          type: 'income',
          amount: 1000,
          splitMode: 'custom',
          distribution: { needs: 400, wants: 400, savings: 200 },
          transaction_date: '2026-09-01'
        }
      ];

      const stats = calculateFinanceStats(transactions, {
        monthlyIncome: 1000,
        targetNeeds: 30,
        targetWants: 0,
        targetSavings: 70
      });

      // Must preserve custom distribution even though target is 30/0/70
      expect(stats.allocated.needs).toBe(400);
      expect(stats.allocated.wants).toBe(400);
      expect(stats.allocated.savings).toBe(200);
    });
  });

  describe('cycleSplitMode', () => {
    it('should correctly cycle through modes: split -> needs -> wants -> savings -> split', () => {
      const step1 = cycleSplitMode('split', 'split');
      expect(step1).toEqual({ splitMode: 'single', bucket: 'needs' });

      const step2 = cycleSplitMode('single', 'needs');
      expect(step2).toEqual({ splitMode: 'single', bucket: 'wants' });

      const step3 = cycleSplitMode('single', 'wants');
      expect(step3).toEqual({ splitMode: 'single', bucket: 'savings' });

      const step4 = cycleSplitMode('single', 'savings');
      expect(step4).toEqual({ splitMode: 'split', bucket: 'split' });
    });
  });
});
