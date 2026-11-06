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
  { id: '1', title: 'Serwer Mikr.us LXC (odnowienie)', category: 'potrzeby', envelope: 'NEEDS', amount: -65.0, date: '29 paź' },
  { id: '2', title: 'Wypłata zlecenie Useme B2B', category: 'przychod', envelope: 'NEEDS', type: 'INCOME', amount: 1800.0, date: '28 paź' },
  { id: '3', title: 'Książka: Designing Data-Intensive Apps', category: 'zachcianki', envelope: 'WANTS', amount: -119.0, date: '26 paź' },
  { id: '4', title: 'Bilet miesięczny PKP / Polregio', category: 'potrzeby', envelope: 'NEEDS', amount: -160.0, date: '25 paź' },
  { id: '5', title: 'Odłożenie do portfela inwestycyjnego', category: 'oszczednosci', envelope: 'SAVINGS', amount: -360.0, date: '28 paź' }
];

export const FinancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'envelopes' | 'transactions' | 'subscriptions' | 'goals'>('envelopes');
  const [transactions, setTransactions] = useState<TransactionItem[]>(INITIAL_TX);
  const [isAdding, setIsAdding] = useState(false);
  const [txType, setTxType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<'potrzeby' | 'zachcianki' | 'oszczednosci'>('potrzeby');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const toast = useToast();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await financeApi.getTransactions();
      if (res?.transactions) {
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
      .then((res) => {
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
    const rawAmt = Math.abs(parseFloat(amount));
    const parsedAmount = txType === 'INCOME' ? rawAmt : -rawAmt;
    const envUpper = category === 'potrzeby' ? 'NEEDS' : category === 'zachcianki' ? 'WANTS' : 'SAVINGS';

    const newTx: TransactionItem = {
      id: Date.now().toString(),
      title,
      category,
      envelope: envUpper,
      type: txType,
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
      const res = await financeApi.addTransaction({
        title: addedTitle,
        amount: rawAmt,
        envelope: envUpper,
        category: category,
        type: txType
      });
      if (res?.transaction?.id) {
        setTransactions((prev) =>
          prev.map((t) => (t.id === newTx.id ? { ...t, id: res.transaction.id } : t))
        );
      }
    } catch {
      // Local transaction state already updated
    }
  };

  const handleDeleteTx = async (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    toast.success('Usunięto transakcję');
    try {
      await financeApi.deleteTransaction(id);
    } catch {
      toast.error('Błąd usuwania transakcji z bazy');
    }
  };

  const handleEditTx = async (tx: TransactionItem) => {
    setTransactions((prev) => prev.map((t) => (t.id === tx.id ? tx : t)));
    toast.success('Zaktualizowano transakcję');
    try {
      await financeApi.updateTransaction(tx.id, {
        title: tx.title,
        amount: Math.abs(tx.amount)
      });
    } catch {
      toast.error('Błąd aktualizacji transakcji w bazie');
    }
  };

  const handleResetFinances = async (options?: { initialBalance?: number }) => {
    setTransactions([]);
    const balMsg = options?.initialBalance ? ` (saldo startowe: ${options.initialBalance.toFixed(2)} zł)` : '';
    toast.success(`Fundusze i portfel zostały zresetowane${balMsg}`);
    try {
      await financeApi.resetFinances(options);
      const res = await financeApi.getTransactions();
      if (res?.transactions) {
        setTransactions(res.transactions);
      }
    } catch {
      toast.error('Błąd resetowania funduszy');
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
            <span>Dodaj operację</span>
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
              <div className="flex items-center gap-2 mb-1">
                <button
                  type="button"
                  onClick={() => setTxType('EXPENSE')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                    txType === 'EXPENSE'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Wydatek (-)
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('INCOME')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                    txType === 'INCOME'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Przychód (+)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Tytuł operacji..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
                <input
                  type="number"
                  placeholder="Kwota (PLN)..."
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm font-mono text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white font-medium focus:outline-none focus:border-sky-500"
                >
                  <option value="potrzeby">50% Potrzeby (Needs)</option>
                  <option value="zachcianki">30% Zachcianki (Wants)</option>
                  <option value="oszczednosci">20% Oszczędności (Savings)</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition shadow-sm active:scale-98"
              >
                Zapisz operację w SQLite
              </button>
            </form>
          )}

          <TransactionList
            transactions={transactions}
            onDelete={handleDeleteTx}
            onEdit={handleEditTx}
            onReset={handleResetFinances}
          />
        </div>
      )}

      {activeTab === 'subscriptions' && <SubscriptionsManager />}
      {activeTab === 'goals' && <SavingsGoalCard />}
    </div>
  );
};
