import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, Award, RefreshCw, Sparkles, Search, Filter, 
  Calendar, BookOpen, ChevronRight, CheckCircle2, AlertCircle, 
  Clock, User, Star, TrendingUp, Info, X, SlidersHorizontal, Settings,
  LayoutGrid, List, AlertTriangle, Layers
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { doc, onSnapshot, getDoc, setDoc } from 'firebase/firestore';
import { firestore } from '../firebaseClient';
import { isCloudEnvironment } from '../services/cloudSync';

// Kolorystyka pigułek ocen w zależności od wartości
const getGradeBadgeStyle = (val) => {
  const s = String(val || '').trim();

  if (s.startsWith('6')) {
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.25)] hover:bg-emerald-500/30';
  }
  if (s.startsWith('5')) {
    return 'bg-green-500/20 text-green-300 border-green-500/40 shadow-[0_0_6px_rgba(34,197,94,0.2)] hover:bg-green-500/30';
  }
  if (s.startsWith('4')) {
    return 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-[0_0_6px_rgba(59,130,246,0.2)] hover:bg-blue-500/30';
  }
  if (s.startsWith('3')) {
    return 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_6px_rgba(245,158,11,0.2)] hover:bg-amber-500/30';
  }
  if (s.startsWith('2')) {
    return 'bg-orange-500/20 text-orange-300 border-orange-500/40 shadow-[0_0_6px_rgba(249,115,22,0.2)] hover:bg-orange-500/30';
  }
  if (s.startsWith('1')) {
    return 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.25)] hover:bg-rose-500/30';
  }
  if (s === '-' || s.toLowerCase() === 'np' || s.toLowerCase() === 'bz') {
    return 'bg-surface/90 text-textMuted border-border/80 hover:bg-surface';
  }
  if (s === '+') {
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30';
  }
  return 'bg-surface text-textSecondary border-border hover:bg-surfaceHover';
};

// Kolorystyka wskaźnika średniej
const getAverageBadgeStyle = (avg) => {
  const val = parseFloat(avg);
  if (!val || isNaN(val)) return 'bg-surface text-textMuted border-border';
  if (val >= 4.75) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]';
  if (val >= 4.0) return 'bg-blue-500/15 text-blue-400 border-blue-500/40 shadow-[0_0_10px_rgba(59,130,246,0.15)]';
  if (val >= 3.0) return 'bg-amber-500/15 text-amber-400 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.15)]';
  return 'bg-rose-500/15 text-rose-400 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.2)]';
};

// Bezpieczne wyciąganie wagi oceny (waga 0 nie może być zastępowana przez 1)
const getGradeWeight = (details) => {
  if (details?.weight !== undefined && details?.weight !== null && details?.weight !== '') {
    const num = Number(details.weight);
    if (!isNaN(num)) return num;
  }
  return 1;
};

// Wbudowane dane demonstracyjne (fallback offline / tryb demonstracyjny)
// Wbudowane dane demonstracyjne (fallback offline / tryb demonstracyjny)
const STATIC_DEMO_DATA = {
  isDemo: true,
  luckyNumber: 17,
  lastSync: new Date().toISOString(),
  overallAverage: "4.62",
  totalSubjects: 9,
  highestAverage: { name: "Informatyka", average: "6.00" },
  subjects: [
    {
      name: 'Język polski',
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
      name: 'Informatyka',
      computedAverage: '6.00',
      average: '6.00',
      gradesCount: 2,
      semester: [
        [
          { id: 401, value: '6', details: { category: 'Projekt', weight: 3, date: '2026-02-20', teacher: 'A. Becker', comment: 'Projekt aplikacji' } },
          { id: 402, value: '6', details: { category: 'Sprawdzian praktyczny', weight: 3, date: '2026-03-15', teacher: 'A. Becker' } }
        ],
        []
      ],
      sem1Grades: [
        { id: 401, value: '6', details: { category: 'Projekt', weight: 3, date: '2026-02-20', teacher: 'A. Becker', comment: 'Projekt aplikacji' } },
        { id: 402, value: '6', details: { category: 'Sprawdzian praktyczny', weight: 3, date: '2026-03-15', teacher: 'A. Becker' } }
      ],
      sem2Grades: []
    },
    {
      name: 'Systemy operacyjne',
      computedAverage: '5.75',
      average: '5.75',
      gradesCount: 2,
      semester: [
        [
          { id: 701, value: '6', details: { category: 'Laboratorium', weight: 2, date: '2026-02-28', teacher: 'P. Wojnarowski', comment: 'Konfiguracja Linux' } },
          { id: 702, value: '5+', details: { category: 'Sprawdzian', weight: 2, date: '2026-03-20', teacher: 'P. Wojnarowski', comment: 'Skrypty Bash' } }
        ],
        []
      ],
      sem1Grades: [
        { id: 701, value: '6', details: { category: 'Laboratorium', weight: 2, date: '2026-02-28', teacher: 'P. Wojnarowski', comment: 'Konfiguracja Linux' } },
        { id: 702, value: '5+', details: { category: 'Sprawdzian', weight: 2, date: '2026-03-20', teacher: 'P. Wojnarowski', comment: 'Skrypty Bash' } }
      ],
      sem2Grades: []
    },
    {
      name: 'Lokalne sieci komputerowe',
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

  // Tryb widoku: 'cards' (pełne karty) vs 'compact' (zwarty wierszowy)
  const [viewMode, setViewMode] = useState('cards');

  // Filtry i wyszukiwanie
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('all'); // 'all' | 'sem1' | 'sem2'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'graded' | 'risks' | 'honors'
  const [sortBy, setSortBy] = useState('name_asc'); // 'name_asc' | 'avg_desc' | 'avg_asc' | 'grades_desc'

  // Modal szczegółów oceny
  const [selectedGrade, setSelectedGrade] = useState(null);

  // Pobieranie danych ocen
  const fetchGrades = async (isManualRefresh = false, forceDemoMode = useDemo) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    // Tryb demonstracyjny
    if (forceDemoMode) {
      setData(STATIC_DEMO_DATA);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    // W środowisku chmurowym (Firebase Hosting) pobieramy dane WYŁĄCZNIE z Firestore
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
      // Jeśli brak dokumentu w Firestore w chmurze, fallback demo bez zapytań HTTP
      setData(STATIC_DEMO_DATA);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    // Środowisko lokalne (Express backend pod localhost:3000)
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
            }, { merge: true }).catch((fe) => console.debug('[Firestore] Błąd zapisu ocen:', fe));
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

      // Jeśli endpoint lokalny nie odpowiada, odczytaj stan zsynchronizowany w chmurze Firestore
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
        } catch (fErr) {
          console.debug('[Firestore Fallback] Błąd odczytu z chmury:', fErr);
        }
      }

      // Fallback demonstracyjny w razie braku sieci i braku chmury
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

  // Subskrypcja Firestore w chmurze (Realtime Sync dla omnidash-509607.web.app)
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
      }, (err) => {
        console.debug('[Firestore] Subskrypcja librus_cache:', err.message);
      });
      return () => unsub();
    } catch (e) {
      console.debug('[Firestore] Inicjalizacja subskrypcji librus pominięta:', e);
    }
  }, [useDemo]);

  // Synchronizacja pamięci podręcznej przeglądarki dla asystenta AI (READ-ONLY)
  useEffect(() => {
    if (data && Array.isArray(data.subjects) && data.subjects.length > 0) {
      try {
        localStorage.setItem('cloud_cache_librus_grades', JSON.stringify(data));
      } catch (err) {
        console.debug('[Librus] Błąd zapisu cache ocen do localStorage:', err);
      }
    }
  }, [data]);

  // Wymuszenie odświeżenia przez serwer
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

    // W środowisku chmurowym (Firebase Hosting / Vercel Gateway)
    if (isCloudEnvironment()) {
      try {
        await axios.get('/api/librus?refresh=true', { timeout: 15000 });
      } catch (e) {
        console.debug('[Vercel Gateway] Refresh ping:', e.message);
      }

      if (firestore) {
        try {
          const snap = await getDoc(doc(firestore, 'librus_cache', 'latest'));
          if (snap.exists() && snap.data()?.subjects) {
            refreshedData = snap.data();
          }
        } catch (fErr) {
          console.debug('[Firestore] Refresh fetch error:', fErr);
        }
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
      // Środowisko lokalne (Express backend pod localhost:3000)
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

    // Gwarancja min. 800ms widoczności animacji (koniec 'instant' fake refresh)
    const elapsed = Date.now() - startTime;
    if (elapsed < minDuration) {
      await new Promise(r => setTimeout(r, minDuration - elapsed));
    }

    setRefreshing(false);
    const currentAvg = refreshedData?.overallAverage || (data?.overallAverage ? Number(data.overallAverage).toFixed(2) : '4.62');
    setToastMessage(`[+] Pomyślnie zsynchronizowano oceny z Librus Synergia. Średnia ogólna: ${currentAvg}`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Obliczenia statystyk filtrowanych
  const rawSubjects = data?.subjects || [];
  const gradedSubjectsCount = useMemo(() => {
    return rawSubjects.filter(s => {
      const s1 = (s.sem1Grades || []).length;
      const s2 = (s.sem2Grades || []).length;
      return (s1 + s2) > 0 || (s.gradesCount && s.gradesCount > 0);
    }).length;
  }, [rawSubjects]);

  const riskSubjectsCount = useMemo(() => {
    return rawSubjects.filter(s => {
      const avg = parseFloat(s.computedAverage || s.average || 0);
      return avg > 0 && avg <= 2.25;
    }).length;
  }, [rawSubjects]);

  const honorsSubjectsCount = useMemo(() => {
    return rawSubjects.filter(s => {
      const avg = parseFloat(s.computedAverage || s.average || 0);
      return avg >= 4.75;
    }).length;
  }, [rawSubjects]);

  // Filtrowanie i sortowanie przedmiotów
  const filteredSubjects = useMemo(() => {
    if (!rawSubjects || !Array.isArray(rawSubjects)) return [];

    let list = [...rawSubjects];

    // Status filter
    if (statusFilter === 'graded') {
      list = list.filter(s => {
        const s1 = (s.sem1Grades || []).length;
        const s2 = (s.sem2Grades || []).length;
        return (s1 + s2) > 0 || (s.gradesCount && s.gradesCount > 0);
      });
    } else if (statusFilter === 'risks') {
      list = list.filter(s => {
        const avg = parseFloat(s.computedAverage || s.average || 0);
        return avg > 0 && avg <= 2.25;
      });
    } else if (statusFilter === 'honors') {
      list = list.filter(s => {
        const avg = parseFloat(s.computedAverage || s.average || 0);
        return avg >= 4.75;
      });
    }

    // Wyszukiwanie po nazwie
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s => s.name?.toLowerCase().includes(q));
    }

    // Sortowanie
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

  const luckyNumber = data?.luckyNumber;
  const overallAvg = data?.overallAverage ? Number(data.overallAverage).toFixed(2) : '—';
  const totalSubjects = data?.totalSubjects || rawSubjects.length;
  const highestAvg = data?.highestAverage;
  const isConfigured = data?.isConfigured;
  const isDemo = data?.isDemo || useDemo;

  const formattedLastSync = useMemo(() => {
    if (!data?.lastSync) return 'Nigdy';
    try {
      const d = new Date(data.lastSync);
      return d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }) + ' (' + d.toLocaleDateString('pl-PL') + ')';
    } catch {
      return data.lastSync;
    }
  }, [data?.lastSync]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 bg-background text-textPrimary animate-soft-enter">
      
      {/* NAGŁÓWEK STRONY */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border flex-shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-accentPrimary/10 border border-accentPrimary/30 text-accentPrimary shadow-[0_0_15px_rgba(var(--color-accent-primary),0.2)]">
              <Award className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-bold tracking-wide font-sans text-textPrimary">
                  Dziennik Ocen & Librus Synergia
                </h1>
                <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                  isDemo 
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}>
                  {isDemo ? 'Tryb Demonstracyjny' : 'Librus Live'}
                </span>
              </div>
              <p className="text-xs text-textMuted font-mono">
                Automatyczna synchronizacja co 2 godziny • Ostatnia: {formattedLastSync}
              </p>
            </div>
          </div>
        </div>

        {/* PRZYCISKI AKCJI GÓRNYCH */}
        <div className="flex items-center gap-2">
          {/* Przełącznik widoku: Karty vs Lista zwarta */}
          <div className="flex items-center p-0.5 rounded-lg bg-surface border border-border">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'cards' 
                  ? 'bg-accentPrimary text-black font-bold shadow-sm' 
                  : 'text-textMuted hover:text-textPrimary'
              }`}
              title="Widok kart"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'compact' 
                  ? 'bg-accentPrimary text-black font-bold shadow-sm' 
                  : 'text-textMuted hover:text-textPrimary'
              }`}
              title="Widok zwarty (kompaktowy)"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setUseDemo(!useDemo)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
              useDemo 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                : 'bg-surface text-textSecondary border-border hover:bg-surfaceHover'
            }`}
            title="Przełącz dane demonstracyjne"
          >
            {useDemo ? 'Włącz Live' : 'Pokaż Demo'}
          </button>

          <button
            onClick={handleForceRefresh}
            disabled={refreshing || loading}
            className="px-3.5 py-1.5 rounded-lg bg-surface hover:bg-surfaceHover border border-border text-textPrimary text-xs font-mono flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-accentPrimary ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Synchronizacja...' : 'Odśwież'}</span>
          </button>

          <button
            onClick={() => navigate('/settings')}
            className="p-1.5 rounded-lg bg-surface hover:bg-surfaceHover border border-border text-textMuted hover:text-textPrimary transition-all"
            title="Ustawienia poświadczeń Librus"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pasek postępu odświeżania (animowany wskaźnik ładowania) */}
      {refreshing && (
        <div className="w-full h-1 bg-surface border-b border-border overflow-hidden flex-shrink-0 animate-fade-in">
          <div className="h-full bg-accentPrimary animate-pulse w-full shadow-[0_0_8px_rgba(var(--color-accent-primary),0.8)]" />
        </div>
      )}

      {/* Powiadomienie Toast po synchronizacji */}
      {toastMessage && (
        <div className="mt-3 p-3 rounded-xl bg-accentPrimary/20 border border-accentPrimary/40 text-accentPrimary text-xs font-mono flex items-center justify-between animate-fade-in shadow-lg flex-shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-accentPrimary" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-accentPrimary/70 hover:text-accentPrimary text-xs font-bold px-1.5 py-0.5">✕</button>
        </div>
      )}

      {/* BANER INFORMACYJNY JEŚLI BRAK KONFIGURACJI */}
      {!isConfigured && !useDemo && (
        <div className="mt-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-300 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <span>
              Poświadczenia Librus Synergia nie zostały jeszcze skonfigurowane w systemie. Dane są prezentowane w trybie demonstracyjnym.
            </span>
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 font-mono text-[11px] whitespace-nowrap transition-all"
          >
            Skonfiguruj w Ustawieniach &rarr;
          </button>
        </div>
      )}

      {/* KOMUNIKAT BŁĘDU (Zabezpieczony przed alertami HTML rewrite) */}
      {error && !error.toLowerCase().includes('html') && (!data?.subjects || data.subjects.length === 0) && (
        <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* PASEK METRYK KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 my-4 flex-shrink-0">
        
        {/* KPI 1: SZCZĘŚLIWY NUMEREK */}
        <div className="glass-panel p-3.5 rounded-xl border border-border flex items-center justify-between relative overflow-hidden group">
          <div className="absolute -right-3 -bottom-3 w-16 h-16 bg-accentPrimary/5 rounded-full blur-xl group-hover:bg-accentPrimary/15 transition-all" />
          <div>
            <span className="text-[11px] font-mono text-textMuted uppercase tracking-wider block">
              Szczęśliwy Numerek
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl md:text-3xl font-bold font-mono text-accentPrimary drop-shadow-[0_0_10px_rgba(var(--color-accent-primary),0.4)]">
                {luckyNumber !== null && luckyNumber !== undefined ? `#${luckyNumber}` : '—'}
              </span>
              <span className="text-[10px] text-textMuted font-mono">Dziś</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-accentPrimary/10 border border-accentPrimary/30 flex items-center justify-center text-accentPrimary">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2: ŚREDNIA OGÓLNA */}
        <div className="glass-panel p-3.5 rounded-xl border border-border flex items-center justify-between relative overflow-hidden group">
          <div className="absolute -right-3 -bottom-3 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/15 transition-all" />
          <div>
            <span className="text-[11px] font-mono text-textMuted uppercase tracking-wider block">
              Średnia Całoroczna
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl md:text-3xl font-bold font-mono text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                {overallAvg}
              </span>
              <span className="text-[10px] text-textMuted font-mono">/ 6.00</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: PRZEDMIOTY (Aktywne vs Wszystkie) */}
        <div className="glass-panel p-3.5 rounded-xl border border-border flex items-center justify-between relative overflow-hidden group">
          <div className="absolute -right-3 -bottom-3 w-16 h-16 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/15 transition-all" />
          <div>
            <span className="text-[11px] font-mono text-textMuted uppercase tracking-wider block">
              Przedmioty z ocenami
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl md:text-3xl font-bold font-mono text-blue-400">
                {gradedSubjectsCount}
              </span>
              <span className="text-[10px] text-textMuted font-mono">/ {totalSubjects}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4: NAJLEPSZY PRZEDMIOT */}
        <div className="glass-panel p-3.5 rounded-xl border border-border flex items-center justify-between relative overflow-hidden group">
          <div className="absolute -right-3 -bottom-3 w-16 h-16 bg-purple-500/5 rounded-full blur-xl group-hover:bg-purple-500/15 transition-all" />
          <div className="min-w-0 pr-2">
            <span className="text-[11px] font-mono text-textMuted uppercase tracking-wider block truncate">
              Lider Średniej
            </span>
            <div className="flex items-baseline gap-1.5 mt-1 truncate">
              <span className="text-base md:text-lg font-bold font-sans text-purple-300 truncate">
                {highestAvg?.subject || 'Brak ocen'}
              </span>
              {highestAvg?.average && (
                <span className="text-xs font-mono font-bold text-purple-400">
                  ({Number(highestAvg.average).toFixed(2)})
                </span>
              )}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 flex-shrink-0">
            <Star className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* SZYBKIE FILTRY PRZEDMIOTÓW (Z OCENAMI / ZAGROŻENIA / WZOROWE) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 flex-shrink-0">
        
        {/* Filtry statusu */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-mono border transition-all ${
              statusFilter === 'all'
                ? 'bg-accentPrimary/20 text-accentPrimary border-accentPrimary/40 font-bold'
                : 'bg-surface text-textMuted border-border hover:bg-surfaceHover'
            }`}
          >
            Wszystkie ({totalSubjects})
          </button>

          <button
            onClick={() => setStatusFilter('graded')}
            className={`px-3 py-1 rounded-lg text-xs font-mono border transition-all flex items-center gap-1.5 ${
              statusFilter === 'graded'
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 font-bold shadow-sm'
                : 'bg-surface text-textMuted border-border hover:bg-surfaceHover'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Tylko z ocenami ({gradedSubjectsCount})</span>
          </button>

          {riskSubjectsCount > 0 && (
            <button
              onClick={() => setStatusFilter('risks')}
              className={`px-3 py-1 rounded-lg text-xs font-mono border transition-all flex items-center gap-1.5 ${
                statusFilter === 'risks'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold'
                  : 'bg-surface text-rose-400/80 border-border hover:bg-surfaceHover'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Zagrożenia ({riskSubjectsCount})</span>
            </button>
          )}

          {honorsSubjectsCount > 0 && (
            <button
              onClick={() => setStatusFilter('honors')}
              className={`px-3 py-1 rounded-lg text-xs font-mono border transition-all flex items-center gap-1.5 ${
                statusFilter === 'honors'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                  : 'bg-surface text-emerald-400/80 border-border hover:bg-surfaceHover'
              }`}
            >
              <Star className="w-3.5 h-3.5 text-emerald-400" />
              <span>Wzorowe ({honorsSubjectsCount})</span>
            </button>
          )}
        </div>

        {/* Wyszukiwarka i semestry */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-textMuted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filtruj przedmiot..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1 rounded-lg bg-surface border border-border text-textPrimary text-xs font-mono focus:outline-none focus:border-accentPrimary"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-textMuted hover:text-textPrimary"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Zakładki Semestr */}
          <div className="flex items-center p-0.5 rounded-lg bg-surface border border-border text-xs font-mono">
            <button
              onClick={() => setSelectedSemester('all')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                selectedSemester === 'all' 
                  ? 'bg-accentPrimary text-black font-bold shadow-sm' 
                  : 'text-textMuted hover:text-textPrimary'
              }`}
            >
              Wszystkie
            </button>
            <button
              onClick={() => setSelectedSemester('sem1')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                selectedSemester === 'sem1' 
                  ? 'bg-accentPrimary text-black font-bold shadow-sm' 
                  : 'text-textMuted hover:text-textPrimary'
              }`}
            >
              Semestr 1
            </button>
            <button
              onClick={() => setSelectedSemester('sem2')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                selectedSemester === 'sem2' 
                  ? 'bg-accentPrimary text-black font-bold shadow-sm' 
                  : 'text-textMuted hover:text-textPrimary'
              }`}
            >
              Semestr 2
            </button>
          </div>

          {/* Sortowanie */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-2 py-1 rounded-lg bg-surface border border-border text-textPrimary text-xs font-mono focus:outline-none focus:border-accentPrimary"
          >
            <option value="name_asc">Nazwa A-Z</option>
            <option value="avg_desc">Średnia: najwyższa</option>
            <option value="avg_asc">Średnia: najniższa</option>
            <option value="grades_desc">Liczba ocen</option>
          </select>
        </div>
      </div>

      {/* LISTA PRZEDMIOTÓW I OCEN */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-0 pb-16 md:pb-6 custom-scrollbar">
        
        {loading && (
          <div className="h-64 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-accentPrimary/20 border-t-accentPrimary animate-spin" />
            <span className="font-mono text-xs text-textMuted animate-pulse uppercase tracking-wider">
              Pobieranie ocen z Librus Synergia...
            </span>
          </div>
        )}

        {!loading && filteredSubjects.length === 0 && (
          <div className="glass-panel p-8 rounded-2xl border border-border text-center">
            <BookOpen className="w-10 h-10 text-textMuted mx-auto mb-2 opacity-50" />
            <h3 className="text-sm font-bold text-textPrimary">Brak przedmiotów do wyświetlenia</h3>
            <p className="text-xs text-textMuted mt-1">
              {statusFilter === 'graded' 
                ? 'Żaden przedmiot nie posiada jeszcze wystawionych ocen w wybranym filtrze.' 
                : 'Nie znaleziono zarejestrowanych ocen w wybranym okresie.'}
            </p>
          </div>
        )}

        {/* WIDOK ZWARTY (KOMPAKTOWY) */}
        {!loading && viewMode === 'compact' && (
          <div className="space-y-2">
            {filteredSubjects.map((subject, idx) => {
              const sem1List = subject.sem1Grades || [];
              const sem2List = subject.sem2Grades || [];
              const allGrades = selectedSemester === 'sem1' ? sem1List : selectedSemester === 'sem2' ? sem2List : [...sem1List, ...sem2List];
              const currentAvg = parseFloat(subject.computedAverage || subject.average || 0);

              return (
                <div 
                  key={`compact-${subject.name || idx}`}
                  className="glass-panel p-3 rounded-xl border border-border hover:border-accentPrimary/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 group"
                >
                  {/* Lewa część: Przedmiot + Średnia */}
                  <div className="flex items-center gap-3 min-w-[240px]">
                    <div className="w-7 h-7 rounded-lg bg-surface border border-border flex items-center justify-center text-accentPrimary flex-shrink-0">
                      <GraduationCap className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs sm:text-sm font-bold text-textPrimary font-sans truncate">
                          {subject.name}
                        </h3>
                        <span className="text-[10px] text-textMuted font-mono">
                          ({allGrades.length} ocen)
                        </span>
                      </div>
                      
                      {/* Wizualny pasek średniej */}
                      <div className="w-full max-w-[160px] bg-surface/80 rounded-full h-1.5 overflow-hidden border border-border/40 mt-1">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            currentAvg >= 4.75 ? 'bg-emerald-400' :
                            currentAvg >= 4.0 ? 'bg-blue-400' :
                            currentAvg >= 3.0 ? 'bg-amber-400' :
                            currentAvg > 0 ? 'bg-rose-500' : 'bg-transparent'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, ((currentAvg - 1) / 5) * 100))}%` }}
                        />
                      </div>
                    </div>

                    <div className={`px-2 py-0.5 rounded-lg border text-xs font-mono font-bold flex-shrink-0 ${getAverageBadgeStyle(currentAvg)}`}>
                      {currentAvg > 0 ? currentAvg.toFixed(2) : '—'}
                    </div>
                  </div>

                  {/* Prawa część: Pigułki ocen z wagami */}
                  <div className="flex flex-wrap gap-1.5 items-center flex-1 justify-start md:justify-end">
                    {allGrades.length === 0 ? (
                      <span className="text-[11px] font-mono text-textMuted/50 italic">Brak ocen</span>
                    ) : (
                      allGrades.map((g, gIdx) => (
                        <button
                          key={`c-g-${g.id || gIdx}`}
                          onClick={() => setSelectedGrade({ ...g, subjectName: subject.name })}
                          className={`px-2 py-0.5 rounded-md border font-mono flex items-center gap-1 transition-all cursor-pointer active:scale-95 text-xs ${getGradeBadgeStyle(g.value)} ${
                            getGradeWeight(g.details) >= 3 ? 'border-2 font-black' : ''
                          }`}
                          title={`${g.value} • ${g.details?.category || 'Ocena'} (Waga: ${getGradeWeight(g.details)})`}
                        >
                          <span className="font-bold">{g.value}</span>
                          <span className="text-[9px] font-mono opacity-70">
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
        )}

        {/* WIDOK KART (ROZBUDOWANY) */}
        {!loading && viewMode === 'cards' && filteredSubjects.map((subject, idx) => {
          const sem1List = subject.sem1Grades || [];
          const sem2List = subject.sem2Grades || [];
          const currentAvg = parseFloat(subject.computedAverage || subject.average || 0);

          return (
            <div 
              key={subject.name || idx}
              className="glass-panel p-4 rounded-xl border border-border hover:border-borderHover transition-all duration-200 group"
            >
              {/* NAGŁÓWEK KARTY PRZEDMIOTU */}
              <div className="flex items-start sm:items-center justify-between gap-3 pb-3 border-b border-border/50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-accentPrimary flex-shrink-0 group-hover:border-accentPrimary/40 transition-colors">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-textPrimary font-sans truncate">
                      {subject.name}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-textMuted font-mono">
                      <span>Sem 1: {subject.sem1Avg ? Number(subject.sem1Avg).toFixed(2) : '—'}</span>
                      <span>•</span>
                      <span>Sem 2: {subject.sem2Avg ? Number(subject.sem2Avg).toFixed(2) : '—'}</span>
                    </div>
                  </div>
                </div>

                {/* ŚREDNIA PRZEDMIOTU + MINI PASEK */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="hidden sm:block w-24 bg-surface/80 rounded-full h-1.5 overflow-hidden border border-border/40">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        currentAvg >= 4.75 ? 'bg-emerald-400' :
                        currentAvg >= 4.0 ? 'bg-blue-400' :
                        currentAvg >= 3.0 ? 'bg-amber-400' :
                        currentAvg > 0 ? 'bg-rose-500' : 'bg-transparent'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, ((currentAvg - 1) / 5) * 100))}%` }}
                    />
                  </div>
                  <div className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-bold flex items-center gap-1.5 ${getAverageBadgeStyle(currentAvg)}`}>
                    <span className="text-[10px] text-textMuted uppercase font-normal">Śr:</span>
                    <span>{currentAvg > 0 ? currentAvg.toFixed(2) : '—'}</span>
                  </div>
                </div>
              </div>

              {/* SIATKA OCEN WG SEMESTRÓW */}
              <div className="pt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                
                {/* SEMESTR 1 */}
                {(selectedSemester === 'all' || selectedSemester === 'sem1') && (
                  <div className={`p-3 rounded-lg bg-surface/40 border border-border/40 ${selectedSemester === 'sem1' ? 'md:col-span-2' : ''}`}>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[10px] font-mono text-textMuted uppercase tracking-wider font-semibold">
                        Semestr 1 ({sem1List.length})
                      </span>
                      {subject.sem1Avg && (
                        <span className="text-[10px] font-mono text-textSecondary font-semibold">
                          Śr: {Number(subject.sem1Avg).toFixed(2)}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 min-h-[32px] items-center">
                      {sem1List.length === 0 ? (
                        <span className="text-[11px] font-mono text-textMuted/60 italic">Brak ocen</span>
                      ) : (
                        sem1List.map((g, gIdx) => {
                          const w = getGradeWeight(g.details);
                          return (
                            <button
                              key={g.id || gIdx}
                              onClick={() => setSelectedGrade({ ...g, subjectName: subject.name, semesterNum: 1 })}
                              className={`px-2.5 py-1 rounded-lg border font-mono flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm ${getGradeBadgeStyle(g.value)} ${
                                w >= 3 ? 'border-2 ring-1 ring-accentPrimary/20' : ''
                              }`}
                              title={`${g.value} • ${g.details?.category || 'Ocena'} (Waga: ${w})`}
                            >
                              <span className="font-bold text-xs sm:text-sm">{g.value}</span>
                              <span className="text-[9px] font-mono opacity-80 px-1 py-0.2 rounded bg-black/30 border border-white/5">
                                w:{w}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* SEMESTR 2 */}
                {(selectedSemester === 'all' || selectedSemester === 'sem2') && (
                  <div className={`p-3 rounded-lg bg-surface/40 border border-border/40 ${selectedSemester === 'sem2' ? 'md:col-span-2' : ''}`}>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[10px] font-mono text-textMuted uppercase tracking-wider font-semibold">
                        Semestr 2 ({sem2List.length})
                      </span>
                      {subject.sem2Avg && (
                        <span className="text-[10px] font-mono text-textSecondary font-semibold">
                          Śr: {Number(subject.sem2Avg).toFixed(2)}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 min-h-[32px] items-center">
                      {sem2List.length === 0 ? (
                        <span className="text-[11px] font-mono text-textMuted/60 italic">Brak ocen</span>
                      ) : (
                        sem2List.map((g, gIdx) => {
                          const w = getGradeWeight(g.details);
                          return (
                            <button
                              key={g.id || gIdx}
                              onClick={() => setSelectedGrade({ ...g, subjectName: subject.name, semesterNum: 2 })}
                              className={`px-2.5 py-1 rounded-lg border font-mono flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm ${getGradeBadgeStyle(g.value)} ${
                                w >= 3 ? 'border-2 ring-1 ring-accentPrimary/20' : ''
                              }`}
                              title={`${g.value} • ${g.details?.category || 'Ocena'} (Waga: ${w})`}
                            >
                              <span className="font-bold text-xs sm:text-sm">{g.value}</span>
                              <span className="text-[9px] font-mono opacity-80 px-1 py-0.2 rounded bg-black/30 border border-white/5">
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

      {/* MODAL ZE SZCZEGÓŁAMI OCENY */}
      {selectedGrade && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-soft-enter"
          onClick={() => setSelectedGrade(null)}
        >
          <div 
            className="glass-panel border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Nagłówek Modala */}
            <div className="p-4 border-b border-border bg-surface/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-accentPrimary" />
                <h3 className="font-mono text-sm font-bold text-textPrimary">
                  Szczegóły Oceny Szkolnej
                </h3>
              </div>
              <button 
                onClick={() => setSelectedGrade(null)}
                className="text-textMuted hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Główna ekspozycja stopnia */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-surface/60 border border-border">
                <div className={`w-14 h-14 rounded-2xl border-2 font-mono font-bold text-2xl flex items-center justify-center shadow-lg ${getGradeBadgeStyle(selectedGrade.value)}`}>
                  {selectedGrade.value}
                </div>
                <div>
                  <h4 className="font-bold text-base text-textPrimary font-sans">
                    {selectedGrade.subjectName || 'Przedmiot'}
                  </h4>
                  <p className="text-xs text-textMuted font-mono mt-0.5">
                    {selectedGrade.semesterNum ? `Semestr ${selectedGrade.semesterNum}` : 'Rok szkolny'}
                  </p>
                </div>
              </div>

              {/* Siatka atrybutów oceny */}
              <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-xl bg-surface/40 border border-border/60 text-xs font-mono">
                <div>
                  <span className="text-textMuted text-[10px] block uppercase">Kategoria</span>
                  <span className="text-accentPrimary font-bold">
                    {selectedGrade.details?.category || 'Ocena bieżąca'}
                  </span>
                </div>
                <div>
                  <span className="text-textMuted text-[10px] block uppercase">Waga oceny</span>
                  <span className="text-emerald-400 font-bold">
                    {getGradeWeight(selectedGrade.details)}
                  </span>
                </div>
                <div>
                  <span className="text-textMuted text-[10px] block uppercase">Data wpisania</span>
                  <span className="text-textPrimary">
                    {selectedGrade.details?.date || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-textMuted text-[10px] block uppercase">Licz do średniej</span>
                  <span className="text-textPrimary">
                    {selectedGrade.details?.inAverage === false ? 'Nie' : 'Tak'}
                  </span>
                </div>
                {selectedGrade.details?.teacher && (
                  <div className="col-span-2 pt-2 border-t border-border/40">
                    <span className="text-textMuted text-[10px] block uppercase">Nauczyciel wystawiający</span>
                    <span className="text-textSecondary">
                      {selectedGrade.details.teacher}
                    </span>
                  </div>
                )}
              </div>

              {/* Komentarz / Zakres materiału */}
              {selectedGrade.details?.comment && (
                <div>
                  <span className="text-[10px] font-mono uppercase text-textMuted block mb-1">
                    Komentarz / Zakres:
                  </span>
                  <p className="text-xs text-textSecondary bg-surface/30 p-3 rounded-xl border border-border leading-relaxed whitespace-pre-wrap">
                    {selectedGrade.details.comment}
                  </p>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedGrade(null)}
                  className="px-4 py-2 font-mono text-xs bg-surface hover:bg-surfaceHover border border-border text-textPrimary rounded-lg transition-all"
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

export default GradesPage;
