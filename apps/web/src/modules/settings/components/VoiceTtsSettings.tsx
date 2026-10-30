import React, { useState } from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Volume2, Mic, Play, Check } from 'lucide-react';

export const VoiceTtsSettings: React.FC = () => {
  const [engine, setEngine] = useState<'webspeech' | 'edge' | 'elevenlabs'>('webspeech');
  const [rate, setRate] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(1.0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

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
                onClick={() => setEngine(item.id as typeof engine)}
                className={`p-3 rounded-2xl border text-left transition shadow-sm ${
                  engine === item.id
                    ? 'bg-purple-50 border-purple-300 text-purple-900 ring-2 ring-purple-400/20'
                    : 'bg-white/70 border-slate-200 text-slate-700 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{item.name}</span>
                  {engine === item.id && <Check className="w-3.5 h-3.5 text-purple-600" />}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">{item.note}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
              <span>Szybkość mowy:</span>
              <span className="font-mono text-purple-700">{rate.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              className="w-full accent-purple-600"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
              <span>Wysokość tonu (Pitch):</span>
              <span className="font-mono text-purple-700">{pitch.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={pitch}
              onChange={(e) => setPitch(parseFloat(e.target.value))}
              className="w-full accent-purple-600"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Mic className="w-4 h-4 text-slate-400" />
            <span>Format wyjściowy: Audio 44.1kHz stereo</span>
          </div>

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
    </GlassCard>
  );
};
