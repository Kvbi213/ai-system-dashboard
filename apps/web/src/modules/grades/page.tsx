import React, { useState, useEffect } from 'react';
import { GradeStatsSummary } from './components/GradeStatsSummary';
import { SubjectGradesGrid, SubjectGradeItem } from './components/SubjectGradesGrid';
import { LibrusTableView } from './components/LibrusTableView';
import { FALLBACK_LIBRUS_SUBJECTS } from './fallbackData';
import { GraduationCap, RefreshCw, CheckCircle2, AlertCircle, Table as TableIcon, LayoutGrid } from 'lucide-react';
import { schoolApi } from '../../api/client';

const GRADES_CACHE_KEY = 'omnidash_grades_cache_v4_3';

function getInitialGradesData(): { subjects: SubjectGradeItem[]; stats: any } {
  if (typeof window === 'undefined') {
    return {
      subjects: FALLBACK_LIBRUS_SUBJECTS,
      stats: { gpa: 4.29, luckyNumber: 3, threatsCount: 0, totalGrades: 40 }
    };
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
  return {
    subjects: FALLBACK_LIBRUS_SUBJECTS,
    stats: { gpa: 4.29, luckyNumber: 3, threatsCount: 0, totalGrades: 40 }
  };
}

export const GradesPage: React.FC = () => {
  const [semester, setSemester] = useState<1 | 2>(1);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
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
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Header, Sync button, View switcher & Semester switch */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Oceny i Osiągnięcia (Librus Synergia)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Klasa 2 TI T • 21 przedmiotów • Dziennik ocen 1:1
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          {/* View mode switcher: Table vs Cards */}
          <div className="flex gap-0.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs select-none">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-lg transition font-semibold flex items-center gap-1.5 ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-sm border border-slate-200/60 dark:border-slate-700'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Autentyczny widok tabeli Librus Synergia"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Tabela Synergia</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 rounded-lg transition font-semibold flex items-center gap-1.5 ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-400 shadow-sm border border-slate-200/60 dark:border-slate-700'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Widok kafelkowy"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kafelki</span>
            </button>
          </div>

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
          <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs select-none">
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
        semester={semester}
      />

      {/* Primary View: 1:1 Librus Synergia Table or Modern Cards */}
      {viewMode === 'table' ? (
        <LibrusTableView subjects={subjects} activeSemester={semester} />
      ) : (
        <SubjectGradesGrid subjects={subjects} semester={semester} />
      )}
    </div>
  );
};
