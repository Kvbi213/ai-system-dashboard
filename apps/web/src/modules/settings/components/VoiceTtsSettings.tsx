import React, { useState } from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Volume2, Mic, Play, Check } from 'lucide-react';

const DEFAULT_TTS = {
  engine: 'webspeech' as const,
  rate: 1.0,
  pitch: 1.0
};

export const VoiceTtsSettings: React.FC = () => {
  const [ttsState, setTtsState] = useState(() => {
    try {
      const saved = localStorage.getItem('omnidash_tts_settings');
      return saved ? { ...DEFAULT_TTS, ...JSON.parse(saved) } : DEFAULT_TTS;
    } catch {
      return DEFAULT_TTS;
    }
  });

  const { engine, rate, pitch } = ttsState;
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const updateSetting = (key: keyof typeof DEFAULT_TTS, val: any) => {
    setTtsState((prev: typeof DEFAULT_TTS) => {
      const updated = { ...prev, [key]: val };
      try {
        localStorage.setItem('omnidash_tts_settings', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleSave = () => {
    try {
      localStorage.setItem('omnidash_tts_settings', JSON.stringify(ttsState));
      setSaveMsg('Zapisano konfigurację silnika syntezy mowy!');
      setTimeout(() => setSaveMsg(null), 3000);
    } catch {
      // ignore
    }
  };

  const handleTestTts = () => {
    setIsPlaying(true);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance('Test syntezy mowy OmniDash. Wszystkie węzły operacyjne aktywne.');
      utterance.lang = 'pl-PL';
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsPlaying(false), 2000);
    }
  };

  return (
    <GlassCard className="p-4 sm:p-5" glow="sky">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 shadow-sm">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Synteza Mowy (TTS) & Asystent Audio</h3>
            <p className="text-xs text-slate-500 font-medium">Odpowiedzi głosowe, lektor komunikatów i fonetyka</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-2">Dostawca Silnika TTS:</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { id: 'webspeech', name: 'Web Speech API', note: 'Wbudowane w przeglądarkę (0ms lag)' },
              { id: 'edge', name: 'Microsoft Edge TTS', note: 'Naturalny głos Mark / Zofia' },
              { id: 'elevenlabs', name: 'ElevenLabs Chmura', note: 'Hiper-realistyczny klon AI' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => updateSetting('engine', item.id)}
                className={`p-3 rounded-2xl border text-left transition shadow-sm ${
                  engine === item.id
                    ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-300 dark:border-purple-600 text-purple-900 dark:text-purple-300 ring-2 ring-purple-400/20'
                    : 'bg-white/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{item.name}</span>
                  {engine === item.id && <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{item.note}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              <span>Szybkość mowy:</span>
              <span className="font-mono text-purple-700 dark:text-purple-400">{rate.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={rate}
              onChange={(e) => updateSetting('rate', parseFloat(e.target.value))}
              className="w-full accent-purple-600"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              <span>Wysokość tonu (Pitch):</span>
              <span className="font-mono text-purple-700 dark:text-purple-400">{pitch.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={pitch}
              onChange={(e) => updateSetting('pitch', parseFloat(e.target.value))}
              className="w-full accent-purple-600"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Mic className="w-4 h-4 text-slate-400" />
            <span>Format wyjściowy: Audio 44.1kHz stereo</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition active:scale-95"
            >
              <span>Zapisz</span>
            </button>
            <button
              onClick={handleTestTts}
              disabled={isPlaying}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-purple-600/20 active:scale-95 transition"
            >
              <Play className={`w-3.5 h-3.5 ${isPlaying ? 'animate-spin' : ''}`} />
              <span>{isPlaying ? 'Odtwarzanie...' : 'Przetestuj głos'}</span>
            </button>
          </div>
        </div>

        {saveMsg && (
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300 text-xs font-medium">
            {saveMsg}
          </div>
        )}
      </div>
    </GlassCard>
  );
};
