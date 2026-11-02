import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../core/authMiddleware.js';
import { dbStore, TransactionItem, SubscriptionItem } from '../../db/store.js';

export const financeRouter = Router();

financeRouter.get('/overview', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || 'operator-system-core';
  const transactions = dbStore.getTransactions(userId);
  const subscriptions = dbStore.getSubscriptions();
  const goals = dbStore.getSavingsGoals();

  const totalExpenses = transactions
    .filter((tx: TransactionItem) => tx.type === 'EXPENSE')
    .reduce((sum: number, tx: TransactionItem) => sum + tx.amount, 0);

  const monthlyBurn = subscriptions
    .filter((sub: SubscriptionItem) => sub.status === 'active')
    .reduce((sum: number, sub: SubscriptionItem) => sum + sub.costPln, 0);

  // 50/30/20 breakdown
  const needsSpent = transactions
    .filter((tx: TransactionItem) => tx.envelope === 'NEEDS')
    .reduce((sum: number, tx: TransactionItem) => sum + tx.amount, 0);
  const wantsSpent = transactions
    .filter((tx: TransactionItem) => tx.envelope === 'WANTS')
    .reduce((sum: number, tx: TransactionItem) => sum + tx.amount, 0);
  const savingsSpent = transactions
    .filter((tx: TransactionItem) => tx.envelope === 'SAVINGS')
    .reduce((sum: number, tx: TransactionItem) => sum + tx.amount, 0);

  res.json({
    summary: {
      totalExpenses,
      monthlyBurn,
      envelopes: {
        needs: { spent: needsSpent, budget: 1750, percent: Math.round((needsSpent / 1750) * 100) },
        wants: { spent: wantsSpent, budget: 1050, percent: Math.round((wantsSpent / 1050) * 100) },
        savings: { spent: savingsSpent, budget: 700, percent: Math.round((savingsSpent / 700) * 100) }
      }
    },
    transactions,
    subscriptions,
    goals
  });
});

financeRouter.get('/transactions', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || 'operator-system-core';
  const transactions = dbStore.getTransactions(userId);
  res.json({ transactions });
});

financeRouter.post('/transactions', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || 'operator-system-core';
  const { title, amount, envelope, category } = req.body;

  const parsedAmount = typeof amount === 'number' ? amount : parseFloat(amount);
  if (!title || isNaN(parsedAmount) || parsedAmount <= 0) {
    res.status(400).json({ error: 'INVALID_TRANSACTION', message: 'Niepoprawna kwota lub tytuł transakcji.' });
    return;
  }

  const validEnvelope = ['NEEDS', 'WANTS', 'SAVINGS'].includes(envelope) ? envelope : 'WANTS';
  const validCategory = category && typeof category === 'string' ? category : 'Wydatki';

  const transaction = dbStore.addTransaction(userId, {
    title: title.trim(),
    amount: parsedAmount,
    envelope: validEnvelope,
    category: validCategory,
    type: 'EXPENSE'
  });

  res.status(201).json({ transaction });
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
