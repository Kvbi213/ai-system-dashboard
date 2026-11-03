import React, { useState } from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { ShieldCheck, ShieldAlert, AlertOctagon, Flame, Filter } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { useToast } from '../../../components/ui/Toast';

export interface ThreatEvent {
  id: string;
  timestamp: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  category: 'SSRF_GUARD' | 'PORT_PROBE' | 'SSL_ALERT' | 'DNS_ANOMALY';
  sourceIp: string;
  targetResource: string;
  description: string;
  actionTaken: 'BLOCKED' | 'LOGGED' | 'FLAGGED';
}

const INITIAL_THREAT_EVENTS: ThreatEvent[] = [
  {
    id: 'evt_1',
    timestamp: 'Przed chwilą',
    severity: 'CRITICAL',
    category: 'SSRF_GUARD',
    sourceIp: '192.168.1.104 (Agent Worker)',
    targetResource: 'http://169.254.169.254/latest/meta-data/',
    description: 'Tarcza SSRF zablokowała nieautoryzowane zapytanie do metadanych instancji chmurowej.',
    actionTaken: 'BLOCKED'
  },
  {
    id: 'evt_2',
    timestamp: '14 min temu',
    severity: 'WARNING',
    category: 'SSRF_GUARD',
    sourceIp: '10.0.4.12',
    targetResource: 'http://127.0.0.1:5000/api/system/reset',
    description: 'Zablokowano próbę pętli zwrotnej Loopback do endpointu administracyjnego jądra.',
    actionTaken: 'BLOCKED'
  },
  {
    id: 'evt_3',
    timestamp: '42 min temu',
    severity: 'WARNING',
    category: 'PORT_PROBE',
    sourceIp: '185.220.101.5 (Tor Exit Node)',
    targetResource: 'Port 22 (SSH)',
    description: 'Wykryto 4 pakiety SYN w odstępie 200ms na port SSH serwera Mikr.us.',
    actionTaken: 'BLOCKED'
  },
  {
    id: 'evt_4',
    timestamp: '2h temu',
    severity: 'INFO',
    category: 'SSL_ALERT',
    sourceIp: 'OmniDash Health Bot',
    targetResource: 'https://synergia.librus.pl',
    description: 'Audyt SSL: Certyfikat TLS 1.3 ECDHE-RSA-AES128-GCM-SHA256 poprawny (ważny 142 dni).',
    actionTaken: 'LOGGED'
  },
  {
    id: 'evt_5',
    timestamp: '3h temu',
    severity: 'INFO',
    category: 'DNS_ANOMALY',
    sourceIp: '1.1.1.1 (Cloudflare DoH)',
    targetResource: 'Rekordy DNS & DMARC',
    description: 'Spójność strefy DNS zweryfikowana: brak nieautoryzowanych rekordów TXT.',
    actionTaken: 'LOGGED'
  }
];

export const ThreatMonitoringTimeline: React.FC = () => {
  const [events, setEvents] = useState<ThreatEvent[]>(INITIAL_THREAT_EVENTS);
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'INFO'>('ALL');
  const toast = useToast();

  const handleSimulateAttack = () => {
    const newEvent: ThreatEvent = {
      id: `evt_${Date.now()}`,
      timestamp: 'Przed chwilą',
      severity: 'CRITICAL',
      category: 'SSRF_GUARD',
      sourceIp: '10.244.0.8 (Simulator)',
      targetResource: 'http://127.0.0.1:8080/internal/vault',
      description: 'Zablokowano próbę SSRF do prywatnej podsieci klastra.',
      actionTaken: 'BLOCKED'
    };
    setEvents([newEvent, ...events]);
    toast.error('[!] ALERT BEZPIECZEŃSTWA: Tarcza SSRF przechwyciła nieautoryzowaną próbę zapytania!');
  };

  const filteredEvents = events.filter((e) => {
    if (filter === 'ALL') return true;
    return e.severity === filter;
  });

  return (
    <GlassCard className="p-4 sm:p-5" glow="rose">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shadow-sm">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Tarcza Cyberbezpieczeństwa & Oś Incydentów (ai-threat-monitoring)
              </h3>
              <Badge variant="rose">SSRF GUARD AKTYWNY</Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Filtrowanie pętli zwrotnych 127.0.0.1, puli prywatnych RFC1918 i metadanych chmurowych
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulateAttack}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900 transition flex items-center gap-1.5 shadow-xs"
          >
            <Flame className="w-3.5 h-3.5 text-rose-500" />
            <span>Test tarczy (SSRF Probe)</span>
          </button>
        </div>
      </div>

      {/* Security Shield Status Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs font-mono">
        <div>
          <span className="text-[10px] text-slate-400 uppercase">Loopback Guard:</span>
          <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> 127.0.0.0/8 BLOCKED
          </div>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase">Prywatne podsieci:</span>
          <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> RFC1918 BLOCKED
          </div>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase">Cloud Metadata:</span>
          <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> 169.254.169.254
          </div>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase">Zablokowane ataki:</span>
          <div className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
            <AlertOctagon className="w-3.5 h-3.5" /> {events.filter((e) => e.actionTaken === 'BLOCKED').length} incydentów
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 mb-3">
        <Filter className="w-3.5 h-3.5 text-slate-400" />
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-bold">
          {(['ALL', 'CRITICAL', 'WARNING', 'INFO'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilter(lvl)}
              className={`px-2 py-0.5 rounded transition ${
                filter === lvl
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {lvl === 'ALL' ? `Wszystkie (${events.length})` : lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Events Timeline */}
      <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
        {filteredEvents.map((evt) => {
          const isCrit = evt.severity === 'CRITICAL';
          const isWarn = evt.severity === 'WARNING';

          return (
            <div
              key={evt.id}
              className={`p-3 rounded-xl border text-xs transition ${
                isCrit
                  ? 'bg-rose-50/60 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60'
                  : isWarn
                  ? 'bg-amber-50/60 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60'
                  : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <Badge variant={isCrit ? 'rose' : isWarn ? 'amber' : 'sky'}>
                    {evt.category}
                  </Badge>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {evt.targetResource}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400">
                  <span>{evt.timestamp}</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                    {evt.actionTaken}
                  </span>
                </div>
              </div>
              <div className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {evt.description}
              </div>
              <div className="mt-1 text-[10px] font-mono text-slate-400">
                Źródło: {evt.sourceIp}
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
};
