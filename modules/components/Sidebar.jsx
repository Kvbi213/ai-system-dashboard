import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, MessageSquare, Search, Settings, ChevronLeft, ChevronRight, 
  LayoutGrid, CalendarDays, BrainCircuit, Crosshair, Wallet, Dumbbell, 
  Server, GraduationCap, Award, Menu, X, Palette, Sun, Moon, Mic, FolderTree,
  Lock, ShieldCheck, User
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const THEME_CHIPS = [
  { id: 'dark', label: 'Obsidian Dark', bg: '#121316', accent: '#ADC6FF', rgb: '173 198 255' },
  { id: 'retro', label: 'Retro Amber', bg: '#140E05', accent: '#FFB000', rgb: '255 176 0' },
  { id: 'monochrome', label: 'Monochrome', bg: '#0A0A0C', accent: '#F5F5F5', rgb: '245 245 245' },
  { id: 'matrix', label: 'Matrix Green', bg: '#020B04', accent: '#00FF41', rgb: '0 255 65' },
  { id: 'synthwave', label: 'Synthwave', bg: '#120824', accent: '#FF0080', rgb: '255 0 128' },
  { id: 'nordic', label: 'Nordic Frost', bg: '#0A131F', accent: '#38BDF8', rgb: '56 189 248' },
  { id: 'light', label: 'Paper Light', bg: '#F4F4F5', accent: '#009944', rgb: '0 153 68' }
];

const Sidebar = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('system_sidebar_collapsed') === 'true';
  });

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [userName, setUserName] = useState(() => localStorage.getItem('system_user_name') || 'Operator');
  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem('system_theme') || 'dark');

  useEffect(() => {
    localStorage.setItem('system_sidebar_collapsed', isCollapsed);
  }, [isCollapsed]);

  // Zamknij szufladę mobilną przy zmianie trasy
  useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [location.pathname]);

  // Nasłuchiwanie zmian profilu i motywu
  useEffect(() => {
    const handleNameChange = (e) => setUserName(e.detail || 'Operator');
    const handleThemeChange = (e) => setCurrentTheme(e.detail || 'dark');
    window.addEventListener('userNameChanged', handleNameChange);
    window.addEventListener('themeChanged', handleThemeChange);
    return () => {
      window.removeEventListener('userNameChanged', handleNameChange);
      window.removeEventListener('themeChanged', handleThemeChange);
    };
  }, []);

  const [isWakeWordActive, setIsWakeWordActive] = useState(() => {
    return typeof window !== 'undefined' && localStorage.getItem('system_wake_word_enabled') !== 'false';
  });

  useEffect(() => {
    const handleWakeWordStatus = (e) => {
      if (e.detail?.isEnabled !== undefined) {
        setIsWakeWordActive(e.detail.isEnabled);
      }
    };
    window.addEventListener('wakeWordStatusChanged', handleWakeWordStatus);
    return () => window.removeEventListener('wakeWordStatusChanged', handleWakeWordStatus);
  }, []);

  // Globalny skrót Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (location.pathname !== '/search') {
          navigate('/search');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [location.pathname, navigate]);

  const DEFAULT_VISIBLE_NAV = {
    '/': true,
    '/chat': true,
    '/timetable': true,
    '/grades': true,
    '/finances': true,
    '/workouts': true,
    '/calendar': true,
    '/osint': true,
    '/entities': true,
    '/memory': true,
    '/widgets': true,
    '/server': true,
    '/settings': true
  };

  const [visibleNav, setVisibleNav] = useState(() => {
    try {
      const saved = localStorage.getItem('system_visible_nav');
      if (saved) return { ...DEFAULT_VISIBLE_NAV, ...JSON.parse(saved) };
    } catch (e) {
      console.warn(e);
    }
    return DEFAULT_VISIBLE_NAV;
  });

  useEffect(() => {
    const handleVisibleNavChanged = (e) => {
      if (e.detail && typeof e.detail === 'object') {
        setVisibleNav(e.detail);
      }
    };
    window.addEventListener('visibleNavChanged', handleVisibleNavChanged);
    return () => window.removeEventListener('visibleNavChanged', handleVisibleNavChanged);
  }, []);

  const handleOpenVoiceChat = () => {
    navigate('/chat');
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('startContinuousLiveVoice', { detail: { payload: '' } }));
    }, 100);
  };

  const navSections = [
    {
      title: 'Core Systems',
      items: [
        { name: 'Pulpit', path: '/', icon: <LayoutDashboard className="w-4 h-4 md:w-5 md:h-5" />, desc: 'Ekran główny' },
        { name: 'Omni Chat & AI', path: '/chat', icon: <MessageSquare className="w-4 h-4 md:w-5 md:h-5" />, desc: 'Konwersacja LLM' },
        { name: 'Plan Dnia', path: '/timetable', icon: <GraduationCap className="w-4 h-4 md:w-5 md:h-5" />, desc: 'Harmonogram i zajęcia' },
        { name: 'Oceny & Edukacja', path: '/grades', icon: <Award className="w-4 h-4 md:w-5 md:h-5" />, desc: 'Librus Synergia' },
        { name: 'Finanse & Koperty', path: '/finances', icon: <Wallet className="w-4 h-4 md:w-5 md:h-5" />, desc: 'Budżet 50/30/20' },
      ]
    },
    {
      title: 'Tracking & Ops',
      items: [
        { name: 'Treningi FBW', path: '/workouts', icon: <Dumbbell className="w-4 h-4 md:w-5 md:h-5" />, desc: 'Dziennik fitness' },
        { name: 'Kalendarz', path: '/calendar', icon: <CalendarDays className="w-4 h-4 md:w-5 md:h-5" />, desc: 'Terminarz' },
        { name: 'OSINT Toolkit', path: '/osint', icon: <Crosshair className="w-4 h-4 md:w-5 md:h-5" />, desc: 'OSINT Intel Hub' },
        { name: 'Baza Wiedzy & Podmioty', path: '/entities', icon: <FolderTree className="w-4 h-4 md:w-5 md:h-5" />, desc: 'Graf i relacje' },
      ]
    },
    {
      title: 'System Management',
      items: [
        { name: 'Pamięć Operatora', path: '/memory', icon: <BrainCircuit className="w-4 h-4 md:w-5 md:h-5" />, badge: 'AI', desc: 'Baza pamięci' },
        { name: 'Widżety & Metryki', path: '/widgets', icon: <LayoutGrid className="w-4 h-4 md:w-5 md:h-5" />, desc: 'Siatka telemetrii' },
        { name: 'Serwer & Logi', path: '/server', icon: <Server className="w-4 h-4 md:w-5 md:h-5" />, desc: 'Status procesów' },
        { name: 'Ustawienia', path: '/settings', icon: <Settings className="w-4 h-4 md:w-5 md:h-5" />, desc: 'Konfiguracja węzła' },
      ]
    }
  ];

  const allNavItems = navSections.flatMap(s => s.items);

  const getCurrentPageTitle = () => {
    const current = allNavItems.find(item => item.path === location.pathname);
    if (current) return current.name;
    if (location.pathname === '/settings') return 'Ustawienia';
    if (location.pathname === '/search') return 'Wyszukiwarka';
    if (location.pathname === '/entities' || location.pathname === '/podmioty') return 'Baza Wiedzy & Podmioty';
    return 'OmniDash';
  };

  const applyThemeQuick = (chip) => {
    setCurrentTheme(chip.id);
    localStorage.setItem('system_theme', chip.id);

    const root = document.documentElement;
    ['theme-light', 'theme-retro', 'theme-monochrome', 'theme-matrix', 'theme-synthwave', 'theme-nordic'].forEach(cls => {
      root.classList.remove(cls);
    });
    if (chip.id !== 'dark') {
      root.classList.add(`theme-${chip.id}`);
    }

    localStorage.setItem('system_accent', chip.rgb);
    localStorage.setItem('system_accent_hex', chip.accent);
    root.style.setProperty('--color-accent-primary', chip.rgb);
    root.style.setProperty('--color-accent-primary-hex', chip.accent);
    root.style.setProperty('--color-accent-secondary', chip.accent);

    window.dispatchEvent(new CustomEvent('themeChanged', { detail: chip.id }));
  };

  const isLightMode = currentTheme === 'light';
  const toggleDarkLight = () => {
    const targetTheme = isLightMode ? 'dark' : 'light';
    const chip = THEME_CHIPS.find(c => c.id === targetTheme) || THEME_CHIPS[0];
    applyThemeQuick(chip);
  };

  const handleLockStation = () => {
    sessionStorage.removeItem('dashboard_token');
    window.location.reload();
  };

  // 4 najważniejsze zakładki do dolnego paska mobilnego
  const mobileQuickTabs = [
    { name: 'Pulpit', path: '/', icon: LayoutDashboard },
    { name: 'Czat AI', path: '/chat', icon: MessageSquare },
    { name: 'Plan Dnia', path: '/timetable', icon: GraduationCap },
    { name: 'Finanse', path: '/finances', icon: Wallet }
  ];

  const isSecondaryRouteActive = !mobileQuickTabs.some(t => t.path === location.pathname);

  return (
    <>
      {/* ========================================================= */}
      {/* 1. MOBILNY GÓRNY PASEK APLIKACJI (TOP BAR) */}
      {/* ========================================================= */}
      <header className="flex md:hidden w-full h-14 bg-surface/90 backdrop-blur-xl border-b border-border items-center justify-between px-3.5 z-40 shrink-0 select-none pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.25)]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-primary-container/20 flex items-center justify-center border border-primary/40 text-primary shadow-[0_0_12px_rgba(77,142,255,0.2)] shrink-0">
            <ShieldCheck className="w-4 h-4 text-primary" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-sans font-bold text-sm text-on-surface truncate">{getCurrentPageTitle()}</span>
              <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-surface-container-high text-primary font-medium shrink-0">v3.0</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-mono text-on-surface-variant truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              <span>SQLite WAL • 120t/s</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={toggleDarkLight}
            className="min-w-[40px] min-h-[40px] rounded-lg bg-surface-container border border-border flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors active:scale-95"
            title={isLightMode ? "Przełącz na tryb ciemny" : "Przełącz na tryb jasny"}
            aria-label="Przełącz tryb jasny/ciemny"
          >
            {isLightMode ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          <button
            type="button"
            onClick={handleOpenVoiceChat}
            className={`min-w-[40px] min-h-[40px] rounded-lg border flex items-center justify-center transition-colors active:scale-95 relative ${
              isWakeWordActive
                ? 'bg-primary/15 border-primary/50 text-primary shadow-[0_0_10px_rgba(173,198,255,0.25)]'
                : 'bg-surface-container border-border text-on-surface-variant hover:text-on-surface'
            }`}
            title="Hej Omni // Rozmowa na żywo"
            aria-label="Hej Omni // Rozmowa na żywo"
          >
            <Mic className="w-4 h-4" />
            {isWakeWordActive && (
              <span className="w-2 h-2 rounded-full bg-primary absolute top-1 right-1 animate-ping" />
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate('/search')}
            className="min-w-[40px] min-h-[40px] rounded-lg bg-surface-container border border-border flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors active:scale-95"
            title="Szukaj (Ctrl+K)"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
            className={`min-w-[40px] min-h-[40px] rounded-lg border flex items-center justify-center transition-all active:scale-95 ${
              isMobileDrawerOpen 
                ? 'bg-primary text-on-primary border-primary' 
                : (isSecondaryRouteActive ? 'bg-primary/10 border-primary text-primary' : 'bg-surface-container border-border text-on-surface')
            }`}
            title="Otwórz menu nawigacji"
          >
            {isMobileDrawerOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. MOBILNY DOLNY PASEK NAWIGACJI (BOTTOM BAR) */}
      {/* ========================================================= */}
      <nav className="flex md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface-container-lowest/95 backdrop-blur-xl border-t border-border z-40 items-center justify-around px-2 pb-[env(safe-area-inset-bottom,0px)] select-none shadow-[0_-1px_12px_rgba(0,0,0,0.3)]">
        {mobileQuickTabs.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`min-h-[44px] flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all duration-150 active:scale-95 ${
                isActive 
                  ? 'text-primary' 
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <div className={`p-1 rounded-lg transition-colors ${isActive ? 'bg-primary/15 shadow-[0_0_10px_rgba(173,198,255,0.25)]' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-mono mt-0.5 tracking-tight ${isActive ? 'font-bold text-primary' : 'text-on-surface-variant'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}

        {/* Przycisk Więcej / Drawer */}
        <button
          type="button"
          onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
          className={`min-h-[44px] flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all duration-150 active:scale-95 relative ${
            isMobileDrawerOpen || isSecondaryRouteActive
              ? 'text-primary'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <div className={`p-1 rounded-lg transition-colors ${isMobileDrawerOpen || isSecondaryRouteActive ? 'bg-primary/15 shadow-[0_0_10px_rgba(173,198,255,0.25)]' : ''}`}>
            <Menu className="w-5 h-5" />
          </div>
          <span className={`text-[10px] font-mono mt-0.5 tracking-tight ${isMobileDrawerOpen || isSecondaryRouteActive ? 'font-bold text-primary' : 'text-on-surface-variant'}`}>
            Więcej
          </span>
          {isSecondaryRouteActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary absolute top-1.5 right-4 animate-pulse" />
          )}
        </button>
      </nav>

      {/* ========================================================= */}
      {/* 3. MOBILNA SZUFLADA NAWIGACJI (MOBILE DRAWER / SHEET) */}
      {/* ========================================================= */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden flex-col justify-end animate-fade-in">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          <div className="relative w-full max-h-[85dvh] bg-surface-container-low border-t border-border rounded-t-3xl p-5 shadow-2xl flex flex-col z-10 overflow-hidden pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
            
            {/* Uchwyt szuflady */}
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4 shrink-0" />

            {/* Nagłówek profilu */}
            <div className="flex items-center justify-between pb-3.5 border-b border-border/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold shadow-md">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-mono text-sm font-bold text-on-surface flex items-center gap-1.5">
                    Operator {userName}
                  </h3>
                  <p className="text-[11px] text-primary font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    Węzeł Operacyjny v3.0 [OK]
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container-high border border-border flex items-center justify-center text-on-surface-variant hover:text-on-surface"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sekcje modułów w siatce */}
            <div className="my-3.5 overflow-y-auto flex-1 pr-1 custom-scrollbar min-h-0 space-y-4">
              {navSections.map((section) => {
                const sectionItems = section.items.filter(item => visibleNav[item.path] !== false);
                if (sectionItems.length === 0) return null;
                return (
                  <div key={section.title} className="space-y-2">
                    <p className="text-[10px] font-mono text-outline uppercase tracking-wider px-1">
                      {section.title}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {sectionItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsMobileDrawerOpen(false)}
                            className={`min-h-[44px] flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-left active:scale-95 ${
                              isActive
                                ? 'bg-surface-container-high border-primary/60 text-primary shadow-sm font-bold'
                                : 'bg-surface-container hover:bg-surface-container-high border-border/60 text-on-surface'
                            }`}
                          >
                            <div className={`p-1.5 rounded-lg shrink-0 ${isActive ? 'bg-primary/20 text-primary' : 'bg-surface-container-lowest text-on-surface-variant'}`}>
                              {item.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="font-mono text-xs truncate block">{item.name}</span>
                              <span className="text-[10px] text-on-surface-variant truncate block">{item.desc}</span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Szybka zmiana motywu */}
              <div className="pt-3 border-t border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-mono text-outline uppercase tracking-wider flex items-center gap-1.5">
                    <Palette className="w-3 h-3 text-primary" /> Schemat Chromatyczny:
                  </p>
                  <span className="text-[10px] font-mono text-primary font-bold uppercase">{currentTheme}</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar touch-pan-x">
                  {THEME_CHIPS.map(chip => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => applyThemeQuick(chip)}
                      className={`min-h-[44px] px-3 py-1.5 rounded-lg border text-[11px] font-mono whitespace-nowrap flex items-center gap-1.5 transition-all shrink-0 ${
                        currentTheme === chip.id
                          ? 'border-primary bg-primary/15 text-primary font-bold shadow-sm'
                          : 'border-border/60 bg-surface-container text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full border border-white/30" style={{ backgroundColor: chip.accent }} />
                      <span>{chip.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Dolny przycisk Ustawień */}
            <div className="pt-2 border-t border-border/50 shrink-0 flex gap-2">
              <Link
                to="/settings"
                onClick={() => setIsMobileDrawerOpen(false)}
                className={`flex-1 min-h-[44px] flex items-center justify-between p-3 rounded-xl border transition-all active:scale-95 ${
                  location.pathname === '/settings'
                    ? 'bg-surface-container-high border-primary text-primary font-bold'
                    : 'bg-surface-container border-border text-on-surface hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 text-primary" />
                  <span className="font-mono text-xs font-medium">Ustawienia Systemu</span>
                </div>
                <span className="text-xs font-mono text-primary">→</span>
              </Link>
              <button
                type="button"
                onClick={handleLockStation}
                className="min-h-[44px] px-3.5 rounded-xl bg-surface-container border border-border flex items-center justify-center text-on-surface-variant hover:text-rose-400 active:scale-95"
                title="Zablokuj stację"
              >
                <Lock className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. KLASYCZNY BOCZNY PASEK DESKTOP (MD:FLEX) - ROOT HUD */}
      {/* ========================================================= */}
      <aside 
        id="tour-sidebar" 
        className={`hidden md:flex flex-col h-full bg-surface-container-lowest border-r border-border flex-shrink-0 z-40 transition-all duration-300 relative ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Przycisk zwijania/rozwijania */}
        <button 
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3.5 top-5 w-7 h-7 bg-surface-container-high border border-border rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary transition-colors z-50 shadow-md"
          title={isCollapsed ? 'Rozwiń pasek boczny' : 'Zwiń pasek boczny'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Brand Header */}
        <div className={`h-16 flex items-center bg-surface-container-low border-b border-border/40 shrink-0 ${
          isCollapsed ? 'justify-center px-2' : 'px-5 gap-3'
        }`}>
          <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container shadow-[0_0_16px_rgba(77,142,255,0.35)] shrink-0">
            <ShieldCheck className="w-5 h-5 text-on-primary-container" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-sans text-base font-semibold tracking-tight text-on-surface leading-none truncate">
                OmniDash
              </span>
              <span className="font-mono text-[10px] text-outline leading-tight tracking-wider uppercase mt-1 truncate">
                v3.0 Root HUD
              </span>
            </div>
          )}
        </div>

        {/* Global Action Strip (Ctrl+K & Hej Omni) */}
        <div className={`p-3 space-y-2 border-b border-border/30 shrink-0 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
          <button 
            type="button"
            onClick={() => navigate('/search')}
            className={`flex items-center gap-2.5 bg-surface-container hover:bg-surface-container-high border border-border/60 rounded-lg text-on-surface-variant hover:text-on-surface transition-colors ${
              isCollapsed ? 'w-10 h-10 justify-center' : 'w-full px-3 py-2 text-left'
            }`}
            title={isCollapsed ? 'Szukaj (Ctrl+K)' : undefined}
          >
            <Search className="w-4 h-4 shrink-0" />
            {!isCollapsed && (
              <>
                <span className="flex-1 font-sans text-xs">Szukaj...</span>
                <kbd className="h-4 select-none items-center rounded bg-surface-container-lowest border border-border px-1 font-mono text-[9px] text-outline flex">
                  Ctrl K
                </kbd>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleOpenVoiceChat}
            className={`flex items-center gap-2.5 rounded-lg border transition-all ${
              isWakeWordActive
                ? 'bg-primary/10 border-primary/40 text-primary hover:bg-primary/20 shadow-[0_0_12px_rgba(173,198,255,0.2)]'
                : 'bg-surface-container border-border/60 text-on-surface-variant hover:text-on-surface'
            } ${isCollapsed ? 'w-10 h-10 justify-center' : 'w-full px-3 py-2 text-left'}`}
            title={isCollapsed ? 'Hej Omni // Rozmowa na żywo' : undefined}
          >
            <div className="relative shrink-0 flex items-center justify-center">
              <Mic className="w-4 h-4" />
              {isWakeWordActive && (
                <span className="w-2 h-2 rounded-full bg-primary absolute -top-1 -right-1 animate-ping" />
              )}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0 flex items-center justify-between">
                <span className="font-mono text-xs font-semibold truncate">Hej Omni</span>
                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold">
                  {isWakeWordActive ? 'LIVE' : 'MIC'}
                </span>
              </div>
            )}
          </button>
        </div>

        {/* Nawigacja z podziałem na sekcje */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 custom-scrollbar">
          {navSections.map((section) => {
            const sectionItems = section.items.filter(item => visibleNav[item.path] !== false);
            if (sectionItems.length === 0) return null;
            return (
              <div key={section.title} className="space-y-1">
                {!isCollapsed && (
                  <div className="px-2 py-1 font-mono text-[10px] text-outline uppercase tracking-wider font-semibold">
                    {section.title}
                  </div>
                )}
                <nav className="space-y-1">
                  {sectionItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        title={isCollapsed ? item.name : undefined}
                        data-path={item.path}
                        className={`flex items-center gap-3 rounded-lg text-xs transition-colors ${
                          isActive 
                            ? 'bg-surface-container-high text-primary font-bold shadow-sm' 
                            : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                        } ${isCollapsed ? 'w-10 h-10 justify-center mx-auto' : 'px-2.5 py-2'}`}
                      >
                        <div className={`${isActive ? 'text-primary' : 'text-on-surface-variant'} shrink-0`}>
                          {item.icon}
                        </div>
                        {!isCollapsed && (
                          <>
                            <span className="font-sans truncate flex-1">{item.name}</span>
                            {item.badge && (
                              <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-surface-container-high text-primary font-semibold">
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            );
          })}
        </div>

        {/* Dolna strefa profilu i operacji */}
        <div className="p-3 bg-surface-container-low border-t border-border/40 shrink-0 space-y-2">
          {/* Przycisk motywu z aria-label wymaganym przez testy */}
          <button
            type="button"
            onClick={toggleDarkLight}
            title={isLightMode ? "Przełącz na tryb ciemny" : "Przełącz na tryb jasny"}
            aria-label="Przełącz tryb jasny/ciemny"
            className={`flex items-center gap-3 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors ${
              isCollapsed ? 'w-10 h-10 justify-center mx-auto' : 'w-full px-2.5 py-1.5 text-left'
            }`}
          >
            {isLightMode ? <Moon className="w-4 h-4 text-indigo-400 shrink-0" /> : <Sun className="w-4 h-4 text-amber-400 shrink-0" />}
            {!isCollapsed && (
              <span className="font-sans text-xs">
                {isLightMode ? 'Motyw Ciemny' : 'Motyw Jasny'}
              </span>
            )}
          </button>

          {/* Karta operatora */}
          <div className={`p-2 rounded-lg bg-surface-container flex items-center justify-between gap-2 ${
            isCollapsed ? 'justify-center p-1.5' : ''
          }`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-on-primary">
                  <User className="w-4 h-4" />
                </div>
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-surface-container" />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="font-mono text-xs text-on-surface font-semibold truncate">
                    {userName}
                  </span>
                  <span className="font-mono text-[9px] text-outline truncate">
                    Active • Local WAL
                  </span>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <button
                type="button"
                onClick={handleLockStation}
                className="w-7 h-7 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-rose-400 transition-colors shrink-0"
                title="Zablokuj stację"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </aside>
    </>
  );
};

export default Sidebar;
