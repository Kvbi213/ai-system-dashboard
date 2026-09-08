import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Dumbbell, Plus, Trash2, Calendar, Clock, Activity, Flame, Search, Sparkles, Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import { subscribeCollection, saveCloudDocument, deleteCloudDocument, isCloudEnvironment } from '../services/cloudSync';

const WorkoutsPage = () => {
  const { t } = useTranslation();

  const [workouts, setWorkouts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  
  const [formData, setFormData] = useState({
    title: '',
    type: 'Siłowy',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  // 1. Subskrypcja Firestore CloudSync dla treningów
  useEffect(() => {
    const unsub = subscribeCollection('workouts', (data) => {
      if (Array.isArray(data)) {
        const sorted = [...data].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        setWorkouts(sorted);
      }
    });

    // Pobranie z backendu Express jeśli jest online (tylko lokalnie)
    if (!isCloudEnvironment()) {
      axios.get('/api/workouts')
        .then(res => {
          if (Array.isArray(res.data) && res.data.length > 0) {
            setWorkouts(prev => {
              const combined = [...res.data];
              prev.forEach(p => {
                if (!combined.some(c => String(c.id) === String(p.id))) {
                  combined.push(p);
                }
              });
              return combined;
            });
          }
        })
        .catch(() => {});
    }

    return () => unsub();
  }, []);

  const handleDelete = async (id) => {
    const idStr = String(id);
    setWorkouts(prev => prev.filter(w => String(w.id) !== idStr));
    await deleteCloudDocument('workouts', idStr);
    if (!isCloudEnvironment()) {
      try {
        await axios.delete(`/api/workouts/${idStr}`);
      } catch {}
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const newWorkout = {
      ...formData,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    };

    setWorkouts(prev => [newWorkout, ...prev]);
    setShowModal(false);
    setFormData({
      title: '',
      type: 'Siłowy',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });

    await saveCloudDocument('workouts', newWorkout.id, newWorkout);
    if (!isCloudEnvironment()) {
      try {
        await axios.post('/api/workouts', newWorkout);
      } catch {}
    }
  };

  const getTypeColor = (type) => {
    switch (type.toLowerCase()) {
      case 'siłowy': return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'cardio': return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'kalistenika': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
      case 'rozciąganie': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      default: return 'text-accentPrimary bg-accentPrimary/10 border-accentPrimary/30';
    }
  };

  const filteredWorkouts = useMemo(() => {
    return workouts.filter(w => {
      const matchSearch = searchQuery === '' || 
        w.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.description?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;
      if (selectedType === 'all') return true;
      return w.type?.toLowerCase() === selectedType.toLowerCase();
    });
  }, [workouts, searchQuery, selectedType]);

  const stats = useMemo(() => {
    const countByType = {
      siłowy: workouts.filter(w => w.type?.toLowerCase() === 'siłowy').length,
      cardio: workouts.filter(w => w.type?.toLowerCase() === 'cardio').length,
      kalistenika: workouts.filter(w => w.type?.toLowerCase() === 'kalistenika').length,
      rozciąganie: workouts.filter(w => w.type?.toLowerCase() === 'rozciąganie').length,
    };
    return { countByType, total: workouts.length };
  }, [workouts]);

  return (
    <div className="h-full flex flex-col space-y-4 sm:space-y-6 animate-soft-enter relative pb-24 md:pb-8 overflow-y-auto custom-scrollbar min-h-0">
      {/* Header */}
      <header className="glass-panel p-4 sm:p-5 rounded-xl border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 flex-shrink-0 opacity-0 animate-soft-enter" style={{ animationDelay: '50ms' }}>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center flex-shrink-0 shadow-sm">
            <Dumbbell className="w-5 h-5 text-accentPrimary" />
          </div>
          <div className="flex flex-col">
            <nav aria-label="breadcrumb" className="flex items-center space-x-2 text-sm text-textMuted mb-0.5">
              <span className="flex items-center text-base sm:text-lg font-medium text-textMuted/70">OmniDash</span>
              <span className="shrink-0 text-base sm:text-lg font-medium text-textMuted/70">/</span>
              <span className="flex items-center text-base sm:text-lg font-medium text-textPrimary">Trening & Fitness</span>
            </nav>
            <p className="font-sans text-xs text-textMuted mt-0.5">
              Zarządzaj swoimi sesjami treningowymi z automatyczną synchronizacją Firestore.
            </p>
          </div>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2.5 bg-accentPrimary/20 hover:bg-accentPrimary/30 text-accentPrimary border border-accentPrimary/40 text-sm font-mono font-bold rounded-lg transition-all shadow-[0_0_15px_rgba(0,229,255,0.15)] active:scale-95"
        >
          <Plus className="w-4 h-4 text-accentPrimary" />
          <span>{t("workNew", "Nowy Trening")}</span>
        </button>
      </header>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 shrink-0">
        <div className="glass-panel p-3 sm:p-4 rounded-xl border border-border flex items-center gap-3 sm:gap-4 group">
          <div className="p-2.5 sm:p-3 bg-orange-500/20 text-orange-400 rounded-xl border border-orange-500/30 group-hover:scale-105 transition-transform shrink-0">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] text-textMuted font-mono uppercase tracking-wider truncate">{t("workSaved", "Zapisane")}</p>
            <p className="text-xl sm:text-2xl font-bold font-mono text-textPrimary">{workouts.length}</p>
          </div>
        </div>

        <div className="glass-panel p-3 sm:p-4 rounded-xl border border-border flex items-center gap-3 sm:gap-4 group">
          <div className="p-2.5 sm:p-3 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30 group-hover:scale-105 transition-transform shrink-0">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] text-textMuted font-mono uppercase tracking-wider truncate">{t("workLast", "Ostatni")}</p>
            <p className="text-sm sm:text-base font-bold font-mono text-textPrimary truncate">{workouts.length > 0 ? workouts[0].date : 'Brak sesji'}</p>
          </div>
        </div>

        <div className="glass-panel p-3 sm:p-4 rounded-xl border border-border flex items-center gap-3 sm:gap-4 group">
          <div className="p-2.5 sm:p-3 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30 group-hover:scale-105 transition-transform shrink-0">
            <Flame className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] text-textMuted font-mono uppercase tracking-wider truncate">Siłowy / Cardio</p>
            <p className="text-sm sm:text-base font-bold font-mono text-textPrimary truncate">{stats.countByType.siłowy} / {stats.countByType.cardio}</p>
          </div>
        </div>

        <div className="glass-panel p-3 sm:p-4 rounded-xl border border-border flex items-center gap-3 sm:gap-4 group">
          <div className="p-2.5 sm:p-3 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 group-hover:scale-105 transition-transform shrink-0">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] text-textMuted font-mono uppercase tracking-wider truncate">Kalistenika & Inne</p>
            <p className="text-sm sm:text-base font-bold font-mono text-textPrimary truncate">{stats.countByType.kalistenika + stats.countByType.rozciąganie}</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="glass-panel rounded-xl border border-border overflow-hidden flex flex-col min-h-[400px] shrink-0 mb-6">
        {/* Bar Controls */}
        <div className="p-3 sm:p-4 border-b border-border bg-black/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-accentPrimary">{t("workHistory", "Historia Treningów")}</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-accentPrimary/10 text-accentPrimary border border-accentPrimary/20">
              {filteredWorkouts.length}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-textMuted absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Szukaj ćwiczenia..."
                className="w-full bg-black/30 border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-textPrimary font-mono outline-none focus:border-accentPrimary transition-colors"
              />
            </div>

            <div className="flex items-center bg-black/30 border border-border rounded-lg p-0.5 text-xs font-mono overflow-x-auto touch-pan-x">
              <button
                onClick={() => setSelectedType('all')}
                className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${selectedType === 'all' ? 'bg-accentPrimary text-black font-bold' : 'text-textMuted hover:text-white'}`}
              >
                Wszystkie
              </button>
              <button
                onClick={() => setSelectedType('siłowy')}
                className={`px-2 py-1 rounded transition-colors whitespace-nowrap ${selectedType === 'siłowy' ? 'bg-orange-500/20 text-orange-400 font-bold' : 'text-textMuted hover:text-white'}`}
              >
                Siłowy
              </button>
              <button
                onClick={() => setSelectedType('cardio')}
                className={`px-2 py-1 rounded transition-colors whitespace-nowrap ${selectedType === 'cardio' ? 'bg-rose-500/20 text-rose-400 font-bold' : 'text-textMuted hover:text-white'}`}
              >
                Cardio
              </button>
            </div>
          </div>
        </div>

        {/* Workouts Feed */}
        <div className="overflow-y-auto max-h-[700px] p-4 space-y-3 custom-scrollbar">
          {filteredWorkouts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-textMuted py-12">
              <Dumbbell className="w-12 h-12 opacity-20 mb-2" />
              <p className="font-mono text-sm">{t("workNoSaved", "Brak zapisanych treningów.")}</p>
              <p className="text-xs text-textMuted/60 mt-1">
                Dodaj swój plan ręcznie lub poproś Mentora AI na czacie o przygotowanie rozpiski!
              </p>
            </div>
          ) : (
            filteredWorkouts.map((w) => (
              <div key={w.id} className="p-4 rounded-xl border border-border/60 bg-black/20 hover:bg-black/40 hover:border-accentPrimary/40 transition-all group relative">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-base text-textPrimary">{w.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${getTypeColor(w.type)}`}>
                        {w.type}
                      </span>
                      <span className="text-xs text-textMuted font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {w.date}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(w.id)}
                    className="p-1.5 rounded-lg text-textMuted hover:text-rose-400 hover:bg-rose-400/10 transition-colors opacity-80 sm:opacity-0 sm:group-hover:opacity-100"
                    title="Usuń trening"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {w.description && (
                  <div className="mt-3 text-xs text-textMuted font-mono bg-black/30 p-3 rounded-lg border border-border/40 overflow-hidden">
                    <ReactMarkdown
                      components={{
                        p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                        li: ({node, ...props}) => <li className="marker:text-accentPrimary" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-bold text-textPrimary" {...props} />
                      }}
                    >
                      {w.description}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Nowy Trening */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-border w-full max-w-md max-h-[90dvh] overflow-y-auto shadow-2xl animate-scale-in bg-background">
            <h2 className="text-base sm:text-lg font-bold font-mono mb-4 flex items-center gap-2 text-accentPrimary">
              <Plus className="w-5 h-5 text-accentPrimary" />
              Dodaj Sesję Treningową
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-textMuted mb-1">{t("workFormTitle", "Tytuł (np. Klatka i Biceps)")}</label>
                <input 
                  type="text" 
                  required
                  autoFocus
                  placeholder="np. FBW — Sesja A"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-textPrimary font-mono focus:outline-none focus:border-accentPrimary text-sm"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-textMuted mb-1">{t("workFormDate", "Data")}</label>
                  <input 
                    type="date" 
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-textPrimary font-mono focus:outline-none focus:border-accentPrimary text-sm [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-textMuted mb-1">{t("workFormType", "Typ")}</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-textPrimary font-mono focus:outline-none focus:border-accentPrimary text-sm appearance-none"
                  >
                    <option value="Siłowy">{t("workTypeStrength", "Siłowy")}</option>
                    <option value="Cardio">{t("workTypeCardio", "Cardio")}</option>
                    <option value="Kalistenika">{t("workTypeCalisthenics", "Kalistenika")}</option>
                    <option value="Rozciąganie">{t("workTypeStretch", "Rozciąganie")}</option>
                    <option value="Inne">{t("workTypeOther", "Inne")}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-textMuted mb-1">{t("workFormDesc", "Opis / Plan (Opcjonalnie)")}</label>
                <textarea 
                  rows="4"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Przysiady 4x10&#10;Wyciskanie leżąc 4x8..."
                  className="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-textPrimary focus:outline-none focus:border-accentPrimary resize-none font-mono text-xs"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 border border-border rounded-lg text-textMuted hover:bg-surface transition-colors font-mono text-xs font-bold"
                >
                  Anuluj
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2 bg-accentPrimary text-black rounded-lg hover:scale-[1.02] transition-transform font-mono text-xs font-bold shadow-[0_0_15px_rgba(0,229,255,0.3)]"
                >
                  Zapisz Trening
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutsPage;
