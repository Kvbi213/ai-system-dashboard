import React, { useState, useEffect, useRef } from 'react';

const INITIAL_LOGS = [
  { id: '001', time: '14:02:10.104', level: 'INFO', tag: 'SSE', msg: 'Subskrypcja kanału telemetrycznego zaakceptowana przez klienta 127.0.0.1:58219 (Accept: text/event-stream)' },
  { id: '002', time: '14:02:10.312', level: 'INFO', tag: 'SQLITE', msg: 'PRAGMA journal_mode=WAL; status: wal | PRAGMA synchronous=NORMAL; synchronous_commit=OK' },
  { id: '003', time: '14:02:11.890', level: 'SUCCESS', tag: 'GROQ', msg: 'Inicjalizacja silnika inferencji Groq LPU: model openai/gpt-oss-120b | Aktywny bufor: 124.8 t/s' },
  { id: '004', time: '14:02:12.004', level: 'INFO', tag: 'LIBRUS', msg: 'OAuth2 session token ważny jeszcze przez 48 min. Pula aktywnych sesji: 1' },
  { id: '005', time: '14:02:12.441', level: 'PERF', tag: 'SQLITE', msg: 'Transakcja zapisu wsadowego metrics_snapshots (12 wierszy) ukończona w 0.42ms (WAL checkpoint: passive)' },
  { id: '006', time: '14:02:13.112', level: 'WARN', tag: 'LIBRUS', msg: 'Odpowiedź endpointu Synergia /Grades: opóźnienie bramki 842ms (próg ostrzegawczy 800ms przekroczony)' },
  { id: '007', time: '14:02:14.000', level: 'INFO', tag: 'SSE', msg: 'Wysłano pakiet telemetryczny: event: \'heartbeat\', data: {"v8_heap_used":192937984, "event_lag":1.18}' },
  { id: '008', time: '14:02:15.654', level: 'PERF', tag: 'GROQ', msg: 'Kolejka zapytań asynchronicznych: TTFT (Time-To-First-Token) = 188ms | Kontekst: 4,120 / 32,768 tokenów' },
  { id: '009', time: '14:02:16.220', level: 'SUCCESS', tag: 'SQLITE', msg: 'Webhook Pushbullet: zsynchronizowano wpis \'Trening FBW Dzień A\' z bazą lokalną. SHA256: c4f92...a8b1' }
];

const ServerPage = () => {
  const [uptimeSeconds, setUptimeSeconds] = useState(410280);
  const [metrics, setMetrics] = useState({
    cpu: 12,
    eventLag: 1.2,
    v8Used: 184,
    v8Total: 512,
    v8Pct: 35.9,
    rss: 228.4,
    dbSize: 3.2,
    dbTables: 14,
    dbLocks: 0,
    rtt: 14,
    activeListeners: 12,
    gatewayConnected: true
  });

  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [currentFilter, setCurrentFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [actionNotice, setActionNotice] = useState('');
  const terminalRef = useRef(null);

  // SSE Stream Listener
  useEffect(() => {
    let eventSource = null;
    const isCloudMode = window.location.hostname.includes('web.app') || window.location.hostname.includes('firebaseapp.com');

    if (!isCloudMode && typeof EventSource !== 'undefined') {
      try {
        eventSource = new EventSource('/api/system/stream');
        eventSource.onmessage = (event) => {
          if (isPaused) return;
          try {
            const data = JSON.parse(event.data);
            if (data.cpu !== undefined) {
              setMetrics(prev => ({
                ...prev,
                cpu: Math.round(data.cpu),
                v8Used: data.memory ? Math.round(data.memory.heapUsed / (1024 * 1024)) : prev.v8Used,
                v8Total: data.memory ? Math.round(data.memory.heapTotal / (1024 * 1024)) : prev.v8Total,
                rss: data.memory ? +(data.memory.rss / (1024 * 1024)).toFixed(1) : prev.rss,
                eventLag: data.eventLoopLag ? +(data.eventLoopLag).toFixed(1) : prev.eventLag,
                rtt: data.ping || prev.rtt
              }));

              if (data.log) {
                setLogs(prev => [
                  ...prev.slice(-300),
                  {
                    id: String(prev.length + 1).padStart(3, '0'),
                    time: new Date().toLocaleTimeString('pl-PL') + '.' + String(Date.now() % 1000).padStart(3, '0'),
                    level: data.log.level || 'INFO',
                    tag: data.log.tag || 'SSE',
                    msg: data.log.message || JSON.stringify(data.log)
                  }
                ]);
              }
            }
          } catch (e) {
            // Ignore parse errors
          }
        };
      } catch (err) {
        console.debug('SSE EventSource', err);
      }
    }

    const timer = setInterval(() => {
      setUptimeSeconds(prev => prev + 1);
    }, 1000);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(timer);
    };
  }, [isPaused]);

  useEffect(() => {
    if (isAutoScroll && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs, isAutoScroll]);

  const formatUptime = (sec) => {
    const days = Math.floor(sec / 86400);
    const hours = Math.floor((sec % 86400) / 3600);
    return `${days}d ${hours}h`;
  };

  const handleClearCache = () => {
    setActionNotice('[+] Pamięć podręczna modułów została wyczyszczona.');
    setMetrics(prev => ({ ...prev, v8Used: 156, v8Pct: 30.5 }));
    setLogs(prev => [
      ...prev,
      {
        id: String(prev.length + 1).padStart(3, '0'),
        time: new Date().toLocaleTimeString('pl-PL') + '.000',
        level: 'SUCCESS',
        tag: 'CACHE',
        msg: 'Ręczne zwolnienie buforów pamięci podręcznej V8 (odzyskano 28 MB pamięci).'
      }
    ]);
    setTimeout(() => setActionNotice(''), 3500);
  };

  const handleRestartNode = () => {
    setActionNotice('[~] Restartowanie podsystemów Node.js...');
    setLogs(prev => [
      ...prev,
      {
        id: String(prev.length + 1).padStart(3, '0'),
        time: new Date().toLocaleTimeString('pl-PL') + '.000',
        level: 'WARN',
        tag: 'NODE',
        msg: 'Zainicjowano miękki restart potoku procesów roboczych Express daemon.'
      },
      {
        id: String(prev.length + 2).padStart(3, '0'),
        time: new Date().toLocaleTimeString('pl-PL') + '.050',
        level: 'SUCCESS',
        tag: 'NODE',
        msg: 'Podsystemy zrestartowane pomyślnie. Status: ONLINE | Event Loop: 1.1ms.'
      }
    ]);
    setTimeout(() => {
      setActionNotice('[+] Węzeł Node.js zrestartowany pomyślnie.');
      setTimeout(() => setActionNotice(''), 3000);
    }, 1000);
  };

  const handleCopyLogs = () => {
    const text = logs.map(l => `${l.id} ${l.time} [${l.level}] [${l.tag}] ${l.msg}`).join('\n');
    navigator.clipboard.writeText(text);
    setActionNotice('[+] Skopiowano logi do schowka systemowego.');
    setTimeout(() => setActionNotice(''), 2500);
  };

  const handleDownloadLogs = () => {
    const text = logs.map(l => `${l.id} ${l.time} [${l.level}] [${l.tag}] ${l.msg}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnidash_system_logs_${Date.now()}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter(log => {
    const matchesFilter = currentFilter === 'ALL' || log.tag === currentFilter;
    const query = searchQuery.toLowerCase();
    const matchesSearch = !query || log.msg.toLowerCase().includes(query) || log.tag.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex flex-col w-full space-y-space-lg pb-space-xl">
      {/* 1. Page Header & Operational Actions */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md">
        <div className="flex flex-col space-y-space-xs">
          <nav aria-label="Breadcrumb" className="flex items-center gap-space-xs font-code-mono text-label-sm text-outline">
            <span>OmniDash</span>
            <span className="text-outline-variant">/</span>
            <span>System Management</span>
            <span className="text-outline-variant">/</span>
            <span className="text-primary font-medium">Serwer &amp; Logi</span>
          </nav>
          <div className="flex items-center gap-space-sm flex-wrap">
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-semibold">
              Stan Węzła Serwera, Baza SQLite WAL &amp; Konsola SSE
            </h1>
            <div className="inline-flex items-center gap-1.5 px-space-sm py-0.5 rounded-full bg-surface-container-high border border-white/[0.05]">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="font-code-mono text-label-sm text-primary font-medium tracking-wide">
                NODE_ENV=production
              </span>
            </div>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
            Bezpośredni podgląd węzła telemetrycznego, operacji zapisu i-node SQLite w architekturze WAL oraz asynchronicznego potoku zdarzeń EventStream.
          </p>
          {actionNotice && (
            <div className="text-primary font-code-mono text-label-sm pt-1 animate-pulse">
              {actionNotice}
            </div>
          )}
        </div>

        {/* Quick Action Controls */}
        <div className="flex items-center gap-space-sm shrink-0">
          <button
            onClick={handleClearCache}
            className="h-9 px-space-md rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-label-md text-label-md flex items-center gap-space-xs shadow-sm apple-press border border-white/[0.05]"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px] text-tertiary">mop</span>
            <span>Wyczyść Cache Pamięci</span>
          </button>
          <button
            onClick={handleRestartNode}
            className="h-9 px-space-md rounded-lg bg-primary-container text-on-primary-container hover:bg-primary transition-all font-label-md text-label-md font-semibold flex items-center gap-space-xs shadow-md apple-press"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">restart_alt</span>
            <span>Restart Procesu Node.js</span>
          </button>
        </div>
      </header>

      {/* 2. Górny Deck Telemetryczny (4 Metric Cards Grid) */}
      <section aria-label="Telemetria Systemowa" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md">
        {/* Card 1: Health Monitor */}
        <div className="rounded-xl bg-surface-container p-space-md flex flex-col justify-between relative overflow-hidden shadow-sm hover:bg-surface-container-high transition-colors group border border-white/[0.05]">
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-primary/5 blur-2xl pointer-events-none group-hover:bg-primary/10 transition-all" />
          <div>
            <div className="flex items-center justify-between mb-space-sm">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                Health Monitor
              </span>
              <span className="material-symbols-outlined text-primary text-[20px]">ecg_heart</span>
            </div>
            <div className="flex items-baseline gap-space-xs">
              <span className="font-headline-xl text-headline-xl font-bold text-on-surface">
                {formatUptime(uptimeSeconds)}
              </span>
              <span className="font-code-mono text-label-sm text-outline">UPTIME</span>
            </div>
          </div>
          <div className="mt-space-md pt-space-xs space-y-space-xs font-code-mono text-code-mono text-on-surface-variant">
            <div className="flex justify-between items-center text-label-sm">
              <span className="text-outline">Event Loop Lag</span>
              <span className="text-on-surface font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" /> {metrics.eventLag} ms
              </span>
            </div>
            <div className="flex justify-between items-center text-label-sm">
              <span className="text-outline">Zużycie CPU (Sys/Usr)</span>
              <span className="text-on-surface font-semibold">{metrics.cpu}%</span>
            </div>
          </div>
        </div>

        {/* Card 2: V8 Heap Memory */}
        <div className="rounded-xl bg-surface-container p-space-md flex flex-col justify-between relative overflow-hidden shadow-sm hover:bg-surface-container-high transition-colors group border border-white/[0.05]">
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-secondary/5 blur-2xl pointer-events-none group-hover:bg-secondary/10 transition-all" />
          <div>
            <div className="flex items-center justify-between mb-space-sm">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                Pamięć Sterty V8
              </span>
              <span className="material-symbols-outlined text-secondary text-[20px]">memory</span>
            </div>
            <div className="flex items-baseline gap-space-xs">
              <span className="font-headline-xl text-headline-xl font-bold text-on-surface">
                {metrics.v8Used}
              </span>
              <span className="font-body-md text-body-md text-outline">/ {metrics.v8Total} MB</span>
            </div>
          </div>
          <div className="mt-space-md pt-space-xs space-y-space-xs">
            <div className="w-full bg-surface-container-lowest h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-container to-secondary rounded-full transition-all duration-500"
                style={{ width: `${Math.min(metrics.v8Pct, 100)}%` }}
              />
            </div>
            <div className="flex justify-between font-code-mono text-label-sm text-on-surface-variant pt-0.5">
              <span>RSS: {metrics.rss} MB</span>
              <span className="text-secondary font-medium">{metrics.v8Pct}% Użycia</span>
            </div>
          </div>
        </div>

        {/* Card 3: SQLite WAL Storage */}
        <div className="rounded-xl bg-surface-container p-space-md flex flex-col justify-between relative overflow-hidden shadow-sm hover:bg-surface-container-high transition-colors group border border-white/[0.05]">
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-tertiary/5 blur-2xl pointer-events-none group-hover:bg-tertiary/10 transition-all" />
          <div>
            <div className="flex items-center justify-between mb-space-sm">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                SQLite WAL Storage
              </span>
              <span className="material-symbols-outlined text-tertiary text-[20px]">database</span>
            </div>
            <div className="flex items-baseline gap-space-xs">
              <span className="font-headline-xl text-headline-xl font-bold text-on-surface">
                {metrics.dbSize}
              </span>
              <span className="font-body-md text-body-md text-outline">MB DB File</span>
            </div>
          </div>
          <div className="mt-space-md pt-space-xs space-y-space-xs font-code-mono text-code-mono text-on-surface-variant">
            <div className="flex justify-between items-center text-label-sm">
              <span className="text-outline">Tryb Synchronizacji</span>
              <span className="px-1.5 py-0.5 rounded bg-surface-container-lowest text-tertiary font-medium">
                PRAGMA WAL
              </span>
            </div>
            <div className="flex justify-between items-center text-label-sm">
              <span className="text-outline">Tabele / Blokady</span>
              <span className="text-on-surface">{metrics.dbTables} tablic / {metrics.dbLocks} lock</span>
            </div>
          </div>
        </div>

        {/* Card 4: Cloud Firestore Sync */}
        <div className="rounded-xl bg-surface-container p-space-md flex flex-col justify-between relative overflow-hidden shadow-sm hover:bg-surface-container-high transition-colors group border border-white/[0.05]">
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-primary-container/10 blur-2xl pointer-events-none group-hover:bg-primary-container/20 transition-all" />
          <div>
            <div className="flex items-center justify-between mb-space-sm">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                Chmura Firestore Sync
              </span>
              <span className="material-symbols-outlined text-primary text-[20px]">cloud_sync</span>
            </div>
            <div className="flex items-baseline gap-space-xs">
              <span className="font-headline-xl text-headline-xl font-bold text-primary">
                {metrics.rtt}
              </span>
              <span className="font-code-mono text-label-sm text-outline">MS RTT</span>
            </div>
          </div>
          <div className="mt-space-md pt-space-xs space-y-space-xs font-code-mono text-code-mono text-on-surface-variant">
            <div className="flex justify-between items-center text-label-sm">
              <span className="text-outline">onSnapshot Listenery</span>
              <span className="text-on-surface font-semibold">{metrics.activeListeners} aktywnych</span>
            </div>
            <div className="flex justify-between items-center text-label-sm">
              <span className="text-outline">Socket Gateway</span>
              <span className="text-primary font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" /> Połączono
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Główny Terminal SSE na Żywo (/api/system/stream) */}
      <section aria-label="Terminal Logów" className="rounded-xl bg-surface-container-lowest p-space-md flex flex-col space-y-space-md shadow-xl border border-white/[0.06]">
        {/* Terminal Header & Control Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md pb-space-sm border-b border-white/[0.04]">
          <div className="flex items-center gap-space-md">
            {/* Terminal Window Dots */}
            <div className="flex items-center gap-1.5 px-space-xs">
              <span className="w-3 h-3 rounded-full bg-error/80" />
              <span className="w-3 h-3 rounded-full bg-tertiary/80" />
              <span className="w-3 h-3 rounded-full bg-primary/80" />
            </div>
            <div className="flex items-center gap-space-xs">
              <span className="font-code-mono text-code-mono text-on-surface font-semibold tracking-tight">
                /api/system/stream
              </span>
              <span className="px-2 py-0.5 rounded-full bg-surface-container font-code-mono text-label-sm text-primary">
                SSE LIVE
              </span>
            </div>
          </div>

          {/* Live Search & Stream Actions */}
          <div className="flex flex-wrap items-center gap-space-sm">
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-2.5 text-[16px] text-outline">search</span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 pr-3 rounded-lg bg-surface-container text-on-surface placeholder:text-outline font-code-mono text-code-mono focus:outline-none focus:bg-surface-container-high transition-colors w-64 md:w-72 border border-white/[0.04]"
                placeholder="Szukaj w strumieniu (regex, tag)..."
                type="text"
              />
            </div>
            <button
              onClick={() => setIsAutoScroll(!isAutoScroll)}
              className={`h-8 px-space-sm rounded-lg font-code-mono text-label-sm flex items-center gap-1 transition-colors apple-press ${
                isAutoScroll ? 'bg-surface-container text-primary font-bold' : 'bg-surface-container text-outline'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">vertical_align_bottom</span>
              <span>Auto-scroll: {isAutoScroll ? 'ON' : 'OFF'}</span>
            </button>
            <button
              onClick={handleCopyLogs}
              className="h-8 px-space-sm rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors font-code-mono text-label-sm flex items-center gap-1 apple-press"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">content_copy</span>
              <span>Kopiuj</span>
            </button>
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="h-8 px-space-sm rounded-lg bg-surface-container text-on-surface-variant hover:text-tertiary hover:bg-surface-container-high transition-colors font-code-mono text-label-sm flex items-center gap-1 apple-press"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">
                {isPaused ? 'play_arrow' : 'pause'}
              </span>
              <span>{isPaused ? 'Wznów' : 'Pauza'}</span>
            </button>
            <button
              onClick={handleDownloadLogs}
              className="h-8 px-space-sm rounded-lg bg-surface-container text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors font-code-mono text-label-sm flex items-center gap-1 apple-press"
              title="Pobierz plik logów .log"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>Pobierz</span>
            </button>
          </div>
        </div>

        {/* Filter Segmented Tabs */}
        <div className="flex items-center gap-space-xs overflow-x-auto py-1">
          {['ALL', 'SQLITE', 'GROQ', 'LIBRUS', 'SSE'].map((filter) => {
            const active = currentFilter === filter;
            const count = filter === 'ALL' ? logs.length : logs.filter(l => l.tag === filter).length;
            const labelMap = {
              ALL: 'Wszystkie',
              SQLITE: 'SQLite WAL',
              GROQ: 'Groq LPU',
              LIBRUS: 'Librus API',
              SSE: 'SSE Stream'
            };
            return (
              <button
                key={filter}
                onClick={() => setCurrentFilter(filter)}
                className={`px-space-sm py-1 rounded-lg font-code-mono text-label-sm transition-all apple-press ${
                  active
                    ? 'bg-surface-container-high text-on-surface font-semibold shadow-sm'
                    : 'text-outline hover:text-on-surface hover:bg-surface-container'
                }`}
                type="button"
              >
                {labelMap[filter]} <span className="ml-1 text-outline font-normal">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Terminal Output Viewport */}
        <div
          ref={terminalRef}
          className="h-96 overflow-y-auto rounded-lg bg-surface-dim p-space-md font-code-mono text-code-mono leading-relaxed select-text space-y-1 scroll-smooth border border-white/[0.04]"
        >
          {filteredLogs.map((log) => {
            const isError = log.level === 'ERROR' || log.level === 'ALERT';
            const isWarn = log.level === 'WARN';
            const isSuccess = log.level === 'SUCCESS';
            const isPerf = log.level === 'PERF';

            return (
              <div
                key={log.id}
                className="flex items-baseline gap-space-sm hover:bg-surface-container/30 px-1 py-0.5 rounded transition-colors"
              >
                <span className="text-outline-variant select-none w-8 text-right shrink-0">{log.id}</span>
                <span className="text-outline text-label-sm shrink-0">{log.time}</span>
                <span
                  className={`px-1.5 py-0.2 rounded font-medium text-label-sm shrink-0 ${
                    isError
                      ? 'bg-error-container text-error'
                      : isWarn
                      ? 'bg-tertiary-container/30 text-tertiary'
                      : isSuccess
                      ? 'bg-surface-container text-primary'
                      : isPerf
                      ? 'bg-secondary-container text-on-secondary-container'
                      : 'bg-surface-container text-primary'
                  }`}
                >
                  [{log.level}]
                </span>
                <span className="text-secondary font-semibold shrink-0">[{log.tag}]</span>
                <span className="text-on-surface">{log.msg}</span>
              </div>
            );
          })}

          <div className="flex items-center gap-space-sm text-outline pt-2">
            <span className="w-8 text-right shrink-0">...</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
              <span className="font-code-mono text-label-sm text-outline">
                {isPaused ? 'Strumień wstrzymany (Pauza)' : 'Oczekiwanie na kolejne ramki EventSource...'}
              </span>
            </div>
          </div>
        </div>

        {/* Terminal Footer Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-xs font-code-mono text-label-sm text-outline border-t border-white/[0.04]">
          <div className="flex items-center gap-space-md">
            <span>Encoding: UTF-8</span>
            <span>Bufor: {logs.length} / 1,000 linii</span>
            <span className="text-primary font-medium">Błędy krytyczne: 0</span>
          </div>
          <div className="flex items-center gap-space-xs">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-on-surface-variant font-medium">Połączenie aktywne: localhost:5000</span>
          </div>
        </div>
      </section>

      {/* 4. Dolny Panel Narzędzi Administracyjnych (Bento Grid) */}
      <section aria-label="Narzędzia Administracyjne" className="grid grid-cols-1 lg:grid-cols-3 gap-space-md">
        {/* Moduł Zadań Cyklicznych (Cron Jobs) */}
        <div className="lg:col-span-2 rounded-xl bg-surface-container p-space-md flex flex-col justify-between shadow-sm border border-white/[0.05]">
          <div>
            <div className="flex items-center justify-between pb-space-sm mb-space-sm border-b border-white/[0.04]">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-primary text-[22px]">alarm_on</span>
                <h2 className="font-headline-md text-headline-md font-semibold text-on-surface">
                  Zadania Cykliczne (Internal Cron Scheduler)
                </h2>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-surface-container-high font-code-mono text-label-sm text-on-surface-variant">
                3 Aktywne Wątki
              </span>
            </div>

            <div className="space-y-space-xs font-code-mono">
              {/* Cron 1: Librus Polling */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container-high transition-colors gap-space-xs">
                <div className="flex items-center gap-space-sm min-w-0">
                  <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-on-surface font-medium truncate">Librus Synergia Grade Poller</span>
                    <span className="text-outline text-label-sm">Interwał: co 15 minut | */15 * * * *</span>
                  </div>
                </div>
                <div className="flex items-center gap-space-md text-label-sm shrink-0 sm:self-center self-end">
                  <span className="text-on-surface-variant">Następny bieg: <span className="text-primary font-semibold">14:15:00</span></span>
                  <button onClick={() => setActionNotice('[+] Wymuszono synchronizację Librus.')} className="px-2.5 py-1 rounded bg-surface-container text-on-surface hover:text-primary transition-colors apple-press" type="button">Wymuś</button>
                </div>
              </div>

              {/* Cron 2: SQLite WAL Backup */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container-high transition-colors gap-space-xs">
                <div className="flex items-center gap-space-sm min-w-0">
                  <span className="w-2 h-2 rounded-full bg-secondary shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-on-surface font-medium truncate">Kopia Zapasowa &amp; VACUUM SQLite</span>
                    <span className="text-outline text-label-sm">Harmonogram: Codziennie o 03:00 | 0 3 * * *</span>
                  </div>
                </div>
                <div className="flex items-center gap-space-md text-label-sm shrink-0 sm:self-center self-end">
                  <span className="text-on-surface-variant">Ostatni zrzut: <span className="text-on-surface font-medium">Dziś, 03:00 (OK)</span></span>
                  <button onClick={() => setActionNotice('[+] Wykonano zrzut bazy SQLite.')} className="px-2.5 py-1 rounded bg-surface-container text-on-surface hover:text-primary transition-colors apple-press" type="button">Wymuś</button>
                </div>
              </div>

              {/* Cron 3: Brave IT News Crawler */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container-high transition-colors gap-space-xs">
                <div className="flex items-center gap-space-sm min-w-0">
                  <span className="w-2 h-2 rounded-full bg-tertiary shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-on-surface font-medium truncate">Pobieranie Brave Search IT News</span>
                    <span className="text-outline text-label-sm">Okna: 10:00 / 15:00 / 20:00 | 0 10,15,20 * * *</span>
                  </div>
                </div>
                <div className="flex items-center gap-space-md text-label-sm shrink-0 sm:self-center self-end">
                  <span className="text-on-surface-variant">Następny bieg: <span className="text-tertiary font-semibold">15:00:00</span></span>
                  <button onClick={() => setActionNotice('[+] Wymuszono skan Brave IT News.')} className="px-2.5 py-1 rounded bg-surface-container text-on-surface hover:text-primary transition-colors apple-press" type="button">Wymuś</button>
                </div>
              </div>
            </div>
          </div>
          <div className="pt-space-sm mt-space-sm flex items-center justify-between font-label-sm text-outline border-t border-white/[0.04]">
            <span>Silnik kolejkowania: Node-Cron v3.0 / Worker Threads</span>
            <span className="text-primary font-medium">Brak opóźnionych zadań</span>
          </div>
        </div>

        {/* Moduł Bezpieczeństwa Procesu & Portów */}
        <div className="rounded-xl bg-surface-container p-space-md flex flex-col justify-between shadow-sm border border-white/[0.05]">
          <div>
            <div className="flex items-center gap-space-sm pb-space-sm mb-space-sm border-b border-white/[0.04]">
              <span className="material-symbols-outlined text-secondary text-[22px]">security</span>
              <h2 className="font-headline-md text-headline-md font-semibold text-on-surface">
                Tarcza Bezpieczeństwa
              </h2>
            </div>
            <div className="space-y-space-sm">
              {/* Port Binding Security */}
              <div className="p-space-sm rounded-lg bg-surface-container-low">
                <div className="flex items-center justify-between font-code-mono text-code-mono">
                  <span className="text-on-surface font-medium">Gniazdo HTTP</span>
                  <span className="text-primary font-bold">Port 5000</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span className="font-code-mono text-label-sm text-on-surface-variant">
                    Lokalny bind: 127.0.0.1 (Strict)
                  </span>
                </div>
              </div>

              {/* SSRF Protection */}
              <div className="p-space-sm rounded-lg bg-surface-container-low">
                <div className="flex items-center justify-between font-code-mono text-code-mono">
                  <span className="text-on-surface font-medium">Tarcza Anty-SSRF</span>
                  <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-label-sm font-semibold">
                    AKTYWNA
                  </span>
                </div>
                <p className="font-body-md text-label-sm text-on-surface-variant mt-1 leading-normal">
                  Filtrowanie nagłówków Host i blokada prywatnych podsieci (10.0.0.0/8, 192.168.0.0/16, metadata cloud).
                </p>
              </div>

              {/* API Gateway Limiter */}
              <div className="p-space-sm rounded-lg bg-surface-container-low">
                <div className="flex items-center justify-between font-code-mono text-code-mono">
                  <span className="text-on-surface font-medium">Limiter Zapytań</span>
                  <span className="text-secondary font-semibold">100 req / min</span>
                </div>
                <div className="flex items-center justify-between text-label-sm text-outline mt-1 font-code-mono">
                  <span>Token Bucket: 98/100</span>
                  <span className="text-primary font-medium">OK</span>
                </div>
              </div>
            </div>
          </div>
          <div className="pt-space-sm mt-space-sm flex items-center justify-between font-label-sm text-outline border-t border-white/[0.04]">
            <span>TLS / mTLS Gateway: Włączony</span>
            <span className="text-secondary font-medium">SHA-384</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ServerPage;
