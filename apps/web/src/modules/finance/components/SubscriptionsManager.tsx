import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Badge } from '../../../components/ui/Badge';
import { CreditCard, Calendar, Server, Plus, Trash2 } from 'lucide-react';

export interface SubscriptionItem {
  id: string;
  name: string;
  category: string;
  costPln: number;
  renewalDay: number;
  status: 'active' | 'paused';
}

const STORAGE_KEY = 'omnidash_finance_subscriptions';

const DEFAULT_SUBS: SubscriptionItem[] = [
  { id: 's1', name: 'Hosting Chmurowy VPS (LXC)', category: 'Infrastruktura', costPln: 65.0, renewalDay: 28, status: 'active' },
  { id: 's2', name: 'Bilet Okresowy / Transport', category: 'Mobilność', costPln: 160.0, renewalDay: 1, status: 'active' },
  { id: 's3', name: 'Narzędzia Asystenta Dev / AI', category: 'Narzędzia IT', costPln: 45.0, renewalDay: 15, status: 'active' },
  { id: 's4', name: 'Łącze Światłowodowe / Internet', category: 'Rachunki Stałe', costPln: 79.0, renewalDay: 10, status: 'active' }
];

export const SubscriptionsManager: React.FC = () => {
  const [subs, setSubs] = useState<SubscriptionItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_SUBS;
    } catch {
      return DEFAULT_SUBS;
    }
  });

  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [category, setCategory] = useState('Narzędzia');
  const [renewalDay, setRenewalDay] = useState('1');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subs));
  }, [subs]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !cost) return;
    const item: SubscriptionItem = {
      id: Date.now().toString(),
      name: name.trim(),
      category,
      costPln: Math.abs(parseFloat(cost)) || 0,
      renewalDay: parseInt(renewalDay, 10) || 1,
      status: 'active'
    };
    setSubs([...subs, item]);
    setName('');
    setCost('');
    setIsAdding(false);
  };

  const handleToggle = (id: string) => {
    setSubs((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: s.status === 'active' ? 'paused' : 'active' } : s))
    );
  };

  const handleDelete = (id: string) => {
    setSubs(subs.filter((s) => s.id !== id));
  };

  const totalBurn = subs
    .filter((s) => s.status === 'active')
    .reduce((acc, sub) => acc + sub.costPln, 0);

  return (
    <GlassCard className="p-4 sm:p-5" glow="none">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 shadow-sm">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Stałe Zobowiązania i Abonamenty</h3>
            <p className="text-xs text-slate-500 font-medium">Miesięczny koszt: {totalBurn.toFixed(2)} PLN</p>
          </div>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/20 active:scale-95 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Dodaj subskrypcję</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="p-3 mb-3 rounded-xl bg-purple-50/70 border border-purple-200 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <input
              type="text"
              placeholder="Nazwa abonamentu..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="sm:col-span-2 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900"
            />
            <input
              type="number"
              placeholder="Koszt PLN..."
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900"
            >
              <option value="Infrastruktura">Infrastruktura</option>
              <option value="Narzędzia IT">Narzędzia IT</option>
              <option value="Mobilność">Mobilność</option>
              <option value="Rachunki Stałe">Rachunki Stałe</option>
              <option value="Edukacja">Edukacja</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="31"
              placeholder="Dzień odnowienia (1-31)..."
              value={renewalDay}
              onChange={(e) => setRenewalDay(e.target.value)}
              className="w-1/2 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900"
            />
            <button
              type="submit"
              className="w-1/2 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition shadow-xs"
            >
              Zapisz abonament
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2.5">
        {subs.map((sub) => {
          const isActive = sub.status === 'active';
          return (
            <div
              key={sub.id}
              className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                isActive ? 'bg-white/80 border-slate-200/90 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                  <Server className="w-4 h-4 text-purple-700" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-900">{sub.name}</p>
                    <Badge variant={isActive ? 'purple' : 'slate'}>{sub.category}</Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5 font-mono">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>Odnowienie {sub.renewalDay}. dnia miesiąca</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-slate-900">{sub.costPln.toFixed(2)} PLN</span>
                <button
                  onClick={() => handleToggle(sub.id)}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                    isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isActive ? 'Aktywny' : 'Wstrzymany'}
                </button>
                <button
                  onClick={() => handleDelete(sub.id)}
                  className="p-1 text-slate-300 hover:text-rose-500 transition"
                  title="Usuń abonament"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
};
