import React, { useState } from 'react';
import { DaySelectorBar } from './components/DaySelectorBar';
import { LessonCard, LessonItem } from './components/LessonCard';
import { Calendar, RefreshCw } from 'lucide-react';

const MOCK_TIMETABLE: Record<number, LessonItem[]> = {
  1: [
    { id: '1', order: 1, timeRange: '08:00 - 08:45', subject: 'Matematyka', teacher: 'mgr A. Nowak', classroom: 'Sala 105' },
    { id: '2', order: 2, timeRange: '08:55 - 09:40', subject: 'Język Polski', teacher: 'mgr B. Kowalska', classroom: 'Sala 210' },
    { id: '3', order: 3, timeRange: '09:50 - 10:35', subject: 'Systemy Operacyjne', teacher: 'inż. K. Wiśniewski', classroom: 'Pracownia 204' },
    { id: '4', order: 4, timeRange: '10:45 - 11:30', subject: 'Projektowanie Oprogramowania', teacher: 'inż. K. Wiśniewski', classroom: 'Pracownia 204' },
    { id: '5', order: 5, timeRange: '11:40 - 12:25', subject: 'Język Angielski Zawodowy', teacher: 'mgr E. Lis', classroom: 'Sala 102', isSubstitution: true, substitutionNote: 'Zastępstwo za mgr Zielińską' },
    { id: '6', order: 6, timeRange: '12:45 - 13:30', subject: 'Wychowanie Fizyczne', teacher: 'mgr T. Lewandowski', classroom: 'Hala Sportowa' }
  ],
  2: [
    { id: '7', order: 1, timeRange: '08:00 - 08:45', subject: 'Bazy Danych SQL', teacher: 'inż. M. Kamiński', classroom: 'Pracownia 202', hasExam: true },
    { id: '8', order: 2, timeRange: '08:55 - 09:40', subject: 'Bazy Danych SQL', teacher: 'inż. M. Kamiński', classroom: 'Pracownia 202' },
    { id: '9', order: 3, timeRange: '09:50 - 10:35', subject: 'Fizyka', teacher: 'dr J. Dąbrowski', classroom: 'Sala 301' },
    { id: '10', order: 4, timeRange: '10:45 - 11:30', subject: 'Historia i Teraźniejszość', teacher: 'mgr O. Wójcik', classroom: 'Sala 112' }
  ],
  3: [
    { id: '11', order: 1, timeRange: '08:55 - 09:40', subject: 'Informatyka Stosowana', teacher: 'inż. K. Wiśniewski', classroom: 'Pracownia 204' },
    { id: '12', order: 2, timeRange: '09:50 - 10:35', subject: 'Matematyka Dyskretna', teacher: 'mgr A. Nowak', classroom: 'Sala 105' }
  ],
  4: [
    { id: '13', order: 1, timeRange: '08:00 - 08:45', subject: 'Sieci Komputerowe Cisco', teacher: 'mgr inż. R. Pawlak', classroom: 'Pracownia 208' },
    { id: '14', order: 2, timeRange: '08:55 - 09:40', subject: 'Sieci Komputerowe Cisco', teacher: 'mgr inż. R. Pawlak', classroom: 'Pracownia 208' },
    { id: '15', order: 3, timeRange: '09:50 - 10:35', subject: 'Język Niemiecki', teacher: 'mgr U. Schmidt', classroom: 'Sala 104' }
  ],
  5: [
    { id: '16', order: 1, timeRange: '08:00 - 08:45', subject: 'Pracownia Aplikacji Webowych', teacher: 'inż. K. Wiśniewski', classroom: 'Pracownia 204' },
    { id: '17', order: 2, timeRange: '08:55 - 09:40', subject: 'Pracownia Aplikacji Webowych', teacher: 'inż. K. Wiśniewski', classroom: 'Pracownia 204' }
  ]
};

export const TimetablePage: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState(1);
  const lessons = MOCK_TIMETABLE[selectedDay] || [];

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Day Selector Bar */}
      <DaySelectorBar selectedDay={selectedDay} onSelectDay={setSelectedDay} />

      {/* Meta header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Calendar className="w-4 h-4 text-sky-400" />
          <span>Synchronizacja z Librus Synergia</span>
          <span className="font-mono text-slate-500">:: ZSE Starogard Gd.</span>
        </div>
        <button
          className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 transition"
          title="Odśwież plan lekcji"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Odśwież</span>
        </button>
      </div>

      {/* Lessons List */}
      <div className="space-y-2.5">
        {lessons.length === 0 ? (
          <div className="text-center py-12 glass-card rounded-2xl text-slate-400 text-sm">
            Brak zajęć lekcyjnych w wybranym dniu.
          </div>
        ) : (
          lessons.map((lesson) => <LessonCard key={lesson.id} lesson={lesson} />)
        )}
      </div>
    </div>
  );
};
