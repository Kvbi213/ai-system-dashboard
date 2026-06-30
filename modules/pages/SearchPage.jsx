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
    try {
      const response = await axios.get(`/api/news?q=${encodeURIComponent(query)}`);

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
      <header className="glass-panel p-6 rounded-xl border border-border opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <h1 className="font-mono text-2xl text-accentSecondary font-bold flex items-center gap-3">
          <Globe className="w-8 h-8 text-accentPrimary" />
          Global Net Search
        </h1>
        <p className="font-sans text-textMuted mt-2">Dostęp do sieci za pośrednictwem Brave Search API.</p>
        
        <form onSubmit={handleSearch} className="mt-6 flex flex-col md:flex-row gap-4 relative">
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
            className="bg-accentPrimary/10 border border-accentPrimary text-accentPrimary px-6 py-3 rounded-lg hover:bg-accentPrimary/20 transition-all flex justify-center items-center gap-2 font-mono font-bold w-full md:w-auto"
          >
            {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            SZUKAJ
          </button>
        </form>
      </header>

      <main id="tour-search" className="flex-1 min-h-0 overflow-y-auto space-y-4">
        {results.length === 0 && !isSearching && (
          <div className="h-full flex items-center justify-center text-textMuted font-mono">
            System oczekuje na parametry wejściowe...
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
