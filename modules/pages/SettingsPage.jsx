import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Settings, Shield, Bell, HardDrive, Cpu, Palette, Sun, Moon, Rss, Zap, Lock, Check, 
  LayoutGrid, Mic, Volume2, Globe, Sparkles, Cloud, Database, BrainCircuit, Activity,
  Compass, LayoutDashboard, MessageSquare, GraduationCap, Crosshair, CalendarDays,
  Wallet, Dumbbell, Server, Sliders, Download, Upload, RotateCcw, Bot, CheckCircle2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { COLOR_PRESETS, NEWS_CATEGORIES } from '../config/constants';
import { initializeAllFirestoreCollections, CLOUD_COLLECTIONS, isCloudEnvironment } from '../services/cloudSync';

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
  const [visibleNav, setVisibleNav] = useState(DEFAULT_VISIBLE_NAV);
  const [defaultModel, setDefaultModel] = useState('openai/gpt-oss-120b');
  const [glassmorphism, setGlassmorphism] = useState(true);
  const [animations, setAnimations] = useState(true);
  const [compactUi, setCompactUi] = useState(false);
  const [clock24h, setClock24h] = useState(true);
  const [clockSeconds, setClockSeconds] = useState(false);

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

  const testVoice = () => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(t("testVoiceText", "Testuję ustawienia głosu. Mam nadzieję, że brzmię dobrze."));
    utterance.lang = 'pl-PL';
    utterance.rate = voiceRate;
    
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice;
    if (voicePref === 'female' || voicePref === 'paulina') {
       selectedVoice = voices.find(v => v.name.toLowerCase().includes('paulina') || v.name.toLowerCase().includes('zofia')) || voices.find(v => v.lang.includes('pl') && !v.name.toLowerCase().includes('male') && !v.name.toLowerCase().includes('marek'));
    } else {
       selectedVoice = voices.find(v => v.name.toLowerCase().includes('marek') || v.name.toLowerCase().includes('adam')) || voices.find(v => v.lang.includes('pl') && (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('mężczyzna')));
    }
    
    if (!selectedVoice) selectedVoice = voices.find(v => v.lang.includes('pl'));
    if (selectedVoice) utterance.voice = selectedVoice;
    
    window.speechSynthesis.speak(utterance);
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
        {/* TAB 1: PERSONALIZACJA & STYL                            */}
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
                {saved ? t('newsPrefsSaved', '✓ ZAPISANO PREFERENCJE') : t('newsPrefsSave', 'ZAPISZ PREFERENCJE NEWSÓW')}
              </button>
            </section>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: NAWIGACJA & ZAKŁADKI                             */}
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
        {/* TAB 3: SYSTEM & AI                                      */}
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

            {/* --- GŁOS AI --- */}
            <section className="glass-panel p-5 rounded-xl border border-border">
              <SectionHeader icon={Mic} title={t("voiceAssistantTitle", "Asystent Głosowy (Synteza TTS)")} />
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-border/50 bg-black/20">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-semibold text-textPrimary font-sans text-sm">{t("voiceSelectLabel", "Wybór Głosu")}</p>
                    <button type="button" onClick={testVoice} className="text-xs bg-accentPrimary/20 text-accentPrimary px-3 py-1.5 rounded-lg hover:bg-accentPrimary/40 flex items-center gap-1 transition-colors">Testuj głos <Volume2 className="w-3.5 h-3.5" /></button>
                  </div>
                  <p className="text-xs text-textMuted mb-3">{t("voiceSelectDesc", "Wybierz profil głosu asystenta.")}</p>
                  <select 
                    value={voicePref === 'paulina' ? 'female' : voicePref} 
                    onChange={(e) => updateVoicePref(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm font-mono text-textPrimary focus:outline-none focus:border-accentPrimary"
                  >
                    <option value="female">{t("voiceFemale", "Głos Damski (Paulina/Zofia)")}</option>
                    <option value="male">{t("voiceMale", "Głos Męski (Marek/Adam)")}</option>
                  </select>
                </div>
                
                <div className="p-4 rounded-xl border border-border/50 bg-black/20">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-semibold text-textPrimary font-sans text-sm">{t("voiceRateLabel", "Prędkość mowy (Rate):")} {voiceRate.toFixed(1)}x</p>
                    <button type="button" onClick={testVoice} className="text-xs bg-accentPrimary/20 text-accentPrimary px-3 py-1.5 rounded-lg hover:bg-accentPrimary/40 flex items-center gap-1 transition-colors">Testuj prędkość <Volume2 className="w-3.5 h-3.5" /></button>
                  </div>
                  <p className="text-xs text-textMuted mb-4">{t("voiceRateDesc", "Dostosuj szybkość, z jaką agent odczytuje odpowiedzi.")}</p>
                  <input 
                    type="range" 
                    min="0.5" max="2.0" step="0.1" 
                    value={voiceRate} 
                    onChange={(e) => updateVoiceRate(parseFloat(e.target.value))}
                    className="w-full accent-accentPrimary h-2 rounded-lg appearance-none bg-surface border border-border" 
                  />
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
        {/* TAB 4: PRYWATNOŚĆ                                       */}
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
        {/* TAB 5: BAZY & BEZPIECZEŃSTWO                            */}
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
                      { id: 'tasks', name: 'Zadania To-Do', icon: '📋' },
                      { id: 'timetable', name: 'Plan Lekcji', icon: '🎓' },
                      { id: 'finances', name: 'Finanse & Budżet', icon: '💰' },
                      { id: 'workouts', name: 'Treningi', icon: '🏋️' },
                      { id: 'calendar', name: 'Kalendarz', icon: '📅' },
                      { id: 'operator_brain', name: 'Operator Brain', icon: '🧠' },
                      { id: 'chat_history', name: 'Historia Chatu', icon: '💬' },
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
