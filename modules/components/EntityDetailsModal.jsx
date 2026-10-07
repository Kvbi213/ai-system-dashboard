import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Network, Trash2, Plus, Link2, Info, FolderTree, AlertCircle, Check } from 'lucide-react';

const RELATION_TYPES = [
  'EMPLOYED_AT',
  'STUDENT_OF',
  'FRIEND_OF',
  'OWNER_OF',
  'ASSOCIATED_WITH',
  'PARTNER_OF',
  'MEMBER_OF'
];

export const EntityDetailsModal = ({ entityId, onClose, onEntityUpdated }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [entity, setEntity] = useState(null);
  const [relations, setRelations] = useState([]);

  // Form states for new relation
  const [targetId, setTargetId] = useState('');
  const [relationType, setRelationType] = useState('EMPLOYED_AT');
  const [relNote, setRelNote] = useState('');
  const [relSubmitting, setRelSubmitting] = useState(false);
  const [relMsg, setRelMsg] = useState('');

  // Delete state
  const [deleting, setDeleting] = useState(false);

  const fetchDetails = async () => {
    if (!entityId) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`/api/entities/${entityId}`, { timeout: 7000 });
      if (res.data && res.data.success) {
        setEntity(res.data.entity);
        setRelations(res.data.relations || []);
      } else {
        setError(res.data?.error || 'Nie udało się pobrać szczegółów podmiotu.');
      }
    } catch (err) {
      const fallbackNodes = {
        'node-jakub': {
          id: 'node-jakub',
          name: 'Jakub Lis',
          type: 'PERSON',
          parent_id: 'node-zse',
          tree_path: '/polska/wojewodztwo_pomorskie/starogard_gdanski/zse_im_noblistow_polskich/jakub_lis/',
          attributes: { role: 'Lead Dev / Technik Informatyk', specialization: 'AI / FullStack', status: 'Aktywny' },
          created_at: '2026-10-07 14:00:00'
        },
        'node-damian': {
          id: 'node-damian',
          name: 'Damian',
          type: 'PERSON',
          parent_id: 'node-zse',
          tree_path: '/polska/wojewodztwo_pomorskie/starogard_gdanski/zse_im_noblistow_polskich/damian/',
          attributes: { role: 'Gamer / Modder', focus: 'Hardware / Modding' },
          created_at: '2026-10-07 14:00:00'
        },
        'node-zse': {
          id: 'node-zse',
          name: 'ZSE im. Noblistów Polskich',
          type: 'ORGANIZATION',
          parent_id: 'node-starogard',
          tree_path: '/polska/wojewodztwo_pomorskie/starogard_gdanski/zse_im_noblistow_polskich/',
          attributes: { address: 'ul. Paderewskiego 11, Starogard Gdański', type: 'Szkoła Ponadpodstawowa' },
          created_at: '2026-10-07 14:00:00'
        },
        'node-michal': {
          id: 'node-michal',
          name: 'Michał Nowak',
          type: 'PERSON',
          parent_id: 'node-warszawa',
          tree_path: '/polska/wojewodztwo_mazowieckie/warszawa/michal_nowak/',
          attributes: { role: 'Backend Dev', focus: 'Cloud Architecture' },
          created_at: '2026-10-07 14:00:00'
        }
      };
      const found = fallbackNodes[entityId];
      if (found) {
        setEntity(found);
        setRelations([
          { id: 'rel-1', source_id: 'node-jakub', target_id: 'node-zse', target_name: 'ZSE im. Noblistów Polskich', target_type: 'ORGANIZATION', relation_type: 'STUDENT_OF', metadata: { note: 'Technik Informatyk' } },
          { id: 'rel-2', source_id: 'node-jakub', target_id: 'node-damian', target_name: 'Damian', target_type: 'PERSON', relation_type: 'FRIEND_OF', metadata: { note: 'Współpraca / Gaming' } }
        ]);
        setError('');
      } else {
        setError(err.response?.data?.error || err.message || 'Błąd sieci podczas pobierania podmiotu.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [entityId]);

  const handleCreateRelation = async (e) => {
    e.preventDefault();
    if (!targetId.trim()) return;
    setRelSubmitting(true);
    setRelMsg('');
    try {
      const res = await axios.post('/api/entities/relations', {
        source_id: entityId,
        target_id: targetId.trim(),
        relation_type: relationType,
        metadata: relNote.trim() ? { note: relNote.trim() } : {}
      });
      if (res.data?.success) {
        setRelMsg('[+] Relacja została pomyślnie dodana.');
        setTargetId('');
        setRelNote('');
        fetchDetails();
        if (onEntityUpdated) onEntityUpdated();
      }
    } catch (err) {
      setRelMsg('[!] Błąd tworzenia relacji: ' + (err.response?.data?.error || err.message));
    } finally {
      setRelSubmitting(false);
    }
  };

  const handleDeleteRelation = async (relId) => {
    try {
      const res = await axios.delete(`/api/entities/relations/${relId}`);
      if (res.data?.success) {
        setRelations(prev => prev.filter(r => r.id !== relId));
        if (onEntityUpdated) onEntityUpdated();
      }
    } catch (err) {
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
      const res = await axios.delete(`/api/entities/${entityId}?cascade=${cascade}`);
      if (res.data?.success) {
        if (onEntityUpdated) onEntityUpdated();
        onClose();
      }
    } catch (err) {
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
      default: return 'border-zinc-500/40 text-zinc-400 bg-zinc-500/10';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-soft-enter">
      <div className="glass-panel w-full max-w-3xl max-h-[90vh] flex flex-col border border-border shadow-2xl overflow-hidden rounded-2xl bg-surface/95">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between shrink-0 bg-surface">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black/40 border border-border flex items-center justify-center shrink-0">
              <Network className="w-5 h-5 text-accentPrimary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {entity && (
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${formatBadge(entity.type)}`}>
                    [{entity.type}]
                  </span>
                )}
                <h2 className="font-mono font-bold text-lg text-textPrimary tracking-wide">
                  {entity ? entity.name : 'Szczegóły podmiotu'}
                </h2>
              </div>
              <p className="font-mono text-xs text-textMuted mt-0.5 truncate max-w-md">
                {entity?.tree_path || 'Wczytywanie hierarchii...'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-textMuted hover:text-textPrimary hover:bg-white/5 rounded-lg transition-colors"
            title="Zamknij"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          {loading && (
            <div className="py-12 text-center font-mono text-textMuted animate-pulse">
              [*] Pobieranie danych węzła i relacji grafowych...
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
              {/* Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-black/40 p-3 rounded-lg border border-border/40">
                  <span className="text-textMuted block mb-1">ID WĘZŁA:</span>
                  <span className="text-textPrimary break-all select-all">{entity.id}</span>
                </div>
                <div className="bg-black/40 p-3 rounded-lg border border-border/40">
                  <span className="text-textMuted block mb-1">WĘZEŁ NADRZĘDNY (PARENT ID):</span>
                  <span className="text-textPrimary break-all">{entity.parent_id || '[ROOT LEVEL]'}</span>
                </div>
                <div className="bg-black/40 p-3 rounded-lg border border-border/40">
                  <span className="text-textMuted block mb-1">ŚCIEŻKA DRZEWIASTA (TREE PATH):</span>
                  <span className="text-accentSecondary break-all">{entity.tree_path}</span>
                </div>
                <div className="bg-black/40 p-3 rounded-lg border border-border/40">
                  <span className="text-textMuted block mb-1">UTWORZONO / ZAKTUALIZOWANO:</span>
                  <span className="text-textMuted">{entity.created_at || 'Brak danych'}</span>
                </div>
              </div>

              {/* Attributes Section */}
              <div className="space-y-2">
                <h3 className="font-mono text-xs font-semibold text-textMuted uppercase tracking-wider flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-accentPrimary" />
                  Atrybuty i Metadane Podmiotu
                </h3>
                <div className="bg-black/50 p-3.5 rounded-lg border border-border/50 font-mono text-xs text-textPrimary overflow-x-auto">
                  {entity.attributes && Object.keys(entity.attributes).length > 0 ? (
                    <div className="space-y-1.5">
                      {Object.entries(entity.attributes).map(([key, val]) => (
                        <div key={key} className="flex gap-2">
                          <span className="text-accentPrimary font-bold">{key}:</span>
                          <span className="text-zinc-300">
                            {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-textMuted">Brak zdefiniowanych atrybutów JSON.</span>
                  )}
                </div>
              </div>

              {/* Network Relations (Graph Edges) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-mono text-xs font-semibold text-textMuted uppercase tracking-wider flex items-center gap-2">
                    <Link2 className="w-3.5 h-3.5 text-accentSecondary" />
                    Relacje Sieciowe ({relations.length})
                  </h3>
                </div>

                {relations.length === 0 ? (
                  <div className="bg-black/30 p-4 rounded-lg border border-border/30 text-center font-mono text-xs text-textMuted">
                    Brak powiązań grafowych dla tego podmiotu.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {relations.map((rel) => {
                      const isSource = rel.source_id === entity.id;
                      const partnerName = isSource ? (rel.target_name || rel.target_id) : (rel.source_name || rel.source_id);
                      const partnerType = isSource ? rel.target_type : rel.source_type;
                      return (
                        <div
                          key={rel.id}
                          className="bg-black/40 p-3 rounded-lg border border-border/40 flex items-center justify-between text-xs font-mono hover:border-accentPrimary/40 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-accentSecondary font-bold">
                              {isSource ? `[→ ${rel.relation_type}]` : `[← ${rel.relation_type}]`}
                            </span>
                            <div className="flex items-center gap-2">
                              {partnerType && (
                                <span className={`text-[9px] px-1.5 py-0.2 rounded border ${formatBadge(partnerType)}`}>
                                  [{partnerType}]
                                </span>
                              )}
                              <span className="text-textPrimary font-semibold">{partnerName}</span>
                            </div>
                            {rel.metadata?.note && (
                              <span className="text-textMuted italic text-[11px]">
                                ({rel.metadata.note})
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteRelation(rel.id)}
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
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
                <form onSubmit={handleCreateRelation} className="bg-black/60 p-4 rounded-xl border border-border/60 space-y-3">
                  <h4 className="font-mono text-xs font-semibold text-textPrimary flex items-center gap-2">
                    <Plus className="w-3.5 h-3.5 text-accentPrimary" />
                    Dodaj Powiązanie Sieciowe (Nowa Krawędź)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="ID podmiotu docelowego..."
                      value={targetId}
                      onChange={(e) => setTargetId(e.target.value)}
                      className="bg-surface border border-border rounded px-3 py-1.5 font-mono text-xs focus:outline-none focus:border-accentPrimary"
                    />
                    <select
                      value={relationType}
                      onChange={(e) => setRelationType(e.target.value)}
                      className="bg-surface border border-border rounded px-3 py-1.5 font-mono text-xs focus:outline-none focus:border-accentPrimary"
                    >
                      {RELATION_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Notatka / rola powiązania..."
                      value={relNote}
                      onChange={(e) => setRelNote(e.target.value)}
                      className="bg-surface border border-border rounded px-3 py-1.5 font-mono text-xs focus:outline-none focus:border-accentPrimary"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    {relMsg && (
                      <span className="font-mono text-xs text-accentPrimary">{relMsg}</span>
                    )}
                    <button
                      type="submit"
                      disabled={relSubmitting || !targetId.trim()}
                      className="ml-auto bg-accentPrimary/20 text-accentPrimary border border-accentPrimary/40 hover:bg-accentPrimary hover:text-black font-mono font-bold text-xs px-4 py-1.5 rounded transition-all disabled:opacity-50"
                    >
                      {relSubmitting ? '[~] DODAWANIE...' : '[+] POWIĄŻ PODMIOTY'}
                    </button>
                  </div>
                </form>
              </div>
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
            className="px-4 py-1.5 font-mono text-xs text-textMuted hover:text-textPrimary bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          >
            ZAMKNIJ
          </button>
        </div>

      </div>
    </div>
  );
};

export default EntityDetailsModal;
