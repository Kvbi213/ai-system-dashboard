import React, { useState, useEffect } from 'react';
import { Mic, MicOff, AlertCircle, X, Sparkles, RefreshCw, Terminal, CheckCircle2 } from 'lucide-react';
import { wakeWordService } from '../services/wakeWordService';

export default function VoiceInspectorHUD() {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem('system_voice_debug_visible') === 'true';
  });

  const [status, setStatus] = useState(() => wakeWordService.status);
  const [latestSpeech, setLatestSpeech] = useState('');
  const [latestMatched, setLatestMatched] = useState(false);
  const [isFinal, setIsFinal] = useState(false);
  const [speechCount, setSpeechCount] = useState(0);

  useEffect(() => {
    const handleToggle = (e) => {
      setIsVisible(Boolean(e.detail?.visible));
    };

    const handleSpeech = (e) => {
      if (e.detail) {
        setLatestSpeech(e.detail.text || '');
        setLatestMatched(Boolean(e.detail.matched));
        setIsFinal(Boolean(e.detail.isFinal));
        setSpeechCount(prev => prev + 1);
      }
    };

    const handleStatus = (e) => {
      if (e.detail?.status) {
        setStatus(e.detail.status);
      }
    };

    window.addEventListener('toggleVoiceInspector', handleToggle);
    window.addEventListener('omniSpeechHeard', handleSpeech);
    window.addEventListener('wakeWordStatusChanged', handleStatus);

    return () => {
      window.removeEventListener('toggleVoiceInspector', handleToggle);
      window.removeEventListener('omniSpeechHeard', handleSpeech);
      window.removeEventListener('wakeWordStatusChanged', handleStatus);
    };
  }, []);

  if (!isVisible) return null;

  const isListening = status === 'listening';
  const isPermDenied = status === 'permission-denied';

  return (
    <aside 
      aria-label="Podgląd stanu nasłuchu OmniVoice"
      className="fixed bottom-4 right-4 z-50 max-w-sm w-[calc(100vw-2rem)] glass-panel border border-accentPrimary/40 rounded-2xl p-3.5 bg-black/85 backdrop-blur-xl shadow-[0_0_25px_rgba(var(--color-accent-primary),0.25)] text-textPrimary animate-fade-in font-mono"
    >
      {/* NAGŁÓWEK */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            {isListening && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accentPrimary opacity-75" />
            )}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${
              isListening ? 'bg-accentPrimary' : isPermDenied ? 'bg-red-500' : 'bg-amber-400'
            }`} />
          </span>
          <span className="text-xs font-bold tracking-wider uppercase text-accentPrimary">
            OmniVoice Live HUD
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-textMuted font-mono">
            DevTools
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsVisible(false);
            localStorage.setItem('system_voice_debug_visible', 'false');
          }}
          className="text-textMuted hover:text-textPrimary p-1 rounded-lg hover:bg-white/10 transition-colors"
          title="Zamknij podgląd"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* STATUS MIKROFONU */}
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between text-[11px] text-textMuted">
          <span>Status mikrofonu:</span>
          <span className={`font-bold uppercase ${
            isListening ? 'text-accentPrimary' : isPermDenied ? 'text-red-400' : 'text-amber-400'
          }`}>
            {isListening ? '● Nasłuchuje (Słucham)' : isPermDenied ? '❌ Zablokowany' : `● ${status}`}
          </span>
        </div>

        {/* PODGLĄD CO MIKROFON SŁYSZY NA ŻYWO */}
        <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 min-h-[52px] flex flex-col justify-center">
          <div className="text-[10px] text-textMuted flex items-center justify-between mb-1">
            <span className="flex items-center gap-1">
              <Mic className={`w-3 h-3 ${isListening ? 'text-accentPrimary animate-pulse' : 'text-textMuted'}`} />
              Co słyszy mikrofon w tle:
            </span>
            {speechCount > 0 && <span className="text-[9px] opacity-60">#{speechCount}</span>}
          </div>

          {latestSpeech ? (
            <p className={`text-xs leading-relaxed break-words font-sans italic ${
              latestMatched ? 'text-accentPrimary font-bold not-italic' : 'text-textPrimary'
            }`}>
              "{latestSpeech}" {latestMatched && '🎯 (WYWOŁANIE!)'}
            </p>
          ) : (
            <p className="text-[11px] text-textMuted/70 italic">
              (Cisza... powiedz spokojnie "Hej Omni")
            </p>
          )}
        </div>

        {/* OSTRZEŻENIE O UPRAWNIENIACH */}
        {isPermDenied && (
          <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-[11px] text-red-300 flex items-start gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <div>
              <p className="font-bold">Brak uprawnień do mikrofonu!</p>
              <p className="text-[10px] opacity-85">Kliknij kłódkę w pasku adresu i zezwól na mikrofon.</p>
            </div>
          </div>
        )}

        {/* PRZYCISKI DIAGNOSTYCZNE */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              if (window.__OMNI_VOICE__) {
                window.__OMNI_VOICE__.testWakeWord('hej omni');
              }
            }}
            className="flex-1 py-1.5 px-2 rounded-lg bg-accentPrimary/20 hover:bg-accentPrimary/30 border border-accentPrimary/40 text-accentPrimary font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" /> Test "Hej Omni"
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.__OMNI_VOICE__) {
                window.__OMNI_VOICE__.restart();
              }
            }}
            className="py-1.5 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-textMuted hover:text-textPrimary text-[11px] flex items-center justify-center gap-1 transition-colors"
            title="Restartuj mikrofon"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
