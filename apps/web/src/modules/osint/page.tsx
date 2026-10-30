import React, { useState } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { osintApi } from '../../api/client';
import { Globe, Search, ShieldCheck, Server, Lock, RefreshCw } from 'lucide-react';

export const OsintPage: React.FC = () => {
  const [target, setTarget] = useState('omnidash.internal');
  const [loading, setLoading] = useState(false);
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
    } catch {
      // Keep state
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Search Input Bar */}
      <GlassCard className="p-4" glow="sky">
        <form onSubmit={handleLookup} className="flex gap-2">
          <div className="relative flex-1">
            <Globe className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="Wpisz domenę, host lub adres IP do weryfikacji OSINT..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/90 border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 shadow-sm font-mono"
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

      {/* Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl glass-panel flex items-center gap-3.5 shadow-sm">
          <div className="p-2.5 rounded-xl bg-sky-100 text-sky-700">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold">Adres IPv4 / Anycast</p>
            <p className="text-sm font-bold font-mono text-slate-900">{data.ip}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl glass-panel flex items-center gap-3.5 shadow-sm">
          <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold">Threat Score</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-sm font-bold font-mono text-emerald-700">0 / 100</span>
              <Badge variant="success">Bezpieczny</Badge>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl glass-panel flex items-center gap-3.5 shadow-sm">
          <div className="p-2.5 rounded-xl bg-purple-100 text-purple-700">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold">Certyfikat SSL / TLS</p>
            <p className="text-sm font-bold font-mono text-purple-800">Klasa {data.ssl.grade} (Ważny)</p>
          </div>
        </div>
      </div>

      {/* DNS Records Grid */}
      <GlassCard className="p-4 sm:p-5" glow="none">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">Rekordy Strefy DNS</h3>
          <span className="text-xs font-mono text-slate-400">ASN: {data.asn}</span>
        </div>

        <div className="space-y-2.5">
          <div className="p-3 rounded-xl bg-white/70 border border-slate-200/80 text-xs">
            <span className="font-bold text-sky-700 font-mono">Rekordy A (IPv4):</span>
            <div className="mt-1 font-mono text-slate-700 space-y-0.5">
              {data.dnsRecords.A.map((ip, i) => (
                <p key={i}>• {ip}</p>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/70 border border-slate-200/80 text-xs">
            <span className="font-bold text-emerald-700 font-mono">Rekordy AAAA (IPv6):</span>
            <div className="mt-1 font-mono text-slate-700">
              <p>• {data.dnsRecords.AAAA[0]}</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/70 border border-slate-200/80 text-xs">
            <span className="font-bold text-purple-700 font-mono">Polityka Bezpieczeństwa SPF / MX:</span>
            <div className="mt-1 font-mono text-slate-700 space-y-0.5">
              <p>• {data.dnsRecords.MX[0]}</p>
              <p>• {data.dnsRecords.TXT[0]}</p>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
