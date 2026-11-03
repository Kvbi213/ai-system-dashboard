import React, { useState } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/ui/PageHeader';
import { useToast } from '../../components/ui/Toast';
import { osintApi } from '../../api/client';
import { Globe, Search, ShieldCheck, Server, Lock, RefreshCw } from 'lucide-react';
import { ThreatMonitoringTimeline } from './components/ThreatMonitoringTimeline';

export const OsintPage: React.FC = () => {
  const [target, setTarget] = useState('omnidash.internal');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const [data, setData] = useState({
    target: 'omnidash.internal',
    ip: '104.21.78.192',
    asn: 'AS13335 CLOUDFLARENET',
    country: 'PL',
    dnsRecords: {
      A: ['104.21.78.192', '172.67.142.88'],
      AAAA: ['2606:4700:3033::6815:4ec0'],
      MX: ['mail.omnidash.internal (priority 10)'],
      TXT: ['v=spf1 include:_spf.google.com ~all']
    },
    ssl: {
      issuer: 'Cloudflare Inc ECC CA-3',
      validUntil: '2027-10-15',
      grade: 'A+'
    },
    threatScore: 0,
    status: 'clean'
  });

  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!target.trim()) return;

    setLoading(true);
    try {
      const res = await osintApi.lookup(target.trim());
      setData(res);
      toast.success(`Zakończono analizę OSINT dla: ${target.trim()}`);
    } catch {
      toast.error('Błąd skanowania hosta OSINT');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Unified Executive PageHeader */}
      <PageHeader
        icon={Globe}
        title="OSINT & Telemetria Sieciowa"
        subtitle="Analiza DNS, reputacja IP, certyfikaty SSL i tarcza prewencji SSRF"
        badge="Zero-Trust"
        badgeVariant="rose"
        onRefresh={() => handleLookup()}
        isRefreshing={loading}
        refreshLabel="Ponów skan"
      />

      {/* Search Input Bar with Dark Mode Support */}
      <GlassCard className="p-3 sm:p-4" glow="sky">
        <form onSubmit={handleLookup} className="flex gap-2">
          <div className="relative flex-1">
            <Globe className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="Wpisz domenę, host lub adres IP do weryfikacji OSINT..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-950/50 shadow-sm font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-sky-600/20 active:scale-95 transition shrink-0"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Skanuj</span>
          </button>
        </form>
      </GlassCard>

      {/* Overview KPI Cards with Laptop Grid Balance */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl glass-panel flex items-center gap-3.5 shadow-sm border border-slate-200/80 dark:border-slate-800 h-full">
          <div className="p-2.5 rounded-xl bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 shrink-0">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Adres IPv4 / Anycast</p>
            <p className="text-sm font-bold font-mono text-slate-900 dark:text-white">{data.ip}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl glass-panel flex items-center gap-3.5 shadow-sm border border-slate-200/80 dark:border-slate-800 h-full">
          <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Threat Score</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-300">0 / 100</span>
              <Badge variant="success">Bezpieczny</Badge>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl glass-panel flex items-center gap-3.5 shadow-sm border border-slate-200/80 dark:border-slate-800 h-full">
          <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Certyfikat SSL / TLS</p>
            <p className="text-sm font-bold font-mono text-purple-800 dark:text-purple-300">Klasa {data.ssl.grade} (Ważny)</p>
          </div>
        </div>
      </div>

      {/* DNS Records Grid */}
      <GlassCard className="p-4 sm:p-5" glow="none">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Rekordy Strefy DNS</h3>
          <span className="text-xs font-mono text-slate-400">ASN: {data.asn}</span>
        </div>

        <div className="space-y-2.5">
          <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-xs">
            <span className="font-bold text-sky-700 dark:text-sky-400 font-mono">Rekordy A (IPv4):</span>
            <div className="mt-1 font-mono text-slate-700 dark:text-slate-300 space-y-0.5">
              {data.dnsRecords.A.map((ip, i) => (
                <p key={i}>• {ip}</p>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-xs">
            <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">Rekordy AAAA (IPv6):</span>
            <div className="mt-1 font-mono text-slate-700 dark:text-slate-300">
              <p>• {data.dnsRecords.AAAA[0]}</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-xs">
            <span className="font-bold text-purple-700 dark:text-purple-400 font-mono">Polityka Bezpieczeństwa SPF / MX:</span>
            <div className="mt-1 font-mono text-slate-700 dark:text-slate-300 space-y-0.5">
              <p>• {data.dnsRecords.MX[0]}</p>
              <p>• {data.dnsRecords.TXT[0]}</p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Real-Time Cyber Threat Monitoring & SSRF Shield */}
      <ThreatMonitoringTimeline />
    </div>
  );
};
