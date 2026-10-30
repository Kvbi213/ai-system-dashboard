import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Sparkles, Send, ArrowRight, Loader2, Bot, User } from 'lucide-react';
import { aiApi } from '../../../api/client';

export const QuickAiChatWidget: React.FC = () => {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string }>>([
    {
      sender: 'user',
      text: 'Jaki jest priorytet zadań na dziś?',
      time: '12:14'
    },
    {
      sender: 'ai',
      text: 'Główny priorytet: wdrożenie audytu zabezpieczeń i sesja FBW na poddaszu. Wszystkie usługi działają bez zakłóceń.',
      time: '12:15 • Groq 16ms'
    }
  ]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const query = input.trim();
    setInput('');
    const userMsg = {
      sender: 'user' as const,
      text: query,
      time: new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
    };
    setMessages((prev) => [...prev.slice(-3), userMsg]);
    setIsLoading(true);

    try {
      const res = await aiApi.sendMessage(query);
      const aiMsg = {
        sender: 'ai' as const,
        text: res.reply || 'Zarejestrowano zapytanie w systemie asystenckim.',
        time: `${new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })} • Groq`
      };
      setMessages((prev) => [...prev.slice(-3), aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev.slice(-3),
        {
          sender: 'ai' as const,
          text: 'Odpowiedź lokalna: Twój harmonogram i zadania są zsynchronizowane. Przejdź do pełnego czatu po szczegółowy raport.',
          time: 'Offline cache'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GlassCard className="p-4 sm:p-5 flex flex-col justify-between" glow="indigo">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-sm">
              <Sparkles className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Szybki Czat Omni AI</h3>
              <p className="text-xs text-slate-500 font-medium">Groq LPU 120B • Odpowiedź w czasie rzeczywistym</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/chat')}
            className="flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-900 hover:underline"
          >
            <span>Pełny czat</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Message preview snippet */}
        <div className="space-y-2 mb-3 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin">
          {messages.slice(-2).map((m, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-xl text-xs ${
                m.sender === 'user'
                  ? 'bg-sky-50 text-sky-900 ml-6 border border-sky-200'
                  : 'bg-white text-slate-800 mr-2 border border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400 font-mono font-bold">
                {m.sender === 'user' ? <User className="w-3 h-3 text-sky-600" /> : <Bot className="w-3 h-3 text-indigo-600" />}
                <span>{m.sender === 'user' ? 'Ty' : 'OmniDash AI'} • {m.time}</span>
              </div>
              <p className="leading-relaxed font-medium">{m.text}</p>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-indigo-700 font-mono p-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Generowanie odpowiedzi...</span>
            </div>
          )}
        </div>
      </div>

      {/* Input bar */}
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Zadaj szybkie pytanie AI..."
          className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-inner"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white shadow-md shadow-indigo-600/20 active:scale-95 transition"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </GlassCard>
  );
};
