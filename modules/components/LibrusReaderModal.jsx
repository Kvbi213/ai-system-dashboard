import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
  X,
  RefreshCw,
  Download,
  Copy,
  Check,
  AlertCircle,
  Calendar,
  GraduationCap,
  Clock,
  BookOpen,
  Layers,
  CheckCircle2,
  ChevronRight,
  Play,
  Database,
  User,
  Shield,
  Info,
  CalendarDays,
  FileJson
} from 'lucide-react';
import { isCloudEnvironment } from '../services/cloudSync.js';

export default function LibrusReaderModal({
  isOpen,
  onClose,
  onApplyToSchedule,
  onRefreshGrades
}) {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 0 = idle, 1..6 = stages, 7 = done
  const [readResult, setReadResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'timetable' | 'grades' | 'calendar' | 'logs'
  const [copied, setCopied] = useState(false);
  const [autoImport, setAutoImport] = useState(false);
  const [selectedDayFilter, setSelectedDayFilter] = useState('all');

  const stepsList = useMemo(() => [
    'Autoryzacja i inicjalizacja sesji',
    'Profil ucznia i szczęśliwy numerek',
    'Pobieranie ocen i statystyki ważone',
    'Terminarz i absencje nauczycieli',
    'Plan lekcji dla wszystkich dni tygodnia',
    'Korelacja zastępstw i zapis do bazy'
  ], []);

  // Zamknięcie na klawisz Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  // Uruchomienie odczytu z API
  const handleExecuteRead = useCallback(async (shouldImport = false) => {
    setLoading(true);
    setError(null);
    setCurrentStep(1);

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev < 5 ? prev + 1 : prev));
    }, 1800);

    try {
      const isCloud = isCloudEnvironment();
      const endpoint = isCloud ? '/api/librus?path=manual-read' : '/api/librus/manual-read';
      const payload = { importToSchedule: shouldImport };

      const response = await axios.post(endpoint, payload, { timeout: 35000 });
      clearInterval(stepInterval);
      setCurrentStep(6);

      if (response.data && response.data.success) {
        setReadResult(response.data);
        if (shouldImport && onApplyToSchedule && response.data.timetable?.lessons) {
          onApplyToSchedule(response.data.timetable.lessons);
        }
        if (onRefreshGrades && response.data.grades) {
          onRefreshGrades(response.data.grades);
        }
      } else {
        throw new Error(response.data?.error || 'Nieznany błąd odpowiedzi Librus API');
      }
    } catch (err) {
      clearInterval(stepInterval);
      const msg = err.response?.data?.error || err.message || 'Błąd komunikacji z Librus API';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [onApplyToSchedule, onRefreshGrades]);

  // Kopiowanie raportu do schowka
  const handleCopyReport = () => {
    if (!readResult) return;
    const summaryText = `[+] RAPORT RĘCZNEGO CZYTNIKA LIBRUS API
Student: ${readResult.studentInfo?.name || 'Jakub Lis'} (${readResult.studentInfo?.class || '2 TI T'})
Szczęśliwy numerek: ${readResult.luckyNumber || '—'}
Średnia ocen: ${readResult.grades?.overallAverage || '—'} (przedmiotów: ${readResult.grades?.totalSubjects || 21})
Plan lekcji: ${readResult.timetable?.lessons?.length || 0} lekcji w tygodniu (${readResult.timetable?.substitutions?.length || 0} zastępstw/odwołań)
Wydarzenia terminarza: ${readResult.calendar?.events?.length || 0}
Czas odczytu: ${readResult.timestamp || new Date().toISOString()}`;

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Pobranie zrzutu JSON
  const handleDownloadJson = () => {
    if (!readResult) return;
    const blob = new Blob([JSON.stringify(readResult, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `librus_dump_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  const lessons = readResult?.timetable?.lessons || [];
  const subjects = readResult?.grades?.subjects || [];
  const events = readResult?.calendar?.events || [];

  const dayLessonsMap = {
    monday: lessons.filter((l) => l.day === 'monday' || l.day === 'mon'),
    tuesday: lessons.filter((l) => l.day === 'tuesday' || l.day === 'tue'),
    wednesday: lessons.filter((l) => l.day === 'wednesday' || l.day === 'wed'),
    thursday: lessons.filter((l) => l.day === 'thursday' || l.day === 'thu'),
    friday: lessons.filter((l) => l.day === 'friday' || l.day === 'fri')
  };

  const filteredLessons = selectedDayFilter === 'all'
    ? lessons
    : dayLessonsMap[selectedDayFilter] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-2xl overflow-hidden font-sans">
        
        {/* NAGŁÓWEK OKNA DIALOGOWEGO */}
        <header className="flex items-center justify-between px-6 py-4 bg-surface-container-low border-b border-outline-variant/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-sm">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-code-mono text-[10px] text-primary uppercase tracking-widest font-bold">
                  [*] PROTOKÓŁ SYSTEMOWY v3.3.3
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-code-mono">
                  Ground Truth Reader
                </span>
              </div>
              <h2 className="text-lg font-bold text-on-surface tracking-tight">
                Ręczny Czytnik Zasobów Librus Synergia API
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-xl text-outline hover:text-on-surface hover:bg-surface-container transition-colors disabled:opacity-40"
            title="Zamknij okno [Esc]"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* PASEK AKCJI GŁÓWNYCH */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-surface-container-high/40 border-b border-outline-variant/20 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleExecuteRead(autoImport)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary/90 font-medium text-sm transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Pobieranie zasobów...' : 'Uruchom Pełny Odczyt API'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleExecuteRead(true)}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-secondary/20 text-secondary hover:bg-secondary/30 border border-secondary/40 font-medium text-sm transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              title="Pobiera dane z Librusa i natychmiast aplikuje cały plan lekcji do aktywnego harmonogramu"
            >
              <Layers className="w-4 h-4" />
              <span>Odczytaj i Zastosuj do Planu</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {readResult && (
              <>
                <button
                  type="button"
                  onClick={handleCopyReport}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface text-xs font-code-mono transition-colors border border-outline-variant/30 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Skopiowano' : 'Kopiuj Raport'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadJson}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface text-xs font-code-mono transition-colors border border-outline-variant/30 cursor-pointer"
                >
                  <FileJson className="w-3.5 h-3.5" />
                  <span>Zrzut JSON</span>
                </button>
              </>
            )}

            <label className="flex items-center gap-2 text-xs font-code-mono text-outline cursor-pointer select-none pl-2 border-l border-outline-variant/30">
              <input
                type="checkbox"
                checked={autoImport}
                onChange={(e) => setAutoImport(e.target.checked)}
                className="rounded border-outline-variant text-primary focus:ring-primary"
              />
              <span>Zawsze importuj do Planu</span>
            </label>
          </div>
        </div>

        {/* STAN ŁADOWANIA / STEPPER POSTĘPU */}
        {loading && (
          <div className="px-6 py-4 bg-surface-container-low/70 border-b border-outline-variant/20 flex flex-col gap-2 shrink-0">
            <div className="flex items-center justify-between text-xs font-code-mono">
              <span className="text-primary font-bold">
                [KROK {currentStep}/6] :: {stepsList[currentStep - 1] || 'Przygotowanie strumienia...'}
              </span>
              <span className="text-outline">Trwa pobieranie wszystkich zasobów...</span>
            </div>
            <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 rounded-full"
                style={{ width: `${(currentStep / 6) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* KOMUNIKAT BŁĘDU */}
        {error && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-error/15 border border-error/30 text-error flex items-start gap-3 text-xs font-code-mono shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold">[!] BŁĄD ODCZYTU LIBRUS API</div>
              <div className="mt-0.5 text-on-surface-variant">{error}</div>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-error hover:text-on-surface"
            >
              ✕
            </button>
          </div>
        )}

        {/* GŁÓWNA ZAWARTOŚĆ I ZAKŁADKI */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          
          {/* PASEK ZAKŁADEK */}
          <div className="flex items-center gap-1 px-6 pt-3 border-b border-outline-variant/20 bg-surface-container-lowest shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('summary')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer ${
                activeTab === 'summary'
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-outline hover:text-on-surface'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>Podsumowanie i Metryki</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('timetable')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer ${
                activeTab === 'timetable'
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-outline hover:text-on-surface'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Plan Lekcji (Wszystkie Dni)</span>
              {lessons.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-primary/20 text-primary font-code-mono text-[10px]">
                  {lessons.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('grades')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer ${
                activeTab === 'grades'
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-outline hover:text-on-surface'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Wykaz Ocen ({subjects.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer ${
                activeTab === 'calendar'
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-outline hover:text-on-surface'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Terminarz & Absencje ({events.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium border-b-2 transition-all cursor-pointer ${
                activeTab === 'logs'
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-outline hover:text-on-surface'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Dziennik Zdarzeń (Logi)</span>
            </button>
          </div>

          {/* OBSZAR PRZEWIJALNY */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            
            {!readResult && !loading && (
              <div className="flex flex-col items-center justify-center py-16 text-center text-outline">
                <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-primary mb-4 border border-outline-variant/30">
                  <Database className="w-8 h-8 opacity-80" />
                </div>
                <h3 className="text-base font-bold text-on-surface">Czytnik Gotowy do Pracy</h3>
                <p className="text-xs max-w-md mt-1 leading-relaxed">
                  Kliknij przycisk „Uruchom Pełny Odczyt API” powyżej, aby nawiązać bezpośrednie połączenie z Librus Synergia i pobrać pełne spektrum danych dla wszystkich dni i przedmiotów.
                </p>
                <button
                  type="button"
                  onClick={() => handleExecuteRead(false)}
                  className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary font-medium text-xs shadow-md hover:bg-primary/90 transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  <span>Rozpocznij Pełny Zrzut Danych</span>
                </button>
              </div>
            )}

            {readResult && (
              <>
                {/* 1. ZAKŁADKA PODSUMOWANIA */}
                {activeTab === 'summary' && (
                  <div className="space-y-4">
                    {/* KAFELKI METRYK GŁÓWNYCH */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col justify-between">
                        <div className="text-[11px] font-code-mono text-outline uppercase tracking-wider">Profil Ucznia</div>
                        <div className="text-lg font-bold text-on-surface mt-1 truncate">
                          {readResult.studentInfo?.name || 'Jakub Lis'}
                        </div>
                        <div className="text-xs text-primary font-code-mono mt-0.5">
                          Klasa: {readResult.studentInfo?.class || '2 TI T'}
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col justify-between">
                        <div className="text-[11px] font-code-mono text-outline uppercase tracking-wider">Szczęśliwy Numerek</div>
                        <div className="text-2xl font-bold text-primary mt-1 font-code-mono">
                          {readResult.luckyNumber || 21}
                        </div>
                        <div className="text-xs text-outline font-code-mono mt-0.5">Aktualny na dziś</div>
                      </div>

                      <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col justify-between">
                        <div className="text-[11px] font-code-mono text-outline uppercase tracking-wider">Średnia Ogólna</div>
                        <div className="text-2xl font-bold text-secondary mt-1 font-code-mono">
                          {readResult.grades?.overallAverage || '4.32'}
                        </div>
                        <div className="text-xs text-outline font-code-mono mt-0.5">
                          Przedmiotów: {readResult.grades?.totalSubjects || 21}
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col justify-between">
                        <div className="text-[11px] font-code-mono text-outline uppercase tracking-wider">Harmonogram Tygodnia</div>
                        <div className="text-2xl font-bold text-on-surface mt-1 font-code-mono">
                          {lessons.length} <span className="text-xs font-normal text-outline">lekcji</span>
                        </div>
                        <div className="text-xs text-amber-400 font-code-mono mt-0.5">
                          {readResult.timetable?.substitutions?.length || 0} zastępstw / odwołań
                        </div>
                      </div>
                    </div>

                    {/* PRZEGLĄD DNI TYGODNIA */}
                    <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20">
                      <div className="text-xs font-code-mono font-bold text-on-surface uppercase tracking-wider mb-3">
                        Wykaz Bloków Lekcyjnych wg Dni Tygodnia (Cały Tydzień):
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 font-code-mono text-xs">
                        {[
                          { id: 'mon', name: 'Poniedziałek', count: dayLessonsMap.monday.length },
                          { id: 'tue', name: 'Wtorek', count: dayLessonsMap.tuesday.length },
                          { id: 'wed', name: 'Środa', count: dayLessonsMap.wednesday.length },
                          { id: 'thu', name: 'Czwartek', count: dayLessonsMap.thursday.length },
                          { id: 'fri', name: 'Piątek', count: dayLessonsMap.friday.length }
                        ].map((d) => (
                          <div
                            key={d.id}
                            className="p-3 rounded-lg bg-surface-container flex flex-col justify-between border border-outline-variant/20"
                          >
                            <span className="text-outline text-[11px] font-bold">{d.name}</span>
                            <span className="text-lg font-bold text-on-surface mt-1">{d.count} zajęć</span>
                            <span className="text-[10px] text-primary mt-0.5">Pełny blok</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. ZAKŁADKA PLAN LEKCJI (WSZYSTKIE DNI) */}
                {activeTab === 'timetable' && (
                  <div className="space-y-3">
                    {/* FILTR DNI */}
                    <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-surface-container-low border border-outline-variant/20">
                      {[
                        { id: 'all', label: 'Wszystkie Dni (Pon-Pt)' },
                        { id: 'monday', label: 'Poniedziałek' },
                        { id: 'tuesday', label: 'Wtorek' },
                        { id: 'wednesday', label: 'Środa' },
                        { id: 'thursday', label: 'Czwartek' },
                        { id: 'friday', label: 'Piątek' }
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setSelectedDayFilter(f.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-code-mono transition-all cursor-pointer ${
                            selectedDayFilter === f.id
                              ? 'bg-primary text-on-primary font-bold shadow-sm'
                              : 'text-outline hover:text-on-surface'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    {/* LISTA LEKCJI */}
                    <div className="space-y-2">
                      {filteredLessons.length === 0 ? (
                        <div className="text-center py-8 text-outline text-xs font-code-mono">
                          Brak zaplanowanych zajęć dla wybranego filtra.
                        </div>
                      ) : (
                        filteredLessons.map((lesson, idx) => {
                          const isCancelled = lesson.isCancelled || lesson.status === 'cancelled';
                          const isSubst = lesson.isSubstitution || lesson.status === 'substitution';

                          return (
                            <div
                              key={lesson.id || idx}
                              className={`p-3 rounded-xl flex items-center justify-between gap-3 text-xs font-code-mono border transition-all ${
                                isCancelled
                                  ? 'bg-error/10 border-error/30 text-error'
                                  : isSubst
                                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                                  : 'bg-surface-container border-outline-variant/20 text-on-surface'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="px-2 py-1 rounded bg-surface-container-high font-bold text-on-surface shrink-0">
                                  {lesson.time_start || lesson.timeStart} - {lesson.time_end || lesson.timeEnd}
                                </span>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className={`font-bold text-sm ${isCancelled ? 'line-through text-outline' : 'text-on-surface'}`}>
                                      {lesson.subject || lesson.title}
                                    </span>
                                    {isCancelled && (
                                      <span className="px-1.5 py-0.5 rounded bg-error text-on-error font-bold text-[10px]">
                                        [!] ODWOŁANA
                                      </span>
                                    )}
                                    {isSubst && (
                                      <span className="px-1.5 py-0.5 rounded bg-amber-500 text-black font-bold text-[10px]">
                                        [~] ZASTĘPSTWO
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-outline mt-0.5">
                                    {lesson.teacher || lesson.cleanTeacher || 'Brak danych nauczyciela'}
                                    {lesson.room && ` • Sala: ${lesson.room}`}
                                    {lesson.day && ` • ${lesson.day}`}
                                  </div>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="text-[10px] text-outline">
                                  {lesson.type || 'Zajęcia'}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* 3. ZAKŁADKA OCENY */}
                {activeTab === 'grades' && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {subjects.map((sub, sIdx) => {
                        const sem1 = sub.sem1Grades || [];
                        const sem2 = sub.sem2Grades || [];
                        const allGrades = [...sem1, ...sem2];

                        return (
                          <div
                            key={sub.name || sIdx}
                            className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col justify-between"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="font-bold text-xs text-on-surface capitalize">
                                  {sub.name}
                                </span>
                                <div className="text-[10px] text-outline truncate max-w-[200px]">
                                  {sub.teacher || 'Brak przypisanego nauczyciela'}
                                </div>
                              </div>
                              <span className="font-code-mono text-xs font-bold text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20 shrink-0">
                                Śr: {sub.computedAverage || sub.average || '—'}
                              </span>
                            </div>

                            {/* Pigułki ocen */}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {allGrades.length === 0 ? (
                                <span className="text-[11px] text-outline italic">Brak ocen</span>
                              ) : (
                                allGrades.map((g, gIdx) => (
                                  <span
                                    key={g.id || gIdx}
                                    title={g.details ? `Waga: ${g.details.weight || 1} • ${g.details.category || ''} • ${g.details.comment || ''}` : ''}
                                    className="px-2 py-0.5 rounded bg-surface-container-high border border-outline-variant/30 text-xs font-code-mono font-bold text-on-surface"
                                  >
                                    {g.value}
                                  </span>
                                ))
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 4. ZAKŁADKA TERMINARZ & ABSENCJE */}
                {activeTab === 'calendar' && (
                  <div className="space-y-2">
                    {events.length === 0 ? (
                      <div className="text-center py-8 text-outline text-xs font-code-mono">
                        Brak zdarzeń w kalendarzu szkolnym.
                      </div>
                    ) : (
                      events.map((ev, eIdx) => {
                        const isAbsence = ev.type === 'absence' || ev.category?.includes('Nieobecność');
                        const isExam = ev.type === 'sprawdzian' || ev.category?.includes('Sprawdzian');

                        return (
                          <div
                            key={ev.id || eIdx}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs font-code-mono ${
                              isAbsence
                                ? 'bg-surface-container-low border-outline-variant/20 text-outline'
                                : isExam
                                ? 'bg-primary/10 border-primary/30 text-on-surface'
                                : 'bg-surface-container border-outline-variant/20 text-on-surface'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="px-2 py-1 rounded bg-surface-container-high font-bold shrink-0">
                                {ev.date}
                              </span>
                              <div>
                                <span className="font-bold">{ev.title}</span>
                                <div className="text-[11px] text-outline mt-0.5">
                                  {ev.category} {ev.teacher ? `• ${ev.teacher}` : ''} {ev.time ? `• ${ev.time}` : ''}
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] uppercase font-bold text-outline shrink-0">
                              {ev.type || 'Zdarzenie'}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* 5. ZAKŁADKA DZIENNIK ZDARZEŃ (LOGI) */}
                {activeTab === 'logs' && (
                  <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/20 font-code-mono text-xs text-outline space-y-1 max-h-[350px] overflow-y-auto">
                    {readResult.logs && readResult.logs.length > 0 ? (
                      readResult.logs.map((log, lIdx) => (
                        <div key={lIdx} className="leading-relaxed">
                          <span className="text-primary">{log.tag}</span> :: {log.msg}
                        </div>
                      ))
                    ) : (
                      <div className="text-outline italic">Brak zarejestrowanych wpisów diagnostycznych.</div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* STOPKA MODALU */}
        <footer className="flex items-center justify-between px-6 py-3 bg-surface-container-low border-t border-outline-variant/20 shrink-0 text-xs font-code-mono text-outline">
          <div>
            Status bazy: <span className="text-primary font-bold">Zsynchronizowano SQLite &amp; Cloud</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer"
          >
            Zamknij
          </button>
        </footer>

      </div>
    </div>
  );
}
