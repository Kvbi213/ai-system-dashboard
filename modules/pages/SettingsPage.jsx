import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, Shield, Bell, HardDrive, Cpu, Palette, Sun, Moon, Rss, Zap, Lock, Check, LayoutGrid, Mic, Volume2 } from 'lucide-react';
import { COLOR_PRESETS, NEWS_CATEGORIES } from '../config/constants';

const Toggle = ({ value, onChange }) => (
  <button
    onClick={() => onChange(!value)}
    className={`w-14 h-8 rounded-full p-1 transition-colors flex items-center flex-shrink-0 ${value ? 'bg-accentPrimary' : 'bg-surface border border-border'}`}
  >
    <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${value ? 'translate-x-6' : 'translate-x-0'}`} />
  </button>
);

const TABS = [
  { id: 'personalization', label: 'Personalizacja', icon: Palette },
  { id: 'privacy', label: 'Prywatność', icon: Shield },
  { id: 'system', label: 'System', icon: Cpu },
  { id: 'security', label: 'Bezpieczeństwo', icon: Lock }
];

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('personalization');
  const [notifications, setNotifications] = useState(true);
  const [ghostMode, setGhostMode] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [accent, setAccent] = useState('#00FF66');
  const [selectedNewsCategories, setSelectedNewsCategories] = useState(['ai', 'security']);
  const [saved, setSaved] = useState(false);
  const [voicePref, setVoicePref] = useState('paulina');
  const [voiceRate, setVoiceRate] = useState(1.8);
  const [userName, setUserName] = useState('Użytkownik');

  const [sysMonitorPrefs, setSysMonitorPrefs] = useState({ cpu: true, ram: true, uptime: true });
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

  useEffect(() => {
    setTheme(localStorage.getItem('system_theme') || 'dark');
    setAccent(localStorage.getItem('system_accent_hex') || '#00FF66');
    const savedCats = localStorage.getItem('system_news_categories');
    if (savedCats) setSelectedNewsCategories(JSON.parse(savedCats));
    const savedSys = localStorage.getItem('system_sysmonitor');
    if (savedSys) setSysMonitorPrefs(JSON.parse(savedSys));
    const savedGhost = localStorage.getItem('system_ghost_mode');
    if (savedGhost) setGhostMode(savedGhost === 'true');
    const savedWidgets = localStorage.getItem('system_active_widgets');
    if (savedWidgets) setActiveWidgets(JSON.parse(savedWidgets));
    const savedVoice = localStorage.getItem('system_voice_pref');
    if (savedVoice) setVoicePref(savedVoice);
    const savedRate = localStorage.getItem('system_voice_rate');
    if (savedRate) setVoiceRate(parseFloat(savedRate));
    const savedName = localStorage.getItem('system_user_name');
    if (savedName) setUserName(savedName);
  }, []);

  const updateVoicePref = (val) => {
    setVoicePref(val);
    localStorage.setItem('system_voice_pref', val);
  };

  const updateVoiceRate = (val) => {
    setVoiceRate(val);
    localStorage.setItem('system_voice_rate', val);
  };

  const testVoice = () => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance("Testuję ustawienia głosu. Mam nadzieję, że brzmię dobrze.");
    utterance.lang = 'pl-PL';
    utterance.rate = voiceRate;
    
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice;
    if (voicePref === 'female' || voicePref === 'paulina') {
       selectedVoice = voices.find(v => v.name.toLowerCase().includes('paulina') || v.name.toLowerCase().includes('zofia')) || voices.find(v => v.lang.includes('pl') && !v.name.toLowerCase().includes('male') && !v.name.toLowerCase().includes('marek'));
    } else {
       selectedVoice = voices.find(v => v.name.toLowerCase().includes('marek') || v.name.toLowerCase().includes('adam')) || voices.find(v => v.lang.includes('pl') && (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('mężczyzna')));
    }
    
    if (!selectedVoice) selectedVoice = voices.find(v => v.lang.includes('pl'));
    if (selectedVoice) utterance.voice = selectedVoice;
    
    window.speechSynthesis.speak(utterance);
  };

  const updateSysPrefs = (key, value) => {
    setSysMonitorPrefs(prev => {
      const next = { ...prev, [key]: value };
      localStorage.setItem('system_sysmonitor', JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('sysMonitorPrefsChanged', { detail: next }));
      return next;
    });
  };

  const updateActiveWidgets = (key, value) => {
    setActiveWidgets(prev => {
      const next = { ...prev, [key]: value };
      localStorage.setItem('system_active_widgets', JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('activeWidgetsChanged', { detail: next }));
      return next;
    });
  };

  const handleToggleGhostMode = (val) => {
    setGhostMode(val);
    localStorage.setItem('system_ghost_mode', val);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('system_theme', newTheme);
    document.documentElement.classList.toggle('theme-light', newTheme === 'light');
  };

  const changeAccent = (rgb, hex) => {
    setAccent(hex);
    localStorage.setItem('system_accent', rgb);
    localStorage.setItem('system_accent_hex', hex);
    document.documentElement.style.setProperty('--color-accent-primary', rgb);
    document.documentElement.style.setProperty('--color-accent-primary-hex', hex);
    document.documentElement.style.setProperty('--color-accent-secondary', hex);
  };

  const toggleNewsCategory = (id) => {
    setSelectedNewsCategories(prev => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev;
        return prev.filter(c => c !== id);
      }
      return [...prev, id];
    });
  };

  const saveNewsPrefs = () => {
    localStorage.setItem('system_news_categories', JSON.stringify(selectedNewsCategories));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    window.dispatchEvent(new CustomEvent('newsCategoriesChanged', { detail: selectedNewsCategories }));
  };

  const SectionHeader = ({ icon: Icon, title, className = '' }) => (
    <h2 className={`font-mono text-base text-textPrimary mb-5 flex items-center gap-2.5 ${className}`}>
      <span className="p-1.5 rounded-lg bg-accentPrimary/10 border border-accentPrimary/20">
        <Icon className="w-4 h-4 text-accentPrimary" />
      </span>
      {title}
    </h2>
  );

  const SettingRow = ({ label, desc, children }) => (
    <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:border-border transition-colors bg-black/20">
      <div className="mr-4">
        <p className="font-semibold text-textPrimary font-sans text-sm">{label}</p>
        <p className="text-xs text-textMuted mt-0.5 leading-relaxed">{desc}</p>
      </div>
      {children}
    </div>
  );

  return (
    <div id="tour-settings" className="flex flex-col h-full gap-5 pb-20 md:pb-0">
      <header className="glass-panel p-5 rounded-xl border border-border flex items-center gap-4 flex-shrink-0">
        <div className="w-10 h-10 rounded-xl bg-accentPrimary/10 border border-accentPrimary/30 flex items-center justify-center flex-shrink-0">
          <Settings className="w-5 h-5 text-accentPrimary" />
        </div>
        <div>
          <h1 className="font-mono text-xl text-accentPrimary font-bold tracking-tight">Ustawienia Systemowe</h1>
          <p className="font-sans text-xs text-textMuted mt-0.5">Konfiguracja środowiska System Dashboard</p>
        </div>
      </header>

      {/* TABS NAVIGATION */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-shrink-0">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all border whitespace-nowrap ${
                isActive 
                  ? 'bg-accentPrimary/10 border-accentPrimary text-accentPrimary shadow-[0_0_10px_rgba(var(--color-accent-primary),0.2)]' 
                  : 'bg-surface border-border text-textMuted hover:text-textPrimary hover:border-border/80'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <main className="flex-1 overflow-y-auto space-y-4 min-h-0 pr-1">
        
        {activeTab === 'personalization' && (
          <div className="space-y-4 animate-fade-in-up">
            {/* --- WYGLĄD --- */}
            <section className="glass-panel p-5 rounded-xl border border-border">
              <SectionHeader icon={Palette} title="Wygląd i Personalizacja" />
              <div className="space-y-3">
                <SettingRow label="Imię / Pseudonim" desc="Twoja nazwa, której asystent AI używa zwracając się do Ciebie.">
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => {
                      setUserName(e.target.value);
                      localStorage.setItem('system_user_name', e.target.value);
                      window.dispatchEvent(new CustomEvent('userNameChanged', { detail: e.target.value }));
                    }}
                    className="bg-surface border border-border rounded-lg px-3 py-1.5 focus:border-accentPrimary outline-none text-textPrimary font-mono w-32 md:w-48 text-sm"
                    placeholder="Wpisz imię..."
                  />
                </SettingRow>
                <SettingRow label="Motyw Aplikacji" desc="Dark Sci-Fi lub jasny tryb produktywny">
                  <Toggle value={theme === 'light'} onChange={toggleTheme} />
                </SettingRow>
                <div className="p-4 rounded-xl border border-border/50 bg-black/20">
                  <p className="font-semibold text-textPrimary font-sans text-sm mb-3">Kolor Akcentu</p>
                  <div className="flex gap-3 flex-wrap">
                    {COLOR_PRESETS.map(c => (
                      <button
                        key={c.hex}
                        onClick={() => changeAccent(c.rgb, c.hex)}
                        title={c.name}
                        className="relative w-9 h-9 rounded-full border-2 transition-all hover:scale-110 focus:outline-none"
                        style={{
                          backgroundColor: c.hex,
                          borderColor: accent === c.hex ? '#fff' : 'transparent',
                          boxShadow: accent === c.hex ? `0 0 16px ${c.hex}90` : 'none',
                        }}
                      >
                        {accent === c.hex && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 text-black font-bold" strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* --- WIDOCZNE WIDŻETY --- */}
            <section className="glass-panel p-5 rounded-xl border border-border">
              <SectionHeader icon={LayoutGrid} title="Katalog Widżetów (Widoczność)" />
              <div className="space-y-3">
                <SettingRow label="Token & Cost Tracker" desc="Zużycie API tokenów.">
                  <Toggle value={activeWidgets.tokenTracker} onChange={(v) => updateActiveWidgets('tokenTracker', v)} />
                </SettingRow>
                <SettingRow label="Model Status" desc="Ping i specyfikacja LLM.">
                  <Toggle value={activeWidgets.modelStatus} onChange={(v) => updateActiveWidgets('modelStatus', v)} />
                </SettingRow>
                <SettingRow label="Prompt Vault" desc="Biblioteka gotowych zapytań.">
                  <Toggle value={activeWidgets.promptVault} onChange={(v) => updateActiveWidgets('promptVault', v)} />
                </SettingRow>
                <SettingRow label="Agent Queue" desc="Kolejka zadań w tle.">
                  <Toggle value={activeWidgets.agentQueue} onChange={(v) => updateActiveWidgets('agentQueue', v)} />
                </SettingRow>
                <div className="h-px bg-border/50 my-2"></div>
                <SettingRow label="System Monitor" desc="Moduł metryk sprzętowych.">
                  <Toggle value={activeWidgets.systemMonitor} onChange={(v) => updateActiveWidgets('systemMonitor', v)} />
                </SettingRow>
                <SettingRow label="Network Monitor" desc="Śledzenie opóźnień sieciowych.">
                  <Toggle value={activeWidgets.networkMonitor} onChange={(v) => updateActiveWidgets('networkMonitor', v)} />
                </SettingRow>
                <SettingRow label="Crypto Tracker" desc="Notowania kryptowalut.">
                  <Toggle value={activeWidgets.cryptoTracker} onChange={(v) => updateActiveWidgets('cryptoTracker', v)} />
                </SettingRow>
                <SettingRow label="Scratchpad" desc="Twój lokalny notatnik hakerski.">
                  <Toggle value={activeWidgets.quickNotes} onChange={(v) => updateActiveWidgets('quickNotes', v)} />
                </SettingRow>
              </div>
            </section>

            {/* --- SYSTEM MONITOR --- */}
            <section className="glass-panel p-5 rounded-xl border border-border">
              <SectionHeader icon={Cpu} title="System Monitor (Konfiguracja Pasków)" />
              <div className="space-y-3">
                <SettingRow label="Wskaźnik CPU" desc="Pokaż zużycie procesora.">
                  <Toggle value={sysMonitorPrefs.cpu} onChange={(v) => updateSysPrefs('cpu', v)} />
                </SettingRow>
                <SettingRow label="Wskaźnik RAM" desc="Pokaż zużycie pamięci operacyjnej.">
                  <Toggle value={sysMonitorPrefs.ram} onChange={(v) => updateSysPrefs('ram', v)} />
                </SettingRow>
                <SettingRow label="Wskaźnik Uptime" desc="Pokaż czas od uruchomienia systemu.">
                  <Toggle value={sysMonitorPrefs.uptime} onChange={(v) => updateSysPrefs('uptime', v)} />
                </SettingRow>
              </div>
            </section>

            {/* --- PREFERENCJE NEWSÓW --- */}
            <section className="glass-panel p-5 rounded-xl border border-border">
              <SectionHeader icon={Rss} title="Preferencje Kanału IT News" />
              <p className="text-xs text-textMuted mb-4 -mt-2">Wybierz kategorie widoczne w widżecie IT Intel Feed. Minimum jedna kategoria.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {NEWS_CATEGORIES.map(cat => {
                  const CatIcon = cat.icon;
                  const isSelected = selectedNewsCategories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleNewsCategory(cat.id)}
                      className="flex items-start gap-3 p-3.5 rounded-xl border transition-all text-left"
                      style={{
                        borderColor: isSelected ? `${cat.color}60` : 'rgba(255,255,255,0.05)',
                        backgroundColor: isSelected ? `${cat.color}10` : 'rgba(0,0,0,0.2)',
                        boxShadow: isSelected ? `0 0 15px ${cat.color}20` : 'none',
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: `${cat.color}20`, border: `1px solid ${cat.color}40` }}
                      >
                        <CatIcon className="w-4 h-4" style={{ color: cat.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-mono text-xs font-bold tracking-wide truncate" style={{ color: isSelected ? cat.color : 'var(--color-text-primary)' }}>
                            {cat.label}
                          </p>
                          {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: cat.color }} />}
                        </div>
                        <p className="text-[10px] text-textMuted mt-0.5 leading-relaxed line-clamp-1">{cat.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={saveNewsPrefs}
                className="w-full py-2.5 rounded-xl font-mono text-sm font-bold tracking-wider transition-all border"
                style={{
                  backgroundColor: saved ? '#00FF6620' : 'rgba(var(--color-accent-primary), 0.1)',
                  borderColor: saved ? '#00FF66' : 'rgba(var(--color-accent-primary), 0.4)',
                  color: saved ? '#00FF66' : 'var(--color-accent-primary-hex)',
                }}
              >
                {saved ? '✓ ZAPISANO PREFERENCJE' : 'ZAPISZ PREFERENCJE NEWSÓW'}
              </button>
            </section>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="space-y-4 animate-fade-in-up">
            {/* --- PRYWATNOŚĆ --- */}
            <section className="glass-panel p-5 rounded-xl border border-border">
              <SectionHeader icon={Shield} title="Prywatność i Bezpieczeństwo" />
              <div className="space-y-3">
                <SettingRow label="Tryb Ghost (Incognito)" desc="Dezaktywuje trwałe zapisywanie logów i historii konwersacji czatu AI. Czat po wyjściu z Dashboardu zresetuje się.">
                  <Toggle value={ghostMode} onChange={handleToggleGhostMode} />
                </SettingRow>
              </div>
            </section>

            {/* --- PAMIĘĆ --- */}
            <section className="glass-panel p-5 rounded-xl border border-red-500/20">
              <SectionHeader icon={HardDrive} title="Zarządzanie Pamięcią" className="text-red-400" />
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between p-4 bg-red-500/5 rounded-xl border border-red-500/10">
                <div>
                  <p className="font-bold text-red-400 font-sans text-sm">Wyczyszczenie Pamięci Podręcznej</p>
                  <p className="text-xs text-red-400/60 mt-0.5">Trwale usuwa pliki tymczasowe, indeksy i historię czatu.</p>
                </div>
                <button
                  className="bg-red-500/20 hover:bg-red-500/40 border border-red-500 text-red-400 px-5 py-2 rounded-xl font-mono font-bold text-sm transition-all hover:shadow-[0_0_15px_rgba(255,50,50,0.3)] w-full sm:w-auto flex-shrink-0"
                  onClick={() => {
                    localStorage.removeItem('system_chat_history');
                    alert('Pamięć i historia czatu zostały wyczyszczone.');
                  }}
                >
                  PURGE CACHE
                </button>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-4 animate-fade-in-up">
            {/* --- SYSTEMOWE --- */}
            <section className="glass-panel p-5 rounded-xl border border-border">
              <SectionHeader icon={Bell} title="Preferencje Systemowe" />
              <div className="space-y-3">
                <SettingRow label="Powiadomienia Dźwiękowe" desc="Sygnały audio przy zakończeniu procesów w tle.">
                  <Toggle value={notifications} onChange={setNotifications} />
                </SettingRow>
              </div>
            </section>

            {/* --- GŁOS AI --- */}
            <section className="glass-panel p-5 rounded-xl border border-border">
              <SectionHeader icon={Mic} title="Asystent Głosowy" />
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-border/50 bg-black/20">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-semibold text-textPrimary font-sans text-sm">Wybór Głosu</p>
                    <button onClick={testVoice} className="text-xs bg-accentPrimary/20 text-accentPrimary px-3 py-1.5 rounded-lg hover:bg-accentPrimary/40 flex items-center gap-1 transition-colors">Testuj głos <Volume2 className="w-3.5 h-3.5" /></button>
                  </div>
                  <p className="text-xs text-textMuted mb-3">Wybierz płeć głosu asystenta.</p>
                  <select 
                    value={voicePref === 'paulina' ? 'female' : voicePref} 
                    onChange={(e) => updateVoicePref(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm font-mono text-textPrimary focus:outline-none focus:border-accentPrimary"
                  >
                    <option value="female">Głos Damski (Paulina/Zofia)</option>
                    <option value="male">Głos Męski (Marek/Adam)</option>
                  </select>
                </div>
                
                <div className="p-4 rounded-xl border border-border/50 bg-black/20">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-semibold text-textPrimary font-sans text-sm">Prędkość mowy (Rate): {voiceRate.toFixed(1)}x</p>
                    <button onClick={testVoice} className="text-xs bg-accentPrimary/20 text-accentPrimary px-3 py-1.5 rounded-lg hover:bg-accentPrimary/40 flex items-center gap-1 transition-colors">Testuj prędkość <Volume2 className="w-3.5 h-3.5" /></button>
                  </div>
                  <p className="text-xs text-textMuted mb-4">Dostosuj szybkość, z jaką agent odczytuje odpowiedzi.</p>
                  <input 
                    type="range" 
                    min="0.5" max="2.0" step="0.1" 
                    value={voiceRate} 
                    onChange={(e) => updateVoiceRate(parseFloat(e.target.value))}
                    className="w-full accent-accentPrimary h-2 rounded-lg appearance-none bg-surface border border-border" 
                  />
                </div>
              </div>
            </section>
          </div>
        )}

      
        {activeTab === 'security' && (
          <div className="space-y-4 animate-fade-in-up">
            <section className="glass-panel p-5 rounded-xl border border-border">
              <SectionHeader icon={Lock} title="Zabezpieczenia i Autoryzacja" />
              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-border/50 bg-black/20">
                  <p className="font-semibold text-textPrimary font-sans text-sm mb-1">Zmień Kod PIN</p>
                  <p className="text-xs text-textMuted leading-relaxed mb-4">Kod ten jest wymagany przy każdym otwarciu Dashboardu.</p>
                  
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const oldPin = e.target.oldPin.value;
                    const newPin = e.target.newPin.value;
                    try {
                      const res = await axios.post('/api/auth/change-pin', { oldPin, newPin });
                      if (res.data.success) {
                        alert('Zaktualizowano kod PIN!');
                        e.target.reset();
                      }
                    } catch (err) {
                      alert('Błąd zmiany PINu: ' + (err.response?.data?.error || err.message));
                    }
                  }} className="flex flex-col gap-3">
                    <input type="password" name="oldPin" placeholder="Obecny PIN" required className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 focus:border-accentPrimary outline-none text-textPrimary font-mono w-full max-w-xs" />
                    <input type="password" name="newPin" placeholder="Nowy PIN" required className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 focus:border-accentPrimary outline-none text-textPrimary font-mono w-full max-w-xs" />
                    <button type="submit" className="bg-accentPrimary text-black font-bold py-2 px-4 rounded-lg self-start mt-2 hover:bg-accentPrimary/80 transition-colors">
                      Zapisz Nowy PIN
                    </button>
                  </form>
                </div>

                <div className="p-4 rounded-xl border border-red-500/20 bg-black/20 mt-4">
                  <p className="font-semibold text-red-400 font-sans text-sm mb-1">Reset do Ustawień Fabrycznych</p>
                  <p className="text-xs text-red-400/60 leading-relaxed mb-4">Ta operacja usunie wszystkie dane z bazy danych oraz prywatne klucze API. Jest to nieodwracalne.</p>
                  
                  <button onClick={async () => {
                    if (window.confirm("UWAGA! Czy na pewno chcesz wyczyścić bazę danych i usunąć klucze API? Operacja jest nieodwracalna.")) {
                      try {
                        await axios.post('/api/system/reset');
                        localStorage.removeItem('system_onboarding_completed');
                        localStorage.removeItem('system_setup_completed');
                        localStorage.removeItem('system_chat_history');
                        localStorage.removeItem('system_mentor_history');
                        localStorage.removeItem('system_thoughts_log');
                        alert('System zresetowany. Konieczne będzie podanie kluczy przy ponownym uruchomieniu.');
                        window.location.href = '/';
                      } catch (err) {
                        alert('Błąd podczas resetowania systemu: ' + err.message);
                      }
                    }
                  }} className="bg-red-500/20 hover:bg-red-500/40 border border-red-500 text-red-400 font-bold py-2 px-4 rounded-lg self-start mt-2 transition-colors">
                    FACTORY RESET
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

      </main>
    </div>
  );
};

export default SettingsPage;
