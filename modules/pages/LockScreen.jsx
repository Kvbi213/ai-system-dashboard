import React, { useState } from 'react';
import axios from 'axios';
import { Lock, Unlock, AlertTriangle } from 'lucide-react';

const LockScreen = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pin) return;
    setLoading(true);
    setError('');
    
    try {
      const { data } = await axios.post('/api/auth/login', { pin });
      if (data.success && data.token) {
        sessionStorage.setItem('dashboard_token', data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        onUnlock();
      }
    } catch (err) {
      setError('Nieprawidłowy kod PIN.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const isLight = document.documentElement.classList.contains('theme-light');

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden text-textPrimary font-sans transition-colors duration-500"
      style={{ backgroundColor: isLight ? '#F3F4F6' : '#0A0B0E' }}
    >
      {/* Tło - płynne animacje */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-accentPrimary/10 rounded-full blur-[140px] mix-blend-screen animate-pulse-slow pointer-events-none transition-colors duration-1000"></div>
      <div className="absolute bottom-0 right-1/4 w-[700px] h-[700px] bg-accentSecondary/10 rounded-full blur-[160px] mix-blend-screen opacity-30 animate-pulse-slow pointer-events-none transition-colors duration-1000" style={{ animationDelay: '2s' }}></div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none"></div>

      <div className="bg-surface/80 backdrop-blur-3xl border border-border rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl flex flex-col items-center relative z-10 animate-fade-in-up">
        <div className="w-16 h-16 rounded-2xl bg-accentPrimary/10 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(var(--color-accent-primary),0.2)]">
          <Lock size={28} className="text-accentPrimary" strokeWidth={1.5} />
        </div>
        
        <h2 className="text-2xl font-bold mb-2">Autoryzacja</h2>
        <p className="text-textSecondary text-center text-sm mb-8">
          Wprowadź kod dostępu, aby odblokować dashboard.
        </p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="relative">
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-center text-2xl tracking-widest focus:outline-none focus:border-accentPrimary focus:ring-1 focus:ring-accentPrimary transition-colors text-textPrimary placeholder:text-textMuted"
              autoFocus
              disabled={loading}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-2 rounded-lg">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !pin}
            className="group relative w-full overflow-hidden rounded-xl font-bold tracking-wider uppercase text-sm disabled:opacity-50 transition-all shadow-[0_0_30px_rgba(var(--color-accent-primary),0.15)] hover:shadow-[0_0_40px_rgba(var(--color-accent-primary),0.3)] mt-2"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-accentPrimary to-accentSecondary transition-transform duration-500 group-hover:scale-110"></div>
            <div className="relative px-8 py-3.5 text-black flex items-center justify-center gap-2">
              {loading ? 'Weryfikacja...' : (
                <>
                  <Unlock size={18} />
                  <span>Odblokuj</span>
                </>
              )}
            </div>
          </button>
        </form>
      </div>
    </div>
  );
};

export default LockScreen;
