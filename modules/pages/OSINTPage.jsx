import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import axios from 'axios';
import { Search, ShieldAlert, Globe, Crosshair, MapPin, Database, Clock, Server, FileText } from 'lucide-react';

const OSINTPage = () => {
  const { t } = useTranslation();

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const runClientSideScan = async (rawTarget) => {
    const input = rawTarget.trim();
    const ipRegex = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/;
    const domainRegex = /\b[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}\b/;
    let type = 'string';
    let target = input;
    if (ipRegex.test(input)) { type = 'ip'; target = input.match(ipRegex)[0]; }
    else if (domainRegex.test(input)) { type = 'domain'; target = input.match(domainRegex)[0]; }

    const scanData = { target_type: type, target_value: target };
    let ipToScan = target;

    if (type === 'domain') {
      try {
        const dnsRes = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(target)}&type=A`);
        if (dnsRes.ok) {
          const dnsJson = await dnsRes.json();
          if (dnsJson.Answer && dnsJson.Answer.length > 0) {
            const aRec = dnsJson.Answer.find(a => a.type === 1);
            if (aRec && aRec.data) {
              ipToScan = aRec.data;
              scanData.resolved_ip = ipToScan;
            }
          }
        }
      } catch {}

      try {
        const wbRes = await fetch(`https://archive.org/wayback/available?url=${encodeURIComponent(target)}`);
        if (wbRes.ok) {
          scanData.wayback = await wbRes.json();
        }
      } catch {}
    }

    if (ipToScan && (type === 'ip' || type === 'domain')) {
      try {
        const geoRes = await fetch(`https://get.geojs.io/v1/ip/geo/${ipToScan}.json`);
        if (geoRes.ok) {
          scanData.geo = await geoRes.json();
        }
      } catch {}
    }

    return scanData;
  };

  const handleScan = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setResults(null);

    const isCloudMode = typeof window !== 'undefined' && (
      window.location.hostname.includes('web.app') || 
      window.location.hostname.includes('firebaseapp.com') ||
      window.location.hostname.includes('vercel.app') ||
      (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
    );

    const endpoints = isCloudMode
      ? [
          'https://ai-system-dashboard.vercel.app/api/osint',
          '/api/osint'
        ]
      : [
          '/api/osint',
          'https://ai-system-dashboard.vercel.app/api/osint'
        ];

    let success = false;
    for (const ep of endpoints) {
      try {
        const res = await axios.post(ep, { target: query.trim() }, { timeout: 7000 });
        if (res.data && typeof res.data === 'object' && !res.data.error) {
          setResults(res.data);
          success = true;
          break;
        } else if (res.data && res.data.error) {
          setError(res.data.error);
          success = true;
          break;
        }
      } catch (err) {
        console.debug(`[OSINT] Endpoint ${ep} niedostępny:`, err.message);
      }
    }

    if (!success) {
      // Fallback kliencki prosto w przeglądarce
      try {
        const clientData = await runClientSideScan(query.trim());
        setResults(clientData);
      } catch (clientErr) {
        setError('Nie udało się wykonać skanu OSINT: ' + clientErr.message);
      }
    }

    setLoading(false);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden text-textPrimary animate-soft-enter p-2 sm:p-4 pb-20 md:pb-4">
      <header className="glass-panel p-4 sm:p-5 rounded-xl border border-border flex items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 shrink-0 opacity-0 animate-soft-enter" style={{ animationDelay: '50ms' }}>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center flex-shrink-0 shadow-sm">
            <Crosshair className="w-5 h-5 text-textPrimary" />
          </div>
          <div className="flex flex-col">
            <nav aria-label="breadcrumb" className="flex items-center space-x-2 text-sm text-textMuted mb-0.5">
              <span className="flex items-center text-base sm:text-lg font-medium text-textMuted/70">OmniDash</span>
              <span className="shrink-0 text-base sm:text-lg font-medium text-textMuted/70">/</span>
              <span className="flex items-center text-base sm:text-lg font-medium text-textPrimary">Baza Wiedzy</span>
            </nav>
            <p className="font-sans text-xs text-textMuted mt-0.5">{t("osintDesc", "Wywiad jawnoźródłowy & Analiza")}</p>
          </div>
        </div>
      </header>

      <form onSubmit={handleScan} className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6 shrink-0 opacity-0 animate-soft-enter" style={{ animationDelay: '100ms' }}>
        <div className="relative flex-1 max-w-none sm:max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("osintPlaceholder", "Szefie, prześwietl domenę google.com...")}
            className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-2.5 sm:py-3 focus:outline-none focus:border-accentPrimary transition-colors font-mono text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="bg-accentPrimary/20 text-accentPrimary border border-accentPrimary/50 hover:bg-accentPrimary hover:text-black font-bold px-6 py-2.5 sm:py-3 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 w-full sm:w-auto"
        >
          {loading ? t('osintScanning', 'SKANOWANIE...') : t('osintRun', 'URUCHOM SKAN')}
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
              {t("osintTarget", "CEL: ")}<span className="text-accentPrimary">{results.target_value}</span> ({results.target_type})
            </span>
            {results.resolved_ip && (
              <span className="text-xs font-mono text-textMuted uppercase bg-black/50 px-3 py-1 rounded-full border border-border">
                {t("osintResolved", "Rozwiązane IP: ")}<span className="text-accentSecondary">{results.resolved_ip}</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* GeoJS */}
            {results.geo && (
              <div className="glass-panel p-5 rounded-xl border border-border hover:border-accentPrimary/50 transition-colors">
                <div className="flex items-center gap-2 mb-4 text-accentPrimary border-b border-border/50 pb-2">
                  <MapPin className="w-5 h-5" />
                  <h2 className="font-mono font-bold uppercase tracking-wide">{t("osintGeo", "Geolokalizacja")}</h2>
                </div>
                <div className="space-y-3 font-mono text-sm">
                  <div className="flex justify-between border-b border-border/30 pb-1"><span className="text-textMuted">{t("osintIP", "IP:")}</span> <span>{results.geo.ip}</span></div>
                  <div className="flex justify-between border-b border-border/30 pb-1"><span className="text-textMuted">{t("osintCountry", "Kraj:")}</span> <span>{results.geo.country}</span></div>
                  <div className="flex justify-between border-b border-border/30 pb-1"><span className="text-textMuted">{t("osintCity", "Miasto:")}</span> <span>{results.geo.city || 'N/A'}</span></div>
                  <div className="flex justify-between border-b border-border/30 pb-1"><span className="text-textMuted">{t("osintOrg", "Organizacja:")}</span> <span className="text-right pl-4">{results.geo.organization_name || results.geo.organization || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-textMuted">{t("osintCoords", "Koordynaty:")}</span> <span>{results.geo.latitude}, {results.geo.longitude}</span></div>
                </div>
              </div>
            )}

            {/* Wayback Machine */}
            {results.wayback && (
              <div className="glass-panel p-5 rounded-xl border border-border hover:border-accentPrimary/50 transition-colors">
                <div className="flex items-center gap-2 mb-4 text-accentPrimary border-b border-border/50 pb-2">
                  <Clock className="w-5 h-5" />
                  <h2 className="font-mono font-bold uppercase tracking-wide">{t("osintWayback", "Wayback Machine")}</h2>
                </div>
                <div className="space-y-3 font-mono text-sm">
                  {results.wayback.archived_snapshots?.closest?.available ? (
                    <>
                      <div className="flex items-center gap-2 text-green-400 mb-2">
                        <Database className="w-4 h-4" /> <span>{t("osintSnapshotFound", "Znaleziono Snapshot")}</span>
                      </div>
                      <div className="flex justify-between border-b border-border/30 pb-1"><span className="text-textMuted">{t("osintLastSnap", "Ostatni zrzut:")}</span> <span>{results.wayback.archived_snapshots.closest.timestamp.substring(0,8)}</span></div>
                      <div className="mt-4">
                        <a href={results.wayback.archived_snapshots.closest.url} target="_blank" rel="noreferrer" className="block text-center w-full py-2 bg-accentPrimary/10 text-accentPrimary rounded hover:bg-accentPrimary/30 transition-colors border border-accentPrimary/30">
                          OTWÓRZ ARCHIWUM
                        </a>
                      </div>
                    </>
                  ) : (
                    <p className="text-textMuted flex items-center gap-2"><Globe className="w-4 h-4"/>{t("osintNoArchive", " Brak danych w Archive.org")}</p>
                  )}
                </div>
              </div>
            )}
            
            {/* HIBP */}
            {results.hibp !== undefined && (
              <div className="glass-panel p-5 rounded-xl border border-border md:col-span-2 lg:col-span-3 hover:border-accentPrimary/50 transition-colors">
                <div className="flex items-center gap-2 mb-4 text-accentPrimary border-b border-border/50 pb-2">
                  <ShieldAlert className="w-5 h-5" />
                  <h2 className="font-mono font-bold uppercase tracking-wide">{t("osintPwned", "Pwned Passwords (Wycieki)")}</h2>
                </div>
                <div className="font-mono text-sm bg-black/40 p-4 rounded-lg border border-border/30">
                  {results.hibp > 0 ? (
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500 text-red-500 shrink-0">
                        <ShieldAlert className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-red-400 font-bold text-lg">{t("osintCritical", "KRYTYCZNE: Hasło wyciekło ")}{results.hibp}{t("osintTimes", " razy!")}</p>
                        <p className="text-textMuted mt-1">{t("osintPwnedDesc", "To hasło pojawiło się w znanych, opublikowanych wyciekach danych. Zalecana natychmiastowa zmiana wszędzie tam, gdzie zostało użyte.")}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500 text-green-500 shrink-0">
                        <ShieldAlert className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-green-400 font-bold text-lg">{t("osintSafe", "BEZPIECZNIE: Hasło nie znalezione w bazie wycieków.")}</p>
                        <p className="text-textMuted mt-1">{t("osintSafeDesc", "Hasło nie figuruje w darmowej bazie HIBP. Pamiętaj jednak o zasadach tworzenia silnych haseł.")}</p>
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
                  <h2 className="font-mono font-bold uppercase tracking-wide">{t("osintDNS", "Rekordy DNS (HackerTarget)")}</h2>
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
                  <h2 className="font-mono font-bold uppercase tracking-wide">{t("osintWhois", "WHOIS / Rejestr (HackerTarget)")}</h2>
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
