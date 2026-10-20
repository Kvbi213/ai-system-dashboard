import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
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

const MONTH_NAMES = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
];

const CalendarPage = () => {
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'agenda'
  const [events, setEvents] = useState([]);
  const [schoolEvents, setSchoolEvents] = useState(() => {
    try {
      const cached = localStorage.getItem('cloud_cache_librus_calendar');
      if (cached) return JSON.parse(cached);
    } catch {}
    return [];
  });

  const [isRefreshingSchool, setIsRefreshingSchool] = useState(false);
  const [schoolLastSync, setSchoolLastSync] = useState(null);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingEvent, setViewingEvent] = useState(null);

  // Formularz dodawania
  const [formData, setFormData] = useState({
    title: '',
    event_date: new Date().toISOString().split('T')[0],
    event_time: '12:00',
    category: 'Spotkanie',
    description: ''
  });

  // Inline Quick Add
  const [quickTitle, setQuickTitle] = useState('');
  const [quickDateTime, setQuickDateTime] = useState(`${new Date().toISOString().split('T')[0]}T17:30`);
  const [quickCategory, setQuickCategory] = useState('fbw');

  const isCloudMode = typeof window !== 'undefined' && isCloudEnvironment();

  const formatDateString = (date) => {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
  };

  // Subskrypcja Firestore
  useEffect(() => {
    const unsub = subscribeCollection('calendar', (cloudEvents) => {
      if (Array.isArray(cloudEvents)) {
        setEvents(cloudEvents);
      }
    });

    if (!isCloudMode) {
      axios.get('/api/calendar')
        .then(res => {
          if (Array.isArray(res.data) && res.data.length > 0) {
            setEvents(res.data);
          }
        })
        .catch(() => {});
    }

    return () => unsub();
  }, [isCloudMode]);

  // Pobieranie kalendarza szkolnego
  const fetchSchoolCalendar = async () => {
    if (isCloudMode) {
      if (firestore) {
        try {
          const snap = await getDoc(doc(firestore, 'librus_cache', 'calendar'));
          if (snap.exists() && snap.data()?.events) {
            setSchoolEvents(snap.data().events);
            setSchoolLastSync(snap.data().lastSync || null);
            return;
          }
        } catch {}
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
          if (snap.exists() && snap.data()?.events) {
            setSchoolEvents(snap.data().events);
            setSchoolLastSync(snap.data().lastSync || null);
          }
        }, () => {});
        return () => unsub();
      } catch {}
    }
  }, []);

  const handleRefreshSchoolCalendar = async () => {
    setIsRefreshingSchool(true);
    if (isCloudMode) {
      await fetchSchoolCalendar();
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

  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const newId = 'cal_' + Date.now();
    const newEvent = {
      id: newId,
      title: formData.title.trim(),
      event_date: formData.event_date || formatDateString(selectedDate),
      event_time: formData.event_time || '12:00',
      category: formData.category || 'Spotkanie',
      description: formData.description || '',
      created_at: new Date().toISOString()
    };

    setEvents(prev => [newEvent, ...prev]);
    setShowAddModal(false);
    setFormData({
      title: '',
      event_date: formatDateString(selectedDate),
      event_time: '12:00',
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

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    const [qDate, qTime] = (quickDateTime || `${formatDateString(selectedDate)}T12:00`).split('T');
    const newId = 'cal_' + Date.now();
    const newEvent = {
      id: newId,
      title: quickTitle.trim(),
      event_date: qDate || formatDateString(selectedDate),
      event_time: qTime || '12:00',
      category: quickCategory === 'fbw' ? 'FBW Trening' : quickCategory === 'project' ? 'Projekt' : quickCategory === 'librus' ? 'Edukacja' : 'Termin Osobisty',
      description: `Szybki wpis: ${quickCategory.toUpperCase()}`,
      created_at: new Date().toISOString()
    };

    setEvents(prev => [newEvent, ...prev]);
    setQuickTitle('');

    await saveCloudDocument('calendar', newId, newEvent);
    if (!isCloudMode) {
      try {
        await axios.post('/api/calendar', newEvent);
      } catch {}
    }
  };

  const handleDeleteEvent = async (id) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    setViewingEvent(null);
    await deleteCloudDocument('calendar', id);
    if (!isCloudMode) {
      try {
        await axios.delete(`/api/calendar/${id}`);
      } catch {}
    }
  };

  // Obliczenia siatki miesiąca
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7; // Poniedziałek = 0
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

  // Budowa 42 komórek kalendarza (6 tygodni)
  const calendarCells = useMemo(() => {
    const cells = [];
    // Dni z poprzedniego miesiąca
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const d = new Date(currentYear, currentMonth - 1, dayNum);
      cells.push({
        dayNum,
        dateStr: formatDateString(d),
        isCurrentMonth: false
      });
    }
    // Dni z bieżącego miesiąca
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(currentYear, currentMonth, i);
      cells.push({
        dayNum: i,
        dateStr: formatDateString(d),
        isCurrentMonth: true
      });
    }
    // Dni z kolejnego miesiąca do dopełnienia 42
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(currentYear, currentMonth + 1, i);
      cells.push({
        dayNum: i,
        dateStr: formatDateString(d),
        isCurrentMonth: false
      });
    }
    return cells;
  }, [currentYear, currentMonth, daysInMonth, firstDayIndex, prevMonthDays]);

  // Wszystkie połączone wydarzenia z mapowaniem dat
  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach(e => {
      const d = e.event_date;
      if (!map[d]) map[d] = [];
      map[d].push({ ...e, source: 'personal' });
    });
    schoolEvents.forEach(e => {
      const d = e.date;
      if (!map[d]) map[d] = [];
      map[d].push({ ...e, source: 'school' });
    });
    return map;
  }, [events, schoolEvents]);

  // Horyzont 72 godziny (nadchodzące wydarzenia)
  const horizonEvents = useMemo(() => {
    const now = new Date();
    const future72 = new Date(now.getTime() + 72 * 3600 * 1000);
    const list = [];

    events.forEach(e => {
      const dt = new Date(`${e.event_date}T${e.event_time || '12:00'}`);
      if (!isNaN(dt.getTime()) && dt >= now && dt <= future72) {
        list.push({ ...e, dateTime: dt, typeCategory: 'PERSONAL' });
      }
    });

    schoolEvents.forEach(e => {
      const dt = new Date(`${e.date}T10:00`);
      if (!isNaN(dt.getTime()) && dt >= now && dt <= future72) {
        list.push({ ...e, dateTime: dt, typeCategory: 'LIBRUS EDU' });
      }
    });

    list.sort((a, b) => a.dateTime - b.dateTime);
    return list;
  }, [events, schoolEvents]);

  const prevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  const resetToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  return (
    <div className="flex-1 flex flex-col w-full space-y-space-md text-on-surface antialiased max-w-full overflow-x-hidden">
      
      {/* 1. SUB-HEADER & CONTEXT BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md bg-surface-container-low p-space-md rounded-xl shadow-sm border border-outline-variant/20">
        <div className="flex flex-col">
          <div className="flex items-center gap-space-xs font-code-mono text-label-sm text-outline">
            <span>OmniDash</span>
            <span>/</span>
            <span className="text-on-surface-variant">Tracking &amp; Ops</span>
            <span>/</span>
            <span className="text-primary font-medium">Kalendarz</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight mt-space-xs">
            Terminarz i Kalendarz Wydarzeń
          </h1>
        </div>

        {/* Global Operations & View Switcher */}
        <div className="flex flex-wrap items-center gap-space-sm">
          {/* Sonoma-style Segmented View Switcher */}
          <div className="flex items-center bg-surface-container-lowest p-1 rounded-lg border border-outline-variant/30">
            <button
              onClick={() => setViewMode('month')}
              className={`flex items-center gap-space-xs px-space-md py-1.5 rounded-lg font-label-md text-label-md transition-all ${
                viewMode === 'month'
                  ? 'bg-surface-container-high text-on-surface shadow-sm font-bold'
                  : 'text-outline hover:text-on-surface'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">calendar_view_month</span>
              <span>Miesiąc</span>
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`flex items-center gap-space-xs px-space-md py-1.5 rounded-lg font-label-md text-label-md transition-all ${
                viewMode === 'agenda'
                  ? 'bg-surface-container-high text-on-surface shadow-sm font-bold'
                  : 'text-outline hover:text-on-surface'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">view_agenda</span>
              <span>Agenda (7/30d)</span>
            </button>
          </div>

          {/* Sync Button */}
          <button
            onClick={handleRefreshSchoolCalendar}
            disabled={isRefreshingSchool}
            className="flex items-center gap-space-xs px-space-md py-1.5 rounded-lg bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all font-label-md text-label-md border border-outline-variant/30 active:scale-[0.97]"
            title="Wymuś synchronizację dwukierunkową"
          >
            <span className={`material-symbols-outlined text-secondary text-[16px] ${isRefreshingSchool ? 'animate-spin' : ''}`}>
              sync
            </span>
            <span className="hidden sm:inline">
              {isRefreshingSchool ? 'Synchronizacja...' : 'Librus API & Google Cal'}
            </span>
          </button>

          {/* New Event Modal Trigger */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-space-xs px-space-md py-1.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold shadow-md hover:bg-primary-fixed-dim transition-all active:scale-[0.97]"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Dodaj Wydarzenie</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN CANVAS GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-md items-start">
        
        {/* Left Calendar Surface (8 of 12 cols on desktop) */}
        <div className="xl:col-span-8 flex flex-col space-y-space-md">
          
          {/* Month Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between bg-surface-container-low px-3 sm:px-space-lg py-space-sm rounded-xl border border-outline-variant/20 shadow-sm gap-2">
            <div className="flex items-center gap-space-md">
              <div className="flex items-center gap-space-xs">
                <span className="font-headline-md text-headline-md font-semibold text-on-surface">
                  {MONTH_NAMES[currentMonth]}
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
                className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors active:scale-[0.95]"
                title="Poprzedni miesiąc"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <button
                onClick={resetToToday}
                className="px-space-md py-1 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm hover:bg-surface-container-high transition-colors"
              >
                Bieżący Tydzień
              </button>
              <button
                onClick={nextMonth}
                className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors active:scale-[0.95]"
                title="Następny miesiąc"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>

          {/* Month Calendar Grid (Dark Precision Architecture) */}
          <div className="w-full max-w-full overflow-x-auto custom-scrollbar">
            <div className="min-w-[320px] bg-surface-container-lowest p-px rounded-xl overflow-hidden shadow-sm border border-outline-variant/20">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-px bg-surface-container-high text-center">
              {['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Niedz'].map((day, idx) => (
                <div key={idx} className="bg-surface-container-low py-space-xs font-label-sm text-label-sm uppercase tracking-wider text-outline">
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-px bg-surface-container-high">
              {calendarCells.map((cell, idx) => {
                const dayEvents = eventsByDate[cell.dateStr] || [];
                const isSelected = formatDateString(selectedDate) === cell.dateStr;

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDate(new Date(cell.dateStr))}
                    className={`min-h-[70px] sm:min-h-[105px] p-1 sm:p-1.5 flex flex-col justify-between transition-colors cursor-pointer ${
                      cell.isCurrentMonth
                        ? 'bg-surface-container-lowest hover:bg-surface-container'
                        : 'bg-surface-container-lowest/60 opacity-40'
                    } ${isSelected ? 'ring-1 ring-primary inset-0' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-code-mono text-label-sm ${isSelected ? 'text-primary font-bold' : 'text-outline'}`}>
                        {cell.dayNum}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 overflow-hidden my-1">
                      {dayEvents.slice(0, 3).map((ev, evIdx) => {
                        const isSchool = ev.source === 'school';
                        const isTraining = (ev.title || '').toLowerCase().includes('fbw') || (ev.category || '').toLowerCase().includes('trening');
                        const isExam = isSchool || (ev.category || '').toLowerCase().includes('sprawdzian') || (ev.category || '').toLowerCase().includes('kartkówka');

                        return (
                          <div
                            key={evIdx}
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingEvent(ev);
                            }}
                            className={`px-1.5 py-0.5 rounded font-label-sm text-label-sm truncate cursor-pointer active:scale-[0.97] transition-all ${
                              isTraining
                                ? 'bg-primary/10 text-primary font-code-mono'
                                : isExam
                                ? 'bg-error-container/30 text-error'
                                : 'bg-surface-container text-on-surface-variant'
                            }`}
                            title={ev.title}
                          >
                            {ev.title}
                          </div>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <span className="font-code-mono text-[10px] text-outline">
                          +{dayEvents.length - 3} więcej
                        </span>
                      )}
                    </div>

                    <div />
                  </div>
                );
              })}
            </div>
          </div>
          </div>

          {/* Quick Inline Add Engine: Direct to SQLite WAL & Firestore */}
          <div className="bg-surface-container-low p-space-md rounded-xl space-y-space-sm border border-outline-variant/20 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs font-label-md text-label-md text-on-surface">
                <span className="material-symbols-outlined text-[18px] text-primary">add_circle</span>
                <span className="font-semibold">Szybki Zapis Wydarzenia do Bazy</span>
              </div>
              <div className="flex items-center gap-space-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="font-code-mono text-label-sm text-outline">Pushbullet Target: Pixel 8 Pro</span>
              </div>
            </div>

            <form onSubmit={handleQuickAdd} className="grid grid-cols-1 md:grid-cols-12 gap-space-sm pt-space-xs">
              <div className="md:col-span-4">
                <input
                  type="text"
                  placeholder="Nazwa zadania / wpisu..."
                  required
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline px-space-md py-1.5 rounded-lg font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-primary border border-outline-variant/30"
                />
              </div>

              <div className="md:col-span-3">
                <input
                  type="datetime-local"
                  value={quickDateTime}
                  onChange={(e) => setQuickDateTime(e.target.value)}
                  className="w-full bg-surface-container-lowest text-on-surface-variant px-space-sm py-1.5 rounded-lg font-code-mono text-label-sm focus:outline-none focus:ring-1 focus:ring-primary border border-outline-variant/30"
                />
              </div>

              <div className="md:col-span-3">
                <select
                  value={quickCategory}
                  onChange={(e) => setQuickCategory(e.target.value)}
                  className="w-full bg-surface-container-lowest text-on-surface px-space-sm py-1.5 rounded-lg font-label-md text-label-md focus:outline-none focus:ring-1 focus:ring-primary border border-outline-variant/30"
                >
                  <option value="librus">Edukacja / Librus API</option>
                  <option value="fbw">FBW Trening (Strych)</option>
                  <option value="project">Projekt OmniDash / AI</option>
                  <option value="personal">Termin Osobisty / Matrix</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="w-full py-1.5 bg-surface-container-high hover:bg-surface-bright text-primary font-label-md text-label-md rounded-lg flex items-center justify-center gap-space-xs transition-colors active:scale-[0.97]"
                >
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  <span>Zapisz</span>
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Right Sidebar Inspector Panel (4 of 12 cols on desktop) */}
        <div className="xl:col-span-4 flex flex-col space-y-space-md">
          
          {/* Week Load Analysis Module */}
          <div className="bg-surface-container-low p-space-md rounded-xl space-y-space-md shadow-sm border border-outline-variant/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[18px] text-primary">data_thresholding</span>
                <span className="font-label-md text-label-md font-semibold text-on-surface uppercase tracking-wider">
                  Obciążenie Tygodnia
                </span>
              </div>
              <span className="font-code-mono text-label-sm text-outline">W42 / 2026</span>
            </div>

            {/* Metric Sparkline Counters */}
            <div className="grid grid-cols-3 gap-space-sm">
              <div className="bg-surface-container-lowest p-space-sm rounded-lg flex flex-col items-center justify-center text-center border border-outline-variant/10">
                <span className="font-display-lg text-headline-xl font-bold text-error leading-none">3</span>
                <span className="font-label-sm text-label-sm text-outline mt-1 uppercase tracking-tight">Egzaminy</span>
              </div>
              <div className="bg-surface-container-lowest p-space-sm rounded-lg flex flex-col items-center justify-center text-center border border-outline-variant/10">
                <span className="font-display-lg text-headline-xl font-bold text-primary leading-none">3</span>
                <span className="font-label-sm text-label-sm text-outline mt-1 uppercase tracking-tight">FBW Strych</span>
              </div>
              <div className="bg-surface-container-lowest p-space-sm rounded-lg flex flex-col items-center justify-center text-center border border-outline-variant/10">
                <span className="font-display-lg text-headline-xl font-bold text-secondary leading-none">1</span>
                <span className="font-label-sm text-label-sm text-outline mt-1 uppercase tracking-tight">Milestone AI</span>
              </div>
            </div>

            {/* Weekly Energy Vector Bar */}
            <div className="space-y-1">
              <div className="flex justify-between font-code-mono text-label-sm">
                <span className="text-outline">Współczynnik Napięcia (Kognitywny/Fizyczny)</span>
                <span className="text-on-surface">84%</span>
              </div>
              <div className="w-full h-1.5 bg-surface-container-lowest rounded-full overflow-hidden flex">
                <div className="bg-error h-full" style={{ width: '45%' }} title="Edukacja" />
                <div className="bg-primary h-full" style={{ width: '35%' }} title="Trening" />
                <div className="bg-secondary h-full" style={{ width: '20%' }} title="Projekty" />
              </div>
            </div>
          </div>

          {/* Live Stream: Upcoming 72 Hours */}
          <div className="bg-surface-container-low p-space-md rounded-xl space-y-space-md shadow-sm border border-outline-variant/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[18px] text-secondary">hourglass_top</span>
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
              {horizonEvents.length === 0 ? (
                /* Fallback Demo Items matching Stitch mockup */
                <>
                  <div className="p-space-sm bg-surface-container-lowest rounded-lg hover:bg-surface-container transition-all flex flex-col gap-1 relative overflow-hidden group border border-outline-variant/10">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                    <div className="flex items-center justify-between pl-1">
                      <span className="font-code-mono text-label-sm text-primary font-semibold">Dzisiaj • 17:30 - 18:45</span>
                      <span className="font-code-mono text-[10px] text-outline px-1.5 py-0.2 rounded bg-surface-container-high">FBW-RUTYNA</span>
                    </div>
                    <span className="font-body-md text-body-md font-medium text-on-surface pl-1">FBW Strych (Sesja B)</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant pl-1">Podciąganie z obciążeniem, Dipy, OHP</span>
                  </div>

                  <div className="p-space-sm bg-surface-container-lowest rounded-lg hover:bg-surface-container transition-all flex flex-col gap-1 relative overflow-hidden group border border-outline-variant/10">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-error" />
                    <div className="flex items-center justify-between pl-1">
                      <span className="font-code-mono text-label-sm text-error font-semibold">Jutro • 10:15 - 11:45</span>
                      <span className="font-code-mono text-[10px] text-error px-1.5 py-0.2 rounded bg-error-container/20">LIBRUS EDU</span>
                    </div>
                    <span className="font-body-md text-body-md font-medium text-on-surface pl-1">Kolokwium: Algorytmy i Złożoność</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant pl-1">Sala 204 • Wymagany kalkulator logiczny</span>
                  </div>
                </>
              ) : (
                horizonEvents.map((ev, idx) => (
                  <div
                    key={ev.id || idx}
                    onClick={() => setViewingEvent(ev)}
                    className="p-space-sm bg-surface-container-lowest rounded-lg hover:bg-surface-container transition-all flex flex-col gap-1 relative overflow-hidden group cursor-pointer border border-outline-variant/10"
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                      ev.typeCategory === 'LIBRUS EDU' ? 'bg-error' : 'bg-primary'
                    }`} />
                    <div className="flex items-center justify-between pl-1">
                      <span className="font-code-mono text-label-sm text-primary font-semibold">
                        {ev.event_date || ev.date} • {ev.event_time || ev.time || '12:00'}
                      </span>
                      <span className="font-code-mono text-[10px] text-outline px-1.5 py-0.2 rounded bg-surface-container-high">
                        {ev.typeCategory || ev.category || 'EVENT'}
                      </span>
                    </div>
                    <span className="font-body-md text-body-md font-medium text-on-surface pl-1">
                      {ev.title}
                    </span>
                    {ev.description && (
                      <span className="font-label-sm text-label-sm text-on-surface-variant pl-1 truncate">
                        {ev.description}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* MODAL: DODAJ WYDARZENIE */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-space-md border-b border-outline-variant/20 bg-surface-container flex items-center justify-between">
              <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
                Dodaj Nowe Wydarzenie
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-outline hover:text-on-surface">✕</button>
            </div>
            <form onSubmit={handleAddEvent} className="p-space-lg space-y-space-md">
              <div>
                <label className="font-label-sm text-outline uppercase tracking-wider block mb-1">Nazwa wydarzenia</label>
                <input
                  type="text"
                  required
                  placeholder="np. Kolokwium, Trening FBW, Projekt"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-surface-container px-space-md py-2 rounded-lg font-body-md text-on-surface border border-outline-variant/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-label-sm text-outline uppercase tracking-wider block mb-1">Data</label>
                  <input
                    type="date"
                    required
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    className="w-full bg-surface-container px-space-md py-2 rounded-lg font-code-mono text-on-surface border border-outline-variant/30"
                  />
                </div>
                <div>
                  <label className="font-label-sm text-outline uppercase tracking-wider block mb-1">Godzina</label>
                  <input
                    type="time"
                    value={formData.event_time}
                    onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                    className="w-full bg-surface-container px-space-md py-2 rounded-lg font-code-mono text-on-surface border border-outline-variant/30"
                  />
                </div>
              </div>

              <div>
                <label className="font-label-sm text-outline uppercase tracking-wider block mb-1">Kategoria</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-surface-container px-space-md py-2 rounded-lg font-body-md text-on-surface border border-outline-variant/30"
                >
                  <option value="FBW Trening">FBW Trening</option>
                  <option value="Edukacja">Edukacja / Librus</option>
                  <option value="Projekt">Projekt OmniDash</option>
                  <option value="Spotkanie">Spotkanie</option>
                  <option value="Termin Osobisty">Termin Osobisty</option>
                </select>
              </div>

              <div>
                <label className="font-label-sm text-outline uppercase tracking-wider block mb-1">Opis / Notatka</label>
                <textarea
                  rows="3"
                  placeholder="Szczegóły..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-surface-container px-space-md py-2 rounded-lg font-body-md text-on-surface border border-outline-variant/30"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface font-label-md"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-space-md py-2 rounded-lg bg-primary text-on-primary font-label-md font-semibold"
                >
                  Zapisz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: INSPEKTOR WYDARZENIA */}
      {viewingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-space-md border-b border-outline-variant/20 bg-surface-container flex items-center justify-between">
              <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
                Szczegóły Terminu
              </h3>
              <button onClick={() => setViewingEvent(null)} className="text-outline hover:text-on-surface">✕</button>
            </div>
            <div className="p-space-lg space-y-space-md">
              <h4 className="font-headline-md text-headline-md font-bold text-primary">
                {viewingEvent.title}
              </h4>
              <div className="grid grid-cols-2 gap-2 text-label-sm font-code-mono">
                <div>
                  <span className="text-outline uppercase text-[10px] block">Data &amp; Czas</span>
                  <span className="text-on-surface">{viewingEvent.event_date || viewingEvent.date} {viewingEvent.event_time || viewingEvent.time || ''}</span>
                </div>
                <div>
                  <span className="text-outline uppercase text-[10px] block">Kategoria</span>
                  <span className="text-secondary">{viewingEvent.category || 'Ogólne'}</span>
                </div>
              </div>
              {viewingEvent.description && (
                <p className="p-space-sm bg-surface-container rounded-lg font-body-md text-on-surface-variant">
                  {viewingEvent.description}
                </p>
              )}
              <div className="flex justify-between items-center pt-2">
                {viewingEvent.source === 'personal' && (
                  <button
                    onClick={() => handleDeleteEvent(viewingEvent.id)}
                    className="px-space-md py-1.5 rounded-lg bg-error-container/30 text-error font-label-md hover:bg-error-container/50"
                  >
                    Usuń
                  </button>
                )}
                <button
                  onClick={() => setViewingEvent(null)}
                  className="px-space-md py-1.5 rounded-lg bg-surface-container text-on-surface font-label-md ml-auto"
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
