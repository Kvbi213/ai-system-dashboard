import React, { useState } from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Dumbbell, Plus, Minus, Timer, Check } from 'lucide-react';

export interface ExerciseItem {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weightKg: number;
  completedSets: number;
}

const INITIAL_EXERCISES: ExerciseItem[] = [
  { id: '1', name: 'Podciąganie na drążku (nachwyt)', sets: 4, reps: 8, weightKg: 0, completedSets: 2 },
  { id: '2', name: 'Dipy na poręczach (poddasze)', sets: 4, reps: 10, weightKg: 5, completedSets: 1 },
  { id: '3', name: 'Pompki na uchwytach z deficytem', sets: 3, reps: 15, weightKg: 0, completedSets: 0 },
  { id: '4', name: 'Wznosy nóg do drążka (brzuch)', sets: 3, reps: 12, weightKg: 0, completedSets: 0 }
];

export const AtticFBWTracker: React.FC = () => {
  const [exercises, setExercises] = useState<ExerciseItem[]>(INITIAL_EXERCISES);
  const [restTimer, setRestTimer] = useState<number | null>(null);

  const handleIncrementSet = (id: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id === id && ex.completedSets < ex.sets) {
          return { ...ex, completedSets: ex.completedSets + 1 };
        }
        return ex;
      })
    );
    // Start 90s rest timer
    setRestTimer(90);
  };

  const handleDecrementSet = (id: string) => {
    setExercises((prev) =>
      prev.map((ex) => (ex.id === id && ex.completedSets > 0 ? { ...ex, completedSets: ex.completedSets - 1 } : ex))
    );
  };

  return (
    <GlassCard className="p-4 sm:p-5" glow="sky">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Trening FBW Poddasze</h3>
            <p className="text-xs text-slate-400">Drążek, dipy i kalistenika domowa</p>
          </div>
        </div>

        {restTimer !== null && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-300 font-mono text-xs">
            <Timer className="w-3.5 h-3.5 animate-spin" />
            <span>Przerwa: {restTimer}s</span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {exercises.map((ex) => (
          <div
            key={ex.id}
            className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-semibold text-slate-200">{ex.name}</p>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Ciężar: {ex.weightKg > 0 ? `+${ex.weightKg} kg` : 'Masa ciała'} • Cel: {ex.sets}x{ex.reps}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDecrementSet(ex.id)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 active:scale-95 transition"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <span className="font-mono text-xs font-bold text-sky-300 w-12 text-center">
                {ex.completedSets} / {ex.sets}
              </span>

              <button
                onClick={() => handleIncrementSet(ex.id)}
                disabled={ex.completedSets >= ex.sets}
                className={`w-8 h-8 rounded-xl flex items-center justify-center active:scale-95 transition ${
                  ex.completedSets >= ex.sets
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                    : 'bg-sky-500 hover:bg-sky-400 text-white'
                }`}
              >
                {ex.completedSets >= ex.sets ? <Check className="w-4 h-4" /> : <Plus className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};
