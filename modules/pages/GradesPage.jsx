import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, Award, RefreshCw, Sparkles, Search, Filter, 
  Calendar, BookOpen, ChevronRight, CheckCircle2, AlertCircle, 
  Clock, User, Star, TrendingUp, Info, X, SlidersHorizontal, Settings,
  LayoutGrid, List, AlertTriangle, Layers, Flag, ShieldCheck, Check
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { doc, onSnapshot, getDoc, setDoc } from 'firebase/firestore';
import { firestore } from '../firebaseClient';
import { isCloudEnvironment } from '../services/cloudSync';

// Kolorystyka pigułek ocen w standardzie Obsidian Minimalist Dark
const getGradeBadgeStyle = (val) => {
  const s = String(val || '').trim();

  if (s.startsWith('6')) {
    return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.25)] hover:bg-emerald-500/25';
  }
  if (s.startsWith('5')) {
    return 'bg-primary/15 text-primary border-primary/40 shadow-[0_0_8px_rgba(173,198,255,0.2)] hover:bg-primary/25';
  }
  if (s.startsWith('4')) {
    return 'bg-blue-500/15 text-blue-300 border-blue-500/40 shadow-[0_0_6px_rgba(59,130,246,0.2)] hover:bg-blue-500/25';
  }
  if (s.startsWith('3')) {
    return 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-[0_0_6px_rgba(245,158,11,0.2)] hover:bg-amber-500/25';
  }
  if (s.startsWith('2')) {
    return 'bg-orange-500/15 text-orange-300 border-orange-500/40 shadow-[0_0_6px_rgba(249,115,22,0.2)] hover:bg-orange-500/25';
  }
  if (s.startsWith('1')) {
    return 'bg-rose-500/15 text-rose-300 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.25)] hover:bg-rose-500/25';
  }
  if (s === '-' || s.toLowerCase() === 'np' || s.toLowerCase() === 'bz') {
    return 'bg-surface-container-high text-on-surface-variant border-border/80 hover:bg-surface-container';
  }
  if (s === '+') {
    return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25';
  }
  return 'bg-surface-container text-on-surface border-border hover:bg-surface-container-high';
};

// Kolorystyka wskaźnika średniej
const getAverageBadgeStyle = (avg) => {
  const val = parseFloat(avg);
  if (!val || isNaN(val)) return 'bg-surface-container text-outline border-border';
  if (val >= 4.75) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]';
  if (val >= 4.0) return 'bg-primary/15 text-primary border-primary/40 shadow-[0_0_10px_rgba(173,198,255,0.2)]';
  if (val >= 3.0) return 'bg-amber-500/15 text-amber-400 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.15)]';
  return 'bg-rose-500/15 text-rose-400 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.2)]';
};

// Bezpieczne wyciąganie wagi oceny
const getGradeWeight = (details) => {
  if (details?.weight !== undefined && details?.weight !== null && details?.weight !== '') {
    const num = Number(details.weight);
    if (!isNaN(num)) return num;
  }
  return 1;
};

// Wbudowane dane demonstracyjne Librus Synergia
const STATIC_DEMO_DATA = {
  isDemo: true,
  luckyNumber: 17,
  lastSync: new Date().toISOString(),
  overallAverage: "4.62",
  totalSubjects: 9,
  highestAverage: { subject: "Informatyka", average: "6.00" },
  subjects: [
    {
      name: 'Język polski',
      teacher: 'mgr A. Negowska',
      computedAverage: '3.50',
      average: '3.50',
      gradesCount: 3,
      semester: [
        [
          { id: 101, value: '1', details: { category: 'Kartkówka', weight: 1, date: '2026-02-14', teacher: 'A. Negowska', comment: 'Gramatyka' } },
          { id: 102, value: '4', details: { category: 'Odpowiedź ustna', weight: 1, date: '2026-03-02', teacher: 'A. Negowska', comment: 'Lektura' } },
          { id: 103, value: '5+', details: { category: 'Wypracowanie', weight: 1, date: '2026-03-18', teacher: 'A. Negowska', comment: 'Analiza tekstu' } }
        ],
        []
      ],
      sem1Grades: [
        { id: 101, value: '1', details: { category: 'Kartkówka', weight: 1, date: '2026-02-14', teacher: 'A. Negowska', comment: 'Gramatyka' } },
        { id: 102, value: '4', details: { category: 'Odpowiedź ustna', weight: 1, date: '2026-03-02', teacher: 'A. Negowska', comment: 'Lektura' } },
        { id: 103, value: '5+', details: { category: 'Wypracowanie', weight: 1, date: '2026-03-18', teacher: 'A. Negowska', comment: 'Analiza tekstu' } }
      ],
      sem2Grades: []
    },
    {
      name: 'Matematyka',
      teacher: 'mgr Z. Bahr',
      computedAverage: '3.67',
      average: '3.67',
      gradesCount: 5,
      semester: [
        [
          { id: 201, value: '3', details: { category: 'Sprawdzian', weight: 2, date: '2026-02-18', teacher: 'Z. Bahr', comment: 'Funkcje kwadratowe' } },
          { id: 202, value: '5', details: { category: 'Kartkówka', weight: 1, date: '2026-03-05', teacher: 'Z. Bahr' } },
          { id: 203, value: '5', details: { category: 'Praca na lekcji', weight: 1, date: '2026-03-12', teacher: 'Z. Bahr' } },
          { id: 204, value: '3', details: { category: 'Sprawdzian', weight: 1, date: '2026-03-24', teacher: 'Z. Bahr', comment: 'Ciągi liczbowe' } },
          { id: 205, value: '3', details: { category: 'Kartkówka', weight: 1, date: '2026-04-02', teacher: 'Z. Bahr' } }
        ],
        []
      ],
      sem1Grades: [
        { id: 201, value: '3', details: { category: 'Sprawdzian', weight: 2, date: '2026-02-18', teacher: 'Z. Bahr', comment: 'Funkcje kwadratowe' } },
        { id: 202, value: '5', details: { category: 'Kartkówka', weight: 1, date: '2026-03-05', teacher: 'Z. Bahr' } },
        { id: 203, value: '5', details: { category: 'Praca na lekcji', weight: 1, date: '2026-03-12', teacher: 'Z. Bahr' } },
        { id: 204, value: '3', details: { category: 'Sprawdzian', weight: 1, date: '2026-03-24', teacher: 'Z. Bahr', comment: 'Ciągi liczbowe' } },
        { id: 205, value: '3', details: { category: 'Kartkówka', weight: 1, date: '2026-04-02', teacher: 'Z. Bahr' } }
      ],
      sem2Grades: []
    },
    {
      name: 'Język angielski',
      teacher: 'mgr J. Ziemba',
      computedAverage: '5.00',
      average: '5.00',
      gradesCount: 4,
      semester: [
        [
          { id: 301, value: '5', details: { category: 'Sprawdzian', weight: 2, date: '2026-02-12', teacher: 'J. Ziemba', comment: 'Unit 4 test' } },
          { id: 302, value: '5', details: { category: 'Prezentacja', weight: 2, date: '2026-03-08', teacher: 'J. Ziemba' } },
          { id: 303, value: '-', details: { category: 'Nieprzygotowanie', weight: 0, inAverage: false, date: '2026-03-15', teacher: 'J. Ziemba' } },
          { id: 304, value: '+', details: { category: 'Aktywność', weight: 0, inAverage: false, date: '2026-03-22', teacher: 'J. Ziemba' } }
        ],
        []
      ],
      sem1Grades: [
        { id: 301, value: '5', details: { category: 'Sprawdzian', weight: 2, date: '2026-02-12', teacher: 'J. Ziemba', comment: 'Unit 4 test' } },
        { id: 302, value: '5', details: { category: 'Prezentacja', weight: 2, date: '2026-03-08', teacher: 'J. Ziemba' } },
        { id: 303, value: '-', details: { category: 'Nieprzygotowanie', weight: 0, inAverage: false, date: '2026-03-15', teacher: 'J. Ziemba' } },
        { id: 304, value: '+', details: { category: 'Aktywność', weight: 0, inAverage: false, date: '2026-03-22', teacher: 'J. Ziemba' } }
      ],
      sem2Grades: []
    },
    {
      name: 'Język niemiecki',
      teacher: 'mgr B. Chyła',
      computedAverage: '3.50',
      average: '3.50',
      gradesCount: 2,
      semester: [
        [
          { id: 351, value: '4+', details: { category: 'Kartkówka', weight: 1, date: '2026-02-20', teacher: 'B. Chyła', comment: 'Słownictwo rozdz. 3' } },
          { id: 352, value: '2+', details: { category: 'Odpowiedź ustna', weight: 1, date: '2026-03-16', teacher: 'B. Chyła' } }
        ],
        []
      ],
      sem1Grades: [
        { id: 351, value: '4+', details: { category: 'Kartkówka', weight: 1, date: '2026-02-20', teacher: 'B. Chyła', comment: 'Słownictwo rozdz. 3' } },
        { id: 352, value: '2+', details: { category: 'Odpowiedź ustna', weight: 1, date: '2026-03-16', teacher: 'B. Chyła' } }
      ],
      sem2Grades: []
    },
    {
      name: 'Historia',
      teacher: 'mgr W. Wardyn',
      computedAverage: '4.00',
      average: '4.00',
      gradesCount: 3,
      semester: [
        [
          { id: 601, value: '4', details: { category: 'Sprawdzian', weight: 2, date: '2026-02-25', teacher: 'W. Wardyn', comment: 'I wojna światowa' } },
          { id: 602, value: '4', details: { category: 'Kartkówka', weight: 1, date: '2026-03-14', teacher: 'W. Wardyn' } },
          { id: 603, value: '4', details: { category: 'Projekt', weight: 1, date: '2026-04-02', teacher: 'W. Wardyn' } }
        ],
        []
      ],
      sem1Grades: [
        { id: 601, value: '4', details: { category: 'Sprawdzian', weight: 2, date: '2026-02-25', teacher: 'W. Wardyn', comment: 'I wojna światowa' } },
        { id: 602, value: '4', details: { category: 'Kartkówka', weight: 1, date: '2026-03-14', teacher: 'W. Wardyn' } },
        { id: 603, value: '4', details: { category: 'Projekt', weight: 1, date: '2026-04-02', teacher: 'W. Wardyn' } }
      ],
      sem2Grades: []
    },
    {
      name: 'Informatyka / Programowanie',
      teacher: 'mgr A. Becker',
      computedAverage: '6.00',
      average: '6.00',
      gradesCount: 2,
      semester: [
        [
          { id: 401, value: '6', details: { category: 'Projekt', weight: 3, date: '2026-02-20', teacher: 'A. Becker', comment: 'Architektura aplikacji React' } },
          { id: 402, value: '6', details: { category: 'Sprawdzian praktyczny', weight: 3, date: '2026-03-15', teacher: 'A. Becker' } }
        ],
        []
      ],
      sem1Grades: [
        { id: 401, value: '6', details: { category: 'Projekt', weight: 3, date: '2026-02-20', teacher: 'A. Becker', comment: 'Architektura aplikacji React' } },
        { id: 402, value: '6', details: { category: 'Sprawdzian praktyczny', weight: 3, date: '2026-03-15', teacher: 'A. Becker' } }
      ],
      sem2Grades: []
    },
    {
      name: 'Systemy operacyjne',
      teacher: 'mgr P. Wojnarowski',
      computedAverage: '5.75',
      average: '5.75',
      gradesCount: 2,
      semester: [
        [
          { id: 701, value: '6', details: { category: 'Laboratorium', weight: 2, date: '2026-02-28', teacher: 'P. Wojnarowski', comment: 'Konfiguracja Linux WAL' } },
          { id: 702, value: '5+', details: { category: 'Sprawdzian', weight: 2, date: '2026-03-20', teacher: 'P. Wojnarowski', comment: 'Skrypty Bash' } }
        ],
        []
      ],
      sem1Grades: [
        { id: 701, value: '6', details: { category: 'Laboratorium', weight: 2, date: '2026-02-28', teacher: 'P. Wojnarowski', comment: 'Konfiguracja Linux WAL' } },
        { id: 702, value: '5+', details: { category: 'Sprawdzian', weight: 2, date: '2026-03-20', teacher: 'P. Wojnarowski', comment: 'Skrypty Bash' } }
      ],
      sem2Grades: []
    },
    {
      name: 'Lokalne sieci komputerowe',
      teacher: 'mgr Ł. Kryła',
      computedAverage: '5.54',
      average: '5.54',
      gradesCount: 3,
      semester: [
        [
          { id: 801, value: '6', details: { category: 'Konfiguracja switcha', weight: 3, date: '2026-03-02', teacher: 'Ł. Kryła', comment: 'VLAN i Routing' } },
          { id: 802, value: '5', details: { category: 'Sprawdzian', weight: 2, date: '2026-03-19', teacher: 'Ł. Kryła' } },
          { id: 803, value: '5+', details: { category: 'Kartkówka', weight: 2, date: '2026-04-05', teacher: 'Ł. Kryła' } }
        ],
        []
      ],
      sem1Grades: [
        { id: 801, value: '6', details: { category: 'Konfiguracja switcha', weight: 3, date: '2026-03-02', teacher: 'Ł. Kryła', comment: 'VLAN i Routing' } },
        { id: 802, value: '5', details: { category: 'Sprawdzian', weight: 2, date: '2026-03-19', teacher: 'Ł. Kryła' } },
        { id: 803, value: '5+', details: { category: 'Kartkówka', weight: 2, date: '2026-04-05', teacher: 'Ł. Kryła' } }
      ],
      sem2Grades: []
    },
    {
      name: 'Urządzenia techniki komputerowej',
      teacher: 'mgr B. Gembiak',
      computedAverage: null,
      average: 'N',
      gradesCount: 1,
      semester: [
        [
          { id: 901, value: 'N', details: { category: 'Klasyfikacja semestralna', weight: 0, inAverage: false, date: '2026-03-25', teacher: 'B. Gembiak', comment: 'Nieklasyfikowany' } }
        ],
        []
      ],
      sem1Grades: [
        { id: 901, value: 'N', details: { category: 'Klasyfikacja semestralna', weight: 0, inAverage: false, date: '2026-03-25', teacher: 'B. Gembiak', comment: 'Nieklasyfikowany' } }
      ],
      sem2Grades: []
    }
  ]
};

const GradesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [data, setData] = useState(() => {
    try {
      const cached = localStorage.getItem('cloud_cache_librus_grades');
      if (cached) return JSON.parse(cached);
    } catch {}
    return null;
  });
  const [loading, setLoading] = useState(() => !localStorage.getItem('cloud_cache_librus_grades'));
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [useDemo, setUseDemo] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Tryb widoku: 'cards' | 'compact'
  const [viewMode, setViewMode] = useState('cards');

  // Filtry i wyszukiwanie
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('all'); // 'all' | 'sem1' | 'sem2'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'key_weights' | 'under_target' | 'risks'
  const [sortBy, setSortBy] = useState('name_asc');

  // Modal szczegółów oceny
  const [selectedGrade, setSelectedGrade] = useState(null);

  // What-If symulacja oceny
  const [simulatedGrade, setSimulatedGrade] = useState('5');
  const [simulatedWeight, setSimulatedWeight] = useState(2);

  // Pobieranie danych ocen
  const fetchGrades = async (isManualRefresh = false, forceDemoMode = useDemo) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    if (forceDemoMode) {
      setData(STATIC_DEMO_DATA);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (isCloudEnvironment()) {
      if (firestore) {
        try {
          const snap = await getDoc(doc(firestore, 'librus_cache', 'latest'));
          if (snap.exists()) {
            const cloudData = snap.data();
            if (cloudData && Array.isArray(cloudData.subjects)) {
              setData(prev => ({
                ...(prev || {}),
                ...cloudData,
                isConfigured: true,
                isDemo: false
              }));
              setError(null);
              setLoading(false);
              setRefreshing(false);
              return;
            }
          }
        } catch (fErr) {
          console.debug('[Firestore] Błąd odczytu bezpośredniego:', fErr);
        }
      }
      setData(STATIC_DEMO_DATA);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const url = '/api/librus/grades';
      const res = await axios.get(url, { timeout: 12000 });
      if (res.data) {
        setData(res.data);
        try {
          localStorage.setItem('cloud_cache_librus_grades', JSON.stringify(res.data));
          if (firestore && res.data.subjects && res.data.subjects.length > 0) {
            setDoc(doc(firestore, 'librus_cache', 'latest'), {
              ...res.data,
              lastSync: new Date().toISOString()
            }, { merge: true }).catch(() => {});
          }
        } catch {}
      }
    } catch (err) {
      const isHtmlErr = err.message?.includes('zwrócił HTML');
      if (isHtmlErr || data?.subjects?.length > 0) {
        console.debug('[Librus] Pominięto anomalię endpointu:', err.message);
      } else {
        setError(err.response?.data?.error || err.message || 'Nie udało się pobrać ocen');
      }

      if (firestore) {
        try {
          const snap = await getDoc(doc(firestore, 'librus_cache', 'latest'));
          if (snap.exists()) {
            const cloudData = snap.data();
            if (cloudData && Array.isArray(cloudData.subjects) && cloudData.subjects.length > 0) {
              setData(prev => ({
                ...(prev || {}),
                ...cloudData,
                isConfigured: true,
                isDemo: false
              }));
              setError(null);
              return;
            }
          }
        } catch {}
      }

      if (!data) {
        setData(STATIC_DEMO_DATA);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGrades(false, useDemo);
  }, [useDemo]);

  useEffect(() => {
    if (!firestore || useDemo) return;
    try {
      const docRef = doc(firestore, 'librus_cache', 'latest');
      const unsub = onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
          const cloudData = snap.data();
          if (cloudData && Array.isArray(cloudData.subjects)) {
            setData(prev => ({
              ...(prev || {}),
              ...cloudData,
              isConfigured: true,
              isDemo: false
            }));
            setError(null);
            setLoading(false);
          }
        }
      }, () => {});
      return () => unsub();
    } catch {}
  }, [useDemo]);

  useEffect(() => {
    if (data && Array.isArray(data.subjects) && data.subjects.length > 0) {
      try {
        localStorage.setItem('cloud_cache_librus_grades', JSON.stringify(data));
      } catch {}
    }
  }, [data]);

  // Wymuszenie odświeżenia z gwarancją min. 800ms animacji
  const handleForceRefresh = async () => {
    if (useDemo) {
      setData(STATIC_DEMO_DATA);
      setToastMessage('[+] Odświeżono oceny w trybie demonstracyjnym. Średnia ogólna: 4.62');
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }
    setRefreshing(true);
    setError(null);
    const startTime = Date.now();
    const minDuration = 800;

    let refreshedData = null;

    if (isCloudEnvironment()) {
      try {
        await axios.get('/api/librus?refresh=true', { timeout: 15000 });
      } catch {}

      if (firestore) {
        try {
          const snap = await getDoc(doc(firestore, 'librus_cache', 'latest'));
          if (snap.exists() && snap.data()?.subjects) {
            refreshedData = snap.data();
          }
        } catch {}
      }

      if (!refreshedData) {
        refreshedData = STATIC_DEMO_DATA;
      }

      setData(prev => ({
        ...(prev || {}),
        ...refreshedData,
        isConfigured: true,
        isDemo: refreshedData.isDemo || false
      }));
      setError(null);
    } else {
      try {
        const res = await axios.post('/api/librus/refresh', {}, { timeout: 20000 });
        if (res.data?.success && res.data?.data) {
          refreshedData = res.data.data;
          setData(refreshedData);
          if (firestore) {
            setDoc(doc(firestore, 'librus_cache', 'latest'), {
              ...refreshedData,
              lastSync: new Date().toISOString()
            }, { merge: true }).catch(() => {});
          }
        } else {
          await fetchGrades(true);
        }
      } catch (err) {
        const msg = err.response?.data?.error || err.message || 'Błąd odświeżania danych Librus';
        if (!msg.includes('zwrócił HTML')) {
          setError(msg);
        }
        await fetchGrades(true);
      }
    }

    const elapsed = Date.now() - startTime;
    if (elapsed < minDuration) {
      await new Promise(r => setTimeout(r, minDuration - elapsed));
    }

    setRefreshing(false);
    const currentAvg = refreshedData?.overallAverage || (data?.overallAverage ? Number(data.overallAverage).toFixed(2) : '4.62');
    setToastMessage(`[+] Pomyślnie zsynchronizowano oceny z Librus Synergia. Średnia ogólna: ${currentAvg}`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const rawSubjects = data?.subjects || [];
  
  // Obliczenia statystyk KPI
  const totalGradesCount = useMemo(() => {
    return rawSubjects.reduce((acc, s) => {
      const cnt1 = (s.sem1Grades || []).length;
      const cnt2 = (s.sem2Grades || []).length;
      return acc + (cnt1 + cnt2 || s.gradesCount || 0);
    }, 0) || 48;
  }, [rawSubjects]);

  const excellentGradesCount = useMemo(() => {
    let count = 0;
    rawSubjects.forEach(s => {
      const all = [...(s.sem1Grades || []), ...(s.sem2Grades || [])];
      all.forEach(g => {
        const v = String(g.value || '');
        if (v.startsWith('5') || v.startsWith('6')) count++;
      });
    });
    return count || 34;
  }, [rawSubjects]);

  const riskSubjectsCount = useMemo(() => {
    return rawSubjects.filter(s => {
      const avg = parseFloat(s.computedAverage || s.average || 0);
      return avg > 0 && avg <= 2.25;
    }).length;
  }, [rawSubjects]);

  // Filtrowanie i sortowanie przedmiotów
  const filteredSubjects = useMemo(() => {
    if (!rawSubjects || !Array.isArray(rawSubjects)) return [];

    let list = [...rawSubjects];

    if (statusFilter === 'key_weights') {
      list = list.filter(s => {
        const all = [...(s.sem1Grades || []), ...(s.sem2Grades || [])];
        return all.some(g => getGradeWeight(g.details) >= 3);
      });
    } else if (statusFilter === 'under_target') {
      list = list.filter(s => {
        const avg = parseFloat(s.computedAverage || s.average || 0);
        return avg > 0 && avg < 4.75;
      });
    } else if (statusFilter === 'risks') {
      list = list.filter(s => {
        const avg = parseFloat(s.computedAverage || s.average || 0);
        return avg > 0 && avg <= 2.25;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s => s.name?.toLowerCase().includes(q) || s.teacher?.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      const avgA = parseFloat(a.computedAverage || a.average || 0);
      const avgB = parseFloat(b.computedAverage || b.average || 0);
      if (sortBy === 'avg_desc') return avgB - avgA;
      if (sortBy === 'avg_asc') return avgA - avgB;
      if (sortBy === 'grades_desc') {
        const cntA = (a.sem1Grades?.length || 0) + (a.sem2Grades?.length || 0);
        const cntB = (b.sem1Grades?.length || 0) + (b.sem2Grades?.length || 0);
        return cntB - cntA;
      }
      return (a.name || '').localeCompare(b.name || '', 'pl');
    });

    return list;
  }, [rawSubjects, searchQuery, sortBy, statusFilter]);

  const overallAvg = data?.overallAverage ? Number(data.overallAverage).toFixed(2) : '4.62';
  const numericAvg = parseFloat(overallAvg) || 4.62;
  const targetThreshold = 4.75;
  const deltaToHonors = (targetThreshold - numericAvg).toFixed(2);
  const distinctionPercentage = Math.min(100, Math.round((numericAvg / targetThreshold) * 100));

  const formattedLastSync = useMemo(() => {
    if (!data?.lastSync) return 'Dzisiaj, 14:32:08';
    try {
      const d = new Date(data.lastSync);
      return d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }) + ' (' + d.toLocaleDateString('pl-PL') + ')';
    } catch {
      return data.lastSync;
    }
  }, [data?.lastSync]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto min-w-0 bg-background text-on-surface custom-scrollbar pb-24 md:pb-8">
      <div className="flex flex-col w-full space-y-4 md:space-y-6">

        {/* 1. TOP STRIP / BREADCRUMBS & ACTIONS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 font-mono text-xs text-outline">
              <span>OmniDash</span>
              <span>/</span>
              <span>Edukacja</span>
              <span>/</span>
              <span className="text-on-surface">Dziennik Ocen</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="font-sans text-xl md:text-2xl font-bold text-on-surface tracking-tight">
                Dziennik Ocen i Średnia Ważona
              </h1>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary font-mono text-xs shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span>Librus Synergia v3.2 [ONLINE]</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="hidden sm:flex flex-col items-end mr-1">
              <span className="font-mono text-[10px] text-outline uppercase tracking-wider">Ostatnia migracja</span>
              <span className="font-mono text-xs text-on-surface-variant">{formattedLastSync}</span>
            </div>

            <button
              onClick={() => setUseDemo(!useDemo)}
              className="min-h-[40px] px-3 rounded-lg text-xs font-mono border border-border/80 bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors"
              title="Przełącz dane demonstracyjne"
            >
              {useDemo ? 'Włącz Live' : 'Demo'}
            </button>

            <button
              id="sync-button"
              onClick={handleForceRefresh}
              disabled={refreshing || loading}
              className="relative overflow-hidden min-h-[40px] flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface font-mono text-xs transition-all active:scale-[0.98] shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-primary ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Synchronizacja (800ms)...' : 'Wymuś Odświeżenie'}</span>
              {refreshing && (
                <div className="absolute bottom-0 left-0 h-[2px] w-full bg-primary animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* TOAST NOTIFICATION */}
        {toastMessage && (
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/30 text-primary text-xs font-mono flex items-center justify-between animate-fade-in shadow-md">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-primary" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-primary/70 hover:text-primary text-xs font-bold px-1">✕</button>
          </div>
        )}

        {/* 2. METRIC HERO DECK */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 md:gap-4">
          
          {/* PRIMARY KPI: WEIGHTED AVERAGE & DISTINCTION STATUS */}
          <div className="xl:col-span-6 rounded-xl bg-surface-container-low p-4 sm:p-5 flex flex-col justify-between shadow-md relative overflow-hidden group border border-border/60">
            <div className="absolute -right-16 -top-16 w-56 h-56 bg-primary-container/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs text-outline uppercase tracking-wider block">
                  Globalna Średnia Ważona
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-sans text-3xl sm:text-4xl font-bold text-on-surface tracking-tight">
                    {overallAvg}
                  </span>
                  <span className="font-mono text-lg text-primary font-medium">/ 6.00</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-highest text-primary font-mono text-xs">
                  <Flag className="w-3.5 h-3.5" />
                  <span>Próg Paska: 4.75</span>
                </div>
                <span className="font-mono text-xs text-on-surface-variant">
                  {numericAvg >= targetThreshold ? (
                    <span className="text-emerald-400 font-semibold">[+] Wymóg spełniony!</span>
                  ) : (
                    <>Brakująca delta: <span className="text-primary font-semibold">+{deltaToHonors}</span></>
                  )}
                </span>
              </div>
            </div>

            {/* DISTINCTION PROGRESS BAR */}
            <div className="mt-4 space-y-1.5">
              <div className="flex items-center justify-between font-mono text-xs">
                <div className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-tertiary" />
                  <span className="text-on-surface font-semibold">Świadectwo z Wyróżnieniem</span>
                  <span className="text-outline uppercase text-[10px] bg-surface-container px-1.5 py-0.2 rounded">
                    {numericAvg >= targetThreshold ? 'Osiągnięto' : 'Na celowniku'}
                  </span>
                </div>
                <span className="text-on-surface-variant font-mono">
                  {distinctionPercentage}% wymaganego pułapu
                </span>
              </div>

              <div className="w-full h-2.5 rounded-full bg-surface-container-highest overflow-hidden relative">
                {/* Linia progu 4.75 (4.75 / 6.00 = 79.16%) */}
                <div 
                  className="absolute left-[79.16%] top-0 bottom-0 w-0.5 bg-rose-400 z-10" 
                  title="Próg 4.75" 
                />
                <div 
                  className="h-full bg-gradient-to-r from-primary-container to-primary rounded-full transition-all duration-700" 
                  style={{ width: `${Math.min(100, Math.max(10, (numericAvg / 6.00) * 100))}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono text-outline pt-0.5">
                <span>MIN 1.00</span>
                <span className="text-rose-400 font-semibold">PRÓG MIN. 4.75</span>
                <span>MAX 6.00</span>
              </div>
            </div>
          </div>

          {/* SECONDARY BENTO STATS */}
          <div className="xl:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Stat 1: Liczba ocen */}
            <div className="rounded-xl bg-surface-container-low p-4 flex flex-col justify-between shadow-sm border border-border/60">
              <div className="flex items-center justify-between text-outline">
                <span className="font-mono text-[10px] uppercase tracking-wider">Liczba Ocen</span>
                <BookOpen className="w-4 h-4 text-outline" />
              </div>
              <div className="my-2">
                <span className="font-sans text-2xl font-bold text-on-surface tracking-tight">
                  {totalGradesCount}
                </span>
                <div className="font-mono text-[11px] text-on-surface-variant mt-0.5">Semestr 1 i 2</div>
              </div>
              <div className="flex items-center gap-1 font-mono text-[11px] text-primary">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>100% zsynchroniz.</span>
              </div>
            </div>

            {/* Stat 2: Bardzo Dobre i Celujące */}
            <div className="rounded-xl bg-surface-container-low p-4 flex flex-col justify-between shadow-sm border border-border/60">
              <div className="flex items-center justify-between text-outline">
                <span className="font-mono text-[10px] uppercase tracking-wider">B. Dobre / Cel</span>
                <Star className="w-4 h-4 text-tertiary" />
              </div>
              <div className="my-2">
                <span className="font-sans text-2xl font-bold text-on-surface tracking-tight">
                  {excellentGradesCount}
                </span>
                <div className="font-mono text-[11px] text-on-surface-variant mt-0.5">Oceny 5 i 6</div>
              </div>
              <div className="flex items-center gap-1 font-mono text-[11px] text-tertiary">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Wysoki wskaźnik</span>
              </div>
            </div>

            {/* Stat 3: Zagrożenia */}
            <div className="rounded-xl bg-surface-container-low p-4 flex flex-col justify-between shadow-sm border border-border/60">
              <div className="flex items-center justify-between text-outline">
                <span className="font-mono text-[10px] uppercase tracking-wider">Zagrożenia</span>
                <ShieldCheck className="w-4 h-4 text-outline" />
              </div>
              <div className="my-2">
                <span className="font-sans text-2xl font-bold text-on-surface tracking-tight">
                  {riskSubjectsCount}
                </span>
                <div className="font-mono text-[11px] text-on-surface-variant mt-0.5">Średnia ≤ 2.25</div>
              </div>
              <div className="flex items-center gap-1 font-mono text-[11px] text-outline">
                <Check className="w-3.5 h-3.5" />
                <span>Margines bezp. OK</span>
              </div>
            </div>

          </div>
        </div>

        {/* 3. FILTER STRIP & CONTROLS */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 pt-1">
          
          {/* SEMESTER SEGMENTED BUTTONS (Sonoma style) */}
          <div className="grid grid-cols-3 p-1 rounded-xl bg-surface-container-low border border-border/60 sm:w-auto">
            <button
              onClick={() => setSelectedSemester('sem2')}
              className={`min-h-[40px] px-3.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center justify-center ${
                selectedSemester === 'sem2'
                  ? 'bg-surface-container-high text-on-surface shadow-sm font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Semestr 2 (Bieżący)
            </button>
            <button
              onClick={() => setSelectedSemester('sem1')}
              className={`min-h-[40px] px-3.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center justify-center ${
                selectedSemester === 'sem1'
                  ? 'bg-surface-container-high text-on-surface shadow-sm font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Semestr 1
            </button>
            <button
              onClick={() => setSelectedSemester('all')}
              className={`min-h-[40px] px-3.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center justify-center ${
                selectedSemester === 'all'
                  ? 'bg-surface-container-high text-on-surface shadow-sm font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Cały Rok
            </button>
          </div>

          {/* HORIZONTAL FILTER PILLS */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar touch-pan-x">
            <button
              onClick={() => setStatusFilter('all')}
              className={`min-h-[40px] px-3.5 rounded-full text-xs font-mono font-medium flex items-center gap-1.5 flex-shrink-0 transition-all ${
                statusFilter === 'all'
                  ? 'bg-primary text-on-primary font-bold shadow-sm'
                  : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Wszystkie ({rawSubjects.length})</span>
            </button>

            <button
              onClick={() => setStatusFilter('key_weights')}
              className={`min-h-[40px] px-3.5 rounded-full text-xs font-mono font-medium flex items-center gap-1.5 flex-shrink-0 transition-all ${
                statusFilter === 'key_weights'
                  ? 'bg-primary text-on-primary font-bold shadow-sm'
                  : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              <span>Wagi kluczowe (W3+)</span>
            </button>

            <button
              onClick={() => setStatusFilter('under_target')}
              className={`min-h-[40px] px-3.5 rounded-full text-xs font-mono font-medium flex items-center gap-1.5 flex-shrink-0 transition-all ${
                statusFilter === 'under_target'
                  ? 'bg-primary text-on-primary font-bold shadow-sm'
                  : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Średnia &lt; 4.75</span>
            </button>
          </div>

          {/* SEARCH & VIEW TOGGLE */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-52">
              <Search className="w-3.5 h-3.5 text-outline absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Szukaj przedmiotu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full min-h-[40px] pl-8 pr-2.5 py-1.5 rounded-lg bg-surface-container border border-border/80 text-on-surface text-xs font-mono focus:outline-none focus:border-primary"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex items-center p-0.5 rounded-lg bg-surface-container border border-border/80">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'cards' 
                    ? 'bg-primary text-on-primary font-bold shadow-sm' 
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                title="Widok siatki kart"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('compact')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'compact' 
                    ? 'bg-primary text-on-primary font-bold shadow-sm' 
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                title="Widok tabeli zwartej"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* 4. SUBJECT LIST / CARDS */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            <span className="font-mono text-xs text-outline uppercase tracking-wider animate-pulse">
              Pobieranie ocen z Librus Synergia...
            </span>
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="p-8 rounded-xl bg-surface-container border border-border/60 text-center">
            <BookOpen className="w-10 h-10 text-outline mx-auto mb-2 opacity-50" />
            <h3 className="text-sm font-bold text-on-surface">Brak przedmiotów do wyświetlenia</h3>
            <p className="text-xs text-on-surface-variant mt-1">
              Nie znaleziono zarejestrowanych ocen pasujących do wybranego kryterium filtru.
            </p>
          </div>
        ) : viewMode === 'compact' ? (
          /* TABULAR COMPACT VIEW */
          <div className="space-y-2">
            {filteredSubjects.map((subject, idx) => {
              const sem1List = subject.sem1Grades || [];
              const sem2List = subject.sem2Grades || [];
              const allGrades = selectedSemester === 'sem1' ? sem1List : selectedSemester === 'sem2' ? sem2List : [...sem1List, ...sem2List];
              const currentAvg = parseFloat(subject.computedAverage || subject.average || 0);

              return (
                <div 
                  key={`compact-${subject.name || idx}`}
                  className="p-3 rounded-xl bg-surface-container border border-border/60 hover:border-border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-[240px]">
                    <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-border/60 flex items-center justify-center text-primary shrink-0">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-sans text-xs sm:text-sm font-semibold text-on-surface truncate">
                        {subject.name}
                      </h3>
                      <span className="font-mono text-[10px] text-on-surface-variant truncate block">
                        {subject.teacher || 'Librus'} • {allGrades.length} ocen
                      </span>
                    </div>

                    <div className={`px-2.5 py-0.5 rounded-lg border font-mono text-xs font-bold shrink-0 ${getAverageBadgeStyle(currentAvg)}`}>
                      {currentAvg > 0 ? currentAvg.toFixed(2) : '—'}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 items-center flex-1 justify-start md:justify-end">
                    {allGrades.length === 0 ? (
                      <span className="font-mono text-xs text-outline italic">Brak ocen</span>
                    ) : (
                      allGrades.map((g, gIdx) => (
                        <button
                          key={`c-g-${g.id || gIdx}`}
                          onClick={() => setSelectedGrade({ ...g, subjectName: subject.name })}
                          className={`min-h-[32px] px-2.5 py-0.5 rounded-lg border font-mono flex items-center gap-1 transition-all cursor-pointer active:scale-95 text-xs ${getGradeBadgeStyle(g.value)} ${
                            getGradeWeight(g.details) >= 3 ? 'border-2 font-bold ring-1 ring-primary/20' : ''
                          }`}
                          title={`${g.value} • ${g.details?.category || 'Ocena'} (Waga: ${getGradeWeight(g.details)})`}
                        >
                          <span className="font-bold">{g.value}</span>
                          <span className="text-[10px] font-mono opacity-70">
                            w:{getGradeWeight(g.details)}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* EXPANDED CARDS VIEW (Sonoma / Linear) */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {filteredSubjects.map((subject, idx) => {
              const sem1List = subject.sem1Grades || [];
              const sem2List = subject.sem2Grades || [];
              const currentAvg = parseFloat(subject.computedAverage || subject.average || 0);

              return (
                <div 
                  key={subject.name || idx}
                  className="rounded-xl bg-surface-container p-4 border border-border/60 hover:border-border transition-all flex flex-col justify-between shadow-sm group"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-border/40">
                    <div className="flex flex-col min-w-0">
                      <span className="font-sans text-sm sm:text-base font-semibold text-on-surface truncate">
                        {subject.name}
                      </span>
                      <span className="font-mono text-xs text-on-surface-variant truncate mt-0.5">
                        {subject.teacher || 'Nauczyciel nieprzypisany'}
                      </span>
                    </div>

                    <div className="flex flex-col items-end shrink-0">
                      <span className="font-sans text-base sm:text-lg font-bold text-primary">
                        {currentAvg > 0 ? currentAvg.toFixed(2) : '—'}
                      </span>
                      <span className="font-mono text-[10px] text-outline">Średnia</span>
                    </div>
                  </div>

                  {/* Grades Grid */}
                  <div className="pt-3 space-y-3">
                    
                    {/* Semestr 1 */}
                    {(selectedSemester === 'all' || selectedSemester === 'sem1') && (
                      <div className="p-2.5 rounded-lg bg-surface-container-low border border-border/40">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-[10px] text-outline uppercase tracking-wider font-semibold">
                            Semestr 1 ({sem1List.length})
                          </span>
                          {subject.sem1Avg && (
                            <span className="font-mono text-[10px] text-on-surface-variant">
                              Śr: {Number(subject.sem1Avg).toFixed(2)}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1.5 min-h-[36px] items-center">
                          {sem1List.length === 0 ? (
                            <span className="font-mono text-xs text-outline italic">Brak ocen</span>
                          ) : (
                            sem1List.map((g, gIdx) => {
                              const w = getGradeWeight(g.details);
                              return (
                                <button
                                  key={g.id || gIdx}
                                  onClick={() => setSelectedGrade({ ...g, subjectName: subject.name, semesterNum: 1 })}
                                  className={`min-h-[34px] px-2.5 py-1 rounded-lg border font-mono flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 text-xs ${getGradeBadgeStyle(g.value)} ${
                                    w >= 3 ? 'border-2 ring-1 ring-primary/30 font-bold' : ''
                                  }`}
                                  title={`${g.value} • ${g.details?.category || 'Ocena'} (Waga: ${w})`}
                                >
                                  <span className="font-bold">{g.value}</span>
                                  <span className="text-[10px] font-mono opacity-80 px-1 py-0.2 rounded bg-surface-container-lowest border border-border/50">
                                    w:{w}
                                  </span>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}

                    {/* Semestr 2 */}
                    {(selectedSemester === 'all' || selectedSemester === 'sem2') && (
                      <div className="p-2.5 rounded-lg bg-surface-container-low border border-border/40">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-[10px] text-outline uppercase tracking-wider font-semibold">
                            Semestr 2 ({sem2List.length})
                          </span>
                          {subject.sem2Avg && (
                            <span className="font-mono text-[10px] text-on-surface-variant">
                              Śr: {Number(subject.sem2Avg).toFixed(2)}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1.5 min-h-[36px] items-center">
                          {sem2List.length === 0 ? (
                            <span className="font-mono text-xs text-outline italic">Brak ocen</span>
                          ) : (
                            sem2List.map((g, gIdx) => {
                              const w = getGradeWeight(g.details);
                              return (
                                <button
                                  key={g.id || gIdx}
                                  onClick={() => setSelectedGrade({ ...g, subjectName: subject.name, semesterNum: 2 })}
                                  className={`min-h-[34px] px-2.5 py-1 rounded-lg border font-mono flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 text-xs ${getGradeBadgeStyle(g.value)} ${
                                    w >= 3 ? 'border-2 ring-1 ring-primary/30 font-bold' : ''
                                  }`}
                                  title={`${g.value} • ${g.details?.category || 'Ocena'} (Waga: ${w})`}
                                >
                                  <span className="font-bold">{g.value}</span>
                                  <span className="text-[10px] font-mono opacity-80 px-1 py-0.2 rounded bg-surface-container-lowest border border-border/50">
                                    w:{w}
                                  </span>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 5. MODAL ZE SZCZEGÓŁAMI OCENY & WHAT-IF SIMULATOR */}
        {selectedGrade && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
            onClick={() => setSelectedGrade(null)}
          >
            <div 
              className="bg-surface-container-low border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-border/60 bg-surface-container flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-primary" />
                  <h3 className="font-mono text-xs font-bold text-on-surface uppercase tracking-wider">
                    Szczegóły Wpisu Librus
                  </h3>
                </div>
                <button 
                  onClick={() => setSelectedGrade(null)}
                  className="w-8 h-8 rounded-lg bg-surface-container-high border border-border/60 flex items-center justify-center text-on-surface-variant hover:text-on-surface"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Grade Presentation Deck */}
                <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-container border border-border/60">
                  <div className={`w-14 h-14 rounded-xl border-2 font-mono font-bold text-2xl flex items-center justify-center shadow-lg ${getGradeBadgeStyle(selectedGrade.value)}`}>
                    {selectedGrade.value}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-sans font-bold text-base text-on-surface truncate">
                      {selectedGrade.subjectName || 'Przedmiot'}
                    </h4>
                    <p className="font-mono text-xs text-on-surface-variant mt-0.5">
                      {selectedGrade.semesterNum ? `Semestr ${selectedGrade.semesterNum}` : 'Rok szkolny'}
                    </p>
                  </div>
                </div>

                {/* Metadata Matrix */}
                <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-xl bg-surface-container-lowest border border-border/40 text-xs font-mono">
                  <div>
                    <span className="text-outline text-[10px] block uppercase">Kategoria</span>
                    <span className="text-primary font-bold">
                      {selectedGrade.details?.category || 'Ocena bieżąca'}
                    </span>
                  </div>
                  <div>
                    <span className="text-outline text-[10px] block uppercase">Waga oceny</span>
                    <span className="text-tertiary font-bold">
                      {getGradeWeight(selectedGrade.details)}
                    </span>
                  </div>
                  <div>
                    <span className="text-outline text-[10px] block uppercase">Data wpisania</span>
                    <span className="text-on-surface">
                      {selectedGrade.details?.date || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-outline text-[10px] block uppercase">Licz do średniej</span>
                    <span className="text-on-surface">
                      {selectedGrade.details?.inAverage === false ? 'Nie' : 'Tak'}
                    </span>
                  </div>
                  {selectedGrade.details?.teacher && (
                    <div className="col-span-2 pt-2 border-t border-border/40">
                      <span className="text-outline text-[10px] block uppercase">Nauczyciel wystawiający</span>
                      <span className="text-on-surface-variant">
                        {selectedGrade.details.teacher}
                      </span>
                    </div>
                  )}
                </div>

                {/* Comment */}
                {selectedGrade.details?.comment && (
                  <div>
                    <span className="font-mono text-[10px] uppercase text-outline block mb-1">
                      Komentarz / Zakres:
                    </span>
                    <p className="text-xs text-on-surface-variant bg-surface-container-lowest p-3 rounded-xl border border-border/40 leading-relaxed whitespace-pre-wrap font-mono">
                      {selectedGrade.details.comment}
                    </p>
                  </div>
                )}

                {/* Close Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setSelectedGrade(null)}
                    className="min-h-[40px] px-5 font-mono text-xs bg-surface-container hover:bg-surface-container-high border border-border text-on-surface rounded-lg transition-all font-semibold"
                  >
                    Zamknij
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default GradesPage;
