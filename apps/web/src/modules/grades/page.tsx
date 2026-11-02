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
    grades: [{ id: 'g1', value: 6, weight: 3, category: 'Sprawdzian Praktyczny Linux' }]
  },
  {
    id: '2',
    name: 'Systemy operacyjne',
    average: 5.00,
    grades: [{ id: 'g2', value: 5, weight: 3, category: 'Zarządzanie procesami i Docker' }]
  },
  {
    id: '3',
    name: 'Lokalne sieci komputerowe',
    average: 5.00,
    grades: [{ id: 'g3', value: 5, weight: 3, category: 'Konfiguracja tras i VLAN' }]
  },
  {
    id: '4',
    name: 'Matematyka',
    average: 4.00,
    grades: [{ id: 'g4', value: 4, weight: 3, category: 'Wielomiany i funkcje' }]
  }
];

export const GradesPage: React.FC = () => {
  const [semester, setSemester] = useState<1 | 2>(2);
  const [subjects, setSubjects] = useState<SubjectGradeItem[]>(FALLBACK_SUBJECTS);
  const [stats, setStats] = useState({ gpa: 4.32, luckyNumber: 21, threatsCount: 0, totalGrades: 16 });

  useEffect(() => {
    schoolApi.getGrades()
      .then((res) => {
        if (res?.grades && res.grades.length > 0) {
          const mapped: SubjectGradeItem[] = res.grades.map((g: any) => ({
            id: g.id,
            name: g.subject,
            average: g.grade,
            grades: [{ id: g.id, value: g.grade, weight: g.weight, category: g.description }]
          }));
          setSubjects(mapped);
          if (res.stats) {
            setStats({
              gpa: res.stats.gpa || 4.32,
              luckyNumber: res.stats.luckyNumber || 21,
              threatsCount: 0,
              totalGrades: res.stats.totalGradesCount || mapped.length
            });
          }
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
          <GraduationCap className="w-5 h-5 text-sky-600" />
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Oceny i Osiągnięcia</h2>
        </div>

        <div className="flex gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
          <button
            onClick={() => setSemester(1)}
            className={`px-3 py-1 rounded-lg transition font-semibold ${
              semester === 1 ? 'bg-white text-sky-700 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Semestr 1
          </button>
          <button
            onClick={() => setSemester(2)}
            className={`px-3 py-1 rounded-lg transition font-semibold ${
              semester === 2 ? 'bg-white text-sky-700 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-900'
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
      <SubjectGradesGrid subjects={subjects} />
    </div>
  );
};
