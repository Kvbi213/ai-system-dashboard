import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const navigate = useNavigate();

  // Micro-interactions state
  const [isSyncing, setIsSyncing] = useState(false);
  const [isBriefingExpanded, setIsBriefingExpanded] = useState(false);
  const [newsFilter, setNewsFilter] = useState('10m'); // '10m' | '15m' | '20m'

  // Mini Quick Chat state
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: 'user',
      text: 'Podsumuj dzisiejszy rozkład serii FBW.',
      time: '12:14'
    },
    {
      id: 2,
      sender: 'ai',
      text: 'Zaplanowano 4 serie główne: Wyciskanie hantli skos dodatni (34kg), Wiosłowanie końcem sztangi (60kg), Żołnierskie OHP (45kg) oraz wznosy bokiem. Czas rozpoczęcia: 17:30.',
      time: '12:15 • Groq 18ms'
    }
  ]);
  const [promptInput, setPromptInput] = useState('');
  const [isAiResponding, setIsAiResponding] = useState(false);

  // Sync Trigger Function
  const triggerSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 1200);
  };

  // Quick Chat Send
  const handleSendPrompt = (e) => {
    if (e) e.preventDefault();
    if (!promptInput.trim() || isAiResponding) return;

    const userText = promptInput.trim();
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: userText,
      time: timeStr
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setPromptInput('');
    setIsAiResponding(true);

    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        sender: 'ai',
        text: `Polecenie przyjęte do realizacji w klastrze Groq LPU: "${userText}". Bufor SQLite WAL zsynchronizowany pomyślnie.`,
        time: `${timeStr} • Groq 14ms`
      };
      setChatMessages((prev) => [...prev, aiResponse]);
      setIsAiResponding(false);
    }, 700);
  };

  return (
    <div className="flex flex-col w-full space-y-space-lg">
      {/* Top Page Header */}
      <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-space-md">
        <div className="flex flex-col space-y-space-xs">
          <div className="flex items-center gap-space-xs text-on-surface-variant font-code-mono text-code-mono">
            <span onClick={() => navigate('/')} className="hover:text-primary transition-colors cursor-pointer">OmniDash</span>
            <span className="text-outline">/</span>
            <span className="text-on-surface-variant">Core</span>
            <span className="text-outline">/</span>
            <span className="text-primary font-medium">Pulpit Systemowy</span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-semibold">
            Centrum Operacyjne OmniDash
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-space-xs flex-wrap">
            <span>Autonomiczny HUD systemowy</span>
            <span className="text-outline">•</span>
            <span className="text-secondary font-medium">Protokół Antigravity v3.0</span>
            <span className="text-outline">•</span>
            <span>Zsynchronizowano z SQLite WAL &amp; Firestore</span>
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-space-sm flex-wrap">
          <button 
            className="group flex items-center gap-space-xs px-space-md py-space-xs rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface transition-all duration-200 cursor-pointer" 
            type="button"
          >
            <span className="material-symbols-outlined text-[18px] text-secondary group-hover:scale-110 transition-transform">
              filter_center_focus
            </span>
            <span className="font-label-md text-label-md">Tryb Skupienia</span>
          </button>

          <button 
            className="group flex items-center gap-space-xs px-space-md py-space-xs rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface transition-all duration-200 cursor-pointer" 
            onClick={triggerSync} 
            type="button"
          >
            <span className={`material-symbols-outlined text-[18px] text-primary transition-transform duration-500 ${isSyncing ? 'animate-spin' : 'group-hover:rotate-180'}`}>
              sync
            </span>
            <span className="font-label-md text-label-md">Synchronizuj Wszystko</span>
          </button>

          <button 
            className="flex items-center gap-space-xs px-space-md py-space-xs rounded-lg bg-primary text-on-primary hover:bg-primary-fixed-dim transition-colors shadow-sm cursor-pointer" 
            onClick={() => navigate('/server-logs')}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">terminal</span>
            <span className="font-label-md text-label-md font-semibold">Terminal CLI</span>
            <span className="font-code-mono text-code-mono text-on-primary/70 ml-space-xs text-[11px] bg-on-primary/10 px-1 rounded">~</span>
          </button>
        </div>
      </header>

      {/* Omni Intelligence Briefing Banner */}
      <section className="relative rounded-xl bg-surface-container-low p-space-lg overflow-hidden shadow-xl">
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-primary/10 blur-3xl pointer-events-none"></div>
        <div className="absolute -left-10 -bottom-10 w-64 h-64 rounded-full bg-secondary/5 blur-2xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
          <div className="flex items-start gap-space-md">
            <div className="w-12 h-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[26px]">psychology</span>
            </div>
            <div className="flex flex-col space-y-space-xs max-w-4xl">
              <div className="flex items-center gap-space-sm flex-wrap">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-semibold">
                  Syntetyczny Briefing Omni AI
                </span>
                <span className="px-space-xs py-0.5 rounded-full bg-surface-container text-on-surface-variant font-code-mono text-[10px] uppercase">
                  LPU 120t/s
                </span>
                <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                  Gotowy do dyktowania
                </span>
              </div>
              <p className="font-body-lg text-body-lg text-on-surface leading-relaxed">
                Wykryto 2 zadania priorytetowe na dziś: sesja treningowa FBW na strychu (17:30) oraz synchronizacja terminów z Librusa. Stan bazy SQLite: optymalny (3.2 MB, WAL aktywny). Temperatura systemu w normie (CPU 14%).
              </p>
              {isBriefingExpanded && (
                <div className="mt-2 pt-2 border-t border-surface-container-high/60 text-body-md text-on-surface-variant font-code-mono text-[12px] space-y-1">
                  <div>[+] Rejestr Pamięci: 34 fakty zsynchronizowane z Obsidian.</div>
                  <div>[*] Przepustowość LPU: 420 t/s w kwantyzacji FP8.</div>
                  <div>[OK] Wskaźnik zbieżności budżetu kopertowego: 87% planu miesięcznego.</div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-space-sm shrink-0 self-end lg:self-center">
            <button 
              className="flex items-center gap-space-xs px-space-md py-space-xs rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface transition-colors font-label-md text-label-md cursor-pointer" 
              onClick={() => setIsBriefingExpanded(prev => !prev)}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isBriefingExpanded ? 'unfold_less' : 'unfold_more'}
              </span>
              <span>{isBriefingExpanded ? 'Zwiń briefing' : 'Rozwiń briefing'}</span>
            </button>
            <button 
              className="flex items-center gap-space-xs px-space-md py-space-xs rounded-lg bg-primary-container text-on-primary-container hover:bg-primary transition-colors font-label-md text-label-md font-semibold cursor-pointer shadow-sm" 
              onClick={() => navigate('/chat')}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">mic</span>
              <span>Uruchom Hej Omni</span>
            </button>
          </div>
        </div>
      </section>

      {/* Metric KPI Grid (4 columns) */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md">
        {/* KPI 1: Aktywność Dnia */}
        <div className="relative rounded-xl bg-surface-container-low p-space-lg flex flex-col justify-between hover:bg-surface-container transition-colors shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
              Aktywność Dnia
            </span>
            <span className="flex items-center gap-0.5 text-primary font-code-mono text-code-mono bg-primary/10 px-space-xs py-0.5 rounded">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              +5%
            </span>
          </div>
          <div className="my-space-md flex items-baseline justify-between">
            <div>
              <span className="font-headline-xl text-headline-xl text-on-surface font-semibold tracking-tight">82%</span>
              <span className="font-label-md text-label-md text-on-surface-variant block mt-space-xs">Harmonogram + Zadania</span>
            </div>
            {/* Progress Ring SVG */}
            <div className="relative w-14 h-14 shrink-0">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                <path 
                  className="text-surface-container-highest stroke-current" 
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                  fill="none" 
                  strokeWidth="3.5"
                />
                <path 
                  className="text-primary stroke-current" 
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                  fill="none" 
                  strokeDasharray="82, 100" 
                  strokeLinecap="round" 
                  strokeWidth="3.5"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-code-mono text-[10px] text-primary font-semibold">9/11</span>
            </div>
          </div>
          <div className="pt-space-xs flex items-center justify-between text-on-surface-variant font-code-mono text-[11px]">
            <span>Pozostało: 2 bloki</span>
            <span onClick={() => navigate('/timetable')} className="text-primary hover:underline cursor-pointer">
              Harmonogram →
            </span>
          </div>
        </div>

        {/* KPI 2: Sesja Treningowa FBW */}
        <div className="relative rounded-xl bg-surface-container-low p-space-lg flex flex-col justify-between hover:bg-surface-container transition-colors shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
              Sesja Treningowa FBW
            </span>
            <span className="px-space-xs py-0.5 rounded-full bg-secondary/15 text-secondary font-code-mono text-[10px] font-medium">
              Plan B
            </span>
          </div>
          <div className="my-space-md">
            <span className="font-headline-md text-headline-md text-on-surface font-semibold block leading-tight">
              Środa: Klatka / Plecy / Barki
            </span>
            <div className="flex items-center gap-space-xs mt-space-xs text-on-surface-variant font-body-md text-body-md">
              <span className="material-symbols-outlined text-[16px] text-primary">roofing</span>
              <span>Strych, 17:30 (75 min)</span>
            </div>
          </div>
          <div className="pt-space-xs flex items-center justify-between text-on-surface-variant font-code-mono text-[11px]">
            <span className="flex items-center gap-1 text-on-surface font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> 4 serie bazowe
            </span>
            <span onClick={() => navigate('/workouts')} className="text-secondary hover:underline cursor-pointer">
              Dziennik ćwiczeń →
            </span>
          </div>
        </div>

        {/* KPI 3: Finanse Koperty */}
        <div className="relative rounded-xl bg-surface-container-low p-space-lg flex flex-col justify-between hover:bg-surface-container transition-colors shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
              Finanse Koperty
            </span>
            <span className="font-code-mono text-code-mono text-primary font-semibold bg-primary/10 px-space-xs py-0.5 rounded">
              +1 420 zł
            </span>
          </div>
          <div className="my-space-md space-y-space-xs">
            <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
              <span>50% Potrzeby</span>
              <span>30% Fun</span>
              <span>20% Oszcz.</span>
            </div>
            <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden flex">
              <div className="h-full bg-primary" style={{ width: '50%' }}></div>
              <div className="h-full bg-secondary" style={{ width: '30%' }}></div>
              <div className="h-full bg-tertiary" style={{ width: '20%' }}></div>
            </div>
            <span className="font-code-mono text-[11px] text-on-surface-variant block text-right pt-0.5">
              Stan miesiąca: 87% limitu
            </span>
          </div>
          <div className="pt-space-xs flex items-center justify-between text-on-surface-variant font-code-mono text-[11px]">
            <span>Portfel v3</span>
            <span onClick={() => navigate('/finances')} className="text-primary hover:underline cursor-pointer">
              Rozchody →
            </span>
          </div>
        </div>

        {/* KPI 4: Telemetria Systemu & LPU */}
        <div className="relative rounded-xl bg-surface-container-low p-space-lg flex flex-col justify-between hover:bg-surface-container transition-colors shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
              Telemetria &amp; LPU
            </span>
            <span className="inline-flex items-center gap-1 font-code-mono text-[10px] text-primary bg-primary/10 px-space-xs py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span> 18ms
            </span>
          </div>
          <div className="my-space-md flex items-baseline justify-between">
            <div>
              <span className="font-headline-xl text-headline-xl text-on-surface font-semibold tracking-tight font-code-mono">
                120B
              </span>
              <span className="font-label-md text-label-md text-on-surface-variant block mt-space-xs">
                Groq LPU Engine Active
              </span>
            </div>
            <div className="text-right font-code-mono">
              <span className="text-primary text-body-md font-semibold block">V8 184MB</span>
              <span className="text-outline text-[11px]">Heap: 48%</span>
            </div>
          </div>
          <div className="pt-space-xs flex items-center justify-between text-on-surface-variant font-code-mono text-[11px]">
            <span>Kernel: Antigravity</span>
            <span onClick={() => navigate('/server-logs')} className="text-secondary hover:underline cursor-pointer">
              Węzły LPU →
            </span>
          </div>
        </div>
      </section>

      {/* Middle Split: Left 7 Cols / Right 5 Cols */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
        {/* LEFT COLUMN (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-space-lg">
          {/* Live IT News Ticker (Brave API Search feeds) */}
          <section className="rounded-xl bg-surface-container-low p-space-lg shadow-sm flex flex-col space-y-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-primary text-[20px]">feed</span>
                <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">Live IT News &amp; OSINT Ticker</h2>
              </div>
              <div className="flex items-center gap-space-xs font-code-mono text-[11px] bg-surface-container p-1 rounded-lg">
                <button 
                  onClick={() => setNewsFilter('10m')}
                  className={`px-space-xs py-0.5 rounded font-medium transition-all cursor-pointer ${
                    newsFilter === '10m' ? 'bg-surface-container-high text-primary' : 'text-on-surface-variant hover:text-on-surface'
                  }`} 
                  type="button"
                >
                  10m
                </button>
                <button 
                  onClick={() => setNewsFilter('15m')}
                  className={`px-space-xs py-0.5 rounded font-medium transition-all cursor-pointer ${
                    newsFilter === '15m' ? 'bg-surface-container-high text-primary' : 'text-on-surface-variant hover:text-on-surface'
                  }`} 
                  type="button"
                >
                  15m
                </button>
                <button 
                  onClick={() => setNewsFilter('20m')}
                  className={`px-space-xs py-0.5 rounded font-medium transition-all cursor-pointer ${
                    newsFilter === '20m' ? 'bg-surface-container-high text-primary' : 'text-on-surface-variant hover:text-on-surface'
                  }`} 
                  type="button"
                >
                  20m
                </button>
              </div>
            </div>

            {/* News Ticker Items */}
            <div className="space-y-space-xs">
              <article className="p-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors flex items-start justify-between gap-space-md group cursor-pointer">
                <div className="flex flex-col space-y-1 min-w-0">
                  <div className="flex items-center gap-space-xs">
                    <span className="px-space-xs py-0.5 rounded font-code-mono text-[10px] bg-primary/10 text-primary">CyberSec</span>
                    <span className="font-code-mono text-[11px] text-outline">Brave Search • 4m temu</span>
                  </div>
                  <h3 className="font-body-md text-body-md text-on-surface font-medium truncate group-hover:text-primary transition-colors">
                    Krytyczna podatność w sterownikach wirtualizacji NVMe wykryta w infrastrukturze brzegowej
                  </h3>
                </div>
                <span className="material-symbols-outlined text-[18px] text-outline group-hover:text-primary transition-colors shrink-0">
                  north_east
                </span>
              </article>

              <article className="p-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors flex items-start justify-between gap-space-md group cursor-pointer">
                <div className="flex flex-col space-y-1 min-w-0">
                  <div className="flex items-center gap-space-xs">
                    <span className="px-space-xs py-0.5 rounded font-code-mono text-[10px] bg-secondary/10 text-secondary">AI Hardware</span>
                    <span className="font-code-mono text-[11px] text-outline">Brave Search • 11m temu</span>
                  </div>
                  <h3 className="font-body-md text-body-md text-on-surface font-medium truncate group-hover:text-secondary transition-colors">
                    Nowa generacja jednostek LPU osiąga 400 tokenów na sekundę w kwantyzacji FP8
                  </h3>
                </div>
                <span className="material-symbols-outlined text-[18px] text-outline group-hover:text-secondary transition-colors shrink-0">
                  north_east
                </span>
              </article>

              <article className="p-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors flex items-start justify-between gap-space-md group cursor-pointer">
                <div className="flex flex-col space-y-1 min-w-0">
                  <div className="flex items-center gap-space-xs">
                    <span className="px-space-xs py-0.5 rounded font-code-mono text-[10px] bg-surface-container-highest text-on-surface-variant">Architektura</span>
                    <span className="font-code-mono text-[11px] text-outline">Brave Search • 18m temu</span>
                  </div>
                  <h3 className="font-body-md text-body-md text-on-surface font-medium truncate group-hover:text-primary transition-colors">
                    SQLite 3.46 wprowadza natywne ulepszenia współbieżności w trybach rozproszonych
                  </h3>
                </div>
                <span className="material-symbols-outlined text-[18px] text-outline group-hover:text-primary transition-colors shrink-0">
                  north_east
                </span>
              </article>
            </div>
          </section>

          {/* CANARD / Open-Meteo Weather widget */}
          <section className="rounded-xl bg-surface-container-low p-space-lg shadow-sm flex flex-col space-y-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-primary text-[20px]">cloudy_snowing</span>
                <div className="flex flex-col">
                  <h2 className="font-headline-md text-headline-md text-on-surface font-semibold leading-tight">CANARD &amp; Open-Meteo</h2>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Telemetria meteorologiczna i alerty drogowe</span>
                </div>
              </div>
              <span className="font-code-mono text-[11px] text-on-surface-variant bg-surface-container px-space-sm py-space-xs rounded-lg">
                Stacja: Kraków-Północ
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm">
              <div className="p-space-sm rounded-lg bg-surface-container flex flex-col">
                <span className="font-label-sm text-label-sm text-outline uppercase">Temperatura</span>
                <span className="font-headline-md text-headline-md text-on-surface font-semibold mt-1">+6.4°C</span>
                <span className="font-code-mono text-[11px] text-on-surface-variant">Odczuwalna +4.1°C</span>
              </div>
              <div className="p-space-sm rounded-lg bg-surface-container flex flex-col">
                <span className="font-label-sm text-label-sm text-outline uppercase">Ciśnienie</span>
                <span className="font-headline-md text-headline-md text-on-surface font-semibold mt-1">1018 hPa</span>
                <span className="font-code-mono text-[11px] text-primary">Stabilne</span>
              </div>
              <div className="p-space-sm rounded-lg bg-surface-container flex flex-col">
                <span className="font-label-sm text-label-sm text-outline uppercase">Widoczność</span>
                <span className="font-headline-md text-headline-md text-on-surface font-semibold mt-1">&gt; 10 km</span>
                <span className="font-code-mono text-[11px] text-on-surface-variant">Wilgotność 74%</span>
              </div>
              <div className="p-space-sm rounded-lg bg-surface-container flex flex-col">
                <span className="font-label-sm text-label-sm text-outline uppercase">Status CANARD</span>
                <span className="font-headline-md text-headline-md text-secondary font-semibold mt-1">Brak Utrudnień</span>
                <span className="font-code-mono text-[11px] text-on-surface-variant">Trasa A4 / S7 płynna</span>
              </div>
            </div>

            {/* Micro Road Safety Alert */}
            <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-high/60 text-on-surface-variant font-body-md text-body-md">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-[18px] text-primary">traffic</span>
                <span>Ostrzeżenie drogowe: Możliwe lokalne przymrozki po godz. 21:00 na wiaduktach.</span>
              </div>
              <span className="font-code-mono text-[11px] text-outline shrink-0">Ważne do 06:00</span>
            </div>
          </section>

          {/* Oś Czasu Dnia */}
          <section className="rounded-xl bg-surface-container-low p-space-lg shadow-sm flex flex-col space-y-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-primary text-[20px]">calendar_view_day</span>
                <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">Oś Czasu Dnia</h2>
              </div>
              <span className="font-code-mono text-code-mono text-primary font-medium">Dziś • Środa</span>
            </div>

            <div className="relative pl-6 space-y-space-md before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-container-highest">
              {/* Event 1 (Zrealizowano) */}
              <div className="relative flex items-start justify-between gap-space-md">
                <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-outline"></span>
                <div className="flex flex-col">
                  <div className="flex items-center gap-space-sm">
                    <span className="font-code-mono text-code-mono text-outline line-through">08:30 - 12:30</span>
                    <span className="px-space-xs py-0.5 rounded font-label-sm text-[10px] bg-surface-container text-outline">Zakończono</span>
                  </div>
                  <span className="font-body-md text-body-md text-on-surface-variant line-through font-medium">Głęboka praca projektowa: Silnik Antigravity v3.0</span>
                </div>
                <span className="font-code-mono text-[11px] text-outline shrink-0">4h</span>
              </div>

              {/* Event 2 (Aktualnie) */}
              <div className="relative flex items-start justify-between gap-space-md">
                <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-primary ring-4 ring-primary/20 animate-pulse"></span>
                <div className="flex flex-col">
                  <div className="flex items-center gap-space-sm">
                    <span className="font-code-mono text-code-mono text-primary font-semibold">13:30 - 15:30</span>
                    <span className="px-space-xs py-0.5 rounded font-label-sm text-[10px] bg-primary/10 text-primary font-semibold">W trakcie</span>
                  </div>
                  <span className="font-body-md text-body-md text-on-surface font-medium">Konsultacje akademickie &amp; przegląd postępów</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Sala seminaryjna B2 / Zdalnie Google Meet</span>
                </div>
                <span className="font-code-mono text-[11px] text-primary shrink-0">Pozostało 45m</span>
              </div>

              {/* Event 3 (Priorytet Trening) */}
              <div className="relative flex items-start justify-between gap-space-md">
                <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-secondary"></span>
                <div className="flex flex-col">
                  <div className="flex items-center gap-space-sm">
                    <span className="font-code-mono text-code-mono text-secondary font-medium">17:30 - 18:45</span>
                    <span className="px-space-xs py-0.5 rounded font-label-sm text-[10px] bg-secondary/15 text-secondary">FBW Strych</span>
                  </div>
                  <span className="font-body-md text-body-md text-on-surface font-medium">Sesja Treningowa FBW: Klatka / Plecy / Barki</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Rozgrzewka dynamiczna + 4 serie robocze wyciskania</span>
                </div>
                <span className="font-code-mono text-[11px] text-on-surface-variant shrink-0">75m</span>
              </div>

              {/* Event 4 (Wieczór) */}
              <div className="relative flex items-start justify-between gap-space-md">
                <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-surface-container-highest"></span>
                <div className="flex flex-col">
                  <div className="flex items-center gap-space-sm">
                    <span className="font-code-mono text-code-mono text-on-surface-variant">20:00 - 21:00</span>
                    <span className="px-space-xs py-0.5 rounded font-label-sm text-[10px] bg-surface-container text-on-surface-variant">OSINT Intel</span>
                  </div>
                  <span className="font-body-md text-body-md text-on-surface font-medium">Przegląd OSINT &amp; Aktualizacja bazy wiedzy</span>
                </div>
                <span className="font-code-mono text-[11px] text-on-surface-variant shrink-0">60m</span>
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-space-lg">
          {/* Szybki Chat Omni AI (Miniaturowy interfejs LPU) */}
          <section className="rounded-xl bg-surface-container-low p-space-lg shadow-sm flex flex-col justify-between space-y-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-sm">
                <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                </div>
                <div>
                  <h2 className="font-headline-md text-headline-md text-on-surface font-semibold leading-tight">Szybki Chat Omni AI</h2>
                  <span className="font-label-sm text-label-sm text-primary font-code-mono">Groq LPU Engine • 120t/s</span>
                </div>
              </div>
              <button 
                onClick={() => navigate('/chat')}
                className="w-7 h-7 rounded flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer" 
                title="Przejdź do pełnego czatu"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">history</span>
              </button>
            </div>

            {/* Chat History Mini Preview */}
            <div className="space-y-space-sm rounded-lg bg-surface-container-lowest p-space-md max-h-56 overflow-y-auto">
              {chatMessages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex flex-col space-y-1 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`px-space-md py-space-xs rounded-xl font-body-md text-body-md ${
                    msg.sender === 'user' 
                      ? 'rounded-tr-none bg-primary text-on-primary max-w-[85%]' 
                      : 'rounded-tl-none bg-surface-container text-on-surface max-w-[90%]'
                  }`}>
                    {msg.text}
                  </div>
                  <span className="font-code-mono text-[10px] text-outline">
                    {msg.time}
                  </span>
                </div>
              ))}
              {isAiResponding && (
                <div className="flex items-center gap-1.5 text-outline font-code-mono text-[11px] p-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
                  <span>Omni generuje odpowiedź...</span>
                </div>
              )}
            </div>

            {/* Quick AI Prompt Input */}
            <form onSubmit={handleSendPrompt} className="relative flex flex-col space-y-space-xs">
              <div className="flex items-center bg-surface-container rounded-lg px-space-md py-space-xs shadow-inner">
                <input 
                  className="w-full bg-transparent text-on-surface placeholder:text-outline font-body-md text-body-md focus:outline-none" 
                  placeholder="Wydaj polecenie lub zapytaj Omni..." 
                  type="text"
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                />
                <div className="flex items-center gap-space-xs shrink-0 ml-space-sm">
                  <button 
                    className="w-8 h-8 rounded-full bg-surface-container-high hover:bg-primary hover:text-on-primary text-primary transition-colors flex items-center justify-center cursor-pointer" 
                    title="Dyktowanie głosowe: Hej Omni" 
                    onClick={() => navigate('/chat')}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">mic</span>
                  </button>
                  <button 
                    className="w-8 h-8 rounded-lg bg-primary text-on-primary hover:bg-primary-fixed-dim transition-colors flex items-center justify-center cursor-pointer shadow-sm" 
                    type="submit"
                  >
                    <span className="material-symbols-outlined text-[18px]">send</span>
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between px-space-xs text-outline font-code-mono text-[11px]">
                <span>Tryb: Direct Execution</span>
                <span>Naciśnij <kbd className="px-1 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-medium">Enter</kbd> aby wysłać</span>
              </div>
            </form>
          </section>

          {/* Status Usług i Integracji */}
          <section className="rounded-xl bg-surface-container-low p-space-lg shadow-sm flex flex-col space-y-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-primary text-[20px]">hub</span>
                <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">Usługi &amp; Integracje</h2>
              </div>
              <span className="font-code-mono text-code-mono text-primary font-medium">5/5 Operacyjne</span>
            </div>

            <div className="space-y-space-xs font-body-md text-body-md">
              {/* Firestore Realtime */}
              <div className="p-space-sm rounded-lg bg-surface-container flex items-center justify-between">
                <div className="flex items-center gap-space-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
                  <div className="flex flex-col">
                    <span className="font-medium text-on-surface">Firestore Realtime</span>
                    <span className="font-code-mono text-[11px] text-outline">Chmura wieloregionowa EU</span>
                  </div>
                </div>
                <span className="px-space-xs py-0.5 rounded-full bg-primary/10 text-primary font-code-mono text-[10px] font-semibold">
                  Aktywny
                </span>
              </div>

              {/* SQLite WAL */}
              <div className="p-space-sm rounded-lg bg-surface-container flex items-center justify-between">
                <div className="flex items-center gap-space-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                  <div className="flex flex-col">
                    <span className="font-medium text-on-surface">SQLite WAL Engine</span>
                    <span className="font-code-mono text-[11px] text-outline">Baza lokalna 3.2MB • zero lag</span>
                  </div>
                </div>
                <span className="px-space-xs py-0.5 rounded-full bg-secondary/15 text-secondary font-code-mono text-[10px] font-semibold">
                  Spójny
                </span>
              </div>

              {/* Librus Sync */}
              <div className="p-space-sm rounded-lg bg-surface-container flex items-center justify-between">
                <div className="flex items-center gap-space-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                  <div className="flex flex-col">
                    <span className="font-medium text-on-surface">Librus Synergia API</span>
                    <span className="font-code-mono text-[11px] text-outline">Ostatni zrzut: 12 min temu</span>
                  </div>
                </div>
                <span className="px-space-xs py-0.5 rounded bg-surface-container-high text-on-surface-variant font-code-mono text-[10px]">
                  Auto (1h)
                </span>
              </div>

              {/* Pushbullet Listener */}
              <div className="p-space-sm rounded-lg bg-surface-container flex items-center justify-between">
                <div className="flex items-center gap-space-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                  <div className="flex flex-col">
                    <span className="font-medium text-on-surface">Pushbullet Listener</span>
                    <span className="font-code-mono text-[11px] text-outline">WebSocket nasłuch powiadomień</span>
                  </div>
                </div>
                <span className="px-space-xs py-0.5 rounded-full bg-primary/10 text-primary font-code-mono text-[10px] font-semibold">
                  Nasłuch
                </span>
              </div>

              {/* Obsidian Vault */}
              <div className="p-space-sm rounded-lg bg-surface-container flex items-center justify-between">
                <div className="flex items-center gap-space-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                  <div className="flex flex-col">
                    <span className="font-medium text-on-surface">Obsidian Vault</span>
                    <span className="font-code-mono text-[11px] text-secondary">[[OmniDash-Brain]]</span>
                  </div>
                </div>
                <span className="px-space-xs py-0.5 rounded-full bg-secondary/15 text-secondary font-code-mono text-[10px] font-semibold">
                  Zsynchronizowano
                </span>
              </div>
            </div>

            <div className="pt-space-xs flex items-center justify-between font-code-mono text-[11px] text-on-surface-variant">
              <span>Ostatni pełny backup: 03:00</span>
              <span onClick={() => navigate('/server-logs')} className="text-primary hover:underline cursor-pointer">
                Logi systemowe →
              </span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
