import { useTranslation } from 'react-i18next';
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { subscribeCollection, saveCloudDocument, deleteCloudDocument, isCloudEnvironment } from '../services/cloudSync';
import { useToast } from '../context/ToastContext';
import ExportModal from '../components/ExportModal';
import { calculateFinanceStats } from '../services/budgetCalculator';
import { INITIAL_FINANCE_TRANSACTIONS } from '../config/initialData';

const FinancePage = () => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [finances, setFinances] = useState([]);
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('system_finance_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          monthly_income: parsed.monthly_income !== undefined && !isNaN(Number(parsed.monthly_income)) ? Number(parsed.monthly_income) : 5200,
          needs_percent: parsed.needs_percent !== undefined && !isNaN(Number(parsed.needs_percent)) ? Number(parsed.needs_percent) : 50,
          wants_percent: parsed.wants_percent !== undefined && !isNaN(Number(parsed.wants_percent)) ? Number(parsed.wants_percent) : 30,
          savings_percent: parsed.savings_percent !== undefined && !isNaN(Number(parsed.savings_percent)) ? Number(parsed.savings_percent) : 20
        };
      }
    } catch {}
    return { monthly_income: 5200, needs_percent: 50, wants_percent: 30, savings_percent: 20 };
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); // all | needs | wants | savings | income | expense
  const [showModal, setShowModal] = useState(false); // false | 'transaction' | 'transfer' | 'settings'
  const [showExportModal, setShowExportModal] = useState(false);

  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: 'Wyżywienie',
    bucket: 'needs',
    incomeMode: 'split',
    incomeBucket: 'needs',
    customNeeds: '',
    customWants: '',
    customSavings: '',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0]
  });

  const [transferData, setTransferData] = useState({
    fromBucket: 'wants',
    toBucket: 'needs',
    amount: '',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0]
  });

  const [setupData, setSetupData] = useState({
    monthly_income: settings?.monthly_income ?? 5200,
    needs_percent: settings?.needs_percent ?? 50,
    wants_percent: settings?.wants_percent ?? 30,
    savings_percent: settings?.savings_percent ?? 20
  });

  useEffect(() => {
    setSetupData({
      monthly_income: settings?.monthly_income ?? 5200,
      needs_percent: settings?.needs_percent ?? 50,
      wants_percent: settings?.wants_percent ?? 30,
      savings_percent: settings?.savings_percent ?? 20
    });
  }, [settings]);

  const targetNeeds = settings?.needs_percent !== undefined && !isNaN(Number(settings?.needs_percent)) ? Number(settings.needs_percent) : 50;
  const targetWants = settings?.wants_percent !== undefined && !isNaN(Number(settings?.wants_percent)) ? Number(settings.wants_percent) : 30;
  const targetSavings = settings?.savings_percent !== undefined && !isNaN(Number(settings?.savings_percent)) ? Number(settings.savings_percent) : 20;
  const monthlyIncome = settings?.monthly_income !== undefined && !isNaN(Number(settings?.monthly_income)) ? Number(settings.monthly_income) : 5200;

  // Subskrypcja Firestore CloudSync
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
        const listToUse = txs.length > 0 ? txs : INITIAL_FINANCE_TRANSACTIONS;
        const sorted = [...listToUse].sort((a, b) => new Date(b.transaction_date || 0) - new Date(a.transaction_date || 0));
        setFinances(sorted);
      }
    }, INITIAL_FINANCE_TRANSACTIONS);

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

  const handleSetupSubmit = async (e) => {
    if (e) e.preventDefault();
    const dataToSubmit = {
      monthly_income: parseFloat(setupData.monthly_income) || 5200,
      needs_percent: parseFloat(setupData.needs_percent) || 50,
      wants_percent: parseFloat(setupData.wants_percent) || 30,
      savings_percent: parseFloat(setupData.savings_percent) || 20
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
    toast.success(`Zaktualizowano regułę budżetową 50/30/20.`, 'Budżet');
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
      toast.info('Pozycja usunięta z ewidencji.', 'Finanse');
    } catch (err) {
      toast.error(`Błąd: ${err.message}`, 'Błąd');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(formData.amount);
    if (isNaN(amt) || amt <= 0) return;

    const newEntry = {
      id: Date.now().toString(),
      type: formData.type,
      amount: amt,
      category: formData.category || 'Inne',
      description: formData.description || (formData.type === 'income' ? 'Przelew Przychodzący' : 'Transakcja bieżąca'),
      transaction_date: formData.transaction_date,
      currency: 'PLN'
    };

    if (formData.type === 'expense') {
      newEntry.bucket = formData.bucket || 'needs';
    } else {
      newEntry.splitMode = formData.incomeMode;
      if (formData.incomeMode === 'single') {
        newEntry.bucket = formData.incomeBucket || 'needs';
      } else {
        const nAmt = Number(((amt * targetNeeds) / 100).toFixed(2));
        const wAmt = Number(((amt * targetWants) / 100).toFixed(2));
        const sAmt = Number((amt - nAmt - wAmt).toFixed(2));
        newEntry.distribution = { needs: nAmt, wants: wAmt, savings: sAmt };
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
      toast.warning("Wybierz dwa różne koszyki!", "Transfer");
      return;
    }

    const bucketNames = { needs: 'Potrzeby (Needs)', wants: 'Zachcianki (Wants)', savings: 'Oszczędności (Savings)' };
    const newTransfer = {
      id: Date.now().toString(),
      type: 'transfer',
      amount: amt,
      fromBucket: transferData.fromBucket,
      toBucket: transferData.toBucket,
      category: 'Transfer Koszyków',
      description: transferData.description || `Przesunięcie: ${bucketNames[transferData.fromBucket]} -> ${bucketNames[transferData.toBucket]}`,
      transaction_date: transferData.transaction_date,
      currency: 'PLN'
    };

    setFinances(prev => [newTransfer, ...prev]);
    setShowModal(false);
    setTransferData({
      fromBucket: 'wants',
      toBucket: 'needs',
      amount: '',
      description: '',
      transaction_date: new Date().toISOString().split('T')[0]
    });

    toast.success(`Przesunięto ${amt.toFixed(2)} PLN między koszykami.`, 'Transfer');
    await saveCloudDocument('finances', newTransfer.id, newTransfer);
  };

  const filteredFinances = useMemo(() => {
    return finances.filter(item => {
      const matchSearch = searchQuery === '' || 
        (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchSearch) return false;
      if (selectedFilter === 'all') return true;
      if (selectedFilter === 'needs') return item.bucket === 'needs';
      if (selectedFilter === 'wants') return item.bucket === 'wants';
      if (selectedFilter === 'savings') return item.bucket === 'savings';
      if (selectedFilter === 'income') return item.type === 'income';
      if (selectedFilter === 'expense') return item.type === 'expense';
      return true;
    });
  }, [finances, searchQuery, selectedFilter]);

  // Wartości domyślne Stitch do renderu w przypadku braku pełnej historii transakcji
  const currentTotalIncome = stats.totalIncome > 0 ? stats.totalIncome : 5200;
  const currentTotalExpense = stats.totalExpenses > 0 ? stats.totalExpenses : 3950;
  const currentAvailableBalance = stats.totalIncome > 0 ? (stats.totalIncome - stats.totalExpenses) : 4820.50;
  const currentNetSavings = (currentTotalIncome - currentTotalExpense);

  const needsSpent = stats.needsExpenses > 0 ? stats.needsExpenses : 2100;
  const needsLimit = stats.needsBudget > 0 ? stats.needsBudget : 2500;
  const needsPct = Math.min(100, Math.round((needsSpent / needsLimit) * 100));

  const wantsSpent = stats.wantsExpenses > 0 ? stats.wantsExpenses : 850;
  const wantsLimit = stats.wantsBudget > 0 ? stats.wantsBudget : 1500;
  const wantsPct = Math.min(100, Math.round((wantsSpent / wantsLimit) * 100));

  const savingsRealized = stats.totalSavings > 0 ? stats.totalSavings : 1000;
  const savingsLimit = stats.savingsBudget > 0 ? stats.savingsBudget : 1000;
  const savingsPct = Math.min(100, Math.round((savingsRealized / savingsLimit) * 100));

  return (
    <div className="flex-1 flex flex-col w-full space-y-space-lg text-on-surface antialiased">
      
      {/* 1. TOP COMMAND & STATUS RIBBON */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
        <div className="flex flex-col">
          <div className="flex items-center gap-space-xs font-code-mono text-label-sm text-outline">
            <span>OmniDash</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span>Core Systems</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-medium">Finanse &amp; Koperty</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight mt-space-xs">
            Finanse Operacyjne &amp; Model Kopertowy 50/30/20
          </h1>
        </div>

        {/* Actions & Socket Status */}
        <div className="flex flex-wrap items-center gap-space-sm">
          {/* Pushbullet WebSocket Active Indicator */}
          <div className="flex items-center gap-space-sm px-space-md py-1.5 rounded-full bg-surface-container-low text-on-surface border border-outline-variant/20 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="font-code-mono text-label-sm text-on-surface-variant">Pushbullet Socket:</span>
            <span className="font-code-mono text-label-sm text-primary font-semibold">Połączono</span>
            <span className="font-code-mono text-[10px] text-outline px-1.5 py-0.5 rounded bg-surface-container">0ms</span>
          </div>

          <div className="flex items-center gap-space-xs">
            <button
              onClick={() => setShowModal('transfer')}
              className="flex items-center gap-space-xs px-space-md py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-all active:scale-[0.97]"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] text-secondary">sync_alt</span>
              <span>Transfer Koszyków</span>
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-space-xs px-space-md py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface font-label-md text-label-md transition-all active:scale-[0.97]"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">file_download</span>
              <span>CSV / PDF</span>
            </button>
            <button
              onClick={() => setShowModal('settings')}
              className="w-9 h-9 rounded-lg bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-outline hover:text-on-surface transition-colors"
              title="Konfiguracja proporcji 50/30/20"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">tune</span>
            </button>
            <button
              onClick={() => setShowModal('transaction')}
              className="flex items-center gap-space-xs px-space-md py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(77,142,255,0.25)] active:scale-[0.97]"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Dodaj Transakcję</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. TELEMETRY OVERVIEW BANNER */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md">
        
        {/* Stat 1: Saldo Całkowite */}
        <div className="relative overflow-hidden p-space-md rounded-xl bg-surface-container-low flex flex-col justify-between border border-outline-variant/20 shadow-sm">
          <div className="flex items-center justify-between text-outline">
            <span className="font-label-sm text-label-sm uppercase tracking-wider">Dostępne Saldo Operacyjne</span>
            <span className="material-symbols-outlined text-primary text-[20px]">account_balance</span>
          </div>
          <div className="my-space-md">
            <div className="font-headline-xl text-headline-xl font-semibold text-on-surface tracking-tight">
              {currentAvailableBalance.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
              <span className="font-code-mono text-headline-md text-outline font-normal">PLN</span>
            </div>
            <p className="font-label-sm text-label-sm text-on-surface-variant mt-1 flex items-center gap-1">
              <span className="text-primary font-code-mono font-semibold">100%</span> płynności natychmiastowej
            </p>
          </div>
          <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden">
            <div className="bg-primary h-full rounded-full" style={{ width: '78%' }} />
          </div>
        </div>

        {/* Stat 2: Wpływy */}
        <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col justify-between border border-outline-variant/20 shadow-sm">
          <div className="flex items-center justify-between text-outline">
            <span className="font-label-sm text-label-sm uppercase tracking-wider">Wpływy M/M (Bieżący)</span>
            <span className="material-symbols-outlined text-secondary text-[20px]">south_west</span>
          </div>
          <div className="my-space-md">
            <div className="font-headline-xl text-headline-xl font-semibold text-on-surface tracking-tight">
              +{currentTotalIncome.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
              <span className="font-code-mono text-headline-md text-outline font-normal">PLN</span>
            </div>
            <p className="font-label-sm text-label-sm text-secondary font-code-mono mt-1">
              +14.2% względem prognozy
            </p>
          </div>
          <div className="flex items-center justify-between font-code-mono text-label-sm text-outline">
            <span>Stypendium: 2 400</span>
            <span>Zlecenia: 2 800</span>
          </div>
        </div>

        {/* Stat 3: Wydatki */}
        <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col justify-between border border-outline-variant/20 shadow-sm">
          <div className="flex items-center justify-between text-outline">
            <span className="font-label-sm text-label-sm uppercase tracking-wider">Wykonane Wydatki</span>
            <span className="material-symbols-outlined text-tertiary text-[20px]">north_east</span>
          </div>
          <div className="my-space-md">
            <div className="font-headline-xl text-headline-xl font-semibold text-on-surface tracking-tight">
              -{currentTotalExpense.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
              <span className="font-code-mono text-headline-md text-outline font-normal">PLN</span>
            </div>
            <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
              Wykorzystano <span className="font-code-mono text-tertiary font-medium">
                {currentTotalIncome > 0 ? ((currentTotalExpense / currentTotalIncome) * 100).toFixed(1) : '76.0'}%
              </span> całego limitu
            </p>
          </div>
          <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden">
            <div className="bg-tertiary h-full rounded-full" style={{ width: `${Math.min(100, Math.round((currentTotalExpense / currentTotalIncome) * 100))}%` }} />
          </div>
        </div>

        {/* Stat 4: Oszczędności Netto */}
        <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col justify-between border border-outline-variant/20 shadow-sm">
          <div className="flex items-center justify-between text-outline">
            <span className="font-label-sm text-label-sm uppercase tracking-wider">Nadwyżka / Oszczędności Netto</span>
            <span className="material-symbols-outlined text-primary text-[20px]">savings</span>
          </div>
          <div className="my-space-md">
            <div className="font-headline-xl text-headline-xl font-semibold text-primary font-code-mono tracking-tight">
              +{currentNetSavings.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
              <span className="text-headline-md text-outline font-normal">PLN</span>
            </div>
            <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
              Alokacja do rezerwy zrealizowana
            </p>
          </div>
          <div className="flex items-center gap-space-xs font-code-mono text-label-sm text-outline">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>Bufor płynności zabezpieczony</span>
          </div>
        </div>

      </div>

      {/* 3. MAIN SECTION: DECK KOPERT 50/30/20 */}
      <div className="space-y-space-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-primary text-[20px]">pie_chart</span>
            <h2 className="font-headline-md text-headline-md text-on-surface font-semibold tracking-tight">
              Koperty Autonomiczne (Budżet 50/30/20)
            </h2>
          </div>
          <span className="font-code-mono text-label-sm text-outline">
            Reguła: {targetNeeds}% / {targetWants}% / {targetSavings}%
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-md">
          
          {/* Koperta 1: Needs (50%) */}
          <div className="rounded-xl bg-surface-container-low p-space-lg flex flex-col justify-between space-y-space-lg shadow-sm border border-outline-variant/20">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-space-xs">
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-code-mono text-label-sm font-semibold">
                      {targetNeeds}% POZIOM BAZOWY
                    </span>
                    <span className="font-label-sm text-label-sm text-outline">Niezbędne</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface font-semibold mt-space-xs">
                    Konieczności (Needs)
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[22px]">shield</span>
                </div>
              </div>

              <div className="mt-space-lg flex items-baseline justify-between font-code-mono">
                <span className="font-headline-lg text-headline-lg font-semibold text-on-surface">
                  {needsSpent.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} PLN
                </span>
                <span className="text-outline text-body-md">
                  / {needsLimit.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} PLN
                </span>
              </div>

              {/* Progress */}
              <div className="mt-space-sm">
                <div className="flex justify-between font-code-mono text-label-sm text-outline mb-1">
                  <span>Wykorzystanie</span>
                  <span className="text-primary font-semibold">{needsPct}%</span>
                </div>
                <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${needsPct}%` }} />
                </div>
              </div>

              {/* Subcategories list */}
              <div className="mt-space-lg space-y-space-sm">
                <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container text-body-md font-body-md">
                  <div className="flex items-center gap-space-sm min-w-0">
                    <span className="material-symbols-outlined text-outline text-[16px]">restaurant</span>
                    <span className="text-on-surface truncate">Jedzenie &amp; Dieta</span>
                  </div>
                  <span className="font-code-mono text-on-surface font-medium whitespace-nowrap">980,00 PLN</span>
                </div>
                <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container text-body-md font-body-md">
                  <div className="flex items-center gap-space-sm min-w-0">
                    <span className="material-symbols-outlined text-outline text-[16px]">dns</span>
                    <span className="text-on-surface truncate">Rachunki &amp; Serwery</span>
                  </div>
                  <span className="font-code-mono text-on-surface font-medium whitespace-nowrap">620,00 PLN</span>
                </div>
                <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container text-body-md font-body-md">
                  <div className="flex items-center gap-space-sm min-w-0">
                    <span className="material-symbols-outlined text-outline text-[16px]">local_gas_station</span>
                    <span className="text-on-surface truncate">Dojazdy &amp; Paliwo</span>
                  </div>
                  <span className="font-code-mono text-on-surface font-medium whitespace-nowrap">500,00 PLN</span>
                </div>
              </div>
            </div>

            <div className="pt-space-md flex items-center justify-between font-code-mono text-label-sm text-outline bg-surface-container-lowest/40 -mx-space-lg -mb-space-lg px-space-lg py-space-sm rounded-b-xl border-t border-outline-variant/10">
              <span>Pozostało w koszyku:</span>
              <span className="text-on-surface font-semibold">
                {Math.max(0, needsLimit - needsSpent).toLocaleString('pl-PL', { minimumFractionDigits: 2 })} PLN
              </span>
            </div>
          </div>

          {/* Koperta 2: Wants (30%) */}
          <div className="rounded-xl bg-surface-container-low p-space-lg flex flex-col justify-between space-y-space-lg shadow-sm border border-outline-variant/20">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-space-xs">
                    <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-code-mono text-label-sm font-semibold">
                      {targetWants}% SWOBODNY ROZWÓJ
                    </span>
                    <span className="font-label-sm text-label-sm text-outline">Osobiste</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface font-semibold mt-space-xs">
                    Zachcianki (Wants)
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-[22px]">interests</span>
                </div>
              </div>

              <div className="mt-space-lg flex items-baseline justify-between font-code-mono">
                <span className="font-headline-lg text-headline-lg font-semibold text-on-surface">
                  {wantsSpent.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} PLN
                </span>
                <span className="text-outline text-body-md">
                  / {wantsLimit.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} PLN
                </span>
              </div>

              {/* Progress */}
              <div className="mt-space-sm">
                <div className="flex justify-between font-code-mono text-label-sm text-outline mb-1">
                  <span>Wykorzystanie</span>
                  <span className="text-secondary font-semibold">{wantsPct}%</span>
                </div>
                <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                  <div className="bg-secondary h-full rounded-full transition-all duration-500" style={{ width: `${wantsPct}%` }} />
                </div>
              </div>

              {/* Subcategories list */}
              <div className="mt-space-lg space-y-space-sm">
                <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container text-body-md font-body-md">
                  <div className="flex items-center gap-space-sm min-w-0">
                    <span className="material-symbols-outlined text-outline text-[16px]">construction</span>
                    <span className="text-on-surface truncate">Sprzęt &amp; Warsztat strych</span>
                  </div>
                  <span className="font-code-mono text-on-surface font-medium whitespace-nowrap">420,00 PLN</span>
                </div>
                <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container text-body-md font-body-md">
                  <div className="flex items-center gap-space-sm min-w-0">
                    <span className="material-symbols-outlined text-outline text-[16px]">terminal</span>
                    <span className="text-on-surface truncate">IT (Copilot, Groq, Obsidian)</span>
                  </div>
                  <span className="font-code-mono text-on-surface font-medium whitespace-nowrap">210,00 PLN</span>
                </div>
                <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container text-body-md font-body-md">
                  <div className="flex items-center gap-space-sm min-w-0">
                    <span className="material-symbols-outlined text-outline text-[16px]">local_bar</span>
                    <span className="text-on-surface truncate">Wyjścia / Mixology</span>
                  </div>
                  <span className="font-code-mono text-on-surface font-medium whitespace-nowrap">220,00 PLN</span>
                </div>
              </div>
            </div>

            <div className="pt-space-md flex items-center justify-between font-code-mono text-label-sm text-outline bg-surface-container-lowest/40 -mx-space-lg -mb-space-lg px-space-lg py-space-sm rounded-b-xl border-t border-outline-variant/10">
              <span>Pozostało w koszyku:</span>
              <span className="text-secondary font-semibold">
                {Math.max(0, wantsLimit - wantsSpent).toLocaleString('pl-PL', { minimumFractionDigits: 2 })} PLN
              </span>
            </div>
          </div>

          {/* Koperta 3: Savings (20%) */}
          <div className="rounded-xl bg-surface-container-low p-space-lg flex flex-col justify-between space-y-space-lg shadow-sm border border-outline-variant/20">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-space-xs">
                    <span className="px-2 py-0.5 rounded-full bg-tertiary/10 text-tertiary font-code-mono text-label-sm font-semibold">
                      {targetSavings}% AKUMULACJA KAPITAŁU
                    </span>
                    <span className="font-label-sm text-label-sm text-outline">Stabilność</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface font-semibold mt-space-xs">
                    Oszczędności (Savings)
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-tertiary">
                  <span className="material-symbols-outlined text-[22px]">lock</span>
                </div>
              </div>

              <div className="mt-space-lg flex items-baseline justify-between font-code-mono">
                <span className="font-headline-lg text-headline-lg font-semibold text-on-surface">
                  {savingsRealized.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} PLN
                </span>
                <span className="text-outline text-body-md">
                  / {savingsLimit.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} PLN
                </span>
              </div>

              {/* Progress */}
              <div className="mt-space-sm">
                <div className="flex justify-between font-code-mono text-label-sm text-outline mb-1">
                  <span>Realizacja Celu</span>
                  <span className="text-tertiary font-semibold">{savingsPct}% zrealizowano</span>
                </div>
                <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                  <div className="bg-tertiary h-full rounded-full transition-all duration-500" style={{ width: `${savingsPct}%` }} />
                </div>
              </div>

              {/* Subcategories list */}
              <div className="mt-space-lg space-y-space-sm">
                <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container text-body-md font-body-md">
                  <div className="flex items-center gap-space-sm min-w-0">
                    <span className="material-symbols-outlined text-outline text-[16px]">water_drop</span>
                    <span className="text-on-surface truncate">Rezerwa Płynnościowa</span>
                  </div>
                  <span className="font-code-mono text-on-surface font-medium whitespace-nowrap">500,00 PLN</span>
                </div>
                <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container text-body-md font-body-md">
                  <div className="flex items-center gap-space-sm min-w-0">
                    <span className="material-symbols-outlined text-outline text-[16px]">laptop_mac</span>
                    <span className="text-on-surface truncate">Fundusz M-Series Workstation</span>
                  </div>
                  <span className="font-code-mono text-on-surface font-medium whitespace-nowrap">500,00 PLN</span>
                </div>
                <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container/50 text-body-md font-body-md opacity-70">
                  <div className="flex items-center gap-space-sm min-w-0">
                    <span className="material-symbols-outlined text-outline text-[16px]">check_circle</span>
                    <span className="text-on-surface truncate">Status Miesiąca</span>
                  </div>
                  <span className="font-code-mono text-primary text-label-sm font-semibold whitespace-nowrap">ZABEZPIECZONY</span>
                </div>
              </div>
            </div>

            <div className="pt-space-md flex items-center justify-between font-code-mono text-label-sm text-outline bg-surface-container-lowest/40 -mx-space-lg -mb-space-lg px-space-lg py-space-sm rounded-b-xl border-t border-outline-variant/10">
              <span>Skumulowany bufor:</span>
              <span className="text-tertiary font-semibold">12 400,00 PLN</span>
            </div>
          </div>

        </div>
      </div>

      {/* 4. SECONDARY INTERACTIVE GRID: LEDGER & MINI QUICK-TRANSFER */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-md items-start">
        
        {/* Left Table: Transaction Ledger (8 Cols) */}
        <div className="xl:col-span-8 rounded-xl bg-surface-container-low p-space-lg space-y-space-md shadow-sm border border-outline-variant/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
            <div>
              <h3 className="font-headline-md text-headline-md font-semibold text-on-surface tracking-tight">
                Dziennik Transakcji (Transaction Ledger)
              </h3>
              <p className="font-body-md text-body-md text-outline">Lokalna ewidencja transakcji powiązana z kopertami</p>
            </div>
            
            {/* Filter Controls */}
            <div className="flex items-center gap-space-xs bg-surface-container p-1 rounded-lg font-label-md text-label-md">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-space-sm py-1 rounded transition-all ${selectedFilter === 'all' ? 'bg-surface-container-high text-primary font-semibold shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
                type="button"
              >
                Wszystkie
              </button>
              <button
                onClick={() => setSelectedFilter('needs')}
                className={`px-space-sm py-1 rounded transition-all ${selectedFilter === 'needs' ? 'bg-surface-container-high text-primary font-semibold shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
                type="button"
              >
                Potrzeby
              </button>
              <button
                onClick={() => setSelectedFilter('wants')}
                className={`px-space-sm py-1 rounded transition-all ${selectedFilter === 'wants' ? 'bg-surface-container-high text-primary font-semibold shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
                type="button"
              >
                Zachcianki
              </button>
              <button
                onClick={() => setSelectedFilter('savings')}
                className={`px-space-sm py-1 rounded transition-all ${selectedFilter === 'savings' ? 'bg-surface-container-high text-primary font-semibold shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
                type="button"
              >
                Oszczędności
              </button>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-md text-body-md">
              <thead>
                <tr className="font-label-sm text-label-sm uppercase text-outline tracking-wider bg-surface-container-lowest/60">
                  <th className="py-2.5 px-space-md rounded-l-lg">Data &amp; Godzina</th>
                  <th className="py-2.5 px-space-md">Opis operacji</th>
                  <th className="py-2.5 px-space-md">Koszyk</th>
                  <th className="py-2.5 px-space-md">Kanał / Metoda</th>
                  <th className="py-2.5 px-space-md text-right rounded-r-lg">Kwota</th>
                </tr>
              </thead>
              <tbody className="divide-y-0">
                {filteredFinances.length === 0 ? (
                  /* Fallback Demo Rows from Stitch mockup */
                  <>
                    <tr className="hover:bg-surface-container transition-colors group">
                      <td className="py-3 px-space-md font-code-mono text-label-md text-outline whitespace-nowrap">Dzisiaj 13:40</td>
                      <td className="py-3 px-space-md text-on-surface font-medium">Terminal POS Sklep Białko &amp; Suplementy</td>
                      <td className="py-3 px-space-md whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary font-code-mono text-label-sm">
                          Potrzeby (Needs)
                        </span>
                      </td>
                      <td className="py-3 px-space-md text-on-surface-variant font-code-mono text-label-sm">Karta mBank</td>
                      <td className="py-3 px-space-md text-right font-code-mono font-semibold text-error whitespace-nowrap">-148,00 PLN</td>
                    </tr>
                    <tr className="hover:bg-surface-container transition-colors group">
                      <td className="py-3 px-space-md font-code-mono text-label-md text-outline whitespace-nowrap">Dzisiaj 09:15</td>
                      <td className="py-3 px-space-md text-on-surface font-medium">Subskrypcja API Groq LPU Cloud</td>
                      <td className="py-3 px-space-md whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-code-mono text-label-sm">
                          Zachcianki / IT
                        </span>
                      </td>
                      <td className="py-3 px-space-md text-on-surface-variant font-code-mono text-label-sm">Karta Wirtualna</td>
                      <td className="py-3 px-space-md text-right font-code-mono font-semibold text-error whitespace-nowrap">-64,20 PLN</td>
                    </tr>
                    <tr className="hover:bg-surface-container transition-colors group">
                      <td className="py-3 px-space-md font-code-mono text-label-md text-outline whitespace-nowrap">Wczoraj 18:22</td>
                      <td className="py-3 px-space-md text-on-surface font-medium">Przelew Przychodzący - Wynagrodzenie / Stypendium</td>
                      <td className="py-3 px-space-md whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/20 text-primary font-code-mono text-label-sm font-semibold">
                          Przychód Baza
                        </span>
                      </td>
                      <td className="py-3 px-space-md text-on-surface-variant font-code-mono text-label-sm">Zaksięgowano</td>
                      <td className="py-3 px-space-md text-right font-code-mono font-semibold text-primary whitespace-nowrap">+2 400,00 PLN</td>
                    </tr>
                    <tr className="hover:bg-surface-container transition-colors group">
                      <td className="py-3 px-space-md font-code-mono text-label-md text-outline whitespace-nowrap">14 Paź 12:10</td>
                      <td className="py-3 px-space-md text-on-surface font-medium">Sprzęt Warsztatowy: Hantle hex 20kg na strych</td>
                      <td className="py-3 px-space-md whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-code-mono text-label-sm">
                          Zachcianki
                        </span>
                      </td>
                      <td className="py-3 px-space-md text-outline font-code-mono text-label-sm flex items-center gap-1 mt-1">
                        <span className="material-symbols-outlined text-[14px] text-primary">bolt</span> Pushbullet Auto-Log
                      </td>
                      <td className="py-3 px-space-md text-right font-code-mono font-semibold text-error whitespace-nowrap">-220,00 PLN</td>
                    </tr>
                  </>
                ) : (
                  filteredFinances.map((item, idx) => {
                    const isIncome = item.type === 'income';
                    const isTransfer = item.type === 'transfer';
                    const bucketLabel = item.bucket === 'needs' ? 'Potrzeby (Needs)' : item.bucket === 'wants' ? 'Zachcianki (Wants)' : item.bucket === 'savings' ? 'Oszczędności (Savings)' : 'Transfer';
                    
                    return (
                      <tr key={item.id || idx} className="hover:bg-surface-container transition-colors group">
                        <td className="py-3 px-space-md font-code-mono text-label-md text-outline whitespace-nowrap">
                          {item.transaction_date || '—'}
                        </td>
                        <td className="py-3 px-space-md text-on-surface font-medium">
                          {item.description || item.category || 'Transakcja'}
                        </td>
                        <td className="py-3 px-space-md whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-code-mono text-label-sm ${
                            item.bucket === 'needs' ? 'bg-primary/10 text-primary' :
                            item.bucket === 'wants' ? 'bg-secondary/10 text-secondary' :
                            'bg-tertiary/10 text-tertiary'
                          }`}>
                            {bucketLabel}
                          </span>
                        </td>
                        <td className="py-3 px-space-md text-on-surface-variant font-code-mono text-label-sm">
                          {item.source === 'pushbullet' ? (
                            <span className="text-primary flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">bolt</span> Pushbullet
                            </span>
                          ) : (
                            item.category || 'Ręczny wpis'
                          )}
                        </td>
                        <td className="py-3 px-space-md text-right font-code-mono font-semibold whitespace-nowrap">
                          <span className={isIncome ? 'text-primary' : isTransfer ? 'text-secondary' : 'text-error'}>
                            {isIncome ? '+' : '-'}{Math.abs(item.amount).toFixed(2)} PLN
                          </span>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="ml-2 text-outline hover:text-error opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Usuń wpis"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Szybki Transfer Między Koszykami (4 Cols) */}
        <div className="xl:col-span-4 rounded-xl bg-surface-container-low p-space-lg space-y-space-md shadow-sm border border-outline-variant/20" id="transfer-widget">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-secondary text-[20px]">swap_horiz</span>
              <h3 className="font-headline-md text-headline-md font-semibold text-on-surface">
                Szybki Transfer
              </h3>
            </div>
            <span className="font-code-mono text-label-sm text-primary">WAL Sync</span>
          </div>

          <p className="font-body-md text-body-md text-outline">
            Płynne przesunięcie alokacji między koszykami bez naruszania bilansu całkowitego.
          </p>

          <form onSubmit={handleTransferSubmit} className="space-y-space-sm">
            {/* Koszyk źródłowy */}
            <div className="space-y-1">
              <label className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Koszyk Źródłowy</label>
              <div className="relative">
                <select
                  value={transferData.fromBucket}
                  onChange={(e) => setTransferData({ ...transferData, fromBucket: e.target.value })}
                  className="w-full bg-surface-container text-on-surface px-space-md py-2 rounded-lg font-body-md appearance-none focus:outline-none focus:bg-surface-container-high transition-colors border border-outline-variant/30"
                >
                  <option value="wants">Zachcianki (Wants)</option>
                  <option value="needs">Konieczności (Needs)</option>
                  <option value="savings">Oszczędności (Savings)</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-2.5 pointer-events-none text-outline text-[18px]">
                  expand_more
                </span>
              </div>
            </div>

            {/* Ikona relacji */}
            <div className="flex justify-center -my-1">
              <div className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-outline">
                <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
              </div>
            </div>

            {/* Koszyk docelowy */}
            <div className="space-y-1">
              <label className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Koszyk Docelowy</label>
              <div className="relative">
                <select
                  value={transferData.toBucket}
                  onChange={(e) => setTransferData({ ...transferData, toBucket: e.target.value })}
                  className="w-full bg-surface-container text-on-surface px-space-md py-2 rounded-lg font-body-md appearance-none focus:outline-none focus:bg-surface-container-high transition-colors border border-outline-variant/30"
                >
                  <option value="needs">Konieczności (Needs - Potrzebne zasilenie)</option>
                  <option value="savings">Oszczędności (Savings - Nadwyżka)</option>
                  <option value="wants">Zachcianki (Wants)</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-2.5 pointer-events-none text-outline text-[18px]">
                  expand_more
                </span>
              </div>
            </div>

            {/* Kwota transferu */}
            <div className="space-y-1">
              <label className="font-label-sm text-label-sm uppercase tracking-wider text-outline">Kwota Transferu (PLN)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="np. 200.00"
                value={transferData.amount}
                onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                required
                className="w-full bg-surface-container text-on-surface px-space-md py-2 rounded-lg font-code-mono focus:outline-none focus:bg-surface-container-high transition-colors border border-outline-variant/30"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2.5 px-space-md rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-md text-label-md font-semibold transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-space-xs"
            >
              <span className="material-symbols-outlined text-primary text-[18px]">bolt</span>
              <span>Wykonaj Transfer w WAL</span>
            </button>
          </form>
        </div>

      </div>

      {/* MODAL: DODAJ TRANSAKCJĘ */}
      {showModal === 'transaction' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-space-md border-b border-outline-variant/20 bg-surface-container flex items-center justify-between">
              <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
                Rejestracja Transakcji
              </h3>
              <button onClick={() => setShowModal(false)} className="text-outline hover:text-on-surface">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-space-lg space-y-space-md">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'expense' })}
                  className={`flex-1 py-2 rounded-lg font-label-md ${formData.type === 'expense' ? 'bg-tertiary text-on-tertiary font-bold' : 'bg-surface-container text-outline'}`}
                >
                  Wydatek
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'income' })}
                  className={`flex-1 py-2 rounded-lg font-label-md ${formData.type === 'income' ? 'bg-primary text-on-primary font-bold' : 'bg-surface-container text-outline'}`}
                >
                  Wpływ
                </button>
              </div>

              <div>
                <label className="font-label-sm text-outline uppercase tracking-wider block mb-1">Kwota (PLN)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full bg-surface-container px-space-md py-2 rounded-lg font-code-mono text-on-surface border border-outline-variant/30"
                />
              </div>

              {formData.type === 'expense' && (
                <div>
                  <label className="font-label-sm text-outline uppercase tracking-wider block mb-1">Koperta / Koszyk</label>
                  <select
                    value={formData.bucket}
                    onChange={(e) => setFormData({ ...formData, bucket: e.target.value })}
                    className="w-full bg-surface-container px-space-md py-2 rounded-lg font-body-md text-on-surface border border-outline-variant/30"
                  >
                    <option value="needs">Konieczności (Needs 50%)</option>
                    <option value="wants">Zachcianki (Wants 30%)</option>
                    <option value="savings">Oszczędności (Savings 20%)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="font-label-sm text-outline uppercase tracking-wider block mb-1">Opis transakcji</label>
                <input
                  type="text"
                  placeholder="np. Zakupy Biedronka"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-surface-container px-space-md py-2 rounded-lg font-body-md text-on-surface border border-outline-variant/30"
                />
              </div>

              <div>
                <label className="font-label-sm text-outline uppercase tracking-wider block mb-1">Data</label>
                <input
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                  className="w-full bg-surface-container px-space-md py-2 rounded-lg font-code-mono text-on-surface border border-outline-variant/30"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface font-label-md"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-space-md py-2 rounded-lg bg-primary text-on-primary font-label-md font-semibold"
                >
                  Zapisz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: USTAWIENIA PROPORCJI 50/30/20 */}
      {showModal === 'settings' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-space-md border-b border-outline-variant/20 bg-surface-container flex items-center justify-between">
              <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
                Ustawienia Budżetu 50/30/20
              </h3>
              <button onClick={() => setShowModal(false)} className="text-outline hover:text-on-surface">✕</button>
            </div>
            <form onSubmit={handleSetupSubmit} className="p-space-lg space-y-space-md">
              <div>
                <label className="font-label-sm text-outline uppercase tracking-wider block mb-1">Prognozowany Dochód Miesięczny (PLN)</label>
                <input
                  type="number"
                  value={setupData.monthly_income}
                  onChange={(e) => setSetupData({ ...setupData, monthly_income: e.target.value })}
                  className="w-full bg-surface-container px-space-md py-2 rounded-lg font-code-mono text-on-surface border border-outline-variant/30"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-label-sm text-outline uppercase tracking-wider block mb-1">Needs (%)</label>
                  <input
                    type="number"
                    value={setupData.needs_percent}
                    onChange={(e) => setSetupData({ ...setupData, needs_percent: e.target.value })}
                    className="w-full bg-surface-container px-space-sm py-2 rounded-lg font-code-mono text-on-surface border border-outline-variant/30"
                  />
                </div>
                <div>
                  <label className="font-label-sm text-outline uppercase tracking-wider block mb-1">Wants (%)</label>
                  <input
                    type="number"
                    value={setupData.wants_percent}
                    onChange={(e) => setSetupData({ ...setupData, wants_percent: e.target.value })}
                    className="w-full bg-surface-container px-space-sm py-2 rounded-lg font-code-mono text-on-surface border border-outline-variant/30"
                  />
                </div>
                <div>
                  <label className="font-label-sm text-outline uppercase tracking-wider block mb-1">Savings (%)</label>
                  <input
                    type="number"
                    value={setupData.savings_percent}
                    onChange={(e) => setSetupData({ ...setupData, savings_percent: e.target.value })}
                    className="w-full bg-surface-container px-space-sm py-2 rounded-lg font-code-mono text-on-surface border border-outline-variant/30"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface font-label-md"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-space-md py-2 rounded-lg bg-primary text-on-primary font-label-md font-semibold"
                >
                  Zastosuj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXPORT MODAL */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        finances={finances}
        tasks={[]}
        workouts={[]}
        timetable={[]}
      />

    </div>
  );
};

export default FinancePage;
