import React, { useState } from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { CheckCircle2, Circle, Flame, Droplet, BookOpen, Code2, Sparkles } from 'lucide-react';
import { workoutsApi } from '../../../api/client';

export interface HabitItem {
  id: string;
  title: string;
  streakDays: number;
  completedToday: boolean;
  category: string;
  icon: any;
}

const INITIAL_HABITS: HabitItem[] = [
  { id: 'h1', title: 'Woda minimum 2.5 Litra', streakDays: 18, completedToday: true, category: 'Zdrowie', icon: Droplet },
  { id: 'h2', title: 'Fiszki z języka niemieckiego [wymowa]', streakDays: 12, completedToday: true, category: 'Nauka', icon: BookOpen },
  { id: 'h3', title: 'Programowanie & Git Commit w repozytorium', streakDays: 34, completedToday: true, category: 'Dev', icon: Code2 },
  { id: 'h4', title: 'Czytanie literatury technicznej (20 min)', streakDays: 9, completedToday: false, category: 'Umysł', icon: Sparkles }
];

export const DailyHabitStreaks: React.FC = () => {
  const [habits, setHabits] = useState<HabitItem[]>(INITIAL_HABITS);

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

        <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 shadow-sm">
          {habits.filter((h) => h.completedToday).length} / {habits.length} zaliczone
        </span>
      </div>

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
                <p className="text-[10px] text-slate-500 font-medium">{habit.category}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-mono text-xs font-bold shadow-sm">
              <Flame className="w-3.5 h-3.5 text-amber-600" />
              <span>{habit.streakDays} dni</span>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};
