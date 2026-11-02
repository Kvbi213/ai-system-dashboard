import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Sun, Moon, CheckCircle2, Circle, Plus, Trash2 } from 'lucide-react';
import { privateApi } from '../../../api/client';

export interface RoutineItem {
  id: string;
  title: string;
  period: 'morning' | 'evening';
  completed: boolean;
}

const DEFAULT_ROUTINES: RoutineItem[] = [
  { id: '1', title: 'Szklanka wody z solą kłodawską i cytryną', period: 'morning', completed: true },
  { id: '2', title: '15 minut rozruchu stawowego i mobility', period: 'morning', completed: true },
  { id: '3', title: 'Przegląd 3 najważniejszych celów dnia', period: 'morning', completed: false },
  { id: '4', title: 'Odcięcie ekranów niebieskiego światła o 22:00', period: 'evening', completed: false },
  { id: '5', title: 'Wietrzenie sypialni i temperatura 18°C', period: 'evening', completed: true },
  { id: '6', title: 'Podsumowanie zrealizowanych zadań w dzienniku', period: 'evening', completed: false }
];

export const PrivateRoutinesCard: React.FC = () => {
  const [routines, setRoutines] = useState<RoutineItem[]>(DEFAULT_ROUTINES);
  const [newTitle, setNewTitle] = useState('');
  const [newPeriod, setNewPeriod] = useState<'morning' | 'evening'>('morning');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    privateApi.getRoutines()
      .then((res) => {
        if (res?.routines && res.routines.length > 0) {
          const mapped: RoutineItem[] = res.routines.map((r: any) => ({
            id: r.id,
            title: r.title,
            period: r.timeOfDay || r.period || 'morning',
            completed: !!r.completed
          }));
          setRoutines(mapped);
        }
      })
      .catch(() => {
        // Fallback maintained
      });
  }, []);

  const handleToggle = async (id: string) => {
    setRoutines((prev) =>
      prev.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r))
    );
    try {
      await privateApi.toggleRoutine(id);
    } catch {
      // Local state already updated
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const titleVal = newTitle.trim();

    try {
      const res = await privateApi.addRoutine({
        title: titleVal,
        timeOfDay: newPeriod
      });
      if (res?.routine) {
        setRoutines((prev) => [
          ...prev,
          {
            id: res.routine.id,
            title: res.routine.title,
            period: res.routine.timeOfDay || newPeriod,
            completed: false
          }
        ]);
      }
    } catch {
      const fallbackItem: RoutineItem = {
        id: Date.now().toString(),
        title: titleVal,
        period: newPeriod,
        completed: false
      };
      setRoutines((prev) => [...prev, fallbackItem]);
    }

    setNewTitle('');
    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
    setRoutines((prev) => prev.filter((r) => r.id !== id));
    try {
      await privateApi.deleteRoutine(id);
    } catch {
      // Local state already updated
    }
  };

  const morningItems = routines.filter((r) => r.period === 'morning');
  const eveningItems = routines.filter((r) => r.period === 'evening');

  return (
    <GlassCard className="p-4 sm:p-5" glow="sky">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">Rutyny Dnia & Higiena Kognitywna</h3>
          <p className="text-xs text-slate-500 font-medium">Poranny rozruch i wieczorny protokół snu</p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/20 active:scale-95 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Dodaj nawyk</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="p-3 mb-4 rounded-xl bg-sky-50 border border-sky-300 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Treść nawyku lub rutyny..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900"
            />
            <select
              value={newPeriod}
              onChange={(e) => setNewPeriod(e.target.value as 'morning' | 'evening')}
              className="px-2 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-700"
            >
              <option value="morning">Rano</option>
              <option value="evening">Wieczór</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition"
          >
            Zapisz rutynę
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Morning Column */}
        <div className="space-y-2 p-3 rounded-xl bg-amber-50/50 border border-amber-200/60">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 mb-2">
            <Sun className="w-4 h-4 text-amber-600" />
            <span>Protokół Poranny</span>
          </div>
          {morningItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2 rounded-lg bg-white/90 border border-slate-200 text-xs shadow-xs"
            >
              <button
                onClick={() => handleToggle(item.id)}
                className="flex items-center gap-2 text-left flex-1"
              >
                {item.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                )}
                <span className={item.completed ? 'line-through text-slate-400 font-medium' : 'text-slate-800 font-semibold'}>
                  {item.title}
                </span>
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="text-slate-300 hover:text-rose-500 p-1"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Evening Column */}
        <div className="space-y-2 p-3 rounded-xl bg-indigo-50/50 border border-indigo-200/60">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-800 mb-2">
            <Moon className="w-4 h-4 text-indigo-600" />
            <span>Protokół Wieczorny</span>
          </div>
          {eveningItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2 rounded-lg bg-white/90 border border-slate-200 text-xs shadow-xs"
            >
              <button
                onClick={() => handleToggle(item.id)}
                className="flex items-center gap-2 text-left flex-1"
              >
                {item.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                )}
                <span className={item.completed ? 'line-through text-slate-400 font-medium' : 'text-slate-800 font-semibold'}>
                  {item.title}
                </span>
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="text-slate-300 hover:text-rose-500 p-1"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
};
