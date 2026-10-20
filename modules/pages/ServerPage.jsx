import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Server, Cpu, Activity, RotateCcw, Power, Database, Cloud, 
  Terminal, HardDrive, RefreshCw, Trash2, Download, Search, CheckCircle2,
  AlertTriangle, ShieldCheck, Zap, Disc
} from 'lucide-react';
import axios from 'axios';

const INITIAL_LOGS = [
  { id: 1, time: '14:38:12', level: 'INFO', comp: 'SQLITE_WAL', msg: 'Zainicjalizowano połączenie z bazą danych w trybie WAL. Checkpoint: PASSIVE.' },
  { id: 2, time: '14:38:14', level: 'SUCCESS', comp: 'FIRESTORE', msg: 'Zsynchronizowano kolekcje w chmurze (18 kolekcji gotowych).' },
  { id: 3, time: '14:38:18', level: 'INFO', comp: 'GROQ_ROUTER', msg: 'Kanał inference LPU aktywny (llama-3.3-70b-versatile, 120 t/s).' },
  { id: 4, time: '14:38:22', level: 'SUCCESS', comp: 'PUSHBULLET', msg: 'Nawiązano gniazdo WebSocket z serwerem push (wersja v2.34.0).' },
  { id: 5, time: '14:38:35', level: 'INFO', comp: 'LIBRUS_SYNC', msg: 'Sprawdzono integralność ocen (Średnia ogólna: 4.62, brak anomalii).' },
  { id: 6, time: '14:38:40', level: 'INFO', comp: 'OBSIDIAN_HUB', msg: 'Skaner skarbca Obsidian zindeksował 11 węzłów podmiotów i 128 relacji.' },
  { id: 7, time: '14:38:52', level: 'SUCCESS', comp: 'MEMORY_V8', msg: 'Automatyczna kompaktacja sterty V8 (odzyskano 34.2 MB pamięci).' },
  { id: 8, time: '14:39:05', level: 'WARN', comp: 'CACHE_GUARD', msg: 'TTL bufora pogody wygasł, zainicjowano asynchroniczne odświeżenie.' },
  { id: 9, time: '14:39:10', level: 'SUCCESS', comp: 'SYSTEM_DAEMON', msg: 'OmniDaemon v3.0.0 w stanie gotowości, cykl pętli zdarzeń: 1.1ms.' }
];

const DAEMON_SERVICES = [
  { name: 'OmniCore Backend', pid: 14082, status: 'ONLINE', cpu: '1.4%', mem: '142 MB', type: 'Node.js Express' },
  { name: 'SQLite WAL Engine', pid: 14083, status: 'ONLINE', cpu: '0.2%', mem: '42.8 MB', type: 'better-sqlite3' },
  { name: 'Pushbullet Stream', pid: 14090, status: 'ONLINE', cpu: '0.1%', mem: '18.4 MB', type: 'WSS Client' },
  { name: 'Groq LPU Inference', pid: 14095, status: 'STANDBY', cpu: '0.0%', mem: '12.0 MB', type: 'HTTP/2 REST' },
  { name: 'Obsidian Syncer', pid: 14102, status: 'ONLINE', cpu: '0.4%', mem: '28.1 MB', type: 'FS Watcher' }
];

const ServerPage = () => {
  const { t } = useTranslation();
  const [uptimeSeconds, setUptimeSeconds] = useState(410280);
  const [metrics, setMetrics] = useState({
    cpu: 12,
    memoryUsed: 184,
    memoryTotal: 512,
    rss: 228.4,
    eventLag: 1.2,
    dbSize: 42.8,
    walSize: 2.4,
    syncedCollections: 18
  });
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [logFilter, setLogFilter] = useState('ALL');
  const [logSearch, setLogSearch] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [actionNotice, setActionNotice] = useState('');
  const logContainerRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setUptimeSeconds(prev => prev + 1);
      setMetrics(prev => ({
        ...prev,
        cpu: Math.floor(Math.random() * 8 + 10),
        eventLag: +(Math.random() * 0.4 + 1.0).toFixed(1),
        memoryUsed: Math.floor(180 + Math.random() * 12)
      }));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const formatUptime = (totalSeconds) => {
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  const handleClearCache = () => {
    setActionNotice('[+] Pamięć podręczna modułów została wyczyszczona.');
    setMetrics(prev => ({ ...prev, memoryUsed: 156 }));
    setLogs(prev => [
      ...prev,
      { id: Date.now(), time: new Date().toLocaleTimeString('pl-PL'), level: 'SUCCESS', comp: 'CACHE_GUARD', msg: 'Ręczne zwolnienie buforów pamięci V8 (odzyskano 28 MB).' }
    ]);
    setTimeout(() => setActionNotice(''), 4000);
  };

  const handleRestartNode = () => {
    setActionNotice('[~] Restartowanie podsystemów Node.js...');
    setLogs(prev => [
      ...prev,
      { id: Date.now(), time: new Date().toLocaleTimeString('pl-PL'), level: 'WARN', comp: 'SERVER_CORE', msg: 'Zainicjowano miękki restart potoku procesów roboczych.' },
      { id: Date.now() + 1, time: new Date().toLocaleTimeString('pl-PL'), level: 'SUCCESS', comp: 'SERVER_CORE', msg: 'Podsystemy zrestartowane pomyślnie. Stan: ONLINE.' }
    ]);
    setTimeout(() => {
      setActionNotice('[+] Podsystemy Node.js zrestartowane.');
      setTimeout(() => setActionNotice(''), 3000);
    }, 1200);
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  const handleDownloadLogs = () => {
    const text = logs.map(l => `[${l.time}] [${l.level}] [${l.comp}] ${l.msg}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnidash_server_logs_${Date.now()}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter(l => {
    const matchesLevel = logFilter === 'ALL' || l.level === logFilter;
    const matchesSearch = !logSearch || 
      l.msg.toLowerCase().includes(logSearch.toLowerCase()) ||
      l.comp.toLowerCase().includes(logSearch.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  const memoryPercent = ((metrics.memoryUsed / metrics.memoryTotal) * 100).toFixed(1);

  return (
    <div className="flex flex-col h-full overflow-y-auto p-2 sm:p-4 lg:p-6 pb-20 md:pb-6 space-y-space-lg text-on-surface">
      {/* 1. Page Header & Operational Actions */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md pb-space-sm border-b border-white/[0.08]">
        <div className="flex flex-col space-y-space-xs">
          <nav aria-label="Breadcrumb" className="flex items-center gap-space-xs font-code-mono text-label-sm text-outline">
            <span className="hover:text-primary transition-colors cursor-pointer">OmniDash</span>
            <span className="text-outline-variant">/</span>
            <span className="hover:text-primary transition-colors cursor-pointer">System Management</span>
            <span className="text-outline-variant">/</span>
            <span className="text-primary font-medium">Serwer & Logi</span>
          </nav>
          <div className="flex items-center gap-space-sm flex-wrap">
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-semibold">
              Stan Węzła Serwera, Baza SQLite WAL & Konsola SSE
            </h1>
            <div className="inline-flex items-center gap-1.5 px-space-sm py-0.5 rounded-full bg-surface-container-high border border-white/[0.06]">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span className="font-code-mono text-label-sm text-primary font-medium tracking-wide">NODE_ENV=production</span>
            </div>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
            Bezpośredni podgląd węzła telemetrycznego, operacji zapisu i-node SQLite w architekturze WAL oraz asynchronicznego potoku zdarzeń EventStream.
          </p>
        </div>

        {/* Quick Action Controls */}
        <div className="flex items-center gap-space-sm shrink-0">
          <button 
            onClick={handleClearCache}
            type="button"
            className="h-9 px-space-md rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-label-md text-label-md flex items-center gap-space-xs shadow-sm active:scale-95 duration-150 border border-white/[0.06]"
          >
            <Disc className="w-4 h-4 text-tertiary" />
            <span>Wyczyść Cache Pamięci</span>
          </button>
          <button 
            onClick={handleRestartNode}
            type="button"
            className="h-9 px-space-md rounded-lg bg-primary-container text-on-primary-container hover:bg-primary transition-all font-label-md text-label-md font-semibold flex items-center gap-space-xs shadow-md active:scale-95 duration-150"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart Procesu Node.js</span>
          </button>
        </div>
      </header>

      {actionNotice && (
        <div className="p-space-sm px-space-md rounded-xl bg-primary/10 border border-primary/30 text-primary font-code-mono text-xs animate-soft-enter">
          {actionNotice}
        </div>
      )}

      {/* 2. Górny Deck Telemetryczny (Metric Cards Grid) */}
      <section aria-label="Telemetria Systemowa" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md">
        {/* Card 1: Health Monitor */}
        <div className="rounded-xl bg-surface-container p-space-md flex flex-col justify-between relative overflow-hidden shadow-sm hover:bg-surface-container-high transition-colors group border border-white/[0.08]">
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-primary/5 blur-2xl pointer-events-none group-hover:bg-primary/10 transition-all"></div>
          <div>
            <div className="flex items-center justify-between mb-space-sm">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Health Monitor</span>
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div className="flex items-baseline gap-space-xs">
              <span className="font-headline-xl text-headline-xl font-bold text-on-surface">{formatUptime(uptimeSeconds).split(' ')[0]} {formatUptime(uptimeSeconds).split(' ')[1]}</span>
              <span className="font-code-mono text-label-sm text-outline">UPTIME</span>
            </div>
          </div>
          <div className="mt-space-md pt-space-xs space-y-space-xs font-code-mono text-code-mono text-on-surface-variant">
            <div className="flex justify-between items-center text-label-sm">
              <span className="text-outline">Event Loop Lag</span>
              <span className="text-on-surface font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> {metrics.eventLag} ms
              </span>
            </div>
            <div className="flex justify-between items-center text-label-sm">
              <span className="text-outline">Zużycie CPU (Sys/Usr)</span>
              <span className="text-on-surface font-semibold">{metrics.cpu}%</span>
            </div>
          </div>
        </div>

        {/* Card 2: V8 Heap Memory */}
        <div className="rounded-xl bg-surface-container p-space-md flex flex-col justify-between relative overflow-hidden shadow-sm hover:bg-surface-container-high transition-colors group border border-white/[0.08]">
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-secondary/5 blur-2xl pointer-events-none group-hover:bg-secondary/10 transition-all"></div>
          <div>
            <div className="flex items-center justify-between mb-space-sm">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Pamięć Sterty V8</span>
              <Cpu className="w-5 h-5 text-secondary" />
            </div>
            <div className="flex items-baseline gap-space-xs">
              <span className="font-headline-xl text-headline-xl font-bold text-on-surface">{metrics.memoryUsed}</span>
              <span className="font-body-md text-body-md text-outline">/ {metrics.memoryTotal} MB</span>
            </div>
          </div>
          <div className="mt-space-md pt-space-xs space-y-space-xs">
            <div className="w-full bg-surface-container-lowest h-2 rounded-full overflow-hidden border border-white/[0.04]">
              <div className="h-full bg-gradient-to-r from-primary-container to-secondary rounded-full transition-all duration-500" style={{ width: `${memoryPercent}%` }}></div>
            </div>
            <div className="flex justify-between font-code-mono text-label-sm text-on-surface-variant pt-0.5">
              <span>RSS: {metrics.rss} MB</span>
              <span className="text-secondary font-medium">{memoryPercent}% Użycia</span>
            </div>
          </div>
        </div>

        {/* Card 3: SQLite WAL Storage */}
        <div className="rounded-xl bg-surface-container p-space-md flex flex-col justify-between relative overflow-hidden shadow-sm hover:bg-surface-container-high transition-colors group border border-white/[0.08]">
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-tertiary/5 blur-2xl pointer-events-none group-hover:bg-tertiary/10 transition-all"></div>
          <div>
            <div className="flex items-center justify-between mb-space-sm">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">SQLite WAL Storage</span>
              <Database className="w-5 h-5 text-tertiary" />
            </div>
            <div className="flex items-baseline gap-space-xs">
              <span className="font-headline-xl text-headline-xl font-bold text-on-surface">{metrics.dbSize}</span>
              <span className="font-code-mono text-label-sm text-outline">MB (DB)</span>
            </div>
          </div>
          <div className="mt-space-md pt-space-xs space-y-space-xs font-code-mono text-code-mono text-on-surface-variant">
            <div className="flex justify-between items-center text-label-sm">
              <span className="text-outline">Plik Dziennika WAL</span>
              <span className="text-on-surface font-medium">{metrics.walSize} MB</span>
            </div>
            <div className="flex justify-between items-center text-label-sm">
              <span className="text-outline">Tryb Checkpoint</span>
              <span className="text-tertiary font-semibold">PASSIVE (Auto)</span>
            </div>
          </div>
        </div>

        {/* Card 4: Cloud Firestore Sync */}
        <div className="rounded-xl bg-surface-container p-space-md flex flex-col justify-between relative overflow-hidden shadow-sm hover:bg-surface-container-high transition-colors group border border-white/[0.08]">
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-primary/5 blur-2xl pointer-events-none group-hover:bg-primary/10 transition-all"></div>
          <div>
            <div className="flex items-center justify-between mb-space-sm">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Cloud Firestore Sync</span>
              <Cloud className="w-5 h-5 text-primary" />
            </div>
            <div className="flex items-baseline gap-space-xs">
              <span className="font-headline-xl text-headline-xl font-bold text-on-surface">{metrics.syncedCollections}</span>
              <span className="font-code-mono text-label-sm text-outline">Kolekcji</span>
            </div>
          </div>
          <div className="mt-space-md pt-space-xs space-y-space-xs font-code-mono text-code-mono text-on-surface-variant">
            <div className="flex justify-between items-center text-label-sm">
              <span className="text-outline">Status Synchronizacji</span>
              <span className="text-primary font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Połączono
              </span>
            </div>
            <div className="flex justify-between items-center text-label-sm">
              <span className="text-outline">Region Firestore</span>
              <span className="text-on-surface font-semibold">europe-central2</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Tabela Procesów i Podsystemów */}
      <section className="rounded-2xl bg-surface-container p-space-md border border-white/[0.08] shadow-sm">
        <div className="flex items-center justify-between mb-space-md pb-space-sm border-b border-white/[0.08]">
          <div className="flex items-center gap-space-sm">
            <Server className="w-5 h-5 text-primary" />
            <h2 className="font-headline-md text-headline-md text-on-surface font-medium">Aktywne Węzły Demonów &amp; Usług</h2>
          </div>
          <span className="font-code-mono text-label-sm text-outline">5 aktywnych procesów PID</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-code-mono text-xs">
            <thead>
              <tr className="text-outline border-b border-white/[0.06] pb-2">
                <th className="pb-2 font-normal">NAZWA USŁUGI</th>
                <th className="pb-2 font-normal">PID</th>
                <th className="pb-2 font-normal">SILNIK</th>
                <th className="pb-2 font-normal">STATUS</th>
                <th className="pb-2 font-normal">CPU</th>
                <th className="pb-2 font-normal text-right">RAM (RSS)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {DAEMON_SERVICES.map(srv => (
                <tr key={srv.name} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-2.5 font-semibold text-on-surface flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    {srv.name}
                  </td>
                  <td className="py-2.5 text-outline">{srv.pid}</td>
                  <td className="py-2.5 text-on-surface-variant">{srv.type}</td>
                  <td className="py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${srv.status === 'ONLINE' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-surface-container-highest text-outline'}`}>
                      {srv.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-on-surface">{srv.cpu}</td>
                  <td className="py-2.5 text-right font-medium text-secondary">{srv.mem}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Konsola Zdarzeń SSE & Terminal Logów */}
      <section className="rounded-2xl bg-surface-container p-space-md border border-white/[0.08] shadow-sm flex flex-col space-y-space-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-sm border-b border-white/[0.08]">
          <div className="flex items-center gap-space-sm">
            <Terminal className="w-5 h-5 text-primary" />
            <span className="font-code-mono text-sm font-semibold text-on-surface uppercase tracking-wide">
              Strumień Zdarzeń SSE (Server-Sent Events)
            </span>
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          </div>

          {/* Log Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center p-0.5 rounded-lg bg-surface-container-lowest border border-white/[0.08]">
              {['ALL', 'INFO', 'SUCCESS', 'WARN'].map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setLogFilter(lvl)}
                  className={`px-2.5 py-1 rounded font-code-mono text-[11px] transition-all ${
                    logFilter === lvl 
                      ? 'bg-surface-container-high text-primary font-bold shadow-sm' 
                      : 'text-outline hover:text-on-surface'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-outline" />
              <input
                type="text"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Filtruj logi..."
                className="w-36 sm:w-48 pl-8 pr-3 py-1 rounded-lg bg-surface-container-lowest border border-white/[0.08] text-xs font-code-mono text-on-surface placeholder:text-outline focus:outline-none focus:border-primary"
              />
            </div>

            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`p-1.5 rounded-lg border font-code-mono text-xs transition-colors ${
                autoScroll ? 'bg-primary/20 border-primary text-primary' : 'bg-surface-container-lowest border-white/[0.08] text-outline'
              }`}
              title="Przełącz automatyczne przewijanie"
            >
              Auto-Scroll
            </button>

            <button
              onClick={handleClearLogs}
              className="p-1.5 rounded-lg bg-surface-container-lowest border border-white/[0.08] text-outline hover:text-on-surface hover:border-white/[0.2] transition-colors"
              title="Wyczyść konsolę"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleDownloadLogs}
              className="p-1.5 rounded-lg bg-surface-container-lowest border border-white/[0.08] text-outline hover:text-on-surface hover:border-white/[0.2] transition-colors"
              title="Pobierz plik logów"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Terminal Window */}
        <div 
          ref={logContainerRef}
          className="h-72 overflow-y-auto custom-scrollbar p-3 rounded-xl bg-surface-container-lowest border border-white/[0.08] font-code-mono text-xs space-y-1.5"
        >
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-outline">
              [*] Brak zdarzeń w strumieniu logów dla wybranych kryteriów.
            </div>
          ) : (
            filteredLogs.map(log => (
              <div key={log.id} className="flex items-start gap-2 hover:bg-white/[0.02] p-1 rounded transition-colors leading-relaxed">
                <span className="text-outline shrink-0 font-medium">{log.time}</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 ${
                  log.level === 'SUCCESS' ? 'bg-primary/20 text-primary border border-primary/30' :
                  log.level === 'WARN' ? 'bg-tertiary/20 text-tertiary border border-tertiary/30' :
                  'bg-secondary/20 text-secondary border border-secondary/30'
                }`}>
                  [{log.level}]
                </span>
                <span className="text-primary-container shrink-0">[{log.comp}]</span>
                <span className="text-on-surface-variant break-all">{log.msg}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default ServerPage;
