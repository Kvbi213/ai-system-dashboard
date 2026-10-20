import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Palette, Volume2, Cpu, Compass, Bell, Sliders, Database,
  Shield, Check, RotateCcw, Download, Upload, Play, Square,
  MapPin, Navigation, Smartphone, Send, Key, AlertTriangle,
  RefreshCw, CheckCircle2, Lock, Radio, Layers, Sparkles,
  Info, ExternalLink, HardDrive, Terminal
} from 'lucide-react';

import {
  ttsService,
  EDGE_DEFAULT_VOICES,
  ELEVENLABS_DEFAULT_VOICES,
  FISH_AUDIO_DEFAULT_VOICES,
  BROWSER_DEFAULT_VOICES,
  OPENAI_DEFAULT_VOICES,
  GOOGLE_DEFAULT_VOICES,
  getBrowserVoices
} from '../services/ttsService.js';

import { wakeWordService } from '../services/wakeWordService.js';
import {
  getPushbulletApiKey,
  setPushbulletApiKey,
  testPushbulletConnection
} from '../services/pushbulletService.js';
import {
  acquireHighAccuracyLocation,
  getSavedLocation,
  saveLocation
} from '../services/geolocationService.js';
import {
  initializeAllFirestoreCollections
} from '../services/cloudSync.js';
import { NEWS_CATEGORIES } from '../config/constants.js';

// 12 Głównych Modułów Systemu OmniDash
const DEFAULT_VISIBLE_NAV = {
  'pulpit': true,
  'omni-chat-ai': true,
  'plan-dnia-harmonogram': true,
  'oceny-edukacja': true,
  'finanse-koperty': true,
  'treningi-fbw': true,
  'kalendarz': true,
  'osint-toolkit': true,
  'baza-wiedzy-encje': true,
  'pamiec-operatora': true,
  'widzety-metryki': true,
  'serwer-logi': true,
  'ustawienia-systemu': true
};

const NAV_MODULES_CONFIG = [
  { id: 'pulpit', name: 'Pulpit Główny', path: '/', category: 'Core Systems', desc: 'Centralny kokpit telemetryczny, zegar, to-do, statystyki' },
  { id: 'omni-chat-ai', name: 'Omni Chat & AI', path: '/chat', category: 'Core Systems', desc: 'Wielomodelowy asystent AI, wywołania narzędzi, agent LPU' },
  { id: 'plan-dnia-harmonogram', name: 'Plan Dnia', path: '/timetable', category: 'Core Systems', desc: 'Harmonogram dnia, Librus oraz aktywności osobiste' },
  { id: 'oceny-edukacja', name: 'Oceny & Edukacja', path: '/grades', category: 'Core Systems', desc: 'Wykaz ocen Librus, średnie ważone, frekwencja' },
  { id: 'finanse-koperty', name: 'Finanse & Koperty', path: '/finances', category: 'Core Systems', desc: 'Metoda kopertowa, transakcje, budżety operacyjne' },
  { id: 'treningi-fbw', name: 'Treningi FBW', path: '/workouts', category: 'Tracking & Ops', desc: 'Katalog planów treningowych, live sesja, progresja ciężaru' },
  { id: 'kalendarz', name: 'Kalendarz', path: '/calendar', category: 'Tracking & Ops', desc: 'Sprawdziany, kartkówki, wydarzenia osobiste i terminy' },
  { id: 'osint-toolkit', name: 'OSINT Toolkit', path: '/osint', category: 'Tracking & Ops', desc: 'Wyszukiwarka wywiadowcza, telemetria domen i IP' },
  { id: 'baza-wiedzy-encje', name: 'Baza Wiedzy & Encje', path: '/entities', category: 'Tracking & Ops', desc: 'Graf powiązań osób, organizacji, aktywów i lokalizacji' },
  { id: 'pamiec-operatora', name: 'Pamięć Operatora', path: '/memory', category: 'System Management', desc: 'Trwała pamięć faktograficzna modelu AI w chmurze' },
  { id: 'widzety-metryki', name: 'Widżety & Metryki', path: '/widgets', category: 'System Management', desc: 'Konfigurowalne karty telemetryczne i wykresy' },
  { id: 'serwer-logi', name: 'Serwer & Logi', path: '/server-logs', category: 'System Management', desc: 'Strumień logów systemowych, SQLite WAL, telemetria' },
  { id: 'ustawienia-systemu', name: 'Ustawienia Systemu', path: '/settings', category: 'System Management', desc: 'Pełna konfiguracja jądra, silników mowy, AI i bezpieczeństwa' }
];

const THEME_PRESETS = [
  {
    id: 'dark',
    name: 'Cyber Dark',
    font: 'JetBrains Mono',
    sub: 'Default HUD',
    code: '#07090E',
    bg: '#07090e',
    accent1: '#00ffcc',
    accent2: '#2563eb',
    barClass: 'bg-[#00ffcc]/60'
  },
  {
    id: 'retro',
    name: 'Retro Amber',
    font: 'IBM Plex Mono',
    sub: 'Terminal CRT',
    code: 'P3 Phosphor',
    bg: '#140e02',
    accent1: '#ffb786',
    accent2: '#b45309',
    barClass: 'bg-[#ffb786]/60'
  },
  {
    id: 'monochrome',
    name: 'Mono Minimal',
    font: 'Inter Bold',
    sub: 'Brutalist 0% Tint',
    code: 'Pure Mono',
    bg: '#0e0e10',
    accent1: '#ffffff',
    accent2: '#71717a',
    barClass: 'bg-white/20'
  },
  {
    id: 'matrix',
    name: 'Matrix Green',
    font: 'Fira Code',
    sub: 'Phosphor High-Con',
    code: '#00FF66',
    bg: '#050f08',
    accent1: '#10b981',
    accent2: '#064e3b',
    barClass: 'bg-[#10b981]/50'
  },
  {
    id: 'synthwave',
    name: 'Synthwave',
    font: 'Outfit Sans',
    sub: 'Dusk Cyberpunk',
    code: 'Magenta Twilight',
    bg: '#140b1e',
    accent1: '#ec4899',
    accent2: '#8b5cf6',
    barClass: 'bg-[#ec4899]/60'
  },
  {
    id: 'nordic',
    name: 'Nordic Frost',
    font: 'Geist',
    sub: 'Glacial Cool',
    code: 'Sub-Zero Slate',
    bg: '#0c141c',
    accent1: '#38bdf8',
    accent2: '#0369a1',
    barClass: 'bg-[#38bdf8]/50'
  },
  {
    id: 'light',
    name: 'Clean Light',
    font: 'SF Pro Text',
    sub: 'Sterile Daylight',
    code: '100% White Point',
    bg: '#e2e8f0',
    accent1: '#2563eb',
    accent2: '#64748b',
    barClass: 'bg-blue-600/60'
  }
];

const AI_MODELS = [
  { id: 'llama-3.3-70b-versatile', name: 'Groq Llama 3.3 70B Versatile', provider: 'Groq LPU', speed: '280 t/s', desc: 'Zalecany domyślny model produkcyjny: ultra-szybki, wszechstronny, doskonały do tool callingu.' },
  { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill 70B', provider: 'Groq LPU', speed: '240 t/s', desc: 'Zaawansowane rozumowanie inżynieryjne, precyzyjne planowanie krok-po-kroku.' },
  { id: 'claude-3-5-sonnet', name: 'Anthropic Claude 3.5 Sonnet', provider: 'Anthropic', speed: '75 t/s', desc: 'Najwyższa jakość kodu, architektury oprogramowania i analizy dokumentacji.' },
  { id: 'gemini-1.5-pro', name: 'Google Gemini 1.5 Pro', provider: 'Google AI', speed: '90 t/s', desc: 'Ekstremalne okno kontekstu (1M tokenów), analiza wielkich baz danych i logów.' },
  { id: 'llama-3.1-8b-instant', name: 'Meta Llama 3.1 8B Instant', provider: 'Groq LPU', speed: '550 t/s', desc: 'Błyskawiczne odpowiedzi (80ms), idealne do krótkich komend głosowych.' }
];

const WEATHER_STATIONS = [
  { name: 'Starogard Gdański (Domyślna)', lat: 53.9642, lon: 18.5283 },
  { name: 'Gdańsk / Trójmiasto', lat: 54.3520, lon: 18.6466 },
  { name: 'Warszawa Śródmieście', lat: 52.2297, lon: 21.0122 },
  { name: 'Kraków Stare Miasto', lat: 50.0647, lon: 19.9450 },
  { name: 'Wrocław Fabryczna', lat: 51.1079, lon: 17.0385 },
  { name: 'Poznań Centrum', lat: 52.4064, lon: 16.9252 }
];

export const SettingsPage = () => {
  const navigate = useNavigate();

  // Tab Navigation
  const [activeTab, setActiveTab] = useState('kernel');
  const [librusIntegrationEnabled, setLibrusIntegrationEnabled] = useState(() => {
    return localStorage.getItem('system_librus_enabled') === 'true';
  });

  const toggleLibrusIntegration = () => {
    const nextVal = !librusIntegrationEnabled;
    setLibrusIntegrationEnabled(nextVal);
    localStorage.setItem('system_librus_enabled', nextVal ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('librusConfigChanged', { detail: { enabled: nextVal } }));
    window.dispatchEvent(new CustomEvent('systemConfigUpdated', { detail: { librusEnabled: nextVal } }));
    triggerToast(nextVal ? '[+] WŁĄCZONO INTEGRACJĘ LIBRUS API' : '[*] AKTYWOWANO TRYB AUTONOMICZNY (BEZ LIBRUS API)');
  };

  // Active Theme
  const [theme, setTheme] = useState(() => localStorage.getItem('system_theme') || 'dark');
  const [savedToast, setSavedToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2600);
  };

  // Shell Navigation Visibility Matrix
  const [visibleNav, setVisibleNav] = useState(() => {
    try {
      const saved = localStorage.getItem('system_visible_nav');
      if (saved) return { ...DEFAULT_VISIBLE_NAV, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_VISIBLE_NAV;
  });

  // TTS Engine & Voice State
  const [ttsEngine, setTtsEngine] = useState(() => localStorage.getItem('system_tts_engine') || 'edge');
  const [ttsVoiceId, setTtsVoiceId] = useState(() => ttsService.getVoiceId());
  const [ttsRate, setTtsRate] = useState(() => parseFloat(localStorage.getItem('system_tts_rate') || '1.0'));
  const [ttsPitch, setTtsPitch] = useState(() => parseFloat(localStorage.getItem('system_tts_pitch') || '1.0'));
  const [ttsVolume, setTtsVolume] = useState(() => parseFloat(localStorage.getItem('system_tts_volume') || '1.0'));
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [testSpeechText, setTestSpeechText] = useState('System OmniDash w pełnej gotowości operacyjnej.');
  const [browserVoicesList, setBrowserVoicesList] = useState([]);

  // WakeWord State
  const [wakeWordEnabled, setWakeWordEnabled] = useState(() => localStorage.getItem('system_wakeword_enabled') === 'true');
  const [wakeSensitivity, setWakeSensitivity] = useState(() => parseInt(localStorage.getItem('system_wakeword_sensitivity') || '75', 10));

  // AI & Models State
  const [aiModel, setAiModel] = useState(() => localStorage.getItem('system_ai_model') || 'llama-3.3-70b-versatile');
  const [aiContextLimit, setAiContextLimit] = useState(() => parseInt(localStorage.getItem('system_ai_context_limit') || '32000', 10));
  const [aiSystemPrompt, setAiSystemPrompt] = useState(() => localStorage.getItem('system_ai_system_prompt') || 'Jesteś Omni, elitarnym autonomicznym systemem operacyjnym i asystentem inżynieryjnym Jakuba Lisa. Udzielasz zwięzłych, technicznych i bezkompromisowo precyzyjnych odpowiedzi.');
  const [aiTools, setAiTools] = useState(() => {
    try {
      const saved = localStorage.getItem('system_ai_tools');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { webSearch: true, fileAccess: true, dbQuery: true, pushNotify: true };
  });

  // Geolocation State
  const [location, setLocation] = useState(() => getSavedLocation());
  const [isDetectingGps, setIsDetectingGps] = useState(false);

  // Pushbullet State
  const [pushbulletKey, setPushbulletKey] = useState(() => getPushbulletApiKey());
  const [showPushbulletKey, setShowPushbulletKey] = useState(false);
  const [pushStatus, setPushStatus] = useState(null);
  const [pushChannels, setPushChannels] = useState(() => {
    try {
      const saved = localStorage.getItem('system_notification_channels');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { librus: true, finances: true, schedule: true, workouts: true, gcpBudget: true };
  });

  // Ergonomics & UI
  const [clock24h, setClock24h] = useState(() => localStorage.getItem('system_clock_24h') !== 'false');
  const [clockSeconds, setClockSeconds] = useState(() => localStorage.getItem('system_clock_seconds') === 'true');
  const [blurLevel, setBlurLevel] = useState(() => parseInt(localStorage.getItem('system_blur_level') || '12', 10));
  const [springAnim, setSpringAnim] = useState(() => localStorage.getItem('system_spring_animations') !== 'false');
  const [compactMode, setCompactMode] = useState(() => localStorage.getItem('system_compact_mode') === 'true');
  const [selectedNewsCategories, setSelectedNewsCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('system_news_categories');
      if (saved) return JSON.parse(saved);
    } catch {}
    return ['ai', 'hardware', 'security', 'economy'];
  });

  // Security Policies State
  const [policies, setPolicies] = useState(() => {
    try {
      const saved = localStorage.getItem('system_security_policies');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      antiSsrf: true,
      toolCallingGuard: true,
      zeroEmoji: true,
      sqlCipher: true,
      pinAuth: true
    };
  });

  // Credentials State
  const [credentials, setCredentials] = useState(() => {
    try {
      const saved = localStorage.getItem('system_credentials_vault');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      groqKey: 'gsk_live_••••••••••••942x',
      braveKey: 'BSA_sec_••••••••••••881a',
      pushbulletKey: 'o.pb_tok_••••••••••••031k',
      librusSession: 'Bearer session_live_v2',
      firebaseAccount: 'service-account-omnidash-prd.json'
    };
  });

  // Modals & Firestore status
  const [activeCredModal, setActiveCredModal] = useState(null);
  const [modalKeyInput, setModalKeyInput] = useState('');
  const [isInitializingCloud, setIsInitializingCloud] = useState(false);
  const [cloudInitReport, setCloudInitReport] = useState(null);

  // Inicjalizacja głosów przeglądarki
  useEffect(() => {
    const loadVoices = () => {
      const v = getBrowserVoices();
      if (v && v.length > 0) setBrowserVoicesList(v);
    };
    loadVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Handler wyboru motywu
  const handleSelectTheme = (newThemeId) => {
    setTheme(newThemeId);
    document.documentElement.setAttribute('data-theme', newThemeId);
    
    // Usuń stare klasy motywu
    THEME_PRESETS.forEach(p => {
      document.documentElement.classList.remove(`theme-${p.id}`);
    });
    document.documentElement.classList.add(`theme-${newThemeId}`);

    if (newThemeId === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
    localStorage.setItem('system_theme', newThemeId);
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: newThemeId }));
    triggerToast(`[+] MOTYW AKTYWOWANY: ${newThemeId.toUpperCase()}`);
  };

  // Toggle modułów nawigacji
  const handleToggleNav = (key) => {
    setVisibleNav(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem('system_visible_nav', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('visibleNavChanged', { detail: updated }));
      return updated;
    });
  };

  // Toggle polityki bezpieczeństwa
  const handleTogglePolicy = (policyKey) => {
    setPolicies(prev => {
      const updated = { ...prev, [policyKey]: !prev[policyKey] };
      localStorage.setItem('system_security_policies', JSON.stringify(updated));
      return updated;
    });
  };

  // Zapis silnika TTS i głosu
  const handleEngineChange = (engine) => {
    setTtsEngine(engine);
    localStorage.setItem('system_tts_engine', engine);
    
    let defaultVoice = '';
    if (engine === 'edge') defaultVoice = EDGE_DEFAULT_VOICES[0]?.id;
    else if (engine === 'elevenlabs') defaultVoice = ELEVENLABS_DEFAULT_VOICES[0]?.id;
    else if (engine === 'fish_audio') defaultVoice = FISH_AUDIO_DEFAULT_VOICES[0]?.id;
    else if (engine === 'openai') defaultVoice = OPENAI_DEFAULT_VOICES[0]?.id;
    else if (engine === 'google') defaultVoice = GOOGLE_DEFAULT_VOICES[0]?.id;
    else if (engine === 'browser') defaultVoice = BROWSER_DEFAULT_VOICES[0]?.id;
    
    setTtsVoiceId(defaultVoice);
    localStorage.setItem(`system_${engine}_voice_id`, defaultVoice);
  };

  const handleVoiceChange = (vId) => {
    setTtsVoiceId(vId);
    localStorage.setItem(`system_${ttsEngine}_voice_id`, vId);
  };

  // Odtwarzanie próbki mowy TTS
  const handlePlayVoiceTest = async () => {
    if (isSpeaking) {
      ttsService.stop();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    try {
      await ttsService.speak(testSpeechText, {
        engine: ttsEngine,
        voiceId: ttsVoiceId,
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: (err) => {
          console.warn('[TTS] Błąd próbki:', err);
          setIsSpeaking(false);
        }
      });
    } catch {
      setIsSpeaking(false);
    }
  };

  // Obsługa WakeWord
  const handleToggleWakeWord = (val) => {
    setWakeWordEnabled(val);
    localStorage.setItem('system_wakeword_enabled', String(val));
    if (val) {
      wakeWordService.start();
      triggerToast('[+] WAKEWORD AKTYWNY ("Hej Omni")');
    } else {
      wakeWordService.stop();
      triggerToast('[-] WAKEWORD ZATRZYMANY');
    }
  };

  // Geolokalizacja GPS
  const handleDetectGps = async () => {
    setIsDetectingGps(true);
    try {
      const res = await acquireHighAccuracyLocation();
      if (res && res.success && res.location) {
        setLocation(res.location);
        saveLocation(res.location);
        triggerToast(`[+] GPS POBRANY: ${res.location.city || 'Współrzędne zapisane'}`);
      } else {
        triggerToast('[!] Nie udało się pobrać współrzędnych GPS');
      }
    } catch (e) {
      triggerToast(`[!] Błąd GPS: ${e.message}`);
    } finally {
      setIsDetectingGps(false);
    }
  };

  // Test Pushbullet
  const handleTestPushbullet = async () => {
    if (!pushbulletKey.trim()) {
      setPushStatus({ error: 'Podaj poprawny Access Token Pushbullet' });
      return;
    }
    setPushStatus({ loading: true });
    try {
      const res = await testPushbulletConnection(pushbulletKey);
      if (res.success) {
        setPushbulletApiKey(pushbulletKey);
        setPushStatus({ success: true, user: res.user || 'Użytkownik Pushbullet' });
        triggerToast('[+] POWIADOMIENIE PUSH WYSŁANE NA SMARTFON!');
      } else {
        setPushStatus({ error: res.error || 'Błąd autoryzacji' });
      }
    } catch (e) {
      setPushStatus({ error: e.message });
    }
  };

  // Inicjalizacja kolekcji Firestore
  const handleInitCloudCollections = async () => {
    setIsInitializingCloud(true);
    try {
      const report = await initializeAllFirestoreCollections();
      setCloudInitReport(report);
      triggerToast('[+] 11 KOLEKCJI FIRESTORE ZAINICJALIZOWANYCH!');
    } catch (e) {
      triggerToast(`[!] Błąd synchronizacji Firestore: ${e.message}`);
    } finally {
      setIsInitializingCloud(false);
    }
  };

  // Eksport i backup JSON
  const handleExportJson = () => {
    const configData = {
      system_version: '3.1.2',
      export_date: new Date().toISOString(),
      theme,
      visibleNav,
      policies,
      tts: { engine: ttsEngine, voiceId: ttsVoiceId, rate: ttsRate, pitch: ttsPitch, volume: ttsVolume },
      ai: { model: aiModel, contextLimit: aiContextLimit, tools: aiTools },
      location,
      ergonomics: { clock24h, clockSeconds, blurLevel, springAnim, compactMode, selectedNewsCategories }
    };
    const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnidash-full-config-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    triggerToast('[+] EKSPORT KONFIGURACJI ZAKOŃCZONY');
  };

  // Download SQL dump
  const handleDownloadSqlDump = () => {
    const dumpContent = `-- OmniDash SQLite WAL Export Dump
-- Version: 3.1.2
-- Generated: ${new Date().toISOString()}

PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS sys_meta (key TEXT PRIMARY KEY, val TEXT);
INSERT INTO sys_meta VALUES ('version', '3.1.2');
INSERT INTO sys_meta VALUES ('snapshot_hash', 'sha256:d8c4e5a901e_v312');
INSERT INTO sys_meta VALUES ('active_theme', '${theme}');
INSERT INTO sys_meta VALUES ('tts_engine', '${ttsEngine}');
INSERT INTO sys_meta VALUES ('ai_model', '${aiModel}');
COMMIT;
`;
    const blob = new Blob([dumpContent], { type: 'application/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnidash-wal-dump-${new Date().toISOString().slice(0, 10)}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    triggerToast('[+] ZRZUT SQL WAL POBRANY');
  };

  // Import JSON
  const handleImportJson = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result);
        if (parsed.theme) handleSelectTheme(parsed.theme);
        if (parsed.visibleNav) {
          setVisibleNav(parsed.visibleNav);
          localStorage.setItem('system_visible_nav', JSON.stringify(parsed.visibleNav));
          window.dispatchEvent(new CustomEvent('visibleNavChanged', { detail: parsed.visibleNav }));
        }
        if (parsed.policies) {
          setPolicies(parsed.policies);
          localStorage.setItem('system_security_policies', JSON.stringify(parsed.policies));
        }
        if (parsed.tts?.engine) handleEngineChange(parsed.tts.engine);
        if (parsed.ai?.model) {
          setAiModel(parsed.ai.model);
          localStorage.setItem('system_ai_model', parsed.ai.model);
        }
        triggerToast('[+] KONFIGURACJA ZAIMPORTOWANA POMYŚLNIE');
      } catch (err) {
        alert('Defekt odczytu pliku konfiguracyjnego JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  // Zapisz credential
  const handleSaveModalCred = () => {
    if (!modalKeyInput.trim()) {
      setActiveCredModal(null);
      return;
    }
    const masked = modalKeyInput.slice(0, 8) + '••••••••••••' + modalKeyInput.slice(-4);
    const updated = { ...credentials, [activeCredModal]: masked };
    setCredentials(updated);
    localStorage.setItem('system_credentials_vault', JSON.stringify(updated));
    if (activeCredModal === 'pushbulletKey') {
      setPushbulletKey(modalKeyInput.trim());
      setPushbulletApiKey(modalKeyInput.trim());
    }
    setModalKeyInput('');
    setActiveCredModal(null);
    triggerToast('[+] KLUCZ API ZAPISANY W SKARBCU');
  };

  // Factory reset
  const handleFactoryReset = () => {
    if (window.confirm('[!] UWAGA KRYTYCZNA: Czy na pewno chcesz zresetować cały system do ustawień fabrycznych? Wszystkie dane i klucze API zostaną usunięte.')) {
      localStorage.clear();
      sessionStorage.clear();
      alert('[+] System zresetowany. Nastąpi ponowne załadowanie jądra.');
      window.location.href = '/';
    }
  };

  // Głosy dla wybranego silnika
  const activeVoices = useMemo(() => {
    if (ttsEngine === 'edge') return EDGE_DEFAULT_VOICES;
    if (ttsEngine === 'elevenlabs') return ELEVENLABS_DEFAULT_VOICES;
    if (ttsEngine === 'fish_audio') return FISH_AUDIO_DEFAULT_VOICES;
    if (ttsEngine === 'openai') return OPENAI_DEFAULT_VOICES;
    if (ttsEngine === 'google') return GOOGLE_DEFAULT_VOICES;
    if (ttsEngine === 'browser') {
      return browserVoicesList.length > 0 ? browserVoicesList : BROWSER_DEFAULT_VOICES;
    }
    return EDGE_DEFAULT_VOICES;
  }, [ttsEngine, browserVoicesList]);

  return (
    <div className="flex-1 bg-background text-on-surface min-h-screen pb-24 font-body-md selection:bg-primary/20 selection:text-primary max-w-full overflow-x-hidden">
      {/* Toast Alert */}
      {savedToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-surface-container-highest border border-primary/40 rounded-xl shadow-2xl text-primary font-mono text-xs tracking-wider animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Systemowy */}
      <div className="px-6 lg:px-10 pt-8 pb-6 border-b border-outline-variant/30 bg-surface-container-lowest/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-outline tracking-widest uppercase mb-1">
              <span>OMNIDASH // KERNEL // CONFIGURATION & ENGINES</span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-headline-xl font-bold tracking-tight text-on-surface">
              Centrum Dowodzenia i Konfiguracji
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Architektura wielosilnikowa: motywy wizualne, synteza TTS, agenty LPU, geolokalizacja i skarbiec bezpieczeństwa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-surface-container-high border border-outline-variant/40 font-mono text-xs text-primary font-semibold">
              THEME: {theme.toUpperCase()}
            </span>
            <span className="px-2.5 py-1 rounded bg-surface-container-high border border-outline-variant/40 font-mono text-xs text-secondary font-semibold">
              TTS: {ttsEngine.toUpperCase()}
            </span>
            <span className="px-2.5 py-1 rounded bg-surface-container-high border border-outline-variant/40 font-mono text-xs text-on-surface-variant">
              SEC: SHIELD [OK]
            </span>
          </div>
        </div>

        {/* Zakładki Nawigacji */}
        <div className="max-w-7xl mx-auto mt-8 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'kernel', label: 'Jądro & Motywy', icon: Palette },
            { id: 'voice_tts', label: 'Głos & TTS / STT', icon: Volume2 },
            { id: 'ai_models', label: 'Sztuczna Inteligencja', icon: Cpu },
            { id: 'geo_weather', label: 'Geolokalizacja', icon: Compass },
            { id: 'notifications', label: 'Powiadomienia & Push', icon: Bell },
            { id: 'ergonomics_ui', label: 'Ergonomia & Apple UI', icon: Sliders },
            { id: 'database_cloud', label: 'Baza & Bezpieczeństwo', icon: Database },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium font-mono whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-on-primary font-bold shadow-lg shadow-primary/20 scale-[1.02]'
                    : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container border border-outline-variant/30'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Główna Zawartość Zakładek */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 mt-8">

        {/* 1. JĄDRO & MOTYWY */}
        {activeTab === 'kernel' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Kreator Konfiguracji & Integracje API */}
            <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Kreator Konfiguracji Systemowej (Setup Wizard)
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Uruchom ponownie interaktywny panel wprowadzający: tożsamość, tryby API, klucze i kafelki HUD.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('openSetupWizard'))}
                  className="px-4 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs font-mono shadow-md hover:bg-primary-fixed-dim transition-all active:scale-95 shrink-0"
                >
                  {"[>] URUCHOM KREATOR ONBOARDINGU"}
                </button>
              </div>

              <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${librusIntegrationEnabled ? 'bg-secondary animate-pulse' : 'bg-primary'}`} />
                  <div>
                    <span className="font-mono text-xs font-bold text-on-surface block">
                      {librusIntegrationEnabled ? 'Integracja Librus Synergia API: WŁĄCZONA' : 'Tryb Autonomiczny (Bez Librus API): AKTYWNY'}
                    </span>
                    <span className="text-[11px] text-on-surface-variant">
                      {librusIntegrationEnabled
                        ? 'Plan lekcji i oceny są synchronizowane z kontem szkolnym Librus.'
                        : 'Plan dnia i oceny działają w 100% lokalnie w SQLite i Firestore bez scrapera Librus.'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={toggleLibrusIntegration}
                  className={`px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold border transition-all shrink-0 ${
                    librusIntegrationEnabled
                      ? 'bg-secondary/20 text-secondary border-secondary/40 hover:bg-secondary/30'
                      : 'bg-primary/20 text-primary border-primary/40 hover:bg-primary/30'
                  }`}
                >
                  {librusIntegrationEnabled ? 'Przełącz na Tryb Autonomiczny' : 'Włącz Librus API'}
                </button>
              </div>
            </div>

            {/* Siatka Motywów */}
            <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
                    <Palette className="w-5 h-5 text-primary" />
                    Wizualne Jądro Systemu (7 Dynamicznych Motywów)
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Wybór motywu dynamicznie przełącza paletę barw CSS, tła, krawędzie, akcenty i fonty w całym ekosystemie.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                {THEME_PRESETS.map((t) => {
                  const isCurrent = theme === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => handleSelectTheme(t.id)}
                      className={`relative cursor-pointer rounded-xl p-4 border transition-all duration-200 flex flex-col justify-between overflow-hidden group ${
                        isCurrent
                          ? 'border-primary ring-2 ring-primary/30 bg-surface-container-high'
                          : 'border-outline-variant/30 hover:border-outline-variant bg-surface-container-lowest hover:bg-surface-container'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-xs font-mono font-bold text-on-surface flex items-center gap-1.5">
                            {t.name}
                            {isCurrent && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/20 text-primary font-mono font-bold">
                                [OK]
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-on-surface-variant font-mono mt-0.5">{t.sub}</div>
                        </div>
                        <div
                          className="w-4 h-4 rounded-full border border-white/20 shadow-inner"
                          style={{ backgroundColor: t.accent1 }}
                        />
                      </div>

                      {/* Podgląd kolorów */}
                      <div className="my-4 p-2.5 rounded-lg border border-white/5 space-y-2" style={{ backgroundColor: t.bg }}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: t.accent1 }} />
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: t.accent2 }} />
                          <span className="text-[10px] font-mono text-white/70">{t.font}</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden bg-white/10">
                          <div className={`h-full w-2/3 ${t.barClass}`} />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono text-outline pt-2 border-t border-outline-variant/20">
                        <span>{t.code}</span>
                        <span className="text-primary group-hover:underline">Wybierz &rarr;</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Macierz Widoczności Modułów */}
            <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
                    <Layers className="w-5 h-5 text-secondary" />
                    Macierz Modułów i Nawigacji Shell (13 Modułów)
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Włączaj lub ukrywaj dowolne moduły na bocznym pasku nawigacji Sidebar w czasie rzeczywistym.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const allOn = {};
                      NAV_MODULES_CONFIG.forEach(m => { allOn[m.id] = true; });
                      setVisibleNav(allOn);
                      localStorage.setItem('system_visible_nav', JSON.stringify(allOn));
                      window.dispatchEvent(new CustomEvent('visibleNavChanged', { detail: allOn }));
                      triggerToast('[+] WŁĄCZONO WSZYSTKIE MODUŁY');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-surface-container-high border border-outline-variant/40 text-xs font-mono text-on-surface hover:bg-surface-container-highest"
                  >
                    Włącz Wszystkie
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {NAV_MODULES_CONFIG.map((mod) => {
                  const isVisible = visibleNav[mod.id] !== false;
                  return (
                    <div
                      key={mod.id}
                      onClick={() => handleToggleNav(mod.id)}
                      className={`cursor-pointer p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                        isVisible
                          ? 'border-outline-variant/50 bg-surface-container'
                          : 'border-outline-variant/20 bg-surface-container-lowest/50 opacity-60'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isVisible ? 'bg-primary' : 'bg-outline'}`} />
                          <span className="text-xs font-bold text-on-surface truncate">{mod.name}</span>
                          <span className="text-[10px] font-mono text-outline uppercase">[{mod.path}]</span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant line-clamp-1 mt-1">{mod.desc}</p>
                      </div>
                      <div className={`w-8 h-4 rounded-full p-0.5 transition-colors flex items-center flex-shrink-0 ${isVisible ? 'bg-primary' : 'bg-surface-container-highest'}`}>
                        <div className={`w-3 h-3 rounded-full bg-on-primary transition-transform ${isVisible ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Kopia Zapasowa & Migawki */}
            <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-on-surface flex items-center gap-2 mb-2">
                <HardDrive className="w-5 h-5 text-tertiary" />
                Trwałość Konfiguracji & Migawki Danych
              </h2>
              <p className="text-xs text-on-surface-variant mb-6">
                Eksportuj, twórz kopie zapasowe SQLite WAL lub przywracaj pełny stan ekosystemu z pliku JSON.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleExportJson}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary font-mono text-xs font-bold shadow hover:opacity-90"
                >
                  <Download className="w-4 h-4" />
                  Eksportuj Pełny Konfig (JSON)
                </button>
                <button
                  onClick={handleDownloadSqlDump}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/40 text-on-surface font-mono text-xs font-bold hover:bg-surface-container-highest"
                >
                  <Database className="w-4 h-4 text-tertiary" />
                  Pobierz Zrzut SQL WAL
                </button>
                <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/40 text-on-surface font-mono text-xs font-bold hover:bg-surface-container-highest cursor-pointer">
                  <Upload className="w-4 h-4 text-secondary" />
                  Importuj Plik JSON
                  <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* 2. GŁOS & TTS / STT */}
        {activeTab === 'voice_tts' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Wybór Silnika TTS */}
            <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-on-surface flex items-center gap-2 mb-1">
                <Volume2 className="w-5 h-5 text-primary" />
                Silnik Syntezy Mowy (Text-to-Speech)
              </h2>
              <p className="text-xs text-on-surface-variant mb-6">
                Wybierz silnik generowania głosu. Domyślny Microsoft Edge TTS działa natychmiastowo, za darmo i bez limitów.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { id: 'edge', name: 'Microsoft Edge TTS', tag: 'Darmowy / Chmura', desc: 'Najwyższa płynność, zerowe koszty, naturalne głosy Marek i Zofia bez podawania klucza API.' },
                  { id: 'elevenlabs', name: 'ElevenLabs AI', tag: 'Hyper-Realistyczny', desc: 'Emocjonalny, ultra-realistyczny głos ludzki. Wymaga klucza ElevenLabs API i monitoruje limit quota.' },
                  { id: 'fish_audio', name: 'Fish Audio', tag: 'Neural Clone', desc: 'Nowoczesny silnik klonowania głosu AI, doskonały do spersonalizowanego brzmienia asystenta.' },
                  { id: 'browser', name: 'Web Speech API', tag: 'Lokalny / Offline', desc: 'Standardowa synteza mowy wbudowana bezpośrednio w Twoją przeglądarkę (Chrome / Edge / Opera).' },
                  { id: 'openai', name: 'OpenAI TTS', tag: 'TTS-1 / Onyx', desc: 'Silnik OpenAI (alloy, onyx, echo, nova) zoptymalizowany pod kątem precyzyjnej dykcji.' },
                  { id: 'google', name: 'Google Cloud WaveNet', tag: 'Free Tier 1M', desc: 'Oficjalna synteza Google Cloud Text-to-Speech z pulą 1 000 000 znaków w darmowym pakiecie.' }
                ].map((eng) => {
                  const isCur = ttsEngine === eng.id;
                  return (
                    <div
                      key={eng.id}
                      onClick={() => handleEngineChange(eng.id)}
                      className={`cursor-pointer p-4 rounded-xl border transition-all flex flex-col justify-between ${
                        isCur
                          ? 'border-primary ring-2 ring-primary/20 bg-surface-container-high'
                          : 'border-outline-variant/30 hover:border-outline-variant bg-surface-container-lowest'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold font-mono text-on-surface">{eng.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container font-mono text-primary font-bold">
                            {eng.tag}
                          </span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant leading-relaxed mt-1">{eng.desc}</p>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-outline-variant/20 text-xs font-mono">
                        <span className={isCur ? 'text-primary font-bold' : 'text-outline'}>
                          {isCur ? '[OK] AKTYWNY' : 'Wybierz'}
                        </span>
                        <Radio className={`w-4 h-4 ${isCur ? 'text-primary' : 'text-outline'}`} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Wybór Głosu i Suwaki */}
              <div className="mt-8 pt-6 border-t border-outline-variant/30 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-xs font-mono text-outline uppercase mb-2">Aktywny Głos ({ttsEngine})</label>
                  <select
                    value={ttsVoiceId}
                    onChange={(e) => handleVoiceChange(e.target.value)}
                    className="w-full bg-surface-container-high border border-outline-variant/40 rounded-xl px-3 py-2 text-xs font-mono text-on-surface focus:border-primary outline-none"
                  >
                    {activeVoices.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.lang || v.gender || 'PL'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-outline uppercase mb-2">
                    <span>Tempo Mowy (Rate)</span>
                    <span className="text-primary font-bold">{ttsRate}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={ttsRate}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setTtsRate(val);
                      localStorage.setItem('system_tts_rate', String(val));
                    }}
                    className="w-full accent-primary"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-outline uppercase mb-2">
                    <span>Wysokość Tonu (Pitch)</span>
                    <span className="text-secondary font-bold">{ttsPitch}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.05"
                    value={ttsPitch}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setTtsPitch(val);
                      localStorage.setItem('system_tts_pitch', String(val));
                    }}
                    className="w-full accent-secondary"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-outline uppercase mb-2">
                    <span>Głośność (Volume)</span>
                    <span className="text-tertiary font-bold">{Math.round(ttsVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={ttsVolume}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setTtsVolume(val);
                      localStorage.setItem('system_tts_volume', String(val));
                    }}
                    className="w-full accent-tertiary"
                  />
                </div>
              </div>

              {/* Piaskownica Testu Mowy */}
              <div className="mt-6 p-4 rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col md:flex-row items-center gap-4">
                <input
                  type="text"
                  value={testSpeechText}
                  onChange={(e) => setTestSpeechText(e.target.value)}
                  placeholder="Wpisz frazę testową do syntezy głosu..."
                  className="flex-1 bg-surface-container-high border border-outline-variant/40 rounded-xl px-4 py-2 text-xs font-mono text-on-surface focus:border-primary outline-none"
                />
                <button
                  onClick={handlePlayVoiceTest}
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-mono font-bold transition-all shadow ${
                    isSpeaking
                      ? 'bg-error text-on-error animate-pulse'
                      : 'bg-primary text-on-primary hover:opacity-90'
                  }`}
                >
                  {isSpeaking ? (
                    <>
                      <Square className="w-3.5 h-3.5" />
                      Zatrzymaj
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      Odtwórz Próbkę Głosu
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Asystent Głosu & WakeWord ("Hej Omni") */}
            <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
                    <Radio className="w-5 h-5 text-secondary" />
                    Wykrywanie Słowa Wybudzającego (WakeWord: "Hej Omni")
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Cichy nasłuch mikrofonu w tle (Silent Listening Mode). Po wykryciu frazy asystent przechodzi w tryb interaktywny.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-outline">
                    {wakeWordEnabled ? '[+] NASŁUCH AKTYWNY' : '[-] NASŁUCH WYŁĄCZONY'}
                  </span>
                  <div
                    onClick={() => handleToggleWakeWord(!wakeWordEnabled)}
                    className={`w-12 h-6 rounded-full p-0.5 cursor-pointer transition-colors flex items-center ${
                      wakeWordEnabled ? 'bg-primary' : 'bg-surface-container-highest'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${wakeWordEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-outline-variant/20">
                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-outline uppercase mb-2">
                    <span>Czułość Mikrofonu i Detekcji</span>
                    <span className="text-primary font-bold">{wakeSensitivity}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={wakeSensitivity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setWakeSensitivity(val);
                      localStorage.setItem('system_wakeword_sensitivity', String(val));
                    }}
                    className="w-full accent-primary"
                  />
                  <p className="text-[11px] text-on-surface-variant mt-2">
                    Wyższa czułość ułatwia wybudzenie z większej odległości, ale może reagować na szumy otoczenia.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-container border border-outline-variant/30 text-xs font-mono space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-outline">Wsparcie Web Speech API:</span>
                    <span className="text-primary font-bold">
                      {wakeWordService.isSupported() ? '[+] OBSŁUGIWANE' : '[!] BRAK W TEJ PRZEGLĄDARCE'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-outline">Rozpoznawane Frazy:</span>
                    <span className="text-on-surface">"Hej Omni", "Omnidash", "Asystencie"</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-outline">Status mikrofonu:</span>
                    <span className="text-secondary font-bold">
                      {wakeWordEnabled ? 'NASŁUCHUJE W TLE' : 'UŚPIONY'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. SZTUCZNA INTELIGENCJA & LPU */}
        {activeTab === 'ai_models' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Wybór Modelu LLM */}
            <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-on-surface flex items-center gap-2 mb-1">
                <Cpu className="w-5 h-5 text-primary" />
                Główny Model Językowy Asystenta (LPU / Cloud)
              </h2>
              <p className="text-xs text-on-surface-variant mb-6">
                Wybierz silnik inferencji logicznej wykorzystywany do czatu, analizy narzędziowej i planowania.
              </p>

              <div className="space-y-3">
                {AI_MODELS.map((m) => {
                  const isCur = aiModel === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => {
                        setAiModel(m.id);
                        localStorage.setItem('system_ai_model', m.id);
                        triggerToast(`[+] MODEL WYBRANY: ${m.name}`);
                      }}
                      className={`cursor-pointer p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                        isCur
                          ? 'border-primary ring-2 ring-primary/20 bg-surface-container-high'
                          : 'border-outline-variant/30 hover:border-outline-variant bg-surface-container-lowest'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono text-on-surface">{m.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container font-mono text-secondary font-semibold">
                            {m.provider}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container font-mono text-primary font-bold">
                            {m.speed}
                          </span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant mt-1">{m.desc}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-mono font-bold ${isCur ? 'text-primary' : 'text-outline'}`}>
                          {isCur ? '[OK] DOMYŚLNY' : 'Wybierz'}
                        </span>
                        <Radio className={`w-4 h-4 ${isCur ? 'text-primary' : 'text-outline'}`} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Limit Kontekstu i Uprawnienia Narzędzi */}
              <div className="mt-8 pt-6 border-t border-outline-variant/30 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-outline uppercase mb-2">
                    <span>Okno Pamięci Kontekstowej</span>
                    <span className="text-primary font-bold">{aiContextLimit.toLocaleString()} tokenów</span>
                  </div>
                  <input
                    type="range"
                    min="4000"
                    max="128000"
                    step="4000"
                    value={aiContextLimit}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setAiContextLimit(val);
                      localStorage.setItem('system_ai_context_limit', String(val));
                    }}
                    className="w-full accent-primary"
                  />
                  <p className="text-[11px] text-on-surface-variant mt-2">
                    Maksymalny bufor wiadomości i dokumentów przekazywany do modelu w pojedynczym zapytaniu.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-mono text-outline uppercase mb-2">
                    Autonomiczne Uprawnienia Agenta
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    {[
                      { id: 'webSearch', label: 'Brave Search Live' },
                      { id: 'fileAccess', label: 'Dostęp do Plików' },
                      { id: 'dbQuery', label: 'Zapytania SQLite WAL' },
                      { id: 'pushNotify', label: 'Wysyłka Pushbullet' }
                    ].map((tool) => {
                      const enabled = aiTools[tool.id] !== false;
                      return (
                        <div
                          key={tool.id}
                          onClick={() => {
                            const updated = { ...aiTools, [tool.id]: !enabled };
                            setAiTools(updated);
                            localStorage.setItem('system_ai_tools', JSON.stringify(updated));
                          }}
                          className={`cursor-pointer p-2 rounded-lg border flex items-center justify-between ${
                            enabled ? 'border-primary/40 bg-surface-container text-on-surface' : 'border-outline-variant/20 bg-surface-container-lowest text-outline'
                          }`}
                        >
                          <span>{tool.label}</span>
                          <span className={enabled ? 'text-primary' : 'text-outline'}>
                            {enabled ? '[ON]' : '[OFF]'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Prompt Systemowy */}
              <div className="mt-6 pt-6 border-t border-outline-variant/30">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-mono text-outline uppercase">
                    Główny Prompt Systemowy (Rola & Zasady Asystenta)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const p = 'Jesteś Omni, elitarnym autonomicznym systemem operacyjnym i asystentem inżynieryjnym Jakuba Lisa. Udzielasz zwięzłych, technicznych i bezkompromisowo precyzyjnych odpowiedzi.';
                        setAiSystemPrompt(p);
                        localStorage.setItem('system_ai_system_prompt', p);
                        triggerToast('[+] PRESET INŻYNIER ZAŁADOWANY');
                      }}
                      className="text-[10px] font-mono px-2 py-1 rounded bg-surface-container-high border border-outline-variant/30 text-on-surface-variant hover:text-on-surface"
                    >
                      Inżynier Core
                    </button>
                    <button
                      onClick={() => {
                        const p = 'Działasz jako doradca strategiczny i analityk finansowy. Priorytetyzujesz oszczędności, optymalizację budżetów kopertowych i planowanie długoterminowe.';
                        setAiSystemPrompt(p);
                        localStorage.setItem('system_ai_system_prompt', p);
                        triggerToast('[+] PRESET FINANSE ZAŁADOWANY');
                      }}
                      className="text-[10px] font-mono px-2 py-1 rounded bg-surface-container-high border border-outline-variant/30 text-on-surface-variant hover:text-on-surface"
                    >
                      Analityk Finansowy
                    </button>
                  </div>
                </div>
                <textarea
                  rows={3}
                  value={aiSystemPrompt}
                  onChange={(e) => {
                    setAiSystemPrompt(e.target.value);
                    localStorage.setItem('system_ai_system_prompt', e.target.value);
                  }}
                  className="w-full bg-surface-container-high border border-outline-variant/40 rounded-xl p-3 text-xs font-mono text-on-surface focus:border-primary outline-none resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* 4. GEOLOKALIZACJA & POGODA */}
        {activeTab === 'geo_weather' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
                    <Compass className="w-5 h-5 text-primary" />
                    Moduł Pozycjonowania i Stacji Meteorologicznych
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Koordynaty GPS zasilają widget pogody Open-Meteo, kalkulator odległości oraz asystenta dojazdów.
                  </p>
                </div>
                <button
                  onClick={handleDetectGps}
                  disabled={isDetectingGps}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary font-mono text-xs font-bold shadow hover:opacity-90 disabled:opacity-50"
                >
                  <Navigation className={`w-4 h-4 ${isDetectingGps ? 'animate-spin' : ''}`} />
                  {isDetectingGps ? 'Wykrywanie GPS...' : 'Wykryj Moją Lokację GPS'}
                </button>
              </div>

              {/* Aktualna Pozycja */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl bg-surface-container border border-outline-variant/30 font-mono text-xs">
                <div>
                  <span className="text-outline uppercase text-[10px] block">Miasto / Region</span>
                  <span className="text-on-surface font-bold text-sm">{location?.city || 'Starogard Gdański'}</span>
                </div>
                <div>
                  <span className="text-outline uppercase text-[10px] block">Szerokość (Lat)</span>
                  <span className="text-primary font-bold text-sm">{location?.latitude?.toFixed(4) || '53.9642'}° N</span>
                </div>
                <div>
                  <span className="text-outline uppercase text-[10px] block">Długość (Lon)</span>
                  <span className="text-secondary font-bold text-sm">{location?.longitude?.toFixed(4) || '18.5283'}° E</span>
                </div>
                <div>
                  <span className="text-outline uppercase text-[10px] block">Dokładność</span>
                  <span className="text-tertiary font-bold text-sm">&plusmn; {Math.round(location?.accuracy || 15)} m</span>
                </div>
              </div>

              {/* Presety Stacji */}
              <div className="mt-6 pt-6 border-t border-outline-variant/30">
                <label className="block text-xs font-mono text-outline uppercase mb-3">
                  Wybierz Gotową Stację Meteorologiczną
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {WEATHER_STATIONS.map((st) => (
                    <div
                      key={st.name}
                      onClick={() => {
                        const newLoc = { ...location, city: st.name.split(' ')[0], latitude: st.lat, longitude: st.lon };
                        setLocation(newLoc);
                        saveLocation(newLoc);
                        triggerToast(`[+] STACJA WYBRANA: ${st.name}`);
                      }}
                      className="cursor-pointer p-3 rounded-xl border border-outline-variant/30 hover:border-primary bg-surface-container hover:bg-surface-container-high transition-all text-xs font-mono"
                    >
                      <MapPin className="w-3.5 h-3.5 text-primary mb-1" />
                      <div className="font-bold text-on-surface truncate">{st.name.split(' ')[0]}</div>
                      <div className="text-[10px] text-outline mt-0.5">{st.lat}° / {st.lon}°</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. POWIADOMIENIA & PUSHBULLET */}
        {activeTab === 'notifications' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-on-surface flex items-center gap-2 mb-1">
                <Smartphone className="w-5 h-5 text-primary" />
                Integracja ze Smartfonem (Pushbullet Cloud Bridge)
              </h2>
              <p className="text-xs text-on-surface-variant mb-6">
                Wysyłaj automatyczne powiadomienia o ocenach Librus, budżetach finansowych i alertach GCP bezpośrednio na telefon.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-outline uppercase mb-2">
                    Pushbullet Access Token
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type={showPushbulletKey ? 'text' : 'password'}
                      value={pushbulletKey}
                      onChange={(e) => setPushbulletKey(e.target.value)}
                      placeholder="o.pb_tok_••••••••••••••••••••••••"
                      className="flex-1 bg-surface-container-high border border-outline-variant/40 rounded-xl px-4 py-2.5 text-xs font-mono text-on-surface focus:border-primary outline-none"
                    />
                    <button
                      onClick={() => setShowPushbulletKey(!showPushbulletKey)}
                      className="px-3 py-2.5 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-mono text-on-surface-variant hover:text-on-surface"
                    >
                      {showPushbulletKey ? 'Ukryj' : 'Pokaż'}
                    </button>
                    <button
                      onClick={handleTestPushbullet}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary font-mono text-xs font-bold shadow hover:opacity-90"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Test Push
                    </button>
                  </div>
                </div>

                {pushStatus && (
                  <div className={`p-3.5 rounded-xl border text-xs font-mono ${
                    pushStatus.success
                      ? 'bg-primary/10 border-primary/40 text-primary'
                      : 'bg-error/10 border-error/40 text-error'
                  }`}>
                    {pushStatus.success
                      ? `[+] SUKCES: Połączono z kontem: ${pushStatus.user}. Powiadomienie wysłane na smartfon!`
                      : `[!] BŁĄD PUSHBULLET: ${pushStatus.error}`}
                  </div>
                )}
              </div>

              {/* Kanały Powiadomień */}
              <div className="mt-8 pt-6 border-t border-outline-variant/30">
                <label className="block text-xs font-mono text-outline uppercase mb-4">
                  Kanały Zdarzeń Wysyłających Powiadomienia na Telefon
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { id: 'librus', title: 'Librus: Oceny i Uwagi', desc: 'Powiadomienie o nowej ocenie zaraz po synchronizacji' },
                    { id: 'finances', title: 'Finanse: Limity Kopert', desc: 'Alert o przekroczeniu 90% budżetu w danej kategorii' },
                    { id: 'schedule', title: 'Plan Dnia: Przypomnienia', desc: 'Alert 15 minut przed rozpoczęciem kolejnej lekcji' },
                    { id: 'workouts', title: 'Treningi: Dni Sesji', desc: 'Przypomnienie o zaplanowanym treningu FBW' },
                    { id: 'gcpBudget', title: 'GCP Cloud: Alert Budżetowy', desc: 'Alert kosztów infrastruktury Google Cloud' }
                  ].map((ch) => {
                    const active = pushChannels[ch.id] !== false;
                    return (
                      <div
                        key={ch.id}
                        onClick={() => {
                          const updated = { ...pushChannels, [ch.id]: !active };
                          setPushChannels(updated);
                          localStorage.setItem('system_notification_channels', JSON.stringify(updated));
                        }}
                        className={`cursor-pointer p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                          active
                            ? 'border-outline-variant/50 bg-surface-container'
                            : 'border-outline-variant/20 bg-surface-container-lowest opacity-60'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-on-surface">{ch.title}</div>
                          <div className="text-[11px] text-on-surface-variant mt-0.5">{ch.desc}</div>
                        </div>
                        <div className={`w-8 h-4 rounded-full p-0.5 transition-colors flex items-center flex-shrink-0 ${active ? 'bg-primary' : 'bg-surface-container-highest'}`}>
                          <div className={`w-3 h-3 rounded-full bg-on-primary transition-transform ${active ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. ERGONOMIA & APPLE UI */}
        {activeTab === 'ergonomics_ui' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-on-surface flex items-center gap-2 mb-1">
                <Sliders className="w-5 h-5 text-primary" />
                Ergonomia Interfejsu & Apple Design System
              </h2>
              <p className="text-xs text-on-surface-variant mb-6">
                Dostosuj zachowanie zegara, fizykę animacji, gęstość danych oraz kategorie paska informacyjnego.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Zegar 24h */}
                <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/30 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-on-surface">Format 24-godzinny</div>
                    <div className="text-[11px] text-on-surface-variant mt-0.5">Domyślny format europejski</div>
                  </div>
                  <div
                    onClick={() => {
                      const next = !clock24h;
                      setClock24h(next);
                      localStorage.setItem('system_clock_24h', String(next));
                    }}
                    className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors flex items-center ${
                      clock24h ? 'bg-primary' : 'bg-surface-container-highest'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${clock24h ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </div>

                {/* Sekundy w zegarze */}
                <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/30 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-on-surface">Wyświetlaj Sekundy</div>
                    <div className="text-[11px] text-on-surface-variant mt-0.5">Sekundnik czasu rzeczywistego</div>
                  </div>
                  <div
                    onClick={() => {
                      const next = !clockSeconds;
                      setClockSeconds(next);
                      localStorage.setItem('system_clock_seconds', String(next));
                    }}
                    className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors flex items-center ${
                      clockSeconds ? 'bg-primary' : 'bg-surface-container-highest'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${clockSeconds ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </div>

                {/* Apple Spring Animations */}
                <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/30 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-on-surface">Animacje Apple Spring</div>
                    <div className="text-[11px] text-on-surface-variant mt-0.5">Fizyczne sprężyste przejścia</div>
                  </div>
                  <div
                    onClick={() => {
                      const next = !springAnim;
                      setSpringAnim(next);
                      localStorage.setItem('system_spring_animations', String(next));
                    }}
                    className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors flex items-center ${
                      springAnim ? 'bg-primary' : 'bg-surface-container-highest'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${springAnim ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </div>

                {/* Tryb Kompaktowy */}
                <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/30 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-on-surface">Tryb Kompaktowy HUD</div>
                    <div className="text-[11px] text-on-surface-variant mt-0.5">Gęstsze ułożenie kart</div>
                  </div>
                  <div
                    onClick={() => {
                      const next = !compactMode;
                      setCompactMode(next);
                      localStorage.setItem('system_compact_mode', String(next));
                    }}
                    className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors flex items-center ${
                      compactMode ? 'bg-primary' : 'bg-surface-container-highest'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${compactMode ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </div>
              </div>

              {/* Glassmorphism Slider */}
              <div className="mt-8 pt-6 border-t border-outline-variant/30">
                <div className="flex items-center justify-between text-xs font-mono text-outline uppercase mb-2">
                  <span>Rozmycie Szklane Glassmorphism (Backdrop Blur)</span>
                  <span className="text-primary font-bold">{blurLevel}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="24"
                  value={blurLevel}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setBlurLevel(val);
                    localStorage.setItem('system_blur_level', String(val));
                  }}
                  className="w-full accent-primary"
                />
              </div>

              {/* Kategorie News Ticker RSS */}
              <div className="mt-8 pt-6 border-t border-outline-variant/30">
                <label className="block text-xs font-mono text-outline uppercase mb-3">
                  Aktywne Kategorie Paska Informacyjnego (News Ticker)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {NEWS_CATEGORIES.slice(0, 12).map((cat) => {
                    const isSel = selectedNewsCategories.includes(cat.id);
                    return (
                      <div
                        key={cat.id}
                        onClick={() => {
                          const updated = isSel
                            ? selectedNewsCategories.filter(x => x !== cat.id)
                            : [...selectedNewsCategories, cat.id];
                          setSelectedNewsCategories(updated);
                          localStorage.setItem('system_news_categories', JSON.stringify(updated));
                        }}
                        className={`cursor-pointer p-2.5 rounded-xl border text-xs font-mono flex items-center justify-between transition-all ${
                          isSel
                            ? 'border-primary/50 bg-surface-container text-on-surface font-bold'
                            : 'border-outline-variant/20 bg-surface-container-lowest text-outline'
                        }`}
                      >
                        <span className="truncate">{cat.label}</span>
                        <span className="text-[10px]">{isSel ? '[+]' : '[-]'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7. BAZA DANYCH & BEZPIECZEŃSTWO */}
        {activeTab === 'database_cloud' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Synchronizacja Chmury Firestore */}
            <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
                    <Database className="w-5 h-5 text-primary" />
                    Inicjalizacja i Stan Chmury Firebase Firestore
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Zapewnia obecność 11 kolekcji (tasks, finances, workouts, calendar, notes, timetable, etc.).
                  </p>
                </div>
                <button
                  onClick={handleInitCloudCollections}
                  disabled={isInitializingCloud}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary font-mono text-xs font-bold shadow hover:opacity-90 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isInitializingCloud ? 'animate-spin' : ''}`} />
                  {isInitializingCloud ? 'Inicjalizowanie...' : 'Zainicjalizuj 11 Kolekcji Firestore'}
                </button>
              </div>

              {cloudInitReport && (
                <div className="mt-4 p-4 rounded-xl bg-surface-container border border-primary/30 font-mono text-xs">
                  <div className="text-primary font-bold mb-2">[+] RAPORT ZAINICJALIZOWANYCH KOLEKCJI:</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-on-surface-variant">
                    {Object.entries(cloudInitReport).map(([col, cnt]) => (
                      <div key={col} className="p-2 rounded bg-surface-container-high border border-white/5">
                        <span className="text-outline uppercase text-[10px] block">{col}</span>
                        <span className="text-on-surface font-bold">{cnt} rekordów</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Skarbiec Kluczy API */}
            <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-on-surface flex items-center gap-2 mb-1">
                <Key className="w-5 h-5 text-secondary" />
                Skarbiec Kluczy API & Poświadczeń (Vault)
              </h2>
              <p className="text-xs text-on-surface-variant mb-6">
                Wszystkie poufne klucze są przechowywane lokalnie z maskowaniem. Kliknij, aby zaktualizować poświadczenie.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { keyId: 'groqKey', label: 'Groq API Key (LPU)', val: credentials.groqKey },
                  { keyId: 'braveKey', label: 'Brave Search API Key', val: credentials.braveKey },
                  { keyId: 'pushbulletKey', label: 'Pushbullet Access Token', val: credentials.pushbulletKey },
                  { keyId: 'librusSession', label: 'Librus Synergia Token', val: credentials.librusSession },
                ].map((c) => (
                  <div
                    key={c.keyId}
                    onClick={() => {
                      setActiveCredModal(c.keyId);
                      setModalKeyInput('');
                    }}
                    className="cursor-pointer p-4 rounded-xl border border-outline-variant/30 hover:border-secondary bg-surface-container hover:bg-surface-container-high transition-all flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold font-mono text-on-surface">{c.label}</div>
                      <div className="text-[11px] font-mono text-outline mt-1">{c.val}</div>
                    </div>
                    <span className="text-xs font-mono text-secondary hover:underline">Edytuj &rarr;</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Polityki Bezpieczeństwa */}
            <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-on-surface flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-tertiary" />
                Polityki Ochronne & Sandboxing
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { id: 'antiSsrf', label: 'Anti-SSRF Protection', desc: 'Blokuje pętle zwrotne i adresy prywatne' },
                  { id: 'toolCallingGuard', label: 'Tool Calling Sandbox', desc: 'Weryfikacja argumentów funkcji agenta' },
                  { id: 'zeroEmoji', label: 'Zero-Emoji Strict Policy', desc: 'Format inżynieryjny wg Protokołu Antigravity' },
                  { id: 'sqlCipher', label: 'SQLCipher AES-256', desc: 'Trwałe szyfrowanie magazynu SQLite' },
                  { id: 'pinAuth', label: 'PIN Authentication Lock', desc: 'Wymóg kodu PIN przy odblokowywaniu' }
                ].map((pol) => {
                  const active = policies[pol.id];
                  return (
                    <div
                      key={pol.id}
                      onClick={() => handleTogglePolicy(pol.id)}
                      className={`cursor-pointer p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                        active
                          ? 'border-outline-variant/50 bg-surface-container'
                          : 'border-outline-variant/20 bg-surface-container-lowest opacity-60'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-on-surface">{pol.label}</div>
                        <div className="text-[11px] text-on-surface-variant mt-0.5">{pol.desc}</div>
                      </div>
                      <div className={`w-8 h-4 rounded-full p-0.5 transition-colors flex items-center flex-shrink-0 ${active ? 'bg-tertiary' : 'bg-surface-container-highest'}`}>
                        <div className={`w-3 h-3 rounded-full bg-on-tertiary transition-transform ${active ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Strefa Niebezpieczna */}
            <div className="p-6 rounded-2xl border border-error/30 bg-error/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-error flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-error" />
                  Strefa Niebezpieczna: Reset do Ustawień Fabrycznych
                </h3>
                <p className="text-xs text-error/80 mt-1">
                  Ta operacja bezpowrotnie wyczyści pamięć podręczną, klucze API i przywróci stan zerowy.
                </p>
              </div>
              <button
                onClick={handleFactoryReset}
                className="px-4 py-2.5 rounded-xl bg-error text-on-error font-mono text-xs font-bold hover:bg-error/90 whitespace-nowrap shadow"
              >
                FACTORY RESET
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Edycji Poświadczenia */}
      {activeCredModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container-low border border-outline-variant/50 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-on-surface font-headline-md mb-1">
              Aktualizacja Poświadczenia Skarbca
            </h3>
            <p className="text-xs text-on-surface-variant font-mono mb-4">
              Identyfikator: <span className="text-primary font-bold">{activeCredModal}</span>
            </p>
            <input
              type="text"
              autoFocus
              value={modalKeyInput}
              onChange={(e) => setModalKeyInput(e.target.value)}
              placeholder="Wprowadź nowy klucz API..."
              className="w-full bg-surface-container-high border border-outline-variant/50 rounded-xl px-4 py-3 text-xs font-mono text-on-surface focus:border-primary outline-none mb-6"
            />
            <div className="flex items-center justify-end gap-3 font-mono text-xs">
              <button
                onClick={() => setActiveCredModal(null)}
                className="px-4 py-2 rounded-xl text-on-surface-variant hover:text-on-surface"
              >
                Anuluj
              </button>
              <button
                onClick={handleSaveModalCred}
                className="px-5 py-2 rounded-xl bg-primary text-on-primary font-bold shadow hover:opacity-90"
              >
                Zapisz Klucz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
