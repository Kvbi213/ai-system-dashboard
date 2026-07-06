import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import './assets/styles/index.css';

import Sidebar from './modules/components/Sidebar';
import Dashboard from './modules/pages/Dashboard';
import ChatPage from './modules/pages/ChatPage';
import SearchPage from './modules/pages/SearchPage';
import SettingsPage from './modules/pages/SettingsPage';
import WidgetsPage from './modules/pages/WidgetsPage';
import CalendarPage from './modules/pages/CalendarPage';
import FinancePage from './modules/pages/FinancePage';
import MemoryPage from './modules/pages/MemoryPage';
import OSINTPage from './modules/pages/OSINTPage';
import LockScreen from './modules/pages/LockScreen';
import { ChatProvider } from './modules/context/ChatContext';
import ApiConfigScreen from './modules/components/ApiConfigScreen';
import OnboardingTour from './modules/components/OnboardingTour';
import SetupWizard from './modules/components/SetupWizard';

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

    const savedTheme = localStorage.getItem('system_theme') || 'dark';
    const savedAccent = localStorage.getItem('system_accent');
    const savedAccentHex = localStorage.getItem('system_accent_hex');

    if (savedTheme === 'light') {
      document.documentElement.classList.add('theme-light');
    } else {
      document.documentElement.classList.remove('theme-light');
    }

    if (savedAccent && savedAccentHex) {
      document.documentElement.style.setProperty('--color-accent-primary', savedAccent);
      document.documentElement.style.setProperty('--color-accent-primary-hex', savedAccentHex);
      document.documentElement.style.setProperty('--color-accent-secondary', savedAccentHex);
    }

    const checkKeysStatus = () => {
      const token = sessionStorage.getItem('dashboard_token');
      axios.get('/api/system/keys-status')
        .then((res) => {
          if (res.data.missing && res.data.missing.length > 0) {
            setMissingKeys(res.data.missing);
            setIsVerifying(false);
            return;
          }

          if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            axios.get('/api/auth/verify')
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
          console.error("Błąd pobierania statusu kluczy, ponawianie za 1s:", err);
          setTimeout(checkKeysStatus, 1000);
        });
    };

    checkKeysStatus();
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

  if (isVerifying) return <div className="h-[100dvh] w-full flex items-center justify-center bg-background text-accent">Wczytywanie...</div>;

  const handleUnlock = async () => {
    setIsAuthenticated(true);
    try {
      const res = await axios.get('/api/system/keys-status');
      if (res.data.missing && res.data.missing.length > 0) {
        setMissingKeys(res.data.missing);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!setupCompleted) {
    return <SetupWizard onComplete={() => setSetupCompleted(true)} />;
  }

  if (missingKeys.length > 0) {
    return <ApiConfigScreen missingKeys={missingKeys} onConfigured={() => setMissingKeys([])} />;
  }

  if (!isAuthenticated) return <LockScreen onUnlock={handleUnlock} />;

  return (
    <ChatProvider>
      <BrowserRouter>
        <div className="h-[100dvh] w-full bg-background overflow-hidden flex flex-col-reverse md:flex-row font-sans text-textPrimary relative">
          
          <OnboardingTour />
          
          {/* Lewy pasek nawigacyjny */}
          <Sidebar />

          {/* Główny obszar zawartości (Router) */}
          <div className="flex-1 h-full p-4 md:p-8 overflow-hidden min-w-0">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/osint" element={<OSINTPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/finances" element={<FinancePage />} />
              <Route path="/widgets" element={<WidgetsPage />} />
              <Route path="/memory" element={<MemoryPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </div>

        </div>
      </BrowserRouter>
    </ChatProvider>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);
