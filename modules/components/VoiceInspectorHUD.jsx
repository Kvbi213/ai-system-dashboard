import React, { useState, useEffect } from 'react';
import { Mic, MicOff, AlertCircle, X, Sparkles, RefreshCw, Terminal, CheckCircle2, Activity } from 'lucide-react';
import { wakeWordService } from '../services/wakeWordService';

export default function VoiceInspectorHUD() {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof localStorage === 'undefined') return true;
    return localStorage.getItem('system_voice_debug_visible') !== 'false';
  });

  const [status, setStatus] = useState(() => wakeWordService.status);
  const [latestSpeech, setLatestSpeech] = useState('');
  const [latestMatched, setLatestMatched] = useState(false);
  const [isFinal, setIsFinal] = useState(false);
  const [speechCount, setSpeechCount] = useState(0);
  const [micVolume, setMicVolume] = useState(0);
  const [isAiSpeaking, setIsAiSpeaking] = useState(() => Boolean(wakeWordService.isAiSpeaking));
  const [isMuted, setIsMuted] = useState(() => Boolean(wakeWordService.isManualMuted));

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

    const handleVolume = (e) => {
      if (e.detail?.volume !== undefined) {
        setMicVolume(e.detail.volume);
      }
    };

    const handleAiSpeaking = (e) => {
      setIsAiSpeaking(Boolean(e.detail?.isSpeaking));
    };

    const handleMute = (e) => {
      setIsMuted(Boolean(e.detail?.isMuted));
    };

    window.addEventListener('toggleVoiceInspector', handleToggle);
    window.addEventListener('omniSpeechHeard', handleSpeech);
    window.addEventListener('wakeWordStatusChanged', handleStatus);
    window.addEventListener('omniMicVolume', handleVolume);
    window.addEventListener('omniAiSpeaking', handleAiSpeaking);
    window.addEventListener('omniMicMuteChanged', handleMute);

    return () => {
      window.removeEventListener('toggleVoiceInspector', handleToggle);
      window.removeEventListener('omniSpeechHeard', handleSpeech);
      window.removeEventListener('wakeWordStatusChanged', handleStatus);
      window.removeEventListener('omniMicVolume', handleVolume);
      window.removeEventListener('omniAiSpeaking', handleAiSpeaking);
      window.removeEventListener('omniMicMuteChanged', handleMute);
    };
  }, []);

  const isListening = status === 'listening';
  const isPermDenied = status === 'permission-denied';

  if (!isVisible) {
    return (
      <button
        type="button"
        onClick={() => {
          setIsVisible(true);
          localStorage.setItem('system_voice_debug_visible', 'true');
        }}
        className="fixed bottom-4 right-4 z-50 p-2.5 rounded-full glass-panel border border-accentPrimary/40 bg-black/85 backdrop-blur-md shadow-[0_0_15px_rgba(var(--color-accent-primary),0.3)] text-accentPrimary hover:scale-105 transition-all flex items-center gap-2 font-mono text-xs cursor-pointer"
        title="Otwórz OmniVoice Live HUD"
      >
        <span className="relative flex h-2.5 w-2.5">
          {isListening && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accentPrimary opacity-75" />
          )}
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
            isListening ? 'bg-accentPrimary' : isPermDenied ? 'bg-red-500' : 'bg-amber-400'
          }`} />
        </span>
        <Mic className={`w-4 h-4 ${isListening ? 'text-accentPrimary' : isPermDenied ? 'text-red-400' : 'text-amber-400'}`} />
        <span className="hidden sm:inline text-[11px] font-bold">OmniVoice</span>
      </button>
    );
  }

  return (
    <aside 
      aria-label="Podgląd stanu nasłuchu OmniVoice"
      className="fixed bottom-4 right-4 z-50 max-w-sm w-[calc(100vw-2rem)] glass-panel border border-accentPrimary/40 rounded-2xl p-3.5 bg-black/90 backdrop-blur-xl shadow-[0_0_25px_rgba(var(--color-accent-primary),0.25)] text-textPrimary animate-fade-in font-mono"
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
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
            isAiSpeaking ? 'bg-red-500/20 text-red-300 border border-red-500/40 font-bold animate-pulse' : 'bg-white/10 text-textMuted'
          }`}>
            {isAiSpeaking ? '[WYCISZONY] AI MÓWI' : isListening ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsVisible(false);
            localStorage.setItem('system_voice_debug_visible', 'false');
          }}
          className="text-textMuted hover:text-textPrimary p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          title="Minimalizuj podgląd"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* STATUS MIKROFONU */}
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between text-[11px] text-textMuted">
          <span>Status mikrofonu:</span>
          <span className={`font-bold uppercase flex items-center gap-1 ${
            isMuted ? 'text-red-400' : isAiSpeaking ? 'text-amber-400' : isListening ? 'text-accentPrimary' : isPermDenied ? 'text-red-400' : 'text-amber-400'
          }`}>
            {isMuted ? (
              <>
                <MicOff className="w-3.5 h-3.5 text-red-400 animate-pulse" /> [WYCISZONY] Wyciszony (Manualnie)
              </>
            ) : isAiSpeaking ? (
              <>
                <MicOff className="w-3.5 h-3.5 animate-pulse" /> [WYCISZONY] Wyciszony (AI mówi)
              </>
            ) : isListening ? (
              '● Nasłuchuje (Słucham)'
            ) : isPermDenied ? (
              '[X] Zablokowany'
            ) : (
              `● ${status}`
            )}
          </span>
        </div>

        {/* GUZIK WYCISZ / ODCISZ MIKROFON */}
        <button
          type="button"
          onClick={() => {
            wakeWordService.toggleMute();
          }}
          className={`w-full py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 ${
            isMuted
              ? 'bg-red-500/20 hover:bg-red-500/30 border-red-500/50 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.25)] animate-pulse'
              : 'bg-white/5 hover:bg-white/10 border-white/15 text-textPrimary hover:border-accentPrimary/40'
          }`}
          title={isMuted ? "Mikrofon jest wyciszony. Kliknij, aby włączyć nasłuch" : "Wycisz mikrofon (Mute)"}
        >
          {isMuted ? (
            <>
              <MicOff className="w-4 h-4 text-red-400" /> ODCISZ MIKROFON (KLIKNIJ)
            </>
          ) : (
            <>
              <MicOff className="w-4 h-4 text-textMuted" /> WYCISZ MIKROFON (MUTE)
            </>
          )}
        </button>

        {/* PRZYCISK OD RAZU WŁĄCZAJĄCY MIKROFON JEŚLI NIE NASŁUCHUJE I NIE JEST WYCISZONY */}
        {!isListening && !isAiSpeaking && !isMuted && (
          <button
            type="button"
            onClick={async () => {
              try {
                if (window.__OMNI_VOICE__) {
                  await window.__OMNI_VOICE__.requestMic();
                } else {
                  await wakeWordService.acquireSilentAudioStream(true);
                  wakeWordService.start();
                }
              } catch (err) {
                console.error(err);
              }
            }}
            className="w-full py-2 px-3 rounded-xl bg-accentPrimary hover:bg-accentPrimary/90 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(var(--color-accent-primary),0.35)] transition-all cursor-pointer"
          >
            <Mic className="w-4 h-4 animate-pulse" /> WŁĄCZ MIKROFON (KLIKNIJ)
          </button>
        )}

        {/* WSKAŹNIK POZIOMU AUDIO (VU METER) */}
        <div 
          onClick={async () => {
            if (isAiSpeaking) return;
            if (window.__OMNI_VOICE__) {
              await window.__OMNI_VOICE__.requestMic();
            } else {
              await wakeWordService.acquireSilentAudioStream(true);
            }
          }}
          className="p-2.5 rounded-xl bg-black/60 border border-white/10 space-y-1.5 cursor-pointer hover:border-accentPrimary/40 transition-colors"
          title={isAiSpeaking ? "Mikrofon wyciszony podczas mowy asystenta" : "Kliknij tutaj, aby odblokować i przetestować wejście mikrofonu"}
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-textMuted">
            <span className="flex items-center gap-1.5">
              <Activity className={`w-3.5 h-3.5 ${!isAiSpeaking && micVolume > 5 ? 'text-accentPrimary animate-pulse' : 'text-textMuted'}`} />
              Wejście mikrofonu:
            </span>
            <span className={`font-bold ${
              isAiSpeaking ? 'text-red-400' : micVolume > 35 ? 'text-accentPrimary' : micVolume > 5 ? 'text-amber-300' : 'text-textMuted'
            }`}>
              {isAiSpeaking ? '0% (Wyciszony)' : micVolume > 0 ? `${micVolume}%` : '0% (Cisza)'}
            </span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/5">
            <div 
              className={`h-full rounded-full transition-all duration-75 ${
                isAiSpeaking ? 'bg-red-500/40' : micVolume > 40 ? 'bg-accentPrimary shadow-[0_0_8px_rgba(var(--color-accent-primary),0.8)]' : micVolume > 5 ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'bg-white/20'
              }`}
              style={{ width: `${isAiSpeaking ? 2 : Math.max(2, micVolume)}%` }}
            />
          </div>
          {micVolume === 0 && !isAiSpeaking && (
            <p className="text-[9px] text-textMuted/70 text-center">
               Kliknij ten pasek, jeśli wskaźnik nie reaguje na Twój głos
            </p>
          )}
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
              "{latestSpeech}" {latestMatched && ' (WYWOŁANIE!)'}
            </p>
          ) : (
            <p className="text-[11px] text-textMuted/70 italic">
              {isListening ? '(Cisza... powiedz spokojnie "Hej Omni")' : '(Mikrofon nieaktywny – kliknij przycisk powyżej)'}
            </p>
          )}
        </div>

        {/* OSTRZEŻENIE O UPRAWNIENIACH */}
        {isPermDenied && (
          <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/40 text-[11px] text-red-200 space-y-1.5">
            <div className="flex items-start gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <div>
                <p className="font-bold text-red-300">Mikrofon jest zablokowany!</p>
                <p className="text-[10px] text-red-200/80">
                  Kliknij ikonę kłódki przy adresie strony w przeglądarce i ustaw Mikrofon na <strong>Zezwalaj (Allow)</strong>.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={async () => {
                if (window.__OMNI_VOICE__) {
                  await window.__OMNI_VOICE__.requestMic();
                }
              }}
              className="w-full py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold text-[11px] transition-colors cursor-pointer"
            >
              Ponów próbę odblokowania
            </button>
          </div>
        )}

        {/* PRZYCISKI DIAGNOSTYCZNE */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              if (window.__OMNI_VOICE__) {
                window.__OMNI_VOICE__.testWakeWord('hej omni');
              } else {
                wakeWordService.handleWakeWordDetected('hej omni', '');
              }
            }}
            className="flex-1 py-1.5 px-2 rounded-lg bg-accentPrimary/20 hover:bg-accentPrimary/30 border border-accentPrimary/40 text-accentPrimary font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" /> Test "Hej Omni"
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.__OMNI_VOICE__) {
                window.__OMNI_VOICE__.restart();
              } else {
                wakeWordService.start();
              }
            }}
            className="py-1.5 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-textMuted hover:text-textPrimary text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
            title="Restartuj mikrofon"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
