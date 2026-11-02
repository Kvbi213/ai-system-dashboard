import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Target, Plus, Trash2, ArrowUpCircle } from 'lucide-react';
import { privateApi } from '../../../api/client';

export interface PersonalGoal {
  id: string;
  title: string;
  category: string;
  current: number;
  target: number;
  unit: string;
}

const DEFAULT_GOALS: PersonalGoal[] = [
  { id: '1', title: 'Książka: Designing Data-Intensive Apps', category: 'Dev', current: 240, target: 600, unit: 'stron' },
  { id: '2', title: 'Certyfikat Linux & Docker Containers', category: 'Kariera', current: 8, target: 10, unit: 'modułów' },
  { id: '3', title: 'Język Niemiecki B1 [wymowa]', category: 'Języki', current: 65, target: 100, unit: '%' },
  { id: '4', title: 'Kalistenika: Muscle-up na drążku', category: 'Sport', current: 3, target: 5, unit: 'etapów' }
];

export const PersonalGoalsCard: React.FC = () => {
  const [goals, setGoals] = useState<PersonalGoal[]>(DEFAULT_GOALS);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Rozwój');
  const [target, setTarget] = useState('100');
  const [unit, setUnit] = useState('%');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    privateApi.getGoals()
      .then((res) => {
        if (res?.goals && res.goals.length > 0) {
          const mapped: PersonalGoal[] = res.goals.map((g: any) => ({
            id: g.id,
            title: g.title,
            category: g.category || 'Rozwój',
            current: g.current || 0,
            target: g.target || 100,
            unit: g.unit || '%'
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
    if (!title.trim()) return;
    const titleVal = title.trim();
    const targetVal = parseFloat(target) || 100;

    try {
      const res = await privateApi.addGoal({
        title: titleVal,
        category,
        current: 0,
        target: targetVal,
        unit
      });
      if (res?.goal) {
        setGoals((prev) => [
          ...prev,
          {
            id: res.goal.id,
            title: res.goal.title,
            category: res.goal.category || category,
            current: res.goal.current || 0,
            target: res.goal.target || targetVal,
            unit: res.goal.unit || unit
          }
        ]);
      }
    } catch {
      const item: PersonalGoal = {
        id: Date.now().toString(),
        title: titleVal,
        category,
        current: 0,
        target: targetVal,
        unit
      };
      setGoals((prev) => [...prev, item]);
    }

    setTitle('');
    setIsAdding(false);
  };

  const handleIncrement = async (id: string) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, current: Math.min(g.target, g.current + 1) } : g))
    );
    try {
      await privateApi.updateGoalProgress(id, 1);
    } catch {
      // Local state already updated
    }
  };

  const handleDelete = async (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    try {
      await privateApi.deleteGoal(id);
    } catch {
      // Local state already updated
    }
  };

  return (
    <GlassCard className="p-4 sm:p-5" glow="emerald">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">Cele Osobiste & Projekty Rozwojowe</h3>
          <p className="text-xs text-slate-500 font-medium">Śledzenie realizacji planów edukacyjnych i fizycznych</p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/20 active:scale-95 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nowy cel</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-300 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <input
              type="text"
              placeholder="Tytuł celu..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-2 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-700"
            >
              <option value="Rozwój">Rozwój</option>
              <option value="Dev">Dev</option>
              <option value="Kariera">Kariera</option>
              <option value="Sport">Sport</option>
              <option value="Języki">Języki</option>
            </select>
            <input
              type="number"
              placeholder="Cel liczbowy..."
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900"
            />
            <input
              type="text"
              placeholder="Jednostka..."
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900"
            />
          </div>
          <button
            type="submit"
            className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition"
          >
            Zapisz cel rozwojowy
          </button>
        </form>
      )}

      <div className="space-y-3">
        {goals.map((item) => {
          const pct = Math.min(100, Math.round((item.current / item.target) * 100));
          return (
            <div key={item.id} className="p-3 rounded-xl bg-white/90 border border-slate-200 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-900">{item.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-600 font-bold">
                    {item.current} / {item.target} {item.unit} ({pct}%)
                  </span>
                  <button
                    onClick={() => handleIncrement(item.id)}
                    className="p-1 text-emerald-600 hover:text-emerald-800 transition"
                    title="+1 postęp"
                  >
                    <ArrowUpCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1 text-slate-300 hover:text-rose-500 transition"
                    title="Usuń cel"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
};
