import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Target, ShieldCheck, Plus, Trash2, ArrowUpCircle } from 'lucide-react';
import { financeApi } from '../../../api/client';

export interface SavingsGoal {
  id: string;
  name: string;
  current: number;
  target: number;
  category?: string;
  deadline?: string;
}

const DEFAULT_GOALS: SavingsGoal[] = [
  { id: 'g1', name: 'Fundusz Awaryjny (Poduszka 3-mc)', current: 3200, target: 5000, category: 'Bezpieczeństwo' },
  { id: 'g2', name: 'Inwestycje i Narzędzia Sprzętowe', current: 1450, target: 3000, category: 'Rozwój IT' }
];

export const SavingsGoalCard: React.FC = () => {
  const [goals, setGoals] = useState<SavingsGoal[]>(DEFAULT_GOALS);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [category, setCategory] = useState('Oszczędności');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    financeApi.getGoals()
      .then((res) => {
        if (res?.goals && res.goals.length > 0) {
          const mapped: SavingsGoal[] = res.goals.map((g: any) => ({
            id: g.id,
            name: g.name,
            current: g.currentPln ?? g.current ?? 0,
            target: g.targetPln ?? g.target ?? 1000,
            category: 'Oszczędności',
            deadline: g.deadline
          }));
          setGoals(mapped);
        }
      })
      .catch(() => {
        // Fallback maintained
      });
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !target) return;
    const targetVal = Math.abs(parseFloat(target)) || 1000;

    try {
      const res = await financeApi.addGoal({
        name: name.trim(),
        targetPln: targetVal,
        currentPln: 0,
        deadline: '31 gru 2026'
      });
      if (res?.goal) {
        const newGoal: SavingsGoal = {
          id: res.goal.id,
          name: res.goal.name,
          current: res.goal.currentPln || 0,
          target: res.goal.targetPln || targetVal,
          category
        };
        setGoals((prev) => [...prev, newGoal]);
      }
    } catch {
      const fallbackItem: SavingsGoal = {
        id: Date.now().toString(),
        name: name.trim(),
        current: 0,
        target: targetVal,
        category
      };
      setGoals((prev) => [...prev, fallbackItem]);
    }

    setName('');
    setTarget('');
    setIsAdding(false);
  };

  const handleDeposit = async (id: string, amount: number) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, current: Math.min(g.target, g.current + amount) } : g))
    );
    try {
      await financeApi.depositGoal(id, amount);
    } catch {
      // Local state already updated
    }
  };

  const handleDelete = async (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    try {
      await financeApi.deleteGoal(id);
    } catch {
      // Local state already updated
    }
  };

  return (
    <GlassCard className="p-4 sm:p-5" glow="emerald">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-sm">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Cele Oszczędnościowe (20%)</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Budowa kapitału i poduszki finansowej</p>
          </div>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nowy cel</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="p-3 mb-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Nazwa celu..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
            />
            <input
              type="number"
              placeholder="Kwota docelowa PLN..."
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
            />
            <input
              type="text"
              placeholder="Kategoria..."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
            />
          </div>
          <button
            type="submit"
            className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-xs"
          >
            Zapisz cel oszczędnościowy
          </button>
        </form>
      )}

      <div className="space-y-3.5">
        {goals.map((goal) => {
          const percent = goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;
          return (
            <div key={goal.id} className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2 transition hover:bg-white dark:hover:bg-slate-850">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{goal.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {goal.current} / {goal.target} PLN ({percent}%)
                  </span>
                  <button
                    onClick={() => handleDeposit(goal.id, 100)}
                    className="flex items-center gap-1 text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900 transition"
                  >
                    <ArrowUpCircle className="w-3 h-3" />
                    +100 zł
                  </button>
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 transition"
                    title="Usuń cel"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="w-full bg-slate-200/80 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden border border-white dark:border-slate-700">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
};
