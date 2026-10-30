import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { CheckCircle2, Circle, Flame, Plus, Trash2, Tag } from 'lucide-react';
import { workoutsApi } from '../../../api/client';

export interface HabitItem {
  id: string;
  title: string;
  streakDays: number;
  completedToday: boolean;
  category: string;
}

const STORAGE_KEY = 'omnidash_habits';

const INITIAL_HABITS: HabitItem[] = [
  { id: 'h1', title: 'Woda minimum 2.5 Litra', streakDays: 18, completedToday: true, category: 'Zdrowie' },
  { id: 'h2', title: 'Fiszki z języka niemieckiego [wymowa]', streakDays: 12, completedToday: true, category: 'Nauka' },
  { id: 'h3', title: 'Programowanie & Git Commit w repozytorium', streakDays: 34, completedToday: true, category: 'Dev' },
  { id: 'h4', title: 'Czytanie literatury technicznej (20 min)', streakDays: 9, completedToday: false, category: 'Umysł' }
];

export const DailyHabitStreaks: React.FC = () => {
  const [habits, setHabits] = useState<HabitItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : INITIAL_HABITS;
    } catch {
      return INITIAL_HABITS;
    }
  });

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Dyscyplina');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
  }, [habits]);

  const handleToggle = (id: string) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id === id) {
          const nextCompleted = !h.completedToday;
          return {
            ...h,
            completedToday: nextCompleted,
            streakDays: nextCompleted ? h.streakDays + 1 : Math.max(0, h.streakDays - 1)
          };
        }
        return h;
      })
    );

    workoutsApi.toggleHabit(id).catch(() => {
      // Local state already updated
    });
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const newHabit: HabitItem = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      streakDays: 0,
      completedToday: false,
      category: newCategory
    };
    setHabits([...habits, newHabit]);
    setNewTitle('');
    setIsAdding(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHabits((prev) => prev.filter((h) => h.id !== id));
  };

  return (
    <GlassCard className="p-4 sm:p-5" glow="none">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Nawyki Codzienne i Serie (Streaks)</h3>
            <p className="text-xs text-slate-500 font-medium">Budowanie dyscypliny i powtarzalności</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 shadow-sm">
            {habits.filter((h) => h.completedToday).length} / {habits.length} zaliczone
          </span>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/20 active:scale-95 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nawyk</span>
          </button>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="p-3 mb-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Nazwa nawyku (np. Rozciąganie powięziowe)..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="sm:col-span-2 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900"
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900"
            >
              <option value="Zdrowie">Zdrowie</option>
              <option value="Nauka">Nauka</option>
              <option value="Dev">Dev</option>
              <option value="Umysł">Umysł</option>
              <option value="Dyscyplina">Dyscyplina</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition shadow-xs"
          >
            Dodaj nawyk
          </button>
        </form>
      )}

      <div className="space-y-2.5">
        {habits.map((habit) => (
          <div
            key={habit.id}
            onClick={() => handleToggle(habit.id)}
            className="flex items-center justify-between p-3 rounded-2xl bg-white/70 border border-slate-200/80 hover:border-slate-300 hover:bg-white cursor-pointer transition shadow-sm"
          >
            <div className="flex items-center gap-3">
              {habit.completedToday ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-slate-400 shrink-0" />
              )}
              <div>
                <p className={`text-xs font-bold ${habit.completedToday ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                  {habit.title}
                </p>
                <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                  <Tag className="w-3 h-3 text-slate-400" />
                  <span>{habit.category}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-mono text-xs font-bold shadow-sm">
                <Flame className="w-3.5 h-3.5 text-amber-600" />
                <span>{habit.streakDays} dni</span>
              </div>
              <button
                onClick={(e) => handleDelete(habit.id, e)}
                className="p-1 text-slate-300 hover:text-rose-500 transition"
                title="Usuń nawyk"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};
