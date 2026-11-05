import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../core/authMiddleware.js';
import { dbStore, SubscriptionItem } from '../../db/store.js';
import { sqliteStore } from '../../db/sqliteStore.js';
import { TransactionItem } from '../../db/types.js';

export const financeRouter = Router();

financeRouter.get('/overview', (_req: AuthenticatedRequest, res: Response) => {
  const transactions = sqliteStore.getTransactions();
  const subscriptions = dbStore.getSubscriptions();
  const goals = dbStore.getSavingsGoals();
  const envelopes = sqliteStore.getFinanceEnvelopes();

  const totalExpenses = transactions
    .filter((tx: TransactionItem) => tx.type === 'EXPENSE')
    .reduce((sum: number, tx: TransactionItem) => sum + tx.amount, 0);

  const totalIncome = transactions
    .filter((tx: TransactionItem) => tx.type === 'INCOME')
    .reduce((sum: number, tx: TransactionItem) => sum + tx.amount, 0);

  const monthlyBurn = subscriptions
    .filter((sub: SubscriptionItem) => sub.status === 'active')
    .reduce((sum: number, sub: SubscriptionItem) => sum + sub.costPln, 0);

  // 50/30/20 breakdown from actual transactions
  const needsSpent = transactions
    .filter((tx: TransactionItem) => tx.envelope === 'NEEDS' && tx.type === 'EXPENSE')
    .reduce((sum: number, tx: TransactionItem) => sum + tx.amount, 0);
  const wantsSpent = transactions
    .filter((tx: TransactionItem) => tx.envelope === 'WANTS' && tx.type === 'EXPENSE')
    .reduce((sum: number, tx: TransactionItem) => sum + tx.amount, 0);
  const savingsSpent = transactions
    .filter((tx: TransactionItem) => tx.envelope === 'SAVINGS' && tx.type === 'EXPENSE')
    .reduce((sum: number, tx: TransactionItem) => sum + tx.amount, 0);

  const effectiveBudget = envelopes.monthlyIncome > 0 ? envelopes.monthlyIncome : 3500;
  const needsBudget = Math.round(effectiveBudget * (envelopes.needsTarget / 100));
  const wantsBudget = Math.round(effectiveBudget * (envelopes.wantsTarget / 100));
  const savingsBudget = Math.round(effectiveBudget * (envelopes.savingsTarget / 100));

  res.json({
    summary: {
      totalExpenses,
      totalIncome,
      monthlyBurn,
      envelopes: {
        needs: {
          spent: needsSpent,
          budget: needsBudget,
          balance: envelopes.needsBalance,
          percent: needsBudget > 0 ? Math.round((needsSpent / needsBudget) * 100) : 0,
          targetPercent: envelopes.needsTarget
        },
        wants: {
          spent: wantsSpent,
          budget: wantsBudget,
          balance: envelopes.wantsBalance,
          percent: wantsBudget > 0 ? Math.round((wantsSpent / wantsBudget) * 100) : 0,
          targetPercent: envelopes.wantsTarget
        },
        savings: {
          spent: savingsSpent,
          budget: savingsBudget,
          balance: envelopes.savingsBalance,
          percent: savingsBudget > 0 ? Math.round((savingsSpent / savingsBudget) * 100) : 0,
          targetPercent: envelopes.savingsTarget
        }
      },
      totalBalance: envelopes.totalBalance,
      monthlyIncome: envelopes.monthlyIncome
    },
    transactions,
    subscriptions,
    goals
  });
});

financeRouter.get('/transactions', (_req: AuthenticatedRequest, res: Response) => {
  const transactions = sqliteStore.getTransactions();
  res.json({ transactions });
});

financeRouter.post('/transactions', (req: AuthenticatedRequest, res: Response) => {
  const { title, amount, envelope, category, type, date } = req.body;

  const parsedAmount = typeof amount === 'number' ? amount : parseFloat(amount);
  if (!title || isNaN(parsedAmount) || parsedAmount <= 0) {
    res.status(400).json({ error: 'INVALID_TRANSACTION', message: 'Niepoprawna kwota lub tytuł transakcji.' });
    return;
  }

  const validEnvelope = ['NEEDS', 'WANTS', 'SAVINGS'].includes(String(envelope).toUpperCase())
    ? (String(envelope).toUpperCase() as 'NEEDS' | 'WANTS' | 'SAVINGS')
    : 'WANTS';
  const validCategory = category && typeof category === 'string' ? category : 'Wydatki';
  const validType = String(type).toUpperCase() === 'INCOME' ? 'INCOME' : 'EXPENSE';

  const transaction = sqliteStore.addTransaction({
    title: title.trim(),
    amount: parsedAmount,
    envelope: validEnvelope,
    category: validCategory,
    type: validType,
    date: date || new Date().toISOString().split('T')[0]
  });

  res.status(201).json({ transaction });
});

financeRouter.put('/transactions/:id', (req: AuthenticatedRequest, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
  const updated = sqliteStore.updateTransaction(id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Transakcja nie została odnaleziona.' });
    return;
  }
  res.json({ transaction: updated });
});

financeRouter.delete('/transactions/:id', (req: AuthenticatedRequest, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
  const success = sqliteStore.deleteTransaction(id);
  res.json({ success });
});

financeRouter.post('/reset', (_req: AuthenticatedRequest, res: Response) => {
  const result = sqliteStore.resetFinances();
  res.json({
    success: true,
    message: 'Fundusze oraz historia transakcji zostały pomyślnie zresetowane.',
    clearedCount: result.clearedCount
  });
});

financeRouter.get('/envelopes', (_req: AuthenticatedRequest, res: Response) => {
  res.json({ envelopes: sqliteStore.getFinanceEnvelopes() });
});

financeRouter.put('/envelopes', (req: AuthenticatedRequest, res: Response) => {
  sqliteStore.updateFinanceEnvelopes(req.body);
  res.json({
    success: true,
    envelopes: sqliteStore.getFinanceEnvelopes()
  });
});

// Subscriptions Endpoints
financeRouter.get('/subscriptions', (_req: AuthenticatedRequest, res: Response) => {
  res.json({ subscriptions: dbStore.getSubscriptions() });
});

financeRouter.post('/subscriptions', (req: AuthenticatedRequest, res: Response) => {
  const { name, category, costPln, renewalDay } = req.body;
  if (!name || isNaN(parseFloat(costPln))) {
    res.status(400).json({ error: 'INVALID_SUBSCRIPTION', message: 'Nazwa oraz koszt są wymagane.' });
    return;
  }
  const subscription = dbStore.addSubscription({
    name: name.trim(),
    category: category || 'Subskrypcje',
    costPln: Math.abs(parseFloat(costPln)),
    renewalDay: parseInt(renewalDay, 10) || 1,
    status: 'active'
  });
  res.status(201).json({ subscription });
});

financeRouter.patch('/subscriptions/:id/toggle', (req: AuthenticatedRequest, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
  const updated = dbStore.toggleSubscription(id);
  if (!updated) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Subskrypcja nie została odnaleziona.' });
    return;
  }
  res.json({ subscription: updated });
});

financeRouter.delete('/subscriptions/:id', (req: AuthenticatedRequest, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
  const success = dbStore.deleteSubscription(id);
  res.json({ success });
});

// Goals Endpoints
financeRouter.get('/goals', (_req: AuthenticatedRequest, res: Response) => {
  res.json({ goals: dbStore.getSavingsGoals() });
});

financeRouter.post('/goals', (req: AuthenticatedRequest, res: Response) => {
  const { name, currentPln, targetPln, deadline } = req.body;
  if (!name || isNaN(parseFloat(targetPln))) {
    res.status(400).json({ error: 'INVALID_GOAL', message: 'Nazwa oraz cel finansowy są wymagane.' });
    return;
  }
  const goal = dbStore.addSavingsGoal({
    name: name.trim(),
    currentPln: parseFloat(currentPln) || 0,
    targetPln: Math.abs(parseFloat(targetPln)),
    deadline: deadline || 'Koniec roku'
  });
  res.status(201).json({ goal });
});

financeRouter.post('/goals/:id/deposit', (req: AuthenticatedRequest, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
  const { amount } = req.body;
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    res.status(400).json({ error: 'INVALID_DEPOSIT', message: 'Niepoprawna kwota wpłaty.' });
    return;
  }
  const updated = dbStore.depositSavingsGoal(id, parsedAmount);
  if (!updated) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Cel nie został odnaleziony.' });
    return;
  }
  res.json({ goal: updated });
});

financeRouter.delete('/goals/:id', (req: AuthenticatedRequest, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
  const success = dbStore.deleteSavingsGoal(id);
  res.json({ success });
});
