import React, { useState } from 'react';
import { GradeStatsSummary } from './components/GradeStatsSummary';
import { SubjectGradesGrid, SubjectGradeItem } from './components/SubjectGradesGrid';
import { GraduationCap } from 'lucide-react';

const MOCK_SUBJECTS: SubjectGradeItem[] = [
  {
    id: '1',
    name: 'Projektowanie Oprogramowania',
    average: 4.80,
    grades: [
      { id: 'g1', value: 5, weight: 3, category: 'Projekt końcowy architektury' },
      { id: 'g2', value: 5, weight: 2, category: 'Wzorce projektowe OOP' },
      { id: 'g3', value: 4, weight: 1, category: 'Aktywność' }
    ]
  },
  {
    id: '2',
    name: 'Systemy Operacyjne i Sieci',
    average: 4.67,
    grades: [
      { id: 'g4', value: 5, weight: 3, category: 'Sprawdzian: Skrypty Bash i uprawnienia' },
      { id: 'g5', value: 4, weight: 2, category: 'Konfiguracja iptables' },
      { id: 'g6', value: 5, weight: 1, category: 'Ćwiczenia laboratoryjne' }
    ]
  },
  {
    id: '3',
    name: 'Bazy Danych SQL',
    average: 4.75,
    grades: [
      { id: 'g7', value: 5, weight: 3, category: 'Złożone złączenia JOIN i indeksy B-Tree' },
      { id: 'g8', value: 4, weight: 2, category: 'Triggery i procedury' },
      { id: 'g9', value: 5, weight: 2, category: 'Transakcje ACID' }
    ]
  },
  {
    id: '4',
    name: 'Matematyka',
    average: 4.50,
    grades: [
      { id: 'g10', value: 5, weight: 3, category: 'Geometria analityczna' },
      { id: 'g11', value: 4, weight: 2, category: 'Rachunek prawdopodobieństwa' },
      { id: 'g12', value: 4, weight: 2, category: 'Kartkówka' },
      { id: 'g13', value: 5, weight: 1, category: 'Odpowiedź ustna' }
    ]
  },
  {
    id: '5',
    name: 'Język Angielski Zawodowy',
    average: 5.00,
    grades: [
      { id: 'g14', value: 5, weight: 3, category: 'Dokumentacja techniczna RFC' },
      { id: 'g15', value: 5, weight: 2, category: 'Słownictwo Cloud & Security' }
    ]
  }
];

export const GradesPage: React.FC = () => {
  const [semester, setSemester] = useState<1 | 2>(2);

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
      <GradeStatsSummary />

      {/* Subjects Grid */}
      <SubjectGradesGrid subjects={MOCK_SUBJECTS} />
    </div>
  );
};
