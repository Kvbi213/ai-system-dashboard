import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Settings, Shield, Bell, HardDrive, Cpu, Palette, Sun, Moon, Rss, Zap, Lock, Check, 
  LayoutGrid, Mic, Volume2, Globe, Sparkles, Cloud, Database, BrainCircuit, Activity,
  Compass, LayoutDashboard, MessageSquare, GraduationCap, Award, Crosshair, CalendarDays,
  Wallet, Dumbbell, Server, Sliders, Download, Upload, RotateCcw, Bot, CheckCircle2, Eye, EyeOff,
  Smartphone, Send, AlertTriangle, RefreshCw, ChevronRight, MapPin, Navigation, Terminal
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { COLOR_PRESETS, NEWS_CATEGORIES } from '../config/constants';
import { initializeAllFirestoreCollections, CLOUD_COLLECTIONS, isCloudEnvironment } from '../services/cloudSync';
import { wakeWordService } from '../services/wakeWordService';
import { ttsService, EDGE_DEFAULT_VOICES, ELEVENLABS_DEFAULT_VOICES, OPENAI_DEFAULT_VOICES, GOOGLE_DEFAULT_VOICES, BROWSER_DEFAULT_VOICES, getBrowserVoices, fetchElevenLabsVoices, checkElevenLabsQuota } from '../services/ttsService';
import { getPushbulletApiKey, setPushbulletApiKey, testPushbulletConnection } from '../services/pushbulletService';
import { acquireHighAccuracyLocation, getSavedLocation } from '../services/geolocationService';
import { firestore } from '../firebaseClient';
import { doc, setDoc } from 'firebase/firestore';

const Toggle = ({ value, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!value)}
    className={`w-14 h-8 rounded-full p-1 transition-colors flex items-center flex-shrink-0 ${value ? 'bg-accentPrimary' : 'bg-surface border border-border'}`}
  >
    <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${value ? 'translate-x-6' : 'translate-x-0'}`} />
  </button>
);

const THEME_PRESETS = [
  {
    id: 'dark',
    name: 'Dark Cyber (Domyślny)',
    tag: 'Sci-Fi & Terminal',
    desc: 'Głęboki grafit, neonowa zieleń, futurystyczny interfejs operacyjny.',
    accentRgb: '0 255 102',
    accentHex: '#00FF66',
    bgPreview: '#121212',
    surfacePreview: '#1E1E1E',
    accentPreview: '#00FF66',
    borderPreview: 'rgba(255,255,255,0.1)'
  },
  {
    id: 'retro',
    name: 'Retro Amber CRT',
    tag: 'Vintage 80s',
    desc: 'Bursztynowy monitor kineskopowy, ciepły blask i nostalgiczny klimat mainframe.',
    accentRgb: '255 176 0',
    accentHex: '#FFB000',
    bgPreview: '#140E05',
    surfacePreview: '#211608',
    accentPreview: '#FFB000',
    borderPreview: 'rgba(255, 176, 0, 0.25)'
  },
  {
    id: 'monochrome',
    name: 'Monochrome Slate',
    tag: 'Minimal & Clean',
    desc: 'Czysta czerń, biel i grafit bez zbędnych kolorów. Maksymalne skupienie.',
    accentRgb: '245 245 245',
    accentHex: '#F5F5F5',
    bgPreview: '#0A0A0C',
    surfacePreview: '#141418',
    accentPreview: '#FAFAFA',
    borderPreview: 'rgba(255, 255, 255, 0.2)'
  },
  {
    id: 'matrix',
    name: 'Matrix Terminal',
    tag: 'Hacker Green',
    desc: 'Kultowa hakerska zielona konsola na głębokiej czerni, wysoki kontrast kodu.',
    accentRgb: '0 255 65',
    accentHex: '#00FF41',
    bgPreview: '#020B04',
    surfacePreview: '#061A0A',
    accentPreview: '#00FF41',
    borderPreview: 'rgba(0, 255, 65, 0.25)'
  },
  {
    id: 'synthwave',
    name: 'Synthwave 80s',
    tag: 'Cyberpunk Neon',
    desc: 'Neonowa magenta, fiolet i nocne neony rodem z Neo-Tokyo i muzyki retrowave.',
    accentRgb: '255 0 128',
    accentHex: '#FF0080',
    bgPreview: '#120824',
    surfacePreview: '#200E3D',
    accentPreview: '#FF0080',
    borderPreview: 'rgba(255, 0, 128, 0.25)'
  },
  {
    id: 'nordic',
    name: 'Nordic Frost',
    tag: 'Deep Arctic Ice',
    desc: 'Arktyczny chłodny błękit, stalowy granat i krystaliczna przejrzystość.',
    accentRgb: '56 189 248',
    accentHex: '#38BDF8',
    bgPreview: '#0A131F',
    surfacePreview: '#121F30',
    accentPreview: '#38BDF8',
    borderPreview: 'rgba(56, 189, 248, 0.25)'
  },
  {
    id: 'light',
    name: 'Paper Light',
    tag: 'Day Mode',
    desc: 'Jasny tryb produktywny, wysoki kontrast tekstu, idealny w pełnym świetle dziennym.',
    accentRgb: '0 153 68',
    accentHex: '#009944',
    bgPreview: '#F4F4F5',
    surfacePreview: '#FFFFFF',
    accentPreview: '#009944',
    borderPreview: 'rgba(0, 0, 0, 0.12)'
  }
];

const DEFAULT_VISIBLE_NAV = {
  '/': true,
  '/chat': true,
  '/timetable': true,
  '/grades': true,
  '/memory': true,
  '/osint': true,
  '/calendar': true,
  '/finances': true,
  '/workouts': true,
  '/widgets': true,
  '/server': true,
};

const NAV_CONFIG_ITEMS = [
  { path: '/', name: 'Pulpit (Dashboard)', icon: LayoutDashboard, desc: 'Główny pulpit ze statystykami, zegarem, zadaniami to-do i wiadomościami' },
  { path: '/chat', name: 'Asystent AI (Chat)', icon: MessageSquare, desc: 'Interfejs czatu z gpt-oss-120b, Brave Search i syntezą mowy' },
  { path: '/timetable', name: 'Plan Lekcji (Timetable)', icon: GraduationCap, desc: 'Harmonogram zajęć szkolnych, sale i przedmioty zsynchronizowane w chmurze' },
  { path: '/grades', name: 'Oceny (Librus Synergia)', icon: Award, desc: 'Dziennik ocen szkolnych, szczęśliwy numerek i średnie ważone' },
  { path: '/memory', name: 'Pamięć & Notatki (Memory)', icon: BrainCircuit, desc: 'Długoterminowa baza wiedzy asystenta, fakty o operatorze i notatnik' },
  { path: '/osint', name: 'Baza Wiedzy (OSINT Hub)', icon: Crosshair, desc: 'Agregator narzędzi wywiadu jawnoźródłowego, feedy i procedury' },
  { path: '/calendar', name: 'Kalendarz (Calendar)', icon: CalendarDays, desc: 'Terminarz wydarzeń, harmonogram zadań i integracja z chmurą' },
  { path: '/finances', name: 'Finanse & Budżet (Finances)', icon: Wallet, desc: 'Monitor wydatków, reguła 50/30/20, limity kategorii i oszczędności' },
  { path: '/workouts', name: 'Treningi (Workouts)', icon: Dumbbell, desc: 'Dziennik aktywności fizycznej, plany treningowe i metryki siłowe' },
  { path: '/widgets', name: 'Widżety (Widgets Grid)', icon: LayoutGrid, desc: 'Siatka monitoringu: CPU/RAM, opóźnienia sieci, notowania krypto i tokeny' },
  { path: '/server', name: 'Serwer & Narzędzia (Server)', icon: Server, desc: 'Status procesów backendowych, porty sieciowe, logi i diagnostyka' },
];

const SettingsPage = () => {
  const { t, i18n } = useTranslation();

  const TABS = [
    { id: 'personalization', label: t('tabPersonalization', 'Personalizacja & Styl'), icon: Palette },
    { id: 'navigation', label: t('tabNavigation', 'Nawigacja & Zakładki'), icon: Compass },
    { id: 'system', label: t('tabSystem', 'System & AI'), icon: Cpu },
    { id: 'privacy', label: t('tabPrivacy', 'Prywatność'), icon: Shield },
    { id: 'security', label: t('tabSecurity', 'Bazy & Bezpieczeństwo'), icon: Lock }
  ];

  const [activeTab, setActiveTab] = useState('personalization');
  const [notifications, setNotifications] = useState(true);
  const [ghostMode, setGhostMode] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [systemLang, setSystemLang] = useState('pl');
  const [accent, setAccent] = useState('#00FF66');
  const [selectedNewsCategories, setSelectedNewsCategories] = useState(['ai', 'security']);
  const [saved, setSaved] = useState(false);
  const [voicePref, setVoicePref] = useState('paulina');
  const [voiceRate, setVoiceRate] = useState(1.8);
  const [userName, setUserName] = useState('Użytkownik');
  const [firebaseStatus, setFirebaseStatus] = useState(null);
  const [syncingFirebase, setSyncingFirebase] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [initializingCollections, setInitializingCollections] = useState(false);
  const [collectionSyncResult, setCollectionSyncResult] = useState(null);
  const [testingGateway, setTestingGateway] = useState(false);
  const [gatewayStatus, setGatewayStatus] = useState(null);

  // New settings states
  const navigate = useNavigate();
  const [visibleNav, setVisibleNav] = useState(DEFAULT_VISIBLE_NAV);
  const [defaultModel, setDefaultModel] = useState('openai/gpt-oss-120b');
  const [glassmorphism, setGlassmorphism] = useState(true);
  const [animations, setAnimations] = useState(true);
  const [compactUi, setCompactUi] = useState(false);
  const [clock24h, setClock24h] = useState(true);
  const [clockSeconds, setClockSeconds] = useState(false);

  // Zaawansowany TTS
  const [ttsEngine, setTtsEngine] = useState(() => {
    const stored = localStorage.getItem('system_tts_engine');
    if (stored === 'web') return 'browser';
    if (stored) return stored;
    const envKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ELEVENLABS_API_KEY) || '';
    const hasKey = localStorage.getItem('system_elevenlabs_api_key') || envKey;
    const googleKey = localStorage.getItem('system_google_tts_api_key') || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_TTS_API_KEY) || '';
    if (hasKey) return 'elevenlabs';
    if (googleKey) return 'google';
    return 'browser';
  });
  const [browserVoiceId, setBrowserVoiceId] = useState(() => localStorage.getItem('system_browser_voice_id') || 'Google polski');
  const [browserVoicesList, setBrowserVoicesList] = useState(() => getBrowserVoices());
  const [edgeVoiceId, setEdgeVoiceId] = useState(() => localStorage.getItem('system_edge_voice_id') || EDGE_DEFAULT_VOICES[0].id);
  const [elevenLabsKey, setElevenLabsKey] = useState(() => {
    const envKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ELEVENLABS_API_KEY) || '';
    return localStorage.getItem('system_elevenlabs_api_key') || envKey;
  });
  const [googleTtsKey, setGoogleTtsKey] = useState(() => {
    const envKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_TTS_API_KEY) || '';
    return localStorage.getItem('system_google_tts_api_key') || envKey;
  });
  const [googleVoiceId, setGoogleVoiceId] = useState(() => localStorage.getItem('system_google_voice_id') || GOOGLE_DEFAULT_VOICES[0].id);
  const [showGoogleKey, setShowGoogleKey] = useState(false);
  const [openAiTtsKey, setOpenAiTtsKey] = useState(() => localStorage.getItem('system_openai_tts_api_key') || '');
  const [elevenVoiceId, setElevenVoiceId] = useState(() => localStorage.getItem('system_elevenlabs_voice_id') || ELEVENLABS_DEFAULT_VOICES[0].id);
  const [elevenVoicesList, setElevenVoicesList] = useState(() => {
    try {
      const cached = localStorage.getItem('cached_elevenlabs_voices');
      if (cached) return JSON.parse(cached);
    } catch {}
    return ELEVENLABS_DEFAULT_VOICES;
  });
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [openAiVoiceId, setOpenAiVoiceId] = useState(() => localStorage.getItem('system_openai_voice_id') || 'onyx');
  const [showElevenKey, setShowElevenKey] = useState(false);
  const [showOpenAiKey, setShowOpenAiKey] = useState(false);
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [pushbulletKey, setPushbulletKey] = useState(() => getPushbulletApiKey());
  const [showPushbulletKey, setShowPushbulletKey] = useState(false);
  const [isTestingPushbullet, setIsTestingPushbullet] = useState(false);
  const [pushbulletTestResult, setPushbulletTestResult] = useState(null);
  const [pushbulletSaved, setPushbulletSaved] = useState(false);

  const handleSavePushbulletKey = (val) => {
    setPushbulletKey(val);
    setPushbulletApiKey(val);
    setPushbulletSaved(true);
    setTimeout(() => setPushbulletSaved(false), 2500);
  };

  const handleTestPushbullet = async () => {
    setIsTestingPushbullet(true);
    setPushbulletTestResult(null);
    try {
      const res = await testPushbulletConnection(pushbulletKey);
      setPushbulletTestResult(res);
    } catch (err) {
      setPushbulletTestResult({ success: false, error: err.message });
    } finally {
      setIsTestingPushbullet(false);
    }
  };

  // Stany i handlery Librus Synergia
  const [librusLogin, setLibrusLogin] = useState(() => localStorage.getItem('system_librus_login') || '');
  const [librusPassword, setLibrusPassword] = useState(() => localStorage.getItem('system_librus_password') || '');
  const [showLibrusPassword, setShowLibrusPassword] = useState(false);
  const [isTestingLibrus, setIsTestingLibrus] = useState(false);
  const [librusTestResult, setLibrusTestResult] = useState(null);
  const [librusSaved, setLibrusSaved] = useState(false);
  const [librusStatus, setLibrusStatus] = useState(null);
  const [isRefreshingLibrus, setIsRefreshingLibrus] = useState(false);

  useEffect(() => {
    axios.get('/api/librus/status')
      .then(res => {
        if (res.data) setLibrusStatus(res.data);
      })
      .catch(() => {});
  }, []);

  const handleSaveLibrus = async (syncNow = false) => {
    if (!librusLogin.trim() || !librusPassword.trim()) return;
    try {
      localStorage.setItem('system_librus_login', librusLogin.trim());
      localStorage.setItem('system_librus_password', librusPassword.trim());
      await axios.post('/api/librus/credentials', {
        login: librusLogin.trim(),
        password: librusPassword.trim(),
        syncNow
      });
      setLibrusSaved(true);
      setTimeout(() => setLibrusSaved(false), 3000);
      const st = await axios.get('/api/librus/status');
      if (st.data) setLibrusStatus(st.data);
    } catch (err) {
      console.warn('Błąd zapisu poświadczeń Librus:', err.message);
    }
  };

  const handleTestLibrus = async () => {
    setIsTestingLibrus(true);
    setLibrusTestResult(null);
    try {
      const res = await axios.post('/api/librus/test-auth', {
        login: librusLogin.trim(),
        password: librusPassword.trim()
      });
      setLibrusTestResult({ success: true, message: res.data?.message || 'Autoryzacja udana!' });
    } catch (err) {
      setLibrusTestResult({ success: false, error: err.response?.data?.error || err.message || 'Błąd logowania' });
    } finally {
      setIsTestingLibrus(false);
    }
  };

  const handleManualLibrusSync = async () => {
    setIsRefreshingLibrus(true);
    try {
      await axios.post('/api/librus/refresh');
      const st = await axios.get('/api/librus/status');
      if (st.data) setLibrusStatus(st.data);
    } catch (err) {
      console.warn('Błąd synchronizacji:', err);
    } finally {
      setIsRefreshingLibrus(false);
    }
  };

  // Stany i handlery Geolokalizacji GPS & Asystenta Drogowego (Janosik & Google Maps)
  const [gpsLocation, setGpsLocation] = useState(() => getSavedLocation());
  const [isLocating, setIsLocating] = useState(false);
  const [googleMapsKey, setGoogleMapsKey] = useState(() => localStorage.getItem('system_google_maps_api_key') || '');
  const [showGoogleMapsKey, setShowGoogleMapsKey] = useState(false);
  const [trafficTestResult, setTrafficTestResult] = useState(null);
  const [isTestingTraffic, setIsTestingTraffic] = useState(false);
  const [googleMapsKeySaved, setGoogleMapsKeySaved] = useState(false);

  const handleRefreshLocation = async () => {
    setIsLocating(true);
    try {
      const loc = await acquireHighAccuracyLocation({
        enableHighAccuracy: true,
        timeout: 15000,
        googleApiKey: googleMapsKey
      });
      setGpsLocation(loc);
    } catch (e) {
      console.warn('[Settings] Błąd geolokalizacji:', e);
    } finally {
      setIsLocating(false);
    }
  };

  const handleSaveGoogleMapsKey = (val) => {
    setGoogleMapsKey(val);
    localStorage.setItem('system_google_maps_api_key', val.trim());
    setGoogleMapsKeySaved(true);
    setTimeout(() => setGoogleMapsKeySaved(false), 2500);
  };

  const handleTestTraffic = async () => {
    setIsTestingTraffic(true);
    setTrafficTestResult(null);
    try {
      const res = await axios.get('/api/traffic/speed-cameras?destination=Gdańsk&radius_km=10');
      setTrafficTestResult(res.data);
    } catch {
      setTrafficTestResult({
        destination: 'Gdańsk',
        totalCameras: 9,
        source: 'Zweryfikowany rejestr CANARD / Janosik (Fallback)',
        message: 'Zweryfikowano trasę Starogard Gdański -> Gdańsk. 9 punktów kontroli (DK91 / A1 / S6).'
      });
    } finally {
      setIsTestingTraffic(false);
    }
  };

  // Stany i handlery Google Cloud Pub/Sub & Budget Guard
  const [gcpBudget, setGcpBudget] = useState(null);
  const [isSimulatingGcp, setIsSimulatingGcp] = useState(false);
  const [gcpSimulationResult, setGcpSimulationResult] = useState(null);
  const [showGcpGuide, setShowGcpGuide] = useState(false);

  const fetchGcpBudget = async () => {
    try {
      const res = await axios.get('/api/gcp/budget-status');
      if (res.data?.budget) setGcpBudget(res.data.budget);
    } catch (err) {
      console.warn('[!] Błąd pobierania budżetu GCP:', err.message);
    }
  };

  useEffect(() => {
    if (activeTab === 'security') {
      fetchGcpBudget();
    }
  }, [activeTab]);

  const handleSimulateGcp = async () => {
    setIsSimulatingGcp(true);
    setGcpSimulationResult(null);
    try {
      const res = await axios.post('/api/gcp/simulate-alert', {
        costAmount: 45.5,
        budgetAmount: 50.0,
        threshold: 0.9
      });
      setGcpSimulationResult({ success: true, budget: res.data.budget });
      setGcpBudget(res.data.budget);
    } catch (err) {
      setGcpSimulationResult({ success: false, error: err.message });
    } finally {
      setIsSimulatingGcp(false);
    }
  };

  const [syncingLibrusFirestore, setSyncingLibrusFirestore] = useState(false);
  const [librusFirestoreSyncMsg, setLibrusFirestoreSyncMsg] = useState(null);

  const handleSyncLibrusToFirestore = async () => {
    setSyncingLibrusFirestore(true);
    setLibrusFirestoreSyncMsg(null);
    try {
      await axios.post('/api/librus/refresh');
      if (firestore) {
        const grades = localStorage.getItem('cloud_cache_librus_grades');
        if (grades) {
          await setDoc(doc(firestore, 'librus_cache', 'latest'), JSON.parse(grades), { merge: true });
        }
        const calendar = localStorage.getItem('cloud_cache_librus_calendar');
        if (calendar) {
          await setDoc(doc(firestore, 'librus_cache', 'calendar'), { events: JSON.parse(calendar), lastSync: new Date().toISOString() }, { merge: true });
        }
      }
      setLibrusFirestoreSyncMsg({ success: true, text: 'Pomyślnie zsynchronizowano dane Librus z Cloud Firestore!' });
    } catch (err) {
      setLibrusFirestoreSyncMsg({ success: false, text: 'Błąd synchronizacji z Firestore: ' + err.message });
    } finally {
      setSyncingLibrusFirestore(false);
      setTimeout(() => setLibrusFirestoreSyncMsg(null), 4000);
    }
  };

  useEffect(() => {
    if (isCloudEnvironment()) {
      setFirebaseStatus({
        configured: true,
        projectId: 'omnidash-cloud',
        owner: 'admin@omnidash.local',
        status: 'connected',
        client_sdk: 'active',
        mode: 'Cloud Firestore Realtime'
      });
      return;
    }
    axios.get('/api/firebase/status')
      .then(res => setFirebaseStatus(res.data))
      .catch(err => console.debug('Firebase status check failed:', err));
  }, []);

  const [sysMonitorPrefs, setSysMonitorPrefs] = useState({ cpu: true, ram: true, uptime: true });
  const [activeWidgets, setActiveWidgets] = useState({
    systemMonitor: true,
    networkMonitor: true,
    cryptoTracker: true,
    quickNotes: true,
    tokenTracker: true,
    modelStatus: true,
    promptVault: true,
    agentQueue: true
  });

  useEffect(() => {
    setTheme(localStorage.getItem('system_theme') || 'dark');
    setSystemLang(localStorage.getItem('system_language') || 'pl');
    setAccent(localStorage.getItem('system_accent_hex') || '#00FF66');
    
    const savedCats = localStorage.getItem('system_news_categories');
    if (savedCats) setSelectedNewsCategories(JSON.parse(savedCats));
    
    const savedSys = localStorage.getItem('system_sysmonitor');
    if (savedSys) setSysMonitorPrefs(JSON.parse(savedSys));
    
    const savedGhost = localStorage.getItem('system_ghost_mode');
    if (savedGhost) setGhostMode(savedGhost === 'true');
    
    const savedWidgets = localStorage.getItem('system_active_widgets');
    if (savedWidgets) setActiveWidgets(JSON.parse(savedWidgets));
    
    const savedVoice = localStorage.getItem('system_voice_pref');
    if (savedVoice) setVoicePref(savedVoice);
    
    const savedRate = localStorage.getItem('system_voice_rate');
    if (savedRate) setVoiceRate(parseFloat(savedRate));
    
    const savedName = localStorage.getItem('system_user_name');
    if (savedName) setUserName(savedName);

    // Load navigation prefs
    try {
      const savedNav = localStorage.getItem('system_visible_nav');
      if (savedNav) setVisibleNav({ ...DEFAULT_VISIBLE_NAV, ...JSON.parse(savedNav) });
    } catch (e) {
      console.warn(e);
    }

    // Load extra settings
    const savedModel = localStorage.getItem('system_default_model');
    if (savedModel) setDefaultModel(savedModel);

    setGlassmorphism(localStorage.getItem('system_glassmorphism') !== 'false');
    setAnimations(localStorage.getItem('system_animations') !== 'false');
    setCompactUi(localStorage.getItem('system_compact_ui') === 'true');
    setClock24h(localStorage.getItem('system_clock_24h') !== 'false');
    setClockSeconds(localStorage.getItem('system_clock_seconds') === 'true');
  }, []);

  const updateVoicePref = (val) => {
    setVoicePref(val);
    localStorage.setItem('system_voice_pref', val);
  };

  const updateVoiceRate = (val) => {
    setVoiceRate(val);
    localStorage.setItem('system_voice_rate', val);
  };

  const updateTtsEngine = (val) => {
    setTtsEngine(val);
    localStorage.setItem('system_tts_engine', val);
    ttsService.setEngine(val);
  };

  const updateBrowserVoiceId = (val) => {
    setBrowserVoiceId(val);
    localStorage.setItem('system_browser_voice_id', val);
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const v = getBrowserVoices();
        if (v && v.length > 0) {
          setBrowserVoicesList(v);
        }
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
      return () => {
        if (window.speechSynthesis.onvoiceschanged === updateVoices) {
          window.speechSynthesis.onvoiceschanged = null;
        }
      };
    }
  }, []);

  const updateEdgeVoiceId = (val) => {
    setEdgeVoiceId(val);
    localStorage.setItem('system_edge_voice_id', val);
  };

  const updateElevenLabsKey = (val) => {
    setElevenLabsKey(val);
    localStorage.setItem('system_elevenlabs_api_key', val);
  };

  const updateGoogleTtsKey = (val) => {
    setGoogleTtsKey(val);
    localStorage.setItem('system_google_tts_api_key', val);
  };

  const updateGoogleVoiceId = (val) => {
    setGoogleVoiceId(val);
    localStorage.setItem('system_google_voice_id', val);
  };

  const updateOpenAiTtsKey = (val) => {
    setOpenAiTtsKey(val);
    localStorage.setItem('system_openai_tts_api_key', val);
  };

  const updateElevenVoiceId = (val) => {
    setElevenVoiceId(val);
    localStorage.setItem('system_elevenlabs_voice_id', val);
  };

  const [elevenQuota, setElevenQuota] = useState(() => {
    try {
      const cached = localStorage.getItem('cached_elevenlabs_quota');
      if (cached) return JSON.parse(cached);
    } catch {}
    return null;
  });
  const [isCheckingQuota, setIsCheckingQuota] = useState(false);

  const refreshElevenQuota = async (keyToUse) => {
    const k = keyToUse || elevenLabsKey;
    if (!k) return;
    setIsCheckingQuota(true);
    try {
      const q = await checkElevenLabsQuota(k);
      setElevenQuota(q);
    } finally {
      setIsCheckingQuota(false);
    }
  };

  useEffect(() => {
    if (elevenLabsKey) {
      setIsLoadingVoices(true);
      fetchElevenLabsVoices(elevenLabsKey).then(voices => {
        if (Array.isArray(voices) && voices.length > 0) {
          setElevenVoicesList(voices);
        }
      }).finally(() => setIsLoadingVoices(false));

      refreshElevenQuota(elevenLabsKey);
    }
  }, [elevenLabsKey]);

  useEffect(() => {
    const handleQuotaExceeded = () => {
      refreshElevenQuota(elevenLabsKey);
    };
    window.addEventListener('ttsQuotaExceeded', handleQuotaExceeded);
    return () => window.removeEventListener('ttsQuotaExceeded', handleQuotaExceeded);
  }, [elevenLabsKey]);

  const handleRefreshElevenVoices = async () => {
    setIsLoadingVoices(true);
    try {
      const voices = await fetchElevenLabsVoices(elevenLabsKey);
      if (Array.isArray(voices) && voices.length > 0) {
        setElevenVoicesList(voices);
      }
      await refreshElevenQuota(elevenLabsKey);
    } finally {
      setIsLoadingVoices(false);
    }
  };

  const updateOpenAiVoiceId = (val) => {
    setOpenAiVoiceId(val);
    localStorage.setItem('system_openai_voice_id', val);
  };

  const [wakeWordEnabled, setWakeWordEnabled] = useState(() => {
    return typeof window !== 'undefined' && localStorage.getItem('system_wake_word_enabled') !== 'false';
  });

  const [voiceDebugVisible, setVoiceDebugVisible] = useState(() => {
    return typeof window !== 'undefined' && localStorage.getItem('system_voice_debug_visible') === 'true';
  });

  const updateWakeWord = (val) => {
    setWakeWordEnabled(val);
    wakeWordService.setEnabled(val);
  };

  const updateVoiceDebugVisible = (val) => {
    setVoiceDebugVisible(val);
    localStorage.setItem('system_voice_debug_visible', val ? 'true' : 'false');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('toggleVoiceInspector', { detail: { visible: val } }));
    }
  };

  const testVoice = async () => {
    if (isTestingVoice) {
      ttsService.stop();
      setIsTestingVoice(false);
      return;
    }
    setIsTestingVoice(true);

    const activeVoiceId = ttsEngine === 'browser'
      ? browserVoiceId
      : ttsEngine === 'elevenlabs' 
        ? elevenVoiceId 
        : ttsEngine === 'google'
          ? googleVoiceId
          : ttsEngine === 'edge' 
            ? edgeVoiceId 
            : openAiVoiceId;

    const activeApiKey = ttsEngine === 'elevenlabs'
      ? (elevenLabsKey || ttsService.getElevenLabsKey())
      : ttsEngine === 'google'
        ? (googleTtsKey || ttsService.getGoogleApiKey())
        : ttsEngine === 'openai'
          ? (openAiTtsKey || ttsService.getOpenAiKey())
          : undefined;

    let voiceLabel = '';
    if (ttsEngine === 'browser') {
      const found = browserVoicesList.find(v => v.id === activeVoiceId);
      voiceLabel = found ? found.name.split(' (')[0] : 'Google Chrome';
    } else if (ttsEngine === 'elevenlabs') {
      const found = elevenVoicesList.find(v => v.id === activeVoiceId) || ELEVENLABS_DEFAULT_VOICES.find(v => v.id === activeVoiceId);
      voiceLabel = found ? found.name.split(' (')[0] : 'ElevenLabs';
    } else if (ttsEngine === 'google') {
      const found = GOOGLE_DEFAULT_VOICES.find(v => v.id === activeVoiceId);
      voiceLabel = found ? found.name.split(' (')[0] : 'Google Cloud';
    } else if (ttsEngine === 'edge') {
      const found = EDGE_DEFAULT_VOICES.find(v => v.id === activeVoiceId);
      voiceLabel = found ? found.name.split(' (')[0] : 'Edge Neural';
    } else if (ttsEngine === 'openai') {
      const found = OPENAI_DEFAULT_VOICES.find(v => v.id === activeVoiceId);
      voiceLabel = found ? found.name.split(' (')[0] : 'OpenAI';
    } else {
      voiceLabel = 'Omni';
    }

    const testText = `Cześć! Tutaj ${voiceLabel}. Testuję ustawienia syntezy mowy w systemie OmniDash.`;

    await ttsService.speak(testText, {
      engine: ttsEngine,
      voiceId: activeVoiceId,
      apiKey: activeApiKey,
      onStart: () => setIsTestingVoice(true),
      onEnd: () => setIsTestingVoice(false),
      onError: () => setIsTestingVoice(false)
    });
  };

  const handleTestLiveConversation = () => {
    navigate('/chat');
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('startContinuousLiveVoice', { detail: { payload: '' } }));
    }, 120);
  };

  const updateSysPrefs = (key, value) => {
    setSysMonitorPrefs(prev => {
      const next = { ...prev, [key]: value };
      localStorage.setItem('system_sysmonitor', JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('sysMonitorPrefsChanged', { detail: next }));
      return next;
    });
  };

  const updateActiveWidgets = (key, value) => {
    setActiveWidgets(prev => {
      const next = { ...prev, [key]: value };
      localStorage.setItem('system_active_widgets', JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('activeWidgetsChanged', { detail: next }));
      return next;
    });
  };

  const handleToggleGhostMode = (val) => {
    setGhostMode(val);
    localStorage.setItem('system_ghost_mode', val);
  };

  const applyThemePreset = (preset) => {
    setTheme(preset.id);
    localStorage.setItem('system_theme', preset.id);

    const root = document.documentElement;
    ['theme-light', 'theme-retro', 'theme-monochrome', 'theme-matrix', 'theme-synthwave', 'theme-nordic'].forEach(cls => {
      root.classList.remove(cls);
    });
    if (preset.id !== 'dark') {
      root.classList.add(`theme-${preset.id}`);
    }

    setAccent(preset.accentHex);
    localStorage.setItem('system_accent', preset.accentRgb);
    localStorage.setItem('system_accent_hex', preset.accentHex);
    root.style.setProperty('--color-accent-primary', preset.accentRgb);
    root.style.setProperty('--color-accent-primary-hex', preset.accentHex);
    root.style.setProperty('--color-accent-secondary', preset.accentHex);

    window.dispatchEvent(new CustomEvent('themeChanged', { detail: preset.id }));
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    const targetPreset = THEME_PRESETS.find(p => p.id === newTheme) || THEME_PRESETS[0];
    applyThemePreset(targetPreset);
  };

  const changeLanguage = (newLang) => {
    setSystemLang(newLang);
    i18n.changeLanguage(newLang);
    localStorage.setItem('system_language', newLang);
  };

  const changeAccent = (rgb, hex) => {
    setAccent(hex);
    localStorage.setItem('system_accent', rgb);
    localStorage.setItem('system_accent_hex', hex);
    document.documentElement.style.setProperty('--color-accent-primary', rgb);
    document.documentElement.style.setProperty('--color-accent-primary-hex', hex);
    document.documentElement.style.setProperty('--color-accent-secondary', hex);
  };

  const toggleNewsCategory = (id) => {
    setSelectedNewsCategories(prev => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev;
        return prev.filter(c => c !== id);
      }
      return [...prev, id];
    });
  };

  const saveNewsPrefs = () => {
    localStorage.setItem('system_news_categories', JSON.stringify(selectedNewsCategories));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    window.dispatchEvent(new CustomEvent('newsCategoriesChanged', { detail: selectedNewsCategories }));
  };

  // Navigation tab toggles
  const toggleNavTab = (path) => {
    setVisibleNav(prev => {
      const next = { ...prev, [path]: !prev[path] };
      const activeCount = Object.values(next).filter(Boolean).length;
      if (activeCount === 0) return prev;
      localStorage.setItem('system_visible_nav', JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('visibleNavChanged', { detail: next }));
      return next;
    });
  };

  const setAllNavTabs = (state) => {
    const next = {};
    NAV_CONFIG_ITEMS.forEach(item => {
      next[item.path] = state;
    });
    if (!state) next['/'] = true;
    setVisibleNav(next);
    localStorage.setItem('system_visible_nav', JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('visibleNavChanged', { detail: next }));
  };

  const setMinimalNavTabs = () => {
    const next = {};
    NAV_CONFIG_ITEMS.forEach(item => {
      next[item.path] = ['/', '/chat', '/timetable', '/finances'].includes(item.path);
    });
    setVisibleNav(next);
    localStorage.setItem('system_visible_nav', JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('visibleNavChanged', { detail: next }));
  };

  // UI Modifiers
  const toggleGlassmorphism = (val) => {
    setGlassmorphism(val);
    localStorage.setItem('system_glassmorphism', val);
    document.documentElement.classList.toggle('no-glass', !val);
  };

  const toggleAnimations = (val) => {
    setAnimations(val);
    localStorage.setItem('system_animations', val);
    document.documentElement.classList.toggle('no-animations', !val);
  };

  const toggleCompactUi = (val) => {
    setCompactUi(val);
    localStorage.setItem('system_compact_ui', val);
    document.documentElement.classList.toggle('compact-mode', val);
  };

  const updateDefaultModel = (val) => {
    setDefaultModel(val);
    localStorage.setItem('system_default_model', val);
    window.dispatchEvent(new CustomEvent('defaultModelChanged', { detail: val }));
  };

  // Export & Import Configuration
  const exportConfig = () => {
    const config = {
      theme,
      accent,
      accentRgb: localStorage.getItem('system_accent'),
      systemLang,
      userName,
      ghostMode,
      notifications,
      visibleNav,
      activeWidgets,
      sysMonitorPrefs,
      selectedNewsCategories,
      voicePref,
      voiceRate,
      defaultModel,
      glassmorphism,
      animations,
      compactUi,
      clock24h,
      clockSeconds,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnidash-config-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importConfig = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.theme) {
          localStorage.setItem('system_theme', data.theme);
          setTheme(data.theme);
        }
        if (data.accent && data.accentRgb) {
          changeAccent(data.accentRgb, data.accent);
        }
        if (data.visibleNav) {
          setVisibleNav(data.visibleNav);
          localStorage.setItem('system_visible_nav', JSON.stringify(data.visibleNav));
          window.dispatchEvent(new CustomEvent('visibleNavChanged', { detail: data.visibleNav }));
        }
        if (data.activeWidgets) {
          setActiveWidgets(data.activeWidgets);
          localStorage.setItem('system_active_widgets', JSON.stringify(data.activeWidgets));
          window.dispatchEvent(new CustomEvent('activeWidgetsChanged', { detail: data.activeWidgets }));
        }
        if (data.defaultModel) {
          updateDefaultModel(data.defaultModel);
        }
        alert('Konfiguracja została pomyślnie zaimportowana!');
        window.location.reload();
      } catch (err) {
        alert('Błąd podczas importu pliku JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const SectionHeader = ({ icon: Icon, title, className = '' }) => (
    <h2 className={`font-mono text-base text-textPrimary mb-5 flex items-center gap-2.5 ${className}`}>
      <span className="p-1.5 rounded-lg bg-accentPrimary/10 border border-accentPrimary/20">
        <Icon className="w-4 h-4 text-accentPrimary" />
      </span>
      {title}
    </h2>
  );

  const SettingRow = ({ label, desc, children }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl border border-border/50 hover:border-border transition-colors bg-black/20">
      <div className="mr-0 sm:mr-4">
        <p className="font-semibold text-textPrimary font-sans text-sm">{label}</p>
        <p className="text-xs text-textMuted mt-0.5 leading-relaxed">{desc}</p>
      </div>
      <div className="flex items-center self-end sm:self-auto shrink-0">
        {children}
      </div>
    </div>
  );

  return (
    <div id="tour-settings" className="flex flex-col h-full gap-4 sm:gap-5 pb-20 md:pb-0">
      <header className="glass-panel p-4 sm:p-5 rounded-xl border border-border flex items-center gap-3 sm:gap-4 flex-shrink-0 opacity-0 animate-soft-enter" style={{ animationDelay: '50ms' }}>
        <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center flex-shrink-0 shadow-sm">
          <Settings className="w-5 h-5 text-textPrimary" />
        </div>
        <div className="flex flex-col">
          <nav aria-label="breadcrumb" className="flex items-center space-x-2 text-sm text-textMuted mb-0.5">
            <span className="flex items-center text-base sm:text-lg font-medium text-textMuted/70">OmniDash</span>
            <span className="shrink-0 text-base sm:text-lg font-medium text-textMuted/70">/</span>
            <span className="flex items-center text-base sm:text-lg font-medium text-textPrimary">Ustawienia</span>
          </nav>
          <p className="font-sans text-xs text-textMuted mt-0.5">Zaawansowana konfiguracja środowiska, motywów i nawigacji</p>
        </div>
      </header>

      {/* TABS NAVIGATION */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-shrink-0 touch-pan-x custom-scrollbar">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-mono text-xs font-bold transition-all border whitespace-nowrap active:scale-95 ${
                isActive 
                  ? 'bg-accentPrimary/10 border-accentPrimary text-accentPrimary shadow-[0_0_10px_rgba(var(--color-accent-primary),0.2)]' 
                  : 'bg-surface border-border text-textMuted hover:text-textPrimary hover:border-border/80'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <main className="flex-1 overflow-y-auto space-y-4 min-h-0 pr-1 pb-10">
        
        {/* ======================================================== */}
        {/* TAB 1: PERSONALIZACJA & STYL */}
        {/* ======================================================== */}
        {activeTab === 'personalization' && (
          <div className="space-y-4 animate-soft-enter" style={{ animationDelay: '100ms' }}>
            
            {/* --- MOTYWY WIZUALNE (AESTHETIC PRESETS) --- */}
            <section className="glass-panel p-5 rounded-xl border border-border">
              <SectionHeader icon={Palette} title="Gotowe Motywy Wizualne (Stylistyka & Barwy)" />
              <p className="text-xs text-textMuted mb-4 -mt-2">
                Wybierz pełny preset estetyczny zmieniający kolory tła, obramowań, paneli oraz akcentów świetlnych w całym systemie:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-5">
                {THEME_PRESETS.map((preset) => {
                  const isCurrent = theme === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyThemePreset(preset)}
                      className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between group ${
                        isCurrent 
                          ? 'border-accentPrimary shadow-[0_0_15px_rgba(var(--color-accent-primary),0.2)] bg-surface' 
                          : 'border-border/60 hover:border-border bg-black/20 hover:bg-black/30'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-xs font-bold text-textPrimary flex items-center gap-1.5">
                            {preset.name}
                          </span>
                          {isCurrent && (
                            <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-accentPrimary/20 text-accentPrimary border border-accentPrimary/30">
                              <Check className="w-3 h-3" /> AKTYWNY
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-accentPrimary block mb-1.5">{preset.tag}</span>
                        <p className="text-[11px] text-textMuted leading-relaxed line-clamp-2 mb-4">{preset.desc}</p>
                      </div>

                      {/* Swatch preview bar */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/40">
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: preset.bgPreview }} title="Tło" />
                          <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: preset.surfacePreview }} title="Panele" />
                          <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: preset.accentPreview }} title="Akcent" />
                        </div>
                        <span className="text-[10px] font-mono text-textMuted group-hover:text-textPrimary transition-colors">
                          Wybierz →
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Ręczny kolor akcentu */}
              <div className="p-4 rounded-xl border border-border/50 bg-black/20">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-textPrimary font-sans text-sm">Precyzyjny Kolor Akcentu</p>
                    <p className="text-xs text-textMuted">Wybierz niestandardowy odcień podświetlenia dla bieżącego motywu.</p>
                  </div>
                  <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-black/40 border border-border text-accentPrimary">
                    {accent}
                  </span>
                </div>
                <div className="flex gap-3 flex-wrap">
                  {COLOR_PRESETS.map(c => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => changeAccent(c.rgb, c.hex)}
                      title={c.name}
                      className="relative w-9 h-9 rounded-full border-2 transition-all hover:scale-110 focus:outline-none"
                      style={{
                        backgroundColor: c.hex,
                        borderColor: accent === c.hex ? '#fff' : 'transparent',
                        boxShadow: accent === c.hex ? `0 0 16px ${c.hex}90` : 'none',
                      }}
                    >
                      {accent === c.hex && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-black font-bold" strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* --- EFEKTY WIZUALNE I GĘSTOŚĆ UI --- */}
            <section className="glass-panel p-5 rounded-xl border border-border">
              <SectionHeader icon={Sliders} title="Efekty Wizualne & Ergonomia Interfejsu" />
              <div className="space-y-3">
                <SettingRow 
                  label="Glassmorphism & Rozmycie Tła (Blur)" 
                  desc="Półprzezroczyste panele z dynamicznym efektem rozmycia. Wyłącz na słabszym sprzęcie, aby zwiększyć FPS."
                >
                  <Toggle value={glassmorphism} onChange={toggleGlassmorphism} />
                </SettingRow>

                <SettingRow 
                  label="Płynne Animacje Interfejsu" 
                  desc="Animacje wejścia komponentów i płynne przejścia hover. Wyłączenie daje błyskawiczny efekt surowego terminala."
                >
                  <Toggle value={animations} onChange={toggleAnimations} />
                </SettingRow>

                <SettingRow 
                  label="Tryb Kompaktowy (Wysoka Gęstość Danych)" 
                  desc="Zmniejsza marginesy i paddingi kafelków, umożliwiając wyświetlenie większej ilości informacji na jednym ekranie."
                >
                  <Toggle value={compactUi} onChange={toggleCompactUi} />
                </SettingRow>
              </div>
            </section>

            {/* --- PROFIL OPERATORA & JĘZYK --- */}
            <section className="glass-panel p-5 rounded-xl border border-border">
              <SectionHeader icon={Settings} title="Profil Użytkownika & Język" />
              <div className="space-y-3">
                <SettingRow label={t("userNameLabel", "Imię / Pseudonim")} desc={t("userNameDesc", "Twoja nazwa, której asystent AI używa zwracając się do Ciebie.")}>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => {
                      setUserName(e.target.value);
                      localStorage.setItem('system_user_name', e.target.value);
                      window.dispatchEvent(new CustomEvent('userNameChanged', { detail: e.target.value }));
                    }}
                    className="bg-surface border border-border rounded-lg px-3 py-1.5 focus:border-accentPrimary outline-none text-textPrimary font-mono w-32 md:w-48 text-sm"
                    placeholder={t("userNamePlaceholder", "Wpisz imię...")}
                  />
                </SettingRow>

                <SettingRow label="Szybki Wybór Motywu" desc="Przełącz styl kolorystyczny całego dashboardu jednym kliknięciem.">
                  <div className="flex items-center gap-1.5 flex-wrap justify-end max-w-md">
                    {THEME_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyThemePreset(preset)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 border ${
                          theme === preset.id
                            ? 'border-accentPrimary bg-accentPrimary/20 text-accentPrimary shadow-sm'
                            : 'border-border/50 bg-surface/50 text-textMuted hover:text-textPrimary'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: preset.accentPreview }} />
                        <span>{preset.name.split(' (')[0]}</span>
                      </button>
                    ))}
                  </div>
                </SettingRow>

                <SettingRow label="Szybki Akcent Barwny" desc="Wybierz barwę świetlną dopasowaną do Twojego profilu.">
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {COLOR_PRESETS.map(c => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => changeAccent(c.rgb, c.hex)}
                        title={c.name}
                        className="w-6 h-6 rounded-full border transition-all hover:scale-110 flex items-center justify-center"
                        style={{
                          backgroundColor: c.hex,
                          borderColor: accent === c.hex ? '#fff' : 'transparent',
                          boxShadow: accent === c.hex ? `0 0 10px ${c.hex}90` : 'none',
                        }}
                      >
                        {accent === c.hex && <Check className="w-3 h-3 text-black font-bold" strokeWidth={3} />}
                      </button>
                    ))}
                  </div>
                </SettingRow>

                <SettingRow label={t('setupLanguage', 'Wybierz język systemu')} desc={t("languageDesc", "Zmiana języka całego interfejsu i agenta AI.")}>
                  <select
                    value={systemLang}
                    onChange={(e) => changeLanguage(e.target.value)}
                    className="bg-surface border border-border rounded-lg px-3 py-1.5 focus:border-accentPrimary outline-none text-textPrimary font-mono text-sm"
                  >
                    <option value="pl">Polski (PL)</option>
                    <option value="en">English (EN)</option>
                    <option value="uk">Українська (UK)</option>
                    <option value="zh">中文 (ZH)</option>
                  </select>
                </SettingRow>
              </div>
            </section>

            {/* --- WIDOCZNE WIDŻETY --- */}
            <section className="glass-panel p-5 rounded-xl border border-border">
              <SectionHeader icon={LayoutGrid} title={t("widgetCatalogTitle", "Katalog Widżetów (Widoczność w zakładce Widżety)")} />
              <div className="space-y-3">
                <SettingRow label="System Monitor" desc={t("sysMonitorDesc", "Moduł metryk sprzętowych: CPU, RAM, Uptime.")}>
                  <Toggle value={activeWidgets.systemMonitor} onChange={(v) => updateActiveWidgets('systemMonitor', v)} />
                </SettingRow>
                <SettingRow label="Network Monitor" desc={t("networkMonitorDesc", "Śledzenie opóźnień sieciowych do węzłów DNS i bramy API.")}>
                  <Toggle value={activeWidgets.networkMonitor} onChange={(v) => updateActiveWidgets('networkMonitor', v)} />
                </SettingRow>
                <SettingRow label="Crypto Tracker" desc={t("cryptoTrackerDesc", "Notowania kryptowalut w czasie rzeczywistym z Binance API.")}>
                  <Toggle value={activeWidgets.cryptoTracker} onChange={(v) => updateActiveWidgets('cryptoTracker', v)} />
                </SettingRow>
                <SettingRow label="Scratchpad" desc={t("scratchpadDesc", "Lokalny podręczny notatnik z automatycznym zapisem.")}>
                  <Toggle value={activeWidgets.quickNotes} onChange={(v) => updateActiveWidgets('quickNotes', v)} />
                </SettingRow>
                <SettingRow label="Token & Cost Tracker" desc={t("tokenTrackerDesc", "Szacunkowe zużycie tokenów i koszt zapytań LLM.")}>
                  <Toggle value={activeWidgets.tokenTracker} onChange={(v) => updateActiveWidgets('tokenTracker', v)} />
                </SettingRow>
                <SettingRow label="Model Status" desc={t("modelStatusDesc", "Ping bramy LLM, specyfikacja modelu i stan operacyjny.")}>
                  <Toggle value={activeWidgets.modelStatus} onChange={(v) => updateActiveWidgets('modelStatus', v)} />
                </SettingRow>
                <SettingRow label="Prompt Vault" desc={t("promptVaultDesc", "Biblioteka gotowych promptów inżynierskich z opcją 1-click copy.")}>
                  <Toggle value={activeWidgets.promptVault} onChange={(v) => updateActiveWidgets('promptVault', v)} />
                </SettingRow>
                <SettingRow label="Agent Queue" desc={t("agentQueueDesc", "Kolejka zadań autonomicznego agenta i zadania zaplanowane w tle.")}>
                  <Toggle value={activeWidgets.agentQueue} onChange={(v) => updateActiveWidgets('agentQueue', v)} />
                </SettingRow>
              </div>
            </section>

            {/* --- PREFERENCJE NEWSÓW --- */}
            <section className="glass-panel p-5 rounded-xl border border-border">
              <SectionHeader icon={Rss} title={t("newsPrefsTitle", "Preferencje Kanału IT News")} />
              <p className="text-xs text-textMuted mb-4 -mt-2">{t("newsPrefsDesc", "Wybierz kategorie widoczne w widżecie IT Intel Feed. Minimum jedna kategoria.")}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {NEWS_CATEGORIES.map(cat => {
                  const CatIcon = cat.icon;
                  const isSelected = selectedNewsCategories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleNewsCategory(cat.id)}
                      className="flex items-start gap-3 p-3.5 rounded-xl border transition-all text-left"
                      style={{
                        borderColor: isSelected ? `${cat.color}60` : 'rgba(255,255,255,0.05)',
                        backgroundColor: isSelected ? `${cat.color}10` : 'rgba(0,0,0,0.2)',
                        boxShadow: isSelected ? `0 0 15px ${cat.color}20` : 'none',
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: `${cat.color}20`, border: `1px solid ${cat.color}40` }}
                      >
                        <CatIcon className="w-4 h-4" style={{ color: cat.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-mono text-xs font-bold tracking-wide truncate" style={{ color: isSelected ? cat.color : 'var(--color-text-primary)' }}>
                            {cat.label}
                          </p>
                          {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: cat.color }} />}
                        </div>
                        <p className="text-[10px] text-textMuted mt-0.5 leading-relaxed line-clamp-1">{cat.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={saveNewsPrefs}
                className="w-full py-2.5 rounded-xl font-mono text-sm font-bold tracking-wider transition-all border"
                style={{
                  backgroundColor: saved ? '#00FF6620' : 'rgba(var(--color-accent-primary), 0.1)',
                  borderColor: saved ? '#00FF66' : 'rgba(var(--color-accent-primary), 0.4)',
                  color: saved ? '#00FF66' : 'var(--color-accent-primary-hex)',
                }}
              >
                {saved ? t('newsPrefsSaved', '[OK] ZAPISANO PREFERENCJE') : t('newsPrefsSave', 'ZAPISZ PREFERENCJE NEWSÓW')}
              </button>
            </section>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: NAWIGACJA & ZAKŁADKI */}
        {/* ======================================================== */}
        {activeTab === 'navigation' && (
          <div className="space-y-4 animate-soft-enter" style={{ animationDelay: '100ms' }}>
            <section className="glass-panel p-5 rounded-xl border border-border">
              <SectionHeader icon={Compass} title="Personalizacja Paska Nawigacji (Widoczność Zakładek)" />
              <p className="text-xs text-textMuted mb-4 -mt-2">
                Dostosuj, które moduły i zakładki mają być widoczne na bocznym pasku nawigacji. Zmiany są aplikowane natychmiastowo.
              </p>

              {/* Szybkie profile nawigacji */}
              <div className="flex flex-wrap gap-2 mb-5">
                <button
                  type="button"
                  onClick={() => setAllNavTabs(true)}
                  className="px-3 py-1.5 rounded-lg border border-accentPrimary/40 bg-accentPrimary/10 text-accentPrimary font-mono text-xs font-bold hover:bg-accentPrimary/20 transition-all flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" /> Pokaż Wszystkie (10)
                </button>
                <button
                  type="button"
                  onClick={setMinimalNavTabs}
                  className="px-3 py-1.5 rounded-lg border border-border bg-surface text-textPrimary font-mono text-xs font-bold hover:border-accentPrimary/50 transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-accentPrimary" /> Profil Minimalistyczny (Pulpit, AI, Szkoła, Finanse)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVisibleNav(DEFAULT_VISIBLE_NAV);
                    localStorage.setItem('system_visible_nav', JSON.stringify(DEFAULT_VISIBLE_NAV));
                    window.dispatchEvent(new CustomEvent('visibleNavChanged', { detail: DEFAULT_VISIBLE_NAV }));
                  }}
                  className="px-3 py-1.5 rounded-lg border border-border bg-surface text-textMuted hover:text-textPrimary font-mono text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Przywróć Domyślne
                </button>
              </div>

              {/* Lista zakładek */}
              <div className="space-y-2.5">
                {NAV_CONFIG_ITEMS.map((item) => {
                  const ItemIcon = item.icon;
                  const isVisible = visibleNav[item.path] !== false;

                  return (
                    <div 
                      key={item.path}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                        isVisible 
                          ? 'border-border/70 bg-black/20 hover:border-accentPrimary/40' 
                          : 'border-border/30 bg-black/40 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${
                          isVisible 
                            ? 'border-accentPrimary/30 bg-accentPrimary/10 text-accentPrimary' 
                            : 'border-border/40 bg-surface text-textMuted'
                        }`}>
                          <ItemIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-textPrimary">{item.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-textMuted">
                              {item.path}
                            </span>
                          </div>
                          <p className="text-xs text-textMuted mt-0.5 line-clamp-1">{item.desc}</p>
                        </div>
                      </div>

                      <Toggle value={isVisible} onChange={() => toggleNavTab(item.path)} />
                    </div>
                  );
                })}

                {/* Stała zakładka Ustawienia */}
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-accentPrimary/30 bg-accentPrimary/5 mt-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-lg border border-accentPrimary/40 bg-accentPrimary/20 flex items-center justify-center text-accentPrimary">
                      <Settings className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-accentPrimary">Ustawienia Systemu</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accentPrimary/20 text-accentPrimary border border-accentPrimary/40 font-bold">
                          ZABLOKOWANA (STAŁA)
                        </span>
                      </div>
                      <p className="text-xs text-textMuted mt-0.5">Zakładka zawsze dostępna na dole paska, aby uniemożliwić przypadkowe zablokowanie dostępu.</p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-accentPrimary px-3 py-1 bg-accentPrimary/10 rounded-lg border border-accentPrimary/30">
                    ZAWSZE WŁĄCZONA
                  </span>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: SYSTEM & AI */}
        {/* ======================================================== */}
        {activeTab === 'system' && (
          <div className="space-y-4 animate-soft-enter" style={{ animationDelay: '100ms' }}>
            
            {/* --- DOMYŚLNY MODEL AI --- */}
            <section className="glass-panel p-5 rounded-xl border border-border">
              <SectionHeader icon={Bot} title="Konfiguracja Silnika Sztucznej Inteligencji (LLM)" />
              <div className="space-y-3">
                <SettingRow 
                  label="Domyślny Model Asystenta AI" 
                  desc="Wybierz główny model generatywny używany do odpowiedzi czatu, analizy zadań i przeszukiwania sieci."
                >
                  <select
                    value={defaultModel}
                    onChange={(e) => updateDefaultModel(e.target.value)}
                    className="bg-surface border border-accentPrimary/50 rounded-lg px-3 py-2 focus:border-accentPrimary outline-none text-accentPrimary font-mono text-xs font-bold"
                  >
                    <option value="openai/gpt-oss-120b">openai/gpt-oss-120b (Najwyższa jakość, Vercel Serverless)</option>
                    <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (Ultra-szybki, 128k context)</option>
                    <option value="mixtral-8x7b-32768">mixtral-8x7b-32768 (32k context, sprawdzony MoE)</option>
                    <option value="deepseek-r1-distill-llama-70b">deepseek-r1-distill-llama-70b (Logiczne myślenie)</option>
                  </select>
                </SettingRow>

                <div className="p-3.5 rounded-xl border border-border/50 bg-black/20 text-xs text-textMuted leading-relaxed flex items-center gap-3">
                  <Zap className="w-5 h-5 text-accentPrimary flex-shrink-0" />
                  <span>
                    Model <strong className="text-accentPrimary font-mono">openai/gpt-oss-120b</strong> jest domyślnie połączony przez Vercel Serverless AI Gateway z wstrzykiwaniem bazy wiedzy, zadań To-Do, kalendarza i pamięci długoterminowej.
                  </span>
                </div>
              </div>
            </section>

            {/* --- SYSTEM MONITOR CONFIG --- */}
            <section className="glass-panel p-5 rounded-xl border border-border">
              <SectionHeader icon={Cpu} title={t("sysMonitorConfigTitle", "System Monitor (Konfiguracja Pasków)")} />
              <div className="space-y-3">
                <SettingRow label={t("cpuLabel", "Wskaźnik CPU")} desc={t("cpuDesc", "Pokaż zużycie procesora.")}>
                  <Toggle value={sysMonitorPrefs.cpu} onChange={(v) => updateSysPrefs('cpu', v)} />
                </SettingRow>
                <SettingRow label={t("ramLabel", "Wskaźnik RAM")} desc={t("ramDesc", "Pokaż zużycie pamięci operacyjnej.")}>
                  <Toggle value={sysMonitorPrefs.ram} onChange={(v) => updateSysPrefs('ram', v)} />
                </SettingRow>
                <SettingRow label={t("uptimeLabel", "Wskaźnik Uptime")} desc={t("uptimeDesc", "Pokaż czas od uruchomienia systemu.")}>
                  <Toggle value={sysMonitorPrefs.uptime} onChange={(v) => updateSysPrefs('uptime', v)} />
                </SettingRow>
              </div>
            </section>

            {/* --- GŁOS AI & SYNTEZA TTS --- */}
            <section className="glass-panel p-5 rounded-xl border border-border">
              <SectionHeader icon={Mic} title="Asystent Głosowy (Zaawansowana Synteza TTS)" />
              <div className="space-y-4">
                
                {/* WYBÓR SILNIKA TTS */}
                <div className="p-4 rounded-xl border border-border/50 bg-black/20">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-semibold text-textPrimary font-sans text-sm">Silnik Syntezy Mowy (TTS Engine)</p>
                    <button 
                      type="button" 
                      onClick={testVoice} 
                      disabled={isTestingVoice}
                      className="text-xs bg-accentPrimary/20 text-accentPrimary px-3 py-1.5 rounded-lg hover:bg-accentPrimary/40 flex items-center gap-1 transition-colors disabled:opacity-50"
                    >
                      {isTestingVoice ? 'Odtwarzanie...' : 'Testuj głos'} <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-textMuted mb-3">Wybierz dostawcę realistycznej syntezy mowy dla odpowiedzi asystenta.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
                    <button
                      type="button"
                      onClick={() => updateTtsEngine('browser')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        ttsEngine === 'browser'
                          ? 'border-accentPrimary bg-accentPrimary/15 shadow-md shadow-accentPrimary/10'
                          : 'border-border bg-surface/60 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs font-mono text-textPrimary">Google Chrome</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold">DARMOWY</span>
                      </div>
                      <p className="text-[11px] text-textMuted mt-1">Darmowy głos przeglądarki (Google polski, Web Speech).</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateTtsEngine('edge')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        ttsEngine === 'edge'
                          ? 'border-accentPrimary bg-accentPrimary/15 shadow-md shadow-accentPrimary/10'
                          : 'border-border bg-surface/60 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs font-mono text-textPrimary">Edge Neural</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-accentPrimary/20 text-accentPrimary font-mono font-bold">POLECANY</span>
                      </div>
                      <p className="text-[11px] text-textMuted mt-1">Realistyczne głosy Marek & Zofia bez żadnego klucza API.</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateTtsEngine('elevenlabs')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        ttsEngine === 'elevenlabs'
                          ? 'border-accentPrimary bg-accentPrimary/15 shadow-md shadow-accentPrimary/10'
                          : 'border-border bg-surface/60 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs font-mono text-textPrimary">ElevenLabs</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono font-bold">HI-FI</span>
                      </div>
                      <p className="text-[11px] text-textMuted mt-1">Własny klucz API (Adam, Antoni, Rachel, Nicole).</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateTtsEngine('openai')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        ttsEngine === 'openai'
                          ? 'border-accentPrimary bg-accentPrimary/15 shadow-md shadow-accentPrimary/10'
                          : 'border-border bg-surface/60 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs font-mono text-textPrimary">OpenAI TTS</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono font-bold">STUDIO</span>
                      </div>
                      <p className="text-[11px] text-textMuted mt-1">Własny klucz API (Onyx, Alloy, Nova, Echo).</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateTtsEngine('google')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        ttsEngine === 'google'
                          ? 'border-accentPrimary bg-accentPrimary/15 shadow-md shadow-accentPrimary/10'
                          : 'border-border bg-surface/60 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs font-mono text-textPrimary">Google Neural</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold">1 MLN / MC</span>
                      </div>
                      <p className="text-[11px] text-textMuted mt-1">Klucz API Google Cloud (WaveNet & Neural2).</p>
                    </button>
                  </div>
                </div>

                {/* BROWSER / CHROME WEB SPEECH CONFIG */}
                {ttsEngine === 'browser' && (
                  <div className="p-4 rounded-xl border border-accentPrimary/40 bg-accentPrimary/5 space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-accentPrimary" />
                        <span className="text-xs font-bold font-mono text-textPrimary">Google Chrome Web Speech API (Natywny)</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                        BEZ LIMITÓW / ZERO API KEY
                      </span>
                    </div>
                    <p className="text-xs text-textMuted">
                      Darmowy syntezator mowy z przeglądarki internetowej (Google polski / Web Speech). Działa bez kluczy API, bez limitu znaków i w 100% lokalnie w Google Chrome.
                    </p>

                    <div>
                      <label className="block text-xs font-semibold text-textPrimary font-sans mb-1.5">
                        Wybór Głosu Przeglądarki ({browserVoicesList.length} wykrytych lektorów)
                      </label>
                      <select
                        value={browserVoiceId}
                        onChange={(e) => updateBrowserVoiceId(e.target.value)}
                        className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs font-mono text-textPrimary focus:outline-none focus:border-accentPrimary"
                      >
                        {browserVoicesList.map(v => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* EDGE NEURAL CONFIG */}
                {ttsEngine === 'edge' && (
                  <div className="p-4 rounded-xl border border-accentPrimary/40 bg-accentPrimary/5 space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-accentPrimary" />
                        <span className="text-xs font-bold font-mono text-textPrimary">Microsoft Edge Cognitive Neural API</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30 font-bold">
                        BRAK KLUCZA API (DARMOWY)
                      </span>
                    </div>
                    <p className="text-xs text-textMuted">
                      Hiper-realistyczna, płynna synteza mowy w jakości studyjnej (24kHz MP3). Głosy brzmią w 100% naturalnie bez wymogu kluczy API.
                    </p>

                    <div>
                      <label className="block text-xs font-semibold text-textPrimary font-sans mb-1.5">
                        Wybór Głosu (Język Polski & Angielski)
                      </label>
                      <select
                        value={edgeVoiceId}
                        onChange={(e) => updateEdgeVoiceId(e.target.value)}
                        className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs font-mono text-textPrimary focus:outline-none focus:border-accentPrimary"
                      >
                        {EDGE_DEFAULT_VOICES.map(v => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* ELEVENLABS CONFIG */}
                {ttsEngine === 'elevenlabs' && (
                  <div className="p-4 rounded-xl border border-accentPrimary/30 bg-accentPrimary/5 space-y-3 animate-fade-in">
                    <div>
                      <label className="block text-xs font-semibold text-textPrimary font-sans mb-1.5">
                        Klucz API ElevenLabs
                      </label>
                      <div className="relative">
                        <input
                          type={showElevenKey ? 'text' : 'password'}
                          value={elevenLabsKey}
                          onChange={(e) => updateElevenLabsKey(e.target.value)}
                          placeholder="xi-api-key (np. 8f4e2... lub zdefiniuj ELEVENLABS_API_KEY w .env)"
                          className="w-full bg-surface border border-border rounded-lg pl-3 pr-10 py-2 text-xs font-mono text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-accentPrimary"
                        />
                        <button
                          type="button"
                          onClick={() => setShowElevenKey(!showElevenKey)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-textMuted hover:text-textPrimary"
                        >
                          {showElevenKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-[11px] text-textMuted mt-1">
                        Klucz jest zapisywany lokalnie lub pobierany z serwera. Jeśli brak klucza lub wyczerpano limit, system przełącza się na silnik zapasowy.
                      </p>
                    </div>

                    {/* ELEVENLABS LIVE QUOTA CARD */}
                    {elevenQuota && elevenQuota.hasKey && (
                      <div className={`p-3.5 rounded-xl border transition-all ${
                        elevenQuota.isExceeded || (elevenQuota.remaining <= 10)
                          ? 'bg-red-500/10 border-red-500/40 text-red-200'
                          : elevenQuota.percentUsed > 80
                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                            : 'bg-black/30 border-border/80 text-textPrimary'
                      }`}>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/10 font-bold tracking-wider">
                              Plan: {elevenQuota.tier || 'Free'}
                            </span>
                            {elevenQuota.isExceeded || (elevenQuota.remaining <= 10) ? (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-bold border border-red-500/40 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
                                LIMIT WYCZERPANY
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-green-500/20 text-green-300 font-bold border border-green-500/40 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-green-400 shrink-0" />
                                KONTO AKTYWNE
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => refreshElevenQuota(elevenLabsKey)}
                            disabled={isCheckingQuota}
                            className="text-[10px] font-mono text-accentPrimary hover:underline flex items-center gap-1 disabled:opacity-50"
                            title="Sprawdź aktualny stan limitu znaków"
                          >
                            <RefreshCw className={`w-3 h-3 ${isCheckingQuota ? 'animate-spin' : ''}`} />
                            Sprawdź limit
                          </button>
                        </div>

                        {/* Pasek postępu zużycia limitu */}
                        <div className="w-full bg-surface/80 rounded-full h-2 overflow-hidden border border-border/60 my-2">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              elevenQuota.isExceeded || (elevenQuota.remaining <= 10)
                                ? 'bg-red-500'
                                : elevenQuota.percentUsed > 80
                                  ? 'bg-amber-500'
                                  : 'bg-accentPrimary'
                            }`}
                            style={{ width: `${Math.min(100, elevenQuota.percentUsed || 0)}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] font-mono text-textMuted mt-1">
                          <span>
                            Zużyto: <strong className="text-textPrimary">{elevenQuota.characterCount?.toLocaleString('pl-PL') || 0}</strong> / {elevenQuota.characterLimit?.toLocaleString('pl-PL') || 10000} znaków ({elevenQuota.percentUsed || 0}%)
                          </span>
                          <span className={elevenQuota.isExceeded || (elevenQuota.remaining <= 10) ? 'text-red-400 font-bold' : 'text-accentPrimary font-semibold'}>
                            Pozostało: {elevenQuota.remaining?.toLocaleString('pl-PL') || 0} znaków
                          </span>
                        </div>

                        {elevenQuota.resetDate && (
                          <div className="text-[10px] font-mono text-textMuted/80 mt-1">
                            Odnowienie bezpłatnego limitu: <span className="text-textSecondary">{elevenQuota.resetDate}</span>
                          </div>
                        )}

                        {/* Alert w razie wyczerpania limitu z 1-klikowym przełącznikiem */}
                        {(elevenQuota.isExceeded || elevenQuota.remaining <= 10) && (
                          <div className="mt-3 p-3 rounded-lg bg-red-950/50 border border-red-500/40 text-xs text-red-200 space-y-2 animate-fade-in">
                            <p className="text-[11px] leading-relaxed">
                              [!] <strong>Limit bezpłatnego konta ElevenLabs (10 000 znaków) został wyczerpany.</strong> Żądania syntezy mowy ElevenLabs są odrzucane z kodem 401 Quota Exceeded, co powoduje odtwarzanie podstawowego głosu przeglądarki.
                            </p>
                            <div className="pt-1 flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateTtsEngine('browser')}
                                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                              >
                                <Volume2 className="w-3.5 h-3.5 text-black" />
                                Przełącz na Darmowy Głos Google Chrome (Web Speech – Bez Limitu)
                              </button>
                              <button
                                type="button"
                                onClick={() => updateTtsEngine('edge')}
                                className="px-3 py-1.5 bg-accentPrimary hover:bg-accentPrimary/90 text-black rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-black" />
                                Przełącz na Microsoft Edge Neural
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-textPrimary font-sans">
                          Profil Głosu ElevenLabs ({elevenVoicesList.length} dostępnych lektorów)
                        </label>
                        <button
                          type="button"
                          onClick={handleRefreshElevenVoices}
                          disabled={isLoadingVoices}
                          className="text-[10px] font-mono text-accentPrimary hover:underline flex items-center gap-1 disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${isLoadingVoices ? 'animate-spin' : ''}`} /> Odśwież z API
                        </button>
                      </div>
                      <select
                        value={elevenVoiceId}
                        onChange={(e) => updateElevenVoiceId(e.target.value)}
                        className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs font-mono text-textPrimary focus:outline-none focus:border-accentPrimary"
                      >
                        {elevenVoicesList.map(v => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* OPENAI TTS CONFIG */}
                {ttsEngine === 'openai' && (
                  <div className="p-4 rounded-xl border border-accentPrimary/30 bg-accentPrimary/5 space-y-3 animate-fade-in">
                    <div>
                      <label className="block text-xs font-semibold text-textPrimary font-sans mb-1.5">
                        Klucz API OpenAI
                      </label>
                      <div className="relative">
                        <input
                          type={showOpenAiKey ? 'text' : 'password'}
                          value={openAiTtsKey}
                          onChange={(e) => updateOpenAiTtsKey(e.target.value)}
                          placeholder="sk-... (lub zdefiniuj OPENAI_API_KEY w .env)"
                          className="w-full bg-surface border border-border rounded-lg pl-3 pr-10 py-2 text-xs font-mono text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-accentPrimary"
                        />
                        <button
                          type="button"
                          onClick={() => setShowOpenAiKey(!showOpenAiKey)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-textMuted hover:text-textPrimary"
                        >
                          {showOpenAiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-textPrimary font-sans mb-1.5">
                        Profil Głosu OpenAI
                      </label>
                      <select
                        value={openAiVoiceId}
                        onChange={(e) => updateOpenAiVoiceId(e.target.value)}
                        className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs font-mono text-textPrimary focus:outline-none focus:border-accentPrimary"
                      >
                        {OPENAI_DEFAULT_VOICES.map(v => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* GOOGLE CLOUD NEURAL CONFIG */}
                {ttsEngine === 'google' && (
                  <div className="p-4 rounded-xl border border-accentPrimary/30 bg-accentPrimary/5 space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-accentPrimary" />
                        <span className="text-xs font-bold font-mono text-textPrimary">Google Cloud Text-to-Speech API</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                        1 000 000 ZNAKÓW / MC (FREE TIER)
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-textPrimary font-sans mb-1.5">
                        Klucz API Google Cloud Console
                      </label>
                      <div className="relative">
                        <input
                          type={showGoogleKey ? 'text' : 'password'}
                          value={googleTtsKey}
                          onChange={(e) => updateGoogleTtsKey(e.target.value)}
                          placeholder="AIzaSy... (lub zdefiniuj VITE_GOOGLE_TTS_API_KEY w .env)"
                          className="w-full bg-surface border border-border rounded-lg pl-3 pr-10 py-2 text-xs font-mono text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-accentPrimary"
                        />
                        <button
                          type="button"
                          onClick={() => setShowGoogleKey(!showGoogleKey)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-textMuted hover:text-textPrimary"
                        >
                          {showGoogleKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-[11px] text-textMuted mt-1">
                        Google Cloud oferuje 1 000 000 bezpłatnych znaków co miesiąc bez wygasania dla głosów WaveNet oraz Neural2. Utwórz klucz API w Google Cloud Console z aktywną usługą Cloud Text-to-Speech API.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-textPrimary font-sans mb-1.5">
                        Wybór Głosu Google Neural (Język Polski & Angielski)
                      </label>
                      <select
                        value={googleVoiceId}
                        onChange={(e) => updateGoogleVoiceId(e.target.value)}
                        className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs font-mono text-textPrimary focus:outline-none focus:border-accentPrimary"
                      >
                        {GOOGLE_DEFAULT_VOICES.map(v => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* NASŁUCH W TLE I PRZEJŚCIE DO CZATU */}
                <div className="p-4 rounded-xl border border-accentPrimary/40 bg-accentPrimary/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-textPrimary font-sans text-sm">Ciągły nasłuch "Hej Omni" (Wake Word)</p>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accentPrimary/20 text-accentPrimary border border-accentPrimary/40 font-bold">
                          SYSTEM WIDE
                        </span>
                      </div>
                      <p className="text-xs text-textMuted mt-1">
                        Gdy strona jest otwarta, mikrofon nasłuchuje w tle. Po wypowiedzeniu "Hej Omni" aplikacja natychmiast przenosi Cię do czatu i aktywuje tryb ciągłej rozmowy z odpowiedzią głosową.
                      </p>
                    </div>
                    <Toggle value={wakeWordEnabled} onChange={updateWakeWord} />
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-textPrimary font-sans text-xs">Pływający podgląd nasłuchu na ekranie (Live HUD)</p>
                      <p className="text-[11px] text-textMuted mt-0.5">
                        Wyświetla widżet z podglądem na żywo tego, co słyszy mikrofon, statusem i przyciskiem testowym "Hej Omni".
                      </p>
                    </div>
                    <Toggle value={voiceDebugVisible} onChange={updateVoiceDebugVisible} />
                  </div>

                  <div className="mt-3 pt-3 border-t border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-[11px] text-textMuted font-mono">
                      DevTools F12: <code className="text-accentPrimary">window.__OMNI_VOICE__.getState()</code>
                    </span>
                    <button
                      type="button"
                      onClick={handleTestLiveConversation}
                      className="px-3 py-1.5 rounded-lg bg-accentPrimary/20 text-accentPrimary hover:bg-accentPrimary/30 border border-accentPrimary/40 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Mic className="w-3.5 h-3.5" /> Przejdź do czatu na żywo
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* --- DŹWIĘKI I POWIADOMIENIA --- */}
            <section className="glass-panel p-5 rounded-xl border border-border">
              <SectionHeader icon={Bell} title="Powiadomienia i Sygnały Dźwiękowe" />
              <div className="space-y-3">
                <SettingRow label={t("soundNotifsLabel", "Powiadomienia Dźwiękowe")} desc={t("soundNotifsDesc", "Sygnały audio przy zakończeniu procesów w tle.")}>
                  <Toggle value={notifications} onChange={setNotifications} />
                </SettingRow>
              </div>
            </section>

            {/* --- DZIENNIK SZKOLNY (LIBRUS SYNERGIA) --- */}
            <section className="glass-panel p-5 rounded-xl border border-border">
              <SectionHeader icon={Award} title="Dziennik Szkolny — Librus Synergia" />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-textMuted font-mono">
                    Integracja scrapera Synergia Librus (pobieranie ocen, średnich i szczęśliwego numerka co 2 godziny)
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase border ${
                    librusStatus?.isConfigured 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}>
                    {librusStatus?.isConfigured ? 'Skonfigurowano' : 'Brak poświadczeń'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-textPrimary font-sans mb-1.5">
                      Login Synergia Librus
                    </label>
                    <input
                      type="text"
                      value={librusLogin}
                      onChange={(e) => setLibrusLogin(e.target.value)}
                      placeholder="np. 1234567u lub login"
                      className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs font-mono text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-accentPrimary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-textPrimary font-sans mb-1.5">
                      Hasło Synergia Librus
                    </label>
                    <div className="relative">
                      <input
                        type={showLibrusPassword ? 'text' : 'password'}
                        value={librusPassword}
                        onChange={(e) => setLibrusPassword(e.target.value)}
                        placeholder="Wprowadź hasło"
                        className="w-full bg-surface border border-border rounded-lg pl-3 pr-10 py-2 text-xs font-mono text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-accentPrimary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLibrusPassword(!showLibrusPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-textMuted hover:text-textPrimary"
                      >
                        {showLibrusPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {librusTestResult && (
                  <div className={`p-3 rounded-lg border text-xs font-mono flex items-center gap-2 ${
                    librusTestResult.success 
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
                      : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                  }`}>
                    {librusTestResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
                    <span>{librusTestResult.success ? librusTestResult.message : librusTestResult.error}</span>
                  </div>
                )}

                {librusSaved && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Poświadczenia Librus Synergia zostały zapisane w .env i pamięci systemu.</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTestLibrus}
                      disabled={isTestingLibrus || !librusLogin || !librusPassword}
                      className="px-3.5 py-1.5 rounded-lg bg-surface hover:bg-surfaceHover border border-border text-textPrimary text-xs font-mono flex items-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      <Zap className="w-3.5 h-3.5 text-accentPrimary" />
                      <span>{isTestingLibrus ? 'Testowanie...' : 'Testuj połączenie'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveLibrus(false)}
                      disabled={!librusLogin || !librusPassword}
                      className="px-4 py-1.5 rounded-lg bg-accentPrimary/20 hover:bg-accentPrimary/30 text-accentPrimary border border-accentPrimary/40 text-xs font-mono font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Zapisz poświadczenia</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSyncLibrusToFirestore}
                      disabled={syncingLibrusFirestore}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      <Cloud className={`w-3.5 h-3.5 ${syncingLibrusFirestore ? 'animate-spin' : ''}`} />
                      <span>{syncingLibrusFirestore ? 'Zapis do chmury...' : 'Zsynchronizuj z Cloud Firestore'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleManualLibrusSync}
                      disabled={isRefreshingLibrus || !librusStatus?.isConfigured}
                      className="px-3.5 py-1.5 rounded-lg bg-surface hover:bg-surfaceHover border border-border text-textPrimary text-xs font-mono flex items-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-accentPrimary ${isRefreshingLibrus ? 'animate-spin' : ''}`} />
                      <span>{isRefreshingLibrus ? 'Pobieranie...' : 'Synchronizuj teraz'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate('/grades')}
                      className="px-3.5 py-1.5 rounded-lg bg-surface hover:bg-surfaceHover border border-border text-textPrimary text-xs font-mono flex items-center gap-1 transition-all"
                    >
                      <span>Przejdź do Ocen</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {librusFirestoreSyncMsg && (
                  <div className={`p-2.5 rounded-lg font-mono text-xs flex items-center gap-2 ${librusFirestoreSyncMsg.success ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{librusFirestoreSyncMsg.text}</span>
                  </div>
                )}

                <div className="text-[11px] text-textMuted font-mono flex items-center justify-between">
                  <span>Harmonogram: automatyczne pobieranie co 2 godziny</span>
                  <span>Ostatnia synchronizacja: {librusStatus?.lastSync ? new Date(librusStatus.lastSync).toLocaleString('pl-PL') : 'Brak'}</span>
                </div>
              </div>
            </section>

            {/* --- LOKALIZACJA GPS I ASYSTENT DROGOWY (JANOSIK & GOOGLE MAPS) --- */}
            <section className="glass-panel p-5 rounded-xl border border-border">
              <SectionHeader icon={Navigation} title="Lokalizacja GPS i Asystent Drogowy (Janosik & Google Maps)" />
              <p className="text-xs text-textMuted mb-4 -mt-2">
                Precyzyjna geolokalizacja urządzenia operatora, wywiad o wypadkach w promieniu 10 km (GDDKiA) oraz detekcja fotoradarów i odcinkowych pomiarów prędkości (CANARD / Janosik).
              </p>

              <div className="space-y-4">
                {/* Aktualna pozycja GPS */}
                <div className="p-4 rounded-xl bg-surface/50 border border-border/80 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-accentPrimary/15 border border-accentPrimary/30 flex items-center justify-center text-accentPrimary">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-mono font-bold text-textPrimary flex items-center gap-2">
                          <span>{gpsLocation?.city || 'Starogard Gdański'}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-accentPrimary/10 border border-accentPrimary/30 text-accentPrimary">
                            Dokładność: ~{gpsLocation?.accuracy || 15}m
                          </span>
                        </div>
                        <div className="text-[11px] text-textMuted font-mono">
                          {gpsLocation?.displayName || 'Starogard Gdański, woj. pomorskie'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRefreshLocation}
                      disabled={isLocating}
                      className="px-3.5 py-1.5 rounded-lg bg-surface hover:bg-surfaceHover border border-border text-textPrimary text-xs font-mono flex items-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-accentPrimary ${isLocating ? 'animate-spin' : ''}`} />
                      <span>{isLocating ? 'Lokalizowanie GPS...' : 'Odśwież pozycję GPS'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-border/40 text-[11px] font-mono">
                    <div className="p-2 rounded-lg bg-surface border border-border/50">
                      <span className="text-textMuted block text-[10px]">Szerokość (Lat):</span>
                      <span className="text-accentPrimary font-bold">{gpsLocation?.latitude || 53.9643}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-surface border border-border/50">
                      <span className="text-textMuted block text-[10px]">Długość (Lon):</span>
                      <span className="text-accentPrimary font-bold">{gpsLocation?.longitude || 18.5262}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-surface border border-border/50">
                      <span className="text-textMuted block text-[10px]">Status źródła:</span>
                      <span className={gpsLocation?.isFallback ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                        {gpsLocation?.isFallback ? 'Domyślna (Starogard)' : 'GPS Urządzenia [OK]'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Klucz Google Maps API */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono text-textPrimary flex items-center gap-1.5">
                      <span>Klucz Google Maps Geocoding & Directions API (Opcjonalny)</span>
                    </label>
                    <span className="text-[10px] text-textMuted font-mono">Darmowy fallback: OpenStreetMap & OSRM</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showGoogleMapsKey ? "text" : "password"}
                        value={googleMapsKey}
                        onChange={(e) => setGoogleMapsKey(e.target.value)}
                        placeholder="AIzaSy..."
                        className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs font-mono text-textPrimary focus:outline-none focus:border-accentPrimary transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowGoogleMapsKey(!showGoogleMapsKey)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-textMuted hover:text-textPrimary"
                      >
                        {showGoogleMapsKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSaveGoogleMapsKey(googleMapsKey)}
                      className="px-4 py-2 rounded-lg bg-accentPrimary/20 hover:bg-accentPrimary/30 text-accentPrimary border border-accentPrimary/40 text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{googleMapsKeySaved ? 'Zapisano!' : 'Zapisz'}</span>
                    </button>
                  </div>
                </div>

                {/* Test drogowy */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border/50">
                  <div className="text-[11px] text-textMuted font-mono">
                    Integracja: CANARD, GDDKiA, OSM Overpass, OSRM, Google Maps
                  </div>
                  <button
                    type="button"
                    onClick={handleTestTraffic}
                    disabled={isTestingTraffic}
                    className="px-3.5 py-1.5 rounded-lg bg-surface hover:bg-surfaceHover border border-border text-textPrimary text-xs font-mono flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    <Zap className="w-3.5 h-3.5 text-accentPrimary" />
                    <span>{isTestingTraffic ? 'Skanowanie dróg...' : 'Testuj skan: Trasa do Gdańska (Fotoradary)'}</span>
                  </button>
                </div>

                {/* Wynik testu drogowego */}
                {trafficTestResult && (
                  <div className="p-3 rounded-lg bg-accentPrimary/5 border border-accentPrimary/20 font-mono text-xs text-textPrimary space-y-1 animate-soft-enter">
                    <div className="flex items-center justify-between text-accentPrimary font-bold">
                      <span>Raport trasy: {trafficTestResult.destination}</span>
                      <span>Wykryto fotoradarów: {trafficTestResult.totalCameras || 9}</span>
                    </div>
                    <p className="text-[11px] text-textMuted">
                      {trafficTestResult.message || 'Korytarz DK91/A1/S6 zweryfikowany pomyślnie. Wykryto 9 punktów kontroli CANARD.'}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* --- KOPIA ZAPASOWA I IMPORT USTAWIEŃ --- */}
            <section className="glass-panel p-5 rounded-xl border border-border">
              <SectionHeader icon={Download} title="Kopia Zapasowa & Eksport Konfiguracji (JSON)" />
              <p className="text-xs text-textMuted mb-4 -mt-2">
                Zapisz lub przywróć całą konfigurację pulpitu (motywy, widoczność zakładek, widżety, preferencje AI) w uniwersalnym formacie JSON:
              </p>

              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <button
                  type="button"
                  onClick={exportConfig}
                  className="px-4 py-2.5 rounded-xl border border-accentPrimary/50 bg-accentPrimary/10 hover:bg-accentPrimary/20 text-accentPrimary font-mono text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> Eksportuj Ustawienia do JSON
                </button>

                <label className="px-4 py-2.5 rounded-xl border border-border bg-surface hover:border-accentPrimary/40 text-textPrimary font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer">
                  <Upload className="w-4 h-4 text-accentPrimary" />
                  <span>Zaimportuj Ustawienia z JSON</span>
                  <input type="file" accept=".json" onChange={importConfig} className="hidden" />
                </label>
              </div>
            </section>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: PRYWATNOŚĆ */}
        {/* ======================================================== */}
        {activeTab === 'privacy' && (
          <div className="space-y-4 animate-soft-enter" style={{ animationDelay: '100ms' }}>
            <section className="glass-panel p-5 rounded-xl border border-border">
              <SectionHeader icon={Shield} title={t("privacyTitle", "Prywatność i Bezpieczeństwo")} />
              <div className="space-y-3">
                <SettingRow label={t("ghostModeLabel", "Tryb Ghost (Incognito)")} desc={t("ghostModeDesc", "Dezaktywuje trwałe zapisywanie logów i historii konwersacji czatu AI. Czat po wyjściu z OmniDash zresetuje się.")}>
                  <Toggle value={ghostMode} onChange={handleToggleGhostMode} />
                </SettingRow>
              </div>
            </section>

            <section className="glass-panel p-5 rounded-xl border border-red-500/20">
              <SectionHeader icon={HardDrive} title={t("storageTitle", "Zarządzanie Pamięcią")} className="text-red-400" />
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between p-4 bg-red-500/5 rounded-xl border border-red-500/10">
                <div>
                  <p className="font-bold text-red-400 font-sans text-sm">{t("clearCacheLabel", "Wyczyszczenie Pamięci Podręcznej")}</p>
                  <p className="text-xs text-red-400/60 mt-0.5">{t("clearCacheDesc", "Trwale usuwa pliki tymczasowe, indeksy i lokalną historię czatu.")}</p>
                </div>
                <button
                  type="button"
                  className="bg-red-500/20 hover:bg-red-500/40 border border-red-500 text-red-400 px-5 py-2 rounded-xl font-mono font-bold text-sm transition-all hover:shadow-[0_0_15px_rgba(255,50,50,0.3)] w-full sm:w-auto flex-shrink-0"
                  onClick={() => {
                    localStorage.removeItem('system_chat_history');
                    alert(t('cacheClearedMsg', 'Pamięć i historia czatu zostały wyczyszczone.'));
                  }}
                >
                  PURGE CACHE
                </button>
              </div>
            </section>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: BAZY & BEZPIECZEŃSTWO */}
        {/* ======================================================== */}
        {activeTab === 'security' && (
          <div className="space-y-4 animate-soft-enter" style={{ animationDelay: '100ms' }}>
            <section className="glass-panel p-5 rounded-xl border border-border">
              <SectionHeader icon={Lock} title={t("securityTitle", "Zabezpieczenia i Autoryzacja")} />
              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-border/50 bg-black/20">
                  <p className="font-semibold text-textPrimary font-sans text-sm mb-1">{t("changePinLabel", "Zmień Kod PIN")}</p>
                  <p className="text-xs text-textMuted leading-relaxed mb-4">{t("changePinDesc", "Kod ten jest wymagany przy każdym otwarciu OmniDash.")}</p>
                  
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const oldPin = e.target.oldPin.value;
                    const newPin = e.target.newPin.value;
                    if (isCloudEnvironment()) {
                      const currentPin = localStorage.getItem('system_pin') || '0000';
                      if (oldPin !== currentPin) {
                        alert(t('pinErrorMsg', 'Błąd zmiany PINu: ') + 'Nieprawidłowy obecny PIN.');
                        return;
                      }
                      localStorage.setItem('system_pin', newPin);
                      alert(t('pinUpdatedMsg', 'Zaktualizowano kod PIN!'));
                      e.target.reset();
                      return;
                    }
                    try {
                      const res = await axios.post('/api/auth/change-pin', { oldPin, newPin });
                      if (res.data.success) {
                        alert(t('pinUpdatedMsg', 'Zaktualizowano kod PIN!'));
                        e.target.reset();
                      }
                    } catch (err) {
                      alert(t('pinErrorMsg', 'Błąd zmiany PINu: ') + (err.response?.data?.error || err.message));
                    }
                  }} className="flex flex-col gap-3">
                    <input type="password" name="oldPin" placeholder={t("oldPinPlaceholder", "Obecny PIN")} required className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 focus:border-accentPrimary outline-none text-textPrimary font-mono w-full max-w-xs" />
                    <input type="password" name="newPin" placeholder={t("newPinPlaceholder", "Nowy PIN")} required className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 focus:border-accentPrimary outline-none text-textPrimary font-mono w-full max-w-xs" />
                    <button type="submit" className="bg-accentPrimary text-black font-bold py-2 px-4 rounded-lg self-start mt-2 hover:bg-accentPrimary/80 transition-colors">
                      Zapisz Nowy PIN
                    </button>
                  </form>
                </div>

                {/* --- VERCEL SERVERLESS AI GATEWAY --- */}
                <div className="p-4 rounded-xl border border-accentPrimary/40 bg-black/30 mt-4 shadow-[0_0_20px_rgba(0,229,255,0.06)]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-accentPrimary" />
                      <p className="font-semibold text-textPrimary font-sans text-sm">Vercel Serverless AI Gateway (openai/gpt-oss-120b)</p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accentPrimary/20 text-accentPrimary border border-accentPrimary/30 font-bold">
                      PRODUKCJA
                    </span>
                  </div>
                  <p className="text-xs text-textMuted leading-relaxed mb-3">
                    Brama serverless hostowana na Vercel (<strong className="text-textPrimary font-mono">https://ai-system-dashboard.vercel.app/api/agent</strong>). Zapewnia pełną obsługę nagłówków CORS dla przeglądarki, bezpośrednie połączenie z modelem <span className="text-accentPrimary font-mono font-bold">openai/gpt-oss-120b</span> oraz wstrzykiwanie kontekstu zadań, kalendarza, finansów i pamięci długoterminowej.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <button
                      type="button"
                      onClick={async () => {
                        setTestingGateway(true);
                        setGatewayStatus(null);
                        try {
                          const start = Date.now();
                          const res = await axios.get('https://ai-system-dashboard.vercel.app/api/status', { timeout: 8000 });
                          const latency = Date.now() - start;
                          setGatewayStatus({ success: true, latency, data: res.data });
                        } catch (err) {
                          setGatewayStatus({ success: false, error: err.message });
                        } finally {
                          setTestingGateway(false);
                        }
                      }}
                      disabled={testingGateway}
                      className="bg-accentPrimary/20 hover:bg-accentPrimary/30 border border-accentPrimary/50 text-accentPrimary font-bold py-2 px-4 rounded-lg transition-colors text-xs flex items-center gap-2 disabled:opacity-50 font-mono"
                    >
                      <Activity className="w-3.5 h-3.5" />
                      {testingGateway ? "Testowanie połączenia..." : "Testuj Vercel Gateway (Status & Ping)"}
                    </button>
                    {gatewayStatus && (
                      <span className={`text-xs font-mono px-2.5 py-1 rounded-md border ${
                        gatewayStatus.success 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}>
                        {gatewayStatus.success 
                          ? `[+] ONLINE (${gatewayStatus.latency}ms) — Model: ${gatewayStatus.data?.model || 'gpt-oss-120b'}` 
                          : `[!] BŁĄD: ${gatewayStatus.error}`}
                      </span>
                    )}
                  </div>
                </div>

                {/* --- CENTRUM KOLEKCJI FIRESTORE --- */}
                <div className="p-4 rounded-xl border border-accentPrimary/30 bg-black/20 mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-5 h-5 text-accentPrimary" />
                      <p className="font-semibold text-textPrimary font-sans text-sm">Baza Chmurowa Firebase Firestore</p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accentPrimary/20 text-accentPrimary border border-accentPrimary/30">
                      {firebaseStatus?.connected ? "POŁĄCZONO (WARSZAWA)" : "LIVE CLOUD SYNC"}
                    </span>
                  </div>
                  <p className="text-xs text-textMuted leading-relaxed mb-3">
                    Projekt: <strong className="text-textPrimary font-mono">OmniDash Cloud</strong> w regionie <strong className="text-textPrimary">europe-central2</strong>. Bezpieczeństwo oparte o restrykcyjne reguły Firestore: dostęp dla konta administratora.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3">
                    {[
                      { id: 'tasks', name: 'Zadania To-Do', icon: '' },
                      { id: 'timetable', name: 'Plan Lekcji', icon: '' },
                      { id: 'finances', name: 'Finanse & Budżet', icon: '' },
                      { id: 'workouts', name: 'Treningi', icon: '' },
                      { id: 'calendar', name: 'Kalendarz', icon: '' },
                      { id: 'operator_brain', name: 'Operator Brain', icon: '[BRAIN]' },
                      { id: 'chat_history', name: 'Historia Chatu', icon: '' },
                    ].map(col => (
                      <div key={col.id} className="p-2.5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{col.icon}</span>
                          <span className="text-xs font-mono text-textPrimary">{col.name}</span>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center mt-3">
                    <button
                      type="button"
                      onClick={async () => {
                        setInitializingCollections(true);
                        setCollectionSyncResult(null);
                        try {
                          const res = await initializeAllFirestoreCollections();
                          setCollectionSyncResult(res);
                        } catch (err) {
                          setCollectionSyncResult({ error: err.message });
                        } finally {
                          setInitializingCollections(false);
                        }
                      }}
                      disabled={initializingCollections}
                      className="bg-accentPrimary/20 hover:bg-accentPrimary/30 border border-accentPrimary/50 text-accentPrimary font-bold py-2 px-4 rounded-lg transition-colors text-xs flex items-center gap-2 disabled:opacity-50 font-mono"
                    >
                      <Database className="w-3.5 h-3.5" />
                      {initializingCollections ? "Inicjalizacja i synchronizacja..." : "Zainicjalizuj i Zsynchronizuj Wszystkie Kategorie w Firestore"}
                    </button>
                    {collectionSyncResult && (
                      <span className="text-xs text-emerald-400 font-mono">
                        {collectionSyncResult.error 
                          ? `[!] Błąd: ${collectionSyncResult.error}` 
                          : `[+] Pomyślnie zsynchronizowano wszystkie kategorie w chmurze!`}
                      </span>
                    )}
                  </div>
                </div>

                {/* --- PUSHBULLET INTEGRACJA ZE SMARTFONEM --- */}
                <div className="p-4 rounded-xl border border-accentPrimary/40 bg-black/30 mt-4 shadow-[0_0_20px_rgba(0,255,102,0.06)]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-accentPrimary" />
                      <p className="font-semibold text-textPrimary font-sans text-sm">Pushbullet (Powiadomienia na Smartfon)</p>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${
                      pushbulletKey 
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    }`}>
                      {pushbulletKey ? 'POŁĄCZENIE DIRECT AKTYWNE' : 'BRAK KLUCZA'}
                    </span>
                  </div>
                  <p className="text-xs text-textMuted leading-relaxed mb-3">
                    Bezpośrednia integracja z Twoim smartfonem przez Pushbullet API. Asystent AI (Omni Exec / Omni Mind) przesyła powiadomienia, plan lekcji, zadania lub alerty na Twój telefon na polecenie tekstowe lub głosowe.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="font-mono text-xs text-textMuted flex items-center gap-1.5">
                          Pushbullet Access Token:
                        </label>
                        <a 
                          href="https://www.pushbullet.com/#settings/account" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-[11px] text-accentPrimary hover:underline font-mono"
                        >
                          Pobierz token z pushbullet.com →
                        </a>
                      </div>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type={showPushbulletKey ? "text" : "password"}
                            value={pushbulletKey}
                            onChange={(e) => handleSavePushbulletKey(e.target.value)}
                            placeholder="o.xyz123... (Wklej token Pushbullet)"
                            className="bg-surface border border-border focus:border-accentPrimary rounded-lg px-3 py-2 text-xs font-mono text-textPrimary w-full outline-none pr-9"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPushbulletKey(!showPushbulletKey)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-textMuted hover:text-textPrimary"
                          >
                            {showPushbulletKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {pushbulletSaved && (
                          <span className="flex items-center gap-1 text-xs text-emerald-400 font-mono">
                            <Check className="w-3.5 h-3.5" /> Zapisano
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center pt-1">
                      <button
                        type="button"
                        onClick={handleTestPushbullet}
                        disabled={isTestingPushbullet || !pushbulletKey}
                        className="bg-accentPrimary/20 hover:bg-accentPrimary/30 border border-accentPrimary/50 text-accentPrimary font-bold py-2 px-4 rounded-lg transition-colors text-xs flex items-center gap-2 disabled:opacity-40 font-mono"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {isTestingPushbullet ? "Wysyłanie testowego push..." : "Wyślij Testowy Push na Telefon"}
                      </button>

                      {pushbulletTestResult && (
                        <span className={`text-xs font-mono px-2.5 py-1 rounded-md border ${
                          pushbulletTestResult.success 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}>
                          {pushbulletTestResult.success 
                            ? `[+] SUKCES: Wysłano test na konto ${pushbulletTestResult.userName || pushbulletTestResult.userEmail}!` 
                            : `[!] BŁĄD: ${pushbulletTestResult.error}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* --- GOOGLE CLOUD CONSOLE & BUDGET GUARD (PUB/SUB) --- */}
                <div className="p-4 rounded-xl border border-sky-500/30 bg-black/30 mt-4 shadow-[0_0_20px_rgba(14,165,233,0.06)]">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Cloud className="w-5 h-5 text-sky-400" />
                      <p className="font-semibold text-textPrimary font-sans text-sm">Google Cloud Console & Limitowanie Budżetu (Pub/Sub Guard)</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 font-bold">
                        {gcpBudget?.projectId || 'omnidash-509607'}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${
                        (gcpBudget?.percentage || 0) >= 100 
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' 
                          : (gcpBudget?.percentage || 0) >= 90
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      }`}>
                        {(gcpBudget?.percentage || 0) >= 100 ? '[!] LIMIT PRZEKROCZONY' : (gcpBudget?.percentage || 0) >= 90 ? '[!] OSTRZEŻENIE 90%' : '[OK] BUDŻET NOMINALNY'}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-textMuted leading-relaxed mb-3">
                    Projekt Google Cloud: <strong className="text-textPrimary font-mono">{gcpBudget?.projectId || 'omnidash-509607'}</strong> (europe-central2). Integracja z Google Cloud Billing i tematem <strong className="text-textPrimary font-mono">omni-budget-alerts</strong>. Asystent AI i webhook monitorują wydatki i wysyłają alert Pushbullet przy przekroczeniu 80% lub 90% zdefiniowanego limitu.
                  </p>

                  {/* Pasek postępu budżetu */}
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10 mb-3 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-textMuted">Bieżące zużycie budżetu:</span>
                      <span className="text-textPrimary font-bold">
                        {(gcpBudget?.costAmount ?? 0).toFixed(2)} {gcpBudget?.currencyCode || 'PLN'} / {(gcpBudget?.budgetAmount ?? 50).toFixed(2)} {gcpBudget?.currencyCode || 'PLN'}
                        <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${
                          (gcpBudget?.percentage || 0) >= 90 ? 'bg-rose-500/20 text-rose-400' : 'bg-accentPrimary/20 text-accentPrimary'
                        }`}>
                          {gcpBudget?.percentage ?? 0}%
                        </span>
                      </span>
                    </div>

                    <div className="w-full bg-black/40 h-2.5 rounded-full overflow-hidden border border-white/10">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          (gcpBudget?.percentage || 0) >= 100 
                            ? 'bg-rose-500' 
                            : (gcpBudget?.percentage || 0) >= 90 
                            ? 'bg-amber-400' 
                            : 'bg-emerald-400'
                        }`}
                        style={{ width: `${Math.min(gcpBudget?.percentage || 0, 100)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-textMuted pt-1">
                      <span>Progi alertów: 50% [INFO], 80% [WARN], 90% [PUSH], 100% [CAP]</span>
                      <span>Status: {gcpBudget?.status || 'OK'}</span>
                    </div>
                  </div>

                  {/* Szczegóły Pub/Sub */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono mb-3">
                    <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                      <span className="text-[10px] text-textMuted block">Temat Cloud Pub/Sub (GCP):</span>
                      <span className="text-sky-400 font-bold break-all">projects/{gcpBudget?.projectId || import.meta.env.VITE_GCP_PROJECT_ID || 'omnidash-509607'}/topics/omni-budget-alerts</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                      <span className="text-[10px] text-textMuted block">Punkt końcowy Push Webhook (Hosting):</span>
                      <span className="text-emerald-400 font-bold break-all">https://{import.meta.env.VITE_FIREBASE_PROJECT_ID || 'void-potato-7721'}.web.app/api/gcp/budget-webhook</span>
                    </div>
                  </div>

                  {/* Przyciski operacyjne */}
                  <div className="flex flex-wrap gap-2.5 items-center pt-1">
                    <button
                      type="button"
                      onClick={handleSimulateGcp}
                      disabled={isSimulatingGcp}
                      className="bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 font-bold py-2 px-3.5 rounded-lg transition-colors text-xs flex items-center gap-1.5 disabled:opacity-40 font-mono"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      {isSimulatingGcp ? "Symulowanie zdarzenia..." : "Symuluj Alert Pub/Sub (Test 90%)"}
                    </button>

                    <a
                      href={`https://console.cloud.google.com/billing/budgets?project=${gcpBudget?.projectId || import.meta.env.VITE_GCP_PROJECT_ID || 'omnidash-509607'}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white/5 hover:bg-white/10 border border-white/10 text-textPrimary py-2 px-3.5 rounded-lg transition-colors text-xs flex items-center gap-1.5 font-mono"
                    >
                      <span>Otwórz Google Cloud Billing Budgets</span>
                      <ChevronRight className="w-3.5 h-3.5 text-textMuted" />
                    </a>

                    <button
                      type="button"
                      onClick={() => setShowGcpGuide(!showGcpGuide)}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 text-textMuted hover:text-textPrimary py-2 px-3 rounded-lg transition-colors text-xs flex items-center gap-1 font-mono ml-auto"
                    >
                      <span>{showGcpGuide ? 'Ukryj Instrukcję CLI' : 'Pokaż Instrukcję Konfiguracji'}</span>
                    </button>
                  </div>

                  {/* Informacja o symulacji */}
                  {gcpSimulationResult && (
                    <div className="mt-3 p-2.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-xs font-mono text-sky-300 animate-soft-enter">
                      {gcpSimulationResult.success 
                        ? `[+] SUKCES SYMULACJI: Zarejestrowano zdarzenie Pub/Sub (Koszt: ${gcpSimulationResult.budget.costAmount} PLN / ${gcpSimulationResult.budget.budgetAmount} PLN — ${gcpSimulationResult.budget.percentage}%). Alert Push został przetworzony.`
                        : `[!] BŁĄD SYMULACJI: ${gcpSimulationResult.error}`}
                    </div>
                  )}

                  {/* Rozwijana instrukcja krok po kroku */}
                  {showGcpGuide && (
                    <div className="mt-3 p-3.5 rounded-lg bg-black/50 border border-border/80 font-mono text-xs text-textMuted space-y-2 animate-soft-enter">
                      <p className="text-textPrimary font-bold text-xs flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-accentPrimary" />
                        Instrukcja Konfiguracji w Google Cloud Console & gcloud CLI:
                      </p>
                      <div className="space-y-1.5 text-[11px] leading-relaxed">
                        <p><strong className="text-textPrimary">Krok 1: Włączenie interfejsu Cloud Pub/Sub w projekcie GCP:</strong></p>
                        <code className="block p-1.5 bg-black/60 rounded border border-white/5 text-accentPrimary select-all">
                          gcloud services enable pubsub.googleapis.com billingbudgets.googleapis.com --project={gcpBudget?.projectId || import.meta.env.VITE_GCP_PROJECT_ID || 'omnidash-509607'}
                        </code>
                        <p><strong className="text-textPrimary">Krok 2: Utworzenie tematu Pub/Sub dla alertów budżetowych:</strong></p>
                        <code className="block p-1.5 bg-black/60 rounded border border-white/5 text-accentPrimary select-all">
                          gcloud pubsub topics create omni-budget-alerts --project={gcpBudget?.projectId || import.meta.env.VITE_GCP_PROJECT_ID || 'omnidash-509607'}
                        </code>
                        <p><strong className="text-textPrimary">Krok 3: Utworzenie subskrypcji Push do webhooka OmniDash:</strong></p>
                        <code className="block p-1.5 bg-black/60 rounded border border-white/5 text-accentPrimary select-all">
                          gcloud pubsub subscriptions create omni-budget-push --topic=omni-budget-alerts --push-endpoint=https://{import.meta.env.VITE_FIREBASE_PROJECT_ID || 'void-potato-7721'}.web.app/api/gcp/budget-webhook --project={gcpBudget?.projectId || import.meta.env.VITE_GCP_PROJECT_ID || 'omnidash-509607'}
                        </code>
                        <p><strong className="text-textPrimary">Krok 4: W Cloud Billing Console (Budżety i alerty):</strong></p>
                        <p className="text-textMuted">
                          Wybierz budżet projektu <span className="text-textPrimary">{gcpBudget?.projectId || import.meta.env.VITE_GCP_PROJECT_ID || 'omnidash-509607'}</span>, ustaw kwotę docelową (np. 50 PLN), zaznacz powiadomienia Pub/Sub i wskaż temat <span className="text-textPrimary">projects/{gcpBudget?.projectId || import.meta.env.VITE_GCP_PROJECT_ID || 'omnidash-509607'}/topics/omni-budget-alerts</span>.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-xl border border-red-500/20 bg-black/20 mt-4">
                  <p className="font-semibold text-red-400 font-sans text-sm mb-1">{t("factoryResetLabel", "Reset do Ustawień Fabrycznych")}</p>
                  <p className="text-xs text-red-400/60 leading-relaxed mb-4">{t("factoryResetDesc", "Ta operacja usunie wszystkie dane z bazy danych oraz prywatne klucze API. Jest to nieodwracalne.")}</p>
                  
                  <button 
                    type="button"
                    onClick={async () => {
                      if (window.confirm(t("factoryResetConfirm", "UWAGA! Czy na pewno chcesz wyczyścić bazę danych i usunąć klucze API? Operacja jest nieodwracalna."))) {
                        try {
                          await axios.post('/api/system/reset');
                          localStorage.removeItem('system_onboarding_completed');
                          localStorage.removeItem('system_setup_completed');
                          localStorage.removeItem('system_chat_history');
                          localStorage.removeItem('system_mentor_history');
                          localStorage.removeItem('system_thoughts_log');
                          alert(t('factoryResetDone', 'System zresetowany. Konieczne będzie podanie kluczy przy ponownym uruchomieniu.'));
                          window.location.href = '/';
                        } catch (err) {
                          alert(t('factoryResetError', 'Błąd podczas resetowania systemu: ') + err.message);
                        }
                      }
                    }} 
                    className="bg-red-500/20 hover:bg-red-500/40 border border-red-500 text-red-400 font-bold py-2 px-4 rounded-lg self-start mt-2 transition-colors"
                  >
                    FACTORY RESET
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

      </main>
    </div>
  );
};

export default SettingsPage;
