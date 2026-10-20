import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Dumbbell, Plus, Trash2, Calendar, Clock, Activity, Flame, Search, 
  Sparkles, Filter, CheckCircle2, Play, Pause, RotateCcw, Timer, Award, ChevronRight, X, ArrowLeft, Check
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import { subscribeCollection, saveCloudDocument, deleteCloudDocument, isCloudEnvironment } from '../services/cloudSync';
import { DEFAULT_WORKOUT_HISTORY } from '../config/initialData';

export const DEFAULT_PLANS = [
  {
    id: 'fbw_a',
    title: 'FBW Strych • Kondycja A',
    subtitle: 'Plan bazowy: Plecy, Klatka, Barki, Nogi, Core',
    category: 'Siłowy',
    durationEst: '60 min',
    totalSets: 12,
    tempo: '3-0-1-0',
    exercises: [
      { id: 'ex1', name: 'Podciąganie na drążku', muscle: 'Plecy + Biceps', sets: 2, defaultReps: 10, defaultLoad: 'Guma Czarna (15kg asysta)' },
      { id: 'ex2', name: 'Dipy na poręczach / Pompki', muscle: 'Klatka + Barki + Triceps', sets: 2, defaultReps: 12, defaultLoad: 'Masa ciała (78.4 kg)' },
      { id: 'ex3', name: 'Wiosłowanie hantlem w opadzie', muscle: 'Grzbiet + Ramiona', sets: 2, defaultReps: 12, defaultLoad: 'Hantle 22.5 kg' },
      { id: 'ex4', name: 'Wyciskanie hantli nad głowę OHP', muscle: 'Barki', sets: 2, defaultReps: 10, defaultLoad: 'Hantle 16.0 kg' },
      { id: 'ex5', name: 'Goblet Squat z hantlem przy klatce', muscle: 'Nogi', sets: 2, defaultReps: 12, defaultLoad: 'Hantel 26.0 kg' },
      { id: 'ex6', name: 'Unoszenie kolan do klatki w wiszeniu', muscle: 'Brzuch / Core', sets: 2, defaultReps: 15, defaultLoad: 'Masa ciała' }
    ]
  },
  {
    id: 'fbw_b',
    title: 'FBW Strych • Kondycja B',
    subtitle: 'Skupienie: Rumuński MC, Skos, Wznosy, Wykroki',
    category: 'Siłowy',
    durationEst: '55 min',
    totalSets: 10,
    tempo: '3-1-1-0',
    exercises: [
      { id: 'ex1_b', name: 'Rumuński Martwy Ciąg (RDL)', muscle: 'Dwugłowe + Pośladki + Grzbiet', sets: 2, defaultReps: 10, defaultLoad: 'Hantle 28.0 kg' },
      { id: 'ex2_b', name: 'Wyciskanie hantli na ławce skos dodatni', muscle: 'Klatka (góra) + Triceps', sets: 2, defaultReps: 10, defaultLoad: 'Hantle 24.0 kg' },
      { id: 'ex3_b', name: 'Ściąganie gumy do klatki / Face Pull', muscle: 'Tył barku + Czworoboczny', sets: 2, defaultReps: 15, defaultLoad: 'Guma czerwona' },
      { id: 'ex4_b', name: 'Wznosy hantli bokiem (Lateral Raises)', muscle: 'Boczny akton barku', sets: 2, defaultReps: 12, defaultLoad: 'Hantle 9.0 kg' },
      { id: 'ex5_b', name: 'Wykroki w miejscu z hantlami', muscle: 'Czworogłowe + Pośladki', sets: 2, defaultReps: 12, defaultLoad: 'Hantle 14.0 kg' }
    ]
  },
  {
    id: 'calisthenics',
    title: 'Kalistenika & Stabilizacja Core',
    subtitle: 'Masa własnego ciała, kontrola motoryczna i izometria',
    category: 'Kalistenika',
    durationEst: '45 min',
    totalSets: 10,
    tempo: '2-1-2-0',
    exercises: [
      { id: 'cal1', name: 'Pompki diamentowe', muscle: 'Triceps + Klatka', sets: 2, defaultReps: 15, defaultLoad: 'Masa ciała' },
      { id: 'cal2', name: 'Podciąganie nachwytem szeroko', muscle: 'Najszerszy grzbietu', sets: 2, defaultReps: 8, defaultLoad: 'Masa ciała' },
      { id: 'cal3', name: 'Pompki szwedzkie na poręczach', muscle: 'Klatka + Triceps', sets: 2, defaultReps: 12, defaultLoad: 'Masa ciała' },
      { id: 'cal4', name: 'Deska (Plank) izometryczna', muscle: 'Core / Stabilizacja', sets: 2, defaultReps: 60, defaultLoad: 'Czas: 60s' },
      { id: 'cal5', name: 'Hollow Body Hold', muscle: 'Mięśnie głębokie brzucha', sets: 2, defaultReps: 45, defaultLoad: 'Czas: 45s' }
    ]
  },
  {
    id: 'recovery',
    title: 'Regeneracja, Mobilność & Stretching',
    subtitle: 'Rolowanie powięziowe, rozciąganie i techniki oddechowe',
    category: 'Regeneracja',
    durationEst: '35 min',
    totalSets: 6,
    tempo: 'Płynne',
    exercises: [
      { id: 'rec1', name: 'Rolowanie pasma biodrowo-piszczelowego', muscle: 'Całe ciało', sets: 2, defaultReps: 12, defaultLoad: 'Roller twardy' },
      { id: 'rec2', name: 'Rozciąganie zginaczy bioder i pośladków', muscle: 'Biodra / Miednica', sets: 2, defaultReps: 10, defaultLoad: 'Masa ciała' },
      { id: 'rec3', name: 'Mobilizacja obręczy barkowej z gumą', muscle: 'Barki + Klatka', sets: 2, defaultReps: 15, defaultLoad: 'Guma lekka' }
    ]
  }
];

export const WorkoutsPage = () => {
  const { t } = useTranslation();

  // Training Plans Catalog state
  const [plans, setPlans] = useState(() => {
    try {
      const saved = localStorage.getItem('system_workout_plans');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_PLANS;
  });

  // Active Selected Plan (null by default = user selects workout first)
  const [activePlan, setActivePlan] = useState(() => {
    try {
      const saved = localStorage.getItem('system_active_workout_plan');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  // Main View Mode: 'catalog' | 'active_session' | 'history'
  const [viewMode, setViewMode] = useState(() => activePlan ? 'active_session' : 'catalog');

  // History & Database state
  const [workouts, setWorkouts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  // New Custom Plan Modal
  const [showNewPlanModal, setShowNewPlanModal] = useState(false);
  const [newPlanForm, setNewPlanForm] = useState({
    title: '',
    subtitle: '',
    category: 'Siłowy',
    durationEst: '45 min',
    exercisesStr: 'Podciąganie (2x10), Dipy (2x12), Wznosy (2x15)'
  });

  // Session Stopwatch
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const [isStopwatchPaused, setIsStopwatchPaused] = useState(false);

  useEffect(() => {
    let interval = null;
    if (viewMode === 'active_session' && !isStopwatchPaused) {
      interval = setInterval(() => {
        setStopwatchSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [viewMode, isStopwatchPaused]);

  const formattedStopwatch = useMemo(() => {
    const mins = Math.floor(stopwatchSeconds / 60);
    const secs = stopwatchSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [stopwatchSeconds]);

  // Exercise Sets State
  const [setsState, setSetsState] = useState(() => {
    try {
      const saved = localStorage.getItem('system_active_sets_state');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  // Rest Timer State
  const [restDuration, setRestDuration] = useState(90);
  const [restRemaining, setRestRemaining] = useState(90);
  const [isRestRunning, setIsRestRunning] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isRestRunning && restRemaining > 0) {
      interval = setInterval(() => {
        setRestRemaining(r => r - 1);
      }, 1000);
    } else if (restRemaining === 0) {
      setIsRestRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRestRunning, restRemaining]);

  const formattedRest = useMemo(() => {
    const mins = Math.floor(restRemaining / 60);
    const secs = restRemaining % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [restRemaining]);

  const restProgressPercent = useMemo(() => {
    if (restDuration === 0) return 0;
    return Math.min(100, Math.max(0, Math.round(((restDuration - restRemaining) / restDuration) * 100)));
  }, [restRemaining, restDuration]);

  const startRestTimer = (seconds = 90) => {
    setRestDuration(seconds);
    setRestRemaining(seconds);
    setIsRestRunning(true);
  };

  const adjustRestTimer = (delta) => {
    setRestRemaining(r => Math.max(0, r + delta));
  };

  // Launch Workout Session
  const handleLaunchPlan = (plan) => {
    setActivePlan(plan);
    localStorage.setItem('system_active_workout_plan', JSON.stringify(plan));
    
    // Initialize sets
    const initialSets = {};
    plan.exercises.forEach((ex, exIdx) => {
      for (let s = 1; s <= ex.sets; s++) {
        const key = `${ex.id}_s${s}`;
        initialSets[key] = {
          done: false,
          reps: ex.defaultReps || 10,
          load: ex.defaultLoad || 'Masa ciała'
        };
      }
    });

    setSetsState(initialSets);
    localStorage.setItem('system_active_sets_state', JSON.stringify(initialSets));
    setStopwatchSeconds(0);
    setIsStopwatchPaused(false);
    setViewMode('active_session');
  };

  // Exit / Change Plan
  const handleExitPlan = () => {
    if (completedSetsCount > 0 && !window.confirm('W toku jest aktywna sesja treningowa. Czy na pewno chcesz opuścić ten trening bez zapisywania?')) {
      return;
    }
    setActivePlan(null);
    localStorage.removeItem('system_active_workout_plan');
    localStorage.removeItem('system_active_sets_state');
    setViewMode('catalog');
  };

  // Completion calculation
  const totalSetsCount = useMemo(() => {
    if (!activePlan) return 12;
    return activePlan.exercises.reduce((acc, ex) => acc + (ex.sets || 2), 0);
  }, [activePlan]);

  const completedSetsCount = useMemo(() => {
    return Object.values(setsState).filter(s => s?.done).length;
  }, [setsState]);

  const completionPercentage = useMemo(() => {
    if (totalSetsCount === 0) return 0;
    return Math.round((completedSetsCount / totalSetsCount) * 100);
  }, [completedSetsCount, totalSetsCount]);

  const updateSetField = (key, field, val) => {
    setSetsState(prev => {
      const updated = {
        ...prev,
        [key]: { ...prev[key], [field]: val }
      };
      localStorage.setItem('system_active_sets_state', JSON.stringify(updated));
      return updated;
    });
  };

  const toggleSetDone = (key) => {
    setSetsState(prev => {
      const current = prev[key] || { done: false, reps: 10, load: '' };
      const nextDone = !current.done;
      const updated = {
        ...prev,
        [key]: { ...current, done: nextDone }
      };
      if (nextDone) {
        startRestTimer(90);
      }
      localStorage.setItem('system_active_sets_state', JSON.stringify(updated));
      return updated;
    });
  };

  // Morning Weight and Note
  const [morningWeight, setMorningWeight] = useState(() => localStorage.getItem('system_body_weight') || '78.4');
  const [weightSavedToast, setWeightSavedToast] = useState(false);
  const [obsidianNote, setObsidianNote] = useState('');
  const [noteSavedToast, setNoteSavedToast] = useState(false);

  const handleSaveWeight = () => {
    localStorage.setItem('system_body_weight', morningWeight);
    setWeightSavedToast(true);
    setTimeout(() => setWeightSavedToast(false), 2000);
  };

  const handleSaveNote = async () => {
    if (!obsidianNote.trim()) return;
    try {
      const today = new Date().toISOString().slice(0, 10);
      const noteDoc = {
        title: `Notatka Treningowa FBW (${today})`,
        content: obsidianNote,
        category: 'workout',
        created_at: new Date().toISOString()
      };
      await saveCloudDocument('user_memory', `note_workout_${Date.now()}`, noteDoc);
      setNoteSavedToast(true);
      setObsidianNote('');
      setTimeout(() => setNoteSavedToast(false), 2500);
    } catch (e) {
      console.warn("Błąd zapisu notatki:", e);
    }
  };

  // Save Session
  const [sessionSavedSuccess, setSessionSavedSuccess] = useState(false);

  const handleSaveSession = async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const duration = Math.max(1, Math.round(stopwatchSeconds / 60));
    const newWorkout = {
      id: 'w_' + Date.now().toString(),
      title: activePlan ? activePlan.title : 'Full Body Workout (FBW) — Split Strych',
      type: activePlan ? activePlan.category : 'Siłowy',
      duration_minutes: duration,
      completed_sets: completedSetsCount,
      total_sets: totalSetsCount,
      weight_kg: parseFloat(morningWeight) || 78.4,
      date: todayStr,
      description: obsidianNote.trim() || `Ukończono ${completedSetsCount}/${totalSetsCount} serii roboczych. Plan: ${activePlan?.title || 'FBW'}.`,
      created_at: new Date().toISOString()
    };

    setWorkouts(prev => [newWorkout, ...(Array.isArray(prev) ? prev : [])]);
    setSessionSavedSuccess(true);
    setTimeout(() => setSessionSavedSuccess(false), 3000);

    await saveCloudDocument('workouts', newWorkout.id, newWorkout);
    if (!isCloudEnvironment()) {
      try {
        await axios.post('/api/workouts', newWorkout);
      } catch (e) {
        console.warn("Błąd zapisu do SQLite:", e);
      }
    }

    // Reset active session and return to history view
    setActivePlan(null);
    localStorage.removeItem('system_active_workout_plan');
    localStorage.removeItem('system_active_sets_state');
    setViewMode('history');
  };

  // Database Load
  useEffect(() => {
    const unsub = subscribeCollection('workouts', (data) => {
      if (Array.isArray(data)) {
        const listToUse = data.length > 0 ? data : DEFAULT_WORKOUT_HISTORY;
        const sorted = [...listToUse].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        setWorkouts(sorted);
      }
    }, DEFAULT_WORKOUT_HISTORY);

    if (!isCloudEnvironment()) {
      axios.get('/api/workouts')
        .then(res => {
          if (Array.isArray(res.data) && res.data.length > 0) {
            setWorkouts(prev => {
              const combined = [...res.data];
              prev.forEach(p => {
                if (!combined.some(c => String(c.id) === String(p.id))) {
                  combined.push(p);
                }
              });
              return combined;
            });
          }
        })
        .catch(() => {});
    }

    return () => unsub();
  }, []);

  const handleDelete = async (id) => {
    const idStr = String(id);
    setWorkouts(prev => prev.filter(w => String(w.id) !== idStr));
    await deleteCloudDocument('workouts', idStr);
    if (!isCloudEnvironment()) {
      try {
        await axios.delete(`/api/workouts/${idStr}`);
      } catch {}
    }
  };

  // Create custom plan
  const handleCreateNewPlan = (e) => {
    e.preventDefault();
    if (!newPlanForm.title.trim()) return;

    const rawExercises = newPlanForm.exercisesStr.split(',').map((s, idx) => {
      const clean = s.trim();
      return {
        id: `custom_${idx}_${Date.now()}`,
        name: clean || `Ćwiczenie ${idx + 1}`,
        muscle: 'Ogólne',
        sets: 2,
        defaultReps: 10,
        defaultLoad: 'Masa ciała'
      };
    });

    const newPlan = {
      id: 'plan_' + Date.now(),
      title: newPlanForm.title.trim(),
      subtitle: newPlanForm.subtitle.trim() || 'Plan użytkownika',
      category: newPlanForm.category,
      durationEst: newPlanForm.durationEst || '45 min',
      totalSets: rawExercises.length * 2,
      tempo: '2-0-2-0',
      exercises: rawExercises
    };

    const updatedPlans = [newPlan, ...plans];
    setPlans(updatedPlans);
    localStorage.setItem('system_workout_plans', JSON.stringify(updatedPlans));
    setShowNewPlanModal(false);
    setNewPlanForm({
      title: '',
      subtitle: '',
      category: 'Siłowy',
      durationEst: '45 min',
      exercisesStr: 'Podciąganie (2x10), Dipy (2x12), Wznosy (2x15)'
    });
  };

  const filteredWorkouts = useMemo(() => {
    return workouts.filter(w => {
      const matchSearch = searchQuery === '' || 
        w.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.description?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;
      if (selectedType === 'all') return true;
      return w.type?.toLowerCase() === selectedType.toLowerCase();
    });
  }, [workouts, searchQuery, selectedType]);

  return (
    <div className="flex flex-col w-full h-full overflow-y-auto custom-scrollbar">
      <div className="flex flex-col gap-space-lg w-full max-w-[1600px] mx-auto pb-space-xl">
        
        {/* Breadcrumb & Session Meta Strip */}
        <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-xs">
          <div className="flex items-center gap-space-xs font-code-mono text-code-mono text-outline">
            <span className="hover:text-on-surface cursor-pointer transition-colors">OmniDash</span>
            <span>/</span>
            <span className="hover:text-on-surface cursor-pointer transition-colors">Tracking &amp; Operations</span>
            <span>/</span>
            <span className="text-primary font-medium">Treningi FBW</span>
          </div>
          <div className="flex items-center gap-space-sm">
            <div className="flex items-center gap-space-xs px-space-sm py-0.5 rounded-full bg-surface-container-high text-label-sm font-label-sm text-outline">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              <span>SQLite WAL v3.44</span>
            </div>
            <div className="flex items-center gap-space-xs px-space-sm py-0.5 rounded-full bg-surface-container-high text-label-sm font-label-sm text-secondary">
              <span className="material-symbols-outlined text-[13px]">cloud_sync</span>
              <span>Obsidian Synced</span>
            </div>
          </div>
        </div>

        {/* Global Top View Selector: Katalog Planów / Aktywna Sesja / Historia */}
        <div className="flex items-center justify-between p-space-sm rounded-xl bg-surface-container-low border border-white/[0.04]">
          <div className="flex items-center gap-space-xs">
            <button
              type="button"
              onClick={() => setViewMode('catalog')}
              className={`px-space-md py-1.5 rounded-lg font-label-md text-label-md font-medium transition-all cursor-pointer ${
                viewMode === 'catalog'
                  ? 'bg-primary text-on-primary font-semibold shadow-md'
                  : 'hover:bg-surface-container text-on-surface-variant'
              }`}
            >
              Katalog Planów ({plans.length})
            </button>

            {activePlan && (
              <button
                type="button"
                onClick={() => setViewMode('active_session')}
                className={`flex items-center gap-1.5 px-space-md py-1.5 rounded-lg font-label-md text-label-md font-medium transition-all cursor-pointer ${
                  viewMode === 'active_session'
                    ? 'bg-secondary-container text-on-secondary-container font-semibold shadow-md'
                    : 'hover:bg-surface-container text-secondary'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>
                <span>Sesja w Toku: {activePlan.title}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setViewMode('history')}
              className={`px-space-md py-1.5 rounded-lg font-label-md text-label-md font-medium transition-all cursor-pointer ${
                viewMode === 'history'
                  ? 'bg-primary text-on-primary font-semibold shadow-md'
                  : 'hover:bg-surface-container text-on-surface-variant'
              }`}
            >
              Historia Treningów ({workouts.length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowNewPlanModal(true)}
            className="px-space-md py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-outline hover:text-on-surface font-label-md text-label-md flex items-center gap-1.5 border border-white/[0.06] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Nowy Plan</span>
          </button>
        </div>

        {/* ----------------- VIEW 1: KATALOG PLANÓW TRENINGOWYCH ----------------- */}
        {viewMode === 'catalog' && (
          <div className="space-y-space-lg">
            <div className="rounded-xl bg-surface-container-low p-space-lg shadow-xl relative overflow-hidden border border-white/[0.04]">
              <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-primary/10 blur-3xl pointer-events-none"></div>
              <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-space-md">
                <div className="space-y-1">
                  <div className="flex items-center gap-space-sm">
                    <span className="px-space-sm py-0.5 rounded-full bg-primary/20 text-primary font-code-mono text-label-sm uppercase font-semibold">
                      Dziennik FBW &amp; Plany Treningowe
                    </span>
                    <span className="font-code-mono text-label-sm text-outline">Kondycja A • Split Strych</span>
                  </div>
                  <h1 className="font-headline-xl text-headline-xl text-on-surface font-semibold tracking-tight">
                    Wybierz Plan i Rozpocznij Trening
                  </h1>
                  <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
                    Wybierz schemat treningowy z biblioteki. Dopiero po zatwierdzeniu wybranego planu uruchamiany jest stoper sesji, steppery serii oraz okrągły rest timer.
                  </p>
                </div>

                <div className="flex items-center gap-space-md shrink-0">
                  <div className="p-space-sm rounded-lg bg-surface-container flex flex-col border border-white/[0.04]">
                    <span className="font-label-sm text-label-sm text-outline uppercase">Ostatni Trening</span>
                    <span className="font-code-mono text-body-md text-on-surface font-semibold">
                      {workouts[0]?.date || 'Brak wpisów'}
                    </span>
                  </div>
                  <div className="p-space-sm rounded-lg bg-surface-container flex flex-col border border-white/[0.04]">
                    <span className="font-label-sm text-label-sm text-outline uppercase">Ukończono Sesji</span>
                    <span className="font-code-mono text-headline-md text-primary font-bold">
                      {workouts.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-space-md">
              {plans.map((plan) => (
                <div 
                  key={plan.id}
                  className="rounded-xl bg-surface-container-low p-space-lg flex flex-col justify-between hover:bg-surface-container transition-all border border-white/[0.04] shadow-md group relative overflow-hidden"
                >
                  <div className="space-y-space-sm">
                    <div className="flex items-center justify-between">
                      <span className="px-space-sm py-0.5 rounded-full bg-primary/10 text-primary font-code-mono text-[11px] font-semibold">
                        {plan.category} • {plan.durationEst}
                      </span>
                      <span className="font-code-mono text-[11px] text-outline">
                        {plan.totalSets} serii roboczych
                      </span>
                    </div>

                    <div>
                      <h3 className="font-headline-md text-headline-md text-on-surface font-semibold group-hover:text-primary transition-colors">
                        {plan.title}
                      </h3>
                      <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                        {plan.subtitle}
                      </p>
                    </div>

                    {/* Exercises preview pills */}
                    <div className="space-y-1.5 pt-2 border-t border-white/[0.04]">
                      <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider block">
                        Ćwiczenia w schemacie:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {plan.exercises.map((ex, idx) => (
                          <span 
                            key={idx} 
                            className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-code-mono text-[11px] border border-white/[0.04]"
                          >
                            {idx + 1}. {ex.name} ({ex.sets}x)
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-space-md mt-space-md border-t border-white/[0.04] flex items-center justify-between">
                    <span className="font-code-mono text-[11px] text-outline">
                      Tempo: {plan.tempo || '3-0-1-0'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleLaunchPlan(plan)}
                      className="px-space-lg py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-primary-fixed-dim transition-all flex items-center gap-2 cursor-pointer shadow-md hover:scale-102 active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                      <span>Rozpocznij Trening</span>
                    </button>
                  </div>
                </div>
              ))}

              {/* Add Custom Plan Card */}
              <div 
                onClick={() => setShowNewPlanModal(true)}
                className="rounded-xl border-2 border-dashed border-white/[0.1] hover:border-primary/50 p-space-lg flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-surface-container-low min-h-[220px]"
              >
                <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-primary mb-space-sm">
                  <span className="material-symbols-outlined text-[24px]">add</span>
                </div>
                <h4 className="font-headline-md text-headline-md text-on-surface font-semibold">
                  Stwórz Własny Plan Treningowy
                </h4>
                <p className="font-body-md text-body-md text-outline mt-1 max-w-sm">
                  Zdefiniuj własne ćwiczenia, liczbę serii i docelowe obciążenia, dostosowane do Twojego sprzętu.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- VIEW 2: AKTYWNA SESJA TRENINGOWA ----------------- */}
        {viewMode === 'active_session' && activePlan && (
          <>
            {/* Header Section with Live HUD Bar */}
            <div className="rounded-xl bg-surface-container-low p-space-lg shadow-xl relative overflow-hidden border border-white/[0.04]">
              <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none"></div>
              <div className="relative flex flex-col xl:flex-row items-start xl:items-center justify-between gap-space-lg">
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center gap-space-sm mb-space-xs">
                    <span className="px-space-sm py-0.5 rounded-full bg-primary/20 text-primary font-code-mono text-label-sm uppercase tracking-wider font-semibold">
                      Aktywna Sesja • {activePlan.title}
                    </span>
                    <span className="font-code-mono text-code-mono text-outline">ID: SES_{new Date().toISOString().slice(0, 10).replace(/-/g, '')}</span>
                  </div>
                  <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-semibold">
                    {activePlan.title}
                  </h1>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    {activePlan.subtitle} • Rejestruj serie robocze, odhaczaj wykonanie i kontroluj odpoczynek.
                  </p>
                </div>

                {/* HUD Telemetry & Quick Session Controls */}
                <div className="flex flex-wrap items-center gap-space-md w-full xl:w-auto">
                  <div className="flex items-center gap-space-md p-space-sm rounded-lg bg-surface-container-high shadow-md border border-white/[0.04]">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Czas Sesji</span>
                      <div className="flex items-center gap-1 font-code-mono text-headline-md text-primary font-semibold">
                        <span className="material-symbols-outlined text-[18px] text-primary">timer</span>
                        <span id="session-stopwatch">{formattedStopwatch}</span>
                      </div>
                    </div>
                    <div className="h-8 w-px bg-surface-variant"></div>
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Ukończono</span>
                      <span className="font-code-mono text-headline-md text-on-surface font-semibold">
                        {completionPercentage}% <span className="font-body-md text-body-md text-outline font-normal">({completedSetsCount}/{totalSetsCount})</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-space-xs">
                    <button 
                      onClick={() => setIsStopwatchPaused(p => !p)}
                      className="h-11 px-space-md rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface transition-colors flex items-center gap-space-xs font-label-md text-label-md active:scale-95 cursor-pointer border border-white/[0.04]" 
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {isStopwatchPaused ? 'play_arrow' : 'pause'}
                      </span>
                      <span>{isStopwatchPaused ? 'Wznów' : 'Pauza'}</span>
                    </button>

                    <button 
                      onClick={handleSaveSession}
                      className="h-11 px-space-lg rounded-lg bg-primary text-on-primary hover:bg-primary-fixed-dim transition-all flex items-center gap-space-xs font-label-md text-label-md font-semibold shadow-lg active:scale-95 cursor-pointer" 
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">save</span>
                      <span>{sessionSavedSuccess ? 'Zapisano!' : 'Zapisz Sesję'}</span>
                    </button>

                    <button 
                      onClick={handleExitPlan}
                      className="h-11 px-space-md rounded-lg bg-surface-container hover:bg-surface-container-high text-outline hover:text-rose-400 transition-colors flex items-center gap-space-xs font-label-md text-label-md cursor-pointer border border-white/[0.04]"
                      title="Zmień plan lub anuluj"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                      <span className="hidden sm:inline">Anuluj</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Linear Micro Progress Track */}
              <div className="relative w-full h-1.5 bg-surface-container-highest rounded-full mt-space-lg overflow-hidden">
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-primary rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Main Content Grid (8 Col Left / 4 Col Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
              
              {/* Left Column: Exercises & Sets */}
              <div className="lg:col-span-8 flex flex-col gap-space-md">
                
                {/* Control strip */}
                <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low border border-white/[0.04]">
                  <div className="flex items-center gap-2">
                    <span className="font-label-md text-label-md font-semibold text-on-surface">
                      Schemat Ćwiczeń ({activePlan.exercises.length})
                    </span>
                    <span className="font-code-mono text-[11px] text-outline">• Tempo zalecane: {activePlan.tempo || '3-0-1-0'}</span>
                  </div>
                  <button
                    onClick={() => startRestTimer(90)}
                    className="px-space-md py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-code-mono text-label-sm flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">timer</span>
                    <span>Stoper 90s</span>
                  </button>
                </div>

                {/* Exercises Cards */}
                <div className="space-y-space-md">
                  {activePlan.exercises.map((ex, exIdx) => {
                    const numStr = String(exIdx + 1).padStart(2, '0');
                    return (
                      <div key={ex.id} className="rounded-xl bg-surface-container-low p-space-lg shadow-md flex flex-col gap-space-md border border-white/[0.04]">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs pb-space-sm border-b border-white/[0.06]">
                          <div className="flex items-center gap-space-md">
                            <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary font-code-mono font-bold text-headline-md">
                              {numStr}
                            </div>
                            <div className="flex flex-col">
                              <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">{ex.name}</h3>
                              <span className="font-label-sm text-label-sm text-on-surface-variant">{ex.muscle} • {ex.sets} serie robocze</span>
                            </div>
                          </div>
                          <span className="px-space-sm py-0.5 rounded-full bg-surface-container text-on-surface-variant font-code-mono text-[11px] self-start sm:self-center">
                            Domyślnie: {ex.defaultLoad}
                          </span>
                        </div>

                        {/* Sets list */}
                        <div className="space-y-space-xs">
                          {Array.from({ length: ex.sets || 2 }).map((_, sIdx) => {
                            const setNum = sIdx + 1;
                            const key = `${ex.id}_s${setNum}`;
                            const setData = setsState[key] || { done: false, reps: ex.defaultReps || 10, load: ex.defaultLoad || '' };
                            const isDone = setData.done;

                            return (
                              <div 
                                key={key}
                                className={`p-space-sm rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm transition-all border ${
                                  isDone 
                                    ? 'bg-surface-container-high/60 border-primary/30' 
                                    : 'bg-surface-container border-white/[0.04]'
                                }`}
                              >
                                <div className="flex items-center gap-space-md">
                                  <span className={`font-code-mono text-label-md font-bold px-2 py-0.5 rounded ${
                                    isDone ? 'bg-primary/20 text-primary' : 'bg-surface-container-highest text-outline'
                                  }`}>
                                    S{setNum}
                                  </span>

                                  {/* Stepper powtórzeń */}
                                  <div className="flex items-center gap-1 bg-surface-container-low px-2 py-1 rounded border border-white/[0.04]">
                                    <button 
                                      onClick={() => updateSetField(key, 'reps', Math.max(1, (Number(setData.reps) || 10) - 1))}
                                      className="w-6 h-6 rounded flex items-center justify-center hover:bg-surface-container text-outline hover:text-on-surface font-bold"
                                    >
                                      -
                                    </button>
                                    <span className="font-code-mono text-sm font-semibold text-on-surface w-8 text-center">
                                      {setData.reps}
                                    </span>
                                    <button 
                                      onClick={() => updateSetField(key, 'reps', (Number(setData.reps) || 10) + 1)}
                                      className="w-6 h-6 rounded flex items-center justify-center hover:bg-surface-container text-outline hover:text-on-surface font-bold"
                                    >
                                      +
                                    </button>
                                    <span className="font-code-mono text-[10px] text-outline">powt.</span>
                                  </div>

                                  {/* Pole obciążenia */}
                                  <input 
                                    type="text"
                                    value={setData.load}
                                    onChange={(e) => updateSetField(key, 'load', e.target.value)}
                                    placeholder="np. Hantle 22.5kg"
                                    className="bg-surface-container-low px-space-sm py-1 rounded text-on-surface font-code-mono text-sm border border-white/[0.04] focus:outline-none focus:border-primary/50 w-44"
                                  />
                                </div>

                                <div className="flex items-center gap-space-xs self-end sm:self-center">
                                  <button
                                    type="button"
                                    onClick={() => startRestTimer(90)}
                                    className="px-2 py-1 rounded bg-surface-container-high hover:bg-surface-bright text-outline hover:text-primary font-code-mono text-xs flex items-center gap-1 cursor-pointer"
                                    title="Włącz 90s odpoczynku"
                                  >
                                    <span className="material-symbols-outlined text-[14px]">timer</span>
                                    <span>90s</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => toggleSetDone(key)}
                                    className={`px-space-md py-1 rounded-lg font-label-md text-label-md font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                                      isDone
                                        ? 'bg-primary text-on-primary shadow-sm'
                                        : 'bg-surface-container-high text-on-surface hover:bg-surface-bright'
                                    }`}
                                  >
                                    <span className="material-symbols-outlined text-[16px]">
                                      {isDone ? 'check' : 'radio_button_unchecked'}
                                    </span>
                                    <span>{isDone ? 'Zrobione' : 'Zatwierdź'}</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Rest Timer & Metrics (4 cols) */}
              <div className="lg:col-span-4 flex flex-col gap-space-md sticky top-4">
                
                {/* Floating Rest Timer Card */}
                <div className="rounded-xl bg-surface-container-low p-space-lg shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden border border-white/[0.04]">
                  <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-space-sm">
                    Stoper Odpoczynku Pomiędzy Seriami
                  </span>

                  {/* Circular SVG Timer */}
                  <div className="relative w-40 h-40 my-space-xs flex items-center justify-center">
                    <svg className="w-40 h-40 -rotate-90" viewBox="0 0 100 100">
                      <circle 
                        cx="50" cy="50" r="42" 
                        className="stroke-surface-container-highest" 
                        strokeWidth="6" 
                        fill="none" 
                      />
                      <circle 
                        cx="50" cy="50" r="42" 
                        className="stroke-primary transition-all duration-700 ease-out" 
                        strokeWidth="6" 
                        strokeDasharray="264" 
                        strokeDashoffset={264 - (264 * restProgressPercent) / 100}
                        strokeLinecap="round" 
                        fill="none" 
                      />
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-code-mono text-headline-xl text-on-surface font-bold">
                        {formattedRest}
                      </span>
                      <span className="font-code-mono text-label-sm text-outline">
                        Cel: {Math.floor(restDuration / 60)}:{String(restDuration % 60).padStart(2, '0')}
                      </span>
                    </div>
                  </div>

                  {/* Rest Timer Quick Controls */}
                  <div className="flex items-center gap-space-xs mt-space-sm">
                    <button 
                      onClick={() => adjustRestTimer(-15)}
                      className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-outline hover:text-on-surface font-code-mono text-xs cursor-pointer"
                    >
                      -15s
                    </button>
                    <button 
                      onClick={() => setIsRestRunning(r => !r)}
                      className="px-4 py-1 rounded bg-primary text-on-primary font-label-md text-label-md font-semibold cursor-pointer shadow-sm"
                    >
                      {isRestRunning ? 'Pauza' : 'Wznów'}
                    </button>
                    <button 
                      onClick={() => adjustRestTimer(15)}
                      className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-outline hover:text-on-surface font-code-mono text-xs cursor-pointer"
                    >
                      +15s
                    </button>
                    <button 
                      onClick={() => { setRestRemaining(0); setIsRestRunning(false); }}
                      className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-outline hover:text-rose-400 font-code-mono text-xs cursor-pointer"
                    >
                      Pomiń
                    </button>
                  </div>
                </div>

                {/* Weight & Obsidian Notes Logger */}
                <div className="rounded-xl bg-surface-container-low p-space-md shadow-md space-y-space-md border border-white/[0.04]">
                  <div className="space-y-space-xs">
                    <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                      Waga Poranna (kg)
                    </span>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number"
                        step="0.1"
                        value={morningWeight}
                        onChange={(e) => setMorningWeight(e.target.value)}
                        className="w-full bg-surface-container px-space-md py-1.5 rounded-lg text-on-surface font-code-mono text-sm border border-white/[0.04] focus:outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={handleSaveWeight}
                        className="px-space-md py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md cursor-pointer shrink-0"
                      >
                        {weightSavedToast ? 'Zapisano' : 'Zapisz'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-space-xs">
                    <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                      Notatka Treningowa (Obsidian)
                    </span>
                    <textarea
                      rows={3}
                      value={obsidianNote}
                      onChange={(e) => setObsidianNote(e.target.value)}
                      placeholder="Wnioski z serii, zmęczenie, progresja RPE..."
                      className="w-full bg-surface-container p-space-sm rounded-lg text-on-surface placeholder:text-outline font-body-md text-sm border border-white/[0.04] focus:outline-none focus:border-primary resize-none"
                    ></textarea>
                    <div className="flex items-center justify-between font-code-mono text-[11px] text-outline">
                      <span>{noteSavedToast ? 'Zapisano do Obsidian!' : 'Synchronizacja Markdown'}</span>
                      <button 
                        type="button" 
                        onClick={handleSaveNote}
                        className="text-primary hover:underline cursor-pointer"
                      >
                        Zapisz notatkę
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </>
        )}

        {/* ----------------- VIEW 3: HISTORIA SESJI TRENINGOWYCH ----------------- */}
        {viewMode === 'history' && (
          <div className="space-y-space-md">
            <div className="p-space-lg rounded-xl bg-surface-container-low shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-space-md border border-white/[0.04]">
              <div className="space-y-1">
                <h2 className="font-headline-xl text-headline-xl text-on-surface font-semibold">
                  Historia Ukończonych Sesji ({filteredWorkouts.length})
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Zapisane sesje treningowe z baz SQLite WAL i Firestore. Każdy wpis zawiera czas trwania, liczbę serii i notatki.
                </p>
              </div>

              <div className="flex items-center gap-space-sm">
                <input
                  type="text"
                  placeholder="Szukaj w historii..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-surface-container px-space-md py-1.5 rounded-lg text-on-surface font-code-mono text-sm border border-white/[0.04] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-space-xs">
              {filteredWorkouts.length === 0 ? (
                <div className="py-12 text-center text-outline font-code-mono text-sm">
                  Brak zapisanych treningów w historii.
                </div>
              ) : (
                filteredWorkouts.map((w) => (
                  <div 
                    key={w.id} 
                    className="p-space-md rounded-xl bg-surface-container-low border border-white/[0.04] hover:bg-surface-container transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-space-md"
                  >
                    <div className="flex items-start gap-space-md min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined text-[20px]">fitness_center</span>
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-space-sm">
                          <h4 className="font-headline-md text-body-lg font-semibold text-on-surface truncate">
                            {w.title}
                          </h4>
                          <span className="px-space-xs py-0.5 rounded font-code-mono text-[10px] bg-primary/10 text-primary font-semibold">
                            {w.type || 'Siłowy'}
                          </span>
                        </div>
                        <p className="font-body-md text-sm text-on-surface-variant truncate">
                          {w.description || 'Brak dodatkowej notatki.'}
                        </p>
                        <div className="flex items-center gap-space-md font-code-mono text-[11px] text-outline pt-1">
                          <span>Data: {w.date || 'Nieznana'}</span>
                          <span>Czas: {w.duration_minutes || 45} min</span>
                          <span>Serie: {w.completed_sets || 12}/{w.total_sets || 12}</span>
                          {w.weight_kg && <span>Waga: {w.weight_kg} kg</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-space-xs shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleDelete(w.id)}
                        className="p-2 rounded text-outline hover:text-rose-400 hover:bg-surface-container-high transition-colors cursor-pointer"
                        title="Usuń wpis"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>

      {/* New Custom Plan Modal */}
      {showNewPlanModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl bg-surface-container-low border border-white/[0.1] p-space-lg shadow-2xl flex flex-col space-y-space-md">
            <div className="flex items-center justify-between pb-space-xs border-b border-white/[0.06]">
              <h3 className="font-headline-md text-headline-md font-semibold text-on-surface">
                Nowy Schemat Treningowy
              </h3>
              <button 
                onClick={() => setShowNewPlanModal(false)}
                className="text-outline hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateNewPlan} className="space-y-space-md">
              <div className="space-y-1">
                <label className="font-label-sm text-label-sm text-outline uppercase">Nazwa Planu</label>
                <input 
                  type="text" 
                  required
                  placeholder="np. FBW Strych (Kondycja C) lub Góra/Dół"
                  value={newPlanForm.title}
                  onChange={(e) => setNewPlanForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full bg-surface-container px-space-md py-2 rounded-lg text-on-surface font-body-md text-sm border border-white/[0.06] focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="font-label-sm text-label-sm text-outline uppercase">Podtytuł / Opis Skupienia</label>
                <input 
                  type="text" 
                  placeholder="np. Klatka, Plecy, Triceps, Nogi"
                  value={newPlanForm.subtitle}
                  onChange={(e) => setNewPlanForm(p => ({ ...p, subtitle: e.target.value }))}
                  className="w-full bg-surface-container px-space-md py-2 rounded-lg text-on-surface font-body-md text-sm border border-white/[0.06] focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-space-sm">
                <div className="space-y-1">
                  <label className="font-label-sm text-label-sm text-outline uppercase">Kategoria</label>
                  <select 
                    value={newPlanForm.category}
                    onChange={(e) => setNewPlanForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full bg-surface-container px-space-md py-2 rounded-lg text-on-surface font-code-mono text-sm border border-white/[0.06] focus:outline-none"
                  >
                    <option value="Siłowy">Siłowy</option>
                    <option value="Kalistenika">Kalistenika</option>
                    <option value="Regeneracja">Regeneracja</option>
                    <option value="Cardio">Cardio</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-label-sm text-label-sm text-outline uppercase">Szacowany Czas</label>
                  <input 
                    type="text" 
                    value={newPlanForm.durationEst}
                    onChange={(e) => setNewPlanForm(p => ({ ...p, durationEst: e.target.value }))}
                    placeholder="np. 50 min"
                    className="w-full bg-surface-container px-space-md py-2 rounded-lg text-on-surface font-code-mono text-sm border border-white/[0.06] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-label-sm text-label-sm text-outline uppercase">Ćwiczenia (rozdzielone przecinkami)</label>
                <textarea 
                  rows={3}
                  value={newPlanForm.exercisesStr}
                  onChange={(e) => setNewPlanForm(p => ({ ...p, exercisesStr: e.target.value }))}
                  placeholder="np. Podciąganie, Dipy, OHP, Przysiady"
                  className="w-full bg-surface-container p-space-sm rounded-lg text-on-surface font-code-mono text-sm border border-white/[0.06] focus:outline-none resize-none"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-space-sm pt-space-xs">
                <button
                  type="button"
                  onClick={() => setShowNewPlanModal(false)}
                  className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface font-label-md text-label-md cursor-pointer"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-space-lg py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-primary-fixed-dim transition-all cursor-pointer shadow-md"
                >
                  Zapisz Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutsPage;
