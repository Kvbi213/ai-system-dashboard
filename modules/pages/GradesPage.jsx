import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, Award, RefreshCw, Sparkles, Search, Filter, 
  Calendar, BookOpen, ChevronRight, CheckCircle2, AlertCircle, 
  Clock, User, Star, TrendingUp, Info, X, SlidersHorizontal, Settings
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../firebaseClient';
import { isCloudEnvironment } from '../services/cloudSync';

// Kolorystyka pigułek ocen w zależności od wartości
const getGradeBadgeStyle = (val) => {
  const s = String(val || '').trim();
  const num = parseFloat(s.replace(/[^\d.]/g, ''));

  if (s.startsWith('6')) {
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.25)] hover:bg-emerald-500/30';
  }
  if (s.startsWith('5')) {
    return 'bg-green-500/20 text-green-300 border-green-500/40 shadow-[0_0_8px_rgba(34,197,94,0.2)] hover:bg-green-500/30';
  }
  if (s.startsWith('4')) {
    return 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-[0_0_8px_rgba(59,130,246,0.2)] hover:bg-blue-500/30';
  }
  if (s.startsWith('3')) {
    return 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.2)] hover:bg-amber-500/30';
  }
  if (s.startsWith('2')) {
    return 'bg-orange-500/20 text-orange-300 border-orange-500/40 shadow-[0_0_8px_rgba(249,115,22,0.2)] hover:bg-orange-500/30';
  }
  if (s.startsWith('1')) {
    return 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.25)] hover:bg-rose-500/30';
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

// Wbudowane dane demonstracyjne (fallback offline / tryb demonstracyjny)
const STATIC_DEMO_DATA = {
  isDemo: true,
  luckyNumber: 17,
  lastSync: new Date().toISOString(),
  overallAverage: "5.19",
  totalSubjects: 6,
  highestAverage: { name: "Informatyka", average: "6.00" },
  subjects: [
    {
      name: 'Język polski',
      computedAverage: '4.60',
      gradesCount: 3,
      semester: [
        [
          { id: 101, value: '5', info: 'Kategoria: Sprawdzian\nWaga: 3\nData: 2026-02-15\nNauczyciel: J. Kowalska\nKomentarz: Romantyzm - praca klasowa' },
          { id: 102, value: '4+', info: 'Kategoria: Odpowiedź ustna\nWaga: 2\nData: 2026-03-01\nNauczyciel: J. Kowalska' },
          { id: 103, value: '5', info: 'Kategoria: Wypracowanie\nWaga: 3\nData: 2026-03-20\nNauczyciel: J. Kowalska\nKomentarz: Analiza Dziadów cz. III' }
        ],
        []
      ]
    },
    {
      name: 'Matematyka',
      computedAverage: '4.80',
      gradesCount: 5,
      semester: [
        [
          { id: 201, value: '5', info: 'Kategoria: Sprawdzian\nWaga: 3\nData: 2026-02-18\nNauczyciel: A. Wiśniewski\nKomentarz: Ciągi liczbowe i granice' },
          { id: 202, value: '5-', info: 'Kategoria: Kartkówka\nWaga: 1\nData: 2026-03-05\nNauczyciel: A. Wiśniewski' },
          { id: 203, value: '4', info: 'Kategoria: Aktywność\nWaga: 1\nData: 2026-03-22\nNauczyciel: A. Wiśniewski' }
        ],
        [
          { id: 204, value: '5', info: 'Kategoria: Sprawdzian\nWaga: 3\nData: 2026-04-15\nNauczyciel: A. Wiśniewski\nKomentarz: Rachunek prawdopodobieństwa' },
          { id: 205, value: '4+', info: 'Kategoria: Kartkówka\nWaga: 1\nData: 2026-04-29\nNauczyciel: A. Wiśniewski' }
        ]
      ]
    },
    {
      name: 'Język angielski',
      computedAverage: '5.60',
      gradesCount: 4,
      semester: [
        [
          { id: 301, value: '6', info: 'Kategoria: Sprawdzian\nWaga: 3\nData: 2026-02-12\nNauczyciel: E. Smith\nKomentarz: Advanced Grammar Unit 4' },
          { id: 302, value: '5', info: 'Kategoria: Prezentacja\nWaga: 2\nData: 2026-03-08\nNauczyciel: E. Smith\nKomentarz: Artificial Intelligence in Modern Society' }
        ],
        [
          { id: 303, value: '6', info: 'Kategoria: Esej\nWaga: 3\nData: 2026-04-12\nNauczyciel: E. Smith\nKomentarz: Critical essay' },
          { id: 304, value: '5+', info: 'Kategoria: Kartkówka\nWaga: 1\nData: 2026-05-03\nNauczyciel: E. Smith\nKomentarz: Phrasal verbs' }
        ]
      ]
    },
    {
      name: 'Informatyka',
      computedAverage: '6.00',
      gradesCount: 3,
      semester: [
        [
          { id: 401, value: '6', info: 'Kategoria: Projekt\nWaga: 3\nData: 2026-02-20\nNauczyciel: P. Zieliński\nKomentarz: Architektura fullstack w Node.js' },
          { id: 402, value: '6', info: 'Kategoria: Sprawdzian praktyczny\nWaga: 3\nData: 2026-03-15\nNauczyciel: P. Zieliński\nKomentarz: Algorytmy grafowe' }
        ],
        [
          { id: 403, value: '6', info: 'Kategoria: Projekt grupowy\nWaga: 3\nData: 2026-04-25\nNauczyciel: P. Zieliński\nKomentarz: Model AI & REST API' }
        ]
      ]
    },
    {
      name: 'Fizyka',
      computedAverage: '4.75',
      gradesCount: 3,
      semester: [
        [
          { id: 501, value: '4+', info: 'Kategoria: Sprawdzian\nWaga: 3\nData: 2026-02-22\nNauczyciel: T. Lewandowski\nKomentarz: Termodynamika' },
          { id: 502, value: '5', info: 'Kategoria: Ćwiczenia laboratoryjne\nWaga: 2\nData: 2026-03-12\nNauczyciel: T. Lewandowski' }
        ],
        [
          { id: 503, value: '5', info: 'Kategoria: Sprawdzian\nWaga: 3\nData: 2026-04-18\nNauczyciel: T. Lewandowski\nKomentarz: Optyka falowa' }
        ]
      ]
    },
    {
      name: 'Historia',
      computedAverage: '5.00',
      gradesCount: 3,
      semester: [
        [
          { id: 601, value: '5', info: 'Kategoria: Sprawdzian\nWaga: 3\nData: 2026-02-25\nNauczyciel: D. Kamińska\nKomentarz: Dwudziestolecie międzywojenne' }
        ],
        [
          { id: 602, value: '5', info: 'Kategoria: Kartkówka\nWaga: 1\nData: 2026-04-14\nNauczyciel: D. Kamińska' },
          { id: 603, value: '5', info: 'Kategoria: Projekt\nWaga: 2\nData: 2026-05-02\nNauczyciel: D. Kamińska' }
        ]
      ]
    }
  ]
};

const GradesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [useDemo, setUseDemo] = useState(false);

  // Filtry i wyszukiwanie
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('all'); // 'all' | 'sem1' | 'sem2'
  const [sortBy, setSortBy] = useState('name_asc'); // 'name_asc' | 'avg_desc' | 'avg_asc'

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
          const { getDoc } = await import('firebase/firestore');
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
      }
    } catch (err) {
      const isHtmlErr = err.message?.includes('zwrócił HTML');
      if (isHtmlErr || data?.subjects?.length > 0) {
        console.debug('[Librus] Pominięto anomalię endpointu:', err.message);
      } else {
        setError(err.response?.data?.error || err.message || 'Nie udało się pobrać ocen');
      }

      // Fallback demonstracyjny w razie błędu sieci lokalnej
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

  // Subskrypcja Firestore w chmurze (Realtime Sync dla void-potato-7721.web.app)
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

  // Wymuszenie odświeżenia przez serwer
  const handleForceRefresh = async () => {
    if (useDemo) {
      setData(STATIC_DEMO_DATA);
      return;
    }
    setRefreshing(true);
    setError(null);

    // W środowisku chmurowym odświeżamy bezpośrednio ze snapshota Firestore
    if (isCloudEnvironment()) {
      if (firestore) {
        try {
          const { getDoc } = await import('firebase/firestore');
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
            }
          }
        } catch {}
      }
      setRefreshing(false);
      return;
    }

    try {
      const res = await axios.post('/api/librus/refresh', {}, { timeout: 20000 });
      if (res.data?.success && res.data?.data) {
        setData(res.data.data);
      } else {
        await fetchGrades(true);
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Błąd odświeżania danych Librus';
      if (!msg.includes('zwrócił HTML')) {
        setError(msg);
      }
      await fetchGrades(true);
    } finally {
      setRefreshing(false);
    }
  };

  // Filtrowanie i sortowanie przedmiotów
  const filteredSubjects = useMemo(() => {
    if (!data?.subjects || !Array.isArray(data.subjects)) return [];

    let list = [...data.subjects];

    // Wyszukiwanie
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
      return (a.name || '').localeCompare(b.name || '', 'pl');
    });

    return list;
  }, [data?.subjects, searchQuery, sortBy]);

  const luckyNumber = data?.luckyNumber;
  const overallAvg = data?.overallAverage ? Number(data.overallAverage).toFixed(2) : '—';
  const totalSubjects = data?.totalSubjects || (data?.subjects ? data.subjects.length : 0);
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

      {/* KOMUNIKAT BŁĘDU */}
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

        {/* KPI 3: PRZEDMIOTY */}
        <div className="glass-panel p-3.5 rounded-xl border border-border flex items-center justify-between relative overflow-hidden group">
          <div className="absolute -right-3 -bottom-3 w-16 h-16 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/15 transition-all" />
          <div>
            <span className="text-[11px] font-mono text-textMuted uppercase tracking-wider block">
              Przedmioty
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl md:text-3xl font-bold font-mono text-blue-400">
                {totalSubjects}
              </span>
              <span className="text-[10px] text-textMuted font-mono">aktywnych</span>
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

      {/* PASEK NARZĘDZI: SZUKAJ, SEMESTR, SORTOWANIE */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 pb-3 flex-shrink-0">
        
        {/* Wyszukiwarka */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-textMuted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Szukaj przedmiotu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-surface border border-border text-textPrimary text-xs font-mono focus:outline-none focus:border-accentPrimary transition-all placeholder:text-textMuted/60"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-textMuted hover:text-textPrimary"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Przełącznik semestrów i sortowania */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          
          {/* Zakładki Semestr */}
          <div className="flex items-center p-0.5 rounded-lg bg-surface border border-border text-xs font-mono">
            <button
              onClick={() => setSelectedSemester('all')}
              className={`px-3 py-1 rounded-md transition-all ${
                selectedSemester === 'all' 
                  ? 'bg-accentPrimary text-black font-bold shadow-sm' 
                  : 'text-textMuted hover:text-textPrimary'
              }`}
            >
              Wszystkie
            </button>
            <button
              onClick={() => setSelectedSemester('sem1')}
              className={`px-3 py-1 rounded-md transition-all ${
                selectedSemester === 'sem1' 
                  ? 'bg-accentPrimary text-black font-bold shadow-sm' 
                  : 'text-textMuted hover:text-textPrimary'
              }`}
            >
              Semestr 1
            </button>
            <button
              onClick={() => setSelectedSemester('sem2')}
              className={`px-3 py-1 rounded-md transition-all ${
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
            className="px-2.5 py-1.5 rounded-lg bg-surface border border-border text-textPrimary text-xs font-mono focus:outline-none focus:border-accentPrimary"
          >
            <option value="name_asc">Nazwa A-Z</option>
            <option value="avg_desc">Średnia: najwyższa</option>
            <option value="avg_asc">Średnia: najniższa</option>
          </select>

        </div>
      </div>

      {/* LISTA PRZEDMIOTÓW I OCEN (SCROLLABLE CONTAINER) */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-0 pb-16 md:pb-6">
        
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
              {searchQuery ? 'Brak wyników dla podanej frazy wyszukiwania.' : 'Nie znaleziono zarejestrowanych ocen w wybranym okresie.'}
            </p>
          </div>
        )}

        {!loading && filteredSubjects.map((subject, idx) => {
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

                {/* ŚREDNIA PRZEDMIOTU */}
                <div className="flex items-center gap-2 flex-shrink-0">
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
                  <div className={`p-2.5 rounded-lg bg-surface/50 border border-border/40 ${selectedSemester === 'sem1' ? 'md:col-span-2' : ''}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-textMuted uppercase tracking-wider">
                        Semestr 1 ({sem1List.length})
                      </span>
                      {subject.sem1Avg && (
                        <span className="text-[10px] font-mono text-textSecondary font-semibold">
                          Śr: {Number(subject.sem1Avg).toFixed(2)}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5 min-h-[32px] items-center">
                      {sem1List.length === 0 ? (
                        <span className="text-[11px] font-mono text-textMuted/60 italic">Brak ocen</span>
                      ) : (
                        sem1List.map((g, gIdx) => (
                          <button
                            key={g.id || gIdx}
                            onClick={() => setSelectedGrade({ ...g, subjectName: subject.name, semesterNum: 1 })}
                            className={`w-8 h-8 rounded-lg border font-mono font-bold text-xs flex items-center justify-center transition-all cursor-pointer active:scale-95 ${getGradeBadgeStyle(g.value)}`}
                            title={`${g.value} • ${g.details?.category || 'Ocena'} (Waga: ${g.details?.weight || 1})`}
                          >
                            {g.value}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* SEMESTR 2 */}
                {(selectedSemester === 'all' || selectedSemester === 'sem2') && (
                  <div className={`p-2.5 rounded-lg bg-surface/50 border border-border/40 ${selectedSemester === 'sem2' ? 'md:col-span-2' : ''}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-textMuted uppercase tracking-wider">
                        Semestr 2 ({sem2List.length})
                      </span>
                      {subject.sem2Avg && (
                        <span className="text-[10px] font-mono text-textSecondary font-semibold">
                          Śr: {Number(subject.sem2Avg).toFixed(2)}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5 min-h-[32px] items-center">
                      {sem2List.length === 0 ? (
                        <span className="text-[11px] font-mono text-textMuted/60 italic">Brak ocen</span>
                      ) : (
                        sem2List.map((g, gIdx) => (
                          <button
                            key={g.id || gIdx}
                            onClick={() => setSelectedGrade({ ...g, subjectName: subject.name, semesterNum: 2 })}
                            className={`w-8 h-8 rounded-lg border font-mono font-bold text-xs flex items-center justify-center transition-all cursor-pointer active:scale-95 ${getGradeBadgeStyle(g.value)}`}
                            title={`${g.value} • ${g.details?.category || 'Ocena'} (Waga: ${g.details?.weight || 1})`}
                          >
                            {g.value}
                          </button>
                        ))
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
            className="w-full max-w-md glass-panel p-5 rounded-2xl border border-border shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Przycisk zamknięcia */}
            <button
              onClick={() => setSelectedGrade(null)}
              className="absolute right-4 top-4 p-1.5 rounded-lg bg-surface hover:bg-surfaceHover text-textMuted hover:text-textPrimary transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Nagłówek modala */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center font-mono font-bold text-2xl shadow-lg ${getGradeBadgeStyle(selectedGrade.value)}`}>
                {selectedGrade.value}
              </div>
              <div>
                <span className="text-[11px] font-mono text-accentPrimary uppercase tracking-wider block">
                  Semestr {selectedGrade.semesterNum}
                </span>
                <h3 className="text-base font-bold text-textPrimary font-sans">
                  {selectedGrade.subjectName}
                </h3>
              </div>
            </div>

            {/* Tabela szczegółów */}
            <div className="space-y-2.5 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-surface border border-border flex items-center justify-between">
                <span className="text-textMuted">Kategoria:</span>
                <span className="text-textPrimary font-semibold">{selectedGrade.details?.category || 'Ocena cząstkowa'}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-surface border border-border flex items-center justify-between">
                <span className="text-textMuted">Waga oceny:</span>
                <span className="text-accentPrimary font-bold">{selectedGrade.details?.weight ?? 1}</span>
              </div>

              {selectedGrade.details?.date && (
                <div className="p-2.5 rounded-lg bg-surface border border-border flex items-center justify-between">
                  <span className="text-textMuted">Data wystawienia:</span>
                  <span className="text-textPrimary">{selectedGrade.details.date}</span>
                </div>
              )}

              {selectedGrade.details?.teacher && (
                <div className="p-2.5 rounded-lg bg-surface border border-border flex items-center justify-between">
                  <span className="text-textMuted">Nauczyciel:</span>
                  <span className="text-textPrimary">{selectedGrade.details.teacher}</span>
                </div>
              )}

              {selectedGrade.details?.comment && (
                <div className="p-2.5 rounded-lg bg-surface border border-border flex flex-col gap-1">
                  <span className="text-textMuted">Komentarz:</span>
                  <span className="text-textPrimary font-sans text-xs bg-background/50 p-2 rounded border border-border/50">
                    {selectedGrade.details.comment}
                  </span>
                </div>
              )}
            </div>

            {/* Stopka modala */}
            <div className="mt-5 pt-3 border-t border-border flex justify-end">
              <button
                onClick={() => setSelectedGrade(null)}
                className="px-4 py-2 rounded-lg bg-surface hover:bg-surfaceHover text-textPrimary font-mono text-xs border border-border transition-all"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default GradesPage;
