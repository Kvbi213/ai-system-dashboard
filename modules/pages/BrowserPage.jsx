import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const BOOKMARKS = [
  {
    id: 'firebase',
    title: 'Firebase',
    url: 'https://console.firebase.google.com/project/void-potato-7721',
    icon: 'local_fire_department',
    color: 'text-primary',
    sub: 'void-potato-7721',
    status: '12 List.'
  },
  {
    id: 'vercel',
    title: 'Vercel Deploy',
    url: 'https://vercel.com/kvbi/ai-system-dashboard/deployments',
    icon: 'change_history',
    color: 'text-secondary',
    sub: 'Prod: Ready',
    status: '14ms'
  },
  {
    id: 'github',
    title: 'GitHub Repo',
    url: 'https://github.com/Kvbi213/ai-system-dashboard',
    icon: 'code_blocks',
    color: 'text-on-surface',
    sub: 'main: passed',
    status: '#a9f4c'
  },
  {
    id: 'librus',
    title: 'Librus Synergia',
    url: 'https://synergia.librus.pl/gateway/portal',
    icon: 'school',
    color: 'text-tertiary',
    sub: 'Portal Edu',
    status: 'Auth OK'
  },
  {
    id: 'brave',
    title: 'Brave Engine',
    url: 'https://search.brave.com',
    icon: 'travel_explore',
    color: 'text-primary-container',
    sub: 'Safe Search',
    status: 'Isolated'
  },
  {
    id: 'cloudflare',
    title: 'Cloudflare',
    url: 'https://dash.cloudflare.com',
    icon: 'cloud_sync',
    color: 'text-secondary',
    sub: 'DNS FRA-01',
    status: 'Proxied'
  }
];

const BrowserPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('cloud_hub'); // 'cloud_hub' | 'web_view'
  const [url, setUrl] = useState('https://search.brave.com');
  const [inputUrl, setInputUrl] = useState('cloud-mesh.internal.omnidash.net/mesh/runtime-telemetry?session=isolated_root');
  const [iframeKey, setIframeKey] = useState(0);

  const handleNavigate = (e) => {
    e.preventDefault();
    let finalUrl = inputUrl.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }
    setUrl(finalUrl);
    setInputUrl(finalUrl);
    setActiveTab('web_view');
  };

  const handleBookmarkClick = (bm) => {
    setUrl(bm.url);
    setInputUrl(bm.url);
    setActiveTab('web_view');
  };

  const reload = () => {
    setIframeKey(prev => prev + 1);
  };

  return (
    <div className="flex flex-col w-full gap-space-lg relative animate-soft-enter">
      {/* Top Header & Omnibar */}
      <section className="flex flex-col gap-space-md">
        <div className="flex flex-wrap items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-outline tracking-wider uppercase">
            <span>OmniDash</span>
            <span className="text-outline-variant">/</span>
            <span>Infrastruktura &amp; Sieć</span>
            <span className="text-outline-variant">/</span>
            <span className="text-primary font-semibold">Przeglądarka &amp; Hub Chmurowy</span>
          </div>

          <div className="flex items-center gap-space-sm">
            <div className="flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-surface-container-low shadow-sm border border-white/[0.04]">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span className="font-code-mono text-label-sm text-on-surface">SANDBOX: STRICT-L4</span>
            </div>
          </div>
        </div>

        {/* Smart Omnibar Input Bar */}
        <div className="flex flex-col md:flex-row items-center gap-space-xs bg-surface-container-low p-space-xs rounded-xl border border-white/[0.04] shadow-md">
          {/* Controls */}
          <div className="flex items-center gap-space-xs pl-space-xs">
            <button
              type="button"
              onClick={() => setActiveTab('cloud_hub')}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors active:scale-95 ${
                activeTab === 'cloud_hub' ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
              title="Hub Architektury Chmurowej"
            >
              <span className="material-symbols-outlined text-[18px]">hub</span>
            </button>
            <button
              type="button"
              onClick={reload}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors active:scale-95"
              title="Przeładuj"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
            </button>
          </div>

          {/* Omnibar Input */}
          <form onSubmit={handleNavigate} className="flex-1 w-full flex items-center gap-space-xs bg-surface-container px-space-md py-space-xs rounded-lg border border-white/[0.04]">
            <span className="material-symbols-outlined text-primary text-[16px]">lock</span>
            <span className="font-code-mono text-label-md text-primary font-semibold select-none">https://</span>
            <input
              id="browser-url-input"
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="w-full bg-transparent font-code-mono text-code-mono text-on-surface focus:outline-none placeholder-outline"
              spellCheck="false"
              placeholder="Wprowadź adres URL lub nazwę hosta..."
            />
            <div className="flex items-center gap-space-xs shrink-0">
              <span className="font-code-mono text-label-sm text-outline px-space-xs py-0.5 rounded bg-surface-container-high hidden md:inline">
                SAMEORIGIN
              </span>
              <button
                type="submit"
                className="text-on-surface-variant hover:text-primary transition-colors flex items-center p-1 active:scale-95"
                title="Przejdź"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </form>

          <div className="flex items-center gap-space-xs pr-space-xs">
            <div className="flex items-center gap-space-xs px-space-sm py-space-xs rounded-lg bg-surface-container-high font-code-mono text-label-sm text-on-surface-variant">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              <span className="hidden md:inline">SQLite Proxy</span>
            </div>
          </div>
        </div>
      </section>

      {/* Bookmarks Deck */}
      <section aria-label="Skróty infrastruktury" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-space-xs">
        {BOOKMARKS.map(bm => (
          <div
            key={bm.id}
            onClick={() => handleBookmarkClick(bm)}
            className="bookmark-card cursor-pointer group flex flex-col p-space-sm rounded-xl bg-surface-container-low hover:bg-surface-container transition-all shadow-sm border border-white/[0.03] active:scale-[0.98]"
          >
            <div className="flex items-center justify-between gap-space-xs mb-space-xs">
              <div className="flex items-center gap-space-xs truncate">
                <div className="w-6 h-6 rounded-md bg-surface-container-highest flex items-center justify-center text-primary">
                  <span className={`material-symbols-outlined text-[14px] ${bm.color}`}>{bm.icon}</span>
                </div>
                <span className="font-label-md text-label-md text-on-surface truncate font-semibold">{bm.title}</span>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
            </div>
            <div className="flex items-center justify-between font-label-sm text-label-sm">
              <span className="text-outline truncate">{bm.sub}</span>
              <span className="font-code-mono text-primary font-medium">{bm.status}</span>
            </div>
          </div>
        ))}
      </section>

      {/* Workspace Viewport: Cloud Hub vs Sandboxed Web View */}
      <div className="flex flex-col w-full bg-surface-container-lowest rounded-xl overflow-hidden shadow-xl border border-white/[0.04] min-h-[600px]">
        {/* Navigation Tabstrip */}
        <div className="flex items-center justify-between px-space-md py-space-xs bg-surface-container-low border-b border-surface-container-high/40">
          <div className="flex items-center gap-space-xs">
            <button
              type="button"
              onClick={() => setActiveTab('cloud_hub')}
              className={`flex items-center gap-space-xs px-space-md py-space-xs rounded-t-lg font-label-sm text-label-sm transition-colors ${
                activeTab === 'cloud_hub'
                  ? 'bg-surface-container-lowest text-primary font-semibold shadow-sm'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">hub</span>
              <span className="font-code-mono font-medium truncate max-w-[200px]">Cloud Arch &amp; Monitor</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('web_view')}
              className={`flex items-center gap-space-xs px-space-md py-space-xs rounded-t-lg font-label-sm text-label-sm transition-colors ${
                activeTab === 'web_view'
                  ? 'bg-surface-container-lowest text-primary font-semibold shadow-sm'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">public</span>
              <span className="font-code-mono truncate max-w-[150px]">Live Web View</span>
            </button>
          </div>

          <div className="flex items-center gap-space-xs font-code-mono text-label-sm text-outline">
            <span className="hidden md:inline">Sandbox Context:</span>
            <span className="px-space-xs py-0.5 rounded bg-surface-container text-primary font-semibold">STRICT-L4</span>
          </div>
        </div>

        {/* Tab 1: Cloud Architecture Dashboard */}
        {activeTab === 'cloud_hub' ? (
          <div className="p-space-lg flex-1 flex flex-col gap-space-lg bg-surface">
            {/* Dashboard Top Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md p-space-md rounded-xl bg-surface-container-low shadow-sm border border-white/[0.04]">
              <div className="flex items-center gap-space-md min-w-0">
                <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-primary shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[24px]">cloud_queue</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-space-xs">
                    <span className="font-headline-md text-headline-md text-on-surface font-semibold truncate">
                      Infrastruktura Hybrydowa v3.0
                    </span>
                    <span className="px-space-xs py-0.5 rounded-full bg-surface-container-high font-code-mono text-label-sm text-primary">
                      FRA-IX Node
                    </span>
                  </div>
                  <span className="font-body-md text-body-md text-on-surface-variant truncate">
                    Zarządzanie sesjami Firestore, regułami security oraz brzegowymi Vercel Lambda
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-space-sm font-code-mono text-label-sm text-on-surface-variant">
                <div className="px-space-sm py-space-xs rounded-lg bg-surface-container flex flex-col items-end border border-white/[0.03]">
                  <span className="text-outline text-label-sm">LATENCY</span>
                  <span className="text-primary font-bold">14.2 ms</span>
                </div>
                <div className="px-space-sm py-space-xs rounded-lg bg-surface-container flex flex-col items-end border border-white/[0.03]">
                  <span className="text-outline text-label-sm">TUNNEL</span>
                  <span className="text-secondary font-bold">mTLS ACTIVE</span>
                </div>
              </div>
            </div>

            {/* 4-Quadrant Infrastructure Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
              {/* Module 1: Firebase Auth & Session Security */}
              <div className="flex flex-col p-space-md rounded-xl bg-surface-container-low shadow-sm gap-space-sm border border-white/[0.03]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-primary text-[18px]">verified_user</span>
                    <span className="font-headline-md text-label-md text-on-surface font-semibold">Firebase Identity &amp; Auth</span>
                  </div>
                  <span className="font-code-mono text-label-sm text-primary bg-surface-container px-space-xs py-0.5 rounded">Enforced</span>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant">Autentykacja biometryczna WebAuthn połączona z lokalnym kluczem operatora hardware.</p>
                <div className="mt-space-xs p-space-sm rounded-lg bg-surface-container space-y-space-xs font-code-mono text-label-sm border border-white/[0.02]">
                  <div className="flex justify-between items-center text-on-surface-variant">
                    <span>Active Token UID:</span>
                    <span className="text-on-surface font-medium truncate max-w-[140px]">usr_k98x21a_root</span>
                  </div>
                  <div className="flex justify-between items-center text-on-surface-variant">
                    <span>Session Rotation:</span>
                    <span className="text-secondary font-medium">co 3600s (Auto)</span>
                  </div>
                  <div className="flex justify-between items-center text-on-surface-variant">
                    <span>Device Fingerprint:</span>
                    <span className="text-primary font-medium">Valid (Windows Desktop Core)</span>
                  </div>
                </div>
              </div>

              {/* Module 2: Firestore Realtime Rules Engine */}
              <div className="flex flex-col p-space-md rounded-xl bg-surface-container-low shadow-sm gap-space-sm border border-white/[0.03]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-secondary text-[18px]">gavel</span>
                    <span className="font-headline-md text-label-md text-on-surface font-semibold">Firestore Rules Audit</span>
                  </div>
                  <span className="font-code-mono text-label-sm text-secondary bg-surface-container px-space-xs py-0.5 rounded">Dry Run Pass</span>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant">Weryfikacja praw dostępu bazy dokumentów w czasie rzeczywistym. Brak wycieków publicznych.</p>
                <div className="mt-space-xs p-space-sm rounded-lg bg-surface-container space-y-space-xs font-code-mono text-label-sm border border-white/[0.02]">
                  <div className="flex justify-between items-center text-on-surface-variant">
                    <span>Rules Version:</span>
                    <span className="text-on-surface font-medium">firestore.rules v2</span>
                  </div>
                  <div className="flex justify-between items-center text-on-surface-variant">
                    <span>Evaluated Queries:</span>
                    <span className="text-primary font-medium">4,289 OK / 0 FAIL</span>
                  </div>
                  <div className="flex justify-between items-center text-on-surface-variant">
                    <span>Write Lockout:</span>
                    <span className="text-tertiary font-medium">Restricted / Strict IP</span>
                  </div>
                </div>
              </div>

              {/* Module 3: Vercel Serverless Function Metrics */}
              <div className="flex flex-col p-space-md rounded-xl bg-surface-container-low shadow-sm gap-space-sm border border-white/[0.03]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-tertiary text-[18px]">bolt</span>
                    <span className="font-headline-md text-label-md text-on-surface font-semibold">Node.js Serverless Edge</span>
                  </div>
                  <span className="font-code-mono text-label-sm text-tertiary bg-surface-container px-space-xs py-0.5 rounded">Zero Cold Starts</span>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant">Rozproszona orkiestracja żądań z mechanizmem pamięci podręcznej edge w węźle FRA-01.</p>
                <div className="mt-space-xs p-space-sm rounded-lg bg-surface-container flex flex-col gap-space-xs border border-white/[0.02]">
                  <div className="flex items-center justify-between font-code-mono text-label-sm">
                    <span className="text-outline">Execution Latency (Last 12 req):</span>
                    <span className="text-tertiary font-semibold">avg 16.4ms</span>
                  </div>
                  <div className="h-8 w-full flex items-end gap-1 pt-1">
                    <div className="flex-1 bg-tertiary-container h-[40%] rounded-xs"></div>
                    <div className="flex-1 bg-tertiary-container h-[55%] rounded-xs"></div>
                    <div className="flex-1 bg-tertiary-container h-[35%] rounded-xs"></div>
                    <div className="flex-1 bg-tertiary-container h-[70%] rounded-xs"></div>
                    <div className="flex-1 bg-tertiary h-[45%] rounded-xs"></div>
                    <div className="flex-1 bg-tertiary h-[60%] rounded-xs"></div>
                    <div className="flex-1 bg-tertiary-container h-[30%] rounded-xs"></div>
                    <div className="flex-1 bg-tertiary h-[85%] rounded-xs"></div>
                    <div className="flex-1 bg-tertiary h-[40%] rounded-xs"></div>
                    <div className="flex-1 bg-tertiary h-[35%] rounded-xs"></div>
                    <div className="flex-1 bg-tertiary h-[50%] rounded-xs"></div>
                    <div className="flex-1 bg-primary h-[30%] rounded-xs animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Module 4: Local Reverse Proxy Tunnel */}
              <div className="flex flex-col p-space-md rounded-xl bg-surface-container-low shadow-sm gap-space-sm border border-white/[0.03]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-primary text-[18px]">alt_route</span>
                    <span className="font-headline-md text-label-md text-on-surface font-semibold">Lokalny Tunel SQLite WAL</span>
                  </div>
                  <span className="font-code-mono text-label-sm text-primary bg-surface-container px-space-xs py-0.5 rounded">127.0.0.1:8787</span>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant">Tunelowanie operacji mutacji offline-first przed asynchronicznym wysłaniem do Firestore.</p>
                <div className="mt-space-xs p-space-sm rounded-lg bg-surface-container space-y-space-xs font-code-mono text-label-sm border border-white/[0.02]">
                  <div className="flex justify-between items-center text-on-surface-variant">
                    <span>WAL Frame Buffer:</span>
                    <span className="text-on-surface font-medium">18 Transakcji</span>
                  </div>
                  <div className="flex justify-between items-center text-on-surface-variant">
                    <span>Dysk I/O Sync:</span>
                    <span className="text-primary font-medium">0.4ms fsync</span>
                  </div>
                  <div className="flex justify-between items-center text-on-surface-variant">
                    <span>Gwarancja ACID:</span>
                    <span className="text-primary font-medium">Full Isolation</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Tab 2: Sandboxed Iframe Web View */
          <div className="w-full flex-1 min-h-[560px] bg-white rounded-b-xl overflow-hidden relative">
            <iframe
              key={iframeKey}
              src={url}
              className="w-full h-full min-h-[560px] border-none"
              title="Embedded Secure Browser"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            />
          </div>
        )}

        {/* Floating Security Inspector Bar (Bottom) */}
        <footer className="p-space-sm bg-surface-container-low flex flex-col xl:flex-row items-start xl:items-center justify-between gap-space-xs font-code-mono text-label-sm text-outline border-t border-surface-container-high/40">
          <div className="flex items-center gap-space-md flex-wrap">
            <div className="flex items-center gap-space-xs">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              <span className="text-on-surface font-semibold">200 OK</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-space-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-[14px] text-primary">lock</span>
              <span>TLS 1.3 Strict</span>
            </div>
            <span>•</span>
            <span className="text-on-surface-variant"><strong className="text-on-surface">CSP:</strong> Enforce</span>
            <span>•</span>
            <span className="text-on-surface-variant"><strong className="text-on-surface">X-Frame:</strong> SAMEORIGIN</span>
            <span>•</span>
            <span className="text-on-surface-variant"><strong className="text-on-surface">Sandbox:</strong> allow-scripts, forms</span>
          </div>
          <div className="flex items-center gap-space-xs text-on-surface-variant bg-surface-container px-space-sm py-0.5 rounded-full border border-white/[0.03]">
            <span className="material-symbols-outlined text-primary text-[14px]">shield</span>
            <span>Izolacja SQLite &amp; Storage: Aktywna</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default BrowserPage;
