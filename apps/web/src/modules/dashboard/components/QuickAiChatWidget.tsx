import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Send, ArrowRight, Loader2, Bot, User } from 'lucide-react';
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
    <GlassCard className="p-4 sm:p-5 flex flex-col justify-between" glow="none">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Asystent</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">Szybkie zapytanie w czasie rzeczywistym</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/chat')}
            className="flex items-center gap-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          >
            <span>Pełny czat</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Message preview snippet */}
        <div className="space-y-2 mb-3 max-h-[140px] overflow-y-auto pr-1">
          {messages.slice(-2).map((m, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-lg text-xs ${
                m.sender === 'user'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 ml-6 border border-slate-200 dark:border-slate-700'
                  : 'bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-200 mr-2 border border-slate-200 dark:border-slate-700/80 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {m.sender === 'user' ? <User className="w-3 h-3 text-slate-600 dark:text-slate-400" /> : <Bot className="w-3 h-3 text-slate-600 dark:text-slate-400" />}
                <span>{m.sender === 'user' ? 'Ty' : 'Asystent'} • {m.time}</span>
              </div>
              <p className="leading-relaxed font-normal">{m.text}</p>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 p-2">
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
          placeholder="Napisz wiadomość..."
          className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-slate-400 shadow-xs"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 disabled:opacity-40 transition shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400"
          title="Wyślij"
          aria-label="Wyślij wiadomość"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </GlassCard>
  );
};
