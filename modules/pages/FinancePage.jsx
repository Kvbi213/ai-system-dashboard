import { useTranslation } from 'react-i18next';
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet, DollarSign, Settings2, Target, Heart, PieChart, Search, Filter, Sparkles } from 'lucide-react';
import { subscribeCollection, saveCloudDocument, deleteCloudDocument } from '../services/cloudSync';

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
    monthly_income: settings?.monthly_income || 5000,
    needs_percent: settings?.needs_percent || 50,
    wants_percent: settings?.wants_percent || 30,
    savings_percent: settings?.savings_percent || 20
  });

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

  // Obliczenia statystyk finansowych (dynamiczne % według ustawień oraz Cashflow)
  const stats = useMemo(() => {
    let income = 0;
    let expenses = 0;
    let buckets = { needs: 0, wants: 0, savings: 0, unassigned: 0 };

    finances.forEach(item => {
      if (!item || item.is_settings || item.id === 'finance_settings') return;
      const amt = Number(item.amount) || 0;
      if (item.type === 'income') {
        income += amt;
      } else {
        expenses += amt;
        const b = item.bucket || 'unassigned';
        if (buckets[b] !== undefined) {
          buckets[b] += amt;
        } else {
          buckets.unassigned += amt;
        }
      }
    });

    const net = income - expenses;
    const totalExp = expenses > 0 ? expenses : 0;
    const needsPct = totalExp > 0 ? Math.round((buckets.needs / totalExp) * 100) : 0;
    const wantsPct = totalExp > 0 ? Math.round((buckets.wants / totalExp) * 100) : 0;
    const savingsPct = totalExp > 0 ? Math.round((buckets.savings / totalExp) * 100) : 0;

    // Budżety celowe na podstawie ustawionych procentów
    const baseBudget = monthlyIncome > 0 ? monthlyIncome : (income > 0 ? income : 0);
    const budgetNeeds = Math.round((baseBudget * targetNeeds) / 100);
    const budgetWants = Math.round((baseBudget * targetWants) / 100);
    const budgetSavings = Math.round((baseBudget * targetSavings) / 100);

    return {
      balance: net,
      totalIncome: income,
      totalExpenses: expenses,
      buckets,
      needsPct,
      wantsPct,
      savingsPct,
      budgetNeeds,
      budgetWants,
      budgetSavings
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

    const newEntry = {
      ...formData,
      id: Date.now().toString(),
      amount: amt,
      currency: 'PLN'
    };

    setFinances(prev => [newEntry, ...prev]);
    setShowModal(false);
    setFormData({
      type: 'expense',
      amount: '',
      category: 'Inne',
      bucket: 'needs',
      description: '',
      transaction_date: new Date().toISOString().split('T')[0]
    });

    await saveCloudDocument('finances', newEntry.id, newEntry);
    try {
      await axios.post('/api/finances', newEntry);
    } catch {}
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
    <div className="w-full h-full flex flex-col gap-6 animate-soft-enter pb-20 overflow-hidden">
      {/* Header */}
      <header className="glass-panel p-5 rounded-xl border border-border flex items-center justify-between gap-4 flex-shrink-0 opacity-0 animate-soft-enter" style={{ animationDelay: '50ms' }}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center flex-shrink-0 shadow-sm">
            <Wallet className="w-5 h-5 text-accentPrimary" />
          </div>
          <div className="flex flex-col">
            <nav aria-label="breadcrumb" className="flex items-center space-x-2 text-sm text-textMuted mb-0.5">
              <span className="flex items-center text-lg font-medium text-textMuted/70">OmniDash</span>
              <span className="shrink-0 text-lg font-medium text-textMuted/70">/</span>
              <span className="flex items-center text-lg font-medium text-textPrimary">Finanse & Budżet</span>
            </nav>
            <p className="font-sans text-xs text-textMuted mt-0.5">
              {t("finTotal", "Stan ogólny:")}{' '}
              <span className={`font-mono font-bold ${stats.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {stats.balance >= 0 ? '+' : ''}{stats.balance.toFixed(2)} PLN
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
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
            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-lg text-textMuted transition-colors border border-border/40"
            title="Konfiguracja wskaźników budżetowych"
          >
            <Settings2 className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setShowModal('transaction')}
            className="flex items-center gap-2 px-4 py-2.5 bg-accentPrimary/20 hover:bg-accentPrimary/30 text-accentPrimary rounded-lg transition-all border border-accentPrimary/40 shadow-[0_0_15px_rgba(0,229,255,0.15)] font-mono text-sm font-semibold"
          >
            <Plus className="w-4 h-4" /> {t("finAdd", "Dodaj wpis")}
          </button>
        </div>
      </header>

      {/* Kubełki (Buckets) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        {/* Needs */}
        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between relative overflow-hidden group border-cyan-500/20 hover:border-cyan-500/40 transition-colors">
          <div className="absolute -top-2 -right-2 p-4 opacity-5 group-hover:opacity-15 transition-opacity text-cyan-400"><Target className="w-16 h-16" /></div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] text-cyan-400 font-mono font-semibold tracking-wider">POTRZEBY ({targetNeeds}%)</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 font-mono">
                {stats.totalExpenses > 0 ? `${stats.needsPct}%` : `${targetNeeds}% Cel`}
              </span>
            </div>
            <p className="text-2xl font-bold font-mono text-textPrimary">{(stats.buckets.needs || 0).toFixed(2)} <span className="text-xs text-textMuted">PLN</span></p>
            {stats.budgetNeeds > 0 && (
              <p className="text-[10px] font-mono text-textMuted mt-1 flex justify-between">
                <span>Cel: {stats.budgetNeeds} PLN</span>
                <span className={stats.buckets.needs > stats.budgetNeeds ? 'text-rose-400 font-bold' : 'text-cyan-400'}>
                  {stats.buckets.needs > stats.budgetNeeds ? `+${(stats.buckets.needs - stats.budgetNeeds).toFixed(0)} PLN` : `zostało: ${(stats.budgetNeeds - stats.buckets.needs).toFixed(0)} PLN`}
                </span>
              </p>
            )}
          </div>
          <div className="mt-3 w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
            <div className="bg-cyan-400 h-full rounded-full transition-all duration-500" style={{ width: `${stats.totalExpenses > 0 ? Math.min(stats.needsPct, 100) : 0}%` }} />
          </div>
        </div>

        {/* Wants */}
        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between relative overflow-hidden group border-pink-500/20 hover:border-pink-500/40 transition-colors">
          <div className="absolute -top-2 -right-2 p-4 opacity-5 group-hover:opacity-15 transition-opacity text-pink-400"><Heart className="w-16 h-16" /></div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] text-pink-400 font-mono font-semibold tracking-wider">ZACHCIANKI ({targetWants}%)</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-300 font-mono">
                {stats.totalExpenses > 0 ? `${stats.wantsPct}%` : `${targetWants}% Cel`}
              </span>
            </div>
            <p className="text-2xl font-bold font-mono text-textPrimary">{(stats.buckets.wants || 0).toFixed(2)} <span className="text-xs text-textMuted">PLN</span></p>
            {stats.budgetWants > 0 && (
              <p className="text-[10px] font-mono text-textMuted mt-1 flex justify-between">
                <span>Cel: {stats.budgetWants} PLN</span>
                <span className={stats.buckets.wants > stats.budgetWants ? 'text-rose-400 font-bold' : 'text-pink-400'}>
                  {stats.buckets.wants > stats.budgetWants ? `+${(stats.buckets.wants - stats.budgetWants).toFixed(0)} PLN` : `zostało: ${(stats.budgetWants - stats.buckets.wants).toFixed(0)} PLN`}
                </span>
              </p>
            )}
          </div>
          <div className="mt-3 w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
            <div className="bg-pink-400 h-full rounded-full transition-all duration-500" style={{ width: `${stats.totalExpenses > 0 ? Math.min(stats.wantsPct, 100) : 0}%` }} />
          </div>
        </div>

        {/* Savings */}
        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between relative overflow-hidden group border-emerald-500/20 hover:border-emerald-500/40 transition-colors">
          <div className="absolute -top-2 -right-2 p-4 opacity-5 group-hover:opacity-15 transition-opacity text-emerald-400"><TrendingUp className="w-16 h-16" /></div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] text-emerald-400 font-mono font-semibold tracking-wider">OSZCZĘDNOŚCI ({targetSavings}%)</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 font-mono">
                {stats.totalExpenses > 0 ? `${stats.savingsPct}%` : `${targetSavings}% Cel`}
              </span>
            </div>
            <p className="text-2xl font-bold font-mono text-textPrimary">{(stats.buckets.savings || 0).toFixed(2)} <span className="text-xs text-textMuted">PLN</span></p>
            {stats.budgetSavings > 0 && (
              <p className="text-[10px] font-mono text-textMuted mt-1 flex justify-between">
                <span>Cel: {stats.budgetSavings} PLN</span>
                <span className="text-emerald-400 font-bold">
                  odłożono: {(stats.buckets.savings || 0).toFixed(0)} PLN
                </span>
              </p>
            )}
          </div>
          <div className="mt-3 w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: `${stats.totalExpenses > 0 ? Math.min(stats.savingsPct, 100) : 0}%` }} />
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
      <div className="glass-panel rounded-xl overflow-hidden flex-1 flex flex-col min-h-[300px]">
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
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
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
                  <div className={`p-2.5 rounded-xl border ${item.type === 'income' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
                    {item.type === 'income' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="font-sans font-medium text-textPrimary text-sm flex items-center gap-2">
                      {item.category} 
                      {item.bucket && item.type === 'expense' && (
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold uppercase ${
                          item.bucket === 'needs' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                          item.bucket === 'wants' ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20' :
                          'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {item.bucket}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-textMuted font-mono mt-0.5">
                      {item.transaction_date} {item.description && <span>— {item.description}</span>}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className={`font-mono font-bold text-sm ${item.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {item.type === 'income' ? '+' : '-'}{Number(item.amount).toFixed(2)} PLN
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
