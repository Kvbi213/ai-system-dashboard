import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Search, Loader2, Globe, Mic } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const SearchPage = () => {
  const [query, setQuery] = useState('');
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
    e.preventDefault();
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
        setResults([{ title: 'Brak wyników', description: 'Nie znaleziono pasujących informacji w sieci.', url: '#' }]);
      }
    } catch (error) {
      console.error(error);
      setResults([{ title: 'Błąd', description: 'Nie udało się nawiązać połączenia z siecią.', url: '#' }]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6 pb-20 md:pb-0">
      <header className="glass-panel p-5 rounded-xl border border-border flex items-center gap-4 flex-shrink-0 opacity-0 animate-soft-enter" style={{ animationDelay: '50ms' }}>
        <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center flex-shrink-0 shadow-sm">
          <Globe className="w-5 h-5 text-textPrimary" />
        </div>
        <div className="flex flex-col">
          <nav aria-label="breadcrumb" className="flex items-center space-x-2 text-sm text-textMuted mb-0.5">
            <span className="flex items-center text-lg font-medium text-textMuted/70">OmniDash</span>
            <span className="shrink-0 text-lg font-medium text-textMuted/70">/</span>
            <span className="flex items-center text-lg font-medium text-textPrimary">Wyszukiwanie</span>
          </nav>
          <p className="font-sans text-xs text-textMuted mt-0.5">Globalne wyszukiwanie informacji w sieci</p>
        </div>
      </header>

      <div className="opacity-0 animate-soft-enter" style={{ animationDelay: '100ms' }}>
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 relative">
          <div className="flex-1 relative">
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Wprowadź zapytanie (np. latest zero day exploits)..."
              className="w-full bg-background border border-border rounded-lg px-4 py-3 pr-12 text-textPrimary focus:outline-none focus:border-accentPrimary transition-colors font-mono"
            />
            <button 
              type="button"
              onClick={toggleRecording}
              disabled={isTranscribing}
              className={`absolute right-3 top-2.5 p-1.5 rounded-full transition-all flex items-center justify-center ${isRecording ? 'bg-red-500/20 text-red-500 animate-pulse' : 'text-textMuted hover:text-accentPrimary hover:bg-accentPrimary/10'}`}
              title="Dyktuj zapytanie"
            >
              {isTranscribing ? <Loader2 className="w-5 h-5 animate-spin text-accentPrimary" /> : <Mic className="w-5 h-5" />}
            </button>
          </div>
          <button 
            type="submit"
            disabled={isSearching}
            className="bg-surface border border-border text-textPrimary hover:bg-surface/80 px-6 py-3 rounded-lg transition-all flex justify-center items-center gap-2 font-sans font-medium w-full md:w-auto"
          >
            {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            Szukaj
          </button>
        </form>
      </div>

      <main id="tour-search" className="flex-1 min-h-0 overflow-y-auto space-y-4">
        {results.length === 0 && !isSearching && (
          <div className="h-full flex items-center justify-center text-textMuted font-sans text-sm">
            Wpisz zapytanie, aby rozpocząć wyszukiwanie...
          </div>
        )}
        
        {results.map((res, i) => (
          <div key={i} className="glass-panel p-6 rounded-xl border border-border hover:border-accentPrimary/50 transition-colors">
            <a href={res.url} target="_blank" rel="noreferrer" className="text-xl font-bold text-textPrimary hover:text-accentPrimary transition-colors font-sans">
              {res.title}
            </a>
            <div className="text-textMuted mt-3 font-sans leading-relaxed whitespace-pre-wrap">
              <ReactMarkdown
                components={{
                  p: ({node, ...props}) => <p className="mb-2" {...props} />,
                  a: ({node, ...props}) => <a className="text-accentSecondary hover:text-accentPrimary underline" target="_blank" rel="noreferrer" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-2 space-y-1" {...props} />,
                  li: ({node, ...props}) => <li className="marker:text-accentPrimary" {...props} />,
                  strong: ({node, ...props}) => <strong className="text-textPrimary font-bold" {...props} />
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
