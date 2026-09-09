/**
 * Pure calculation engine for the Omnidash 50/30/20 Finance Module.
 * Decoupled from React UI for deterministic testing and cross-module reuse.
 */

/**
 * Validates budget allocation percentages.
 * @param {number} needs 
 * @param {number} wants 
 * @param {number} savings 
 * @returns {{ valid: boolean, sum: number, error: string | null }}
 */
export function validateBudgetPercentages(needs, wants, savings) {
  const n = Number(needs);
  const w = Number(wants);
  const s = Number(savings);

  if (isNaN(n) || isNaN(w) || isNaN(s)) {
    return { valid: false, sum: NaN, error: 'Wszystkie wartości procentowe muszą być liczbami.' };
  }
  if (n < 0 || w < 0 || s < 0) {
    return { valid: false, sum: n + w + s, error: 'Wartości procentowe nie mogą być ujemne.' };
  }
  const sum = Math.round((n + w + s) * 100) / 100;
  if (sum !== 100) {
    return { valid: false, sum, error: `Suma alokacji musi wynosić dokładnie 100% (aktualnie: ${sum}%).` };
  }
  return { valid: true, sum, error: null };
}

/**
 * Calculates allocation amounts across needs, wants, and savings.
 * Supports 0% allocations (e.g., 70/0/30 or 100/0/0).
 * @param {number} amount Total income amount
 * @param {number} targetNeeds Percentage for needs (default 50)
 * @param {number} targetWants Percentage for wants (default 30)
 * @param {number} targetSavings Percentage for savings (default 20)
 * @returns {{ needs: number, wants: number, savings: number }}
 */
export function calculateBudgetDistribution(amount, targetNeeds = 50, targetWants = 30, targetSavings = 20) {
  const amt = Math.max(0, Number(amount) || 0);
  const nPct = Math.max(0, Number(targetNeeds) || 0);
  const wPct = Math.max(0, Number(targetWants) || 0);
  const sPct = Math.max(0, Number(targetSavings) || 0);

  const needs = Math.round(((amt * nPct) / 100) * 100) / 100;
  const wants = Math.round(((amt * wPct) / 100) * 100) / 100;
  const savings = Math.round(((amt * sPct) / 100) * 100) / 100;

  return { needs, wants, savings };
}

/**
 * Computes comprehensive financial statistics from transaction list.
 * Handles income (split / single / custom), expenses by bucket, and transfers.
 * @param {Array<Object>} transactions List of financial records
 * @param {Object} options Configuration parameters
 * @returns {Object} Calculated balance, allocations, expenses, and limits
 */
export function calculateFinanceStats(transactions = [], options = {}) {
  const {
    monthlyIncome = 0,
    targetNeeds = 50,
    targetWants = 30,
    targetSavings = 20
  } = options;

  let income = 0;
  let expenses = 0;
  const allocated = { needs: 0, wants: 0, savings: 0, unassigned: 0 };
  const spent = { needs: 0, wants: 0, savings: 0, unassigned: 0 };

  if (Array.isArray(transactions)) {
    transactions.forEach(item => {
      if (!item || item.is_settings || item.id === 'finance_settings') return;
      const amt = Number(item.amount) || 0;
      if (amt <= 0 && item.type !== 'transfer') return;

      if (item.type === 'income') {
        income += amt;
        if (item.splitMode === 'single' && item.bucket && allocated[item.bucket] !== undefined) {
          allocated[item.bucket] += amt;
        } else if (item.splitMode === 'custom' && item.distribution) {
          allocated.needs += Number(item.distribution.needs) || 0;
          allocated.wants += Number(item.distribution.wants) || 0;
          allocated.savings += Number(item.distribution.savings) || 0;
        } else {
          // Dynamiczny podział według aktualnej konfiguracji (dla trybu 'split' lub wpisów bez jawnego trybu)
          const dist = calculateBudgetDistribution(amt, targetNeeds, targetWants, targetSavings);
          allocated.needs += dist.needs;
          allocated.wants += dist.wants;
          allocated.savings += dist.savings;
        }
      } else if (item.type === 'transfer') {
        const from = item.fromBucket || 'needs';
        const to = item.toBucket || 'savings';
        if (allocated[from] !== undefined) allocated[from] -= amt;
        if (allocated[to] !== undefined) allocated[to] += amt;
      } else {
        // expense
        expenses += amt;
        const b = item.bucket || 'needs';
        if (spent[b] !== undefined) {
          spent[b] += amt;
        } else {
          spent.unassigned += amt;
        }
      }
    });
  }

  // Rounding allocated and spent values
  ['needs', 'wants', 'savings', 'unassigned'].forEach(k => {
    allocated[k] = Math.round(allocated[k] * 100) / 100;
    spent[k] = Math.round(spent[k] * 100) / 100;
  });

  const net = Math.round((income - expenses) * 100) / 100;
  const totalExp = expenses > 0 ? expenses : 0;
  const needsPct = totalExp > 0 ? Math.round((spent.needs / totalExp) * 100) : 0;
  const wantsPct = totalExp > 0 ? Math.round((spent.wants / totalExp) * 100) : 0;
  const savingsPct = totalExp > 0 ? Math.round((spent.savings / totalExp) * 100) : 0;

  // Procentowy podział pul portfela (faktyczna alokacja środków)
  const totalAlloc = Math.round((allocated.needs + allocated.wants + allocated.savings) * 100) / 100;
  const allocNeedsPct = totalAlloc > 0 ? Math.round((allocated.needs / totalAlloc) * 100) : targetNeeds;
  const allocWantsPct = totalAlloc > 0 ? Math.round((allocated.wants / totalAlloc) * 100) : targetWants;
  const allocSavingsPct = totalAlloc > 0 ? Math.round((allocated.savings / totalAlloc) * 100) : targetSavings;

  // Envelope remaining balances
  const availableNeeds = Math.round((allocated.needs - spent.needs) * 100) / 100;
  const availableWants = Math.round((allocated.wants - spent.wants) * 100) / 100;
  const availableSavings = Math.round((allocated.savings - spent.savings) * 100) / 100;

  // Target budget caps based on baseline income
  const baseBudget = monthlyIncome > 0 ? monthlyIncome : (income > 0 ? income : 0);
  const budgetNeeds = Math.round((baseBudget * targetNeeds) / 100);
  const budgetWants = Math.round((baseBudget * targetWants) / 100);
  const budgetSavings = Math.round((baseBudget * targetSavings) / 100);

  const needsLimitPct = allocated.needs > 0
    ? Math.round((spent.needs / allocated.needs) * 100)
    : (budgetNeeds > 0 ? Math.round((spent.needs / budgetNeeds) * 100) : (spent.needs > 0 ? 100 : 0));

  const wantsLimitPct = allocated.wants > 0
    ? Math.round((spent.wants / allocated.wants) * 100)
    : (budgetWants > 0 ? Math.round((spent.wants / budgetWants) * 100) : (spent.wants > 0 ? 100 : 0));

  const savingsLimitPct = allocated.savings > 0
    ? Math.round((spent.savings / allocated.savings) * 100)
    : (budgetSavings > 0 ? Math.round((spent.savings / budgetSavings) * 100) : (spent.savings > 0 ? 100 : 0));

  return {
    income: Math.round(income * 100) / 100,
    expenses: Math.round(expenses * 100) / 100,
    net,
    balance: net,
    totalIncome: Math.round(income * 100) / 100,
    totalExpenses: Math.round(expenses * 100) / 100,
    allocated,
    spent,
    buckets: spent,
    available: {
      needs: availableNeeds,
      wants: availableWants,
      savings: availableSavings
    },
    availableNeeds,
    availableWants,
    availableSavings,
    percentages: {
      needs: needsPct,
      wants: wantsPct,
      savings: savingsPct
    },
    needsPct,
    wantsPct,
    savingsPct,
    allocationPercentages: {
      needs: allocNeedsPct,
      wants: allocWantsPct,
      savings: allocSavingsPct
    },
    allocNeedsPct,
    allocWantsPct,
    allocSavingsPct,
    targets: {
      needs: budgetNeeds,
      wants: budgetWants,
      savings: budgetSavings
    },
    budgetNeeds,
    budgetWants,
    budgetSavings,
    limits: {
      needsLimitPct,
      wantsLimitPct,
      savingsLimitPct
    },
    needsLimitPct,
    wantsLimitPct,
    savingsLimitPct
  };
}

/**
 * Cycles through allocation modes: split -> needs -> wants -> savings -> split
 * @param {string} currentMode 'split' | 'single'
 * @param {string} currentBucket 'needs' | 'wants' | 'savings'
 * @returns {{ splitMode: string, bucket: string }}
 */
export function cycleSplitMode(currentMode, currentBucket) {
  const cycle = { split: 'needs', needs: 'wants', wants: 'savings', savings: 'split' };
  const current = currentMode === 'single' ? (currentBucket || 'needs') : 'split';
  const next = cycle[current] || 'split';

  if (next === 'split') {
    return { splitMode: 'split', bucket: 'split' };
  }
  return { splitMode: 'single', bucket: next };
}
