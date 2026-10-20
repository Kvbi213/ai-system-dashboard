import React, { useState, useEffect } from 'react';
import { 
  Palette, 
  LayoutGrid, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Globe, 
  ShieldCheck, 
  Cpu, 
  Bell, 
  BookOpen, 
  Settings2,
  Lock,
  Sparkles
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { THEME_PRESETS, COLOR_PRESETS, NEWS_CATEGORIES } from '../config/constants';

const SetupWizard = ({ onComplete }) => {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // Krok 1: Tożsamość i Wizualia
  const [theme, setTheme] = useState(() => localStorage.getItem('system_theme') || 'dark');
  const [systemLang, setSystemLang] = useState(() => localStorage.getItem('system_language') || 'pl');
  const [userName, setUserName] = useState(() => localStorage.getItem('system_user_name') || 'Operator K.');
  const [accent, setAccent] = useState(() => {
    const savedHex = localStorage.getItem('system_accent_hex');
    return COLOR_PRESETS.find(c => c.hex === savedHex) || COLOR_PRESETS[0];
  });

  // Krok 2: Tryby Pracy & Integracje API
  const [librusMode, setLibrusMode] = useState(() => {
    return localStorage.getItem('system_librus_enabled') === 'true' ? 'api' : 'standalone';
  });
  const [librusLogin, setLibrusLogin] = useState(() => localStorage.getItem('system_librus_login') || '');
  const [librusPass, setLibrusPass] = useState(() => localStorage.getItem('system_librus_pass') || '');
  
  const [aiEngine, setAiEngine] = useState(() => localStorage.getItem('system_ai_engine') || 'groq');
  const [customAiKey, setCustomAiKey] = useState(() => localStorage.getItem('system_custom_ai_key') || '');
  
  const [pushbulletEnabled, setPushbulletEnabled] = useState(() => localStorage.getItem('system_pushbullet_enabled') === 'true');
  const [pushbulletToken, setPushbulletToken] = useState(() => localStorage.getItem('system_pushbullet_token') || '');

  // Krok 3: Moduły i Kafelki
  const [selectedNews, setSelectedNews] = useState(['ai', 'security', 'startups']);
  const [activeWidgets, setActiveWidgets] = useState(() => {
    try {
      const saved = localStorage.getItem('system_active_widgets');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      systemMonitor: true,
      networkMonitor: true,
      cryptoTracker: true,
      quickNotes: true,
      tokenTracker: true,
      modelStatus: true,
      promptVault: true,
      agentQueue: true
    };
  });

  useEffect(() => {
    document.documentElement.classList.toggle('theme-light', theme === 'light');
    document.documentElement.style.setProperty('--color-accent-primary', accent.rgb);
    document.documentElement.style.setProperty('--color-accent-primary-hex', accent.hex);
    document.documentElement.style.setProperty('--color-accent-secondary', accent.hex);
  }, []);

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
    else finishSetup();
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const toggleWidget = (key) => {
    setActiveWidgets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const finishSetup = () => {
    // 1. Zapis preferencji wizualnych
    localStorage.setItem('system_theme', theme);
    localStorage.setItem('system_language', systemLang);
    localStorage.setItem('system_accent', accent.rgb);
    localStorage.setItem('system_accent_hex', accent.hex);
    document.documentElement.classList.toggle('theme-light', theme === 'light');
    document.documentElement.style.setProperty('--color-accent-primary', accent.rgb);
    document.documentElement.style.setProperty('--color-accent-primary-hex', accent.hex);
    document.documentElement.style.setProperty('--color-accent-secondary', accent.hex);

    // 2. Tożsamość
    localStorage.setItem('system_user_name', userName.trim() || 'Operator K.');

    // 3. Integracje API i tryb pracy
    const isLibrusActive = librusMode === 'api';
    localStorage.setItem('system_librus_enabled', isLibrusActive ? 'true' : 'false');
    if (isLibrusActive) {
      if (librusLogin) localStorage.setItem('system_librus_login', librusLogin);
      if (librusPass) localStorage.setItem('system_librus_pass', librusPass);
    }

    localStorage.setItem('system_ai_engine', aiEngine);
    if (customAiKey) localStorage.setItem('system_custom_ai_key', customAiKey);

    localStorage.setItem('system_pushbullet_enabled', pushbulletEnabled ? 'true' : 'false');
    if (pushbulletToken) localStorage.setItem('system_pushbullet_token', pushbulletToken);

    // 4. Moduły i stan zakończenia
    localStorage.setItem('system_news_categories', JSON.stringify(selectedNews));
    localStorage.setItem('system_active_widgets', JSON.stringify(activeWidgets));
    localStorage.setItem('system_setup_completed', 'true');

    // 5. Rozesłanie zdarzeń systemowych
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: theme }));
    window.dispatchEvent(new CustomEvent('systemConfigUpdated', { 
      detail: { librusEnabled: isLibrusActive, aiEngine, userName } 
    }));
    window.dispatchEvent(new CustomEvent('librusConfigChanged', { 
      detail: { enabled: isLibrusActive } 
    }));
    window.dispatchEvent(new CustomEvent('activeWidgetsChanged', { detail: activeWidgets }));

    if (onComplete) onComplete();
  };

  const applyThemePresetLive = (preset) => {
    setTheme(preset.id);
    const colorObj = { name: preset.name, rgb: preset.accentRgb, hex: preset.accentHex };
    setAccent(colorObj);
    localStorage.setItem('system_theme', preset.id);
    localStorage.setItem('system_accent', preset.accentRgb);
    localStorage.setItem('system_accent_hex', preset.accentHex);
    document.documentElement.classList.toggle('theme-light', preset.id === 'light');
    document.documentElement.style.setProperty('--color-accent-primary', preset.accentRgb);
    document.documentElement.style.setProperty('--color-accent-primary-hex', preset.accentHex);
    document.documentElement.style.setProperty('--color-accent-secondary', preset.accentHex);
  };

  const changeAccentLive = (c) => {
    setAccent(c);
    document.documentElement.style.setProperty('--color-accent-primary', c.rgb);
    document.documentElement.style.setProperty('--color-accent-primary-hex', c.hex);
    document.documentElement.style.setProperty('--color-accent-secondary', c.hex);
    localStorage.setItem('system_accent', c.rgb);
    localStorage.setItem('system_accent_hex', c.hex);
  };

  // KROK 1: Tożsamość i Stylistyka
  const renderStep1 = () => (
    <div className="space-y-4 animate-fade-in-up max-h-[62vh] overflow-y-auto pr-1 custom-scrollbar text-xs sm:text-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-textPrimary mb-1.5 flex items-center gap-1.5">
            <LayoutGrid className="w-3.5 h-3.5 text-accentPrimary" />
            Imię / Pseudonim Operatora
          </label>
          <input 
            type="text" 
            value={userName} 
            onChange={(e) => setUserName(e.target.value)} 
            className="w-full bg-surface border border-border rounded-xl px-3.5 py-2 focus:outline-none focus:border-accentPrimary text-textPrimary font-mono text-xs"
            placeholder="np. Operator K."
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-textPrimary mb-1.5 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-accentPrimary" />
            Język Systemu
          </label>
          <select 
            value={systemLang}
            onChange={(e) => {
              setSystemLang(e.target.value);
              i18n.changeLanguage(e.target.value);
              localStorage.setItem('system_language', e.target.value);
            }}
            className="w-full bg-surface border border-border rounded-xl px-3.5 py-2 focus:outline-none focus:border-accentPrimary text-textPrimary font-mono text-xs"
          >
            <option value="pl">Polski (PL)</option>
            <option value="en">English (EN)</option>
            <option value="uk">Ukraïnska (UK)</option>
            <option value="zh">Mandarin (ZH)</option>
          </select>
        </div>
      </div>

      {/* Wybór motywu wizualnego */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-textPrimary flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-accentPrimary" /> Wybierz Gotowy Styl Interfejsu
          </span>
          <span className="text-[10px] font-mono text-accentPrimary">7 gotowych kompozycji</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {THEME_PRESETS.map((preset) => {
            const isCurrent = theme === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyThemePresetLive(preset)}
                className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                  isCurrent 
                    ? 'border-accentPrimary bg-accentPrimary/10 shadow-[0_0_12px_rgba(var(--color-accent-primary),0.2)]' 
                    : 'border-border/60 hover:border-border bg-surface/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-bold text-textPrimary truncate">{preset.name.split(' (')[0]}</span>
                  {isCurrent && <Check className="w-3.5 h-3.5 text-accentPrimary shrink-0" />}
                </div>
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-border/30">
                  <span className="text-[9px] font-mono text-textMuted">{preset.tag}</span>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full border border-white/20" style={{ backgroundColor: preset.bgPreview }} />
                    <span className="w-2.5 h-2.5 rounded-full border border-white/20" style={{ backgroundColor: preset.accentPreview }} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Akcent kolorystyczny */}
      <div>
        <label className="text-xs font-semibold text-textPrimary mb-2 flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-accentPrimary" />
          Precyzyjny Akcent Kolorystyczny
        </label>
        <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
          {COLOR_PRESETS.map(c => (
            <button
              key={c.hex}
              type="button"
              onClick={() => changeAccentLive(c)}
              title={c.name}
              className="relative aspect-square rounded-full border-2 transition-all hover:scale-110 focus:outline-none"
              style={{
                backgroundColor: c.hex,
                borderColor: accent.hex === c.hex ? '#fff' : 'transparent',
                boxShadow: accent.hex === c.hex ? `0 0 14px ${c.hex}90` : 'none',
              }}
            >
              {accent.hex === c.hex && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <Check className="w-3 h-3 text-black font-bold" strokeWidth={3} />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // KROK 2: Tryby Pracy & Integracje API (Librus vs Autonomiczny, AI, Pushbullet)
  const renderStep2 = () => (
    <div className="space-y-4 animate-fade-in-up max-h-[62vh] overflow-y-auto pr-1 custom-scrollbar text-xs sm:text-sm">
      {/* KARTA 1: INTEGRACJA LIBRUS SYNERGIA */}
      <div className="p-3.5 rounded-xl bg-surface border border-border/60 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4" />
            </span>
            <div>
              <h4 className="font-semibold text-textPrimary">Harmonogram &amp; Librus Synergia</h4>
              <p className="text-[11px] text-textMuted">Wybierz czy chcesz pobierać plan przez API, czy pracować w trybie autonomicznym</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-surface-container-high border border-border text-primary">
            {librusMode === 'api' ? '[API AKTYWNE]' : '[AUTONOMICZNY]'}
          </span>
        </div>

        {/* Segmented Choice */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => setLibrusMode('standalone')}
            className={`p-3 rounded-xl border text-left transition-all ${
              librusMode === 'standalone'
                ? 'bg-primary/10 border-primary shadow-sm text-textPrimary'
                : 'bg-surface/40 border-border/40 text-textMuted hover:border-border'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Tryb Autonomiczny (Zalecany)
              </span>
              {librusMode === 'standalone' && <Check className="w-3.5 h-3.5 text-primary" />}
            </div>
            <p className="text-[11px] leading-relaxed text-textMuted">
              Brak zależności od Librus API. Plan dnia, zajęcia i oceny działają w 100% lokalnie w SQLite i Firestore. Zero błędów scrapera.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setLibrusMode('api')}
            className={`p-3 rounded-xl border text-left transition-all ${
              librusMode === 'api'
                ? 'bg-secondary/10 border-secondary shadow-sm text-textPrimary'
                : 'bg-surface/40 border-border/40 text-textMuted hover:border-border'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-secondary" /> Połączenie Librus API
              </span>
              {librusMode === 'api' && <Check className="w-3.5 h-3.5 text-secondary" />}
            </div>
            <p className="text-[11px] leading-relaxed text-textMuted">
              Automatyczne pobieranie planu lekcji, odwołanych zajęć i ocen z konta Synergia przez backend scraper.
            </p>
          </button>
        </div>

        {librusMode === 'api' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-border/40 animate-fade-in">
            <div>
              <label className="text-[11px] text-textMuted block mb-1">Login Librus Synergia (opcjonalny)</label>
              <input
                type="text"
                value={librusLogin}
                onChange={(e) => setLibrusLogin(e.target.value)}
                placeholder="np. 1234567u"
                className="w-full bg-surface-container-lowest border border-border rounded-lg px-3 py-1.5 font-mono text-xs text-textPrimary focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-[11px] text-textMuted block mb-1">Hasło do konta (opcjonalne)</label>
              <input
                type="password"
                value={librusPass}
                onChange={(e) => setLibrusPass(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-surface-container-lowest border border-border rounded-lg px-3 py-1.5 font-mono text-xs text-textPrimary focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        )}
      </div>

      {/* KARTA 2: SILNIK KOGNITYWNY AI */}
      <div className="p-3.5 rounded-xl bg-surface border border-border/60 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center font-bold">
              <Cpu className="w-4 h-4" />
            </span>
            <div>
              <h4 className="font-semibold text-textPrimary">Silnik Kognitywny LLM &amp; Mowy</h4>
              <p className="text-[11px] text-textMuted">Wybierz domyślny model wnioskowania agenta Omni</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono text-secondary bg-secondary/10 border border-secondary/20">
            {aiEngine === 'groq' ? 'LPU 120B' : aiEngine === 'gemini' ? 'Gemini Flash' : 'Klucz Własny'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          {[
            { id: 'groq', name: 'Groq LPU 120B', desc: 'Darmowy, ultra-szybki (14ms latency)' },
            { id: 'gemini', name: 'Gemini 1.5 Flash', desc: 'Google Cloud Vertex & multimodalność' },
            { id: 'custom', name: 'Własny Klucz API', desc: 'OpenAI / Claude / Groq key' }
          ].map(engine => (
            <button
              key={engine.id}
              type="button"
              onClick={() => setAiEngine(engine.id)}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                aiEngine === engine.id
                  ? 'bg-secondary/10 border-secondary text-textPrimary shadow-sm'
                  : 'bg-surface/40 border-border/40 text-textMuted hover:border-border'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs">{engine.name}</span>
                {aiEngine === engine.id && <Check className="w-3.5 h-3.5 text-secondary" />}
              </div>
              <p className="text-[10px] text-textMuted leading-relaxed">{engine.desc}</p>
            </button>
          ))}
        </div>

        {aiEngine === 'custom' && (
          <div className="pt-2 animate-fade-in">
            <input
              type="password"
              value={customAiKey}
              onChange={(e) => setCustomAiKey(e.target.value)}
              placeholder="Wklej klucz API (sk_... lub gsk_...)..."
              className="w-full bg-surface-container-lowest border border-border rounded-lg px-3 py-1.5 font-mono text-xs text-textPrimary focus:outline-none focus:border-secondary"
            />
          </div>
        )}
      </div>

      {/* KARTA 3: POWIADOMIENIA PUSHBULLET */}
      <div className="p-3.5 rounded-xl bg-surface border border-border/60 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-tertiary/10 text-tertiary flex items-center justify-center font-bold">
              <Bell className="w-4 h-4" />
            </span>
            <div>
              <h4 className="font-semibold text-textPrimary">Powiadomienia Pushbullet (Smartfon)</h4>
              <p className="text-[11px] text-textMuted">Wysyłaj plany treningów, alerty budżetowe i zmiany w harmonogramie na telefon</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPushbulletEnabled(!pushbulletEnabled)}
            className={`w-10 h-6 rounded-full p-1 transition-colors flex items-center ${
              pushbulletEnabled ? 'bg-primary' : 'bg-surface-container-high border border-border'
            }`}
          >
            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
              pushbulletEnabled ? 'translate-x-4' : 'translate-x-0'
            }`} />
          </button>
        </div>

        {pushbulletEnabled && (
          <div className="pt-2 animate-fade-in">
            <input
              type="password"
              value={pushbulletToken}
              onChange={(e) => setPushbulletToken(e.target.value)}
              placeholder="Access Token Pushbullet (o.ujyl...)..."
              className="w-full bg-surface-container-lowest border border-border rounded-lg px-3 py-1.5 font-mono text-xs text-textPrimary focus:outline-none focus:border-primary"
            />
          </div>
        )}
      </div>
    </div>
  );

  // KROK 3: Moduły i Widgety
  const renderStep3 = () => (
    <div className="space-y-3 animate-fade-in-up max-h-[62vh] overflow-y-auto pr-1 custom-scrollbar text-xs sm:text-sm">
      <div className="flex items-center justify-between pb-1">
        <h4 className="font-semibold text-textPrimary flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-accentPrimary" />
          Aktywne Kafelki &amp; Widżety Kokpitu
        </h4>
        <span className="text-[11px] font-mono text-textMuted">Dostosuj widok główny</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {[
          { key: 'systemMonitor', name: 'Monitor Zasobów CPU/RAM', desc: 'Wykorzystanie pamięci i rdzeni' },
          { key: 'networkMonitor', name: 'Network & Ping Monitor', desc: 'Analiza opóźnień sieci i bramy' },
          { key: 'cryptoTracker', name: 'Monitor Kryptowalut', desc: 'Kursy BTC/ETH i alokacje' },
          { key: 'quickNotes', name: 'Szybki Notatnik Scratchpad', desc: 'Tymczasowe zapiski bez utraty danych' },
          { key: 'tokenTracker', name: 'Licznik Tokenów LLM', desc: 'Ewidencja zużycia Groq / OpenAI' },
          { key: 'modelStatus', name: 'Status Silników Kognitywnych', desc: 'Gotowość agentów autonomicznych' },
          { key: 'promptVault', name: 'Skarbiec Promptów (Vault)', desc: 'Biblioteka deterministycznych instrukcji' },
          { key: 'agentQueue', name: 'Kolejka Zadań Agenta', desc: 'Harmonogram mikro-daemons' }
        ].map(w => {
          const isActive = activeWidgets[w.key];
          return (
            <button
              key={w.key}
              type="button"
              onClick={() => toggleWidget(w.key)}
              className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                isActive ? 'bg-accentPrimary/10 border-accentPrimary/50 shadow-sm' : 'bg-surface/50 border-border/40'
              }`}
            >
              <div>
                <span className={`font-mono text-xs block font-bold ${isActive ? 'text-accentPrimary' : 'text-textMuted'}`}>
                  {w.name}
                </span>
                <span className="text-[10px] text-textMuted">{w.desc}</span>
              </div>
              <div className={`w-9 h-5 rounded-full p-0.5 transition-colors flex items-center shrink-0 ml-2 ${
                isActive ? 'bg-accentPrimary' : 'bg-surface border border-border'
              }`}>
                <div className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${
                  isActive ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  // KROK 4: Podsumowanie & Gotowość
  const renderStep4 = () => (
    <div className="space-y-4 animate-fade-in-up max-h-[62vh] overflow-y-auto pr-1 custom-scrollbar text-xs sm:text-sm">
      <div className="p-4 rounded-xl bg-surface border border-border/60 flex flex-col gap-3">
        <div className="flex items-center gap-2 pb-2 border-b border-border/40">
          <Sparkles className="w-5 h-5 text-accentPrimary" />
          <div>
            <h4 className="font-semibold text-textPrimary text-sm">Podsumowanie Profilu Systemowego</h4>
            <p className="text-[11px] text-textMuted">Wszystkie parametry zostały zweryfikowane i są gotowe do zapisu</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-2.5 rounded-lg bg-surface-container-lowest border border-border/30 flex flex-col gap-1">
            <span className="text-[10px] text-textMuted uppercase font-mono">Tożsamość Operatora:</span>
            <span className="font-bold text-textPrimary font-mono">{userName}</span>
            <span className="text-[10px] text-textMuted">Język: {systemLang.toUpperCase()} • Styl: {theme}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-surface-container-lowest border border-border/30 flex flex-col gap-1">
            <span className="text-[10px] text-textMuted uppercase font-mono">Harmonogram &amp; Librus:</span>
            <span className={`font-bold font-mono ${librusMode === 'api' ? 'text-secondary' : 'text-primary'}`}>
              {librusMode === 'api' ? '[+] Integracja Librus API' : '[+] Pełny Tryb Autonomiczny'}
            </span>
            <span className="text-[10px] text-textMuted">
              {librusMode === 'api' ? 'Pobieranie ze szkolnego serwera' : 'Zarządzanie lokalne bez scrapera'}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-surface-container-lowest border border-border/30 flex flex-col gap-1">
            <span className="text-[10px] text-textMuted uppercase font-mono">Silnik Wnioskowania AI:</span>
            <span className="font-bold text-secondary font-mono">
              {aiEngine === 'groq' ? 'Groq LPU 120B (14ms)' : aiEngine === 'gemini' ? 'Google Gemini Flash' : 'Klucz Własny'}
            </span>
            <span className="text-[10px] text-textMuted">Ciągła konwersacja Live Voice aktywna</span>
          </div>

          <div className="p-2.5 rounded-lg bg-surface-container-lowest border border-border/30 flex flex-col gap-1">
            <span className="text-[10px] text-textMuted uppercase font-mono">Powiadomienia &amp; Moduły:</span>
            <span className="font-bold text-textPrimary font-mono">
              Pushbullet: {pushbulletEnabled ? 'Aktywny' : 'Wyłączony'}
            </span>
            <span className="text-[10px] text-textMuted">
              Aktywne widżety: {Object.values(activeWidgets).filter(Boolean).length}/8
            </span>
          </div>
        </div>
      </div>

      <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-xs text-textPrimary flex items-center gap-2.5 font-mono">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
        <span>Konfiguracja może być w każdej chwili zmieniona w zakładce Ustawienia.</span>
      </div>
    </div>
  );

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 overflow-hidden transition-colors duration-500"
      style={{ backgroundColor: theme === 'light' ? '#F3F4F6' : '#0A0B0E' }}
    >
      {/* Tło ambientowe */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-accentPrimary/10 rounded-full blur-[140px] pointer-events-none transition-colors duration-1000" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full blur-[160px] opacity-25 pointer-events-none transition-colors duration-1000" style={{ backgroundColor: accent.hex }} />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff06_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      <div className="glass-panel w-full max-w-2xl rounded-2xl border border-border overflow-hidden flex flex-col relative z-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] max-h-[90vh]">
        
        {/* Header Wizarda */}
        <div className="p-4 sm:p-5 border-b border-border bg-surface/50 flex items-center justify-between shrink-0">
          <div>
            <h1 className="font-mono text-lg sm:text-xl font-bold tracking-tight" style={{ color: accent.hex }}>
              SYSTEM ONBOARDING &amp; SETUP_
            </h1>
            <p className="font-sans text-[11px] sm:text-xs text-textMuted mt-0.5">
              {step === 1 && 'Krok 1: Tożsamość i Stylistyka'}
              {step === 2 && 'Krok 2: Tryby Działania & Integracje API'}
              {step === 3 && 'Krok 3: Wybór Modułów Ekranu Głównego'}
              {step === 4 && 'Krok 4: Gotowość Operacyjna'}
            </p>
          </div>
          <div className="flex gap-1.5 sm:gap-2">
            {[1, 2, 3, 4].map(i => (
              <div 
                key={i} 
                className="w-6 sm:w-8 h-1.5 sm:h-2 rounded-full transition-all duration-300" 
                style={{ 
                  backgroundColor: step >= i ? accent.hex : 'var(--color-border)', 
                  opacity: step >= i ? 1 : 0.4 
                }} 
              />
            ))}
          </div>
        </div>

        {/* Zawartość Kroku */}
        <div className="p-4 sm:p-5 flex-1 min-h-[350px] overflow-hidden flex flex-col justify-between">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>

        {/* Footer Nawigacyjny */}
        <div className="p-3.5 sm:p-4 border-t border-border bg-surface/50 flex items-center justify-between shrink-0">
          <button
            onClick={handlePrev}
            disabled={step === 1}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all ${
              step === 1 
                ? 'opacity-0 pointer-events-none' 
                : 'text-textMuted hover:text-textPrimary bg-surface hover:bg-border'
            }`}
          >
            <ChevronLeft className="w-4 h-4" /> Wstecz
          </button>
          
          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 px-6 py-2 rounded-xl font-mono text-xs font-bold text-black transition-all hover:scale-105 active:scale-95 shadow-md"
            style={{ backgroundColor: accent.hex, boxShadow: `0 0 16px ${accent.hex}60` }}
          >
            {step === totalSteps ? 'ZAKOŃCZ I URUCHOM' : 'DALEJ'} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetupWizard;
