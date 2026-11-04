import React, { useState, useEffect } from 'react';
import { GradeStatsSummary } from './components/GradeStatsSummary';
import { SubjectGradesGrid, SubjectGradeItem } from './components/SubjectGradesGrid';
import { GraduationCap } from 'lucide-react';
import { schoolApi } from '../../api/client';

const FALLBACK_SUBJECTS: SubjectGradeItem[] = [
  {
    id: '1',
    name: 'Informatyka',
    average: 6.00,
    grades: [{ id: 'g1', value: 6, weight: 3, category: 'Sprawdzian Praktyczny Linux', semester: 1 }]
  },
  {
    id: '2',
    name: 'Systemy operacyjne',
    average: 5.00,
    grades: [{ id: 'g2', value: 5, weight: 3, category: 'Zarządzanie procesami i Docker', semester: 1 }]
  },
  {
    id: '3',
    name: 'Lokalne sieci komputerowe',
    average: 5.00,
    grades: [{ id: 'g3', value: 5, weight: 3, category: 'Konfiguracja tras i VLAN', semester: 1 }]
  },
  {
    id: '4',
    name: 'Matematyka',
    average: 4.00,
    grades: [{ id: 'g4', value: 4, weight: 3, category: 'Wielomiany i funkcje', semester: 1 }]
  }
];

const GRADES_CACHE_KEY = 'omnidash_grades_cache_v4';

function getInitialGradesData(): { subjects: SubjectGradeItem[]; stats: any } {
  if (typeof window === 'undefined') {
    return { subjects: FALLBACK_SUBJECTS, stats: { gpa: 4.32, luckyNumber: 21, threatsCount: 0, totalGrades: 16 } };
  }
  try {
    const raw = localStorage.getItem(GRADES_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.subjects && Array.isArray(parsed.subjects)) {
        return parsed;
      }
    }
  } catch {
    // Ignore error
  }
  return { subjects: FALLBACK_SUBJECTS, stats: { gpa: 4.32, luckyNumber: 21, threatsCount: 0, totalGrades: 16 } };
}

export const GradesPage: React.FC = () => {
  const [semester, setSemester] = useState<1 | 2>(1);
  const initial = getInitialGradesData();
  const [subjects, setSubjects] = useState<SubjectGradeItem[]>(initial.subjects);
  const [stats, setStats] = useState(initial.stats);

  useEffect(() => {
    schoolApi.getGrades()
      .then((res: any) => {
        let finalSubjects: SubjectGradeItem[] = [];

        if (res?.subjects && Array.isArray(res.subjects) && res.subjects.length > 0) {
          finalSubjects = res.subjects;
        } else if (res?.grades && Array.isArray(res.grades) && res.grades.length > 0) {
          // Inteligentne grupowanie per przedmiot
          const groupMap = new Map<string, { id: string; name: string; grades: any[] }>();
          for (const g of res.grades) {
            const list = groupMap.get(g.subject) || { id: `subj_${g.subject}`, name: g.subject, grades: [] as any[] };
            list.grades.push({
              id: g.id,
              value: g.grade,
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
              if (gr.weight > 0) {
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
          gpa: res?.stats?.gpa || stats.gpa,
          luckyNumber: res?.stats?.luckyNumber || 21,
          threatsCount: res?.stats?.threatsCount || 0,
          totalGrades: res?.stats?.totalGradesCount || finalSubjects.reduce((acc, s) => acc + s.grades.length, 0)
        };
        setStats(newStats);

        try {
          localStorage.setItem(GRADES_CACHE_KEY, JSON.stringify({ subjects: finalSubjects, stats: newStats }));
        } catch {
          // Ignore
        }
      })
      .catch(() => {
        // Fallback maintained
      });
  }, []);

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Semester switch & header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Oceny i Osiągnięcia (Librus Synergia)</h2>
        </div>

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
