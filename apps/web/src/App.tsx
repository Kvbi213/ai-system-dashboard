import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Sidebar } from './components/navigation/Sidebar';
import { AppHeader } from './components/navigation/AppHeader';
import { BottomTabBar } from './components/navigation/BottomTabBar';
import { MoreDrawerSheet } from './components/navigation/MoreDrawerSheet';

import { DashboardPage } from './modules/dashboard/page';
import { ChatPage } from './modules/chat/page';
import { TimetablePage } from './modules/timetable/page';
import { GradesPage } from './modules/grades/page';
import { FinancePage } from './modules/finance/page';
import { WorkoutsPage } from './modules/workouts/page';
import { TrafficPage } from './modules/traffic/page';
import { SettingsPage } from './modules/settings/page';

const ROUTE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Pulpit Główny', subtitle: 'Centrum Operacyjne Edge v4.0' },
  '/chat': { title: 'Czat Asystenta AI', subtitle: 'Zero-Trust Reasoning & Tool Calling' },
  '/timetable': { title: 'Plan Lekcji Synergia', subtitle: 'Technikum ZSE Starogard Gdański' },
  '/grades': { title: 'Oceny i Frekwencja', subtitle: 'Zintegrowany Dziennik Elektroniczny' },
  '/finance': { title: 'Finanse 50/30/20', subtitle: 'Zarządzanie Budżetem i Oszczędnościami' },
  '/workouts': { title: 'Trening FBW Poddasze', subtitle: 'Drążek, Dipy i Progresja Siłowa' },
  '/traffic': { title: 'Radary i Trasa', subtitle: 'CANARD Telemetria i Kamery GDDKiA' },
  '/settings': { title: 'Ustawienia i Bezpieczeństwo', subtitle: 'Polityka CSP, Tokeny i Kontenery' }
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
    <div className="relative flex h-[100dvh] w-full overflow-hidden bg-slate-50 text-slate-800 font-sans antialiased selection:bg-sky-500/20 selection:text-sky-900">
      {/* Ambient Liquid Gradient Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[15%] -left-[10%] w-[550px] h-[550px] rounded-full bg-gradient-to-br from-sky-200/40 via-cyan-100/30 to-transparent blur-3xl" />
        <div className="absolute top-[25%] -right-[15%] w-[600px] h-[600px] rounded-full bg-gradient-to-bl from-indigo-200/35 via-purple-100/25 to-transparent blur-3xl" />
        <div className="absolute -bottom-[15%] left-[25%] w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-emerald-100/35 via-teal-100/25 to-transparent blur-3xl" />
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
            <Route path="/timetable" element={<TimetablePage />} />
            <Route path="/grades" element={<GradesPage />} />
            <Route path="/finance" element={<FinancePage />} />
            <Route path="/workouts" element={<WorkoutsPage />} />
            <Route path="/traffic" element={<TrafficPage />} />
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
