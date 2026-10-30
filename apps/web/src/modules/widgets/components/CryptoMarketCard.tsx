import React, { useState } from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Coins, ArrowUpRight, ArrowDownRight, RefreshCw, Calculator } from 'lucide-react';

interface AssetQuote {
  symbol: string;
  name: string;
  pricePln: number;
  priceUsd: number;
  change24h: number;
  sparkline: number[];
}

const INITIAL_CRYPTO: AssetQuote[] = [
  { symbol: 'BTC', name: 'Bitcoin', pricePln: 382450, priceUsd: 96120, change24h: 3.42, sparkline: [40, 55, 52, 68, 74, 82, 90] },
  { symbol: 'ETH', name: 'Ethereum', pricePln: 13850, priceUsd: 3480, change24h: 1.85, sparkline: [30, 42, 40, 50, 48, 58, 62] },
  { symbol: 'SOL', name: 'Solana', pricePln: 792, priceUsd: 198, change24h: -1.15, sparkline: [70, 68, 62, 58, 65, 61, 59] }
];

export const CryptoMarketCard: React.FC = () => {
  const [assets, setAssets] = useState<AssetQuote[]>(INITIAL_CRYPTO);
  const [calcUsd, setCalcUsd] = useState('100');
  const usdRate = 3.98;

  const handleRefresh = () => {
    setAssets((prev) =>
      prev.map((a) => ({
        ...a,
        change24h: parseFloat((a.change24h + (Math.random() * 0.4 - 0.2)).toFixed(2))
      }))
    );
  };

  const calculatedPln = (parseFloat(calcUsd) || 0) * usdRate;

  return (
    <GlassCard className="p-4 sm:p-5" glow="amber">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-700 border border-amber-200 shadow-sm">
            <Coins className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Rynek Krypto & Walut (FX)</h3>
            <p className="text-xs text-slate-500 font-medium">Notowania aktywów cyfrowych i kursy NBP</p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 bg-white/80 transition"
          title="Odśwież notowania"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Crypto Rows */}
      <div className="space-y-2 mb-4">
        {assets.map((asset) => {
          const isUp = asset.change24h >= 0;
          return (
            <div
              key={asset.symbol}
              className="p-2.5 rounded-xl bg-white/80 border border-slate-200 flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 font-mono font-bold text-xs flex items-center justify-center text-slate-800">
                  {asset.symbol}
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-900 leading-tight">{asset.name}</div>
                  <div className="text-[10px] font-mono text-slate-400">${asset.priceUsd.toLocaleString()}</div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-black font-mono text-slate-900">
                  {asset.pricePln.toLocaleString('pl-PL')} zł
                </div>
                <div
                  className={`text-[10px] font-mono font-bold flex items-center justify-end gap-0.5 ${
                    isUp ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  <span>{isUp ? '+' : ''}{asset.change24h}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FX Rates & Quick Converter */}
      <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-600 font-semibold">
          <span>USD/PLN: 3.98 zł</span>
          <span>EUR/PLN: 4.28 zł</span>
          <span>GBP/PLN: 5.12 zł</span>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-slate-200/80">
          <Calculator className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="number"
            value={calcUsd}
            onChange={(e) => setCalcUsd(e.target.value)}
            className="w-16 px-1.5 py-0.5 text-xs font-mono font-bold rounded border border-slate-300 bg-white"
            placeholder="USD"
          />
          <span className="text-xs text-slate-500 font-medium font-mono">USD =</span>
          <span className="text-xs font-bold font-mono text-slate-900">
            {calculatedPln.toFixed(2)} PLN
          </span>
        </div>
      </div>
    </GlassCard>
  );
};
