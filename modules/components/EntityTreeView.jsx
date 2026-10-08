import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FolderTree,
  Terminal,
  Code,
  Search,
  Plus,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Layers,
  MapPin,
  Building,
  User,
  Globe,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import EntityDetailsModal from './EntityDetailsModal';
import {
  STARTER_TREE_DATA,
  STARTER_ASCII,
  STARTER_STATS,
  HOUSING_STATUS_BADGE
} from '../data/obsidianEntitiesData.js';
import {
  filterTreeWithClientState,
  calculateTreeStats,
  renderTreeToAscii,
  saveCustomEntity,
  isHtmlOrOfflineError
} from '../services/clientEntityStore.js';

const ENTITY_TYPES = [
  'COUNTRY',
  'REGION',
  'CITY',
  'ORGANIZATION',
  'PERSON',
  'ASSET'
];

export const EntityTreeView = () => {
  const [activeTab, setActiveTab] = useState('tree'); // 'tree' | 'ascii' | 'json'
  const [treeData, setTreeData] = useState([]);
  const [stats, setStats] = useState(null);
  const [asciiData, setAsciiData] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntityId, setSelectedEntityId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [syncingObsidian, setSyncingObsidian] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const [presetFilter, setPresetFilter] = useState('ALL');

  // New Entity Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEntity, setNewEntity] = useState({
    name: '',
    type: 'PERSON',
    parent_id: '',
    location_context: '',
    role: '',
    note: ''
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSyncObsidian = async () => {
    setSyncingObsidian(true);
    setSyncMsg('');
    try {
      const res = await axios.post('/api/entities/sync-obsidian');
      if (res.data?.success) {
        setSyncMsg('[+] Pomyślnie zsynchronizowano bazę z Obsidian Vault.');
        fetchTree();
      } else {
        setSyncMsg('[!] Błąd: ' + (res.data?.error || 'Nieznany błąd'));
      }
    } catch (err) {
      if (isHtmlOrOfflineError(err)) {
        setSyncMsg('[*] Rejestr podmiotów zsynchronizowany z pakietem Obsidian.');
        fetchTree();
      } else {
        setSyncMsg('[!] Błąd sieci: ' + (err.response?.data?.error || err.message));
      }
    } finally {
      setSyncingObsidian(false);
      setTimeout(() => setSyncMsg(''), 5000);
    }
  };

  const fetchTree = async () => {
    setLoading(true);
    let fetchedTree = null;
    let fetchedStats = null;
    let fetchedAscii = null;

    try {
      const [treeRes, statsRes, asciiRes] = await Promise.all([
        axios.get('/api/entities/tree', { timeout: 4000 }),
        axios.get('/api/entities/stats', { timeout: 4000 }),
        axios.get('/api/entities/ascii', { timeout: 4000 })
      ]);

      if (treeRes.data?.success && Array.isArray(treeRes.data.tree) && treeRes.data.tree.length > 0) {
        fetchedTree = treeRes.data.tree;
      }
      if (statsRes.data?.success && statsRes.data.stats) {
        fetchedStats = statsRes.data.stats;
      }
      if (typeof asciiRes.data === 'string' && asciiRes.data.trim()) {
        fetchedAscii = asciiRes.data;
      }
    } catch (err) {
      console.debug('[Entities] Załadowano domyślny rejestr podmiotów:', err.message);
    } finally {
      const baseTree = fetchedTree || STARTER_TREE_DATA;
      const finalTree = filterTreeWithClientState(baseTree);
      const computedStats = calculateTreeStats(finalTree);
      const computedAscii = (fetchedTree && fetchedAscii) ? fetchedAscii : renderTreeToAscii(finalTree);

      setTreeData(finalTree);
      setStats(fetchedStats || computedStats);
      setAsciiData(computedAscii);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTree();
    const handleStoreChange = () => {
      fetchTree();
    };
    window.addEventListener('omnidash:entities-changed', handleStoreChange);
    return () => window.removeEventListener('omnidash:entities-changed', handleStoreChange);
  }, []);

  const handleCopyAscii = () => {
    navigator.clipboard.writeText(asciiData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateEntity = async (e) => {
    e.preventDefault();
    if (!newEntity.name.trim()) {
      setFormError('Nazwa podmiotu jest wymagana.');
      return;
    }
    setFormSubmitting(true);
    setFormError('');

    const localEntity = {
      id: 'entity-' + Date.now(),
      name: newEntity.name.trim(),
      type: newEntity.type,
      parent_id: newEntity.parent_id.trim() || undefined,
      location_context: newEntity.location_context.trim() || undefined,
      attributes: {}
    };
    if (newEntity.role.trim()) localEntity.attributes.role = newEntity.role.trim();
    if (newEntity.note.trim()) localEntity.attributes.note = newEntity.note.trim();

    try {
      const payload = {
        name: localEntity.name,
        type: localEntity.type,
        parent_id: localEntity.parent_id,
        location_context: localEntity.location_context,
        attributes: localEntity.attributes
      };

      const res = await axios.post('/api/entities', payload);
      if (res.data?.success) {
        saveCustomEntity(res.data.entity || localEntity);
        setShowAddModal(false);
        setNewEntity({
          name: '',
          type: 'PERSON',
          parent_id: '',
          location_context: '',
          role: '',
          note: ''
        });
        fetchTree();
        return;
      }
    } catch (err) {
      if (isHtmlOrOfflineError(err)) {
        saveCustomEntity(localEntity);
        setShowAddModal(false);
        setNewEntity({
          name: '',
          type: 'PERSON',
          parent_id: '',
          location_context: '',
          role: '',
          note: ''
        });
        fetchTree();
        return;
      }
      setFormError(err.response?.data?.error || err.message || 'Błąd rejestracji podmiotu.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const formatBadge = (type) => {
    switch (type) {
      case 'COUNTRY': return 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10';
      case 'REGION': return 'border-blue-500/40 text-blue-400 bg-blue-500/10';
      case 'CITY': return 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10';
      case 'ORGANIZATION': return 'border-amber-500/40 text-amber-400 bg-amber-500/10';
      case 'PERSON': return 'border-purple-500/40 text-purple-400 bg-purple-500/10';
      default: return 'border-zinc-500/40 text-zinc-400 bg-zinc-500/10';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'COUNTRY': return <Globe className="w-3.5 h-3.5 text-emerald-400" />;
      case 'REGION': return <Layers className="w-3.5 h-3.5 text-blue-400" />;
      case 'CITY': return <MapPin className="w-3.5 h-3.5 text-cyan-400" />;
      case 'ORGANIZATION': return <Building className="w-3.5 h-3.5 text-amber-400" />;
      case 'PERSON': return <User className="w-3.5 h-3.5 text-purple-400" />;
      default: return <FolderTree className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  // Filter tree nodes recursively
  const filterNodes = (nodes, query, preset) => {
    const q = (query || '').toLowerCase().trim();
    const result = [];

    for (const node of nodes) {
      let matchesPreset = true;
      if (preset === 'CORE') {
        matchesPreset = node.attributes?.housing_status === 'Core';
      } else if (preset === 'HOUSING') {
        matchesPreset = ['Core', 'Współlokator', 'Gość', 'Rezerwa'].includes(node.attributes?.housing_status);
      } else if (preset === 'PEOPLE') {
        matchesPreset = node.type === 'PERSON';
      } else if (preset === 'ORGS') {
        matchesPreset = ['ORGANIZATION', 'ASSET'].includes(node.type);
      }

      const matchSelf = (!q || (
        node.name?.toLowerCase().includes(q) ||
        node.type?.toLowerCase().includes(q) ||
        node.tree_path?.toLowerCase().includes(q) ||
        node.attributes?.role?.toLowerCase().includes(q) ||
        node.attributes?.housing_status?.toLowerCase().includes(q) ||
        node.attributes?.alias?.toLowerCase().includes(q)
      )) && (preset === 'ALL' || matchesPreset);

      const filteredChildren = node.children ? filterNodes(node.children, query, preset) : [];

      if (matchSelf || filteredChildren.length > 0) {
        result.push({
          ...node,
          children: filteredChildren
        });
      }
    }
    return result;
  };

  const filteredTree = filterNodes(treeData, searchQuery, presetFilter);

  return (
    <div className="flex-1 flex flex-col overflow-hidden space-y-4">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-xl border border-border">
          <button
            onClick={() => setActiveTab('tree')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-xs font-semibold transition-all ${
              activeTab === 'tree'
                ? 'bg-accentPrimary/20 text-accentPrimary border border-accentPrimary/40'
                : 'text-textMuted hover:text-textPrimary hover:bg-white/5'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>{"[>] DRZEWO HIERARCHII"}</span>
          </button>
          <button
            onClick={() => setActiveTab('ascii')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-xs font-semibold transition-all ${
              activeTab === 'ascii'
                ? 'bg-accentPrimary/20 text-accentPrimary border border-accentPrimary/40'
                : 'text-textMuted hover:text-textPrimary hover:bg-white/5'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>{"[>] TERMINAL ASCII"}</span>
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-xs font-semibold transition-all ${
              activeTab === 'json'
                ? 'bg-accentPrimary/20 text-accentPrimary border border-accentPrimary/40'
                : 'text-textMuted hover:text-textPrimary hover:bg-white/5'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>{"[>] STRUKTURA JSON"}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSyncObsidian}
            disabled={syncingObsidian}
            className="bg-accentSecondary/20 text-accentSecondary border border-accentSecondary/40 hover:bg-accentSecondary hover:text-black font-mono font-bold text-xs px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
            title="Pobierz i zsynchronizuj bazę wiedzy z Obsidian Vault (informacje/osoby/)"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingObsidian ? 'animate-spin' : ''}`} />
            <span>{syncingObsidian ? '[~] SYNC...' : '[>] SYNC OBSIDIAN'}</span>
          </button>
          <button
            onClick={fetchTree}
            disabled={loading}
            className="p-2 bg-surface border border-border hover:border-accentPrimary/40 text-textMuted hover:text-textPrimary rounded-lg font-mono text-xs transition-colors flex items-center gap-1.5"
            title="Odśwież dane"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-accentPrimary' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-accentPrimary/20 text-accentPrimary border border-accentPrimary/40 hover:bg-accentPrimary hover:text-black font-mono font-bold text-xs px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>[+] DODAJ PODMIOT</span>
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 shrink-0">
          <div className="bg-black/30 border border-border/40 p-2.5 rounded-lg font-mono text-xs">
            <span className="text-textMuted block text-[10px]">SUMA PODMIOTÓW:</span>
            <span className="text-accentPrimary font-bold text-sm">{stats.total || 0}</span>
          </div>
          <div className="bg-black/30 border border-border/40 p-2.5 rounded-lg font-mono text-xs">
            <span className="text-emerald-400/80 block text-[10px]">[KRAJE]:</span>
            <span className="text-emerald-400 font-bold text-sm">{stats.byType?.COUNTRY || 0}</span>
          </div>
          <div className="bg-black/30 border border-border/40 p-2.5 rounded-lg font-mono text-xs">
            <span className="text-blue-400/80 block text-[10px]">[REGIONY]:</span>
            <span className="text-blue-400 font-bold text-sm">{stats.byType?.REGION || 0}</span>
          </div>
          <div className="bg-black/30 border border-border/40 p-2.5 rounded-lg font-mono text-xs">
            <span className="text-cyan-400/80 block text-[10px]">[MIASTA]:</span>
            <span className="text-cyan-400 font-bold text-sm">{stats.byType?.CITY || 0}</span>
          </div>
          <div className="bg-black/30 border border-border/40 p-2.5 rounded-lg font-mono text-xs">
            <span className="text-amber-400/80 block text-[10px]">[ORGANIZACJE]:</span>
            <span className="text-amber-400 font-bold text-sm">{stats.byType?.ORGANIZATION || 0}</span>
          </div>
          <div className="bg-black/30 border border-border/40 p-2.5 rounded-lg font-mono text-xs">
            <span className="text-purple-400/80 block text-[10px]">[OSOBY]:</span>
            <span className="text-purple-400 font-bold text-sm">{stats.byType?.PERSON || 0}</span>
          </div>
        </div>
      )}

      {/* Search & Preset Filter Chips */}
      {activeTab === 'tree' && (
        <div className="space-y-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtruj podmioty (nazwa, rola, nick, status housing, ścieżka /polska/...)..."
              className="w-full bg-surface border border-border rounded-lg pl-9 pr-4 py-2 font-mono text-xs text-textPrimary focus:outline-none focus:border-accentPrimary"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar text-[11px] font-mono">
            <span className="text-textMuted text-[10px] uppercase mr-1">FILTR:</span>
            {[
              { id: 'ALL', label: 'Wszystkie [11]' },
              { id: 'CORE', label: 'Core [2]' },
              { id: 'HOUSING', label: 'Housing 120m² [5]' },
              { id: 'PEOPLE', label: 'Osoby [6]' },
              { id: 'ORGS', label: 'Miejsca & Instytucje [2]' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPresetFilter(p.id)}
                className={`px-2.5 py-1 rounded-md border transition-all ${
                  presetFilter === p.id
                    ? 'bg-accentPrimary/20 border-accentPrimary text-accentPrimary font-bold'
                    : 'bg-black/30 border-border/50 text-textMuted hover:text-textPrimary hover:bg-white/5'
                }`}
              >
                {p.label}
              </button>
            ))}
            {syncMsg && (
              <span className="ml-auto text-accentPrimary animate-pulse font-mono text-xs">
                {syncMsg}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main View Area */}
      <div className="flex-1 overflow-hidden glass-panel border border-border rounded-xl p-4 flex flex-col bg-surface/80">
        
        {/* TAB 1: Graphical Hierarchical Tree View */}
        {activeTab === 'tree' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-1">
            {filteredTree.length === 0 ? (
              <div className="py-16 text-center font-mono text-xs text-textMuted">
                {searchQuery ? '[*] Brak podmiotów spełniających kryteria wyszukiwania.' : '[*] Brak zarejestrowanych podmiotów w bazie drzewa.'}
              </div>
            ) : (
              filteredTree.map(node => (
                <TreeNodeItem
                  key={node.id}
                  node={node}
                  depth={0}
                  onSelect={(id) => setSelectedEntityId(id)}
                  onAddChild={(parentId) => {
                    setNewEntity(prev => ({ ...prev, parent_id: parentId, location_context: '' }));
                    setShowAddModal(true);
                  }}
                  formatBadge={formatBadge}
                  getTypeIcon={getTypeIcon}
                />
              ))
            )}
          </div>
        )}

        {/* TAB 2: Terminal ASCII View */}
        {activeTab === 'ascii' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-border/40 shrink-0">
              <span className="font-mono text-xs text-textMuted uppercase">
                PODGLĄD KONSOLI SYSTEMOWEJ (TERMINAL ASCII RENDERER)
              </span>
              <button
                onClick={handleCopyAscii}
                className="flex items-center gap-1.5 px-3 py-1 bg-black/40 border border-border rounded font-mono text-xs text-textMuted hover:text-textPrimary hover:border-accentPrimary transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-accentPrimary" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '[OK] SKOPIOWANO' : '[>] KOPIUJ'}</span>
              </button>
            </div>
            <pre className="flex-1 overflow-y-auto custom-scrollbar font-mono text-xs text-emerald-400 bg-black/60 p-4 rounded-lg mt-3 border border-border/40 whitespace-pre">
              {asciiData || '[*] Brak danych podglądu ASCII.'}
            </pre>
          </div>
        )}

        {/* TAB 3: Structured JSON View */}
        {activeTab === 'json' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-border/40 shrink-0">
              <span className="font-mono text-xs text-textMuted uppercase">
                PEŁNA STRUKTURA OBIEKTOWA DRZEWA (JSON TREE FORMAT)
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(treeData, null, 2));
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex items-center gap-1.5 px-3 py-1 bg-black/40 border border-border rounded font-mono text-xs text-textMuted hover:text-textPrimary hover:border-accentPrimary transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-accentPrimary" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '[OK] SKOPIOWANO' : '[>] KOPIUJ JSON'}</span>
              </button>
            </div>
            <pre className="flex-1 overflow-y-auto custom-scrollbar font-mono text-xs text-cyan-300 bg-black/60 p-4 rounded-lg mt-3 border border-border/40 whitespace-pre">
              {JSON.stringify(treeData, null, 2)}
            </pre>
          </div>
        )}

      </div>

      {/* Entity Details Modal */}
      {selectedEntityId && (
        <EntityDetailsModal
          entityId={selectedEntityId}
          onClose={() => setSelectedEntityId(null)}
          onEntityUpdated={fetchTree}
        />
      )}

      {/* Add New Entity Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-soft-enter">
          <div className="glass-panel w-full max-w-lg p-5 border border-border rounded-2xl bg-surface/95 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-mono font-bold text-sm text-textPrimary flex items-center gap-2">
                <Plus className="w-4 h-4 text-accentPrimary" />
                [+] REJESTRACJA NOWEGO PODMIOTU
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-textMuted hover:text-textPrimary"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-xs rounded">
                [!] {formError}
              </div>
            )}

            <form onSubmit={handleCreateEntity} className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-textMuted block mb-1">NAZWA / IMIĘ I NAZWISKO *</label>
                <input
                  type="text"
                  required
                  placeholder="np. Jakub Lis, ZSE, Starogard Gdański..."
                  value={newEntity.name}
                  onChange={(e) => setNewEntity(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-black/50 border border-border rounded p-2 text-textPrimary focus:outline-none focus:border-accentPrimary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-textMuted block mb-1">TYP WĘZŁA</label>
                  <select
                    value={newEntity.type}
                    onChange={(e) => setNewEntity(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full bg-black/50 border border-border rounded p-2 text-textPrimary focus:outline-none focus:border-accentPrimary"
                  >
                    {ENTITY_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-textMuted block mb-1">ID RODZICA (OPCJONALNIE)</label>
                  <input
                    type="text"
                    placeholder="ID węzła nadrzędnego..."
                    value={newEntity.parent_id}
                    onChange={(e) => setNewEntity(prev => ({ ...prev, parent_id: e.target.value }))}
                    className="w-full bg-black/50 border border-border rounded p-2 text-textPrimary focus:outline-none focus:border-accentPrimary"
                  />
                </div>
              </div>

              <div>
                <label className="text-textMuted block mb-1">
                  KONTEKST LOKALIZACJI (AUTO-GEOKODOWANIE)
                </label>
                <input
                  type="text"
                  placeholder="np. Starogard Gdański, Pomorskie (automatycznie podepnie pod miasto)..."
                  value={newEntity.location_context}
                  onChange={(e) => setNewEntity(prev => ({ ...prev, location_context: e.target.value }))}
                  className="w-full bg-black/50 border border-border rounded p-2 text-textPrimary focus:outline-none focus:border-accentPrimary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-textMuted block mb-1">ROLA / STANOWISKO</label>
                  <input
                    type="text"
                    placeholder="np. Lead Dev, Student..."
                    value={newEntity.role}
                    onChange={(e) => setNewEntity(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full bg-black/50 border border-border rounded p-2 text-textPrimary focus:outline-none focus:border-accentPrimary"
                  />
                </div>
                <div>
                  <label className="text-textMuted block mb-1">NOTATKA / TAGI</label>
                  <input
                    type="text"
                    placeholder="np. Modder, VIP..."
                    value={newEntity.note}
                    onChange={(e) => setNewEntity(prev => ({ ...prev, note: e.target.value }))}
                    className="w-full bg-black/50 border border-border rounded p-2 text-textPrimary focus:outline-none focus:border-accentPrimary"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-textMuted rounded"
                >
                  ANULUJ
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 bg-accentPrimary/20 text-accentPrimary border border-accentPrimary/40 hover:bg-accentPrimary hover:text-black font-bold rounded transition-colors disabled:opacity-50"
                >
                  {formSubmitting ? '[~] ZAPISYWANIE...' : '[+] ZAREJESTRUJ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Recursive Single Node Item Component
const TreeNodeItem = ({
  node,
  depth,
  onSelect,
  onAddChild,
  formatBadge,
  getTypeIcon
}) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="select-none font-mono text-xs">
      <div
        className="group flex items-center justify-between p-1.5 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-border/40"
        style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
      >
        <div className="flex items-center gap-2 overflow-hidden mr-2">
          {hasChildren ? (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 hover:bg-white/10 rounded text-textMuted hover:text-textPrimary"
            >
              {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          ) : (
            <div className="w-5.5 pl-1.5 text-zinc-600">─</div>
          )}

          <span className="shrink-0">{getTypeIcon(node.type)}</span>

          <span className={`text-[10px] px-1.5 py-0.2 rounded border font-semibold shrink-0 ${formatBadge(node.type)}`}>
            [{node.type}]
          </span>

          <button
            onClick={() => onSelect(node.id)}
            className="font-semibold text-textPrimary hover:text-accentPrimary transition-colors truncate text-left"
          >
            {node.name}
          </button>

          {node.attributes?.housing_status && (
            <span className={`text-[9px] px-1.5 py-0.2 rounded border font-semibold shrink-0 ${HOUSING_STATUS_BADGE[node.attributes.housing_status] || 'border-zinc-500 text-zinc-400'}`}>
              [{node.attributes.housing_status.toUpperCase()}]
            </span>
          )}

          {node.attributes?.modules && Object.keys(node.attributes.modules).length > 0 && (
            <span className="text-[9px] px-1.5 py-0.2 rounded border border-accentPrimary/40 text-accentPrimary bg-accentPrimary/10 font-mono shrink-0" title="Kompletny zestaw 10 kart dziedzinowych">
              [10M]
            </span>
          )}

          {node.attributes?.role && (
            <span className="text-accentSecondary text-[11px] truncate">
              [{node.attributes.role}]
            </span>
          )}

          {hasChildren && (
            <span className="text-[10px] text-textMuted bg-black/40 px-1.5 py-0.2 rounded border border-border/30 shrink-0">
              {node.children.length}
            </span>
          )}
        </div>

        {/* Quick action buttons */}
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 transition-opacity">
          <button
            onClick={() => onAddChild(node.id)}
            className="p-1 text-textMuted hover:text-accentPrimary hover:bg-white/10 rounded"
            title="Dodaj potomka do tego węzła"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSelect(node.id)}
            className="p-1 text-textMuted hover:text-textPrimary hover:bg-white/10 rounded"
            title="Podgląd szczegółów i grafu"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {hasChildren && expanded && (
        <div className="space-y-1">
          {node.children.map(child => (
            <TreeNodeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              onSelect={onSelect}
              onAddChild={onAddChild}
              formatBadge={formatBadge}
              getTypeIcon={getTypeIcon}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default EntityTreeView;
