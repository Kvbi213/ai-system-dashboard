import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, MessageSquare, Search, Settings, ChevronLeft, ChevronRight, 
  LayoutGrid, CalendarDays, BrainCircuit, Crosshair, Wallet, Dumbbell, Globe, 
  Server, GraduationCap, Menu, X, Palette, Sparkles, Check, Sun, Moon
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const THEME_CHIPS = [
  { id: 'dark', label: 'Cyber Dark', bg: '#121212', accent: '#00FF66', rgb: '0 255 102' },
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
    '/memory': true,
    '/osint': true,
    '/calendar': true,
    '/finances': true,
    '/workouts': true,
    '/widgets': true,
    '/server': true,
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

  const navItems = [
    { name: 'Pulpit', path: '/', icon: <LayoutDashboard className="w-5 h-5 md:w-6 md:h-6" />, desc: 'Ekran główny' },
    { name: 'Asystent AI', path: '/chat', icon: <MessageSquare className="w-5 h-5 md:w-6 md:h-6" />, desc: 'Konwersacja LLM' },
    { name: 'Plan Lekcji', path: '/timetable', icon: <GraduationCap className="w-5 h-5 md:w-6 md:h-6" />, desc: 'Rozkład zajęć' },
    { name: 'Finanse', path: '/finances', icon: <Wallet className="w-5 h-5 md:w-6 md:h-6" />, desc: 'Budżet 50/30/20' },
    { name: 'Treningi', path: '/workouts', icon: <Dumbbell className="w-5 h-5 md:w-6 md:h-6" />, desc: 'Dziennik fitness' },
    { name: 'Kalendarz', path: '/calendar', icon: <CalendarDays className="w-5 h-5 md:w-6 md:h-6" />, desc: 'Terminarz' },
    { name: 'Widżety', path: '/widgets', icon: <LayoutGrid className="w-5 h-5 md:w-6 md:h-6" />, desc: 'Siatka monitoringu' },
    { name: 'Pamięć / Notatki', path: '/memory', icon: <BrainCircuit className="w-5 h-5 md:w-6 md:h-6" />, badge: '3', desc: 'Baza wiedzy AI' },
    { name: 'Baza Wiedzy', path: '/osint', icon: <Crosshair className="w-5 h-5 md:w-6 md:h-6" />, badge: 'Nowe', desc: 'OSINT Intel Hub' },
    { name: 'Serwer', path: '/server', icon: <Server className="w-5 h-5 md:w-6 md:h-6" />, desc: 'Status procesów' },
  ];

  const displayedNavItems = navItems.filter(item => visibleNav[item.path] !== false);

  // Sprawdzenie aktualnego tytułu strony dla nagłówka mobilnego
  const getCurrentPageTitle = () => {
    const current = navItems.find(item => item.path === location.pathname);
    if (current) return current.name;
    if (location.pathname === '/settings') return 'Ustawienia';
    if (location.pathname === '/search') return 'Wyszukiwarka';
    return 'OmniDash';
  };

  // Szybka zmiana motywu z poziomu szuflady
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

  // 4 najważniejsze zakładki do dolnego paska mobilnego
  const mobileQuickTabs = [
    { name: 'Pulpit', path: '/', icon: LayoutDashboard },
    { name: 'Czat AI', path: '/chat', icon: MessageSquare },
    { name: 'Plan', path: '/timetable', icon: GraduationCap },
    { name: 'Finanse', path: '/finances', icon: Wallet }
  ];

  // Sprawdzenie czy aktywna trasa nie znajduje się wśród 4 szybkich
  const isSecondaryRouteActive = !mobileQuickTabs.some(t => t.path === location.pathname);

  return (
    <>
      {/* ========================================================= */}
      {/* 1. MOBILNY GÓRNY PASEK APLIKACJI (TOP BAR) - TYLKO MOBILE */}
      {/* ========================================================= */}
      <header className="flex md:hidden w-full h-14 bg-surface/95 backdrop-blur-md border-b border-border items-center justify-between px-3.5 z-40 shrink-0 select-none">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accentPrimary/20 flex items-center justify-center border border-accentPrimary shadow-[0_0_10px_rgba(var(--color-accent-primary),0.2)] shrink-0">
            <span className="font-sans font-bold text-accentPrimary text-sm tracking-tighter">AG</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs font-bold text-textPrimary">{getCurrentPageTitle()}</span>
              <span className="w-2 h-2 rounded-full bg-accentPrimary animate-pulse inline-block" />
            </div>
            <span className="text-[10px] font-mono text-textMuted leading-none">OmniDash Mobile</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleDarkLight}
            className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center text-textMuted hover:text-accentPrimary hover:border-accentPrimary transition-colors active:scale-95"
            title={isLightMode ? "Przełącz na tryb ciemny" : "Przełącz na tryb jasny"}
            aria-label="Przełącz tryb jasny/ciemny"
          >
            {isLightMode ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          <button
            type="button"
            onClick={() => navigate('/search')}
            className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center text-textMuted hover:text-accentPrimary hover:border-accentPrimary transition-colors active:scale-95"
            title="Szukaj (Ctrl+K)"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
            className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-all active:scale-95 ${
              isMobileDrawerOpen 
                ? 'bg-accentPrimary text-background border-accentPrimary' 
                : (isSecondaryRouteActive ? 'bg-accentPrimary/10 border-accentPrimary text-accentPrimary' : 'bg-surface border-border text-textPrimary')
            }`}
            title="Otwórz menu nawigacji"
          >
            {isMobileDrawerOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. MOBILNY DOLNY PASEK SZYBKIEJ NAWIGACJI (BOTTOM BAR)     */}
      {/* ========================================================= */}
      <div className="flex md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface/95 backdrop-blur-md border-t border-border z-40 items-center justify-around px-1 pb-[env(safe-area-inset-bottom,0px)] select-none">
        {mobileQuickTabs.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-150 active:scale-95 ${
                isActive 
                  ? 'text-accentPrimary' 
                  : 'text-textMuted hover:text-textPrimary'
              }`}
            >
              <div className={`p-1 rounded-lg transition-colors ${isActive ? 'bg-accentPrimary/15 shadow-[0_0_8px_rgba(var(--color-accent-primary),0.2)]' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-mono mt-0.5 ${isActive ? 'font-bold text-accentPrimary' : 'text-textMuted'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}

        {/* Przycisk Szuflady "Więcej" */}
        <button
          type="button"
          onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-150 active:scale-95 relative ${
            isMobileDrawerOpen || isSecondaryRouteActive
              ? 'text-accentPrimary'
              : 'text-textMuted hover:text-textPrimary'
          }`}
        >
          <div className={`p-1 rounded-lg transition-colors ${isMobileDrawerOpen || isSecondaryRouteActive ? 'bg-accentPrimary/15 shadow-[0_0_8px_rgba(var(--color-accent-primary),0.2)]' : ''}`}>
            <Menu className="w-5 h-5" />
          </div>
          <span className={`text-[10px] font-mono mt-0.5 ${isMobileDrawerOpen || isSecondaryRouteActive ? 'font-bold text-accentPrimary' : 'text-textMuted'}`}>
            Więcej
          </span>
          {isSecondaryRouteActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-accentPrimary absolute top-1 right-2 animate-pulse" />
          )}
        </button>
      </div>

      {/* ========================================================= */}
      {/* 3. MOBILNA SZUFLADA NAWIGACJI (MOBILE DRAWER / SHEET)     */}
      {/* ========================================================= */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden flex-col justify-end animate-fade-in">
          {/* Tło z rozmyciem */}
          <div 
            className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Panel szuflady (Bottom Sheet) */}
          <div className="relative w-full max-h-[85dvh] bg-surface border-t border-border rounded-t-3xl p-5 shadow-2xl flex flex-col z-10 overflow-hidden animate-slide-up pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
            
            {/* Pasek uchwytu */}
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4 shrink-0" />

            {/* Nagłówek profilu */}
            <div className="flex items-center justify-between pb-3.5 border-b border-border/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accentPrimary/20 flex items-center justify-center border border-accentPrimary text-accentPrimary font-bold">
                  AG
                </div>
                <div>
                  <h3 className="font-mono text-sm font-bold text-textPrimary flex items-center gap-1.5">
                    Witaj, {userName}!
                  </h3>
                  <p className="text-[11px] text-accentPrimary font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-accentPrimary animate-pulse" />
                    Wszystkie systemy online
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-black/20 border border-border flex items-center justify-center text-textMuted hover:text-textPrimary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Wyszukiwarka w szufladzie */}
            <button
              type="button"
              onClick={() => {
                setIsMobileDrawerOpen(false);
                navigate('/search');
              }}
              className="mt-3.5 flex items-center gap-3 bg-black/20 hover:bg-black/40 border border-border rounded-xl px-3.5 py-2.5 text-left text-textMuted text-xs shrink-0 active:scale-98 transition-all"
            >
              <Search className="w-4 h-4 text-accentPrimary shrink-0" />
              <span className="flex-1 font-sans">Szukaj w systemie lub sieci...</span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-textMuted border border-white/10">Ctrl+K</span>
            </button>

            {/* Pełna lista zakładek w siatce 2-kolumnowej */}
            <div className="my-3.5 overflow-y-auto flex-1 pr-1 custom-scrollbar min-h-0">
              <p className="text-[10px] font-mono text-textMuted uppercase tracking-wider mb-2.5">
                Dostępne Moduły ({displayedNavItems.length}):
              </p>

              <div className="grid grid-cols-2 gap-2">
                {displayedNavItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileDrawerOpen(false)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left active:scale-95 ${
                        isActive
                          ? 'bg-accentPrimary/15 border-accentPrimary/60 text-accentPrimary shadow-[0_0_12px_rgba(var(--color-accent-primary),0.15)]'
                          : 'bg-black/20 hover:bg-black/30 border-border/60 text-textPrimary hover:border-border'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg shrink-0 ${isActive ? 'bg-accentPrimary/20 text-accentPrimary' : 'bg-surface text-textMuted'}`}>
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold truncate">{item.name}</span>
                          {item.badge && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-accentPrimary/20 text-accentPrimary border border-accentPrimary/30 font-bold shrink-0">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-textMuted truncate block">{item.desc}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Szybka zmiana motywu */}
              <div className="mt-4 pt-3 border-t border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-mono text-textMuted uppercase tracking-wider flex items-center gap-1.5">
                    <Palette className="w-3 h-3 text-accentPrimary" /> Szybki Styl Motywu:
                  </p>
                  <span className="text-[10px] font-mono text-accentPrimary font-bold uppercase">{currentTheme}</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar touch-pan-x">
                  {THEME_CHIPS.map(chip => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => applyThemeQuick(chip)}
                      className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-mono whitespace-nowrap flex items-center gap-1.5 transition-all shrink-0 ${
                        currentTheme === chip.id
                          ? 'border-accentPrimary bg-accentPrimary/15 text-accentPrimary font-bold shadow-sm'
                          : 'border-border/60 bg-black/20 text-textMuted hover:text-textPrimary'
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
            <div className="pt-2 border-t border-border/50 shrink-0">
              <Link
                to="/settings"
                onClick={() => setIsMobileDrawerOpen(false)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all active:scale-95 ${
                  location.pathname === '/settings'
                    ? 'bg-accentPrimary/20 border-accentPrimary text-accentPrimary shadow-[0_0_12px_rgba(var(--color-accent-primary),0.2)]'
                    : 'bg-black/30 border-border text-textPrimary hover:border-accentPrimary/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accentPrimary/10 border border-accentPrimary/30 flex items-center justify-center text-accentPrimary">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-mono text-xs font-bold">Ustawienia Systemu</p>
                    <p className="text-[10px] text-textMuted">Konfiguracja AI, motywów, baz i uprawnień</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-accentPrimary font-bold">Otwórz →</span>
              </Link>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. KLASYCZNY BOCZNY PASEK DESKTOP (MD:FLEX)               */}
      {/* ========================================================= */}
      <nav id="tour-sidebar" className={`hidden md:flex w-full ${isCollapsed ? 'md:w-20' : 'md:w-64'} h-full glass-panel border-r border-border flex-col items-start py-8 flex-shrink-0 z-40 transition-all duration-300 relative group`}>
        
        {/* Przycisk zwijania/rozwijania */}
        <button 
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3.5 top-9 w-7 h-7 bg-surface border border-border rounded-full flex items-center justify-center text-textMuted hover:text-accentPrimary hover:border-accentPrimary transition-colors z-50 shadow-md"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <div className={`w-full flex justify-center ${isCollapsed ? 'px-2' : 'justify-start px-8'} mb-8 transition-all`}>
          <div className="w-12 h-12 rounded-xl bg-accentPrimary/20 flex items-center justify-center border border-accentPrimary shadow-[0_0_15px_rgba(var(--color-accent-primary),0.2)] shrink-0">
            <span className="font-sans font-bold text-accentPrimary text-xl tracking-tighter">AG</span>
          </div>
        </div>

        {/* Wyszukiwarka z Ctrl+K */}
        <div className={`w-full ${isCollapsed ? 'px-2 justify-center' : 'px-6'} mb-6 transition-all`}>
          <button 
            type="button"
            onClick={() => navigate('/search')}
            className={`flex items-center gap-3 bg-surface hover:bg-surface/80 border border-border rounded-xl transition-colors text-textMuted ${isCollapsed ? 'w-12 h-12 justify-center' : 'w-full px-3 py-2 text-left'}`}
            title={isCollapsed ? 'Szukaj (Ctrl+K)' : undefined}
          >
            <Search className="w-5 h-5 shrink-0" />
            {!isCollapsed && (
              <>
                <span className="flex-1 text-sm">Szukaj...</span>
                <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded bg-black/20 border border-border px-1.5 font-sans text-[10px] font-medium text-textMuted flex">
                  <span className="text-xs">Ctrl K</span>
                </kbd>
              </>
            )}
          </button>
        </div>
        
        <div className={`w-full flex flex-col justify-start ${isCollapsed ? 'items-center px-2' : 'items-stretch px-6'} gap-3 flex-1 overflow-y-auto pr-1 custom-scrollbar transition-all`}>
          {displayedNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={isCollapsed ? item.name : undefined}
                className={`flex items-center gap-4 p-3 rounded-lg transition-all duration-200 group ${
                  isActive 
                    ? 'bg-accentPrimary/10 border border-accentPrimary/50 text-accentPrimary shadow-[0_0_10px_rgba(var(--color-accent-primary),0.1)]' 
                    : 'text-textMuted hover:text-textPrimary hover:bg-surface border border-transparent'
                } ${isCollapsed ? 'justify-center w-12 h-12' : 'w-full'}`}
              >
                <div className={`${isActive ? 'text-accentPrimary' : 'group-hover:text-accentPrimary'} transition-colors shrink-0`}>
                  {item.icon}
                </div>
                {!isCollapsed && (
                  <>
                    <span className="font-sans text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis flex-1">
                      {item.name}
                    </span>
                    {item.badge && (
                      <span className="flex items-center rounded-full bg-surface border border-border px-2 py-0.5 text-[10px] font-medium text-textPrimary tracking-wide">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </div>

        <div className={`w-full ${isCollapsed ? 'px-2 flex flex-col items-center' : 'px-6 flex flex-col'} mt-auto pt-4 gap-1.5 transition-all border-t border-border/40`}>
          <button
            type="button"
            onClick={toggleDarkLight}
            title={isCollapsed ? (isLightMode ? "Tryb Ciemny" : "Tryb Jasny") : undefined}
            aria-label="Przełącz tryb jasny/ciemny"
            className={`flex items-center gap-4 p-3 rounded-lg transition-all duration-200 group text-textMuted hover:text-textPrimary hover:bg-surface border border-transparent ${
              isCollapsed ? 'justify-center w-12 h-12' : 'w-full justify-start'
            }`}
          >
            <div className="shrink-0 transition-colors group-hover:text-accentPrimary">
              {isLightMode ? <Moon className="w-6 h-6 text-indigo-400" /> : <Sun className="w-6 h-6 text-amber-400" />}
            </div>
            {!isCollapsed && (
              <span className="font-sans text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                {isLightMode ? 'Tryb Ciemny' : 'Tryb Jasny'}
              </span>
            )}
          </button>

          <Link 
            to="/settings"
            title={isCollapsed ? t('settings') : undefined}
            className={`flex items-center gap-4 p-3 rounded-lg transition-all duration-200 group ${
              location.pathname === '/settings'
                ? 'bg-accentPrimary/10 border border-accentPrimary/50 text-accentPrimary shadow-[0_0_10px_rgba(var(--color-accent-primary),0.1)]' 
                : 'text-textMuted hover:text-textPrimary hover:bg-surface border border-transparent'
            } ${isCollapsed ? 'justify-center w-12 h-12' : 'w-full justify-start'}`}
          >
            <Settings className={`w-6 h-6 shrink-0 transition-colors ${location.pathname === '/settings' ? 'text-accentPrimary' : 'group-hover:text-accentPrimary'}`} />
            {!isCollapsed && (
              <span className="font-sans text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis">Ustawienia</span>
            )}
          </Link>
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
