import React, { useState, useEffect } from 'react';
import { EnvelopeOverview } from './components/EnvelopeOverview';
import { BudgetPredictionCard } from './components/BudgetPredictionCard';
import { TransactionList, TransactionItem } from './components/TransactionList';
import { SubscriptionsManager } from './components/SubscriptionsManager';
import { SavingsGoalCard } from './components/SavingsGoalCard';
import { Plus, Wallet, CreditCard, Target, History } from 'lucide-react';
import { financeApi } from '../../api/client';
import { PageHeader } from '../../components/ui/PageHeader';
import { SubTabBar } from '../../components/ui/SubTabBar';
import { useToast } from '../../components/ui/Toast';

const INITIAL_TX: TransactionItem[] = [
  { id: '1', title: 'Serwer Mikr.us LXC (odnowienie)', category: 'potrzeby', amount: -65.0, date: '29 paź' },
  { id: '2', title: 'Wypłata zlecenie Useme B2B', category: 'przychod', amount: 1800.0, date: '28 paź' },
  { id: '3', title: 'Książka: Designing Data-Intensive Apps', category: 'zachcianki', amount: -119.0, date: '26 paź' },
  { id: '4', title: 'Bilet miesięczny PKP / Polregio', category: 'potrzeby', amount: -160.0, date: '25 paź' },
  { id: '5', title: 'Odłożenie do portfela inwestycyjnego', category: 'oszczednosci', amount: -360.0, date: '28 paź' }
];

export const FinancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'envelopes' | 'transactions' | 'subscriptions' | 'goals'>('envelopes');
  const [transactions, setTransactions] = useState<TransactionItem[]>(INITIAL_TX);
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<'potrzeby' | 'zachcianki' | 'oszczednosci'>('potrzeby');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const toast = useToast();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await financeApi.getTransactions();
      if (res?.transactions && res.transactions.length > 0) {
        setTransactions(res.transactions);
      }
      toast.success('Zaktualizowano dane finansowe');
    } catch {
      toast.error('Błąd synchronizacji finansów');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    financeApi.getTransactions()
      .then(res => {
        if (res?.transactions && res.transactions.length > 0) {
          setTransactions(res.transactions);
        }
      })
      .catch(() => {
        // Fallback to INITIAL_TX
      });
  }, []);

  const handleAddTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;
    const parsedAmount = -Math.abs(parseFloat(amount));
    const newTx: TransactionItem = {
      id: Date.now().toString(),
      title,
      category,
      amount: parsedAmount,
      date: 'Dzisiaj'
    };
    setTransactions([newTx, ...transactions]);
    const addedTitle = title;
    setTitle('');
    setAmount('');
    setIsAdding(false);
    toast.success(`Zapisano transakcję: ${addedTitle}`);

    try {
      await financeApi.addTransaction({
        title: addedTitle,
        amount: parsedAmount,
        envelope: category,
        category: 'Inne'
      });
    } catch {
      // Local transaction state already updated
    }
  };

  const tabs = [
    { id: 'envelopes', label: 'Koperty 50/30/20', icon: Wallet },
    { id: 'transactions', label: 'Wydatki i Rejestr', icon: History, count: transactions.length },
    { id: 'subscriptions', label: 'Abonamenty', icon: CreditCard },
    { id: 'goals', label: 'Cele i Oszczędności', icon: Target }
  ] as const;

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Unified Executive PageHeader */}
      <PageHeader
        icon={Wallet}
        title="Finanse i Budżet 50/30/20"
        subtitle="Zrównoważony podział dobowy :: Potrzeby 50%, Zachcianki 30%, Oszczędności 20%"
        badge="Wydatki LIVE"
        badgeVariant="cyan"
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        actions={
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/20 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Dodaj wydatek</span>
          </button>
        }
      />

      {/* Unified SubTabBar with liquid pill design */}
      <SubTabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Tab Panels */}
      {activeTab === 'envelopes' && (
        <div className="space-y-4">
          <BudgetPredictionCard
            totalSpent={1788}
            totalLimit={5000}
            needsSpent={1120}
            wantsSpent={480}
            savingsReserved={680}
          />
          <EnvelopeOverview />
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="space-y-3">
          {isAdding && (
            <form onSubmit={handleAddTx} className="p-4 rounded-2xl glass-panel-elevated border border-sky-300 dark:border-sky-500/40 space-y-3 shadow-lg">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Tytuł wydatku..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
                <input
                  type="number"
                  placeholder="Kwota (PLN)..."
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white font-medium focus:outline-none focus:border-sky-500"
                >
                  <option value="potrzeby">50% Potrzeby</option>
                  <option value="zachcianki">30% Zachcianki</option>
                  <option value="oszczednosci">20% Oszczędności</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition shadow-sm active:scale-98"
              >
                Zapisz transakcję
              </button>
            </form>
          )}

          <TransactionList transactions={transactions} />
        </div>
      )}

      {activeTab === 'subscriptions' && <SubscriptionsManager />}
      {activeTab === 'goals' && <SavingsGoalCard />}
    </div>
  );
};
