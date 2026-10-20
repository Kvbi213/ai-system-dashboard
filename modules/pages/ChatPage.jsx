import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import { useChatContext } from '../context/ChatContext';
import { wakeWordService, isAcousticEcho, cleanTextForSpeech } from '../services/wakeWordService';
import { ttsService } from '../services/ttsService';

const AVAILABLE_MODELS = [
  'Groq LPU (120B)',
  'Claude 3.5 Sonnet',
  'Llama 3.3 70B Turbo'
];

const DEFAULT_TOOLS = [
  { id: 'tool_db', name: 'Firestore / SQLite Tool', active: true },
  { id: 'tool_librus', name: 'Librus Schedule Fetcher', active: true },
  { id: 'tool_push', name: 'Pushbullet Dispatcher', active: true },
  { id: 'tool_osint', name: 'OSINT & DNS Resolver', active: true },
  { id: 'tool_workout', name: 'Workout & Reps Tracker', active: true },
];

const DEFAULT_THREADS = [
  { id: 'th1', title: 'Analiza treningu FBW & Librus', date: 'Dzisiaj', time: '12:14', active: true },
  { id: 'th2', title: 'Optymalizacja zapytań SQLite', date: 'Wczoraj', time: '19:40', active: false },
  { id: 'th3', title: 'OSINT rekonesans IP ASN4812', date: '12 Paź', time: '22:05', active: false },
];

const EXIT_PHRASES = [
  'stop', 'koniec', 'dziękuję', 'dziekuje', 'dzięki', 'dzieki',
  'zamknij', 'to wszystko', 'anuluj', 'wyłącz', 'do widzenia', 'nara'
];

// Odtwarzanie natychmiastowego czystego dźwięku potwierdzenia wybudzenia (Web Audio API)
const playChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.12);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1320, now + 0.08);
    gain2.gain.setValueAtTime(0.14, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.25);
  } catch (e) {
    // Cichy fallback w przypadku braku uprawnień audio
  }
};

const ChatPage = () => {
  const { t } = useTranslation();
  const { workerMessages, setWorkerMessages, sendCommand, isProcessing } = useChatContext();

  const [inputMessage, setInputMessage] = useState('');
  const [modelIdx, setModelIdx] = useState(0);
  const [toolsList, setToolsList] = useState(DEFAULT_TOOLS);
  const [threads, setThreads] = useState(DEFAULT_THREADS);
  const [activeThreadId, setActiveThreadId] = useState('th1');
  const [tokensMeta, setTokensMeta] = useState({ in: 1420, out: 388, cost: '$0.0004' });
  const [showClearToast, setShowClearToast] = useState(false);
  const [copyToast, setCopyToast] = useState(false);

  // Live Continuous Voice Conversation States
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessingSpeech, setIsProcessingSpeech] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');

  // Refs do sterowania bezkolizyjną pętlą mowy
  const isLiveModeRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const isListeningRef = useRef(false);
  const isProcessingSpeechRef = useRef(false);
  const isAcousticCooldownRef = useRef(false);
  const lastAiResponseTextRef = useRef('');
  const aiSpeechEndTimeRef = useRef(0);
  const liveTranscriptRef = useRef('');
  const lastSpeechSentRef = useRef('');
  const liveRecognitionRef = useRef(null);
  const restartTimeoutRef = useRef(null);
  const vadTimeoutRef = useRef(null);
  const dialogueBoxRef = useRef(null);

  // Auto-scroll do dołu przy nowych wiadomościach
  useEffect(() => {
    if (dialogueBoxRef.current) {
      dialogueBoxRef.current.scrollTop = dialogueBoxRef.current.scrollHeight;
    }
  }, [workerMessages, liveTranscript]);

  const toggleTool = (id) => {
    setToolsList(prev => prev.map(tool => 
      tool.id === id ? { ...tool, active: !tool.active } : tool
    ));
  };

  const handleNextModel = () => {
    setModelIdx((modelIdx + 1) % AVAILABLE_MODELS.length);
  };

  const handleClearContext = () => {
    setWorkerMessages([]);
    setShowClearToast(true);
    setTimeout(() => setShowClearToast(false), 2500);
  };

  const handleExportLog = () => {
    const exportContent = workerMessages.map(m => `[${(m.role || 'SYS').toUpperCase()}] ${m.content}`).join('\n\n');
    const blob = new Blob([exportContent || 'OmniDash Chat Log'], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Omni-Log-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Wysłanie wiadomości tekstowej przez input
  const onSendMessage = async (e) => {
    if (e) e.preventDefault();
    const text = inputMessage.trim();
    if (!text) return;

    setInputMessage('');
    setTokensMeta(prev => ({
      in: prev.in + Math.round(text.length / 4),
      out: prev.out + 45,
      cost: `$${(parseFloat(prev.cost.replace('$', '')) + 0.0001).toFixed(4)}`
    }));

    if (sendCommand) {
      await sendCommand(text);
    }
  };

  // -------------------------------------------------------------
  // CONTINUOUS LIVE VOICE ENGINE (PĘTLA MOWY I TRANSKRYPCJI LIVE)
  // -------------------------------------------------------------

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
    lastAiResponseTextRef.current = '';
    aiSpeechEndTimeRef.current = 0;

    setIsLiveMode(false);
    setIsSpeaking(false);
    setIsListening(false);
    setIsProcessingSpeech(false);
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
    // Blokada: nie uruchamiaj mikrofonu jeśli AI mówi, przetwarza zapytanie lub trwa wygaszanie echa
    if (
      !isLiveModeRef.current ||
      isSpeakingRef.current ||
      isProcessingSpeechRef.current ||
      isAcousticCooldownRef.current ||
      ttsService.isSpeaking()
    ) {
      return;
    }
    if (typeof window === 'undefined' || !('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      console.warn('[Chat LiveVoice] SpeechRecognition nie jest wspierane w tej przeglądarce.');
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
    recognition.lang = 'pl-PL';
    recognition.continuous = false; // Pojedyncza tura z automatycznym restartem gwarantuje 100% stabilność w Chrome/Edge
    recognition.interimResults = true;
    recognition.maxAlternatives = 5;

    recognition.onstart = () => {
      if (
        !isLiveModeRef.current ||
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
      if (
        !isLiveModeRef.current ||
        isSpeakingRef.current ||
        isProcessingSpeechRef.current ||
        isAcousticCooldownRef.current ||
        ttsService.isSpeaking()
      ) {
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

      // Filtr echa akustycznego (zapobieganie odpowiedzi na własne głośniki)
      if (
        lastAiResponseTextRef.current &&
        (Date.now() - aiSpeechEndTimeRef.current < 5000) &&
        isAcousticEcho(currentSpeech, lastAiResponseTextRef.current)
      ) {
        console.warn('[Chat LiveVoice Echo Guard] Odrzucono echo wypowiedzi AI:', currentSpeech);
        setLiveTranscript('');
        liveTranscriptRef.current = '';
        return;
      }

      liveTranscriptRef.current = currentSpeech;
      setLiveTranscript(currentSpeech);

      // 1. Otrzymano ostateczny wynik mowy (isFinal = true)
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

      // 2. VAD: Detekcja pauzy w mowie (650ms ciszy zatwierdza wypowiedź)
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
        isSpeakingRef.current ||
        isProcessingSpeechRef.current ||
        isAcousticCooldownRef.current ||
        ttsService.isSpeaking()
      ) {
        return;
      }

      // Jeśli w buforze została wypowiedź, która nie została wysłana
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

      // W przeciwnym razie kontynuuj pętlę nasłuchu
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
    } catch (err) {
      console.warn('[Chat LiveVoice] Błąd startu SpeechRecognition:', err.message);
    }
  };

  const handleLiveUserSpeech = async (userText) => {
    if (!userText || !userText.trim()) return;

    // Natychmiastowe zatrzymanie mikrofonu i czyszczenie buforów
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

    // Sprawdzenie słów wyjścia z pętli mowy
    const lower = userText.toLowerCase().trim();
    const isExit = EXIT_PHRASES.some(phrase => lower === phrase || lower.startsWith(phrase + ' '));
    if (isExit) {
      stopLiveMode(true);
      return;
    }

    // Stan przetwarzania zapytania AI
    isProcessingSpeechRef.current = true;
    setIsProcessingSpeech(true);
    wakeWordService.setAiSpeaking(true);

    try {
      let responseObj = null;
      if (sendCommand) {
        responseObj = await sendCommand(userText);
      }
      const rawText = typeof responseObj === 'string' ? responseObj : (responseObj?.content || '');

      lastAiResponseTextRef.current = rawText;
      isProcessingSpeechRef.current = false;
      setIsProcessingSpeech(false);

      // Odtwarzanie odpowiedzi głosowej przez wybrany silnik TTS
      isSpeakingRef.current = true;
      setIsSpeaking(true);
      wakeWordService.setAiSpeaking(true);

      const speechClean = cleanTextForSpeech(rawText);

      ttsService.speak(speechClean, {
        onStart: () => {
          isSpeakingRef.current = true;
          setIsSpeaking(true);
          wakeWordService.setAiSpeaking(true);
        },
        onEnd: () => {
          aiSpeechEndTimeRef.current = Date.now();
          isSpeakingRef.current = false;
          setIsSpeaking(false);
          isAcousticCooldownRef.current = true;
          wakeWordService.setAiSpeaking(false);
          setLiveTranscript('');
          liveTranscriptRef.current = '';

          // Ochrona przed echem: odczekanie 600ms po mowie z głośnika, po czym automatyczne wznowienie pętli!
          if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
          restartTimeoutRef.current = setTimeout(() => {
            isAcousticCooldownRef.current = false;
            if (isLiveModeRef.current && !isSpeakingRef.current && !isProcessingSpeechRef.current) {
              startLiveListeningLoop(); // AUTOMATYCZNY START KOLEJNEJ TURY ROZMOWY!
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
      console.error('[Chat LiveVoice] Błąd zapytania mowy:', err);
      isProcessingSpeechRef.current = false;
      setIsProcessingSpeech(false);
      isSpeakingRef.current = true;
      setIsSpeaking(true);
      ttsService.speak('Wystąpił problem podczas przetwarzania zapytania.', {
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

    if (initialPayload && initialPayload.trim()) {
      handleLiveUserSpeech(initialPayload.trim());
    } else {
      playChime();
      startLiveListeningLoop();
    }
  };

  const toggleLiveVoiceMode = () => {
    if (isLiveMode) {
      stopLiveMode(false);
    } else {
      enterLiveMode('');
    }
  };

  // Rejestracja nasłuchu zdarzeń z GlobalEventListener i skrótów klawiaturowych
  useEffect(() => {
    // 1. Sprawdź czy po przekierowaniu z innej strony czeka zapytanie w sessionStorage
    try {
      const pending = sessionStorage.getItem('pending_voice_payload');
      if (pending !== null) {
        sessionStorage.removeItem('pending_voice_payload');
        const actualPayload = pending === '__EMPTY__' ? '' : pending;
        enterLiveMode(actualPayload);
      }
    } catch {}

    // 2. Obsłuż zdarzenie startContinuousLiveVoice rozsyłane globalnie
    const handleStartContinuous = (e) => {
      const payload = e.detail?.payload || '';
      enterLiveMode(payload);
    };

    // 3. Obsłuż bezpośrednie wybudzenie jeśli użytkownik jest już na /chat
    const handleDirectWakeWord = (e) => {
      const payload = e.detail?.payload || '';
      enterLiveMode(payload);
    };

    // 4. Klawisz Escape natychmiastowo zamyka tryb mowy
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isLiveModeRef.current) {
        stopLiveMode(false);
      }
    };

    window.addEventListener('startContinuousLiveVoice', handleStartContinuous);
    window.addEventListener('wakeWordDetected', handleDirectWakeWord);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('startContinuousLiveVoice', handleStartContinuous);
      window.removeEventListener('wakeWordDetected', handleDirectWakeWord);
      window.removeEventListener('keydown', handleKeyDown);
      stopLiveMode(false);
    };
  }, []);

  const handleQuickAction = (action) => {
    if (action === 'copy') {
      navigator.clipboard?.writeText("Sprawdziłem Twój dzisiejszy harmonogram. O 12:45 masz okienko (odwołana lekcja fizyki)...");
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2000);
    } else if (action === 'timer') {
      window.location.hash = '#timer';
      alert('Stoper sesji został zainicjalizowany.');
    } else if (action === 'pushbullet') {
      alert('Plan treningowy i harmonogram wysłany na smartfon przez Pushbullet.');
    }
  };

  const activeToolsCount = useMemo(() => {
    return toolsList.filter(t => t.active).length;
  }, [toolsList]);

  return (
    <div className="flex flex-col w-full h-full gap-space-md custom-scrollbar pb-24 md:pb-6 font-body-md text-on-surface max-w-full overflow-x-hidden">
      
      {/* Dynamic Atmospheric Glow Accent */}
      <div className="relative w-full overflow-hidden rounded-xl bg-surface-container-lowest p-space-md shadow-sm border border-outline-variant/30">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none"></div>
        <div className="absolute -left-12 -bottom-12 h-48 w-48 rounded-full bg-secondary-container/20 blur-2xl pointer-events-none"></div>
        
        {/* Top Sub-Bar & Status Metas */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-sm flex-wrap">
              <span className="text-base sm:text-headline-lg text-on-surface font-semibold tracking-tight">
                Omni Chat AI • Groq LPU Engine
              </span>
              <span className="px-space-sm py-0.5 rounded-full bg-surface-container-high text-primary font-code-mono text-code-mono text-xs flex items-center gap-1.5 border border-outline-variant/40">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                GPT-OSS-120B
              </span>
            </div>
            <p className="text-xs sm:text-body-md text-on-surface-variant max-w-2xl">
              Autonomiczne wywoływanie narzędzi (Tool Calling) • Ciągła konwersacja głosowa Live Voice • Wykrywanie słowa „Hej Omni”
            </p>
          </div>

          {/* Action Cluster */}
          <div className="flex items-center gap-space-xs flex-wrap">
            <button 
              onClick={handleClearContext}
              className="flex items-center gap-space-xs px-space-md py-space-xs rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-label-md font-label-md transition-colors shadow-sm active:scale-95 border border-outline-variant/30" 
              type="button"
            >
              <span className="material-symbols-outlined text-[16px] text-outline">history_toggle_off</span>
              <span>Wyczyść kontekst</span>
            </button>
            
            <div className="relative inline-block text-left">
              <button 
                onClick={handleNextModel}
                className="flex items-center gap-space-xs px-space-md py-space-xs rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-label-md font-label-md transition-colors shadow-sm active:scale-95 border border-outline-variant/30" 
                type="button"
              >
                <span className="material-symbols-outlined text-[16px] text-primary">memory</span>
                <span>{AVAILABLE_MODELS[modelIdx]}</span>
                <span className="material-symbols-outlined text-[16px] text-outline">expand_more</span>
              </button>
            </div>

            <button 
              onClick={handleExportLog}
              className="flex items-center gap-space-xs px-space-md py-space-xs rounded-lg bg-primary text-on-primary hover:opacity-90 text-label-md font-label-md transition-colors shadow-sm font-semibold active:scale-95"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">file_upload</span>
              <span>Eksport [[Omni-Log]]</span>
            </button>
          </div>
        </div>

        {/* Badges Row */}
        <div className="relative z-10 mt-space-md pt-space-sm flex items-center gap-space-xs flex-wrap border-t border-outline-variant/20">
          <div className="flex items-center gap-space-xs px-space-sm py-0.5 rounded-full bg-surface-container text-on-surface font-code-mono text-code-mono text-xs border border-outline-variant/30">
            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
            <span className="text-outline">Engine:</span>
            <span className="font-semibold text-primary">{AVAILABLE_MODELS[modelIdx]} (Active)</span>
          </div>
          <div className="flex items-center gap-space-xs px-space-sm py-0.5 rounded-full bg-surface-container text-on-surface font-code-mono text-code-mono text-xs border border-outline-variant/30">
            <span className="material-symbols-outlined text-[13px] text-outline">speed</span>
            <span className="text-outline">Latency:</span>
            <span className="text-on-surface font-semibold">14ms</span>
          </div>
          <div className="flex items-center gap-space-xs px-space-sm py-0.5 rounded-full bg-surface-container text-on-surface font-code-mono text-code-mono text-xs border border-outline-variant/30">
            <span className="material-symbols-outlined text-[13px] text-secondary">record_voice_over</span>
            <span className="text-on-surface-variant">TTS Engine Active</span>
          </div>
          <div className="flex items-center gap-space-xs px-space-sm py-0.5 rounded-full bg-surface-container text-on-surface font-code-mono text-code-mono text-xs border border-outline-variant/30">
            <span className="material-symbols-outlined text-[13px] text-tertiary">database</span>
            <span className="text-outline">Pamięć Sesji:</span>
            <span className="text-tertiary font-semibold">34 fakty</span>
          </div>
        </div>
      </div>

      {/* Workspace Grid: Sidebar & Chat Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md items-start">
        
        {/* Left Column: Context, Audio HUD, Tool Inspector, Threads (4/3 cols) */}
        <div className="order-2 lg:order-1 lg:col-span-4 xl:col-span-3 flex flex-col gap-space-md">
          
          {/* Live Voice HUD Card */}
          <div className={`p-space-md rounded-xl bg-surface-container-low shadow-sm flex flex-col gap-space-sm border transition-all ${
            isLiveMode ? 'border-primary ring-2 ring-primary/20 bg-surface-container' : 'border-outline-variant/30'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className={`w-2 h-2 rounded-full ${
                  isListening ? 'bg-primary animate-ping' : isSpeaking ? 'bg-secondary animate-pulse' : 'bg-outline'
                }`}></span>
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">
                  Voice Inspector HUD
                </span>
              </div>
              <span className="font-code-mono text-code-mono text-primary text-xs">96.4 kHz</span>
            </div>

            <div className="flex flex-col gap-space-xs py-space-xs">
              {/* Dynamic 15-Bar Waveform reacting to Voice States */}
              <div className="flex items-end justify-between h-9 px-space-sm bg-surface-container-lowest rounded-lg overflow-hidden border border-outline-variant/20">
                {[
                  isListening ? '35%' : isSpeaking ? '55%' : '15%',
                  isListening ? '85%' : isSpeaking ? '90%' : '20%',
                  isListening ? '50%' : isSpeaking ? '40%' : '12%',
                  isListening ? '95%' : isSpeaking ? '85%' : '25%',
                  isListening ? '40%' : isSpeaking ? '60%' : '15%',
                  isListening ? '90%' : isSpeaking ? '75%' : '30%',
                  isListening ? '65%' : isSpeaking ? '95%' : '18%',
                  isListening ? '100%' : isSpeaking ? '80%' : '35%',
                  isListening ? '45%' : isSpeaking ? '50%' : '15%',
                  isListening ? '80%' : isSpeaking ? '70%' : '22%',
                  isListening ? '30%' : isSpeaking ? '40%' : '12%',
                  isListening ? '90%' : isSpeaking ? '85%' : '28%',
                  isListening ? '70%' : isSpeaking ? '60%' : '18%',
                  isListening ? '55%' : isSpeaking ? '75%' : '15%',
                  isListening ? '25%' : isSpeaking ? '30%' : '10%'
                ].map((h, i) => (
                  <span
                    key={i}
                    className={`w-1 rounded-full transition-all duration-150 ${
                      isListening
                        ? 'bg-primary'
                        : isSpeaking
                        ? 'bg-secondary'
                        : 'bg-outline/30'
                    }`}
                    style={{ height: h }}
                  />
                ))}
              </div>

              {/* Status opisu głosu */}
              <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm pt-space-xs">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className={`material-symbols-outlined text-[15px] ${
                    isListening ? 'text-primary animate-pulse' : isSpeaking ? 'text-secondary animate-bounce' : 'text-outline'
                  }`}>
                    {isListening ? 'mic' : isSpeaking ? 'volume_up' : 'mic_none'}
                  </span>
                  <span className={isListening ? 'text-primary font-bold' : isSpeaking ? 'text-secondary font-bold' : 'text-on-surface'}>
                    {isListening
                      ? 'Omni słucha... Mów teraz!'
                      : isProcessingSpeech
                      ? 'Analizuję zapytanie...'
                      : isSpeaking
                      ? 'Omni odpowiada na głos...'
                      : 'Nasłuch w tle ("Hej Omni")'}
                  </span>
                </span>
                <span className="font-code-mono text-[10px] text-outline">
                  {isLiveMode ? '[LIVE ACTIVE]' : 'WakeWord OK'}
                </span>
              </div>
            </div>
          </div>

          {/* Active Tools Inspector */}
          <div className="p-space-md rounded-xl bg-surface-container-low shadow-sm flex flex-col gap-space-sm border border-outline-variant/30">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">Tool Calling Registry</span>
              <span className="px-space-xs py-0.5 rounded bg-surface-container text-primary font-code-mono text-code-mono text-xs">
                {activeToolsCount}/5 live
              </span>
            </div>

            <div className="space-y-space-xs">
              {toolsList.map(tool => (
                <label 
                  key={tool.id}
                  onClick={() => toggleTool(tool.id)}
                  className="flex items-center justify-between p-space-xs px-space-sm rounded-lg bg-surface-container-lowest hover:bg-surface-container cursor-pointer transition-colors border border-outline-variant/20"
                >
                  <div className="flex items-center gap-space-xs">
                    <input 
                      checked={tool.active} 
                      onChange={() => {}}
                      className="accent-primary rounded w-3.5 h-3.5 bg-surface-container-high" 
                      type="checkbox"
                    />
                    <span className="font-code-mono text-code-mono text-xs text-on-surface">{tool.name}</span>
                  </div>
                  <span className={`w-1.5 h-1.5 rounded-full ${tool.active ? 'bg-primary' : 'bg-outline'}`}></span>
                </label>
              ))}
            </div>
          </div>

          {/* Recent Sessions / Threads */}
          <div className="p-space-md rounded-xl bg-surface-container-low shadow-sm flex flex-col gap-space-sm border border-outline-variant/30">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">Ostatnie Wątki</span>
              <button 
                onClick={() => {
                  const newTitle = prompt('Nazwa nowego wątku:');
                  if (newTitle) {
                    const newTh = { id: `th_${Date.now()}`, title: newTitle, date: 'Teraz', time: new Date().toTimeString().slice(0, 5), active: true };
                    setThreads(prev => [newTh, ...prev.map(t => ({ ...t, active: false }))]);
                    setActiveThreadId(newTh.id);
                  }
                }}
                className="text-on-surface-variant hover:text-on-surface text-label-sm font-label-sm flex items-center gap-1 active:scale-95"
              >
                <span className="material-symbols-outlined text-[14px]">add</span> Nowy
              </button>
            </div>

            <div className="flex flex-col gap-space-xs">
              {threads.map(th => {
                const isActive = activeThreadId === th.id;
                return (
                  <div 
                    key={th.id}
                    onClick={() => {
                      setActiveThreadId(th.id);
                      setThreads(prev => prev.map(t => ({ ...t, active: t.id === th.id })));
                    }}
                    className={`p-space-sm rounded-lg text-on-surface flex flex-col gap-0.5 cursor-pointer transition-colors border ${
                      isActive ? 'bg-surface-container-high border-primary/30' : 'bg-surface-container-lowest hover:bg-surface-container text-on-surface-variant border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-label-sm text-label-sm font-semibold ${isActive ? 'text-primary' : 'text-outline'}`}>{th.date}</span>
                      <span className="font-code-mono text-[10px] text-outline">{th.time}</span>
                    </div>
                    <span className="font-body-md text-body-md font-medium truncate">{th.title}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Session Telemetry Pin */}
          <div className="p-space-sm rounded-lg bg-surface-container-lowest flex items-center justify-between text-outline font-code-mono text-code-mono text-xs border border-outline-variant/30">
            <span>Tokens IN: {tokensMeta.in.toLocaleString()}</span>
            <span>OUT: {tokensMeta.out.toLocaleString()}</span>
            <span className="text-primary font-semibold">{tokensMeta.cost}</span>
          </div>
        </div>

        {/* Center / Right Feed Area (8/9 Cols) */}
        <div className="order-1 lg:order-2 lg:col-span-8 xl:col-span-9 flex flex-col gap-space-md min-w-0">
          
          {/* Dialogue Container */}
          <div 
            ref={dialogueBoxRef}
            className="flex flex-col gap-3 sm:gap-space-lg p-2.5 sm:p-space-lg rounded-xl bg-surface-container-low min-h-[360px] sm:min-h-[580px] max-h-[65vh] sm:max-h-[70vh] overflow-y-auto custom-scrollbar shadow-sm border border-outline-variant/30 relative"
          >
            {/* System Marker */}
            <div className="flex items-center justify-center gap-space-sm text-outline font-code-mono text-code-mono text-xs">
              <span className="w-8 h-px bg-surface-container-high"></span>
              <span>Inicjalizacja sesji • Groq LPU Inference Cluster • Context Window: 128k</span>
              <span className="w-8 h-px bg-surface-container-high"></span>
            </div>

            {/* Clear toast notice */}
            {showClearToast && (
              <div className="p-space-sm rounded-lg bg-surface-container-lowest text-outline text-center font-code-mono text-xs border border-outline-variant/20">
                Kontekst rozmowy i pamięć krótkoterminowa zostały zresetowane.
              </div>
            )}

            {/* Default Mockup Message 1: Operator Query */}
            <div className="flex items-start justify-end gap-2 sm:gap-space-md pl-1 sm:pl-8">
              <div className="flex flex-col items-end gap-space-xs max-w-2xl">
                <div className="flex items-center gap-space-xs">
                  <span className="font-label-sm text-label-sm text-outline">12:14:02</span>
                  <span className="font-label-md text-label-md text-on-surface font-semibold">Operator K.</span>
                </div>
                <div className="p-2.5 sm:p-space-md rounded-2xl rounded-tr-xs bg-surface-container-high text-on-surface text-xs sm:text-body-md shadow-sm border border-outline-variant/20 max-w-[90%] sm:max-w-2xl">
                  Omni, przygotuj mi plan na dzisiejszy trening na strychu i sprawdź czy w Librusie nie ma odwołanych lekcji lub okienek.
                </div>
                <div className="flex items-center gap-space-xs text-outline font-code-mono text-[11px]">
                  <span className="material-symbols-outlined text-[13px] text-primary">done_all</span>
                  <span>Zsynchronizowano z SQLite WAL</span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-semibold shrink-0">
                <span className="material-symbols-outlined text-[18px]">person</span>
              </div>
            </div>

            {/* Default Mockup Message 2: Omni AI Response with Tool Execution Card */}
            <div className="flex items-start gap-2 sm:gap-space-md pr-1 sm:pr-8">
              <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-semibold shrink-0 shadow-[0_0_12px_rgba(77,142,255,0.3)]">
                <span className="material-symbols-outlined text-[18px]">smart_toy</span>
              </div>
              
              <div className="flex flex-col items-start gap-space-sm max-w-3xl w-full">
                <div className="flex items-center gap-space-xs">
                  <span className="font-label-md text-label-md text-primary font-semibold">Omni AI Assistant</span>
                  <span className="font-code-mono text-code-mono text-[11px] px-space-xs py-0.2 rounded bg-surface-container-highest text-on-surface-variant border border-outline-variant/30">LPU 120B</span>
                  <span className="font-label-sm text-label-sm text-outline ml-space-xs">12:14:04 • 1.8s</span>
                </div>

                {/* Tool Invocation Cards Stack */}
                <div className="w-full flex flex-col gap-space-xs">
                  {/* Tool 1: Librus Sync */}
                  <div className="p-space-sm rounded-lg bg-surface-container-lowest flex flex-col gap-1 shadow-sm border border-outline-variant/30">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <div className="flex items-center gap-space-xs">
                        <span className="material-symbols-outlined text-primary text-[15px]">terminal</span>
                        <span className="font-code-mono text-code-mono text-xs text-primary font-semibold">librus_sync.get_timetable(date="today")</span>
                      </div>
                      <div className="flex items-center gap-space-xs font-code-mono text-code-mono text-xs">
                        <span className="px-space-xs py-0.2 rounded bg-surface-container-high text-primary border border-primary/20">HTTP 200 OK</span>
                        <span className="text-outline">48ms</span>
                      </div>
                    </div>
                    <div className="font-code-mono text-code-mono text-xs text-on-surface-variant pl-space-md">
                      • Wykryto zmianę w planie lekcji: <span className="text-tertiary font-semibold">12:45 Fizyka (Odwołana)</span> → Okienko: 45 minut.
                    </div>
                  </div>

                  {/* Tool 2: Workout Routine */}
                  <div className="p-space-sm rounded-lg bg-surface-container-lowest flex flex-col gap-1 shadow-sm border border-outline-variant/30">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <div className="flex items-center gap-space-xs">
                        <span className="material-symbols-outlined text-secondary text-[15px]">terminal</span>
                        <span className="font-code-mono text-code-mono text-xs text-secondary font-semibold">workouts.get_fbw_routine(day="Wednesday", location="strych")</span>
                      </div>
                      <div className="flex items-center gap-space-xs font-code-mono text-code-mono text-xs">
                        <span className="px-space-xs py-0.2 rounded bg-surface-container-high text-secondary border border-secondary/20">Local SQLite Sync</span>
                        <span className="text-outline">6ms</span>
                      </div>
                    </div>
                    <div className="font-code-mono text-code-mono text-xs text-on-surface-variant pl-space-md">
                      • Załadowano zestaw: Drążek, Dipy na poręczach, Wiosłowanie hantlem 22.5kg, OHP hantle.
                    </div>
                  </div>
                </div>

                {/* Natural Language Answer Body */}
                <div className="p-2.5 sm:p-space-md rounded-2xl rounded-tl-xs bg-surface-container text-on-surface text-xs sm:text-body-md shadow-sm w-full space-y-space-sm leading-relaxed border border-outline-variant/30">
                  <p>
                    Sprawdziłem Twój dzisiejszy harmonogram. O <strong>12:45 masz okienko</strong> (odwołana lekcja fizyki), co daje idealny bufor czasowy na krótką regenerację przed blokiem popołudniowym.
                  </p>

                  {/* Workout Structure Card Inside Speech */}
                  <div className="p-space-md rounded-xl bg-surface-container-high flex flex-col gap-space-xs border border-outline-variant/30">
                    <div className="flex items-center justify-between">
                      <span className="font-label-md text-label-md text-on-surface font-semibold flex items-center gap-space-xs">
                        <span className="material-symbols-outlined text-[16px] text-primary">fitness_center</span>
                        Protokół FBW: Sesja B (Strych)
                      </span>
                      <span className="font-code-mono text-code-mono text-xs text-outline">Szacowany czas: 42 min</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-xs pt-space-xs font-body-md text-body-md">
                      <div className="p-space-xs px-2.5 rounded bg-surface-container-lowest flex items-center justify-between border border-outline-variant/20">
                        <span>1. Podciąganie na drążku</span>
                        <span className="font-code-mono text-code-mono text-primary font-semibold">2 serie (czarna guma)</span>
                      </div>
                      <div className="p-space-xs px-2.5 rounded bg-surface-container-lowest flex items-center justify-between border border-outline-variant/20">
                        <span>2. Dipy na poręczach</span>
                        <span className="font-code-mono text-code-mono text-primary font-semibold">2 serie (masa ciała)</span>
                      </div>
                      <div className="p-space-xs px-2.5 rounded bg-surface-container-lowest flex items-center justify-between border border-outline-variant/20">
                        <span>3. Wiosłowanie hantlem</span>
                        <span className="font-code-mono text-code-mono text-primary font-semibold">3 serie • 22.5 kg</span>
                      </div>
                      <div className="p-space-xs px-2.5 rounded bg-surface-container-lowest flex items-center justify-between border border-outline-variant/20">
                        <span>4. OHP hantlami</span>
                        <span className="font-code-mono text-code-mono text-primary font-semibold">3 serie • 14 kg</span>
                      </div>
                    </div>
                  </div>

                  <p>
                    Czy chcesz, abym uruchomił stoper sesji z automatycznym powiadomieniem Pushbullet na telefon po 3 minutach odpoczynku między seriami?
                  </p>
                </div>

                {/* Contextual Quick Actions */}
                <div className="flex items-center gap-space-xs flex-wrap pt-space-xs">
                  <button 
                    onClick={() => handleQuickAction('timer')}
                    className="px-space-md py-space-xs rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-label-md font-label-md flex items-center gap-1.5 transition-colors active:scale-95 border border-outline-variant/30" 
                  >
                    <span className="material-symbols-outlined text-[15px] text-primary">play_arrow</span>
                    <span>Uruchom stoper sesji</span>
                  </button>
                  <button 
                    onClick={() => handleQuickAction('pushbullet')}
                    className="px-space-md py-space-xs rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-label-md font-label-md flex items-center gap-1.5 transition-colors active:scale-95 border border-outline-variant/30" 
                  >
                    <span className="material-symbols-outlined text-[15px] text-secondary">notifications_active</span>
                    <span>Wyślij plan na Pushbullet</span>
                  </button>
                  <button 
                    onClick={() => handleQuickAction('copy')}
                    className="px-space-md py-space-xs rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-label-md font-label-md flex items-center gap-1.5 transition-colors active:scale-95 border border-outline-variant/30" 
                  >
                    <span className="material-symbols-outlined text-[15px] text-outline">content_copy</span>
                    <span>{copyToast ? 'Skopiowano!' : 'Kopiuj'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Dynamic Conversation Stream from ChatContext */}
            {workerMessages && workerMessages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              if (isUser) {
                return (
                  <div key={msg.id || idx} className="flex items-start justify-end gap-2 sm:gap-space-md pl-1 sm:pl-8 animate-fade-in">
                    <div className="flex flex-col items-end gap-space-xs max-w-2xl">
                      <div className="flex items-center gap-space-xs">
                        <span className="font-label-sm text-label-sm text-outline">
                          {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }) : 'Teraz'}
                        </span>
                        <span className="font-label-md text-label-md text-on-surface font-semibold">Operator K.</span>
                      </div>
                      <div className="p-2.5 sm:p-space-md rounded-2xl rounded-tr-xs bg-surface-container-high text-on-surface text-xs sm:text-body-md shadow-sm border border-outline-variant/30 max-w-[90%] sm:max-w-2xl">
                        {msg.content}
                      </div>
                      <div className="flex items-center gap-space-xs text-outline font-code-mono text-[11px]">
                        <span className="material-symbols-outlined text-[13px] text-primary">done_all</span>
                        <span>Zsynchronizowano z SQLite WAL</span>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-semibold shrink-0">
                      <span className="material-symbols-outlined text-[18px]">person</span>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div key={msg.id || idx} className="flex items-start gap-2 sm:gap-space-md pr-1 sm:pr-8 animate-fade-in">
                    <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-semibold shrink-0 shadow-[0_0_12px_rgba(77,142,255,0.3)]">
                      <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                    </div>
                    <div className="flex flex-col items-start gap-space-sm max-w-3xl w-full">
                      <div className="flex items-center gap-space-xs">
                        <span className="font-label-md text-label-md text-primary font-semibold">Omni AI Assistant</span>
                        <span className="font-code-mono text-code-mono text-[11px] px-space-xs py-0.2 rounded bg-surface-container-highest text-on-surface-variant border border-outline-variant/30">LPU 120B</span>
                        <span className="font-label-sm text-label-sm text-outline ml-space-xs">
                          {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }) : 'Teraz'}
                        </span>
                      </div>
                      <div className="p-2.5 sm:p-space-md rounded-2xl rounded-tl-xs bg-surface-container text-on-surface text-xs sm:text-body-md shadow-sm w-full leading-relaxed border border-outline-variant/30">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                );
              }
            })}

            {/* Floating Live Transcription / Voice Activity Banner */}
            {isLiveMode && (
              <div className="sticky bottom-0 z-20 flex items-center justify-between p-3.5 rounded-xl bg-surface-container-highest/95 border border-primary/40 backdrop-blur-md shadow-2xl font-mono text-xs animate-in slide-in-from-bottom-2 duration-150">
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${
                    isListening ? 'bg-primary animate-ping' : isProcessingSpeech ? 'bg-secondary animate-spin' : 'bg-tertiary animate-pulse'
                  }`} />
                  <div className="flex flex-col">
                    <span className="text-on-surface font-bold">
                      {isListening
                        ? (liveTranscript || 'Słucham... Mów teraz do mikrofonu')
                        : isProcessingSpeech
                        ? 'Generowanie odpowiedzi LPU...'
                        : isSpeaking
                        ? 'Omni odpowiada na głos...'
                        : 'Oczekiwanie na wypowiedź...'}
                    </span>
                    <span className="text-[10px] text-outline">
                      {isListening ? 'Transkrypcja Web Speech API w czasie rzeczywistym' : 'Powiedz "stop" lub "dzięki", aby zakończyć sesję'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => stopLiveMode(false)}
                  className="px-3 py-1.5 rounded-lg bg-error/20 hover:bg-error/30 text-error font-bold text-xs font-mono transition-colors"
                >
                  Zakończ
                </button>
              </div>
            )}

          </div>

          {/* Bottom Interactive Glass Input Console (Sticky bottom-4) */}
          <div className="p-2 sm:p-space-md rounded-2xl bg-surface-container-low/95 backdrop-blur-xl shadow-lg flex flex-col gap-2 sm:gap-space-sm sticky bottom-2 sm:bottom-4 border border-outline-variant/40">
            
            {/* Input Textarea Bar */}
            <form onSubmit={onSendMessage} className="relative flex items-center">
              <input 
                className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline text-xs sm:text-body-md rounded-xl pl-3 sm:pl-space-md pr-24 sm:pr-32 py-2.5 sm:py-space-md focus:outline-none focus:ring-1 focus:ring-primary shadow-inner border border-outline-variant/30" 
                id="user-chat-input" 
                placeholder={
                  isLiveMode
                    ? 'Tryb mowy Live aktywny... Mów do mikrofonu lub wpisz tekst...'
                    : "Wydaj polecenie Omni ('Sprawdź oceny', 'Zaplanuj jutrzejszy dzień', 'Wyślij ping')..."
                }
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
              />

              {/* Internal Right Controls inside bar */}
              <div className="absolute right-2 flex items-center gap-space-xs">
                <button 
                  onClick={toggleLiveVoiceMode}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all shadow-sm active:scale-95 ${
                    isLiveMode 
                      ? 'bg-error text-on-error animate-pulse ring-2 ring-error/50' 
                      : 'bg-surface-container hover:bg-surface-container-high text-primary'
                  }`}
                  id="voice-mic-trigger" 
                  title={isLiveMode ? 'Zatrzymaj tryb mowy Live' : "Uruchom ciągłą rozmowę głosową ('Hej Omni')"} 
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {isLiveMode ? 'mic_off' : 'mic'}
                  </span>
                </button>
                <button 
                  className="w-9 h-9 rounded-lg bg-primary hover:opacity-90 text-on-primary flex items-center justify-center transition-colors shadow-sm active:scale-95 disabled:opacity-50" 
                  id="send-message-btn" 
                  title="Wyślij prompt" 
                  type="submit"
                  disabled={isProcessing || isProcessingSpeech}
                >
                  <span className="material-symbols-outlined text-[20px]">send</span>
                </button>
              </div>
            </form>

            {/* Bottom Pill Controls & Telemetry */}
            <div className="flex items-center justify-between flex-wrap gap-space-xs pt-1">
              <div className="flex items-center gap-space-xs flex-wrap">
                {/* Tool selection pill */}
                <button 
                  onClick={() => alert(`Narzędzia autonomiczne: ${toolsList.filter(t => t.active).map(t => t.name).join(', ')}`)}
                  className="flex items-center gap-1 px-space-sm py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-label-sm font-label-sm transition-colors border border-outline-variant/30"
                >
                  <span className="material-symbols-outlined text-[14px] text-primary">extension</span>
                  <span>Narzędzia: Aktywne ({activeToolsCount})</span>
                </button>
                
                {/* Voice Status Pill */}
                <button 
                  onClick={toggleLiveVoiceMode}
                  className={`flex items-center gap-1 px-space-sm py-1 rounded-full text-label-sm font-label-sm transition-colors border ${
                    isLiveMode
                      ? 'bg-primary/20 text-primary border-primary/40 font-bold'
                      : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant border-outline-variant/30'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px] text-secondary">
                    {isLiveMode ? 'record_voice_over' : 'mic'}
                  </span>
                  <span>{isLiveMode ? 'Głos: Live Loop [ON]' : 'Głos: Nasłuch Hej Omni'}</span>
                </button>

                {/* Memory Mode */}
                <button 
                  onClick={() => alert('Pamięć trwała: Połączono z Firestore i SQLite.')}
                  className="flex items-center gap-1 px-space-sm py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-label-sm font-label-sm transition-colors border border-outline-variant/30"
                >
                  <span className="material-symbols-outlined text-[14px] text-tertiary">neurology</span>
                  <span>Pamięć trwała: Włączona</span>
                </button>
              </div>

              {/* LPU Speed Floating Indicator */}
              <div className="flex items-center gap-1.5 font-code-mono text-code-mono text-xs text-outline">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                <span>Groq LPU •</span>
                <span className="text-primary font-semibold">420 tokens/sec</span>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default ChatPage;
