import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV_SECTIONS = [
  {
    title: 'Core Systems',
    items: [
      { id: 'pulpit', path: '/', label: 'Pulpit', icon: 'dashboard' },
      { id: 'omni-chat-ai', path: '/chat', label: 'Omni Chat & AI', icon: 'smart_toy' },
      { id: 'plan-dnia-harmonogram', path: '/timetable', label: 'Plan Dnia', icon: 'schedule' },
      { id: 'oceny-edukacja', path: '/grades', label: 'Oceny & Edukacja', icon: 'school' },
      { id: 'finanse-koperty', path: '/finances', label: 'Finanse & Koperty', icon: 'account_balance_wallet' },
    ]
  },
  {
    title: 'Tracking & Ops',
    items: [
      { id: 'treningi-fbw', path: '/workouts', label: 'Treningi FBW', icon: 'fitness_center' },
      { id: 'kalendarz', path: '/calendar', label: 'Kalendarz', icon: 'calendar_month' },
      { id: 'osint-toolkit', path: '/osint', label: 'OSINT Toolkit', icon: 'radar' },
      { id: 'baza-wiedzy-encje', path: '/entities', label: 'Baza Wiedzy', icon: 'hub' },
    ]
  },
  {
    title: 'System Management',
    items: [
      { id: 'pamiec-operatora', path: '/memory', label: 'Pamięć Operatora', icon: 'memory' },
      { id: 'widzety-metryki', path: '/widgets', label: 'Widżety & Metryki', icon: 'monitoring' },
      { id: 'serwer-logi', path: '/server-logs', label: 'Serwer & Logi', icon: 'terminal' },
      { id: 'ustawienia-systemu', path: '/settings', label: 'Ustawienia', icon: 'settings' },
    ]
  }
];

const Sidebar = ({ isMobileOpen, onCloseMobile }) => {
  const location = useLocation();
  const [userName, setUserName] = useState(() => localStorage.getItem('system_user_name') || 'Jakub Lis');
  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem('system_theme') || 'dark');
  const [visibleNav, setVisibleNav] = useState(() => {
    try {
      const saved = localStorage.getItem('system_visible_nav');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  useEffect(() => {
    const handleNameChange = (e) => setUserName(e.detail || 'Jakub Lis');
    const handleThemeChange = (e) => setCurrentTheme(e.detail || 'dark');
    const handleNavChange = (e) => setVisibleNav(e.detail);

    window.addEventListener('userNameChanged', handleNameChange);
    window.addEventListener('themeChanged', handleThemeChange);
    window.addEventListener('visibleNavChanged', handleNavChange);
    return () => {
      window.removeEventListener('userNameChanged', handleNameChange);
      window.removeEventListener('themeChanged', handleThemeChange);
      window.removeEventListener('visibleNavChanged', handleNavChange);
    };
  }, []);

  const handleToggleLightDark = () => {
    const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
    setCurrentTheme(nextTheme);
    localStorage.setItem('system_theme', nextTheme);
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: nextTheme }));
  };

  const handleLock = () => {
    sessionStorage.removeItem('dashboard_token');
    window.location.reload();
  };

  const isItemActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between">
      {/* Top Section */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-space-lg gap-space-sm bg-surface-container-low border-b border-white/[0.04]">
          <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container shadow-[0_0_16px_rgba(77,142,255,0.35)]">
            <span className="material-symbols-outlined text-[20px]">deployed_code</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-md text-headline-md tracking-tight text-on-surface font-semibold leading-none">
              OmniDash
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant leading-tight tracking-wider uppercase mt-space-xs">
              v3.0 Root HUD
            </span>
          </div>
        </div>

        {/* Navigation Categories */}
        <div className="flex-1 overflow-y-auto px-space-md py-space-md space-y-space-lg">
          {NAV_SECTIONS.map((section) => {
            const visibleItems = section.items.filter(item => !visibleNav || visibleNav[item.id] !== false);
            if (visibleItems.length === 0) return null;
            return (
              <div key={section.title} className="space-y-space-xs">
                <div className="px-space-sm py-space-xs font-label-sm text-label-sm text-outline uppercase tracking-wider">
                  {section.title}
                </div>
                <nav className="space-y-space-xs">
                  {visibleItems.map((item) => {
                    const active = isItemActive(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={onCloseMobile}
                        className={`flex items-center gap-space-md px-space-sm py-space-xs rounded-lg transition-colors font-body-md text-body-md apple-press ${
                          active
                            ? 'bg-surface-container-high text-primary font-bold shadow-sm'
                            : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Profile & Lock */}
      <div className="p-space-md bg-surface-container-low border-t border-white/[0.04]">
        <div className="p-space-sm rounded-lg bg-surface-container flex items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm min-w-0">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
              </div>
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-primary ring-2 ring-surface-container" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-md text-label-md text-on-surface truncate font-medium">
                {userName}
              </span>
              <span className="font-label-sm text-label-sm text-outline truncate">
                Active • Local
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Przełącznik trybu jasny/ciemny dla zgodności z testami */}
            <button
              onClick={handleToggleLightDark}
              aria-label="Przełącz tryb jasny/ciemny"
              className="w-7 h-7 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors apple-press"
              title="Przełącz motyw"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">
                {currentTheme === 'light' ? 'dark_mode' : 'light_mode'}
              </span>
            </button>

            {/* Przycisk blokady */}
            <button
              onClick={handleLock}
              className="w-7 h-7 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors apple-press"
              title="Zablokuj stację"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">lock</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Aside (w-64) */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-surface-container-lowest z-50 flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-r border-white/[0.04]">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <aside className="relative w-72 max-w-[85vw] h-full bg-surface-container-lowest shadow-2xl z-10 flex flex-col">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
