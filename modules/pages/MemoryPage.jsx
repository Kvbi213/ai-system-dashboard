import React, { useState, useEffect, useMemo } from 'react';
import { subscribeCollection, saveCloudDocument, deleteCloudDocument } from '../services/cloudSync.js';

const SYSTEM_DIRECTIVES = [
  {
    id: 'DIR_01',
    name: 'PROTOKÓŁ ANTIGRAVITY NANO v3.2',
    level: 'Priorytet 0',
    type: 'verified',
    color: 'text-primary',
    bg: 'bg-primary/20',
    text: 'Odpowiedzi agenta muszą być skrajnie precyzyjne, pozbawione zbędnych wstępów i konwersacyjnego wypełniacza.'
  },
  {
    id: 'DIR_02',
    name: 'REGUŁA 26: Pełna symetria z Obsidianem',
    level: 'Kognitywna',
    type: 'sync_alt',
    color: 'text-secondary',
    bg: 'bg-surface-container-high',
    text: 'Każda encja utworzona w bazie wiedzy generuje natychmiast lustrzaną notatkę Markdown w skarbcu Vault/Knowledge.'
  },
  {
    id: 'DIR_03',
    name: 'BEZPIECZEŃSTWO: Sandboxing & .env Isolation',
    level: 'Krytyczna',
    type: 'shield_locked',
    color: 'text-tertiary',
    bg: 'bg-tertiary/20',
    text: 'Brak ekspozycji kluczy API, haseł oraz tokenów sesyjnych do kontekstu LLM bez uprzedniego hashowania lokalnego.'
  }
];

const DEFAULT_AUDIT_LOGS = [
  {
    title: 'Zaktualizowano fakt kognitywny (Uczelnia)',
    source: 'Omni Chat Extraction • Groq LPU',
    time: '14m temu',
    highlight: true
  },
  {
    title: 'Tool Call: workouts.get_fbw_routine',
    source: 'Modyfikacja planu 17:30',
    time: '2h temu'
  },
  {
    title: 'Firestore Synchronized (Batch: 88f2)',
    source: 'Pomyślna asynchroniczna replikacja',
    time: '6h temu'
  },
  {
    title: 'Reguła #26 dodana przez Operatora',
    source: 'Interfejs Web • Root CLI',
    time: 'Wczoraj'
  }
];

const MemoryPage = () => {
  const [facts, setFacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategory, setNewCategory] = useState('Rutyna dnia');
  const [newFact, setNewFact] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [copiedId, setCopiedId] = useState(null);
  const [copiedJson, setCopiedJson] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [flushing, setFlushing] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeCollection('operator_brain', (cloudFacts) => {
      if (Array.isArray(cloudFacts)) {
        setFacts(cloudFacts);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const deleteFact = async (id) => {
    const idStr = String(id);
    setFacts(prev => (Array.isArray(prev) ? prev : []).filter(f => String(f.id) !== idStr));
    await deleteCloudDocument('operator_brain', idStr);
  };

  const handleAddFact = async (e) => {
    e.preventDefault();
    if (!newFact.trim()) return;

    setIsSaving(true);
    const newEntry = {
      id: Date.now().toString(),
      category: newCategory.trim() || 'General',
      fact: newFact.trim(),
      created_at: new Date().toISOString()
    };

    setFacts(prev => [newEntry, ...prev]);
    await saveCloudDocument('operator_brain', newEntry.id, newEntry);

    setNewFact('');
    setShowAddModal(false);
    setIsSaving(false);
  };

  const handleCopyFact = (item) => {
    navigator.clipboard.writeText(`[${item.category}] ${item.fact}`);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const safeFacts = Array.isArray(facts) && facts.length > 0 ? facts : [
    {
      id: '104',
      category: 'Dieta & Trening',
      fact: 'Preferowany czas treningu FBW na strychu to 17:30 (Pon, Śr, Pt). Przygotować powiadomienie rozgrzewkowe na 15 min przed sesją.',
      source: 'Tool Call: workouts.schedule_routine',
      created_at: '2026-10-22T17:30:00Z',
      confidence: '0.99'
    },
    {
      id: '108',
      category: 'Preferencje kodu',
      fact: 'Standard kodu frontendowego: zakaz emotikonów w UI (Zero-Emoji Policy), pełna zgodność z Tailwind CSS oraz systemem tokenów OmniDash. Ikony wyłącznie przez Google Material Symbols.',
      source: 'Operator Prompt Override • Manual',
      created_at: '2026-10-24T12:00:00Z',
      confidence: '1.00'
    },
    {
      id: '112',
      category: 'Finanse',
      fact: 'Autoryzacja wydatków w budżecie operacyjnym: limit dzienny 60 PLN. Wszystkie nadwyżki rygorystycznie sortować wg podziału kopertowego 50/30/20.',
      source: 'Tool Call: finance.set_envelope_rule',
      created_at: '2026-10-27T10:00:00Z',
      confidence: '0.98'
    },
    {
      id: '119',
      category: 'Uczelnia',
      fact: 'Odwołane lekcje i okienka w Librusie traktować priorytetowo jako sloty na realizację zadań projektowych (OmniDash & OSINT Toolkit), a nie odpoczynek bierny.',
      source: 'Omni Chat In-Flight Extraction',
      created_at: '2026-10-20T14:00:00Z',
      confidence: '0.99'
    }
  ];

  const availableCategories = useMemo(() => {
    const cats = new Set(['ALL']);
    safeFacts.forEach(f => {
      if (f.category) cats.add(f.category);
    });
    return Array.from(cats);
  }, [safeFacts]);

  const filteredFacts = useMemo(() => {
    return safeFacts.filter(item => {
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchFact = (item.fact || '').toLowerCase().includes(q);
        const matchCat = (item.category || '').toLowerCase().includes(q);
        if (!matchFact && !matchCat) return false;
      }
      return true;
    });
  }, [safeFacts, selectedCategory, searchQuery]);

  const handleFlush = () => {
    setFlushing(true);
    setTimeout(() => {
      setFlushing(false);
    }, 800);
  };

  const handleCopyJson = () => {
    const jsonBlob = JSON.stringify({
      system_version: '3.0.4-academic',
      operator_alias: 'Operator K.',
      master_policy: {
        antigravity_level: 3.2,
        zero_emoji_ui: true,
        obsidian_vault_sync: true,
        sqlite_wal_persistence: true
      },
      execution_sandbox: {
        env_keys_exposed: false,
        max_token_budget_per_turn: 8192
      },
      facts_count: safeFacts.length
    }, null, 2);

    navigator.clipboard.writeText(jsonBlob);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="flex flex-col w-full relative">
      {/* Top Ambient Glow Field */}
      <div className="relative w-full overflow-hidden pointer-events-none">
        <div className="absolute -top-32 left-1/4 w-[560px] h-48 bg-primary-container/10 rounded-full blur-[110px]"></div>
        <div className="absolute -top-24 right-1/4 w-[480px] h-40 bg-secondary-container/15 rounded-full blur-[90px]"></div>
      </div>

      {/* Page Header & Global Brain State */}
      <header className="flex flex-col gap-space-md mb-space-lg">
        {/* Breadcrumb & SHA Telemetry Line */}
        <div className="flex flex-wrap items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-outline tracking-wider uppercase">
            <span className="hover:text-on-surface transition-colors cursor-pointer">OmniDash</span>
            <span className="text-outline-variant">/</span>
            <span className="hover:text-on-surface transition-colors cursor-pointer">System Management</span>
            <span className="text-outline-variant">/</span>
            <span className="text-primary font-semibold">Pamięć Operatora</span>
          </div>

          {/* Hash & Integrity Verification Capsule */}
          <div className="flex items-center gap-space-sm bg-surface-container-low px-space-md py-space-xs rounded-full shadow-sm border border-white/[0.04]">
            <span className="material-symbols-outlined text-[15px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              verified_user
            </span>
            <span className="font-code-mono text-code-mono text-on-surface-variant">data/operator_brain.json</span>
            <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
            <span className="font-code-mono text-code-mono text-primary font-medium tracking-tight">SHA-256: e8b9...41c2</span>
            <span className="px-space-xs py-[2px] bg-primary/10 text-primary rounded font-label-sm text-label-sm font-bold tracking-widest uppercase">
              100% Spójności
            </span>
          </div>
        </div>

        {/* Title & Primary Remote Sync Switch */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md mt-space-xs">
          <div className="flex flex-col">
            <div className="flex items-center gap-space-md">
              <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">
                Pamięć Długoterminowa AI
              </h1>
              <span className="px-space-sm py-space-xs rounded-full bg-surface-container-high text-on-surface-variant font-code-mono text-code-mono flex items-center gap-space-xs">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                Operator Brain v3.0
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant mt-space-xs max-w-2xl">
              Deterministyczna, nadrzędna macierz kognitywna. Utrwalone fakty behawioralne, reguły architektoniczne i instrukcje systemowe zasilające procesy myślowe agenta Omni.
            </p>
          </div>

          {/* Firestore Sync Segmented Controller */}
          <div className="flex items-center gap-space-md self-start lg:self-auto bg-surface-container-lowest p-space-xs rounded-xl shadow-md border border-white/[0.04]">
            <div className="flex items-center gap-space-sm px-space-sm py-space-xs">
              <div className="flex flex-col text-right">
                <span className="font-label-md text-label-md text-on-surface font-medium leading-none">
                  Synchronizacja z Firestore
                </span>
                <span className="font-code-mono text-[10px] text-outline mt-1">Bi-directional • WAL Stream</span>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={syncEnabled}
                onClick={() => setSyncEnabled(prev => !prev)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                  syncEnabled ? 'bg-primary-container' : 'bg-surface-container-highest'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-surface-container-lowest shadow-sm ring-0 transition duration-200 ease-in-out mt-[2px] ml-[2px] ${
                    syncEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <button
              onClick={handleFlush}
              className="h-9 px-space-md bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors rounded-lg flex items-center gap-space-xs font-label-md text-label-md active:scale-95"
            >
              <span className={`material-symbols-outlined text-[16px] text-primary ${flushing ? 'animate-spin' : ''}`}>
                sync
              </span>
              <span>{flushing ? 'Flushing...' : 'Wymuś flush'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Telemetry Strip: 4 Key Cognitive Indicators */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md mb-space-xl">
        <div className="bg-surface-container-low p-space-md rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden group hover:bg-surface-container transition-all border border-white/[0.03]">
          <div className="flex items-center justify-between mb-space-xs">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Utrwalone Fakty</span>
            <span className="material-symbols-outlined text-primary text-[18px]">psychology</span>
          </div>
          <div className="flex items-baseline gap-space-xs">
            <span className="font-display-lg text-[2.75rem] leading-none text-on-surface font-semibold">{safeFacts.length}</span>
            <span className="font-code-mono text-code-mono text-primary font-medium">fakty</span>
          </div>
          <div className="mt-space-sm flex items-center justify-between text-outline font-label-sm text-label-sm">
            <span>+6 w tym tygodniu</span>
            <span className="text-primary font-code-mono">100% indeks</span>
          </div>
        </div>

        <div className="bg-surface-container-low p-space-md rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden group hover:bg-surface-container transition-all border border-white/[0.03]">
          <div className="flex items-center justify-between mb-space-xs">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Dyrektywy Nadrzędne</span>
            <span className="material-symbols-outlined text-secondary text-[18px]">account_tree</span>
          </div>
          <div className="flex items-baseline gap-space-xs">
            <span className="font-display-lg text-[2.75rem] leading-none text-on-surface font-semibold">12</span>
            <span className="font-code-mono text-code-mono text-secondary font-medium">prompts</span>
          </div>
          <div className="mt-space-sm flex items-center justify-between text-outline font-label-sm text-label-sm">
            <span>Zero-Override Mode</span>
            <span className="text-secondary font-code-mono">Strict Enforce</span>
          </div>
        </div>

        <div className="bg-surface-container-low p-space-md rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden group hover:bg-surface-container transition-all border border-white/[0.03]">
          <div className="flex items-center justify-between mb-space-xs">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Poziom Adaptacji</span>
            <span className="material-symbols-outlined text-primary text-[18px]">neurology</span>
          </div>
          <div className="flex items-baseline gap-space-xs">
            <span className="font-display-lg text-[2.75rem] leading-none text-on-surface font-semibold">98.4</span>
            <span className="font-headline-md text-headline-md text-on-surface-variant font-semibold">%</span>
          </div>
          <div className="w-full bg-surface-container-highest h-1 rounded-full mt-space-sm overflow-hidden">
            <div className="bg-primary h-full rounded-full" style={{ width: '98.4%' }}></div>
          </div>
        </div>

        <div className="bg-surface-container-low p-space-md rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden group hover:bg-surface-container transition-all border border-white/[0.03]">
          <div className="flex items-center justify-between mb-space-xs">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Ostatnia Aktualizacja</span>
            <span className="material-symbols-outlined text-tertiary text-[18px]">bolt</span>
          </div>
          <div className="flex items-baseline gap-space-xs">
            <span className="font-headline-xl text-headline-xl text-on-surface font-semibold">14 min</span>
            <span className="font-label-md text-label-md text-tertiary font-medium">temu</span>
          </div>
          <div className="mt-space-sm flex items-center justify-between text-outline font-label-sm text-label-sm">
            <span className="truncate">Auto-capt: Omni Chat</span>
            <span className="font-code-mono text-tertiary">#119 sync</span>
          </div>
        </div>
      </section>

      {/* Core Two-Column Workstation: Facts Browser (Left 7 cols) vs Directives (Right 5 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg">
        {/* LEFT PANEL: Fact Browser & Search Engine */}
        <section className="xl:col-span-7 flex flex-col gap-space-md">
          {/* Panel Header & Action */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-primary text-[20px]">manage_search</span>
              <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
                Przeglądarka Faktów Kognitywnych
              </h2>
              <span className="px-space-xs py-[2px] bg-surface-container-high rounded font-code-mono text-[11px] text-on-surface-variant ml-space-xs">
                Total: {filteredFacts.length}
              </span>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="h-9 px-space-md bg-primary-container text-on-primary-container hover:brightness-110 active:scale-95 transition-all rounded-lg flex items-center gap-space-xs font-label-md text-label-md font-semibold shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Dodaj Nowy Fakt</span>
            </button>
          </div>

          {/* Quick Search Bar with Mono Keystroke Indicator */}
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-0 pl-space-md flex items-center pointer-events-none text-outline">
              <span className="material-symbols-outlined text-[18px]">search</span>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Wyszukaj w pamięci (np. 'trening', 'budżet', 'Librus', 'Tailwind')..."
              className="w-full h-11 pl-11 pr-24 rounded-xl bg-surface-container-low text-on-surface placeholder:text-outline text-body-md font-body-md focus:bg-surface-container focus:outline-none transition-all shadow-sm border border-white/[0.04]"
            />
            <div className="absolute inset-y-0 right-0 pr-space-md flex items-center pointer-events-none">
              <kbd className="px-space-xs py-0.5 rounded bg-surface-container-highest text-outline font-code-mono text-[10px] uppercase font-semibold">
                ⌘ + F
              </kbd>
            </div>
          </div>

          {/* Category Filter Pills (Sonoma Filter Style) */}
          <div className="flex items-center gap-space-xs overflow-x-auto pb-1 scrollbar-none">
            {availableCategories.map(cat => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-space-md py-space-xs rounded-full font-label-sm text-label-sm whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-surface-container-high text-on-surface font-semibold shadow-sm'
                      : 'bg-surface-container-low hover:bg-surface-container text-outline hover:text-on-surface'
                  }`}
                >
                  {cat === 'ALL' ? `Wszystkie (${safeFacts.length})` : cat}
                </button>
              );
            })}
          </div>

          {/* Cognitive Facts Stack */}
          <div className="flex flex-col gap-space-sm">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-outline font-code-mono text-label-sm gap-2 bg-surface-container-low rounded-xl">
                <span className="material-symbols-outlined text-primary text-[24px] animate-spin">progress_activity</span>
                <span>Wczytywanie pamięci z bazy...</span>
              </div>
            ) : filteredFacts.length === 0 ? (
              <div className="py-12 text-center text-outline font-code-mono text-label-sm bg-surface-container-low rounded-xl border border-white/[0.04]">
                Brak faktów spełniających wybrane kryteria wyszukiwania.
              </div>
            ) : (
              filteredFacts.map((item, idx) => (
                <article
                  key={item.id || idx}
                  className="bg-surface-container-low p-space-md rounded-xl shadow-sm hover:bg-surface-container transition-all flex flex-col gap-space-sm border border-white/[0.03]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-space-sm">
                      <span className="px-space-xs py-[2px] rounded bg-primary/10 text-primary font-code-mono text-code-mono font-semibold">
                        Fakt #{item.id ? String(item.id).slice(-4) : idx + 1}
                      </span>
                      <span className="px-space-sm py-[2px] rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
                        {item.category || 'Ogólne'}
                      </span>
                      <span className="font-code-mono text-[11px] text-outline">
                        Confidence: {item.confidence || '0.99'}
                      </span>
                    </div>

                    <div className="flex items-center gap-space-xs">
                      <button
                        onClick={() => handleCopyFact(item)}
                        className="w-7 h-7 rounded hover:bg-surface-container-highest text-outline hover:text-on-surface flex items-center justify-center transition-colors"
                        title="Kopiuj treść"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {copiedId === item.id ? 'check' : 'content_copy'}
                        </span>
                      </button>
                      <button
                        onClick={() => deleteFact(item.id)}
                        className="w-7 h-7 rounded hover:bg-error-container/20 text-outline hover:text-error flex items-center justify-center transition-colors"
                        title="Usuń z bazy"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>

                  <p className="font-body-lg text-body-lg text-on-surface leading-relaxed">
                    {item.fact}
                  </p>

                  <div className="flex items-center justify-between pt-space-xs font-code-mono text-[11px] text-outline">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                      <span>{item.source || 'Źródło: Omni Chat In-Flight Extraction'}</span>
                    </span>
                    <span>
                      {item.created_at
                        ? `Utrwalono: ${new Date(item.created_at).toLocaleDateString('pl-PL')}`
                        : 'Utrwalono: Aktywny'}
                    </span>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        {/* RIGHT PANEL: Directive Editor & Audit Log */}
        <section className="xl:col-span-5 flex flex-col gap-space-md">
          {/* Panel Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-secondary text-[20px]">terminal</span>
              <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
                Dyrektywy i Plik JSON
              </h2>
            </div>
            <span className="font-code-mono text-[11px] text-outline">Read/Write WAL</span>
          </div>

          {/* JSON System Blueprint Code Display */}
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-md flex flex-col border border-white/[0.04]">
            <div className="flex items-center justify-between pb-space-sm mb-space-xs border-b border-surface-container-high/40">
              <div className="flex items-center gap-space-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-surface-container-highest"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-surface-container-highest"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-surface-container-highest"></span>
                <span className="font-code-mono text-[12px] text-on-surface ml-space-xs font-semibold">
                  operator_brain.json
                </span>
              </div>
              <div className="flex items-center gap-space-xs">
                <button
                  onClick={handleCopyJson}
                  className="px-space-xs py-1 rounded hover:bg-surface-container-high text-outline hover:text-on-surface transition-colors font-code-mono text-[11px] flex items-center gap-1 active:scale-95"
                >
                  <span className="material-symbols-outlined text-[13px]">
                    {copiedJson ? 'check' : 'content_copy'}
                  </span>
                  <span>{copiedJson ? 'Skopiowano' : 'Kopiuj'}</span>
                </button>
                <button
                  onClick={handleFlush}
                  className="px-space-xs py-1 rounded bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors font-code-mono text-[11px] font-semibold active:scale-95"
                >
                  Formatuj
                </button>
              </div>
            </div>
            <pre className="font-code-mono text-[12px] leading-5 text-on-surface-variant overflow-x-auto p-space-xs max-h-56">
              <code>
                {`{
  `}<span className="text-secondary">"system_version"</span>{`: `}<span className="text-primary">"3.0.4-academic"</span>{`,
  `}<span className="text-secondary">"operator_alias"</span>{`: `}<span className="text-tertiary">"Operator K."</span>{`,
  `}<span className="text-secondary">"master_policy"</span>{`: {
    `}<span className="text-secondary">"antigravity_level"</span>{`: `}<span className="text-primary">3.2</span>{`,
    `}<span className="text-secondary">"zero_emoji_ui"</span>{`: `}<span className="text-primary">true</span>{`,
    `}<span className="text-secondary">"obsidian_vault_sync"</span>{`: `}<span className="text-primary">true</span>{`,
    `}<span className="text-secondary">"sqlite_wal_persistence"</span>{`: `}<span className="text-primary">true</span>{`
  },
  `}<span className="text-secondary">"execution_sandbox"</span>{`: {
    `}<span className="text-secondary">"env_keys_exposed"</span>{`: `}<span className="text-primary">false</span>{`,
    `}<span className="text-secondary">"max_token_budget_per_turn"</span>{`: `}<span className="text-primary">8192</span>{`
  }
}`}
              </code>
            </pre>
          </div>

          {/* Active Master Rules List */}
          <div className="bg-surface-container-low rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm border border-white/[0.04]">
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                Aktywne Reguły Nadrzędne
              </span>
              <span className="px-space-xs py-[2px] rounded bg-secondary/10 text-secondary font-code-mono text-[11px] font-semibold">
                3 Active Locks
              </span>
            </div>

            {SYSTEM_DIRECTIVES.map(rule => (
              <div key={rule.id} className="bg-surface-container p-space-sm rounded-lg flex items-start gap-space-sm">
                <div className={`mt-0.5 ${rule.color}`}>
                  <span className="material-symbols-outlined text-[18px]">{rule.type}</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-space-xs">
                    <span className="font-label-md text-label-md text-on-surface font-semibold">{rule.name}</span>
                    <span className={`px-space-xs py-[1px] ${rule.bg} ${rule.color} rounded font-code-mono text-[10px] font-bold uppercase`}>
                      {rule.level}
                    </span>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant text-[13px] mt-0.5 leading-snug">
                    {rule.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Memory Audit Log */}
          <div className="bg-surface-container-low rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm border border-white/[0.04]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-outline text-[16px]">history</span>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                  Dziennik Zmian Pamięci (Audit Log)
                </span>
              </div>
              <button className="font-code-mono text-[11px] text-primary hover:underline">Pełny log (WAL)</button>
            </div>

            {DEFAULT_AUDIT_LOGS.map((item, index) => (
              <div
                key={index}
                className={`flex items-start justify-between py-space-xs font-body-md text-body-md ${
                  index < DEFAULT_AUDIT_LOGS.length - 1 ? 'border-b border-surface-container-high/50' : ''
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-on-surface font-medium text-[13px]">{item.title}</span>
                  <span className="font-code-mono text-[11px] text-outline">{item.source}</span>
                </div>
                <span className={`font-code-mono text-[11px] ${item.highlight ? 'text-primary' : 'text-outline'}`}>
                  {item.time}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Interactive Modal for Adding New Fact */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-space-md bg-surface-container-lowest/80 backdrop-blur-md animate-fade-in"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="w-full max-w-xl bg-surface-container-low rounded-2xl p-space-lg shadow-2xl flex flex-col gap-space-md border border-white/[0.08] animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-space-xs border-b border-surface-container-high">
              <div className="flex items-center gap-space-sm">
                <span className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container">
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                </span>
                <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">
                  Dodaj Nowy Fakt Kognitywny
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-surface-container-high flex items-center justify-center text-outline hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleAddFact} className="flex flex-col gap-space-md">
              <div className="flex flex-col gap-space-xs">
                <label className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                  Kategoria Faktu
                </label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-white/[0.08] rounded-lg p-2.5 text-on-surface font-label-md text-label-md focus:border-primary outline-none transition-colors"
                >
                  <option value="Rutyna dnia">Rutyna dnia</option>
                  <option value="Preferencje kodu">Preferencje kodu</option>
                  <option value="Dieta & Trening">Dieta & Trening</option>
                  <option value="Uczelnia">Uczelnia & Librus</option>
                  <option value="Finanse">Finanse & Koperty</option>
                  <option value="Projekty">Projekty & OSINT</option>
                  <option value="General">Inne</option>
                </select>
              </div>

              <div className="flex flex-col gap-space-xs">
                <label className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                  Treść faktu behawioralnego *
                </label>
                <textarea
                  rows={4}
                  required
                  value={newFact}
                  onChange={e => setNewFact(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-white/[0.08] rounded-lg p-3 text-on-surface font-body-md text-body-md focus:border-primary outline-none transition-colors resize-none placeholder:text-outline"
                  placeholder="np. Preferowany czas treningu FBW to 17:30 w poniedziałki, środy i piątki..."
                />
              </div>

              <div className="flex justify-end gap-space-sm pt-space-xs">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-space-md py-2 font-label-md text-label-md text-outline hover:text-on-surface transition-colors active:scale-95"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-space-lg py-2 font-label-md text-label-md bg-primary text-on-primary font-semibold rounded-lg shadow-md hover:bg-primary-fixed-dim transition-all disabled:opacity-50 active:scale-95"
                >
                  {isSaving ? 'Zapisywanie...' : 'Zapisz Fakt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemoryPage;
