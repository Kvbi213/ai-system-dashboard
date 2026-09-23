import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Calendar as CalendarIcon, Trash2, Clock, ChevronLeft, ChevronRight, 
  AlertCircle, Plus, Tag, GraduationCap, BookOpen, UserX, Sparkles, 
  Filter, RefreshCw, Layers, CheckCircle2, Award, Info
} from 'lucide-react';
import { subscribeCollection, saveCloudDocument, deleteCloudDocument, isCloudEnvironment } from '../services/cloudSync.js';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { firestore } from '../firebaseClient.js';

// Wbudowane zdarzenia demonstracyjne terminarza szkolnego (Librus Synergia)
const STATIC_DEMO_SCHOOL_EVENTS = [
  {
    id: 9001,
    date: new Date().toISOString().split('T')[0],
    type: 'absence',
    category: 'Nieobecność nauczyciela',
    title: 'Nieobecność: Lorenz Krzysztof',
    teacher: 'Lorenz Krzysztof',
    time: '08:00 do 13:05',
    subject: 'Informatyka',
    description: 'Nieobecność nauczyciela w godz. 08:00 do 13:05 (zastępstwo lub okienko)'
  },
  {
    id: 9002,
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    type: 'kartkowka',
    category: 'Kartkówka',
    title: 'Kartkówka: Język angielski',
    teacher: 'Ziemba Joanna',
    time: 'Lekcja 2 (08:50)',
    subject: 'Język angielski',
    description: 'Słownictwo unit 4 (Phrasal verbs & Collocations)'
  },
  {
    id: 9003,
    date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    type: 'absence',
    category: 'Nieobecność nauczyciela',
    title: 'Nieobecność: Negowska Alicja',
    teacher: 'Negowska Alicja',
    time: '08:50 do 14:50',
    subject: null,
    description: 'Nieobecność nauczyciela: Negowska Alicja (08:50 do 14:50)'
  },
  {
    id: 9004,
    date: new Date(Date.now() + 345600000).toISOString().split('T')[0],
    type: 'sprawdzian',
    category: 'Sprawdzian',
    title: 'Sprawdzian: Matematyka',
    teacher: 'Wiśniewski Andrzej',
    time: 'Lekcja 4 (10:40)',
    subject: 'Matematyka',
    description: 'Rachunek prawdopodobieństwa, permutacje i kombinatoryka'
  },
  {
    id: 9005,
    date: new Date(Date.now() + 604800000).toISOString().split('T')[0],
    type: 'sprawdzian',
    category: 'Praca klasowa',
    title: 'Praca klasowa: Język polski',
    teacher: 'Kowalska Jadwiga',
    time: 'Lekcja 3 (09:45)',
    subject: 'Język polski',
    description: 'Dziady cz. III oraz Kordian — motyw prometeizmu i tyrteizmu'
  }
];

const CalendarPage = () => {
  // Tryb widoku kalendarza: 'all' (Wszystkie), 'personal' (Osobisty), 'school' (Szkolny)
  const [activeTab, setActiveTab] = useState('all');

  // Wydarzenia osobiste
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Wydarzenia szkolne z Librusa (terminarz, kartkówki, sprawdziany, nieobecności nauczycieli)
  const [schoolEvents, setSchoolEvents] = useState([]);
  const [schoolFilter, setSchoolFilter] = useState('all'); // 'all' | 'sprawdzian' | 'kartkowka' | 'absence'
  const [isRefreshingSchool, setIsRefreshingSchool] = useState(false);
  const [schoolLastSync, setSchoolLastSync] = useState(null);

  // Nawigacja siatki kalendarza
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Wybrany dzień
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Modale
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingEvent, setViewingEvent] = useState(null);
  const [viewingSchoolEvent, setViewingSchoolEvent] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    event_date: new Date().toISOString().split('T')[0],
    event_time: '12:00',
    priority: 'MEDIUM',
    category: 'Spotkanie',
    description: ''
  });

  const isCloudMode = typeof window !== 'undefined' && isCloudEnvironment();

  const getFallbackEvents = () => {
    const today = new Date().toISOString().split('T')[0];
    return [
      { id: '1', title: 'Start Systemu OmniDash', event_date: today, event_time: '09:00', priority: 'HIGH' }
    ];
  };

  // Helper do formatowania daty YYYY-MM-DD
  const formatDateString = (date) => {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  };

  // 1. Subskrypcja wydarzeń osobistych (Firestore + SQLite fallback)
  useEffect(() => {
    const unsubscribe = subscribeCollection('calendar', (cloudEvents) => {
      if (Array.isArray(cloudEvents)) {
        setEvents(cloudEvents);
        setIsLoading(false);
      }
    }, getFallbackEvents());

    if (!isCloudMode) {
      axios.get('/api/calendar')
        .then(res => {
          if (Array.isArray(res.data) && res.data.length > 0) {
            setEvents(res.data);
            res.data.forEach(e => saveCloudDocument('calendar', e.id, e));
          }
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }

    return () => unsubscribe();
  }, [isCloudMode]);

  // 2. Pobieranie terminarza szkolnego z Librusa (Firestore w chmurze lub Express lokalnie)
  const fetchSchoolCalendar = async () => {
    // A. W chmurze (Firebase Hosting) pobieramy wyłącznie z Firestore
    if (isCloudMode) {
      if (firestore) {
        try {
          const snap = await getDoc(doc(firestore, 'librus_cache', 'calendar'));
          if (snap.exists()) {
            const data = snap.data();
            if (data && Array.isArray(data.events)) {
              setSchoolEvents(data.events);
              setSchoolLastSync(data.lastSync || null);
              return;
            }
          }
        } catch (e) {
          console.debug('[Firestore] Błąd bezpośredniego odczytu terminarza Librus:', e);
        }
      }
      setSchoolEvents(STATIC_DEMO_SCHOOL_EVENTS);
      return;
    }

    // B. Środowisko lokalne (Express backend)
    try {
      const res = await axios.get('/api/librus/calendar', { timeout: 8000 });
      if (res.data?.events && Array.isArray(res.data.events)) {
        setSchoolEvents(res.data.events);
        setSchoolLastSync(res.data.lastSync || null);
      } else {
        setSchoolEvents(STATIC_DEMO_SCHOOL_EVENTS);
      }
    } catch {
      setSchoolEvents(STATIC_DEMO_SCHOOL_EVENTS);
    }
  };

  useEffect(() => {
    fetchSchoolCalendar();

    // Subskrypcja czasu rzeczywistego dla terminarza szkolnego w Firestore
    if (firestore) {
      try {
        const unsub = onSnapshot(doc(firestore, 'librus_cache', 'calendar'), (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (data && Array.isArray(data.events)) {
              setSchoolEvents(data.events);
              setSchoolLastSync(data.lastSync || null);
            }
          }
        }, () => {});
        return () => unsub();
      } catch {}
    }
  }, []);

  // Wymuszenie synchronizacji terminarza szkolnego
  const handleRefreshSchoolCalendar = async () => {
    setIsRefreshingSchool(true);
    if (isCloudMode) {
      if (firestore) {
        try {
          const snap = await getDoc(doc(firestore, 'librus_cache', 'calendar'));
          if (snap.exists() && snap.data()?.events) {
            setSchoolEvents(snap.data().events);
            setSchoolLastSync(snap.data().lastSync || null);
          }
        } catch {}
      }
      setIsRefreshingSchool(false);
      return;
    }

    try {
      const res = await axios.post('/api/librus/calendar/refresh', {}, { timeout: 20000 });
      if (res.data?.success && res.data?.data?.events) {
        setSchoolEvents(res.data.data.events);
        setSchoolLastSync(res.data.data.lastSync || null);
      }
    } catch {
      await fetchSchoolCalendar();
    } finally {
      setIsRefreshingSchool(false);
    }
  };

  // Usuwanie wydarzenia osobistego
  const deleteEvent = async (id) => {
    setEvents(prev => (Array.isArray(prev) ? prev : []).filter(e => e.id !== id));
    await deleteCloudDocument('calendar', id);
    if (!isCloudMode) {
      try {
        await axios.delete(`/api/calendar/${id}`);
      } catch (err) {
        console.warn('Błąd usuwania wydarzenia:', err.message);
      }
    }
  };

  // Dodawanie wydarzenia osobistego
  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const newId = 'cal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    const newEvent = {
      id: newId,
      title: formData.title.trim(),
      event_date: formData.event_date || formatDateString(selectedDate),
      event_time: formData.event_time || '12:00',
      priority: formData.priority || 'MEDIUM',
      category: formData.category || 'Spotkanie',
      description: formData.description || '',
      created_at: new Date().toISOString()
    };

    setEvents(prev => [newEvent, ...(Array.isArray(prev) ? prev : [])]);
    setShowAddModal(false);
    setFormData({
      title: '',
      event_date: formatDateString(selectedDate),
      event_time: '12:00',
      priority: 'MEDIUM',
      category: 'Spotkanie',
      description: ''
    });

    await saveCloudDocument('calendar', newId, newEvent);
    if (!isCloudMode) {
      try {
        await axios.post('/api/calendar', newEvent);
      } catch {}
    }
  };

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; 

  const monthNames = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];
  const dayNames = ["Pon", "Wto", "Śro", "Czw", "Pią", "Sob", "Nie"];

  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const jumpToDate = (dateString) => {
    const targetDate = new Date(dateString);
    setCurrentDate(new Date(targetDate.getFullYear(), targetDate.getMonth(), 1));
    setSelectedDate(targetDate);
  };

  const safeEvents = Array.isArray(events) ? events : [];
  const safeSchoolEvents = Array.isArray(schoolEvents) ? schoolEvents : [];

  // Filtrowanie wydarzeń szkolnych wg kategorii
  const filteredSchoolEvents = useMemo(() => {
    if (schoolFilter === 'all') return safeSchoolEvents;
    return safeSchoolEvents.filter(e => e.type === schoolFilter);
  }, [safeSchoolEvents, schoolFilter]);

  // Statystyki szkolne (KPI)
  const schoolStats = useMemo(() => {
    const exams = safeSchoolEvents.filter(e => e.type === 'sprawdzian').length;
    const quizzes = safeSchoolEvents.filter(e => e.type === 'kartkowka').length;
    const absences = safeSchoolEvents.filter(e => e.type === 'absence').length;
    
    const todayStr = formatDateString(new Date());
    const upcoming = safeSchoolEvents
      .filter(e => e.date >= todayStr)
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    const nextEvent = upcoming.length > 0 ? upcoming[0] : null;

    return { exams, quizzes, absences, total: safeSchoolEvents.length, nextEvent };
  }, [safeSchoolEvents]);

  // Generowanie komórek siatki kalendarza
  const gridCells = [];
  for (let i = 0; i < startDay; i++) {
    gridCells.push(<div key={`empty-${i}`} className="p-2 border border-transparent"></div>);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const iterDate = new Date(currentYear, currentMonth, i);
    const dateString = formatDateString(iterDate);

    // Wydarzenia osobiste w tym dniu
    const dayPersonalEvents = activeTab !== 'school' 
      ? safeEvents.filter(e => e.event_date === dateString) 
      : [];

    // Wydarzenia szkolne w tym dniu
    const daySchool = activeTab !== 'personal' 
      ? filteredSchoolEvents.filter(e => e.date === dateString) 
      : [];

    const hasPersonal = dayPersonalEvents.length > 0;
    const hasSchool = daySchool.length > 0;
    const hasAny = hasPersonal || hasSchool;
    
    const isSelected = formatDateString(selectedDate) === dateString;
    const isToday = formatDateString(new Date()) === dateString;

    gridCells.push(
      <button 
        key={`day-${i}`}
        onClick={() => setSelectedDate(iterDate)}
        className={`relative min-h-[48px] sm:min-h-[58px] md:min-h-[66px] p-1 sm:p-1.5 flex flex-col items-start justify-start border transition-all duration-200 active:scale-95 text-left
          ${isSelected 
            ? 'border-accentPrimary bg-accentPrimary/10 shadow-[inset_0_0_12px_rgba(var(--color-accent-primary),0.25)]' 
            : 'border-border/50 glass-panel hover:bg-surface'
          }
        `}
      >
        <span className={`text-xs sm:text-sm font-mono font-bold ${isToday ? 'text-accentPrimary' : 'text-textPrimary'}`}>
          {i}
        </span>
        
        {/* Punkty statusowe w prawym górnym rogu */}
        {hasAny && (
          <div className="absolute top-1 sm:top-1.5 right-1 sm:right-1.5 flex gap-1 flex-wrap justify-end max-w-[40px]">
            {dayPersonalEvents.map((_, idx) => (
              <div 
                key={`p-${idx}`} 
                className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-accentPrimary shadow-[0_0_5px_rgba(var(--color-accent-primary),0.8)]"
                title="Wydarzenie osobiste"
              />
            ))}
            {daySchool.map((se, sIdx) => {
              let dotColor = 'bg-cyan-400';
              if (se.type === 'sprawdzian') dotColor = 'bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.8)]';
              else if (se.type === 'kartkowka') dotColor = 'bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.8)]';
              else if (se.type === 'absence') dotColor = 'bg-purple-400 shadow-[0_0_5px_rgba(168,85,247,0.8)]';
              else if (se.type === 'wywiadowka') dotColor = 'bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)]';

              return (
                <div 
                  key={`s-${sIdx}`} 
                  className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${dotColor}`}
                  title={`${se.category}: ${se.title}`}
                />
              );
            })}
          </div>
        )}

        {/* Etykiety podglądu zdarzeń wewnątrz komórki (Desktop) */}
        <div className="hidden sm:flex mt-1 w-full flex-col gap-0.5 overflow-hidden">
          {/* Szkolne */}
          {daySchool.slice(0, 2).map((se) => {
            let badgeStyle = 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30';
            if (se.type === 'sprawdzian') badgeStyle = 'text-rose-300 bg-rose-500/15 border-rose-500/30 font-bold';
            else if (se.type === 'kartkowka') badgeStyle = 'text-amber-300 bg-amber-500/15 border-amber-500/30';
            else if (se.type === 'absence') badgeStyle = 'text-purple-300 bg-purple-500/15 border-purple-500/30';

            return (
              <div 
                key={`se-${se.id}`} 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedDate(iterDate);
                  setViewingSchoolEvent(se);
                }}
                className={`text-[9px] font-mono tracking-wider truncate px-1 py-0.2 rounded border cursor-pointer transition-colors ${badgeStyle}`}
                title={se.title}
              >
                {se.type === 'absence' ? `Nieob: ${se.teacher}` : (se.subject ? `${se.subject} (${se.type})` : se.title)}
              </div>
            );
          })}

          {/* Osobiste */}
          {dayPersonalEvents.slice(0, 1).map((ev) => (
            <div 
              key={ev.id} 
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDate(iterDate);
                setViewingEvent(ev);
              }}
              className="text-[9px] uppercase font-mono tracking-wider truncate text-accentPrimary/90 bg-accentPrimary/10 hover:bg-accentPrimary/25 px-1 py-0.2 rounded cursor-pointer transition-colors"
              title="Kliknij, aby wyświetlić szczegóły"
            >
              {ev.title}
            </div>
          ))}
          
          {(dayPersonalEvents.length + daySchool.length) > 2 && (
            <div className="text-[9px] text-textMuted font-mono">
              +{(dayPersonalEvents.length + daySchool.length) - 2} więcej
            </div>
          )}
        </div>
      </button>
    );
  }

  // Wydarzenia w wybranym dniu
  const selectedDateString = formatDateString(selectedDate);
  const selectedDayPersonalEvents = activeTab !== 'school'
    ? safeEvents.filter(e => e.event_date === selectedDateString)
    : [];
  const selectedDaySchoolEvents = activeTab !== 'personal'
    ? filteredSchoolEvents.filter(e => e.date === selectedDateString)
    : [];

  // Nadchodzące wydarzenia (Agenda)
  const todayString = formatDateString(new Date());
  const upcomingPersonal = safeEvents
    .filter(e => e.event_date >= todayString)
    .sort((a, b) => new Date(a.event_date) - new Date(b.event_date));

  const upcomingSchool = safeSchoolEvents
    .filter(e => e.date >= todayString)
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  return (
    <div className="w-full h-full flex flex-col gap-4 sm:gap-6 relative z-10 animate-soft-enter overflow-y-auto custom-scrollbar pb-24 md:pb-8">
      
      {/* GŁÓWNY NAGŁÓWEK KALENDARZA */}
      <header className="glass-panel p-4 sm:p-5 rounded-xl border border-border flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 rounded-xl bg-accentPrimary/10 border border-accentPrimary/30 flex items-center justify-center flex-shrink-0 text-accentPrimary shadow-[0_0_15px_rgba(var(--color-accent-primary),0.2)]">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <nav aria-label="breadcrumb" className="flex items-center space-x-2 text-sm text-textMuted mb-0.5">
              <span className="flex items-center text-base sm:text-lg font-medium text-textMuted/70">OmniDash</span>
              <span className="shrink-0 text-base sm:text-lg font-medium text-textMuted/70">/</span>
              <span className="flex items-center text-base sm:text-lg font-medium text-textPrimary">Kalendarz & Terminarz</span>
            </nav>
            <p className="font-sans text-xs text-textMuted">
              Zarządzanie czasem, harmonogramem i zintegrowanym terminarzem szkolnym Librus Synergia
            </p>
          </div>
        </div>

        {/* PRZEŁĄCZNIK TRYBÓW (ZAKŁADEK) + PRZYCISK DODAWANIA */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-between lg:justify-end">
          
          {/* SEGMENTED TAB SWITCHER */}
          <div className="flex items-center p-1 rounded-xl bg-surface border border-border text-xs font-mono">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'all' 
                  ? 'bg-accentPrimary text-black font-bold shadow-sm' 
                  : 'text-textMuted hover:text-textPrimary'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Wszystkie</span>
            </button>

            <button
              onClick={() => setActiveTab('personal')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'personal' 
                  ? 'bg-accentPrimary text-black font-bold shadow-sm' 
                  : 'text-textMuted hover:text-textPrimary'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Osobisty</span>
            </button>

            <button
              onClick={() => setActiveTab('school')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'school' 
                  ? 'bg-accentPrimary text-black font-bold shadow-sm' 
                  : 'text-textMuted hover:text-textPrimary'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Szkolny (Librus)</span>
              {schoolStats.total > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'school' ? 'bg-black text-white' : 'bg-accentPrimary/20 text-accentPrimary'
                }`}>
                  {schoolStats.total}
                </span>
              )}
            </button>
          </div>

          {/* AKCJE DODATKOWE */}
          <div className="flex items-center gap-2">
            {(activeTab === 'school' || activeTab === 'all') && (
              <button
                onClick={handleRefreshSchoolCalendar}
                disabled={isRefreshingSchool}
                className="p-2 sm:px-3 sm:py-2 rounded-lg bg-surface hover:bg-surfaceHover border border-border text-textPrimary text-xs font-mono flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                title="Odśwież terminarz z Librus Synergia"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-accentPrimary ${isRefreshingSchool ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Librus Sync</span>
              </button>
            )}

            <button 
              onClick={() => {
                setFormData(prev => ({ ...prev, event_date: formatDateString(selectedDate) }));
                setShowAddModal(true);
              }}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-accentPrimary/20 hover:bg-accentPrimary/30 text-accentPrimary rounded-lg transition-all border border-accentPrimary/40 shadow-[0_0_15px_rgba(var(--color-accent-primary),0.15)] font-mono text-xs sm:text-sm font-semibold shrink-0"
            >
              <Plus className="w-4 h-4" /> 
              <span>Dodaj osobiste</span>
            </button>
          </div>
        </div>
      </header>

      {/* KARTY METRYK TERMINARZA SZKOLNEGO (Gdy aktywny tryb szkolny lub wszystkie) */}
      {(activeTab === 'school' || activeTab === 'all') && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-shrink-0 animate-soft-enter">
          
          {/* KPI 1: SPRAWDZIANY */}
          <div className="glass-panel p-3.5 rounded-xl border border-border flex items-center justify-between relative overflow-hidden group">
            <div className="absolute -right-3 -bottom-3 w-14 h-14 bg-rose-500/10 rounded-full blur-xl group-hover:bg-rose-500/20 transition-all" />
            <div>
              <span className="text-[11px] font-mono text-textMuted uppercase tracking-wider block">
                Sprawdziany
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-bold font-mono text-rose-400">
                  {schoolStats.exams}
                </span>
                <span className="text-[10px] text-textMuted font-mono">zaplanowanych</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Award className="w-4 h-4" />
            </div>
          </div>

          {/* KPI 2: KARTKÓWKI */}
          <div className="glass-panel p-3.5 rounded-xl border border-border flex items-center justify-between relative overflow-hidden group">
            <div className="absolute -right-3 -bottom-3 w-14 h-14 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-all" />
            <div>
              <span className="text-[11px] font-mono text-textMuted uppercase tracking-wider block">
                Kartkówki
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-bold font-mono text-amber-400">
                  {schoolStats.quizzes}
                </span>
                <span className="text-[10px] text-textMuted font-mono">w terminarzu</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          {/* KPI 3: NIEOBECNOŚCI NAUCZYCIELI */}
          <div className="glass-panel p-3.5 rounded-xl border border-border flex items-center justify-between relative overflow-hidden group">
            <div className="absolute -right-3 -bottom-3 w-14 h-14 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition-all" />
            <div>
              <span className="text-[11px] font-mono text-textMuted uppercase tracking-wider block">
                Absencje Kadry
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-bold font-mono text-purple-400">
                  {schoolStats.absences}
                </span>
                <span className="text-[10px] text-textMuted font-mono">nauczycieli</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <UserX className="w-4 h-4" />
            </div>
          </div>

          {/* KPI 4: NAJBLIŻSZY TERMIN SZKOLNY */}
          <div className="glass-panel p-3.5 rounded-xl border border-border flex items-center justify-between relative overflow-hidden group">
            <div className="absolute -right-3 -bottom-3 w-14 h-14 bg-accentPrimary/10 rounded-full blur-xl group-hover:bg-accentPrimary/20 transition-all" />
            <div className="min-w-0 pr-2">
              <span className="text-[11px] font-mono text-textMuted uppercase tracking-wider block truncate">
                Najbliższy Termin
              </span>
              <div className="mt-1 truncate">
                <span className="text-xs sm:text-sm font-bold font-sans text-accentPrimary block truncate">
                  {schoolStats.nextEvent ? schoolStats.nextEvent.title : 'Brak w najbliższych dniach'}
                </span>
                <span className="text-[10px] text-textMuted font-mono block">
                  {schoolStats.nextEvent?.date || 'Spokojny tydzień'}
                </span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-accentPrimary/15 border border-accentPrimary/30 flex items-center justify-center text-accentPrimary flex-shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>

        </div>
      )}

      {/* FILTRY KATEGORII W WIDOKU SZKOLNYM */}
      {activeTab === 'school' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-shrink-0">
          <span className="text-xs font-mono text-textMuted flex items-center gap-1.5 mr-1">
            <Filter className="w-3.5 h-3.5" /> Filtr:
          </span>
          <button
            onClick={() => setSchoolFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono border transition-all ${
              schoolFilter === 'all'
                ? 'bg-accentPrimary/20 text-accentPrimary border-accentPrimary/40 font-bold'
                : 'bg-surface text-textMuted border-border hover:bg-surfaceHover'
            }`}
          >
            Wszystkie ({safeSchoolEvents.length})
          </button>
          <button
            onClick={() => setSchoolFilter('sprawdzian')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono border transition-all ${
              schoolFilter === 'sprawdzian'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold'
                : 'bg-surface text-textMuted border-border hover:bg-surfaceHover'
            }`}
          >
            Sprawdziany ({safeSchoolEvents.filter(e => e.type === 'sprawdzian').length})
          </button>
          <button
            onClick={() => setSchoolFilter('kartkowka')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono border transition-all ${
              schoolFilter === 'kartkowka'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                : 'bg-surface text-textMuted border-border hover:bg-surfaceHover'
            }`}
          >
            Kartkówki ({safeSchoolEvents.filter(e => e.type === 'kartkowka').length})
          </button>
          <button
            onClick={() => setSchoolFilter('absence')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono border transition-all ${
              schoolFilter === 'absence'
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-bold'
                : 'bg-surface text-textMuted border-border hover:bg-surfaceHover'
            }`}
          >
            Nieobecności nauczycieli ({safeSchoolEvents.filter(e => e.type === 'absence').length})
          </button>
        </div>
      )}

      {/* GŁÓWNA STRUKTURA: SIATKA KALENDARZA + PRAWY PANEL WYBRANEGO DNIA */}
      <div className="flex-1 flex flex-col xl:flex-row gap-4 sm:gap-6 min-h-0">
        
        {/* LEWA STRONA: SIATKA MIESIĘCZNA KALENDARZA */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar pr-0 sm:pr-2">
          
          {/* Header Kalendarza (Nawigacja Miesięcy) */}
          <div className="glass-panel p-3 sm:p-4 rounded-t-xl sm:rounded-t-2xl border border-border border-b-0 flex items-center justify-between shrink-0">
            <h2 className="text-lg sm:text-2xl font-bold font-mono text-accentPrimary tracking-tight">
              {monthNames[currentMonth]} <span className="text-textPrimary">{currentYear}</span>
            </h2>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button 
                onClick={prevMonth} 
                className="p-1.5 sm:p-2 glass-panel border border-border hover:border-accentPrimary hover:text-accentPrimary rounded-lg transition-colors active:scale-95"
                title="Poprzedni miesiąc"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button 
                onClick={() => setCurrentDate(new Date())} 
                className="px-2.5 sm:px-4 py-1.5 sm:py-2 font-mono text-xs sm:text-sm uppercase glass-panel border border-border hover:border-accentPrimary hover:text-accentPrimary rounded-lg transition-colors active:scale-95"
              >
                Dziś
              </button>
              <button 
                onClick={nextMonth} 
                className="p-1.5 sm:p-2 glass-panel border border-border hover:border-accentPrimary hover:text-accentPrimary rounded-lg transition-colors active:scale-95"
                title="Następny miesiąc"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Dni tygodnia */}
          <div className="grid grid-cols-7 glass-panel border-x border-t border-border/50 shrink-0">
            {dayNames.map(day => (
              <div key={day} className="py-1.5 sm:py-2 text-center text-[10px] sm:text-xs font-mono font-bold tracking-wider text-textMuted uppercase border-b border-border/50">
                {day}
              </div>
            ))}
          </div>

          {/* Siatka Dni */}
          <div className="grid grid-cols-7 glass-panel border border-border/50 rounded-b-xl sm:rounded-b-2xl overflow-hidden shrink-0">
            {gridCells}
          </div>

          {/* AGENDA NAJBLIŻSZYCH TERMINÓW (POD SIATKĄ) */}
          <div className="mt-6 flex flex-col shrink-0 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm sm:text-base font-mono font-bold tracking-wider uppercase text-textMuted flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-accentPrimary" />
                <span>Nadchodzące Terminy & Agenda</span>
              </h3>
              <span className="text-xs text-textMuted font-mono">
                {activeTab === 'school' ? 'Tylko szkolne' : activeTab === 'personal' ? 'Tylko osobiste' : 'Wszystkie'}
              </span>
            </div>

            {/* Lista horyzontalna nadchodzących zdarzeń */}
            <div className="flex gap-3 overflow-x-auto pb-3 custom-scrollbar">
              {/* Szkolne nadchodzące */}
              {activeTab !== 'personal' && upcomingSchool.slice(0, 4).map((se) => (
                <div 
                  key={`upc-s-${se.id}`}
                  onClick={() => {
                    jumpToDate(se.date);
                    setViewingSchoolEvent(se);
                  }}
                  className={`min-w-[240px] max-w-[280px] p-3 rounded-xl border glass-panel hover:scale-[1.02] cursor-pointer transition-all flex flex-col justify-between ${
                    se.type === 'sprawdzian' ? 'border-rose-500/40 bg-rose-500/5' :
                    se.type === 'kartkowka' ? 'border-amber-500/40 bg-amber-500/5' :
                    se.type === 'absence' ? 'border-purple-500/40 bg-purple-500/5' :
                    'border-cyan-500/40 bg-cyan-500/5'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        se.type === 'sprawdzian' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30 font-bold' :
                        se.type === 'kartkowka' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                        se.type === 'absence' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                        'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                      }`}>
                        {se.category}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-textPrimary">
                        {se.date}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-textPrimary truncate">{se.title}</h4>
                    {se.teacher && (
                      <p className="text-[11px] text-textMuted font-mono mt-1 truncate">
                         {se.teacher}
                      </p>
                    )}
                  </div>
                  {se.time && (
                    <div className="text-[10px] font-mono text-accentPrimary mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {se.time}
                    </div>
                  )}
                </div>
              ))}

              {/* Osobiste nadchodzące */}
              {activeTab !== 'school' && upcomingPersonal.slice(0, 3).map((pe) => (
                <div 
                  key={`upc-p-${pe.id}`}
                  onClick={() => {
                    jumpToDate(pe.event_date);
                    setViewingEvent(pe);
                  }}
                  className="min-w-[220px] max-w-[260px] p-3 rounded-xl border border-accentPrimary/30 bg-surface/50 glass-panel hover:scale-[1.02] cursor-pointer transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accentPrimary/15 text-accentPrimary border border-accentPrimary/30">
                        {pe.category || 'Osobiste'}
                      </span>
                      <span className="text-[11px] font-mono text-textMuted">
                        {pe.event_date}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-textPrimary truncate">{pe.title}</h4>
                  </div>
                  {pe.event_time && (
                    <div className="text-[10px] font-mono text-accentPrimary mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {pe.event_time}
                    </div>
                  )}
                </div>
              ))}

              {upcomingSchool.length === 0 && upcomingPersonal.length === 0 && (
                <div className="p-4 text-xs font-mono text-textMuted glass-panel rounded-xl border border-border w-full text-center">
                  Brak zaplanowanych wydarzeń w najbliższym horyzoncie czasowym.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* PRAWA STRONA: SZCZEGÓŁY WYBRANEGO DNIA */}
        <div className="w-full xl:w-96 glass-panel rounded-2xl border border-border flex flex-col shrink-0 min-h-[300px] xl:h-auto overflow-hidden">
          
          {/* Header Prawego Panelu */}
          <div className="p-4 sm:p-5 border-b border-border bg-surface/40 flex items-center justify-between">
            <div>
              <h3 className="font-mono text-xs tracking-widest text-textMuted uppercase mb-0.5">
                Wybrany Dzień
              </h3>
              <div className="text-lg sm:text-xl font-bold text-accentPrimary font-mono">
                {selectedDate.getDate()} {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </div>
              {formatDateString(selectedDate) === formatDateString(new Date()) && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-accentPrimary/20 text-accentPrimary text-[10px] font-mono rounded uppercase tracking-wider border border-accentPrimary/30">
                  Dzisiaj
                </span>
              )}
            </div>

            {activeTab !== 'school' && (
              <button
                onClick={() => {
                  setFormData(prev => ({ ...prev, event_date: formatDateString(selectedDate) }));
                  setShowAddModal(true);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-accentPrimary/15 hover:bg-accentPrimary/25 text-accentPrimary border border-accentPrimary/30 font-mono text-xs flex items-center gap-1 transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" /> <span>Dodaj</span>
              </button>
            )}
          </div>
          
          {/* Lista wydarzeń w wybranym dniu */}
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto custom-scrollbar space-y-4">
            
            {/* 1. SZKOLNE WYDARZENIA W DANYM DNIU */}
            {selectedDaySchoolEvents.length > 0 && (
              <div>
                <span className="text-[10px] font-mono uppercase text-accentPrimary tracking-wider font-bold block mb-2 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5" /> Terminarz Librus ({selectedDaySchoolEvents.length})
                </span>
                <div className="space-y-2.5">
                  {selectedDaySchoolEvents.map((se) => (
                    <div 
                      key={`s-det-${se.id}`}
                      onClick={() => setViewingSchoolEvent(se)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer hover:scale-[1.01] ${
                        se.type === 'sprawdzian' ? 'bg-rose-500/10 border-rose-500/30' :
                        se.type === 'kartkowka' ? 'bg-amber-500/10 border-amber-500/30' :
                        se.type === 'absence' ? 'bg-purple-500/10 border-purple-500/30' :
                        'bg-surface border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                          se.type === 'sprawdzian' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold' :
                          se.type === 'kartkowka' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                          se.type === 'absence' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' :
                          'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        }`}>
                          {se.category}
                        </span>
                        {se.time && (
                          <span className="text-[11px] font-mono text-textMuted flex items-center gap-1">
                            <Clock className="w-3 h-3 text-accentPrimary" /> {se.time}
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-textPrimary text-xs sm:text-sm mt-1">{se.title}</h4>
                      
                      {se.teacher && (
                        <p className="text-[11px] text-textMuted font-mono mt-1">
                          Nauczyciel: <span className="text-textSecondary">{se.teacher}</span>
                        </p>
                      )}

                      {se.description && (
                        <p className="text-[11px] text-textMuted mt-1 line-clamp-2 italic">
                          "{se.description}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. OSOBISTE WYDARZENIA W DANYM DNIU */}
            {selectedDayPersonalEvents.length > 0 && (
              <div>
                <span className="text-[10px] font-mono uppercase text-textMuted tracking-wider font-bold block mb-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> Wydarzenia Osobiste ({selectedDayPersonalEvents.length})
                </span>
                <div className="space-y-2.5">
                  {selectedDayPersonalEvents.map((ev) => (
                    <div 
                      key={`p-det-${ev.id}`} 
                      onClick={() => setViewingEvent(ev)}
                      className="p-3 rounded-xl bg-surface/50 border border-border hover:border-accentPrimary/40 transition-all cursor-pointer group flex flex-col gap-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                            ev.priority === 'HIGH' ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' :
                            ev.priority === 'LOW' ? 'bg-slate-500/15 text-slate-400 border-slate-500/30' :
                            'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                          }`}>
                            {ev.priority || 'MED'}
                          </span>
                          {ev.category && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-textMuted border border-white/10">
                              {ev.category}
                            </span>
                          )}
                          {ev.event_time && (
                            <span className="text-xs font-mono text-accentPrimary flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {ev.event_time}
                            </span>
                          )}
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteEvent(ev.id);
                          }} 
                          className="p-1 rounded text-textMuted hover:text-rose-400 hover:bg-rose-500/15 transition-all shrink-0"
                          title="Usuń wydarzenie"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <h4 className="font-bold text-textPrimary text-xs sm:text-sm group-hover:text-accentPrimary transition-colors">{ev.title}</h4>
                      {ev.description && (
                        <p className="text-xs text-textMuted line-clamp-2">
                          {ev.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PUSTY STAN JEŚLI BRAK WYDARZEŃ */}
            {selectedDaySchoolEvents.length === 0 && selectedDayPersonalEvents.length === 0 && (
              <div className="h-48 flex flex-col items-center justify-center text-textMuted font-mono space-y-2 py-6 opacity-60 text-center">
                <CalendarIcon className="w-10 h-10 opacity-50" />
                <p className="text-xs">Brak zaplanowanych aktywności i sprawdzianów w tym dniu.</p>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* MODAL SZCZEGÓŁÓW WYDARZENIA SZKOLNEGO */}
      {viewingSchoolEvent && (
        <div 
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setViewingSchoolEvent(null)}
        >
          <div 
            className="bg-background border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border flex justify-between items-center bg-surface/50">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-accentPrimary" />
                <h2 className="font-mono text-textPrimary font-bold text-sm">
                  Szczegóły Terminarza Librus
                </h2>
              </div>
              <button 
                onClick={() => setViewingSchoolEvent(null)} 
                className="text-textMuted hover:text-white p-1"
              >
                x
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <span className={`inline-block text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border mb-2 ${
                  viewingSchoolEvent.type === 'sprawdzian' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold' :
                  viewingSchoolEvent.type === 'kartkowka' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                  viewingSchoolEvent.type === 'absence' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' :
                  'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                }`}>
                  {viewingSchoolEvent.category}
                </span>
                <h3 className="text-base font-bold text-textPrimary font-sans">
                  {viewingSchoolEvent.title}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-surface/60 border border-border text-xs font-mono">
                <div>
                  <span className="text-textMuted text-[10px] block">Data:</span>
                  <span className="text-accentPrimary font-bold">{viewingSchoolEvent.date}</span>
                </div>
                <div>
                  <span className="text-textMuted text-[10px] block">Godziny / Lekcja:</span>
                  <span className="text-textPrimary">{viewingSchoolEvent.time || 'Cały dzień'}</span>
                </div>
                {viewingSchoolEvent.teacher && (
                  <div className="col-span-2 pt-2 border-t border-border/50">
                    <span className="text-textMuted text-[10px] block">Nauczyciel:</span>
                    <span className="text-textSecondary">{viewingSchoolEvent.teacher}</span>
                  </div>
                )}
                {viewingSchoolEvent.room && (
                  <div className="col-span-2 pt-1">
                    <span className="text-textMuted text-[10px] block">Sala:</span>
                    <span className="text-textSecondary">{viewingSchoolEvent.room}</span>
                  </div>
                )}
              </div>

              {viewingSchoolEvent.description && (
                <div>
                  <span className="text-[10px] font-mono uppercase text-textMuted block mb-1">
                    Opis / Zakres materiału:
                  </span>
                  <p className="text-xs text-textSecondary bg-surface/40 p-3 rounded-xl border border-border leading-relaxed whitespace-pre-wrap">
                    {viewingSchoolEvent.description}
                  </p>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setViewingSchoolEvent(null)}
                  className="px-4 py-2 font-mono text-xs bg-surface hover:bg-surfaceHover border border-border text-textPrimary rounded-lg transition-all"
                >
                  Zamknij
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DODAWANIA WYDARZENIA OSOBISTEGO */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-background border border-border rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-4 border-b border-border flex justify-between items-center bg-black/20">
              <h2 className="font-mono text-accentPrimary font-bold text-base flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" /> Nowe Wydarzenie Osobiste
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-textMuted hover:text-white transition-colors">x</button>
            </div>
            <form onSubmit={handleAddEvent} className="p-5 flex flex-col gap-4">
              <div>
                <label className="text-xs font-mono text-textMuted mb-1 block">Tytuł wydarzenia *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-black/30 border border-border rounded-lg p-2.5 text-textPrimary font-mono text-xs focus:border-accentPrimary outline-none transition-colors"
                  placeholder="np. Przygotowanie do egzaminu, Trening, Wizyta..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-textMuted mb-1 block">Data</label>
                  <input
                    type="date"
                    value={formData.event_date}
                    onChange={e => setFormData({ ...formData, event_date: e.target.value })}
                    className="w-full bg-black/30 border border-border rounded-lg p-2.5 text-textPrimary font-mono text-xs focus:border-accentPrimary outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-textMuted mb-1 block">Godzina</label>
                  <input
                    type="time"
                    value={formData.event_time}
                    onChange={e => setFormData({ ...formData, event_time: e.target.value })}
                    className="w-full bg-black/30 border border-border rounded-lg p-2.5 text-textPrimary font-mono text-xs focus:border-accentPrimary outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-textMuted mb-1 block">Priorytet</label>
                  <select
                    value={formData.priority}
                    onChange={e => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full bg-black/30 border border-border rounded-lg p-2.5 text-textPrimary font-mono text-xs focus:border-accentPrimary outline-none transition-colors"
                  >
                    <option value="LOW">Niski (LOW)</option>
                    <option value="MEDIUM">Średni (MED)</option>
                    <option value="HIGH">Wysoki (HIGH)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-mono text-textMuted mb-1 block">Kategoria</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-black/30 border border-border rounded-lg p-2.5 text-textPrimary font-mono text-xs focus:border-accentPrimary outline-none transition-colors"
                  >
                    <option value="Spotkanie">Spotkanie</option>
                    <option value="Egzamin">Egzamin / Szkoła</option>
                    <option value="Praca">Praca / Projekt</option>
                    <option value="Trening">Trening</option>
                    <option value="Osobiste">Osobiste</option>
                    <option value="Ważne">Ważne</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-textMuted mb-1 block">Opis / Notatka (opcjonalnie)</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-black/30 border border-border rounded-lg p-2.5 text-textPrimary font-mono text-xs focus:border-accentPrimary outline-none transition-colors resize-none"
                  placeholder="Dodatkowe szczegóły, miejsce, link lub założenia..."
                />
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 font-mono text-xs text-textMuted hover:text-textPrimary transition-colors"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-mono text-xs bg-accentPrimary text-black font-bold rounded-lg shadow-[0_0_15px_rgba(var(--color-accent-primary),0.3)] hover:scale-105 transition-all"
                >
                  Zapisz wydarzenie
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SZCZEGÓŁÓW WYDARZENIA OSOBISTEGO */}
      {viewingEvent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-background border border-border rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-4 border-b border-border flex justify-between items-center bg-black/20">
              <h2 className="font-mono text-accentPrimary font-bold text-base flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" /> Szczegóły Wydarzenia Osobistego
              </h2>
              <button onClick={() => setViewingEvent(null)} className="text-textMuted hover:text-white transition-colors">x</button>
            </div>
            
            <div className="p-5 flex flex-col gap-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-textMuted block mb-1">Tytuł</span>
                <h3 className="text-lg font-bold text-textPrimary">{viewingEvent.title}</h3>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-black/20 border border-border/50 font-mono text-xs">
                <div>
                  <span className="text-textMuted block text-[10px] mb-0.5">Termin:</span>
                  <span className="text-accentPrimary font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {viewingEvent.event_date} {viewingEvent.event_time ? `• ${viewingEvent.event_time}` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-textMuted block text-[10px] mb-0.5">Priorytet:</span>
                  <span className={`inline-block text-[10px] px-2 py-0.5 rounded border ${
                    viewingEvent.priority === 'HIGH' ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' :
                    viewingEvent.priority === 'LOW' ? 'bg-slate-500/15 text-slate-400 border-slate-500/30' :
                    'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                  }`}>
                    {viewingEvent.priority || 'MEDIUM'}
                  </span>
                </div>
                {viewingEvent.category && (
                  <div className="col-span-2 pt-1 border-t border-border/30">
                    <span className="text-textMuted block text-[10px] mb-0.5">Kategoria:</span>
                    <span className="text-textPrimary">{viewingEvent.category}</span>
                  </div>
                )}
              </div>

              {viewingEvent.description && (
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-textMuted block mb-1">Opis / Notatka</span>
                  <p className="text-xs sm:text-sm text-textMuted bg-black/20 p-3 rounded-lg border border-border/40 whitespace-pre-wrap leading-relaxed">
                    {viewingEvent.description}
                  </p>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 mt-2 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => {
                    deleteEvent(viewingEvent.id);
                    setViewingEvent(null);
                  }}
                  className="px-4 py-2 font-mono text-xs bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 font-bold rounded-lg border border-rose-500/30 transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Usuń wydarzenie
                </button>
                <button
                  type="button"
                  onClick={() => setViewingEvent(null)}
                  className="px-4 py-2 font-mono text-xs bg-white/10 hover:bg-white/15 text-textPrimary rounded-lg transition-colors"
                >
                  Zamknij
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
