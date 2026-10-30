import React, { useState } from 'react';
import { EnvelopeOverview } from './components/EnvelopeOverview';
import { TransactionList, TransactionItem } from './components/TransactionList';
import { Plus, Wallet } from 'lucide-react';

const INITIAL_TX: TransactionItem[] = [
  { id: '1', title: 'Serwer Mikr.us LXC (odnowienie)', category: 'potrzeby', amount: -65.0, date: '29 paź' },
  { id: '2', title: 'Wypłata zlecenie Useme B2B', category: 'przychod', amount: 1800.0, date: '28 paź' },
  { id: '3', title: 'Książka: Designing Data-Intensive Apps', category: 'zachcianki', amount: -119.0, date: '26 paź' },
  { id: '4', title: 'Bilet miesięczny PKP / Polregio', category: 'potrzeby', amount: -160.0, date: '25 paź' },
  { id: '5', title: 'Odłożenie do portfela inwestycyjnego', category: 'oszczednosci', amount: -360.0, date: '28 paź' }
];

export const FinancePage: React.FC = () => {
  const [transactions, setTransactions] = useState<TransactionItem[]>(INITIAL_TX);
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<'potrzeby' | 'zachcianki' | 'oszczednosci'>('potrzeby');

  const handleAddTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;
    const newTx: TransactionItem = {
      id: Date.now().toString(),
      title,
      category,
      amount: -Math.abs(parseFloat(amount)),
      date: 'Dzisiaj'
    };
    setTransactions([newTx, ...transactions]);
    setTitle('');
    setAmount('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-bold text-white tracking-tight">System Finansowy 50/30/20</h2>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-500/20 active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Dodaj wydatek</span>
        </button>
      </div>

      {/* Add Form Accordion */}
      {isAdding && (
        <form onSubmit={handleAddTx} className="p-4 rounded-2xl glass-card border-sky-500/30 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Tytuł wydatku..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500"
            />
            <input
              type="number"
              placeholder="Kwota (PLN)..."
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white"
            >
              <option value="potrzeby">50% Potrzeby</option>
              <option value="zachcianki">30% Zachcianki</option>
              <option value="oszczednosci">20% Oszczędności</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-bold transition"
          >
            Zapisz transakcję
          </button>
        </form>
      )}

      {/* Overview Cards */}
      <EnvelopeOverview />

      {/* Transactions List */}
      <TransactionList transactions={transactions} />
    </div>
  );
};
