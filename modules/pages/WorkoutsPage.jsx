import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Dumbbell, Plus, Trash2, Calendar, Clock, Activity, Flame, Search, 
  Sparkles, Filter, CheckCircle2, Play, Pause, RotateCcw, Timer, Award, ChevronRight, X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import { subscribeCollection, saveCloudDocument, deleteCloudDocument, isCloudEnvironment } from '../services/cloudSync';
import { DEFAULT_WORKOUT_HISTORY } from '../config/initialData';

const INITIAL_FBW_SETS = {
  // Exercise 1: Podciąganie na drążku
  'ex1_s1': { done: true, reps: 10, load: 'Guma Czarna (15 kg asysta)' },
  'ex1_s2': { done: false, reps: 8, load: 'Guma Czarna (-15kg)' },
  // Exercise 2: Dipy na poręczach / Pompki
  'ex2_s1': { done: false, reps: 12, load: 'Masa ciała (78.4 kg)' },
  'ex2_s2': { done: false, reps: 10, load: 'Masa ciała (78.4 kg)' },
  // Exercise 3: Wiosłowanie hantlem
  'ex3_s1': { done: true, reps: 12, load: 'Hantle 22.5 kg' },
  'ex3_s2': { done: true, reps: 11, load: 'Hantle 22.5 kg' },
  // Exercise 4: OHP
  'ex4_s1': { done: true, reps: 10, load: 'Hantle 16.0 kg' },
  'ex4_s2': { done: true, reps: 9, load: 'Hantle 16.0 kg' },
  // Exercise 5: Goblet Squat
  'ex5_s1': { done: true, reps: 12, load: 'Hantel 26.0 kg' },
  'ex5_s2': { done: true, reps: 12, load: 'Hantel 26.0 kg' },
  // Exercise 6: Unoszenie kolan
  'ex6_s1': { done: false, reps: 15, load: 'Masa ciała' },
  'ex6_s2': { done: false, reps: 15, load: 'Masa ciała' },
};

const WorkoutsPage = () => {
  const { t } = useTranslation();

  const [workouts, setWorkouts] = useState([]);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'history'
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  // Live Workout Session Stopwatch
  const [stopwatchSeconds, setStopwatchSeconds] = useState(24 * 60 + 18); // 24:18 default from mockup
  const [isStopwatchPaused, setIsStopwatchPaused] = useState(false);

  useEffect(() => {
    let interval = null;
    if (!isStopwatchPaused) {
      interval = setInterval(() => {
        setStopwatchSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStopwatchPaused]);

  const formattedStopwatch = useMemo(() => {
    const mins = Math.floor(stopwatchSeconds / 60);
    const secs = stopwatchSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [stopwatchSeconds]);

  // Exercise Sets Data & Steppers
  const [setsState, setSetsState] = useState(() => {
    try {
      const saved = localStorage.getItem('system_fbw_active_sets');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_FBW_SETS;
  });

  const updateSetField = (key, field, val) => {
    setSetsState(prev => {
      const updated = {
        ...prev,
        [key]: { ...prev[key], [field]: val }
      };
      localStorage.setItem('system_fbw_active_sets', JSON.stringify(updated));
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
        startRestTimer(90); // Auto-start 90s rest timer on completing set
      }
      localStorage.setItem('system_fbw_active_sets', JSON.stringify(updated));
      return updated;
    });
  };

  // Completion calculation (7/12 = 58% in mockup)
  const totalSets = 12;
  const completedSetsCount = useMemo(() => {
    return Object.values(setsState).filter(s => s?.done).length;
  }, [setsState]);

  const completionPercentage = useMemo(() => {
    return Math.round((completedSetsCount / totalSets) * 100);
  }, [completedSetsCount]);

  // Rest Timer State (Circular Graphic)
  const [restDuration, setRestDuration] = useState(90); // Target 90s
  const [restRemaining, setRestRemaining] = useState(84); // 01:24 mockup
  const [isRestRunning, setIsRestRunning] = useState(true);

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

  const startRestTimer = (seconds = 90) => {
    setRestDuration(seconds);
    setRestRemaining(seconds);
    setIsRestRunning(true);
  };

  const adjustRestTime = (delta) => {
    setRestRemaining(prev => Math.max(0, prev + delta));
  };

  const skipRestTimer = () => {
    setRestRemaining(0);
    setIsRestRunning(false);
  };

  // Rest timer SVG circle progress calculation
  // stroke-dasharray="440", dashoffset = 440 * (1 - progress)
  const restDashOffset = useMemo(() => {
    const frac = restDuration > 0 ? restRemaining / restDuration : 0;
    return 440 * (1 - Math.min(1, Math.max(0, frac)));
  }, [restRemaining, restDuration]);

  const formattedRestTime = useMemo(() => {
    const mins = Math.floor(restRemaining / 60);
    const secs = restRemaining % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [restRemaining]);

  // Bodyweight logger & Obsidian note
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

  // Finish session handler
  const [sessionSavedSuccess, setSessionSavedSuccess] = useState(false);

  const handleSaveSession = async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newWorkout = {
      id: Date.now().toString(),
      title: 'Full Body Workout (FBW) — Split Strych',
      type: 'Siłowy',
      duration_minutes: Math.round(stopwatchSeconds / 60),
      completed_sets: completedSetsCount,
      total_sets: totalSets,
      weight_kg: parseFloat(morningWeight) || 78.4,
      date: todayStr,
      created_at: new Date().toISOString()
    };

    setWorkouts(prev => [newWorkout, ...prev]);
    setSessionSavedSuccess(true);
    setTimeout(() => setSessionSavedSuccess(false), 3000);

    await saveCloudDocument('workouts', newWorkout.id, newWorkout);
    if (!isCloudEnvironment()) {
      try {
        await axios.post('/api/workouts', newWorkout);
      } catch {}
    }
  };

  // Firestore Sync & Load
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

  // Modal new entry form
  const [formData, setFormData] = useState({
    title: '',
    type: 'Siłowy',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleCreateCustomWorkout = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const newWorkout = {
      ...formData,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    };

    setWorkouts(prev => [newWorkout, ...prev]);
    setShowModal(false);
    setFormData({
      title: '',
      type: 'Siłowy',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });

    await saveCloudDocument('workouts', newWorkout.id, newWorkout);
    if (!isCloudEnvironment()) {
      try {
        await axios.post('/api/workouts', newWorkout);
      } catch {}
    }
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

        {/* Header Section with Live HUD Bar */}
        <div className="rounded-xl bg-surface-container-low p-space-lg shadow-xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary-container/10 blur-3xl pointer-events-none"></div>
          <div className="relative flex flex-col xl:flex-row items-start xl:items-center justify-between gap-space-lg">
            <div className="flex flex-col">
              <div className="flex items-center gap-space-sm mb-space-xs">
                <span className="px-space-sm py-0.5 rounded-full bg-primary-container/20 text-primary font-code-mono text-label-sm uppercase tracking-wider font-semibold">
                  Kondycja A • Split Strych
                </span>
                <span className="font-code-mono text-code-mono text-outline">ID: SES_20241023_FBW</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-semibold">
                FBW Strych • Sesja Treningowa
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                Plan tygodniowy (Pon / Śr / Pt) • Progresja obciążeń i rejestr serii roboczych
              </p>
            </div>

            {/* HUD Telemetry & Quick Session Controls */}
            <div className="flex flex-wrap items-center gap-space-md w-full xl:w-auto">
              <div className="flex items-center gap-space-md p-space-sm rounded-lg bg-surface-container-high shadow-md">
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
                    {completionPercentage}% <span className="font-body-md text-body-md text-outline font-normal">({completedSetsCount}/{totalSets})</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-space-xs">
                <button 
                  onClick={() => setIsStopwatchPaused(!isStopwatchPaused)}
                  className="h-11 px-space-md rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface transition-all flex items-center gap-space-xs font-label-md text-label-md active:scale-95" 
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isStopwatchPaused ? 'play_arrow' : 'pause'}
                  </span>
                  <span>{isStopwatchPaused ? 'Wznów' : 'Pauza'}</span>
                </button>
                <button 
                  onClick={handleSaveSession}
                  className="h-11 px-space-lg rounded-lg bg-primary-container hover:bg-inverse-primary text-on-primary-container transition-all flex items-center gap-space-xs font-label-md text-label-md font-semibold shadow-lg shadow-primary-container/20 active:scale-95" 
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  <span>{sessionSavedSuccess ? 'Zapisano!' : 'Zapisz Sesję'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Linear Micro Progress Track */}
          <div className="relative w-full h-1.5 bg-surface-container-highest rounded-full mt-space-lg overflow-hidden">
            <div 
              className="absolute left-0 top-0 bottom-0 bg-primary-container rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${Math.min(100, Math.max(0, completionPercentage))}%` }}
            ></div>
          </div>
        </div>

        {/* Main Content Grid (8 Col Left / 4 Col Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
          
          {/* Left / Center Column: Workout List */}
          <div className="lg:col-span-8 flex flex-col gap-space-md">
            
            {/* Quick Control Strip: Routine View Options */}
            <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low shadow-sm">
              <div className="flex items-center gap-space-xs">
                <button 
                  onClick={() => setActiveTab('active')}
                  className={`px-space-md py-1.5 rounded-lg font-label-md text-label-md font-medium transition-colors ${
                    activeTab === 'active' 
                      ? 'bg-surface-container-high text-on-surface shadow-sm' 
                      : 'hover:bg-surface-container text-on-surface-variant'
                  }`}
                  type="button"
                >
                  Schemat Aktywny (6 ćwiczeń)
                </button>
                <button 
                  onClick={() => setActiveTab('history')}
                  className={`px-space-md py-1.5 rounded-lg font-label-md text-label-md font-medium transition-colors ${
                    activeTab === 'history' 
                      ? 'bg-surface-container-high text-on-surface shadow-sm' 
                      : 'hover:bg-surface-container text-on-surface-variant'
                  }`}
                  type="button"
                >
                  Historia Sesji ({workouts.length})
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-code-mono text-label-sm text-outline hidden sm:inline-block">Tempo zalecane: 3-0-1-0</span>
                <button
                  onClick={() => setShowModal(true)}
                  className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-outline hover:text-on-surface text-label-sm font-label-sm flex items-center gap-1 border border-white/[0.06]"
                  title="Dodaj wpis manualny"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  <span>Wpis</span>
                </button>
              </div>
            </div>

            {activeTab === 'active' ? (
              <>
                {/* EXERCISE 1: Podciąganie na drążku (Plecy + Biceps) */}
                <div className="rounded-xl bg-surface-container p-space-lg shadow-md flex flex-col gap-space-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs pb-space-sm">
                    <div className="flex items-center gap-space-md">
                      <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary font-code-mono font-bold text-headline-md">
                        01
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-space-xs">
                          <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">Podciąganie na drążku</h3>
                          <span className="px-space-xs py-0.5 rounded bg-surface-container-highest text-outline font-label-sm text-label-sm uppercase">Plecy + Biceps</span>
                        </div>
                        <span className="font-body-md text-body-md text-on-surface-variant">2 serie × 8–12 powt. • Ciężar / Guma oporowa</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-space-xs self-end sm:self-auto">
                      <span className="font-code-mono text-label-sm text-primary bg-primary/10 px-space-sm py-1 rounded-full font-medium">
                        {(setsState['ex1_s1']?.done ? 1 : 0) + (setsState['ex1_s2']?.done ? 1 : 0)} / 2 ukończone
                      </span>
                    </div>
                  </div>

                  {/* Sets List */}
                  <div className="flex flex-col gap-space-xs">
                    {/* Set 1 */}
                    <div className="flex flex-wrap items-center justify-between gap-space-sm p-space-md rounded-lg bg-surface-container-low transition-colors">
                      <div className="flex items-center gap-space-md">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center font-code-mono text-label-sm font-semibold ${setsState['ex1_s1']?.done ? 'bg-primary/20 text-primary' : 'bg-surface-container-high text-outline'}`}>
                          1
                        </span>
                        <div className="flex flex-col">
                          <span className="font-code-mono text-body-md text-on-surface font-medium">{setsState['ex1_s1']?.reps || 10} powtórzeń</span>
                          <span className="font-code-mono text-label-sm text-outline">{setsState['ex1_s1']?.load || 'Guma Czarna (15 kg asysta)'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-space-md">
                        <button 
                          onClick={() => toggleSetDone('ex1_s1')}
                          className="flex items-center gap-1 text-primary font-label-sm text-label-sm uppercase tracking-wider font-semibold hover:opacity-80 transition-opacity"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {setsState['ex1_s1']?.done ? 'check_circle' : 'radio_button_unchecked'}
                          </span>
                          <span>{setsState['ex1_s1']?.done ? 'Zrobione' : 'Oznacz'}</span>
                        </button>
                        <button 
                          onClick={() => {
                            const newReps = prompt('Nowa liczba powtórzeń:', setsState['ex1_s1']?.reps);
                            if (newReps && !isNaN(parseInt(newReps))) updateSetField('ex1_s1', 'reps', parseInt(newReps));
                          }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors" 
                          title="Edytuj serię" 
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                      </div>
                    </div>

                    {/* Set 2 (Active/In Progress) */}
                    <div className="flex flex-wrap items-center justify-between gap-space-md p-space-md rounded-lg bg-surface-container-high shadow-inner">
                      <div className="flex items-center gap-space-md">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center font-code-mono text-label-sm font-semibold ${setsState['ex1_s2']?.done ? 'bg-primary text-on-primary' : 'bg-surface-container text-outline'}`}>
                          2
                        </span>
                        <div className="flex items-center gap-space-sm flex-wrap">
                          {/* Stepper Powtórzenia */}
                          <div className="flex items-center bg-surface-container rounded-lg p-0.5">
                            <button 
                              className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-bright rounded transition-colors active:scale-95" 
                              onClick={() => updateSetField('ex1_s2', 'reps', Math.max(1, (setsState['ex1_s2']?.reps || 8) - 1))}
                              type="button"
                            >
                              <span className="material-symbols-outlined text-[16px]">remove</span>
                            </button>
                            <input 
                              className="w-10 text-center bg-transparent font-code-mono text-body-md text-on-surface font-semibold focus:outline-none" 
                              readOnly 
                              type="text" 
                              value={setsState['ex1_s2']?.reps || 8}
                            />
                            <button 
                              className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-bright rounded transition-colors active:scale-95" 
                              onClick={() => updateSetField('ex1_s2', 'reps', (setsState['ex1_s2']?.reps || 8) + 1)}
                              type="button"
                            >
                              <span className="material-symbols-outlined text-[16px]">add</span>
                            </button>
                          </div>
                          <span className="font-label-sm text-label-sm text-outline">powt. @</span>
                          
                          {/* Selektor / Stepper Obciążenie */}
                          <div 
                            onClick={() => {
                              const newLoad = prompt('Obciążenie / Asysta:', setsState['ex1_s2']?.load || 'Guma Czarna (-15kg)');
                              if (newLoad) updateSetField('ex1_s2', 'load', newLoad);
                            }}
                            className="px-space-md py-1.5 rounded-lg bg-surface-container font-code-mono text-body-md text-on-surface font-medium flex items-center gap-space-xs cursor-pointer hover:bg-surface-bright transition-colors"
                          >
                            <span>{setsState['ex1_s2']?.load || 'Guma Czarna (-15kg)'}</span>
                            <span className="material-symbols-outlined text-[14px] text-outline">expand_more</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-space-sm">
                        <button 
                          onClick={() => toggleSetDone('ex1_s2')}
                          className={`h-10 px-space-md rounded-lg font-label-md text-label-md font-semibold transition-colors flex items-center gap-space-xs shadow-md active:scale-95 ${
                            setsState['ex1_s2']?.done 
                              ? 'bg-surface-container text-primary' 
                              : 'bg-primary-container text-on-primary-container hover:bg-inverse-primary'
                          }`}
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {setsState['ex1_s2']?.done ? 'check_circle' : 'check'}
                          </span>
                          <span>{setsState['ex1_s2']?.done ? 'Zrobione' : 'Zatwierdź Serię'}</span>
                        </button>
                        <button 
                          onClick={() => startRestTimer(90)}
                          className="h-10 px-space-sm rounded-lg bg-surface-container hover:bg-surface-bright text-outline hover:text-on-surface transition-colors flex items-center gap-space-xs font-code-mono text-label-sm active:scale-95" 
                          title="Uruchom 90s przerwę natychmiast" 
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[16px]">timer</span>
                          <span>90s</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* EXERCISE 2: Dipy na poręczach / Pompki klasyczne */}
                <div className="rounded-xl bg-surface-container p-space-lg shadow-md flex flex-col gap-space-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs pb-space-sm">
                    <div className="flex items-center gap-space-md">
                      <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary font-code-mono font-bold text-headline-md">
                        02
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-space-xs">
                          <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">Dipy na poręczach / Pompki</h3>
                          <span className="px-space-xs py-0.5 rounded bg-surface-container-highest text-outline font-label-sm text-label-sm uppercase">Klatka + Barki + Triceps</span>
                        </div>
                        <span className="font-body-md text-body-md text-on-surface-variant">2 serie × 8–12 powt. • Progresja masy ciała</span>
                      </div>
                    </div>
                    <span className="font-code-mono text-label-sm text-outline self-end sm:self-auto">
                      {(setsState['ex2_s1']?.done ? 1 : 0) + (setsState['ex2_s2']?.done ? 1 : 0)} / 2 ukończone
                    </span>
                  </div>

                  <div className="flex flex-col gap-space-xs">
                    {/* Set 1 */}
                    <div className="flex flex-wrap items-center justify-between gap-space-md p-space-md rounded-lg bg-surface-container-low">
                      <div className="flex items-center gap-space-md">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center font-code-mono text-label-sm font-semibold ${setsState['ex2_s1']?.done ? 'bg-primary/20 text-primary' : 'bg-surface-container-high text-outline'}`}>
                          1
                        </span>
                        <div className="flex items-center gap-space-sm flex-wrap">
                          <div className="flex items-center bg-surface-container rounded-lg p-0.5">
                            <button 
                              className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-bright rounded transition-colors" 
                              onClick={() => updateSetField('ex2_s1', 'reps', Math.max(1, (setsState['ex2_s1']?.reps || 12) - 1))}
                              type="button"
                            >
                              <span className="material-symbols-outlined text-[16px]">remove</span>
                            </button>
                            <input 
                              className="w-10 text-center bg-transparent font-code-mono text-body-md text-on-surface font-semibold focus:outline-none" 
                              readOnly 
                              type="text" 
                              value={setsState['ex2_s1']?.reps || 12}
                            />
                            <button 
                              className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-bright rounded transition-colors" 
                              onClick={() => updateSetField('ex2_s1', 'reps', (setsState['ex2_s1']?.reps || 12) + 1)}
                              type="button"
                            >
                              <span className="material-symbols-outlined text-[16px]">add</span>
                            </button>
                          </div>
                          <span className="font-label-sm text-label-sm text-outline">powt. @</span>
                          <span className="px-space-md py-1.5 rounded-lg bg-surface-container font-code-mono text-body-md text-on-surface font-medium">Masa ciała (78.4 kg)</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => toggleSetDone('ex2_s1')}
                        className={`h-10 px-space-md rounded-lg font-label-md text-label-md font-semibold transition-colors flex items-center gap-space-xs active:scale-95 ${
                          setsState['ex2_s1']?.done 
                            ? 'bg-primary text-on-primary' 
                            : 'bg-surface-container-high hover:bg-surface-bright text-on-surface'
                        }`}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[16px]">done</span>
                        <span>{setsState['ex2_s1']?.done ? 'Ukończono' : 'Zrobione'}</span>
                      </button>
                    </div>

                    {/* Set 2 */}
                    <div className="flex flex-wrap items-center justify-between gap-space-md p-space-md rounded-lg bg-surface-container-low">
                      <div className="flex items-center gap-space-md">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center font-code-mono text-label-sm font-semibold ${setsState['ex2_s2']?.done ? 'bg-primary/20 text-primary' : 'bg-surface-container-high text-outline'}`}>
                          2
                        </span>
                        <div className="flex items-center gap-space-sm flex-wrap">
                          <div className="flex items-center bg-surface-container rounded-lg p-0.5">
                            <button 
                              className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-bright rounded transition-colors" 
                              onClick={() => updateSetField('ex2_s2', 'reps', Math.max(1, (setsState['ex2_s2']?.reps || 10) - 1))}
                              type="button"
                            >
                              <span className="material-symbols-outlined text-[16px]">remove</span>
                            </button>
                            <input 
                              className="w-10 text-center bg-transparent font-code-mono text-body-md text-on-surface font-semibold focus:outline-none" 
                              readOnly 
                              type="text" 
                              value={setsState['ex2_s2']?.reps || 10}
                            />
                            <button 
                              className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-bright rounded transition-colors" 
                              onClick={() => updateSetField('ex2_s2', 'reps', (setsState['ex2_s2']?.reps || 10) + 1)}
                              type="button"
                            >
                              <span className="material-symbols-outlined text-[16px]">add</span>
                            </button>
                          </div>
                          <span className="font-label-sm text-label-sm text-outline">powt. @</span>
                          <span className="px-space-md py-1.5 rounded-lg bg-surface-container font-code-mono text-body-md text-on-surface font-medium">Masa ciała (78.4 kg)</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => toggleSetDone('ex2_s2')}
                        className={`h-10 px-space-md rounded-lg font-label-md text-label-md font-semibold transition-colors flex items-center gap-space-xs active:scale-95 ${
                          setsState['ex2_s2']?.done 
                            ? 'bg-primary text-on-primary' 
                            : 'bg-surface-container-high hover:bg-surface-bright text-on-surface'
                        }`}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[16px]">done</span>
                        <span>{setsState['ex2_s2']?.done ? 'Ukończono' : 'Zrobione'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* EXERCISE 3: Wiosłowanie hantlem w opadzie jednorącz */}
                <div className="rounded-xl bg-surface-container p-space-lg shadow-md flex flex-col gap-space-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
                    <div className="flex items-center gap-space-md">
                      <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary font-code-mono font-bold text-headline-md">
                        03
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-space-xs">
                          <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">Wiosłowanie hantlem w opadzie jednorącz</h3>
                          <span className="px-space-xs py-0.5 rounded bg-surface-container-highest text-outline font-label-sm text-label-sm uppercase">Grzbiet + Ramiona</span>
                        </div>
                        <span className="font-body-md text-body-md text-on-surface-variant">2 serie × 10–12 powt. @ Hantle 22.5 kg</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-space-xs">
                      <span className="font-code-mono text-label-sm text-primary font-medium">Ukończono (2/2)</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low font-code-mono text-code-mono text-outline">
                    <span>Ostatni wynik: 12 × 22.5 kg / 11 × 22.5 kg</span>
                    <span className="text-primary font-medium">RPE: 8.5</span>
                  </div>
                </div>

                {/* EXERCISE 4: Wyciskanie hantli nad głowę stojąc - OHP */}
                <div className="rounded-xl bg-surface-container p-space-lg shadow-md flex flex-col gap-space-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
                    <div className="flex items-center gap-space-md">
                      <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary font-code-mono font-bold text-headline-md">
                        04
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-space-xs">
                          <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">Wyciskanie hantli nad głowę (OHP)</h3>
                          <span className="px-space-xs py-0.5 rounded bg-surface-container-highest text-outline font-label-sm text-label-sm uppercase">Barki</span>
                        </div>
                        <span className="font-body-md text-body-md text-on-surface-variant">2 serie × 8–10 powt. @ Hantle 16.0 kg</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-space-xs">
                      <span className="font-code-mono text-label-sm text-primary font-medium">Ukończono (2/2)</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low font-code-mono text-code-mono text-outline">
                    <span>Ostatni wynik: 10 × 16 kg / 9 × 16 kg</span>
                    <span className="text-secondary font-medium">Progresja: +0.5 kg planowane</span>
                  </div>
                </div>

                {/* EXERCISE 5: Goblet Squat z hantlem przy klatce */}
                <div className="rounded-xl bg-surface-container p-space-lg shadow-md flex flex-col gap-space-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
                    <div className="flex items-center gap-space-md">
                      <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary font-code-mono font-bold text-headline-md">
                        05
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-space-xs">
                          <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">Goblet Squat z hantlem przy klatce</h3>
                          <span className="px-space-xs py-0.5 rounded bg-surface-container-highest text-outline font-label-sm text-label-sm uppercase">Nogi</span>
                        </div>
                        <span className="font-body-md text-body-md text-on-surface-variant">2 serie × 12 powt. @ Hantel 26.0 kg</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-space-xs">
                      <span className="font-code-mono text-label-sm text-primary font-medium">Ukończono (2/2)</span>
                    </div>
                  </div>
                </div>

                {/* EXERCISE 6: Unoszenie kolan do klatki w wiszeniu */}
                <div className="rounded-xl bg-surface-container p-space-lg shadow-md flex flex-col gap-space-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
                    <div className="flex items-center gap-space-md">
                      <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary font-code-mono font-bold text-headline-md">
                        06
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-space-xs">
                          <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">Unoszenie kolan do klatki w wiszeniu</h3>
                          <span className="px-space-xs py-0.5 rounded bg-surface-container-highest text-outline font-label-sm text-label-sm uppercase">Brzuch / Core</span>
                        </div>
                        <span className="font-body-md text-body-md text-on-surface-variant">2 serie × 15 powt. @ Masa ciała</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-space-xs">
                      <button 
                        onClick={() => toggleSetDone('ex6_s1')}
                        className={`px-3 py-1 rounded-lg font-code-mono text-xs font-semibold transition-colors ${
                          setsState['ex6_s1']?.done ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-outline hover:text-on-surface'
                        }`}
                      >
                        {setsState['ex6_s1']?.done ? 'S1 Zrobione' : 'W kolejce S1'}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Historical Workout Logs */
              <div className="rounded-xl bg-surface-container p-space-lg shadow-md flex flex-col gap-space-md">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-border/40">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-outline absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Szukaj sesji lub ćwiczenia..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full min-h-[38px] pl-8 pr-2.5 py-1.5 rounded-lg bg-surface-container-lowest border border-white/[0.08] text-on-surface text-xs font-code-mono focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    {['all', 'siłowy', 'cardio', 'kalistenika'].map(t => (
                      <button
                        key={t}
                        onClick={() => setSelectedType(t)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-code-mono transition-colors ${
                          selectedType === t 
                            ? 'bg-primary text-on-primary font-bold shadow-sm' 
                            : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        {t === 'all' ? 'Wszystkie' : t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-space-sm max-h-[600px] overflow-y-auto custom-scrollbar">
                  {filteredWorkouts.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center">
                      <span className="material-symbols-outlined text-[40px] text-outline opacity-40 mb-2">fitness_center</span>
                      <p className="font-code-mono text-sm text-on-surface">Brak zapisanych treningów</p>
                      <p className="font-code-mono text-xs text-outline mt-1">Ukończ dzisiejszą sesję FBW lub dodaj wpis ręcznie.</p>
                    </div>
                  ) : (
                    filteredWorkouts.map(w => (
                      <div key={w.id} className="p-4 rounded-xl bg-surface-container-low border border-white/[0.06] hover:border-white/[0.12] transition-all flex flex-col gap-2 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-primary shrink-0">
                              <span className="material-symbols-outlined text-[18px]">fitness_center</span>
                            </div>
                            <div>
                              <h4 className="font-headline-md text-headline-md font-semibold text-on-surface">{w.title}</h4>
                              <div className="flex items-center gap-2 font-code-mono text-[11px] text-outline mt-0.5">
                                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">{w.type}</span>
                                <span>{w.date}</span>
                                {w.duration_minutes && <span>• {w.duration_minutes} min</span>}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDelete(w.id)}
                            className="p-1.5 rounded-lg text-outline hover:text-error hover:bg-error-container/20 transition-colors"
                            title="Usuń wpis"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {w.description && (
                          <div className="text-xs text-on-surface-variant font-code-mono bg-surface-container-lowest p-3 rounded-lg border border-white/[0.04] leading-relaxed">
                            <ReactMarkdown>{w.description}</ReactMarkdown>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Analytics & Rest HUD & Obsidian Logging (Sticky Top 20) */}
          <div className="lg:col-span-4 flex flex-col gap-space-lg lg:sticky lg:top-20">
            
            {/* Floating Rest Timer Overlay Card */}
            <div className="rounded-xl bg-surface-container p-space-lg shadow-xl relative overflow-hidden flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-space-sm">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Stoper Przerw Roboczych</span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
              </div>

              {/* Circular Graphic Timer */}
              <div className="relative w-44 h-44 flex items-center justify-center my-space-sm">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
                  <circle className="stroke-surface-container-high" cx="80" cy="80" fill="transparent" r="70" strokeWidth="8"></circle>
                  <circle 
                    className="stroke-primary transition-all duration-1000 ease-linear" 
                    cx="80" 
                    cy="80" 
                    fill="transparent" 
                    r="70" 
                    strokeDasharray="440" 
                    strokeDashoffset={restDashOffset} 
                    strokeLinecap="round" 
                    strokeWidth="8"
                  ></circle>
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="font-code-mono text-headline-xl text-on-surface font-semibold tracking-tight">
                    {formattedRestTime}
                  </span>
                  <span className="font-code-mono text-label-sm text-outline">
                    Cel: {Math.floor(restDuration / 60)}:{String(restDuration % 60).padStart(2, '0')}
                  </span>
                </div>
              </div>

              {/* Timer Adjust Actions */}
              <div className="flex items-center gap-space-sm w-full mt-space-xs">
                <button 
                  onClick={() => adjustRestTime(-15)}
                  className="flex-1 h-10 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface font-code-mono text-label-md transition-colors active:scale-95" 
                  type="button"
                >
                  -15s
                </button>
                <button 
                  onClick={() => adjustRestTime(15)}
                  className="flex-1 h-10 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface font-code-mono text-label-md transition-colors active:scale-95" 
                  type="button"
                >
                  +15s
                </button>
                <button 
                  onClick={skipRestTimer}
                  className="flex-1 h-10 rounded-lg bg-surface-container-highest hover:bg-surface-bright text-primary font-label-md text-label-md font-semibold transition-colors active:scale-95" 
                  type="button"
                >
                  Pomiń
                </button>
              </div>
            </div>

            {/* Weekly Routine & Streak Tracker */}
            <div className="rounded-xl bg-surface-container p-space-lg shadow-md flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <h4 className="font-headline-md text-headline-md text-on-surface font-semibold">Tygodniowy Rytm</h4>
                <span className="font-code-mono text-label-sm text-primary font-semibold">Tydzień 42</span>
              </div>
              <div className="grid grid-cols-3 gap-space-sm">
                {/* Poniedziałek (Zrobione) */}
                <div className="flex flex-col items-center p-space-md rounded-lg bg-surface-container-low gap-space-xs text-center">
                  <span className="font-label-sm text-label-sm text-outline uppercase font-semibold">Pon</span>
                  <span className="material-symbols-outlined text-primary text-[24px]">verified</span>
                  <span className="font-code-mono text-label-sm text-on-surface font-medium">Ukończony</span>
                </div>
                {/* Środa (Dziś w toku) */}
                <div className="flex flex-col items-center p-space-md rounded-lg bg-surface-container-high gap-space-xs text-center relative shadow-sm border border-primary/20">
                  <span className="font-label-sm text-label-sm text-primary uppercase font-semibold">Śr (Dziś)</span>
                  <span className="material-symbols-outlined text-primary text-[24px] animate-spin">refresh</span>
                  <span className="font-code-mono text-label-sm text-primary font-semibold">W toku</span>
                </div>
                {/* Piątek (Zaplanowane) */}
                <div className="flex flex-col items-center p-space-md rounded-lg bg-surface-container-low gap-space-xs text-center opacity-70">
                  <span className="font-label-sm text-label-sm text-outline uppercase font-semibold">Pt</span>
                  <span className="material-symbols-outlined text-outline text-[24px]">event</span>
                  <span className="font-code-mono text-label-sm text-outline">18:00</span>
                </div>
              </div>
            </div>

            {/* PR Tracking & Volume Sparkline Analytics */}
            <div className="rounded-xl bg-surface-container p-space-lg shadow-md flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Objętość &amp; Progresja</span>
                  <h4 className="font-headline-md text-headline-md text-on-surface font-semibold mt-0.5">Podciąganie + Dipy</h4>
                </div>
                <div className="flex items-center gap-1 px-space-sm py-1 rounded bg-primary/10 text-primary font-code-mono text-label-sm font-semibold">
                  <span className="material-symbols-outlined text-[16px]">trending_up</span>
                  <span>+14.2%</span>
                </div>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Sumaryczna liczba czystych powtórzeń w skali ostatnich 30 dni: <strong className="text-on-surface font-code-mono">148 powt.</strong>
              </p>
              
              {/* Native SVG Trend Chart */}
              <div className="w-full h-24 mt-space-xs">
                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 320 80">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop className="text-primary" offset="0%" stopColor="currentColor" stopOpacity="0.3"></stop>
                      <stop className="text-primary" offset="100%" stopColor="currentColor" stopOpacity="0"></stop>
                    </linearGradient>
                  </defs>
                  <path d="M0,70 Q40,65 80,55 T160,42 T240,28 T320,12 L320,80 L0,80 Z" fill="url(#chartGradient)"></path>
                  <path className="text-primary" d="M0,70 Q40,65 80,55 T160,42 T240,28 T320,12" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5"></path>
                  <circle className="fill-primary ring-4 ring-primary/20" cx="320" cy="12" r="4"></circle>
                </svg>
              </div>
              <div className="flex justify-between font-code-mono text-label-sm text-outline pt-space-xs">
                <span>30 dni temu (18 powt/sesję)</span>
                <span>Dziś (22 powt/sesję)</span>
              </div>
            </div>

            {/* Quick Weight Logger & Obsidian Sync Note */}
            <div className="rounded-xl bg-surface-container p-space-lg shadow-md flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs text-on-surface font-semibold font-headline-md">
                  <span className="material-symbols-outlined text-[20px] text-secondary">edit_note</span>
                  <span>Rejestrator Sesji</span>
                </div>
                <span className="font-code-mono text-label-sm text-outline">[[Trening-Strych]]</span>
              </div>
              
              <div className="flex flex-col gap-space-sm">
                <label className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Aktualna Waga Poranna</label>
                <div className="flex items-center gap-space-sm">
                  <div className="flex-1 flex items-center bg-surface-container-high rounded-lg px-space-md py-2">
                    <input 
                      className="w-full bg-transparent font-code-mono text-headline-md text-on-surface font-semibold focus:outline-none" 
                      type="text" 
                      value={morningWeight}
                      onChange={(e) => setMorningWeight(e.target.value)}
                    />
                    <span className="font-code-mono text-body-md text-outline">kg</span>
                  </div>
                  <button 
                    onClick={handleSaveWeight}
                    className="h-11 px-space-md rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface transition-colors font-label-md text-label-md active:scale-95" 
                    type="button"
                  >
                    {weightSavedToast ? 'Zapisano' : 'Zapisz'}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-space-xs pt-space-xs">
                <label className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Notatka do Bazy Wiedzy</label>
                <textarea 
                  className="w-full bg-surface-container-high rounded-lg p-space-md font-body-md text-body-md text-on-surface placeholder-outline focus:outline-none focus:ring-1 focus:ring-primary resize-none" 
                  placeholder="Czucie mięśniowe, uwagi do progresji, tempo fazy ekscentrycznej..." 
                  rows={3}
                  value={obsidianNote}
                  onChange={(e) => setObsidianNote(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveNote();
                    }
                  }}
                ></textarea>
                <div className="flex items-center justify-between text-outline text-label-sm font-code-mono pt-1">
                  <span>{noteSavedToast ? 'Zapisano do Obsidian!' : 'Markdown zsynchronizowany'}</span>
                  <span>⌘ + Enter zapisuje</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Modal: Nowy Wpis Ręczny */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-surface-container-low border border-white/[0.08] rounded-2xl w-full max-w-md p-5 shadow-2xl animate-scale-in">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
                <h3 className="font-headline-md text-headline-md font-bold text-on-surface flex items-center gap-2">
                  <Plus className="w-4 h-4 text-primary" />
                  Dodaj Sesję Treningową
                </h3>
                <button onClick={() => setShowModal(false)} className="text-outline hover:text-on-surface">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateCustomWorkout} className="space-y-4 font-code-mono text-xs">
                <div>
                  <label className="block text-outline text-[11px] mb-1">Tytuł treningu:</label>
                  <input
                    type="text"
                    required
                    placeholder="np. FBW — Sesja A (Guma + Hantle)"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full min-h-[40px] px-3 rounded-lg bg-surface-container border border-white/[0.08] text-on-surface focus:outline-none focus:border-primary text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-outline text-[11px] mb-1">Data:</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full min-h-[40px] px-3 rounded-lg bg-surface-container border border-white/[0.08] text-on-surface focus:outline-none focus:border-primary text-xs [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="block text-outline text-[11px] mb-1">Typ treningu:</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full min-h-[40px] px-3 rounded-lg bg-surface-container border border-white/[0.08] text-on-surface focus:outline-none focus:border-primary text-xs"
                    >
                      <option value="Siłowy">Siłowy (FBW)</option>
                      <option value="Cardio">Cardio</option>
                      <option value="Kalistenika">Kalistenika</option>
                      <option value="Rozciąganie">Rozciąganie</option>
                      <option value="Inne">Inne</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-outline text-[11px] mb-1">Opis ćwiczeń i ciężarów:</label>
                  <textarea
                    rows={4}
                    placeholder="1. Podciąganie 2x10&#10;2. Dipy 2x12&#10;3. Wyciskanie hantli 14kg 2x10..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-3 rounded-lg bg-surface-container border border-white/[0.08] text-on-surface focus:outline-none focus:border-primary resize-none text-xs"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 min-h-[40px] rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface font-semibold"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className="flex-1 min-h-[40px] rounded-lg bg-primary text-on-primary font-bold shadow-md hover:opacity-90"
                  >
                    Zapisz Trening
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default WorkoutsPage;
