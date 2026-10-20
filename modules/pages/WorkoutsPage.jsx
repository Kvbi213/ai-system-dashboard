import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Dumbbell, Plus, Trash2, Calendar, Clock, Activity, Flame, Search, 
  Sparkles, Filter, CheckCircle2, Play, Pause, RotateCcw, Timer, Award, ChevronRight, X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import { subscribeCollection, saveCloudDocument, deleteCloudDocument, isCloudEnvironment } from '../services/cloudSync';

// Stała definicja programu FBW Operatora (Poniedziałek / Środa / Piątek)
const FBW_EXERCISES = [
  {
    id: 'fbw-1',
    name: 'Podciąganie na drążku (nachwyt lub z gumą)',
    target: 'Plecy + Biceps',
    sets: 2,
    reps: '8–12',
    tip: 'Klasyczne podciąganie nachwytem. Jeśli brakuje siły na czyste powtórzenia, przewiń gumę oporową przez drążek i wrzuć w nią kolano lub stopę.'
  },
  {
    id: 'fbw-2',
    name: 'Dipy na poręczach lub Pompki klasyczne',
    target: 'Klatka + Barki + Triceps',
    sets: 2,
    reps: '8–12',
    tip: 'Jeśli dipy są za ciężkie, rób klasyczne pompki na podłodze. Jeśli wchodzą gładko – wykonuj dipy na poręczach.'
  },
  {
    id: 'fbw-3',
    name: 'Wiosłowanie hantlem w opadzie tułowia',
    target: 'Grzbiet + Ramiona',
    sets: 2,
    reps: '8–12 / strona',
    tip: 'Oprzyj jedną rękę i kolano na ławce/skrzyni, w drugiej trzymaj hantel i przyciągaj go płynnie do biodra.'
  },
  {
    id: 'fbw-4',
    name: 'Wyciskanie hantli nad głowę stojąc (OHP)',
    target: 'Barki',
    sets: 2,
    reps: '8–12',
    tip: 'Stojąc stabilnie na mocnych nogach, trzymaj hantle przy barkach i wyciskaj je pionowo nad głowę.'
  },
  {
    id: 'fbw-5',
    name: 'Przysiady z hantlem przy klatce (Goblet Squat)',
    target: 'Nogi (Czworogłowe + Pośladki)',
    sets: 2,
    reps: '10–12',
    tip: 'Trzymaj jeden hantel pionowo oburącz przy klatce piersiowej i wykonaj głęboki, kontrolowany przysiad.'
  },
  {
    id: 'fbw-6',
    name: 'Unoszenie kolan do klatki w wiszeniu',
    target: 'Brzuch / Core',
    sets: 2,
    reps: '10–12',
    tip: 'Wisisz stabilnie na drążku i podciągasz kolana w górę do poziomu klatki piersiowej, pracując brzuchem.'
  }
];

const WorkoutsPage = () => {
  const { t } = useTranslation();

  const [workouts, setWorkouts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  
  // Stan aktywnej sesji FBW (interaktywny tracker)
  const [activeSessionCompletedSets, setActiveSessionCompletedSets] = useState({});
  const [sessionStartTime, setSessionStartTime] = useState(null);

  // Stoper przerw (Rest Timer: 90s default)
  const [timerSeconds, setTimerSeconds] = useState(90);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    let interval = null;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(s => s - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  const startRestTimer = (seconds = 90) => {
    setTimerSeconds(seconds);
    setTimerRunning(true);
  };

  const toggleSetCompletion = (exerciseId, setIndex) => {
    const key = `${exerciseId}_set_${setIndex}`;
    setActiveSessionCompletedSets(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      if (!prev[key]) {
        startRestTimer(90); // Auto-start 90s przerwy po odhaczeniu serii
      }
      return updated;
    });
  };

  const handleFinishFbwSession = async () => {
    const completedCount = Object.values(activeSessionCompletedSets).filter(Boolean).length;
    const todayStr = new Date().toISOString().split('T')[0];

    const descriptionText = `### Wykonany Trening FBW (Full Body Workout)\n` +
      `- **Data:** ${todayStr}\n` +
      `- **Ukończone serie:** ${completedCount} / 12 roboczych\n` +
      `- **Protokół:** 2 serie robocze na ćwiczenie, 8–12 powtórzeń, przerwy 90–120s\n\n` +
      `**Ćwiczenia w planie:**\n` +
      FBW_EXERCISES.map(e => `* **${e.name}** (${e.target}): 2 serie x ${e.reps}`).join('\n') +
      `\n\n*Uwaga po treningu: Wypij szejk WPC (białko) w ciągu 30 min po zakończeniu sesji.*`;

    const newWorkout = {
      id: Date.now().toString(),
      title: 'Full Body Workout (FBW) — Sesja Zakończona',
      type: 'Siłowy',
      description: descriptionText,
      date: todayStr,
      created_at: new Date().toISOString()
    };

    setWorkouts(prev => [newWorkout, ...prev]);
    setActiveSessionCompletedSets({});
    setTimerRunning(false);
    setTimerSeconds(90);

    await saveCloudDocument('workouts', newWorkout.id, newWorkout);
    if (!isCloudEnvironment()) {
      try {
        await axios.post('/api/workouts', newWorkout);
      } catch {}
    }
  };

  const [formData, setFormData] = useState({
    title: '',
    type: 'Siłowy',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  // 1. Subskrypcja Firestore CloudSync
  useEffect(() => {
    const unsub = subscribeCollection('workouts', (data) => {
      if (Array.isArray(data)) {
        const sorted = [...data].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        setWorkouts(sorted);
      }
    });

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

  const handleSubmit = async (e) => {
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

  const getTypeBadgeStyle = (type) => {
    switch (type.toLowerCase()) {
      case 'siłowy': return 'bg-tertiary/15 text-tertiary border-tertiary/40';
      case 'cardio': return 'bg-rose-500/15 text-rose-400 border-rose-500/40';
      case 'kalistenika': return 'bg-primary/15 text-primary border-primary/40';
      case 'rozciąganie': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40';
      default: return 'bg-surface-container text-on-surface border-border/60';
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

  const stats = useMemo(() => {
    const countByType = {
      siłowy: workouts.filter(w => w.type?.toLowerCase() === 'siłowy').length,
      cardio: workouts.filter(w => w.type?.toLowerCase() === 'cardio').length,
      kalistenika: workouts.filter(w => w.type?.toLowerCase() === 'kalistenika').length,
      rozciąganie: workouts.filter(w => w.type?.toLowerCase() === 'rozciąganie').length,
    };
    return { countByType, total: workouts.length };
  }, [workouts]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto min-w-0 bg-background text-on-surface custom-scrollbar pb-24 md:pb-8">
      <div className="flex flex-col w-full space-y-4 md:space-y-6">

        {/* 1. TOP STRIP / BREADCRUMBS & ACTIONS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 font-mono text-xs text-outline">
              <span>OmniDash</span>
              <span>/</span>
              <span>Tracking & Ops</span>
              <span>/</span>
              <span className="text-primary font-medium">Treningi FBW</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="font-sans text-xl md:text-2xl font-bold text-on-surface tracking-tight">
                Treningi FBW & Rejestr Progresji
              </h1>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-high text-tertiary font-mono text-xs shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
                <span>Plan: Pon / Śr / Pt (17:00)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => setShowModal(true)}
              className="min-h-[40px] flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-mono text-xs transition-colors border border-border/60"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Dodaj Wpis Ręczny</span>
            </button>

            <button
              onClick={handleFinishFbwSession}
              className="min-h-[40px] flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary font-mono text-xs font-bold hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(77,142,255,0.25)] active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Zapisz Dzisiejszą Sesję FBW</span>
            </button>
          </div>
        </div>

        {/* 2. METRIC HERO DECK & REST TIMER */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          
          {/* Bento 1: Liczba Zapisanych Sesji */}
          <div className="rounded-xl bg-surface-container-low p-4 flex flex-col justify-between border border-border/60 shadow-sm">
            <div className="flex items-center justify-between text-outline">
              <span className="font-mono text-xs uppercase tracking-wider">Zapisane Sesje</span>
              <Activity className="w-4 h-4 text-tertiary" />
            </div>
            <div className="my-2">
              <span className="font-sans text-2xl font-bold text-on-surface tracking-tight">
                {workouts.length}
              </span>
              <div className="font-mono text-[11px] text-on-surface-variant mt-0.5">
                {workouts.length > 0 ? `Ostatnia: ${workouts[0].date}` : 'Brak wpisów'}
              </div>
            </div>
            <div className="flex items-center gap-1 font-mono text-[11px] text-primary">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Baza Firestore WAL Synced</span>
            </div>
          </div>

          {/* Bento 2: Podział Siłowy / Inne */}
          <div className="rounded-xl bg-surface-container-low p-4 flex flex-col justify-between border border-border/60 shadow-sm">
            <div className="flex items-center justify-between text-outline">
              <span className="font-mono text-xs uppercase tracking-wider">Partie FBW</span>
              <Flame className="w-4 h-4 text-rose-400" />
            </div>
            <div className="my-2">
              <span className="font-sans text-2xl font-bold text-on-surface tracking-tight">
                6 Stref
              </span>
              <div className="font-mono text-[11px] text-on-surface-variant mt-0.5">
                Plecy, Klatka, Barki, Nogi, Ramiona, Core
              </div>
            </div>
            <div className="flex items-center gap-1 font-mono text-[11px] text-tertiary">
              <span>Protokół 2 serie robocze</span>
            </div>
          </div>

          {/* Bento 3: Harmonogram */}
          <div className="rounded-xl bg-surface-container-low p-4 flex flex-col justify-between border border-border/60 shadow-sm">
            <div className="flex items-center justify-between text-outline">
              <span className="font-mono text-xs uppercase tracking-wider">Cykl Tygodniowy</span>
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <div className="my-2">
              <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-on-surface">
                <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary">Pon</span>
                <span className="px-1.5 py-0.5 rounded bg-surface-container text-outline">Wt</span>
                <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary">Śr</span>
                <span className="px-1.5 py-0.5 rounded bg-surface-container text-outline">Czw</span>
                <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary">Pt</span>
              </div>
              <div className="font-mono text-[11px] text-on-surface-variant mt-1.5">
                17:00 – 18:00 (Strych + WPC Shake)
              </div>
            </div>
            <div className="flex items-center gap-1 font-mono text-[11px] text-emerald-400">
              <span>3 dni treningowe / 2 dni nauka</span>
            </div>
          </div>

          {/* Bento 4: Interaktywny Stoper Przerw (Rest Timer) */}
          <div className="rounded-xl bg-surface-container-low p-4 flex flex-col justify-between border border-border/60 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-outline">
              <span className="font-mono text-xs uppercase tracking-wider">Stoper Przerw (90–120s)</span>
              <Timer className={`w-4 h-4 ${timerRunning ? 'text-primary animate-pulse' : 'text-outline'}`} />
            </div>
            
            <div className="my-2 flex items-baseline justify-between">
              <div className="font-mono text-3xl font-bold text-on-surface">
                {Math.floor(timerSeconds / 60)}:{String(timerSeconds % 60).padStart(2, '0')}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setTimerRunning(!timerRunning)}
                  className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center font-bold"
                  title={timerRunning ? 'Zatrzymaj timer' : 'Start timera'}
                >
                  {timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>
                <button
                  onClick={() => { setTimerRunning(false); setTimerSeconds(90); }}
                  className="w-8 h-8 rounded-lg bg-surface-container hover:bg-surface-container-high border border-border/60 flex items-center justify-center text-outline hover:text-on-surface"
                  title="Reset (90s)"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between font-mono text-[10px] text-outline">
              <button onClick={() => startRestTimer(90)} className="hover:text-primary">90s standard</button>
              <button onClick={() => startRestTimer(120)} className="hover:text-primary">120s ciężkie</button>
            </div>
          </div>

        </div>

        {/* 3. INTERAKTYWNY PROTOKÓŁ SESJI FBW (TODAY'S WORKOUT COCKPIT) */}
        <div className="rounded-xl bg-surface-container-low p-4 sm:p-5 border border-border/60 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border/40">
            <div>
              <div className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-tertiary" />
                <h2 className="font-sans text-base font-bold text-on-surface">
                  Aktywny Zestaw FBW (Full Body Workout)
                </h2>
              </div>
              <p className="font-mono text-xs text-on-surface-variant mt-0.5">
                2 serie robocze na ćwiczenie (8–12 powtórzeń). Jeśli domkniesz 12 z zapasem techniki – dokładasz ciężar lub mocniejszą gumę.
              </p>
            </div>
            
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-outline">Ukończono:</span>
              <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary font-bold">
                {Object.values(activeSessionCompletedSets).filter(Boolean).length} / 12 serii
              </span>
            </div>
          </div>

          {/* SIATKA 6 ĆWICZEŃ FBW */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-4">
            {FBW_EXERCISES.map((ex, exIdx) => {
              const isSet1Done = !!activeSessionCompletedSets[`${ex.id}_set_1`];
              const isSet2Done = !!activeSessionCompletedSets[`${ex.id}_set_2`];
              const isAllDone = isSet1Done && isSet2Done;

              return (
                <div 
                  key={ex.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                    isAllDone 
                      ? 'bg-surface-container border-emerald-500/40 shadow-sm' 
                      : 'bg-surface-container-lowest border-border/60 hover:border-border'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-surface-container-high text-outline font-mono text-[10px] font-bold flex items-center justify-center">
                          {exIdx + 1}
                        </span>
                        <span className="font-mono text-[10px] uppercase px-1.5 py-0.2 rounded bg-tertiary/10 text-tertiary font-semibold">
                          {ex.target}
                        </span>
                      </div>
                      <span className="font-mono text-xs text-primary font-bold">
                        {ex.reps} powt.
                      </span>
                    </div>

                    <h3 className="font-sans text-sm font-semibold text-on-surface mt-2 leading-snug">
                      {ex.name}
                    </h3>
                    <p className="font-mono text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                      {ex.tip}
                    </p>
                  </div>

                  {/* Przyciski Odhaczania Serii */}
                  <div className="mt-4 pt-2.5 border-t border-border/30 flex items-center justify-between">
                    <span className="font-mono text-[10px] text-outline uppercase">Serie robocze:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleSetCompletion(ex.id, 1)}
                        className={`min-h-[36px] px-3 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-1.5 ${
                          isSet1Done 
                            ? 'bg-emerald-500 text-black shadow-sm' 
                            : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant border border-border/60'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Seria 1</span>
                      </button>
                      
                      <button
                        onClick={() => toggleSetCompletion(ex.id, 2)}
                        className={`min-h-[36px] px-3 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-1.5 ${
                          isSet2Done 
                            ? 'bg-emerald-500 text-black shadow-sm' 
                            : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant border border-border/60'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Seria 2</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. HISTORIA I REJESTR SESJI TRENINGOWYCH */}
        <div className="rounded-xl bg-surface-container border border-border/60 overflow-hidden shadow-sm flex flex-col">
          
          <div className="p-3.5 sm:p-4 border-b border-border/60 bg-surface-container-low flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-sans text-sm font-bold text-on-surface">Historia Treningów</span>
              <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-surface-container text-primary border border-border/60">
                {filteredWorkouts.length} wpisów
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 text-outline absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Szukaj sesji lub ćwiczenia..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full min-h-[38px] pl-8 pr-2.5 py-1.5 rounded-lg bg-surface-container-lowest border border-border/80 text-on-surface text-xs font-mono focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 no-scrollbar touch-pan-x">
                {['all', 'siłowy', 'cardio', 'kalistenika'].map(t => (
                  <button
                    key={t}
                    onClick={() => setSelectedType(t)}
                    className={`min-h-[38px] px-3 rounded-lg text-xs font-mono transition-colors whitespace-nowrap ${
                      selectedType === t 
                        ? 'bg-primary text-on-primary font-bold shadow-sm' 
                        : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {t === 'all' ? 'Wszystkie' : t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[600px] p-3 sm:p-4 space-y-2.5 custom-scrollbar">
            {filteredWorkouts.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <Dumbbell className="w-10 h-10 text-outline mb-2 opacity-40" />
                <p className="font-mono text-sm text-on-surface">Brak zapisanych treningów</p>
                <p className="font-mono text-xs text-outline mt-1">
                  Ukończ dzisiejszą sesję FBW lub dodaj wpis ręcznie.
                </p>
              </div>
            ) : (
              filteredWorkouts.map((w) => (
                <div
                  key={w.id}
                  className="p-4 rounded-xl bg-surface-container-low border border-border/60 hover:border-border transition-all flex flex-col space-y-2 group shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-surface-container-high border border-border/60 flex items-center justify-center text-tertiary shrink-0">
                        <Dumbbell className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-sans text-sm font-bold text-on-surface">
                          {w.title}
                        </h3>
                        <div className="flex items-center gap-2 font-mono text-[11px] text-outline mt-0.5">
                          <span className={`px-2 py-0.2 rounded border text-[10px] ${getTypeBadgeStyle(w.type)}`}>
                            {w.type}
                          </span>
                          <span>{w.date}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(w.id)}
                      className="p-1.5 rounded-lg text-outline hover:text-rose-400 hover:bg-rose-400/10 transition-colors"
                      title="Usuń wpis"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {w.description && (
                    <div className="mt-2 text-xs text-on-surface-variant font-mono bg-surface-container-lowest p-3 rounded-lg border border-border/40 leading-relaxed overflow-hidden">
                      <ReactMarkdown
                        components={{
                          p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                          li: ({node, ...props}) => <li className="marker:text-primary" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-bold text-on-surface" {...props} />
                        }}
                      >
                        {w.description}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

        </div>

        {/* 5. MODAL NOWY TRENING RĘCZNY */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-surface-container-low border border-border rounded-2xl w-full max-w-md p-5 shadow-2xl animate-scale-in">
              <div className="flex items-center justify-between pb-3 border-b border-border/60 mb-4">
                <h3 className="font-sans text-base font-bold text-on-surface flex items-center gap-2">
                  <Plus className="w-4 h-4 text-primary" />
                  Dodaj Sesję Treningową
                </h3>
                <button onClick={() => setShowModal(false)} className="text-outline hover:text-on-surface">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
                <div>
                  <label className="block text-outline text-[11px] mb-1">Tytuł treningu:</label>
                  <input
                    type="text"
                    required
                    placeholder="np. FBW — Sesja A (Guma + Hantle)"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full min-h-[40px] px-3 rounded-lg bg-surface-container border border-border text-on-surface focus:outline-none focus:border-primary text-xs"
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
                      className="w-full min-h-[40px] px-3 rounded-lg bg-surface-container border border-border text-on-surface focus:outline-none focus:border-primary text-xs [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="block text-outline text-[11px] mb-1">Typ treningu:</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full min-h-[40px] px-3 rounded-lg bg-surface-container border border-border text-on-surface focus:outline-none focus:border-primary text-xs"
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
                    rows="4"
                    placeholder="1. Podciąganie 2x10&#10;2. Dipy 2x12&#10;3. Wyciskanie hantli 14kg 2x10..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-3 rounded-lg bg-surface-container border border-border text-on-surface focus:outline-none focus:border-primary resize-none text-xs"
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
