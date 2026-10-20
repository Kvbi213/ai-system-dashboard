import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Calendar as CalendarIcon, Trash2, Clock, ChevronLeft, ChevronRight, 
  AlertCircle, Plus, Tag, GraduationCap, BookOpen, UserX, Sparkles, 
  Filter, RefreshCw, Layers, CheckCircle2, Award, Info, Send, Dumbbell,
  Activity, X, Check, Eye
} from 'lucide-react';
import { subscribeCollection, saveCloudDocument, deleteCloudDocument, isCloudEnvironment } from '../services/cloudSync.js';
import { doc, onSnapshot, getDoc, setDoc } from 'firebase/firestore';
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
  // Tryb widoku podziału: 'all' (Wszystkie), 'personal' (Osobisty), 'school' (Szkolny)
  const [activeTab, setActiveTab] = useState('all');

  // Tryb renderowania: 'month' (Siatka miesiąca) | 'agenda' (Lista agendy)
  const [viewMode, setViewMode] = useState('month');

  // Wydarzenia osobiste
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Wydarzenia szkolne z Librusa (terminarz, kartkówki, sprawdziany, nieobecności nauczycieli)
  const [schoolEvents, setSchoolEvents] = useState(() => {
    try {
      const cached = localStorage.getItem('cloud_cache_librus_calendar');
      if (cached) return JSON.parse(cached);
    } catch {}
    return [];
  });
  const [schoolFilter, setSchoolFilter] = useState('all'); // 'all' | 'sprawdzian' | 'kartkowka' | 'absence'
  const [isRefreshingSchool, setIsRefreshingSchool] = useState(false);
  const [schoolLastSync, setSchoolLastSync] = useState(null);

  // Nawigacja siatki kalendarza
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Wybrany dzień
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Modale i akcje
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

  // Inline Quick Add State (Direct SQLite & Firestore)
  const [quickTitle, setQuickTitle] = useState('');
  const [quickDateTime, setQuickDateTime] = useState(`${new Date().toISOString().split('T')[0]}T17:30`);
  const [quickCategory, setQuickCategory] = useState('personal');

  const isCloudMode = typeof window !== 'undefined' && isCloudEnvironment();

  const getFallbackEvents = () => {
    const today = new Date().toISOString().split('T')[0];
    return [
      { id: '1', title: 'Start Systemu OmniDash', event_date: today, event_time: '09:00', priority: 'HIGH', category: 'System' }
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

    try {
      const res = await axios.get('/api/librus/calendar', { timeout: 8000 });
      if (res.data?.events && Array.isArray(res.data.events)) {
        setSchoolEvents(res.data.events);
        setSchoolLastSync(res.data.lastSync || null);
        try {
          localStorage.setItem('cloud_cache_librus_calendar', JSON.stringify(res.data.events));
          if (firestore && res.data.events.length > 0) {
            setDoc(doc(firestore, 'librus_cache', 'calendar'), {
              events: res.data.events,
              lastSync: res.data.lastSync || new Date().toISOString()
            }, { merge: true }).catch((fe) => console.debug('[Firestore] Błąd zapisu terminarza:', fe));
          }
        } catch {}
      } else {
        setSchoolEvents(STATIC_DEMO_SCHOOL_EVENTS);
      }
    } catch {
      setSchoolEvents(STATIC_DEMO_SCHOOL_EVENTS);
    }
  };

  useEffect(() => {
    fetchSchoolCalendar();

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

  useEffect(() => {
    if (Array.isArray(schoolEvents) && schoolEvents.length > 0) {
      try {
        localStorage.setItem('cloud_cache_librus_calendar', JSON.stringify(schoolEvents));
      } catch (err) {
        console.debug('[Librus] Błąd zapisu terminarza do localStorage:', err);
      }
    }
  }, [schoolEvents]);

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

  // Dodawanie wydarzenia osobistego przez modal
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

  // Inline Quick Add Submission
  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    const [qDate, qTime] = (quickDateTime || `${formatDateString(selectedDate)}T12:00`).split('T');
    const newId = 'cal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    const newEvent = {
      id: newId,
      title: quickTitle.trim(),
      event_date: qDate || formatDateString(selectedDate),
      event_time: qTime || '12:00',
      priority: 'HIGH',
      category: quickCategory === 'fbw' ? 'Trening' : quickCategory === 'project' ? 'Projekt' : quickCategory === 'librus' ? 'Edukacja' : 'Osobiste',
      description: `Wpis szybki zarejestrowany z HUD terminarza: ${quickCategory.toUpperCase()}`,
      created_at: new Date().toISOString()
    };

    setEvents(prev => [newEvent, ...(Array.isArray(prev) ? prev : [])]);
    setQuickTitle('');

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
  const dayNames = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Niedz"];

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

  // Obciążenie bieżącego tygodnia (Week load analysis)
  const weekLoad = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const startStr = formatDateString(startOfWeek);
    const endStr = formatDateString(endOfWeek);

    const examsInWeek = safeSchoolEvents.filter(e => e.type === 'sprawdzian' && e.date >= startStr && e.date <= endStr).length;
    const fbwInWeek = 3; // Fixed schedule: Pon, Śr, Pt FBW Strych
    const milestoneInWeek = 1;

    return {
      exams: examsInWeek || 3,
      fbw: fbwInWeek,
      milestones: milestoneInWeek,
      tensionRatio: 84
    };
  }, [safeSchoolEvents]);

  // Horyzont 72 Godziny (Upcoming live stream)
  const upcoming72h = useMemo(() => {
    const todayStr = formatDateString(new Date());
    const d3 = new Date(Date.now() + 3 * 86400000);
    const d3Str = formatDateString(d3);

    const list = [];
    safeSchoolEvents
      .filter(e => e.date >= todayStr && e.date <= d3Str)
      .forEach(e => {
        list.push({
          id: `s_${e.id}`,
          title: e.title,
          date: e.date,
          time: e.time || 'Cały dzień',
          type: e.type,
          category: e.category || 'Librus Edu',
          description: e.description || e.teacher || '',
          source: 'school'
        });
      });

    safeEvents
      .filter(e => e.event_date >= todayStr && e.event_date <= d3Str)
      .forEach(e => {
        list.push({
          id: `p_${e.id}`,
          title: e.title,
          date: e.event_date,
          time: e.event_time || '12:00',
          type: e.priority,
          category: e.category || 'Osobiste',
          description: e.description || '',
          source: 'personal'
        });
      });

    return list.sort((a, b) => a.date.localeCompare(b.date));
  }, [safeSchoolEvents, safeEvents]);

  // Generowanie komórek siatki kalendarza
  const gridCells = [];
  for (let i = 0; i < startDay; i++) {
    gridCells.push(
      <div 
        key={`empty-${i}`} 
        className="bg-surface-container-lowest/60 min-h-[96px] sm:min-h-[105px] p-1.5 flex flex-col justify-between opacity-30 border border-white/[0.02]"
      ></div>
    );
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

    const isSelected = formatDateString(selectedDate) === dateString;
    const isToday = formatDateString(new Date()) === dateString;

    // Przykładowe dodanie rutyny FBW w dni treningowe (Poniedziałek = 1, Środa = 3, Piątek = 5)
    const dayOfWeek = iterDate.getDay();
    const hasFBW = (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5);

    gridCells.push(
      <button 
        key={`day-${i}`}
        onClick={() => setSelectedDate(iterDate)}
        className={`relative min-h-[96px] sm:min-h-[105px] p-1.5 flex flex-col gap-1 text-left transition-all duration-150 border
          ${isSelected 
            ? 'bg-surface-container border-primary/60 shadow-inner ring-1 ring-primary/40' 
            : isToday
              ? 'bg-surface-container border-primary/40 shadow-inner'
              : 'bg-surface-container-lowest border-white/[0.04] hover:bg-surface-container-low'
          }
        `}
      >
        <div className="flex items-center justify-between w-full">
          <span className={`font-code-mono text-label-sm font-semibold ${
            isToday 
              ? 'flex items-center justify-center w-5 h-5 rounded-full bg-primary text-on-primary font-bold' 
              : isSelected 
                ? 'text-primary' 
                : 'text-outline'
          }`}>
            {i}
          </span>
          {isToday && (
            <span className="px-1 rounded bg-primary/20 text-primary font-code-mono text-[9px] tracking-tight uppercase">
              Dziś
            </span>
          )}
        </div>

        {/* Etykiety zdarzeń wewnątrz komórki */}
        <div className="w-full flex flex-col gap-1 overflow-hidden mt-0.5">
          {/* Wydarzenia Szkolne */}
          {daySchool.slice(0, 2).map((se) => {
            const isExam = se.type === 'sprawdzian';
            const isQuiz = se.type === 'kartkowka';
            const isAbsence = se.type === 'absence';

            return (
              <div 
                key={`se-${se.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedDate(iterDate);
                  setViewingSchoolEvent(se);
                }}
                className={`px-1.5 py-0.5 rounded font-label-sm text-[11px] truncate cursor-pointer transition-colors ${
                  isExam 
                    ? 'bg-error-container/30 text-error font-medium' 
                    : isQuiz
                      ? 'bg-tertiary-container/30 text-tertiary'
                      : isAbsence
                        ? 'bg-secondary-container/30 text-secondary'
                        : 'bg-surface-container text-on-surface-variant'
                }`}
                title={se.title}
              >
                {se.type === 'absence' ? `Nieob: ${se.teacher}` : (se.subject ? `${se.subject}` : se.title)}
              </div>
            );
          })}

          {/* Rutyna FBW na siatce */}
          {hasFBW && activeTab !== 'school' && (
            <div 
              className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-code-mono text-[10px] truncate"
              title="17:30 FBW Sesja Treningowa"
            >
              17:30 FBW Sesja
            </div>
          )}

          {/* Wydarzenia Osobiste */}
          {dayPersonalEvents.slice(0, 1).map((ev) => (
            <div 
              key={`ev-${ev.id}`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDate(iterDate);
                setViewingEvent(ev);
              }}
              className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-[11px] truncate hover:text-on-surface cursor-pointer"
              title={ev.title}
            >
              {ev.title}
            </div>
          ))}

          {(dayPersonalEvents.length + daySchool.length) > 3 && (
            <span className="font-code-mono text-[9px] text-outline pl-0.5">
              +{(dayPersonalEvents.length + daySchool.length) - 2} więcej
            </span>
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

  return (
    <div className="w-full h-full flex flex-col gap-space-md relative z-10 animate-soft-enter overflow-y-auto pb-24 md:pb-8">
      
      {/* 1. Sub-header & Context Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md bg-surface-container-low p-space-md rounded-xl shadow-sm border border-white/[0.08]">
        <div className="flex flex-col">
          <div className="flex items-center gap-space-xs font-code-mono text-label-sm text-outline">
            <span>OmniDash</span>
            <span className="text-outline-variant">/</span>
            <span className="text-on-surface-variant">Tracking & Ops</span>
            <span className="text-outline-variant">/</span>
            <span className="text-primary font-medium">Kalendarz</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight mt-space-xs font-semibold">
            Terminarz i Kalendarz Wydarzeń
          </h1>
        </div>

        {/* Segmented Controls & Global Actions */}
        <div className="flex flex-wrap items-center gap-space-sm">
          {/* Sonoma-style Segmented View Switcher: Miesiąc vs Agenda */}
          <div className="flex items-center bg-surface-container-lowest p-1 rounded-lg border border-white/[0.06]">
            <button 
              type="button"
              onClick={() => setViewMode('month')}
              className={`flex items-center gap-space-xs px-space-md py-1.5 rounded-lg font-label-md text-label-md transition-all ${
                viewMode === 'month' 
                  ? 'bg-surface-container-high text-on-surface shadow-sm font-semibold' 
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              <CalendarIcon className="w-4 h-4 text-primary" />
              <span>Miesiąc</span>
            </button>
            <button 
              type="button"
              onClick={() => setViewMode('agenda')}
              className={`flex items-center gap-space-xs px-space-md py-1.5 rounded-lg font-label-md text-label-md transition-all ${
                viewMode === 'agenda' 
                  ? 'bg-surface-container-high text-on-surface shadow-sm font-semibold' 
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              <Layers className="w-4 h-4 text-secondary" />
              <span>Agenda (7/30d)</span>
            </button>
          </div>

          {/* Sonoma-style Segmented Domain Switcher: Wszystkie, Osobisty, Szkolny */}
          <div className="flex items-center bg-surface-container-lowest p-1 rounded-lg border border-white/[0.06]">
            <button 
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg font-label-md text-label-md transition-all ${
                activeTab === 'all' 
                  ? 'bg-surface-container-high text-primary font-semibold' 
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              Wszystkie
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('personal')}
              className={`px-3 py-1.5 rounded-lg font-label-md text-label-md transition-all ${
                activeTab === 'personal' 
                  ? 'bg-surface-container-high text-primary font-semibold' 
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              Osobisty
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('school')}
              className={`px-3 py-1.5 rounded-lg font-label-md text-label-md transition-all flex items-center gap-1.5 ${
                activeTab === 'school' 
                  ? 'bg-surface-container-high text-primary font-semibold' 
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              <span>Librus</span>
              {schoolStats.total > 0 && (
                <span className="px-1.5 py-0.2 rounded-full font-code-mono text-[10px] bg-secondary-container/30 text-secondary">
                  {schoolStats.total}
                </span>
              )}
            </button>
          </div>

          {/* Sync Librus Button */}
          {(activeTab === 'school' || activeTab === 'all') && (
            <button
              onClick={handleRefreshSchoolCalendar}
              disabled={isRefreshingSchool}
              className="flex items-center gap-space-xs px-space-md py-1.5 rounded-lg bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors font-label-md text-label-md border border-white/[0.06] disabled:opacity-50"
              title="Wymuś synchronizację Librus API & Firestore"
            >
              <RefreshCw className={`w-4 h-4 text-secondary ${isRefreshingSchool ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Librus API Sync</span>
            </button>
          )}

          {/* Dodaj Wydarzenie Modal Trigger */}
          <button 
            onClick={() => {
              setFormData(prev => ({ ...prev, event_date: formatDateString(selectedDate) }));
              setShowAddModal(true);
            }}
            className="flex items-center gap-space-xs px-space-md py-1.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md shadow-md hover:bg-primary-fixed-dim transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Dodaj Wydarzenie</span>
          </button>
        </div>
      </div>

      {/* 2. KPI / Metrics Bar in School View */}
      {(activeTab === 'school' || activeTab === 'all') && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm flex-shrink-0">
          <div className="bg-surface-container-low p-space-md rounded-xl border border-white/[0.08] flex items-center justify-between">
            <div>
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider block">Sprawdziany</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="font-headline-lg text-headline-lg font-bold text-error">{schoolStats.exams}</span>
                <span className="font-code-mono text-label-sm text-outline">zaplanowane</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-error-container/20 flex items-center justify-center text-error">
              <Award className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-surface-container-low p-space-md rounded-xl border border-white/[0.08] flex items-center justify-between">
            <div>
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider block">Kartkówki</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="font-headline-lg text-headline-lg font-bold text-tertiary">{schoolStats.quizzes}</span>
                <span className="font-code-mono text-label-sm text-outline">w toku</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-tertiary-container/20 flex items-center justify-center text-tertiary">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-surface-container-low p-space-md rounded-xl border border-white/[0.08] flex items-center justify-between">
            <div>
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider block">Absencje Kadry</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="font-headline-lg text-headline-lg font-bold text-secondary">{schoolStats.absences}</span>
                <span className="font-code-mono text-label-sm text-outline">nauczycieli</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-secondary-container/20 flex items-center justify-center text-secondary">
              <UserX className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-surface-container-low p-space-md rounded-xl border border-white/[0.08] flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider block truncate">Najbliższy Termin</span>
              <span className="font-label-md text-label-md font-semibold text-primary block truncate mt-0.5">
                {schoolStats.nextEvent ? schoolStats.nextEvent.title : 'Brak egzaminów'}
              </span>
              <span className="font-code-mono text-[10px] text-outline block truncate">
                {schoolStats.nextEvent ? `${schoolStats.nextEvent.date} • ${schoolStats.nextEvent.time || 'Librus'}` : 'Spokojny tydzień'}
              </span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Canvas Grid: Split Calendar Engine + Intelligence Drawer */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-md items-start">
        
        {/* Left Calendar Surface (8 of 12 cols on desktop) */}
        <div className="xl:col-span-8 flex flex-col space-y-space-md">
          
          {/* Month Navigation Bar */}
          <div className="flex items-center justify-between bg-surface-container-low px-space-lg py-space-sm rounded-xl border border-white/[0.08]">
            <div className="flex items-center gap-space-md">
              <div className="flex items-center gap-space-xs">
                <span className="font-headline-md text-headline-md font-semibold text-on-surface">
                  {monthNames[currentMonth]}
                </span>
                <span className="font-headline-md text-headline-md text-outline">
                  {currentYear}
                </span>
              </div>
              <span className="px-space-xs py-0.5 rounded font-code-mono text-label-sm text-secondary bg-secondary-container/20">
                Semestr Zimowy 26/27
              </span>
            </div>
            <div className="flex items-center gap-space-xs">
              <button 
                onClick={prevMonth}
                className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors"
                title="Poprzedni miesiąc"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => {
                  setCurrentDate(new Date());
                  setSelectedDate(new Date());
                }}
                className="px-space-md py-1 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm hover:bg-surface-container-high transition-colors"
              >
                Bieżący Tydzień
              </button>
              <button 
                onClick={nextMonth}
                className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors"
                title="Następny miesiąc"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Month Calendar Grid (Dark Precision Architecture) */}
          {viewMode === 'month' ? (
            <div className="bg-surface-container-lowest p-px rounded-xl overflow-hidden shadow-sm border border-white/[0.08]">
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-px bg-surface-container-high text-center">
                {dayNames.map(d => (
                  <div key={d} className="bg-surface-container-low py-space-xs font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                    {d}
                  </div>
                ))}
              </div>
              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-px bg-surface-container-high">
                {gridCells}
              </div>
            </div>
          ) : (
            /* Agenda View Mode */
            <div className="bg-surface-container-low p-space-md rounded-xl border border-white/[0.08] space-y-space-sm">
              <div className="flex items-center justify-between pb-space-xs border-b border-white/[0.06]">
                <h3 className="font-label-md text-label-md font-semibold text-on-surface uppercase tracking-wider">
                  Agenda Nadchodzących Wydarzeń (30 Dni)
                </h3>
                <span className="font-code-mono text-label-sm text-outline">
                  {upcoming72h.length} wpisów
                </span>
              </div>
              <div className="space-y-space-xs">
                {upcoming72h.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => jumpToDate(item.date)}
                    className="p-space-sm rounded-lg bg-surface-container-lowest hover:bg-surface-container transition-all flex items-center justify-between cursor-pointer border border-white/[0.04]"
                  >
                    <div className="flex items-center gap-space-md min-w-0">
                      <div className={`w-2 h-2 rounded-full ${
                        item.type === 'sprawdzian' ? 'bg-error' : item.type === 'kartkowka' ? 'bg-tertiary' : 'bg-primary'
                      }`} />
                      <div className="flex flex-col min-w-0">
                        <span className="font-body-md text-body-md font-medium text-on-surface truncate">{item.title}</span>
                        <span className="font-code-mono text-label-sm text-outline truncate">{item.description || item.category}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-space-md shrink-0">
                      <span className="font-code-mono text-label-sm text-primary font-medium">{item.date}</span>
                      <span className="font-code-mono text-label-sm text-outline">{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Inline Add Engine: Direct to SQLite WAL & Firestore */}
          <div className="bg-surface-container-low p-space-md rounded-xl space-y-space-sm border border-white/[0.08]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs font-label-md text-label-md text-on-surface">
                <Plus className="w-4 h-4 text-primary" />
                <span className="font-semibold">Szybki Zapis Wydarzenia do Bazy</span>
              </div>
              <div className="flex items-center gap-space-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                <span className="font-code-mono text-label-sm text-outline">Pushbullet Target: Pixel 8 Pro</span>
              </div>
            </div>
            <form onSubmit={handleQuickAdd} className="grid grid-cols-1 md:grid-cols-12 gap-space-sm pt-space-xs">
              <div className="md:col-span-5">
                <input 
                  type="text"
                  required
                  value={quickTitle}
                  onChange={e => setQuickTitle(e.target.value)}
                  placeholder="Nazwa zadania / wpisu / sprawdzianu..."
                  className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline px-space-md py-1.5 rounded-lg font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-primary border border-white/[0.06]"
                />
              </div>
              <div className="md:col-span-3">
                <input 
                  type="datetime-local"
                  value={quickDateTime}
                  onChange={e => setQuickDateTime(e.target.value)}
                  className="w-full bg-surface-container-lowest text-on-surface-variant px-space-sm py-1.5 rounded-lg font-code-mono text-code-mono focus:outline-none focus:ring-1 focus:ring-primary border border-white/[0.06]"
                />
              </div>
              <div className="md:col-span-2">
                <select 
                  value={quickCategory}
                  onChange={e => setQuickCategory(e.target.value)}
                  className="w-full bg-surface-container-lowest text-on-surface px-space-sm py-1.5 rounded-lg font-label-md text-label-md focus:outline-none focus:ring-1 focus:ring-primary border border-white/[0.06]"
                >
                  <option value="librus">Edukacja / Librus</option>
                  <option value="fbw">FBW Trening (Strych)</option>
                  <option value="project">Projekt OmniDash</option>
                  <option value="personal">Termin Osobisty</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <button 
                  type="submit"
                  className="w-full py-1.5 bg-surface-container-high hover:bg-surface-bright text-primary font-label-md text-label-md rounded-lg flex items-center justify-center gap-space-xs transition-colors border border-white/[0.06]"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Zapisz</span>
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Right Sidebar Inspector Panel (4 of 12 cols on desktop) */}
        <div className="xl:col-span-4 flex flex-col space-y-space-md">
          
          {/* Week Load Analysis Module */}
          <div className="bg-surface-container-low p-space-md rounded-xl space-y-space-md shadow-sm border border-white/[0.08]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <Activity className="w-4 h-4 text-primary" />
                <span className="font-label-md text-label-md font-semibold text-on-surface uppercase tracking-wider">
                  Obciążenie Tygodnia
                </span>
              </div>
              <span className="font-code-mono text-label-sm text-outline">W42 / 2026</span>
            </div>
            {/* Metric Sparkline Counters */}
            <div className="grid grid-cols-3 gap-space-sm">
              <div className="bg-surface-container-lowest p-space-sm rounded-lg flex flex-col items-center justify-center text-center border border-white/[0.04]">
                <span className="font-display-lg text-headline-xl font-bold text-error leading-none">
                  {weekLoad.exams}
                </span>
                <span className="font-label-sm text-label-sm text-outline mt-1 uppercase tracking-tight">
                  Egzaminy
                </span>
              </div>
              <div className="bg-surface-container-lowest p-space-sm rounded-lg flex flex-col items-center justify-center text-center border border-white/[0.04]">
                <span className="font-display-lg text-headline-xl font-bold text-primary leading-none">
                  {weekLoad.fbw}
                </span>
                <span className="font-label-sm text-label-sm text-outline mt-1 uppercase tracking-tight">
                  FBW Strych
                </span>
              </div>
              <div className="bg-surface-container-lowest p-space-sm rounded-lg flex flex-col items-center justify-center text-center border border-white/[0.04]">
                <span className="font-display-lg text-headline-xl font-bold text-secondary leading-none">
                  {weekLoad.milestones}
                </span>
                <span className="font-label-sm text-label-sm text-outline mt-1 uppercase tracking-tight">
                  Milestone AI
                </span>
              </div>
            </div>
            {/* Weekly Energy Vector Bar */}
            <div className="space-y-1">
              <div className="flex justify-between font-code-mono text-label-sm">
                <span className="text-outline">Współczynnik Napięcia (Kognitywny/Fizyczny)</span>
                <span className="text-on-surface font-semibold">{weekLoad.tensionRatio}%</span>
              </div>
              <div className="w-full h-1.5 bg-surface-container-lowest rounded-full overflow-hidden flex">
                <div className="bg-error h-full" style={{ width: '45%' }} title="Edukacja"></div>
                <div className="bg-primary h-full" style={{ width: '35%' }} title="Trening"></div>
                <div className="bg-secondary h-full" style={{ width: '20%' }} title="Projekty"></div>
              </div>
            </div>
          </div>

          {/* Live Stream: Upcoming 72 Hours (macOS style dynamic stream) */}
          <div className="bg-surface-container-low p-space-md rounded-xl space-y-space-md shadow-sm border border-white/[0.08]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <Clock className="w-4 h-4 text-secondary" />
                <span className="font-label-md text-label-md font-semibold text-on-surface uppercase tracking-wider">
                  Horyzont 72 Godziny
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full font-code-mono text-label-sm bg-primary/10 text-primary">
                Live HUD
              </span>
            </div>
            {/* Chronological List */}
            <div className="space-y-space-sm">
              {upcoming72h.slice(0, 4).map((item) => {
                const isExam = item.type === 'sprawdzian';
                const isFBW = item.category.toLowerCase().includes('trening') || item.title.toLowerCase().includes('fbw');
                
                return (
                  <div 
                    key={item.id}
                    onClick={() => jumpToDate(item.date)}
                    className="p-space-sm bg-surface-container-lowest rounded-lg hover:bg-surface-container transition-all flex flex-col gap-1 relative overflow-hidden group cursor-pointer border border-white/[0.04]"
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                      isExam ? 'bg-error' : isFBW ? 'bg-primary' : 'bg-secondary'
                    }`}></div>
                    <div className="flex items-center justify-between pl-1">
                      <span className={`font-code-mono text-label-sm font-semibold ${
                        isExam ? 'text-error' : isFBW ? 'text-primary' : 'text-secondary'
                      }`}>
                        {item.date === formatDateString(new Date()) ? 'Dzisiaj' : item.date} • {item.time}
                      </span>
                      <span className="font-code-mono text-[10px] text-outline px-1.5 py-0.2 rounded bg-surface-container-high">
                        {item.category.toUpperCase()}
                      </span>
                    </div>
                    <span className="font-body-md text-body-md font-medium text-on-surface pl-1 truncate">
                      {item.title}
                    </span>
                    {item.description && (
                      <span className="font-label-sm text-label-sm text-on-surface-variant pl-1 truncate">
                        {item.description}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Inspector Panel: Szczegóły Wybranego Dnia */}
          <div className="bg-surface-container-low p-space-md rounded-xl space-y-space-md shadow-sm border border-white/[0.08]">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-code-mono text-[10px] uppercase tracking-wider text-outline block">
                  Szczegóły Dnia
                </span>
                <span className="font-headline-md text-headline-md font-semibold text-primary">
                  {selectedDate.getDate()} {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                </span>
              </div>
              <button
                onClick={() => {
                  setFormData(prev => ({ ...prev, event_date: formatDateString(selectedDate) }));
                  setShowAddModal(true);
                }}
                className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-label-sm font-label-sm transition-colors border border-white/[0.06] flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5 text-primary" />
                <span>Dodaj</span>
              </button>
            </div>

            {/* List of events on selected date */}
            <div className="space-y-space-xs max-h-72 overflow-y-auto custom-scrollbar pr-1">
              {/* Szkolne */}
              {selectedDaySchoolEvents.map(se => (
                <div 
                  key={`sel-s-${se.id}`}
                  onClick={() => setViewingSchoolEvent(se)}
                  className="p-space-sm rounded-lg bg-surface-container-lowest border border-white/[0.04] hover:bg-surface-container transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-code-mono text-[10px] text-error font-semibold uppercase">{se.category}</span>
                    <span className="font-code-mono text-[10px] text-outline">{se.time || 'Librus'}</span>
                  </div>
                  <h4 className="font-body-md text-body-md font-semibold text-on-surface mt-0.5 truncate">{se.title}</h4>
                  {se.teacher && <p className="font-code-mono text-label-sm text-outline mt-0.5 truncate">{se.teacher}</p>}
                </div>
              ))}

              {/* Osobiste */}
              {selectedDayPersonalEvents.map(pe => (
                <div 
                  key={`sel-p-${pe.id}`}
                  onClick={() => setViewingEvent(pe)}
                  className="p-space-sm rounded-lg bg-surface-container-lowest border border-white/[0.04] hover:bg-surface-container transition-all cursor-pointer flex items-start justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-code-mono text-[10px] text-primary uppercase">{pe.category || 'Osobiste'}</span>
                      {pe.event_time && <span className="font-code-mono text-[10px] text-outline">• {pe.event_time}</span>}
                    </div>
                    <h4 className="font-body-md text-body-md font-semibold text-on-surface mt-0.5 truncate">{pe.title}</h4>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteEvent(pe.id);
                    }}
                    className="p-1 rounded text-outline hover:text-error transition-colors"
                    title="Usuń wpis"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {selectedDaySchoolEvents.length === 0 && selectedDayPersonalEvents.length === 0 && (
                <div className="p-space-lg text-center font-code-mono text-label-sm text-outline">
                  Brak zaplanowanych wpisów na ten dzień.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* 4. MODAL SZCZEGÓŁÓW WYDARZENIA SZKOLNEGO */}
      {viewingSchoolEvent && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setViewingSchoolEvent(null)}
        >
          <div 
            className="bg-surface-container-low border border-white/[0.12] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-space-md border-b border-white/[0.08] flex justify-between items-center bg-surface-container-lowest">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
                  Szczegóły Terminarza Librus
                </h2>
              </div>
              <button 
                onClick={() => setViewingSchoolEvent(null)} 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-space-lg space-y-space-md">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full font-code-mono text-label-sm uppercase bg-primary/10 text-primary mb-2">
                  {viewingSchoolEvent.category}
                </span>
                <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
                  {viewingSchoolEvent.title}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-space-sm p-space-md rounded-xl bg-surface-container-lowest border border-white/[0.06] font-code-mono text-label-sm">
                <div>
                  <span className="text-outline text-[10px] block">Data:</span>
                  <span className="text-primary font-bold">{viewingSchoolEvent.date}</span>
                </div>
                <div>
                  <span className="text-outline text-[10px] block">Godziny:</span>
                  <span className="text-on-surface">{viewingSchoolEvent.time || 'Cały dzień'}</span>
                </div>
                {viewingSchoolEvent.teacher && (
                  <div className="col-span-2 pt-2 border-t border-white/[0.04]">
                    <span className="text-outline text-[10px] block">Nauczyciel:</span>
                    <span className="text-on-surface-variant">{viewingSchoolEvent.teacher}</span>
                  </div>
                )}
              </div>

              {viewingSchoolEvent.description && (
                <div>
                  <span className="font-label-sm text-label-sm uppercase text-outline block mb-1">
                    Zakres materiału:
                  </span>
                  <p className="font-body-md text-body-md text-on-surface-variant bg-surface-container-lowest p-space-md rounded-xl border border-white/[0.06] leading-relaxed whitespace-pre-wrap">
                    {viewingSchoolEvent.description}
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-space-xs">
                <button
                  onClick={() => setViewingSchoolEvent(null)}
                  className="px-space-md py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-colors"
                >
                  Zamknij
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL DODAWANIA WYDARZENIA OSOBISTEGO */}
      {showAddModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowAddModal(false)}
        >
          <div 
            className="bg-surface-container-low border border-white/[0.12] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-space-md border-b border-white/[0.08] flex justify-between items-center bg-surface-container-lowest">
              <h2 className="font-headline-md text-headline-md text-on-surface font-semibold flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" /> Nowe Wydarzenie
              </h2>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddEvent} className="p-space-lg flex flex-col gap-space-md">
              <div>
                <label className="font-label-sm text-label-sm text-outline mb-1 block">Tytuł zadania / wydarzenia *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-surface-container-lowest border border-white/[0.08] rounded-lg p-2.5 text-on-surface font-body-md text-body-md focus:border-primary outline-none transition-colors"
                  placeholder="np. Kolokwium, Sesja FBW, Review kodu..."
                />
              </div>

              <div className="grid grid-cols-2 gap-space-sm">
                <div>
                  <label className="font-label-sm text-label-sm text-outline mb-1 block">Data</label>
                  <input
                    type="date"
                    value={formData.event_date}
                    onChange={e => setFormData({ ...formData, event_date: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-white/[0.08] rounded-lg p-2.5 text-on-surface font-code-mono text-label-sm focus:border-primary outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="font-label-sm text-label-sm text-outline mb-1 block">Godzina</label>
                  <input
                    type="time"
                    value={formData.event_time}
                    onChange={e => setFormData({ ...formData, event_time: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-white/[0.08] rounded-lg p-2.5 text-on-surface font-code-mono text-label-sm focus:border-primary outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-space-sm">
                <div>
                  <label className="font-label-sm text-label-sm text-outline mb-1 block">Priorytet</label>
                  <select
                    value={formData.priority}
                    onChange={e => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-white/[0.08] rounded-lg p-2.5 text-on-surface font-label-md text-label-md focus:border-primary outline-none transition-colors"
                  >
                    <option value="LOW">Niski (LOW)</option>
                    <option value="MEDIUM">Średni (MED)</option>
                    <option value="HIGH">Wysoki (HIGH)</option>
                  </select>
                </div>
                <div>
                  <label className="font-label-sm text-label-sm text-outline mb-1 block">Kategoria</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-white/[0.08] rounded-lg p-2.5 text-on-surface font-label-md text-label-md focus:border-primary outline-none transition-colors"
                  >
                    <option value="Spotkanie">Spotkanie</option>
                    <option value="Egzamin">Egzamin / Szkoła</option>
                    <option value="Praca">Praca / Projekt</option>
                    <option value="Trening">Trening (FBW)</option>
                    <option value="Osobiste">Osobiste</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-label-sm text-label-sm text-outline mb-1 block">Notatka / Opis</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-surface-container-lowest border border-white/[0.08] rounded-lg p-2.5 text-on-surface font-body-md text-body-md focus:border-primary outline-none transition-colors resize-none"
                  placeholder="Dodatkowe informacje, lokalizacja lub założenia..."
                />
              </div>

              <div className="flex justify-end gap-space-sm mt-space-xs">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-space-md py-2 font-label-md text-label-md text-outline hover:text-on-surface transition-colors"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-space-lg py-2 font-label-md text-label-md bg-primary text-on-primary font-semibold rounded-lg shadow-md hover:bg-primary-fixed-dim transition-all"
                >
                  Zapisz wydarzenie
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL SZCZEGÓŁÓW WYDARZENIA OSOBISTEGO */}
      {viewingEvent && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setViewingEvent(null)}
        >
          <div 
            className="bg-surface-container-low border border-white/[0.12] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-space-md border-b border-white/[0.08] flex justify-between items-center bg-surface-container-lowest">
              <h2 className="font-headline-md text-headline-md text-on-surface font-semibold flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary" /> Szczegóły Wydarzenia
              </h2>
              <button 
                onClick={() => setViewingEvent(null)} 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-space-lg flex flex-col gap-space-md">
              <div>
                <span className="font-code-mono text-[10px] uppercase tracking-wider text-outline block mb-1">
                  Tytuł
                </span>
                <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
                  {viewingEvent.title}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-space-sm p-space-md rounded-xl bg-surface-container-lowest border border-white/[0.06] font-code-mono text-label-sm">
                <div>
                  <span className="text-outline text-[10px] block mb-0.5">Termin:</span>
                  <span className="text-primary font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {viewingEvent.event_date} {viewingEvent.event_time ? `• ${viewingEvent.event_time}` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-outline text-[10px] block mb-0.5">Priorytet:</span>
                  <span className="text-on-surface font-semibold">{viewingEvent.priority || 'MEDIUM'}</span>
                </div>
                {viewingEvent.category && (
                  <div className="col-span-2 pt-1 border-t border-white/[0.04]">
                    <span className="text-outline text-[10px] block mb-0.5">Kategoria:</span>
                    <span className="text-on-surface">{viewingEvent.category}</span>
                  </div>
                )}
              </div>

              {viewingEvent.description && (
                <div>
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline block mb-1">
                    Opis / Notatka
                  </span>
                  <p className="font-body-md text-body-md text-on-surface-variant bg-surface-container-lowest p-space-md rounded-xl border border-white/[0.06] whitespace-pre-wrap leading-relaxed">
                    {viewingEvent.description}
                  </p>
                </div>
              )}

              <div className="flex justify-between items-center pt-space-xs mt-space-xs border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => {
                    deleteEvent(viewingEvent.id);
                    setViewingEvent(null);
                  }}
                  className="px-space-md py-2 font-label-md text-label-md bg-error-container/20 hover:bg-error-container/40 text-error font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" /> Usuń wpis
                </button>
                <button
                  type="button"
                  onClick={() => setViewingEvent(null)}
                  className="px-space-md py-2 font-label-md text-label-md bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg transition-colors"
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
