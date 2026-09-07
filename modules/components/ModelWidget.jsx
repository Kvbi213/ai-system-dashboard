import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Server, Activity, Database, Zap, Check } from 'lucide-react';

const API_BASE = typeof window !== 'undefined' && (
  window.location.hostname.includes('web.app') || 
  window.location.hostname.includes('firebaseapp.com')
) ? 'https://ai-system-dashboard.vercel.app' : '';

const CURATED_DEFAULT_MODELS = [
  {
    id: 'openai/gpt-oss-120b',
    active: true,
    context_window: 131072,
    max_completion_tokens: 8192,
    owned_by: 'OpenAI / Groq High-Reasoning'
  },
  {
    id: 'llama-3.3-70b-versatile',
    active: true,
    context_window: 131072,
    max_completion_tokens: 8192,
    owned_by: 'Meta'
  },
  {
    id: 'mixtral-8x7b-32768',
    active: true,
    context_window: 32768,
    max_completion_tokens: 4096,
    owned_by: 'Mistral AI'
  },
  {
    id: 'gemma2-9b-it',
    active: true,
    context_window: 8192,
    max_completion_tokens: 4096,
    owned_by: 'Google'
  }
];

const ModelWidget = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchModels = async () => {
      const savedActive = localStorage.getItem('system_active_model') || 'openai/gpt-oss-120b';
      try {
        const res = await axios.get(`${API_BASE}/api/models`, { timeout: 4000 });
        if (!isMounted) return;
        if (res.data && Array.isArray(res.data.models) && res.data.models.length > 0) {
          const filtered = res.data.models.filter(m => m.active && !m.id.includes('whisper') && !m.id.includes('guard'));
          filtered.sort((a, b) => b.context_window - a.context_window);

          setData({
            models: filtered,
            activeModel: savedActive || res.data.activeModel || 'openai/gpt-oss-120b',
            fallbackChain: res.data.fallbackChain || ['openai/gpt-oss-120b', 'llama-3.3-70b-versatile']
          });
        } else {
          setData({
            models: CURATED_DEFAULT_MODELS,
            activeModel: savedActive,
            fallbackChain: ['openai/gpt-oss-120b', 'llama-3.3-70b-versatile', 'mixtral-8x7b-32768']
          });
        }
      } catch (err) {
        if (!isMounted) return;
        // Odporny fallback bez błędu - gwarantuje ciągłość działania
        setData({
          models: CURATED_DEFAULT_MODELS,
          activeModel: savedActive,
          fallbackChain: ['openai/gpt-oss-120b', 'llama-3.3-70b-versatile', 'mixtral-8x7b-32768']
        });
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchModels();
    return () => { isMounted = false; };
  }, []);

  const handleSelectModel = async (modelId) => {
    if (data?.activeModel === modelId) return;
    localStorage.setItem('system_active_model', modelId);
    window.dispatchEvent(new CustomEvent('activeModelChanged', { detail: modelId }));

    setData(prev => ({
      ...prev,
      activeModel: modelId,
      fallbackChain: [modelId, ...(prev?.fallbackChain?.filter(m => m !== modelId) || [])]
    }));

    try {
      await axios.post(`${API_BASE}/api/models/active`, { modelId }, { timeout: 3000 });
    } catch (err) {
      // Zapis w localStorage wystarcza do działania klienta
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full bg-background shadow-2xl rounded-xl border border-border p-4 flex flex-col items-center justify-center text-accentPrimary font-mono">
        <Activity className="w-8 h-8 animate-spin mb-4" />
        <div className="text-xs">Weryfikacja dostępności modeli LLM...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-background shadow-2xl rounded-xl border border-border flex flex-col overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accentPrimary to-transparent opacity-50"></div>
      
      <div className="p-3 border-b border-border/50 bg-black/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-accentPrimary" />
          <span className="font-mono text-xs text-textPrimary uppercase tracking-widest font-bold">Dostępne Modele</span>
        </div>
        <span className="text-[10px] text-textMuted font-mono">LIVE API</span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3 font-mono">
        {data.models.map((model, idx) => {
          const isActive = data.activeModel === model.id;
          const fallbackIndex = data.fallbackChain.indexOf(model.id);
          const isFallback = fallbackIndex !== -1;

          return (
            <div 
              key={idx} 
              onClick={() => handleSelectModel(model.id)}
              className={`p-3 rounded-lg border transition-all ${!isActive && 'cursor-pointer'} ${
                isActive 
                  ? 'bg-accentPrimary/10 border-accentPrimary/50 shadow-[0_0_15px_rgba(var(--color-accent-primary),0.1)] cursor-default' 
                  : isFallback 
                    ? 'bg-surface/80 border-border hover:border-accentPrimary/50'
                    : 'bg-surface/40 border-border/30 hover:bg-surface/60'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="font-bold text-sm flex items-center gap-2 text-textPrimary">
                  {isActive && <Zap className="w-3 h-3 text-accentPrimary animate-pulse" />}
                  {model.id}
                </div>
                {isActive && <span className="text-[9px] bg-accentPrimary text-black px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">ACTIVE</span>}
                {!isActive && isFallback && <span className="text-[9px] bg-border text-textMuted px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Fallback #{fallbackIndex + 1}</span>}
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-[10px] text-textMuted">
                <div className="flex items-center gap-1.5">
                  <Database className="w-3 h-3" />
                  Context: <span className="text-textPrimary">{(model.context_window / 1024).toFixed(0)}k</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3 h-3" />
                  Max out: <span className="text-textPrimary">{model.max_completion_tokens || 'Unknown'}</span>
                </div>
                <div className="col-span-2 text-[9px] opacity-50 mt-1">
                  Developer: {model.owned_by}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ModelWidget;
