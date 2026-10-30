import React from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Badge } from '../../../components/ui/Badge';
import { CreditCard, Calendar, Server, Wifi, Train, Code } from 'lucide-react';

export interface SubscriptionItem {
  id: string;
  name: string;
  category: string;
  costPln: number;
  renewalDay: number;
  icon: any;
  status: 'active' | 'pending';
}

const SUBSCRIPTIONS: SubscriptionItem[] = [
  { id: 's1', name: 'Serwer VPS Mikr.us (LXC)', category: 'Infrastruktura', costPln: 65.0, renewalDay: 28, icon: Server, status: 'active' },
  { id: 's2', name: 'Bilet miesięczny PKP / Polregio', category: 'Transport ZSE', costPln: 160.0, renewalDay: 1, icon: Train, status: 'active' },
  { id: 's3', name: 'GitHub Copilot Pro', category: 'Narzędzia Dev', costPln: 45.0, renewalDay: 15, icon: Code, status: 'active' },
  { id: 's4', name: 'Światłowód Internet Domowy', category: 'Rachunki (50%)', costPln: 79.0, renewalDay: 10, icon: Wifi, status: 'active' }
];

export const SubscriptionsManager: React.FC = () => {
  const totalBurn = SUBSCRIPTIONS.reduce((acc, sub) => acc + sub.costPln, 0);

  return (
    <GlassCard className="p-4 sm:p-5" glow="none">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 shadow-sm">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Stałe Zobowiązania i Abonamenty</h3>
            <p className="text-xs text-slate-500 font-medium">Cykliczne opłaty miesięczne</p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-xs text-slate-400 font-medium">Miesięczny koszt</p>
          <p className="text-base font-bold font-mono text-purple-800">{totalBurn.toFixed(2)} PLN</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {SUBSCRIPTIONS.map((sub) => (
          <div
            key={sub.id}
            className="flex items-center justify-between p-3 rounded-2xl bg-white/70 border border-slate-200/80 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                <sub.icon className="w-4 h-4 text-purple-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-slate-900">{sub.name}</p>
                  <Badge variant="purple">{sub.category}</Badge>
                </div>
                <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>Odnowienie {sub.renewalDay} dnia miesiąca</span>
                </p>
              </div>
            </div>

            <span className="text-xs font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-sm">
              {sub.costPln.toFixed(2)} PLN/mc
            </span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};
