import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DEFAULT_VISIBLE_NAV = {
  'pulpit': true,
  'omni-chat-ai': true,
  'plan-dnia-harmonogram': true,
  'oceny-edukacja': true,
  'finanse-koperty': true,
  'treningi-fbw': true,
  'kalendarz': true,
  'osint-toolkit': true,
  'baza-wiedzy-encje': true,
  'pamiec-operatora': true,
  'widzety-metryki': true,
  'serwer-logi': true,
};

const THEMES = [
  {
    id: 'dark',
    name: 'Cyber Dark',
    font: 'JetBrains Mono',
    sub: 'Default HUD',
    code: '#07090E',
    bg: '#07090e',
    accent1: '#00ffcc',
    accent2: '#2563eb',
    barClass: 'bg-[#00ffcc]/60'
  },
  {
    id: 'retro',
    name: 'Retro Amber',
    font: 'IBM Plex Mono',
    sub: 'Terminal CRT',
    code: 'P3 Phosphor',
    bg: '#140e02',
    accent1: '#ffb786',
    accent2: '#b45309',
    barClass: 'bg-[#ffb786]/60'
  },
  {
    id: 'monochrome',
    name: 'Mono Minimal',
    font: 'Inter Bold',
    sub: 'Brutalist 0% Tint',
    code: 'Pure Mono',
    bg: '#0e0e10',
    accent1: '#ffffff',
    accent2: '#71717a',
    barClass: 'bg-white/20'
  },
  {
    id: 'matrix',
    name: 'Matrix Green',
    font: 'Fira Code',
    sub: 'Phosphor High-Con',
    code: '#00FF66',
    bg: '#050f08',
    accent1: '#10b981',
    accent2: '#064e3b',
    barClass: 'bg-[#10b981]/50'
  },
  {
    id: 'synthwave',
    name: 'Synthwave',
    font: 'Outfit Sans',
    sub: 'Dusk Cyberpunk',
    code: 'Magenta Twilight',
    bg: '#140b1e',
    accent1: '#ec4899',
    accent2: '#8b5cf6',
    barClass: 'bg-[#ec4899]/60'
  },
  {
    id: 'nordic',
    name: 'Nordic Frost',
    font: 'Geist',
    sub: 'Glacial Cool',
    code: 'Sub-Zero Slate',
    bg: '#0c141c',
    accent1: '#38bdf8',
    accent2: '#0369a1',
    barClass: 'bg-[#38bdf8]/50'
  },
  {
    id: 'light',
    name: 'Clean Light',
    font: 'SF Pro Text',
    sub: 'Sterile Daylight',
    code: '100% White Point',
    bg: '#e2e8f0',
    accent1: '#2563eb',
    accent2: '#64748b',
    barClass: 'bg-blue-600/60'
  }
];

export const SettingsPage = () => {
  const navigate = useNavigate();

  // Active Theme
  const [theme, setTheme] = useState(() => localStorage.getItem('system_theme') || 'dark');
  const [savedToast, setSavedToast] = useState(false);
  const [resetToast, setResetToast] = useState(false);

  // Shell Navigation Visibility Matrix (12 modules)
  const [visibleNav, setVisibleNav] = useState(() => {
    try {
      const saved = localStorage.getItem('system_visible_nav');
      if (saved) return { ...DEFAULT_VISIBLE_NAV, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_VISIBLE_NAV;
  });

  // Security Policies State
  const [policies, setPolicies] = useState(() => {
    try {
      const saved = localStorage.getItem('system_security_policies');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      antiSsrf: true,
      toolCallingGuard: true,
      zeroEmoji: true,
      sqlCipher: true,
      pinAuth: true
    };
  });

  // Credentials State
  const [credentials, setCredentials] = useState(() => {
    try {
      const saved = localStorage.getItem('system_credentials_vault');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      groqKey: 'gsk_live_••••••••••••942x',
      braveKey: 'BSA_sec_••••••••••••881a',
      pushbulletKey: 'o.pb_tok_••••••••••••031k',
      librusSession: 'Bearer session_live_v2',
      firebaseAccount: 'service-account-omnidash-prd.json'
    };
  });

  // Credential Modal State
  const [activeCredModal, setActiveCredModal] = useState(null); // null | 'groq' | 'brave' | 'pushbullet' | 'librus' | 'firebase' | 'new'
  const [modalKeyInput, setModalKeyInput] = useState('');

  // Apply Theme to DOM
  const handleSelectTheme = (newThemeId) => {
    setTheme(newThemeId);
    document.documentElement.setAttribute('data-theme', newThemeId);
    if (newThemeId === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
    localStorage.setItem('system_theme', newThemeId);
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: newThemeId }));
  };

  // Toggle Module Visibility
  const handleToggleNav = (key) => {
    setVisibleNav(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem('system_visible_nav', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('visibleNavChanged', { detail: updated }));
      return updated;
    });
  };

  // Toggle Security Policy
  const handleTogglePolicy = (policyKey) => {
    setPolicies(prev => {
      const updated = { ...prev, [policyKey]: !prev[policyKey] };
      localStorage.setItem('system_security_policies', JSON.stringify(updated));
      return updated;
    });
  };

  // Save Settings
  const saveSettings = () => {
    localStorage.setItem('system_theme', theme);
    localStorage.setItem('system_visible_nav', JSON.stringify(visibleNav));
    localStorage.setItem('system_security_policies', JSON.stringify(policies));
    localStorage.setItem('system_credentials_vault', JSON.stringify(credentials));

    window.dispatchEvent(new CustomEvent('themeChanged', { detail: theme }));
    window.dispatchEvent(new CustomEvent('visibleNavChanged', { detail: visibleNav }));

    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  // Reset to Defaults
  const resetToDefaults = () => {
    handleSelectTheme('dark');
    setVisibleNav(DEFAULT_VISIBLE_NAV);
    const defPolicies = {
      antiSsrf: true,
      toolCallingGuard: true,
      zeroEmoji: true,
      sqlCipher: true,
      pinAuth: true
    };
    setPolicies(defPolicies);
    localStorage.setItem('system_visible_nav', JSON.stringify(DEFAULT_VISIBLE_NAV));
    localStorage.setItem('system_security_policies', JSON.stringify(defPolicies));
    window.dispatchEvent(new CustomEvent('visibleNavChanged', { detail: DEFAULT_VISIBLE_NAV }));

    setResetToast(true);
    setTimeout(() => setResetToast(false), 2500);
  };

  // Export JSON Configuration
  const handleExportJson = () => {
    const configData = {
      system_version: '3.1.0',
      export_date: new Date().toISOString(),
      theme,
      visibleNav,
      policies,
      metrics: {
        sqliteWalMb: 3.2,
        firestoreCacheKb: 184
      }
    };
    const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnidash-config-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download SQL Dump
  const handleDownloadSqlDump = () => {
    const dumpContent = `-- OmniDash SQLite WAL Export Dump
-- Version: 3.1.0
-- Generated: ${new Date().toISOString()}

PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS sys_meta (key TEXT PRIMARY KEY, val TEXT);
INSERT INTO sys_meta VALUES ('version', '3.1.0');
INSERT INTO sys_meta VALUES ('snapshot_hash', 'sha256:d8c4e5a901e');
COMMIT;
`;
    const blob = new Blob([dumpContent], { type: 'application/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnidash-dump-${new Date().toISOString().slice(0, 10)}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import JSON Configuration
  const handleImportJson = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result);
        if (parsed.theme) handleSelectTheme(parsed.theme);
        if (parsed.visibleNav) {
          setVisibleNav(parsed.visibleNav);
          localStorage.setItem('system_visible_nav', JSON.stringify(parsed.visibleNav));
          window.dispatchEvent(new CustomEvent('visibleNavChanged', { detail: parsed.visibleNav }));
        }
        if (parsed.policies) {
          setPolicies(parsed.policies);
          localStorage.setItem('system_security_policies', JSON.stringify(parsed.policies));
        }
        setSavedToast(true);
        setTimeout(() => setSavedToast(false), 2500);
      } catch (err) {
        alert('Defekt odczytu pliku konfiguracyjnego JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  // Save Modal Credential
  const handleSaveModalCred = () => {
    if (!modalKeyInput.trim()) {
      setActiveCredModal(null);
      return;
    }
    const masked = modalKeyInput.slice(0, 8) + '••••••••••••' + modalKeyInput.slice(-4);
    if (activeCredModal === 'groq') {
      setCredentials(p => ({ ...p, groqKey: masked }));
      localStorage.setItem('system_groq_api_key', modalKeyInput.trim());
    } else if (activeCredModal === 'brave') {
      setCredentials(p => ({ ...p, braveKey: masked }));
      localStorage.setItem('system_brave_api_key', modalKeyInput.trim());
    } else if (activeCredModal === 'pushbullet') {
      setCredentials(p => ({ ...p, pushbulletKey: masked }));
      localStorage.setItem('system_pushbullet_api_key', modalKeyInput.trim());
    }
    setActiveCredModal(null);
    setModalKeyInput('');
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  return (
    <div className="flex flex-col w-full space-y-space-xl">
      {/* Top Control Bar / Ambient Header */}
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md pb-space-lg border-b border-white/[0.08]">
        <div className="space-y-space-xs">
          <div className="flex items-center gap-space-xs font-code-mono text-label-sm text-outline">
            <span onClick={() => navigate('/')} className="hover:text-primary transition-colors cursor-pointer">OmniDash</span>
            <span className="text-outline-variant">/</span>
            <span>System Management</span>
            <span className="text-outline-variant">/</span>
            <span className="text-primary font-medium">Ustawienia</span>
            <span className="ml-space-sm px-space-xs py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-code-mono text-[10px] tracking-wide border border-white/[0.06]">
              CONFIG v3.0.4
            </span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-semibold">
            Ustawienia i Konfiguracja Środowiskowa
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
            Zarządzanie stanem jądra systemu, relacyjnymi tokenami dostępowymi, politykami izolacji węzłów oraz wizualną specyfikacją interfejsu.
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-space-sm shrink-0">
          <button 
            onClick={resetToDefaults}
            className="px-space-md py-space-xs rounded-lg bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors font-label-md text-label-md flex items-center gap-space-xs cursor-pointer" 
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">restart_alt</span>
            <span>{resetToast ? 'Przywrócono domyślne' : 'Resetuj do Domyślnych'}</span>
          </button>
          <button 
            onClick={saveSettings}
            className="px-space-md py-space-xs rounded-lg bg-primary text-on-primary font-label-md text-label-md flex items-center gap-space-xs shadow-[0_0_24px_rgba(173,198,255,0.25)] hover:bg-primary-fixed-dim transition-all cursor-pointer font-semibold" 
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            <span>{savedToast ? 'Zapisano pomyślnie!' : 'Zapisz Konfigurację'}</span>
          </button>
        </div>
      </section>

      {/* Section 1: Selektor 7 Motywów Systemowych */}
      <section className="space-y-space-md">
        <div className="flex items-baseline justify-between">
          <div className="space-y-space-xs">
            <div className="flex items-center gap-space-xs">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">01 // VISUAL KERNEL</span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
            </div>
            <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">Selektor Motywów Systemowych</h2>
          </div>
          <span className="font-code-mono text-label-sm text-on-surface-variant">7 wariantów renderera UI</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md">
          {THEMES.map((t) => {
            const isActive = theme === t.id;
            return (
              <div 
                key={t.id}
                onClick={() => handleSelectTheme(t.id)}
                className={`relative group p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-all cursor-pointer border ${
                  isActive 
                    ? 'ring-1 ring-primary/40 shadow-[0_0_24px_rgba(77,142,255,0.12)] border-primary/40' 
                    : 'border-white/[0.04]'
                }`}
              >
                <div className="flex items-center justify-between mb-space-sm">
                  <span className="font-headline-md text-[1rem] text-on-surface font-semibold tracking-tight">
                    {t.name}
                  </span>
                  <span className={`px-space-xs py-0.5 rounded-full font-code-mono text-[10px] uppercase font-bold tracking-wider ${
                    isActive ? 'bg-primary/20 text-primary' : 'text-outline'
                  }`}>
                    {isActive ? 'Aktywny' : 'Gotowy'}
                  </span>
                </div>

                {/* Theme preview frame */}
                <div 
                  className="w-full h-20 rounded-lg p-space-xs flex flex-col justify-between mb-space-sm overflow-hidden border border-white/[0.04]"
                  style={{ backgroundColor: t.bg }}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.accent1, boxShadow: `0 0 8px ${t.accent1}` }}></span>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.accent2 }}></span>
                    <span className="h-1.5 w-12 rounded bg-white/10"></span>
                  </div>
                  <div className="flex items-end justify-between">
                    <div className="space-y-1">
                      <div className="h-2 w-16 rounded bg-white/20"></div>
                      <div className={`h-1.5 w-10 rounded ${t.barClass}`}></div>
                    </div>
                    <span className="font-code-mono text-[9px]" style={{ color: t.accent1 }}>
                      {t.code}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-outline font-code-mono text-[11px]">
                  <span>Font: {t.font}</span>
                  <span className={isActive ? 'text-primary font-medium' : ''}>{t.sub}</span>
                </div>
              </div>
            );
          })}

          {/* Theme Engine Info Card */}
          <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col justify-between border border-white/[0.04]">
            <div>
              <div className="flex items-center gap-space-xs text-primary mb-space-xs">
                <span className="material-symbols-outlined text-[18px]">brush</span>
                <span className="font-label-md text-label-md font-semibold">Engine Palety v3</span>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Profile motywów wpływają na barwy akcentów, wygładzanie czcionek terminala oraz stopień rozmycia warstw Glassmorphic.
              </p>
            </div>
            <div className="pt-space-sm flex items-center justify-between font-code-mono text-[11px] text-outline">
              <span>Przełączanie natychmiastowe</span>
              <span className="text-on-surface font-semibold">GPU Accel</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2 & 3: Bento Grid Layout for Security + API Keys */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
        {/* Left Column (API Credentials Manager): 7 Columns */}
        <section className="xl:col-span-7 space-y-space-md">
          <div className="flex items-baseline justify-between">
            <div className="space-y-space-xs">
              <div className="flex items-center gap-space-xs">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">02 // VAULT &amp; TOKENS</span>
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              </div>
              <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">Menedżer Poświadczeń i Kluczy API</h2>
            </div>
            <button 
              onClick={() => { setActiveCredModal('new'); setModalKeyInput(''); }}
              className="font-code-mono text-label-sm text-primary hover:text-on-surface transition-colors flex items-center gap-1 cursor-pointer" 
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>Dodaj Poświadczenie</span>
            </button>
          </div>

          <div className="space-y-space-xs">
            {/* Credential 1: Groq LPU */}
            <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col md:flex-row md:items-center justify-between gap-space-md hover:bg-surface-container transition-colors border border-white/[0.04]">
              <div className="flex items-center gap-space-md min-w-0">
                <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0 text-primary">
                  <span className="material-symbols-outlined text-[20px]">bolt</span>
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-space-sm">
                    <span className="font-headline-md text-[0.9375rem] text-on-surface font-semibold truncate">Groq LPU Acceleration Key</span>
                    <span className="px-space-xs py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-code-mono text-[10px] uppercase font-semibold">120 t/s</span>
                  </div>
                  <div className="font-code-mono text-code-mono text-outline flex items-center gap-space-xs">
                    <span>Token:</span>
                    <span className="text-on-surface">{credentials.groqKey}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-space-md shrink-0">
                <span className="px-space-sm py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-label-sm text-label-sm flex items-center gap-1.5 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  W PEŁNI AKTYWNY
                </span>
                <button 
                  onClick={() => { setActiveCredModal('groq'); setModalKeyInput(''); }}
                  className="p-space-xs rounded text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer" 
                  title="Edytuj klucz" 
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">key</span>
                </button>
              </div>
            </div>

            {/* Credential 2: Brave Search API */}
            <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col md:flex-row md:items-center justify-between gap-space-md hover:bg-surface-container transition-colors border border-white/[0.04]">
              <div className="flex items-center gap-space-md min-w-0">
                <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0 text-tertiary">
                  <span className="material-symbols-outlined text-[20px]">travel_explore</span>
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-space-sm">
                    <span className="font-headline-md text-[0.9375rem] text-on-surface font-semibold truncate">Brave Search API Key</span>
                    <span className="px-space-xs py-0.5 rounded-full bg-surface-container text-on-surface-variant font-code-mono text-[10px]">OSINT Engine</span>
                  </div>
                  <div className="font-code-mono text-code-mono text-outline flex items-center gap-space-xs">
                    <span>Token:</span>
                    <span className="text-on-surface">{credentials.braveKey}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-space-md shrink-0">
                <span className="px-space-sm py-1 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm font-code-mono flex items-center gap-1.5">
                  LIMIT 14,200/15,000
                </span>
                <button 
                  onClick={() => { setActiveCredModal('brave'); setModalKeyInput(''); }}
                  className="p-space-xs rounded text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer" 
                  title="Edytuj klucz" 
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">key</span>
                </button>
              </div>
            </div>

            {/* Credential 3: Pushbullet */}
            <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col md:flex-row md:items-center justify-between gap-space-md hover:bg-surface-container transition-colors border border-white/[0.04]">
              <div className="flex items-center gap-space-md min-w-0">
                <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0 text-secondary">
                  <span className="material-symbols-outlined text-[20px]">notifications_active</span>
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-space-sm">
                    <span className="font-headline-md text-[0.9375rem] text-on-surface font-semibold truncate">Pushbullet Dispatch Access Token</span>
                  </div>
                  <div className="font-code-mono text-code-mono text-outline flex items-center gap-space-xs">
                    <span>Token:</span>
                    <span className="text-on-surface">{credentials.pushbulletKey}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-space-md shrink-0">
                <span className="px-space-sm py-1 rounded-full bg-indigo-500/15 text-secondary font-label-sm text-label-sm flex items-center gap-1.5 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  POŁĄCZONY WEBSOCKET
                </span>
                <button 
                  onClick={() => { setActiveCredModal('pushbullet'); setModalKeyInput(''); }}
                  className="p-space-xs rounded text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer" 
                  title="Edytuj klucz" 
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">key</span>
                </button>
              </div>
            </div>

            {/* Credential 4: Librus Synergia */}
            <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col md:flex-row md:items-center justify-between gap-space-md hover:bg-surface-container transition-colors border border-white/[0.04]">
              <div className="flex items-center gap-space-md min-w-0">
                <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[20px]">school</span>
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-space-sm">
                    <span className="font-headline-md text-[0.9375rem] text-on-surface font-semibold truncate">Librus Synergia OAuth2 Token</span>
                  </div>
                  <div className="font-code-mono text-code-mono text-outline flex items-center gap-space-xs">
                    <span>OAuth:</span>
                    <span className="text-on-surface">{credentials.librusSession}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-space-md shrink-0">
                <span className="px-space-sm py-1 rounded-full bg-amber-500/10 text-tertiary font-label-sm text-label-sm flex items-center gap-1.5 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                  SESJA WAŻNA (18h)
                </span>
                <button 
                  onClick={() => alert('[*] INFO :: Sesja Librus Synergia zsynchronizowana pomyślnie.')}
                  className="p-space-xs rounded text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer" 
                  title="Odśwież token" 
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">sync</span>
                </button>
              </div>
            </div>

            {/* Credential 5: Firebase Admin */}
            <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col md:flex-row md:items-center justify-between gap-space-md hover:bg-surface-container transition-colors border border-white/[0.04]">
              <div className="flex items-center gap-space-md min-w-0">
                <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0 text-primary">
                  <span className="material-symbols-outlined text-[20px]">cloud_sync</span>
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-space-sm">
                    <span className="font-headline-md text-[0.9375rem] text-on-surface font-semibold truncate">Firebase Admin Service Account</span>
                  </div>
                  <div className="font-code-mono text-code-mono text-outline flex items-center gap-space-xs">
                    <span>Plik:</span>
                    <span className="text-on-surface">{credentials.firebaseAccount}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-space-md shrink-0">
                <span className="px-space-sm py-1 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm font-code-mono flex items-center gap-1.5">
                  PODPISANY SHA-256
                </span>
                <button 
                  onClick={() => alert('[*] INFO :: Certyfikat Firebase Admin zweryfikowany: RSA 4096 / SHA-256.')}
                  className="p-space-xs rounded text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer" 
                  title="Podgląd certyfikatu" 
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column (Security Policy Engine): 5 Columns */}
        <section className="xl:col-span-5 space-y-space-md">
          <div className="space-y-space-xs">
            <div className="flex items-center gap-space-xs">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">03 // DEFENSE &amp; SANDBOX</span>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            </div>
            <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">Polityka Uprawnień i Bezpieczeństwo AI</h2>
          </div>

          <div className="p-space-lg rounded-xl bg-surface-container-low space-y-space-md border border-white/[0.04]">
            <div className="flex items-center justify-between pb-space-sm border-b border-white/[0.06]">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Reguła / Mechanizm</span>
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Stan Sandboxa</span>
            </div>

            {/* Toggle Item 1 */}
            <div className="flex items-start justify-between gap-space-md">
              <div className="space-y-0.5">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-primary text-[18px]">shield</span>
                  <span className="font-body-md text-body-md text-on-surface font-semibold">Tarcza Anty-SSRF i Izolacja Węzłów</span>
                </div>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Blokada wywołań localhost, 127.0.0.1 oraz adresacji link-local dla scraperów OSINT.</p>
              </div>
              <button 
                onClick={() => handleTogglePolicy('antiSsrf')}
                className={`w-11 h-6 rounded-full relative p-0.5 transition-colors shrink-0 cursor-pointer ${
                  policies.antiSsrf ? 'bg-primary' : 'bg-surface-container-highest'
                }`} 
                type="button"
              >
                <div className={`w-5 h-5 rounded-full bg-on-primary shadow-sm transform transition-transform ${
                  policies.antiSsrf ? 'translate-x-5' : 'translate-x-0'
                }`}></div>
              </button>
            </div>

            {/* Toggle Item 2 */}
            <div className="flex items-start justify-between gap-space-md">
              <div className="space-y-0.5">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-secondary text-[18px]">terminal</span>
                  <span className="font-body-md text-body-md text-on-surface font-semibold">Restrykcyjny Tryb Narzędzi AI</span>
                </div>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Wymuszenie zatwierdzenia przez operatora przed zapisem do bazy SQLite (Tool Calling Guard).</p>
              </div>
              <button 
                onClick={() => handleTogglePolicy('toolCallingGuard')}
                className={`w-11 h-6 rounded-full relative p-0.5 transition-colors shrink-0 cursor-pointer ${
                  policies.toolCallingGuard ? 'bg-primary' : 'bg-surface-container-highest'
                }`} 
                type="button"
              >
                <div className={`w-5 h-5 rounded-full bg-on-primary shadow-sm transform transition-transform ${
                  policies.toolCallingGuard ? 'translate-x-5' : 'translate-x-0'
                }`}></div>
              </button>
            </div>

            {/* Toggle Item 3 */}
            <div className="flex items-start justify-between gap-space-md">
              <div className="space-y-0.5">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-on-surface-variant text-[18px]">do_not_disturb_on</span>
                  <span className="font-body-md text-body-md text-on-surface font-semibold">Zero-Emoji Enforcement Protocol</span>
                </div>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Automatyczne odfiltrowywanie znaków piktograficznych i emoji ze strumieni LLM.</p>
              </div>
              <button 
                onClick={() => handleTogglePolicy('zeroEmoji')}
                className={`w-11 h-6 rounded-full relative p-0.5 transition-colors shrink-0 cursor-pointer ${
                  policies.zeroEmoji ? 'bg-primary' : 'bg-surface-container-highest'
                }`} 
                type="button"
              >
                <div className={`w-5 h-5 rounded-full bg-on-primary shadow-sm transform transition-transform ${
                  policies.zeroEmoji ? 'translate-x-5' : 'translate-x-0'
                }`}></div>
              </button>
            </div>

            {/* Toggle Item 4 */}
            <div className="flex items-start justify-between gap-space-md">
              <div className="space-y-0.5">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-primary text-[18px]">enhanced_encryption</span>
                  <span className="font-body-md text-body-md text-on-surface font-semibold">SQLCipher (256-bit AES)</span>
                </div>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Transparentne szyfrowanie bazy relacyjnej w spoczynku z kluczem w Secure Enclave.</p>
              </div>
              <button 
                onClick={() => handleTogglePolicy('sqlCipher')}
                className={`w-11 h-6 rounded-full relative p-0.5 transition-colors shrink-0 cursor-pointer ${
                  policies.sqlCipher ? 'bg-primary' : 'bg-surface-container-highest'
                }`} 
                type="button"
              >
                <div className={`w-5 h-5 rounded-full bg-on-primary shadow-sm transform transition-transform ${
                  policies.sqlCipher ? 'translate-x-5' : 'translate-x-0'
                }`}></div>
              </button>
            </div>

            {/* Toggle Item 5 */}
            <div className="flex items-start justify-between gap-space-md">
              <div className="space-y-0.5">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-tertiary text-[18px]">pin</span>
                  <span className="font-body-md text-body-md text-on-surface font-semibold">Autoryzacja PIN dla Bazy Wiedzy</span>
                </div>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Dwuetapowa weryfikacja PIN przed odsłonięciem wrażliwych encji personalnych.</p>
              </div>
              <button 
                onClick={() => handleTogglePolicy('pinAuth')}
                className={`w-11 h-6 rounded-full relative p-0.5 transition-colors shrink-0 cursor-pointer ${
                  policies.pinAuth ? 'bg-primary' : 'bg-surface-container-highest'
                }`} 
                type="button"
              >
                <div className={`w-5 h-5 rounded-full bg-on-primary shadow-sm transform transition-transform ${
                  policies.pinAuth ? 'translate-x-5' : 'translate-x-0'
                }`}></div>
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Section 4: Personalizacja Paska Bocznego i Widoczności Modułów */}
      <section className="space-y-space-md">
        <div className="flex items-baseline justify-between">
          <div className="space-y-space-xs">
            <div className="flex items-center gap-space-xs">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">04 // SHELL NAVIGATION</span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
            </div>
            <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">Personalizacja Paska Bocznego i Widoczności Modułów</h2>
          </div>
          <span className="font-code-mono text-label-sm text-on-surface-variant">
            {Object.values(visibleNav).filter(Boolean).length} z 12 modułów aktywnych
          </span>
        </div>

        {/* 12-Module Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-space-sm">
          {[
            { id: 'pulpit', label: 'Pulpit', icon: 'dashboard' },
            { id: 'omni-chat-ai', label: 'Omni Chat & AI', icon: 'smart_toy' },
            { id: 'plan-dnia-harmonogram', label: 'Plan Dnia', icon: 'schedule' },
            { id: 'oceny-edukacja', label: 'Oceny & Edukacja', icon: 'school' },
            { id: 'finanse-koperty', label: 'Finanse & Koperty', icon: 'account_balance_wallet' },
            { id: 'treningi-fbw', label: 'Treningi FBW', icon: 'fitness_center' },
            { id: 'kalendarz', label: 'Kalendarz', icon: 'calendar_month' },
            { id: 'osint-toolkit', label: 'OSINT Toolkit', icon: 'radar' },
            { id: 'baza-wiedzy-encje', label: 'Baza Wiedzy', icon: 'hub' },
            { id: 'pamiec-operatora', label: 'Pamięć Operatora', icon: 'memory' },
            { id: 'widzety-metryki', label: 'Widżety & Metryki', icon: 'monitoring' },
            { id: 'serwer-logi', label: 'Serwer & Logi', icon: 'terminal' },
          ].map((mod) => {
            const isVisible = visibleNav[mod.id] !== false;
            return (
              <div 
                key={mod.id}
                onClick={() => handleToggleNav(mod.id)}
                className={`p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between hover:bg-surface-container transition-colors cursor-pointer border ${
                  isVisible ? 'border-white/[0.04]' : 'border-white/[0.02] opacity-50'
                }`}
              >
                <div className="flex items-center gap-space-sm min-w-0">
                  <span className="material-symbols-outlined text-[18px] text-outline cursor-grab">drag_indicator</span>
                  <span className={`material-symbols-outlined text-[18px] ${isVisible ? 'text-primary' : 'text-outline'}`}>
                    {mod.icon}
                  </span>
                  <span className="font-body-md text-body-md text-on-surface truncate font-medium">
                    {mod.label}
                  </span>
                </div>
                <div className="flex items-center gap-space-xs">
                  <span className={`material-symbols-outlined text-[18px] ${isVisible ? 'text-primary' : 'text-outline'}`}>
                    {isVisible ? 'visibility' : 'visibility_off'}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${isVisible ? 'bg-primary' : 'bg-outline'}`}></span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 5: Kopia Zapasowa i Eksport Danych */}
      <section className="p-space-lg rounded-xl bg-surface-container-low border border-white/[0.04] space-y-space-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
          <div className="space-y-space-xs">
            <div className="flex items-center gap-space-xs">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">05 // PERSISTENCE &amp; SNAPSHOTS</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            </div>
            <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">Kopia Zapasowa i Eksport Danych</h2>
            <div className="flex items-center gap-space-md font-code-mono text-label-sm text-on-surface-variant flex-wrap">
              <span>Ostatni snapshot: <strong className="text-on-surface">Dzisiaj, 03:00 (OK)</strong></span>
              <span className="text-outline-variant">•</span>
              <span>Hash stanu: <span className="text-primary font-semibold">sha256:d8c4...901e</span></span>
            </div>
          </div>

          {/* Telemetry mini-badges */}
          <div className="flex items-center gap-space-md">
            <div className="p-space-sm rounded-lg bg-surface-container space-y-0.5 border border-white/[0.04]">
              <div className="font-label-sm text-label-sm text-outline">SQLite WAL Size</div>
              <div className="font-code-mono text-headline-md text-primary font-bold">3.2 MB</div>
            </div>
            <div className="p-space-sm rounded-lg bg-surface-container space-y-0.5 border border-white/[0.04]">
              <div className="font-label-sm text-label-sm text-outline">Firestore Cache</div>
              <div className="font-code-mono text-headline-md text-secondary font-bold">184 KB</div>
            </div>
          </div>
        </div>

        {/* Storage visual indicator */}
        <div className="space-y-space-xs">
          <div className="flex justify-between font-code-mono text-[11px] text-outline">
            <span>Alokacja lokalnej bazy danych SQLite WAL</span>
            <span>3.38 MB / 512 MB Próg limitu</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden flex">
            <div className="h-full bg-primary" style={{ width: '1.2%' }}></div>
            <div className="h-full bg-secondary" style={{ width: '0.4%' }}></div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="pt-space-sm flex flex-wrap items-center gap-space-sm">
          <button 
            onClick={handleDownloadSqlDump}
            className="px-space-md py-space-xs rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-label-md text-label-md flex items-center gap-space-xs cursor-pointer border border-white/[0.04]" 
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">database</span>
            <span>Pobierz Pełny Zrzut Bazy (SQL Dump)</span>
          </button>
          <button 
            onClick={handleExportJson}
            className="px-space-md py-space-xs rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-label-md text-label-md flex items-center gap-space-xs cursor-pointer border border-white/[0.04]" 
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">file_download</span>
            <span>Eksportuj Konfigurację JSON</span>
          </button>
          <label className="px-space-md py-space-xs rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-label-md text-label-md flex items-center gap-space-xs cursor-pointer border border-white/[0.04]">
            <span className="material-symbols-outlined text-[18px]">file_upload</span>
            <span>Importuj Stan Środowiska</span>
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          </label>
        </div>
      </section>

      {/* Credential Edit Modal */}
      {activeCredModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl bg-surface-container-low border border-white/[0.1] p-space-lg shadow-2xl flex flex-col space-y-space-md">
            <div className="flex items-center justify-between pb-space-xs border-b border-white/[0.06]">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[20px]">key</span>
                <h3 className="font-headline-md text-headline-md font-semibold text-on-surface">
                  {activeCredModal === 'new' ? 'Dodaj Poświadczenie' : `Edytuj Klucz: ${activeCredModal.toUpperCase()}`}
                </h3>
              </div>
              <button 
                onClick={() => setActiveCredModal(null)}
                className="text-outline hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <p className="font-body-md text-body-md text-on-surface-variant">
              Wprowadź nowy klucz API lub token dostępowy. Wartość zostanie zanonimizowana w interfejsie i zapisana w bezpiecznym sejfie przeglądarki.
            </p>

            <input
              type="text"
              placeholder="Wklej klucz / token (np. gsk_... lub BSA_...)"
              value={modalKeyInput}
              onChange={(e) => setModalKeyInput(e.target.value)}
              className="w-full bg-surface-container rounded-lg px-space-md py-2 text-on-surface placeholder:text-outline font-code-mono text-sm border border-white/[0.06] focus:outline-none focus:border-primary"
            />

            <div className="flex items-center justify-end gap-space-sm pt-space-xs">
              <button
                type="button"
                onClick={() => setActiveCredModal(null)}
                className="px-space-md py-space-xs rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface font-label-md text-label-md cursor-pointer"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={handleSaveModalCred}
                className="px-space-md py-space-xs rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-primary-fixed-dim transition-all cursor-pointer shadow-md"
              >
                Zapisz Klucz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
