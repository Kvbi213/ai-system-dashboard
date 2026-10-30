import React, { useState, useEffect } from 'react';
import { EnvelopeOverview } from './components/EnvelopeOverview';
import { TransactionList, TransactionItem } from './components/TransactionList';
import { SubscriptionsManager } from './components/SubscriptionsManager';
import { SavingsGoalCard } from './components/SavingsGoalCard';
import { Plus, Wallet, CreditCard, Target, History } from 'lucide-react';
import { financeApi } from '../../api/client';

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
    setTitle('');
    setAmount('');
    setIsAdding(false);

    try {
      await financeApi.addTransaction({
        title,
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
    { id: 'transactions', label: 'Wydatki i Rejestr', icon: History },
    { id: 'subscriptions', label: 'Abonamenty', icon: CreditCard },
    { id: 'goals', label: 'Cele i Oszczędności', icon: Target }
  ] as const;

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Category Sub-Tabs with Liquid Glass Pill Design */}
      <div className="flex gap-1.5 p-1.5 rounded-2xl glass-panel shadow-sm overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20 border border-sky-500'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <tab.icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {activeTab === 'envelopes' && <EnvelopeOverview />}

      {activeTab === 'transactions' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/20 active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Dodaj wydatek</span>
            </button>
          </div>

          {isAdding && (
            <form onSubmit={handleAddTx} className="p-4 rounded-2xl glass-panel-elevated border-sky-300 space-y-3 shadow-lg">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Tytuł wydatku..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder-slate-400"
                />
                <input
                  type="number"
                  placeholder="Kwota (PLN)..."
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder-slate-400"
                />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 font-medium"
                >
                  <option value="potrzeby">50% Potrzeby</option>
                  <option value="zachcianki">30% Zachcianki</option>
                  <option value="oszczednosci">20% Oszczędności</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
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
