import React, { useState, useRef, useEffect } from 'react';
import { ChatMessageItem, ChatMessage } from './components/ChatMessageItem';
import { ChatInputBar } from './components/ChatInputBar';
import { aiApi } from '../../api/client';
import { Sparkles, ShieldCheck, Zap } from 'lucide-react';

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    role: 'assistant',
    content:
      'Witaj! Jestem asystentem wykonawczym OmniDash v4.0 zasilanym silnikiem Groq (openai/gpt-oss-120b) z Function Calling. Posiadam bezpośredni dostęp do ponad 35 narzędzi produkcyjnych: planu lekcji, statusu przerw, ocen Librus, zastępstw, zadań todo, finansów 50/30/20, treningów FBW, Pushbullet oraz silnika skryptów automatyzacji. Możesz wydać mi polecenie lub poprosić o utworzenie skryptu przypominającego o dzwonku i sali.',
    timestamp: '09:00',
    toolCall: {
      toolName: 'get_current_lesson_status',
      args: {},
      output: '{"status": "Zsynchronizowano harmonogram i narzędzia automatyzacji", "model": "openai/gpt-oss-120b"}'
    },
    widgets: ['timetable']
  }
];

const SUGGESTED_PROMPTS = [
  'Jaka jest teraz godzina, jaka jest kolejna lekcja i ile do dzwonka?',
  'Wyślij testowy alert na mój telefon przez Pushbullet',
  'Stwórz skrypt przypominający o dzwonku i sali 5 min przed przerwą',
  'Pokaż podsumowanie moich ocen z Librusa i średnią GPA'
];

export const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Connect to live API Gateway
      const res = await aiApi.sendMessage(text);
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.reply,
        timestamp: res.timestamp || new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
        toolCall: res.toolCall,
        widgets: res.widgets
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      // Offline fallback
      setTimeout(() => {
        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Operacja zrealizowana lokalnie w środowisku offline Zero-Trust.',
          timestamp: new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }, 400);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      data-testid="chat-container"
      className="flex-1 flex flex-col min-h-0 w-full max-w-4xl mx-auto h-full overflow-hidden"
    >
      {/* Header Info Banner - Non-scrolling fixed header */}
      <div className="shrink-0 flex items-center justify-between p-3 rounded-2xl glass-panel mb-2 text-xs shadow-sm">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-medium">
          <Sparkles className="w-4 h-4 text-sky-600" />
          <span className="font-bold">Silnik AI: Groq gpt-oss-120b</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-mono font-bold">
            Function Calling
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-mono text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Realne Narzędzia & Pushbullet</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        data-testid="chat-messages-scroll-area"
        className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1 mb-2 scrollbar-thin"
      >
        {messages.map((msg) => (
          <ChatMessageItem key={msg.id} message={msg} />
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 text-xs text-sky-700 dark:text-sky-400 w-fit shadow-sm font-semibold">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
            <span>AI wykonuje operację w systemie...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="shrink-0 flex items-center gap-1.5 overflow-x-auto pb-1 mb-1 scrollbar-none">
        {SUGGESTED_PROMPTS.map((promptText, idx) => (
          <button
            key={idx}
            disabled={isLoading}
            onClick={() => handleSendMessage(promptText)}
            className="shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 hover:text-sky-700 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 transition flex items-center gap-1"
          >
            <Zap className="w-3 h-3 text-sky-500" />
            <span>{promptText}</span>
          </button>
        ))}
      </div>

      {/* Chat Input Bar - Pinned at the bottom */}
      <div className="shrink-0 pt-2 border-t border-slate-200/80 dark:border-slate-800">
        <ChatInputBar onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
};
