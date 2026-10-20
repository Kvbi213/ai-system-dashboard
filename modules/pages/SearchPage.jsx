import React, { useState, useRef, useMemo } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

const CATEGORIES = [
  { id: 'ALL', label: 'Wszystkie (28)' },
  { id: 'TASKS', label: 'Zadania & Cele (6)' },
  { id: 'GRADES', label: 'Oceny & Kursy (4)' },
  { id: 'TIMETABLE', label: 'Plan Dnia (5)' },
  { id: 'MEMORY', label: 'Pamięć AI & Fakty (7)' },
  { id: 'OSINT', label: 'OSINT & Domeny (3)' },
  { id: 'FINANCE', label: 'Transakcje Finansowe (3)' }
];

const DEFAULT_RESULTS = {
  memory: [
    {
      id: 'fact-108',
      num: 'Fakt #108',
      tag: 'Preferencje',
      synced: true,
      text: 'Standard kodu frontendowego: zakaz emotikonów w UI (Zero-Emoji Policy), pełna deterministyczna typografia techniczna i spójność z architektura systemów platformy.',
      score: '98% BM25',
      vecdist: 'vecdist 0.12'
    },
    {
      id: 'fact-112',
      num: 'Fakt #112',
      tag: 'Budżet',
      synced: false,
      text: 'Autoryzacja wydatków w budżecie operacyjnym: limit dzienny 60 PLN, alokacja na zasoby compute bazy sqlite oraz lokalne środowiska badawcze.',
      score: '92% BM25',
      vecdist: 'vecdist 0.19'
    }
  ],
  timetable: [
    {
      id: 'timetable-8f4a',
      title: 'Laboratorium: Bazy Danych SQLite - Indeksy B-Tree & WAL',
      time: '10:15 - 12:00',
      room: 'Sala 204',
      badge: 'Obecność obowiązkowa',
      badgeType: 'error',
      desc: 'Analiza mechanizmu Write-Ahead Logging w kontekście współbieżności wielowątkowej i struktury plików stron.',
      period: 'DZIŚ',
      code: 'ID: 0x8F4A'
    },
    {
      id: 'timetable-8f52',
      title: 'Konsultacje naukowe: Optymalizacja zapytań SQL & silniki bazodanowe',
      time: '14:00 - 15:30',
      room: 'Gmach Główny, P. 312',
      desc: 'Omówienie planu wykonania zapytań i indeksów cząstkowych w systemie relacyjnym.',
      period: 'JUTRO',
      code: 'ID: 0x8F52'
    }
  ],
  academic: [
    {
      id: 'academic-cs402',
      subject: 'Informatyka / Systemy Operacyjne - Projekt Architektura Jądra i SQLite',
      instructor: 'Prowadzący: dr hab. M. Kwiatkowski • Katedra Architektury Komputerów',
      module: 'INF-402',
      ects: 6,
      status: 'Zaliczony z wyróżnieniem',
      grade: '6.0',
      weight: 'Waga 3.0'
    }
  ],
  finance: [
    {
      id: 'finance-tx99',
      title: 'Subskrypcja API Groq LPU Cloud - Zachcianki / IT',
      card: 'Karta *8921',
      desc: 'Przetwarzanie zapytań wektorowych dla lokalnej bazy FTS5 i klastra wiedzy.',
      date: 'Wczoraj, 18:42 • Kategoria: Infrastruktura & Dev',
      amount: '-64.00 PLN',
      status: 'Rozliczone'
    }
  ]
};

const SearchPage = () => {
  const [query, setQuery] = useState('architektura systemów bazy sqlite');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(DEFAULT_RESULTS.timetable[0]);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const toggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        
        mediaRecorderRef.current.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        
        mediaRecorderRef.current.onstop = async () => {
          setIsTranscribing(true);
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          chunksRef.current = [];
          
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = async () => {
            try {
              const res = await fetch('/api/voice/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audioData: reader.result })
              });
              const data = await res.json();
              if (data.text) {
                setQuery(prev => (prev ? prev + ' ' + data.text.trim() : data.text.trim()));
              }
            } catch (err) {
              console.error(err);
            } finally {
              setIsTranscribing(false);
              stream.getTracks().forEach(track => track.stop());
            }
          };
        };
        
        mediaRecorderRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Brak dostępu do mikrofonu", err);
      }
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    const isCloudMode = typeof window !== 'undefined' && (
      window.location.hostname.includes('web.app') || 
      window.location.hostname.includes('firebaseapp.com') ||
      window.location.hostname.includes('vercel.app') ||
      (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
    );
    const endpoint = isCloudMode 
      ? `https://ai-system-dashboard.vercel.app/api/news?q=${encodeURIComponent(query)}`
      : `/api/news?q=${encodeURIComponent(query)}`;

    try {
      const response = await axios.get(endpoint);
      if (response.data.results && response.data.results.length > 0) {
        setResults(response.data.results);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error(error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex flex-col w-full gap-space-lg relative animate-soft-enter">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center gap-space-xs font-code-mono text-code-mono text-on-surface-variant">
            <span>OmniDash</span>
            <span className="text-outline">/</span>
            <span>Kognitywne</span>
            <span className="text-outline">/</span>
            <span className="text-primary font-medium">Wyszukiwanie Ctrl+K</span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">
            Globalna Wyszukiwarka Pełnotekstowa &amp; Indeks
          </h1>
        </div>

        <div className="flex items-center gap-space-sm self-start lg:self-center">
          <div className="flex items-center gap-space-xs px-space-sm py-space-xs rounded-full bg-surface-container-high text-primary shadow-sm border border-white/[0.04]">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            <span className="font-code-mono text-code-mono font-medium tracking-wide">SQLITE FTS5 &amp; FIRESTORE INDEX</span>
          </div>
          <div className="flex items-center gap-space-xs px-space-sm py-space-xs rounded-lg bg-surface-container font-code-mono text-code-mono text-on-surface-variant border border-white/[0.04]">
            <span className="material-symbols-outlined text-[15px]">database</span>
            <span>2,841 wpisów</span>
          </div>
        </div>
      </div>

      {/* Omnibox Search Container */}
      <div className="relative w-full rounded-xl bg-surface-container-low shadow-xl p-space-lg flex flex-col gap-space-md overflow-hidden border border-white/[0.04]">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-container/10 rounded-full blur-3xl pointer-events-none"></div>

        <form onSubmit={handleSearch} className="relative flex items-center w-full bg-surface-container-lowest rounded-xl shadow-inner px-space-md py-space-sm gap-space-md border border-white/[0.06]">
          <span className="material-symbols-outlined text-primary text-[24px]">search</span>
          <input
            id="global-search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Wpisz zapytanie semantyczne lub FTS5..."
            className="flex-1 bg-transparent text-on-surface font-body-lg text-body-lg placeholder:text-outline focus:outline-none"
          />

          <div className="flex items-center gap-space-xs">
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors active:scale-95"
                title="Wyczyść zapytanie"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}

            <button
              type="button"
              onClick={toggleRecording}
              disabled={isTranscribing}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors active:scale-95 ${
                isRecording ? 'bg-error-container/40 text-error animate-pulse' : 'text-outline hover:text-primary hover:bg-surface-container-high'
              }`}
              title="Dyktowanie głosowe"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isTranscribing ? 'sync' : 'mic'}
              </span>
            </button>

            <div className="h-4 w-[1px] bg-outline-variant/30 mx-space-xs"></div>

            <kbd className="hidden sm:inline-flex items-center gap-space-xs px-space-sm py-0.5 rounded bg-surface-container-high font-code-mono text-code-mono text-on-surface-variant shadow-sm border border-white/[0.04]">
              <span className="text-[11px]">⌘</span>
              <span>K</span>
            </kbd>

            <button
              type="submit"
              disabled={isSearching}
              className="ml-2 px-space-md py-1.5 rounded-lg bg-primary-container text-on-primary-container font-label-md text-label-md font-semibold hover:brightness-110 active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
            >
              <span className={`material-symbols-outlined text-[16px] ${isSearching ? 'animate-spin' : ''}`}>
                {isSearching ? 'progress_activity' : 'search'}
              </span>
              <span>Szukaj</span>
            </button>
          </div>
        </form>

        {/* Filter Pills */}
        <div className="flex items-center gap-space-xs overflow-x-auto pb-1 scrollbar-none" id="filter-pills-container">
          {CATEGORIES.map(cat => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-space-md py-1 rounded-full font-label-md text-label-md whitespace-nowrap transition-all active:scale-95 ${
                  isActive
                    ? 'bg-primary text-on-primary font-semibold shadow-sm'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Two-Column Layout: Results Stream + Deep Inspector */}
      <div className="flex flex-col xl:flex-row gap-space-lg w-full items-start">
        {/* Left Column: Categorized Result Stack */}
        <div className="flex-1 w-full flex flex-col gap-space-lg">
          {/* Section 1: Pamięć AI & Fakty */}
          <section className="flex flex-col gap-space-sm">
            <div className="flex items-center justify-between px-space-xs">
              <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-outline tracking-wider uppercase font-semibold">
                <span className="material-symbols-outlined text-[16px] text-primary">memory</span>
                <span>PAMIĘĆ OPERATORA &amp; FAKTY AI</span>
                <span className="px-1.5 py-0.2 rounded bg-surface-container-high text-on-surface font-code-mono text-[10px]">
                  {DEFAULT_RESULTS.memory.length}
                </span>
              </div>
              <span className="font-code-mono text-[11px] text-outline">BM25 rank: k1=1.2, b=0.75</span>
            </div>

            <div className="flex flex-col gap-space-xs">
              {DEFAULT_RESULTS.memory.map(item => (
                <div
                  key={item.id}
                  onClick={() => setSelectedRecord(item)}
                  className="group relative flex flex-col p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-all cursor-pointer shadow-sm border border-white/[0.03] active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between gap-space-md">
                    <div className="flex flex-col gap-space-xs min-w-0">
                      <div className="flex items-center gap-space-xs">
                        <span className="font-code-mono text-code-mono text-primary font-medium">{item.num}</span>
                        <span className="text-outline text-label-sm">•</span>
                        <span className="px-space-xs py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
                          {item.tag}
                        </span>
                        {item.synced && (
                          <span className="px-space-xs py-0.5 rounded bg-secondary-container/30 text-secondary font-label-sm text-label-sm">
                            Zsynchronizowano
                          </span>
                        )}
                      </div>
                      <p className="font-body-md text-body-md text-on-surface line-clamp-2">
                        {item.text}
                      </p>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="font-code-mono text-code-mono font-semibold text-primary">{item.score}</span>
                      <span className="font-label-sm text-label-sm text-outline">{item.vecdist}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 2: Plan Dnia & Harmonogram */}
          <section className="flex flex-col gap-space-sm">
            <div className="flex items-center justify-between px-space-xs">
              <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-outline tracking-wider uppercase font-semibold">
                <span className="material-symbols-outlined text-[16px] text-tertiary">schedule</span>
                <span>PLAN DNIA &amp; HARMONOGRAM</span>
                <span className="px-1.5 py-0.2 rounded bg-surface-container-high text-on-surface font-code-mono text-[10px]">
                  {DEFAULT_RESULTS.timetable.length}
                </span>
              </div>
              <span className="font-code-mono text-[11px] text-outline">timetable.sqlite</span>
            </div>

            <div className="flex flex-col gap-space-xs">
              {DEFAULT_RESULTS.timetable.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedRecord(item)}
                  className={`group relative flex flex-col p-space-md rounded-xl transition-all cursor-pointer shadow-sm active:scale-[0.99] ${
                    idx === 0
                      ? 'bg-surface-container ring-1 ring-primary/40 shadow-md'
                      : 'bg-surface-container-low hover:bg-surface-container'
                  }`}
                >
                  <div className="flex items-start justify-between gap-space-md">
                    <div className="flex flex-col gap-space-xs min-w-0">
                      <div className="flex items-center gap-space-xs">
                        <span className="w-2 h-2 rounded-full bg-primary"></span>
                        <span className="font-headline-md text-headline-md text-on-surface font-semibold tracking-tight truncate">
                          {item.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-space-md text-on-surface-variant font-code-mono text-code-mono flex-wrap">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">access_time</span>
                          {item.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">meeting_room</span>
                          {item.room}
                        </span>
                        {item.badge && (
                          <span className="px-1.5 py-0.2 rounded bg-error-container/30 text-error font-label-sm text-label-sm font-semibold">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="font-body-md text-body-md text-on-surface-variant line-clamp-1 mt-space-xs">
                        {item.desc}
                      </p>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="px-space-xs py-0.5 rounded bg-surface-container-high font-code-mono text-[11px] text-primary font-bold">
                        {item.period}
                      </span>
                      <span className="font-label-sm text-label-sm text-outline mt-1">{item.code}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3: Oceny i Sylabusy Akademickie */}
          <section className="flex flex-col gap-space-sm">
            <div className="flex items-center justify-between px-space-xs">
              <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-outline tracking-wider uppercase font-semibold">
                <span className="material-symbols-outlined text-[16px] text-secondary">school</span>
                <span>OCENY I SYLABUSY AKADEMICKIE</span>
                <span className="px-1.5 py-0.2 rounded bg-surface-container-high text-on-surface font-code-mono text-[10px]">1</span>
              </div>
              <span className="font-code-mono text-[11px] text-outline">academic_registry</span>
            </div>

            {DEFAULT_RESULTS.academic.map(item => (
              <div
                key={item.id}
                onClick={() => setSelectedRecord(item)}
                className="group relative flex flex-col p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-all cursor-pointer shadow-sm border border-white/[0.03] active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-space-md">
                  <div className="flex flex-col gap-space-xs min-w-0">
                    <span className="font-headline-md text-headline-md text-on-surface font-semibold truncate">
                      {item.subject}
                    </span>
                    <p className="font-body-md text-body-md text-on-surface-variant">
                      {item.instructor}
                    </p>
                    <div className="flex items-center gap-space-md font-code-mono text-code-mono text-on-surface-variant mt-space-xs">
                      <span>Moduł: {item.module}</span>
                      <span>ECTS: {item.ects}</span>
                      <span>Status: {item.status}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <div className="flex items-baseline gap-1">
                      <span className="font-label-sm text-label-sm text-outline">Ocena</span>
                      <span className="font-headline-lg text-headline-lg font-bold text-primary">{item.grade}</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-outline">{item.weight}</span>
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Section 4: Finanse i Dziennik Transakcji */}
          <section className="flex flex-col gap-space-sm">
            <div className="flex items-center justify-between px-space-xs">
              <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-outline tracking-wider uppercase font-semibold">
                <span className="material-symbols-outlined text-[16px] text-primary">account_balance_wallet</span>
                <span>FINANSE I DZIENNIK TRANSAKCJI</span>
                <span className="px-1.5 py-0.2 rounded bg-surface-container-high text-on-surface font-code-mono text-[10px]">1</span>
              </div>
              <span className="font-code-mono text-[11px] text-outline">ledger_entries</span>
            </div>

            {DEFAULT_RESULTS.finance.map(item => (
              <div
                key={item.id}
                onClick={() => setSelectedRecord(item)}
                className="group relative flex flex-col p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-all cursor-pointer shadow-sm border border-white/[0.03] active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-space-md">
                  <div className="flex flex-col gap-space-xs min-w-0">
                    <div className="flex items-center gap-space-xs">
                      <span className="font-body-lg text-body-lg text-on-surface font-semibold truncate">
                        {item.title}
                      </span>
                      <span className="px-space-xs py-0.2 rounded bg-surface-container text-on-surface-variant font-code-mono text-[11px]">
                        {item.card}
                      </span>
                    </div>
                    <p className="font-body-md text-body-md text-on-surface-variant">
                      {item.desc}
                    </p>
                    <span className="font-code-mono text-code-mono text-outline">{item.date}</span>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="font-code-mono text-headline-md font-semibold text-error">{item.amount}</span>
                    <span className="font-label-sm text-label-sm text-outline">{item.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Network API Results (if user executes remote search) */}
          {results.length > 0 && (
            <section className="flex flex-col gap-space-sm">
              <div className="flex items-center justify-between px-space-xs">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                  WYNIKI SIECIOWE (WEB / NEWS)
                </span>
                <span className="font-code-mono text-[11px] text-outline">{results.length} wyników</span>
              </div>
              {results.map((res, i) => (
                <div key={i} className="p-space-md rounded-xl bg-surface-container-low border border-white/[0.04] flex flex-col gap-space-xs">
                  <a href={res.url} target="_blank" rel="noreferrer" className="text-on-surface font-semibold hover:text-primary transition-colors flex items-center gap-1.5">
                    <span>{res.title}</span>
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  </a>
                  <p className="text-on-surface-variant font-body-md text-body-md">{res.description}</p>
                </div>
              ))}
            </section>
          )}
        </div>

        {/* Right Aside: Głęboki Inspektor Kontekstu */}
        <aside className="w-full xl:w-96 shrink-0 flex flex-col gap-space-md sticky top-20">
          <div className="flex items-center justify-between px-space-xs">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
              Głęboki Inspektor Kontekstu
            </span>
            <div className="flex items-center gap-1 font-code-mono text-[11px] text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              <span>LIVE RECORD</span>
            </div>
          </div>

          <div className="flex flex-col rounded-xl bg-surface-container-low shadow-xl p-space-md gap-space-md border border-white/[0.04]">
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center justify-between">
                <span className="px-space-xs py-0.5 rounded bg-surface-container font-code-mono text-code-mono text-outline">
                  SQLite: timetable (0x8F4A)
                </span>
                <span className="font-code-mono text-[11px] text-primary font-medium">Score: 14.82 BM25</span>
              </div>
              <h2 className="font-headline-md text-headline-md text-on-surface font-semibold tracking-tight leading-snug">
                {selectedRecord?.title || 'Laboratorium: Bazy Danych SQLite - Indeksy B-Tree & WAL'}
              </h2>
            </div>

            {/* Monochromatic Technical Architecture Banner */}
            <div className="relative w-full h-32 rounded-lg overflow-hidden bg-surface-container flex flex-col justify-end p-2 border border-white/[0.04]">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-container/20 via-surface-container to-surface-container-lowest opacity-70"></div>
              <div className="relative z-10 flex justify-between items-end">
                <span className="font-code-mono text-[10px] text-on-surface-variant bg-surface-container-lowest/80 px-1.5 py-0.5 rounded backdrop-blur-md">
                  Schema: Relational WAL Index
                </span>
                <span className="font-code-mono text-[10px] text-primary bg-surface-container-lowest/80 px-1.5 py-0.5 rounded backdrop-blur-md font-bold">
                  Verified 100%
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-space-xs">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">
                Dopasowany Fragment Kontekstu
              </span>
              <div className="p-space-sm rounded-lg bg-surface-container-lowest font-code-mono text-code-mono text-on-surface-variant leading-relaxed border border-white/[0.03]">
                <span className="text-outline">&gt;&gt;</span> Przedmiot: <mark className="bg-primary/20 text-primary px-1 rounded font-medium">Architektura systemów bazy sqlite</mark>.<br/>
                Wymagania: implementacja własnego B-Tree z obsługą stronicowania pamięci podręcznej i transakcyjności ACID.
              </div>
            </div>

            <div className="flex flex-col gap-space-xs">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">
                Połączona Notatka Obsidian Vault
              </span>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors group border border-white/[0.03]"
              >
                <div className="flex items-center gap-space-xs min-w-0">
                  <span className="material-symbols-outlined text-primary text-[18px]">description</span>
                  <span className="font-code-mono text-code-mono text-primary font-medium truncate">
                    [[Bazy_Danych_SQLite_WAL_i_Transakcje]]
                  </span>
                </div>
                <span className="material-symbols-outlined text-outline group-hover:text-on-surface text-[16px] transition-colors">
                  north_east
                </span>
              </a>
            </div>

            <div className="flex flex-col gap-space-xs pt-space-xs">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">
                Telemetria &amp; Relacje
              </span>
              <div className="grid grid-cols-2 gap-space-xs font-code-mono text-[11px]">
                <div className="p-space-xs rounded bg-surface-container flex flex-col border border-white/[0.03]">
                  <span className="text-outline">Utworzono</span>
                  <span className="text-on-surface font-medium">2026-10-20 08:30</span>
                </div>
                <div className="p-space-xs rounded bg-surface-container flex flex-col border border-white/[0.03]">
                  <span className="text-outline">Ostatnia Sync</span>
                  <span className="text-on-surface font-medium">przed 4 min (WAL)</span>
                </div>
                <div className="p-space-xs rounded bg-surface-container flex flex-col border border-white/[0.03]">
                  <span className="text-outline">Węzły powiązane</span>
                  <span className="text-on-surface font-medium">7 powiązań grafu</span>
                </div>
                <div className="p-space-xs rounded bg-surface-container flex flex-col border border-white/[0.03]">
                  <span className="text-outline">Uprawnienia</span>
                  <span className="text-on-surface font-medium">Operator Root RW</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-space-xs pt-space-sm">
              <button
                type="button"
                className="flex items-center justify-center gap-space-xs w-full py-2 px-space-md rounded-lg bg-primary-container text-on-primary-container font-label-md text-label-md font-semibold hover:brightness-110 active:scale-95 transition-all shadow-md"
              >
                <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                <span>Przejdź do Planu Dnia</span>
              </button>

              <div className="flex items-center gap-space-xs">
                <button
                  type="button"
                  className="flex-1 flex items-center justify-center gap-space-xs py-2 px-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-colors active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">edit_document</span>
                  <span className="truncate">Otwórz w Obsidian</span>
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center w-10 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors active:scale-95"
                  title="Kopiuj Odnośnik"
                >
                  <span className="material-symbols-outlined text-[16px]">link</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-space-sm rounded-xl bg-surface-container-low font-code-mono text-code-mono text-on-surface-variant shadow-sm border border-white/[0.04]">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-[16px] text-outline">tune</span>
              <span className="text-[12px]">Czas wykonania zapytania:</span>
            </div>
            <span className="text-primary font-semibold text-[12px]">1.84 ms</span>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default SearchPage;
