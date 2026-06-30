import React, { useState } from 'react';
import axios from 'axios';
import { Key, Shield, Zap, Lock, Cpu, Rocket, Bell } from 'lucide-react';

const ApiConfigScreen = ({ missingKeys, onConfigured }) => {
  const [keys, setKeys] = useState({ groq: '', brave: '', pushbullet: '', pin: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setKeys({ ...keys, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post('/api/system/keys', keys);
      setTimeout(() => {
        window.location.href = '/'; 
      }, 500);
    } catch (err) {
      setError('Wystąpił błąd podczas zapisu kluczy API.');
      setLoading(false);
    }
  };

  const isLight = document.documentElement.classList.contains('theme-light');

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden text-textPrimary font-sans transition-colors duration-500"
      style={{ backgroundColor: isLight ? '#F3F4F6' : '#0A0B0E' }}
    >
      {/* Dynamic Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-accentPrimary/10 rounded-full blur-[140px] mix-blend-screen animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-accentSecondary/10 rounded-full blur-[160px] mix-blend-screen opacity-40 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none"></div>
      
      <div className="relative w-full max-w-2xl px-6 z-10 animate-fade-in-up">
        
        <div className="mb-10 text-center flex flex-col items-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-accentPrimary/10 border border-accentPrimary/30 mb-6 shadow-[0_0_40px_rgba(var(--color-accent-primary),0.15)] relative">
            <div className="absolute inset-0 rounded-3xl border border-accentPrimary/50 shadow-[inset_0_0_20px_rgba(var(--color-accent-primary),0.2)]"></div>
            <Cpu className="w-10 h-10 text-accentPrimary" strokeWidth={1.5} />
          </div>
          <h1 className="text-4xl md:text-5xl font-mono font-bold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-br from-textPrimary to-textMuted">
            Inicjalizacja <span className="text-accentPrimary">Systemu</span>
          </h1>
          <p className="text-textMuted text-sm md:text-base max-w-md mx-auto leading-relaxed">
            Wykryto brakujące parametry autoryzacyjne. Wprowadź bezpieczne klucze dostępowe, aby aktywować pełnię możliwości System.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="relative space-y-6 bg-surface backdrop-blur-3xl border border-border p-8 md:p-10 rounded-[2rem] shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-textPrimary/5 to-transparent opacity-50 pointer-events-none"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            {missingKeys.includes('GROQ_API_KEY') && (
              <div className="group">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-textMuted group-focus-within:text-accentPrimary transition-colors">
                    <Zap className="w-4 h-4" /> Groq API Key (LLM)
                  </label>
                  <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-[10px] text-accentPrimary hover:underline opacity-80 hover:opacity-100 font-mono">Jak zdobyć?</a>
                </div>
                <div className="relative">
                  <input type="password" name="groq" value={keys.groq} onChange={handleChange} placeholder="gsk_..." required className="w-full bg-surface border border-border rounded-2xl pl-4 pr-10 py-3.5 focus:outline-none focus:border-accentPrimary focus:ring-1 focus:ring-accentPrimary focus:bg-surface/80 text-textPrimary font-mono placeholder:text-textMuted transition-all shadow-inner" />
                  <Key className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted/50 group-focus-within:text-accentPrimary/50 transition-colors" />
                </div>
              </div>
            )}
            
            {missingKeys.includes('BRAVE_SEARCH_API_KEY') && (
              <div className="group">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-textMuted group-focus-within:text-accentPrimary transition-colors">
                    <Rocket className="w-4 h-4" /> Brave Search API
                  </label>
                  <a href="https://brave.com/search/api/" target="_blank" rel="noopener noreferrer" className="text-[10px] text-accentPrimary hover:underline opacity-80 hover:opacity-100 font-mono">Jak zdobyć?</a>
                </div>
                <div className="relative">
                  <input type="password" name="brave" value={keys.brave} onChange={handleChange} placeholder="BSA... (Opcjonalne)" className="w-full bg-surface border border-border rounded-2xl pl-4 pr-10 py-3.5 focus:outline-none focus:border-accentPrimary focus:ring-1 focus:ring-accentPrimary focus:bg-surface/80 text-textPrimary font-mono placeholder:text-textMuted transition-all shadow-inner" />
                  <Key className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted/50 group-focus-within:text-accentPrimary/50 transition-colors" />
                </div>
              </div>
            )}

            {missingKeys.includes('PUSHBULLET_API_KEY') && (
              <div className="group">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-textMuted group-focus-within:text-accentPrimary transition-colors">
                    <Bell className="w-4 h-4" /> Pushbullet API
                  </label>
                  <a href="https://www.pushbullet.com/#settings/account" target="_blank" rel="noopener noreferrer" className="text-[10px] text-accentPrimary hover:underline opacity-80 hover:opacity-100 font-mono">Jak zdobyć?</a>
                </div>
                <div className="relative">
                  <input type="password" name="pushbullet" value={keys.pushbullet} onChange={handleChange} placeholder="o.xyz... (Opcjonalne)" className="w-full bg-surface border border-border rounded-2xl pl-4 pr-10 py-3.5 focus:outline-none focus:border-accentPrimary focus:ring-1 focus:ring-accentPrimary focus:bg-surface/80 text-textPrimary font-mono placeholder:text-textMuted transition-all shadow-inner" />
                  <Key className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted/50 group-focus-within:text-accentPrimary/50 transition-colors" />
                </div>
              </div>
            )}

            {missingKeys.includes('DASHBOARD_PIN') && (
              <div className="group md:col-span-2 mt-2 pt-6 border-t border-border">
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-2 text-textMuted group-focus-within:text-red-500 transition-colors">
                  <Shield className="w-4 h-4" /> Ustaw Kod PIN Autoryzacji
                </label>
                <div className="relative">
                  <input type="password" name="pin" value={keys.pin} onChange={handleChange} placeholder="Twój nowy tajny PIN do systemu" required className="w-full bg-red-500/5 border border-red-500/20 rounded-2xl pl-4 pr-10 py-4 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:bg-red-500/10 text-textPrimary font-mono placeholder:text-textMuted transition-all shadow-inner text-lg" />
                  <Lock className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500/50" />
                </div>
                <p className="text-xs text-red-500/60 mt-2 ml-1">Ten PIN będzie zabezpieczał dostęp do całego systemu System.</p>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm font-mono flex items-center gap-3">
              <Shield className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-border relative z-10">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full overflow-hidden rounded-2xl font-bold tracking-wider uppercase text-sm disabled:opacity-50 transition-all shadow-[0_0_40px_rgba(var(--color-accent-primary),0.2)] hover:shadow-[0_0_60px_rgba(var(--color-accent-primary),0.4)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-accentPrimary to-accentSecondary transition-transform duration-500 group-hover:scale-110"></div>
              <div className="relative px-8 py-4.5 text-black flex items-center justify-center gap-2">
                {loading ? 'Szyfrowanie...' : 'Inicjalizuj System'}
              </div>
            </button>
          </div>
        </form>
        
        <p className="text-center text-textMuted text-[10px] mt-8 font-mono opacity-50 uppercase tracking-widest">
          Secure Protocol Activated // Local Encryption Only
        </p>
      </div>
    </div>
  );
};

export default ApiConfigScreen;
