import React, { useState, useEffect } from 'react';
import { BrainCircuit, Trash2, Loader2, Database } from 'lucide-react';

const MemoryPage = () => {
  const [facts, setFacts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMemory = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/memory');
      const data = await res.json();
      if (data.facts) setFacts(data.facts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteFact = async (id) => {
    try {
      const res = await fetch(`/api/memory/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setFacts(prev => prev.filter(f => f.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMemory();
  }, []);

  // Grupowanie według kategorii
  const groupedFacts = facts.reduce((acc, fact) => {
    if (!acc[fact.category]) acc[fact.category] = [];
    acc[fact.category].push(fact);
    return acc;
  }, {});

  return (
    <div className="h-full flex flex-col glass-panel rounded-xl border border-border p-6 relative overflow-hidden">
      <div className="flex items-center gap-4 mb-8">
        <BrainCircuit className="w-8 h-8 text-accentPrimary" />
        <h1 className="font-mono text-2xl text-accentPrimary uppercase tracking-widest font-bold">
          Operator Brain
        </h1>
        <div className="ml-auto flex gap-2 font-mono text-xs text-textMuted uppercase">
          <span>Records: {facts.length}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-8 h-8 text-accentPrimary animate-spin" />
          </div>
        ) : facts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-textMuted font-mono">
            <Database className="w-12 h-12 mb-4 opacity-50" />
            <p>Brak zapisanych danych w pamięci długoterminowej.</p>
          </div>
        ) : (
          Object.keys(groupedFacts).map(category => (
            <div key={category} className="mb-8">
              <h2 className="font-mono text-lg text-textPrimary uppercase tracking-widest font-bold mb-4 border-b border-border/50 pb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accentPrimary"></span>
                {category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedFacts[category].map(fact => (
                  <div key={fact.id} className="bg-black/40 border border-border rounded-lg p-4 relative group hover:border-accentPrimary/50 transition-colors">
                    <p className="font-mono text-sm text-textPrimary pr-8 whitespace-pre-wrap">{fact.fact}</p>
                    <div className="mt-4 flex justify-between items-center opacity-50 text-xs font-mono">
                      <span>{new Date(fact.created_at).toLocaleDateString()}</span>
                    </div>
                    <button 
                      onClick={() => deleteFact(fact.id)}
                      className="absolute top-3 right-3 text-textMuted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Usuń z pamięci"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MemoryPage;
