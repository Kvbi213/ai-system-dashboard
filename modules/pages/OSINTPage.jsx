import React, { useState } from 'react';
import axios from 'axios';
import { Search, ShieldAlert, Globe, Crosshair, MapPin, Database, Clock, Server, FileText } from 'lucide-react';

const OSINTPage = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleScan = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setResults(null);
    try {
      const res = await axios.post('/api/osint', { target: query.trim() });
      if (res.data.error) setError(res.data.error);
      else setResults(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden text-textPrimary animate-fade-in-up p-2 md:p-4">
      <div className="flex items-center gap-3 mb-6 shrink-0">
        <Crosshair className="w-8 h-8 text-accentPrimary" />
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-widest text-textPrimary drop-shadow-[0_0_10px_rgba(var(--color-accent-primary-hex),0.5)]">
            OSINT Intel
          </h1>
          <p className="text-xs text-textMuted font-mono">Wywiad jawnoźródłowy & Analiza</p>
        </div>
      </div>

      <form onSubmit={handleScan} className="flex gap-4 mb-6 shrink-0">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szefie, prześwietl domenę google.com..."
            className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-accentPrimary transition-colors font-mono text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="bg-accentPrimary/20 text-accentPrimary border border-accentPrimary/50 hover:bg-accentPrimary hover:text-black font-bold px-6 py-3 rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? 'SKANOWANIE...' : 'URUCHOM SKAN'}
        </button>
      </form>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg font-mono text-sm mb-6 flex items-start gap-3 shrink-0">
          <ShieldAlert className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {results && (
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
          
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xs font-mono text-textMuted uppercase bg-black/50 px-3 py-1 rounded-full border border-border">
              CEL: <span className="text-accentPrimary">{results.target_value}</span> ({results.target_type})
            </span>
            {results.resolved_ip && (
              <span className="text-xs font-mono text-textMuted uppercase bg-black/50 px-3 py-1 rounded-full border border-border">
                Rozwiązane IP: <span className="text-accentSecondary">{results.resolved_ip}</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* GeoJS */}
            {results.geo && (
              <div className="glass-panel p-5 rounded-xl border border-border hover:border-accentPrimary/50 transition-colors">
                <div className="flex items-center gap-2 mb-4 text-accentPrimary border-b border-border/50 pb-2">
                  <MapPin className="w-5 h-5" />
                  <h2 className="font-mono font-bold uppercase tracking-wide">Geolokalizacja</h2>
                </div>
                <div className="space-y-3 font-mono text-sm">
                  <div className="flex justify-between border-b border-border/30 pb-1"><span className="text-textMuted">IP:</span> <span>{results.geo.ip}</span></div>
                  <div className="flex justify-between border-b border-border/30 pb-1"><span className="text-textMuted">Kraj:</span> <span>{results.geo.country}</span></div>
                  <div className="flex justify-between border-b border-border/30 pb-1"><span className="text-textMuted">Miasto:</span> <span>{results.geo.city || 'N/A'}</span></div>
                  <div className="flex justify-between border-b border-border/30 pb-1"><span className="text-textMuted">Organizacja:</span> <span className="text-right pl-4">{results.geo.organization_name || results.geo.organization || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-textMuted">Koordynaty:</span> <span>{results.geo.latitude}, {results.geo.longitude}</span></div>
                </div>
              </div>
            )}

            {/* Wayback Machine */}
            {results.wayback && (
              <div className="glass-panel p-5 rounded-xl border border-border hover:border-accentPrimary/50 transition-colors">
                <div className="flex items-center gap-2 mb-4 text-accentPrimary border-b border-border/50 pb-2">
                  <Clock className="w-5 h-5" />
                  <h2 className="font-mono font-bold uppercase tracking-wide">Wayback Machine</h2>
                </div>
                <div className="space-y-3 font-mono text-sm">
                  {results.wayback.archived_snapshots?.closest?.available ? (
                    <>
                      <div className="flex items-center gap-2 text-green-400 mb-2">
                        <Database className="w-4 h-4" /> <span>Znaleziono Snapshot</span>
                      </div>
                      <div className="flex justify-between border-b border-border/30 pb-1"><span className="text-textMuted">Ostatni zrzut:</span> <span>{results.wayback.archived_snapshots.closest.timestamp.substring(0,8)}</span></div>
                      <div className="mt-4">
                        <a href={results.wayback.archived_snapshots.closest.url} target="_blank" rel="noreferrer" className="block text-center w-full py-2 bg-accentPrimary/10 text-accentPrimary rounded hover:bg-accentPrimary/30 transition-colors border border-accentPrimary/30">
                          OTWÓRZ ARCHIWUM
                        </a>
                      </div>
                    </>
                  ) : (
                    <p className="text-textMuted flex items-center gap-2"><Globe className="w-4 h-4"/> Brak danych w Archive.org</p>
                  )}
                </div>
              </div>
            )}
            
            {/* HIBP */}
            {results.hibp !== undefined && (
              <div className="glass-panel p-5 rounded-xl border border-border md:col-span-2 lg:col-span-3 hover:border-accentPrimary/50 transition-colors">
                <div className="flex items-center gap-2 mb-4 text-accentPrimary border-b border-border/50 pb-2">
                  <ShieldAlert className="w-5 h-5" />
                  <h2 className="font-mono font-bold uppercase tracking-wide">Pwned Passwords (Wycieki)</h2>
                </div>
                <div className="font-mono text-sm bg-black/40 p-4 rounded-lg border border-border/30">
                  {results.hibp > 0 ? (
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500 text-red-500 shrink-0">
                        <ShieldAlert className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-red-400 font-bold text-lg">KRYTYCZNE: Hasło wyciekło {results.hibp} razy!</p>
                        <p className="text-textMuted mt-1">To hasło pojawiło się w znanych, opublikowanych wyciekach danych. Zalecana natychmiastowa zmiana wszędzie tam, gdzie zostało użyte.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500 text-green-500 shrink-0">
                        <ShieldAlert className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-green-400 font-bold text-lg">BEZPIECZNIE: Hasło nie znalezione w bazie wycieków.</p>
                        <p className="text-textMuted mt-1">Hasło nie figuruje w darmowej bazie HIBP. Pamiętaj jednak o zasadach tworzenia silnych haseł.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* HackerTarget DNS */}
            {results.dns && (
              <div className="glass-panel p-5 rounded-xl border border-border md:col-span-2 lg:col-span-3 hover:border-accentPrimary/50 transition-colors flex flex-col h-96">
                <div className="flex items-center gap-2 mb-4 text-accentPrimary border-b border-border/50 pb-2 shrink-0">
                  <Server className="w-5 h-5" />
                  <h2 className="font-mono font-bold uppercase tracking-wide">Rekordy DNS (HackerTarget)</h2>
                </div>
                <pre className="text-[11px] text-green-400 font-mono whitespace-pre-wrap bg-black/60 p-4 rounded-lg overflow-y-auto custom-scrollbar flex-1 border border-border/30">
                  {results.dns}
                </pre>
              </div>
            )}

            {/* HackerTarget WHOIS */}
            {results.whois && (
              <div className="glass-panel p-5 rounded-xl border border-border md:col-span-2 lg:col-span-3 hover:border-accentPrimary/50 transition-colors flex flex-col h-[500px]">
                <div className="flex items-center gap-2 mb-4 text-accentPrimary border-b border-border/50 pb-2 shrink-0">
                  <FileText className="w-5 h-5" />
                  <h2 className="font-mono font-bold uppercase tracking-wide">WHOIS / Rejestr (HackerTarget)</h2>
                </div>
                <pre className="text-[11px] text-textMuted font-mono whitespace-pre-wrap bg-black/60 p-4 rounded-lg overflow-y-auto custom-scrollbar flex-1 border border-border/30">
                  {results.whois}
                </pre>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default OSINTPage;
