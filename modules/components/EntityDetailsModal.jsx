import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  X,
  Network,
  Trash2,
  Plus,
  Link2,
  Info,
  FolderTree,
  AlertCircle,
  Check,
  Brain,
  Globe,
  HeartPulse,
  Wallet,
  Gamepad2,
  Clock,
  HeartHandshake,
  Users,
  ShieldAlert,
  FileText,
  Copy,
  ExternalLink,
  Home,
  Shield,
  Wine,
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';
import {
  FALLBACK_NODES,
  FALLBACK_RELATIONS,
  DOMAIN_MODULES_CONFIG,
  HOUSING_STATUS_BADGE
} from '../data/obsidianEntitiesData.js';
import {
  markEntityDeleted,
  markRelationDeleted,
  saveCustomRelation,
  getEntityDetailsOffline,
  isHtmlOrOfflineError
} from '../services/clientEntityStore.js';

const RELATION_TYPES = [
  'EMPLOYED_AT',
  'STUDENT_OF',
  'FRIEND_OF',
  'OWNER_OF',
  'ASSOCIATED_WITH',
  'PARTNER_OF',
  'CO_LIVING',
  'VISITOR',
  'RESERVE',
  'CLASSMATE',
  'COLLEAGUE',
  'MEMBER_OF'
];

export const EntityDetailsModal = ({ entityId: initialEntityId, onClose, onEntityUpdated }) => {
  const [currentEntityId, setCurrentEntityId] = useState(initialEntityId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [entity, setEntity] = useState(null);
  const [relations, setRelations] = useState([]);

  // Active view tab: 'overview' | 'module-[key]' | 'mixology' | 'relations' | 'raw'
  const [activeTab, setActiveTab] = useState('overview');
  const [copiedKey, setCopiedKey] = useState(null);

  // Form states for new relation
  const [targetId, setTargetId] = useState('');
  const [relationType, setRelationType] = useState('FRIEND_OF');
  const [relNote, setRelNote] = useState('');
  const [relSubmitting, setRelSubmitting] = useState(false);
  const [relMsg, setRelMsg] = useState('');

  // Delete state
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setCurrentEntityId(initialEntityId);
    setActiveTab('overview');
  }, [initialEntityId]);

  const fetchDetails = async (idToFetch) => {
    const id = idToFetch || currentEntityId;
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`/api/entities/${id}`, { timeout: 4000 });
      if (res.data && res.data.success) {
        setEntity(res.data.entity);
        setRelations(res.data.relations || []);
        return;
      } else {
        throw new Error(res.data?.error || 'Błąd pobierania danych');
      }
    } catch (err) {
      // Fallback z zintegrowanego magazynu klienta i pakietu Obsidian
      const offlineData = getEntityDetailsOffline(id);
      if (offlineData && offlineData.entity) {
        setEntity(offlineData.entity);
        setRelations(offlineData.relations || []);
        setError('');
      } else {
        const fallback = FALLBACK_NODES[id];
        if (fallback) {
          setEntity(fallback);
          setRelations(FALLBACK_RELATIONS[id] || []);
          setError('');
        } else {
          setError(err.response?.data?.error || err.message || 'Błąd sieci podczas pobierania podmiotu.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails(currentEntityId);
  }, [currentEntityId]);

  const handleSwitchEntity = (newId) => {
    setCurrentEntityId(newId);
    setActiveTab('overview');
  };

  const handleCopyText = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCreateRelation = async (e) => {
    e.preventDefault();
    if (!targetId.trim()) return;
    setRelSubmitting(true);
    setRelMsg('');
    const localRel = {
      id: 'rel-' + Date.now(),
      source_id: currentEntityId,
      target_id: targetId.trim(),
      relation_type: relationType,
      metadata: relNote.trim() ? { note: relNote.trim() } : {}
    };

    try {
      const res = await axios.post('/api/entities/relations', {
        source_id: currentEntityId,
        target_id: targetId.trim(),
        relation_type: relationType,
        metadata: relNote.trim() ? { note: relNote.trim() } : {}
      });
      if (res.data?.success) {
        saveCustomRelation(res.data.relation || localRel);
        setRelMsg('[+] Relacja została pomyślnie dodana.');
        setTargetId('');
        setRelNote('');
        fetchDetails(currentEntityId);
        if (onEntityUpdated) onEntityUpdated();
        return;
      }
    } catch (err) {
      if (isHtmlOrOfflineError(err)) {
        saveCustomRelation(localRel);
        setRelations(prev => [localRel, ...prev]);
        setRelMsg('[+] Relacja zapisana w rejestrze podmiotów (tryb offline / chmura).');
        setTargetId('');
        setRelNote('');
        if (onEntityUpdated) onEntityUpdated();
        return;
      }
      setRelMsg('[!] Błąd tworzenia relacji: ' + (err.response?.data?.error || err.message));
    } finally {
      setRelSubmitting(false);
    }
  };

  const handleDeleteRelation = async (relId) => {
    try {
      const res = await axios.delete(`/api/entities/relations/${relId}`);
      if (res.data?.success) {
        markRelationDeleted(relId);
        setRelations(prev => prev.filter(r => r.id !== relId));
        if (onEntityUpdated) onEntityUpdated();
        return;
      }
    } catch (err) {
      if (isHtmlOrOfflineError(err)) {
        markRelationDeleted(relId);
        setRelations(prev => prev.filter(r => r.id !== relId));
        if (onEntityUpdated) onEntityUpdated();
        return;
      }
      alert('[!] Błąd usuwania relacji: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteEntity = async () => {
    const cascade = window.confirm('[!] Czy na pewno chcesz usunąć ten podmiot wraz z gałęzią potomną (cascade)?');
    if (!cascade && !window.confirm('[!] Usunąć wyłącznie ten podmiot (bez dzieci)?')) {
      return;
    }
    setDeleting(true);
    try {
      const res = await axios.delete(`/api/entities/${currentEntityId}?cascade=${cascade}`);
      if (res.data?.success) {
        markEntityDeleted(currentEntityId, cascade);
        if (onEntityUpdated) onEntityUpdated();
        onClose();
        return;
      }
    } catch (err) {
      if (isHtmlOrOfflineError(err)) {
        markEntityDeleted(currentEntityId, cascade);
        if (onEntityUpdated) onEntityUpdated();
        onClose();
        return;
      }
      alert('[!] Błąd usuwania podmiotu: ' + (err.response?.data?.error || err.message));
    } finally {
      setDeleting(false);
    }
  };

  const formatBadge = (type) => {
    switch (type) {
      case 'COUNTRY': return 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10';
      case 'REGION': return 'border-blue-500/40 text-blue-400 bg-blue-500/10';
      case 'CITY': return 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10';
      case 'ORGANIZATION': return 'border-amber-500/40 text-amber-400 bg-amber-500/10';
      case 'PERSON': return 'border-purple-500/40 text-purple-400 bg-purple-500/10';
      case 'ASSET': return 'border-pink-500/40 text-pink-400 bg-pink-500/10';
      default: return 'border-zinc-500/40 text-zinc-400 bg-zinc-500/10';
    }
  };

  const getModuleIcon = (key) => {
    switch (key) {
      case 'charakter': return <Brain className="w-3.5 h-3.5" />;
      case 'sociale': return <Globe className="w-3.5 h-3.5" />;
      case 'zdrowie': return <HeartPulse className="w-3.5 h-3.5" />;
      case 'finanse': return <Wallet className="w-3.5 h-3.5" />;
      case 'zainteresowania': return <Gamepad2 className="w-3.5 h-3.5" />;
      case 'rutyna': return <Clock className="w-3.5 h-3.5" />;
      case 'relacja': return <HeartHandshake className="w-3.5 h-3.5" />;
      case 'siec_relacji': return <Users className="w-3.5 h-3.5" />;
      case 'zaufanie_i_ryzyka': return <ShieldAlert className="w-3.5 h-3.5" />;
      default: return <Info className="w-3.5 h-3.5" />;
    }
  };

  const attributes = entity?.attributes || {};
  const modules = attributes.modules || {};
  const hasModules = Object.keys(modules).length > 0;
  const housingStatus = attributes.housing_status;
  const mixologyRecipes = attributes.mixology_recipes || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-soft-enter">
      <div className="glass-panel w-full max-w-5xl h-[92vh] flex flex-col border border-border shadow-2xl overflow-hidden rounded-2xl bg-surface/95">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between shrink-0 bg-surface">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black/50 border border-border flex items-center justify-center shrink-0">
              <Network className="w-5 h-5 text-accentPrimary" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                {entity && (
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${formatBadge(entity.type)}`}>
                    [{entity.type}]
                  </span>
                )}
                {housingStatus && (
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${HOUSING_STATUS_BADGE[housingStatus] || 'border-zinc-500 text-zinc-400'}`}>
                    [HOUSING: {housingStatus.toUpperCase()}]
                  </span>
                )}
                <h2 className="font-mono font-bold text-lg text-textPrimary tracking-wide">
                  {entity ? entity.name : 'Wczytywanie podmiotu...'}
                </h2>
              </div>
              <p className="font-mono text-xs text-textMuted mt-0.5 truncate max-w-xl">
                {entity?.tree_path || 'Hierarchia: /...'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-textMuted hover:text-textPrimary hover:bg-white/5 rounded-lg transition-colors"
            title="Zamknij modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Bar */}
        <div className="px-4 py-2 border-b border-border bg-black/40 flex items-center gap-1.5 overflow-x-auto custom-scrollbar shrink-0 text-xs font-mono">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-accentPrimary/20 border-accentPrimary text-accentPrimary font-bold'
                : 'border-transparent text-textMuted hover:text-textPrimary hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            [INFO] Karta Główna
          </button>

          {hasModules && DOMAIN_MODULES_CONFIG.map((cfg) => {
            const hasData = !!modules[cfg.key];
            return (
              <button
                key={cfg.key}
                onClick={() => setActiveTab(`module-${cfg.key}`)}
                className={`px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === `module-${cfg.key}`
                    ? 'bg-accentSecondary/20 border-accentSecondary text-accentSecondary font-bold'
                    : hasData
                    ? 'border-transparent text-textMuted hover:text-textPrimary hover:bg-white/5'
                    : 'border-transparent text-zinc-600 opacity-40'
                }`}
              >
                {getModuleIcon(cfg.key)}
                <span>{cfg.tag} {cfg.label.split('&')[0].trim()}</span>
              </button>
            );
          })}

          {mixologyRecipes.length > 0 && (
            <button
              onClick={() => setActiveTab('mixology')}
              className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'mixology'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-400 font-bold'
                  : 'border-transparent text-amber-400/70 hover:text-amber-400 hover:bg-amber-500/10'
              }`}
            >
              <Wine className="w-3.5 h-3.5" />
              [BAR] Lis Craft ({mixologyRecipes.length})
            </button>
          )}

          <button
            onClick={() => setActiveTab('relations')}
            className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'relations'
                ? 'bg-accentPrimary/20 border-accentPrimary text-accentPrimary font-bold'
                : 'border-transparent text-textMuted hover:text-textPrimary hover:bg-white/5'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            [GRAF] Relacje ({relations.length})
          </button>

          <button
            onClick={() => setActiveTab('raw')}
            className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'raw'
                ? 'bg-zinc-700/40 border-zinc-500 text-zinc-300 font-bold'
                : 'border-transparent text-textMuted hover:text-textPrimary hover:bg-white/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            [RAW] Markdown
          </button>
        </div>

        {/* Modal Main Content */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
          {loading && (
            <div className="py-16 text-center font-mono text-textMuted animate-pulse text-sm">
              [*] Wczytywanie profilu i kart dziedzinowych...
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg font-mono text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {entity && !loading && (
            <>
              {/* TAB: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-5 animate-soft-enter">
                  {/* Summary Card */}
                  <div className="bg-black/50 border border-border/60 rounded-xl p-4 sm:p-5 font-mono text-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
                      <span className="text-accentPrimary font-bold uppercase tracking-wider text-sm">
                        PROFIL PODMIOTU
                      </span>
                      <span className="text-textMuted">
                        STATUS: <strong className="text-textPrimary">{attributes.housing_status || 'AKTYWNY'}</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-textMuted block">ROLA W EKOSYSTEMIE:</span>
                        <span className="text-textPrimary font-semibold">{attributes.role || 'Brak definicji roli'}</span>
                      </div>
                      <div>
                        <span className="text-textMuted block">ŚCIEŻKA DRZEWA POCHODZENIA:</span>
                        <span className="text-accentSecondary break-all">{entity.tree_path}</span>
                      </div>
                      {attributes.alias && (
                        <div>
                          <span className="text-textMuted block">ALIAS / KOD OPERATORA:</span>
                          <span className="text-amber-400 font-bold">{attributes.alias}</span>
                        </div>
                      )}
                      {attributes.specialization && (
                        <div>
                          <span className="text-textMuted block">GŁÓWNA SPECJALIZACJA:</span>
                          <span className="text-textPrimary">{attributes.specialization}</span>
                        </div>
                      )}
                      {attributes.housing_role && (
                        <div>
                          <span className="text-textMuted block">KWALIFIKACJA MIESZKANIOWA:</span>
                          <span className="text-textPrimary font-medium">{attributes.housing_role}</span>
                        </div>
                      )}
                      {attributes.home_zone && (
                        <div>
                          <span className="text-textMuted block">PRZYPISANA STREFA W PLANIE 120m²:</span>
                          <span className="text-emerald-400 font-medium">{attributes.home_zone}</span>
                        </div>
                      )}
                      {attributes.birth_date && (
                        <div>
                          <span className="text-textMuted block">DATA URODZENIA / METRYKA:</span>
                          <span className="text-textPrimary">{attributes.birth_date}</span>
                        </div>
                      )}
                      {attributes.address && (
                        <div>
                          <span className="text-textMuted block">LOKALIZACJA BAZOWA:</span>
                          <span className="text-textPrimary">{attributes.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 10 Modules Quick Grid */}
                  {hasModules && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-mono text-xs font-semibold text-textMuted uppercase tracking-wider flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 text-accentPrimary" />
                          Dostępne Karty Dziedzinowe (10 Modułów)
                        </h3>
                        <span className="text-[11px] font-mono text-textMuted">
                          Kliknij moduł, aby otworzyć szczegóły
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {DOMAIN_MODULES_CONFIG.map((cfg) => {
                          const mData = modules[cfg.key];
                          if (!mData) return null;
                          return (
                            <button
                              key={cfg.key}
                              onClick={() => setActiveTab(`module-${cfg.key}`)}
                              className="text-left bg-black/40 hover:bg-black/70 border border-border/50 hover:border-accentPrimary/50 p-3 rounded-xl transition-all font-mono group"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-textPrimary group-hover:text-accentPrimary flex items-center gap-1.5">
                                  {getModuleIcon(cfg.key)}
                                  {cfg.tag} {cfg.label}
                                </span>
                                <ChevronRight className="w-3.5 h-3.5 text-textMuted group-hover:text-accentPrimary transition-transform group-hover:translate-x-0.5" />
                              </div>
                              <p className="text-[11px] text-textMuted line-clamp-2">
                                {cfg.desc}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Direct Specific Details (Style, Gear, Focus, Trust) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                    {attributes.style && (
                      <div className="bg-black/40 p-3.5 rounded-xl border border-border/40">
                        <span className="text-accentPrimary font-bold block mb-1">[STYLE] CLEAN TACTICAL:</span>
                        <p className="text-zinc-300 leading-relaxed">{attributes.style}</p>
                      </div>
                    )}
                    {attributes.gear && (
                      <div className="bg-black/40 p-3.5 rounded-xl border border-border/40">
                        <span className="text-accentSecondary font-bold block mb-1">[GEAR] WYPOSAŻENIE & POJAZDY:</span>
                        <p className="text-zinc-300 leading-relaxed">{attributes.gear}</p>
                      </div>
                    )}
                    {attributes.training && (
                      <div className="bg-black/40 p-3.5 rounded-xl border border-border/40">
                        <span className="text-emerald-400 font-bold block mb-1">[WORKOUT] KALISTENIKA & CORE:</span>
                        <p className="text-zinc-300 leading-relaxed">{attributes.training}</p>
                      </div>
                    )}
                    {attributes.focus_stimulants && (
                      <div className="bg-black/40 p-3.5 rounded-xl border border-border/40">
                        <span className="text-cyan-400 font-bold block mb-1">[FOCUS] STYMULACJA KOGNITYWNA:</span>
                        <p className="text-zinc-300 leading-relaxed">{attributes.focus_stimulants}</p>
                      </div>
                    )}
                    {attributes.trust_code && (
                      <div className="bg-black/40 p-3.5 rounded-xl border border-border/40">
                        <span className="text-red-400 font-bold block mb-1">[TRUST] ZAUFANIE KODOWE:</span>
                        <p className="text-zinc-300 leading-relaxed">{attributes.trust_code}</p>
                      </div>
                    )}
                    {attributes.phenomenon && (
                      <div className="bg-black/40 p-3.5 rounded-xl border border-border/40">
                        <span className="text-amber-400 font-bold block mb-1">[CASE] SPECYFIKA BEHAWIORALNA:</span>
                        <p className="text-zinc-300 leading-relaxed">{attributes.phenomenon}</p>
                      </div>
                    )}
                  </div>

                  {/* Relations Summary on Overview */}
                  {relations.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-border/40">
                      <div className="flex items-center justify-between">
                        <h4 className="font-mono text-xs font-semibold text-textMuted uppercase tracking-wider flex items-center gap-2">
                          <Link2 className="w-3.5 h-3.5 text-accentSecondary" />
                          Kluczowe Powiązania Sieciowe ({relations.length})
                        </h4>
                        <button
                          onClick={() => setActiveTab('relations')}
                          className="text-[11px] font-mono text-accentPrimary hover:underline"
                        >
                          Zarządzaj powiązaniami [→]
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                        {relations.map((rel) => {
                          const isSource = rel.source_id === currentEntityId;
                          const partnerId = isSource ? rel.target_id : rel.source_id;
                          const partnerName = isSource ? (rel.target_name || rel.target_id) : (rel.source_name || rel.source_id);
                          const partnerType = isSource ? rel.target_type : rel.source_type;
                          return (
                            <button
                              key={rel.id}
                              onClick={() => handleSwitchEntity(partnerId)}
                              className="text-left bg-black/40 hover:bg-black/60 p-2.5 rounded-lg border border-border/40 hover:border-accentPrimary/40 flex items-center justify-between transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-accentSecondary font-bold text-[11px] shrink-0">
                                  {isSource ? `[→ ${rel.relation_type}]` : `[← ${rel.relation_type}]`}
                                </span>
                                <span className="text-textPrimary font-semibold truncate hover:underline">
                                  {partnerName}
                                </span>
                              </div>
                              {partnerType && (
                                <span className={`text-[9px] px-1.5 py-0.2 rounded border shrink-0 ${formatBadge(partnerType)}`}>
                                  [{partnerType}]
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: DOMAIN MODULE (1 of 10) */}
              {activeTab.startsWith('module-') && (() => {
                const modKey = activeTab.replace('module-', '');
                const modData = modules[modKey];
                const cfg = DOMAIN_MODULES_CONFIG.find(c => c.key === modKey);

                if (!modData) {
                  return (
                    <div className="p-8 text-center font-mono text-xs text-textMuted bg-black/30 rounded-xl border border-border/30">
                      Brak danych dla modułu [{modKey.toUpperCase()}].
                    </div>
                  );
                }

                return (
                  <div className="space-y-4 animate-soft-enter">
                    {/* Module Title Bar */}
                    <div className="flex items-center justify-between bg-black/60 p-3.5 rounded-xl border border-border/60">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-accentSecondary/10 text-accentSecondary border border-accentSecondary/30">
                          {getModuleIcon(modKey)}
                        </div>
                        <div>
                          <h3 className="font-mono text-sm font-bold text-textPrimary flex items-center gap-2">
                            <span>{cfg?.tag}</span>
                            <span>{cfg?.label}</span>
                          </h3>
                          <p className="text-[11px] font-mono text-textMuted">
                            {cfg?.desc}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleCopyText(modData.raw, `mod-${modKey}`)}
                        className="px-3 py-1.5 rounded-lg border border-border bg-black/40 hover:bg-white/5 text-xs font-mono flex items-center gap-1.5 transition-colors text-textMuted hover:text-textPrimary"
                      >
                        {copiedKey === `mod-${modKey}` ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-accentPrimary" />
                            <span>SKOPIOWANO</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>KOPIUJ MD</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Frontmatter Metadata Pill Grid */}
                    {modData.frontmatter && Object.keys(modData.frontmatter).length > 0 && (
                      <div className="bg-black/40 p-3 rounded-xl border border-border/40 font-mono text-xs">
                        <span className="text-[10px] text-textMuted uppercase font-bold block mb-2">METADANE MODUŁU:</span>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(modData.frontmatter).map(([k, v]) => (
                            <span key={k} className="px-2 py-1 rounded bg-black/60 border border-border/60 text-textMuted text-[11px]">
                              <strong className="text-textPrimary">{k}:</strong> {Array.isArray(v) ? v.join(', ') : String(v)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Parsed Sections */}
                    {modData.sections && Object.keys(modData.sections).length > 0 ? (
                      <div className="space-y-3">
                        {Object.entries(modData.sections).map(([title, body]) => (
                          <div key={title} className="bg-black/50 p-4 rounded-xl border border-border/50 font-mono text-xs space-y-2">
                            <h4 className="text-accentPrimary font-bold text-xs uppercase tracking-wider border-b border-border/30 pb-1.5 flex items-center gap-1.5">
                              <span>[+]</span>
                              <span>{title}</span>
                            </h4>
                            <div className="text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans text-xs">
                              {body}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-black/50 p-4 rounded-xl border border-border/50 font-mono text-xs whitespace-pre-wrap text-zinc-300">
                        {modData.raw}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* TAB: MIXOLOGY MENU */}
              {activeTab === 'mixology' && (
                <div className="space-y-4 animate-soft-enter">
                  <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl font-mono text-xs text-amber-300 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-amber-400 flex items-center gap-2">
                        <Wine className="w-4 h-4" />
                        LIS CRAFT MIXOLOGY — CYFROWE MENU AUTORSKICH KOKTAJLI
                      </h3>
                      <p className="text-[11px] text-amber-300/80 mt-0.5">
                        Receptury sygnaturowe zintegrowane z profilem Operatora Jakuba i strefą relaksu Flat 120m²
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-amber-500/20 border border-amber-500/40 font-bold text-xs">
                      {mixologyRecipes.length} DRINKÓW
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {mixologyRecipes.map((drink, idx) => (
                      <div key={idx} className="bg-black/60 border border-border/60 hover:border-amber-500/40 p-4 rounded-xl font-mono text-xs space-y-2.5 transition-all">
                        <div className="flex items-center justify-between border-b border-border/40 pb-2">
                          <span className="font-bold text-textPrimary text-sm text-amber-400 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            {drink.name}
                          </span>
                          <span className="text-[10px] text-textMuted uppercase">
                            #{idx + 1}
                          </span>
                        </div>

                        <div>
                          <span className="text-textMuted block text-[10px]">PROFIL SMAKOWY:</span>
                          <span className="text-textPrimary">{drink.flavor_profile}</span>
                        </div>

                        <div>
                          <span className="text-textMuted block text-[10px]">BAZA ALKOHOLOWA:</span>
                          <span className="text-zinc-300">{drink.alcohol_base}</span>
                        </div>

                        <div>
                          <span className="text-textMuted block text-[10px]">SPOSÓB PODANIA:</span>
                          <span className="text-zinc-400">{drink.serving_method}</span>
                        </div>

                        {drink.virgin_alternative && (
                          <div className="bg-emerald-500/10 border border-emerald-500/30 p-2 rounded-lg text-emerald-300 text-[11px]">
                            <strong className="block text-emerald-400 mb-0.5">WARIANT VIRGIN (0.0%):</strong>
                            {drink.virgin_alternative}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: RELATIONS GRAPH */}
              {activeTab === 'relations' && (
                <div className="space-y-5 animate-soft-enter">
                  <div className="flex items-center justify-between">
                    <h3 className="font-mono text-xs font-semibold text-textMuted uppercase tracking-wider flex items-center gap-2">
                      <Link2 className="w-3.5 h-3.5 text-accentSecondary" />
                      Powiązania Sieciowe Podmiotu ({relations.length})
                    </h3>
                    <span className="text-[11px] font-mono text-textMuted">
                      Kliknij powiązany węzeł, aby przejść do jego karty
                    </span>
                  </div>

                  {relations.length === 0 ? (
                    <div className="bg-black/30 p-6 rounded-xl border border-border/30 text-center font-mono text-xs text-textMuted">
                      Brak zarejestrowanych relacji sieciowych dla tego podmiotu.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {relations.map((rel) => {
                        const isSource = rel.source_id === currentEntityId;
                        const partnerId = isSource ? rel.target_id : rel.source_id;
                        const partnerName = isSource ? (rel.target_name || rel.target_id) : (rel.source_name || rel.source_id);
                        const partnerType = isSource ? rel.target_type : rel.source_type;

                        return (
                          <div
                            key={rel.id}
                            className="bg-black/50 p-3.5 rounded-xl border border-border/50 flex items-center justify-between text-xs font-mono hover:border-accentPrimary/40 transition-colors"
                          >
                            <button
                              onClick={() => handleSwitchEntity(partnerId)}
                              className="text-left flex items-center gap-3 hover:opacity-80 transition-opacity flex-1 min-w-0"
                            >
                              <span className="text-accentSecondary font-bold shrink-0">
                                {isSource ? `[→ ${rel.relation_type}]` : `[← ${rel.relation_type}]`}
                              </span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  {partnerType && (
                                    <span className={`text-[9px] px-1.5 py-0.2 rounded border ${formatBadge(partnerType)}`}>
                                      [{partnerType}]
                                    </span>
                                  )}
                                  <span className="text-textPrimary font-semibold truncate hover:underline">
                                    {partnerName}
                                  </span>
                                </div>
                                {rel.metadata?.note && (
                                  <p className="text-textMuted italic text-[11px] truncate mt-0.5">
                                    {rel.metadata.note}
                                  </p>
                                )}
                              </div>
                            </button>
                            <button
                              onClick={() => handleDeleteRelation(rel.id)}
                              className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors shrink-0 ml-2"
                              title="Usuń relację"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Add Relation Form */}
                  <form onSubmit={handleCreateRelation} className="bg-black/60 p-4 rounded-xl border border-border/60 space-y-3 font-mono text-xs">
                    <h4 className="font-semibold text-textPrimary flex items-center gap-2">
                      <Plus className="w-3.5 h-3.5 text-accentPrimary" />
                      Dodaj Nowe Powiązanie Grafowe
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="ID węzła docelowego (np. node-wiki)..."
                        value={targetId}
                        onChange={(e) => setTargetId(e.target.value)}
                        className="bg-surface border border-border rounded px-3 py-1.5 text-xs focus:outline-none focus:border-accentPrimary"
                      />
                      <select
                        value={relationType}
                        onChange={(e) => setRelationType(e.target.value)}
                        className="bg-surface border border-border rounded px-3 py-1.5 text-xs focus:outline-none focus:border-accentPrimary"
                      >
                        {RELATION_TYPES.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Notatka / opis relacji..."
                        value={relNote}
                        onChange={(e) => setRelNote(e.target.value)}
                        className="bg-surface border border-border rounded px-3 py-1.5 text-xs focus:outline-none focus:border-accentPrimary"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      {relMsg && (
                        <span className="text-xs text-accentPrimary">{relMsg}</span>
                      )}
                      <button
                        type="submit"
                        disabled={relSubmitting || !targetId.trim()}
                        className="ml-auto bg-accentPrimary/20 text-accentPrimary border border-accentPrimary/40 hover:bg-accentPrimary hover:text-black font-bold text-xs px-4 py-1.5 rounded transition-all disabled:opacity-50"
                      >
                        {relSubmitting ? '[~] DODAWANIE...' : '[+] UTWÓRZ POWIĄZANIE'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB: RAW MARKDOWN / EXPORT */}
              {activeTab === 'raw' && (
                <div className="space-y-4 animate-soft-enter">
                  <div className="flex items-center justify-between bg-black/60 p-3.5 rounded-xl border border-border/60">
                    <span className="font-mono text-xs text-textMuted">
                      Kompletny zrzut struktury podmiotu (zgodny z formatem Markdown bazy Obsidian)
                    </span>
                    <button
                      onClick={() => {
                        const dump = JSON.stringify(entity, null, 2);
                        handleCopyText(dump, 'json-dump');
                      }}
                      className="px-3 py-1.5 rounded-lg border border-border bg-black/40 hover:bg-white/5 text-xs font-mono flex items-center gap-1.5 transition-colors text-textMuted hover:text-textPrimary"
                    >
                      {copiedKey === 'json-dump' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-accentPrimary" />
                          <span>SKOPIOWANO JSON</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>KOPIUJ JSON</span>
                        </>
                      )}
                    </button>
                  </div>

                  <pre className="p-4 bg-black/70 rounded-xl border border-border/50 text-[11px] font-mono text-zinc-300 overflow-x-auto custom-scrollbar max-h-[500px]">
                    {JSON.stringify(entity, null, 2)}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between shrink-0 bg-surface">
          <button
            onClick={handleDeleteEntity}
            disabled={deleting}
            className="flex items-center gap-2 text-xs font-mono text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/60 px-3 py-1.5 rounded-lg transition-colors bg-red-500/10"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{deleting ? '[~] USUWANIE...' : '[DEL] USUŃ PODMIOT'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-1.5 font-mono text-xs text-textMuted hover:text-textPrimary bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          >
            ZAMKNIJ
          </button>
        </div>

      </div>
    </div>
  );
};

export default EntityDetailsModal;
