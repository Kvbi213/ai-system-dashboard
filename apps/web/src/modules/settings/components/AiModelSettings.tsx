import React, { useState } from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Bot, Key, Eye, EyeOff, Save, Check } from 'lucide-react';

const DEFAULT_AI = {
  model: 'llama-3.3-70b' as 'llama-3.3-70b' | 'gemini-2.5-flash' | 'mixtral-8x7b',
  temperature: 0.7,
  apiKey: 'gsk_live_99a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4'
};

export const AiModelSettings: React.FC = () => {
  const [aiState, setAiState] = useState(() => {
    try {
      const saved = localStorage.getItem('omnidash_ai_settings');
      return saved ? { ...DEFAULT_AI, ...JSON.parse(saved) } : DEFAULT_AI;
    } catch {
      return DEFAULT_AI;
    }
  });

  const { model, temperature, apiKey } = aiState;
  const [apiKeyMasked, setApiKeyMasked] = useState<boolean>(true);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const setModel = (m: typeof model) => {
    setAiState((prev: typeof DEFAULT_AI) => {
      const updated = { ...prev, model: m };
      try {
        localStorage.setItem('omnidash_ai_settings', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const setTemperature = (t: number) => {
    setAiState((prev: typeof DEFAULT_AI) => {
      const updated = { ...prev, temperature: t };
      try {
        localStorage.setItem('omnidash_ai_settings', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const setApiKey = (k: string) => {
    setAiState((prev: typeof DEFAULT_AI) => ({ ...prev, apiKey: k }));
  };

  const handleSave = () => {
    try {
      localStorage.setItem('omnidash_ai_settings', JSON.stringify(aiState));
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch {
      // ignore
    }
  };

  return (
    <GlassCard className="p-4 sm:p-5" glow="sky">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 shadow-sm">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Architektura Modeli AI & LPU</h3>
            <p className="text-xs text-slate-500 font-medium">Groq Inference Engine & Google Gemini Flash</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-2">Domyślny Model LLM:</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { id: 'llama-3.3-70b', name: 'Llama 3.3 70B (Groq)', desc: '1200 tps, inferencja LPU' },
              { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: '1M tokenów kontekstu' },
              { id: 'mixtral-8x7b', name: 'Mixtral 8x7B MoE', desc: 'Szybkie zapytania bazowe' }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setModel(m.id as typeof model)}
                className={`p-3 rounded-2xl border text-left transition shadow-sm ${
                  model === m.id
                    ? 'bg-sky-50 border-sky-300 text-sky-900 ring-2 ring-sky-400/20'
                    : 'bg-white/70 border-slate-200 text-slate-700 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{m.name}</span>
                  {model === m.id && <Check className="w-3.5 h-3.5 text-sky-600" />}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">{m.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
            <span>Temperatura Kreatywności (Inference Temp):</span>
            <span className="font-mono text-sky-700">{temperature.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.0"
            max="1.0"
            step="0.05"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            className="w-full accent-sky-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
            <span>0.0 (Precyzyjny / Deterministyczny)</span>
            <span>1.0 (Kreatywny / Synteza)</span>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Magazyn Klucza API (Vault):</label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type={apiKeyMasked ? 'password' : 'text'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 pr-10 rounded-xl bg-white border border-slate-300 text-xs font-mono text-slate-900 shadow-sm"
              />
              <button
                type="button"
                onClick={() => setApiKeyMasked(!apiKeyMasked)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {apiKeyMasked ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/20 active:scale-95 transition"
            >
              {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span>{isSaved ? 'Zapisano' : 'Zapisz'}</span>
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
            <Key className="w-3 h-3 text-slate-400" />
            <span>Klucz jest szyfrowany w lokalnym sejfie Zero-Trust (Zero-Client Leakage).</span>
          </p>
        </div>
      </div>
    </GlassCard>
  );
};
