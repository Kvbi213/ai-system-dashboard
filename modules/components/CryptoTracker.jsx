import React, { useState, useEffect } from 'react';
import { Bitcoin, Activity, TrendingUp, TrendingDown } from 'lucide-react';

const CryptoTracker = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCrypto = async () => {
      try {
        const symbols = '["BTCUSDT","ETHUSDT","SOLUSDT"]';
        const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=${symbols}`);
        if (!res.ok) throw new Error('Network error');
        const json = await res.json();
        
        const formatted = json.map(coin => ({
          symbol: coin.symbol.replace('USDT', ''),
          price: parseFloat(coin.lastPrice),
          change: parseFloat(coin.priceChangePercent)
        }));
        
        setData(formatted);
      } catch (err) {
        console.error('Crypto fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCrypto();
    const iv = setInterval(fetchCrypto, 10000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="glass-panel p-5 rounded-xl border border-border h-full flex flex-col relative overflow-hidden">
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-[#F7931A]/10 border border-[#F7931A]/30 flex items-center justify-center">
          <Bitcoin className="w-4 h-4 text-[#F7931A]" />
        </div>
        <div>
          <h2 className="font-mono text-sm font-bold text-accentPrimary tracking-tight">Crypto Tracker</h2>
          <p className="font-sans text-[10px] text-textMuted uppercase tracking-wider">Live Binance API</p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto">
        {loading && data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <Activity className="w-6 h-6 text-accentPrimary animate-pulse" />
          </div>
        ) : (
          data.map((coin) => (
            <div key={coin.symbol} className="flex items-center justify-between p-2 rounded-lg bg-black/20 border border-border">
              <span className="font-mono text-xs font-bold text-textPrimary">{coin.symbol}</span>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs">${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className={`font-mono text-[10px] flex items-center gap-0.5 ${coin.change >= 0 ? 'text-[#00FF66]' : 'text-[#FF3366]'}`}>
                  {coin.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(coin.change).toFixed(2)}%
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CryptoTracker;
