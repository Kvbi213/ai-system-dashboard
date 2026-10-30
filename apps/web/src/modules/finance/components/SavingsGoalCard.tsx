import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Target, ShieldCheck, Plus, Trash2, ArrowUpCircle } from 'lucide-react';

export interface SavingsGoal {
  id: string;
  name: string;
  current: number;
  target: number;
  category: string;
}

const STORAGE_KEY = 'omnidash_finance_savings_goals';

const DEFAULT_GOALS: SavingsGoal[] = [
  { id: 'g1', name: 'Fundusz Awaryjny (Poduszka 3-mc)', current: 3200, target: 5000, category: 'Bezpieczeństwo' },
  { id: 'g2', name: 'Inwestycje i Narzędzia Sprzętowe', current: 1450, target: 3000, category: 'Rozwój IT' }
];

export const SavingsGoalCard: React.FC = () => {
  const [goals, setGoals] = useState<SavingsGoal[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_GOALS;
    } catch {
      return DEFAULT_GOALS;
    }
  });

  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [category, setCategory] = useState('Oszczędności');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
  }, [goals]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !target) return;
    const item: SavingsGoal = {
      id: Date.now().toString(),
      name: name.trim(),
      current: 0,
      target: Math.abs(parseFloat(target)) || 1000,
      category
    };
    setGoals([...goals, item]);
    setName('');
    setTarget('');
    setIsAdding(false);
  };

  const handleDeposit = (id: string, amount: number) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, current: Math.min(g.target, g.current + amount) } : g))
    );
  };

  const handleDelete = (id: string) => {
    setGoals(goals.filter((g) => g.id !== id));
  };

  return (
    <GlassCard className="p-4 sm:p-5" glow="emerald">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Cele Oszczędnościowe (20%)</h3>
            <p className="text-xs text-slate-500 font-medium">Budowa kapitału i poduszki finansowej</p>
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
        <form onSubmit={handleAdd} className="p-3 mb-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Nazwa celu..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900"
            />
            <input
              type="number"
              placeholder="Kwota docelowa PLN..."
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900"
            />
            <input
              type="text"
              placeholder="Kategoria..."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900"
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
            <div key={goal.id} className="p-3.5 rounded-2xl bg-white/70 border border-slate-200/80 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{goal.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-700">
                    {goal.current} / {goal.target} PLN ({percent}%)
                  </span>
                  <button
                    onClick={() => handleDeposit(goal.id, 100)}
                    className="flex items-center gap-1 text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded hover:bg-emerald-100 transition"
                  >
                    <ArrowUpCircle className="w-3 h-3" />
                    +100 zł
                  </button>
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="p-1 text-slate-300 hover:text-rose-500 transition"
                    title="Usuń cel"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden border border-white">
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
