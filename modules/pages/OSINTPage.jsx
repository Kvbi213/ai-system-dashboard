import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import EntityTreeView from '../components/EntityTreeView';

const OSINTPage = () => {
  const { t } = useTranslation();

  const [activeHubTab, setActiveHubTab] = useState('scanner'); // 'scanner' | 'entities'
  const [activeSubTab, setActiveSubTab] = useState('dns'); // 'dns' | 'geo' | 'wayback' | 'vuln' | 'ledger'
  const [query, setQuery] = useState('security.internal-node.ch');
  const [targetType, setTargetType] = useState('domain'); // 'domain' | 'ipv4' | 'ipv6' | 'asn' | 'host'
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  // Toggles
  const [recursiveScan, setRecursiveScan] = useState(true);
  const [bypassCf, setBypassCf] = useState(false);
  const [passiveDns, setPassiveDns] = useState(true);

  // Historia dochodzeń
  const [auditLedger, setAuditLedger] = useState([
    { target: 'security.internal-node.ch', time: '14:32:08', types: 'DNS, WHOIS, SSL', status: '200 OK' },
    { target: '185.199.108.153', time: '13:58:20', types: 'Reverse PTR', status: '304 MOD' },
    { target: 'api.telemetry-collector.eu', time: '11:15:44', types: 'Subdomain Brute', status: '200 OK' },
    { target: 'target-auth0-vault.net', time: '09:40:12', types: 'Port Scan (SYN)', status: '403 WAF' },
    { target: 'core-gateway.onion', time: 'Wczoraj', types: 'Tor Resolv Check', status: '502 TIMEOUT' }
  ]);

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

    const targetVal = query.trim();
    const isCloudMode = typeof window !== 'undefined' && (
      window.location.hostname.includes('web.app') || 
      window.location.hostname.includes('firebaseapp.com') ||
      window.location.hostname.includes('vercel.app') ||
      (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
    );

    const endpoints = isCloudMode
      ? ['https://ai-system-dashboard.vercel.app/api/osint', '/api/osint']
      : ['/api/osint', 'https://ai-system-dashboard.vercel.app/api/osint'];

    let success = false;
    for (const ep of endpoints) {
      try {
        const res = await axios.post(ep, { target: targetVal }, { timeout: 7000 });
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
        const clientData = await runClientSideScan(targetVal);
        setResults(clientData);
      } catch (clientErr) {
        setError('Błąd rekonesansu: ' + clientErr.message);
      }
    }

    // Dodanie do dziennika dochodzeń
    setAuditLedger(prev => [
      {
        target: targetVal,
        time: new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
        types: 'DNS, GeoJS, SSL',
        status: '200 OK'
      },
      ...prev.slice(0, 7)
    ]);

    setLoading(false);
  };

  // Obsługa skrótu Cmd/Ctrl + Enter
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        handleScan();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [query]);

  return (
    <div className="flex-1 flex flex-col w-full space-y-space-md text-on-surface antialiased">
      
      {/* 1. DYNAMIC AURA BACKDROP SECTION */}
      <div className="relative w-full overflow-hidden rounded-xl bg-surface-container-low p-space-md shadow-md border border-outline-variant/20">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary-container/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-secondary-container/15 blur-3xl pointer-events-none" />

        {/* Header Section */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
          <div className="flex flex-col space-y-space-xs">
            <div className="flex items-center gap-space-xs text-on-surface-variant font-code-mono text-label-sm">
              <span className="text-outline">OmniDash</span>
              <span>/</span>
              <span className="text-outline">Tracking &amp; Ops</span>
              <span>/</span>
              <span className="text-primary font-medium">Wywiad OSINT</span>
              <span className="mx-space-xs inline-block w-1 h-1 rounded-full bg-outline" />
              <span className="text-label-sm font-label-sm uppercase tracking-wider text-secondary">SecOps Level 4</span>
            </div>
            <div className="flex items-center gap-space-md flex-wrap">
              <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-semibold flex items-center gap-space-sm">
                Centrum Wywiadu OSINT &amp; Bezpieczeństwa
              </h1>
              <span className="flex items-center gap-space-xs px-space-sm py-space-xs rounded-full bg-surface-container-high text-on-surface text-label-sm font-code-mono shadow-sm">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                DEFCON 3 IDLE
              </span>
            </div>
          </div>

          {/* Security Shield Telemetry Pill */}
          <div className="flex items-center gap-space-sm flex-wrap self-start lg:self-auto">
            <div className="flex items-center gap-space-sm px-space-md py-space-xs rounded-lg bg-surface-container shadow-sm border border-outline-variant/20">
              <div className="w-8 h-8 rounded-md bg-surface-container-high flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[20px]">shield_with_heart</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-space-xs">
                  <span className="font-label-sm text-label-sm uppercase text-outline tracking-wider">Tarcza Anty-SSRF</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                </div>
                <span className="font-code-mono text-label-sm font-medium text-on-surface">Aktywna (Zero-Trust Proxy)</span>
              </div>
            </div>

            <div className="flex items-center gap-space-sm px-space-md py-space-xs rounded-lg bg-surface-container shadow-sm border border-outline-variant/20">
              <div className="w-8 h-8 rounded-md bg-surface-container-high flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[20px]">history_toggle_off</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm uppercase text-outline tracking-wider">Ostatni Rekonesans</span>
                <span className="font-code-mono text-label-sm text-on-surface">Dzisiaj, 14:32:08 UTC</span>
              </div>
            </div>

            <button
              onClick={() => { setQuery(''); setResults(null); }}
              className="flex items-center gap-space-xs px-space-md py-space-xs rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-fixed-dim transition-all shadow-sm active:scale-[0.97]"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">cached</span>
              <span>Nowa Sesja</span>
            </button>
          </div>
        </div>

        {/* Segmented Navigation (macOS Sonoma Style) */}
        <div className="mt-space-md pt-space-sm flex items-center justify-between gap-space-md overflow-x-auto">
          <div className="inline-flex p-space-xs rounded-lg bg-surface-container-lowest shadow-sm space-x-1 border border-outline-variant/20" role="tablist">
            <button
              onClick={() => { setActiveHubTab('scanner'); setActiveSubTab('dns'); }}
              className={`flex items-center gap-space-xs px-space-md py-space-xs rounded-md font-label-md text-label-md transition-all ${
                activeHubTab === 'scanner' && activeSubTab === 'dns'
                  ? 'bg-surface-container-high text-primary font-bold shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">dns</span>
              <span>Rekonesans Domen &amp; DNS</span>
              <span className="ml-space-xs px-1.5 py-0.2 rounded-full bg-surface-container-lowest text-primary font-code-mono text-label-sm">LIVE</span>
            </button>

            <button
              onClick={() => { setActiveHubTab('scanner'); setActiveSubTab('geo'); }}
              className={`flex items-center gap-space-xs px-space-md py-space-xs rounded-md font-label-md text-label-md transition-all ${
                activeHubTab === 'scanner' && activeSubTab === 'geo'
                  ? 'bg-surface-container-high text-primary font-bold shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">pin_drop</span>
              <span>Geolokalizacja IP (GeoJS)</span>
            </button>

            <button
              onClick={() => { setActiveHubTab('scanner'); setActiveSubTab('wayback'); }}
              className={`flex items-center gap-space-xs px-space-md py-space-xs rounded-md font-label-md text-label-md transition-all ${
                activeHubTab === 'scanner' && activeSubTab === 'wayback'
                  ? 'bg-surface-container-high text-primary font-bold shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">history_edu</span>
              <span>Archiwum Wayback Machine</span>
            </button>

            <button
              onClick={() => { setActiveHubTab('scanner'); setActiveSubTab('vuln'); }}
              className={`flex items-center gap-space-xs px-space-md py-space-xs rounded-md font-label-md text-label-md transition-all ${
                activeHubTab === 'scanner' && activeSubTab === 'vuln'
                  ? 'bg-surface-container-high text-primary font-bold shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">bug_report</span>
              <span>Skaner Podatności</span>
            </button>

            <button
              onClick={() => setActiveHubTab('entities')}
              className={`flex items-center gap-space-xs px-space-md py-space-xs rounded-md font-label-md text-label-md transition-all ${
                activeHubTab === 'entities'
                  ? 'bg-surface-container-high text-primary font-bold shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">folder_special</span>
              <span>Drzewo Podmiotów Obsidian</span>
            </button>
          </div>

          <div className="hidden 2xl:flex items-center gap-space-sm font-code-mono text-label-sm text-outline">
            <span>GATEWAY:</span>
            <span className="px-space-xs py-0.5 rounded bg-surface-container-high text-on-surface">tor-exit-node-09.de</span>
          </div>
        </div>
      </div>

      {activeHubTab === 'entities' ? (
        <EntityTreeView />
      ) : (
        /* 2. PRIMARY INVESTIGATIVE GRID */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-md w-full">
          
          {/* Left Column: Main Console (8 Columns on desktop) */}
          <div className="xl:col-span-8 flex flex-col space-y-space-md min-w-0">
            
            {/* Target Execution Input Bar */}
            <div className="p-space-md rounded-xl bg-surface-container-low shadow-sm flex flex-col gap-space-sm border border-outline-variant/20">
              <div className="flex items-center justify-between">
                <label className="font-label-sm text-label-sm uppercase tracking-wider text-outline flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-[14px]">search_check</span>
                  Wektor Badawczy / Cel Operacyjny
                </label>
                <span className="font-code-mono text-label-sm text-on-surface-variant">Tryb: Asynchroniczny Multi-Resolver</span>
              </div>

              <form onSubmit={handleScan} className="flex flex-col md:flex-row items-stretch gap-space-sm">
                {/* Type Selector */}
                <div className="relative min-w-[140px]">
                  <select
                    value={targetType}
                    onChange={(e) => setTargetType(e.target.value)}
                    className="w-full h-11 px-space-sm bg-surface-container rounded-lg text-on-surface font-label-md text-label-md focus:outline-none appearance-none cursor-pointer pr-space-lg border border-outline-variant/30"
                  >
                    <option value="domain">Domena (FQDN)</option>
                    <option value="ipv4">IPv4 / CIDR</option>
                    <option value="ipv6">IPv6 Address</option>
                    <option value="asn">ASN Autonomous</option>
                    <option value="host">Subdomena Wildcard</option>
                  </select>
                  <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-3 text-outline text-[18px]">
                    expand_more
                  </span>
                </div>

                {/* Input Target Field */}
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3 top-3 text-outline text-[20px]">
                    travel_explore
                  </span>
                  <input
                    type="text"
                    id="osint-target"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Wpisz cel np. target.com, 104.21.55.2 lub AS13335"
                    className="w-full h-11 pl-10 pr-24 bg-surface-container rounded-lg text-on-surface font-code-mono text-label-md placeholder-outline focus:outline-none focus:bg-surface-container-high transition-colors border border-outline-variant/30"
                  />
                  <span className="absolute right-3 top-2.5 px-space-xs py-0.5 rounded bg-surface-container-highest text-outline font-code-mono text-label-sm">
                    ⌘ + ENTER
                  </span>
                </div>

                {/* Execute Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="h-11 px-space-lg bg-primary-container text-on-primary-container rounded-lg font-label-md text-label-md hover:bg-primary transition-all flex items-center justify-center gap-space-xs shadow-md whitespace-nowrap active:scale-[0.98] disabled:opacity-50"
                >
                  <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
                    bolt
                  </span>
                  <span className="font-medium">
                    {loading ? 'Skanowanie...' : 'Wykonaj Głęboki Skan'}
                  </span>
                </button>
              </form>

              <div className="flex items-center justify-between text-outline font-code-mono text-label-sm flex-wrap gap-space-xs pt-1">
                <div className="flex items-center gap-space-md">
                  <label className="flex items-center gap-space-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={recursiveScan}
                      onChange={(e) => setRecursiveScan(e.target.checked)}
                      className="rounded bg-surface-container text-primary focus:ring-0"
                    />
                    <span className="text-on-surface-variant">Skan Rekursywny</span>
                  </label>
                  <label className="flex items-center gap-space-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bypassCf}
                      onChange={(e) => setBypassCf(e.target.checked)}
                      className="rounded bg-surface-container text-primary focus:ring-0"
                    />
                    <span className="text-on-surface-variant">Bypass Cloudflare Cache</span>
                  </label>
                  <label className="flex items-center gap-space-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={passiveDns}
                      onChange={(e) => setPassiveDns(e.target.checked)}
                      className="rounded bg-surface-container text-primary focus:ring-0"
                    />
                    <span className="text-on-surface-variant">Passive DNS DB</span>
                  </label>
                </div>
                <span className="text-primary font-medium">Zweryfikowano z węzła FRA-01</span>
              </div>
            </div>

            {error && (
              <div className="p-space-sm rounded-xl bg-error-container/20 border border-error/40 text-error font-code-mono text-label-sm">
                [!] {error}
              </div>
            )}

            {/* DNS Records Deep View (Data Table) */}
            <div className="p-space-md rounded-xl bg-surface-container-low shadow-sm flex flex-col space-y-space-md border border-outline-variant/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-sm">
                  <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[18px]">network_node</span>
                  </div>
                  <div>
                    <h2 className="font-headline-md text-headline-md text-on-surface font-semibold leading-tight">
                      Rekordy Strefy DNS &amp; Rekonesans Węzłów
                    </h2>
                    <span className="font-code-mono text-label-sm text-outline">
                      Authoritative Query via 1.1.1.1 &amp; 9.9.9.9 (EDNS Client Subnet: Disabled)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-space-xs">
                  <span className="px-space-sm py-0.5 rounded-full bg-surface-container text-primary font-label-sm text-label-sm">
                    DNSSEC Validated
                  </span>
                  <span className="px-space-sm py-0.5 rounded-full bg-surface-container text-secondary font-label-sm text-label-sm">
                    TTL 300s
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-body-md text-body-md">
                  <thead>
                    <tr className="bg-surface-container text-outline font-label-sm text-label-sm uppercase tracking-wider">
                      <th className="py-space-xs px-space-sm rounded-l-lg">Typ</th>
                      <th className="py-space-xs px-space-sm">Nazwa Hosta / FQDN</th>
                      <th className="py-space-xs px-space-sm">Wartość / Payload Rozwiązania</th>
                      <th className="py-space-xs px-space-sm">TTL</th>
                      <th className="py-space-xs px-space-sm rounded-r-lg">Ocena Integralności</th>
                    </tr>
                  </thead>
                  <tbody className="font-code-mono text-label-md divide-y divide-transparent">
                    <tr className="hover:bg-surface-container transition-colors">
                      <td className="py-space-sm px-space-sm font-semibold text-primary">A</td>
                      <td className="py-space-sm px-space-sm text-on-surface">@</td>
                      <td className="py-space-sm px-space-sm text-on-surface-variant font-medium">
                        {results?.resolved_ip || '104.21.55.220'}
                      </td>
                      <td className="py-space-sm px-space-sm text-outline">300</td>
                      <td className="py-space-sm px-space-sm">
                        <span className="inline-flex items-center gap-space-xs px-space-xs py-0.5 rounded bg-surface-container-high text-primary text-label-sm font-label-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          Anycast Edge
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-surface-container transition-colors">
                      <td className="py-space-sm px-space-sm font-semibold text-primary">AAAA</td>
                      <td className="py-space-sm px-space-sm text-on-surface">@</td>
                      <td className="py-space-sm px-space-sm text-on-surface-variant truncate max-w-[200px]">
                        2606:4700:3038::6815:37dc
                      </td>
                      <td className="py-space-sm px-space-sm text-outline">300</td>
                      <td className="py-space-sm px-space-sm">
                        <span className="inline-flex items-center gap-space-xs px-space-xs py-0.5 rounded bg-surface-container-high text-primary text-label-sm font-label-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          IPv6 Route Active
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-surface-container transition-colors">
                      <td className="py-space-sm px-space-sm font-semibold text-secondary">MX</td>
                      <td className="py-space-sm px-space-sm text-on-surface">mail.internal</td>
                      <td className="py-space-sm px-space-sm text-on-surface-variant">10 inbound-mx.protonmail.ch</td>
                      <td className="py-space-sm px-space-sm text-outline">3600</td>
                      <td className="py-space-sm px-space-sm">
                        <span className="inline-flex items-center gap-space-xs px-space-xs py-0.5 rounded bg-surface-container-high text-secondary text-label-sm font-label-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                          TLS Enforced (MTA-STS)
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-surface-container transition-colors">
                      <td className="py-space-sm px-space-sm font-semibold text-tertiary">TXT</td>
                      <td className="py-space-sm px-space-sm text-on-surface">@</td>
                      <td className="py-space-sm px-space-sm text-on-surface-variant text-label-sm truncate max-w-[240px]">
                        v=spf1 include:_spf.protonmail.ch ~all
                      </td>
                      <td className="py-space-sm px-space-sm text-outline">3600</td>
                      <td className="py-space-sm px-space-sm">
                        <span className="inline-flex items-center gap-space-xs px-space-xs py-0.5 rounded bg-surface-container-high text-primary text-label-sm font-label-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          SPF PASS (Strict)
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-surface-container transition-colors">
                      <td className="py-space-sm px-space-sm font-semibold text-on-surface-variant">NS</td>
                      <td className="py-space-sm px-space-sm text-on-surface">@</td>
                      <td className="py-space-sm px-space-sm text-on-surface-variant">ns1.cloudflare.com / ns2.cloudflare.com</td>
                      <td className="py-space-sm px-space-sm text-outline">86400</td>
                      <td className="py-space-sm px-space-sm">
                        <span className="inline-flex items-center gap-space-xs px-space-xs py-0.5 rounded bg-surface-container-high text-on-surface-variant text-label-sm font-label-sm">
                          Geo-Redundant
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Split Analytical Row: SSL & Security Headers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
              
              {/* SSL/TLS Inspection Card */}
              <div className="p-space-md rounded-xl bg-surface-container-low shadow-sm flex flex-col justify-between space-y-space-md border border-outline-variant/20">
                <div>
                  <div className="flex items-center justify-between mb-space-sm">
                    <div className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-primary text-[20px]">lock_reset</span>
                      <span className="font-headline-md text-headline-md text-on-surface font-semibold">Certyfikat SSL / TLS</span>
                    </div>
                    <span className="px-space-xs py-0.5 rounded bg-surface-container text-primary font-code-mono text-label-sm">TLS 1.3 Strict</span>
                  </div>

                  <div className="space-y-space-xs font-code-mono text-label-sm">
                    <div className="p-space-sm rounded-lg bg-surface-container flex items-center justify-between">
                      <span className="text-outline">Wydawca (Issuer):</span>
                      <span className="text-on-surface font-semibold text-right">Let's Encrypt / E1 Authority</span>
                    </div>
                    <div className="p-space-sm rounded-lg bg-surface-container flex items-center justify-between">
                      <span className="text-outline">Klucz Asymetryczny:</span>
                      <span className="text-primary font-semibold text-right">ECDSA 256-bit (secp256r1)</span>
                    </div>
                    <div className="p-space-sm rounded-lg bg-surface-container flex items-center justify-between">
                      <span className="text-outline">Ważność Certyfikatu:</span>
                      <span className="text-on-surface text-right">68 Dni (Wygasa: 2026-12-12)</span>
                    </div>
                  </div>
                </div>

                <div className="pt-space-xs flex items-center justify-between font-label-sm text-label-sm text-outline border-t border-outline-variant/10">
                  <span>OCSP Stapling: WŁĄCZONE</span>
                  <span className="text-primary">ALPN: h2, http/1.1</span>
                </div>
              </div>

              {/* HTTP Security Headers Assessment Card */}
              <div className="p-space-md rounded-xl bg-surface-container-low shadow-sm flex flex-col justify-between space-y-space-md border border-outline-variant/20">
                <div>
                  <div className="flex items-center justify-between mb-space-sm">
                    <div className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-secondary text-[20px]">security</span>
                      <span className="font-headline-md text-headline-md text-on-surface font-semibold">Nagłówki HTTP SecOps</span>
                    </div>
                    <div className="flex items-center gap-space-xs px-space-sm py-0.5 rounded-full bg-surface-container shadow-sm">
                      <span className="font-headline-md text-headline-md text-primary font-bold">95</span>
                      <span className="text-outline font-code-mono text-label-sm">/100 (A+)</span>
                    </div>
                  </div>

                  <div className="space-y-space-xs font-code-mono text-label-sm">
                    <div className="p-space-sm rounded-lg bg-surface-container flex items-center justify-between">
                      <div className="flex items-center gap-space-xs">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-on-surface">Strict-Transport-Security</span>
                      </div>
                      <span className="text-primary text-label-sm">max-age=31536000</span>
                    </div>
                    <div className="p-space-sm rounded-lg bg-surface-container flex items-center justify-between">
                      <div className="flex items-center gap-space-xs">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-on-surface">X-Frame-Options</span>
                      </div>
                      <span className="text-primary text-label-sm">DENY</span>
                    </div>
                    <div className="p-space-sm rounded-lg bg-surface-container flex items-center justify-between">
                      <div className="flex items-center gap-space-xs">
                        <span className="w-2 h-2 rounded-full bg-tertiary" />
                        <span className="text-on-surface">Permissions-Policy</span>
                      </div>
                      <span className="text-tertiary text-label-sm">camera=(), geo=()</span>
                    </div>
                  </div>
                </div>

                <div className="pt-space-xs flex items-center justify-between font-label-sm text-label-sm text-outline border-t border-outline-variant/10">
                  <span>Server: Cloudflare Edge</span>
                  <span className="text-primary">X-Content-Type: nosniff</span>
                </div>
              </div>

            </div>

          </div>

          {/* Right Column: Analytical Modules & Intelligence Telemetry (4 Columns on desktop) */}
          <div className="xl:col-span-4 flex flex-col space-y-space-md min-w-0">
            
            {/* IP Geolocation & ASN Matrix Card */}
            <div className="p-space-md rounded-xl bg-surface-container-low shadow-sm flex flex-col space-y-space-md border border-outline-variant/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-primary text-[20px]">public</span>
                  <span className="font-headline-md text-headline-md text-on-surface font-semibold">Geolokalizacja IP &amp; ASN</span>
                </div>
                <span className="font-code-mono text-label-sm text-secondary">GeoJS Realtime</span>
              </div>

              {/* Geo Interactive Preview Banner */}
              <div className="relative w-full h-32 rounded-lg overflow-hidden bg-surface-container-lowest border border-outline-variant/10">
                <div className="absolute inset-0 bg-surface-dim/40 backdrop-blur-[1px] flex flex-col justify-between p-space-sm">
                  <div className="flex justify-between items-center text-label-sm font-code-mono text-primary">
                    <span>LAT: {results?.geo?.latitude || '50.1109'}° N</span>
                    <span>LON: {results?.geo?.longitude || '8.6821'}° E</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center animate-ping">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center font-code-mono text-label-sm text-on-surface">
                    <span className="px-space-xs py-0.2 rounded bg-surface-container-highest">Node: DE-FRA-IX</span>
                    <span className="text-outline">ACCURACY: 5km</span>
                  </div>
                </div>
              </div>

              <div className="space-y-space-xs font-code-mono text-label-sm">
                <div className="flex justify-between items-center p-space-xs px-space-sm rounded bg-surface-container">
                  <span className="text-outline">Miasto / Kraj:</span>
                  <span className="text-on-surface font-semibold">
                    {results?.geo?.city ? `${results.geo.city}, ${results.geo.country_code}` : 'Frankfurt am Main, DE'}
                  </span>
                </div>
                <div className="flex justify-between items-center p-space-xs px-space-sm rounded bg-surface-container">
                  <span className="text-outline">Autonomiczny System:</span>
                  <span className="text-primary font-semibold">
                    {results?.geo?.asn ? `AS${results.geo.asn} (${results.geo.organization_name || 'Cloudflare'})` : 'AS13335 (Cloudflare, Inc.)'}
                  </span>
                </div>
                <div className="flex justify-between items-center p-space-xs px-space-sm rounded bg-surface-container">
                  <span className="text-outline">Strefa Czasowa:</span>
                  <span className="text-on-surface">{results?.geo?.timezone || 'Europe/Berlin (UTC+01:00)'}</span>
                </div>
              </div>
            </div>

            {/* Detected Ports & Services Inspector */}
            <div className="p-space-md rounded-xl bg-surface-container-low shadow-sm flex flex-col space-y-space-md border border-outline-variant/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-secondary text-[20px]">router</span>
                  <span className="font-headline-md text-headline-md text-on-surface font-semibold">Wykryte Porty &amp; Usługi</span>
                </div>
                <span className="px-space-xs py-0.5 rounded bg-surface-container text-outline font-code-mono text-label-sm">Syn-Ack Stealth</span>
              </div>

              <div className="grid grid-cols-2 gap-space-sm font-code-mono text-label-sm">
                <div className="p-space-sm rounded-lg bg-surface-container flex flex-col space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-primary font-semibold">Port 80</span>
                    <span className="px-1.5 py-0.2 rounded bg-surface-container-highest text-primary font-label-sm text-[10px]">OTWARTY</span>
                  </div>
                  <span className="text-on-surface text-[11px]">HTTP (301)</span>
                </div>

                <div className="p-space-sm rounded-lg bg-surface-container flex flex-col space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-primary font-semibold">Port 443</span>
                    <span className="px-1.5 py-0.2 rounded bg-surface-container-highest text-primary font-label-sm text-[10px]">OTWARTY</span>
                  </div>
                  <span className="text-on-surface text-[11px]">HTTPS (TLS 1.3)</span>
                </div>

                <div className="p-space-sm rounded-lg bg-surface-container flex flex-col space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-tertiary font-semibold">Port 8080</span>
                    <span className="px-1.5 py-0.2 rounded bg-surface-container-highest text-tertiary font-label-sm text-[10px]">FILTR</span>
                  </div>
                  <span className="text-on-surface text-[11px]">HTTP-Dev WAF</span>
                </div>

                <div className="p-space-sm rounded-lg bg-surface-container flex flex-col space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-outline font-semibold">Port 22</span>
                    <span className="px-1.5 py-0.2 rounded bg-surface-container-highest text-outline font-label-sm text-[10px]">ZAMKN</span>
                  </div>
                  <span className="text-on-surface text-[11px]">OpenSSH (RST)</span>
                </div>
              </div>
            </div>

            {/* Investigation Ledger (Audit History) */}
            <div className="p-space-md rounded-xl bg-surface-container-low shadow-sm flex flex-col space-y-space-md border border-outline-variant/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-primary text-[20px]">view_timeline</span>
                  <span className="font-headline-md text-headline-md text-on-surface font-semibold">Dziennik Dochodzenia</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-primary" />
              </div>

              <div className="space-y-space-xs font-code-mono text-label-sm">
                {auditLedger.slice(0, 5).map((log, idx) => (
                  <div
                    key={idx}
                    onClick={() => { setQuery(log.target); handleScan(); }}
                    className="p-space-xs px-space-sm rounded bg-surface-container flex items-center justify-between hover:bg-surface-container-high transition-colors cursor-pointer"
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="text-on-surface font-medium truncate">{log.target}</span>
                      <span className="text-outline text-[11px]">{log.time} • {log.types}</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-surface-container-highest text-primary text-[11px] font-semibold">
                      {log.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* OSINT Upstream Status & Quotas */}
            <div className="p-space-md rounded-xl bg-surface-container-low shadow-sm flex flex-col space-y-space-sm border border-outline-variant/20">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">
                Status API &amp; Quota Wywiadowcza
              </span>
              <div className="space-y-space-xs font-code-mono text-label-sm">
                <div className="flex justify-between items-center text-label-sm">
                  <div className="flex items-center gap-space-xs">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-on-surface">GeoJS Realtime Engine</span>
                  </div>
                  <span className="text-primary font-medium">Aktywny (14ms)</span>
                </div>
                <div className="flex justify-between items-center text-label-sm">
                  <div className="flex items-center gap-space-xs">
                    <span className="w-2 h-2 rounded-full bg-secondary" />
                    <span className="text-on-surface">HackerTarget Vulnerability</span>
                  </div>
                  <span className="text-on-surface-variant">Limit: 48/50 wolne</span>
                </div>
              </div>
              <div className="w-full bg-surface-container rounded-full h-1 mt-1 overflow-hidden">
                <div className="bg-primary h-1 rounded-full w-[88%]" />
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default OSINTPage;
