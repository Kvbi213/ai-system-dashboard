import React, { useState, useEffect } from 'react';
import { DaySelectorBar } from './components/DaySelectorBar';
import { LessonCard, LessonItem } from './components/LessonCard';
import { Calendar, RefreshCw } from 'lucide-react';
import { schoolApi } from '../../api/client';

const FALLBACK_LESSONS: Record<number, LessonItem[]> = {
  1: [
    { id: 'mon_2', order: 2, timeRange: '08:50 - 09:35', subject: 'Informatyka', teacher: 'Becker Adam (2 TI gr.2)', classroom: 's. 04' },
    { id: 'mon_3', order: 3, timeRange: '09:40 - 10:25', subject: 'Informatyka', teacher: 'Becker Adam (2 TI gr.2)', classroom: 's. 04' },
    { id: 'mon_4', order: 4, timeRange: '10:40 - 11:25', subject: 'Biznes i zarządzanie', teacher: 'Sokół Paweł', classroom: 's. 0.2' },
    { id: 'mon_5', order: 5, timeRange: '11:30 - 12:15', subject: 'Lokalne sieci komputerowe', teacher: 'Wojnarowski Przemysław', classroom: 's. 0.2' },
    { id: 'mon_6', order: 6, timeRange: '12:20 - 13:05', subject: 'Język polski', teacher: 'Niegowska Alicja', classroom: 's. 34' }
  ],
  2: [
    { id: 'tue_1', order: 1, timeRange: '08:00 - 08:45', subject: 'Pracownia urządzeń techniki komputerowej', teacher: 'Wojnarowski Przemysław (2TI-gr1)', classroom: 's. 0.1' },
    { id: 'tue_2', order: 2, timeRange: '08:50 - 09:35', subject: 'Pracownia urządzeń techniki komputerowej', teacher: 'Wojnarowski Przemysław (2TI-gr1)', classroom: 's. 0.1' },
    { id: 'tue_3', order: 3, timeRange: '09:40 - 10:25', subject: 'Zajęcia z wychowawcą', teacher: 'Ziemba Joanna', classroom: 's. 31' },
    { id: 'tue_4', order: 4, timeRange: '10:40 - 11:25', subject: 'Wychowanie fizyczne', teacher: 'Łysakowski Grzegorz (Klasa 2 TI)', classroom: 'Sala gimnastyczna' },
    { id: 'tue_5', order: 5, timeRange: '11:30 - 12:15', subject: 'Wychowanie fizyczne', teacher: 'Łysakowski Grzegorz (Klasa 2 TI)', classroom: 'Sala gimnastyczna' },
    { id: 'tue_6', order: 6, timeRange: '12:20 - 13:05', subject: 'Pracownia systemów operacyjnych', teacher: 'Reszka Sławomir (2 TI gr1 PSO)', classroom: 's. 1.15' },
    { id: 'tue_7', order: 7, timeRange: '13:15 - 14:00', subject: 'Pracownia systemów operacyjnych', teacher: 'Reszka Sławomir (2 TI gr1 PSO)', classroom: 's. 1.15' },
    { id: 'tue_8', order: 8, timeRange: '14:05 - 14:50', subject: 'Edukacja zdrowotna', teacher: 'Spych Monika', classroom: 's. 38' },
    { id: 'tue_9', order: 9, timeRange: '14:55 - 15:40', subject: 'Matematyka', teacher: 'Bahr Zbigniew', classroom: 's. 26' }
  ],
  3: [
    { id: 'wed_1', order: 1, timeRange: '08:00 - 08:45', subject: 'Biologia', teacher: 'Łukaszczyk-Wulgaris Joanna', classroom: 's. 06' },
    { id: 'wed_2', order: 2, timeRange: '08:50 - 09:35', subject: 'Biologia', teacher: 'Łukaszczyk-Wulgaris Joanna', classroom: 's. 06' },
    { id: 'wed_3', order: 3, timeRange: '09:40 - 10:25', subject: 'Systemy operacyjne', teacher: 'Wojnarowski Przemysław', classroom: 's. 1.2' },
    { id: 'wed_4', order: 4, timeRange: '10:40 - 11:25', subject: 'Systemy operacyjne', teacher: 'Wojnarowski Przemysław', classroom: 's. 1.2' },
    { id: 'wed_5', order: 5, timeRange: '11:30 - 12:15', subject: 'Urządzenia techniki komputerowej', teacher: 'Gembiak Bartosz', classroom: 's. 1.2' },
    { id: 'wed_6', order: 6, timeRange: '12:20 - 13:05', subject: 'Urządzenia techniki komputerowej', teacher: 'Gembiak Bartosz', classroom: 's. 1.2' },
    { id: 'wed_7', order: 7, timeRange: '13:15 - 14:00', subject: 'Chemia', teacher: 'Kolasińska Paulina', classroom: 's. 08' },
    { id: 'wed_8', order: 8, timeRange: '14:05 - 14:50', subject: 'Historia', teacher: 'Wardyn Wojciech', classroom: 's. 06' },
    { id: 'wed_9', order: 9, timeRange: '14:55 - 15:40', subject: 'Matematyka', teacher: 'Bahr Zbigniew', classroom: 's. 26' }
  ],
  4: [
    { id: 'thu_2', order: 2, timeRange: '08:50 - 09:35', subject: 'Język angielski', teacher: 'Ziemba Joanna (j.ang 2 TI gr 1)', classroom: 's. 22' },
    { id: 'thu_3', order: 3, timeRange: '09:40 - 10:25', subject: 'Język angielski', teacher: 'Ziemba Joanna (j.ang 2 TI gr 1)', classroom: 's. 22' },
    { id: 'thu_4', order: 4, timeRange: '10:40 - 11:25', subject: 'Pracownia lokalnych sieci komputerowych', teacher: 'Kryła Łukasz', classroom: 's. 1.16' },
    { id: 'thu_5', order: 5, timeRange: '11:30 - 12:15', subject: 'Pracownia lokalnych sieci komputerowych', teacher: 'Kryła Łukasz', classroom: 's. 1.16' },
    { id: 'thu_6', order: 6, timeRange: '12:20 - 13:05', subject: 'Matematyka', teacher: 'Bahr Zbigniew', classroom: 's. 05' },
    { id: 'thu_7', order: 7, timeRange: '13:15 - 14:00', subject: 'Matematyka', teacher: 'Bahr Zbigniew', classroom: 's. 05' },
    { id: 'thu_8', order: 8, timeRange: '14:05 - 14:50', subject: 'Język angielski zawodowy', teacher: 'Ziemba Joanna (j. ang zaw. 2 TI gr 1)', classroom: 's. 22' }
  ],
  5: [
    { id: 'fri_1', order: 1, timeRange: '08:00 - 08:45', subject: 'Edukacja obywatelska', teacher: 'Czarna Alicja', classroom: 's. 09' },
    { id: 'fri_2', order: 2, timeRange: '08:50 - 09:35', subject: 'Wychowanie fizyczne', teacher: 'Łysakowski Grzegorz (Klasa 2 TI)', classroom: 'Sala gimnastyczna' },
    { id: 'fri_3', order: 3, timeRange: '09:40 - 10:25', subject: 'Język niemiecki', teacher: 'Chyła Beata (2TI/1)', classroom: 's. 21' },
    { id: 'fri_4', order: 4, timeRange: '10:40 - 11:25', subject: 'Język niemiecki', teacher: 'Chyła Beata (2TI/1)', classroom: 's. 21' },
    { id: 'fri_5', order: 5, timeRange: '11:30 - 12:15', subject: 'Chemia', teacher: 'Kolasińska Paulina', classroom: 's. 19' },
    { id: 'fri_6', order: 6, timeRange: '12:20 - 13:05', subject: 'Język polski', teacher: 'Niegowska Alicja', classroom: 's. 34' },
    { id: 'fri_7', order: 7, timeRange: '13:15 - 14:00', subject: 'Język polski', teacher: 'Niegowska Alicja', classroom: 's. 34' }
  ]
};

export const TimetablePage: React.FC = () => {
  // Automatyczne wykrycie bieżącego dnia roboczego (1 = Pon, 2 = Wt, ..., 5 = Pt)
  const currentDay = (() => {
    const d = new Date().getDay();
    if (d >= 1 && d <= 5) return d;
    return 1; // Weekend przełącza domyślnie na poniedziałek
  })();

  const [selectedDay, setSelectedDay] = useState(currentDay);
  const [lessons, setLessons] = useState<LessonItem[]>(FALLBACK_LESSONS[currentDay] || FALLBACK_LESSONS[1] || []);
  const [loading, setLoading] = useState(false);

  const loadTimetable = (day: number) => {
    setLoading(true);
    schoolApi.getTimetable(day)
      .then((res) => {
        if (res?.lessons && res.lessons.length > 0) {
          setLessons(res.lessons);
        } else {
          setLessons(FALLBACK_LESSONS[day] || []);
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
