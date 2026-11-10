import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Badge } from '../../../components/ui/Badge';
import { Bot, Key, Eye, EyeOff, Save, Check, RefreshCw, AlertTriangle, ExternalLink, CheckCircle2 } from 'lucide-react';
import { aiApi, AiEngineStatus } from '../../../api/client';

export const AiModelSettings: React.FC = () => {
  const [aiStatus, setAiStatus] = useState<AiEngineStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiKeyMasked, setApiKeyMasked] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<{ success: boolean; text: string } | null>(null);

  const [aiState, setAiState] = useState(() => {
    try {
      const saved = localStorage.getItem('omnidash_ai_settings');
      return saved ? JSON.parse(saved) : { model: 'openai/gpt-oss-120b', temperature: 0.7 };
    } catch {
      return { model: 'openai/gpt-oss-120b', temperature: 0.7 };
    }
  });

  const { model, temperature } = aiState;

  const loadStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const res = await aiApi.getStatus();
      setAiStatus(res);
    } catch (err: any) {
      setAiStatus({
        connected: false,
        provider: 'none',
        model: 'openai/gpt-oss-120b',
        source: 'none',
        maskedKey: '',
        error: err.message || 'Błąd połączenia z API Gateway'
      });
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const setModel = (m: string) => {
    setAiState((prev: any) => {
      const updated = { ...prev, model: m };
      try {
        localStorage.setItem('omnidash_ai_settings', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const setTemperature = (t: number) => {
    setAiState((prev: any) => {
      const updated = { ...prev, temperature: t };
      try {
        localStorage.setItem('omnidash_ai_settings', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) return;
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const res = await aiApi.saveConfig({ apiKey: apiKeyInput.trim() });
      setAiStatus(res.status);
      setSaveMessage({ success: true, text: res.message || 'Klucz Groq zweryfikowany i zapisany.' });
      setApiKeyInput('');
    } catch (err: any) {
      setSaveMessage({
        success: false,
        text: err.message || 'Błąd 401: Nieprawidłowy klucz API Groq.'
      });
      loadStatus();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <GlassCard className="p-4 sm:p-5" glow="sky">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 shadow-sm">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Architektura Modeli AI & LPU</span>
              <Badge variant={aiStatus?.connected ? 'success' : aiStatus?.error?.includes('401') ? 'danger' : 'amber'}>
                {aiStatus?.connected
                  ? 'POŁĄCZONO Z GROQ'
                  : aiStatus?.error?.includes('401')
                  ? 'BŁĄD 401 (NIEPRAWIDŁOWY KLUCZ)'
                  : 'WYMAGA KLUCZA API'}
              </Badge>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Groq Inference Engine (LPU) & Google Gemini Flash API
            </p>
          </div>
        </div>

        <button
          onClick={loadStatus}
          disabled={isLoadingStatus}
          className="p-2 rounded-xl text-slate-400 hover:text-sky-500 transition border border-slate-200 dark:border-slate-800"
          title="Odśwież status połączenia AI"
        >
          <RefreshCw className={`w-4 h-4 ${isLoadingStatus ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-4">
        {/* Status baner */}
        {aiStatus?.error && !aiStatus.connected && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{aiStatus.error}</span>
          </div>
        )}

        {saveMessage && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2 font-mono ${
              saveMessage.success
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
            }`}
          >
            {saveMessage.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{saveMessage.text}</span>
          </div>
        )}

        {/* Model Selection */}
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">Domyślny Model LLM:</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B (Groq)', desc: '500 t/s, pełne Function Calling' },
              { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', desc: 'Google Cloud API, 1M tokenów' },
              { id: 'openai/gpt-oss-20b', name: 'GPT-OSS 20B (Groq Edge)', desc: '750 t/s, szybka inferencja' }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setModel(m.id)}
                className={`p-3 rounded-2xl border text-left transition shadow-sm ${
                  model === m.id
                    ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-700 text-sky-900 dark:text-sky-200 ring-2 ring-sky-400/20'
                    : 'bg-white/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{m.name}</span>
                  {model === m.id && <Check className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{m.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Temperature */}
        <div>
          <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            <span>Temperatura Kreatywności (Inference Temp):</span>
            <span className="font-mono text-sky-700 dark:text-sky-400">{temperature.toFixed(2)}</span>
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

        {/* API Key Vault */}
        <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Klucz Groq API (<code className="font-mono text-sky-600 dark:text-sky-400">gsk_...</code>):
            </label>
            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              {aiStatus?.maskedKey ? (
                <span>Aktywny: <strong className="text-emerald-500">{aiStatus.maskedKey}</strong> ({aiStatus.source === 'database' ? 'SQLite' : '.env'})</span>
              ) : (
                <span className="text-amber-500">Brak aktywnego klucza</span>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <input
                type={apiKeyMasked ? 'password' : 'text'}
                placeholder="Wklej klucz Groq gsk_..."
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="w-full px-3 py-2 pr-10 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white shadow-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              <button
                type="button"
                onClick={() => setApiKeyMasked(!apiKeyMasked)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {apiKeyMasked ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={handleSaveApiKey}
              disabled={isSaving || !apiKeyInput.trim()}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-sm active:scale-95 transition disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Weryfikacja...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Zapisz i przetestuj połączenie</span>
                </>
              )}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
            <p className="flex items-center gap-1">
              <Key className="w-3 h-3 text-slate-400 shrink-0" />
              <span>Klucz weryfikowany w chmurze Groq i bezpiecznie zapisywany w bazie SQLite.</span>
            </p>
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noreferrer noopener"
              className="text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 font-mono shrink-0"
            >
              <span>Pobierz darmowy klucz na console.groq.com</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};
