import React, { useState } from 'react';
import { Palette, LayoutGrid, Rss, Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { COLOR_PRESETS, NEWS_CATEGORIES } from '../config/constants';

const SetupWizard = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [theme, setTheme] = useState(() => localStorage.getItem('system_theme') || 'dark');
  const [userName, setUserName] = useState(() => localStorage.getItem('system_user_name') || 'Użytkownik');
  const [accent, setAccent] = useState(() => {
    const savedHex = localStorage.getItem('system_accent_hex');
    return COLOR_PRESETS.find(c => c.hex === savedHex) || COLOR_PRESETS[0];
  });
  const [selectedNews, setSelectedNews] = useState(['ai', 'security', 'startups']);
  const [activeWidgets, setActiveWidgets] = useState({
    systemMonitor: true,
    networkMonitor: true,
    cryptoTracker: true,
    quickNotes: true,
    tokenTracker: true,
    modelStatus: true,
    promptVault: true,
    agentQueue: true
  });

  React.useEffect(() => {
    document.documentElement.classList.toggle('theme-light', theme === 'light');
    document.documentElement.style.setProperty('--color-accent-primary', accent.rgb);
    document.documentElement.style.setProperty('--color-accent-primary-hex', accent.hex);
    document.documentElement.style.setProperty('--color-accent-secondary', accent.hex);
  }, []);

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else finishSetup();
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const toggleNewsCategory = (id) => {
    setSelectedNews(prev => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev;
        return prev.filter(c => c !== id);
      }
      return [...prev, id];
    });
  };

  const toggleWidget = (key) => {
    setActiveWidgets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const finishSetup = () => {
    // Zapis ustawień
    localStorage.setItem('system_theme', theme);
    localStorage.setItem('system_accent', accent.rgb);
    localStorage.setItem('system_accent_hex', accent.hex);
    document.documentElement.classList.toggle('theme-light', theme === 'light');
    document.documentElement.style.setProperty('--color-accent-primary', accent.rgb);
    document.documentElement.style.setProperty('--color-accent-primary-hex', accent.hex);
    document.documentElement.style.setProperty('--color-accent-secondary', accent.hex);

    localStorage.setItem('system_user_name', userName.trim() || 'Użytkownik');
    localStorage.setItem('system_news_categories', JSON.stringify(selectedNews));
    localStorage.setItem('system_active_widgets', JSON.stringify(activeWidgets));
    
    // Zakończenie
    localStorage.setItem('system_setup_completed', 'true');
    window.dispatchEvent(new CustomEvent('newsCategoriesChanged', { detail: selectedNews }));
    window.dispatchEvent(new CustomEvent('activeWidgetsChanged', { detail: activeWidgets }));
    
    onComplete();
  };

  const changeThemeLive = (newTheme) => {
    setTheme(newTheme);
    document.documentElement.classList.toggle('theme-light', newTheme === 'light');
    localStorage.setItem('system_theme', newTheme);
  };

  const changeAccentLive = (c) => {
    setAccent(c);
    document.documentElement.style.setProperty('--color-accent-primary', c.rgb);
    document.documentElement.style.setProperty('--color-accent-primary-hex', c.hex);
    document.documentElement.style.setProperty('--color-accent-secondary', c.hex);
    localStorage.setItem('system_accent', c.rgb);
    localStorage.setItem('system_accent_hex', c.hex);
  };

  const renderStep1 = () => (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h3 className="text-sm font-semibold text-textPrimary mb-3 flex items-center gap-2"><LayoutGrid className="w-4 h-4 text-accentPrimary" /> Twoje Imię / Pseudonim</h3>
        <input 
          type="text" 
          value={userName} 
          onChange={(e) => setUserName(e.target.value)} 
          className="w-full bg-surface/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-accentPrimary text-textPrimary"
          placeholder="np. Jakub"
        />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-textPrimary mb-3 flex items-center gap-2"><Palette className="w-4 h-4 text-accentPrimary" /> Motyw Aplikacji</h3>
        <div className="flex gap-4">
          <button onClick={() => changeThemeLive('dark')} className={`flex-1 p-4 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-accentPrimary bg-accentPrimary/10' : 'border-border/50 hover:border-border bg-surface/50'}`}>
            <span className="font-mono text-sm font-bold text-textPrimary">Dark Sci-Fi</span>
          </button>
          <button onClick={() => changeThemeLive('light')} className={`flex-1 p-4 rounded-xl border-2 transition-all ${theme === 'light' ? 'border-accentPrimary bg-accentPrimary/10' : 'border-border/50 hover:border-border bg-surface/50'}`}>
            <span className="font-mono text-sm font-bold text-textPrimary">Light Mode</span>
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-textPrimary mb-3 flex items-center gap-2"><Palette className="w-4 h-4 text-accentPrimary" /> Kolor Główny</h3>
        <div className="grid grid-cols-5 md:grid-cols-7 gap-4">
          {COLOR_PRESETS.map(c => (
            <button
              key={c.hex}
              onClick={() => changeAccentLive(c)}
              title={c.name}
              className="relative aspect-square rounded-full border-2 transition-all hover:scale-110 focus:outline-none"
              style={{
                backgroundColor: c.hex,
                borderColor: accent.hex === c.hex ? '#fff' : 'transparent',
                boxShadow: accent.hex === c.hex ? `0 0 20px ${c.hex}90` : 'none',
              }}
            >
              {accent.hex === c.hex && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <Check className="w-4 h-4 text-black font-bold" strokeWidth={3} />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => {
    // Grupowanie
    const sections = ['IT & Tech', 'Świat i Nauka', 'Rozrywka i Lifestyle'];
    return (
      <div className="space-y-6 animate-fade-in-up max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
        {sections.map(section => (
          <div key={section}>
            <h3 className="text-sm font-semibold text-textPrimary mb-3 border-b border-border/50 pb-2">{section}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {NEWS_CATEGORIES.filter(c => c.section === section).map(cat => {
                const isSelected = selectedNews.includes(cat.id);
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleNewsCategory(cat.id)}
                    className="flex items-start gap-3 p-3 rounded-xl border transition-all text-left"
                    style={{
                      borderColor: isSelected ? `${cat.color}60` : 'var(--color-border)',
                      backgroundColor: isSelected ? `${cat.color}15` : 'var(--color-surface)',
                    }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mt-0.5" style={{ backgroundColor: `${cat.color}20` }}>
                      <Icon className="w-4 h-4" style={{ color: cat.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-mono text-xs font-bold" style={{ color: isSelected ? cat.color : 'var(--color-text-primary)' }}>{cat.label}</p>
                        {isSelected && <Check className="w-3.5 h-3.5" style={{ color: cat.color }} />}
                      </div>
                      <p className="text-[10px] text-textMuted mt-0.5 leading-relaxed truncate">{cat.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderStep3 = () => (
    <div className="space-y-4 animate-fade-in-up">
      <h3 className="text-sm font-semibold text-textPrimary mb-3 flex items-center gap-2"><LayoutGrid className="w-4 h-4 text-accentPrimary" /> Moduły Ekranu Głównego</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Object.entries({
          systemMonitor: 'System Monitor',
          networkMonitor: 'Network Monitor',
          cryptoTracker: 'Crypto Tracker',
          quickNotes: 'Scratchpad',
          tokenTracker: 'Token Tracker',
          modelStatus: 'Model Status',
          promptVault: 'Prompt Vault',
          agentQueue: 'Agent Queue'
        }).map(([key, label]) => {
          const isActive = activeWidgets[key];
          return (
            <button
              key={key}
              onClick={() => toggleWidget(key)}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isActive ? 'bg-accentPrimary/10 border-accentPrimary/50' : 'bg-surface/50 border-border/50'}`}
            >
              <span className={`font-mono text-xs ${isActive ? 'text-accentPrimary font-bold' : 'text-textMuted'}`}>{label}</span>
              <div className={`w-10 h-6 rounded-full p-1 transition-colors flex items-center ${isActive ? 'bg-accentPrimary' : 'bg-surface border border-border'}`}>
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${isActive ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden transition-colors duration-500"
      style={{ backgroundColor: theme === 'light' ? '#F3F4F6' : '#0A0B0E' }}
    >
      {/* Tło - płynne animacje */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-accentPrimary/10 rounded-full blur-[140px] mix-blend-screen animate-pulse-slow pointer-events-none transition-colors duration-1000"></div>
      <div className="absolute bottom-0 right-1/4 w-[700px] h-[700px] rounded-full blur-[160px] mix-blend-screen opacity-30 animate-pulse-slow pointer-events-none transition-colors duration-1000" style={{ backgroundColor: accent.hex, animationDelay: '2s' }}></div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none"></div>

      {/* Kolorowy glow z tyłu oparty na wybranym akcencie */}
      <div className="absolute inset-0 pointer-events-none opacity-20 transition-colors duration-1000" style={{ background: `radial-gradient(circle at center, ${accent.hex}, transparent 70%)` }} />
      
      <div className="glass-panel w-full max-w-3xl rounded-2xl border border-border overflow-hidden flex flex-col relative z-10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        
        {/* Header Wizarda */}
        <div className="p-6 border-b border-border bg-surface/50 flex items-center justify-between">
          <div>
            <h1 className="font-mono text-2xl font-bold tracking-tighter" style={{ color: accent.hex }}>INITIAL SETUP_</h1>
            <p className="font-sans text-xs text-textMuted mt-1">Skonfiguruj swoje centrum operacyjne</p>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-10 h-2 rounded-full transition-all duration-300" style={{ backgroundColor: step >= i ? accent.hex : 'var(--color-border)', opacity: step >= i ? 1 : 0.5 }} />
            ))}
          </div>
        </div>

        {/* Zawartość Kroku */}
        <div className="p-6 flex-1 min-h-[400px]">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>

        {/* Footer Nawigacyjny */}
        <div className="p-6 border-t border-border bg-surface/50 flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={step === 1}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-sm font-bold transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-textMuted hover:text-textPrimary bg-surface hover:bg-border'}`}
          >
            <ChevronLeft className="w-4 h-4" /> Wstecz
          </button>
          
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-8 py-2.5 rounded-xl font-mono text-sm font-bold text-black transition-all hover:scale-105"
            style={{ backgroundColor: accent.hex, boxShadow: `0 0 20px ${accent.hex}60` }}
          >
            {step === 3 ? 'ZAKOŃCZ' : 'DALEJ'} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetupWizard;
