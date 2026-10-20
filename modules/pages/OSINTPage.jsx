import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import axios from 'axios';
import { 
  Search, ShieldAlert, Globe, Crosshair, MapPin, Database, Clock, 
  Server, FileText, FolderTree, Network, ShieldCheck, Radar, Radio, Lock, CheckCircle2, ChevronRight
} from 'lucide-react';
import EntityTreeView from '../components/EntityTreeView';

const OSINTPage = () => {
  const { t } = useTranslation();

  const [activeHubTab, setActiveHubTab] = useState('scanner'); // 'scanner' | 'entities'
  const [query, setQuery] = useState('');
  const [targetType, setTargetType] = useState('FQDN'); // 'FQDN' | 'IP' | 'ASN'
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  // Toggles
  const [recursiveScan, setRecursiveScan] = useState(true);
  const [bypassCf, setBypassCf] = useState(false);
  const [passiveDns, setPassiveDns] = useState(true);

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
    if (e) e.preventDefault();
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
    <div className="flex-1 flex flex-col h-full overflow-y-auto min-w-0 bg-background text-on-surface custom-scrollbar pb-24 md:pb-8">
      <div className="flex flex-col w-full space-y-4 md:space-y-6">

        {/* 1. TOP STRIP / BREADCRUMBS & ACTIONS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 font-mono text-xs text-outline">
              <span>OmniDash</span>
              <span>/</span>
              <span>Tracking & Ops</span>
              <span>/</span>
              <span className="text-primary font-medium">Centrum Wywiadu OSINT</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="font-sans text-xl md:text-2xl font-bold text-on-surface tracking-tight">
                Centrum Wywiadu OSINT & Graf Podmiotów
              </h1>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary font-mono text-xs shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span>SecOps Level 4 Active</span>
              </div>
            </div>
          </div>

          {/* Hub Mode Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-surface-container-low border border-border/60 self-start md:self-auto font-mono text-xs">
            <button
              onClick={() => setActiveHubTab('scanner')}
              className={`min-h-[38px] flex items-center gap-2 px-3.5 rounded-lg transition-all font-semibold ${
                activeHubTab === 'scanner'
                  ? 'bg-surface-container-high text-primary shadow-sm font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Radar className="w-3.5 h-3.5 text-primary" />
              <span>Skaner OSINT</span>
            </button>
            <button
              onClick={() => setActiveHubTab('entities')}
              className={`min-h-[38px] flex items-center gap-2 px-3.5 rounded-lg transition-all font-semibold ${
                activeHubTab === 'entities'
                  ? 'bg-surface-container-high text-primary shadow-sm font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5 text-secondary" />
              <span>Drzewo Podmiotów</span>
            </button>
          </div>
        </div>

        {activeHubTab === 'entities' ? (
          <EntityTreeView />
        ) : (
          <>
            {/* 2. TOP SECURITY & SECOPS STATUS BAR */}
            <div className="rounded-xl bg-surface-container-low p-4 border border-border/60 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-border/60 flex items-center justify-center text-primary">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-primary font-bold uppercase tracking-wider">
                      SECOPS LEVEL 4 ACTIVE
                    </span>
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-surface-container text-outline">
                      DEFCON 3 IDLE
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-on-surface-variant mt-0.5 block">
                    Zero-Trust Gateway • Anty-SSRF Filtry Węzła • Skanowanie Pasywne & Aktywne
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs text-outline self-start sm:self-auto">
                <Clock className="w-3.5 h-3.5" />
                <span>Ostatnia migracja: 14:32 UTC</span>
              </div>
            </div>

            {/* 3. INVESTIGATIVE INPUT & TARGET BAR */}
            <div className="rounded-xl bg-surface-container p-4 sm:p-5 border border-border/60 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="font-mono text-xs text-outline uppercase tracking-wider">
                  Cel Badania (Target Identifier)
                </label>
                <div className="flex items-center gap-1 bg-surface-container-lowest p-1 rounded-lg border border-border/60 font-mono text-xs">
                  {['FQDN', 'IP', 'ASN'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTargetType(t)}
                      className={`px-3 py-1 rounded transition-colors ${
                        targetType === t ? 'bg-surface-container-high text-primary font-bold shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleScan} className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Globe className="w-4 h-4 text-outline absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={
                      targetType === 'IP' 
                        ? 'Wprowadź adres IPv4/IPv6 (np. 1.1.1.1)...' 
                        : targetType === 'ASN' 
                        ? 'Wprowadź identyfikator ASN (np. AS13335)...' 
                        : 'Wprowadź domenę FQDN (np. security.omnidash.net lub google.com)...'
                    }
                    className="w-full min-h-[44px] pl-10 pr-4 rounded-lg bg-surface-container-lowest border border-border text-on-surface font-mono text-xs focus:outline-none focus:border-primary shadow-inner"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="min-h-[44px] px-6 rounded-lg bg-primary text-on-primary font-mono text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md active:scale-95"
                >
                  <Radar className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>{loading ? '[~] SKANOWANIE...' : 'Wykonaj Głęboki Skan (FRA-01)'}</span>
                </button>
              </form>

              {/* Toggle Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar touch-pan-x pt-1">
                <button
                  type="button"
                  onClick={() => setRecursiveScan(!recursiveScan)}
                  className={`min-h-[38px] px-3.5 rounded-full font-mono text-xs flex items-center gap-2 transition-all shrink-0 ${
                    recursiveScan 
                      ? 'bg-surface-container-high border border-primary/40 text-on-surface' 
                      : 'bg-surface-container-lowest text-outline border border-border/40'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${recursiveScan ? 'bg-primary' : 'bg-outline'}`} />
                  <span>Skan Rekursywny</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBypassCf(!bypassCf)}
                  className={`min-h-[38px] px-3.5 rounded-full font-mono text-xs flex items-center gap-2 transition-all shrink-0 ${
                    bypassCf 
                      ? 'bg-surface-container-high border border-primary/40 text-on-surface' 
                      : 'bg-surface-container-lowest text-outline border border-border/40'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${bypassCf ? 'bg-primary' : 'bg-outline'}`} />
                  <span>Bypass Cloudflare WAF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPassiveDns(!passiveDns)}
                  className={`min-h-[38px] px-3.5 rounded-full font-mono text-xs flex items-center gap-2 transition-all shrink-0 ${
                    passiveDns 
                      ? 'bg-surface-container-high border border-primary/40 text-on-surface' 
                      : 'bg-surface-container-lowest text-outline border border-border/40'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${passiveDns ? 'bg-primary' : 'bg-outline'}`} />
                  <span>Passive DNS & History</span>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 font-mono text-xs flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {/* 4. SCAN RESULTS PANELS */}
            {results && (
              <div className="space-y-4 animate-fade-in">
                {/* Result Target Indicator */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs px-3 py-1 rounded-full bg-surface-container text-on-surface border border-border">
                    CEL: <span className="text-primary font-bold">{results.target_value}</span> ({results.target_type})
                  </span>
                  {results.resolved_ip && (
                    <span className="font-mono text-xs px-3 py-1 rounded-full bg-surface-container text-on-surface border border-border">
                      Rozwiązane IP: <span className="text-secondary font-bold">{results.resolved_ip}</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  
                  {/* GeoJS */}
                  {results.geo && (
                    <div className="p-4 rounded-xl bg-surface-container border border-border/60 shadow-sm flex flex-col justify-between">
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/40 text-primary">
                        <MapPin className="w-4 h-4" />
                        <h3 className="font-mono text-xs font-bold uppercase tracking-wide">Geolokalizacja Węzła</h3>
                      </div>
                      <div className="space-y-2 font-mono text-xs">
                        <div className="flex justify-between border-b border-border/30 pb-1">
                          <span className="text-outline">IP:</span> 
                          <span className="text-on-surface">{results.geo.ip}</span>
                        </div>
                        <div className="flex justify-between border-b border-border/30 pb-1">
                          <span className="text-outline">Kraj:</span> 
                          <span className="text-on-surface">{results.geo.country}</span>
                        </div>
                        <div className="flex justify-between border-b border-border/30 pb-1">
                          <span className="text-outline">Miasto:</span> 
                          <span className="text-on-surface">{results.geo.city || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between border-b border-border/30 pb-1">
                          <span className="text-outline">Organizacja:</span> 
                          <span className="text-on-surface text-right pl-2 truncate">{results.geo.organization_name || results.geo.organization || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-outline">Współrzędne:</span> 
                          <span className="text-on-surface">{results.geo.latitude}, {results.geo.longitude}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Wayback Machine */}
                  {results.wayback && (
                    <div className="p-4 rounded-xl bg-surface-container border border-border/60 shadow-sm flex flex-col justify-between">
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/40 text-primary">
                        <Clock className="w-4 h-4" />
                        <h3 className="font-mono text-xs font-bold uppercase tracking-wide">Wayback Machine Archive</h3>
                      </div>
                      <div className="space-y-2 font-mono text-xs">
                        {results.wayback.archived_snapshots?.closest?.available ? (
                          <>
                            <div className="flex items-center gap-2 text-emerald-400 mb-2">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Znaleziono historyczny snapshot</span>
                            </div>
                            <div className="flex justify-between border-b border-border/30 pb-1">
                              <span className="text-outline">Ostatni zrzut:</span>
                              <span className="text-on-surface">{results.wayback.archived_snapshots.closest.timestamp.substring(0,8)}</span>
                            </div>
                            <div className="pt-2">
                              <a 
                                href={results.wayback.archived_snapshots.closest.url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="min-h-[38px] flex items-center justify-center w-full py-2 bg-primary/15 text-primary rounded-lg border border-primary/30 hover:bg-primary/25 font-bold transition-colors"
                              >
                                {"[>]"} Otwórz Archiwum Zrzutu
                              </a>
                            </div>
                          </>
                        ) : (
                          <p className="text-outline flex items-center gap-2 py-4">
                            <Globe className="w-4 h-4" />
                            <span>Brak danych historycznych w Archive.org</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* HIBP Leak Checker */}
                  {results.hibp !== undefined && (
                    <div className="p-4 rounded-xl bg-surface-container border border-border/60 shadow-sm md:col-span-2 lg:col-span-3">
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/40 text-tertiary">
                        <ShieldAlert className="w-4 h-4" />
                        <h3 className="font-mono text-xs font-bold uppercase tracking-wide">Baza Wycieków Poświadczeń (HIBP)</h3>
                      </div>
                      <div className="font-mono text-xs bg-surface-container-lowest p-4 rounded-lg border border-border/40">
                        {results.hibp > 0 ? (
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-rose-500/20 rounded-full flex items-center justify-center border border-rose-500 text-rose-400 shrink-0">
                              <ShieldAlert className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-rose-400 font-bold text-sm">
                                [!] KRYTYCZNE: Hasło wyciekło {results.hibp} razy w bazach Breach Compilation!
                              </p>
                              <p className="text-outline mt-1">
                                Wskazany ciąg figuruje w publicznych wyciekach. Zalecana natychmiastowa rotacja kluczy.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500 text-emerald-400 shrink-0">
                              <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-emerald-400 font-bold text-sm">
                                [OK] BEZPIECZNIE: Ciąg nie został odnaleziony w publicznych wyciekach HIBP.
                              </p>
                              <p className="text-outline mt-1">
                                Hash SHA-1 nie pokrywa się z rejestrem Pwned Passwords.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* DNS Records */}
                  {results.dns && (
                    <div className="p-4 rounded-xl bg-surface-container border border-border/60 shadow-sm md:col-span-2 lg:col-span-3 flex flex-col h-80">
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/40 text-primary shrink-0">
                        <Server className="w-4 h-4" />
                        <h3 className="font-mono text-xs font-bold uppercase tracking-wide">Rekordy DNS & Strefy (HackerTarget)</h3>
                      </div>
                      <pre className="text-[11px] text-emerald-400 font-mono whitespace-pre-wrap bg-surface-container-lowest p-3 rounded-lg overflow-y-auto custom-scrollbar flex-1 border border-border/40">
                        {results.dns}
                      </pre>
                    </div>
                  )}

                  {/* WHOIS Records */}
                  {results.whois && (
                    <div className="p-4 rounded-xl bg-surface-container border border-border/60 shadow-sm md:col-span-2 lg:col-span-3 flex flex-col h-96">
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/40 text-primary shrink-0">
                        <FileText className="w-4 h-4" />
                        <h3 className="font-mono text-xs font-bold uppercase tracking-wide">Rejestr WHOIS & Autonomia ASN</h3>
                      </div>
                      <pre className="text-[11px] text-on-surface-variant font-mono whitespace-pre-wrap bg-surface-container-lowest p-3 rounded-lg overflow-y-auto custom-scrollbar flex-1 border border-border/40">
                        {results.whois}
                      </pre>
                    </div>
                  )}

                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};

export default OSINTPage;
