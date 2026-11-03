import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Sidebar } from './components/navigation/Sidebar';
import { AppHeader } from './components/navigation/AppHeader';
import { BottomTabBar } from './components/navigation/BottomTabBar';
import { MoreDrawerSheet } from './components/navigation/MoreDrawerSheet';

import { DashboardPage } from './modules/dashboard/page';
import { ChatPage } from './modules/chat/page';
import { SchoolPage } from './modules/school/page';
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
  '/': { title: 'Pulpit Główny', subtitle: 'Centrum Operacyjne Edge v4.0' },
  '/chat': { title: 'Czat Asystenta AI', subtitle: 'Zero-Trust Reasoning & Tool Calling' },
  '/widgets': { title: 'Widżety & Narzędzia Operacyjne', subtitle: 'Hardware, Notatnik, Rynek i Prompt Vault' },
  '/memory': { title: 'Pamięć Kognitywna AI', subtitle: 'Dyrektywy Systemowe i Baza Faktów' },
  '/school': { title: 'Harmonogram & Edukacja', subtitle: 'Plan zajęć, Oceny, Frekwencja i Terminarz' },
  '/private': { title: 'Strefa Prywatna', subtitle: 'Rutyny Dnia, Cele Osobiste i Dziennik' },
  '/timetable': { title: 'Harmonogram Zajęć', subtitle: 'Plan tygodniowy i sale dydaktyczne' },
  '/grades': { title: 'Oceny i Frekwencja', subtitle: 'Panel wyników i frekwencji' },
  '/finance': { title: 'Finanse 50/30/20', subtitle: 'Zarządzanie Budżetem, Abonamentami i Celami' },
  '/workouts': { title: 'Trening FBW & Nawyki', subtitle: 'Kalistenika, Streaki Dnia i Rekordy' },
  '/traffic': { title: 'Monitoring Tras & Radary', subtitle: 'CANARD Telemetria i Kamery Drogowe GDDKiA' },
  '/osint': { title: 'OSINT & Telemetria Sieci', subtitle: 'Lookup DNS, IP Reputacja i Weryfikacja SSL' },
  '/server': { title: 'Infrastruktura Serwera', subtitle: 'Kontenery Docker, Węzeł LXC i Kopia Zapasowa' },
  '/settings': { title: 'Ustawienia i Bezpieczeństwo', subtitle: 'Polityka CSP Level 3, Tenant i Klucze' }
};

export const App: React.FC = () => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const location = useLocation();
  const isChatRoute = location.pathname === '/chat';

  const currentRouteMeta = ROUTE_TITLES[location.pathname] || {
    title: 'OmniDash Hub',
    subtitle: 'System Operacyjny v4.0'
  };

  return (
    <div className="relative flex h-[100dvh] w-full overflow-hidden bg-slate-50 dark:bg-[#070b12] text-slate-800 dark:text-slate-100 font-sans antialiased selection:bg-sky-500/20 selection:text-sky-900 transition-colors duration-200">
      {/* Ambient Liquid Gradient Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[15%] -left-[10%] w-[550px] h-[550px] rounded-full bg-gradient-to-br from-sky-200/40 via-cyan-100/30 to-transparent dark:from-sky-900/20 dark:via-cyan-900/10 blur-3xl transition-opacity duration-300" />
        <div className="absolute top-[25%] -right-[15%] w-[600px] h-[600px] rounded-full bg-gradient-to-bl from-indigo-200/35 via-purple-100/25 to-transparent dark:from-indigo-900/20 dark:via-purple-900/10 blur-3xl transition-opacity duration-300" />
        <div className="absolute -bottom-[15%] left-[25%] w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-emerald-100/35 via-teal-100/25 to-transparent dark:from-emerald-900/15 dark:via-teal-900/10 blur-3xl transition-opacity duration-300" />
      </div>

      {/* Desktop Persistent Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden z-10">
        <AppHeader
          title={currentRouteMeta.title}
          subtitle={currentRouteMeta.subtitle}
        />

        {/* Dynamic View Canvas: Chat is completely non-scrolling externally */}
        <main
          id="main-content"
          className={`flex-1 min-h-0 w-full ${
            isChatRoute
              ? 'overflow-hidden flex flex-col p-2.5 sm:p-4 pb-20 md:pb-4'
              : 'overflow-y-auto p-3.5 sm:p-6 pb-28 md:pb-8'
          }`}
        >
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/widgets" element={<WidgetsPage />} />
            <Route path="/memory" element={<MemoryPage />} />
            <Route path="/school" element={<SchoolPage />} />
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

      {/* Mobile Slide-up "Więcej" Sheet */}
      <MoreDrawerSheet isOpen={isMoreOpen} onClose={() => setIsMoreOpen(false)} />
    </div>
  );
};
