import React, { useState, useEffect } from 'react';
import { GradeStatsSummary } from './components/GradeStatsSummary';
import { SubjectGradesGrid, SubjectGradeItem } from './components/SubjectGradesGrid';
import { GraduationCap, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { schoolApi } from '../../api/client';

const FALLBACK_SUBJECTS: SubjectGradeItem[] = [
  {
    id: '1',
    name: 'Informatyka',
    average: 5.50,
    semester1Average: 5.50,
    grades: [
      { id: 'g1', value: 6, displayValue: '6', weight: 3, category: 'Sprawdzian Praktyczny Linux', semester: 1 },
      { id: 'g2', value: 5, displayValue: '5', weight: 2, category: 'Projekt sieciowy', semester: 1 }
    ]
  },
  {
    id: '2',
    name: 'Biologia',
    average: 4.13,
    semester1Average: 4.13,
    grades: [
      { id: 'gb1', value: 4.5, displayValue: '4+', weight: 1, category: 'odpowiedź ustna', semester: 1 },
      { id: 'gb2', value: 3, displayValue: '3', weight: 3, category: 'Praca klasowa', semester: 1, improvedGradeId: 'gb3' },
      { id: 'gb3', value: 5, displayValue: '5', weight: 3, category: 'Praca klasowa', semester: 1, isImprovement: true, improvedValue: '3', improvedGradeId: 'gb2' },
      { id: 'gb4', value: 4.5, displayValue: '4+', weight: 1, category: 'odpowiedź ustna', semester: 1 }
    ]
  },
  {
    id: '3',
    name: 'Lokalne sieci komputerowe',
    average: 5.00,
    semester1Average: 5.00,
    grades: [{ id: 'g3', value: 5, displayValue: '5', weight: 1, category: 'Konfiguracja tras i VLAN', semester: 1 }]
  },
  {
    id: '4',
    name: 'Matematyka',
    average: 3.20,
    semester1Average: 3.20,
    grades: [{ id: 'g4', value: 4, displayValue: '4', weight: 2, category: 'Wielomiany i funkcje', semester: 1 }]
  }
];

const GRADES_CACHE_KEY = 'omnidash_grades_cache_v4_2';

function getInitialGradesData(): { subjects: SubjectGradeItem[]; stats: any } {
  if (typeof window === 'undefined') {
    return { subjects: FALLBACK_SUBJECTS, stats: { gpa: 4.28, luckyNumber: 3, threatsCount: 0, totalGrades: 49 } };
  }
  try {
    const raw = localStorage.getItem(GRADES_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.subjects && Array.isArray(parsed.subjects) && parsed.subjects.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore error
  }
  return { subjects: FALLBACK_SUBJECTS, stats: { gpa: 4.28, luckyNumber: 3, threatsCount: 0, totalGrades: 49 } };
}

export const GradesPage: React.FC = () => {
  const [semester, setSemester] = useState<1 | 2>(1);
  const initial = getInitialGradesData();
  const [subjects, setSubjects] = useState<SubjectGradeItem[]>(initial.subjects);
  const [stats, setStats] = useState(initial.stats);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchGradesData = async () => {
    try {
      const res: any = await schoolApi.getGrades();
      let finalSubjects: SubjectGradeItem[] = [];

      if (res?.subjects && Array.isArray(res.subjects) && res.subjects.length > 0) {
        finalSubjects = res.subjects;
      } else if (res?.grades && Array.isArray(res.grades) && res.grades.length > 0) {
        const groupMap = new Map<string, { id: string; name: string; grades: any[] }>();
        for (const g of res.grades) {
          const list = groupMap.get(g.subject) || { id: `subj_${g.subject}`, name: g.subject, grades: [] as any[] };
          list.grades.push({
            id: g.id,
            value: g.grade,
            displayValue: String(g.grade),
            weight: g.weight,
            category: g.description,
            date: g.date,
            teacher: g.teacher,
            semester: g.semester || 1
          });
          groupMap.set(g.subject, list);
        }
        finalSubjects = Array.from(groupMap.values()).map((item) => {
          let sumP = 0;
          let sumW = 0;
          for (const gr of item.grades) {
            if (gr.weight > 0 && gr.value > 0) {
              sumP += gr.value * gr.weight;
              sumW += gr.weight;
            }
          }
          const avg = sumW > 0 ? Number((sumP / sumW).toFixed(2)) : 0;
          return {
            id: item.id,
            name: item.name,
            average: avg,
            grades: item.grades
          };
        });
      }

      if (finalSubjects.length > 0) {
        setSubjects(finalSubjects);
      }

      const newStats = {
        gpa: res?.stats?.gpa !== undefined ? res.stats.gpa : stats.gpa,
        luckyNumber: res?.stats?.luckyNumber !== undefined ? res.stats.luckyNumber : 3,
        threatsCount: res?.stats?.threatsCount !== undefined ? res.stats.threatsCount : 0,
        totalGrades: res?.stats?.totalGradesCount !== undefined
          ? res.stats.totalGradesCount
          : finalSubjects.reduce((acc, s) => acc + s.grades.length, 0)
      };
      setStats(newStats);

      try {
        localStorage.setItem(GRADES_CACHE_KEY, JSON.stringify({ subjects: finalSubjects, stats: newStats }));
      } catch {
        // Ignore localStorage error
      }
    } catch {
      // Keep existing state
    }
  };

  useEffect(() => {
    fetchGradesData();
  }, []);

  const handleSyncLibrus = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncFeedback(null);

    try {
      const res = await schoolApi.syncLibrus();
      if (res?.success) {
        setSyncFeedback({
          type: 'success',
          message: res.message || 'Pomyślnie zsynchronizowano dane z Librus Synergia.'
        });
        await fetchGradesData();
      } else {
        setSyncFeedback({
          type: 'error',
          message: res?.message || 'Nie udało się pobrać danych z Librus Synergia.'
        });
      }
    } catch (err: any) {
      setSyncFeedback({
        type: 'error',
        message: err.message || 'Błąd połączenia podczas synchronizacji Librus.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header, Sync button & Semester switch */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Oceny i Osiągnięcia (Librus Synergia)</h2>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Synchronize button */}
          <button
            onClick={handleSyncLibrus}
            disabled={isSyncing}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition shadow-sm ${
              isSyncing
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                : 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 active:scale-95'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Synchronizowanie...' : 'Synchronizuj z Librus'}</span>
          </button>

          {/* Semester switch */}
          <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setSemester(1)}
              className={`px-3 py-1 rounded-lg transition font-semibold ${
                semester === 1
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-sm border border-slate-200/60 dark:border-slate-700'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Semestr 1
            </button>
            <button
              onClick={() => setSemester(2)}
              className={`px-3 py-1 rounded-lg transition font-semibold ${
                semester === 2
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-sm border border-slate-200/60 dark:border-slate-700'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Semestr 2
            </button>
          </div>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncFeedback && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 shadow-sm transition ${
            syncFeedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
              : 'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/50'
          }`}
        >
          <div className="flex items-center gap-2">
            {syncFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span className="font-medium">{syncFeedback.message}</span>
          </div>
          <button
            onClick={() => setSyncFeedback(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold px-1"
          >
            x
          </button>
        </div>
      )}

      {/* Summary KPI Badges */}
      <GradeStatsSummary
        gpa={stats.gpa}
        luckyNumber={stats.luckyNumber}
        threatsCount={stats.threatsCount}
        totalGrades={stats.totalGrades}
      />

      {/* Subjects Grid */}
      <SubjectGradesGrid subjects={subjects} semester={semester} />
    </div>
  );
};
