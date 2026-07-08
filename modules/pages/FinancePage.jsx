import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet, DollarSign, Settings2, Target, Heart } from 'lucide-react';

const FinancePage = () => {
  const [finances, setFinances] = useState([]);
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [balance, setBalance] = useState(0);
  const [bucketSpending, setBucketSpending] = useState({ needs: 0, wants: 0, savings: 0 });
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: 'Inne',
    bucket: 'needs',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0]
  });

  const [setupData, setSetupData] = useState({
    monthly_income: 5000,
    needs_percent: 50,
    wants_percent: 30,
    savings_percent: 20
  });

  const loadData = async () => {
    try {
      const [finRes, setRes] = await Promise.all([
        axios.get('/api/finances'),
        axios.get('/api/finance/settings')
      ]);
      
      setFinances(finRes.data);
      setSettings(setRes.data);

      let spent = { needs: 0, wants: 0, savings: 0, unassigned: 0 };
      
      finRes.data.forEach(item => {
        if (item.type === 'income') {
          bal += item.amount;
          if (item.bucket) {
            spent[item.bucket] = (spent[item.bucket] || 0) + item.amount;
          } else {
            spent.unassigned += item.amount;
          }
        } else {
          bal -= item.amount;
          if (item.bucket) {
            spent[item.bucket] = (spent[item.bucket] || 0) - item.amount;
          } else {
            spent.unassigned -= item.amount;
          }
        }
      });
      
      setBalance(bal);
      setBucketSpending(spent);
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSetupSubmit = async (e, skip = false) => {
    if (e) e.preventDefault();
    try {
      const dataToSubmit = skip ? { monthly_income: 0, needs_percent: 0, wants_percent: 0, savings_percent: 0 } : setupData;
      await axios.post('/api/finance/settings', dataToSubmit);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/finances/${id}`);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/finances', { ...formData, amount: parseFloat(formData.amount) });
      setShowModal(false);
      setFormData({
        ...formData,
        amount: '',
        category: 'Inne',
        description: ''
      });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-textMuted font-mono">Wczytywanie finansów...</div>;

  if (!settings) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-8 max-w-lg w-full shadow-2xl">
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="p-4 bg-accentPrimary/20 text-accentPrimary rounded-full mb-4">
              <Wallet className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold font-mono text-accentPrimary">Konfiguracja Budżetu</h1>
            <p className="text-sm text-textMuted mt-2 font-sans">Złota zasada 50/30/20 pozwala AI inteligentnie zarządzać Twoimi wydatkami.</p>
          </div>
          
          <form onSubmit={handleSetupSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-mono text-textMuted block mb-1">Deklarowany Stały Przychód (Miesięczny)</label>
              <div className="flex items-center gap-2 bg-black/30 border border-border rounded-lg p-2.5">
                <DollarSign className="w-5 h-5 text-textMuted" />
                <input type="number" required value={setupData.monthly_income} onChange={e => setSetupData({...setupData, monthly_income: parseFloat(e.target.value) || 0})} className="w-full bg-transparent text-textPrimary font-mono outline-none" />
                <span className="text-textMuted font-mono">PLN</span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-mono text-textMuted block mb-1">Potrzeby (%)</label>
                <input type="number" required value={setupData.needs_percent} onChange={e => setSetupData({...setupData, needs_percent: parseFloat(e.target.value) || 0})} className="w-full bg-black/30 border border-border rounded-lg p-2.5 text-textPrimary font-mono outline-none" />
              </div>
              <div>
                <label className="text-xs font-mono text-textMuted block mb-1">Zachcianki (%)</label>
                <input type="number" required value={setupData.wants_percent} onChange={e => setSetupData({...setupData, wants_percent: parseFloat(e.target.value) || 0})} className="w-full bg-black/30 border border-border rounded-lg p-2.5 text-textPrimary font-mono outline-none" />
              </div>
              <div>
                <label className="text-xs font-mono text-textMuted block mb-1">Oszczędności (%)</label>
                <input type="number" required value={setupData.savings_percent} onChange={e => setSetupData({...setupData, savings_percent: parseFloat(e.target.value) || 0})} className="w-full bg-black/30 border border-border rounded-lg p-2.5 text-textPrimary font-mono outline-none" />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button type="submit" className="flex-1 py-3 bg-accentPrimary text-black font-bold font-mono rounded-lg hover:scale-[1.02] transition-transform">
                Zapisz Ustawienia
              </button>
              <button type="button" onClick={(e) => handleSetupSubmit(e, true)} className="flex-1 py-3 bg-white/5 text-textMuted font-bold font-mono rounded-lg hover:bg-white/10 transition-colors">
                Pomiń
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Brak sztywnego wyliczania budżetu z procentów, bazujemy na fizycznym saldzie w bucketSpending

  return (
    <div className="w-full h-full flex flex-col gap-6 animate-fade-in pb-20">
      <header className="flex justify-between items-center bg-black/40 backdrop-blur-md p-5 rounded-xl border border-white/5 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-accentPrimary/20 text-accentPrimary rounded-xl shadow-[0_0_15px_rgba(var(--accent-primary-rgb),0.3)]">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-mono text-xl text-accentPrimary font-bold tracking-tight">Finanse Inteligentne</h1>
            <p className="font-sans text-xs text-textMuted mt-0.5">Stan ogólny: <span className={balance >= 0 ? 'text-green-400' : 'text-red-400'}>{balance.toFixed(2)} PLN</span></p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setSettings(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-textMuted transition-colors">
            <Settings2 className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accentPrimary/20 hover:bg-accentPrimary/30 text-accentPrimary rounded-lg transition-colors border border-accentPrimary/30"
          >
            <Plus className="w-4 h-4" /> Dodaj wpis
          </button>
        </div>
      </header>

      {/* Kubełki (Buckets) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Needs */}
        <div className="glass-panel p-5 rounded-xl flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Target className="w-12 h-12" /></div>
          <p className="text-[10px] text-textMuted font-mono mb-1">UŻYTEK COMIESIĘCZNY (NEEDS)</p>
          <p className="text-xl font-bold font-mono text-textPrimary">{(bucketSpending.needs || 0).toFixed(2)} PLN</p>
        </div>

        {/* Wants */}
        <div className="glass-panel p-5 rounded-xl flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Heart className="w-12 h-12" /></div>
          <p className="text-[10px] text-textMuted font-mono mb-1">ZACHCIANKI (WANTS)</p>
          <p className="text-xl font-bold font-mono text-textPrimary">{(bucketSpending.wants || 0).toFixed(2)} PLN</p>
        </div>

        {/* Savings */}
        <div className="glass-panel p-5 rounded-xl flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><TrendingUp className="w-12 h-12" /></div>
          <p className="text-[10px] text-textMuted font-mono mb-1">OSZCZĘDNOŚCI (SAVINGS)</p>
          <p className="text-xl font-bold font-mono text-textPrimary">{(bucketSpending.savings || 0).toFixed(2)} PLN</p>
        </div>

        {/* Unassigned */}
        <div className="glass-panel p-5 rounded-xl flex flex-col justify-center relative overflow-hidden group border-dashed border-2 border-white/10">
          <p className="text-[10px] text-textMuted font-mono mb-1">WOLNE ŚRODKI (UNASSIGNED)</p>
          <p className="text-xl font-bold font-mono text-textPrimary">{(bucketSpending.unassigned || 0).toFixed(2)} PLN</p>
        </div>

      </div>

      {/* List */}
      <div className="glass-panel rounded-xl overflow-hidden flex-1 flex flex-col">
        <div className="p-4 border-b border-border bg-black/20 font-mono text-sm font-bold text-accentPrimary flex justify-between">
          <span>Historia Transakcji</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {finances.length === 0 ? (
            <p className="text-textMuted text-sm text-center py-10 font-mono">Brak wpisów finansowych.</p>
          ) : (
            finances.map(item => (
              <div key={item.id} className="flex justify-between items-center p-4 bg-black/20 hover:bg-black/40 border border-border/50 rounded-lg transition-colors group">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${item.type === 'income' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {item.type === 'income' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-sans font-medium text-textPrimary text-sm">
                      {item.category} 
                      {item.bucket && item.type === 'expense' && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10">{item.bucket.toUpperCase()}</span>}
                    </p>
                    <p className="text-xs text-textMuted font-mono mt-1">
                      {item.transaction_date} {item.description && <span>— {item.description}</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`font-mono font-bold ${item.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                    {item.type === 'income' ? '+' : '-'}{item.amount.toFixed(2)} {item.currency}
                  </span>
                  <button onClick={() => handleDelete(item.id)} className="text-textMuted hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-background border border-border rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-border flex justify-between items-center bg-black/20">
              <h2 className="font-mono text-accentPrimary font-bold">Nowa Transakcja</h2>
              <button onClick={() => setShowModal(false)} className="text-textMuted hover:text-white transition-colors">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
              
              <div className="flex gap-2 bg-black/30 p-1 rounded-lg border border-border/50">
                <button type="button" onClick={() => setFormData({...formData, type: 'expense'})} className={`flex-1 py-2 text-sm font-bold font-mono rounded-md transition-colors ${formData.type === 'expense' ? 'bg-red-500/20 text-red-400' : 'text-textMuted hover:text-textPrimary'}`}>WYDATEK</button>
                <button type="button" onClick={() => setFormData({...formData, type: 'income'})} className={`flex-1 py-2 text-sm font-bold font-mono rounded-md transition-colors ${formData.type === 'income' ? 'bg-green-500/20 text-green-400' : 'text-textMuted hover:text-textPrimary'}`}>PRZYCHÓD</button>
              </div>

              <div>
                <label className="text-xs font-mono text-textMuted mb-1 block">Kwota (PLN)</label>
                <input type="number" step="0.01" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full bg-black/30 border border-border rounded-lg p-2.5 text-textPrimary font-mono focus:border-accentPrimary outline-none transition-colors" placeholder="0.00" />
              </div>

              {formData.type === 'expense' && (
                <div>
                  <label className="text-xs font-mono text-textMuted mb-1 block">Kubełek (Bucket)</label>
                  <select value={formData.bucket} onChange={e => setFormData({...formData, bucket: e.target.value})} className="w-full bg-black/30 border border-border rounded-lg p-2.5 text-textPrimary font-mono focus:border-accentPrimary outline-none transition-colors">
                    <option value="needs">Potrzeby (Needs)</option>
                    <option value="wants">Zachcianki (Wants)</option>
                    <option value="savings">Oszczędności (Savings)</option>
                  </select>
                </div>
              )}
              
              <div>
                <label className="text-xs font-mono text-textMuted mb-1 block">Kategoria</label>
                <input type="text" required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-black/30 border border-border rounded-lg p-2.5 text-textPrimary font-mono focus:border-accentPrimary outline-none transition-colors" placeholder="np. Jedzenie, Wypłata" />
              </div>
              
              <div>
                <label className="text-xs font-mono text-textMuted mb-1 block">Opis (opcjonalnie)</label>
                <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-black/30 border border-border rounded-lg p-2.5 text-textPrimary font-mono focus:border-accentPrimary outline-none transition-colors" placeholder="np. Zakupy w Biedronce" />
              </div>

              <div>
                <label className="text-xs font-mono text-textMuted mb-1 block">Data</label>
                <input type="date" required value={formData.transaction_date} onChange={e => setFormData({...formData, transaction_date: e.target.value})} className="w-full bg-black/30 border border-border rounded-lg p-2.5 text-textPrimary font-mono focus:border-accentPrimary outline-none transition-colors" />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 font-mono text-sm text-textMuted hover:text-textPrimary transition-colors">Anuluj</button>
                <button type="submit" className="px-5 py-2 font-mono text-sm bg-accentPrimary text-black font-bold rounded-lg shadow-[0_0_15px_rgba(var(--accent-primary-rgb),0.4)] hover:scale-105 transition-all">Zapisz</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancePage;
