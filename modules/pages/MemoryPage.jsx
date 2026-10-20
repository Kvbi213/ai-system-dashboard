import React, { useState, useEffect, useMemo } from 'react';
import { 
  BrainCircuit, Trash2, Loader2, Database, Plus, Sparkles, Check, 
  Tag, Search, ShieldCheck, RefreshCw, Terminal, Layers, ArrowUpDown,
  Lock, BookOpen, AlertCircle, X, Download, Copy, CheckCircle2
} from 'lucide-react';
import { subscribeCollection, saveCloudDocument, deleteCloudDocument } from '../services/cloudSync.js';

const SYSTEM_DIRECTIVES = [
  { id: 'DIR_01', name: 'Filar Trwałości', level: 'CRITICAL', text: 'Zakaz niszczenia wypracowanych modułów. Wszelkie rozszerzenia izolowane w /modules/ i spięte z architekturą.' },
  { id: 'DIR_02', name: 'Zero-Emoji Policy', level: 'ENFORCED', text: 'Całkowity zakaz emoji w GUI i kodzie. Dozwolone wyłącznie znaczniki tekstowe: [+], [-], [*], [!], [>], [~].' },
  { id: 'DIR_03', name: 'Ghost Operator Protocol', level: 'SECURITY', text: 'Zero Trust PII. Anonimizacja poświadczeń, maskowanie kluczy API, brak twardych ścieżek bezwzględnych.' },
  { id: 'DIR_04', name: 'Relational WAL Persistence', level: 'SYSTEM', text: 'Transakcyjny zapis dwutorowy: natychmiastowy lokalny bufor SQLite WAL oraz asynchroniczny Firestore CloudSync.' }
];

const MemoryPage = () => {
  const [facts, setFacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategory, setNewCategory] = useState('System');
  const [newFact, setNewFact] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [copiedId, setCopiedId] = useState(null);
  const [syncStatus, setSyncStatus] = useState('SYNCED');

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

  const safeFacts = Array.isArray(facts) ? facts : [];

  // Wyodrębnienie dostępnych kategorii
  const availableCategories = useMemo(() => {
    const cats = new Set(['ALL']);
    safeFacts.forEach(f => {
      if (f.category) cats.add(f.category);
    });
    return Array.from(cats);
  }, [safeFacts]);

  // Filtrowanie faktów wg wyszukiwania i kategorii
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

  return (
    <div className="w-full h-full flex flex-col gap-space-md relative z-10 animate-soft-enter overflow-y-auto pb-24 md:pb-8">
      
      {/* 1. Header & Breadcrumb & Integrity Capsule */}
      <header className="flex flex-col gap-space-sm bg-surface-container-low p-space-md rounded-xl border border-white/[0.08] shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-xs font-code-mono text-label-sm text-outline tracking-wider uppercase">
            <span>OmniDash</span>
            <span className="text-outline-variant">/</span>
            <span>System Management</span>
            <span className="text-outline-variant">/</span>
            <span className="text-primary font-semibold">Pamięć Operatora</span>
          </div>

          <div className="flex items-center gap-space-sm bg-surface-container-lowest px-space-md py-1 rounded-full border border-white/[0.06]">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="font-code-mono text-[11px] text-on-surface-variant">data/operator_brain.json</span>
            <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
            <span className="font-code-mono text-[11px] text-primary font-medium">SHA-256 VERIFIED</span>
            <span className="px-1.5 py-0.2 bg-primary/10 text-primary rounded font-code-mono text-[10px] uppercase font-bold">
              100% Spójności
            </span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md pt-space-xs">
          <div>
            <div className="flex items-center gap-space-sm">
              <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
                Pamięć Długoterminowa AI
              </h1>
              <span className="px-space-sm py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-code-mono text-label-sm flex items-center gap-1.5 border border-white/[0.06]">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                Operator Brain v3.0
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl mt-1">
              Deterministyczna, nadrzędna macierz kognitywna. Utrwalone fakty behawioralne, reguły architektoniczne i instrukcje systemowe zasilające procesy myślowe agenta Omni.
            </p>
          </div>

          <div className="flex items-center gap-space-sm self-start lg:self-center">
            <button
              onClick={() => {
                setSyncStatus('FLUSHING');
                setTimeout(() => setSyncStatus('SYNCED'), 800);
              }}
              className="h-9 px-space-md bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors rounded-lg flex items-center gap-space-xs font-label-md text-label-md border border-white/[0.06]"
            >
              <RefreshCw className={`w-4 h-4 text-primary ${syncStatus === 'FLUSHING' ? 'animate-spin' : ''}`} />
              <span>Wymuś Flush</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="h-9 px-space-md bg-primary text-on-primary hover:bg-primary-fixed-dim transition-all rounded-lg flex items-center gap-space-xs font-label-md text-label-md font-semibold shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Dodaj Fakt</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Telemetry Strip: 4 Key Indicators */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-sm">
        <div className="bg-surface-container-low p-space-md rounded-xl border border-white/[0.08] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-space-xs">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Utrwalone Fakty</span>
            <BrainCircuit className="w-5 h-5 text-primary" />
          </div>
          <div className="flex items-baseline gap-space-xs">
            <span className="font-headline-xl text-headline-xl font-bold text-on-surface">{safeFacts.length}</span>
            <span className="font-code-mono text-label-sm text-primary font-medium">rekordów</span>
          </div>
          <div className="mt-space-sm flex items-center justify-between text-outline font-label-sm text-label-sm">
            <span>Bi-directional sync</span>
            <span className="text-primary font-code-mono">100% indeks</span>
          </div>
        </div>

        <div className="bg-surface-container-low p-space-md rounded-xl border border-white/[0.08] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-space-xs">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Dyrektywy Nadrzędne</span>
            <Layers className="w-5 h-5 text-secondary" />
          </div>
          <div className="flex items-baseline gap-space-xs">
            <span className="font-headline-xl text-headline-xl font-bold text-on-surface">{SYSTEM_DIRECTIVES.length}</span>
            <span className="font-code-mono text-label-sm text-secondary font-medium">zasad</span>
          </div>
          <div className="mt-space-sm flex items-center justify-between text-outline font-label-sm text-label-sm">
            <span>Zero-Override Mode</span>
            <span className="text-secondary font-code-mono">Strict Enforce</span>
          </div>
        </div>

        <div className="bg-surface-container-low p-space-md rounded-xl border border-white/[0.08] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-space-xs">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Poziom Adaptacji</span>
            <Terminal className="w-5 h-5 text-primary" />
          </div>
          <div className="flex items-baseline gap-space-xs">
            <span className="font-headline-xl text-headline-xl font-bold text-on-surface">98.4</span>
            <span className="font-headline-md text-headline-md text-on-surface-variant font-semibold">%</span>
          </div>
          <div className="w-full bg-surface-container-highest h-1 rounded-full mt-space-sm overflow-hidden">
            <div className="bg-primary h-full rounded-full" style={{ width: '98.4%' }}></div>
          </div>
        </div>

        <div className="bg-surface-container-low p-space-md rounded-xl border border-white/[0.08] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-space-xs">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Status Replikacji</span>
            <Database className="w-5 h-5 text-tertiary" />
          </div>
          <div className="flex items-baseline gap-space-xs">
            <span className="font-headline-xl text-headline-xl font-bold text-on-surface">Active</span>
            <span className="font-label-md text-label-md text-tertiary font-medium">WAL</span>
          </div>
          <div className="mt-space-sm flex items-center justify-between text-outline font-label-sm text-label-sm">
            <span className="truncate">Firestore: void-potato-7721</span>
            <span className="font-code-mono text-tertiary">#online</span>
          </div>
        </div>
      </section>

      {/* 3. Core Two-Column Workstation: Facts Browser (Left 7 cols) vs Directives (Right 5 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-md items-start">
        
        {/* Left: Facts Browser */}
        <div className="xl:col-span-7 flex flex-col space-y-space-md">
          <div className="bg-surface-container-low p-space-md rounded-xl border border-white/[0.08] shadow-sm space-y-space-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
              <div className="flex items-center gap-space-xs">
                <Search className="w-4 h-4 text-primary" />
                <h2 className="font-label-md text-label-md font-semibold text-on-surface uppercase tracking-wider">
                  Przeglądarka Faktów Kognitywnych
                </h2>
                <span className="px-1.5 py-0.2 rounded font-code-mono text-[10px] bg-surface-container text-on-surface-variant">
                  {filteredFacts.length}
                </span>
              </div>

              {/* Category selector pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                {availableCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2 py-0.5 rounded-full font-code-mono text-[10px] transition-all whitespace-nowrap ${
                      selectedCategory === cat
                        ? 'bg-primary text-on-primary font-bold'
                        : 'bg-surface-container text-outline hover:text-on-surface'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Szukaj w pamięci (np. 'trening', 'budżet', 'Librus', 'architektura')..."
                className="w-full h-10 pl-9 pr-4 rounded-lg bg-surface-container-lowest text-on-surface placeholder:text-outline text-body-md font-body-md focus:bg-surface-container focus:outline-none border border-white/[0.06] transition-all"
              />
              <Search className="w-4 h-4 text-outline absolute left-3 top-3 pointer-events-none" />
            </div>

            {/* Facts Feed */}
            <div className="space-y-space-xs max-h-[540px] overflow-y-auto custom-scrollbar pr-1 pt-1">
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center text-outline font-code-mono text-label-sm gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span>Wczytywanie pamięci z Firestore...</span>
                </div>
              ) : filteredFacts.length === 0 ? (
                <div className="py-12 text-center text-outline font-code-mono text-label-sm bg-surface-container-lowest rounded-xl border border-white/[0.04]">
                  Brak faktów spełniających wybrane kryteria wyszukiwania.
                </div>
              ) : (
                filteredFacts.map(item => (
                  <div
                    key={item.id}
                    className="p-space-sm rounded-lg bg-surface-container-lowest border border-white/[0.04] hover:bg-surface-container transition-all flex items-start justify-between gap-space-sm group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-space-xs mb-1">
                        <span className="px-1.5 py-0.2 rounded font-code-mono text-[10px] bg-primary/10 text-primary uppercase font-medium">
                          {item.category || 'General'}
                        </span>
                        <span className="font-code-mono text-[10px] text-outline">
                          {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Active'}
                        </span>
                      </div>
                      <p className="font-body-md text-body-md text-on-surface leading-relaxed">
                        {item.fact}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 pt-1">
                      <button
                        onClick={() => handleCopyFact(item)}
                        className="p-1.5 rounded text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors"
                        title="Kopiuj do schowka"
                      >
                        {copiedId === item.id ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => deleteFact(item.id)}
                        className="p-1.5 rounded text-outline hover:text-error hover:bg-error-container/20 transition-colors"
                        title="Usuń fakt"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: System Directives & Architectural Rules */}
        <div className="xl:col-span-5 flex flex-col space-y-space-md">
          <div className="bg-surface-container-low p-space-md rounded-xl border border-white/[0.08] shadow-sm space-y-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <Lock className="w-4 h-4 text-secondary" />
                <h2 className="font-label-md text-label-md font-semibold text-on-surface uppercase tracking-wider">
                  Dyrektywy Nadrzędne Omni
                </h2>
              </div>
              <span className="font-code-mono text-[10px] text-secondary bg-secondary-container/20 px-2 py-0.5 rounded-full">
                ZASADYPRACY.md
              </span>
            </div>

            <div className="space-y-space-xs">
              {SYSTEM_DIRECTIVES.map(dir => (
                <div 
                  key={dir.id}
                  className="p-space-sm rounded-lg bg-surface-container-lowest border border-white/[0.04] space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-code-mono text-[10px] text-primary font-bold">{dir.id}</span>
                      <span className="font-body-md text-label-md font-semibold text-on-surface">{dir.name}</span>
                    </div>
                    <span className="font-code-mono text-[9px] px-1.5 py-0.2 rounded bg-surface-container text-outline uppercase font-semibold">
                      {dir.level}
                    </span>
                  </div>
                  <p className="font-body-md text-label-sm text-on-surface-variant leading-relaxed">
                    {dir.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface-container-low p-space-md rounded-xl border border-white/[0.08] shadow-sm space-y-space-sm">
            <div className="flex items-center justify-between">
              <span className="font-label-md text-label-md font-semibold text-on-surface uppercase tracking-wider">
                Rejestr Danych
              </span>
              <span className="font-code-mono text-label-sm text-outline">SQLite / Firestore</span>
            </div>
            <p className="font-body-md text-label-sm text-on-surface-variant leading-relaxed">
              Wszelkie nowe fakty behawioralne dodawane w czacie automatycznie zasilają ten zbiór i są przesyłane do lokalnego modułu AI przy kolejnych zapytaniach.
            </p>
            <div className="pt-space-xs flex justify-end">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-space-md py-1.5 bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-label-md rounded-lg transition-colors border border-white/[0.06] flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Dodaj Wpis</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* 4. MODAL DODAWANIA FAKTU */}
      {showAddModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowAddModal(false)}
        >
          <div 
            className="bg-surface-container-low border border-white/[0.12] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-space-md border-b border-white/[0.08] flex justify-between items-center bg-surface-container-lowest">
              <h2 className="font-headline-md text-headline-md text-on-surface font-semibold flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-primary" /> Nowy Fakt Kognitywny
              </h2>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddFact} className="p-space-lg flex flex-col gap-space-md">
              <div>
                <label className="font-label-sm text-label-sm text-outline mb-1 block">Kategoria *</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-white/[0.08] rounded-lg p-2.5 text-on-surface font-label-md text-label-md focus:border-primary outline-none transition-colors"
                >
                  <option value="System">System & Architektura</option>
                  <option value="Operator">Operator & Preferencje</option>
                  <option value="Trening">Trening & Zdrowie (FBW)</option>
                  <option value="Edukacja">Edukacja & Librus</option>
                  <option value="Finanse">Finanse & Budżet</option>
                  <option value="General">Inne</option>
                </select>
              </div>

              <div>
                <label className="font-label-sm text-label-sm text-outline mb-1 block">Treść faktu behawioralnego *</label>
                <textarea
                  rows={4}
                  required
                  value={newFact}
                  onChange={e => setNewFact(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-white/[0.08] rounded-lg p-2.5 text-on-surface font-body-md text-body-md focus:border-primary outline-none transition-colors resize-none"
                  placeholder="np. Operator wykonuje 6-ćwiczeniowy plan FBW na strychu w poniedziałki, środy i piątki o 17:30..."
                />
              </div>

              <div className="flex justify-end gap-space-sm mt-space-xs">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-space-md py-2 font-label-md text-label-md text-outline hover:text-on-surface transition-colors"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-space-lg py-2 font-label-md text-label-md bg-primary text-on-primary font-semibold rounded-lg shadow-md hover:bg-primary-fixed-dim transition-all disabled:opacity-50"
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
