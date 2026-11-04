import React, { useState, useEffect } from 'react';
import { Lock, Delete } from 'lucide-react';

interface LockScreenOverlayProps {
  onUnlock: () => void;
}

export const LockScreenOverlay: React.FC<LockScreenOverlayProps> = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const expectedPin = localStorage.getItem('omnidash_system_pin') || '2137';

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);

      if (nextPin.length === 4) {
        if (nextPin === expectedPin) {
          setTimeout(() => {
            onUnlock();
          }, 150);
        } else {
          setError(true);
          setTimeout(() => {
            setPin('');
            setError(false);
          }, 600);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-[#070b12]/95 backdrop-blur-2xl text-slate-100 select-none animate-in fade-in duration-300">
      {/* Brand & Status */}
      <div className="flex flex-col items-center space-y-2 mb-8 text-center">
        <div className="p-3.5 rounded-3xl bg-sky-500/10 border border-sky-500/20 text-sky-400 shadow-xl shadow-sky-500/10">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-white">OmniDash Zero-Trust Guard</h2>
        <p className="text-xs text-slate-400 font-medium">System zablokowany. Wprowadź 4-cyfrowy kod PIN</p>
      </div>

      {/* PIN Dots */}
      <div className={`flex items-center gap-4 mb-8 ${error ? 'animate-bounce text-rose-500' : ''}`}>
        {[0, 1, 2, 3].map((idx) => {
          const isFilled = pin.length > idx;
          return (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                isFilled
                  ? error
                    ? 'bg-rose-500 border-rose-500 scale-110 shadow-lg shadow-rose-500/30'
                    : 'bg-sky-400 border-sky-400 scale-110 shadow-lg shadow-sky-400/30'
                  : 'bg-slate-900 border-slate-700'
              }`}
            />
          );
        })}
      </div>

      {error && (
        <p className="text-xs font-bold text-rose-400 mb-4 animate-in fade-in">
          Nieprawidłowy kod PIN. Spróbuj ponownie.
        </p>
      )}

      {/* Numeric Keypad */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-[260px]">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            onClick={() => handleDigit(digit)}
            className="h-16 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-lg font-bold font-mono text-white active:scale-95 transition shadow-sm flex items-center justify-center"
          >
            {digit}
          </button>
        ))}

        <div />

        <button
          onClick={() => handleDigit('0')}
          className="h-16 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-lg font-bold font-mono text-white active:scale-95 transition shadow-sm flex items-center justify-center"
        >
          0
        </button>

        <button
          onClick={handleBackspace}
          className="h-16 rounded-2xl bg-slate-900/50 hover:bg-slate-800/80 border border-slate-800 text-slate-400 hover:text-white active:scale-95 transition flex items-center justify-center"
        >
          <Delete className="w-5 h-5" />
        </button>
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center text-[10px] text-slate-500 font-mono">
        KOD DOMYŚLNY: 2137 :: SZYFROWANIE AES-256
      </div>
    </div>
  );
};
