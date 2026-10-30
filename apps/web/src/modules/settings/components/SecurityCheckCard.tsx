import React from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Badge } from '../../../components/ui/Badge';
import { ShieldCheck, Lock, Server, Key } from 'lucide-react';

export const SecurityCheckCard: React.FC = () => {
  const securityItems = [
    {
      title: 'Polityka CSP Level 3',
      desc: 'Blokada eval(), inline scripts, strict nonce w nagłówkach HTTP',
      status: 'Aktywna',
      icon: ShieldCheck,
      variant: 'success' as const
    },
    {
      title: 'Autoryzacja Google Identity',
      desc: 'OAuth 2.0 PKCE / JWT token z rotacją co 15 minut',
      status: 'Bezpieczna',
      icon: Lock,
      variant: 'success' as const
    },
    {
      title: 'Eliminacja Wildcard CORS (*)',
      desc: 'Restrykcyjne origin whitelisting: wyłącznie zweryfikowane domeny',
      status: 'Wymuszone',
      icon: Key,
      variant: 'success' as const
    },
    {
      title: 'Konteneryzacja Docker LXC',
      desc: 'Izolacja procesów backendu i bazy SQLite na serwerze Mikr.us',
      status: 'Zabezpieczone',
      icon: Server,
      variant: 'success' as const
    }
  ];

  return (
    <GlassCard className="p-4 sm:p-5" glow="sky">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="w-5 h-5 text-sky-600" />
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Audyt Architektury Zero-Trust
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Weryfikacja wytycznych przeciwko podatnościom Vibe Codingu
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {securityItems.map((item, idx) => (
          <div
            key={idx}
            className="p-3 rounded-2xl bg-white/70 border border-slate-200/80 flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-700">
                <item.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">{item.title}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{item.desc}</p>
              </div>
            </div>
            <Badge variant={item.variant}>{item.status}</Badge>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};
