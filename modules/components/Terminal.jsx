import React, { useState, useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, Send, Code, BrainCircuit, Lightbulb, X, Mic, Loader2, Copy, Check, Radio, User, Sparkles, Volume2, VolumeX, ArrowDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import WeatherWidget from './WeatherWidget';
import ITNewsTicker from './ITNewsTicker';
import SystemMonitor from './SystemMonitor';
import TodoList from './TodoList';
import ModelWidget from './ModelWidget';
import NotificationsWidget from './NotificationsWidget';
import { useChatContext } from '../context/ChatContext';

const QUICK_PROMPTS = [
  { label: '📋 Zadania To-Do', text: 'witam serdecznie co mamy dziś w todo?' },
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
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const clean = (msg.content || '')
      .replace(/[*_~`#>-]/g, ' ')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = 'pl-PL';
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if (isSpeaking && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
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
              {mode === 'mentor' ? <BrainCircuit className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
            </div>
            <span className="font-mono font-bold text-textPrimary tracking-wide">
              {mode === 'mentor' ? 'J.A.R.V.I.S' : 'F.R.I.D.A.Y'}
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
                <div className="my-3 overflow-x-auto rounded-xl border border-border/60 shadow-md">
                  <table className="w-full text-left text-xs md:text-sm border-collapse" {...props}>
                    {children}
                  </table>
                </div>
              ),
              thead: ({ node, children, ...props }) => (
                <thead className="bg-white/5 border-b border-border/80 text-accentPrimary uppercase text-[11px] font-mono tracking-wider" {...props}>
                  {children}
                </thead>
              ),
              th: ({ node, children, ...props }) => (
                <th className="px-3.5 py-2.5 font-semibold" {...props}>{children}</th>
              ),
              td: ({ node, children, ...props }) => (
                <td className="px-3.5 py-2 border-b border-border/30 text-textPrimary/90" {...props}>{children}</td>
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
  const [liveModeWidgets, setLiveModeWidgets] = useState([]);
  const [liveModeSummary, setLiveModeSummary] = useState('');
  const liveRecognitionRef = useRef(null);
  const isLiveModeRef = useRef(false);

  useEffect(() => {
    isLiveModeRef.current = isLiveMode;
    if (!isLiveMode) {
      setLiveModeWidgets([]);
      setLiveModeSummary('');
      setIsSpeaking(false);
      setIsListening(false);
    }
  }, [isLiveMode]);

  // Pobierz głosy jak najszybciej
  useEffect(() => {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }, []);

  const startLiveConversation = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert(t("termNoSpeech", "Twoja przeglądarka nie obsługuje SpeechRecognition."));
      setIsLiveMode(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    const systemLang = localStorage.getItem('system_language') || 'pl';
    const langMap = { pl: 'pl-PL', en: 'en-US', uk: 'uk-UA', zh: 'zh-CN' };
    const speechLang = langMap[systemLang] || 'pl-PL';

    recognition.lang = speechLang;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      if (!transcript.trim()) {
         if (isLiveModeRef.current && !isSpeaking) recognition.start();
         return;
      }
      
      setIsListening(false);
      const aiResponseObj = await sendCommand(transcript);
      if (aiResponseObj && isLiveModeRef.current) {
         let rawText = typeof aiResponseObj === 'string' ? aiResponseObj : aiResponseObj.content;
         const widgets = typeof aiResponseObj === 'object' ? (aiResponseObj.widgets || []) : [];
         
         // Funkcja czyszcząca tekst z Markdownu i emotikon specjalnie dla TTS
         const cleanTextForSpeech = (str) => {
             return str
                 // Usuwanie znaków formatowania Markdown
                 .replace(/[*_~`#>-]/g, ' ')
                 // Usuwanie linków i obrazków markdown np. [tekst](url) -> tekst
                 .replace(/\[(.*?)\]\(.*?\)/g, '$1')
                 // Usuwanie emotikon (nowoczesny regex)
                 .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')
                 // Redukcja wielokrotnych spacji do pojedynczych
                 .replace(/\s+/g, ' ')
                 .trim();
         };
         
         const textToSpeak = cleanTextForSpeech(rawText);
         
         setLiveModeSummary(rawText);
         setLiveModeWidgets(widgets);
         
         window.speechSynthesis.cancel();
         const utterance = new SpeechSynthesisUtterance(textToSpeak);
         utterance.lang = speechLang;
         
         const voices = window.speechSynthesis.getVoices();
         const voicePref = localStorage.getItem('system_voice_pref') || 'paulina';
         const voiceRate = parseFloat(localStorage.getItem('system_voice_rate')) || 1.8;
         
         let selectedVoice;
         const shortLang = systemLang;
         
         if (shortLang === 'pl') {
           if (voicePref === 'female' || voicePref === 'paulina') {
              selectedVoice = voices.find(v => v.name.toLowerCase().includes('paulina') || v.name.toLowerCase().includes('zofia')) || voices.find(v => v.lang.includes('pl') && !v.name.toLowerCase().includes('male') && !v.name.toLowerCase().includes('marek'));
           } else {
              selectedVoice = voices.find(v => v.name.toLowerCase().includes('marek') || v.name.toLowerCase().includes('adam')) || voices.find(v => v.lang.includes('pl') && (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('mężczyzna')));
           }
         }
         
         if (!selectedVoice) selectedVoice = voices.find(v => v.lang.includes(shortLang));
         if (selectedVoice) utterance.voice = selectedVoice;
         
         utterance.pitch = 1.15;
         utterance.rate = voiceRate;

         utterance.onstart = () => setIsSpeaking(true);
         utterance.onend = () => {
           setIsSpeaking(false);
           if (isLiveModeRef.current) {
             try { liveRecognitionRef.current.start(); } catch(e){}
           }
         };
         window.speechSynthesis.speak(utterance);
      } else {
         if (isLiveModeRef.current && !isSpeaking) {
             try { liveRecognitionRef.current.start(); } catch(e){}
         }
      }
    };

    recognition.onerror = (e) => {
      console.error('Speech recognition error', e.error);
      setIsListening(false);
      if (isLiveModeRef.current && e.error !== 'aborted' && !isSpeaking) {
         setTimeout(() => {
            try { liveRecognitionRef.current.start(); } catch(e){}
         }, 1000);
      }
    };
    
    recognition.onend = () => {
       setIsListening(false);
    };

    liveRecognitionRef.current = recognition;
    try { recognition.start(); } catch(e){}
  };

  const toggleLiveMode = () => {
    if (isLiveMode) {
      setIsLiveMode(false);
      window.speechSynthesis.cancel();
      if (liveRecognitionRef.current) {
        liveRecognitionRef.current.abort();
      }
    } else {
      setIsLiveMode(true);
      startLiveConversation();
    }
  };


  const messages = mode === 'worker' ? workerMessages : mentorMessages;

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

      {isLiveMode ? (
        <div className="flex-1 flex flex-col items-center justify-center relative bg-background/50 backdrop-blur-sm rounded-xl mb-4 overflow-hidden animate-fade-in">
          
          <div className={`transition-all duration-700 ease-in-out flex flex-col items-center ${liveModeWidgets.length > 0 || liveModeSummary ? 'absolute top-6 scale-75' : 'absolute top-1/2 -translate-y-1/2 scale-150'}`}>
            <div 
              className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 relative ${isSpeaking ? 'scale-110 shadow-[0_0_50px_rgba(var(--color-accent-primary),0.8)] bg-accentPrimary/20' : (isListening ? 'scale-100 shadow-[0_0_20px_rgba(var(--color-accent-primary),0.4)] bg-accentPrimary/5' : 'scale-90 opacity-50 bg-transparent border border-accentPrimary/30')}`}
            >
               <div className={`w-20 h-20 rounded-full bg-accentPrimary transition-all duration-300 ${isSpeaking ? 'animate-pulse opacity-80' : 'opacity-20'}`}></div>
               <div className={`absolute inset-0 rounded-full border-2 border-accentPrimary transition-all duration-[3000ms] ${isListening ? 'animate-spin opacity-50' : 'opacity-10'}`} style={{ borderStyle: 'dashed' }}></div>
            </div>
            <div className="mt-4 font-mono text-sm tracking-widest text-accentPrimary opacity-80">
              {isSpeaking ? t('termJarvisSpeaks', 'JARVIS // MÓWI') : (isListening ? t('termJarvisListens', 'JARVIS // NASŁUCHUJE') : t('termJarvisWaits', 'JARVIS // OCZEKUJE'))}
            </div>
          </div>

          <div className={`absolute bottom-4 left-4 right-4 transition-all duration-700 flex flex-col gap-4 overflow-y-auto custom-scrollbar h-[calc(100%-12rem)] ${liveModeWidgets.length > 0 || liveModeSummary ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20 pointer-events-none'}`}>
            
            {liveModeSummary && (
              <div className="glass-panel p-4 rounded-xl text-center text-textPrimary text-lg font-mono">
                <ReactMarkdown
                  components={{
                    p: ({node, ...props}) => <span {...props} />,
                    strong: ({node, ...props}) => <strong className="font-bold text-accentPrimary" {...props} />,
                    em: ({node, ...props}) => <em className="italic text-accentSecondary" {...props} />
                  }}
                >
                  {liveModeSummary}
                </ReactMarkdown>
              </div>
            )}
            
            {liveModeWidgets.length > 0 && (
              <div className="flex flex-wrap gap-4 items-start justify-center">
                {liveModeWidgets.includes('weather') && <div className="glass-panel p-4 rounded-xl"><WeatherWidget /></div>}
                {liveModeWidgets.includes('system') && <div className="w-full sm:w-[320px] h-[340px]"><SystemMonitor /></div>}
                {liveModeWidgets.includes('notifications') && <div className="glass-panel p-2 rounded-xl w-full sm:w-[320px] h-[340px]"><NotificationsWidget /></div>}
                {liveModeWidgets.includes('news') && <div className="w-full sm:w-[450px] h-[340px]"><ITNewsTicker selectedCategories={newsCategories} /></div>}
                {liveModeWidgets.includes('tasks') && <div className="w-full sm:w-[350px] h-[340px]"><TodoList /></div>}
                {liveModeWidgets.includes('models') && <div className="w-full sm:w-[450px] h-[340px]"><ModelWidget /></div>}
              </div>
            )}
          </div>

        </div>
      ) : (
        <div 
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto space-y-3 font-sans text-sm mb-3 custom-scrollbar pr-2 relative"
        >
          {messages.map((msg, i) => (
            <ChatMessage key={i} msg={msg} mode={mode} />
          ))}
          {isProcessing && (
            <div className="flex items-center gap-2.5 text-textMuted font-sans p-3 glass-panel rounded-xl max-w-fit border border-border/50 animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-accentPrimary" />
              <span className="text-xs font-mono">{mode === 'mentor' ? 'J.A.R.V.I.S analizuje zapytanie...' : 'F.R.I.D.A.Y przetwarza odpowiedź...'}</span>
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </div>
      )}

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
