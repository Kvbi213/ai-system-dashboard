import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  GraduationCap, Plus, Trash2, Edit2, Clock, MapPin, User, 
  Search, Filter, Calendar, BookOpen, ChevronRight, Copy, 
  Sparkles, CheckCircle, AlertCircle, LayoutGrid, List, RefreshCw,
  AlertTriangle, UserX, CheckCircle2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { subscribeCollection, saveCloudDocument, deleteCloudDocument, CLOUD_COLLECTIONS, isCloudEnvironment } from '../services/cloudSync';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { firestore } from '../firebaseClient.js';
import { 
  resolveFullTeacherName, 
  cleanTeacherName, 
  matchTeacherNames 
} from '../services/teacherUtils.js';

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

const STATIC_DEMO_ABSENCE_EVENTS = [
  {
    id: 9003,
    date: '2026-09-24',
    type: 'absence',
    category: 'Nieobecność nauczyciela',
    title: 'Nieobecność: Negowska Alicja',
    teacher: 'Negowska Alicja',
    time: '08:50 do 14:50',
    description: 'Nieobecność nauczyciela: Negowska Alicja (08:50 do 14:50)'
  },
  {
    id: 9004,
    date: '2026-09-23',
    type: 'absence',
    category: 'Nieobecność nauczyciela',
    title: 'Nieobecność: Wojnarowski Przemysław',
    teacher: 'Wojnarowski Przemysław',
    time: '12:20 do 15:40',
    description: 'Nieobecność nauczyciela: Wojnarowski Przemysław (12:20 do 15:40)'
  }
];

const STATIC_DEMO_TIMETABLE_LESSONS = [
  // Poniedziałek
  { id: 'librus_mon_1', day: 'monday', subject: 'Informatyka', time_start: '08:50', time_end: '09:35', room: 's. 17', teacher: 'Becker Adam', cleanTeacher: 'Becker Adam', type: 'Laboratorium', color: 'cyan', notes: 'Pracownia informatyczna', isLibrus: true },
  { id: 'librus_mon_2', day: 'monday', subject: 'Informatyka', time_start: '09:40', time_end: '10:25', room: 's. 17', teacher: 'Becker Adam', cleanTeacher: 'Becker Adam', type: 'Laboratorium', color: 'cyan', notes: 'Pracownia informatyczna', isLibrus: true },
  { id: 'librus_mon_3', day: 'monday', subject: 'Chemia', time_start: '10:40', time_end: '11:25', room: 's. 31', teacher: 'Kolasińska Paulina', cleanTeacher: 'Kolasińska Paulina', type: 'Wykład', color: 'emerald', notes: '', isLibrus: true },
  { id: 'librus_mon_4', day: 'monday', subject: 'Edukacja zdrowotna', time_start: '11:30', time_end: '12:15', room: 's. 38', teacher: 'Spych Monika', cleanTeacher: 'Spych Monika', type: 'Wykład', color: 'emerald', notes: '', isLibrus: true },
  { id: 'librus_mon_5', day: 'monday', subject: 'Systemy operacyjne', time_start: '12:20', time_end: '13:05', room: 's. 1.16', teacher: 'Wojnarowski Przemysław', cleanTeacher: 'Wojnarowski Przemysław', type: 'Laboratorium', color: 'cyan', notes: 'Teoria i architektura systemów', isLibrus: true },
  { id: 'librus_mon_6', day: 'monday', subject: 'Systemy operacyjne', time_start: '13:15', time_end: '14:00', room: 's. 1.16', teacher: 'Wojnarowski Przemysław', cleanTeacher: 'Wojnarowski Przemysław', type: 'Laboratorium', color: 'cyan', notes: 'Warsztaty praktyczne', isLibrus: true },

  // Wtorek
  { id: 'librus_tue_1', day: 'tuesday', subject: 'Pracownia urządzeń techniki komputerowej', time_start: '08:00', time_end: '08:45', room: 's. 1.16', teacher: 'Wojnarowski Przemysław', cleanTeacher: 'Wojnarowski Przemysław', type: 'Laboratorium', color: 'cyan', notes: 'Grupa 1', isLibrus: true },
  { id: 'librus_tue_2', day: 'tuesday', subject: 'Pracownia urządzeń techniki komputerowej', time_start: '08:50', time_end: '09:35', room: 's. 1.16', teacher: 'Wojnarowski Przemysław', cleanTeacher: 'Wojnarowski Przemysław', type: 'Laboratorium', color: 'cyan', notes: 'Grupa 1', isLibrus: true },
  { id: 'librus_tue_3', day: 'tuesday', subject: 'Zajęcia z wychowawcą', time_start: '09:40', time_end: '10:25', room: 's. 1.16', teacher: 'Ziemba Joanna', cleanTeacher: 'Ziemba Joanna', type: 'Wykład', color: 'amber', notes: 'Godzina wychowawcza', isLibrus: true },
  { id: 'librus_tue_4', day: 'tuesday', subject: 'Wychowanie fizyczne', time_start: '10:40', time_end: '11:25', room: 's. WF', teacher: 'Łysakowski Grzegorz', cleanTeacher: 'Łysakowski Grzegorz', type: 'Ćwiczenia', color: 'purple', notes: 'Grupa 1', isLibrus: true },
  { id: 'librus_tue_5', day: 'tuesday', subject: 'Wychowanie fizyczne', time_start: '11:30', time_end: '12:15', room: 's. WF', teacher: 'Łysakowski Grzegorz', cleanTeacher: 'Łysakowski Grzegorz', type: 'Ćwiczenia', color: 'purple', notes: 'Grupa 1', isLibrus: true },
  { id: 'librus_tue_6', day: 'tuesday', subject: 'Pracownia systemów operacyjnych', time_start: '12:20', time_end: '13:05', room: 's. 1.16', teacher: 'Reszka Sławomir', cleanTeacher: 'Reszka Sławomir', type: 'Laboratorium', color: 'cyan', notes: 'Grupa 1', isLibrus: true },
  { id: 'librus_tue_7', day: 'tuesday', subject: 'Pracownia systemów operacyjnych', time_start: '13:15', time_end: '14:00', room: 's. 1.16', teacher: 'Reszka Sławomir', cleanTeacher: 'Reszka Sławomir', type: 'Laboratorium', color: 'cyan', notes: 'Grupa 1', isLibrus: true },
  { id: 'librus_tue_8', day: 'tuesday', subject: 'Matematyka', time_start: '14:05', time_end: '14:50', room: 's. 26', teacher: 'Bahr Zbigniew', cleanTeacher: 'Bahr Zbigniew', type: 'Wykład', color: 'indigo', notes: '', isLibrus: true },
  { id: 'librus_tue_9', day: 'tuesday', subject: 'Religia', time_start: '14:55', time_end: '15:40', room: 's. 24', teacher: 'Gizela Maciej', cleanTeacher: 'Gizela Maciej', type: 'Wykład', color: 'indigo', notes: '', isLibrus: true },

  // Środa
  { id: 'librus_wed_1', day: 'wednesday', subject: 'Biznes i zarządzanie', time_start: '10:40', time_end: '11:25', room: 's. 0.2', teacher: 'Sokół Paweł', cleanTeacher: 'Sokół Paweł', type: 'Wykład', color: 'blue', notes: '', isLibrus: true },
  { id: 'librus_wed_2', day: 'wednesday', subject: 'Biologia', time_start: '11:30', time_end: '12:15', room: 's. 19', teacher: 'Łukaszczyk-Wulgaris Joanna', cleanTeacher: 'Łukaszczyk-Wulgaris Joanna', type: 'Wykład', color: 'emerald', notes: '', isLibrus: true },
  { id: 'librus_wed_3', day: 'wednesday', subject: 'Urządzenia techniki komputerowej', time_start: '12:20', time_end: '13:05', room: 's. 1.16', teacher: 'Gembiak Bartosz', cleanTeacher: 'Gembiak Bartosz', type: 'Laboratorium', color: 'cyan', notes: 'Sprzęt i diagnostyka', isLibrus: true },
  { id: 'librus_wed_4', day: 'wednesday', subject: 'Urządzenia techniki komputerowej', time_start: '13:15', time_end: '14:00', room: 's. 1.16', teacher: 'Gembiak Bartosz', cleanTeacher: 'Gembiak Bartosz', type: 'Laboratorium', color: 'cyan', notes: 'Warsztaty sprzętowe', isLibrus: true },
  { id: 'librus_wed_5', day: 'wednesday', subject: 'Historia', time_start: '14:05', time_end: '14:50', room: 's. 06', teacher: 'Wardyn Wojciech', cleanTeacher: 'Wardyn Wojciech', type: 'Wykład', color: 'rose', notes: '', isLibrus: true },
  { id: 'librus_wed_6', day: 'wednesday', subject: 'Matematyka', time_start: '14:55', time_end: '15:40', room: 's. 26', teacher: 'Bahr Zbigniew', cleanTeacher: 'Bahr Zbigniew', type: 'Wykład', color: 'indigo', notes: '', isLibrus: true },

  // Czwartek
  { id: 'librus_thu_1', day: 'thursday', subject: 'Język polski', time_start: '08:00', time_end: '08:45', room: 's. 34', teacher: 'Negowska Alicja', cleanTeacher: 'Negowska Alicja', type: 'Wykład', color: 'rose', notes: '', isLibrus: true },
  { id: 'librus_thu_2', day: 'thursday', subject: 'Język angielski zawodowy', time_start: '08:50', time_end: '09:35', room: 's. Z2', teacher: 'Ziemba Joanna', cleanTeacher: 'Ziemba Joanna', type: 'Lektorat', color: 'amber', notes: 'Grupa 1', isLibrus: true },
  { id: 'librus_thu_3', day: 'thursday', subject: 'Język angielski', time_start: '09:40', time_end: '10:25', room: 's. Z2', teacher: 'Ziemba Joanna', cleanTeacher: 'Ziemba Joanna', type: 'Lektorat', color: 'amber', notes: 'Grupa 1', isLibrus: true },
  { id: 'librus_thu_4', day: 'thursday', subject: 'Pracownia lokalnych sieci komputerowych', time_start: '10:40', time_end: '11:25', room: 's. 1.16', teacher: 'Kryła Łukasz', cleanTeacher: 'Kryła Łukasz', type: 'Laboratorium', color: 'cyan', notes: 'Konfiguracja LAN', isLibrus: true },
  { id: 'librus_thu_5', day: 'thursday', subject: 'Pracownia lokalnych sieci komputerowych', time_start: '11:30', time_end: '12:15', room: 's. 1.16', teacher: 'Kryła Łukasz', cleanTeacher: 'Kryła Łukasz', type: 'Laboratorium', color: 'cyan', notes: 'Protokoły i routing', isLibrus: true },
  { id: 'librus_thu_6', day: 'thursday', subject: 'Matematyka', time_start: '12:20', time_end: '13:05', room: 's. 05', teacher: 'Bahr Zbigniew', cleanTeacher: 'Bahr Zbigniew', type: 'Wykład', color: 'indigo', notes: '', isLibrus: true },
  { id: 'librus_thu_7', day: 'thursday', subject: 'Matematyka', time_start: '13:15', time_end: '14:00', room: 's. 05', teacher: 'Bahr Zbigniew', cleanTeacher: 'Bahr Zbigniew', type: 'Wykład', color: 'indigo', notes: '', isLibrus: true },
  { id: 'librus_thu_8', day: 'thursday', subject: 'Język niemiecki', time_start: '14:05', time_end: '14:50', room: 's. Z1', teacher: 'Chyła Beata', cleanTeacher: 'Chyła Beata', type: 'Lektorat', color: 'amber', notes: 'Grupa 1', isLibrus: true },
  { id: 'librus_thu_9', day: 'thursday', subject: 'Biologia', time_start: '14:55', time_end: '15:40', room: 's. 19', teacher: 'Łukaszczyk-Wulgaris Joanna', cleanTeacher: 'Łukaszczyk-Wulgaris Joanna', type: 'Wykład', color: 'emerald', notes: '', isLibrus: true },

  // Piątek
  { id: 'librus_fri_1', day: 'friday', subject: 'Język angielski', time_start: '08:00', time_end: '08:45', room: 's. Z2', teacher: 'Ziemba Joanna', cleanTeacher: 'Ziemba Joanna', type: 'Lektorat', color: 'amber', notes: 'Grupa 1', isLibrus: true },
  { id: 'librus_fri_2', day: 'friday', subject: 'Język niemiecki', time_start: '08:50', time_end: '09:35', room: 's. Z1', teacher: 'Chyła Beata', cleanTeacher: 'Chyła Beata', type: 'Lektorat', color: 'amber', notes: 'Grupa 1', isLibrus: true },
  { id: 'librus_fri_3', day: 'friday', subject: 'Wychowanie fizyczne', time_start: '09:40', time_end: '10:25', room: 's. WF', teacher: 'Łysakowski Grzegorz', cleanTeacher: 'Łysakowski Grzegorz', type: 'Ćwiczenia', color: 'purple', notes: 'Grupa 1', isLibrus: true },
  { id: 'librus_fri_4', day: 'friday', subject: 'Lokalne sieci komputerowe', time_start: '10:40', time_end: '11:25', room: 's. 1.16', teacher: 'Wojnarowski Przemysław', cleanTeacher: 'Wojnarowski Przemysław', type: 'Wykład', color: 'cyan', notes: 'Architektura sieciowa', isLibrus: true },
  { id: 'librus_fri_5', day: 'friday', subject: 'Chemia', time_start: '11:30', time_end: '12:15', room: 's. 19', teacher: 'Kolasińska Paulina', cleanTeacher: 'Kolasińska Paulina', type: 'Wykład', color: 'emerald', notes: '', isLibrus: true },
  { id: 'librus_fri_6', day: 'friday', subject: 'Edukacja obywatelska', time_start: '12:20', time_end: '13:05', room: 's. 09', teacher: 'Czarna Alicja', cleanTeacher: 'Czarna Alicja', type: 'Wykład', color: 'rose', notes: '', isLibrus: true },
  { id: 'librus_fri_7', day: 'friday', subject: 'Język polski', time_start: '13:15', time_end: '14:00', room: 's. 34', teacher: 'Negowska Alicja', cleanTeacher: 'Negowska Alicja', type: 'Wykład', color: 'rose', notes: '', isLibrus: true },
  { id: 'librus_fri_8', day: 'friday', subject: 'Język polski', time_start: '14:05', time_end: '14:50', room: 's. 34', teacher: 'Negowska Alicja', cleanTeacher: 'Negowska Alicja', type: 'Wykład', color: 'rose', notes: '', isLibrus: true }
];

const TimetablePage = () => {
  const { t } = useTranslation();

  const [lessons, setLessons] = useState([]);
  const [librusData, setLibrusData] = useState(null);
  const [librusCalendarEvents, setLibrusCalendarEvents] = useState([]);
  const [isSyncingLibrus, setIsSyncingLibrus] = useState(false);
  const [librusLastSync, setLibrusLastSync] = useState(null);
  const [absenceFilterOnly, setAbsenceFilterOnly] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const [selectedDay, setSelectedDay] = useState('all'); // 'all' | 'monday' | ...
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'grid'
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showStats, setShowStats] = useState(true);
  
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

  // 1. Subskrypcja Cloud Firestore dla tabeli timetable
  useEffect(() => {
    const unsub = subscribeCollection(CLOUD_COLLECTIONS.TIMETABLE || 'timetable', (data) => {
      if (Array.isArray(data) && data.length > 0) {
        setLessons(data);
      }
    });

    // Fallback Express jeśli działa (tylko w trybie lokalnym)
    if (!isCloudEnvironment()) {
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
    }

    return () => unsub();
  }, []);

  // 2. Subskrypcja Librus Timetable & Calendar w Firestore (oraz API fallback)
  useEffect(() => {
    if (firestore) {
      try {
        const unsubTT = onSnapshot(doc(firestore, 'librus_cache', 'timetable'), (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (data) {
              setLibrusData(data);
              setLibrusLastSync(data.lastSync || null);
            }
          }
        }, () => {});

        const unsubCal = onSnapshot(doc(firestore, 'librus_cache', 'calendar'), (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (data && Array.isArray(data.events)) {
              setLibrusCalendarEvents(data.events);
            }
          }
        }, () => {});

        return () => {
          unsubTT();
          unsubCal();
        };
      } catch {}
    }

    if (!isCloudEnvironment()) {
      axios.get('/api/librus/timetable')
        .then(res => {
          if (res.data?.success && res.data.lessons) {
            setLibrusData(res.data);
            setLibrusLastSync(res.data.lastSync || null);
          }
        })
        .catch(() => {});

      axios.get('/api/librus/calendar')
        .then(res => {
          if (res.data?.success && Array.isArray(res.data.events)) {
            setLibrusCalendarEvents(res.data.events);
          }
        })
        .catch(() => {});
    }
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
    const match = String(timeStr).match(/(\d{1,2}):(\d{2})/);
    if (!match) return 0;
    return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  };

  // Pomocnicze funkcje korelacji nakładania godzin
  const checkOverlap = (lStart, lEnd, rangeStr) => {
    if (!rangeStr) return true;
    const lower = String(rangeStr).toLowerCase();
    if (lower.includes('cały dzień') || lower === '' || lower === 'brak') return true;
    const times = rangeStr.match(/(\d{1,2}:\d{2})/g);
    if (!times || times.length < 2) return true;
    const aStart = parseTimeToMinutes(times[0]);
    const aEnd = parseTimeToMinutes(times[1]);
    return Math.max(parseTimeToMinutes(lStart), aStart) < Math.min(parseTimeToMinutes(lEnd), aEnd);
  };

  // Podstawa lekcji: z bufora Librusa (priorytet nadrzędny) lub z bazy/cache jeśli bufor pusty
  // Wszystkie nazwiska nauczycieli są natychmiast rozwijane do pełnych imion i nazwisk.
  const baseLessons = useMemo(() => {
    let source = STATIC_DEMO_TIMETABLE_LESSONS;
    if (librusData && Array.isArray(librusData.lessons) && librusData.lessons.length > 0) {
      source = librusData.lessons;
    } else if (lessons && lessons.length > 0) {
      source = lessons;
    }
    return source.map(l => {
      const fullTeacher = resolveFullTeacherName(l.cleanTeacher || l.teacher);
      return {
        ...l,
        teacher: fullTeacher || l.teacher,
        cleanTeacher: fullTeacher || l.cleanTeacher || l.teacher
      };
    });
  }, [lessons, librusData]);

  // Wzbogacenie lekcji o aktywne absencje i alerty zastępstw
  const enrichedLessons = useMemo(() => {
    const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const absences = (librusCalendarEvents && librusCalendarEvents.length > 0)
      ? librusCalendarEvents.filter(e => e && e.type === 'absence' && e.teacher)
      : STATIC_DEMO_ABSENCE_EVENTS;

    // Granice bieżącego tygodnia roboczego/kalendarzowego (od poniedziałku do niedzieli)
    const now = new Date(currentTime);
    const day = now.getDay();
    const diffToMon = (day === 0 ? -6 : 1) - day;
    const monDate = new Date(now);
    monDate.setDate(now.getDate() + diffToMon);
    const sunDate = new Date(monDate);
    sunDate.setDate(monDate.getDate() + 6);

    const fmtDate = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dt = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dt}`;
    };
    const monStr = fmtDate(monDate);
    const sunStr = fmtDate(sunDate);

    return baseLessons.map(lesson => {
      if (lesson.absenceAlert?.isAbsent) return lesson;

      const matched = absences.find(abs => {
        // 1. Sprawdzenie zgodności nauczyciela (odrzucenie false positives po imieniu lub podciągach)
        const currentTeacher = lesson.cleanTeacher || lesson.teacher;
        if (!matchTeacherNames(currentTeacher, abs.teacher)) return false;

        // 2. Weryfikacja zakresu datowego - absencje dotyczą wyłącznie bieżącego tygodnia
        if (abs.date) {
          if (abs.date < monStr || abs.date > sunStr) return false;
          let absDay = null;
          try {
            absDay = DAY_NAMES[new Date(abs.date + 'T12:00:00Z').getUTCDay()];
          } catch {}
          if (absDay && absDay !== lesson.day) return false;
        }

        // 3. Weryfikacja nakładania się godzin lekcji i absencji
        return checkOverlap(lesson.time_start, lesson.time_end, abs.time || abs.range);
      });

      if (matched) {
        const fullTeacher = resolveFullTeacherName(matched.teacher) || matched.teacher;
        return {
          ...lesson,
          absenceAlert: {
            isAbsent: true,
            teacher: fullTeacher,
            hours: matched.time || 'Cały dzień',
            date: matched.date || '',
            description: matched.description || `Nieobecność nauczyciela: ${fullTeacher}`,
            suggestedStatus: 'okienko_or_sub'
          }
        };
      }
      return lesson;
    });
  }, [baseLessons, librusCalendarEvents, currentTime]);

  // Wykryte aktywne absencje dla aktualnie przeglądanego widoku
  const detectedAbsences = useMemo(() => {
    return enrichedLessons.filter(l => {
      if (!l.absenceAlert?.isAbsent) return false;
      if (selectedDay !== 'all') return l.day === selectedDay;
      return true;
    });
  }, [enrichedLessons, selectedDay]);

  const todayUpcomingLessons = useMemo(() => {
    return enrichedLessons
      .filter(l => l.day === todayDayId)
      .sort((a, b) => parseTimeToMinutes(a.time_start) - parseTimeToMinutes(b.time_start));
  }, [enrichedLessons, todayDayId]);

  // Obliczenie aktualnie trwającej lekcji i następnej dzisiaj
  const { activeLesson, nextLesson } = useMemo(() => {
    const todayLessons = todayUpcomingLessons;

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
  }, [todayUpcomingLessons, currentMinutes]);

  // Statystyki tygodniowe
  const stats = useMemo(() => {
    const totalLessons = enrichedLessons.length;
    let totalMinutes = 0;
    const subjects = new Set();

    enrichedLessons.forEach(l => {
      const dur = Math.max(0, parseTimeToMinutes(l.time_end) - parseTimeToMinutes(l.time_start));
      totalMinutes += dur;
      if (l.subject) subjects.add(l.subject.trim());
    });

    const hours = (totalMinutes / 60).toFixed(1);
    const todayCount = enrichedLessons.filter(l => l.day === todayDayId).length;
    const totalAbsencesCount = enrichedLessons.filter(l => l.absenceAlert?.isAbsent).length;

    return {
      totalLessons,
      totalHours: hours,
      uniqueSubjects: subjects.size,
      todayCount,
      totalAbsencesCount
    };
  }, [enrichedLessons, todayDayId]);

  // Filtrowanie lekcji
  const filteredLessons = useMemo(() => {
    return enrichedLessons
      .filter(l => {
        if (absenceFilterOnly && !l.absenceAlert?.isAbsent) return false;
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
  }, [enrichedLessons, selectedDay, typeFilter, searchQuery, absenceFilterOnly]);

  const handleSyncLibrusTimetable = async () => {
    setIsSyncingLibrus(true);
    try {
      if (!isCloudEnvironment()) {
        const resp = await axios.post('/api/librus/timetable/import-to-schedule');
        if (resp.data?.success && resp.data.data) {
          setLibrusData(resp.data.data);
          setLibrusLastSync(resp.data.data.lastSync || new Date().toISOString());
          if (Array.isArray(resp.data.data.lessons)) {
            setLessons(resp.data.data.lessons);
          }
          const subsCount = resp.data.data.substitutions?.length || 0;
          setToastMessage(`[+] Zsynchronizowano plan z Librusa! Wykryto ${subsCount} zmian/zastępstw.`);
          setTimeout(() => setToastMessage(null), 4000);
        }
      } else {
        // Środowisko chmurowe — odświeżenie ze snapshota Firestore
        if (firestore) {
          const snap = await getDoc(doc(firestore, 'librus_cache', 'timetable'));
          if (snap.exists() && snap.data()) {
            setLibrusData(snap.data());
            setLibrusLastSync(snap.data().lastSync || new Date().toISOString());
            if (Array.isArray(snap.data().lessons)) {
              setLessons(snap.data().lessons);
            }
          }
          const snapCal = await getDoc(doc(firestore, 'librus_cache', 'calendar'));
          if (snapCal.exists() && snapCal.data()?.events) {
            setLibrusCalendarEvents(snapCal.data().events);
          }
        }
        setToastMessage('[+] Odświeżono plan lekcji i zastępstwa z chmury Librus.');
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err) {
      setToastMessage(`[!] Błąd synchronizacji: ${err.message}`);
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsSyncingLibrus(false);
    }
  };

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
    if (!isCloudEnvironment()) {
      try { await axios.post('/api/timetable', newLesson); } catch {}
    }
  };

  const handleDelete = async (id) => {
    const idStr = String(id);
    if (!window.confirm('Czy na pewno chcesz usunąć te zajęcia z planu?')) return;
    setLessons(prev => prev.filter(l => String(l.id) !== idStr));
    await deleteCloudDocument('timetable', idStr);
    if (!isCloudEnvironment()) {
      try { await axios.delete(`/api/timetable/${idStr}`); } catch {}
    }
  };

  const handleToggleCancelled = async (lesson) => {
    const isNowCancelled = !(lesson.isCancelled || lesson.status === 'cancelled');
    const updated = {
      ...lesson,
      isCancelled: isNowCancelled,
      status: isNowCancelled ? 'cancelled' : 'active'
    };
    setLessons(prev => {
      const exists = prev.some(l => String(l.id) === String(lesson.id));
      if (exists) {
        return prev.map(l => String(l.id) === String(lesson.id) ? updated : l);
      }
      return [...prev, updated];
    });
    await saveCloudDocument('timetable', String(lesson.id), updated);
    if (!isCloudEnvironment()) {
      try {
        await axios.put(`/api/timetable/${lesson.id}`, updated);
      } catch {}
    }
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
    if (!isCloudEnvironment()) {
      try {
        if (editingLesson) {
          await axios.put(`/api/timetable/${lessonPayload.id}`, lessonPayload);
        } else {
          await axios.post('/api/timetable', lessonPayload);
        }
      } catch {}
    }
  };

  return (
    <div className="flex flex-col h-full gap-3 sm:gap-5 overflow-y-auto custom-scrollbar font-sans pb-24 md:pb-8 min-h-0">
      {/* 1. Header Bar */}
      <header className="glass-panel p-3.5 sm:p-5 rounded-2xl border border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 flex-shrink-0 shadow-lg">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-accentPrimary/20 border border-accentPrimary/40 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(var(--color-accent-primary),0.2)]">
            <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-accentPrimary" />
          </div>
          <div>
            <nav aria-label="breadcrumb" className="hidden sm:flex items-center space-x-2 text-sm text-textMuted mb-0.5">
              <span className="text-sm font-medium text-textMuted/70">OmniDash</span>
              <span className="text-sm font-medium text-textMuted/70">/</span>
              <span className="text-sm font-medium text-textPrimary">Harmonogram</span>
            </nav>
            <h1 className="text-lg sm:text-2xl font-bold text-textPrimary tracking-tight flex items-center gap-2">
              Plan Lekcji & Zajęć
              <span className="text-[10px] sm:text-[11px] font-mono px-2 py-0.5 rounded-full bg-accentPrimary/10 text-accentPrimary border border-accentPrimary/30">
                LIVE
              </span>
            </h1>
            <p className="hidden md:block text-xs text-textMuted mt-0.5">
              Tygodniowy rozkład zajęć akademickich i dydaktycznych ze statystykami i powiadomieniami na żywo.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end pt-1 sm:pt-0 border-t sm:border-t-0 border-border/40">
          <button
            onClick={() => setShowStats(prev => !prev)}
            className="px-2.5 py-1.5 rounded-xl border border-white/10 bg-surface text-textMuted hover:text-textPrimary text-xs font-mono transition-colors flex items-center gap-1.5 shadow-sm"
            title="Przełącz widoczność kafelków analitycznych"
          >
            <span>{showStats ? 'Zwiń Statystyki ▴' : 'Rozwiń Statystyki ▾'}</span>
          </button>

          <div className="flex items-center bg-surface border border-white/10 rounded-xl p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 sm:p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${viewMode === 'cards' ? 'bg-accentPrimary/20 text-accentPrimary shadow-sm' : 'text-textMuted hover:text-textPrimary'}`}
              title="Widok kart"
            >
              <List className="w-4 h-4" />
              <span className="inline">Karty</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 sm:p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${viewMode === 'grid' ? 'bg-accentPrimary/20 text-accentPrimary shadow-sm' : 'text-textMuted hover:text-textPrimary'}`}
              title="Widok siatki tygodniowej"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="inline">Siatka</span>
            </button>
          </div>

          <button
            onClick={handleSyncLibrusTimetable}
            disabled={isSyncingLibrus}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-accentPrimary/40 bg-accentPrimary/10 text-accentPrimary hover:bg-accentPrimary/20 text-xs font-mono font-bold transition-all active:scale-95 disabled:opacity-50"
            title="Pobierz oficjalny plan lekcji i zastępstwa z Librusa"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingLibrus ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isSyncingLibrus ? 'Pobieranie...' : 'Pobierz z Librusa'}</span>
            <span className="sm:hidden">Librus</span>
          </button>

          <button
            onClick={() => handleOpenAddModal(selectedDay !== 'all' ? selectedDay : 'monday')}
            className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-accentPrimary text-background font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(var(--color-accent-primary),0.3)] hover:brightness-110 active:scale-95 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Dodaj Lekcję</span>
          </button>
        </div>
      </header>

      {/* Powiadomienie Toast */}
      {toastMessage && (
        <div className="p-3 rounded-xl bg-accentPrimary/20 border border-accentPrimary/40 text-accentPrimary text-xs font-mono flex items-center justify-between animate-fade-in shadow-lg flex-shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-accentPrimary" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-accentPrimary/70 hover:text-accentPrimary text-xs">x</button>
        </div>
      )}

      {/* Banner Zmian w Planie / Nieobecności Nauczycieli */}
      {detectedAbsences.length > 0 && (
        <div className="p-3.5 sm:p-4 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-surface/80 to-purple-500/10 backdrop-blur-md shadow-[0_0_20px_rgba(245,158,11,0.15)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in flex-shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                  [!] Wykryto Zmiany w Planie / Nieobecności Nauczycieli
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {detectedAbsences.length} {detectedAbsences.length === 1 ? 'zajęcia z absencją' : 'zajęć z absencją'}
                </span>
                {librusLastSync && (
                  <span className="text-[10px] font-mono text-textMuted/70">
                    Sync: {new Date(librusLastSync).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
              <p className="text-xs text-textMuted mt-1">
                Librus Synergia zgłasza nieobecność kadry pedagogicznej. Lekcje z oznaczonymi nauczycielami mogą zostać odwołane (okienko) lub posiadać wyznaczone zastępstwo:
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {detectedAbsences.map((l, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono bg-black/40 border border-amber-500/30 text-amber-200">
                    <UserX className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <strong className="text-amber-300">{l.absenceAlert?.teacher || l.teacher}</strong>
                    <span className="text-textMuted">({l.subject} • {l.time_start}-{l.time_end})</span>:
                    <span className="text-amber-400 font-semibold">{l.absenceAlert?.hours || 'Cały dzień'}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              onClick={() => setAbsenceFilterOnly(prev => !prev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                absenceFilterOnly 
                  ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]' 
                  : 'bg-surface text-amber-400 border-amber-500/30 hover:bg-amber-500/10'
              }`}
            >
              {absenceFilterOnly ? 'Pokaż wszystkie lekcje' : 'Filtruj tylko zastępstwa'}
            </button>
          </div>
        </div>
      )}

      {/* 2. Statystyki & Trwające Zajęcia (Live Tracker) - Zwijalne */}
      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 flex-shrink-0 animate-fade-in">
          {/* Live Class Tracker */}
          <div className="col-span-2 md:col-span-2 glass-panel p-3.5 sm:p-4 rounded-xl border border-white/10 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-surface/80 to-surface/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${activeLesson ? 'bg-emerald-400 animate-ping' : 'bg-accentPrimary'}`}></span>
                <span className="text-xs font-mono font-bold tracking-wider text-textMuted uppercase">
                  {activeLesson ? '[NISKI] TRWAJĄCE ZAJĘCIA' : (nextLesson ? ' NAJBLIŻSZE ZAJĘCIA DZISIAJ' : ' BRAK ZAJĘĆ W TEJ CHWILI')}
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

            {/* Dzisiejsza oś czasu - szybki podgląd kolejnych lekcji */}
            {todayUpcomingLessons.length > 0 && (
              <div className="mt-2.5 pt-2 border-t border-white/10">
                <span className="text-[10px] font-mono text-textMuted uppercase tracking-wider block mb-1.5">
                  Dzisiejszy rozkład ({todayUpcomingLessons.length} lekcji):
                </span>
                <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                  {todayUpcomingLessons.map((l) => {
                    const isNow = activeLesson && String(activeLesson.id) === String(l.id);
                    return (
                      <div
                        key={l.id}
                        className={`px-2.5 py-1 rounded-lg border text-left shrink-0 transition-all ${
                          isNow
                            ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300 shadow-sm'
                            : 'border-white/10 bg-black/20 text-textMuted hover:text-textPrimary'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold text-accentPrimary">{l.time_start}</span>
                          <span className="text-[11px] font-medium text-textPrimary truncate max-w-[110px]">{l.subject}</span>
                        </div>
                        <div className="text-[9px] font-mono text-textMuted flex items-center gap-2">
                          <span>{l.room || 'sala -'}</span>
                          <span>•</span>
                          <span>{l.type}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
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
      )}

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
                        const hasAbsence = !!lesson.absenceAlert?.isAbsent;
                        const isCancelled = lesson.isCancelled || lesson.status === 'cancelled';

                        return (
                          <div
                            key={lesson.id}
                            className={`glass-panel p-4 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 relative group flex flex-col justify-between ${
                              isCancelled
                                ? 'border-dashed border-white/20 bg-surface/20 opacity-75'
                                : hasAbsence
                                  ? 'border-amber-500/70 shadow-[0_0_20px_rgba(245,158,11,0.25)] bg-amber-950/15 ring-1 ring-amber-500/40'
                                  : isNow 
                                    ? 'border-emerald-500/70 shadow-[0_0_20px_rgba(16,185,129,0.2)] bg-emerald-950/10' 
                                    : `${style.border} ${style.glow} hover:border-white/30`
                            }`}
                          >
                            <div>
                              {/* Pasek górny karty */}
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`w-2 h-2 rounded-full ${hasAbsence ? 'bg-amber-400 animate-pulse' : style.dot}`}></span>
                                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-semibold ${style.badge}`}>
                                    {lesson.type || 'Zajęcia'}
                                  </span>
                                  {isNow && (
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500 text-background font-bold animate-pulse">
                                      LIVE
                                    </span>
                                  )}
                                  {hasAbsence && (
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold flex items-center gap-1 animate-pulse">
                                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                                      ABSENCJA ({lesson.absenceAlert.hours})
                                    </span>
                                  )}
                                  {isCancelled && (
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/50 font-bold">
                                      [X] OKIENKO
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

                              <h3 className={`text-base font-bold text-textPrimary tracking-tight leading-snug mb-3 ${isCancelled ? 'line-through text-textMuted/60' : ''}`}>
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
                                    <span className={hasAbsence ? 'line-through text-amber-400/80 font-medium' : ''}>
                                      {lesson.teacher}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Alert nieobecności nauczyciela */}
                              {hasAbsence && (
                                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 mb-3 font-mono leading-relaxed">
                                  <div className="flex items-center gap-1.5 font-bold text-amber-300 mb-0.5">
                                    <UserX className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                    <span>Nauczyciel nieobecny w tych godzinach!</span>
                                  </div>
                                  <div className="text-[10px] text-textMuted">
                                    {lesson.absenceAlert.teacher} ({lesson.absenceAlert.hours}) {'->'} Możliwe okienko lub zastępstwo.
                                  </div>
                                </div>
                              )}

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
                                {hasAbsence && (
                                  <button
                                    onClick={() => handleToggleCancelled(lesson)}
                                    className={`px-2 py-1 text-[10px] font-mono rounded-lg transition-colors border ${
                                      isCancelled 
                                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30' 
                                        : 'bg-white/5 hover:bg-rose-500/20 text-textMuted hover:text-rose-300 border-white/10'
                                    }`}
                                    title={isCancelled ? 'Przywróć lekcję' : 'Oznacz jako odwołaną (okienko)'}
                                  >
                                    {isCancelled ? 'Przywróć' : 'Okienko?'}
                                  </button>
                                )}
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
          /* Widok Siatki Tygodniowej (Tabela Dni Pon-Pt/Nd z horyzontalnym scrollem na mobile) */
          <div className="overflow-x-auto custom-scrollbar touch-pan-x pb-2 min-h-0 flex-1">
            <div className="grid grid-cols-7 gap-3 min-w-[720px] h-full">
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
                          const hasAbsence = !!lesson.absenceAlert?.isAbsent;
                          const isCancelled = lesson.isCancelled || lesson.status === 'cancelled';

                          return (
                            <div
                              key={lesson.id}
                              onClick={() => handleOpenEditModal(lesson)}
                              className={`p-2 rounded-lg border text-left cursor-pointer transition-all hover:scale-[1.02] relative ${
                                isCancelled
                                  ? 'border-dashed border-white/20 bg-surface/20 opacity-60 line-through'
                                  : hasAbsence
                                    ? 'border-amber-500/70 bg-amber-950/25 shadow-[0_0_12px_rgba(245,158,11,0.25)] ring-1 ring-amber-500/30'
                                    : `${style.badge} ${style.border}`
                              }`}
                            >
                              <div className="flex items-center justify-between text-[10px] font-mono font-bold opacity-80 mb-0.5">
                                <span>{lesson.time_start} - {lesson.time_end}</span>
                                {hasAbsence && (
                                  <span className="text-amber-400 text-[9px] font-bold animate-pulse">[!] ABSENCJA</span>
                                )}
                              </div>
                              <div className="text-xs font-bold text-textPrimary line-clamp-2 leading-tight">
                                {lesson.subject}
                              </div>
                              {lesson.teacher && (
                                <div className={`text-[10px] font-mono mt-0.5 truncate ${hasAbsence ? 'text-amber-300 font-semibold' : 'text-textMuted'}`}>
                                  {lesson.teacher}
                                </div>
                              )}
                              {lesson.room && (
                                <div className="text-[10px] text-textMuted font-mono mt-0.5 flex items-center gap-1">
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
                x
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
