import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import EntityTreeView from '../components/EntityTreeView';

const EntitiesPage = () => {
  const { t } = useTranslation();
  const [activeView, setActiveView] = useState('tree'); // 'graph' | 'tree' | 'matrix' | 'domains'

  return (
    <div className="flex-1 flex flex-col w-full space-y-space-lg text-on-surface antialiased max-w-full overflow-x-hidden">
      
      {/* 1. TOP AMBIENT GLOW BACKDROP & HEADER */}
      <div className="relative w-full">
        <div className="absolute -top-12 left-1/4 w-96 h-48 bg-primary-container/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-10 w-80 h-36 bg-secondary-container/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col xl:flex-row xl:items-end justify-between gap-space-md pb-space-sm">
          <div className="flex flex-col space-y-space-xs">
            <div className="flex items-center gap-space-xs font-code-mono text-label-sm text-outline">
              <span className="hover:text-primary transition-colors cursor-pointer">OmniDash</span>
              <span>/</span>
              <span className="hover:text-primary transition-colors cursor-pointer">Tracking &amp; Ops</span>
              <span>/</span>
              <span className="text-primary font-medium">Podmioty &amp; Relacje</span>
            </div>
            <div className="flex items-baseline gap-space-md flex-wrap">
              <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-semibold">
                Rejestr Podmiotów, Graf Relacji &amp; Matrix 120m²
              </h1>
              <span className="font-code-mono text-code-mono text-secondary px-space-sm py-0.5 rounded-full bg-secondary-container/30 border border-secondary/20">
                SCHEMA v3.4.1
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
              Wielowymiarowy system kartotek relacyjnych bazujący na grafie powiązań Obsidian. Czasoprzestrzenny rejestr lokacji 120m², psychometryka oraz protokoły wymiany wiedzy.
            </p>
          </div>

          {/* Action Panel & View Selector (Sonoma Segmented) */}
          <div className="flex flex-wrap items-center gap-space-sm self-start xl:self-end">
            <div className="flex items-center p-1 rounded-lg bg-surface-container-lowest border border-outline-variant/30 overflow-x-auto max-w-full custom-scrollbar">
              <button
                onClick={() => setActiveView('graph')}
                className={`px-space-md py-1.5 rounded-lg font-label-md text-label-md transition-all flex items-center gap-space-xs ${
                  activeView === 'graph'
                    ? 'bg-surface-container-high text-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">share</span>
                <span>Graf Powiązań</span>
              </button>
              <button
                onClick={() => setActiveView('tree')}
                className={`px-space-md py-1.5 rounded-lg font-label-md text-label-md transition-all flex items-center gap-space-xs ${
                  activeView === 'tree'
                    ? 'bg-surface-container-high text-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">account_tree</span>
                <span>Drzewo</span>
              </button>
              <button
                onClick={() => setActiveView('matrix')}
                className={`px-space-md py-1.5 rounded-lg font-label-md text-label-md transition-all flex items-center gap-space-xs ${
                  activeView === 'matrix'
                    ? 'bg-surface-container-high text-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">apartment</span>
                <span>Matryca 120m²</span>
              </button>
              <button
                onClick={() => setActiveView('domains')}
                className={`px-space-md py-1.5 rounded-lg font-label-md text-label-md transition-all flex items-center gap-space-xs ${
                  activeView === 'domains'
                    ? 'bg-surface-container-high text-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">layers</span>
                <span>Karty 10 Domen</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. KPI / ACADEMIC METRICS STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        {/* Metric 1 */}
        <div className="p-space-lg rounded-xl bg-surface-container-low flex flex-col justify-between shadow-sm border border-outline-variant/20 hover:bg-surface-container transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Aktywne Podmioty</span>
            <span className="w-8 h-8 rounded-full bg-surface-container-high text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">group</span>
            </span>
          </div>
          <div className="flex items-baseline gap-space-sm mt-space-md">
            <span className="font-headline-xl text-headline-xl text-on-surface font-semibold">42</span>
            <span className="font-code-mono text-label-sm text-secondary">zindeksowane</span>
          </div>
          <div className="mt-space-sm flex items-center gap-space-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="font-label-sm text-label-sm text-on-surface-variant">28 Osoby • 9 Systemy • 5 Org</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-space-lg rounded-xl bg-surface-container-low flex flex-col justify-between shadow-sm border border-outline-variant/20 hover:bg-surface-container transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Węzły w Grafie</span>
            <span className="w-8 h-8 rounded-full bg-surface-container-high text-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">hub</span>
            </span>
          </div>
          <div className="flex items-baseline gap-space-sm mt-space-md">
            <span className="font-headline-xl text-headline-xl text-on-surface font-semibold">128</span>
            <span className="font-code-mono text-label-sm text-primary">relacji</span>
          </div>
          <div className="mt-space-sm flex items-center gap-space-xs">
            <span className="font-code-mono text-label-sm text-secondary">Gęstość: 0.64</span>
            <span className="text-outline text-label-sm">• Modularność: Q=0.42</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-space-lg rounded-xl bg-surface-container-low flex flex-col justify-between shadow-sm border border-outline-variant/20 hover:bg-surface-container transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Rezerwacja 120m²</span>
            <span className="w-8 h-8 rounded-full bg-surface-container-high text-tertiary flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">home_work</span>
            </span>
          </div>
          <div className="flex items-baseline gap-space-sm mt-space-md">
            <span className="font-headline-xl text-headline-xl text-on-surface font-semibold">3 Core</span>
            <span className="font-label-sm text-label-sm text-tertiary font-medium">+1 Współlokator</span>
          </div>
          <div className="mt-space-sm flex items-center gap-space-xs">
            <span className="w-2 h-2 rounded-full bg-primary-container" />
            <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">0 Konfliktów harmonogramu</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-space-lg rounded-xl bg-surface-container-low flex flex-col justify-between shadow-sm border border-outline-variant/20 hover:bg-surface-container transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Skarbiec Obsidian</span>
            <span className="w-8 h-8 rounded-full bg-surface-container-high text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">sync</span>
            </span>
          </div>
          <div className="flex items-baseline gap-space-sm mt-space-md">
            <span className="font-code-mono text-headline-md text-on-surface font-semibold truncate">[[OmniDash-Entities]]</span>
          </div>
          <div className="mt-space-sm flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="font-label-sm text-label-sm text-on-surface-variant">Zsynchronizowano</span>
            </div>
            <span className="font-code-mono text-label-sm text-outline">MD_SHA256:4f8c</span>
          </div>
        </div>
      </div>

      {/* 3. CONDITIONAL MAIN VIEW */}
      {activeView === 'graph' ? (
        /* GRAPH TOPOLOGY VIEW */
        <div className="p-space-lg rounded-xl bg-surface-container-low flex flex-col relative shadow-md overflow-hidden border border-outline-variant/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md pb-space-md">
            <div className="flex items-center gap-space-sm">
              <span className="p-1.5 rounded-lg bg-surface-container-high text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">bubble_chart</span>
              </span>
              <div>
                <h2 className="font-headline-md text-headline-md text-on-surface font-semibold leading-tight">Graf Topologii Relacyjnej</h2>
                <span className="font-code-mono text-label-sm text-outline">Dynamic Force Graph • D3/Canvas • Matrix 120m²</span>
              </div>
            </div>
          </div>

          <div className="relative w-full h-[480px] rounded-lg bg-surface-container-lowest overflow-hidden flex items-center justify-center border border-outline-variant/10">
            <svg className="w-full h-full" viewBox="0 0 800 500">
              <g stroke="#424754" strokeWidth="1">
                <line x1="400" y1="250" x2="260" y2="140" stroke="#adc6ff" strokeOpacity="0.4" strokeDasharray="3 3" />
                <line x1="400" y1="250" x2="550" y2="130" stroke="#c0c1ff" strokeOpacity="0.5" />
                <line x1="400" y1="250" x2="620" y2="280" stroke="#4d8eff" strokeOpacity="0.6" strokeWidth="2" />
                <line x1="400" y1="250" x2="480" y2="400" stroke="#adc6ff" strokeOpacity="0.4" />
                <line x1="400" y1="250" x2="240" y2="380" stroke="#ffb786" strokeOpacity="0.4" />
              </g>

              {/* Sub-Node 1: dr Elena V. */}
              <g className="cursor-pointer group" transform="translate(260, 140)">
                <circle fill="#1b1b1f" r="22" stroke="#adc6ff" strokeWidth="1.5" />
                <circle fill="#adc6ff" r="8" />
                <text fill="#e3e2e6" fontSize="11" fontWeight="600" textAnchor="middle" x="0" y="36">dr Elena V.</text>
                <text fill="#8c909f" fontSize="9" textAnchor="middle" x="0" y="48">BioTech Core</text>
              </g>

              {/* Sub-Node 2: LisCraft Labs */}
              <g className="cursor-pointer group" transform="translate(550, 130)">
                <circle fill="#1b1b1f" r="24" stroke="#c0c1ff" strokeWidth="2" />
                <circle fill="#3131c0" r="10" />
                <text fill="#e3e2e6" fontSize="11" fontWeight="600" textAnchor="middle" x="0" y="38">LisCraft Labs</text>
                <text fill="#c0c1ff" fontSize="9" textAnchor="middle" x="0" y="50">Strefa Strych / Biuro</text>
              </g>

              {/* Sub-Node 3: Node-Orion */}
              <g className="cursor-pointer group" transform="translate(620, 280)">
                <rect fill="#1b1b1f" height="36" rx="8" stroke="#adc6ff" strokeWidth="1.5" width="36" x="-18" y="-18" />
                <circle fill="#4d8eff" r="5" />
                <text fill="#e3e2e6" fontSize="11" fontWeight="600" textAnchor="middle" x="0" y="32">Node-Orion</text>
                <text fill="#8c909f" fontSize="9" textAnchor="middle" x="0" y="44">LPU Groq Host</text>
              </g>

              {/* Sub-Node 4: Mark Thorne */}
              <g className="cursor-pointer group" transform="translate(480, 400)">
                <circle fill="#1b1b1f" r="20" stroke="#adc6ff" strokeWidth="1.5" />
                <circle fill="#adc6ff" r="7" />
                <text fill="#e3e2e6" fontSize="11" fontWeight="600" textAnchor="middle" x="0" y="34">Mark Thorne</text>
                <text fill="#8c909f" fontSize="9" textAnchor="middle" x="0" y="46">Rezydent: Sypialnia B</text>
              </g>

              {/* Central Node: Operator K. */}
              <g className="cursor-pointer select-none" transform="translate(400, 250)">
                <circle fill="#121316" r="34" stroke="#4d8eff" strokeWidth="2.5" />
                <circle fill="#1f1f23" r="26" />
                <circle fill="#adc6ff" r="12" />
                <text fill="#adc6ff" fontSize="12" fontWeight="700" textAnchor="middle" x="0" y="48">OPERATOR K.</text>
                <text fill="#8c909f" fontSize="9" textAnchor="middle" x="0" y="60">ROOT ANCHOR #00</text>
              </g>
            </svg>
          </div>
        </div>
      ) : activeView === 'matrix' ? (
        /* HOUSING MATRIX 120M² VIEW */
        <div className="p-space-lg rounded-xl bg-surface-container-low flex flex-col space-y-space-md shadow-md border border-outline-variant/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-sm">
              <span className="p-1.5 rounded-lg bg-surface-container-high text-tertiary flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">domain</span>
              </span>
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">Housing Matrix: Przestrzeń 120m²</h3>
                <p className="font-label-sm text-label-sm text-outline">Rejestr współdzielenia stref, poziom hałasu i dostępność pomieszczeń</p>
              </div>
            </div>
            <span className="font-code-mono text-label-sm text-on-tertiary-container bg-tertiary-container/30 px-space-sm py-0.5 rounded-full">
              Lokal: Hub 120m²
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
            <div className="p-space-md rounded-lg bg-surface-container flex flex-col justify-between space-y-space-sm border border-outline-variant/10">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md font-semibold text-on-surface">Strych / Warsztat</span>
                <span className="font-code-mono text-[11px] text-primary px-1.5 py-0.5 rounded bg-primary-container/20">42 m²</span>
              </div>
              <p className="font-body-md text-label-sm text-on-surface-variant">Pracownia elektroniki LisCraft, drukowanie 3D, serwerownia lokalna.</p>
              <div className="p-space-xs rounded bg-surface-container-low flex items-center justify-between text-label-sm font-code-mono">
                <span className="text-outline">Stan obecny:</span>
                <span className="text-secondary font-medium">Operator K. (Deep Work)</span>
              </div>
            </div>

            <div className="p-space-md rounded-lg bg-surface-container flex flex-col justify-between space-y-space-sm border border-outline-variant/10">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md font-semibold text-on-surface">Biuro / Gabinet</span>
                <span className="font-code-mono text-[11px] text-primary px-1.5 py-0.5 rounded bg-primary-container/20">34 m²</span>
              </div>
              <p className="font-body-md text-label-sm text-on-surface-variant">Trzy stanowiska montażowe, macierz terminali, sesje łączności.</p>
              <div className="p-space-xs rounded bg-surface-container-low flex items-center justify-between text-label-sm font-code-mono">
                <span className="text-outline">Stan obecny:</span>
                <span className="text-primary font-medium">Rezerwacja aktywna</span>
              </div>
            </div>

            <div className="p-space-md rounded-lg bg-surface-container flex flex-col justify-between space-y-space-sm border border-outline-variant/10">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md font-semibold text-on-surface">Salon &amp; Lounge</span>
                <span className="font-code-mono text-[11px] text-tertiary px-1.5 py-0.5 rounded bg-tertiary-container/20">44 m²</span>
              </div>
              <p className="font-body-md text-label-sm text-on-surface-variant">Strefa wspólna, bar LisCraft Mixology, rzutnik 4K, strefa spotkań.</p>
              <div className="p-space-xs rounded bg-surface-container-low flex items-center justify-between text-label-sm font-code-mono">
                <span className="text-outline">Współlokatorzy:</span>
                <span className="text-tertiary font-medium">Dostępny</span>
              </div>
            </div>
          </div>
        </div>
      ) : activeView === 'domains' ? (
        /* 10 DOMAINS CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
          {['Edukacja & Librus', 'Finanse & Majątek', 'Trening FBW & Sylwetka', 'OSINT & Cyberbezpieczeństwo', 'Inżynieria Oprogramowania', 'Warsztat & Sprzęt 120m²', 'Relacje & Kontakty', 'Obsidian Pamięć & AI', 'Automatyzacje & Daemony', 'Zdrowie & Regeneracja'].map((domain, idx) => (
            <div key={idx} className="p-space-md rounded-xl bg-surface-container-low border border-outline-variant/20 shadow-sm flex flex-col justify-between space-y-space-sm hover:bg-surface-container transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-code-mono text-[11px] text-primary">DOMENA #{idx + 1}</span>
                <span className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <h3 className="font-headline-md text-headline-md font-semibold text-on-surface">{domain}</h3>
              <p className="font-body-md text-label-sm text-on-surface-variant">Zintegrowany moduł wiedzy w ekosystemie OmniDash v3.0.</p>
            </div>
          ))}
        </div>
      ) : (
        /* HIERARCHICAL TREE VIEW (EntityTreeView with 3 tabs preserved for tests) */
        <EntityTreeView />
      )}

    </div>
  );
};

export default EntitiesPage;
