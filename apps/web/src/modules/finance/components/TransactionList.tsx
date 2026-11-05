import React, { useState } from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { ArrowDownLeft, ArrowUpRight, Trash2, Edit2, RotateCcw, AlertTriangle, Check, X } from 'lucide-react';

export interface TransactionItem {
  id: string;
  title: string;
  category: string;
  envelope?: string;
  type?: string;
  amount: number;
  date: string;
}

interface TransactionListProps {
  transactions: TransactionItem[];
  onDelete?: (id: string) => void;
  onEdit?: (tx: TransactionItem) => void;
  onReset?: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onDelete,
  onEdit,
  onReset
}) => {
  const [filter, setFilter] = useState<string>('all');
  const [confirmReset, setConfirmReset] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAmount, setEditAmount] = useState('');

  const startEdit = (tx: TransactionItem) => {
    setEditingId(tx.id);
    setEditTitle(tx.title);
    setEditAmount(String(Math.abs(tx.amount)));
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = (tx: TransactionItem) => {
    if (!editTitle.trim() || isNaN(parseFloat(editAmount))) return;
    const isIncome = tx.amount > 0 || tx.type === 'INCOME';
    const parsedAmt = Math.abs(parseFloat(editAmount));
    const finalAmount = isIncome ? parsedAmt : -parsedAmt;

    if (onEdit) {
      onEdit({
        ...tx,
        title: editTitle.trim(),
        amount: finalAmount
      });
    }
    setEditingId(null);
  };

  const filtered = transactions.filter((tx) => {
    if (filter === 'all') return true;
    const cat = (tx.envelope || tx.category || '').toLowerCase();
    if (filter === 'needs') return cat.includes('potrzeb') || cat.includes('needs');
    if (filter === 'wants') return cat.includes('zachcian') || cat.includes('wants');
    if (filter === 'savings') return cat.includes('oszczed') || cat.includes('savings');
    if (filter === 'income') return tx.amount > 0 || (tx.type || '').toUpperCase() === 'INCOME';
    return true;
  });

  return (
    <GlassCard className="p-4 sm:p-5" glow="none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Rejestr i Historia Transakcji (SQLite)</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Zarządzanie wpisami, edycja i zerowanie sald</p>
        </div>

        <div className="flex items-center gap-2">
          {onReset && (
            <div>
              {confirmReset ? (
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300">Zresetować?</span>
                  <button
                    onClick={() => {
                      onReset();
                      setConfirmReset(false);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px]"
                  >
                    Tak
                  </button>
                  <button
                    onClick={() => setConfirmReset(false)}
                    className="px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px]"
                  >
                    Anuluj
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold transition shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Zresetuj fundusze</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 text-xs font-medium">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-xl transition ${
            filter === 'all'
              ? 'bg-sky-600 text-white font-bold shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Wszystkie ({transactions.length})
        </button>
        <button
          onClick={() => setFilter('needs')}
          className={`px-3 py-1 rounded-xl transition ${
            filter === 'needs'
              ? 'bg-sky-600 text-white font-bold shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Potrzeby (50%)
        </button>
        <button
          onClick={() => setFilter('wants')}
          className={`px-3 py-1 rounded-xl transition ${
            filter === 'wants'
              ? 'bg-sky-600 text-white font-bold shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Zachcianki (30%)
        </button>
        <button
          onClick={() => setFilter('savings')}
          className={`px-3 py-1 rounded-xl transition ${
            filter === 'savings'
              ? 'bg-sky-600 text-white font-bold shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Oszczędności (20%)
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Brak transakcji w wybranej kategorii.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((tx) => {
            const isIncome = tx.amount > 0 || (tx.type || '').toUpperCase() === 'INCOME';
            const isEditing = editingId === tx.id;

            if (isEditing) {
              return (
                <div
                  key={tx.id}
                  className="p-3 rounded-2xl bg-sky-50/80 dark:bg-slate-850 border border-sky-300 dark:border-sky-700 space-y-2 shadow-sm"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                      placeholder="Tytuł transakcji"
                    />
                    <input
                      type="number"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
                      placeholder="Kwota"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => saveEdit(tx)}
                      className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
                    >
                      <Check className="w-3 h-3" />
                      <span>Zapisz</span>
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs transition"
                    >
                      <X className="w-3 h-3" />
                      <span>Anuluj</span>
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-white/70 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm transition hover:bg-white dark:hover:bg-slate-850"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-2 rounded-xl ${
                      isIncome
                        ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                    }`}
                  >
                    {isIncome ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{tx.title}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize font-medium">
                      {tx.envelope || tx.category} • {tx.date}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-mono font-bold ${
                      isIncome ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    {isIncome ? `+${Math.abs(tx.amount).toFixed(2)}` : `-${Math.abs(tx.amount).toFixed(2)}`} PLN
                  </span>

                  <div className="flex items-center gap-1">
                    {onEdit && (
                      <button
                        onClick={() => startEdit(tx)}
                        className="p-1 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Edytuj transakcję"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(tx.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Usuń transakcję"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
};
