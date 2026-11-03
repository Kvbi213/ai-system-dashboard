import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { RestTimerOverlay, NextSetInfo } from './RestTimerOverlay';
import { Dumbbell, Plus, Minus, Timer, Check, Settings, X, RotateCcw, SlidersHorizontal } from 'lucide-react';
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
const REST_DURATION_KEY = 'omnidash_rest_duration';

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

  const [targetRestDuration, setTargetRestDuration] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(REST_DURATION_KEY);
      return stored ? Math.max(10, parseInt(stored, 10)) : 90;
    } catch {
      return 90;
    }
  });

  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [nextSetInfo, setNextSetInfo] = useState<NextSetInfo | null>(null);
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
    localStorage.setItem(REST_DURATION_KEY, targetRestDuration.toString());
  }, [targetRestDuration]);

  // Rest countdown interval loop
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

  // Compute what is the next upcoming set / exercise
  const calculateNextSetInfo = (currentExerciseId: string): NextSetInfo => {
    const currentIndex = exercises.findIndex((ex) => ex.id === currentExerciseId);
    if (currentIndex === -1) {
      return {
        exerciseName: 'Kolejna seria',
        setNumber: 1,
        totalSets: 1,
        reps: 0,
        weightKg: 0,
        isNewExercise: false,
        isWorkoutFinished: false
      };
    }

    const currentEx = exercises[currentIndex];
    const nextCompleted = currentEx.completedSets + 1;

    // Next set is in the same exercise
    if (nextCompleted < currentEx.sets) {
      return {
        exerciseName: currentEx.name,
        setNumber: nextCompleted + 1,
        totalSets: currentEx.sets,
        reps: currentEx.reps,
        weightKg: currentEx.weightKg,
        isNewExercise: false,
        isWorkoutFinished: false
      };
    }

    // Current exercise is finished! Find next exercise in the plan
    for (let i = currentIndex + 1; i < exercises.length; i++) {
      const nextEx = exercises[i];
      if (nextEx.completedSets < nextEx.sets) {
        return {
          exerciseName: nextEx.name,
          setNumber: nextEx.completedSets + 1,
          totalSets: nextEx.sets,
          reps: nextEx.reps,
          weightKg: nextEx.weightKg,
          isNewExercise: true,
          isWorkoutFinished: false
        };
      }
    }

    // Check earlier incomplete exercises if any
    for (let i = 0; i < currentIndex; i++) {
      const nextEx = exercises[i];
      if (nextEx.completedSets < nextEx.sets) {
        return {
          exerciseName: nextEx.name,
          setNumber: nextEx.completedSets + 1,
          totalSets: nextEx.sets,
          reps: nextEx.reps,
          weightKg: nextEx.weightKg,
          isNewExercise: true,
          isWorkoutFinished: false
        };
      }
    }

    // All exercises and sets finished
    return {
      exerciseName: currentEx.name,
      setNumber: currentEx.sets,
      totalSets: currentEx.sets,
      reps: currentEx.reps,
      weightKg: currentEx.weightKg,
      isNewExercise: false,
      isWorkoutFinished: true
    };
  };

  const handleIncrementSet = (id: string) => {
    const nextInfo = calculateNextSetInfo(id);
    setNextSetInfo(nextInfo);

    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id === id && ex.completedSets < ex.sets) {
          return { ...ex, completedSets: ex.completedSets + 1 };
        }
        return ex;
      })
    );

    // Launch Rest Timer & Open Animated OLED True Black Overlay
    setRestTimer(targetRestDuration);
    setIsOverlayOpen(true);

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
    <>
      {/* Full Animated OLED True Black Rest Timer Overlay */}
      <RestTimerOverlay
        isOpen={isOverlayOpen}
        secondsRemaining={restTimer !== null ? restTimer : targetRestDuration}
        nextSet={nextSetInfo}
        onSetSeconds={(val) => {
          setRestTimer(val);
          setTargetRestDuration(val);
        }}
        onAdjustSeconds={(delta) => {
          setRestTimer((prev) => Math.max(0, Math.min(300, (prev !== null ? prev : targetRestDuration) + delta)));
        }}
        onSkip={() => {
          setRestTimer(null);
          setIsOverlayOpen(false);
        }}
        onClose={() => setIsOverlayOpen(false)}
      />

      <GlassCard className="p-4 sm:p-5" glow="sky">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 shadow-sm">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Trening Siłowy FBW (Kalistenika)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Drążek, dipy i trening z masą ciała</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Active Rest Countdown Badge (Clickable to re-open Overlay) */}
            {restTimer !== null ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/60 text-amber-800 dark:text-amber-300 font-mono text-xs font-bold shadow-sm animate-pulse">
                <button
                  onClick={() => setIsOverlayOpen(true)}
                  className="flex items-center gap-1.5 hover:underline"
                  title="Otwórz pełną nakładkę licznika serii"
                >
                  <Timer className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-spin" />
                  <span>Przerwa: {formatTimer(restTimer)}</span>
                </button>
                <button
                  onClick={() => setRestTimer((prev) => (prev ? prev + 15 : null))}
                  className="text-[10px] text-amber-700 dark:text-amber-400 hover:text-amber-900 font-mono px-1 rounded hover:bg-amber-100 dark:hover:bg-amber-900/40 transition"
                  title="Dodaj 15 sekund"
                >
                  +15s
                </button>
                <button
                  onClick={() => setRestTimer(null)}
                  className="text-slate-400 hover:text-rose-600 transition ml-0.5"
                  title="Zakończ przerwę"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  const firstIncomplete = exercises.find((ex) => ex.completedSets < ex.sets);
                  if (firstIncomplete) {
                    setNextSetInfo(calculateNextSetInfo(firstIncomplete.id));
                  }
                  setIsOverlayOpen(true);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                title="Otwórz nakładkę licznika i 3D Ruler Wheel"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Przerwa: {targetRestDuration}s</span>
              </button>
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
          <form onSubmit={handleAddExercise} className="p-3 mb-3 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 space-y-2">
            <input
              type="text"
              placeholder="Nazwa ćwiczenia (np. Pompki w staniu na rękach)..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
            />
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300">Serie:</label>
                <input
                  type="number"
                  min="1"
                  value={newSets}
                  onChange={(e) => setNewSets(e.target.value)}
                  className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300">Powtórzenia:</label>
                <input
                  type="number"
                  min="1"
                  value={newReps}
                  onChange={(e) => setNewReps(e.target.value)}
                  className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300">Ciężar (kg):</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
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
              className="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-sm transition hover:bg-white dark:hover:bg-slate-900"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{ex.name}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 font-medium">
                    Ciężar: {ex.weightKg > 0 ? `+${ex.weightKg} kg` : 'Masa ciała'} • Cel: {ex.sets}x{ex.reps}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setEditingId(editingId === ex.id ? null : ex.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition"
                    title="Edytuj parametry"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDecrementSet(ex.id)}
                    className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 active:scale-95 transition shadow-sm"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <span className="font-mono text-xs font-bold text-sky-700 dark:text-sky-400 w-12 text-center">
                    {ex.completedSets} / {ex.sets}
                  </span>

                  <button
                    onClick={() => handleIncrementSet(ex.id)}
                    disabled={ex.completedSets >= ex.sets}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center active:scale-95 transition shadow-sm ${
                      ex.completedSets >= ex.sets
                        ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 cursor-default font-bold'
                        : 'bg-sky-600 hover:bg-sky-500 text-white'
                    }`}
                    title={ex.completedSets >= ex.sets ? 'Serie ukończone' : `Zalicz serię (start przerwę ${targetRestDuration}s)`}
                  >
                    {ex.completedSets >= ex.sets ? <Check className="w-4 h-4" /> : <Plus className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {editingId === ex.id && (
                <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Serie:</span>
                    <input
                      type="number"
                      min="1"
                      value={ex.sets}
                      onChange={(e) => handleUpdateExercise(ex.id, { sets: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                      className="w-12 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                    />
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 ml-1">Powt:</span>
                    <input
                      type="number"
                      min="1"
                      value={ex.reps}
                      onChange={(e) => handleUpdateExercise(ex.id, { reps: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                      className="w-12 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                    />
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 ml-1">Kg:</span>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={ex.weightKg}
                      onChange={(e) => handleUpdateExercise(ex.id, { weightKg: Math.max(0, parseFloat(e.target.value) || 0) })}
                      className="w-14 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateExercise(ex.id, { completedSets: 0 })}
                      className="text-[10px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 font-mono"
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
    </>
  );
};
