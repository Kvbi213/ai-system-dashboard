import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet, DollarSign } from 'lucide-react';

const FinancePage = () => {
  const [finances, setFinances] = useState([]);
  const [balance, setBalance] = useState(0);
  const [incomeTotal, setIncomeTotal] = useState(0);
  const [expenseTotal, setExpenseTotal] = useState(0);
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: 'Inne',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0]
  });

  const fetchFinances = async () => {
    try {
      const { data } = await axios.get('/api/finances');
      setFinances(data);
      
      let bal = 0;
      let inc = 0;
      let exp = 0;
      data.forEach(item => {
        if (item.type === 'income') {
          bal += item.amount;
          inc += item.amount;
        } else {
          bal -= item.amount;
          exp += item.amount;
        }
      });
      setBalance(bal);
      setIncomeTotal(inc);
      setExpenseTotal(exp);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFinances();
  }, []);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/finances/${id}`);
      fetchFinances();
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
        type: 'expense',
        amount: '',
        category: 'Inne',
        description: '',
        transaction_date: new Date().toISOString().split('T')[0]
      });
      fetchFinances();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-6 animate-fade-in pb-20">
      <header className="flex justify-between items-center bg-black/40 backdrop-blur-md p-5 rounded-xl border border-white/5 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-accentPrimary/20 text-accentPrimary rounded-xl shadow-[0_0_15px_rgba(var(--accent-primary-rgb),0.3)]">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-mono text-xl text-accentPrimary font-bold tracking-tight">Finanse</h1>
            <p className="font-sans text-xs text-textMuted mt-0.5">Zarządzanie budżetem wspierane przez AI</p>
          </div>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accentPrimary/20 hover:bg-accentPrimary/30 text-accentPrimary rounded-lg transition-colors border border-accentPrimary/30"
        >
          <Plus className="w-4 h-4" /> Dodaj wpis
        </button>
      </header>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-sm text-textMuted font-mono">Aktualny Bilans</p>
            <p className={`text-2xl font-bold font-mono mt-1 ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {balance.toFixed(2)} PLN
            </p>
          </div>
          <div className="p-3 bg-white/5 rounded-lg"><DollarSign className="w-6 h-6 text-textMuted" /></div>
        </div>
        
        <div className="glass-panel p-6 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-sm text-textMuted font-mono">Przychody</p>
            <p className="text-2xl font-bold font-mono mt-1 text-green-400">+{incomeTotal.toFixed(2)} PLN</p>
          </div>
          <div className="p-3 bg-green-500/10 rounded-lg"><TrendingUp className="w-6 h-6 text-green-400" /></div>
        </div>

        <div className="glass-panel p-6 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-sm text-textMuted font-mono">Wydatki</p>
            <p className="text-2xl font-bold font-mono mt-1 text-red-400">-{expenseTotal.toFixed(2)} PLN</p>
          </div>
          <div className="p-3 bg-red-500/10 rounded-lg"><TrendingDown className="w-6 h-6 text-red-400" /></div>
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
                    <p className="font-sans font-medium text-textPrimary text-sm">{item.category} {item.description && <span className="text-textMuted font-normal">— {item.description}</span>}</p>
                    <p className="text-xs text-textMuted font-mono mt-1">{item.transaction_date}</p>
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
