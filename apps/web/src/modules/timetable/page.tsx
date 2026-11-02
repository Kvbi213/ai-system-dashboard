import React, { useState, useEffect } from 'react';
import { DaySelectorBar } from './components/DaySelectorBar';
import { LessonCard, LessonItem } from './components/LessonCard';
import { Calendar, RefreshCw } from 'lucide-react';
import { schoolApi } from '../../api/client';

const FALLBACK_LESSONS: Record<number, LessonItem[]> = {
  1: [
    { id: '1', order: 1, timeRange: '08:50 - 09:35', subject: 'Informatyka', teacher: 'Becker Adam (2 TI gr.2)', classroom: 's. 04' },
    { id: '2', order: 2, timeRange: '09:40 - 10:25', subject: 'Informatyka', teacher: 'Becker Adam (2 TI gr.2)', classroom: 's. 04' },
    { id: '3', order: 3, timeRange: '10:40 - 11:25', subject: 'Biznes i zarządzanie', teacher: 'Sokół Paweł', classroom: 's. 0.2' },
    { id: '4', order: 4, timeRange: '11:30 - 12:15', subject: 'Lokalne sieci komputerowe', teacher: 'Wojnarowski Przemysław', classroom: 's. 0.2' },
    { id: '5', order: 5, timeRange: '12:20 - 13:05', subject: 'Język polski', teacher: 'Negowska Alicja', classroom: 's. 34' }
  ]
};

export const TimetablePage: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState(1);
  const [lessons, setLessons] = useState<LessonItem[]>(FALLBACK_LESSONS[1] || []);
  const [loading, setLoading] = useState(false);

  const loadTimetable = (day: number) => {
    setLoading(true);
    schoolApi.getTimetable(day)
      .then((res) => {
        if (res?.lessons) {
          setLessons(res.lessons);
        }
      })
      .catch(() => {
        setLessons(FALLBACK_LESSONS[day] || []);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadTimetable(selectedDay);
  }, [selectedDay]);

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Day Selector Bar */}
      <DaySelectorBar selectedDay={selectedDay} onSelectDay={setSelectedDay} />

      {/* Meta header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Calendar className="w-4 h-4 text-sky-600" />
          <span>Synchronizacja z Systemem Dydaktycznym</span>
          <span className="font-mono text-slate-400">:: Harmonogram Główny</span>
        </div>
        <button
          onClick={() => loadTimetable(selectedDay)}
          disabled={loading}
          className="flex items-center gap-1 text-xs text-sky-700 hover:text-sky-800 font-semibold transition"
          title="Odśwież plan lekcji"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Odśwież</span>
        </button>
      </div>

      {/* Lessons List */}
      <div className="space-y-2.5">
        {lessons.length === 0 ? (
          <div className="text-center py-12 glass-panel rounded-2xl text-slate-400 text-sm">
            Brak zajęć lekcyjnych w wybranym dniu.
          </div>
        ) : (
          lessons.map((lesson) => <LessonCard key={lesson.id} lesson={lesson} />)
        )}
      </div>
    </div>
  );
};
