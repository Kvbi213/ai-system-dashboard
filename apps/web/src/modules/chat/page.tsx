import React, { useState, useRef, useEffect } from 'react';
import { ChatMessageItem, ChatMessage } from './components/ChatMessageItem';
import { ChatInputBar } from './components/ChatInputBar';
import { Sparkles, ShieldCheck } from 'lucide-react';

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    role: 'assistant',
    content:
      'Cześć Jakub! Jestem asystentem OmniDash v4.0 działającym na architekturze Zero-Trust i serwerze Docker LXC. Mogę sprawdzić Twój plan lekcji, oceny w Librusie, sytuację na drogach DK22/A1 lub stan budżetu 50/30/20. W czym mogę Ci teraz pomóc?',
    timestamp: '09:00',
    toolCall: {
      toolName: 'system_verify_edge_node',
      args: { host: 'mikrus-lxc-01', port: 4000, secure: true },
      output: '{"status": "online", "latency_ms": 18, "auth_provider": "google_identity"}'
    }
  }
];

export const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (text: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    // Realistic assistant response with tool calling simulation
    setTimeout(() => {
      let reply = 'Zrozumiałem zapytanie. Przetwarzam dane z modułu.';
      let toolCall: ChatMessage['toolCall'] | undefined = undefined;

      if (text.toLowerCase().includes('plan')) {
        reply = 'Dzisiaj w ZSE masz jeszcze 2 lekcje: Projektowanie Oprogramowania (Sala 204) do 11:30 oraz Język Angielski Zawodowy (Sala 102) od 11:40.';
        toolCall = {
          toolName: 'librus_get_timetable',
          args: { date: 'today', user_id: 'kvbi213' },
          output: '{"day": "Poniedziałek", "lessons_count": 6, "substitutions": 0}'
        };
      } else if (text.toLowerCase().includes('radar') || text.toLowerCase().includes('dk22')) {
        reply = 'Sprawdziłem dane CANARD dla Starogardu Gdańskiego i DK22: brak aktywnych odcinkowych pomiarów prędkości ani utrudnień GDDKiA na Twojej trasie. Warunki drogowe dobre.';
        toolCall = {
          toolName: 'canard_query_radars',
          args: { route: 'DK22', city: 'Starogard Gd.' },
          output: '{"active_radars": 0, "traffic_flow": "smooth", "road_temp_c": 12}'
        };
      } else if (text.toLowerCase().includes('ocen') || text.toLowerCase().includes('matematyk')) {
        reply = 'Z matematyki Twoja średnia wynosi 4.50. Ostatnia ocena: 5 (sprawdzian z geometrii analitycznej, waga 3). Szczęśliwy numerek na dzisiaj to 21.';
        toolCall = {
          toolName: 'librus_get_grades',
          args: { subject: 'Matematyka', semester: 2 },
          output: '{"grades": [5, 4, 5, 4], "average": 4.50, "lucky_number": 21}'
        };
      } else {
        reply = `Odebrałem polecenie: "${text}". Gotowy do wykonania w środowisku v4.0.`;
      }

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
        toolCall
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsLoading(false);
    }, 700);
  };

  return (
    <div
      data-testid="chat-container"
      className="flex-1 flex flex-col min-h-0 w-full max-w-4xl mx-auto h-full overflow-hidden"
    >
      {/* Header Info Banner - Non-scrolling fixed header */}
      <div className="shrink-0 flex items-center justify-between p-3 rounded-2xl glass-panel mb-2 text-xs shadow-sm">
        <div className="flex items-center gap-2 text-slate-700 font-medium">
          <Sparkles className="w-4 h-4 text-sky-600" />
          <span>Silnik AI: Groq gpt-oss-120b / Edge Dispatcher</span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-700 font-mono text-[11px] font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>CSP-L3</span>
        </div>
      </div>

      {/* Messages Scroll Area - ONLY THIS INNER CONTAINER SCROLLS! */}
      <div
        data-testid="chat-messages-scroll-area"
        className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1 mb-2 scrollbar-thin"
      >
        {messages.map((msg) => (
          <ChatMessageItem key={msg.id} message={msg} />
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-white/90 border border-slate-200/90 text-xs text-sky-700 w-fit shadow-sm font-semibold">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
            <span>AI generuje odpowiedź i weryfikuje narzędzia...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Chat Input Bar - Pinned at the bottom */}
      <div className="shrink-0 pt-2 border-t border-slate-200/80">
        <ChatInputBar onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
};
