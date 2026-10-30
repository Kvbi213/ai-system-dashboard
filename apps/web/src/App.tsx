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

  const currentRouteMeta = ROUTE_TITLES[location.pathname] || {
    title: 'OmniDash Hub',
    subtitle: 'System Operacyjny v4.0'
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-sky-500/30 selection:text-sky-200">
      {/* Desktop Persistent Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <AppHeader
          title={currentRouteMeta.title}
          subtitle={currentRouteMeta.subtitle}
        />

        {/* Scrollable View Canvas with safe bottom padding for Mobile Dock */}
        <main className="flex-1 p-3.5 sm:p-6 pb-28 md:pb-8 overflow-y-auto">
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
