import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Dumbbell, Plus, Trash2, Calendar, Clock, Activity, Flame } from 'lucide-react';

const WorkoutsPage = () => {
  const [workouts, setWorkouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    type: 'Siłowy',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const loadData = async () => {
    try {
      const res = await axios.get('/api/workouts');
      setWorkouts(res.data);
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/workouts/${id}`);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/workouts', formData);
      setShowModal(false);
      setFormData({
        title: '',
        type: 'Siłowy',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const getTypeColor = (type) => {
    switch (type.toLowerCase()) {
      case 'siłowy': return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
      case 'cardio': return 'text-red-500 bg-red-500/10 border-red-500/30';
      case 'kalistenika': return 'text-cyan-500 bg-cyan-500/10 border-cyan-500/30';
      case 'rozciąganie': return 'text-green-500 bg-green-500/10 border-green-500/30';
      default: return 'text-accentPrimary bg-accentPrimary/10 border-accentPrimary/30';
    }
  };

  if (isLoading) {
    return <div className="h-full flex items-center justify-center"><Dumbbell className="w-8 h-8 animate-pulse text-accentPrimary" /></div>;
  }

  return (
    <div className="h-full flex flex-col space-y-6 animate-fade-in relative">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-3xl font-bold font-mono tracking-tight flex items-center gap-3">
            <Dumbbell className="w-8 h-8 text-accentPrimary" />
            Dziennik Treningowy
          </h1>
          <p className="text-textMuted mt-1 font-mono text-sm">Zarządzaj swoimi treningami przy pomocy AI.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accentPrimary text-background font-bold rounded-lg hover:bg-accentPrimary/90 transition-colors shadow-[0_0_15px_rgba(var(--color-accent-primary),0.4)]"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nowy Trening</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
        <div className="glass-panel p-6 rounded-2xl border border-border flex items-center gap-4">
          <div className="p-3 bg-orange-500/20 text-orange-500 rounded-xl border border-orange-500/30">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-textMuted font-mono">Zapisane Treningi</p>
            <p className="text-2xl font-bold">{workouts.length}</p>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-border flex items-center gap-4">
          <div className="p-3 bg-accentPrimary/20 text-accentPrimary rounded-xl border border-accentPrimary/30">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-textMuted font-mono">Ostatni Trening</p>
            <p className="text-xl font-bold">{workouts.length > 0 ? workouts[0].date : 'Brak'}</p>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-border flex items-center gap-4">
          <div className="p-3 bg-red-500/20 text-red-500 rounded-xl border border-red-500/30">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-textMuted font-mono">Wsparcie AI</p>
            <p className="text-xs text-textMuted mt-1">Poproś Mentora o ułożenie planu. Worker zapisze go automatycznie.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 glass-panel rounded-2xl border border-border overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border bg-surface/50 font-mono text-sm text-textMuted flex justify-between">
          <span>Historia Treningów</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {workouts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-textMuted space-y-4">
              <Dumbbell className="w-12 h-12 opacity-20" />
              <p>Brak zapisanych treningów.</p>
              <p className="text-sm">Porada: Zapytaj Mentora w AI Terminalu o rozpisanie dzisiejszego treningu!</p>
            </div>
          ) : (
            workouts.map((w) => (
              <div key={w.id} className="p-4 rounded-xl border border-border bg-surface hover:border-accentPrimary/50 transition-colors group relative">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-lg">{w.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getTypeColor(w.type)}`}>
                        {w.type}
                      </span>
                      <span className="text-xs text-textMuted flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {w.date}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(w.id)}
                    className="p-2 rounded-lg text-textMuted hover:text-red-400 hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {w.description && (
                  <div className="mt-3 text-sm text-textMuted whitespace-pre-wrap font-mono bg-background/50 p-3 rounded-lg border border-border/50">
                    {w.description}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="glass-panel p-6 rounded-2xl border border-border w-full max-w-md shadow-2xl animate-scale-in">
            <h2 className="text-xl font-bold font-mono mb-4 flex items-center gap-2">
              <Plus className="text-accentPrimary" />
              Dodaj Ręcznie Trening
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-textMuted mb-1">Tytuł (np. Klatka i Biceps)</label>
                <input 
                  type="text" 
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-textPrimary focus:outline-none focus:border-accentPrimary"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-textMuted mb-1">Data</label>
                  <input 
                    type="date" 
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-textPrimary focus:outline-none focus:border-accentPrimary [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-textMuted mb-1">Typ</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-textPrimary focus:outline-none focus:border-accentPrimary appearance-none"
                  >
                    <option value="Siłowy">Siłowy</option>
                    <option value="Cardio">Cardio</option>
                    <option value="Kalistenika">Kalistenika</option>
                    <option value="Rozciąganie">Rozciąganie</option>
                    <option value="Inne">Inne</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-textMuted mb-1">Opis / Plan (Opcjonalnie)</label>
                <textarea 
                  rows="4"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Przysiady 4x10&#10;Martwy Ciąg 3x8..."
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-textPrimary focus:outline-none focus:border-accentPrimary resize-none font-mono text-sm"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 border border-border rounded-lg text-textMuted hover:bg-surface transition-colors font-bold"
                >
                  Anuluj
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2 bg-accentPrimary text-background rounded-lg hover:bg-accentPrimary/90 transition-colors font-bold"
                >
                  Zapisz
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
