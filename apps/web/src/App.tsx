import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Sidebar } from './components/navigation/Sidebar';
import { AppHeader } from './components/navigation/AppHeader';
import { BottomTabBar } from './components/navigation/BottomTabBar';
import { MoreDrawerSheet } from './components/navigation/MoreDrawerSheet';
import { CommandPaletteModal } from './components/navigation/CommandPaletteModal';
import { ToastProvider } from './components/ui/Toast';
import { LockScreenOverlay } from './components/security/LockScreenOverlay';
import { SetupWizardModal } from './components/setup/SetupWizardModal';
import { DesignModeSwitcher } from './components/navigation/DesignModeSwitcher';
import { SpatialDock } from './components/navigation/SpatialDock';
import { useDesignSystem } from './context/DesignSystemContext';
import { systemApi } from './api/client';

import { DashboardPage } from './modules/dashboard/page';
import { ChatPage } from './modules/chat/page';
import { SchoolPage } from './modules/school/page';
import { CalendarPage } from './modules/calendar/page';
import { EntitiesPage } from './modules/entities/page';
import { SearchPage } from './modules/search/page';
import { PrivatePage } from './modules/private/page';
import { GradesPage } from './modules/grades/page';
import { FinancePage } from './modules/finance/page';
import { WorkoutsPage } from './modules/workouts/page';
import { TrafficPage } from './modules/traffic/page';
import { ServerPage } from './modules/server/page';
import { SettingsPage } from './modules/settings/page';
import { OsintPage } from './modules/osint/page';
import { WidgetsPage } from './modules/widgets/page';
import { MemoryPage } from './modules/memory/page';

const ROUTE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Pulpit', subtitle: 'Centrum dowodzenia i podsumowanie dnia' },
  '/chat': { title: 'Asystent AI', subtitle: 'Rozmowa, notatki i wsparcie w zadaniach' },
  '/search': { title: 'Wyszukiwarka', subtitle: 'Szybkie przeszukiwanie bazy i notatek' },
  '/widgets': { title: 'Narzędzia', subtitle: 'Praktyczne widżety i skróty' },
  '/memory': { title: 'Pamięć asystenta', subtitle: 'Zapisane fakty, preferencje i reguły' },
  '/school': { title: 'Plan lekcji', subtitle: 'Harmonogram, sale i zastępstwa' },
  '/calendar': { title: 'Kalendarz', subtitle: 'Wydarzenia, sprawdziany i terminy' },
  '/entities': { title: 'Baza wiedzy', subtitle: 'Katalog kontaktów, miejsc i zasobów' },
  '/private': { title: 'Dziennik osobisty', subtitle: 'Nawyki, cele i przemyślenia' },
  '/timetable': { title: 'Harmonogram', subtitle: 'Plan tygodnia i sale lekcyjne' },
  '/grades': { title: 'Oceny i frekwencja', subtitle: 'Podsumowanie z dziennika Librus' },
  '/finance': { title: 'Budżet domowy', subtitle: 'Kategorie 50/30/20 i oszczędności' },
  '/workouts': { title: 'Trening FBW', subtitle: 'Ćwiczenia, serie i postępy' },
  '/traffic': { title: 'Trasa i kamery', subtitle: 'Kamery GDDKiA i alerty drogowe' },
  '/osint': { title: 'Narzędzia OSINT', subtitle: 'Analiza domen, IP i certyfikatów' },
  '/server': { title: 'Stan serwera', subtitle: 'Zasoby, kontenery i telemetria' },
  '/settings': { title: 'Ustawienia', subtitle: 'Konfiguracja systemu i preferencje' }
};

export const App: React.FC = () => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(() => {
    try {
      return localStorage.getItem('omnidash_pin_lock') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    systemApi.getSetupStatus()
      .then((res) => {
        if (res && res.isConfigured === false) {
          setIsSetupOpen(true);
        }
      })
      .catch(() => {});
  }, []);

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const location = useLocation();
  const isChatRoute = location.pathname === '/chat';

  const { mode } = useDesignSystem();

  const currentRouteMeta = ROUTE_TITLES[location.pathname] || {
    title: 'OmniDash',
    subtitle: 'Sovereign Station'
  };

  return (
    <ToastProvider>
      <div
        className={`relative flex h-[100dvh] w-full overflow-hidden text-slate-800 dark:text-slate-100 antialiased selection:bg-slate-300 dark:selection:bg-white/20 transition-colors duration-200 ${
          mode === 'precision'
            ? 'bg-[#020202] text-neutral-200 font-mono'
            : 'bg-[#f8fafc] dark:bg-[#090d16] font-sans'
        }`}
      >
        {/* Atmospheric Ambient Layers based on Design Mode */}
        {mode === 'horizon' && (
          <div className="pointer-events-none absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-amber-500/15 via-rose-500/5 to-transparent z-0" />
        )}
        {mode === 'liquid' && (
          <>
            <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-cyan-500/12 blur-[100px] z-0" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-indigo-500/12 blur-[100px] z-0" />
          </>
        )}
        {mode === 'precision' && (
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:24px_24px] opacity-50 z-0" />
        )}

        {/* Lock Screen Overlay (Active when pin lock is enabled) */}
        {isLocked && <LockScreenOverlay onUnlock={() => setIsLocked(false)} />}

        {/* First-Run Setup Wizard (Active when database is unconfigured) */}
        <SetupWizardModal isOpen={isSetupOpen} onComplete={() => setIsSetupOpen(false)} />

        {/* Raycast / Linear Command Palette (Cmd+K) */}
        <CommandPaletteModal
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onLockScreen={() => setIsLocked(true)}
        />

        {/* Desktop Persistent Sidebar (Adjusts subtly in Precision mode) */}
        <Sidebar onOpenCommandPalette={() => setIsCommandPaletteOpen(true)} />


        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden z-10">
          <AppHeader
            title={currentRouteMeta.title}
            subtitle={currentRouteMeta.subtitle}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          />

          {/* Dynamic View Canvas: Chat is completely non-scrolling externally */}
          <main
            id="main-content"
            className={`flex-1 min-h-0 w-full ${
              isChatRoute
                ? 'overflow-hidden flex flex-col p-2 sm:p-4 pb-20 md:pb-4'
                : 'overflow-y-auto p-3.5 sm:p-6 pb-28 md:pb-8'
            }`}
          >
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/widgets" element={<WidgetsPage />} />
              <Route path="/memory" element={<MemoryPage />} />
              <Route path="/school" element={<SchoolPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/entities" element={<EntitiesPage />} />
              <Route path="/private" element={<PrivatePage />} />
              <Route path="/timetable" element={<SchoolPage />} />
              <Route path="/grades" element={<GradesPage />} />
              <Route path="/finance" element={<FinancePage />} />
              <Route path="/workouts" element={<WorkoutsPage />} />
              <Route path="/traffic" element={<TrafficPage />} />
              <Route path="/osint" element={<OsintPage />} />
              <Route path="/server" element={<ServerPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<DashboardPage />} />
            </Routes>
          </main>
        </div>

        {/* Mobile Ergonomic Bottom Tab Bar (Thumb Zone) */}
        <BottomTabBar onOpenMore={() => setIsMoreOpen(true)} />

        {/* VisionOS / macOS Tahoe Spatial Dock (Active in Liquid mode) */}
        <SpatialDock />

        {/* Global Live Design System Direction Switcher */}
        <DesignModeSwitcher />

        {/* Mobile Slide-up "Więcej" Sheet */}
        <MoreDrawerSheet isOpen={isMoreOpen} onClose={() => setIsMoreOpen(false)} />
      </div>
    </ToastProvider>
  );
};

