import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  subscribeCollection, 
  saveCloudDocument, 
  deleteCloudDocument, 
  updateCloudDocumentField, 
  isCloudEnvironment 
} from '../services/cloudSync';
import { calculateFinanceStats } from '../services/budgetCalculator';
import { INITIAL_FINANCE_TRANSACTIONS, DEFAULT_WORKOUT_HISTORY } from '../config/initialData';

const PRIORITY_THEME = {
  HIGH: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30', label: 'Wysoki' },
  MEDIUM: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', label: 'Średni' },
  LOW: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30', label: 'Niski' },
};

export const Dashboard = () => {
  const navigate = useNavigate();

  // State: Micro-interactions & Disclosure
  const [isSyncing, setIsSyncing] = useState(false);
  const [isBriefingExpanded, setIsBriefingExpanded] = useState(false);
  const [isTodoDrawerOpen, setIsTodoDrawerOpen] = useState(false);
  const [isTodoQuickPreviewExpanded, setIsTodoQuickPreviewExpanded] = useState(false);
  const [isWeatherExpanded, setIsWeatherExpanded] = useState(false);
  const [isServicesExpanded, setIsServicesExpanded] = useState(false);
  const [activeNewsArticle, setActiveNewsArticle] = useState(null);
  const [newsFilter, setNewsFilter] = useState('10m'); // '10m' | '15m' | '20m'

  // State: Live To-Do Tasks
  const [tasks, setTasks] = useState([]);
  const [taskFilter, setTaskFilter] = useState('all'); // 'all' | 'pending' | 'completed'
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('MEDIUM');
  const [newTaskCategory, setNewTaskCategory] = useState('system');

  // State: Live Workouts
  const [workouts, setWorkouts] = useState([]);

  // State: Live Finances
  const [finances, setFinances] = useState([]);
  const [financeSettings, setFinanceSettings] = useState({
    monthly_income: 5200,
    needs_percent: 50,
    wants_percent: 30,
    savings_percent: 20
  });

  // State: System Telemetry
  const [telemetry, setTelemetry] = useState({
    heapUsedMb: 184,
    heapTotalMb: 384,
    latencyMs: 16,
    cpuUsage: 14
  });

  // Mini Quick Chat state
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: 'user',
      text: 'Podsumuj dzisiejszy rozkład zadań i treningu.',
      time: '12:14'
    },
    {
      id: 2,
      sender: 'ai',
      text: 'Wykryto aktywną sesję treningową FBW na strychu oraz zsynchronizowany rejestr zadań To-Do. Wszystkie bazy danych (SQLite WAL & Firestore) działają w czasie rzeczywistym.',
      time: '12:15 • Groq 16ms'
    }
  ]);
  const [promptInput, setPromptInput] = useState('');
  const [isAiResponding, setIsAiResponding] = useState(false);

  // Keyboard shortcut: Escape closes modal/drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsTodoDrawerOpen(false);
        setActiveNewsArticle(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 1. Live Tasks Subscription
  const fallbackTasks = [
    { id: 'task_1', title: 'Wdrożenie Cloud Hosting (OmniDash)', priority: 'HIGH', status: 'completed', category: 'system' },
    { id: 'task_2', title: 'Autoryzacja profilu administratora', priority: 'HIGH', status: 'completed', category: 'system' },
    { id: 'task_3', title: 'Personalizacja modułów i widżetów', priority: 'MEDIUM', status: 'pending', category: 'system' },
    { id: 'task_4', title: 'Synchronizacja ocen i planu Librus', priority: 'MEDIUM', status: 'completed', category: 'edukacja' },
    { id: 'task_5', title: 'Realizacja sesji FBW: Split Strych', priority: 'HIGH', status: 'pending', category: 'trening' }
  ];

  useEffect(() => {
    const unsubTasks = subscribeCollection('tasks', (cloudTasks) => {
      if (Array.isArray(cloudTasks) && cloudTasks.length > 0) {
        setTasks(cloudTasks);
      } else {
        setTasks(fallbackTasks);
      }
    }, fallbackTasks);

    if (!isCloudEnvironment()) {
      axios.get('/api/tasks')
        .then(res => {
          if (Array.isArray(res.data) && res.data.length > 0) {
            setTasks(res.data);
          }
        })
        .catch(() => {});
    }

    return () => unsubTasks();
  }, []);

  // 2. Live Workouts Subscription
  useEffect(() => {
    const unsubWorkouts = subscribeCollection('workouts', (cloudWorkouts) => {
      if (Array.isArray(cloudWorkouts) && cloudWorkouts.length > 0) {
        setWorkouts(cloudWorkouts);
      } else {
        setWorkouts(DEFAULT_WORKOUT_HISTORY);
      }
    }, DEFAULT_WORKOUT_HISTORY);

    if (!isCloudEnvironment()) {
      axios.get('/api/workouts')
        .then(res => {
          if (Array.isArray(res.data) && res.data.length > 0) {
            setWorkouts(res.data);
          }
        })
        .catch(() => {});
    }

    return () => unsubWorkouts();
  }, []);

  // 3. Live Finances Subscription
  useEffect(() => {
    const unsubFinances = subscribeCollection('finances', (cloudFinances) => {
      if (Array.isArray(cloudFinances)) {
        const settingsDoc = cloudFinances.find(d => d && (d.id === 'finance_settings' || d.is_settings));
        if (settingsDoc) {
          setFinanceSettings({
            monthly_income: Number(settingsDoc.monthly_income) || 5200,
            needs_percent: Number(settingsDoc.needs_percent) || 50,
            wants_percent: Number(settingsDoc.wants_percent) || 30,
            savings_percent: Number(settingsDoc.savings_percent) || 20
          });
        }
        const txs = cloudFinances.filter(d => d && d.id !== 'finance_settings' && !d.is_settings && d.amount !== undefined);
        setFinances(txs.length > 0 ? txs : INITIAL_FINANCE_TRANSACTIONS);
      }
    }, INITIAL_FINANCE_TRANSACTIONS);

    return () => unsubFinances();
  }, []);

  // 4. Live Telemetry Poller
  useEffect(() => {
    const updateTelemetry = () => {
      let heap = 184;
      if (typeof window !== 'undefined' && window.performance && window.performance.memory) {
        heap = Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024));
      }
      setTelemetry({
        heapUsedMb: heap,
        heapTotalMb: Math.max(heap + 64, 384),
        latencyMs: Math.floor(12 + Math.random() * 8),
        cpuUsage: Math.floor(11 + Math.random() * 6)
      });
    };
    updateTelemetry();
    const interval = setInterval(updateTelemetry, 8000);
    return () => clearInterval(interval);
  }, []);

  // KPI Calculations
  const taskStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const pending = total - completed;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 100;
    const highCount = tasks.filter(t => t.priority === 'HIGH' && t.status !== 'completed').length;
    const mediumCount = tasks.filter(t => t.priority === 'MEDIUM' && t.status !== 'completed').length;
    const lowCount = tasks.filter(t => t.priority === 'LOW' && t.status !== 'completed').length;
    return { total, completed, pending, percent, highCount, mediumCount, lowCount };
  }, [tasks]);

  const latestWorkout = useMemo(() => {
    if (workouts.length > 0) return workouts[0];
    return DEFAULT_WORKOUT_HISTORY[0];
  }, [workouts]);

  const financeStats = useMemo(() => {
    return calculateFinanceStats(finances, {
      monthlyIncome: financeSettings.monthly_income,
      targetNeeds: financeSettings.needs_percent,
      targetWants: financeSettings.wants_percent,
      targetSavings: financeSettings.savings_percent
    });
  }, [finances, financeSettings]);

  // Task Actions
  const handleToggleTask = async (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    await updateCloudDocumentField('tasks', task.id, { status: newStatus });
    if (!isCloudEnvironment()) {
      try {
        await axios.patch(`/api/tasks/${task.id}/status`, { status: newStatus });
      } catch {}
    }
  };

  const handleDeleteTask = async (taskId, e) => {
    if (e) e.stopPropagation();
    setTasks(prev => prev.filter(t => t.id !== taskId));
    await deleteCloudDocument('tasks', taskId);
    if (!isCloudEnvironment()) {
      try {
        await axios.delete(`/api/tasks/${taskId}`);
      } catch {}
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const taskObj = {
      id: 'task_' + Date.now(),
      title: newTaskTitle.trim(),
      priority: newTaskPriority,
      category: newTaskCategory,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    setTasks(prev => [taskObj, ...prev]);
    setNewTaskTitle('');
    await saveCloudDocument('tasks', taskObj.id, taskObj);
    if (!isCloudEnvironment()) {
      try {
        await axios.post('/api/tasks', taskObj);
      } catch {}
    }
  };

  const filteredTasks = useMemo(() => {
    if (taskFilter === 'completed') return tasks.filter(t => t.status === 'completed');
    if (taskFilter === 'pending') return tasks.filter(t => t.status === 'pending');
    return tasks;
  }, [tasks, taskFilter]);

  // Top urgent tasks for Executive Summary preview
  const urgentTasksPreview = useMemo(() => {
    const pendingOnes = tasks.filter(t => t.status !== 'completed');
    return pendingOnes.slice(0, 2);
  }, [tasks]);

  // Sync Trigger Function
  const triggerSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 1200);
  };

  // Quick Chat Send
  const handleSendPrompt = (e) => {
    if (e) e.preventDefault();
    if (!promptInput.trim() || isAiResponding) return;

    const userText = promptInput.trim();
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: userText,
      time: timeStr
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setPromptInput('');
    setIsAiResponding(true);

    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        sender: 'ai',
        text: `Polecenie przyjęte w klastrze Groq LPU: "${userText}". Aktywne zadania: ${taskStats.pending} w toku, bilans finansowy: ${Math.round(financeStats.balance)} zł. Synchronizacja SQLite WAL gotowa.`,
        time: `${timeStr} • Groq ${telemetry.latencyMs}ms`
      };
      setChatMessages((prev) => [...prev, aiResponse]);
      setIsAiResponding(false);
    }, 600);
  };

  const newsArticles = [
    {
      id: 'news_1',
      tag: 'CyberSec',
      tagColor: 'bg-primary/10 text-primary',
      time: 'Brave Search • 4m temu',
      title: 'Krytyczna podatność w sterownikach wirtualizacji NVMe wykryta w infrastrukturze brzegowej',
      summary: 'Podatność dotyczy urządzeń brzegowych z bezpośrednim dostępem DMA do kontrolerów NVMe. Zalecana jest natychmiastowa aktualizacja mikrokodu oraz izolacja magistrali PCI-e.',
      source: 'CERT Polska / Brave OSINT Engine'
    },
    {
      id: 'news_2',
      tag: 'AI Hardware',
      tagColor: 'bg-secondary/10 text-secondary',
      time: 'Brave Search • 11m temu',
      title: 'Nowa generacja jednostek LPU osiąga 420 tokenów na sekundę w kwantyzacji FP8',
      summary: 'Architektura Groq Tensor Streaming Processor z pamięcią SRAM na chipie eliminuje wąskie gardło pamięci HBM, umożliwiając wnioskowanie modeli 120B w czasie rzeczywistym poniżej 20ms.',
      source: 'Groq Hardware Telemetry'
    },
    {
      id: 'news_3',
      tag: 'Architektura',
      tagColor: 'bg-surface-container-highest text-on-surface-variant',
      time: 'Brave Search • 18m temu',
      title: 'SQLite 3.46 wprowadza natywne ulepszenia współbieżności w trybach rozproszonych WAL',
      summary: 'Zoptymalizowano blokady zapisu przy intensywnych operacjach wal_checkpoint, co podnosi przepustowość transakcji lokalnych o 28% przy zerowym ryzyku uszkodzenia bazy.',
      source: 'SQLite Architecture Group'
    }
  ];

  return (
    <div className="flex flex-col w-full space-y-8 pb-16">
      {/* Top Page Header */}
      <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-space-md">
        <div className="flex flex-col space-y-space-xs">
          <div className="flex items-center gap-space-xs text-on-surface-variant font-code-mono text-code-mono">
            <span onClick={() => navigate('/')} className="hover:text-primary transition-colors cursor-pointer">OmniDash</span>
            <span className="text-outline">/</span>
            <span className="text-on-surface-variant">Core</span>
            <span className="text-outline">/</span>
            <span className="text-primary font-medium">Pulpit Systemowy</span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-semibold">
            Centrum Operacyjne OmniDash
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-space-xs flex-wrap">
            <span>Autonomiczny HUD systemowy</span>
            <span className="text-outline">•</span>
            <span className="text-secondary font-medium">Protokół Antigravity v3.4</span>
            <span className="text-outline">•</span>
            <span>Architektura Apple Glass &amp; Wysuwane Rejestry</span>
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-space-sm flex-wrap">
          <button 
            className="group flex items-center gap-space-xs px-space-md py-space-xs rounded-xl bg-surface-container-high/80 hover:bg-surface-bright text-on-surface transition-all duration-200 active:scale-[0.98] cursor-pointer border border-white/[0.04] shadow-sm backdrop-blur-md" 
            onClick={() => navigate('/timetable')}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px] text-secondary group-hover:scale-110 transition-transform">
              filter_center_focus
            </span>
            <span className="font-label-md text-label-md">Plan Dnia</span>
          </button>

          <button 
            className="group flex items-center gap-space-xs px-space-md py-space-xs rounded-xl bg-surface-container-high/80 hover:bg-surface-bright text-on-surface transition-all duration-200 active:scale-[0.98] cursor-pointer border border-white/[0.04] shadow-sm backdrop-blur-md" 
            onClick={triggerSync} 
            type="button"
          >
            <span className={`material-symbols-outlined text-[18px] text-primary transition-transform duration-500 ${isSyncing ? 'animate-spin' : 'group-hover:rotate-180'}`}>
              sync
            </span>
            <span className="font-label-md text-label-md">Synchronizuj Wszystko</span>
          </button>

          <button 
            className="flex items-center gap-space-xs px-space-md py-space-xs rounded-xl bg-primary text-on-primary hover:bg-primary-fixed-dim transition-all active:scale-[0.98] shadow-md cursor-pointer" 
            onClick={() => navigate('/server-logs')}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">terminal</span>
            <span className="font-label-md text-label-md font-semibold">Terminal CLI</span>
            <span className="font-code-mono text-code-mono text-on-primary/70 ml-space-xs text-[11px] bg-on-primary/10 px-1 rounded">~</span>
          </button>
        </div>
      </header>

      {/* Omni Intelligence Briefing Banner with Progressive Disclosure */}
      <section className="relative rounded-2xl bg-surface-container-low/90 backdrop-blur-xl p-space-lg overflow-hidden shadow-xl border border-white/[0.06] transition-all duration-300">
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-primary/10 blur-3xl pointer-events-none"></div>
        <div className="absolute -left-10 -bottom-10 w-64 h-64 rounded-full bg-secondary/5 blur-2xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
          <div className="flex items-start gap-space-md">
            <div className="w-12 h-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shrink-0 border border-primary/20 shadow-inner">
              <span className="material-symbols-outlined text-[26px]">psychology</span>
            </div>
            <div className="flex flex-col space-y-space-xs max-w-4xl">
              <div className="flex items-center gap-space-sm flex-wrap">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-semibold">
                  Syntetyczny Briefing Omni AI
                </span>
                <span className="px-space-xs py-0.5 rounded-full bg-surface-container text-on-surface-variant font-code-mono text-[10px] uppercase border border-white/[0.04]">
                  LPU 120t/s
                </span>
                <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                  Rejestr Live Sync
                </span>
              </div>
              <p className="font-body-lg text-body-lg text-on-surface leading-relaxed">
                Wykryto {taskStats.pending} zadań oczekujących na realizację. Ostatnia sesja FBW: {latestWorkout.title} ({latestWorkout.completed_sets}/{latestWorkout.total_sets} serii). Bilans finansowy 50/30/20: {Math.round(financeStats.balance).toLocaleString('pl-PL')} zł. Stan bazy SQLite &amp; Firestore: zsynchronizowano bez opóźnień.
              </p>
              
              {/* Expandable Briefing Detail Section */}
              {isBriefingExpanded && (
                <div className="mt-3 pt-3 border-t border-white/[0.06] text-body-md text-on-surface-variant font-code-mono text-[12px] space-y-1.5 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <span className="text-primary font-semibold">[+]</span>
                    <span>Zadania ukończone: {taskStats.completed} z {taskStats.total} ({taskStats.percent}% realizacji celu dnia).</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-secondary font-semibold">[*]</span>
                    <span>Przepustowość LPU: 420 t/s w kwantyzacji FP8, opóźnienie węzła: {telemetry.latencyMs}ms.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-tertiary font-semibold">[OK]</span>
                    <span>Alokacja budżetowa: Potrzeby {Math.round(financeStats.allocated.needs)} zł, Zachcianki {Math.round(financeStats.allocated.wants)} zł, Oszczędności {Math.round(financeStats.allocated.savings)} zł.</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-space-sm shrink-0 self-end lg:self-center">
            <button 
              className="flex items-center gap-space-xs px-space-md py-space-xs rounded-xl bg-surface-container-high/80 hover:bg-surface-bright text-on-surface transition-all active:scale-[0.98] font-label-md text-label-md cursor-pointer border border-white/[0.04]" 
              onClick={() => setIsBriefingExpanded(prev => !prev)}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isBriefingExpanded ? 'unfold_less' : 'unfold_more'}
              </span>
              <span>{isBriefingExpanded ? 'Zwiń briefing' : 'Rozwiń briefing'}</span>
            </button>
            <button 
              className="flex items-center gap-space-xs px-space-md py-space-xs rounded-xl bg-primary-container text-on-primary-container hover:bg-primary transition-all active:scale-[0.98] font-label-md text-label-md font-semibold cursor-pointer shadow-sm" 
              onClick={() => navigate('/chat')}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">mic</span>
              <span>Uruchom Hej Omni</span>
            </button>
          </div>
        </div>
      </section>

      {/* Metric KPI Grid (4 columns) - Tactile Apple-Style Glass Tiles */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md">
        {/* KPI 1: Aktywność Dnia (Live Tasks Calc) */}
        <div className="relative rounded-2xl bg-surface-container-low/80 backdrop-blur-md p-space-lg flex flex-col justify-between hover:bg-surface-container transition-all active:scale-[0.99] shadow-sm border border-white/[0.04]">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
              Aktywność Dnia
            </span>
            <span className="flex items-center gap-0.5 text-primary font-code-mono text-code-mono bg-primary/10 px-space-xs py-0.5 rounded-full border border-primary/20">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              {taskStats.percent}%
            </span>
          </div>
          <div className="my-space-md flex items-baseline justify-between">
            <div>
              <span className="font-headline-xl text-headline-xl text-on-surface font-semibold tracking-tight">{taskStats.percent}%</span>
              <span className="font-label-md text-label-md text-on-surface-variant block mt-space-xs">
                Ukończono {taskStats.completed} z {taskStats.total} zadań
              </span>
            </div>
            {/* Real Progress Ring SVG */}
            <div className="relative w-14 h-14 shrink-0">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                <path 
                  className="text-surface-container-highest stroke-current" 
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                  fill="none" 
                  strokeWidth="3.5"
                />
                <path 
                  className="text-primary stroke-current transition-all duration-700 ease-out" 
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                  fill="none" 
                  strokeDasharray={`${taskStats.percent}, 100`} 
                  strokeLinecap="round" 
                  strokeWidth="3.5"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-code-mono text-[10px] text-primary font-semibold">
                {taskStats.completed}/{taskStats.total}
              </span>
            </div>
          </div>
          <div className="pt-space-xs flex items-center justify-between text-on-surface-variant font-code-mono text-[11px] border-t border-white/[0.04]">
            <span>Oczekujące: {taskStats.pending} zadań</span>
            <button 
              type="button" 
              onClick={() => setIsTodoDrawerOpen(true)} 
              className="text-primary hover:underline cursor-pointer flex items-center gap-0.5"
            >
              <span>Zarządzaj</span>
              <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* KPI 2: Sesja Treningowa FBW (Live Workouts) */}
        <div className="relative rounded-2xl bg-surface-container-low/80 backdrop-blur-md p-space-lg flex flex-col justify-between hover:bg-surface-container transition-all active:scale-[0.99] shadow-sm border border-white/[0.04]">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
              Sesja Treningowa FBW
            </span>
            <span className="px-space-xs py-0.5 rounded-full bg-secondary/15 text-secondary font-code-mono text-[10px] font-medium border border-secondary/20">
              {latestWorkout.type || 'Siłowy'}
            </span>
          </div>
          <div className="my-space-md">
            <span className="font-headline-md text-headline-md text-on-surface font-semibold block leading-tight truncate">
              {latestWorkout.title || 'Full Body Workout (FBW)'}
            </span>
            <div className="flex items-center gap-space-xs mt-space-xs text-on-surface-variant font-body-md text-body-md">
              <span className="material-symbols-outlined text-[16px] text-primary">fitness_center</span>
              <span>{latestWorkout.date || 'Ostatnia sesja'} • {latestWorkout.duration_minutes || 45} min</span>
            </div>
          </div>
          <div className="pt-space-xs flex items-center justify-between text-on-surface-variant font-code-mono text-[11px] border-t border-white/[0.04]">
            <span className="flex items-center gap-1 text-on-surface font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              {latestWorkout.completed_sets || 12}/{latestWorkout.total_sets || 12} serii
            </span>
            <span onClick={() => navigate('/workouts')} className="text-secondary hover:underline cursor-pointer">
              Dziennik ćwiczeń →
            </span>
          </div>
        </div>

        {/* KPI 3: Finanse Koperty (Live 50/30/20 Balance) */}
        <div className="relative rounded-2xl bg-surface-container-low/80 backdrop-blur-md p-space-lg flex flex-col justify-between hover:bg-surface-container transition-all active:scale-[0.99] shadow-sm border border-white/[0.04]">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
              Finanse Koperty
            </span>
            <span className={`font-code-mono text-code-mono font-semibold px-space-xs py-0.5 rounded-full border ${
              financeStats.balance >= 0 
                ? 'text-primary bg-primary/10 border-primary/20' 
                : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
            }`}>
              {financeStats.balance >= 0 ? '+' : ''}{Math.round(financeStats.balance).toLocaleString('pl-PL')} zł
            </span>
          </div>
          <div className="my-space-md space-y-space-xs">
            <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
              <span>{financeSettings.needs_percent}% Potrzeby</span>
              <span>{financeSettings.wants_percent}% Zachcianki</span>
              <span>{financeSettings.savings_percent}% Oszczędn.</span>
            </div>
            <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden flex">
              <div className="h-full bg-primary" style={{ width: `${financeSettings.needs_percent}%` }}></div>
              <div className="h-full bg-secondary" style={{ width: `${financeSettings.wants_percent}%` }}></div>
              <div className="h-full bg-tertiary" style={{ width: `${financeSettings.savings_percent}%` }}></div>
            </div>
            <span className="font-code-mono text-[11px] text-on-surface-variant block text-right pt-0.5">
              Wydatki: {Math.round(financeStats.expenses).toLocaleString('pl-PL')} zł z {Math.round(financeStats.income).toLocaleString('pl-PL')} zł
            </span>
          </div>
          <div className="pt-space-xs flex items-center justify-between text-on-surface-variant font-code-mono text-[11px] border-t border-white/[0.04]">
            <span>Portfel v3.4</span>
            <span onClick={() => navigate('/finances')} className="text-primary hover:underline cursor-pointer">
              Rozchody →
            </span>
          </div>
        </div>

        {/* KPI 4: Telemetria Systemu & LPU (Live Memory & Engine) */}
        <div className="relative rounded-2xl bg-surface-container-low/80 backdrop-blur-md p-space-lg flex flex-col justify-between hover:bg-surface-container transition-all active:scale-[0.99] shadow-sm border border-white/[0.04]">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
              Telemetria &amp; LPU
            </span>
            <span className="inline-flex items-center gap-1 font-code-mono text-[10px] text-primary bg-primary/10 px-space-xs py-0.5 rounded-full border border-primary/20">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span> {telemetry.latencyMs}ms
            </span>
          </div>
          <div className="my-space-md flex items-baseline justify-between">
            <div>
              <span className="font-headline-xl text-headline-xl text-on-surface font-semibold tracking-tight font-code-mono">
                120B
              </span>
              <span className="font-label-md text-label-md text-on-surface-variant block mt-space-xs">
                Groq LPU Engine Active
              </span>
            </div>
            <div className="text-right font-code-mono">
              <span className="text-primary text-body-md font-semibold block">V8 {telemetry.heapUsedMb}MB</span>
              <span className="text-outline text-[11px]">Heap: {Math.round((telemetry.heapUsedMb / telemetry.heapTotalMb) * 100)}%</span>
            </div>
          </div>
          <div className="pt-space-xs flex items-center justify-between text-on-surface-variant font-code-mono text-[11px] border-t border-white/[0.04]">
            <span>CPU: {telemetry.cpuUsage}%</span>
            <span onClick={() => navigate('/server-logs')} className="text-secondary hover:underline cursor-pointer">
              Węzły LPU →
            </span>
          </div>
        </div>
      </section>

      {/* Main Split: Left 7 Cols / Right 5 Cols with Spacious Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-8">
          
          {/* PATTERN 1: EXECUTIVE TO-DO CAPSULE + SLIDE-OVER DRAWER TRIGGER */}
          <section className="rounded-2xl bg-surface-container-low/90 backdrop-blur-xl p-space-lg shadow-sm flex flex-col space-y-space-md border border-white/[0.05] transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-xs border-b border-white/[0.06]">
              <div className="flex items-center gap-space-sm">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                  <span className="material-symbols-outlined text-[22px]">checklist</span>
                </div>
                <div>
                  <h2 className="font-headline-md text-headline-md text-on-surface font-semibold leading-tight">
                    Zadania i Priorytety Dnia
                  </h2>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    {taskStats.pending} w toku • {taskStats.completed} ukończonych ({taskStats.percent}% celu)
                  </span>
                </div>
              </div>

              {/* Action Buttons: Inline Accordion Preview & Slide-over Drawer Trigger */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsTodoQuickPreviewExpanded(prev => !prev)}
                  className="px-space-sm py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-label-sm font-label-sm flex items-center gap-1 transition-all active:scale-[0.98] cursor-pointer border border-white/[0.04]"
                  title="Szybki podgląd listy bezpośrednio w widżecie"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {isTodoQuickPreviewExpanded ? 'unfold_less' : 'unfold_more'}
                  </span>
                  <span>{isTodoQuickPreviewExpanded ? 'Zwiń' : 'Podgląd'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsTodoDrawerOpen(true)}
                  className="px-space-md py-1.5 rounded-xl bg-primary/15 hover:bg-primary/25 text-primary text-label-sm font-label-sm font-semibold flex items-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer border border-primary/30 shadow-sm"
                  title="Otwórz pełny wysuwany rejestr zadań (Apple Slide-Over)"
                >
                  <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  <span>Rejestr Zadań</span>
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar: Priority Distribution */}
            <div className="grid grid-cols-3 gap-2 py-1">
              <div className="p-2.5 rounded-xl bg-surface-container flex items-center justify-between border border-white/[0.03]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Wysoki</span>
                </div>
                <span className="font-code-mono text-sm font-bold text-rose-400">{taskStats.highCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container flex items-center justify-between border border-white/[0.03]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Średni</span>
                </div>
                <span className="font-code-mono text-sm font-bold text-amber-400">{taskStats.mediumCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container flex items-center justify-between border border-white/[0.03]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Niski</span>
                </div>
                <span className="font-code-mono text-sm font-bold text-slate-400">{taskStats.lowCount}</span>
              </div>
            </div>

            {/* Top 2 Urgent Tasks Direct Inline Quick Check */}
            <div className="space-y-2">
              <span className="text-[11px] font-code-mono uppercase tracking-wider text-outline block">
                Najbliższe zadania do realizacji:
              </span>
              {urgentTasksPreview.length === 0 ? (
                <div className="p-3 rounded-xl bg-surface-container/60 text-center text-outline font-code-mono text-xs">
                  Wszystkie bieżące zadania zostały ukończone.
                </div>
              ) : (
                urgentTasksPreview.map((task) => {
                  const pTheme = PRIORITY_THEME[task.priority] || PRIORITY_THEME.MEDIUM;
                  return (
                    <div
                      key={task.id}
                      onClick={() => handleToggleTask(task)}
                      className="p-3 rounded-xl bg-surface-container hover:bg-surface-container-high transition-all flex items-center justify-between gap-3 cursor-pointer border border-white/[0.04] active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 border border-outline hover:border-primary text-transparent transition-colors"
                        >
                          <span className="material-symbols-outlined text-[15px]">check</span>
                        </button>
                        <span className="font-body-md text-body-md text-on-surface truncate font-medium">
                          {task.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2 py-0.5 rounded-full font-code-mono text-[10px] uppercase font-semibold border ${pTheme.bg} ${pTheme.text} ${pTheme.border}`}>
                          {pTheme.label}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Inline Accordion Preview (Expanded on click) */}
            {isTodoQuickPreviewExpanded && (
              <div className="pt-3 border-t border-white/[0.06] space-y-3 animate-in fade-in duration-200">
                {/* Fast Add Form */}
                <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Szybko dodaj zadanie do bazy..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="flex-1 bg-surface-container rounded-xl px-3 py-2 text-on-surface placeholder:text-outline font-body-md text-sm border border-white/[0.04] focus:outline-none focus:border-primary/50"
                  />
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    className="bg-surface-container text-on-surface text-xs font-code-mono px-3 py-2 rounded-xl border border-white/[0.04] focus:outline-none"
                  >
                    <option value="HIGH">Wysoki</option>
                    <option value="MEDIUM">Średni</option>
                    <option value="LOW">Niski</option>
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-primary text-on-primary font-label-md text-sm font-semibold hover:bg-primary-fixed-dim transition-all active:scale-[0.98] shrink-0"
                  >
                    Dodaj
                  </button>
                </form>

                {/* Remainder of task list */}
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {tasks.slice(2).map((task) => {
                    const isDone = task.status === 'completed';
                    const pTheme = PRIORITY_THEME[task.priority] || PRIORITY_THEME.MEDIUM;
                    return (
                      <div
                        key={task.id}
                        onClick={() => handleToggleTask(task)}
                        className={`p-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high transition-all flex items-center justify-between gap-2 cursor-pointer border ${
                          isDone ? 'border-white/[0.02] opacity-50' : 'border-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button
                            type="button"
                            className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                              isDone ? 'bg-primary border-primary text-on-primary' : 'border-outline text-transparent'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[13px]">check</span>
                          </button>
                          <span className={`text-xs truncate ${isDone ? 'line-through text-outline' : 'text-on-surface'}`}>
                            {task.title}
                          </span>
                        </div>
                        <span className={`px-1.5 py-0.2 rounded font-code-mono text-[9px] uppercase border ${pTheme.bg} ${pTheme.text} ${pTheme.border}`}>
                          {pTheme.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {/* PATTERN 2: METEOROLOGICAL & CANARD ROAD RADAR CAPSULE WITH EXPANDABLE TRAY */}
          <section className="rounded-2xl bg-surface-container-low/90 backdrop-blur-xl p-space-lg shadow-sm flex flex-col space-y-space-md border border-white/[0.05] transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-xs border-b border-white/[0.06]">
              <div className="flex items-center gap-space-sm">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                  <span className="material-symbols-outlined text-[22px]">cloudy_snowing</span>
                </div>
                <div>
                  <h2 className="font-headline-md text-headline-md text-on-surface font-semibold leading-tight">
                    CANARD &amp; Open-Meteo Radar
                  </h2>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Telemetria meteorologiczna i alerty drogowe • Stacja Kraków-Północ
                  </span>
                </div>
              </div>

              {/* Capsule Quick Status Pill & Disclosure Trigger */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container text-xs font-code-mono border border-white/[0.04]">
                  <span className="text-primary font-bold">+6.4°C</span>
                  <span className="text-outline">•</span>
                  <span className="text-secondary font-medium">CANARD OK</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsWeatherExpanded(prev => !prev)}
                  className="px-space-sm py-1.5 rounded-xl bg-surface-container-high/80 hover:bg-surface-bright text-on-surface-variant hover:text-on-surface text-label-sm font-label-sm flex items-center gap-1 transition-all active:scale-[0.98] cursor-pointer border border-white/[0.04]"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {isWeatherExpanded ? 'unfold_less' : 'unfold_more'}
                  </span>
                  <span>{isWeatherExpanded ? 'Zwiń stację' : 'Rozwiń radar'}</span>
                </button>
              </div>
            </div>

            {/* Primary Glance View */}
            <div className="p-3 rounded-xl bg-surface-container flex items-center justify-between gap-3 border border-white/[0.03]">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[24px] text-primary">wb_cloudy</span>
                <div className="flex flex-col">
                  <span className="font-body-md text-body-md text-on-surface font-medium">
                    Aura umiarkowana, ciśnienie stabilne 1018 hPa
                  </span>
                  <span className="text-[11px] text-on-surface-variant font-code-mono">
                    Wilgotność 74% • Widoczność &gt; 10 km • Brak opadów
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-secondary/15 text-secondary font-code-mono text-[10px] font-semibold border border-secondary/20 shrink-0">
                Trasy A4 / S7 płynne
              </span>
            </div>

            {/* Expandable Atmospheric & Road Safety Grid */}
            {isWeatherExpanded && (
              <div className="space-y-3 pt-2 animate-in fade-in duration-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-xl bg-surface-container flex flex-col border border-white/[0.03]">
                    <span className="font-label-sm text-[10px] text-outline uppercase">Temperatura</span>
                    <span className="font-headline-md text-headline-md text-on-surface font-semibold mt-1">+6.4°C</span>
                    <span className="font-code-mono text-[11px] text-on-surface-variant">Odczuwalna +4.1°C</span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container flex flex-col border border-white/[0.03]">
                    <span className="font-label-sm text-[10px] text-outline uppercase">Ciśnienie</span>
                    <span className="font-headline-md text-headline-md text-on-surface font-semibold mt-1">1018 hPa</span>
                    <span className="font-code-mono text-[11px] text-primary">Stabilne</span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container flex flex-col border border-white/[0.03]">
                    <span className="font-label-sm text-[10px] text-outline uppercase">Widoczność</span>
                    <span className="font-headline-md text-headline-md text-on-surface font-semibold mt-1">&gt; 10 km</span>
                    <span className="font-code-mono text-[11px] text-on-surface-variant">Wilgotność 74%</span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container flex flex-col border border-white/[0.03]">
                    <span className="font-label-sm text-[10px] text-outline uppercase">Status CANARD</span>
                    <span className="font-headline-md text-headline-md text-secondary font-semibold mt-1">Brak Utrudnień</span>
                    <span className="font-code-mono text-[11px] text-on-surface-variant">Trasa A4 / S7 płynna</span>
                  </div>
                </div>

                {/* Micro Road Safety Alert Banner */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-high/60 text-on-surface-variant font-body-md text-body-md border border-white/[0.03]">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[18px] text-primary">traffic</span>
                    <span className="text-xs sm:text-sm">Ostrzeżenie drogowe: Możliwe lokalne przymrozki po godz. 21:00 na wiaduktach.</span>
                  </div>
                  <span className="font-code-mono text-[11px] text-outline shrink-0 ml-2">Ważne do 06:00</span>
                </div>
              </div>
            )}
          </section>

          {/* PATTERN 3: LIVE IT NEWS & OSINT TICKER WITH ON-CLICK EXPANDABLE PREVIEW */}
          <section className="rounded-2xl bg-surface-container-low/90 backdrop-blur-xl p-space-lg shadow-sm flex flex-col space-y-space-md border border-white/[0.05] transition-all">
            <div className="flex items-center justify-between pb-space-xs border-b border-white/[0.06]">
              <div className="flex items-center gap-space-sm">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                  <span className="material-symbols-outlined text-[20px]">feed</span>
                </div>
                <div>
                  <h2 className="font-headline-md text-headline-md text-on-surface font-semibold leading-tight">
                    Live IT News &amp; OSINT Ticker
                  </h2>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Brave Search API Telemetry Feeds
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 font-code-mono text-[11px] bg-surface-container p-1 rounded-xl border border-white/[0.04]">
                {['10m', '15m', '20m'].map((slot) => (
                  <button 
                    key={slot}
                    onClick={() => setNewsFilter(slot)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                      newsFilter === slot ? 'bg-surface-container-high text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                    }`} 
                    type="button"
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* News Articles Stack with Click-to-Inspect Action */}
            <div className="space-y-2">
              {newsArticles.map((art) => (
                <article 
                  key={art.id}
                  onClick={() => setActiveNewsArticle(art)}
                  className="p-3 rounded-xl bg-surface-container hover:bg-surface-container-high transition-all flex items-start justify-between gap-3 group cursor-pointer border border-white/[0.03] active:scale-[0.99]"
                >
                  <div className="flex flex-col space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full font-code-mono text-[10px] font-semibold ${art.tagColor}`}>
                        {art.tag}
                      </span>
                      <span className="font-code-mono text-[11px] text-outline">{art.time}</span>
                    </div>
                    <h3 className="font-body-md text-body-md text-on-surface font-medium truncate group-hover:text-primary transition-colors">
                      {art.title}
                    </h3>
                  </div>
                  <span className="material-symbols-outlined text-[18px] text-outline group-hover:text-primary transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0 mt-1">
                    open_in_new
                  </span>
                </article>
              ))}
            </div>
          </section>

          {/* Oś Czasu Dnia (Schedule Timeline) */}
          <section className="rounded-2xl bg-surface-container-low/90 backdrop-blur-xl p-space-lg shadow-sm flex flex-col space-y-space-md border border-white/[0.05] transition-all">
            <div className="flex items-center justify-between pb-space-xs border-b border-white/[0.06]">
              <div className="flex items-center gap-space-sm">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                  <span className="material-symbols-outlined text-[20px]">calendar_view_day</span>
                </div>
                <div>
                  <h2 className="font-headline-md text-headline-md text-on-surface font-semibold leading-tight">
                    Oś Czasu Dnia
                  </h2>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Harmonogram dobowy zsynchronizowany z bazą
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/timetable')}
                className="text-xs font-code-mono text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Pełny Plan Dnia</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>

            <div className="relative pl-6 space-y-space-md before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-container-highest">
              {/* Event 1 */}
              <div className="relative flex items-start justify-between gap-space-md">
                <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-outline"></span>
                <div className="flex flex-col">
                  <div className="flex items-center gap-space-sm">
                    <span className="font-code-mono text-code-mono text-outline line-through">08:00 - 11:30</span>
                    <span className="px-space-xs py-0.5 rounded-full font-label-sm text-[10px] bg-surface-container text-outline">Zakończono</span>
                  </div>
                  <span className="font-body-md text-body-md text-on-surface-variant line-through font-medium">Informatyka Stosowana &amp; Algorytmy</span>
                </div>
                <span className="font-code-mono text-[11px] text-outline shrink-0">3.5h</span>
              </div>

              {/* Event 2 */}
              <div className="relative flex items-start justify-between gap-space-md">
                <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-primary ring-4 ring-primary/20 animate-pulse"></span>
                <div className="flex flex-col">
                  <div className="flex items-center gap-space-sm">
                    <span className="font-code-mono text-code-mono text-primary font-semibold">12:30 - 15:30</span>
                    <span className="px-space-xs py-0.5 rounded-full font-label-sm text-[10px] bg-primary/10 text-primary font-semibold border border-primary/20">W trakcie</span>
                  </div>
                  <span className="font-body-md text-body-md text-on-surface font-medium">Głęboka praca: Architektura OmniDash v3.4</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Interfejs Apple Glass &amp; Wyciszenie widoków</span>
                </div>
                <span className="font-code-mono text-[11px] text-primary shrink-0">W toku</span>
              </div>

              {/* Event 3 */}
              <div className="relative flex items-start justify-between gap-space-md">
                <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-secondary"></span>
                <div className="flex flex-col">
                  <div className="flex items-center gap-space-sm">
                    <span className="font-code-mono text-code-mono text-secondary font-medium">17:30 - 18:45</span>
                    <span className="px-space-xs py-0.5 rounded-full font-label-sm text-[10px] bg-secondary/15 text-secondary border border-secondary/20">FBW Strych</span>
                  </div>
                  <span className="font-body-md text-body-md text-on-surface font-medium">Sesja Treningowa FBW: Plecy / Klatka / Barki</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Strych, 6 ćwiczeń głównych, 12 serii roboczych</span>
                </div>
                <span className="font-code-mono text-[11px] text-on-surface-variant shrink-0">75m</span>
              </div>

              {/* Event 4 */}
              <div className="relative flex items-start justify-between gap-space-md">
                <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-surface-container-highest"></span>
                <div className="flex flex-col">
                  <div className="flex items-center gap-space-sm">
                    <span className="font-code-mono text-code-mono text-on-surface-variant">20:00 - 21:30</span>
                    <span className="px-space-xs py-0.5 rounded-full font-label-sm text-[10px] bg-surface-container text-on-surface-variant">OSINT Intel</span>
                  </div>
                  <span className="font-body-md text-body-md text-on-surface font-medium">Przegląd OSINT &amp; Aktualizacja Skarbca Obsidian</span>
                </div>
                <span className="font-code-mono text-[11px] text-on-surface-variant shrink-0">90m</span>
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-8">
          {/* Szybki Chat Omni AI (Miniaturowy interfejs LPU) */}
          <section className="rounded-2xl bg-surface-container-low/90 backdrop-blur-xl p-space-lg shadow-sm flex flex-col justify-between space-y-space-md border border-white/[0.05] transition-all">
            <div className="flex items-center justify-between pb-space-xs border-b border-white/[0.06]">
              <div className="flex items-center gap-space-sm">
                <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center shadow-inner">
                  <span className="material-symbols-outlined text-[20px]">smart_toy</span>
                </div>
                <div>
                  <h2 className="font-headline-md text-headline-md text-on-surface font-semibold leading-tight">Szybki Chat Omni AI</h2>
                  <span className="font-label-sm text-label-sm text-primary font-code-mono">Groq LPU Engine • 120t/s</span>
                </div>
              </div>
              <button 
                onClick={() => navigate('/chat')}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container transition-all active:scale-[0.95] cursor-pointer" 
                title="Przejdź do pełnego czatu"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">history</span>
              </button>
            </div>

            {/* Chat History Mini Preview */}
            <div className="space-y-space-sm rounded-xl bg-surface-container-lowest p-space-md max-h-56 overflow-y-auto border border-white/[0.02]">
              {chatMessages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex flex-col space-y-1 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`px-space-md py-space-xs rounded-2xl font-body-md text-body-md shadow-sm ${
                    msg.sender === 'user' 
                      ? 'rounded-tr-none bg-primary text-on-primary max-w-[85%]' 
                      : 'rounded-tl-none bg-surface-container text-on-surface max-w-[90%]'
                  }`}>
                    {msg.text}
                  </div>
                  <span className="font-code-mono text-[10px] text-outline">
                    {msg.time}
                  </span>
                </div>
              ))}
              {isAiResponding && (
                <div className="flex items-center gap-1.5 text-outline font-code-mono text-[11px] p-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
                  <span>Omni generuje odpowiedź...</span>
                </div>
              )}
            </div>

            {/* Quick AI Prompt Input */}
            <form onSubmit={handleSendPrompt} className="relative flex flex-col space-y-space-xs">
              <div className="flex items-center bg-surface-container rounded-xl px-space-md py-space-xs shadow-inner border border-white/[0.04]">
                <input 
                  className="w-full bg-transparent text-on-surface placeholder:text-outline font-body-md text-body-md focus:outline-none" 
                  placeholder="Wydaj polecenie lub zapytaj Omni..." 
                  type="text"
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                />
                <div className="flex items-center gap-space-xs shrink-0 ml-space-sm">
                  <button 
                    className="w-8 h-8 rounded-full bg-surface-container-high hover:bg-primary hover:text-on-primary text-primary transition-all active:scale-[0.95] flex items-center justify-center cursor-pointer" 
                    title="Dyktowanie głosowe: Hej Omni" 
                    onClick={() => navigate('/chat')}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">mic</span>
                  </button>
                  <button 
                    className="w-8 h-8 rounded-xl bg-primary text-on-primary hover:bg-primary-fixed-dim transition-all active:scale-[0.95] flex items-center justify-center cursor-pointer shadow-sm" 
                    type="submit"
                  >
                    <span className="material-symbols-outlined text-[18px]">send</span>
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between px-space-xs text-outline font-code-mono text-[11px]">
                <span>Tryb: Direct Execution</span>
                <span>Naciśnij <kbd className="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-medium">Enter</kbd></span>
              </div>
            </form>
          </section>

          {/* PATTERN 4: SYSTEM INTEGRITY CAPSULE WITH EXPANDABLE NODE METRICS */}
          <section className="rounded-2xl bg-surface-container-low/90 backdrop-blur-xl p-space-lg shadow-sm flex flex-col space-y-space-md border border-white/[0.05] transition-all">
            <div className="flex items-center justify-between pb-space-xs border-b border-white/[0.06]">
              <div className="flex items-center gap-space-sm">
                <div className="w-10 h-10 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center border border-secondary/20">
                  <span className="material-symbols-outlined text-[20px]">hub</span>
                </div>
                <div>
                  <h2 className="font-headline-md text-headline-md text-on-surface font-semibold leading-tight">
                    Usługi &amp; Integracje
                  </h2>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    5/5 Węzłów Operacyjnych (0 anomalii)
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsServicesExpanded(prev => !prev)}
                className="px-space-sm py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-label-sm font-label-sm flex items-center gap-1 transition-all active:scale-[0.98] cursor-pointer border border-white/[0.04]"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isServicesExpanded ? 'unfold_less' : 'unfold_more'}
                </span>
                <span>{isServicesExpanded ? 'Zwiń' : 'Szczegóły'}</span>
              </button>
            </div>

            {/* Glowing Matrix Capsule Preview */}
            <div className="p-3 rounded-xl bg-surface-container flex items-center justify-between gap-3 border border-white/[0.03]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" title="Firestore"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-secondary" title="SQLite WAL"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-primary" title="Librus"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-primary" title="Pushbullet"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-secondary" title="Obsidian"></span>
                <span className="font-code-mono text-xs text-on-surface ml-1 font-medium">Brak opóźnień</span>
              </div>
              <span className="font-code-mono text-[11px] text-outline">
                Sync: natychmiastowy
              </span>
            </div>

            {/* Expandable Services Breakdown */}
            {isServicesExpanded && (
              <div className="space-y-space-xs font-body-md text-body-md pt-1 animate-in fade-in duration-200">
                {/* Firestore Realtime */}
                <div className="p-space-sm rounded-xl bg-surface-container flex items-center justify-between border border-white/[0.02]">
                  <div className="flex items-center gap-space-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
                    <div className="flex flex-col">
                      <span className="font-medium text-on-surface text-sm">Firestore Realtime</span>
                      <span className="font-code-mono text-[11px] text-outline">Chmura wieloregionowa EU</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-code-mono text-[10px] font-semibold border border-primary/20">
                    Aktywny
                  </span>
                </div>

                {/* SQLite WAL */}
                <div className="p-space-sm rounded-xl bg-surface-container flex items-center justify-between border border-white/[0.02]">
                  <div className="flex items-center gap-space-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                    <div className="flex flex-col">
                      <span className="font-medium text-on-surface text-sm">SQLite WAL Engine</span>
                      <span className="font-code-mono text-[11px] text-outline">Baza lokalna 3.2MB • zero lag</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-secondary/15 text-secondary font-code-mono text-[10px] font-semibold border border-secondary/20">
                    Spójny
                  </span>
                </div>

                {/* Librus Sync */}
                <div className="p-space-sm rounded-xl bg-surface-container flex items-center justify-between border border-white/[0.02]">
                  <div className="flex items-center gap-space-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                    <div className="flex flex-col">
                      <span className="font-medium text-on-surface text-sm">Librus Synergia API</span>
                      <span className="font-code-mono text-[11px] text-outline">Auto synchronizacja terminów</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-code-mono text-[10px] border border-white/[0.04]">
                    Aktywny
                  </span>
                </div>

                {/* Pushbullet Listener */}
                <div className="p-space-sm rounded-xl bg-surface-container flex items-center justify-between border border-white/[0.02]">
                  <div className="flex items-center gap-space-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                    <div className="flex flex-col">
                      <span className="font-medium text-on-surface text-sm">Pushbullet Listener</span>
                      <span className="font-code-mono text-[11px] text-outline">WebSocket nasłuch powiadomień</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-code-mono text-[10px] font-semibold border border-primary/20">
                    Nasłuch
                  </span>
                </div>

                {/* Obsidian Vault */}
                <div className="p-space-sm rounded-xl bg-surface-container flex items-center justify-between border border-white/[0.02]">
                  <div className="flex items-center gap-space-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                    <div className="flex flex-col">
                      <span className="font-medium text-on-surface text-sm">Obsidian Vault</span>
                      <span className="font-code-mono text-[11px] text-secondary">[[OmniDash_AI_Dashboard]]</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-secondary/15 text-secondary font-code-mono text-[10px] font-semibold border border-secondary/20">
                    Zsynchronizowano
                  </span>
                </div>
              </div>
            )}

            <div className="pt-space-xs flex items-center justify-between font-code-mono text-[11px] text-on-surface-variant border-t border-white/[0.04]">
              <span>Ostatni backup: Dzisiaj, 03:00</span>
              <span onClick={() => navigate('/server-logs')} className="text-primary hover:underline cursor-pointer">
                Logi systemowe →
              </span>
            </div>
          </section>
        </div>
      </div>

      {/* APPLE-STYLE SLIDE-OVER GLASS SHEET: TO-DO TASK REGISTRY DRAWER */}
      {isTodoDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
          {/* Translucent Backdrop */}
          <div 
            onClick={() => setIsTodoDrawerOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          />

          {/* Slide-over Drawer Panel */}
          <aside className="fixed inset-y-0 right-0 max-w-full flex pl-10 z-50">
            <div className="w-screen max-w-md sm:max-w-lg bg-surface-container-low/95 backdrop-blur-2xl border-l border-white/[0.08] shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
              {/* Drawer Header */}
              <div className="p-6 border-b border-white/[0.06] flex flex-col space-y-4">
                {/* Grab handle indicator for tactile Apple sheet vibe */}
                <div className="w-12 h-1 rounded-full bg-white/20 self-center mb-1"></div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center border border-primary/20">
                      <span className="material-symbols-outlined text-[22px]">checklist</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-on-surface tracking-tight">
                        Rejestr Zadań &amp; Celów
                      </h2>
                      <span className="text-xs font-code-mono text-on-surface-variant">
                        SQLite WAL &amp; Firestore Realtime
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsTodoDrawerOpen(false)}
                    className="w-9 h-9 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center transition-all active:scale-[0.95] cursor-pointer border border-white/[0.06]"
                    title="Zamknij (Esc)"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 font-code-mono text-xs bg-surface-container p-1 rounded-xl border border-white/[0.04]">
                  <button
                    type="button"
                    onClick={() => setTaskFilter('all')}
                    className={`flex-1 py-1.5 rounded-lg font-medium transition-all cursor-pointer text-center ${
                      taskFilter === 'all' ? 'bg-surface-container-high text-primary shadow-sm font-semibold' : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Wszystkie ({taskStats.total})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskFilter('pending')}
                    className={`flex-1 py-1.5 rounded-lg font-medium transition-all cursor-pointer text-center ${
                      taskFilter === 'pending' ? 'bg-surface-container-high text-primary shadow-sm font-semibold' : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    W toku ({taskStats.pending})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskFilter('completed')}
                    className={`flex-1 py-1.5 rounded-lg font-medium transition-all cursor-pointer text-center ${
                      taskFilter === 'completed' ? 'bg-surface-container-high text-primary shadow-sm font-semibold' : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Zrobione ({taskStats.completed})
                  </button>
                </div>
              </div>

              {/* Drawer Content Body: Tasks List & Fast Add Form */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Fast Add Form */}
                <form onSubmit={handleAddTask} className="flex flex-col gap-2 p-3 rounded-2xl bg-surface-container/60 border border-white/[0.04]">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Wpisz nowe zadanie lub cel..."
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      className="flex-1 bg-surface-container rounded-xl px-3 py-2 text-on-surface placeholder:text-outline text-sm border border-white/[0.04] focus:outline-none focus:border-primary/50"
                    />
                    <select
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value)}
                      className="bg-surface-container text-on-surface text-xs font-code-mono px-2.5 py-2 rounded-xl border border-white/[0.04] focus:outline-none"
                    >
                      <option value="HIGH">Wysoki</option>
                      <option value="MEDIUM">Średni</option>
                      <option value="LOW">Niski</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-code-mono">
                      <span>Kategoria:</span>
                      <select
                        value={newTaskCategory}
                        onChange={(e) => setNewTaskCategory(e.target.value)}
                        className="bg-surface-container text-on-surface text-xs font-code-mono px-2 py-1 rounded-lg border border-white/[0.04] focus:outline-none"
                      >
                        <option value="system">System</option>
                        <option value="edukacja">Edukacja</option>
                        <option value="trening">Trening</option>
                        <option value="osobiste">Osobiste</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-primary text-on-primary font-semibold text-xs hover:bg-primary-fixed-dim transition-all active:scale-[0.98] shadow-sm flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
                      <span>Dodaj zadanie</span>
                    </button>
                  </div>
                </form>

                {/* Tasks List */}
                <div className="space-y-2">
                  {filteredTasks.length === 0 ? (
                    <div className="py-12 text-center text-outline font-code-mono text-sm">
                      Brak zadań w wybranym filtrze.
                    </div>
                  ) : (
                    filteredTasks.map((task) => {
                      const pTheme = PRIORITY_THEME[task.priority] || PRIORITY_THEME.MEDIUM;
                      const isDone = task.status === 'completed';
                      return (
                        <div
                          key={task.id}
                          onClick={() => handleToggleTask(task)}
                          className={`p-3.5 rounded-2xl bg-surface-container hover:bg-surface-container-high transition-all flex items-center justify-between gap-3 group cursor-pointer border active:scale-[0.99] ${
                            isDone ? 'border-white/[0.02] opacity-60' : 'border-white/[0.05]'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <button
                              type="button"
                              className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors border ${
                                isDone 
                                  ? 'bg-primary border-primary text-on-primary' 
                                  : 'border-outline hover:border-primary text-transparent'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[16px]">check</span>
                            </button>
                            <div className="flex flex-col min-w-0">
                              <span className={`font-body-md text-sm text-on-surface truncate ${
                                isDone ? 'line-through text-outline' : 'font-medium'
                              }`}>
                                {task.title}
                              </span>
                              {task.created_at && (
                                <span className="font-code-mono text-[10px] text-outline">
                                  {new Date(task.created_at).toLocaleDateString('pl-PL')}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`px-2 py-0.5 rounded-full font-code-mono text-[10px] uppercase font-semibold border ${pTheme.bg} ${pTheme.text} ${pTheme.border}`}>
                              {pTheme.label}
                            </span>
                            {task.category && (
                              <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-code-mono text-[10px]">
                                {task.category}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => handleDeleteTask(task.id, e)}
                              className="text-outline hover:text-rose-400 p-1 transition-colors"
                              title="Usuń zadanie"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-white/[0.06] bg-surface-container/50 flex items-center justify-between">
                <span className="text-xs font-code-mono text-outline">
                  Zsynchronizowano ({taskStats.completed}/{taskStats.total})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsTodoDrawerOpen(false);
                    navigate('/timetable');
                  }}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Harmonogram Dnia</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* APPLE-STYLE MODAL: OSINT ARTICLE INSPECTOR */}
      {activeNewsArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-3xl bg-surface-container-low/95 backdrop-blur-2xl border border-white/[0.08] shadow-2xl p-6 flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full font-code-mono text-[10px] font-semibold ${activeNewsArticle.tagColor}`}>
                  {activeNewsArticle.tag}
                </span>
                <span className="font-code-mono text-xs text-outline">{activeNewsArticle.time}</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveNewsArticle(null)}
                className="w-8 h-8 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <h3 className="text-lg font-semibold text-on-surface tracking-tight leading-snug">
              {activeNewsArticle.title}
            </h3>

            <div className="p-4 rounded-2xl bg-surface-container/70 border border-white/[0.03] text-sm text-on-surface leading-relaxed">
              {activeNewsArticle.summary}
            </div>

            <div className="flex items-center justify-between pt-2 text-xs font-code-mono text-outline border-t border-white/[0.04]">
              <span>Źródło: {activeNewsArticle.source}</span>
              <button
                type="button"
                onClick={() => setActiveNewsArticle(null)}
                className="px-4 py-1.5 rounded-xl bg-primary text-on-primary font-semibold hover:bg-primary-fixed-dim transition-all active:scale-[0.98]"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
