import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Search, Loader2, Globe, Mic, X, Database, CheckCircle2, Bookmark, ArrowRight, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const CATEGORIES = [
  { id: 'ALL', label: 'Wszystkie' },
  { id: 'TASKS', label: 'Zadania & Cele' },
  { id: 'GRADES', label: 'Oceny & Kursy' },
  { id: 'TIMETABLE', label: 'Plan Dnia' },
  { id: 'MEMORY', label: 'Pamięć AI & Fakty' },
  { id: 'OSINT', label: 'OSINT & Domeny' },
  { id: 'FINANCE', label: 'Transakcje Finansowe' }
];

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
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
        setResults([{ 
          title: 'Brak wyników w sieci', 
          description: `Brak wyników wyszukiwania dla zapytania "${query}". Przeszukaj lokalną bazę SQLite FTS5 lub sprawdź pisownię.`, 
          url: '#',
          category: 'Indeks'
        }]);
      }
    } catch (error) {
      console.error(error);
      setResults([{ 
        title: 'Błąd indeksu', 
        description: 'Nie udało się nawiązać połączenia z serwerem wyszukiwania.', 
        url: '#',
        category: 'System'
      }]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-2 sm:p-4 lg:p-6 pb-20 md:pb-6 space-y-space-lg text-on-surface">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md pb-space-sm border-b border-white/[0.08]">
        <div className="flex flex-col gap-space-xs">
          <nav aria-label="breadcrumb" className="flex items-center gap-space-xs font-code-mono text-label-sm text-outline">
            <span className="hover:text-primary transition-colors cursor-pointer">OmniDash</span>
            <span className="text-outline-variant">/</span>
            <span>Kognitywne</span>
            <span className="text-outline-variant">/</span>
            <span className="text-primary font-medium">Wyszukiwanie Ctrl+K</span>
          </nav>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-semibold">
            Globalna Wyszukiwarka Pełnotekstowa &amp; Indeks
          </h1>
        </div>
        <div className="flex items-center gap-space-sm self-start lg:self-center">
          <div className="flex items-center gap-space-xs px-space-sm py-1 rounded-full bg-surface-container-high text-primary border border-white/[0.06] shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            <span className="font-code-mono text-label-sm font-medium tracking-wide">SQLITE FTS5 &amp; FIRESTORE INDEX</span>
          </div>
          <div className="flex items-center gap-space-xs px-space-sm py-1 rounded-lg bg-surface-container font-code-mono text-label-sm text-on-surface-variant border border-white/[0.06]">
            <Database className="w-3.5 h-3.5 text-secondary" />
            <span>2,841 wpisów</span>
          </div>
        </div>
      </div>

      {/* Global Search Input Bar */}
      <div className="relative w-full rounded-2xl bg-surface-container-low border border-white/[0.08] shadow-xl p-space-md sm:p-space-lg flex flex-col gap-space-md overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-container/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <form onSubmit={handleSearch} className="relative flex items-center w-full bg-surface-container-lowest border border-white/[0.08] rounded-xl px-space-md py-2.5 gap-space-md">
          <Search className="w-5 h-5 text-primary shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Wpisz zapytanie semantyczne lub FTS5 (np. finanse, trening, librus)..."
            className="flex-1 bg-transparent text-on-surface font-body-lg text-body-lg placeholder:text-outline focus:outline-none"
          />
          <div className="flex items-center gap-space-xs">
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors"
                title="Wyczyść zapytanie"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={toggleRecording}
              disabled={isTranscribing}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                isRecording ? 'bg-error/20 text-error animate-pulse' : 'text-outline hover:text-primary hover:bg-surface-container-high'
              }`}
              title="Dyktowanie głosowe"
            >
              {isTranscribing ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Mic className="w-4 h-4" />}
            </button>
            <div className="h-4 w-[1px] bg-white/[0.08] mx-1"></div>
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-high font-code-mono text-label-sm text-on-surface-variant border border-white/[0.06]">
              <span>Ctrl</span>
              <span>K</span>
            </kbd>
            <button
              type="submit"
              disabled={isSearching}
              className="ml-2 px-4 py-1.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-primary-fixed-dim transition-all shadow-[0_0_16px_rgba(173,198,255,0.25)] flex items-center gap-1.5"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Szukaj</span>
            </button>
          </div>
        </form>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-space-xs overflow-x-auto pb-1 custom-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-full font-label-md text-label-md transition-all whitespace-nowrap border ${
                selectedCategory === cat.id
                  ? 'bg-primary text-on-primary font-semibold border-primary shadow-sm'
                  : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface border-white/[0.06]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Container */}
      <main id="tour-search" className="flex-1 min-h-0 space-y-space-md">
        {results.length === 0 && !isSearching && (
          <div className="py-20 text-center font-code-mono text-sm text-outline border border-dashed border-white/[0.08] rounded-2xl">
            [*] Wpisz zapytanie w wyszukiwarce lub naciśnij Ctrl+K, aby przeszukać bazę wiedzy...
          </div>
        )}

        {results.map((res, i) => (
          <div 
            key={i} 
            className="group relative flex flex-col p-space-md rounded-2xl bg-surface-container-low hover:bg-surface-container transition-all border border-white/[0.08] shadow-sm space-y-space-xs"
          >
            <div className="flex items-start justify-between gap-space-md">
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-space-xs flex-wrap font-code-mono text-label-sm">
                  <span className="text-primary font-medium">Wynik #{i + 1}</span>
                  <span className="text-outline">•</span>
                  <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-sm">
                    {res.category || 'Global Search'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-secondary-container/30 text-secondary font-label-sm border border-secondary/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-secondary" /> Zindeksowano
                  </span>
                </div>
                <a 
                  href={res.url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-lg font-headline-md font-semibold text-on-surface hover:text-primary transition-colors flex items-center gap-1.5 mt-1"
                >
                  <span>{res.title}</span>
                  {res.url && res.url !== '#' && <ExternalLink className="w-4 h-4 text-outline group-hover:text-primary transition-colors" />}
                </a>
              </div>
              <span className="font-code-mono text-[11px] text-outline shrink-0">BM25: 1.42</span>
            </div>

            <div className="text-on-surface-variant text-body-md font-body-md leading-relaxed whitespace-pre-wrap pt-1 border-t border-white/[0.04]">
              <ReactMarkdown
                components={{
                  p: ({node, ...props}) => <p className="mb-2 leading-relaxed" {...props} />,
                  a: ({node, ...props}) => <a className="text-secondary hover:text-primary underline" target="_blank" rel="noreferrer" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-2 space-y-1" {...props} />,
                  li: ({node, ...props}) => <li className="marker:text-primary" {...props} />,
                  strong: ({node, ...props}) => <strong className="text-on-surface font-semibold" {...props} />
                }}
              >
                {res.description}
              </ReactMarkdown>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
};

export default SearchPage;
