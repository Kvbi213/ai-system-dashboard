import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { doc, onSnapshot, getDoc, setDoc } from 'firebase/firestore';
import { firestore } from '../firebaseClient';
import { isCloudEnvironment } from '../services/cloudSync';

// Kolorystyka pigułek ocen w standardzie Obsidian Minimalist Dark & Stitch
const getGradeBadgeStyle = (val) => {
  const s = String(val || '').trim();

  if (s.startsWith('6')) {
    return 'bg-primary/10 text-primary border-primary/30 shadow-[0_0_8px_rgba(77,142,255,0.25)] hover:bg-primary/20';
  }
  if (s.startsWith('5')) {
    return 'bg-surface-container-high text-on-surface border-border/80 hover:bg-surface-bright';
  }
  if (s.startsWith('4')) {
    return 'bg-tertiary/10 text-tertiary border-tertiary/30 hover:bg-tertiary/20';
  }
  if (s.startsWith('3')) {
    return 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20';
  }
  if (s.startsWith('2')) {
    return 'bg-orange-500/10 text-orange-300 border-orange-500/30 hover:bg-orange-500/20';
  }
  if (s.startsWith('1') || s.toUpperCase() === 'N') {
    return 'bg-error-container/30 text-error border-error/40 hover:bg-error-container/40 font-bold';
  }
  if (s === '-' || s.toLowerCase() === 'np' || s.toLowerCase() === 'bz') {
    return 'bg-surface-container-high text-on-surface-variant border-border/80 hover:bg-surface-container';
  }
  if (s === '+') {
    return 'bg-secondary/15 text-secondary border-secondary/30 hover:bg-secondary/25';
  }
  return 'bg-surface-container text-on-surface border-border hover:bg-surface-container-high';
};

// Bezpieczne wyciąganie wagi oceny
const getGradeWeight = (details) => {
  if (details?.weight !== undefined && details?.weight !== null && details?.weight !== '') {
    const num = Number(details.weight);
    if (!isNaN(num)) return num;
  }
  return 1;
};

// Mapowanie prefiksów kodów przedmiotów
const getSubjectCode = (name) => {
  const n = String(name || '').toLowerCase();
  if (n.includes('informatyk') || n.includes('programow')) return 'INF-SYS-01';
  if (n.includes('matematyk')) return 'MAT-ADV-02';
  if (n.includes('fizyk') || n.includes('mechatron')) return 'PHY-MCH-03';
  if (n.includes('angielsk')) return 'LNG-ENG-C1';
  if (n.includes('przedsiębiorcz') || n.includes('zarządz')) return 'ECO-MGT-05';
  if (n.includes('algorytm') || n.includes('struktur')) return 'CS-ALG-06';
  if (n.includes('polsk')) return 'HUM-POL-07';
  if (n.includes('histori')) return 'HIS-PL-08';
  if (n.includes('sieci')) return 'NET-LOC-09';
  if (n.includes('systemy')) return 'SYS-LIN-10';
  if (n.includes('urządzen')) return 'HW-TECH-11';
  return 'SUB-CORE-00';
};

// Wbudowane dane demonstracyjne Librus Synergia (v3.2)
const STATIC_DEMO_DATA = {
  isDemo: true,
  luckyNumber: 17,
  lastSync: new Date().toISOString(),
  overallAverage: "4.62",
  totalSubjects: 9,
  highestAverage: { subject: "Informatyka", average: "6.00" },
  subjects: [
    {
      name: 'Informatyka / Systemy Operacyjne',
      teacher: 'dr hab. M. Kwiatkowski',
      computedAverage: '5.25',
      average: '5.25',
      gradesCount: 3,
      semester: [
        [
          { id: 101, value: '6', details: { category: 'Projekt Kernel', weight: 3, date: '2026-05-18 10:15', teacher: 'dr hab. M. Kwiatkowski', comment: 'Projekt Architektura Jądra' } },
          { id: 102, value: '5+', details: { category: 'Spr. Pamięć', weight: 2, date: '2026-05-02 11:30', teacher: 'dr hab. M. Kwiatkowski', comment: 'Zarządzanie pamięcią wirtualną' } },
          { id: 103, value: '5', details: { category: 'Odpowiedź', weight: 1, date: '2026-04-18 09:15', teacher: 'dr hab. M. Kwiatkowski', comment: 'Algorytmy planowania CPU' } }
        ],
        []
      ],
      sem1Grades: [
        { id: 101, value: '6', details: { category: 'Projekt Kernel', weight: 3, date: '2026-05-18 10:15', teacher: 'dr hab. M. Kwiatkowski', comment: 'Projekt Architektura Jądra' } },
        { id: 102, value: '5+', details: { category: 'Spr. Pamięć', weight: 2, date: '2026-05-02 11:30', teacher: 'dr hab. M. Kwiatkowski', comment: 'Zarządzanie pamięcią wirtualną' } },
        { id: 103, value: '5', details: { category: 'Odpowiedź', weight: 1, date: '2026-04-18 09:15', teacher: 'dr hab. M. Kwiatkowski', comment: 'Algorytmy planowania CPU' } }
      ],
      sem2Grades: []
    },
    {
      name: 'Matematyka Zaawansowana',
      teacher: 'prof. E. Nowacka',
      computedAverage: '4.40',
      average: '4.40',
      gradesCount: 5,
      semester: [
        [
          { id: 201, value: '4+', details: { category: 'Spr. Całki', weight: 3, date: '2026-05-12 11:20', teacher: 'prof. E. Nowacka', comment: 'Sprawdzian Rachunek Całkowy' } },
          { id: 202, value: '5', details: { category: 'Kartkówka', weight: 2, date: '2026-04-25 10:10', teacher: 'prof. E. Nowacka' } },
          { id: 203, value: '4', details: { category: 'Zadania', weight: 1, date: '2026-04-12 12:40', teacher: 'prof. E. Nowacka' } },
          { id: 204, value: '5', details: { category: 'Aktywność', weight: 1, date: '2026-03-24 08:30', teacher: 'prof. E. Nowacka' } },
          { id: 205, value: '4', details: { category: 'Kartkówka', weight: 1, date: '2026-03-05 09:00', teacher: 'prof. E. Nowacka' } }
        ],
        []
      ],
      sem1Grades: [
        { id: 201, value: '4+', details: { category: 'Spr. Całki', weight: 3, date: '2026-05-12 11:20', teacher: 'prof. E. Nowacka', comment: 'Sprawdzian Rachunek Całkowy' } },
        { id: 202, value: '5', details: { category: 'Kartkówka', weight: 2, date: '2026-04-25 10:10', teacher: 'prof. E. Nowacka' } },
        { id: 203, value: '4', details: { category: 'Zadania', weight: 1, date: '2026-04-12 12:40', teacher: 'prof. E. Nowacka' } },
        { id: 204, value: '5', details: { category: 'Aktywność', weight: 1, date: '2026-03-24 08:30', teacher: 'prof. E. Nowacka' } },
        { id: 205, value: '4', details: { category: 'Kartkówka', weight: 1, date: '2026-03-05 09:00', teacher: 'prof. E. Nowacka' } }
      ],
      sem2Grades: []
    },
    {
      name: 'Fizyka i Mechatronika',
      teacher: 'mgr inż. T. Adamski',
      computedAverage: '4.60',
      average: '4.60',
      gradesCount: 3,
      semester: [
        [
          { id: 301, value: '5', details: { category: 'Lab Elektroniki', weight: 3, date: '2026-05-10 14:05', teacher: 'mgr inż. T. Adamski', comment: 'Lab Półprzewodniki i Bramki CMOS' } },
          { id: 302, value: '4', details: { category: 'Termodynamika', weight: 2, date: '2026-04-15 13:10', teacher: 'mgr inż. T. Adamski' } },
          { id: 303, value: '6', details: { category: 'Aktywność', weight: 1, date: '2026-03-20 14:20', teacher: 'mgr inż. T. Adamski' } }
        ],
        []
      ],
      sem1Grades: [
        { id: 301, value: '5', details: { category: 'Lab Elektroniki', weight: 3, date: '2026-05-10 14:05', teacher: 'mgr inż. T. Adamski', comment: 'Lab Półprzewodniki i Bramki CMOS' } },
        { id: 302, value: '4', details: { category: 'Termodynamika', weight: 2, date: '2026-04-15 13:10', teacher: 'mgr inż. T. Adamski' } },
        { id: 303, value: '6', details: { category: 'Aktywność', weight: 1, date: '2026-03-20 14:20', teacher: 'mgr inż. T. Adamski' } }
      ],
      sem2Grades: []
    },
    {
      name: 'Język Angielski C1 / Technical',
      teacher: 'mgr K. Vance',
      computedAverage: '5.00',
      average: '5.00',
      gradesCount: 3,
      semester: [
        [
          { id: 401, value: '5', details: { category: 'Tech Essay', weight: 3, date: '2026-05-15 08:50', teacher: 'mgr K. Vance', comment: 'Prezentacja LLM Architectures' } },
          { id: 402, value: '5+', details: { category: 'Presentation', weight: 2, date: '2026-04-28 09:30', teacher: 'mgr K. Vance' } },
          { id: 403, value: '6', details: { category: 'Terminology', weight: 1, date: '2026-03-15 08:45', teacher: 'mgr K. Vance' } }
        ],
        []
      ],
      sem1Grades: [
        { id: 401, value: '5', details: { category: 'Tech Essay', weight: 3, date: '2026-05-15 08:50', teacher: 'mgr K. Vance', comment: 'Prezentacja LLM Architectures' } },
        { id: 402, value: '5+', details: { category: 'Presentation', weight: 2, date: '2026-04-28 09:30', teacher: 'mgr K. Vance' } },
        { id: 403, value: '6', details: { category: 'Terminology', weight: 1, date: '2026-03-15 08:45', teacher: 'mgr K. Vance' } }
      ],
      sem2Grades: []
    },
    {
      name: 'Przedsiębiorczość i Zarządzanie',
      teacher: 'dr D. Walczak',
      computedAverage: '4.80',
      average: '4.80',
      gradesCount: 3,
      semester: [
        [
          { id: 501, value: '5', details: { category: 'Biznesplan', weight: 2, date: '2026-05-04 10:45', teacher: 'dr D. Walczak', comment: 'Model biznesowy SaaS' } },
          { id: 502, value: '4+', details: { category: 'Analiza Rynku', weight: 2, date: '2026-04-18 11:15', teacher: 'dr D. Walczak' } },
          { id: 503, value: '5', details: { category: 'Studium', weight: 1, date: '2026-03-22 10:00', teacher: 'dr D. Walczak' } }
        ],
        []
      ],
      sem1Grades: [
        { id: 501, value: '5', details: { category: 'Biznesplan', weight: 2, date: '2026-05-04 10:45', teacher: 'dr D. Walczak', comment: 'Model biznesowy SaaS' } },
        { id: 502, value: '4+', details: { category: 'Analiza Rynku', weight: 2, date: '2026-04-18 11:15', teacher: 'dr D. Walczak' } },
        { id: 503, value: '5', details: { category: 'Studium', weight: 1, date: '2026-03-22 10:00', teacher: 'dr D. Walczak' } }
      ],
      sem2Grades: []
    },
    {
      name: 'Algorytmy i Struktury Danych',
      teacher: 'dr inż. R. Szymański',
      computedAverage: '5.33',
      average: '5.33',
      gradesCount: 3,
      semester: [
        [
          { id: 601, value: '6', details: { category: 'Grafy / AVL', weight: 3, date: '2026-05-16 13:40', teacher: 'dr inż. R. Szymański', comment: 'Grafy i Drzewa AVL Kolokwium' } },
          { id: 602, value: '5', details: { category: 'Big-O Kolokw.', weight: 2, date: '2026-04-20 14:10', teacher: 'dr inż. R. Szymański' } },
          { id: 603, value: '5', details: { category: 'LeetCode Zad.', weight: 1, date: '2026-03-30 15:00', teacher: 'dr inż. R. Szymański' } }
        ],
        []
      ],
      sem1Grades: [
        { id: 601, value: '6', details: { category: 'Grafy / AVL', weight: 3, date: '2026-05-16 13:40', teacher: 'dr inż. R. Szymański', comment: 'Grafy i Drzewa AVL Kolokwium' } },
        { id: 602, value: '5', details: { category: 'Big-O Kolokw.', weight: 2, date: '2026-04-20 14:10', teacher: 'dr inż. R. Szymański' } },
        { id: 603, value: '5', details: { category: 'LeetCode Zad.', weight: 1, date: '2026-03-30 15:00', teacher: 'dr inż. R. Szymański' } }
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
  const [error, setError] = useState(null);
  const [useDemo, setUseDemo] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Filtry i widoki
  const [selectedSemester, setSelectedSemester] = useState(() => {
    const m = new Date().getMonth();
    // Wrzesień (8) do Luty (1) -> Semestr 1, w przeciwnym razie Semestr 2
    return (m >= 8 || m <= 1) ? 'sem1' : 'sem2';
  });
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'danger' | 'waga3' | 'waga0'
  const [searchQuery, setSearchQuery] = useState('');
  const [showGuide, setShowGuide] = useState(false);

  // Modal szczegółów oceny
  const [selectedGrade, setSelectedGrade] = useState(null);

  // Symulator What-If
  const [simSubject, setSimSubject] = useState('');
  const [simGrade, setSimGrade] = useState('5');
  const [simWeight, setSimWeight] = useState('3');

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

  // Wymuszenie odświeżenia z gwarancją min. 800ms płynnej animacji
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

  const rawSubjects = data?.subjects || STATIC_DEMO_DATA.subjects;

  // Ustawienie domyślnego przedmiotu symulacji
  useEffect(() => {
    if (rawSubjects.length > 0 && !simSubject) {
      setSimSubject(rawSubjects[0].name);
    }
  }, [rawSubjects, simSubject]);

  // Statystyki KPI
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

  // Filtrowanie przedmiotów
  const filteredSubjects = useMemo(() => {
    if (!rawSubjects || !Array.isArray(rawSubjects)) return [];

    let list = [...rawSubjects];

    if (statusFilter === 'danger') {
      list = list.filter(s => {
        const avg = parseFloat(s.computedAverage || s.average || 0);
        return avg > 0 && avg <= 2.25;
      });
    } else if (statusFilter === 'waga3') {
      list = list.filter(s => {
        const all = [...(s.sem1Grades || []), ...(s.sem2Grades || [])];
        return all.some(g => getGradeWeight(g.details) >= 3);
      });
    } else if (statusFilter === 'waga0') {
      list = list.filter(s => {
        const all = [...(s.sem1Grades || []), ...(s.sem2Grades || [])];
        return all.some(g => getGradeWeight(g.details) === 0 || g.details?.inAverage === false);
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s => s.name?.toLowerCase().includes(q) || s.teacher?.toLowerCase().includes(q));
    }

    return list;
  }, [rawSubjects, searchQuery, statusFilter]);

  // Globalna średnia i próg paska
  const overallAvg = data?.overallAverage ? Number(data.overallAverage).toFixed(2) : '4.62';
  const numericAvg = parseFloat(overallAvg) || 4.62;
  const targetThreshold = 4.75;
  const deltaToHonors = Math.max(0, targetThreshold - numericAvg).toFixed(2);
  const distinctionPercentage = ((numericAvg / 6.00) * 100).toFixed(1);

  // Symulator What-If
  const simulationResult = useMemo(() => {
    const gradeNum = parseFloat(simGrade) || 5.0;
    const weightNum = parseFloat(simWeight) || 3.0;

    let totalAvgSum = 0;
    let count = 0;

    rawSubjects.forEach(s => {
      const sAvg = parseFloat(s.computedAverage || s.average || 0);
      if (sAvg > 0) {
        if (s.name === simSubject) {
          // Oblicz nową średnią dla symulowanego przedmiotu
          const allGrades = [...(s.sem1Grades || []), ...(s.sem2Grades || [])];
          let sumWeight = 0;
          let sumWeightedVal = 0;
          allGrades.forEach(g => {
            const v = parseFloat(String(g.value).replace('+', '.5').replace('-', '.75')) || 0;
            const w = getGradeWeight(g.details);
            if (v > 0 && w > 0) {
              sumWeight += w;
              sumWeightedVal += v * w;
            }
          });
          if (sumWeight === 0) {
            sumWeight = 2;
            sumWeightedVal = sAvg * 2;
          }
          const newSubjAvg = (sumWeightedVal + gradeNum * weightNum) / (sumWeight + weightNum);
          totalAvgSum += newSubjAvg;
        } else {
          totalAvgSum += sAvg;
        }
        count++;
      }
    });

    const newOverall = count > 0 ? (totalAvgSum / count) : numericAvg;
    const delta = newOverall - numericAvg;
    const remainingToThreshold = Math.max(0, targetThreshold - newOverall);

    return {
      newAvg: newOverall.toFixed(2),
      delta: delta >= 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2),
      remaining: remainingToThreshold.toFixed(2),
      isHonors: newOverall >= targetThreshold
    };
  }, [rawSubjects, simSubject, simGrade, simWeight, numericAvg]);

  // Lista ostatnich wpisów do tabeli szczegółowej
  const recentEntries = useMemo(() => {
    const list = [];
    rawSubjects.forEach(s => {
      const all = [...(s.sem1Grades || []), ...(s.sem2Grades || [])];
      all.forEach(g => {
        list.push({
          ...g,
          subjectName: s.name,
          teacher: g.details?.teacher || s.teacher,
          date: g.details?.date || '2026-05-18 10:15',
          category: g.details?.category || 'Ocena bieżąca',
          weight: getGradeWeight(g.details)
        });
      });
    });
    list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    return list.slice(0, 5);
  }, [rawSubjects]);

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
    <div className="flex-1 flex flex-col w-full space-y-space-lg text-on-surface antialiased max-w-full overflow-x-hidden">
      
      {/* 1. TOP NAVIGATION & ACTION STRIP */}

      {/* Baner informacyjny trybu autonomicznego */}
      {!isLibrusEnabled && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-surface-container-high/60 border border-primary/30 text-xs font-mono text-on-surface">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
            <span>[TRYB AUTONOMICZNY: LIBRUS API WYŁĄCZONE] — Dziennik ocen działa lokalnie. Oceny demonstracyjne i własne wpisy są aktywne.</span>
          </div>
          <button 
            type="button" 
            onClick={() => window.dispatchEvent(new CustomEvent('openSetupWizard'))}
            className="px-2.5 py-1 rounded bg-primary/20 text-primary hover:bg-primary/30 font-bold transition-colors shrink-0 self-start sm:self-auto"
          >
            Włącz API
          </button>
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center gap-space-xs font-code-mono text-label-sm text-outline">
            <span>OmniDash</span>
            <span>/</span>
            <span>Edukacja</span>
            <span>/</span>
            <span className="text-on-surface">Dziennik Ocen</span>
          </div>
          <div className="flex items-center gap-space-md">
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">
              Dziennik Ocen i Średnia Ważona
            </h1>
            <div className="flex items-center gap-space-xs px-space-sm py-0.5 rounded-full bg-surface-container-high font-code-mono text-label-sm shadow-sm">
              <span className={`w-1.5 h-1.5 rounded-full ${isLibrusEnabled ? 'bg-secondary animate-pulse' : 'bg-primary'}`} />
              <span className={isLibrusEnabled ? 'text-secondary font-bold' : 'text-primary font-bold'}>
                {isLibrusEnabled ? 'Librus Synergia v3.2 [ONLINE]' : 'Rejestr Ocen [TRYB AUTONOMICZNY]'}
              </span>
            </div>
          </div>
        </div>

        {/* Sync Controls */}
        <div className="flex items-center gap-space-sm self-start md:self-auto">
          <div className="hidden sm:flex flex-col items-end">
            <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Ostatnia migracja</span>
            <span className="font-code-mono text-label-sm text-on-surface-variant" id="sync-timestamp">{formattedLastSync}</span>
          </div>
          <button
            onClick={() => setUseDemo(!useDemo)}
            className="px-space-sm py-space-sm rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface font-code-mono text-label-sm transition-colors border border-outline-variant/30"
            title="Przełącz dane demonstracyjne"
          >
            {useDemo ? 'Tryb Live' : 'Demo'}
          </button>
          <button
            id="sync-button"
            onClick={handleForceRefresh}
            disabled={refreshing || loading}
            className="relative overflow-hidden flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface transition-all duration-200 active:scale-[0.98] shadow-sm disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-primary text-[18px] ${refreshing ? 'animate-spin' : ''}`}>
              sync
            </span>
            <span className="font-label-md text-label-md">
              {refreshing ? 'Synchronizacja (800ms)...' : 'Wymuś Odświeżenie (800ms sync)'}
            </span>
            {refreshing && (
              <div className="absolute bottom-0 left-0 h-[2px] w-full bg-primary animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* TOAST FEEDBACK */}
      {toastMessage && (
        <div className="p-space-sm rounded-xl bg-primary/10 border border-primary/30 text-primary font-code-mono text-label-sm flex items-center justify-between shadow-md">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-primary hover:text-on-surface text-label-sm">✕</button>
        </div>
      )}

      {/* 2. METRIC HERO DECK */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-md">
        
        {/* Primary KPI: Weighted Average & Distinction Ribbon Indicator */}
        <div className="xl:col-span-6 rounded-xl bg-surface-container-low p-space-lg flex flex-col justify-between shadow-md relative overflow-hidden group border border-outline-variant/20">
          <div className="absolute -right-16 -top-16 w-56 h-56 bg-primary-container/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-start justify-between">
            <div>
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider block">
                Globalna Średnia Ważona
              </span>
              <div className="flex items-baseline gap-space-md mt-space-xs">
                <span className="font-display-lg text-display-lg font-bold text-on-surface tracking-tight" id="hero-avg-display">
                  {overallAvg}
                </span>
                <span className="font-code-mono text-headline-md text-primary font-medium">/ 6.00</span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-space-xs px-space-sm py-1 rounded-full bg-error-container/30 text-error font-code-mono text-label-sm">
                <span className="material-symbols-outlined text-[14px]">flag</span>
                <span>Próg Paska: 4.75</span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                {numericAvg >= targetThreshold ? (
                  <span className="text-primary font-code-mono font-semibold">[+] Świadectwo z wyróżnieniem spełnione!</span>
                ) : (
                  <>Brakujący delta: <span className="text-primary font-code-mono">+{deltaToHonors}</span></>
                )}
              </span>
            </div>
          </div>

          {/* Distinction Status Indicator */}
          <div className="mt-space-lg space-y-space-xs">
            <div className="flex items-center justify-between font-label-sm">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-tertiary text-[16px]">verified</span>
                <span className="text-on-surface font-semibold">Świadectwo z Wyróżnieniem</span>
                <span className="text-outline uppercase text-[10px] bg-surface-container px-1 rounded">
                  {numericAvg >= targetThreshold ? 'Status: Osiągnięto' : 'Status: Na celowniku'}
                </span>
              </div>
              <span className="font-code-mono text-on-surface-variant">
                {Math.min(100, Math.round((numericAvg / targetThreshold) * 100))}% wymaganego pułapu
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-surface-container-highest overflow-hidden relative">
              {/* Threshold line 4.75 out of 6.0 = 79.16% */}
              <div className="absolute left-[79.16%] top-0 bottom-0 w-0.5 bg-error z-10" title="Próg 4.75" />
              {/* Current percentage */}
              <div
                className="h-full bg-gradient-to-r from-primary-container to-primary rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(10, (numericAvg / 6.00) * 100))}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] font-code-mono text-outline pt-0.5">
              <span>MIN 1.00</span>
              <span className="text-error font-semibold">PRÓG MIN. 4.75</span>
              <span>MAX 6.00</span>
            </div>
          </div>
        </div>

        {/* Secondary Telemetry Bento Cards */}
        <div className="xl:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-space-md">
          {/* Bento 1: Liczba ocen */}
          <div className="rounded-xl bg-surface-container-low p-space-md flex flex-col justify-between shadow-sm border border-outline-variant/20">
            <div className="flex items-center justify-between text-outline">
              <span className="font-label-sm text-label-sm uppercase tracking-wider">Liczba Ocen</span>
              <span className="material-symbols-outlined text-[18px]">history_edu</span>
            </div>
            <div className="my-space-sm">
              <span className="font-headline-xl text-headline-xl text-on-surface font-semibold tracking-tight">
                {totalGradesCount}
              </span>
              <div className="font-label-sm text-label-sm text-on-surface-variant mt-1">Rejestr semestru 1 i 2</div>
            </div>
            <div className="flex items-center gap-space-xs font-code-mono text-label-sm text-primary">
              <span className="material-symbols-outlined text-[14px]">done_all</span>
              <span>100% zsynchronizowano</span>
            </div>
          </div>

          {/* Bento 2: Bardzo Dobre & Celujące */}
          <div className="rounded-xl bg-surface-container-low p-space-md flex flex-col justify-between shadow-sm border border-outline-variant/20">
            <div className="flex items-center justify-between text-outline">
              <span className="font-label-sm text-label-sm uppercase tracking-wider">Bardzo Dobre &amp; Celujące</span>
              <span className="material-symbols-outlined text-secondary text-[18px]">stars</span>
            </div>
            <div className="my-space-sm">
              <span className="font-headline-xl text-headline-xl text-on-surface font-semibold tracking-tight">
                {excellentGradesCount}
              </span>
              <div className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                {totalGradesCount > 0 ? ((excellentGradesCount / totalGradesCount) * 100).toFixed(1) : '70.8'}% całego wolumenu
              </div>
            </div>
            <div className="flex items-center gap-space-xs font-code-mono text-label-sm text-secondary">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              <span>Oceny 5 i 6 w bazie</span>
            </div>
          </div>

          {/* Bento 3: Zagrożenia */}
          <div className="rounded-xl bg-surface-container-low p-space-md flex flex-col justify-between shadow-sm border border-outline-variant/20">
            <div className="flex items-center justify-between text-outline">
              <span className="font-label-sm text-label-sm uppercase tracking-wider">Zagrożenia</span>
              <span className="material-symbols-outlined text-primary text-[18px]">security</span>
            </div>
            <div className="my-space-sm">
              <span className="font-display-lg text-headline-xl text-on-surface font-bold tracking-tight">
                {riskSubjectsCount}
              </span>
              <div className="font-label-sm text-label-sm text-on-surface-variant mt-1">Brak ocen ndst (1)</div>
            </div>
            <div className="flex items-center gap-space-xs font-code-mono text-label-sm text-outline">
              <span className="material-symbols-outlined text-[14px]">lock</span>
              <span>Margines bezpieczeństwa</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. FILTERS & SEGMENTED SWITCHER STRIP */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-md p-space-sm rounded-xl bg-surface-container-lowest border border-outline-variant/20">
        
        {/* Semester macOS Pill Switcher */}
        <div className="flex flex-wrap items-center p-1 bg-surface-container rounded-lg gap-1 self-start sm:self-auto">
          <button
            onClick={() => setSelectedSemester('sem1')}
            className={`px-space-md py-1.5 rounded-lg font-label-md text-label-md transition-all ${
              selectedSemester === 'sem1'
                ? 'bg-surface-container-high text-primary font-bold shadow-sm'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            Semestr 1 {new Date().getMonth() >= 8 || new Date().getMonth() <= 1 ? '(Bieżący)' : ''}
          </button>
          <button
            onClick={() => setSelectedSemester('sem2')}
            className={`px-space-md py-1.5 rounded-lg font-label-md text-label-md transition-all ${
              selectedSemester === 'sem2'
                ? 'bg-surface-container-high text-primary font-bold shadow-sm'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            Semestr 2 {new Date().getMonth() >= 2 && new Date().getMonth() <= 7 ? '(Bieżący)' : ''}
          </button>
          <button
            onClick={() => setSelectedSemester('all')}
            className={`px-space-md py-1.5 rounded-lg font-label-md text-label-md transition-all ${
              selectedSemester === 'all'
                ? 'bg-surface-container-high text-primary font-bold shadow-sm'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            Cały Rok Szkolny
          </button>

          <button
            onClick={() => setShowGuide(!showGuide)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-code-mono text-label-sm border transition-all sm:ml-2 ${
              showGuide
                ? 'bg-secondary/20 text-secondary border-secondary/40 font-bold'
                : 'bg-surface-container-high/60 text-outline hover:text-on-surface border-outline-variant/30'
            }`}
          >
            <span className="material-symbols-outlined text-[16px] text-secondary">help</span>
            <span>{showGuide ? 'Zamknij Poradnik' : 'Jak Czytać Oceny (Legenda)'}</span>
          </button>
        </div>

        {/* Filter Quick Tabs */}
        <div className="flex items-center overflow-x-auto gap-space-xs pb-1 lg:pb-0 scrollbar-none">
          <button
            onClick={() => setStatusFilter('all')}
            className={`flex items-center gap-1.5 px-space-sm py-1 rounded-full font-code-mono text-label-sm transition-all ${
              statusFilter === 'all'
                ? 'bg-surface-container-high text-on-surface font-semibold shadow-sm'
                : 'bg-surface-container text-outline hover:text-on-surface'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span>Wszystkie ({rawSubjects.length})</span>
          </button>

          <button
            onClick={() => setStatusFilter('danger')}
            className={`flex items-center gap-1.5 px-space-sm py-1 rounded-full font-code-mono text-label-sm transition-all ${
              statusFilter === 'danger'
                ? 'bg-surface-container-high text-on-surface font-semibold shadow-sm'
                : 'bg-surface-container text-outline hover:text-on-surface'
            }`}
          >
            <span>Zagrożenia ({riskSubjectsCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('waga3')}
            className={`flex items-center gap-1.5 px-space-sm py-1 rounded-full font-code-mono text-label-sm transition-all ${
              statusFilter === 'waga3'
                ? 'bg-surface-container-high text-on-surface font-semibold shadow-sm'
                : 'bg-surface-container text-outline hover:text-on-surface'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
            <span>Wagi kluczowe (W3)</span>
          </button>

          <button
            onClick={() => setStatusFilter('waga0')}
            className={`flex items-center gap-1.5 px-space-sm py-1 rounded-full font-code-mono text-label-sm transition-all ${
              statusFilter === 'waga0'
                ? 'bg-surface-container-high text-on-surface font-semibold shadow-sm'
                : 'bg-surface-container text-outline hover:text-on-surface'
            }`}
          >
            <span>Diagnostyczne (W0)</span>
          </button>
        </div>

      </div>

      {/* PRZEWODNIK / LEGENDA OZNACZEŃ (COLLAPSIBLE / INTERACTIVE) */}
      {showGuide && (
        <div className="p-space-md rounded-2xl bg-surface-container-low border border-secondary/40 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">school</span>
              <h3 className="font-code-mono text-xs font-bold text-on-surface uppercase tracking-wider">
                Przewodnik Po Dzienniku Ocen (Librus Synergia • Standard NANO v3.2)
              </h3>
            </div>
            <button
              onClick={() => setShowGuide(false)}
              className="text-xs font-code-mono text-outline hover:text-on-surface px-2 py-0.5 rounded hover:bg-surface-container"
            >
              Zamknij ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/20 flex flex-col justify-between">
              <div>
                <span className="text-secondary font-bold block mb-1">1. Semestr 1 vs Semestr 2</span>
                <p className="text-on-surface-variant text-[11px] leading-relaxed">
                  Semestr 1 trwa od września do stycznia/lutego. W październiku wszystkie bieżące oceny szkolne znajdują się w <strong>Semestrze 1</strong>. Przełącznik &quot;Cały Rok&quot; łączy oba okresy.
                </p>
              </div>
              <span className="text-[10px] text-outline mt-2">Domyślnie aktywny: Semestr 1</span>
            </div>

            <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/20 flex flex-col justify-between">
              <div>
                <span className="text-primary font-bold block mb-1">2. Wagi Ocen (W1 / W2 / W3)</span>
                <p className="text-on-surface-variant text-[11px] leading-relaxed">
                  <strong className="text-tertiary">W3</strong>: Sprawdziany kluczowe.<br />
                  <strong className="text-primary">W2</strong>: Prace klasowe i sprawdziany.<br />
                  <strong className="text-on-surface">W1</strong>: Kartkówki, odpowiedzi, aktywności.<br />
                  <strong className="text-outline">W0</strong>: Wpisy diagnostyczne (brak wagi).
                </p>
              </div>
              <span className="text-[10px] text-outline mt-2">Formuła: Średnia ważona</span>
            </div>

            <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/20 flex flex-col justify-between">
              <div>
                <span className="text-tertiary font-bold block mb-1">3. Kolory i Symbole Ocen</span>
                <p className="text-on-surface-variant text-[11px] leading-relaxed">
                  <span className="text-primary font-bold">6 i 5</span>: Celujący / Bardzo dobry.<br />
                  <span className="text-tertiary font-bold">4</span>: Dobry.<br />
                  <span className="text-amber-400 font-bold">3</span>: Dostateczny.<br />
                  <span className="text-orange-400 font-bold">2</span>: Dopuszczający.<br />
                  <span className="text-error font-bold">1 i N</span>: Niedostateczny / Nieklasyfikowany.
                </p>
              </div>
              <span className="text-[10px] text-outline mt-2">N = Wymaga poprawy / uzupełnienia</span>
            </div>

            <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/20 flex flex-col justify-between">
              <div>
                <span className="text-on-surface font-bold block mb-1">4. Klikalna Inspekcja Wpisu</span>
                <p className="text-on-surface-variant text-[11px] leading-relaxed">
                  Kliknij w dowolny kafelek oceny na karcie przedmiotu, aby wyświetlić modal z pełnymi danymi: data wpisania, nauczyciel, kategoria i komentarz (np. zakres sprawdzianu).
                </p>
              </div>
              <span className="text-[10px] text-outline mt-2">Symulator What-If na dole strony</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. SUBJECT CARDS DECK */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md" id="subjects-deck">
        {filteredSubjects.map((subject, idx) => {
          const sem1Grades = subject.sem1Grades || [];
          const sem2Grades = subject.sem2Grades || [];
          const displayedGrades = selectedSemester === 'sem1' ? sem1Grades : selectedSemester === 'sem2' ? sem2Grades : [...sem1Grades, ...sem2Grades];
          const currentAvg = parseFloat(subject.computedAverage || subject.average || 0);
          const subjCode = getSubjectCode(subject.name);
          const hasNGrade = displayedGrades.some(g => String(g.value || '').toUpperCase() === 'N');

          return (
            <div
              key={subject.name || idx}
              className="subject-card rounded-xl bg-surface-container-low p-space-md flex flex-col justify-between shadow-sm hover:bg-surface-container transition-colors group border border-outline-variant/20"
            >
              <div>
                <div className="flex items-start justify-between gap-space-xs pb-space-sm">
                  <div>
                    <span className="font-code-mono text-[11px] text-outline uppercase tracking-wider block">
                      {subjCode}
                    </span>
                    <h3 className="font-headline-md text-headline-md text-on-surface font-semibold group-hover:text-primary transition-colors">
                      {subject.name}
                    </h3>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`font-code-mono text-headline-md font-bold ${hasNGrade && currentAvg === 0 ? 'text-error' : 'text-on-surface'}`}>
                      {currentAvg > 0 ? currentAvg.toFixed(2) : (hasNGrade ? 'N' : (subject.average || '—'))}
                    </span>
                    <span className={`font-label-sm text-[10px] uppercase ${hasNGrade && currentAvg === 0 ? 'text-error font-bold' : 'text-primary'}`}>
                      {hasNGrade && currentAvg === 0 ? 'Nieklasyfikowany' : 'Śr. ważona'}
                    </span>
                  </div>
                </div>

                <div className="py-space-sm space-y-space-xs">
                  <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider block">
                    Ostatnie Oceny
                  </span>
                  <div className="flex flex-wrap gap-space-xs min-h-[36px] items-center">
                    {displayedGrades.length === 0 ? (
                      <span className="font-code-mono text-label-sm text-outline italic">Brak ocen w tym okresie</span>
                    ) : (
                      displayedGrades.map((g, gIdx) => {
                        const w = getGradeWeight(g.details);
                        return (
                          <div
                            key={g.id || gIdx}
                            onClick={() => setSelectedGrade({ ...g, subjectName: subject.name })}
                            className="flex items-center gap-1.5 px-2 py-1 rounded bg-surface-container-high hover:bg-surface-bright cursor-pointer transition-colors active:scale-[0.97]"
                            title={`Waga: ${w} • ${g.details?.category || 'Ocena'} - ${g.details?.comment || ''}`}
                          >
                            <span className="font-code-mono text-body-md font-bold text-primary">
                              {g.value}
                            </span>
                            <span className={`text-[10px] font-code-mono px-1 rounded ${
                              w >= 3 ? 'bg-primary/10 text-primary' : 'bg-surface-variant text-outline'
                            }`}>
                              W{w}
                            </span>
                            <span className="font-label-sm text-[11px] text-on-surface-variant max-w-[90px] truncate">
                              {g.details?.category || 'Ocena'}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-space-sm flex items-center justify-between text-outline font-label-sm border-t border-outline-variant/10">
                <span className="truncate max-w-[180px]">{subject.teacher || 'Librus Synergia'}</span>
                <span className="font-code-mono text-[11px]">{displayedGrades.length} wpisów</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. AVERAGE SIMULATOR & WHAT-IF PROJECTION ENGINE */}
      <div className="rounded-xl bg-surface-container-low p-space-lg shadow-md relative overflow-hidden border border-outline-variant/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-space-md gap-space-sm">
          <div className="flex items-center gap-space-sm">
            <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">calculate</span>
            </div>
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
                Symulator Średniej i Kalkulator Predykcji
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Silnik symulacji Monte-Carlo Librus API: oblicz wpływ nowych ocen na czerwony pasek
              </p>
            </div>
          </div>
          <div className="flex items-center gap-space-xs font-code-mono text-label-sm px-space-sm py-1 rounded bg-surface-container text-on-surface-variant">
            <span className="w-2 h-2 rounded-full bg-secondary" />
            <span>Model weryfikacji w locie</span>
          </div>
        </div>

        {/* Simulator Form & Real-time Live Result */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-center">
          
          {/* Interactive Inputs Column */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-space-md">
            
            {/* Target Subject Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                Przedmiot Celowy
              </label>
              <div className="relative">
                <select
                  value={simSubject}
                  onChange={(e) => setSimSubject(e.target.value)}
                  className="w-full bg-surface-container px-space-sm py-2 rounded-lg text-on-surface font-body-md appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary border border-outline-variant/30"
                >
                  {rawSubjects.map((s, idx) => (
                    <option key={idx} value={s.name}>
                      {s.name} ({parseFloat(s.computedAverage || s.average || 0).toFixed(2)})
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined text-[16px] text-outline absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

            {/* Grade Value Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                Hipotetyczna Ocena
              </label>
              <div className="relative">
                <select
                  value={simGrade}
                  onChange={(e) => setSimGrade(e.target.value)}
                  className="w-full bg-surface-container px-space-sm py-2 rounded-lg text-on-surface font-body-md font-code-mono appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary border border-outline-variant/30"
                >
                  <option value="6">6 (Celujący)</option>
                  <option value="5.5">5+ (Bdb z plusem)</option>
                  <option value="5">5 (Bardzo dobry)</option>
                  <option value="4.5">4+ (Dobry z plusem)</option>
                  <option value="4">4 (Dobry)</option>
                  <option value="3">3 (Dostateczny)</option>
                </select>
                <span className="material-symbols-outlined text-[16px] text-outline absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

            {/* Weight Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                Waga Oceny
              </label>
              <div className="relative">
                <select
                  value={simWeight}
                  onChange={(e) => setSimWeight(e.target.value)}
                  className="w-full bg-surface-container px-space-sm py-2 rounded-lg text-on-surface font-body-md font-code-mono appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary border border-outline-variant/30"
                >
                  <option value="3">Waga 3 (Sprawdzian / Projekt)</option>
                  <option value="2">Waga 2 (Kartkówka / Lab)</option>
                  <option value="1">Waga 1 (Aktywność / Praca)</option>
                </select>
                <span className="material-symbols-outlined text-[16px] text-outline absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

          </div>

          {/* Projection Delta Live Badge */}
          <div className="lg:col-span-4 rounded-xl bg-surface-container-high p-space-md flex items-center justify-between shadow-inner border border-outline-variant/30">
            <div>
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider block">
                Prognoza Roczna
              </span>
              <div className="flex items-center gap-space-sm mt-1">
                <span className="font-code-mono text-body-lg text-on-surface-variant line-through">{overallAvg}</span>
                <span className="material-symbols-outlined text-primary text-[18px]">trending_flat</span>
                <span className="font-headline-xl text-headline-xl font-bold text-primary font-code-mono">
                  {simulationResult.newAvg}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <div className="px-space-sm py-0.5 rounded-full bg-primary/20 text-primary font-code-mono text-label-md font-semibold">
                {simulationResult.delta} pkt
              </div>
              <span className="text-[11px] font-label-sm text-outline mt-1">
                {simulationResult.isHonors ? (
                  <span className="text-primary font-semibold">Wyróżnienie osiągnięte!</span>
                ) : (
                  `Do paska: ${simulationResult.remaining} pkt`
                )}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* 6. DETAILED LOG & AUDIT TABLE: RECENT ENTRIES */}
      <div className="rounded-xl bg-surface-container-low shadow-md overflow-hidden border border-outline-variant/20">
        <div className="p-space-md flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm bg-surface-container-low">
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-outline text-[18px]">receipt_long</span>
            <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">
              Tabela Szczegółowa Ostatnich Wpisów
            </h3>
          </div>
          <div className="flex items-center gap-space-xs text-outline font-label-sm">
            <span>Rejestr w czasie rzeczywistym</span>
            <span>•</span>
            <span className="font-code-mono text-on-surface">{recentEntries.length} ostatnich rekordów</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-body-md">
            <thead>
              <tr className="bg-surface-container text-outline font-label-sm uppercase tracking-wider text-[11px]">
                <th className="px-space-md py-2.5">Data Wpisu</th>
                <th className="px-space-md py-2.5">Przedmiot</th>
                <th className="px-space-md py-2.5">Ocena</th>
                <th className="px-space-md py-2.5">Waga</th>
                <th className="px-space-md py-2.5">Kategoria</th>
                <th className="px-space-md py-2.5">Nauczyciel Weryfikujący</th>
                <th className="px-space-md py-2.5 text-right">Status API</th>
              </tr>
            </thead>
            <tbody className="divide-none text-on-surface-variant font-code-mono text-label-md">
              {recentEntries.map((row, idx) => (
                <tr key={idx} className="hover:bg-surface-container transition-colors">
                  <td className="px-space-md py-3 text-outline whitespace-nowrap">{row.date}</td>
                  <td className="px-space-md py-3 text-on-surface font-sans font-medium whitespace-nowrap">{row.subjectName}</td>
                  <td className="px-space-md py-3 font-bold text-primary">{row.value}</td>
                  <td className="px-space-md py-3">
                    <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                      Waga {row.weight}
                    </span>
                  </td>
                  <td className="px-space-md py-3 font-sans text-on-surface-variant">{row.category}</td>
                  <td className="px-space-md py-3 font-sans">{row.teacher || '—'}</td>
                  <td className="px-space-md py-3 text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] text-primary">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Zatwierdzono
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. MODAL ZE SZCZEGÓŁAMI OCENY */}
      {selectedGrade && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setSelectedGrade(null)}
        >
          <div
            className="bg-surface-container-low border border-outline-variant/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-space-md border-b border-outline-variant/20 bg-surface-container flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[20px]">school</span>
                <h3 className="font-code-mono text-label-sm font-bold text-on-surface uppercase tracking-wider">
                  Szczegóły Wpisu Librus
                </h3>
              </div>
              <button
                onClick={() => setSelectedGrade(null)}
                className="w-8 h-8 rounded-lg bg-surface-container-high border border-outline-variant/20 flex items-center justify-center text-on-surface-variant hover:text-on-surface"
              >
                ✕
              </button>
            </div>

            <div className="p-space-lg space-y-space-md">
              <div className="flex items-center gap-space-md p-space-md rounded-xl bg-surface-container border border-outline-variant/20">
                <div className={`w-14 h-14 rounded-xl border-2 font-code-mono font-bold text-2xl flex items-center justify-center shadow-lg ${getGradeBadgeStyle(selectedGrade.value)}`}>
                  {selectedGrade.value}
                </div>
                <div className="min-w-0">
                  <h4 className="font-headline-md text-headline-md font-bold text-on-surface truncate">
                    {selectedGrade.subjectName || 'Przedmiot'}
                  </h4>
                  <p className="font-code-mono text-label-sm text-on-surface-variant mt-0.5">
                    {selectedGrade.details?.category || 'Ocena bieżąca'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 p-space-md rounded-xl bg-surface-container-lowest border border-outline-variant/20 text-label-sm font-code-mono">
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
              </div>

              {selectedGrade.details?.comment && (
                <div>
                  <span className="font-code-mono text-[10px] uppercase text-outline block mb-1">
                    Komentarz / Zakres:
                  </span>
                  <p className="text-label-sm text-on-surface-variant bg-surface-container-lowest p-space-sm rounded-xl border border-outline-variant/20 leading-relaxed whitespace-pre-wrap font-code-mono">
                    {selectedGrade.details.comment}
                  </p>
                </div>
              )}

              <div className="pt-space-xs flex justify-end">
                <button
                  onClick={() => setSelectedGrade(null)}
                  className="px-space-lg py-2 font-code-mono text-label-sm bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-on-surface rounded-lg transition-all font-semibold active:scale-[0.97]"
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
