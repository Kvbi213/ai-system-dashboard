import React, { useState, useEffect } from 'react';
import { wakeWordService } from '../services/wakeWordService';

const AppHeader = ({ onToggleMobileMenu, isMobileMenuOpen, onLockScreen }) => {
  const [telemetry, setTelemetry] = useState({
    cpu: 12,
    ram: '4.2GB',
    ping: 24,
    walActive: true,
    firestoreSynced: true,
    groqSpeed: '120t/s'
  });
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    // SSE Stream Subscription dla żywych metryk systemowych
    let eventSource = null;
    const isCloudMode = window.location.hostname.includes('web.app') || window.location.hostname.includes('firebaseapp.com');

    if (!isCloudMode && typeof EventSource !== 'undefined') {
      try {
        eventSource = new EventSource('/api/system/stream');
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.cpu !== undefined) {
              setTelemetry(prev => ({
                ...prev,
                cpu: Math.round(data.cpu),
                ram: data.memory ? `${(data.memory.rss / (1024 * 1024 * 1024)).toFixed(1)}GB` : prev.ram,
                ping: data.ping || prev.ping
              }));
            }
          } catch (e) {
            // Ignore parse errors
          }
        };
      } catch (err) {
        console.debug('SSE EventSource fallback', err);
      }
    }

    // Ping check fallback dla chmury
    const pingInterval = setInterval(() => {
      const start = Date.now();
      fetch('/api/status', { method: 'GET', cache: 'no-store' })
        .then(res => {
          if (res.ok) {
            const rtt = Date.now() - start;
            setTelemetry(prev => ({ ...prev, ping: Math.min(rtt, 120), walActive: true, firestoreSynced: true }));
          }
        })
        .catch(() => {
          // Cloud / offline fallback
        });
    }, 15000);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(pingInterval);
    };
  }, []);

  const handleHejOmni = () => {
    setIsListening(true);
    wakeWordService.simulateWakeWord();
    setTimeout(() => setIsListening(false), 2500);
  };

  const handleCommandPalette = () => {
    window.dispatchEvent(new CustomEvent('openCommandPalette'));
    // Fallback focus to global search if palette listener is mounted
  };

  const handleToggleTheme = () => {
    const themes = ['dark', 'retro', 'monochrome', 'matrix', 'synthwave', 'nordic'];
    const current = localStorage.getItem('system_theme') || 'dark';
    const nextIdx = (themes.indexOf(current) + 1) % themes.length;
    const nextTheme = themes[nextIdx];
    localStorage.setItem('system_theme', nextTheme);
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: nextTheme }));
  };

  return (
    <header className="fixed top-0 left-0 md:left-64 right-0 h-16 bg-surface/85 backdrop-blur-xl z-40 px-3 sm:px-space-md md:px-space-lg flex items-center justify-between border-b border-white/[0.04] shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      {/* Lewa strefa: Mobilny przycisk menu + Wskaźniki Stanu */}
      <div className="flex items-center gap-2 sm:gap-space-sm md:gap-space-md">
        {/* Mobile menu button (min 44px touch target) */}
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden w-11 h-11 flex items-center justify-center rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface active:scale-95 transition-all"
          aria-label="Przełącz menu"
          type="button"
        >
          <span className="material-symbols-outlined text-[22px]">
            {isMobileMenuOpen ? 'close' : 'menu'}
          </span>
        </button>

        {/* Status Pill: SQLite WAL */}
        <div className="flex items-center gap-1.5 px-2.5 sm:px-space-sm py-1 rounded-full bg-surface-container-low border border-white/[0.05]">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="font-code-mono text-label-sm sm:text-code-mono text-on-surface font-medium whitespace-nowrap">
            SQLite WAL
          </span>
        </div>

        {/* Status Pill: Firestore Synced */}
        <div className="hidden sm:flex items-center gap-1.5 px-space-sm py-1 rounded-full bg-surface-container-low border border-white/[0.05]">
          <span className="w-2 h-2 rounded-full bg-secondary" />
          <span className="font-code-mono text-code-mono text-on-surface-variant whitespace-nowrap">
            Firestore Synced
          </span>
        </div>

        {/* Status Pill: Groq LPU */}
        <div className="hidden xl:flex items-center gap-space-xs px-space-sm py-1 rounded-full bg-surface-container-low border border-white/[0.05]">
          <span className="w-2 h-2 rounded-full bg-tertiary" />
          <span className="font-code-mono text-code-mono text-on-surface-variant whitespace-nowrap">
            Groq LPU {telemetry.groqSpeed}
          </span>
        </div>
      </div>

      {/* Środkowa strefa: Hardware Telemetry Strip (Desktop) */}
      <div className="hidden lg:flex items-center gap-space-md xl:gap-space-lg px-space-md py-1 rounded-lg bg-surface-container-lowest font-code-mono text-code-mono text-on-surface-variant border border-white/[0.04]">
        <div className="flex items-center gap-space-xs">
          <span className="text-outline font-label-sm uppercase">CPU</span>
          <span className="text-on-surface font-semibold">{telemetry.cpu}%</span>
        </div>
        <div className="flex items-center gap-space-xs">
          <span className="text-outline font-label-sm uppercase">RAM</span>
          <span className="text-on-surface font-semibold">{telemetry.ram}</span>
        </div>
        <div className="flex items-center gap-space-xs">
          <span className="text-outline font-label-sm uppercase">NET</span>
          <span className="text-primary font-semibold">{telemetry.ping}ms</span>
        </div>
      </div>

      {/* Prawa strefa: Akcje i Narzędzia Operatora */}
      <div className="flex items-center gap-1.5 sm:gap-space-sm">
        {/* Hej Omni Voice Trigger */}
        <button
          onClick={handleHejOmni}
          className="flex items-center gap-1.5 px-2.5 sm:px-space-md py-1.5 rounded-full bg-surface-container-high text-on-surface hover:bg-surface-bright active:scale-95 transition-all border border-white/[0.06]"
          type="button"
          title="Wywołaj asystenta głosowego"
        >
          <span className="material-symbols-outlined text-primary text-[18px]">mic</span>
          <span className="hidden sm:inline font-label-md text-label-md font-medium">Hej Omni</span>
          <span className={`w-1.5 h-1.5 rounded-full bg-primary ${isListening ? 'animate-ping' : ''}`} />
        </button>

        {/* Command Palette Trigger ⌘K */}
        <button
          onClick={handleCommandPalette}
          className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface active:scale-95 transition-all font-code-mono text-code-mono border border-white/[0.04]"
          type="button"
          title="Szukaj (Ctrl + K)"
        >
          <span className="material-symbols-outlined text-[16px]">keyboard_command_key</span>
          <span>K</span>
        </button>

        {/* Przełącznik motywów */}
        <button
          onClick={handleToggleTheme}
          className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface active:scale-95 transition-all border border-white/[0.04]"
          title="Przełącz motyw"
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">palette</span>
        </button>

        {/* Profil i Blokada */}
        <div
          onClick={onLockScreen}
          className="w-8 h-8 rounded-full bg-primary flex items-center justify-center ml-1 cursor-pointer active:scale-90 transition-transform shadow-[0_0_12px_rgba(173,198,255,0.3)]"
          title="Profil Operatora (Kliknij by zablokować)"
        >
          <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
