import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import { useChatContext } from '../context/ChatContext';
import { wakeWordService } from '../services/wakeWordService';
import { ttsService } from '../services/ttsService';

const AVAILABLE_MODELS = [
  'Groq LPU (120B)',
  'Claude 3.5 Sonnet',
  'Llama 3.3 70B Turbo'
];

const DEFAULT_TOOLS = [
  { id: 'tool_db', name: 'Firestore / SQLite Tool', active: true },
  { id: 'tool_librus', name: 'Librus Schedule Fetcher', active: true },
  { id: 'tool_push', name: 'Pushbullet Dispatcher', active: true },
  { id: 'tool_osint', name: 'OSINT & DNS Resolver', active: true },
  { id: 'tool_workout', name: 'Workout & Reps Tracker', active: true },
];

const DEFAULT_THREADS = [
  { id: 'th1', title: 'Analiza treningu FBW & Librus', date: 'Dzisiaj', time: '12:14', active: true },
  { id: 'th2', title: 'Optymalizacja zapytań SQLite', date: 'Wczoraj', time: '19:40', active: false },
  { id: 'th3', title: 'OSINT rekonesans IP ASN4812', date: '12 Paź', time: '22:05', active: false },
];

const ChatPage = () => {
  const { t } = useTranslation();
  const { workerMessages, setWorkerMessages, handleSend } = useChatContext();

  const [inputMessage, setInputMessage] = useState('');
  const [modelIdx, setModelIdx] = useState(0);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [isMicListening, setIsMicListening] = useState(false);
  const [toolsList, setToolsList] = useState(DEFAULT_TOOLS);
  const [threads, setThreads] = useState(DEFAULT_THREADS);
  const [activeThreadId, setActiveThreadId] = useState('th1');
  const [tokensMeta, setTokensMeta] = useState({ in: 1420, out: 388, cost: '$0.0004' });
  const [showClearToast, setShowClearToast] = useState(false);
  const [copyToast, setCopyToast] = useState(false);

  const dialogueBoxRef = useRef(null);

  // Auto-scroll to bottom on messages change
  useEffect(() => {
    if (dialogueBoxRef.current) {
      dialogueBoxRef.current.scrollTop = dialogueBoxRef.current.scrollHeight;
    }
  }, [workerMessages]);

  const toggleTool = (id) => {
    setToolsList(prev => prev.map(tool => 
      tool.id === id ? { ...tool, active: !tool.active } : tool
    ));
  };

  const handleNextModel = () => {
    setModelIdx((modelIdx + 1) % AVAILABLE_MODELS.length);
  };

  const handleClearContext = () => {
    setWorkerMessages([]);
    setShowClearToast(true);
    setTimeout(() => setShowClearToast(false), 2500);
  };

  const handleExportLog = () => {
    const exportContent = workerMessages.map(m => `[${m.role.toUpperCase()}] ${m.content}`).join('\n\n');
    const blob = new Blob([exportContent || 'OmniDash Chat Log'], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Omni-Log-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onSendMessage = async (e) => {
    if (e) e.preventDefault();
    const text = inputMessage.trim();
    if (!text) return;

    setInputMessage('');
    setTokensMeta(prev => ({
      in: prev.in + Math.round(text.length / 4),
      out: prev.out + 45,
      cost: `$${(parseFloat(prev.cost.replace('$', '')) + 0.0001).toFixed(4)}`
    }));

    if (handleSend) {
      await handleSend(text);
    }
  };

  const handleQuickAction = (action) => {
    if (action === 'copy') {
      navigator.clipboard?.writeText("Sprawdziłem Twój dzisiejszy harmonogram. O 12:45 masz okienko (odwołana lekcja fizyki)...");
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2000);
    } else if (action === 'timer') {
      window.location.hash = '#timer';
      alert('Stoper sesji został zainicjalizowany.');
    } else if (action === 'pushbullet') {
      alert('Plan treningowy i harmonogram wysłany na smartfon przez Pushbullet.');
    }
  };

  const activeToolsCount = useMemo(() => {
    return toolsList.filter(t => t.active).length;
  }, [toolsList]);

  return (
    <div className="flex flex-col w-full h-full gap-space-md custom-scrollbar pb-24 md:pb-6">
      
      {/* Dynamic Atmospheric Glow Accent */}
      <div className="relative w-full overflow-hidden rounded-xl bg-surface-container-lowest p-space-md shadow-sm border border-white/[0.04]">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none"></div>
        <div className="absolute -left-12 -bottom-12 h-48 w-48 rounded-full bg-secondary-container/20 blur-2xl pointer-events-none"></div>
        
        {/* Top Sub-Bar & Status Metas */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-sm flex-wrap">
              <span className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
                Omni Chat AI • Groq LPU Engine
              </span>
              <span className="px-space-sm py-0.5 rounded-full bg-surface-container-high text-primary font-code-mono text-code-mono text-xs flex items-center gap-1.5 border border-white/[0.06]">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                GPT-OSS-120B
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
              Autonomiczne wywoływanie narzędzi (Tool Calling) • Ciągły nasłuch w tle „Hej Omni” • Przetwarzanie brzegowe w czasie rzeczywistym
            </p>
          </div>

          {/* Action Cluster */}
          <div className="flex items-center gap-space-xs flex-wrap">
            <button 
              onClick={handleClearContext}
              className="flex items-center gap-space-xs px-space-md py-space-xs rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-label-md font-label-md transition-colors shadow-sm active:scale-95" 
              type="button"
            >
              <span className="material-symbols-outlined text-[16px] text-outline">history_toggle_off</span>
              <span>Wyczyść kontekst</span>
            </button>
            
            <div className="relative inline-block text-left">
              <button 
                onClick={handleNextModel}
                className="flex items-center gap-space-xs px-space-md py-space-xs rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-label-md font-label-md transition-colors shadow-sm active:scale-95" 
                type="button"
              >
                <span className="material-symbols-outlined text-[16px] text-primary">memory</span>
                <span>{AVAILABLE_MODELS[modelIdx]}</span>
                <span className="material-symbols-outlined text-[16px] text-outline">expand_more</span>
              </button>
            </div>

            <button 
              onClick={handleExportLog}
              className="flex items-center gap-space-xs px-space-md py-space-xs rounded-lg bg-primary text-on-primary hover:bg-primary-fixed-dim text-label-md font-label-md transition-colors shadow-sm font-semibold active:scale-95"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">file_upload</span>
              <span>Eksport [[Omni-Log]]</span>
            </button>
          </div>
        </div>

        {/* Badges Row */}
        <div className="relative z-10 mt-space-md pt-space-sm flex items-center gap-space-xs flex-wrap border-t border-white/[0.04]">
          <div className="flex items-center gap-space-xs px-space-sm py-0.5 rounded-full bg-surface-container text-on-surface font-code-mono text-code-mono text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
            <span className="text-outline">Engine:</span>
            <span className="font-semibold text-primary">{AVAILABLE_MODELS[modelIdx]} (Active)</span>
          </div>
          <div className="flex items-center gap-space-xs px-space-sm py-0.5 rounded-full bg-surface-container text-on-surface font-code-mono text-code-mono text-xs">
            <span className="material-symbols-outlined text-[13px] text-outline">speed</span>
            <span className="text-outline">Latency:</span>
            <span className="text-on-surface font-semibold">14ms</span>
          </div>
          <div className="flex items-center gap-space-xs px-space-sm py-0.5 rounded-full bg-surface-container text-on-surface font-code-mono text-code-mono text-xs">
            <span className="material-symbols-outlined text-[13px] text-secondary">record_voice_over</span>
            <span className="text-on-surface-variant">Fish Audio / Edge TTS Ready</span>
          </div>
          <div className="flex items-center gap-space-xs px-space-sm py-0.5 rounded-full bg-surface-container text-on-surface font-code-mono text-code-mono text-xs">
            <span className="material-symbols-outlined text-[13px] text-tertiary">database</span>
            <span className="text-outline">Pamięć Sesji:</span>
            <span className="text-tertiary font-semibold">34 fakty</span>
          </div>
        </div>
      </div>

      {/* Workspace Grid: Sidebar & Chat Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md items-start">
        
        {/* Left Column: Context, Audio HUD, Tool Inspector, Threads (4/3 cols) */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-space-md">
          
          {/* Live Voice HUD Card */}
          <div className="p-space-md rounded-xl bg-surface-container-low shadow-sm flex flex-col gap-space-sm border border-white/[0.04]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">Voice Inspector HUD</span>
              </div>
              <span className="font-code-mono text-code-mono text-primary text-xs">96.4 kHz</span>
            </div>

            <div className="flex flex-col gap-space-xs py-space-xs">
              {/* Animated Audio Waveform (15 dynamic bars) */}
              <div className="flex items-end justify-between h-9 px-space-sm bg-surface-container-lowest rounded-lg overflow-hidden">
                <span className="w-1 bg-primary/70 rounded-full animate-[pulse_0.7s_infinite_alternate]" style={{ height: '35%' }}></span>
                <span className="w-1 bg-primary rounded-full animate-[pulse_0.4s_infinite_alternate]" style={{ height: '75%' }}></span>
                <span className="w-1 bg-primary/80 rounded-full animate-[pulse_0.9s_infinite_alternate]" style={{ height: '50%' }}></span>
                <span className="w-1 bg-primary rounded-full animate-[pulse_0.3s_infinite_alternate]" style={{ height: '90%' }}></span>
                <span className="w-1 bg-primary/60 rounded-full animate-[pulse_0.6s_infinite_alternate]" style={{ height: '30%' }}></span>
                <span className="w-1 bg-primary rounded-full animate-[pulse_0.45s_infinite_alternate]" style={{ height: '80%' }}></span>
                <span className="w-1 bg-primary/80 rounded-full animate-[pulse_0.8s_infinite_alternate]" style={{ height: '60%' }}></span>
                <span className="w-1 bg-primary rounded-full animate-[pulse_0.35s_infinite_alternate]" style={{ height: '95%' }}></span>
                <span className="w-1 bg-primary/70 rounded-full animate-[pulse_0.55s_infinite_alternate]" style={{ height: '40%' }}></span>
                <span className="w-1 bg-primary rounded-full animate-[pulse_0.65s_infinite_alternate]" style={{ height: '70%' }}></span>
                <span className="w-1 bg-primary/50 rounded-full animate-[pulse_0.9s_infinite_alternate]" style={{ height: '25%' }}></span>
                <span className="w-1 bg-primary rounded-full animate-[pulse_0.3s_infinite_alternate]" style={{ height: '85%' }}></span>
                <span className="w-1 bg-primary/90 rounded-full animate-[pulse_0.75s_infinite_alternate]" style={{ height: '65%' }}></span>
                <span className="w-1 bg-primary rounded-full animate-[pulse_0.5s_infinite_alternate]" style={{ height: '45%' }}></span>
                <span className="w-1 bg-primary/40 rounded-full animate-[pulse_1.1s_infinite_alternate]" style={{ height: '20%' }}></span>
              </div>

              <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm pt-space-xs">
                <span className="flex items-center gap-1.5 text-on-surface font-medium">
                  <span className="material-symbols-outlined text-[15px] text-primary">mic</span>
                  Nasłuch aktywny ("Hej Omni")
                </span>
                <span className="font-code-mono text-outline">WakeWord OK</span>
              </div>
            </div>
          </div>

          {/* Active Tools Inspector */}
          <div className="p-space-md rounded-xl bg-surface-container-low shadow-sm flex flex-col gap-space-sm border border-white/[0.04]">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">Tool Calling Registry</span>
              <span className="px-space-xs py-0.5 rounded bg-surface-container text-primary font-code-mono text-code-mono text-xs">
                {activeToolsCount}/5 live
              </span>
            </div>

            <div className="space-y-space-xs">
              {toolsList.map(tool => (
                <label 
                  key={tool.id}
                  onClick={() => toggleTool(tool.id)}
                  className="flex items-center justify-between p-space-xs px-space-sm rounded-lg bg-surface-container-lowest hover:bg-surface-container cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-space-xs">
                    <input 
                      checked={tool.active} 
                      onChange={() => {}}
                      className="accent-primary rounded w-3.5 h-3.5 bg-surface-container-high" 
                      type="checkbox"
                    />
                    <span className="font-code-mono text-code-mono text-xs text-on-surface">{tool.name}</span>
                  </div>
                  <span className={`w-1.5 h-1.5 rounded-full ${tool.active ? 'bg-primary' : 'bg-outline'}`}></span>
                </label>
              ))}
            </div>
          </div>

          {/* Recent Sessions / Threads */}
          <div className="p-space-md rounded-xl bg-surface-container-low shadow-sm flex flex-col gap-space-sm border border-white/[0.04]">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">Ostatnie Wątki</span>
              <button 
                onClick={() => {
                  const newTitle = prompt('Nazwa nowego wątku:');
                  if (newTitle) {
                    const newTh = { id: `th_${Date.now()}`, title: newTitle, date: 'Teraz', time: new Date().toTimeString().slice(0, 5), active: true };
                    setThreads(prev => [newTh, ...prev.map(t => ({ ...t, active: false }))]);
                    setActiveThreadId(newTh.id);
                  }
                }}
                className="text-on-surface-variant hover:text-on-surface text-label-sm font-label-sm flex items-center gap-1 active:scale-95"
              >
                <span className="material-symbols-outlined text-[14px]">add</span> Nowy
              </button>
            </div>

            <div className="flex flex-col gap-space-xs">
              {threads.map(th => {
                const isActive = activeThreadId === th.id;
                return (
                  <div 
                    key={th.id}
                    onClick={() => {
                      setActiveThreadId(th.id);
                      setThreads(prev => prev.map(t => ({ ...t, active: t.id === th.id })));
                    }}
                    className={`p-space-sm rounded-lg text-on-surface flex flex-col gap-0.5 cursor-pointer transition-colors ${
                      isActive ? 'bg-surface-container-high' : 'bg-surface-container-lowest hover:bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-label-sm text-label-sm font-semibold ${isActive ? 'text-primary' : 'text-outline'}`}>{th.date}</span>
                      <span className="font-code-mono text-[10px] text-outline">{th.time}</span>
                    </div>
                    <span className="font-body-md text-body-md font-medium truncate">{th.title}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Session Telemetry Pin */}
          <div className="p-space-sm rounded-lg bg-surface-container-lowest flex items-center justify-between text-outline font-code-mono text-code-mono text-xs border border-white/[0.04]">
            <span>Tokens IN: {tokensMeta.in.toLocaleString()}</span>
            <span>OUT: {tokensMeta.out.toLocaleString()}</span>
            <span className="text-primary font-semibold">{tokensMeta.cost}</span>
          </div>
        </div>

        {/* Center / Right Feed Area (8/9 Cols) */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-space-md min-w-0">
          
          {/* Dialogue Container */}
          <div 
            ref={dialogueBoxRef}
            className="flex flex-col gap-space-lg p-space-lg rounded-xl bg-surface-container-low min-h-[580px] max-h-[70vh] overflow-y-auto custom-scrollbar shadow-sm border border-white/[0.04]"
          >
            {/* System Marker */}
            <div className="flex items-center justify-center gap-space-sm text-outline font-code-mono text-code-mono text-xs">
              <span className="w-8 h-px bg-surface-container-high"></span>
              <span>Inicjalizacja sesji • Groq LPU Inference Cluster • Context Window: 128k</span>
              <span className="w-8 h-px bg-surface-container-high"></span>
            </div>

            {/* Clear toast notice */}
            {showClearToast && (
              <div className="p-space-sm rounded-lg bg-surface-container-lowest text-outline text-center font-code-mono text-xs">
                Kontekst rozmowy i pamięć krótkoterminowa zostały zresetowane.
              </div>
            )}

            {/* Default Mockup Message 1: Operator Query */}
            <div className="flex items-start justify-end gap-space-md pl-8">
              <div className="flex flex-col items-end gap-space-xs max-w-2xl">
                <div className="flex items-center gap-space-xs">
                  <span className="font-label-sm text-label-sm text-outline">12:14:02</span>
                  <span className="font-label-md text-label-md text-on-surface font-semibold">Operator K.</span>
                </div>
                <div className="p-space-md rounded-2xl rounded-tr-xs bg-surface-container-high text-on-surface font-body-md text-body-md shadow-sm">
                  Omni, przygotuj mi plan na dzisiejszy trening na strychu i sprawdź czy w Librusie nie ma odwołanych lekcji lub okienek.
                </div>
                <div className="flex items-center gap-space-xs text-outline font-code-mono text-[11px]">
                  <span className="material-symbols-outlined text-[13px] text-primary">done_all</span>
                  <span>Zsynchronizowano z SQLite WAL</span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-semibold shrink-0">
                <span className="material-symbols-outlined text-[18px]">person</span>
              </div>
            </div>

            {/* Default Mockup Message 2: Omni AI Response with Tool Execution Card */}
            <div className="flex items-start gap-space-md pr-8">
              <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-semibold shrink-0 shadow-[0_0_12px_rgba(77,142,255,0.3)]">
                <span className="material-symbols-outlined text-[18px]">smart_toy</span>
              </div>
              
              <div className="flex flex-col items-start gap-space-sm max-w-3xl w-full">
                <div className="flex items-center gap-space-xs">
                  <span className="font-label-md text-label-md text-primary font-semibold">Omni AI Assistant</span>
                  <span className="font-code-mono text-code-mono text-[11px] px-space-xs py-0.2 rounded bg-surface-container-highest text-on-surface-variant">LPU 120B</span>
                  <span className="font-label-sm text-label-sm text-outline ml-space-xs">12:14:04 • 1.8s</span>
                </div>

                {/* Tool Invocation Cards Stack */}
                <div className="w-full flex flex-col gap-space-xs">
                  {/* Tool 1: Librus Sync */}
                  <div className="p-space-sm rounded-lg bg-surface-container-lowest flex flex-col gap-1 shadow-sm border border-white/[0.04]">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <div className="flex items-center gap-space-xs">
                        <span className="material-symbols-outlined text-primary text-[15px]">terminal</span>
                        <span className="font-code-mono text-code-mono text-xs text-primary font-semibold">librus_sync.get_timetable(date="today")</span>
                      </div>
                      <div className="flex items-center gap-space-xs font-code-mono text-code-mono text-xs">
                        <span className="px-space-xs py-0.2 rounded bg-surface-container-high text-primary">HTTP 200 OK</span>
                        <span className="text-outline">48ms</span>
                      </div>
                    </div>
                    <div className="font-code-mono text-code-mono text-xs text-on-surface-variant pl-space-md">
                      • Wykryto zmianę w planie lekcji: <span className="text-tertiary font-semibold">12:45 Fizyka (Odwołana)</span> → Okienko: 45 minut.
                    </div>
                  </div>

                  {/* Tool 2: Workout Routine */}
                  <div className="p-space-sm rounded-lg bg-surface-container-lowest flex flex-col gap-1 shadow-sm border border-white/[0.04]">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <div className="flex items-center gap-space-xs">
                        <span className="material-symbols-outlined text-secondary text-[15px]">terminal</span>
                        <span className="font-code-mono text-code-mono text-xs text-secondary font-semibold">workouts.get_fbw_routine(day="Wednesday", location="strych")</span>
                      </div>
                      <div className="flex items-center gap-space-xs font-code-mono text-code-mono text-xs">
                        <span className="px-space-xs py-0.2 rounded bg-surface-container-high text-secondary">Local SQLite Sync</span>
                        <span className="text-outline">6ms</span>
                      </div>
                    </div>
                    <div className="font-code-mono text-code-mono text-xs text-on-surface-variant pl-space-md">
                      • Załadowano zestaw: Drążek, Dipy na poręczach, Wiosłowanie hantlem 22.5kg, OHP hantle.
                    </div>
                  </div>
                </div>

                {/* Natural Language Answer Body */}
                <div className="p-space-md rounded-2xl rounded-tl-xs bg-surface-container text-on-surface font-body-md text-body-md shadow-sm w-full space-y-space-sm leading-relaxed border border-white/[0.04]">
                  <p>
                    Sprawdziłem Twój dzisiejszy harmonogram. O <strong>12:45 masz okienko</strong> (odwołana lekcja fizyki), co daje idealny bufor czasowy na krótką regenerację przed blokiem popołudniowym.
                  </p>

                  {/* Workout Structure Card Inside Speech */}
                  <div className="p-space-md rounded-xl bg-surface-container-high flex flex-col gap-space-xs border border-white/[0.06]">
                    <div className="flex items-center justify-between">
                      <span className="font-label-md text-label-md text-on-surface font-semibold flex items-center gap-space-xs">
                        <span className="material-symbols-outlined text-[16px] text-primary">fitness_center</span>
                        Protokół FBW: Sesja B (Strych)
                      </span>
                      <span className="font-code-mono text-code-mono text-xs text-outline">Szacowany czas: 42 min</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-xs pt-space-xs font-body-md text-body-md">
                      <div className="p-space-xs px-2.5 rounded bg-surface-container-lowest flex items-center justify-between">
                        <span>1. Podciąganie na drążku</span>
                        <span className="font-code-mono text-code-mono text-primary font-semibold">2 serie (czarna guma)</span>
                      </div>
                      <div className="p-space-xs px-2.5 rounded bg-surface-container-lowest flex items-center justify-between">
                        <span>2. Dipy na poręczach</span>
                        <span className="font-code-mono text-code-mono text-primary font-semibold">2 serie (masa ciała)</span>
                      </div>
                      <div className="p-space-xs px-2.5 rounded bg-surface-container-lowest flex items-center justify-between">
                        <span>3. Wiosłowanie hantlem</span>
                        <span className="font-code-mono text-code-mono text-primary font-semibold">3 serie • 22.5 kg</span>
                      </div>
                      <div className="p-space-xs px-2.5 rounded bg-surface-container-lowest flex items-center justify-between">
                        <span>4. OHP hantlami</span>
                        <span className="font-code-mono text-code-mono text-primary font-semibold">3 serie • 14 kg</span>
                      </div>
                    </div>
                  </div>

                  <p>
                    Czy chcesz, abym uruchomił stoper sesji z automatycznym powiadomieniem Pushbullet na telefon po 3 minutach odpoczynku między seriami?
                  </p>
                </div>

                {/* Contextual Quick Actions */}
                <div className="flex items-center gap-space-xs flex-wrap pt-space-xs">
                  <button 
                    onClick={() => handleQuickAction('timer')}
                    className="px-space-md py-space-xs rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-label-md font-label-md flex items-center gap-1.5 transition-colors active:scale-95 border border-white/[0.04]"
                  >
                    <span className="material-symbols-outlined text-[15px] text-primary">play_arrow</span>
                    <span>Uruchom stoper sesji</span>
                  </button>
                  <button 
                    onClick={() => handleQuickAction('pushbullet')}
                    className="px-space-md py-space-xs rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-label-md font-label-md flex items-center gap-1.5 transition-colors active:scale-95 border border-white/[0.04]"
                  >
                    <span className="material-symbols-outlined text-[15px] text-secondary">notifications_active</span>
                    <span>Wyślij plan na Pushbullet</span>
                  </button>
                  <button 
                    onClick={() => handleQuickAction('copy')}
                    className="px-space-md py-space-xs rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-label-md font-label-md flex items-center gap-1.5 transition-colors active:scale-95 border border-white/[0.04]"
                  >
                    <span className="material-symbols-outlined text-[15px] text-outline">content_copy</span>
                    <span>{copyToast ? 'Skopiowano!' : 'Kopiuj'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Dynamic Conversation Stream from Context */}
            {workerMessages && workerMessages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              if (isUser) {
                return (
                  <div key={idx} className="flex items-start justify-end gap-space-md pl-8 animate-fade-in">
                    <div className="flex flex-col items-end gap-space-xs max-w-2xl">
                      <div className="flex items-center gap-space-xs">
                        <span className="font-label-sm text-label-sm text-outline">Teraz</span>
                        <span className="font-label-md text-label-md text-on-surface font-semibold">Operator K.</span>
                      </div>
                      <div className="p-space-md rounded-2xl rounded-tr-xs bg-surface-container-high text-on-surface font-body-md text-body-md shadow-sm border border-white/[0.04]">
                        {msg.content}
                      </div>
                      <div className="flex items-center gap-space-xs text-outline font-code-mono text-[11px]">
                        <span className="material-symbols-outlined text-[13px] text-primary">done_all</span>
                        <span>Zsynchronizowano z SQLite WAL</span>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-semibold shrink-0">
                      <span className="material-symbols-outlined text-[18px]">person</span>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div key={idx} className="flex items-start gap-space-md pr-8 animate-fade-in">
                    <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-semibold shrink-0 shadow-[0_0_12px_rgba(77,142,255,0.3)]">
                      <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                    </div>
                    <div className="flex flex-col items-start gap-space-sm max-w-3xl w-full">
                      <div className="flex items-center gap-space-xs">
                        <span className="font-label-md text-label-md text-primary font-semibold">Omni AI Assistant</span>
                        <span className="font-code-mono text-code-mono text-[11px] px-space-xs py-0.2 rounded bg-surface-container-highest text-on-surface-variant">LPU 120B</span>
                        <span className="font-label-sm text-label-sm text-outline ml-space-xs">Teraz • 0.3s</span>
                      </div>
                      <div className="p-space-md rounded-2xl rounded-tl-xs bg-surface-container text-on-surface font-body-md text-body-md shadow-sm w-full leading-relaxed border border-white/[0.04]">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                );
              }
            })}

          </div>

          {/* Bottom Interactive Glass Input Console (Sticky bottom-4) */}
          <div className="p-space-md rounded-2xl bg-surface-container-low/95 backdrop-blur-xl shadow-lg flex flex-col gap-space-sm sticky bottom-4 border border-white/[0.08]">
            
            {/* Input Textarea Bar */}
            <form onSubmit={onSendMessage} className="relative flex items-center">
              <input 
                className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline text-body-md font-body-md rounded-xl pl-space-md pr-32 py-space-md focus:outline-none focus:ring-1 focus:ring-primary shadow-inner border border-white/[0.04]" 
                id="user-chat-input" 
                placeholder="Wydaj polecenie Omni ('Sprawdź oceny', 'Zaplanuj jutrzejszy dzień', 'Wyślij ping')..." 
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
              />

              {/* Internal Right Controls inside bar */}
              <div className="absolute right-2 flex items-center gap-space-xs">
                <button 
                  onClick={() => setIsMicListening(!isMicListening)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors shadow-sm active:scale-95 ${
                    isMicListening 
                      ? 'bg-primary text-on-primary animate-pulse' 
                      : 'bg-surface-container hover:bg-surface-container-high text-primary'
                  }`}
                  id="voice-mic-trigger" 
                  title="Ciągły nasłuch 'Hej Omni'" 
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">mic</span>
                </button>
                <button 
                  className="w-9 h-9 rounded-lg bg-primary hover:bg-primary-fixed-dim text-on-primary flex items-center justify-center transition-colors shadow-sm active:scale-95" 
                  id="send-message-btn" 
                  title="Wyślij prompt" 
                  type="submit"
                >
                  <span className="material-symbols-outlined text-[20px]">send</span>
                </button>
              </div>
            </form>

            {/* Bottom Pill Controls & Telemetry */}
            <div className="flex items-center justify-between flex-wrap gap-space-xs pt-1">
              <div className="flex items-center gap-space-xs flex-wrap">
                {/* Tool selection pill */}
                <button 
                  onClick={() => alert(`Narzędzia autonomiczne: ${toolsList.filter(t => t.active).map(t => t.name).join(', ')}`)}
                  className="flex items-center gap-1 px-space-sm py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-label-sm font-label-sm transition-colors border border-white/[0.04]"
                >
                  <span className="material-symbols-outlined text-[14px] text-primary">extension</span>
                  <span>Narzędzia: Aktywne ({activeToolsCount})</span>
                </button>
                
                {/* Attachment pill */}
                <button 
                  onClick={() => alert('Wybierz plik do dołączenia do kontekstu sesji.')}
                  className="flex items-center gap-1 px-space-sm py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-label-sm font-label-sm transition-colors border border-white/[0.04]"
                >
                  <span className="material-symbols-outlined text-[14px] text-outline">attach_file</span>
                  <span>Dołącz plik / Log</span>
                </button>

                {/* Memory Mode */}
                <button 
                  onClick={() => alert('Pamięć trwała: Połączono z Firestore i SQLite.')}
                  className="flex items-center gap-1 px-space-sm py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-label-sm font-label-sm transition-colors border border-white/[0.04]"
                >
                  <span className="material-symbols-outlined text-[14px] text-tertiary">neurology</span>
                  <span>Pamięć trwała: Włączona</span>
                </button>
              </div>

              {/* LPU Speed Floating Indicator */}
              <div className="flex items-center gap-1.5 font-code-mono text-code-mono text-xs text-outline">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                <span>Groq LPU •</span>
                <span className="text-primary font-semibold">420 tokens/sec</span>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default ChatPage;
