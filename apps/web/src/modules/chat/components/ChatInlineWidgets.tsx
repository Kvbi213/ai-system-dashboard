import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  MapPin,
  User,
  ArrowUpRight,
  Wallet,
  TrendingUp,
  Dumbbell,
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import {
  schoolApi,
  tasksApi,
  financeApi,
  workoutsApi,
  automationApi
} from '../../../api/client';

const DAY_MAP: Record<number, number> = {
  0: 1, // Niedziela -> Poniedziałek
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 1  // Sobota -> Poniedziałek
};

const DAY_NAMES = ['', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek'];

/**
 * 1. Widżet Planu Lekcji w oknie czatu AI
 */
export const TimetableChatWidget: React.FC = () => {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const todayNum = DAY_MAP[new Date().getDay()] || 1;
  const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6;

  useEffect(() => {
    let isMounted = true;
    schoolApi.getTimetable(todayNum)
      .then((res) => {
        if (isMounted && res.lessons) {
          setLessons(res.lessons);
        }
      })
      .catch(() => {
        // Fallback local data if offline
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [todayNum]);

  return (
    <div className="w-full sm:w-[380px] p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-md backdrop-blur-sm flex flex-col gap-3 my-2 text-slate-800 dark:text-slate-100">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/80 border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-900 dark:text-white">Plan Lekcji</h4>
            <span className="text-[11px] text-slate-500 font-medium">
              {DAY_NAMES[todayNum]} {isWeekend ? '(Najbliższy dzień)' : '(Dziś)'}
            </span>
          </div>
        </div>
        <button
          onClick={() => navigate('/timetable')}
          className="flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:text-sky-500 hover:underline"
        >
          <span>Harmonogram</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {isLoading ? (
        <div className="py-4 text-center text-xs text-slate-400 animate-pulse">Ładowanie harmonogramu...</div>
      ) : lessons.length === 0 ? (
        <div className="py-3 text-center text-xs text-slate-500">Brak zajęć na ten dzień.</div>
      ) : (
        <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
          {lessons.slice(0, 5).map((l, idx) => (
            <div
              key={l.id || idx}
              className={`p-2.5 rounded-xl border text-xs flex flex-col gap-1 transition-colors ${
                l.isCancelled
                  ? 'border-rose-300 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20'
                  : l.isSubstitution
                  ? 'border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20'
                  : 'border-slate-200/80 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-bold truncate ${l.isCancelled ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                  {l.order ? `${l.order}. ` : ''}{l.subject}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sky-700 dark:text-sky-300 shrink-0">
                  {l.timeRange || '08:00 - 08:45'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                {l.classroom && (
                  <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                    <MapPin className="w-3 h-3 text-slate-400" /> s. {l.classroom}
                  </span>
                )}
                {l.teacher && (
                  <span className="flex items-center gap-1 truncate">
                    <User className="w-3 h-3 text-slate-400" /> {l.teacher}
                  </span>
                )}
              </div>
              {l.substitutionNote && (
                <div className="text-[10px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                  <AlertTriangle className="w-3 h-3" />
                  <span>{l.substitutionNote}</span>
                </div>
              )}
            </div>
          ))}
          {lessons.length > 5 && (
            <span className="text-[10px] text-center text-slate-400 font-mono mt-1">
              + jeszcze {lessons.length - 5} lekcji w harmonogramie
            </span>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * 2. Widżet Ocen & Średniej Librus w oknie czatu AI
 */
export const GradesChatWidget: React.FC = () => {
  const navigate = useNavigate();
  const [gradesData, setGradesData] = useState<{ gpa: number; luckyNumber: number; subjects: any[] }>({
    gpa: 4.88,
    luckyNumber: 14,
    subjects: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    schoolApi.getGrades()
      .then((res) => {
        if (isMounted) {
          setGradesData({
            gpa: res.stats?.gpa || 4.88,
            luckyNumber: res.stats?.luckyNumber || 14,
            subjects: res.subjects || []
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  const getAvgColor = (avg: number) => {
    if (avg >= 4.75) return 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800';
    if (avg >= 4.0) return 'text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950 border-sky-200 dark:border-sky-800';
    if (avg >= 3.0) return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800';
    return 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-800';
  };

  return (
    <div className="w-full sm:w-[380px] p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-md backdrop-blur-sm flex flex-col gap-3 my-2 text-slate-800 dark:text-slate-100">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-900 dark:text-white">Oceny & Średnia</h4>
            <span className="text-[11px] text-slate-500 font-medium">Dziennik Librus Synergia</span>
          </div>
        </div>
        <button
          onClick={() => navigate('/school')}
          className="flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:text-sky-500 hover:underline"
        >
          <span>Wszystkie</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {isLoading ? (
        <div className="py-4 text-center text-xs text-slate-400 animate-pulse">Ładowanie ocen...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex flex-col">
              <span className="text-[10px] font-mono text-slate-500 uppercase">Średnia GPA</span>
              <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {gradesData.gpa.toFixed(2)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex flex-col">
              <span className="text-[10px] font-mono text-slate-500 uppercase">Szczęśliwy Numerek</span>
              <span className="text-lg font-bold font-mono text-sky-600 dark:text-sky-400">
                #{gradesData.luckyNumber}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
            {gradesData.subjects.slice(0, 4).map((s, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-800 text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate pr-2">{s.name}</span>
                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${getAvgColor(s.average)}`}>
                  {s.average > 0 ? s.average.toFixed(2) : '-'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/**
 * 3. Widżet Zastępstw & Absencji w oknie czatu AI
 */
export const SubstitutionsChatWidget: React.FC = () => {
  const navigate = useNavigate();
  const [substitutions, setSubstitutions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    schoolApi.getSubstitutions()
      .then((res) => {
        if (isMounted && res.substitutions) {
          setSubstitutions(res.substitutions);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="w-full sm:w-[380px] p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-md backdrop-blur-sm flex flex-col gap-3 my-2 text-slate-800 dark:text-slate-100">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-900 dark:text-white">Zastępstwa & Zmiany</h4>
            <span className="text-[11px] text-slate-500 font-medium">Librus Synergia ({substitutions.length})</span>
          </div>
        </div>
        <button
          onClick={() => navigate('/timetable')}
          className="flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:text-sky-500 hover:underline"
        >
          <span>Plan</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {isLoading ? (
        <div className="py-4 text-center text-xs text-slate-400 animate-pulse">Ładowanie zastępstw...</div>
      ) : substitutions.length === 0 ? (
        <div className="py-3 text-center text-xs text-slate-500 font-medium">Brak odnotowanych zastępstw. Plan zgodny z normą.</div>
      ) : (
        <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-1 scrollbar-thin">
          {substitutions.map((sub, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20 text-xs flex flex-col gap-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-950 dark:text-amber-200">{sub.subject}</span>
                <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-100/80 dark:bg-amber-900/50 px-2 py-0.5 rounded">
                  {sub.timeRange || 'Zastępstwo'}
                </span>
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">{sub.note}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * 4. Widżet Zadań (To-Do) w oknie czatu AI
 */
export const TasksChatWidget: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    tasksApi.getAll()
      .then((res) => {
        if (isMounted && res.tasks) {
          setTasks(res.tasks);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  const handleToggle = async (id: string) => {
    try {
      await tasksApi.toggle(id);
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
      );
    } catch {}
  };

  const pendingTasks = useMemo(() => tasks.filter((t) => !t.completed), [tasks]);

  return (
    <div className="w-full sm:w-[380px] p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-md backdrop-blur-sm flex flex-col gap-3 my-2 text-slate-800 dark:text-slate-100">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-900 dark:text-white">Lista Zadań</h4>
            <span className="text-[11px] text-slate-500 font-medium">Oczekujące: {pendingTasks.length}</span>
          </div>
        </div>
        <button
          onClick={() => navigate('/tasks')}
          className="flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:text-sky-500 hover:underline"
        >
          <span>Zadania</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {isLoading ? (
        <div className="py-4 text-center text-xs text-slate-400 animate-pulse">Ładowanie zadań...</div>
      ) : pendingTasks.length === 0 ? (
        <div className="py-3 text-center text-xs text-slate-500">Wszystkie zadania zrealizowane! Brak zaległości.</div>
      ) : (
        <div className="flex flex-col gap-1.5 max-h-[180px] overflow-y-auto pr-1 scrollbar-thin">
          {pendingTasks.slice(0, 4).map((task) => (
            <div
              key={task.id}
              onClick={() => handleToggle(task.id)}
              className="p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer transition"
            >
              <div className="flex items-center gap-2 truncate pr-2">
                <Circle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{task.title}</span>
              </div>
              <span
                className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                  task.priority === 'HIGH'
                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {task.priority || 'MED'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * 5. Widżet Finansów 50/30/20 w oknie czatu AI
 */
export const FinancesChatWidget: React.FC = () => {
  const navigate = useNavigate();
  const [financeData, setFinanceData] = useState<{
    balancePln: number;
    monthlySpentPln: number;
    needsSpentPln: number;
    wantsSpentPln: number;
    savingsSpentPln: number;
  }>({
    balancePln: 2450.0,
    monthlySpentPln: 1120.0,
    needsSpentPln: 640.0,
    wantsSpentPln: 320.0,
    savingsSpentPln: 160.0
  });

  useEffect(() => {
    let isMounted = true;
    financeApi.getOverview()
      .then((res) => {
        if (isMounted) {
          setFinanceData({
            balancePln: res.balancePln ?? 2450,
            monthlySpentPln: res.monthlySpentPln ?? 1120,
            needsSpentPln: res.envelopes?.needs?.spent ?? 640,
            wantsSpentPln: res.envelopes?.wants?.spent ?? 320,
            savingsSpentPln: res.envelopes?.savings?.spent ?? 160
          });
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="w-full sm:w-[380px] p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-md backdrop-blur-sm flex flex-col gap-3 my-2 text-slate-800 dark:text-slate-100">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-900 dark:text-white">Stan Budżetu</h4>
            <span className="text-[11px] text-slate-500 font-medium">Zasada 50 / 30 / 20</span>
          </div>
        </div>
        <button
          onClick={() => navigate('/finances')}
          className="flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:text-sky-500 hover:underline"
        >
          <span>Finanse</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex flex-col">
          <span className="text-[10px] font-mono text-slate-500 uppercase">Saldo Bieżące</span>
          <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
            +{financeData.balancePln.toFixed(2)} PLN
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex flex-col">
          <span className="text-[10px] font-mono text-slate-500 uppercase">Wydatki M-ca</span>
          <span className="text-base font-bold font-mono text-rose-500 dark:text-rose-400">
            -{financeData.monthlySpentPln.toFixed(2)} PLN
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 pt-1 text-[11px] font-mono">
        <div className="flex justify-between text-slate-500">
          <span>Potrzeby (50%):</span>
          <span className="text-slate-800 dark:text-slate-200 font-bold">{financeData.needsSpentPln.toFixed(2)} PLN</span>
        </div>
        <div className="flex justify-between text-slate-500">
          <span>Zachcianki (30%):</span>
          <span className="text-slate-800 dark:text-slate-200 font-bold">{financeData.wantsSpentPln.toFixed(2)} PLN</span>
        </div>
        <div className="flex justify-between text-slate-500">
          <span>Oszczędności (20%):</span>
          <span className="text-slate-800 dark:text-slate-200 font-bold">{financeData.savingsSpentPln.toFixed(2)} PLN</span>
        </div>
      </div>
    </div>
  );
};

/**
 * 6. Widżet Treningów & Aktywności w oknie czatu AI
 */
export const WorkoutsChatWidget: React.FC = () => {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    workoutsApi.getExercises()
      .then((res) => {
        if (isMounted && res.exercises) {
          setExercises(res.exercises);
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="w-full sm:w-[380px] p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-md backdrop-blur-sm flex flex-col gap-3 my-2 text-slate-800 dark:text-slate-100">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400">
            <Dumbbell className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-900 dark:text-white">Treningi & FBW</h4>
            <span className="text-[11px] text-slate-500 font-medium">Rejestr serii roboczych</span>
          </div>
        </div>
        <button
          onClick={() => navigate('/workouts')}
          className="flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:text-sky-500 hover:underline"
        >
          <span>Sesja</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
        {exercises.slice(0, 3).map((ex, idx) => (
          <div key={ex.id || idx} className="p-2 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{ex.name}</span>
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
              {ex.sets || 3}x{ex.reps || 10} • {ex.weightKg || 0}kg
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * 7. Widżet Kalendarza & Sprawdzianów w oknie czatu AI
 */
export const CalendarChatWidget: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    schoolApi.getEvents()
      .then((res) => {
        if (isMounted && res.events) {
          setEvents(res.events);
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="w-full sm:w-[380px] p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-md backdrop-blur-sm flex flex-col gap-3 my-2 text-slate-800 dark:text-slate-100">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-800 text-cyan-600 dark:text-cyan-400">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-900 dark:text-white">Terminarz & Sprawdziany</h4>
            <span className="text-[11px] text-slate-500 font-medium">Nadchodzące terminy</span>
          </div>
        </div>
        <button
          onClick={() => navigate('/calendar')}
          className="flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:text-sky-500 hover:underline"
        >
          <span>Terminarz</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
        {events.slice(0, 3).map((ev, idx) => (
          <div key={ev.id || idx} className="p-2 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex flex-col truncate pr-2">
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{ev.title}</span>
              <span className="text-[10px] text-slate-400 font-mono">{ev.date} {ev.subject ? `• ${ev.subject}` : ''}</span>
            </div>
            <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 uppercase shrink-0">
              {ev.type || 'Test'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * 8. Widżet Skryptów Automatyzacji w oknie czatu AI
 */
export const AutomationChatWidget: React.FC = () => {
  const navigate = useNavigate();
  const [scripts, setScripts] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    automationApi.getScripts()
      .then((res) => {
        if (isMounted && res.scripts) {
          setScripts(res.scripts);
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="w-full sm:w-[380px] p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-md backdrop-blur-sm flex flex-col gap-3 my-2 text-slate-800 dark:text-slate-100">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-900 dark:text-white">Automatyzacje Pushbullet</h4>
            <span className="text-[11px] text-slate-500 font-medium">Zarejestrowane reguły: {scripts.length}</span>
          </div>
        </div>
        <button
          onClick={() => navigate('/private')}
          className="flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:text-sky-500 hover:underline"
        >
          <span>Zarządzaj</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
        {scripts.slice(0, 3).map((s) => (
          <div key={s.id} className="p-2 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate pr-2">
              <span className={`w-2 h-2 rounded-full ${s.enabled ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{s.name}</span>
            </div>
            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              {s.triggerType}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Główny kontener renderujący zestaw dołączonych widżetów
 */
interface ChatInlineWidgetsContainerProps {
  widgets?: string[];
}

export const ChatInlineWidgetsContainer: React.FC<ChatInlineWidgetsContainerProps> = ({ widgets }) => {
  if (!widgets || widgets.length === 0) return null;

  const uniqueWidgets = Array.from(new Set(widgets));

  return (
    <div className="mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-800/70 flex flex-wrap gap-3 pointer-events-auto w-full items-start">
      {uniqueWidgets.includes('timetable') && <TimetableChatWidget />}
      {uniqueWidgets.includes('substitutions') && <SubstitutionsChatWidget />}
      {uniqueWidgets.includes('grades') && <GradesChatWidget />}
      {uniqueWidgets.includes('tasks') && <TasksChatWidget />}
      {uniqueWidgets.includes('finances') && <FinancesChatWidget />}
      {uniqueWidgets.includes('workouts') && <WorkoutsChatWidget />}
      {uniqueWidgets.includes('calendar') && <CalendarChatWidget />}
      {uniqueWidgets.includes('automation') && <AutomationChatWidget />}
    </div>
  );
};
