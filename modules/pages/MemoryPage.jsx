import React, { useState, useEffect } from 'react';
import { BrainCircuit, Trash2, Loader2, Database, Plus, Sparkles, Check, Tag } from 'lucide-react';
import { subscribeCollection, saveCloudDocument, deleteCloudDocument } from '../services/cloudSync.js';

const MemoryPage = () => {
  const [facts, setFacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategory, setNewCategory] = useState('System');
  const [newFact, setNewFact] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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

  const safeFacts = Array.isArray(facts) ? facts : [];

  // Grupowanie według kategorii
  const groupedFacts = safeFacts.reduce((acc, fact) => {
    if (!fact) return acc;
    const cat = fact.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(fact);
    return acc;
  }, {});

  return (
    <div className="h-full flex flex-col glass-panel rounded-xl border border-border p-6 relative overflow-hidden animate-soft-enter">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accentPrimary/10 border border-accentPrimary/30 flex items-center justify-center">
            <BrainCircuit className="w-6 h-6 text-accentPrimary" />
          </div>
          <div>
            <h1 className="font-mono text-xl text-textPrimary uppercase tracking-wider font-bold flex items-center gap-2">
              Operator Brain <span className="text-xs px-2 py-0.5 rounded-full bg-accentPrimary/20 text-accentPrimary font-normal">Firestore CloudSync</span>
            </h1>
            <p className="text-xs text-textMuted font-mono mt-0.5">
              Pamięć długoterminowa asystenta AI zsynchronizowana w chmurze
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-textMuted px-3 py-1.5 rounded-lg bg-black/30 border border-border">
            <Database className="w-3.5 h-3.5 text-accentPrimary" />
            <span>Wpisy: <strong className="text-textPrimary">{safeFacts.length}</strong></span>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-accentPrimary/20 hover:bg-accentPrimary/30 border border-accentPrimary/40 text-accentPrimary font-mono text-xs font-bold transition-all shadow-[0_0_12px_rgba(0,229,255,0.15)]"
          >
            <Plus className="w-4 h-4" /> Dodaj Fakt
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-64 text-textMuted font-mono gap-2">
            <Loader2 className="w-8 h-8 text-accentPrimary animate-spin" />
            <span className="text-xs">Wczytywanie pamięci z Firestore...</span>
          </div>
        ) : safeFacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-textMuted font-mono">
            <Database className="w-12 h-12 mb-3 opacity-30 text-accentPrimary" />
            <p className="text-sm">Brak zapisanych danych w pamięci długoterminowej.</p>
            <p className="text-xs mt-1 text-textMuted/60">Dodaj wiedzę o sobie, preferencjach lub regułach projektu.</p>
          </div>
        ) : (
          Object.keys(groupedFacts).map(category => (
            <div key={category} className="mb-6">
              <h2 className="font-mono text-xs text-accentPrimary uppercase tracking-wider font-bold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accentPrimary animate-pulse"></span>
                {category}
                <span className="text-textMuted text-[10px] font-normal">({groupedFacts[category].length})</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {groupedFacts[category].map(fact => (
                  <div 
                    key={fact.id} 
                    className="bg-black/40 border border-border/70 hover:border-accentPrimary/40 rounded-xl p-4 relative group transition-all duration-200 hover:shadow-[0_0_15px_rgba(0,229,255,0.08)]"
                  >
                    <p className="font-sans text-xs text-textPrimary pr-6 leading-relaxed whitespace-pre-wrap">{fact.fact}</p>
                    <div className="mt-3 pt-2 border-t border-white/5 flex justify-between items-center text-[10px] font-mono text-textMuted">
                      <span>{fact.created_at ? new Date(fact.created_at).toLocaleDateString('pl-PL') : 'Pamięć bazowa'}</span>
                      <span className="px-1.5 py-0.5 rounded bg-white/5">{fact.category || 'General'}</span>
                    </div>
                    <button 
                      onClick={() => deleteFact(fact.id)}
                      className="absolute top-2.5 right-2.5 text-textMuted hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
                      title="Usuń z pamięci"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Dodawania Faktu */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-background border border-border rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-4 border-b border-border flex justify-between items-center bg-black/20">
              <h2 className="font-mono text-accentPrimary font-bold text-sm flex items-center gap-2">
                <BrainCircuit className="w-4 h-4" /> Nowy Wpis Pamięci Długoterminowej
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-textMuted hover:text-white transition-colors">✕</button>
            </div>
            <form onSubmit={handleAddFact} className="p-5 flex flex-col gap-4">
              <div>
                <label className="text-xs font-mono text-textMuted mb-1 block">Kategoria</label>
                <input 
                  type="text" 
                  value={newCategory} 
                  onChange={e => setNewCategory(e.target.value)} 
                  className="w-full bg-black/30 border border-border rounded-lg p-2.5 text-textPrimary font-mono text-xs focus:border-accentPrimary outline-none transition-colors" 
                  placeholder="np. Identity, Goals, Preferences, Architecture"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-mono text-textMuted mb-1 block">Fakt / Reguła / Wiedza</label>
                <textarea 
                  value={newFact} 
                  onChange={e => setNewFact(e.target.value)} 
                  rows={4}
                  className="w-full bg-black/30 border border-border rounded-lg p-2.5 text-textPrimary font-sans text-xs focus:border-accentPrimary outline-none transition-colors custom-scrollbar" 
                  placeholder="Wpisz informację, którą asystent AI ma trwale pamiętać przy każdej rozmowie..."
                  required
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)} 
                  className="px-4 py-2 font-mono text-xs text-textMuted hover:text-textPrimary transition-colors"
                >
                  Anuluj
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="px-5 py-2 font-mono text-xs bg-accentPrimary text-black font-bold rounded-lg shadow-[0_0_15px_rgba(0,229,255,0.3)] hover:scale-105 transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Zapisywanie...' : 'Zapisz w Firestore'}
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
