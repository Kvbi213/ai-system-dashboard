import React, { useState, useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, Send, Code, BrainCircuit, Bot, Lightbulb, X, Mic, MicOff, Loader2, Copy, Check, Radio, User, Sparkles, Volume2, VolumeX, ArrowDown, StopCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import WeatherWidget from './WeatherWidget';
import ITNewsTicker from './ITNewsTicker';
import SystemMonitor from './SystemMonitor';
import TodoList from './TodoList';
import ModelWidget from './ModelWidget';
import NotificationsWidget from './NotificationsWidget';
import { 
  TimetableChatWidget, 
  FinanceChatWidget, 
  WorkoutsChatWidget, 
  CalendarChatWidget 
} from './ChatInlineWidgets';
import { useChatContext } from '../context/ChatContext';
import { ttsService } from '../services/ttsService';
import { wakeWordService, isAcousticEcho } from '../services/wakeWordService';

const QUICK_PROMPTS = [
  { label: '📋 Zadania To-Do', text: 'witam serdecznie co mamy dziś w todo?' },
  { label: '🎓 Plan lekcji', text: 'jaki mam dzisiaj plan lekcji i zajęcia?' },
  { label: '💰 Stan finansów', text: 'podsumuj moje finanse i budżet 50/30/20' },
  { label: '🏋️ Treningi', text: 'pokaż moje ostatnie treningi i aktywność' },
  { label: '☀️ Pogoda i prognoza', text: 'jaka jest dzisiaj pogoda i prognoza?' },
  { label: '📰 Wiadomości IT & AI', text: 'podsumuj najważniejsze wydarzenia technologiczne i AI' },
  { label: '🛰️ Status systemu', text: 'podaj aktualny stan i telemetrię systemu OmniDash' },
  { label: '🧹 Wyczyść czat', text: '/clear' },
];

const CodeBlock = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-border/80 bg-black/70 shadow-lg font-mono text-xs">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-white/5 border-b border-white/10 text-textMuted text-[11px]">
        <span className="font-semibold uppercase tracking-wider text-accentPrimary">
          {language || 'kod'}
        </span>
        <button
          onClick={handleCopy}
          type="button"
          className="flex items-center gap-1.5 hover:text-textPrimary text-textMuted transition-colors py-0.5 px-2 rounded hover:bg-white/10"
          title="Kopiuj kod"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Skopiowano' : 'Kopiuj'}</span>
        </button>
      </div>
      <div className="p-3.5 overflow-x-auto custom-scrollbar text-textPrimary leading-relaxed text-[13px]">
        <pre className="font-mono">{value}</pre>
      </div>
    </div>
  );
};

const ChatMessage = ({ msg, mode = 'worker' }) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleCopy = () => {
    if (!msg.content) return;
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      ttsService.stop();
      setIsSpeaking(false);
      wakeWordService.setAiSpeaking(false);
      return;
    }
    wakeWordService.setAiSpeaking(true);
    ttsService.speak(msg.content || '', {
      onStart: () => setIsSpeaking(true),
      onEnd: () => {
        setIsSpeaking(false);
        setTimeout(() => wakeWordService.setAiSpeaking(false), 500);
      },
      onError: () => {
        setIsSpeaking(false);
        wakeWordService.setAiSpeaking(false);
      }
    });
  };

  useEffect(() => {
    return () => {
      if (isSpeaking) {
        ttsService.stop();
      }
    };
  }, [isSpeaking]);

  const formatTime = (ts) => {
    if (!ts) return new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  if (msg.isSystem) {
    return (
      <div className="flex justify-center my-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-mono text-xs shadow-sm">
          <TerminalIcon className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
          <span>{msg.content}</span>
        </div>
      </div>
    );
  }

  if (msg.role === 'user') {
    return (
      <div className="flex justify-end group my-2.5 animate-fade-in">
        <div className="max-w-[85%] md:max-w-[75%] flex flex-col items-end">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-textMuted mb-1 px-1">
            <span className="font-semibold text-accentPrimary flex items-center gap-1">
              <User className="w-3 h-3" /> OPERATOR
            </span>
            <span>•</span>
            <span>{formatTime(msg.timestamp)}</span>
          </div>
          <div className="glass-panel p-3.5 md:p-4 rounded-2xl rounded-tr-sm bg-gradient-to-br from-accentPrimary/15 via-accentPrimary/5 to-surface/80 border border-accentPrimary/30 shadow-md text-textPrimary text-sm md:text-[14.5px] leading-relaxed whitespace-pre-wrap">
            {msg.content}
          </div>
        </div>
      </div>
    );
  }

  // AI Message
  return (
    <div className="flex justify-start group my-3 animate-fade-in">
      <div className="w-full max-w-[98%] md:max-w-[92%] flex flex-col items-start">
        {/* AI Header Bar */}
        <div className="flex items-center justify-between w-full mb-1.5 px-1">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-6 h-6 rounded-lg bg-accentPrimary/20 border border-accentPrimary/40 flex items-center justify-center text-accentPrimary shadow-[0_0_10px_rgba(var(--color-accent-primary),0.3)]">
              {mode === 'mentor' ? <BrainCircuit className="w-3.5 h-3.5" /> : (mode === 'daemon' ? <Bot className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />)}
            </div>
            <span className="font-mono font-bold text-textPrimary tracking-wide">
              {mode === 'mentor' ? 'OMNI MIND' : (mode === 'daemon' ? 'OMNIDAEMON' : 'OMNI EXEC')}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/40 text-accentPrimary/90 border border-accentPrimary/20">
              openai/gpt-oss-120b
            </span>
            <span className="text-[11px] text-textMuted font-mono">
              {formatTime(msg.timestamp)}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={toggleSpeech}
              className="p-1.5 rounded-lg text-textMuted hover:text-accentPrimary hover:bg-white/5 transition-colors"
              title={isSpeaking ? "Zatrzymaj odsłuchiwanie" : "Odsłuchaj wiadomość (TTS)"}
            >
              {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-accentPrimary animate-pulse" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 rounded-lg text-textMuted hover:text-accentPrimary hover:bg-white/5 transition-colors"
              title="Kopiuj treść"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* AI Message Card */}
        <div className="w-full glass-panel p-4 md:p-5 rounded-2xl rounded-tl-sm border border-border/70 bg-gradient-to-br from-surface/90 via-surface/75 to-background/95 shadow-xl text-textPrimary text-sm md:text-[14.5px] leading-relaxed relative">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ node, children, ...props }) => (
                <p className="mb-3 last:mb-0 leading-relaxed text-textPrimary/95 text-[14px] md:text-[14.5px]" {...props}>
                  {children}
                </p>
              ),
              a: ({ node, children, ...props }) => (
                <a className="text-accentPrimary hover:underline font-medium inline-flex items-center gap-1" target="_blank" rel="noreferrer" {...props}>
                  {children}
                </a>
              ),
              ul: ({ node, children, ...props }) => (
                <ul className="my-2.5 space-y-2.5 pl-0 list-none [&_ul]:pl-3.5 [&_ul]:border-l-2 [&_ul]:border-accentPrimary/30 [&_ul]:ml-2 [&_ul]:my-2 [&_ul]:space-y-2" {...props}>
                  {children}
                </ul>
              ),
              ol: ({ node, children, ...props }) => (
                <ol className="my-2.5 space-y-2 pl-5 list-decimal marker:text-accentPrimary marker:font-bold text-textPrimary/95 text-[14px] md:text-[14.5px]" {...props}>
                  {children}
                </ol>
              ),
              li: ({ node, children, ...props }) => {
                const hasNested = node?.children?.some(c => c.tagName === 'ul' || c.tagName === 'ol');
                if (hasNested) {
                  return (
                    <li className="my-3 list-none" {...props}>
                      <div className="flex items-start gap-2.5 text-textPrimary font-semibold text-[14.5px] md:text-[15px] tracking-wide">
                        <span className="inline-flex items-center justify-center w-2.5 h-2.5 rounded-full bg-accentPrimary mt-1.5 shrink-0 shadow-[0_0_10px_rgba(var(--color-accent-primary),0.8)]" />
                        <div className="flex-1 min-w-0">{children}</div>
                      </div>
                    </li>
                  );
                }
                return (
                  <li className="flex items-start gap-2.5 text-textPrimary/90 leading-relaxed text-[13.5px] md:text-[14px] my-1 list-none" {...props}>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-accentSecondary/80 mt-2 shrink-0" />
                    <div className="flex-1 min-w-0">{children}</div>
                  </li>
                );
              },
              strong: ({ node, children, ...props }) => (
                <strong className="font-semibold text-white tracking-tight" {...props}>
                  {children}
                </strong>
              ),
              em: ({ node, children, ...props }) => (
                <em className="italic text-accentSecondary/90" {...props}>
                  {children}
                </em>
              ),
              del: ({ node, children, ...props }) => (
                <del className="line-through text-textMuted opacity-75" {...props}>
                  {children}
                </del>
              ),
              h1: ({ node, children, ...props }) => (
                <h1 className="text-lg md:text-xl font-bold text-white mt-4 mb-2 pb-1.5 border-b border-border/60 flex items-center gap-2" {...props}>
                  <span className="w-2 h-5 rounded-full bg-accentPrimary shrink-0" />
                  {children}
                </h1>
              ),
              h2: ({ node, children, ...props }) => (
                <h2 className="text-base md:text-lg font-bold text-white mt-3.5 mb-2 flex items-center gap-2" {...props}>
                  <span className="w-1.5 h-4 rounded-full bg-accentSecondary shrink-0" />
                  {children}
                </h2>
              ),
              h3: ({ node, children, ...props }) => (
                <h3 className="text-sm md:text-base font-semibold text-accentPrimary mt-3 mb-1.5 tracking-wide" {...props}>
                  {children}
                </h3>
              ),
              blockquote: ({ node, children, ...props }) => (
                <blockquote className="border-l-4 border-accentPrimary bg-accentPrimary/5 rounded-r-xl px-4 py-2.5 my-3 text-textPrimary/90 italic text-sm shadow-sm" {...props}>
                  {children}
                </blockquote>
              ),
              hr: ({ node, ...props }) => (
                <hr className="my-4 border-border/60" {...props} />
              ),
              table: ({ node, children, ...props }) => (
                <div className="my-3.5 overflow-x-auto rounded-xl border border-border/80 bg-surface/60 shadow-lg custom-scrollbar">
                  <table className="w-full text-left text-xs md:text-[13.5px] border-collapse min-w-[500px]" {...props}>
                    {children}
                  </table>
                </div>
              ),
              thead: ({ node, children, ...props }) => (
                <thead className="bg-white/10 border-b border-border/80 text-accentPrimary uppercase text-[11px] font-mono tracking-wider" {...props}>
                  {children}
                </thead>
              ),
              tbody: ({ node, children, ...props }) => (
                <tbody className="divide-y divide-border/30" {...props}>
                  {children}
                </tbody>
              ),
              tr: ({ node, children, ...props }) => (
                <tr className="hover:bg-white/[0.04] transition-colors odd:bg-white/[0.015] even:bg-white/[0.035]" {...props}>
                  {children}
                </tr>
              ),
              th: ({ node, children, ...props }) => (
                <th className="px-3.5 py-2.5 font-semibold text-accentPrimary tracking-wider border-r border-border/40 last:border-r-0 whitespace-nowrap" {...props}>
                  {children}
                </th>
              ),
              td: ({ node, children, ...props }) => (
                <td className="px-3.5 py-2.5 text-textPrimary/90 border-r border-border/25 last:border-r-0 leading-relaxed" {...props}>
                  {children}
                </td>
              ),
              code: ({ node, inline, className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || '');
                const codeString = String(children).replace(/\n$/, '');
                if (!inline && (match || codeString.includes('\n'))) {
                  return <CodeBlock language={match ? match[1] : ''} value={codeString} />;
                }
                return (
                  <code className="px-1.5 py-0.5 mx-0.5 rounded bg-black/50 text-accentPrimary font-mono text-xs border border-white/10" {...props}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {msg.content}
          </ReactMarkdown>

          {/* Render Attached Widgets */}
          {msg.widgets && msg.widgets.length > 0 && (
            <div className="mt-5 pt-4 border-t border-border/50 flex flex-wrap gap-4 pointer-events-auto w-full items-start">
              {msg.widgets.includes('timetable') && <TimetableChatWidget />}
              {msg.widgets.includes('finances') && <FinanceChatWidget />}
              {msg.widgets.includes('workouts') && <WorkoutsChatWidget />}
              {msg.widgets.includes('calendar') && <CalendarChatWidget />}
              {msg.widgets.includes('weather') && (
                <div className="glass-panel p-5 rounded-xl border border-border w-full sm:w-[280px] flex items-center justify-center shadow-lg">
                  <WeatherWidget />
                </div>
              )}
              {msg.widgets.includes('system') && (
                <div className="w-full sm:w-[320px] h-[340px] shadow-lg">
                  <SystemMonitor />
                </div>
              )}
              {msg.widgets.includes('notifications') && (
                <div className="glass-panel p-2 rounded-xl border border-border w-full sm:w-[320px] h-[340px] shadow-lg">
                  <NotificationsWidget />
                </div>
              )}
              {msg.widgets.includes('news') && (
                <div className="w-full sm:w-[450px] h-[340px] shadow-lg">
                  <ITNewsTicker selectedCategories={window.__newsCategories || ['ai', 'security', 'hardware']} />
                </div>
              )}
              {msg.widgets.includes('tasks') && (
                <div className="w-full sm:w-[350px] h-[340px] shadow-lg">
                  <TodoList />
                </div>
              )}
              {msg.widgets.includes('models') && (
                <div className="w-full sm:w-[450px] h-[340px] shadow-lg">
                  <ModelWidget />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Terminal = () => {
  const { t } = useTranslation();
  const {
    mode, setMode,
    showThoughts, setShowThoughts,
    isProcessing,
    workerMessages,
    mentorMessages,
    daemonMessages,
    thoughtsLog,
    sendCommand
  } = useChatContext();

  const [newsCategories, setNewsCategories] = useState(['ai', 'security', 'hardware']);

  useEffect(() => {
    const savedCats = localStorage.getItem('system_news_categories');
    if (savedCats) {
      const parsed = JSON.parse(savedCats);
      setNewsCategories(parsed);
      window.__newsCategories = parsed;
    }
    const onNewsChanged = (e) => {
      setNewsCategories(e.detail);
      window.__newsCategories = e.detail;
    };
    window.addEventListener('newsCategoriesChanged', onNewsChanged);
    return () => window.removeEventListener('newsCategoriesChanged', onNewsChanged);
  }, []);

  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const endOfMessagesRef = useRef(null);

  const availableCommands = [
    { cmd: '/clear', desc: t('termCmdClear', 'Czyści ekran obecnego trybu') },
    { cmd: '/purge', desc: t('termCmdPurge', 'Agresywnie czyści pamięć i ekran') },
    { cmd: '/mode worker', desc: t('termCmdWorker', 'Przełącza na tryb inżynieryjny') },
    { cmd: '/mode mentor', desc: t('termCmdMentor', 'Przełącza na tryb analityczny') },
    { cmd: '/export', desc: t('termCmdExport', 'Zapisuje historię czatu do pliku TXT') },
    { cmd: '/ping', desc: t('termCmdPing', 'Sprawdza łączność i opóźnienie') },
    { cmd: '/help', desc: t('termCmdHelp', 'Wyświetla listę poleceń') }
  ];

  const filteredCommands = input.startsWith('/') 
    ? availableCommands.filter(c => c.cmd.toLowerCase().includes(input.toLowerCase()))
    : [];

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessingSpeech, setIsProcessingSpeech] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isManualMuted, setIsManualMuted] = useState(false);
  const [isGlobalMuted, setIsGlobalMuted] = useState(() => Boolean(wakeWordService.isManualMuted));

  const isLiveModeRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const isListeningRef = useRef(false);
  const isProcessingSpeechRef = useRef(false);
  const isAcousticCooldownRef = useRef(false);
  const isManualMutedRef = useRef(false);
  const lastAiResponseTextRef = useRef('');
  const aiSpeechEndTimeRef = useRef(0);
  const liveTranscriptRef = useRef('');
  const lastSpeechSentRef = useRef('');
  const liveRecognitionRef = useRef(null);
  const restartTimeoutRef = useRef(null);
  const vadTimeoutRef = useRef(null);

  const EXIT_PHRASES = [
    'stop', 'koniec', 'dziękuję', 'dziekuje', 'dzięki', 'dzieki',
    'zamknij', 'to wszystko', 'anuluj', 'wyłącz', 'do widzenia', 'nara'
  ];

  const toggleMicMute = () => {
    const nextMuted = !isManualMutedRef.current;
    isManualMutedRef.current = nextMuted;
    setIsManualMuted(nextMuted);

    if (nextMuted) {
      console.log('[Terminal LiveVoice 🔇] Mikrofon wyciszony manualnie przez operatora');
      if (vadTimeoutRef.current) {
        clearTimeout(vadTimeoutRef.current);
        vadTimeoutRef.current = null;
      }
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      if (liveRecognitionRef.current) {
        try {
          liveRecognitionRef.current.onstart = null;
          liveRecognitionRef.current.onresult = null;
          liveRecognitionRef.current.onerror = null;
          liveRecognitionRef.current.onend = null;
          liveRecognitionRef.current.abort();
        } catch {}
        liveRecognitionRef.current = null;
      }
      isListeningRef.current = false;
      setIsListening(false);
      setLiveTranscript('');
      liveTranscriptRef.current = '';
    } else {
      console.log('[Terminal LiveVoice 🎙️] Mikrofon odciszony przez operatora – wznawianie nasłuchu');
      if (isLiveModeRef.current && !isSpeakingRef.current && !isProcessingSpeechRef.current) {
        startLiveListeningLoop();
      }
    }
  };

  const stopLiveMode = (sayGoodbye = false) => {
    if (vadTimeoutRef.current) {
      clearTimeout(vadTimeoutRef.current);
      vadTimeoutRef.current = null;
    }
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    if (liveRecognitionRef.current) {
      try {
        liveRecognitionRef.current.onstart = null;
        liveRecognitionRef.current.onresult = null;
        liveRecognitionRef.current.onerror = null;
        liveRecognitionRef.current.onend = null;
        liveRecognitionRef.current.abort();
      } catch {}
      liveRecognitionRef.current = null;
    }
    ttsService.stop();
    wakeWordService.setAiSpeaking(false);
    wakeWordService.setLiveModeActive(false);

    isLiveModeRef.current = false;
    isSpeakingRef.current = false;
    isListeningRef.current = false;
    isProcessingSpeechRef.current = false;
    isAcousticCooldownRef.current = false;
    isManualMutedRef.current = false;
    lastAiResponseTextRef.current = '';
    aiSpeechEndTimeRef.current = 0;

    setIsLiveMode(false);
    setIsSpeaking(false);
    setIsListening(false);
    setIsProcessingSpeech(false);
    setIsManualMuted(false);
    setLiveTranscript('');
    liveTranscriptRef.current = '';

    if (sayGoodbye) {
      ttsService.speak('Do usłyszenia!', {
        onEnd: () => wakeWordService.start(),
        onError: () => wakeWordService.start()
      });
    } else {
      wakeWordService.start();
    }
  };

  const startLiveListeningLoop = () => {
    // BLOKADA: Nie uruchamiaj nasłuchu, jeśli asystent mówi, generuje odpowiedź, mikrofon jest wyciszony lub trwa wygaszanie pogłosu
    if (
      !isLiveModeRef.current ||
      isManualMutedRef.current ||
      isSpeakingRef.current ||
      isProcessingSpeechRef.current ||
      isAcousticCooldownRef.current ||
      ttsService.isSpeaking()
    ) {
      return;
    }
    if (typeof window === 'undefined' || !('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      return;
    }

    if (liveRecognitionRef.current) {
      try {
        liveRecognitionRef.current.onstart = null;
        liveRecognitionRef.current.onresult = null;
        liveRecognitionRef.current.onerror = null;
        liveRecognitionRef.current.onend = null;
        liveRecognitionRef.current.abort();
      } catch {}
      liveRecognitionRef.current = null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    const systemLang = localStorage.getItem('system_language') || 'pl';
    const langMap = { pl: 'pl-PL', en: 'en-US', uk: 'uk-UA', zh: 'zh-CN' };
    recognition.lang = langMap[systemLang] || 'pl-PL';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 5;

    recognition.onstart = () => {
      // Weryfikacja stanu w momencie rzeczywistego uruchomienia mikrofonu przez silnik przeglądarki
      if (
        !isLiveModeRef.current ||
        isManualMutedRef.current ||
        isSpeakingRef.current ||
        isProcessingSpeechRef.current ||
        isAcousticCooldownRef.current ||
        ttsService.isSpeaking()
      ) {
        try { recognition.abort(); } catch {}
        isListeningRef.current = false;
        setIsListening(false);
        return;
      }
      isListeningRef.current = true;
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      // BRAMKA BEZPIECZEŃSTWA: Całkowite wyciszenie i ignorowanie wejścia jeśli AI mówi, przetwarza lub wyciszono mikrofon
      if (
        !isLiveModeRef.current ||
        isManualMutedRef.current ||
        isSpeakingRef.current ||
        isProcessingSpeechRef.current ||
        isAcousticCooldownRef.current ||
        ttsService.isSpeaking()
      ) {
        console.log('[LiveVoice 🔇 Muted] Zignorowano dźwięk – mikrofon wyciszony');
        try { recognition.abort(); } catch {}
        isListeningRef.current = false;
        setIsListening(false);
        setLiveTranscript('');
        liveTranscriptRef.current = '';
        return;
      }

      let interim = '';
      let final = '';
      for (let i = 0; i < event.results.length; i++) {
        const text = event.results[i][0]?.transcript || '';
        if (event.results[i].isFinal) {
          final += text;
        } else {
          interim += text;
        }
      }
      const currentSpeech = (final || interim).trim();

      // FILTR ECHA AKUSTYCZNEGO (ACOUSTIC SELF-ECHO REJECTION):
      // Jeśli przechwycony tekst to fragment odpowiedzi, którą asystent przed chwilą odtworzył przez głośniki
      if (
        lastAiResponseTextRef.current &&
        (Date.now() - aiSpeechEndTimeRef.current < 5000) &&
        isAcousticEcho(currentSpeech, lastAiResponseTextRef.current)
      ) {
        console.warn('[LiveVoice 🛡️ Echo Cancellation] Odrzucono echo z głośników:', currentSpeech);
        setLiveTranscript('');
        liveTranscriptRef.current = '';
        return;
      }

      liveTranscriptRef.current = currentSpeech;
      setLiveTranscript(currentSpeech);

      // 1. Zdarzenie ukończenia wypowiedzi przez przeglądarkę
      if (final.trim()) {
        if (vadTimeoutRef.current) {
          clearTimeout(vadTimeoutRef.current);
          vadTimeoutRef.current = null;
        }
        try { recognition.abort(); } catch {}
        isListeningRef.current = false;
        setIsListening(false);
        lastSpeechSentRef.current = final.trim();
        handleLiveUserSpeech(final.trim());
        return;
      }

      // 2. INTELIGENTNY DETEKTOR PAUZY (VAD) W HAŁASIE:
      if (currentSpeech.length >= 2) {
        if (vadTimeoutRef.current) clearTimeout(vadTimeoutRef.current);
        vadTimeoutRef.current = setTimeout(() => {
          const speechToSend = liveTranscriptRef.current ? liveTranscriptRef.current.trim() : '';
          if (
            speechToSend &&
            speechToSend !== lastSpeechSentRef.current &&
            isLiveModeRef.current &&
            !isSpeakingRef.current &&
            !isProcessingSpeechRef.current &&
            !isAcousticCooldownRef.current &&
            !ttsService.isSpeaking()
          ) {
            // Ponowna weryfikacja echa przed wysłaniem
            if (
              lastAiResponseTextRef.current &&
              (Date.now() - aiSpeechEndTimeRef.current < 5000) &&
              isAcousticEcho(speechToSend, lastAiResponseTextRef.current)
            ) {
              console.warn('[LiveVoice 🛡️ VAD Echo Cancel] Odrzucono echo w VAD:', speechToSend);
              setLiveTranscript('');
              liveTranscriptRef.current = '';
              return;
            }

            console.log('[LiveVoice ⚡ VAD Auto-Send on Pause]:', speechToSend);
            if (vadTimeoutRef.current) clearTimeout(vadTimeoutRef.current);
            try { recognition.abort(); } catch {}
            isListeningRef.current = false;
            setIsListening(false);
            lastSpeechSentRef.current = speechToSend;
            handleLiveUserSpeech(speechToSend);
          }
        }, 650);
      }
    };

    recognition.onerror = (e) => {
      isListeningRef.current = false;
      setIsListening(false);
      if (
        isLiveModeRef.current &&
        e.error !== 'aborted' &&
        !isSpeakingRef.current &&
        !isProcessingSpeechRef.current &&
        !isAcousticCooldownRef.current &&
        !ttsService.isSpeaking()
      ) {
        if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = setTimeout(() => {
          if (
            isLiveModeRef.current &&
            !isSpeakingRef.current &&
            !isProcessingSpeechRef.current &&
            !isAcousticCooldownRef.current &&
            !ttsService.isSpeaking()
          ) {
            startLiveListeningLoop();
          }
        }, 500);
      }
    };

    recognition.onend = () => {
      isListeningRef.current = false;
      setIsListening(false);

      if (
        !isLiveModeRef.current ||
        isManualMutedRef.current ||
        isSpeakingRef.current ||
        isProcessingSpeechRef.current ||
        isAcousticCooldownRef.current ||
        ttsService.isSpeaking()
      ) {
        return;
      }

      // Zabezpieczenie dla cichej mowy
      const pendingSpeech = liveTranscriptRef.current ? liveTranscriptRef.current.trim() : '';
      if (
        pendingSpeech &&
        pendingSpeech !== lastSpeechSentRef.current &&
        !isAcousticEcho(pendingSpeech, lastAiResponseTextRef.current)
      ) {
        lastSpeechSentRef.current = pendingSpeech;
        liveTranscriptRef.current = '';
        setLiveTranscript('');
        handleLiveUserSpeech(pendingSpeech);
        return;
      }

      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = setTimeout(() => {
        if (
          isLiveModeRef.current &&
          !isSpeakingRef.current &&
          !isProcessingSpeechRef.current &&
          !isAcousticCooldownRef.current &&
          !ttsService.isSpeaking()
        ) {
          startLiveListeningLoop();
        }
      }, 200);
    };

    liveRecognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {}
  };

  const handleLiveUserSpeech = async (userText) => {
    if (!userText || !userText.trim()) return;

    // 1. NATYCHMIASTOWE WYCISZENIE MIKROFONU I PRZERWANIE RECOGNITION
    if (vadTimeoutRef.current) {
      clearTimeout(vadTimeoutRef.current);
      vadTimeoutRef.current = null;
    }
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    if (liveRecognitionRef.current) {
      try {
        liveRecognitionRef.current.onstart = null;
        liveRecognitionRef.current.onresult = null;
        liveRecognitionRef.current.onerror = null;
        liveRecognitionRef.current.onend = null;
        liveRecognitionRef.current.abort();
      } catch {}
      liveRecognitionRef.current = null;
    }
    isListeningRef.current = false;
    setIsListening(false);
    setLiveTranscript('');
    liveTranscriptRef.current = '';

    // Sprawdzenie słów kluczowych zakończenia rozmowy
    const lower = userText.toLowerCase().trim();
    const isExit = EXIT_PHRASES.some(phrase => lower === phrase || lower.startsWith(phrase + ' '));
    if (isExit) {
      stopLiveMode(true);
      return;
    }

    isProcessingSpeechRef.current = true;
    setIsProcessingSpeech(true);
    wakeWordService.setAiSpeaking(true);

    try {
      const responseObj = await sendCommand(userText);
      const text = typeof responseObj === 'string' ? responseObj : (responseObj?.content || '');

      lastAiResponseTextRef.current = text;
      isProcessingSpeechRef.current = false;
      setIsProcessingSpeech(false);

      // Odtwarzanie odpowiedzi głosowej z aktywnym wyciszeniem mikrofonu
      isSpeakingRef.current = true;
      setIsSpeaking(true);
      wakeWordService.setAiSpeaking(true);

      ttsService.speak(text, {
        onStart: () => {
          isSpeakingRef.current = true;
          setIsSpeaking(true);
          wakeWordService.setAiSpeaking(true);
          // Gwarancja braku aktywnego nasłuchu w trakcie mowy asystenta
          if (liveRecognitionRef.current) {
            try { liveRecognitionRef.current.abort(); } catch {}
            liveRecognitionRef.current = null;
          }
        },
        onEnd: () => {
          aiSpeechEndTimeRef.current = Date.now();
          isSpeakingRef.current = false;
          setIsSpeaking(false);
          isAcousticCooldownRef.current = true;
          wakeWordService.setAiSpeaking(false);
          setLiveTranscript('');
          liveTranscriptRef.current = '';

          // OCHRONA PRZED ECHEM AKUSTYCZNYM (ACOUSTIC TAIL GUARD):
          // Czekamy 600ms po zakończeniu mowy z głośników na całkowite wygaszenie fali dźwiękowej i pogłosu
          if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
          restartTimeoutRef.current = setTimeout(() => {
            isAcousticCooldownRef.current = false;
            if (isLiveModeRef.current && !isSpeakingRef.current && !isProcessingSpeechRef.current) {
              startLiveListeningLoop();
            }
          }, 600);
        },
        onError: () => {
          aiSpeechEndTimeRef.current = Date.now();
          isSpeakingRef.current = false;
          setIsSpeaking(false);
          isAcousticCooldownRef.current = false;
          wakeWordService.setAiSpeaking(false);
          if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
          restartTimeoutRef.current = setTimeout(() => {
            if (isLiveModeRef.current && !isSpeakingRef.current && !isProcessingSpeechRef.current) {
              startLiveListeningLoop();
            }
          }, 400);
        }
      });
    } catch (err) {
      console.error('[Terminal LiveVoice] Błąd zapytania:', err);
      isProcessingSpeechRef.current = false;
      setIsProcessingSpeech(false);
      isSpeakingRef.current = true;
      setIsSpeaking(true);
      ttsService.speak('Przepraszam, wystąpił błąd podczas przetwarzania zapytania.', {
        onEnd: () => {
          aiSpeechEndTimeRef.current = Date.now();
          isSpeakingRef.current = false;
          setIsSpeaking(false);
          wakeWordService.setAiSpeaking(false);
          if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
          restartTimeoutRef.current = setTimeout(() => {
            if (isLiveModeRef.current) startLiveListeningLoop();
          }, 500);
        },
        onError: () => {
          isSpeakingRef.current = false;
          setIsSpeaking(false);
          wakeWordService.setAiSpeaking(false);
          if (isLiveModeRef.current) startLiveListeningLoop();
        }
      });
    }
  };

  const enterLiveMode = (initialPayload = '') => {
    wakeWordService.setLiveModeActive(true);
    wakeWordService.stop();
    setIsLiveMode(true);
    isLiveModeRef.current = true;
    setLiveTranscript(initialPayload || '');

    if (initialPayload && initialPayload.trim()) {
      handleLiveUserSpeech(initialPayload.trim());
    } else {
      startLiveListeningLoop();
    }
  };

  const toggleLiveMode = () => {
    if (isLiveMode) {
      stopLiveMode(false);
    } else {
      enterLiveMode('');
    }
  };

  useEffect(() => {
    const handleStartContinuous = (e) => {
      const payload = e.detail?.payload || '';
      enterLiveMode(payload);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isLiveModeRef.current) {
        stopLiveMode(false);
      }
    };

    const handleMicMuteChanged = (e) => {
      const muted = Boolean(e.detail?.isMuted);
      setIsGlobalMuted(muted);
    };

    window.addEventListener('startContinuousLiveVoice', handleStartContinuous);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('omniMicMuteChanged', handleMicMuteChanged);

    return () => {
      window.removeEventListener('startContinuousLiveVoice', handleStartContinuous);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('omniMicMuteChanged', handleMicMuteChanged);
      stopLiveMode(false);
    };
  }, [mode]);


  const messages = mode === 'worker' ? workerMessages : (mode === 'daemon' ? daemonMessages : mentorMessages);

  const toggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        
        mediaRecorderRef.current.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        
        mediaRecorderRef.current.onstop = async () => {
          setIsTranscribing(true);
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          chunksRef.current = [];
          
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = async () => {
            try {
              const systemLang = localStorage.getItem('system_language') || 'pl';
              const langMap = { pl: 'pl', en: 'en', uk: 'uk', zh: 'zh' };
              const res = await fetch('/api/voice/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audioData: reader.result, language: langMap[systemLang] })
              });
              const data = await res.json();
              if (data.text) {
                setInput(prev => (prev ? prev + ' ' + data.text.trim() : data.text.trim()));
              }
            } catch (err) {
              console.error(err);
            } finally {
              setIsTranscribing(false);
              stream.getTracks().forEach(track => track.stop());
            }
          };
        };
        
        mediaRecorderRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error(t("termNoMic", "Brak dostępu do mikrofonu"), err);
      }
    }
  };

  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const messagesContainerRef = useRef(null);

  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const isFar = el.scrollHeight - el.scrollTop - el.clientHeight > 140;
    setShowScrollBottom(isFar);
  };

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollBottom(false);
  };

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userText = input.trim();
    setInput('');
    await sendCommand(userText);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden relative group">
      {/* HEADER: MODE SWITCHER */}
      <div className="flex justify-between items-center border-b border-border/50 pb-2 mb-3 shrink-0">
        <div className="flex bg-black/40 rounded-lg p-1 border border-border">
          <button 
            onClick={() => { setMode('worker'); setShowThoughts(false); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono transition-colors ${mode === 'worker' ? 'bg-accentPrimary text-black font-bold' : 'text-textMuted hover:text-textPrimary'}`}
          >
            <Code className="w-3.5 h-3.5" /> WORKER
          </button>
          <button 
            onClick={() => setMode('mentor')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono transition-colors ${mode === 'mentor' ? 'bg-accentPrimary text-black font-bold' : 'text-textMuted hover:text-textPrimary'}`}
          >
            <BrainCircuit className="w-3.5 h-3.5" /> MENTOR
          </button>
          <button 
            onClick={() => { setMode('daemon'); setShowThoughts(false); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono transition-colors ${mode === 'daemon' ? 'bg-accentPrimary text-black font-bold' : 'text-textMuted hover:text-textPrimary'}`}
          >
            <Bot className="w-3.5 h-3.5" /> OMNIDAEMON
          </button>
        </div>
        {mode === 'mentor' && (
          <button 
            onClick={() => setShowThoughts(!showThoughts)}
            className={`p-2 rounded-lg transition-colors border border-transparent ${showThoughts ? 'bg-accentPrimary text-black' : 'text-accentPrimary hover:bg-accentPrimary/20 hover:border-accentPrimary/50'}`}
            title={t("termThoughts", "Przemyślenia AI")}
          >
            <Lightbulb className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* LIVE VOICE BAR - Tryb Ciągłej Rozmowy z Wyciszeniem Mikrofonu Podczas Mowy AI */}
      {isLiveMode && (
        <div className={`mb-3 p-3 sm:p-3.5 rounded-2xl border transition-all duration-300 shadow-lg flex items-center justify-between gap-3 animate-fade-in shrink-0 ${
          isManualMuted
            ? 'bg-gradient-to-r from-amber-500/15 via-surface/95 to-amber-500/5 border-amber-500/40 shadow-amber-500/10'
            : isSpeaking 
              ? 'bg-gradient-to-r from-red-500/15 via-surface/95 to-red-500/5 border-red-500/40 shadow-red-500/10'
              : isProcessingSpeech
                ? 'bg-gradient-to-r from-blue-500/15 via-surface/95 to-blue-500/5 border-blue-500/40 shadow-blue-500/10'
                : 'bg-gradient-to-r from-accentPrimary/15 via-surface/95 to-accentPrimary/5 border-accentPrimary/40 shadow-accentPrimary/5'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className={`relative flex items-center justify-center w-8 h-8 rounded-xl shrink-0 transition-colors ${
              isManualMuted
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : isSpeaking
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                  : isProcessingSpeech
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                    : 'bg-accentPrimary/20 text-accentPrimary border border-accentPrimary/40'
            }`}>
              {isManualMuted ? (
                <MicOff className="w-4 h-4 text-amber-400" />
              ) : isSpeaking ? (
                <MicOff className="w-4 h-4 text-red-400 animate-pulse" />
              ) : isProcessingSpeech ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
              ) : (
                <Mic className="w-4 h-4 text-accentPrimary animate-pulse" />
              )}
              {isManualMuted && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500" />
              )}
              {isSpeaking && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              )}
              {!isManualMuted && !isSpeaking && !isProcessingSpeech && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-accentPrimary animate-ping" />
              )}
            </div>

            <div className="min-w-0 flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`font-mono text-xs font-bold tracking-wider uppercase ${
                  isManualMuted ? 'text-amber-300' : isSpeaking ? 'text-red-300' : isProcessingSpeech ? 'text-blue-300' : 'text-accentPrimary'
                }`}>
                  {isManualMuted
                    ? 'MIKROFON // WYCISZONY'
                    : isSpeaking 
                      ? (mode === 'mentor' ? 'OMNI MIND // ODPOWIADA...' : (mode === 'daemon' ? 'OMNIDAEMON // ODPOWIADA...' : 'OMNI EXEC // ODPOWIADA...')) 
                      : isProcessingSpeech 
                        ? (mode === 'mentor' ? 'OMNI MIND // ANALIZUJE...' : (mode === 'daemon' ? 'OMNIDAEMON // ANALIZUJE...' : 'OMNI EXEC // PRZETWARZA...')) 
                        : (mode === 'mentor' ? 'OMNI MIND // SŁUCHA...' : (mode === 'daemon' ? 'OMNIDAEMON // SŁUCHA...' : 'OMNI EXEC // SŁUCHA...'))}
                </span>
                {isManualMuted && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/25 text-amber-200 border border-amber-500/40 font-bold flex items-center gap-1">
                    <MicOff className="w-3 h-3" /> WYCISZONY (MANUALNIE)
                  </span>
                )}
                {!isManualMuted && isSpeaking && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/25 text-red-200 border border-red-500/40 font-bold flex items-center gap-1 animate-pulse">
                    <MicOff className="w-3 h-3" /> MIKROFON WYCISZONY (AI MÓWI)
                  </span>
                )}
                {!isManualMuted && isProcessingSpeech && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-200 border border-blue-500/40 font-semibold">
                    PRZETWARZANIE
                  </span>
                )}
                {!isManualMuted && !isSpeaking && !isProcessingSpeech && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accentPrimary/20 text-accentPrimary border border-accentPrimary/40 font-semibold flex items-center gap-1">
                    <Mic className="w-3 h-3" /> MIKROFON AKTYWNY
                  </span>
                )}
              </div>
              <p className="text-xs text-textMuted truncate italic font-mono mt-0.5">
                {isManualMuted
                  ? 'Mikrofon wyciszony (kliknij "Odcisz", aby wznowić rozmowę)...'
                  : liveTranscript 
                    ? `"${liveTranscript}"` 
                    : isSpeaking 
                      ? 'Mikrofon wyciszony, aby asystent nie słyszał samego siebie z głośników...' 
                      : isProcessingSpeech
                        ? 'Generowanie odpowiedzi...'
                        : 'Mów do mikrofonu (powiedz "dziękuję" lub "stop" aby zakończyć)...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {liveTranscript && !isManualMuted && !isSpeaking && !isProcessingSpeech && (
              <button
                type="button"
                onClick={() => {
                  if (vadTimeoutRef.current) clearTimeout(vadTimeoutRef.current);
                  try { liveRecognitionRef.current?.abort(); } catch {}
                  isListeningRef.current = false;
                  setIsListening(false);
                  const toSend = liveTranscript.trim();
                  lastSpeechSentRef.current = toSend;
                  handleLiveUserSpeech(toSend);
                }}
                className="px-3 py-1.5 rounded-xl bg-accentPrimary hover:bg-accentPrimary/90 text-black text-xs font-mono font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-[0_0_15px_rgba(var(--color-accent-primary),0.3)]"
                title="Wyślij zarejestrowaną mowę natychmiast"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Wyślij</span>
              </button>
            )}
            <button
              type="button"
              onClick={toggleMicMute}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold flex items-center gap-1.5 transition-all active:scale-95 ${
                isManualMuted
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                  : 'bg-surface hover:bg-surface/80 border-border/80 text-textMuted hover:text-textPrimary'
              }`}
              title={isManualMuted ? "Odcisz mikrofon" : "Wycisz mikrofon"}
            >
              {isManualMuted ? <Mic className="w-3.5 h-3.5 text-amber-300" /> : <MicOff className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isManualMuted ? "Odcisz" : "Wycisz"}</span>
            </button>
            <button
              type="button"
              onClick={() => stopLiveMode(true)}
              className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all active:scale-95"
              title="Zakończ rozmowę (Esc)"
            >
              <StopCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Zakończ</span>
            </button>
          </div>
        </div>
      )}

      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto space-y-3 font-sans text-sm mb-3 custom-scrollbar pr-2 relative"
      >
        {messages.map((msg, i) => (
          <ChatMessage key={msg.id || (msg.timestamp ? `${msg.role}_${msg.timestamp}` : `msg_${i}`)} msg={msg} mode={mode} />
        ))}
        {isProcessing && (
          <div className="flex items-center gap-2.5 text-textMuted font-sans p-3 glass-panel rounded-xl max-w-fit border border-border/50 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-accentPrimary" />
            <span className="text-xs font-mono">{mode === 'mentor' ? 'OMNI MIND analizuje zapytanie...' : (mode === 'daemon' ? 'OMNIDAEMON przetwarza zapytanie...' : 'OMNI EXEC przetwarza odpowiedź...')}</span>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Floating Scroll to Bottom button */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="absolute bottom-28 right-6 z-20 px-3.5 py-1.5 rounded-full bg-surface/90 backdrop-blur-md border border-accentPrimary/50 text-accentPrimary shadow-2xl text-xs font-mono flex items-center gap-1.5 hover:bg-accentPrimary hover:text-black transition-all animate-fade-in"
        >
          <ArrowDown className="w-3.5 h-3.5" />
          <span>Przewiń na dół</span>
        </button>
      )}

      {/* Quick Prompt Chips */}
      {!isLiveMode && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar shrink-0 touch-pan-x -mx-1 px-1">
          {QUICK_PROMPTS.map((qp, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => sendCommand(qp.text)}
              disabled={isProcessing}
              className="shrink-0 px-3 py-1 rounded-full text-xs font-sans font-medium bg-surface/80 border border-border/60 text-textMuted hover:text-textPrimary hover:border-accentPrimary/50 hover:bg-accentPrimary/10 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              {qp.label}
            </button>
          ))}
        </div>
      )}

      {/* Autocomplete Dropdown */}
      {filteredCommands.length > 0 && (
        <div className="absolute bottom-16 left-2 right-2 sm:right-auto sm:left-4 z-20 bg-background border-2 border-border rounded-xl shadow-2xl shadow-black/80 p-2 sm:min-w-[280px] animate-fade-in-up">
          {filteredCommands.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => { setInput(item.cmd + ' '); document.getElementById('chat-input')?.focus(); }}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-accentPrimary/10 flex flex-col transition-colors group"
            >
              <span className="font-mono text-sm text-accentPrimary group-hover:text-textPrimary">{item.cmd}</span>
              <span className="text-[10px] text-textMuted uppercase tracking-wider">{item.desc}</span>
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative flex items-center bg-surface border border-border rounded-full px-3 py-1.5 sm:px-4 sm:py-2 gap-1.5 sm:gap-2 shadow-sm focus-within:border-accentPrimary focus-within:ring-1 focus-within:ring-accentPrimary transition-all">

        <button 
          type="button" 
          onClick={toggleLiveMode}
          className={`p-1.5 sm:p-2 rounded-full transition-all flex items-center justify-center shrink-0 active:scale-95 ${isLiveMode ? 'bg-accentPrimary text-black animate-pulse shadow-[0_0_15px_currentColor]' : 'text-textMuted hover:text-accentPrimary hover:bg-accentPrimary/10'}`}
          title={t("termContinuousMode", "Tryb ciągłej rozmowy")}
        >
          <Radio className="w-4 h-4" />
        </button>
        <button 
          type="button" 
          onClick={() => wakeWordService.toggleMute()}
          className={`p-1.5 sm:p-2 rounded-full transition-all flex items-center justify-center shrink-0 active:scale-95 ${
            isGlobalMuted
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
              : 'text-textMuted hover:text-accentPrimary hover:bg-accentPrimary/10'
          }`}
          title={isGlobalMuted ? "Odcisz mikrofon (nasłuch 'Hej Omni')" : "Wycisz mikrofon (zatrzymaj nasłuch 'Hej Omni')"}
        >
          {isGlobalMuted ? <MicOff className="w-4 h-4 text-amber-400" /> : <Mic className="w-4 h-4" />}
        </button>
        <button 
          type="button" 
          onClick={toggleRecording}
          disabled={isTranscribing}
          className={`p-1.5 sm:p-2 rounded-full transition-all flex items-center justify-center shrink-0 active:scale-95 ${isRecording ? 'bg-red-500/20 text-red-500 animate-pulse' : 'text-textMuted hover:text-accentPrimary hover:bg-accentPrimary/10'}`}
          title={t("termVoiceRecord", "Nagrywanie głosowe")}
        >
          {isTranscribing ? <Loader2 className="w-4 h-4 animate-spin text-accentPrimary" /> : <Mic className="w-4 h-4" />}
        </button>
        <input 
          id="chat-input"
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Napisz wiadomość..."
          className="flex-1 min-w-0 bg-transparent border-none outline-none font-sans text-xs sm:text-sm text-textPrimary placeholder:text-textMuted"
          autoComplete="off"
          autoFocus
        />
        <button type="submit" disabled={isProcessing || !input.trim()} className="text-accentPrimary hover:text-textPrimary transition-colors disabled:opacity-50 p-1.5 sm:p-2 shrink-0 active:scale-95">
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Pane z przemyśleniami */}
      {showThoughts && mode === 'mentor' && (
        <div className="absolute top-12 right-2 w-64 bg-background border border-accentPrimary/40 rounded-xl shadow-[0_0_20px_rgba(var(--color-accent-primary),0.15)] z-10 flex flex-col overflow-hidden animate-fade-in-up">
          <div className="p-3 border-b border-border/50 flex justify-between items-center bg-black/20">
            <span className="font-mono text-[10px] uppercase text-accentPrimary font-bold tracking-wider flex items-center gap-2">
              <Lightbulb className="w-3 h-3" /> {t("termInternalLog", "Wewnętrzny Dziennik")}
            </span>
            <button onClick={() => setShowThoughts(false)} className="text-textMuted hover:text-textPrimary"><X className="w-3 h-3" /></button>
          </div>
          <div className="p-3 text-[10px] text-textMuted font-mono leading-relaxed space-y-2 h-40 overflow-y-auto custom-scrollbar">
            {thoughtsLog.map((log, idx) => (
              <p key={idx} className="border-b border-border/30 pb-2 mb-2 last:border-0">{log}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Terminal;
