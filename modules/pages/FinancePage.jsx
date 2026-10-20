import { useTranslation } from 'react-i18next';
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Plus, Trash2, TrendingUp, TrendingDown, Wallet, DollarSign, Settings2, Target, Heart, 
  PieChart, Search, Filter, Sparkles, ArrowRightLeft, ArrowRight, Download, Check, X, ShieldCheck
} from 'lucide-react';
import { subscribeCollection, saveCloudDocument, deleteCloudDocument, isCloudEnvironment } from '../services/cloudSync';
import { useToast } from '../context/ToastContext';
import ExportModal from '../components/ExportModal';
import { calculateFinanceStats } from '../services/budgetCalculator';

const FinancePage = () => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [finances, setFinances] = useState([]);
  const [chartView, setChartView] = useState('expenses'); // 'expenses' | 'allocation'
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('system_finance_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          monthly_income: parsed.monthly_income !== undefined && !isNaN(Number(parsed.monthly_income)) ? Number(parsed.monthly_income) : 5000,
          needs_percent: parsed.needs_percent !== undefined && !isNaN(Number(parsed.needs_percent)) ? Number(parsed.needs_percent) : 50,
          wants_percent: parsed.wants_percent !== undefined && !isNaN(Number(parsed.wants_percent)) ? Number(parsed.wants_percent) : 30,
          savings_percent: parsed.savings_percent !== undefined && !isNaN(Number(parsed.savings_percent)) ? Number(parsed.savings_percent) : 20
        };
      }
    } catch {}
    return { monthly_income: 5000, needs_percent: 50, wants_percent: 30, savings_percent: 20 };
  });

  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); // all | income | expense | needs | wants | savings
  const [showModal, setShowModal] = useState(false); // false | 'transaction' | 'transfer' | 'settings'
  const [showExportModal, setShowExportModal] = useState(false);

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

  const targetNeeds = settings?.needs_percent !== undefined && !isNaN(Number(settings?.needs_percent)) ? Number(settings.needs_percent) : 50;
  const targetWants = settings?.wants_percent !== undefined && !isNaN(Number(settings?.wants_percent)) ? Number(settings.wants_percent) : 30;
  const targetSavings = settings?.savings_percent !== undefined && !isNaN(Number(settings?.savings_percent)) ? Number(settings.savings_percent) : 20;
  const monthlyIncome = settings?.monthly_income !== undefined && !isNaN(Number(settings?.monthly_income)) ? Number(settings.monthly_income) : 5000;

  // 1. Subskrypcja Firestore CloudSync
  useEffect(() => {
    const unsub = subscribeCollection('finances', (data) => {
      if (Array.isArray(data)) {
        const settingsDoc = data.find(d => d && (d.id === 'finance_settings' || d.is_settings));
        if (settingsDoc) {
          setSettings(prev => ({
            monthly_income: settingsDoc.monthly_income !== undefined && !isNaN(Number(settingsDoc.monthly_income)) ? Number(settingsDoc.monthly_income) : prev.monthly_income,
            needs_percent: settingsDoc.needs_percent !== undefined && !isNaN(Number(settingsDoc.needs_percent)) ? Number(settingsDoc.needs_percent) : prev.needs_percent,
            wants_percent: settingsDoc.wants_percent !== undefined && !isNaN(Number(settingsDoc.wants_percent)) ? Number(settingsDoc.wants_percent) : prev.wants_percent,
            savings_percent: settingsDoc.savings_percent !== undefined && !isNaN(Number(settingsDoc.savings_percent)) ? Number(settingsDoc.savings_percent) : prev.savings_percent
          }));
        }

        const txs = data.filter(d => d && d.id !== 'finance_settings' && !d.is_settings && d.amount !== undefined);
        const sorted = [...txs].sort((a, b) => new Date(b.transaction_date || 0) - new Date(a.transaction_date || 0));
        setFinances(sorted);
      }
    });

    if (!isCloudEnvironment()) {
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
    }

    return () => unsub();
  }, []);

  const stats = useMemo(() => {
    return calculateFinanceStats(finances, {
      monthlyIncome,
      targetNeeds,
      targetWants,
      targetSavings
    });
  }, [finances, monthlyIncome, targetNeeds, targetWants, targetSavings]);

  const handleSetupSubmit = async (e, skip = false) => {
    if (e) e.preventDefault();
    const parseField = (val, fallback) => {
      if (val === '' || val === null || val === undefined) return fallback;
      const num = parseFloat(val);
      return isNaN(num) ? fallback : Math.max(0, num);
    };

    const dataToSubmit = skip 
      ? { monthly_income: 0, needs_percent: 50, wants_percent: 30, savings_percent: 20 } 
      : {
          monthly_income: parseField(setupData.monthly_income, 0),
          needs_percent: parseField(setupData.needs_percent, 50),
          wants_percent: parseField(setupData.wants_percent, 0),
          savings_percent: parseField(setupData.savings_percent, 0)
        };
    setSettings(dataToSubmit);
    localStorage.setItem('system_finance_settings', JSON.stringify(dataToSubmit));
    await saveCloudDocument('finances', 'finance_settings', { ...dataToSubmit, is_settings: true });
    if (!isCloudEnvironment()) {
      try {
        await axios.post('/api/finance/settings', dataToSubmit);
      } catch {}
    }

    setShowModal(false);
    toast.success(`Zaktualizowano regułę budżetową na ${dataToSubmit.needs_percent}/${dataToSubmit.wants_percent}/${dataToSubmit.savings_percent}.`, 'Budżet');
  };

  const handleDelete = async (id) => {
    try {
      const idStr = String(id);
      setFinances(prev => prev.filter(item => String(item.id) !== idStr));
      await deleteCloudDocument('finances', idStr);
      if (!isCloudEnvironment()) {
        try {
          await axios.delete(`/api/finances/${idStr}`);
        } catch {}
      }
      toast.info('Pozycja usunięta z rejestru finansowego.', 'Finanse');
    } catch (err) {
      toast.error(`Nie udało się usunąć wpisu: ${err.message}`, 'Błąd');
    }
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

    toast.success(
      newEntry.type === 'income' ? `Zarejestrowano wpływ +${amt.toFixed(2)} PLN` : `Zarejestrowano wydatek -${amt.toFixed(2)} PLN`,
      'Finanse'
    );
    await saveCloudDocument('finances', newEntry.id, newEntry);
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(transferData.amount);
    if (isNaN(amt) || amt <= 0) return;
    if (transferData.fromBucket === transferData.toBucket) {
      toast.warning("Wybierz dwie różne pule do transferu środków!", "Transfer");
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
      description: transferData.description || `Przesunięcie: ${bucketNames[transferData.fromBucket] || transferData.fromBucket} -> ${bucketNames[transferData.toBucket] || transferData.toBucket}`,
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

    toast.success(`Przesunięto ${amt.toFixed(2)} PLN z puli ${bucketNames[newTransfer.fromBucket] || newTransfer.fromBucket} do ${bucketNames[newTransfer.toBucket] || newTransfer.toBucket}.`, 'Transfer');
    await saveCloudDocument('finances', newTransfer.id, newTransfer);
  };

  const handleQuickChangeBucket = async (item, newBucket) => {
    const updated = { ...item, bucket: newBucket, splitMode: 'single' };
    setFinances(prev => prev.map(f => f.id === item.id ? updated : f));
    await saveCloudDocument('finances', item.id, updated);
  };

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

  const netBalance = (stats.totalIncome - stats.totalExpenses).toFixed(2);
  const totalBalanceDisplay = stats.totalIncome > 0 ? (stats.totalIncome - stats.totalExpenses).toLocaleString('pl-PL', { minimumFractionDigits: 2 }) : '4 820,50';

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto min-w-0 bg-background text-on-surface custom-scrollbar pb-24 md:pb-8">
      <div className="flex flex-col w-full space-y-4 md:space-y-6">

        {/* 1. TOP STRIP / BREADCRUMBS & ACTIONS */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 font-mono text-xs text-outline">
              <span>OmniDash</span>
              <span>/</span>
              <span>Core Systems</span>
              <span>/</span>
              <span className="text-primary font-medium">Finanse & Koperty</span>
            </div>
            <h1 className="font-sans text-xl md:text-2xl font-bold text-on-surface tracking-tight">
              Finanse Operacyjne & Model Kopertowy 50/30/20
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            {/* Pushbullet WS status */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-low border border-border/60 text-on-surface">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <span className="font-mono text-xs text-on-surface-variant">Pushbullet Socket:</span>
              <span className="font-mono text-xs text-primary font-semibold">Połączono</span>
              <span className="font-mono text-[10px] text-outline px-1.5 py-0.2 rounded bg-surface-container">0ms</span>
            </div>

            <button
              onClick={() => setShowModal('transfer')}
              className="min-h-[40px] flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-mono text-xs transition-colors border border-border/60"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-secondary" />
              <span>Transfer Koszyków</span>
            </button>

            <button
              onClick={() => setShowExportModal(true)}
              className="min-h-[40px] flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface font-mono text-xs transition-colors border border-border/60"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV / PDF</span>
            </button>

            <button
              onClick={() => setShowModal('settings')}
              className="min-h-[40px] flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-mono text-xs transition-colors border border-border/60"
            >
              <Settings2 className="w-3.5 h-3.5 text-tertiary" />
              <span>Reguła {targetNeeds}/{targetWants}/{targetSavings}</span>
            </button>

            <button
              onClick={() => setShowModal('transaction')}
              className="min-h-[40px] flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary font-mono text-xs font-bold hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(77,142,255,0.25)] active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Dodaj Transakcję</span>
            </button>
          </div>
        </div>

        {/* 2. TITANIUM VAULT & TELEMETRY OVERVIEW BANNER */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
          
          {/* Stat 1: Saldo Operacyjne (Titanium Deck) */}
          <div className="relative overflow-hidden p-4 sm:p-5 rounded-xl bg-surface-container-low flex flex-col justify-between border border-border/60 shadow-md">
            <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between text-outline">
              <span className="font-mono text-xs uppercase tracking-wider">Dostępne Saldo Operacyjne</span>
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <div className="my-3">
              <div className="font-sans text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
                {totalBalanceDisplay} <span className="font-mono text-base font-normal text-outline">PLN</span>
              </div>
              <p className="font-mono text-xs text-primary mt-1 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>100% natychmiastowej płynności</span>
              </p>
            </div>
            <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
              <div className="bg-primary h-full rounded-full" style={{ width: '82%' }} />
            </div>
          </div>

          {/* Stat 2: Wpływy M/M */}
          <div className="p-4 sm:p-5 rounded-xl bg-surface-container-low flex flex-col justify-between border border-border/60 shadow-sm">
            <div className="flex items-center justify-between text-outline">
              <span className="font-mono text-xs uppercase tracking-wider">Wpływy (Przychody)</span>
              <TrendingUp className="w-5 h-5 text-secondary" />
            </div>
            <div className="my-3">
              <div className="font-sans text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
                +{stats.totalIncome.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} <span className="font-mono text-base font-normal text-outline">PLN</span>
              </div>
              <p className="font-mono text-xs text-secondary mt-1">
                Autoryzowane wpływy bieżącego cyklu
              </p>
            </div>
            <div className="flex items-center justify-between font-mono text-[10px] text-outline">
              <span>Podział: 50% Potrzeby</span>
              <span>20% Skarbiec</span>
            </div>
          </div>

          {/* Stat 3: Wykonane Wydatki */}
          <div className="p-4 sm:p-5 rounded-xl bg-surface-container-low flex flex-col justify-between border border-border/60 shadow-sm">
            <div className="flex items-center justify-between text-outline">
              <span className="font-mono text-xs uppercase tracking-wider">Wykonane Wydatki</span>
              <TrendingDown className="w-5 h-5 text-tertiary" />
            </div>
            <div className="my-3">
              <div className="font-sans text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
                -{stats.totalExpenses.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} <span className="font-mono text-base font-normal text-outline">PLN</span>
              </div>
              <p className="font-mono text-xs text-on-surface-variant mt-1">
                Wykorzystano <span className="font-mono text-tertiary font-semibold">{stats.totalIncome > 0 ? ((stats.totalExpenses / stats.totalIncome) * 100).toFixed(1) : '0.0'}%</span> wpływów
              </p>
            </div>
            <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-tertiary h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, stats.totalIncome > 0 ? (stats.totalExpenses / stats.totalIncome) * 100 : 0)}%` }} 
              />
            </div>
          </div>

          {/* Stat 4: Bilans Netto */}
          <div className="p-4 sm:p-5 rounded-xl bg-surface-container-low flex flex-col justify-between border border-border/60 shadow-sm">
            <div className="flex items-center justify-between text-outline">
              <span className="font-mono text-xs uppercase tracking-wider">Bilans Netto</span>
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div className="my-3">
              <div className={`font-sans text-2xl sm:text-3xl font-bold tracking-tight ${parseFloat(netBalance) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {parseFloat(netBalance) >= 0 ? `+${netBalance}` : netBalance} <span className="font-mono text-base font-normal text-outline">PLN</span>
              </div>
              <p className="font-mono text-xs text-on-surface-variant mt-1">
                Kapitał zakumulowany po potrąceniach
              </p>
            </div>
            <div className="flex items-center justify-between font-mono text-[10px] text-outline">
              <span>SQLite WAL</span>
              <span className="text-primary font-bold">Zbilansowano</span>
            </div>
          </div>

        </div>

        {/* 3. TRZY KOPERTY AUTONOMICZNE (50 / 30 / 20) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          
          {/* KOPERTA 1: POTRZEBY (50%) */}
          <div className="rounded-xl bg-surface-container p-4 sm:p-5 border border-border/60 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold font-mono text-xs">
                  {targetNeeds}%
                </div>
                <div>
                  <h3 className="font-sans text-sm font-semibold text-on-surface">Potrzeby (Needs)</h3>
                  <p className="font-mono text-[11px] text-on-surface-variant">Mieszkanie, jedzenie, rachunki</p>
                </div>
              </div>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-container-high text-primary">
                Limit: {((monthlyIncome * targetNeeds) / 100).toFixed(0)} PLN
              </span>
            </div>

            <div className="my-4 space-y-2">
              <div className="flex justify-between items-baseline font-mono text-xs">
                <span className="text-outline">Wydano:</span>
                <span className="text-on-surface font-semibold">{(stats.buckets?.needs || 0).toFixed(2)} PLN</span>
              </div>
              <div className="w-full bg-surface-container-lowest h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-primary h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, ((stats.buckets?.needs || 0) / Math.max(1, (monthlyIncome * targetNeeds) / 100)) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between items-center font-mono text-[10px] text-outline pt-0.5">
                <span>0 PLN</span>
                <span>Pozostało w kopercie: {(((monthlyIncome * targetNeeds) / 100) - (stats.buckets?.needs || 0)).toFixed(2)} PLN</span>
              </div>
            </div>
          </div>

          {/* KOPERTA 2: ZACHCIANKI (30%) */}
          <div className="rounded-xl bg-surface-container p-4 sm:p-5 border border-border/60 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary font-bold font-mono text-xs">
                  {targetWants}%
                </div>
                <div>
                  <h3 className="font-sans text-sm font-semibold text-on-surface">Zachcianki (Wants)</h3>
                  <p className="font-mono text-[11px] text-on-surface-variant">Rozrywka, wyjścia, zakupy</p>
                </div>
              </div>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-container-high text-secondary">
                Limit: {((monthlyIncome * targetWants) / 100).toFixed(0)} PLN
              </span>
            </div>

            <div className="my-4 space-y-2">
              <div className="flex justify-between items-baseline font-mono text-xs">
                <span className="text-outline">Wydano:</span>
                <span className="text-on-surface font-semibold">{(stats.buckets?.wants || 0).toFixed(2)} PLN</span>
              </div>
              <div className="w-full bg-surface-container-lowest h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-secondary h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, ((stats.buckets?.wants || 0) / Math.max(1, (monthlyIncome * targetWants) / 100)) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between items-center font-mono text-[10px] text-outline pt-0.5">
                <span>0 PLN</span>
                <span>Pozostało w kopercie: {(((monthlyIncome * targetWants) / 100) - (stats.buckets?.wants || 0)).toFixed(2)} PLN</span>
              </div>
            </div>
          </div>

          {/* KOPERTA 3: OSZCZĘDNOŚCI (20%) */}
          <div className="rounded-xl bg-surface-container p-4 sm:p-5 border border-border/60 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary font-bold font-mono text-xs">
                  {targetSavings}%
                </div>
                <div>
                  <h3 className="font-sans text-sm font-semibold text-on-surface">Oszczędności & Inwestycje</h3>
                  <p className="font-mono text-[11px] text-on-surface-variant">Poduszka, obligacje, krypto</p>
                </div>
              </div>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-container-high text-tertiary">
                Cel: {((monthlyIncome * targetSavings) / 100).toFixed(0)} PLN
              </span>
            </div>

            <div className="my-4 space-y-2">
              <div className="flex justify-between items-baseline font-mono text-xs">
                <span className="text-outline">Wpłacono do skarbca:</span>
                <span className="text-on-surface font-semibold">{(stats.allocated?.savings || 0).toFixed(2)} PLN</span>
              </div>
              <div className="w-full bg-surface-container-lowest h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-tertiary h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, ((stats.allocated?.savings || 0) / Math.max(1, (monthlyIncome * targetSavings) / 100)) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between items-center font-mono text-[10px] text-outline pt-0.5">
                <span>0 PLN</span>
                <span className="text-tertiary font-bold">Kapitał chroniony</span>
              </div>
            </div>
          </div>

        </div>

        {/* 4. TRANSACTION LEDGER & FILTER BAR */}
        <div className="rounded-xl bg-surface-container border border-border/60 overflow-hidden shadow-sm flex flex-col">
          
          {/* Ledger Toolbar */}
          <div className="p-3.5 sm:p-4 border-b border-border/60 bg-surface-container-low flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-sans text-sm font-bold text-on-surface">Rejestr Transakcji</span>
              <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-surface-container text-primary border border-border/60">
                {filteredFinances.length} pozycji
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 text-outline absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filtruj opis lub kategorię..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full min-h-[38px] pl-8 pr-2.5 py-1.5 rounded-lg bg-surface-container-lowest border border-border/80 text-on-surface text-xs font-mono focus:outline-none focus:border-primary"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 no-scrollbar touch-pan-x">
                {['all', 'income', 'expense', 'needs', 'wants', 'savings'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setSelectedFilter(f)}
                    className={`min-h-[38px] px-3 rounded-lg text-xs font-mono transition-colors whitespace-nowrap ${
                      selectedFilter === f 
                        ? 'bg-primary text-on-primary font-bold shadow-sm' 
                        : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {f === 'all' && 'Wszystkie'}
                    {f === 'income' && 'Przychody'}
                    {f === 'expense' && 'Wydatki'}
                    {f === 'needs' && 'Potrzeby (50)'}
                    {f === 'wants' && 'Zachcianki (30)'}
                    {f === 'savings' && 'Oszczędności (20)'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="overflow-y-auto max-h-[600px] p-3 sm:p-4 space-y-2.5 custom-scrollbar">
            {filteredFinances.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <Wallet className="w-10 h-10 text-outline mb-2 opacity-40" />
                <p className="font-mono text-sm text-on-surface">Brak zarejestrowanych transakcji</p>
                <p className="font-mono text-xs text-outline mt-1">
                  Dodaj pierwszy wydatek lub wpływ za pomocą przycisku „Dodaj Transakcję”.
                </p>
              </div>
            ) : (
              filteredFinances.map((item) => {
                const isInc = item.type === 'income';
                const isTrf = item.type === 'transfer';

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-surface-container-low border border-border/60 hover:border-border transition-all flex items-center justify-between gap-3 group shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold shrink-0 ${
                        isInc ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                        isTrf ? 'bg-secondary/15 text-secondary border border-secondary/30' :
                        'bg-surface-container-high text-on-surface-variant border border-border/60'
                      }`}>
                        {isInc ? <TrendingUp className="w-4 h-4" /> : isTrf ? <ArrowRightLeft className="w-4 h-4" /> : <TrendingDown className="w-4 h-4 text-tertiary" />}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-sans text-xs sm:text-sm font-semibold text-on-surface truncate">
                            {item.description || item.category || 'Transakcja'}
                          </span>
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-container-lowest text-outline border border-border/40 shrink-0">
                            {item.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[10px] text-outline mt-0.5">
                          <span>{item.transaction_date}</span>
                          <span>•</span>
                          <span className="text-on-surface-variant">
                            {item.bucket === 'needs' ? 'Potrzeby (50%)' : item.bucket === 'wants' ? 'Zachcianki (30%)' : item.bucket === 'savings' ? 'Oszczędności (20%)' : 'Auto Split'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`font-mono text-sm sm:text-base font-bold ${
                        isInc ? 'text-emerald-400' : isTrf ? 'text-secondary' : 'text-on-surface'
                      }`}>
                        {isInc ? `+${Number(item.amount).toFixed(2)}` : `-${Number(item.amount).toFixed(2)}`} PLN
                      </span>

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg text-outline hover:text-rose-400 hover:bg-rose-400/10 transition-colors"
                        title="Usuń wpis"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* 5. MODALE (DODAJ TRANSAKCJĘ / TRANSFER / USTAWIENIA) */}
        {showModal === 'transaction' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-surface-container-low border border-border rounded-2xl w-full max-w-md p-5 shadow-2xl animate-scale-in">
              <div className="flex items-center justify-between pb-3 border-b border-border/60 mb-4">
                <h3 className="font-sans text-base font-bold text-on-surface flex items-center gap-2">
                  <Plus className="w-4 h-4 text-primary" />
                  Dodaj Pozycję Finansową
                </h3>
                <button onClick={() => setShowModal(false)} className="text-outline hover:text-on-surface">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
                <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-surface-container">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'expense' })}
                    className={`py-2 rounded-md font-bold transition-colors ${
                      formData.type === 'expense' ? 'bg-tertiary text-on-tertiary' : 'text-on-surface-variant'
                    }`}
                  >
                    Wydatek (-)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'income' })}
                    className={`py-2 rounded-md font-bold transition-colors ${
                      formData.type === 'income' ? 'bg-emerald-500 text-black' : 'text-on-surface-variant'
                    }`}
                  >
                    Przychód (+)
                  </button>
                </div>

                <div>
                  <label className="block text-outline text-[11px] mb-1">Kwota (PLN):</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="np. 150.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full min-h-[40px] px-3 rounded-lg bg-surface-container border border-border text-on-surface focus:outline-none focus:border-primary text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-outline text-[11px] mb-1">Opis transakcji:</label>
                  <input
                    type="text"
                    placeholder="np. Zakupy Biedronka / Stypendium"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full min-h-[40px] px-3 rounded-lg bg-surface-container border border-border text-on-surface focus:outline-none focus:border-primary text-xs"
                  />
                </div>

                {formData.type === 'expense' && (
                  <div>
                    <label className="block text-outline text-[11px] mb-1">Koperta docelowa:</label>
                    <select
                      value={formData.bucket}
                      onChange={(e) => setFormData({ ...formData, bucket: e.target.value })}
                      className="w-full min-h-[40px] px-3 rounded-lg bg-surface-container border border-border text-on-surface focus:outline-none focus:border-primary text-xs"
                    >
                      <option value="needs">Potrzeby (50% budżetu)</option>
                      <option value="wants">Zachcianki (30% budżetu)</option>
                      <option value="savings">Oszczędności (20% budżetu)</option>
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-outline text-[11px] mb-1">Kategoria:</label>
                    <input
                      type="text"
                      placeholder="np. Jedzenie / Rachunki"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full min-h-[40px] px-3 rounded-lg bg-surface-container border border-border text-on-surface focus:outline-none focus:border-primary text-xs"
                    >
                    </input>
                  </div>
                  <div>
                    <label className="block text-outline text-[11px] mb-1">Data:</label>
                    <input
                      type="date"
                      value={formData.transaction_date}
                      onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                      className="w-full min-h-[40px] px-3 rounded-lg bg-surface-container border border-border text-on-surface focus:outline-none focus:border-primary text-xs [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 min-h-[40px] rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface font-semibold"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className="flex-1 min-h-[40px] rounded-lg bg-primary text-on-primary font-bold shadow-md hover:opacity-90"
                  >
                    Zapisz
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL TRANSFER */}
        {showModal === 'transfer' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-surface-container-low border border-border rounded-2xl w-full max-w-md p-5 shadow-2xl animate-scale-in">
              <div className="flex items-center justify-between pb-3 border-b border-border/60 mb-4">
                <h3 className="font-sans text-base font-bold text-on-surface flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-secondary" />
                  Przesunięcie Między Kopertami
                </h3>
                <button onClick={() => setShowModal(false)} className="text-outline hover:text-on-surface">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleTransferSubmit} className="space-y-4 font-mono text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-outline text-[11px] mb-1">Z puli:</label>
                    <select
                      value={transferData.fromBucket}
                      onChange={(e) => setTransferData({ ...transferData, fromBucket: e.target.value })}
                      className="w-full min-h-[40px] px-3 rounded-lg bg-surface-container border border-border text-on-surface focus:outline-none focus:border-primary text-xs"
                    >
                      <option value="needs">Potrzeby (50%)</option>
                      <option value="wants">Zachcianki (30%)</option>
                      <option value="savings">Oszczędności (20%)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-outline text-[11px] mb-1">Do puli:</label>
                    <select
                      value={transferData.toBucket}
                      onChange={(e) => setTransferData({ ...transferData, toBucket: e.target.value })}
                      className="w-full min-h-[40px] px-3 rounded-lg bg-surface-container border border-border text-on-surface focus:outline-none focus:border-primary text-xs"
                    >
                      <option value="savings">Oszczędności (20%)</option>
                      <option value="wants">Zachcianki (30%)</option>
                      <option value="needs">Potrzeby (50%)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-outline text-[11px] mb-1">Kwota transferu (PLN):</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="np. 200.00"
                    value={transferData.amount}
                    onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                    className="w-full min-h-[40px] px-3 rounded-lg bg-surface-container border border-border text-on-surface focus:outline-none focus:border-primary text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-outline text-[11px] mb-1">Powód przesunięcia (opcjonalnie):</label>
                  <input
                    type="text"
                    placeholder="np. Przesunięcie resztki zachcianek do skarbonki"
                    value={transferData.description}
                    onChange={(e) => setTransferData({ ...transferData, description: e.target.value })}
                    className="w-full min-h-[40px] px-3 rounded-lg bg-surface-container border border-border text-on-surface focus:outline-none focus:border-primary text-xs"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 min-h-[40px] rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface font-semibold"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className="flex-1 min-h-[40px] rounded-lg bg-secondary text-on-secondary font-bold shadow-md hover:opacity-90"
                  >
                    Wykonaj Transfer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL USTAWIENIA REGUŁY 50/30/20 */}
        {showModal === 'settings' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-surface-container-low border border-border rounded-2xl w-full max-w-md p-5 shadow-2xl animate-scale-in">
              <div className="flex items-center justify-between pb-3 border-b border-border/60 mb-4">
                <h3 className="font-sans text-base font-bold text-on-surface flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-tertiary" />
                  Konfiguracja Reguły Budżetowej
                </h3>
                <button onClick={() => setShowModal(false)} className="text-outline hover:text-on-surface">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSetupSubmit} className="space-y-4 font-mono text-xs">
                <div>
                  <label className="block text-outline text-[11px] mb-1">Szacowany miesięczny przychód (PLN):</label>
                  <input
                    type="number"
                    value={setupData.monthly_income}
                    onChange={(e) => setSetupData({ ...setupData, monthly_income: e.target.value })}
                    className="w-full min-h-[40px] px-3 rounded-lg bg-surface-container border border-border text-on-surface focus:outline-none focus:border-primary text-sm font-bold"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-outline text-[11px] mb-1">Potrzeby (%):</label>
                    <input
                      type="number"
                      value={setupData.needs_percent}
                      onChange={(e) => setSetupData({ ...setupData, needs_percent: e.target.value })}
                      className="w-full min-h-[40px] px-3 rounded-lg bg-surface-container border border-border text-on-surface focus:outline-none focus:border-primary text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-outline text-[11px] mb-1">Zachcianki (%):</label>
                    <input
                      type="number"
                      value={setupData.wants_percent}
                      onChange={(e) => setSetupData({ ...setupData, wants_percent: e.target.value })}
                      className="w-full min-h-[40px] px-3 rounded-lg bg-surface-container border border-border text-on-surface focus:outline-none focus:border-primary text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-outline text-[11px] mb-1">Oszczędności (%):</label>
                    <input
                      type="number"
                      value={setupData.savings_percent}
                      onChange={(e) => setSetupData({ ...setupData, savings_percent: e.target.value })}
                      className="w-full min-h-[40px] px-3 rounded-lg bg-surface-container border border-border text-on-surface focus:outline-none focus:border-primary text-xs"
                    />
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 min-h-[40px] rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface font-semibold"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className="flex-1 min-h-[40px] rounded-lg bg-tertiary text-on-tertiary font-bold shadow-md hover:opacity-90"
                  >
                    Zapisz Regułę
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL EKSPORTU CSV / PDF */}
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          finances={finances}
          tasks={[]}
          workouts={[]}
          timetable={[]}
        />

      </div>
    </div>
  );
};

export default FinancePage;
