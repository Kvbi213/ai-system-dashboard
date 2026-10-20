import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  subscribeCollection, 
  saveCloudDocument, 
  CLOUD_COLLECTIONS,
  isCloudEnvironment
} from '../services/cloudSync.js';

const DAYS_DATA = [
  { id: 'all_week', name: 'Cały Tydzień', dayNumber: 'Siatka', blocks: 'Pon-Ndz', isAllWeek: true },
  { id: 'mon', name: 'Pon', dayNumber: '14', blocks: '5 bloków' },
  { id: 'tue', name: 'Wt', dayNumber: '15', blocks: '7 bloków' },
  { id: 'wed', name: 'Śr • Dziś', dayNumber: '16', blocks: '7 bloków', isToday: true },
  { id: 'thu', name: 'Czw', dayNumber: '17', blocks: '4 bloki' },
  { id: 'fri', name: 'Pt', dayNumber: '18', blocks: '4 bloki' },
  { id: 'sat', name: 'Sob', dayNumber: '19', blocks: 'Regeneracja', muted: true },
  { id: 'sun', name: 'Ndz', dayNumber: '20', blocks: 'Planowanie', muted: true },
];

const INITIAL_SCHEDULE = [
  // Poniedziałek (mon)
  {
    id: 'mon_1',
    day: 'mon',
    timeStart: '08:50',
    timeEnd: '09:35',
    duration: '45 min',
    category: 'librus',
    categoryLabel: 'Szkolne • Librus',
    room: 'Sala 17',
    teacher: 'Becker Adam',
    indicatorColor: 'bg-primary',
    title: 'Informatyka',
    description: 'Pracownia informatyczna, algorytmy sortowania i struktur danych.',
    statusText: 'Obecność odnotowana'
  },
  {
    id: 'mon_2',
    day: 'mon',
    timeStart: '09:40',
    timeEnd: '10:25',
    duration: '45 min',
    category: 'librus',
    categoryLabel: 'Szkolne • Librus',
    room: 'Sala 17',
    teacher: 'Becker Adam',
    indicatorColor: 'bg-primary',
    title: 'Informatyka',
    description: 'Warsztaty praktyczne w środowisku Linux.',
    statusText: 'Obecność odnotowana'
  },
  {
    id: 'mon_3',
    day: 'mon',
    timeStart: '10:40',
    timeEnd: '11:25',
    duration: '45 min',
    category: 'librus',
    categoryLabel: 'Szkolne • Librus',
    room: 'Sala 31',
    teacher: 'Kolasińska Paulina',
    indicatorColor: 'bg-secondary',
    title: 'Chemia',
    description: 'Kinetyka reakcji chemicznych i równowaga dynamiczna.'
  },
  {
    id: 'mon_4',
    day: 'mon',
    timeStart: '12:20',
    timeEnd: '14:00',
    duration: '90 min',
    category: 'librus',
    categoryLabel: 'Szkolne • Librus',
    room: 'Sala 1.16',
    teacher: 'Wojnarowski Przemysław',
    indicatorColor: 'bg-primary',
    title: 'Systemy operacyjne',
    description: 'Architektura jądra Unix, procesy i wątki POSIX.'
  },
  {
    id: 'mon_5',
    day: 'mon',
    timeStart: '17:30',
    timeEnd: '18:45',
    duration: '75 min',
    category: 'personal',
    categoryLabel: 'Osobiste • Trening',
    room: 'Dom / Strych',
    indicatorColor: 'bg-tertiary',
    title: 'FBW Strych (Sesja A)',
    description: 'Podciąganie, Dipy, Przysiady.',
    hasWorkoutBtn: true
  },

  // Wtorek (tue)
  {
    id: 'tue_1',
    day: 'tue',
    timeStart: '08:00',
    timeEnd: '09:35',
    duration: '95 min',
    category: 'librus',
    categoryLabel: 'Szkolne • Librus',
    room: 'Sala 1.16',
    teacher: 'Wojnarowski Przemysław',
    indicatorColor: 'bg-primary',
    title: 'Pracownia urządzeń techniki komputerowej',
    description: 'Diagnostyka magistrali PCIe i pamięci RAM DDR5.'
  },
  {
    id: 'tue_2',
    day: 'tue',
    timeStart: '10:40',
    timeEnd: '12:15',
    duration: '90 min',
    category: 'librus',
    categoryLabel: 'Szkolne • Librus',
    room: 'Hala Sportowa',
    teacher: 'Łysakowski Grzegorz',
    indicatorColor: 'bg-tertiary',
    title: 'Wychowanie fizyczne',
    description: 'Kondycja ogólna i gry zespołowe.'
  },
  {
    id: 'tue_3',
    day: 'tue',
    timeStart: '12:20',
    timeEnd: '14:00',
    duration: '90 min',
    category: 'librus',
    categoryLabel: 'Szkolne • Librus',
    room: 'Sala 1.16',
    teacher: 'Reszka Sławomir',
    indicatorColor: 'bg-primary',
    title: 'Pracownia systemów operacyjnych',
    description: 'Skrypty bash, automatyzacja zadań crontab i systemd.'
  },
  {
    id: 'tue_4',
    day: 'tue',
    timeStart: '14:05',
    timeEnd: '14:50',
    duration: '45 min',
    category: 'librus',
    categoryLabel: 'Szkolne • Librus',
    room: 'Sala 26',
    teacher: 'Bahr Zbigniew',
    indicatorColor: 'bg-secondary',
    title: 'Matematyka',
    description: 'Funkcje wykładnicze i logarytmiczne.'
  },

  // Środa (wed) - Dziś
  {
    id: 'b1',
    day: 'wed',
    timeStart: '07:00',
    timeEnd: '07:45',
    duration: '45 min',
    category: 'personal',
    categoryLabel: 'Osobiste',
    badge: 'SYS-CHECK',
    indicatorColor: 'bg-secondary-container',
    title: 'Poranny rozruch & Przegląd telemetrii OmniDash',
    description: 'Nawodnienie, kalibracja sensorów snu, synchronizacja dziennika bazy wektorowej.',
    statusText: 'Zrealizowano',
    isDone: true,
  },
  {
    id: 'b2',
    day: 'wed',
    timeStart: '08:00',
    timeEnd: '09:35',
    duration: '95 min',
    category: 'librus',
    categoryLabel: 'Szkolne • Librus',
    room: 'Sala 104',
    teacher: 'Becker Adam',
    indicatorColor: 'bg-primary',
    title: 'Informatyka Stosowana',
    description: 'Struktury danych, implementacja kolejki FIFO/LIFO w C++. Sprawdzian formatywny.',
    statusText: 'Obecność odnotowana',
    isDone: true,
  },
  {
    id: 'b3',
    day: 'wed',
    timeStart: '09:50',
    timeEnd: '11:25',
    duration: 'Aktywny',
    category: 'librus',
    categoryLabel: 'Trwa teraz',
    room: 'Sala 210',
    teacher: 'dr inż. M. Karwicki',
    indicatorColor: 'bg-primary/40',
    isActive: true,
    title: 'Matematyka Dyskretna',
    description: 'Teoria grafów, izomorfizmy oraz algorytm Dijkstry. Notatki zapisywane w Obsidian.',
    hasNoteBtn: true,
  },
  {
    id: 'b4',
    day: 'wed',
    timeStart: '11:40',
    timeEnd: '12:25',
    duration: 'Okienko',
    category: 'librus',
    categoryLabel: '[!] Lekcja Odwołana',
    librusSyncTime: '08:12',
    isCancelled: true,
    indicatorColor: 'bg-error',
    title: 'Fizyka Techniczna',
    infoText: 'Okienko czasowe: 45 min na powtórkę w bibliotece',
    hasAssignTaskBtn: true,
  },
  {
    id: 'b5',
    day: 'wed',
    timeStart: '13:00',
    timeEnd: '14:30',
    duration: '90 min',
    category: 'librus',
    categoryLabel: 'Szkolne • Librus',
    room: 'Sala 302',
    indicatorColor: 'bg-primary',
    title: 'Język Angielski C1',
    description: 'Academic writing & research terminology presentation. Przygotowanie eseju technicznego.',
  },
  {
    id: 'b6',
    day: 'wed',
    timeStart: '17:30',
    timeEnd: '18:45',
    duration: '75 min',
    category: 'personal',
    categoryLabel: 'Osobiste • Trening',
    room: 'Dom / Strych',
    indicatorColor: 'bg-tertiary',
    title: 'FBW Strych (Podciąganie, Dipy, OHP)',
    description: 'Progresywne przeładowanie. Serie główne: 4x8 Podciąganie z pasem +15kg, 3x10 Dipy +20kg.',
    hasWorkoutBtn: true,
  },
  {
    id: 'b7',
    day: 'wed',
    timeStart: '20:00',
    timeEnd: '21:30',
    duration: '90 min',
    category: 'personal',
    categoryLabel: 'Osobiste • Fokus',
    badge: 'OmniDash Core',
    indicatorColor: 'bg-secondary',
    title: 'Projekt Systemu & Deep Work',
    description: 'Implementacja endpointów SQLite WAL i indeksowania wektorowego dla bazy wiedzy.',
  },

  // Czwartek (thu)
  {
    id: 'thu_1',
    day: 'thu',
    timeStart: '08:50',
    timeEnd: '09:35',
    duration: '45 min',
    category: 'librus',
    categoryLabel: '[!] Lekcja Odwołana',
    librusSyncTime: '07:45',
    isCancelled: true,
    indicatorColor: 'bg-error',
    title: 'Język Polski',
    infoText: 'Odwołane z powodu nieobecności nauczyciela'
  },
  {
    id: 'thu_2',
    day: 'thu',
    timeStart: '09:40',
    timeEnd: '10:25',
    duration: '45 min',
    category: 'librus',
    categoryLabel: 'Szkolne • Librus',
    room: 'Sala 26',
    teacher: 'Bahr Zbigniew',
    indicatorColor: 'bg-primary',
    title: 'Matematyka',
    description: 'Równania i nierówności kwadratowe.'
  },
  {
    id: 'thu_3',
    day: 'thu',
    timeStart: '10:40',
    timeEnd: '11:25',
    duration: '45 min',
    category: 'librus',
    categoryLabel: 'Szkolne • Librus',
    room: 'Sala 302',
    teacher: 'Wiśniewska Ewa',
    indicatorColor: 'bg-secondary',
    title: 'Język Angielski',
    description: 'Grammar and technical vocabulary.'
  },
  {
    id: 'thu_4',
    day: 'thu',
    timeStart: '11:30',
    timeEnd: '13:05',
    duration: '90 min',
    category: 'librus',
    categoryLabel: 'Szkolne • Librus',
    room: 'Sala 1.16',
    teacher: 'Becker Adam',
    indicatorColor: 'bg-primary',
    title: 'Sieci komputerowe',
    description: 'Konfiguracja protokołu OSPF i adresacja IPv6.'
  },

  // Piątek (fri)
  {
    id: 'fri_1',
    day: 'fri',
    timeStart: '08:00',
    timeEnd: '09:35',
    duration: '95 min',
    category: 'librus',
    categoryLabel: 'Szkolne • Librus',
    room: 'Sala 1.16',
    teacher: 'Wojnarowski Przemysław',
    indicatorColor: 'bg-primary',
    title: 'Urządzenia techniki komputerowej',
    description: 'Pomiary oscyloskopowe linii zasilania i magistrali I2C.'
  },
  {
    id: 'fri_2',
    day: 'fri',
    timeStart: '09:50',
    timeEnd: '10:35',
    duration: '45 min',
    category: 'librus',
    categoryLabel: 'Szkolne • Librus',
    room: 'Sala 31',
    teacher: 'Kolasińska Paulina',
    indicatorColor: 'bg-secondary',
    title: 'Geografia',
    description: 'Geopolityka i surowce strategiczne.'
  },
  {
    id: 'fri_3',
    day: 'fri',
    timeStart: '10:40',
    timeEnd: '11:25',
    duration: '45 min',
    category: 'librus',
    categoryLabel: 'Szkolne • Librus',
    room: 'Sala 12',
    teacher: 'Müller Jan',
    indicatorColor: 'bg-secondary',
    title: 'Język Niemiecki',
    description: 'Komunikacja zawodowa w IT.'
  },
  {
    id: 'fri_4',
    day: 'fri',
    timeStart: '17:30',
    timeEnd: '18:45',
    duration: '75 min',
    category: 'personal',
    categoryLabel: 'Osobiste • Trening',
    room: 'Dom / Strych',
    indicatorColor: 'bg-tertiary',
    title: 'FBW Strych (Sesja C)',
    description: 'Podciąganie, Dipy, OHP, Brzuch.',
    hasWorkoutBtn: true
  },

  // Sobota (sat)
  {
    id: 'sat_1',
    day: 'sat',
    timeStart: '09:00',
    timeEnd: '10:00',
    duration: '60 min',
    category: 'personal',
    categoryLabel: 'Osobiste • Regeneracja',
    badge: 'RECOVERY',
    indicatorColor: 'bg-secondary-container',
    title: 'Regeneracja, Mobilność & Rozciąganie',
    description: 'Rolowanie powięziowe, mobilizacja bioder i barków po tygodniu FBW.',
    statusText: 'Zaplanowano'
  },
  {
    id: 'sat_2',
    day: 'sat',
    timeStart: '11:00',
    timeEnd: '13:30',
    duration: '150 min',
    category: 'personal',
    categoryLabel: 'Osobiste • OSINT',
    badge: 'DEEP DIVE',
    indicatorColor: 'bg-primary',
    title: 'Przegląd OSINT & Rozbudowa Bazy Wiedzy',
    description: 'Weryfikacja węzłów i relacji w Obsidian Vault, indeksowanie FTS5.',
    statusText: 'Zaplanowano'
  },
  {
    id: 'sat_3',
    day: 'sat',
    timeStart: '16:00',
    timeEnd: '17:30',
    duration: '90 min',
    category: 'personal',
    categoryLabel: 'Osobiste • Outdoor',
    badge: 'CARDIO',
    indicatorColor: 'bg-tertiary',
    title: 'Aktywny Wypoczynek na Świeżym Powietrzu',
    description: 'Spacer tlenowy, regeneracja układu nerwowego (CNS).'
  },

  // Niedziela (sun)
  {
    id: 'sun_1',
    day: 'sun',
    timeStart: '10:00',
    timeEnd: '11:30',
    duration: '90 min',
    category: 'personal',
    categoryLabel: 'Osobiste • Przegląd',
    badge: 'PLANNING',
    indicatorColor: 'bg-secondary',
    title: 'Planowanie Nadchodzącego Tygodnia & Cele',
    description: 'Harmonogram akademicki Tydzień B, rozpisanie progresji ciężarów FBW.',
    statusText: 'Planowanie'
  },
  {
    id: 'sun_2',
    day: 'sun',
    timeStart: '12:00',
    timeEnd: '13:00',
    duration: '60 min',
    category: 'personal',
    categoryLabel: 'Osobiste • Finanse',
    badge: 'BUDGET',
    indicatorColor: 'bg-emerald-500',
    title: 'Przegląd Budżetu i Kopert 50/30/20',
    description: 'Weryfikacja wydatków z Pushbullet, bilansowanie tygodniowe.'
  },
  {
    id: 'sun_3',
    day: 'sun',
    timeStart: '18:00',
    timeEnd: '20:00',
    duration: '120 min',
    category: 'personal',
    categoryLabel: 'Osobiste • Przygotowanie',
    badge: 'PREPARATION',
    indicatorColor: 'bg-primary',
    title: 'Przygotowanie Materiałów Edukacyjnych',
    description: 'Syllabusy, zaktualizowanie repozytoriów git i notatek z wykładów.'
  }
];

export const TimetablePage = () => {
  // Filters & State
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'librus' | 'personal'
  const [selectedDay, setSelectedDay] = useState('wed'); // 'all_week' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
  const [scheduleItems, setScheduleItems] = useState(INITIAL_SCHEDULE);
  
  // Clock Ticker
  const [currentTime, setCurrentTime] = useState(() => {
    const d = new Date();
    return d.toTimeString().split(' ')[0];
  });

  // Diagnostics & Sync
  const [isLibrusEnabled, setIsLibrusEnabled] = useState(() => {
    return localStorage.getItem('system_librus_enabled') === 'true';
  });

  useEffect(() => {
    const handleLibrusConfig = (e) => {
      if (e.detail?.enabled !== undefined) {
        setIsLibrusEnabled(e.detail.enabled);
      } else {
        setIsLibrusEnabled(localStorage.getItem('system_librus_enabled') === 'true');
      }
    };
    window.addEventListener('librusConfigChanged', handleLibrusConfig);
    window.addEventListener('systemConfigUpdated', handleLibrusConfig);
    return () => {
      window.removeEventListener('librusConfigChanged', handleLibrusConfig);
      window.removeEventListener('systemConfigUpdated', handleLibrusConfig);
    };
  }, []);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastVerifyText, setLastVerifyText] = useState('8 min temu');
  
  // Quick Exception Form & Toast
  const [quickTitle, setQuickTitle] = useState('');
  const [quickStartTime, setQuickStartTime] = useState('12:00');
  const [quickBlockType, setQuickBlockType] = useState('personal');
  const [showToast, setShowToast] = useState(false);

  // New Block Modal
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDay, setModalDay] = useState('wed');
  const [modalStart, setModalStart] = useState('14:00');
  const [modalEnd, setModalEnd] = useState('15:00');
  const [modalCategory, setModalCategory] = useState('personal');
  const [modalRoom, setModalRoom] = useState('');
  const [modalDesc, setModalDesc] = useState('');

  // Clock interval
  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setCurrentTime(d.toTimeString().split(' ')[0]);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Realtime Cloud sync
  useEffect(() => {
    let unsubscribe;
    try {
      unsubscribe = subscribeCollection(
        CLOUD_COLLECTIONS.TIMETABLE,
        (data) => {
          if (data && data.length > 0) {
            const cloudCustoms = data.map(item => ({
              id: item.id || `cloud_${Math.random()}`,
              day: item.day || 'wed',
              timeStart: item.time_start || item.timeStart || '12:00',
              timeEnd: item.time_end || item.timeEnd || '13:00',
              duration: item.duration || '60 min',
              category: item.category === 'school' ? 'librus' : (item.category || 'personal'),
              categoryLabel: item.category === 'school' ? 'Szkolne • Librus' : 'Osobiste',
              badge: item.badge || (item.category === 'school' ? 'Librus' : 'Custom'),
              indicatorColor: item.category === 'school' ? 'bg-primary' : 'bg-secondary',
              title: item.subject || item.title || 'Zadanie',
              description: item.notes || item.description || '',
              room: item.room || '',
              teacher: item.teacher || '',
            }));
            
            setScheduleItems(prev => {
              const existingIds = new Set(prev.map(p => p.id));
              const additions = cloudCustoms.filter(c => !existingIds.has(c.id));
              return [...prev, ...additions];
            });
          }
        },
        () => {}
      );
    } catch {
      // Offline fallback
    }

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Filter items by category first
  const categoryFiltered = useMemo(() => {
    if (activeFilter === 'all') return scheduleItems;
    return scheduleItems.filter(item => item.category === activeFilter);
  }, [activeFilter, scheduleItems]);

  // Filter items for single day view
  const singleDaySchedule = useMemo(() => {
    if (selectedDay === 'all_week') return categoryFiltered;
    return categoryFiltered.filter(item => (item.day || 'wed') === selectedDay);
  }, [categoryFiltered, selectedDay]);

  // Group items by day for Week Grid (Librus App Style)
  const weekColumns = useMemo(() => {
    const days = [
      { id: 'mon', label: 'Poniedziałek', short: 'Pon 14' },
      { id: 'tue', label: 'Wtorek', short: 'Wt 15' },
      { id: 'wed', label: 'Środa (Dziś)', short: 'Śr 16', isToday: true },
      { id: 'thu', label: 'Czwartek', short: 'Czw 17' },
      { id: 'fri', label: 'Piątek', short: 'Pt 18' },
      { id: 'sat', label: 'Sobota', short: 'Sob 19' },
      { id: 'sun', label: 'Niedziela', short: 'Ndz 20' }
    ];

    return days.map(d => {
      const items = categoryFiltered
        .filter(item => (item.day || 'wed') === d.id)
        .sort((a, b) => (a.timeStart || '').localeCompare(b.timeStart || ''));
      return { ...d, items };
    });
  }, [categoryFiltered]);

  const fetchLibrusSchedule = async (isManualRefresh = false) => {
    setIsSyncing(true);
    try {
      const isCloud = isCloudEnvironment();
      const endpoint = isCloud ? '/api/librus?path=timetable' : '/api/librus/timetable';
      const refreshQuery = isManualRefresh ? (isCloud ? '&refresh=true' : '?refresh=true') : '';
      const url = `${endpoint}${refreshQuery}`;

      const res = await axios.get(url, { timeout: 15000 });
      if (res.data?.success && Array.isArray(res.data.lessons)) {
        const dayMap = {
          monday: 'mon', mon: 'mon', poniedziałek: 'mon',
          tuesday: 'tue', tue: 'tue', wtorek: 'tue',
          wednesday: 'wed', wed: 'wed', środa: 'wed',
          thursday: 'thu', thu: 'thu', czwartek: 'thu',
          friday: 'fri', fri: 'fri', piątek: 'fri',
          saturday: 'sat', sat: 'sat', sobota: 'sat',
          sunday: 'sun', sun: 'sun', niedziela: 'sun'
        };

        const parsedLessons = res.data.lessons.map(l => {
          const mappedDay = dayMap[(l.day || '').toLowerCase()] || 'wed';
          const isCancelled = Boolean(l.isCancelled || l.status === 'cancelled' || (l.notes && l.notes.includes('ODWOŁANA')));
          return {
            id: l.id || `librus_${Math.random()}`,
            day: mappedDay,
            timeStart: l.time_start || l.timeStart || '08:00',
            timeEnd: l.time_end || l.timeEnd || '08:45',
            duration: l.duration || '45 min',
            category: 'librus',
            categoryLabel: 'Szkolne • Librus',
            room: l.room || '',
            teacher: l.cleanTeacher || l.teacher || '',
            indicatorColor: isCancelled ? 'bg-error' : (l.color ? `bg-${l.color}` : 'bg-primary'),
            title: l.subject || l.title || 'Lekcja',
            description: l.notes || l.description || '',
            isCancelled,
            statusText: isCancelled ? '[!] Odwołana' : (l.statusText || 'Zajęcia w planie'),
            librusSyncTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
        });

        setScheduleItems(prev => {
          const personalItems = prev.filter(item => item.category === 'personal');
          return [...parsedLessons, ...personalItems];
        });
        setLastVerifyText('Przed chwilą (0 s)');
      }
    } catch (err) {
      console.warn('[!] ALERT :: Timetable Librus fetch warning:', err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (isLibrusEnabled) {
      fetchLibrusSchedule(false);
    }
  }, [isLibrusEnabled]);

  // Run Librus Sync
  const handleLibrusSync = async () => {
    setIsSyncing(true);
    if (isLibrusEnabled) {
      await fetchLibrusSchedule(true);
    } else {
      setTimeout(() => {
        setIsSyncing(false);
        setLastVerifyText('Przed chwilą (0 s)');
        alert('[*] Tryb autonomiczny: Plan dnia zaktualizowany z bazy lokalnej (bez Librus API).');
      }, 800);
    }
  };

  // Handle Quick Exception Submit
  const handleQuickException = (e) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    const targetDay = selectedDay === 'all_week' ? 'wed' : selectedDay;
    const newBlock = {
      id: `quick_${Date.now()}`,
      day: targetDay,
      timeStart: quickStartTime || '12:00',
      timeEnd: '12:45',
      duration: '45 min',
      category: quickBlockType === 'librus' ? 'librus' : 'personal',
      categoryLabel: quickBlockType === 'librus' ? 'Szkolne / Uczelnia' : 'Osobiste / Rutyna',
      badge: 'SZYBKI WYJĄTEK',
      indicatorColor: quickBlockType === 'librus' ? 'bg-primary' : 'bg-secondary',
      title: quickTitle.trim(),
      description: 'Zarejestrowano jako szybki wyjątek w buforze dnia.',
    };

    setScheduleItems(prev => [newBlock, ...prev]);
    setQuickTitle('');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);

    try {
      saveCloudDocument(CLOUD_COLLECTIONS.TIMETABLE, {
        id: newBlock.id,
        day: newBlock.day,
        title: newBlock.title,
        subject: newBlock.title,
        time_start: newBlock.timeStart,
        time_end: newBlock.timeEnd,
        category: newBlock.category === 'librus' ? 'school' : 'personal',
        notes: newBlock.description,
        createdAt: new Date().toISOString()
      }).catch((err) => console.debug('Cloud save error:', err));
    } catch (err) {
      console.debug('Failed to save cloud exception:', err);
    }
  };

  // Handle Add Full Modal Block
  const handleModalSave = (e) => {
    e.preventDefault();
    if (!modalTitle.trim()) return;

    const newBlock = {
      id: `modal_${Date.now()}`,
      day: modalDay || (selectedDay === 'all_week' ? 'wed' : selectedDay),
      timeStart: modalStart,
      timeEnd: modalEnd,
      duration: `${modalStart} - ${modalEnd}`,
      category: modalCategory,
      categoryLabel: modalCategory === 'librus' ? 'Szkolne • Librus' : 'Osobiste (Własne)',
      badge: modalCategory === 'librus' ? 'Librus' : 'Własny Blok',
      indicatorColor: modalCategory === 'librus' ? 'bg-primary' : 'bg-secondary-container',
      title: modalTitle.trim(),
      room: modalRoom,
      description: modalDesc || 'Blok zdefiniowany przez operatora.',
    };

    setScheduleItems(prev => [...prev, newBlock]);
    setShowModal(false);
    setModalTitle('');
    setModalDesc('');
    setModalRoom('');

    try {
      saveCloudDocument(CLOUD_COLLECTIONS.TIMETABLE, {
        id: newBlock.id,
        day: newBlock.day,
        title: newBlock.title,
        subject: newBlock.title,
        time_start: newBlock.timeStart,
        time_end: newBlock.timeEnd,
        room: newBlock.room,
        category: newBlock.category === 'librus' ? 'school' : 'personal',
        notes: newBlock.description,
        createdAt: new Date().toISOString()
      }).catch((err) => console.debug('Cloud save error:', err));
    } catch (err) {
      console.debug('Failed to save cloud exception:', err);
    }
  };

  // Export iCal function
  const handleExportICal = () => {
    const calendarEvents = scheduleItems.map(item => `
BEGIN:VEVENT
SUMMARY:${item.title}
DESCRIPTION:${item.description || ''}
LOCATION:${item.room || ''}
STATUS:CONFIRMED
END:VEVENT`).join('\n');

    const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//OmniDash//Harmonogram v3.0//PL\n${calendarEvents}\nEND:VCALENDAR`;
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'harmonogram_omnidash.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col w-full gap-space-lg">
      {/* Top Command Context Bar */}
      <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-space-md pb-space-xs">
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center gap-space-xs text-outline font-label-sm text-label-sm uppercase tracking-wider">
            <span>Szkic Czasowy</span>
            <span>/</span>
            <span className="text-primary font-code-mono">v3.0.4-live</span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-semibold">
            Plan Dnia i Harmonogram Tygodnia
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-space-xs flex-wrap">
            <span>Integracja z Librus API</span>
            <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
            <span>Osobista rutyna dobowa (06:00 - 23:00)</span>
            <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
            <span className="text-secondary">Dwukierunkowa synchronizacja</span>
          </p>
        </div>

        {/* Segmented Filter & Main CTA Toolbar */}
        <div className="flex flex-wrap items-center gap-space-sm">
          <div className="flex items-center p-1 rounded-lg bg-surface-container-lowest" role="tablist">
            <button 
              className={`px-space-md py-1 rounded font-label-md text-label-md transition-all ${
                activeFilter === 'all' 
                  ? 'bg-surface-container-high text-on-surface shadow-sm font-medium' 
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              onClick={() => setActiveFilter('all')} 
              type="button"
            >
              Wszystkie
            </button>
            <button 
              className={`px-space-md py-1 rounded font-label-md text-label-md transition-all ${
                activeFilter === 'librus' 
                  ? 'bg-surface-container-high text-on-surface shadow-sm font-medium' 
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              onClick={() => setActiveFilter('librus')} 
              type="button"
            >
              Szkolne (Librus)
            </button>
            <button 
              className={`px-space-md py-1 rounded font-label-md text-label-md transition-all ${
                activeFilter === 'personal' 
                  ? 'bg-surface-container-high text-on-surface shadow-sm font-medium' 
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              onClick={() => setActiveFilter('personal')} 
              type="button"
            >
              Osobiste (Rutyna &amp; Cele)
            </button>
          </div>

          <div className="flex items-center gap-space-xs">
            <button 
              className="flex items-center gap-space-xs px-space-md py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors font-label-md text-label-md cursor-pointer"
              onClick={handleLibrusSync} 
              type="button"
            >
              <span className={`material-symbols-outlined text-[16px] text-primary ${isSyncing ? 'animate-spin' : ''}`}>
                sync
              </span>
              <span>{isLibrusEnabled ? 'Synchronizuj Librus (API)' : 'Synchronizuj Lokalnie (Offline)'}</span>
            </button>
            
            <button 
              className="flex items-center gap-space-xs px-space-md py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors font-label-md text-label-md cursor-pointer" 
              onClick={handleExportICal}
              type="button"
            >
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">file_download</span>
              <span>Eksport iCal</span>
            </button>
            
            <button 
              className="flex items-center gap-space-xs px-space-md py-2 rounded-lg bg-primary-container text-on-primary-container hover:brightness-110 transition-all font-label-md text-label-md font-semibold cursor-pointer shadow-sm" 
              onClick={() => setShowModal(true)}
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Nowy Blok Własny</span>
            </button>
          </div>
        </div>
      </header>

      {/* Metrics Ribbon */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col justify-between relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-outline font-label-sm text-label-sm uppercase tracking-wider">
            <span>Kalendarz Akademicki</span>
            <span className="material-symbols-outlined text-[18px] text-primary">calendar_today</span>
          </div>
          <div className="mt-space-md">
            <div className="font-headline-md text-headline-md text-on-surface font-semibold">Środa, 16 Października 2026</div>
            <div className="font-code-mono text-code-mono text-secondary mt-space-xs">Tydzień A (Nieparzysty)</div>
          </div>
          <div className="w-full bg-surface-container h-1 rounded-full mt-space-md overflow-hidden">
            <div className="bg-primary h-full w-3/5"></div>
          </div>
        </div>

        <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-outline font-label-sm text-label-sm uppercase tracking-wider">
            <span>Alokacja Czasowa</span>
            <span className="material-symbols-outlined text-[18px] text-secondary">timelapse</span>
          </div>
          <div className="mt-space-md flex items-baseline gap-space-xs">
            <span className="font-display-lg text-headline-xl text-on-surface font-semibold tracking-tight">
              {selectedDay === 'all_week' ? '32h 15m' : `${singleDaySchedule.length} bloków`}
            </span>
            <span className="font-label-md text-label-md text-outline">
              {selectedDay === 'all_week' ? '/ 34 bloki' : `w wybranym dniu`}
            </span>
          </div>
          <div className="font-code-mono text-code-mono text-on-surface-variant text-[11px] mt-space-xs flex items-center gap-space-xs">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            <span>
              {selectedDay === 'all_week' ? 'Siatka pełnego tygodnia Librus' : `Wyświetlanie: ${DAYS_DATA.find(d => d.id === selectedDay)?.name || selectedDay}`}
            </span>
          </div>
        </div>

        <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-outline font-label-sm text-label-sm uppercase tracking-wider">
            <span>Wolne Okienka</span>
            <span className="material-symbols-outlined text-[18px] text-tertiary">hourglass_empty</span>
          </div>
          <div className="mt-space-md flex items-baseline gap-space-xs">
            <span className="font-display-lg text-headline-xl text-tertiary font-semibold tracking-tight">45 min</span>
            <span className="font-label-md text-label-md text-outline">1 okienko</span>
          </div>
          <div className="font-body-md text-body-md text-on-surface-variant text-[12px] truncate">
            11:40 - 12:25 • Czytelnia biblioteczna
          </div>
        </div>

        <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-outline font-label-sm text-label-sm uppercase tracking-wider">
            <span>Kluczowy Cel Fizyczny</span>
            <span className="material-symbols-outlined text-[18px] text-primary">fitness_center</span>
          </div>
          <div className="mt-space-md flex items-baseline justify-between">
            <div>
              <span className="font-display-lg text-headline-xl text-on-surface font-semibold tracking-tight">17:30</span>
              <span className="font-label-md text-label-md text-primary font-medium block">FBW Strych</span>
            </div>
            <a 
              className="px-space-sm py-1 rounded bg-surface-container-high text-primary hover:bg-surface-bright transition-colors font-label-sm text-label-sm uppercase tracking-wider font-semibold" 
              href="/workouts"
            >
              Przygotuj
            </a>
          </div>
          <div className="font-code-mono text-code-mono text-outline text-[11px] mt-space-xs">
            RPE Target: 8.5 • Podciąganie + Dipy + OHP
          </div>
        </div>
      </section>

      {/* Day Selection Pill Matrix + All Week Switcher */}
      <section className="flex items-center gap-space-xs overflow-x-auto pb-space-xs pt-1">
        {DAYS_DATA.map((day) => {
          const isSelected = selectedDay === day.id;
          return (
            <button
              key={day.id}
              onClick={() => setSelectedDay(day.id)}
              className={`flex flex-col items-center justify-center min-w-[104px] py-space-sm px-space-md rounded-xl transition-all cursor-pointer ${
                isSelected
                  ? 'bg-surface-container-high text-on-surface shadow-sm ring-1 ring-primary/40 relative'
                  : `bg-surface-container-low text-on-surface-variant hover:bg-surface-container ${day.muted ? 'opacity-60' : ''}`
              }`}
              type="button"
            >
              <span className={`font-label-sm text-label-sm uppercase tracking-widest ${isSelected ? 'text-primary font-bold' : 'text-outline'}`}>
                {day.name}
              </span>
              <span className={`font-headline-md text-headline-md ${isSelected ? 'text-primary font-bold' : 'text-on-surface font-semibold'}`}>
                {day.dayNumber}
              </span>
              <span className={`font-code-mono text-[10px] ${isSelected ? 'text-on-surface' : 'text-outline'}`}>
                {day.blocks}
              </span>
              {isSelected && <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-primary"></span>}
            </button>
          );
        })}
      </section>

      {/* MAIN VIEW: All Week Column Grid (Librus App Style) OR Single Day Timeline View */}
      {selectedDay === 'all_week' ? (
        /* ================= CAŁY TYDZIEŃ: SIATKA KOLUMNOWA LIBRUS ================= */
        <section className="flex flex-col gap-space-md">
          <div className="flex items-center justify-between px-space-md py-space-xs rounded-lg bg-surface-container-lowest font-code-mono text-code-mono text-outline">
            <div className="flex items-center gap-space-xs">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              <span className="text-on-surface font-medium">Harmonogram Pełnego Tygodnia (Librus App Grid)</span>
            </div>
            <div className="flex items-center gap-space-sm text-[12px]">
              <span className="px-2 py-0.5 rounded bg-surface-container text-primary">Widok 7 kolumn</span>
              <span>Kliknij kafelek dnia na górze, aby przejść do szczegółowej osi czasu</span>
            </div>
          </div>

          {/* 7 Columns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-space-sm items-start">
            {weekColumns.map((col) => (
              <div 
                key={col.id} 
                className={`flex flex-col rounded-xl p-space-sm gap-space-xs transition-all ${
                  col.isToday 
                    ? 'bg-surface-container-high/80 ring-1 ring-primary/40 shadow-md' 
                    : 'bg-surface-container-low border border-white/[0.04]'
                }`}
              >
                {/* Column Header */}
                <div 
                  onClick={() => setSelectedDay(col.id)}
                  className="flex items-center justify-between pb-space-xs border-b border-white/[0.06] cursor-pointer hover:text-primary transition-colors"
                >
                  <span className={`font-label-md text-label-md font-bold ${col.isToday ? 'text-primary' : 'text-on-surface'}`}>
                    {col.short}
                  </span>
                  <span className="font-code-mono text-[10px] text-outline">
                    {col.items.length} zajęć
                  </span>
                </div>

                {/* Column Cards */}
                <div className="flex flex-col gap-space-xs min-h-[300px]">
                  {col.items.length === 0 ? (
                    <div className="py-8 text-center text-outline font-code-mono text-[11px]">
                      Brak zaplanowanych bloków
                    </div>
                  ) : (
                    col.items.map((item) => (
                      <div
                        key={item.id}
                        className={`p-2.5 rounded-lg flex flex-col gap-1 transition-all ${
                          item.isCancelled
                            ? 'bg-error-container/20 border border-error/30 opacity-75'
                            : item.isActive
                            ? 'bg-primary/15 border border-primary/40 shadow-sm'
                            : 'bg-surface-container hover:bg-surface-container-high border border-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] font-code-mono">
                          <span className={`${item.isCancelled ? 'text-error line-through' : item.isActive ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>
                            {item.timeStart} - {item.timeEnd}
                          </span>
                          {item.room && (
                            <span className="px-1.5 py-0.2 rounded bg-surface-container-highest text-[10px] text-outline">
                              {item.room}
                            </span>
                          )}
                        </div>

                        <h4 className={`font-headline-md text-[13px] font-medium leading-snug ${
                          item.isCancelled 
                            ? 'text-outline line-through' 
                            : item.isActive 
                            ? 'text-primary font-bold' 
                            : 'text-on-surface'
                        }`}>
                          {item.title}
                        </h4>

                        <div className="flex items-center justify-between text-[10px] pt-0.5">
                          {item.isCancelled ? (
                            <span className="text-error font-bold tracking-tight">
                              [!] Odwołana
                            </span>
                          ) : item.teacher ? (
                            <span className="text-outline truncate max-w-[110px]">
                              {item.teacher}
                            </span>
                          ) : (
                            <span className="text-secondary font-medium">
                              {item.categoryLabel}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        /* ================= POJEDYNCZY DZIEŃ: OŚ CZASU (8 COLS) + INSPEKTOR (4 COLS) ================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
          {/* Timeline Stream */}
          <div className="lg:col-span-8 flex flex-col gap-space-md">
            {/* Current Time Marker Bar */}
            <div className="flex items-center justify-between px-space-md py-space-xs rounded-lg bg-surface-container-lowest font-code-mono text-code-mono text-outline">
              <div className="flex items-center gap-space-xs">
                <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                <span className="text-on-surface font-medium">
                  Wybrany dzień: {DAYS_DATA.find(d => d.id === selectedDay)?.name || selectedDay}
                </span>
              </div>
              <div className="flex items-center gap-space-md">
                <span>Strefa: CET (UTC+2)</span>
                <span className="text-primary font-semibold">{currentTime}</span>
              </div>
            </div>

            {/* Schedule List for the Selected Day */}
            {singleDaySchedule.length === 0 ? (
              <div className="p-space-xl rounded-xl bg-surface-container-low text-center flex flex-col items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[36px] text-outline opacity-40">event_busy</span>
                <h3 className="font-headline-md text-headline-md text-on-surface">Brak bloków na ten dzień</h3>
                <p className="font-body-md text-body-md text-outline">
                  Dla wybranego dnia ({DAYS_DATA.find(d => d.id === selectedDay)?.name}) nie zdefiniowano jeszcze zajęć. Użyj przycisku &quot;Nowy Blok Własny&quot; powyżej.
                </p>
              </div>
            ) : (
              singleDaySchedule.map((item) => {
                // Cancelled Block
                if (item.isCancelled) {
                  return (
                    <article 
                      key={item.id} 
                      className="schedule-card p-space-md rounded-xl bg-surface-container-lowest opacity-75 flex flex-col md:flex-row md:items-center justify-between gap-space-md relative overflow-hidden" 
                      data-category={item.category}
                    >
                      <div className="flex items-start gap-space-md">
                        <div className="flex flex-col items-end w-28 shrink-0">
                          <span className="font-code-mono text-headline-md text-error line-through font-semibold">{item.timeStart}</span>
                          <span className="font-code-mono text-code-mono text-outline line-through">{item.timeEnd}</span>
                          <span className="font-label-sm text-[10px] uppercase text-error mt-1 font-semibold">{item.duration}</span>
                        </div>
                        <div className="w-1 self-stretch rounded-full bg-error"></div>
                        <div className="flex flex-col gap-space-xs">
                          <div className="flex items-center gap-space-xs">
                            <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm uppercase font-bold tracking-wide">
                              {item.categoryLabel}
                            </span>
                            <span className="font-code-mono text-[11px] text-outline">Librus Sync: {item.librusSyncTime || '08:12'}</span>
                          </div>
                          <h2 className="font-headline-md text-headline-md text-outline line-through font-medium">
                            {item.title}
                          </h2>
                          <div className="flex items-center gap-space-xs text-tertiary font-body-md text-body-md">
                            <span className="material-symbols-outlined text-[16px]">info</span>
                            <span>{item.infoText || 'Okienko czasowe: 45 min na powtórkę w bibliotece'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-space-xs self-end md:self-center shrink-0">
                        <button 
                          className="px-space-md py-1.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-label-md text-label-md cursor-pointer" 
                          onClick={() => setShowModal(true)}
                          type="button"
                        >
                          Przypisz Zadanie
                        </button>
                      </div>
                    </article>
                  );
                }

                // Active Focus Block
                if (item.isActive) {
                  return (
                    <article 
                      key={item.id} 
                      className="schedule-card group p-space-md rounded-xl bg-surface-container-high shadow-md flex flex-col md:flex-row md:items-center justify-between gap-space-md relative overflow-hidden" 
                      data-category={item.category}
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary"></div>
                      <div className="flex items-start gap-space-md pl-1">
                        <div className="flex flex-col items-end w-28 shrink-0">
                          <span className="font-code-mono text-headline-md text-primary font-bold">{item.timeStart}</span>
                          <span className="font-code-mono text-code-mono text-on-surface-variant">{item.timeEnd}</span>
                          <span className="font-label-sm text-[10px] uppercase text-primary font-semibold mt-1">Aktywny</span>
                        </div>
                        <div className="w-1 self-stretch rounded-full bg-primary/40"></div>
                        <div className="flex flex-col gap-space-xs">
                          <div className="flex items-center gap-space-xs flex-wrap">
                            <span className="px-2 py-0.5 rounded-full bg-primary text-on-primary font-label-sm text-label-sm uppercase font-semibold">
                              Trwa teraz
                            </span>
                            {item.room && (
                              <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface font-code-mono text-[11px]">
                                {item.room}
                              </span>
                            )}
                            {item.teacher && (
                              <span className="font-code-mono text-[11px] text-outline">
                                {item.teacher}
                              </span>
                            )}
                          </div>
                          <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
                            {item.title}
                          </h2>
                          <p className="font-body-md text-body-md text-on-surface-variant">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-space-xs self-end md:self-center shrink-0">
                        <button 
                          className="px-space-md py-1.5 rounded-lg bg-surface-container-highest text-primary hover:bg-surface-bright transition-colors font-label-md text-label-md font-medium flex items-center gap-1 cursor-pointer" 
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit_note</span>
                          <span>Notatka</span>
                        </button>
                      </div>
                    </article>
                  );
                }

                // Normal Schedule Block
                return (
                  <article 
                    key={item.id} 
                    className="schedule-card group p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-all flex flex-col md:flex-row md:items-center justify-between gap-space-md relative overflow-hidden" 
                    data-category={item.category}
                  >
                    <div className="flex items-start gap-space-md">
                      <div className="flex flex-col items-end w-28 shrink-0">
                        <span className={`font-code-mono text-headline-md font-semibold ${item.hasWorkoutBtn ? 'text-tertiary' : 'text-on-surface'}`}>
                          {item.timeStart}
                        </span>
                        <span className="font-code-mono text-code-mono text-outline">{item.timeEnd}</span>
                        <span className={`font-label-sm text-[10px] uppercase mt-1 ${item.hasWorkoutBtn ? 'text-tertiary' : 'text-primary'}`}>
                          {item.duration}
                        </span>
                      </div>
                      <div className={`w-1 self-stretch rounded-full ${item.indicatorColor || 'bg-primary'}`}></div>
                      <div className="flex flex-col gap-space-xs">
                        <div className="flex items-center gap-space-xs flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm uppercase ${
                            item.category === 'personal' 
                              ? (item.hasWorkoutBtn ? 'bg-tertiary/15 text-tertiary font-semibold' : 'bg-secondary-container/40 text-secondary') 
                              : 'bg-primary/10 text-primary'
                          }`}>
                            {item.categoryLabel}
                          </span>
                          {item.badge && (
                            <span className="font-code-mono text-[11px] text-outline">
                              {item.badge}
                            </span>
                          )}
                          {item.room && (
                            <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-code-mono text-[11px]">
                              {item.room}
                            </span>
                          )}
                          {item.teacher && (
                            <span className="font-code-mono text-[11px] text-outline">
                              {item.teacher}
                            </span>
                          )}
                        </div>
                        <h2 className={`font-headline-md text-headline-md text-on-surface font-medium transition-colors ${
                          item.hasWorkoutBtn ? 'group-hover:text-tertiary' : 'group-hover:text-primary'
                        }`}>
                          {item.title}
                        </h2>
                        {item.description && (
                          <p className="font-body-md text-body-md text-on-surface-variant">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-space-xs self-end md:self-center shrink-0">
                      {item.statusText && (
                        <span className="px-space-sm py-1 rounded bg-surface-container font-code-mono text-[11px] text-outline">
                          {item.statusText}
                        </span>
                      )}
                      {item.hasWorkoutBtn ? (
                        <a 
                          className="flex items-center gap-space-xs px-space-md py-2 rounded-lg bg-tertiary-container text-on-tertiary hover:brightness-110 transition-all font-label-md text-label-md font-semibold cursor-pointer" 
                          href="/workouts"
                        >
                          <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                          <span>Rozpocznij Sesję w /workouts</span>
                        </a>
                      ) : (
                        <button 
                          className="w-8 h-8 rounded flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer" 
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[18px]">more_vert</span>
                        </button>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>

          {/* Right Inspector / System Integration Sidebar */}
          <aside className="lg:col-span-4 flex flex-col gap-space-md">
            {/* API Diagnostics Card */}
            <section className="p-space-md rounded-xl bg-surface-container-low flex flex-col gap-space-md shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-primary text-[20px]">hub</span>
                  <span className="font-headline-md text-headline-md text-on-surface font-semibold">Librus Synergia API</span>
                </div>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary font-code-mono text-label-sm font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  CONNECTED
                </span>
              </div>
              <div className="flex flex-col gap-space-xs p-space-sm rounded-lg bg-surface-container">
                <div className="flex justify-between items-center text-body-md">
                  <span className="text-on-surface-variant font-label-md">Status Tokenu:</span>
                  <span className="text-on-surface font-code-mono text-code-mono">Aktywny (OAuth2)</span>
                </div>
                <div className="flex justify-between items-center text-body-md">
                  <span className="text-on-surface-variant font-label-md">Ostatnia weryfikacja:</span>
                  <span className="text-on-surface font-code-mono text-code-mono">{lastVerifyText}</span>
                </div>
                <div className="flex justify-between items-center text-body-md">
                  <span className="text-on-surface-variant font-label-md">Ostatni zrzut zmian:</span>
                  <span className="text-secondary font-code-mono text-code-mono">1 zaktualizowany blok</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-outline font-label-sm text-label-sm pt-space-xs">
                <span>Interwał cron: co 15 minut</span>
                <a className="text-primary hover:underline cursor-pointer" href="/server-logs">Logi bramki API</a>
              </div>
            </section>

            {/* Knowledge Hub / Obsidian Links */}
            <section className="p-space-md rounded-xl bg-surface-container-low flex flex-col gap-space-md shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-secondary text-[20px]">library_books</span>
                  <span className="font-headline-md text-headline-md text-on-surface font-semibold">Baza Obsidian</span>
                </div>
                <span className="font-code-mono text-label-sm text-outline">Vault: root/edu</span>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Dwukierunkowe powiązania Markdown zsynchronizowane z bieżącym semestrem.
              </p>
              <div className="flex flex-col gap-space-xs">
                <a 
                  className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors group cursor-pointer" 
                  href="/knowledge"
                >
                  <div className="flex items-center gap-space-xs font-code-mono text-code-mono text-on-surface">
                    <span className="text-secondary">[[</span>
                    <span className="group-hover:text-primary transition-colors">Harmonogram-Semestr</span>
                    <span className="text-secondary">]]</span>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-outline group-hover:text-on-surface">arrow_forward</span>
                </a>
                <a 
                  className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors group cursor-pointer" 
                  href="/knowledge"
                >
                  <div className="flex items-center gap-space-xs font-code-mono text-code-mono text-on-surface">
                    <span className="text-secondary">[[</span>
                    <span className="group-hover:text-primary transition-colors">Rutyna-Dnia</span>
                    <span className="text-secondary">]]</span>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-outline group-hover:text-on-surface">arrow_forward</span>
                </a>
                <a 
                  className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors group cursor-pointer" 
                  href="/knowledge"
                >
                  <div className="flex items-center gap-space-xs font-code-mono text-code-mono text-on-surface">
                    <span className="text-secondary">[[</span>
                    <span className="group-hover:text-primary transition-colors">Syllabus-Matematyka-Dyskretna</span>
                    <span className="text-secondary">]]</span>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-outline group-hover:text-on-surface">arrow_forward</span>
                </a>
              </div>
            </section>

            {/* Quick Exception / Task Injector */}
            <section className="p-space-md rounded-xl bg-surface-container-low flex flex-col gap-space-md shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-tertiary text-[20px]">bolt</span>
                  <span className="font-headline-md text-headline-md text-on-surface font-semibold">Wyjątek do Planu</span>
                </div>
                <span className="font-label-sm text-label-sm text-outline uppercase font-medium">Szybki Zapis</span>
              </div>
              
              <form className="flex flex-col gap-space-sm" onSubmit={handleQuickException}>
                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider" htmlFor="exceptionTitle">
                    Tytuł zadania / wyjątku
                  </label>
                  <input 
                    id="exceptionTitle"
                    type="text" 
                    value={quickTitle}
                    onChange={(e) => setQuickTitle(e.target.value)}
                    placeholder="np. Konsultacje z fizyki, Zakupy przedtreningowe" 
                    className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface font-body-md text-body-md placeholder-outline focus:outline-none focus:ring-1 focus:ring-primary" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-space-xs">
                  <div className="flex flex-col gap-1">
                    <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider" htmlFor="startTime">
                      Od godz.
                    </label>
                    <input 
                      id="startTime"
                      type="text" 
                      value={quickStartTime}
                      onChange={(e) => setQuickStartTime(e.target.value)}
                      className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface font-code-mono text-code-mono focus:outline-none focus:ring-1 focus:ring-primary" 
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider" htmlFor="blockType">
                      Typ bloku
                    </label>
                    <select 
                      id="blockType"
                      value={quickBlockType}
                      onChange={(e) => setQuickBlockType(e.target.value)}
                      className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="librus">Szkolne / Uczelnia</option>
                      <option value="personal">Osobiste / Rutyna</option>
                      <option value="study">Deep Study</option>
                    </select>
                  </div>
                </div>

                <button 
                  className="w-full py-2.5 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface transition-colors font-label-md text-label-md font-semibold flex items-center justify-center gap-space-xs mt-space-xs cursor-pointer shadow-sm" 
                  type="submit"
                >
                  <span className="material-symbols-outlined text-[18px]">bookmark_add</span>
                  <span>Wstrzyknij w Bufor Dnia</span>
                </button>
              </form>

              {showToast && (
                <div className="p-space-sm rounded-lg bg-surface-container font-code-mono text-[11px] text-primary flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  <span>Wyjątek dopisany do lokalnego bufora SQLite.</span>
                </div>
              )}
            </section>

            {/* Day Completion Metric Radial Summary */}
            <section className="p-space-md rounded-xl bg-surface-container-low flex items-center justify-between shadow-sm">
              <div className="flex flex-col gap-space-xs">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Progres Dnia</span>
                <span className="font-headline-md text-headline-md text-on-surface font-semibold">
                  {Math.round((singleDaySchedule.filter(s => s.isDone).length / Math.max(1, singleDaySchedule.length)) * 100)}% zrealizowane
                </span>
                <span className="font-code-mono text-[11px] text-on-surface-variant">
                  Pozostało: {singleDaySchedule.filter(s => !s.isDone).length} bloków
                </span>
              </div>
              <div className="w-14 h-14 relative flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path 
                    className="text-surface-container-highest" 
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="3.5"
                  />
                  <path 
                    className="text-primary" 
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeDasharray={`${Math.round((singleDaySchedule.filter(s => s.isDone).length / Math.max(1, singleDaySchedule.length)) * 100)}, 100`} 
                    strokeLinecap="round" 
                    strokeWidth="3.5"
                  />
                </svg>
                <span className="absolute font-code-mono text-label-sm font-semibold text-on-surface">
                  {Math.round((singleDaySchedule.filter(s => s.isDone).length / Math.max(1, singleDaySchedule.length)) * 100)}%
                </span>
              </div>
            </section>
          </aside>
        </div>
      )}

      {/* Modal: Nowy Blok Własny */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface-container-low border border-surface-container-high rounded-2xl p-space-lg shadow-2xl flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">
                Dodaj Blok do Planu
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center transition-colors cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleModalSave} className="flex flex-col gap-space-sm">
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                  Nazwa Zajęć / Czynności
                </label>
                <input
                  type="text"
                  required
                  placeholder="np. Architektura Systemów, Trening FBW..."
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface placeholder-outline focus:outline-none focus:ring-1 focus:ring-primary font-body-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-space-sm">
                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                    Dzień
                  </label>
                  <select
                    value={modalDay}
                    onChange={(e) => setModalDay(e.target.value)}
                    className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface focus:outline-none focus:ring-1 focus:ring-primary font-body-md"
                  >
                    <option value="mon">Poniedziałek</option>
                    <option value="tue">Wtorek</option>
                    <option value="wed">Środa</option>
                    <option value="thu">Czwartek</option>
                    <option value="fri">Piątek</option>
                    <option value="sat">Sobota</option>
                    <option value="sun">Niedziela</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                    Sala / Miejsce
                  </label>
                  <input
                    type="text"
                    placeholder="np. Dom, Sala 104"
                    value={modalRoom}
                    onChange={(e) => setModalRoom(e.target.value)}
                    className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface placeholder-outline focus:outline-none focus:ring-1 focus:ring-primary font-body-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-space-sm">
                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                    Początek
                  </label>
                  <input
                    type="time"
                    required
                    value={modalStart}
                    onChange={(e) => setModalStart(e.target.value)}
                    className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface font-code-mono focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                    Koniec
                  </label>
                  <input
                    type="time"
                    required
                    value={modalEnd}
                    onChange={(e) => setModalEnd(e.target.value)}
                    className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface font-code-mono focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                  Kategoria
                </label>
                <select
                  value={modalCategory}
                  onChange={(e) => setModalCategory(e.target.value)}
                  className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface focus:outline-none focus:ring-1 focus:ring-primary font-body-md"
                >
                  <option value="personal">Osobiste (Rutyna & Cele)</option>
                  <option value="librus">Szkolne (Librus / Uczelnia)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                  Notatki / Sylabus
                </label>
                <textarea
                  rows={2}
                  placeholder="Dodatkowe informacje, cele, linki..."
                  value={modalDesc}
                  onChange={(e) => setModalDesc(e.target.value)}
                  className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface placeholder-outline focus:outline-none focus:ring-1 focus:ring-primary font-body-md resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-space-sm pt-space-xs mt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-space-md py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-label-md transition-colors cursor-pointer"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-space-lg py-2 rounded-lg bg-primary text-on-primary font-semibold font-label-md hover:brightness-110 transition-all cursor-pointer shadow-md"
                >
                  Dodaj do Harmonogramu
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
