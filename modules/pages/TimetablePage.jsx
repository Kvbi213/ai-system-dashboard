import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  GraduationCap, Plus, Trash2, Edit2, Clock, MapPin, User, 
  Search, Filter, Calendar, BookOpen, ChevronRight, Copy, 
  Sparkles, CheckCircle, AlertCircle, LayoutGrid, List, RefreshCw
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { subscribeCollection, saveCloudDocument, deleteCloudDocument, CLOUD_COLLECTIONS } from '../services/cloudSync';

const DAYS = [
  { id: 'monday', label: 'Poniedziałek', short: 'Pon', dayIndex: 1 },
  { id: 'tuesday', label: 'Wtorek', short: 'Wt', dayIndex: 2 },
  { id: 'wednesday', label: 'Środa', short: 'Śr', dayIndex: 3 },
  { id: 'thursday', label: 'Czwartek', short: 'Czw', dayIndex: 4 },
  { id: 'friday', label: 'Piątek', short: 'Pt', dayIndex: 5 },
  { id: 'saturday', label: 'Sobota', short: 'Sob', dayIndex: 6 },
  { id: 'sunday', label: 'Niedziela', short: 'Nd', dayIndex: 0 },
];

const LESSON_TYPES = [
  { id: 'Wykład', label: 'Wykład', defaultColor: 'indigo' },
  { id: 'Laboratorium', label: 'Laboratorium', defaultColor: 'emerald' },
  { id: 'Ćwiczenia', label: 'Ćwiczenia', defaultColor: 'cyan' },
  { id: 'Projekt', label: 'Projekt', defaultColor: 'purple' },
  { id: 'Seminarium', label: 'Seminarium', defaultColor: 'rose' },
  { id: 'Lektorat', label: 'Lektorat', defaultColor: 'amber' },
  { id: 'Konsultacje', label: 'Konsultacje', defaultColor: 'blue' },
  { id: 'Inne', label: 'Inne', defaultColor: 'slate' },
];

const COLOR_MAP = {
  indigo: {
    badge: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    border: 'border-indigo-500/40',
    glow: 'shadow-[0_0_15px_rgba(99,102,241,0.15)]',
    dot: 'bg-indigo-400'
  },
  emerald: {
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    border: 'border-emerald-500/40',
    glow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]',
    dot: 'bg-emerald-400'
  },
  cyan: {
    badge: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    border: 'border-cyan-500/40',
    glow: 'shadow-[0_0_15px_rgba(6,182,212,0.15)]',
    dot: 'bg-cyan-400'
  },
  purple: {
    badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    border: 'border-purple-500/40',
    glow: 'shadow-[0_0_15px_rgba(168,85,247,0.15)]',
    dot: 'bg-purple-400'
  },
  amber: {
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    border: 'border-amber-500/40',
    glow: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]',
    dot: 'bg-amber-400'
  },
  rose: {
    badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    border: 'border-rose-500/40',
    glow: 'shadow-[0_0_15px_rgba(244,63,94,0.15)]',
    dot: 'bg-rose-400'
  },
  blue: {
    badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    border: 'border-blue-500/40',
    glow: 'shadow-[0_0_15px_rgba(59,130,246,0.15)]',
    dot: 'bg-blue-400'
  },
  slate: {
    badge: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    border: 'border-slate-500/40',
    glow: 'shadow-none',
    dot: 'bg-slate-400'
  }
};

const TimetablePage = () => {
  const { t } = useTranslation();

  const [lessons, setLessons] = useState([]);
  const [selectedDay, setSelectedDay] = useState('all'); // 'all' | 'monday' | ...
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'grid'
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);

  const [formData, setFormData] = useState({
    day: 'monday',
    subject: '',
    time_start: '08:00',
    time_end: '09:30',
    room: '',
    teacher: '',
    type: 'Wykład',
    color: 'indigo',
    notes: ''
  });

  // Zegar systemowy do dynamicznego sprawdzania trwających lekcji
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // 1. Subskrypcja Cloud Firestore
  useEffect(() => {
    const unsub = subscribeCollection(CLOUD_COLLECTIONS.TIMETABLE || 'timetable', (data) => {
      if (Array.isArray(data)) {
        setLessons(data);
      }
    });

    // Fallback Express jeśli działa
    axios.get('/api/timetable')
      .then(res => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setLessons(prev => {
            const map = new Map(prev.map(item => [String(item.id), item]));
            res.data.forEach(item => map.set(String(item.id), item));
            return Array.from(map.values());
          });
        }
      })
      .catch(() => {});

    return () => unsub();
  }, []);

  // Określenie dzisiejszego dnia
  const todayDayId = useMemo(() => {
    const dayNum = currentTime.getDay(); // 0 = nd, 1 = pon...
    const match = DAYS.find(d => d.dayIndex === dayNum);
    return match ? match.id : 'monday';
  }, [currentTime]);

  const currentMinutes = useMemo(() => {
    return currentTime.getHours() * 60 + currentTime.getMinutes();
  }, [currentTime]);

  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  // Obliczenie aktualnie trwającej lekcji i następnej dzisiaj
  const { activeLesson, nextLesson } = useMemo(() => {
    const todayLessons = lessons
      .filter(l => l.day === todayDayId)
      .sort((a, b) => parseTimeToMinutes(a.time_start) - parseTimeToMinutes(b.time_start));

    let active = null;
    let next = null;

    for (const l of todayLessons) {
      const start = parseTimeToMinutes(l.time_start);
      const end = parseTimeToMinutes(l.time_end);
      if (currentMinutes >= start && currentMinutes <= end) {
        active = l;
      } else if (currentMinutes < start && !next) {
        next = l;
      }
    }

    return { activeLesson: active, nextLesson: next };
  }, [lessons, todayDayId, currentMinutes]);

  // Statystyki tygodniowe
  const stats = useMemo(() => {
    const totalLessons = lessons.length;
    let totalMinutes = 0;
    const subjects = new Set();

    lessons.forEach(l => {
      const dur = Math.max(0, parseTimeToMinutes(l.time_end) - parseTimeToMinutes(l.time_start));
      totalMinutes += dur;
      if (l.subject) subjects.add(l.subject.trim());
    });

    const hours = (totalMinutes / 60).toFixed(1);
    const todayCount = lessons.filter(l => l.day === todayDayId).length;

    return {
      totalLessons,
      totalHours: hours,
      uniqueSubjects: subjects.size,
      todayCount
    };
  }, [lessons, todayDayId]);

  // Filtrowanie lekcji
  const filteredLessons = useMemo(() => {
    return lessons
      .filter(l => {
        if (selectedDay !== 'all' && l.day !== selectedDay) return false;
        if (typeFilter !== 'all' && l.type !== typeFilter) return false;
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          const matchSubject = l.subject?.toLowerCase().includes(q);
          const matchRoom = l.room?.toLowerCase().includes(q);
          const matchTeacher = l.teacher?.toLowerCase().includes(q);
          const matchNotes = l.notes?.toLowerCase().includes(q);
          if (!matchSubject && !matchRoom && !matchTeacher && !matchNotes) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const dayA = DAYS.findIndex(d => d.id === a.day);
        const dayB = DAYS.findIndex(d => d.id === b.day);
        if (dayA !== dayB) return dayA - dayB;
        return parseTimeToMinutes(a.time_start) - parseTimeToMinutes(b.time_start);
      });
  }, [lessons, selectedDay, typeFilter, searchQuery]);

  const handleOpenAddModal = (defaultDay = 'monday') => {
    setEditingLesson(null);
    setFormData({
      day: selectedDay !== 'all' ? selectedDay : defaultDay,
      subject: '',
      time_start: '08:00',
      time_end: '09:30',
      room: '',
      teacher: '',
      type: 'Wykład',
      color: 'indigo',
      notes: ''
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (lesson) => {
    setEditingLesson(lesson);
    setFormData({
      day: lesson.day || 'monday',
      subject: lesson.subject || '',
      time_start: lesson.time_start || '08:00',
      time_end: lesson.time_end || '09:30',
      room: lesson.room || '',
      teacher: lesson.teacher || '',
      type: lesson.type || 'Wykład',
      color: lesson.color || 'indigo',
      notes: lesson.notes || ''
    });
    setShowModal(true);
  };

  const handleDuplicate = async (lesson) => {
    const nextDayMap = {
      monday: 'tuesday',
      tuesday: 'wednesday',
      wednesday: 'thursday',
      thursday: 'friday',
      friday: 'monday',
      saturday: 'sunday',
      sunday: 'monday'
    };
    const targetDay = nextDayMap[lesson.day] || 'monday';
    const newLesson = {
      ...lesson,
      id: 't_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      day: targetDay,
      created_at: new Date().toISOString()
    };

    setLessons(prev => [...prev, newLesson]);
    await saveCloudDocument('timetable', newLesson.id, newLesson);
    try { await axios.post('/api/timetable', newLesson); } catch {}
  };

  const handleDelete = async (id) => {
    const idStr = String(id);
    if (!window.confirm('Czy na pewno chcesz usunąć te zajęcia z planu?')) return;
    setLessons(prev => prev.filter(l => String(l.id) !== idStr));
    await deleteCloudDocument('timetable', idStr);
    try { await axios.delete(`/api/timetable/${idStr}`); } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject.trim()) return;

    const lessonPayload = {
      ...formData,
      id: editingLesson ? String(editingLesson.id) : 't_' + Date.now(),
      updated_at: new Date().toISOString()
    };

    if (editingLesson) {
      setLessons(prev => prev.map(l => String(l.id) === String(editingLesson.id) ? lessonPayload : l));
    } else {
      setLessons(prev => [...prev, lessonPayload]);
    }

    setShowModal(false);
    await saveCloudDocument('timetable', lessonPayload.id, lessonPayload);
    try {
      if (editingLesson) {
        await axios.put(`/api/timetable/${lessonPayload.id}`, lessonPayload);
      } else {
        await axios.post('/api/timetable', lessonPayload);
      }
    } catch {}
  };

  return (
    <div className="flex flex-col h-full gap-5 pb-20 md:pb-0 font-sans">
      {/* 1. Header Bar */}
      <header className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accentPrimary/20 border border-accentPrimary/40 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(var(--color-accent-primary),0.2)]">
            <GraduationCap className="w-6 h-6 text-accentPrimary" />
          </div>
          <div>
            <nav aria-label="breadcrumb" className="flex items-center space-x-2 text-sm text-textMuted mb-0.5">
              <span className="text-sm font-medium text-textMuted/70">OmniDash</span>
              <span className="text-sm font-medium text-textMuted/70">/</span>
              <span className="text-sm font-medium text-textPrimary">Harmonogram</span>
            </nav>
            <h1 className="text-xl md:text-2xl font-bold text-textPrimary tracking-tight flex items-center gap-2">
              Plan Lekcji & Zajęć
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-accentPrimary/10 text-accentPrimary border border-accentPrimary/30">
                LIVE FIRESTORE
              </span>
            </h1>
            <p className="text-xs text-textMuted mt-0.5">
              Tygodniowy rozkład zajęć akademickich i dydaktycznych ze statystykami i powiadomieniami na żywo.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center bg-surface border border-white/10 rounded-xl p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${viewMode === 'cards' ? 'bg-accentPrimary/20 text-accentPrimary shadow-sm' : 'text-textMuted hover:text-textPrimary'}`}
              title="Widok kart"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Karty</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${viewMode === 'grid' ? 'bg-accentPrimary/20 text-accentPrimary shadow-sm' : 'text-textMuted hover:text-textPrimary'}`}
              title="Widok siatki tygodniowej"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Siatka</span>
            </button>
          </div>

          <button
            onClick={() => handleOpenAddModal(selectedDay !== 'all' ? selectedDay : 'monday')}
            className="flex items-center gap-2 px-4 py-2.5 bg-accentPrimary text-background font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(var(--color-accent-primary),0.3)] hover:brightness-110 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            Dodaj Lekcję
          </button>
        </div>
      </header>

      {/* 2. Statystyki & Trwające Zajęcia (Live Tracker) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-shrink-0">
        {/* Live Class Tracker */}
        <div className="md:col-span-2 glass-panel p-4 rounded-xl border border-white/10 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-surface/80 to-surface/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${activeLesson ? 'bg-emerald-400 animate-ping' : 'bg-accentPrimary'}`}></span>
              <span className="text-xs font-mono font-bold tracking-wider text-textMuted uppercase">
                {activeLesson ? '🟢 TRWAJĄCE ZAJĘCIA' : (nextLesson ? '⏱️ NAJBLIŻSZE ZAJĘCIA DZISIAJ' : '🏖️ BRAK ZAJĘĆ W TEJ CHWILI')}
              </span>
            </div>
            <span className="text-[11px] font-mono text-textMuted">
              {currentTime.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })} • {DAYS.find(d => d.id === todayDayId)?.label}
            </span>
          </div>

          {activeLesson ? (
            <div className="my-1">
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-bold text-textPrimary tracking-tight">{activeLesson.subject}</h3>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {activeLesson.time_start} - {activeLesson.time_end}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-textMuted mt-1">
                {activeLesson.room && (
                  <span className="flex items-center gap-1 text-accentPrimary">
                    <MapPin className="w-3.5 h-3.5" /> {activeLesson.room}
                  </span>
                )}
                {activeLesson.teacher && (
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" /> {activeLesson.teacher}
                  </span>
                )}
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
                  {activeLesson.type}
                </span>
              </div>
            </div>
          ) : nextLesson ? (
            <div className="my-1">
              <div className="flex items-baseline justify-between">
                <h3 className="text-base font-bold text-textPrimary tracking-tight">{nextLesson.subject}</h3>
                <span className="text-xs font-mono font-semibold text-accentPrimary">
                  Rozpoczęcie o {nextLesson.time_start}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-textMuted mt-1">
                {nextLesson.room && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {nextLesson.room}
                  </span>
                )}
                {nextLesson.teacher && (
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" /> {nextLesson.teacher}
                  </span>
                )}
                <span className="px-2 py-0.5 rounded bg-surface border border-white/10 text-[10px] font-mono">
                  {nextLesson.type}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-textMuted my-1">
              Wszystkie dzisiejsze zajęcia zostały zakończone lub brak zaplanowanych bloków na dziś.
            </p>
          )}

          <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-textMuted">
            <span>Dzisiejszy dzień: <strong className="text-textPrimary">{stats.todayCount} zajęć</strong></span>
            <button 
              onClick={() => setSelectedDay(todayDayId)} 
              className="text-accentPrimary hover:underline flex items-center gap-1 font-mono text-[10px]"
            >
              Pokaż dzisiejszy plan <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Mini stat 1 */}
        <div className="glass-panel p-4 rounded-xl border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-textMuted text-xs">
            <span>Godziny w tygodniu</span>
            <Clock className="w-4 h-4 text-accentPrimary" />
          </div>
          <div className="my-2">
            <span className="text-2xl font-bold font-mono text-textPrimary">{stats.totalHours}</span>
            <span className="text-xs text-textMuted ml-1.5">godzin zegarowych</span>
          </div>
          <div className="text-[10px] text-textMuted font-mono">
            {stats.totalLessons} bloków dydaktycznych
          </div>
        </div>

        {/* Mini stat 2 */}
        <div className="glass-panel p-4 rounded-xl border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-textMuted text-xs">
            <span>Przedmioty Dydaktyczne</span>
            <BookOpen className="w-4 h-4 text-accentPrimary" />
          </div>
          <div className="my-2">
            <span className="text-2xl font-bold font-mono text-textPrimary">{stats.uniqueSubjects}</span>
            <span className="text-xs text-textMuted ml-1.5">unikalnych kursów</span>
          </div>
          <div className="text-[10px] text-textMuted font-mono">
            Synchronizacja z Cloud Firestore
          </div>
        </div>
      </div>

      {/* 3. Pasek Nawigacji Dni i Filtrów */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between flex-shrink-0">
        {/* Zakładki Dni */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          <button
            onClick={() => setSelectedDay('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedDay === 'all'
                ? 'bg-accentPrimary text-background shadow-[0_0_12px_rgba(var(--color-accent-primary),0.3)]'
                : 'bg-surface/80 hover:bg-surface border border-white/10 text-textMuted hover:text-textPrimary'
            }`}
          >
            Cały Tydzień
          </button>
          {DAYS.map(d => {
            const isToday = d.id === todayDayId;
            const isSelected = selectedDay === d.id;
            const dayLessonsCount = lessons.filter(l => l.day === d.id).length;

            return (
              <button
                key={d.id}
                onClick={() => setSelectedDay(d.id)}
                className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-all relative ${
                  isSelected
                    ? 'bg-accentPrimary text-background font-bold shadow-[0_0_12px_rgba(var(--color-accent-primary),0.3)]'
                    : 'bg-surface/80 hover:bg-surface border border-white/10 text-textMuted hover:text-textPrimary'
                }`}
              >
                <span>{d.label}</span>
                {dayLessonsCount > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-black/30 text-background' : 'bg-white/10 text-textMuted'
                  }`}>
                    {dayLessonsCount}
                  </span>
                )}
                {isToday && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute top-1.5 right-1.5"></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Wyszukiwarka i filtr typu */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-textMuted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Szukaj przedmiotu, sali..."
              className="w-full bg-surface border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-textPrimary placeholder:text-textMuted/60 focus:outline-none focus:border-accentPrimary transition-colors"
            />
          </div>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="bg-surface border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-textPrimary focus:outline-none focus:border-accentPrimary transition-colors"
          >
            <option value="all">Wszystkie typy</option>
            {LESSON_TYPES.map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. Główny Widok Lekcji (Karty lub Siatka Tygodniowa) */}
      <main className="flex-1 min-h-0 overflow-y-auto pr-1">
        {filteredLessons.length === 0 ? (
          <div className="h-64 rounded-2xl border border-dashed border-white/15 flex flex-col items-center justify-center text-center p-6 bg-surface/20">
            <BookOpen className="w-10 h-10 text-textMuted/40 mb-3" />
            <h3 className="text-sm font-bold text-textPrimary mb-1">Brak zaplanowanych zajęć</h3>
            <p className="text-xs text-textMuted max-w-sm mb-4">
              {searchQuery || typeFilter !== 'all' 
                ? 'Żadne lekcje nie spełniają kryteriów wyszukiwania.'
                : 'Dla wybranego dnia nie skonfigurowano jeszcze lekcji. Dodaj pierwszy przedmiot do planu.'}
            </p>
            <button
              onClick={() => handleOpenAddModal(selectedDay !== 'all' ? selectedDay : 'monday')}
              className="px-4 py-2 bg-accentPrimary/20 hover:bg-accentPrimary/30 border border-accentPrimary/40 text-accentPrimary font-semibold text-xs rounded-xl flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Dodaj Lekcję Teraz
            </button>
          </div>
        ) : viewMode === 'cards' ? (
          /* Widok Kart / Osi Czasu */
          <div className="space-y-6">
            {DAYS.filter(d => selectedDay === 'all' || selectedDay === d.id).map(day => {
              const dayItems = filteredLessons.filter(l => l.day === day.id);
              if (dayItems.length === 0 && selectedDay === 'all') return null;

              return (
                <div key={day.id} className="space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-textPrimary font-sans uppercase tracking-wider">
                        {day.label}
                      </h2>
                      {day.id === todayDayId && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          DZISIAJ
                        </span>
                      )}
                      <span className="text-xs font-mono text-textMuted">
                        ({dayItems.length} {dayItems.length === 1 ? 'lekcja' : 'lekcje'})
                      </span>
                    </div>

                    <button
                      onClick={() => handleOpenAddModal(day.id)}
                      className="text-[11px] text-accentPrimary hover:underline flex items-center gap-1 font-mono"
                    >
                      <Plus className="w-3.5 h-3.5" /> Dodaj do tego dnia
                    </button>
                  </div>

                  {dayItems.length === 0 ? (
                    <div className="py-6 text-center text-xs text-textMuted/50 border border-dashed border-white/5 rounded-xl">
                      Brak zajęć w tym dniu.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {dayItems.map(lesson => {
                        const style = COLOR_MAP[lesson.color] || COLOR_MAP.indigo;
                        const isNow = lesson.day === todayDayId && 
                          currentMinutes >= parseTimeToMinutes(lesson.time_start) && 
                          currentMinutes <= parseTimeToMinutes(lesson.time_end);
                        const duration = Math.max(0, parseTimeToMinutes(lesson.time_end) - parseTimeToMinutes(lesson.time_start));

                        return (
                          <div
                            key={lesson.id}
                            className={`glass-panel p-4 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 relative group flex flex-col justify-between ${
                              isNow 
                                ? 'border-emerald-500/70 shadow-[0_0_20px_rgba(16,185,129,0.2)] bg-emerald-950/10' 
                                : `${style.border} ${style.glow} hover:border-white/30`
                            }`}
                          >
                            <div>
                              {/* Pasek górny karty */}
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-1.5">
                                  <span className={`w-2 h-2 rounded-full ${style.dot}`}></span>
                                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-semibold ${style.badge}`}>
                                    {lesson.type || 'Zajęcia'}
                                  </span>
                                  {isNow && (
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500 text-background font-bold animate-pulse">
                                      LIVE
                                    </span>
                                  )}
                                </div>

                                <span className="text-xs font-mono text-textMuted">
                                  {duration} min
                                </span>
                              </div>

                              {/* Godziny i Tytuł */}
                              <div className="flex items-baseline gap-2 mb-1.5">
                                <Clock className="w-3.5 h-3.5 text-accentPrimary shrink-0" />
                                <span className="text-xs font-mono font-bold text-accentPrimary tracking-wider">
                                  {lesson.time_start} - {lesson.time_end}
                                </span>
                              </div>

                              <h3 className="text-base font-bold text-textPrimary tracking-tight leading-snug mb-3">
                                {lesson.subject}
                              </h3>

                              {/* Metadane (Sala, Prowadzący) */}
                              <div className="space-y-1 text-xs text-textMuted mb-3">
                                {lesson.room && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-3.5 h-3.5 text-textMuted/70 shrink-0" />
                                    <span className="font-mono text-textPrimary/90">{lesson.room}</span>
                                  </div>
                                )}
                                {lesson.teacher && (
                                  <div className="flex items-center gap-2">
                                    <User className="w-3.5 h-3.5 text-textMuted/70 shrink-0" />
                                    <span>{lesson.teacher}</span>
                                  </div>
                                )}
                              </div>

                              {/* Notatki */}
                              {lesson.notes && (
                                <div className="p-2 rounded-lg bg-black/25 border border-white/5 text-[11px] text-textMuted mb-3 font-mono leading-relaxed">
                                  {lesson.notes}
                                </div>
                              )}
                            </div>

                            {/* Pasek akcji */}
                            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                              <span className="text-[10px] font-mono text-textMuted/60">
                                ID: {String(lesson.id).slice(-4)}
                              </span>

                              <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleDuplicate(lesson)}
                                  className="p-1.5 text-textMuted hover:text-accentPrimary hover:bg-white/5 rounded-lg transition-colors"
                                  title="Duplikuj do następnego dnia"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleOpenEditModal(lesson)}
                                  className="p-1.5 text-textMuted hover:text-cyan-400 hover:bg-white/5 rounded-lg transition-colors"
                                  title="Edytuj lekcję"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(lesson.id)}
                                  className="p-1.5 text-textMuted hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                                  title="Usuń z planu"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Widok Siatki Tygodniowej (Tabela Dni Pon-Pt/Nd) */
          <div className="grid grid-cols-1 md:grid-cols-5 lg:grid-cols-7 gap-3 min-w-[700px]">
            {DAYS.map(day => {
              const dayLessons = filteredLessons.filter(l => l.day === day.id);
              const isToday = day.id === todayDayId;

              return (
                <div 
                  key={day.id} 
                  className={`glass-panel p-3 rounded-xl border flex flex-col h-full min-h-[420px] ${
                    isToday ? 'border-accentPrimary/50 bg-accentPrimary/5' : 'border-white/10 bg-surface/30'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                    <div>
                      <span className="font-bold text-xs text-textPrimary uppercase block">{day.short}</span>
                      <span className="text-[10px] text-textMuted">{day.label}</span>
                    </div>
                    {isToday && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    )}
                  </div>

                  <div className="space-y-2 flex-1 overflow-y-auto pr-0.5 no-scrollbar">
                    {dayLessons.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-2 text-textMuted/40 text-[11px]">
                        Brak
                      </div>
                    ) : (
                      dayLessons.map(lesson => {
                        const style = COLOR_MAP[lesson.color] || COLOR_MAP.indigo;
                        return (
                          <div
                            key={lesson.id}
                            onClick={() => handleOpenEditModal(lesson)}
                            className={`p-2 rounded-lg border text-left cursor-pointer transition-all hover:scale-[1.02] ${style.badge} ${style.border}`}
                          >
                            <div className="text-[10px] font-mono font-bold opacity-80 mb-0.5">
                              {lesson.time_start} - {lesson.time_end}
                            </div>
                            <div className="text-xs font-bold text-textPrimary line-clamp-2 leading-tight">
                              {lesson.subject}
                            </div>
                            {lesson.room && (
                              <div className="text-[10px] text-textMuted font-mono mt-1 flex items-center gap-1">
                                <MapPin className="w-2.5 h-2.5 shrink-0" /> {lesson.room}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  <button
                    onClick={() => handleOpenAddModal(day.id)}
                    className="w-full mt-2 py-1.5 rounded-lg border border-dashed border-white/10 hover:border-accentPrimary/50 hover:bg-accentPrimary/10 text-textMuted hover:text-accentPrimary text-[11px] font-mono flex items-center justify-center gap-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Dodaj
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 5. Modal Dodawania / Edycji Lekcji */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-lg rounded-2xl border border-white/20 p-6 shadow-2xl relative bg-surface/95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-accentPrimary/20 border border-accentPrimary/30 flex items-center justify-center text-accentPrimary">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-textPrimary">
                  {editingLesson ? 'Edycja Lekcji w Planie' : 'Nowa Lekcja / Zajęcia'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-textMuted hover:text-textPrimary text-sm font-mono p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Przedmiot */}
              <div>
                <label className="block text-textMuted font-medium mb-1">Nazwa Przedmiotu / Kursu *</label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="np. Architektura Systemów AI, Matematyka Dyskretna..."
                  className="w-full bg-black/30 border border-white/15 rounded-xl px-3 py-2 text-textPrimary focus:outline-none focus:border-accentPrimary transition-colors"
                />
              </div>

              {/* Dzień tygodnia i Typ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-textMuted font-medium mb-1">Dzień Tygodnia</label>
                  <select
                    value={formData.day}
                    onChange={e => setFormData({ ...formData, day: e.target.value })}
                    className="w-full bg-black/30 border border-white/15 rounded-xl px-3 py-2 text-textPrimary focus:outline-none focus:border-accentPrimary transition-colors"
                  >
                    {DAYS.map(d => (
                      <option key={d.id} value={d.id}>{d.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-textMuted font-medium mb-1">Typ Zajęć</label>
                  <select
                    value={formData.type}
                    onChange={e => {
                      const selectedT = LESSON_TYPES.find(t => t.id === e.target.value);
                      setFormData({ 
                        ...formData, 
                        type: e.target.value,
                        color: selectedT ? selectedT.defaultColor : formData.color
                      });
                    }}
                    className="w-full bg-black/30 border border-white/15 rounded-xl px-3 py-2 text-textPrimary focus:outline-none focus:border-accentPrimary transition-colors"
                  >
                    {LESSON_TYPES.map(t => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Godziny Rozpoczęcia i Zakończenia */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-textMuted font-medium mb-1">Godzina Rozpoczęcia</label>
                  <input
                    type="time"
                    required
                    value={formData.time_start}
                    onChange={e => setFormData({ ...formData, time_start: e.target.value })}
                    className="w-full bg-black/30 border border-white/15 rounded-xl px-3 py-2 text-textPrimary font-mono focus:outline-none focus:border-accentPrimary transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-textMuted font-medium mb-1">Godzina Zakończenia</label>
                  <input
                    type="time"
                    required
                    value={formData.time_end}
                    onChange={e => setFormData({ ...formData, time_end: e.target.value })}
                    className="w-full bg-black/30 border border-white/15 rounded-xl px-3 py-2 text-textPrimary font-mono focus:outline-none focus:border-accentPrimary transition-colors"
                  />
                </div>
              </div>

              {/* Sala i Prowadzący */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-textMuted font-medium mb-1">Sala / Budynek</label>
                  <input
                    type="text"
                    value={formData.room}
                    onChange={e => setFormData({ ...formData, room: e.target.value })}
                    placeholder="np. Sala 104, Lab AI 2..."
                    className="w-full bg-black/30 border border-white/15 rounded-xl px-3 py-2 text-textPrimary focus:outline-none focus:border-accentPrimary transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-textMuted font-medium mb-1">Prowadzący / Nauczyciel</label>
                  <input
                    type="text"
                    value={formData.teacher}
                    onChange={e => setFormData({ ...formData, teacher: e.target.value })}
                    placeholder="np. prof. dr hab. Jan Nowak"
                    className="w-full bg-black/30 border border-white/15 rounded-xl px-3 py-2 text-textPrimary focus:outline-none focus:border-accentPrimary transition-colors"
                  />
                </div>
              </div>

              {/* Kolor Akcentu */}
              <div>
                <label className="block text-textMuted font-medium mb-1.5">Kolor Wyróżnienia</label>
                <div className="flex items-center gap-2">
                  {Object.keys(COLOR_MAP).map(cKey => (
                    <button
                      key={cKey}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: cKey })}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${COLOR_MAP[cKey].dot} ${
                        formData.color === cKey ? 'scale-125 border-white ring-2 ring-accentPrimary/40' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                      title={cKey}
                    />
                  ))}
                </div>
              </div>

              {/* Notatki */}
              <div>
                <label className="block text-textMuted font-medium mb-1">Notatki / Linki / Sylabus</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="np. Wymagane materiały, hasło do sali wirtualnej, tematyka..."
                  className="w-full bg-black/30 border border-white/15 rounded-xl p-3 text-textPrimary focus:outline-none focus:border-accentPrimary transition-colors resize-none"
                />
              </div>

              {/* Przyciski Modala */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-textMuted hover:text-textPrimary transition-colors"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-accentPrimary text-background font-bold rounded-xl shadow-[0_0_12px_rgba(var(--color-accent-primary),0.3)] hover:brightness-110 transition-all"
                >
                  {editingLesson ? 'Zapisz Zmiany' : 'Dodaj do Planu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetablePage;
