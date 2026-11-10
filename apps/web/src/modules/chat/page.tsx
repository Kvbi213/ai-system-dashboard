import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatMessageItem, ChatMessage } from './components/ChatMessageItem';
import { ChatInputBar } from './components/ChatInputBar';
import { aiApi, AiEngineStatus } from '../../api/client';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  AlertTriangle,
  KeyRound,
  Settings2,
  RefreshCw,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  X,
  ExternalLink
} from 'lucide-react';

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
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Status połączenia z silnikiem AI
  const [aiStatus, setAiStatus] = useState<AiEngineStatus | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  // Modal szybkiej konfiguracji klucza Groq w oknie czatu
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [groqKeyInput, setGroqKeyInput] = useState('');
  const [keyMasked, setKeyMasked] = useState(true);
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [configSuccess, setConfigSuccess] = useState<string | null>(null);

  const checkAiStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const status = await aiApi.getStatus();
      setAiStatus(status);
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
      setIsCheckingStatus(false);
    }
  };

  useEffect(() => {
    checkAiStatus();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSaveGroqKey = async () => {
    if (!groqKeyInput.trim()) return;
    setIsSavingKey(true);
    setConfigError(null);
    setConfigSuccess(null);
    try {
      const res = await aiApi.saveConfig({ apiKey: groqKeyInput.trim() });
      setAiStatus(res.status);
      setConfigSuccess(res.message || 'Klucz Groq API zweryfikowany pomyślnie!');
      setGroqKeyInput('');
      setTimeout(() => {
        setShowConfigModal(false);
        setConfigSuccess(null);
      }, 1400);
    } catch (err: any) {
      setConfigError(err.message || 'Błąd 401: Nieprawidłowy klucz API Groq.');
      checkAiStatus();
    } finally {
      setIsSavingKey(false);
    }
  };

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
    } catch (err: any) {
      const is401 =
        err?.message?.includes('401') ||
        err?.message?.includes('Unauthorized') ||
        (aiStatus && !aiStatus.connected);

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: is401
          ? '[!] Błąd autoryzacji silnika AI: Brak lub nieprawidłowy klucz Groq API (401 Unauthorized). Kliknij przycisk „Skonfiguruj klucz API” powyżej, aby wprowadzić klucz z https://console.groq.com/keys.'
          : `[!] Błąd komunikacji z silnikiem AI: ${err?.message || 'Nieoczekiwana usterka bramy API'}.`,
        timestamp: new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, assistantMsg]);
      checkAiStatus();
    } finally {
      setIsLoading(false);
    }
  };

  const isConnected = Boolean(aiStatus?.connected);
  const is401Error = Boolean(aiStatus?.error?.includes('401'));

  return (
    <div
      data-testid="chat-container"
      className="flex-1 flex flex-col min-h-0 w-full max-w-4xl mx-auto h-full overflow-hidden relative"
    >
      {/* Header Info Banner - Dynamiczny stan połączenia zamiast atrapy */}
      {isConnected ? (
        <div className="shrink-0 flex items-center justify-between p-3 rounded-2xl glass-panel mb-2 text-xs shadow-sm">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-medium">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span className="font-bold">Silnik AI: Groq {aiStatus?.model || 'openai/gpt-oss-120b'}</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono font-bold">
              POŁĄCZONO
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-mono text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Realne Narzędzia & Pushbullet</span>
            </div>
            <button
              onClick={() => setShowConfigModal(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Zmień konfigurację klucza AI"
            >
              <Settings2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 mb-2 text-xs shadow-sm gap-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-medium">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="font-bold">
              {is401Error
                ? '[!] Silnik AI: Błąd autoryzacji (401 Unauthorized)'
                : '[!] Silnik AI niepołączony (Wymagany klucz API)'}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-800 dark:text-amber-300 font-mono font-bold">
              OFFLINE
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfigModal(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition active:scale-95 shadow-sm flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Skonfiguruj klucz API</span>
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-300 dark:border-slate-700 transition"
            >
              Ustawienia
            </button>
            <button
              onClick={checkAiStatus}
              disabled={isCheckingStatus}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              title="Ponów test połączenia"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingStatus ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      )}

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

      {/* Modal konfiguracji klucza Groq bezpośrednio w czacie */}
      {showConfigModal && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500 border border-sky-500/20">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Konfiguracja Silnika Groq Cloud AI
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    Model: openai/gpt-oss-120b (LPU Inference)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Wprowadź swój klucz Groq API (<code className="font-mono text-sky-600 dark:text-sky-400">gsk_...</code>).
                Klucz zostanie natychmiast zweryfikowany z API Groq i trwale zapisany w bazie danych SQLite.
              </div>

              {aiStatus?.maskedKey && (
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 text-xs font-mono flex items-center justify-between border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Aktywny klucz:</span>
                  <span className="text-emerald-500 font-bold">{aiStatus.maskedKey} ({aiStatus.source})</span>
                </div>
              )}

              {configError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{configError}</span>
                </div>
              )}

              {configSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2 font-mono">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{configSuccess}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Klucz API Groq:
                </label>
                <div className="relative">
                  <input
                    type={keyMasked ? 'password' : 'text'}
                    placeholder="Wklej klucz gsk_..."
                    value={groqKeyInput}
                    onChange={(e) => setGroqKeyInput(e.target.value)}
                    className="w-full px-3 py-2 pr-10 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setKeyMasked(!keyMasked)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {keyMasked ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-sky-500/5 border border-sky-500/20 text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between">
                <span>Nie posiadasz jeszcze klucza?</span>
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 font-bold font-mono"
                >
                  <span>Pobierz darmowy klucz na console.groq.com</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={handleSaveGroqKey}
                disabled={isSavingKey || !groqKeyInput.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white transition active:scale-95 shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSavingKey ? (
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
          </div>
        </div>
      )}
    </div>
  );
};
