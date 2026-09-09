import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import { I18nextProvider } from 'react-i18next';
import i18n from './modules/i18n';
import './assets/styles/index.css';

import Sidebar from './modules/components/Sidebar';
import Dashboard from './modules/pages/Dashboard';
import ChatPage from './modules/pages/ChatPage';
import SearchPage from './modules/pages/SearchPage';
import SettingsPage from './modules/pages/SettingsPage';
import WidgetsPage from './modules/pages/WidgetsPage';
import CalendarPage from './modules/pages/CalendarPage';
import FinancePage from './modules/pages/FinancePage';
import WorkoutsPage from './modules/pages/WorkoutsPage';
import TimetablePage from './modules/pages/TimetablePage';
import MemoryPage from './modules/pages/MemoryPage';
import OSINTPage from './modules/pages/OSINTPage';
import LockScreen from './modules/pages/LockScreen';
import ServerPage from './modules/pages/ServerPage';
import BrowserPage from './modules/pages/BrowserPage';
import { ChatProvider } from './modules/context/ChatContext';
import { ToastProvider } from './modules/context/ToastContext';
import ToastContainer from './modules/components/ToastContainer';
import ApiConfigScreen from './modules/components/ApiConfigScreen';
import OnboardingTour from './modules/components/OnboardingTour';
import SetupWizard from './modules/components/SetupWizard';
import GlobalEventListener from './modules/components/GlobalEventListener';
import ErrorBoundary from './modules/components/ErrorBoundary';
import CommandPalette from './modules/components/CommandPalette';

// Globalny interceptor zabezpieczający przed parsowaniem HTML jako JSON w przypadku braku backendu / hostingu statycznego
axios.interceptors.response.use(
  (response) => {
    const contentType = response.headers?.['content-type'] || '';
    if (
      typeof response.data === 'string' &&
      (contentType.includes('text/html') ||
       response.data.trim().startsWith('<!DOCTYPE') ||
       response.data.trim().startsWith('<html'))
    ) {
      if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        console.warn(`[Axios] Endpoint ${response.config?.url} zwrócił HTML zamiast JSON.`);
      } else {
        console.debug(`[Axios] Endpoint ${response.config?.url} zwrócił HTML zamiast JSON.`);
      }
      return Promise.reject(new Error(`Endpoint ${response.config?.url || 'unknown'} zwrócił HTML`));
    }
    return response;
  },
  (error) => Promise.reject(error)
);

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [missingKeys, setMissingKeys] = useState([]);
  const [setupCompleted, setSetupCompleted] = useState(false);

  // Monkey-patch window.fetch aby zawierał nagłówek Authorization
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async function () {
      let [resource, config] = arguments;
      if (typeof resource === 'string' && resource.startsWith('/api')) {
        config = config || {};
        config.headers = config.headers || {};
        const token = sessionStorage.getItem('dashboard_token');
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
      }
      return originalFetch(resource, config);
    };
  }, []);

  useEffect(() => {
    // Odczytanie z localStorage przy starcie
    const isSetupCompleted = localStorage.getItem('system_setup_completed') === 'true';
    setSetupCompleted(isSetupCompleted);

    const applyThemeClasses = (themeName) => {
      const root = document.documentElement;
      ['theme-light', 'theme-retro', 'theme-monochrome', 'theme-matrix', 'theme-synthwave', 'theme-nordic'].forEach(cls => {
        root.classList.remove(cls);
      });
      if (themeName && themeName !== 'dark') {
        root.classList.add(`theme-${themeName}`);
      }
    };

    const savedTheme = localStorage.getItem('system_theme') || 'dark';
    applyThemeClasses(savedTheme);

    const handleThemeChange = (e) => applyThemeClasses(e.detail);
    window.addEventListener('themeChanged', handleThemeChange);

    const savedAccent = localStorage.getItem('system_accent');
    const savedAccentHex = localStorage.getItem('system_accent_hex');
    if (savedAccent && savedAccentHex) {
      document.documentElement.style.setProperty('--color-accent-primary', savedAccent);
      document.documentElement.style.setProperty('--color-accent-primary-hex', savedAccentHex);
      document.documentElement.style.setProperty('--color-accent-secondary', savedAccentHex);
    }

    if (localStorage.getItem('system_glassmorphism') === 'false') {
      document.documentElement.classList.add('no-glass');
    }
    if (localStorage.getItem('system_animations') === 'false') {
      document.documentElement.classList.add('no-animations');
    }
    if (localStorage.getItem('system_compact_ui') === 'true') {
      document.documentElement.classList.add('compact-mode');
    }

    const isCloudMode = window.location.hostname.includes('web.app') || window.location.hostname.includes('firebaseapp.com');

    const checkKeysStatus = () => {
      const token = sessionStorage.getItem('dashboard_token');

      if (isCloudMode) {
        if (token && (token.startsWith('firebase_') || token.startsWith('cloud_') || token.startsWith('pin_'))) {
          setIsAuthenticated(true);
        }
        setIsVerifying(false);
        return;
      }

      axios.get('/api/system/keys-status', { timeout: 3000 })
        .then((res) => {
          if (typeof res.data !== 'object' || !res.data) {
            if (token) setIsAuthenticated(true);
            setIsVerifying(false);
            return;
          }

          if (res.data.missing && res.data.missing.length > 0) {
            setMissingKeys(res.data.missing);
            setIsVerifying(false);
            return;
          }

          if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            axios.get('/api/auth/verify', { timeout: 3000 })
              .then(() => setIsAuthenticated(true))
              .catch(() => {
                sessionStorage.removeItem('dashboard_token');
                delete axios.defaults.headers.common['Authorization'];
                setIsAuthenticated(false);
              })
              .finally(() => setIsVerifying(false));
          } else {
            setIsVerifying(false);
          }
        })
        .catch((err) => {
          console.warn("Brak połączenia z API serwera:", err.message);
          setIsVerifying(false);
        });
    };

    checkKeysStatus();
    return () => window.removeEventListener('themeChanged', handleThemeChange);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    let timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        sessionStorage.removeItem('dashboard_token');
        delete axios.defaults.headers.common['Authorization'];
        setIsAuthenticated(false);
      }, 15 * 60 * 1000); // 15 minut
    };
    
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('scroll', resetTimer, true);
    window.addEventListener('click', resetTimer);
    
    resetTimer();
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('scroll', resetTimer, true);
      window.removeEventListener('click', resetTimer);
    };
  }, [isAuthenticated]);

  if (isVerifying) {
    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-[#0A0B0E] text-textPrimary font-mono">
        <div className="w-10 h-10 border-2 border-accentPrimary border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_20px_rgba(var(--color-accent-primary),0.4)]" />
        <div className="text-sm font-bold tracking-widest text-accentPrimary">INICJALIZACJA SYSTEMU...</div>
      </div>
    );
  }

  const handleUnlock = async () => {
    setIsAuthenticated(true);
    const isCloudMode = window.location.hostname.includes('web.app') || window.location.hostname.includes('firebaseapp.com');
    if (isCloudMode) return;
    try {
      const res = await axios.get('/api/system/keys-status', { timeout: 3000 });
      if (res.data && Array.isArray(res.data.missing) && res.data.missing.length > 0) {
        setMissingKeys(res.data.missing);
      }
    } catch (e) {
      console.warn("Sprawdzanie kluczy pominięte:", e.message);
    }
  };

  if (!isAuthenticated) return <LockScreen onUnlock={handleUnlock} />;

  if (!setupCompleted) {
    return <SetupWizard onComplete={() => setSetupCompleted(true)} />;
  }

  if (missingKeys.length > 0) {
    return <ApiConfigScreen missingKeys={missingKeys} onConfigured={() => setMissingKeys([])} />;
  }

  return (
    <ChatProvider>
      <BrowserRouter>
        <GlobalEventListener />
        <div className="h-[100dvh] w-full bg-background overflow-hidden flex flex-col md:flex-row font-sans text-textPrimary relative">
          
          <OnboardingTour />
          <CommandPalette />
          <ToastContainer />
          
          {/* Nawigacja (Desktop Sidebar + Mobilny Header i Bottom Bar) */}
          <Sidebar />

          {/* Główny obszar zawartości (Router) */}
          <div className="flex-1 h-full p-2.5 sm:p-4 md:p-8 overflow-hidden min-w-0 flex flex-col pb-20 md:pb-0">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/osint" element={<OSINTPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/timetable" element={<TimetablePage />} />
              <Route path="/finances" element={<FinancePage />} />
              <Route path="/workouts" element={<WorkoutsPage />} />
              <Route path="/widgets" element={<WidgetsPage />} />
              <Route path="/memory" element={<MemoryPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/server" element={<ServerPage />} />
              <Route path="/browser" element={<BrowserPage />} />
            </Routes>
          </div>

        </div>
      </BrowserRouter>
    </ChatProvider>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(
  <ErrorBoundary>
    <I18nextProvider i18n={i18n}>
      <ToastProvider>
        <App />
      </ToastProvider>
    </I18nextProvider>
  </ErrorBoundary>
);
