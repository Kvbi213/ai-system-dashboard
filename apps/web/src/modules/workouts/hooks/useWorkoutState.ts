import { useSyncExternalStore, useCallback } from 'react';
import { workoutsApi } from '../../../api/client';

export interface ExerciseItem {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weightKg: number;
  completedSets: number;
}

export interface WorkoutState {
  exercises: ExerciseItem[];
  streakDays: number;
  activeCycle: string;
}

export const WORKOUT_STORAGE_KEY = 'omnidash_fbw_exercises';
export const WORKOUT_STREAK_KEY = 'omnidash_workout_streak';
export const WORKOUT_UPDATE_EVENT = 'omnidash_workout_update';

export const INITIAL_EXERCISES: ExerciseItem[] = [
  { id: '1', name: 'Podciąganie na drążku (nachwyt)', sets: 4, reps: 8, weightKg: 0, completedSets: 2 },
  { id: '2', name: 'Dipy na poręczach (kalistenika)', sets: 4, reps: 10, weightKg: 5, completedSets: 1 },
  { id: '3', name: 'Pompki na uchwytach z deficytem', sets: 3, reps: 15, weightKg: 0, completedSets: 0 },
  { id: '4', name: 'Wznosy nóg do drążka (brzuch)', sets: 3, reps: 12, weightKg: 0, completedSets: 0 }
];

function loadStoredState(): WorkoutState {
  let exercises = INITIAL_EXERCISES;
  let streakDays = 4;

  try {
    const raw = localStorage.getItem(WORKOUT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        exercises = parsed;
      }
    }
  } catch {
    // Fallback
  }

  try {
    const rawStreak = localStorage.getItem(WORKOUT_STREAK_KEY);
    if (rawStreak) {
      const val = parseInt(rawStreak, 10);
      if (!isNaN(val) && val >= 0) streakDays = val;
    }
  } catch {
    // Fallback
  }

  return {
    exercises,
    streakDays,
    activeCycle: 'FBW Podciąganie A'
  };
}

class WorkoutStore {
  private state: WorkoutState;
  private listeners = new Set<() => void>();

  constructor() {
    this.state = loadStoredState();

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', () => {
        this.state = loadStoredState();
        this.emit();
      });

      // Synchronizacja z bazą API w tle
      workoutsApi.getExercises()
        .then((res) => {
          if (res?.exercises && res.exercises.length > 0) {
            const merged = res.exercises.map((serverEx: any) => {
              const local = this.state.exercises.find((p) => p.id === serverEx.id || p.name === serverEx.name);
              return {
                id: String(serverEx.id),
                name: serverEx.name,
                sets: Number(serverEx.sets || 4),
                reps: Number(serverEx.reps || 10),
                weightKg: Number(serverEx.weightKg || 0),
                completedSets: local ? local.completedSets : Number(serverEx.completedSets || 0)
              };
            });
            this.setExercises(merged);
          }
        })
        .catch(() => {});
    }
  }

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  public getSnapshot = (): WorkoutState => {
    return this.state;
  };

  private emit(): void {
    try {
      localStorage.setItem(WORKOUT_STORAGE_KEY, JSON.stringify(this.state.exercises));
      localStorage.setItem(WORKOUT_STREAK_KEY, this.state.streakDays.toString());
    } catch {
      // Ignored
    }
    for (const listener of this.listeners) {
      listener();
    }
  }

  public setExercises(exercises: ExerciseItem[]): void {
    this.state = { ...this.state, exercises };
    this.emit();
  }

  public setStreak(streakDays: number): void {
    this.state = { ...this.state, streakDays: Math.max(0, streakDays) };
    this.emit();
  }

  public incrementSet(id: string): void {
    const next = this.state.exercises.map((ex) => {
      if (ex.id === id) {
        return { ...ex, completedSets: Math.min(ex.sets, (ex.completedSets || 0) + 1) };
      }
      return ex;
    });
    this.setExercises(next);
  }

  public decrementSet(id: string): void {
    const next = this.state.exercises.map((ex) => {
      if (ex.id === id) {
        return { ...ex, completedSets: Math.max(0, (ex.completedSets || 0) - 1) };
      }
      return ex;
    });
    this.setExercises(next);
  }

  public resetExercise(id: string): void {
    const next = this.state.exercises.map((ex) => (ex.id === id ? { ...ex, completedSets: 0 } : ex));
    this.setExercises(next);
  }

  public resetAllSets(): void {
    const next = this.state.exercises.map((ex) => ({ ...ex, completedSets: 0 }));
    this.setExercises(next);
  }

  public addExercise(item: { name: string; sets: number; reps: number; weightKg: number }): void {
    const newEx: ExerciseItem = {
      id: `fbw_${Date.now()}`,
      name: item.name,
      sets: item.sets,
      reps: item.reps,
      weightKg: item.weightKg,
      completedSets: 0
    };
    this.setExercises([...this.state.exercises, newEx]);
  }

  public removeExercise(id: string): void {
    const next = this.state.exercises.filter((ex) => ex.id !== id);
    this.setExercises(next);
  }
}

export const workoutStore = new WorkoutStore();

export function useWorkoutState() {
  const state = useSyncExternalStore(workoutStore.subscribe, workoutStore.getSnapshot);

  const completedSets = state.exercises.reduce((sum, ex) => sum + (ex.completedSets || 0), 0);
  const totalSets = state.exercises.reduce((sum, ex) => sum + (ex.sets || 0), 0);
  const isWorkoutComplete = totalSets > 0 && completedSets >= totalSets;

  const incrementSet = useCallback((id: string) => workoutStore.incrementSet(id), []);
  const decrementSet = useCallback((id: string) => workoutStore.decrementSet(id), []);
  const resetExercise = useCallback((id: string) => workoutStore.resetExercise(id), []);
  const resetAllSets = useCallback(() => workoutStore.resetAllSets(), []);
  const addExercise = useCallback((item: { name: string; sets: number; reps: number; weightKg: number }) => workoutStore.addExercise(item), []);
  const removeExercise = useCallback((id: string) => workoutStore.removeExercise(id), []);
  const updateStreak = useCallback((days: number) => workoutStore.setStreak(days), []);

  return {
    exercises: state.exercises,
    completedSets,
    totalSets,
    streakDays: state.streakDays,
    activeCycle: state.activeCycle,
    isWorkoutComplete,
    incrementSet,
    decrementSet,
    resetExercise,
    resetAllSets,
    addExercise,
    removeExercise,
    updateStreak
  };
}
