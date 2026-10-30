import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Dumbbell, Plus, Minus, Timer, Check, Settings, X, RotateCcw } from 'lucide-react';
import { workoutsApi } from '../../../api/client';

export interface ExerciseItem {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weightKg: number;
  completedSets: number;
}

const STORAGE_KEY = 'omnidash_fbw_exercises';

const INITIAL_EXERCISES: ExerciseItem[] = [
  { id: '1', name: 'Podciąganie na drążku (nachwyt)', sets: 4, reps: 8, weightKg: 0, completedSets: 2 },
  { id: '2', name: 'Dipy na poręczach (kalistenika)', sets: 4, reps: 10, weightKg: 5, completedSets: 1 },
  { id: '3', name: 'Pompki na uchwytach z deficytem', sets: 3, reps: 15, weightKg: 0, completedSets: 0 },
  { id: '4', name: 'Wznosy nóg do drążka (brzuch)', sets: 3, reps: 12, weightKg: 0, completedSets: 0 }
];

export const AtticFBWTracker: React.FC = () => {
  const [exercises, setExercises] = useState<ExerciseItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : INITIAL_EXERCISES;
    } catch {
      return INITIAL_EXERCISES;
    }
  });

  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSets, setNewSets] = useState('4');
  const [newReps, setNewReps] = useState('10');
  const [newWeight, setNewWeight] = useState('0');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(exercises));
  }, [exercises]);

  useEffect(() => {
    if (restTimer === null) return;
    if (restTimer <= 0) {
      setRestTimer(null);
      return;
    }
    const interval = setInterval(() => {
      setRestTimer((prev) => (prev !== null && prev > 0 ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(interval);
  }, [restTimer]);

  const handleIncrementSet = (id: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id === id && ex.completedSets < ex.sets) {
          return { ...ex, completedSets: ex.completedSets + 1 };
        }
        return ex;
      })
    );
    // Automatic 1:30 (90 seconds) rest countdown
    setRestTimer(90);

    workoutsApi.incrementSet(id).catch(() => {
      // Local state already updated
    });
  };

  const handleDecrementSet = (id: string) => {
    setExercises((prev) =>
      prev.map((ex) => (ex.id === id && ex.completedSets > 0 ? { ...ex, completedSets: ex.completedSets - 1 } : ex))
    );
  };

  const handleUpdateExercise = (id: string, updates: Partial<ExerciseItem>) => {
    setExercises((prev) => prev.map((ex) => (ex.id === id ? { ...ex, ...updates } : ex)));
  };

  const handleDeleteExercise = (id: string) => {
    setExercises((prev) => prev.filter((ex) => ex.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const handleAddExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const newEx: ExerciseItem = {
      id: Date.now().toString(),
      name: newName.trim(),
      sets: Math.max(1, parseInt(newSets, 10) || 1),
      reps: Math.max(1, parseInt(newReps, 10) || 1),
      weightKg: Math.max(0, parseFloat(newWeight) || 0),
      completedSets: 0
    };
    setExercises([...exercises, newEx]);
    setNewName('');
    setIsAdding(false);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <GlassCard className="p-4 sm:p-5" glow="sky">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Trening Siłowy FBW (Kalistenika)</h3>
            <p className="text-xs text-slate-500 font-medium">Drążek, dipy i trening z masą ciała</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {restTimer !== null && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-300 text-sky-800 font-mono text-xs font-bold shadow-sm animate-pulse">
              <Timer className="w-3.5 h-3.5 text-sky-600 animate-spin" />
              <span>Przerwa: {formatTimer(restTimer)}</span>
              <button
                onClick={() => setRestTimer(null)}
                className="text-slate-400 hover:text-rose-600 transition ml-1"
                title="Pomiń przerwę"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/20 active:scale-95 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ćwiczenie</span>
          </button>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleAddExercise} className="p-3 mb-3 rounded-xl bg-sky-50/70 border border-sky-200 space-y-2">
          <input
            type="text"
            placeholder="Nazwa ćwiczenia (np. Pompki w staniu na rękach)..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900"
          />
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-600">Serie:</label>
              <input
                type="number"
                min="1"
                value={newSets}
                onChange={(e) => setNewSets(e.target.value)}
                className="w-full px-2 py-1 rounded bg-white border border-slate-300 text-xs text-slate-900"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-600">Powtórzenia:</label>
              <input
                type="number"
                min="1"
                value={newReps}
                onChange={(e) => setNewReps(e.target.value)}
                className="w-full px-2 py-1 rounded bg-white border border-slate-300 text-xs text-slate-900"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-600">Ciężar (kg):</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                className="w-full px-2 py-1 rounded bg-white border border-slate-300 text-xs text-slate-900"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition shadow-xs"
          >
            Zapisz nowe ćwiczenie
          </button>
        </form>
      )}

      <div className="space-y-3">
        {exercises.map((ex) => (
          <div
            key={ex.id}
            className="p-3 rounded-2xl bg-white/70 border border-slate-200/80 shadow-sm transition hover:bg-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">{ex.name}</p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5 font-medium">
                  Ciężar: {ex.weightKg > 0 ? `+${ex.weightKg} kg` : 'Masa ciała'} • Cel: {ex.sets}x{ex.reps}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setEditingId(editingId === ex.id ? null : ex.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 transition"
                  title="Edytuj parametry"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleDecrementSet(ex.id)}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-600 active:scale-95 transition shadow-sm"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                <span className="font-mono text-xs font-bold text-sky-700 w-12 text-center">
                  {ex.completedSets} / {ex.sets}
                </span>

                <button
                  onClick={() => handleIncrementSet(ex.id)}
                  disabled={ex.completedSets >= ex.sets}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center active:scale-95 transition shadow-sm ${
                    ex.completedSets >= ex.sets
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 cursor-default font-bold'
                      : 'bg-sky-600 hover:bg-sky-500 text-white'
                  }`}
                  title={ex.completedSets >= ex.sets ? 'Serie ukończone' : 'Zalicz serię (start przerwę 1:30)'}
                >
                  {ex.completedSets >= ex.sets ? <Check className="w-4 h-4" /> : <Plus className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {editingId === ex.id && (
              <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-600">Serie:</span>
                  <input
                    type="number"
                    min="1"
                    value={ex.sets}
                    onChange={(e) => handleUpdateExercise(ex.id, { sets: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                    className="w-12 px-1.5 py-0.5 rounded border border-slate-300 text-xs font-mono"
                  />
                  <span className="text-[11px] font-bold text-slate-600 ml-1">Powt:</span>
                  <input
                    type="number"
                    min="1"
                    value={ex.reps}
                    onChange={(e) => handleUpdateExercise(ex.id, { reps: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                    className="w-12 px-1.5 py-0.5 rounded border border-slate-300 text-xs font-mono"
                  />
                  <span className="text-[11px] font-bold text-slate-600 ml-1">Kg:</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={ex.weightKg}
                    onChange={(e) => handleUpdateExercise(ex.id, { weightKg: Math.max(0, parseFloat(e.target.value) || 0) })}
                    className="w-14 px-1.5 py-0.5 rounded border border-slate-300 text-xs font-mono"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateExercise(ex.id, { completedSets: 0 })}
                    className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-mono"
                    title="Zresetuj serie"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                  <button
                    onClick={() => handleDeleteExercise(ex.id)}
                    className="text-[10px] text-rose-500 hover:text-rose-700 font-bold"
                  >
                    Usuń
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </GlassCard>
  );
};
