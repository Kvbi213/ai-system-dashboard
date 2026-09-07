import { useTranslation } from 'react-i18next';
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet, DollarSign, Settings2, Target, Heart, PieChart, Search, Filter, Sparkles, ArrowRightLeft, ArrowRight } from 'lucide-react';
import { subscribeCollection, saveCloudDocument, deleteCloudDocument, updateCloudDocumentField } from '../services/cloudSync';

const FinancePage = () => {
  const { t } = useTranslation();

  const [finances, setFinances] = useState([]);
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('system_finance_settings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { monthly_income: 5000, needs_percent: 50, wants_percent: 30, savings_percent: 20 };
  });
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); // all | income | expense | needs | wants | savings
  
  const [showModal, setShowModal] = useState(false); // false | 'transaction' | 'transfer' | 'settings'
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: 'Inne',
    bucket: 'needs',
    incomeMode: 'split', // 'split' | 'single' | 'custom'
    incomeBucket: 'needs',
    customNeeds: '',
    customWants: '',
    customSavings: '',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0]
  });

  const [transferData, setTransferData] = useState({
    fromBucket: 'wants',
    toBucket: 'savings',
    amount: '',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0]
  });

  const [setupData, setSetupData] = useState({
    monthly_income: settings?.monthly_income ?? 5000,
    needs_percent: settings?.needs_percent ?? 50,
    wants_percent: settings?.wants_percent ?? 30,
    savings_percent: settings?.savings_percent ?? 20
  });

  useEffect(() => {
    setSetupData({
      monthly_income: settings?.monthly_income ?? 5000,
      needs_percent: settings?.needs_percent ?? 50,
      wants_percent: settings?.wants_percent ?? 30,
      savings_percent: settings?.savings_percent ?? 20
    });
  }, [settings]);

  const targetNeeds = Number(settings?.needs_percent) || 50;
  const targetWants = Number(settings?.wants_percent) || 30;
  const targetSavings = Number(settings?.savings_percent) || 20;
  const monthlyIncome = Number(settings?.monthly_income) || 5000;

  // 1. Subskrypcja Firestore CloudSync + lokalny cache
  useEffect(() => {
    const unsub = subscribeCollection('finances', (data) => {
      if (Array.isArray(data)) {
        // Sprawdź czy jest wpis konfiguracyjny
        const settingsDoc = data.find(d => d && (d.id === 'finance_settings' || d.is_settings));
        if (settingsDoc) {
          setSettings(prev => ({
            monthly_income: Number(settingsDoc.monthly_income) || prev.monthly_income,
            needs_percent: Number(settingsDoc.needs_percent) || prev.needs_percent,
            wants_percent: Number(settingsDoc.wants_percent) || prev.wants_percent,
            savings_percent: Number(settingsDoc.savings_percent) || prev.savings_percent
          }));
        }

        // Filtruj rzeczywiste transakcje i sortuj malejąco po dacie
        const txs = data.filter(d => d && d.id !== 'finance_settings' && !d.is_settings && d.amount !== undefined);
        const sorted = [...txs].sort((a, b) => new Date(b.transaction_date || 0) - new Date(a.transaction_date || 0));
        setFinances(sorted);
      }
    });

    // Opcjonalne pobranie z backendu Express jeśli aktywny
    axios.get('/api/finances')
      .then(res => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          const txs = res.data.filter(d => d && d.id !== 'finance_settings' && !d.is_settings);
          setFinances(prev => {
            const combined = [...txs];
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

    return () => unsub();
  }, []);

  // Obliczenia statystyk finansowych (dynamiczne % według ustawień oraz Envelope Balances)
  const stats = useMemo(() => {
    let income = 0;
    let expenses = 0;
    let allocated = { needs: 0, wants: 0, savings: 0, unassigned: 0 };
    let spent = { needs: 0, wants: 0, savings: 0, unassigned: 0 };

    finances.forEach(item => {
      if (!item || item.is_settings || item.id === 'finance_settings') return;
      const amt = Number(item.amount) || 0;

      if (item.type === 'income') {
        income += amt;
        if (item.splitMode === 'single' && item.bucket && allocated[item.bucket] !== undefined) {
          allocated[item.bucket] += amt;
        } else if (item.distribution) {
          allocated.needs += Number(item.distribution.needs) || 0;
          allocated.wants += Number(item.distribution.wants) || 0;
          allocated.savings += Number(item.distribution.savings) || 0;
        } else {
          // Domyślny automatyczny podział według reguły (50/30/20)
          allocated.needs += (amt * targetNeeds) / 100;
          allocated.wants += (amt * targetWants) / 100;
          allocated.savings += (amt * targetSavings) / 100;
        }
      } else if (item.type === 'transfer') {
        const from = item.fromBucket || 'needs';
        const to = item.toBucket || 'savings';
        if (allocated[from] !== undefined) allocated[from] -= amt;
        if (allocated[to] !== undefined) allocated[to] += amt;
      } else {
        expenses += amt;
        const b = item.bucket || 'needs';
        if (spent[b] !== undefined) {
          spent[b] += amt;
        } else {
          spent.unassigned += amt;
        }
      }
    });

    const net = income - expenses;
    const totalExp = expenses > 0 ? expenses : 0;
    const needsPct = totalExp > 0 ? Math.round((spent.needs / totalExp) * 100) : 0;
    const wantsPct = totalExp > 0 ? Math.round((spent.wants / totalExp) * 100) : 0;
    const savingsPct = totalExp > 0 ? Math.round((spent.savings / totalExp) * 100) : 0;

    // Dostępne środki w danej puli (Pozostało z alokacji po odliczeniu wydatków)
    const availableNeeds = allocated.needs - spent.needs;
    const availableWants = allocated.wants - spent.wants;
    const availableSavings = allocated.savings - spent.savings;

    // Budżety celowe na podstawie ustawionych procentów
    const baseBudget = monthlyIncome > 0 ? monthlyIncome : (income > 0 ? income : 0);
    const budgetNeeds = Math.round((baseBudget * targetNeeds) / 100);
    const budgetWants = Math.round((baseBudget * targetWants) / 100);
    const budgetSavings = Math.round((baseBudget * targetSavings) / 100);

    const needsLimitPct = allocated.needs > 0 
      ? Math.round((spent.needs / allocated.needs) * 100) 
      : (budgetNeeds > 0 ? Math.round((spent.needs / budgetNeeds) * 100) : 0);
    const wantsLimitPct = allocated.wants > 0 
      ? Math.round((spent.wants / allocated.wants) * 100) 
      : (budgetWants > 0 ? Math.round((spent.wants / budgetWants) * 100) : 0);
    const savingsLimitPct = budgetSavings > 0 
      ? Math.round((allocated.savings / budgetSavings) * 100) 
      : 0;

    return {
      balance: net,
      totalIncome: income,
      totalExpenses: expenses,
      buckets: spent,
      allocated,
      spent,
      availableNeeds,
      availableWants,
      availableSavings,
      needsPct,
      wantsPct,
      savingsPct,
      budgetNeeds,
      budgetWants,
      budgetSavings,
      needsLimitPct,
      wantsLimitPct,
      savingsLimitPct
    };
  }, [finances, monthlyIncome, targetNeeds, targetWants, targetSavings]);

  const handleSetupSubmit = async (e, skip = false) => {
    if (e) e.preventDefault();
    const dataToSubmit = skip 
      ? { monthly_income: 0, needs_percent: 50, wants_percent: 30, savings_percent: 20 } 
      : {
          monthly_income: parseFloat(setupData.monthly_income) || 0,
          needs_percent: parseFloat(setupData.needs_percent) || 50,
          wants_percent: parseFloat(setupData.wants_percent) || 30,
          savings_percent: parseFloat(setupData.savings_percent) || 20
        };
    setSettings(dataToSubmit);
    localStorage.setItem('system_finance_settings', JSON.stringify(dataToSubmit));
    await saveCloudDocument('finances', 'finance_settings', { ...dataToSubmit, is_settings: true });
    try {
      await axios.post('/api/finance/settings', dataToSubmit);
    } catch {}
  };

  const handleDelete = async (id) => {
    const idStr = String(id);
    setFinances(prev => prev.filter(item => String(item.id) !== idStr));
    await deleteCloudDocument('finances', idStr);
    try {
      await axios.delete(`/api/finances/${idStr}`);
    } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(formData.amount);
    if (isNaN(amt) || amt <= 0) return;

    let newEntry = {
      id: Date.now().toString(),
      type: formData.type,
      amount: amt,
      category: formData.category || (formData.type === 'income' ? 'Zarobek' : 'Inne'),
      description: formData.description || '',
      transaction_date: formData.transaction_date,
      currency: 'PLN'
    };

    if (formData.type === 'expense') {
      newEntry.bucket = formData.bucket || 'needs';
    } else {
      // Przychód (Income) - inteligentne dysponowanie środkami
      if (formData.incomeMode === 'single') {
        newEntry.splitMode = 'single';
        newEntry.bucket = formData.incomeBucket || 'needs';
      } else if (formData.incomeMode === 'custom') {
        newEntry.splitMode = 'custom';
        newEntry.distribution = {
          needs: parseFloat(formData.customNeeds) || 0,
          wants: parseFloat(formData.customWants) || 0,
          savings: parseFloat(formData.customSavings) || 0
        };
      } else {
        // Domyślny automatyczny podział według reguły (50/30/20)
        const nAmt = Number(((amt * targetNeeds) / 100).toFixed(2));
        const wAmt = Number(((amt * targetWants) / 100).toFixed(2));
        const sAmt = Number((amt - nAmt - wAmt).toFixed(2));
        newEntry.splitMode = 'split';
        newEntry.distribution = {
          needs: nAmt,
          wants: wAmt,
          savings: sAmt
        };
      }
    }

    setFinances(prev => [newEntry, ...prev]);
    setShowModal(false);
    setFormData({
      type: 'expense',
      amount: '',
      category: 'Inne',
      bucket: 'needs',
      incomeMode: 'split',
      incomeBucket: 'needs',
      customNeeds: '',
      customWants: '',
      customSavings: '',
      description: '',
      transaction_date: new Date().toISOString().split('T')[0]
    });

    await saveCloudDocument('finances', newEntry.id, newEntry);
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(transferData.amount);
    if (isNaN(amt) || amt <= 0) return;
    if (transferData.fromBucket === transferData.toBucket) {
      alert("Wybierz dwie różne pule!");
      return;
    }

    const bucketNames = { needs: 'Potrzeby', wants: 'Zachcianki', savings: 'Oszczędności' };
    const newTransfer = {
      id: Date.now().toString(),
      type: 'transfer',
      amount: amt,
      fromBucket: transferData.fromBucket,
      toBucket: transferData.toBucket,
      category: 'Dysponowanie środkami',
      description: transferData.description || `Przesunięcie: ${bucketNames[transferData.fromBucket] || transferData.fromBucket} ➔ ${bucketNames[transferData.toBucket] || transferData.toBucket}`,
      transaction_date: transferData.transaction_date,
      currency: 'PLN'
    };

    setFinances(prev => [newTransfer, ...prev]);
    setShowModal(false);
    setTransferData({
      fromBucket: 'wants',
      toBucket: 'savings',
      amount: '',
      description: '',
      transaction_date: new Date().toISOString().split('T')[0]
    });

    await saveCloudDocument('finances', newTransfer.id, newTransfer);
  };

  const handleQuickChangeBucket = async (item, newBucket) => {
    const updated = { ...item, bucket: newBucket, splitMode: 'single' };
    setFinances(prev => prev.map(f => f.id === item.id ? updated : f));
    await saveCloudDocument('finances', item.id, updated);
  };

  // Filtrowanie transakcji
  const filteredFinances = useMemo(() => {
    return finances.filter(item => {
      const matchSearch = searchQuery === '' || 
        (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchSearch) return false;
      if (selectedFilter === 'all') return true;
      if (selectedFilter === 'income') return item.type === 'income';
      if (selectedFilter === 'expense') return item.type === 'expense';
      if (['needs', 'wants', 'savings'].includes(selectedFilter)) return item.bucket === selectedFilter;
      return true;
    });
  }, [finances, searchQuery, selectedFilter]);

  if (isLoading) return <div className="p-8 text-center text-textMuted font-mono">{t("finLoading", "Wczytywanie finansów...")}</div>;

  // Obliczenia segmentów dla SVG Donut Chart
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const totalSpend = stats.totalExpenses > 0 ? stats.totalExpenses : 1;
  const needsLen = (stats.buckets.needs / totalSpend) * circumference;
  const wantsLen = (stats.buckets.wants / totalSpend) * circumference;
  const savingsLen = (stats.buckets.savings / totalSpend) * circumference;

  return (
    <div className="w-full h-full flex flex-col gap-3 sm:gap-6 animate-soft-enter overflow-y-auto custom-scrollbar pb-24 md:pb-8 min-h-0">
      {/* Header */}
      <header className="glass-panel p-3.5 sm:p-5 rounded-xl border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 flex-shrink-0 opacity-0 animate-soft-enter" style={{ animationDelay: '50ms' }}>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center flex-shrink-0 shadow-sm">
            <Wallet className="w-5 h-5 text-accentPrimary" />
          </div>
          <div className="flex flex-col">
            <nav aria-label="breadcrumb" className="hidden sm:flex items-center space-x-2 text-sm text-textMuted mb-0.5">
              <span className="text-sm font-medium text-textMuted/70">OmniDash</span>
              <span className="shrink-0 text-sm font-medium text-textMuted/70">/</span>
              <span className="text-sm font-medium text-textPrimary">Finanse & Budżet</span>
            </nav>
            <h1 className="text-lg sm:text-xl font-bold text-textPrimary tracking-tight">Finanse & Budżet</h1>
            <p className="font-sans text-[11px] sm:text-xs text-textMuted mt-0.5">
              {t("finTotal", "Stan ogólny:")}{' '}
              <span className={`font-mono font-bold ${stats.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {stats.balance >= 0 ? '+' : ''}{stats.balance.toFixed(2)} PLN
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end pt-1 sm:pt-0 border-t sm:border-t-0 border-border/40">
          <button 
            onClick={() => {
              setSetupData({
                monthly_income: settings?.monthly_income ?? 5000,
                needs_percent: targetNeeds,
                wants_percent: targetWants,
                savings_percent: targetSavings
              });
              setShowModal('settings');
            }} 
            className="p-2 sm:p-2.5 bg-white/5 hover:bg-white/10 rounded-lg text-textMuted transition-colors border border-border/40"
            title="Konfiguracja wskaźników budżetowych"
          >
            <Settings2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button 
            onClick={() => setShowModal('transfer')}
            className="flex items-center gap-1.5 px-3 py-2 sm:py-2.5 bg-purple-500/15 hover:bg-purple-500/25 text-purple-400 rounded-lg transition-all border border-purple-500/30 font-mono text-xs sm:text-sm font-semibold shrink-0 shadow-sm"
            title="Przesuń środki między pulami"
          >
            <ArrowRightLeft className="w-4 h-4" /> Przesuń środki
          </button>

          <button 
            onClick={() => setShowModal('transaction')}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-accentPrimary/20 hover:bg-accentPrimary/30 text-accentPrimary rounded-lg transition-all border border-accentPrimary/40 shadow-[0_0_15px_rgba(0,229,255,0.15)] font-mono text-xs sm:text-sm font-semibold shrink-0"
          >
            <Plus className="w-4 h-4" /> {t("finAdd", "Dodaj wpis")}
          </button>
        </div>
      </header>

      {/* Kubełki (Buckets) — Dostępne Środki & Dysponowanie */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 shrink-0">
        {/* Needs */}
        <div 
          onClick={() => setShowModal('transfer')}
          className="glass-panel p-4 rounded-xl flex flex-col justify-between relative overflow-hidden group border-cyan-500/20 hover:border-cyan-500/50 hover:scale-[1.01] transition-all cursor-pointer"
          title="Kliknij, aby przesunąć środki z lub do Potrzeb"
        >
          <div className="absolute -top-2 -right-2 p-4 opacity-5 group-hover:opacity-15 transition-opacity text-cyan-400"><Target className="w-16 h-16" /></div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] text-cyan-400 font-mono font-semibold tracking-wider">POTRZEBY ({targetNeeds}%)</p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${stats.availableNeeds >= 0 ? 'bg-cyan-500/15 text-cyan-300' : 'bg-rose-500/15 text-rose-300'}`}>
                {stats.availableNeeds >= 0 ? 'Dostępne' : 'Deficyt'}
              </span>
            </div>
            <p className={`text-2xl font-bold font-mono ${stats.availableNeeds >= 0 ? 'text-textPrimary' : 'text-rose-400'}`}>
              {(stats.availableNeeds || 0).toFixed(2)} <span className="text-xs text-textMuted">PLN</span>
            </p>
            <p className="text-[10px] font-mono text-textMuted mt-1 flex justify-between">
              <span>Wydano: {(stats.spent.needs || 0).toFixed(0)} PLN</span>
              <span className="text-cyan-400">Pula: +{(stats.allocated.needs || 0).toFixed(0)} PLN</span>
            </p>
          </div>
          <div className="mt-3 w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-cyan-400 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(stats.needsLimitPct, 100)}%` }} 
            />
          </div>
        </div>

        {/* Wants */}
        <div 
          onClick={() => setShowModal('transfer')}
          className="glass-panel p-4 rounded-xl flex flex-col justify-between relative overflow-hidden group border-pink-500/20 hover:border-pink-500/50 hover:scale-[1.01] transition-all cursor-pointer"
          title="Kliknij, aby przesunąć środki z lub do Zachcianek"
        >
          <div className="absolute -top-2 -right-2 p-4 opacity-5 group-hover:opacity-15 transition-opacity text-pink-400"><Heart className="w-16 h-16" /></div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] text-pink-400 font-mono font-semibold tracking-wider">ZACHCIANKI ({targetWants}%)</p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${stats.availableWants >= 0 ? 'bg-pink-500/15 text-pink-300' : 'bg-rose-500/15 text-rose-300'}`}>
                {stats.availableWants >= 0 ? 'Dostępne' : 'Deficyt'}
              </span>
            </div>
            <p className={`text-2xl font-bold font-mono ${stats.availableWants >= 0 ? 'text-textPrimary' : 'text-rose-400'}`}>
              {(stats.availableWants || 0).toFixed(2)} <span className="text-xs text-textMuted">PLN</span>
            </p>
            <p className="text-[10px] font-mono text-textMuted mt-1 flex justify-between">
              <span>Wydano: {(stats.spent.wants || 0).toFixed(0)} PLN</span>
              <span className="text-pink-400">Pula: +{(stats.allocated.wants || 0).toFixed(0)} PLN</span>
            </p>
          </div>
          <div className="mt-3 w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-pink-400 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(stats.wantsLimitPct, 100)}%` }} 
            />
          </div>
        </div>

        {/* Savings */}
        <div 
          onClick={() => setShowModal('transfer')}
          className="glass-panel p-4 rounded-xl flex flex-col justify-between relative overflow-hidden group border-emerald-500/20 hover:border-emerald-500/50 hover:scale-[1.01] transition-all cursor-pointer"
          title="Kliknij, aby zarządzać oszczędnościami"
        >
          <div className="absolute -top-2 -right-2 p-4 opacity-5 group-hover:opacity-15 transition-opacity text-emerald-400"><TrendingUp className="w-16 h-16" /></div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] text-emerald-400 font-mono font-semibold tracking-wider">OSZCZĘDNOŚCI ({targetSavings}%)</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 font-mono">
                {stats.availableSavings >= 0 ? 'Zgromadzone' : 'Stan'}
              </span>
            </div>
            <p className="text-2xl font-bold font-mono text-emerald-400">
              {(stats.availableSavings || 0).toFixed(2)} <span className="text-xs text-textMuted">PLN</span>
            </p>
            <p className="text-[10px] font-mono text-textMuted mt-1 flex justify-between">
              <span>Wydano: {(stats.spent.savings || 0).toFixed(0)} PLN</span>
              <span className="text-emerald-400">Pula: +{(stats.allocated.savings || 0).toFixed(0)} PLN</span>
            </p>
          </div>
          <div className="mt-3 w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-400 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(stats.savingsLimitPct, 100)}%` }} 
            />
          </div>
        </div>

        {/* Cashflow Summary Card */}
        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between relative overflow-hidden group border-border">
          <div>
            <p className="text-[11px] text-textMuted font-mono font-semibold tracking-wider uppercase">CASHFLOW NETTO</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl font-bold font-mono ${stats.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {stats.balance.toFixed(2)}
              </span>
              <span className="text-xs text-textMuted">PLN</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono mt-3 pt-2 border-t border-border/40 text-textMuted">
            <span className="text-emerald-400 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +{stats.totalIncome.toFixed(0)}</span>
            <span className="text-rose-400 flex items-center gap-1"><TrendingDown className="w-3 h-3" /> -{stats.totalExpenses.toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Hub: Donut Chart & Cashflow Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 shrink-0">
        {/* SVG Donut Visualizer */}
        <div className="lg:col-span-5 glass-panel p-5 rounded-xl border border-border flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-mono text-sm font-bold text-accentPrimary flex items-center gap-2">
              <PieChart className="w-4 h-4" /> Alokacja Budżetowa ({targetNeeds}/{targetWants}/{targetSavings})
            </h3>
            <span className="text-[11px] font-mono text-textMuted">Wydatki: {stats.totalExpenses.toFixed(2)} PLN</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 my-auto">
            {/* SVG Ring */}
            <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
                {/* Background Ring */}
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeWidth="12"
                  fill="transparent"
                />
                {/* Needs Segment */}
                {stats.buckets.needs > 0 && (
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    stroke="#06b6d4"
                    strokeWidth="12"
                    strokeDasharray={`${needsLen} ${circumference - needsLen}`}
                    strokeDashoffset={0}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-700"
                  />
                )}
                {/* Wants Segment */}
                {stats.buckets.wants > 0 && (
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    stroke="#ec4899"
                    strokeWidth="12"
                    strokeDasharray={`${wantsLen} ${circumference - wantsLen}`}
                    strokeDashoffset={-needsLen}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-700"
                  />
                )}
                {/* Savings Segment */}
                {stats.buckets.savings > 0 && (
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    stroke="#10b981"
                    strokeWidth="12"
                    strokeDasharray={`${savingsLen} ${circumference - savingsLen}`}
                    strokeDashoffset={-(needsLen + wantsLen)}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-700"
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[10px] font-mono text-textMuted uppercase tracking-wider">Suma</span>
                <span className="text-base font-bold font-mono text-textPrimary">{stats.totalExpenses.toFixed(0)}</span>
                <span className="text-[9px] font-mono text-textMuted">PLN</span>
              </div>
            </div>

            {/* Legend & Target Comparison */}
            <div className="flex flex-col gap-3 w-full max-w-[200px]">
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <span className="text-textMuted">Potrzeby</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-textPrimary">{stats.needsPct}%</span>
                  <span className="text-[10px] text-textMuted ml-1">/ {targetNeeds}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-pink-400" />
                  <span className="text-textMuted">Zachcianki</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-textPrimary">{stats.wantsPct}%</span>
                  <span className="text-[10px] text-textMuted ml-1">/ {targetWants}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="text-textMuted">Oszczędności</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-textPrimary">{stats.savingsPct}%</span>
                  <span className="text-[10px] text-textMuted ml-1">/ {targetSavings}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Cashflow Visualizer & AI Diagnostics */}
        <div className="lg:col-span-7 glass-panel p-5 rounded-xl border border-border flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-mono text-sm font-bold text-textPrimary flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accentPrimary" /> Analiza Przepływu Środków (Cashflow Trend)
              </h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-textMuted">
                Live Cloud Sync
              </span>
            </div>
            
            <p className="text-xs text-textMuted mb-4">
              Porównanie przychodów i wydatków z automatyczną oceną stabilności finansowej portfela.
            </p>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-emerald-400 font-medium">Przychody zarejestrowane</span>
                  <span className="font-bold text-emerald-400">+{stats.totalIncome.toFixed(2)} PLN</span>
                </div>
                <div className="w-full bg-black/40 h-2.5 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-700" style={{ width: '100%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-rose-400 font-medium">Wydatki skumulowane</span>
                  <span className="font-bold text-rose-400">-{stats.totalExpenses.toFixed(2)} PLN</span>
                </div>
                <div className="w-full bg-black/40 h-2.5 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <div 
                    className="bg-rose-500 h-full rounded-full transition-all duration-700" 
                    style={{ 
                      width: `${stats.totalIncome > 0 ? Math.min((stats.totalExpenses / stats.totalIncome) * 100, 100) : (stats.totalExpenses > 0 ? 100 : 0)}%` 
                    }} 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accentPrimary animate-ping" />
              <span className="text-xs font-mono text-textPrimary">
                {stats.balance >= 0 ? 'Bilans dodatni — budżet jest stabilny.' : 'Wykryto deficyt — wydatki przewyższają wpływy.'}
              </span>
            </div>
            <div className="text-xs font-mono text-textMuted">
              Pozostało w budżecie: <span className="text-accentPrimary font-bold">{Math.max(stats.balance, 0).toFixed(2)} PLN</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History & Search / Filter */}
      <div className="glass-panel rounded-xl overflow-hidden flex flex-col min-h-[380px] shrink-0 mb-6">
        {/* Controls */}
        <div className="p-4 border-b border-border bg-black/20 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="font-mono text-sm font-bold text-accentPrimary">
              {t("finHistory", "Historia Transakcji")}
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-accentPrimary/10 text-accentPrimary border border-accentPrimary/20">
              {filteredFinances.length}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-textMuted absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Szukaj wydatku..."
                className="w-full bg-black/30 border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-textPrimary font-mono outline-none focus:border-accentPrimary transition-colors"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center bg-black/30 border border-border rounded-lg p-0.5 text-xs font-mono">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-2.5 py-1 rounded transition-colors ${selectedFilter === 'all' ? 'bg-accentPrimary text-black font-bold' : 'text-textMuted hover:text-white'}`}
              >
                Wszystkie
              </button>
              <button
                onClick={() => setSelectedFilter('expense')}
                className={`px-2.5 py-1 rounded transition-colors ${selectedFilter === 'expense' ? 'bg-rose-500/20 text-rose-300 font-bold' : 'text-textMuted hover:text-white'}`}
              >
                Wydatki
              </button>
              <button
                onClick={() => setSelectedFilter('income')}
                className={`px-2.5 py-1 rounded transition-colors ${selectedFilter === 'income' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-textMuted hover:text-white'}`}
              >
                Wpływy
              </button>
            </div>
          </div>
        </div>

        {/* List Content */}
        <div className="overflow-y-auto max-h-[600px] p-4 space-y-2.5 custom-scrollbar">
          {filteredFinances.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center justify-center text-textMuted">
              <Wallet className="w-10 h-10 opacity-20 mb-2" />
              <p className="font-mono text-sm">{t("finNoEntries", "Brak zarejestrowanych transakcji.")}</p>
              <p className="text-xs mt-1 text-textMuted/60">Dodaj nowy wydatek lub przychód klikając przycisk na górze.</p>
            </div>
          ) : (
            filteredFinances.map(item => (
              <div 
                key={item.id} 
                className="flex justify-between items-center p-3.5 bg-black/20 hover:bg-black/40 border border-border/50 hover:border-border rounded-lg transition-all group"
              >
                <div className="flex items-center gap-3.5">
                  <div className={`p-2.5 rounded-xl border ${
                    item.type === 'transfer' 
                      ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                      : item.type === 'income' 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}>
                    {item.type === 'transfer' ? (
                      <ArrowRightLeft className="w-4 h-4" />
                    ) : item.type === 'income' ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="font-sans font-medium text-textPrimary text-sm flex items-center gap-2">
                      {item.category} 
                      {item.type === 'transfer' && (
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold uppercase bg-purple-500/15 text-purple-300 border border-purple-500/30">
                          {item.fromBucket || 'wants'} ➔ {item.toBucket || 'savings'}
                        </span>
                      )}
                      {item.type === 'expense' && (
                        <button
                          type="button"
                          onClick={() => {
                            const cycle = { needs: 'wants', wants: 'savings', savings: 'needs' };
                            const next = cycle[item.bucket || 'needs'] || 'needs';
                            handleQuickChangeBucket(item, next);
                          }}
                          className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold uppercase transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                            item.bucket === 'needs' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20' :
                            item.bucket === 'wants' ? 'bg-pink-500/10 text-pink-400 border border-pink-500/30 hover:bg-pink-500/20' :
                            'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                          }`}
                          title="Kliknij, aby zmienić kubełek"
                        >
                          {item.bucket || 'needs'} ⟳
                        </button>
                      )}
                      {item.type === 'income' && (
                        <button
                          type="button"
                          onClick={() => {
                            const cycle = { split: 'needs', needs: 'wants', wants: 'savings', savings: 'split' };
                            const current = item.splitMode === 'single' ? (item.bucket || 'needs') : 'split';
                            const next = cycle[current] || 'split';
                            if (next === 'split') {
                              const nAmt = Number(((Number(item.amount) * targetNeeds) / 100).toFixed(2));
                              const wAmt = Number(((Number(item.amount) * targetWants) / 100).toFixed(2));
                              const sAmt = Number((Number(item.amount) - nAmt - wAmt).toFixed(2));
                              const updated = { ...item, splitMode: 'split', bucket: 'split', distribution: { needs: nAmt, wants: wAmt, savings: sAmt } };
                              setFinances(prev => prev.map(f => f.id === item.id ? updated : f));
                              saveCloudDocument('finances', item.id, updated);
                            } else {
                              handleQuickChangeBucket(item, next);
                            }
                          }}
                          className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all cursor-pointer"
                          title="Kliknij, aby zmienić sposób dysponowania"
                        >
                          {item.splitMode === 'single' ? `Całość: ${item.bucket}` : `Reguła ${targetNeeds}/${targetWants}/${targetSavings}`} ⟳
                        </button>
                      )}
                    </p>
                    <p className="text-xs text-textMuted font-mono mt-0.5">
                      {item.transaction_date} {item.description && <span>— {item.description}</span>}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className={`font-mono font-bold text-sm ${
                    item.type === 'transfer' 
                      ? 'text-purple-400' 
                      : item.type === 'income' 
                        ? 'text-emerald-400' 
                        : 'text-rose-400'
                  }`}>
                    {item.type === 'transfer' ? '⇄ ' : item.type === 'income' ? '+' : '-'}{Number(item.amount).toFixed(2)} PLN
                  </span>
                  <button 
                    onClick={() => handleDelete(item.id)} 
                    className="text-textMuted hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100 p-1 rounded"
                    title="Usuń wpis"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Nowa Transakcja */}
      {showModal === 'transaction' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-background border border-border rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-4 border-b border-border flex justify-between items-center bg-black/20">
              <h2 className="font-mono text-accentPrimary font-bold text-base">{t("finNewTrans", "Nowa Transakcja")}</h2>
              <button onClick={() => setShowModal(false)} className="text-textMuted hover:text-white transition-colors">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
              
              <div className="flex gap-2 bg-black/30 p-1 rounded-lg border border-border/50">
                <button 
                  type="button" 
                  onClick={() => setFormData({...formData, type: 'expense'})} 
                  className={`flex-1 py-2 text-xs font-bold font-mono rounded-md transition-colors ${formData.type === 'expense' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-textMuted hover:text-textPrimary'}`}
                >
                  {t("finExpense", "WYDATEK")}
                </button>
                <button 
                  type="button" 
                  onClick={() => setFormData({...formData, type: 'income'})} 
                  className={`flex-1 py-2 text-xs font-bold font-mono rounded-md transition-colors ${formData.type === 'income' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-textMuted hover:text-textPrimary'}`}
                >
                  {t("finIncomeBtn", "PRZYCHÓD")}
                </button>
              </div>

              <div>
                <label className="text-xs font-mono text-textMuted mb-1 block">{t("finAmount", "Kwota (PLN)")}</label>
                <input 
                  type="number" 
                  step="0.01" 
                  required 
                  value={formData.amount} 
                  onChange={e => setFormData({...formData, amount: e.target.value})} 
                  className="w-full bg-black/30 border border-border rounded-lg p-2.5 text-textPrimary font-mono focus:border-accentPrimary outline-none transition-colors" 
                  placeholder="0.00" 
                  autoFocus
                />
              </div>

              {formData.type === 'expense' && (
                <div>
                  <label className="text-xs font-mono text-textMuted mb-1 block">Kubełek ({targetNeeds}/{targetWants}/{targetSavings})</label>
                  <select 
                    value={formData.bucket} 
                    onChange={e => setFormData({...formData, bucket: e.target.value})} 
                    className="w-full bg-black/30 border border-border rounded-lg p-2.5 text-textPrimary font-mono focus:border-accentPrimary outline-none transition-colors"
                  >
                    <option value="needs">Potrzeby / Rachunki ({targetNeeds}%)</option>
                    <option value="wants">Zachcianki / Rozrywka ({targetWants}%)</option>
                    <option value="savings">Oszczędności / Inwestycje ({targetSavings}%)</option>
                  </select>
                </div>
              )}

              {formData.type === 'income' && (
                <div className="flex flex-col gap-2.5 p-3 rounded-lg bg-black/25 border border-emerald-500/25">
                  <label className="text-xs font-mono text-emerald-400 font-semibold block">Dysponowanie zarobkiem:</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, incomeMode: 'split' })}
                      className={`py-1.5 px-2 text-[11px] font-mono rounded border transition-colors ${formData.incomeMode === 'split' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold' : 'bg-white/5 border-border/40 text-textMuted hover:text-white'}`}
                    >
                      Reguła {targetNeeds}/{targetWants}/{targetSavings}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, incomeMode: 'single' })}
                      className={`py-1.5 px-2 text-[11px] font-mono rounded border transition-colors ${formData.incomeMode === 'single' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold' : 'bg-white/5 border-border/40 text-textMuted hover:text-white'}`}
                    >
                      Jedna pula
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, incomeMode: 'custom' })}
                      className={`py-1.5 px-2 text-[11px] font-mono rounded border transition-colors ${formData.incomeMode === 'custom' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-bold' : 'bg-white/5 border-border/40 text-textMuted hover:text-white'}`}
                    >
                      Własny podział
                    </button>
                  </div>

                  {formData.incomeMode === 'split' && (
                    <div className="text-[11px] font-mono p-2 bg-emerald-500/5 rounded border border-emerald-500/20 flex flex-col gap-1 text-textMuted">
                      <div className="flex justify-between">
                        <span className="text-cyan-400">Potrzeby ({targetNeeds}%):</span>
                        <span className="font-bold text-textPrimary">{((Number(formData.amount || 0) * targetNeeds) / 100).toFixed(2)} PLN</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-pink-400">Zachcianki ({targetWants}%):</span>
                        <span className="font-bold text-textPrimary">{((Number(formData.amount || 0) * targetWants) / 100).toFixed(2)} PLN</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-400">Oszczędności ({targetSavings}%):</span>
                        <span className="font-bold text-textPrimary">{(Number(formData.amount || 0) - ((Number(formData.amount || 0) * targetNeeds) / 100) - ((Number(formData.amount || 0) * targetWants) / 100)).toFixed(2)} PLN</span>
                      </div>
                    </div>
                  )}

                  {formData.incomeMode === 'single' && (
                    <div>
                      <label className="text-[11px] font-mono text-textMuted mb-1 block">Przypisz całość do wybranej puli:</label>
                      <select
                        value={formData.incomeBucket}
                        onChange={e => setFormData({ ...formData, incomeBucket: e.target.value })}
                        className="w-full bg-black/30 border border-border rounded-lg p-2 text-textPrimary font-mono text-xs outline-none"
                      >
                        <option value="needs">Potrzeby / Rachunki ({targetNeeds}%)</option>
                        <option value="wants">Zachcianki / Rozrywka ({targetWants}%)</option>
                        <option value="savings">Oszczędności / Inwestycje ({targetSavings}%)</option>
                      </select>
                    </div>
                  )}

                  {formData.incomeMode === 'custom' && (
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] font-mono text-cyan-400 block mb-1">Potrzeby (PLN)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.customNeeds}
                          onChange={e => setFormData({ ...formData, customNeeds: e.target.value })}
                          className="w-full bg-black/30 border border-border rounded p-1.5 text-textPrimary font-mono text-xs text-center outline-none"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-pink-400 block mb-1">Zachcianki (PLN)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.customWants}
                          onChange={e => setFormData({ ...formData, customWants: e.target.value })}
                          className="w-full bg-black/30 border border-border rounded p-1.5 text-textPrimary font-mono text-xs text-center outline-none"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-emerald-400 block mb-1">Oszczędności (PLN)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.customSavings}
                          onChange={e => setFormData({ ...formData, customSavings: e.target.value })}
                          className="w-full bg-black/30 border border-border rounded p-1.5 text-textPrimary font-mono text-xs text-center outline-none"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div>
                <label className="text-xs font-mono text-textMuted mb-1 block">{t("finCategory", "Kategoria")}</label>
                <input 
                  type="text" 
                  required 
                  value={formData.category} 
                  onChange={e => setFormData({...formData, category: e.target.value})} 
                  className="w-full bg-black/30 border border-border rounded-lg p-2.5 text-textPrimary font-mono focus:border-accentPrimary outline-none transition-colors" 
                  placeholder={t("finCatPlaceholder", "np. Jedzenie, Wypłata, Paliwo")} 
                />
              </div>
              
              <div>
                <label className="text-xs font-mono text-textMuted mb-1 block">{t("finDesc", "Opis (opcjonalnie)")}</label>
                <input 
                  type="text" 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  className="w-full bg-black/30 border border-border rounded-lg p-2.5 text-textPrimary font-mono focus:border-accentPrimary outline-none transition-colors" 
                  placeholder={t("finDescPlaceholder", "np. Zakupy spożywcze")} 
                />
              </div>

              <div>
                <label className="text-xs font-mono text-textMuted mb-1 block">{t("finDate", "Data transakcji")}</label>
                <input 
                  type="date" 
                  required 
                  value={formData.transaction_date} 
                  onChange={e => setFormData({...formData, transaction_date: e.target.value})} 
                  className="w-full bg-black/30 border border-border rounded-lg p-2.5 text-textPrimary font-mono focus:border-accentPrimary outline-none transition-colors [color-scheme:dark]" 
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 font-mono text-xs text-textMuted hover:text-textPrimary transition-colors">
                  Anuluj
                </button>
                <button type="submit" className="px-5 py-2 font-mono text-xs bg-accentPrimary text-black font-bold rounded-lg shadow-[0_0_15px_rgba(0,229,255,0.3)] hover:scale-105 transition-all">
                  Zapisz wpis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dysponowania Środkami (Transfer między pulami) */}
      {showModal === 'transfer' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-background border border-border rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-4 border-b border-border flex justify-between items-center bg-black/20">
              <h2 className="font-mono text-purple-400 font-bold text-base flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4" /> Dysponowanie Środkami
              </h2>
              <button onClick={() => setShowModal(false)} className="text-textMuted hover:text-white transition-colors">✕</button>
            </div>
            <form onSubmit={handleTransferSubmit} className="p-5 flex flex-col gap-4">
              <p className="text-xs text-textMuted font-mono">
                Przesuń środki pomiędzy kubełkami budżetowymi bez zmiany łącznego stanu konta.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-textMuted mb-1 block">Z puli (Źródło):</label>
                  <select
                    value={transferData.fromBucket}
                    onChange={e => setTransferData({ ...transferData, fromBucket: e.target.value })}
                    className="w-full bg-black/30 border border-border rounded-lg p-2.5 text-textPrimary font-mono text-xs focus:border-purple-400 outline-none"
                  >
                    <option value="needs">Potrzeby (Dostępne: {(stats.availableNeeds || 0).toFixed(0)} zł)</option>
                    <option value="wants">Zachcianki (Dostępne: {(stats.availableWants || 0).toFixed(0)} zł)</option>
                    <option value="savings">Oszczędności (Dostępne: {(stats.availableSavings || 0).toFixed(0)} zł)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-mono text-textMuted mb-1 block">Do puli (Cel):</label>
                  <select
                    value={transferData.toBucket}
                    onChange={e => setTransferData({ ...transferData, toBucket: e.target.value })}
                    className="w-full bg-black/30 border border-border rounded-lg p-2.5 text-textPrimary font-mono text-xs focus:border-purple-400 outline-none"
                  >
                    <option value="needs">Potrzeby</option>
                    <option value="wants">Zachcianki</option>
                    <option value="savings">Oszczędności</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-textMuted mb-1 block">Kwota do przesunięcia (PLN):</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={transferData.amount}
                  onChange={e => setTransferData({ ...transferData, amount: e.target.value })}
                  className="w-full bg-black/30 border border-border rounded-lg p-2.5 text-textPrimary font-mono focus:border-purple-400 outline-none transition-colors"
                  placeholder="0.00"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-mono text-textMuted mb-1 block">Notatka / Powód (opcjonalnie):</label>
                <input
                  type="text"
                  value={transferData.description}
                  onChange={e => setTransferData({ ...transferData, description: e.target.value })}
                  className="w-full bg-black/30 border border-border rounded-lg p-2.5 text-textPrimary font-mono focus:border-purple-400 outline-none transition-colors"
                  placeholder="np. Nadwyżka z wypłaty na oszczędności"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-textMuted mb-1 block">Data przesunięcia:</label>
                <input
                  type="date"
                  required
                  value={transferData.transaction_date}
                  onChange={e => setTransferData({ ...transferData, transaction_date: e.target.value })}
                  className="w-full bg-black/30 border border-border rounded-lg p-2.5 text-textPrimary font-mono focus:border-purple-400 outline-none transition-colors [color-scheme:dark]"
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 font-mono text-xs text-textMuted hover:text-textPrimary transition-colors">
                  Anuluj
                </button>
                <button type="submit" className="px-5 py-2 font-mono text-xs bg-purple-500 text-white font-bold rounded-lg shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:scale-105 transition-all">
                  Wykonaj transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ustawień Budżetu (Dynamiczne %) */}
      {showModal === 'settings' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-background border border-border rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-4 border-b border-border flex justify-between items-center bg-black/20">
              <h2 className="font-mono text-accentPrimary font-bold text-base">Konfiguracja Budżetu ({targetNeeds}/{targetWants}/{targetSavings})</h2>
              <button onClick={() => setShowModal(false)} className="text-textMuted hover:text-white transition-colors">✕</button>
            </div>
            <form onSubmit={(e) => { handleSetupSubmit(e); setShowModal(false); }} className="p-5 flex flex-col gap-4">
              <div>
                <label className="text-xs font-mono text-textMuted block mb-1">Miesięczny Dochód Bazowy (PLN)</label>
                <input 
                  type="number" 
                  required 
                  value={setupData.monthly_income} 
                  onChange={e => setSetupData({...setupData, monthly_income: parseFloat(e.target.value) || 0})} 
                  className="w-full bg-black/30 border border-border rounded-lg p-2.5 text-textPrimary font-mono outline-none" 
                />
              </div>

              <div>
                <label className="text-xs font-mono text-textMuted block mb-1.5">Szybkie profile alokacji:</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: '50/30/20', n: 50, w: 30, s: 20 },
                    { label: '60/20/20', n: 60, w: 20, s: 20 },
                    { label: '70/20/10', n: 70, w: 20, s: 10 },
                    { label: '40/30/30', n: 40, w: 30, s: 30 }
                  ].map(p => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setSetupData(prev => ({ ...prev, needs_percent: p.n, wants_percent: p.w, savings_percent: p.s }))}
                      className="px-2 py-1.5 text-[11px] font-mono bg-white/5 hover:bg-white/10 border border-border/50 rounded-lg text-textMuted hover:text-white transition-colors text-center"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-cyan-400 block mb-1">Potrzeby %</label>
                  <input 
                    type="number" 
                    value={setupData.needs_percent} 
                    onChange={e => setSetupData({...setupData, needs_percent: parseFloat(e.target.value) || 0})} 
                    className="w-full bg-black/30 border border-border rounded-lg p-2 text-textPrimary font-mono text-center" 
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-pink-400 block mb-1">Zachcianki %</label>
                  <input 
                    type="number" 
                    value={setupData.wants_percent} 
                    onChange={e => setSetupData({...setupData, wants_percent: parseFloat(e.target.value) || 0})} 
                    className="w-full bg-black/30 border border-border rounded-lg p-2 text-textPrimary font-mono text-center" 
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-emerald-400 block mb-1">Oszczędności %</label>
                  <input 
                    type="number" 
                    value={setupData.savings_percent} 
                    onChange={e => setSetupData({...setupData, savings_percent: parseFloat(e.target.value) || 0})} 
                    className="w-full bg-black/30 border border-border rounded-lg p-2 text-textPrimary font-mono text-center" 
                  />
                </div>
              </div>

              <div className="text-xs font-mono flex items-center justify-between px-1 py-1 rounded bg-black/20 border border-white/5">
                <span className="text-textMuted">Suma alokacji:</span>
                <span className={`font-bold ${((Number(setupData.needs_percent) || 0) + (Number(setupData.wants_percent) || 0) + (Number(setupData.savings_percent) || 0)) === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {((Number(setupData.needs_percent) || 0) + (Number(setupData.wants_percent) || 0) + (Number(setupData.savings_percent) || 0))}% {((Number(setupData.needs_percent) || 0) + (Number(setupData.wants_percent) || 0) + (Number(setupData.savings_percent) || 0)) === 100 ? '✓ (Zrównoważona)' : '(Zalecane 100%)'}
                </span>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 font-mono text-xs text-textMuted hover:text-textPrimary transition-colors">
                  Anuluj
                </button>
                <button type="submit" className="px-5 py-2 font-mono text-xs bg-accentPrimary text-black font-bold rounded-lg shadow-[0_0_15px_rgba(0,229,255,0.3)] hover:scale-105 transition-all">
                  Zapisz Ustawienia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancePage;
