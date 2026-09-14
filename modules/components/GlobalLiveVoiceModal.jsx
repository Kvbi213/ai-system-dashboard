import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Mic, Loader2, Radio, Volume2, Sparkles, StopCircle, RefreshCw } from 'lucide-react';
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
import { wakeWordService, cleanTextForSpeech } from '../services/wakeWordService';

const EXIT_PHRASES = [
  'stop', 'koniec', 'dziękuję', 'dziekuje', 'dzięki', 'dzieki',
  'zamknij', 'to wszystko', 'anuluj', 'wyłącz', 'do widzenia', 'nara'
];

export default function GlobalLiveVoiceModal() {
  const { t } = useTranslation();
  const { sendCommand, mode } = useChatContext();

  const [isOpen, setIsOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userTranscript, setUserTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [activeWidgets, setActiveWidgets] = useState([]);
  const [statusMessage, setStatusMessage] = useState('Oczekiwanie...');

  const recognitionRef = useRef(null);
  const isAliveRef = useRef(false);
  const isOpenRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const isListeningRef = useRef(false);
  const isProcessingRef = useRef(false);
  const restartTimeoutRef = useRef(null);

  // Inicjalizacja usług w tle przy starcie aplikacji
  useEffect(() => {
    // Uruchom nasłuch słowa wybudzającego w tle
    wakeWordService.start();

    const handleWakeWord = (e) => {
      const payload = e.detail?.payload || '';
      openModalAndStart(payload);
    };

    const handleManualOpen = () => {
      openModalAndStart();
    };

    window.addEventListener('wakeWordDetected', handleWakeWord);
    window.addEventListener('openLiveVoiceModal', handleManualOpen);

    return () => {
      window.removeEventListener('wakeWordDetected', handleWakeWord);
      window.removeEventListener('openLiveVoiceModal', handleManualOpen);
      wakeWordService.stop();
    };
  }, []);

  useEffect(() => {
    isOpenRef.current = isOpen;
    isAliveRef.current = isOpen;
    if (!isOpen) {
      cleanupSpeech();
      // Wznów nasłuch słowa wybudzającego w tle po zamknięciu okna
      wakeWordService.resume();
    } else {
      // Wstrzymaj nasłuch w tle gdy modal jest aktywny
      wakeWordService.pause();
    }
  }, [isOpen]);

  const cleanupSpeech = useCallback(() => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    wakeWordService.setAiSpeaking(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    isSpeakingRef.current = false;
    isListeningRef.current = false;
    isProcessingRef.current = false;
    setIsSpeaking(false);
    setIsListening(false);
    setIsProcessing(false);
  }, []);

  const speakText = useCallback((text, onEndCallback) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEndCallback && isOpenRef.current) onEndCallback();
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = cleanTextForSpeech(text);
    if (!cleanText) {
      if (onEndCallback && isOpenRef.current) onEndCallback();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const systemLang = localStorage.getItem('system_language') || 'pl';
    const langMap = { pl: 'pl-PL', en: 'en-US', uk: 'uk-UA', zh: 'zh-CN' };
    utterance.lang = langMap[systemLang] || 'pl-PL';

    const voicePref = localStorage.getItem('system_voice_pref') || 'female';
    const voiceRate = parseFloat(localStorage.getItem('system_voice_rate')) || 1.2;
    utterance.rate = voiceRate;
    utterance.pitch = 1.05;

    const voices = window.speechSynthesis.getVoices();
    let selectedVoice;
    if (systemLang === 'pl') {
      if (voicePref === 'female' || voicePref === 'paulina') {
        selectedVoice = voices.find(v => v.name.toLowerCase().includes('paulina') || v.name.toLowerCase().includes('zofia')) ||
          voices.find(v => v.lang.includes('pl') && !v.name.toLowerCase().includes('male') && !v.name.toLowerCase().includes('marek'));
      } else {
        selectedVoice = voices.find(v => v.name.toLowerCase().includes('marek') || v.name.toLowerCase().includes('adam')) ||
          voices.find(v => v.lang.includes('pl') && (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('mężczyzna')));
      }
    }
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.includes(systemLang));
    }
    if (selectedVoice) utterance.voice = selectedVoice;

    utterance.onstart = () => {
      isSpeakingRef.current = true;
      setIsSpeaking(true);
      wakeWordService.setAiSpeaking(true);
      setStatusMessage(mode === 'mentor' ? 'OMNI MIND // MÓWI...' : 'OMNI EXEC // MÓWI...');
    };

    const handleSpeechFinished = () => {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      wakeWordService.setAiSpeaking(false);
      // Akustyczny bufor wytłumienia echa głośników przed ponownym włączeniem mikrofonu (400ms)
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = setTimeout(() => {
        if (onEndCallback && isOpenRef.current) {
          onEndCallback();
        }
      }, 400);
    };

    utterance.onend = handleSpeechFinished;
    utterance.onerror = handleSpeechFinished;

    isSpeakingRef.current = true;
    setIsSpeaking(true);
    wakeWordService.setAiSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [mode]);

  const startListeningLoop = useCallback(() => {
    if (!isOpenRef.current || isSpeakingRef.current || isProcessingRef.current) return;
    if (typeof window === 'undefined' || !('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setStatusMessage('Brak obsługi SpeechRecognition w przeglądarce.');
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    const systemLang = localStorage.getItem('system_language') || 'pl';
    const langMap = { pl: 'pl-PL', en: 'en-US', uk: 'uk-UA', zh: 'zh-CN' };
    recognition.lang = langMap[systemLang] || 'pl-PL';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      isListeningRef.current = true;
      setIsListening(true);
      setStatusMessage(mode === 'mentor' ? 'OMNI MIND // SŁUCHA...' : 'OMNI EXEC // SŁUCHA...');
    };

    recognition.onresult = async (event) => {
      let interim = '';
      let final = '';

      for (let i = 0; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += text;
        } else {
          interim += text;
        }
      }

      const currentSpeech = (final || interim).trim();
      setUserTranscript(currentSpeech);

      if (final.trim()) {
        try {
          recognition.stop();
        } catch {}
        isListeningRef.current = false;
        setIsListening(false);
        handleUserSpokenInput(final.trim());
      }
    };

    recognition.onerror = (e) => {
      isListeningRef.current = false;
      setIsListening(false);
      if (isOpenRef.current && e.error !== 'aborted' && !isSpeakingRef.current && !isProcessingRef.current) {
        if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = setTimeout(() => {
          if (isOpenRef.current && !isSpeakingRef.current && !isProcessingRef.current) {
            startListeningLoop();
          }
        }, 600);
      }
    };

    recognition.onend = () => {
      isListeningRef.current = false;
      setIsListening(false);
      if (isOpenRef.current && !isSpeakingRef.current && !isProcessingRef.current) {
        if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = setTimeout(() => {
          if (isOpenRef.current && !isSpeakingRef.current && !isProcessingRef.current) {
            try {
              recognition.start();
            } catch {}
          }
        }, 400);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {}
  }, [mode]);

  const handleUserSpokenInput = async (spokenText) => {
    if (!spokenText) return;

    // Sprawdzenie fraz zakończenia rozmowy
    const lower = spokenText.toLowerCase().trim();
    const isExit = EXIT_PHRASES.some(phrase => lower === phrase || lower.startsWith(phrase + ' '));

    if (isExit) {
      setStatusMessage('Kończenie rozmowy...');
      speakText('Do usłyszenia! Wracam do nasłuchu w tle.', () => {
        setIsOpen(false);
      });
      return;
    }

    isProcessingRef.current = true;
    setIsProcessing(true);
    setStatusMessage(mode === 'mentor' ? 'OMNI MIND // ANALIZUJE...' : 'OMNI EXEC // PRZETWARZA...');

    try {
      const responseObj = await sendCommand(spokenText);
      const text = typeof responseObj === 'string' ? responseObj : (responseObj?.content || '');
      const widgets = typeof responseObj === 'object' ? (responseObj?.widgets || []) : [];

      setAiResponse(text);
      setActiveWidgets(widgets);
      isProcessingRef.current = false;
      setIsProcessing(false);

      // Odtwarzanie odpowiedzi głosowej, a po jej zakończeniu powrót do nasłuchiwania (pętla ciągłej rozmowy)
      speakText(text, () => {
        if (isOpenRef.current) {
          setUserTranscript('');
          startListeningLoop();
        }
      });
    } catch (err) {
      console.error('[GlobalLiveVoiceModal] Błąd dyspozycji zapytania:', err);
      isProcessingRef.current = false;
      setIsProcessing(false);
      speakText('Wystąpił błąd podczas przetwarzania zapytania.', () => {
        if (isOpenRef.current) startListeningLoop();
      });
    }
  };

  const openModalAndStart = (initialPayload = '') => {
    wakeWordService.pause();
    setIsOpen(true);
    setUserTranscript(initialPayload);
    setAiResponse('');
    setActiveWidgets([]);

    if (initialPayload.trim()) {
      // Jeśli użytkownik od razu powiedział pytanie (np. "Hej Omni, jaka jest jutro lekcja?")
      handleUserSpokenInput(initialPayload.trim());
    } else {
      // Użytkownik wywołał tylko "Hej Omni" -> asystent pyta w czym pomóc i zaczyna nasłuchiwać
      const greeting = mode === 'mentor' 
        ? 'Słucham. W czym mogę pomóc?' 
        : 'Cześć! W czym mogę pomóc?';
      setAiResponse(greeting);
      speakText(greeting, () => {
        if (isOpenRef.current) {
          startListeningLoop();
        }
      });
    }
  };

  const handleClose = () => {
    cleanupSpeech();
    setIsOpen(false);
  };

  // Obsługa klawisza Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl animate-fade-in select-none">
      <div 
        className="absolute inset-0 bg-gradient-to-b from-accentPrimary/5 via-transparent to-black/60 pointer-events-none" 
      />

      <div className="relative w-full max-w-2xl bg-surface/90 border border-border/80 rounded-2xl p-5 sm:p-8 shadow-2xl flex flex-col items-center max-h-[92dvh] overflow-hidden">
        
        {/* NAGŁÓWEK MODALU */}
        <div className="w-full flex items-center justify-between pb-4 mb-4 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-accentPrimary/15 border border-accentPrimary/40 text-accentPrimary">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-mono text-sm sm:text-base font-bold text-textPrimary tracking-wide">
                  OMNIDASH // ASYSTENT GŁOSOWY
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accentPrimary/20 text-accentPrimary border border-accentPrimary/40 font-bold animate-pulse">
                  LIVE CHAT
                </span>
              </div>
              <p className="text-xs text-textMuted font-mono">
                Tryb ciągłej rozmowy głosowej
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl bg-surface hover:bg-white/10 border border-border text-textMuted hover:text-textPrimary transition-all active:scale-95"
            title="Zamknij (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* INTERAKTYWNA KULA / RADAR GŁOSOWY */}
        <div className="my-4 sm:my-6 flex flex-col items-center justify-center">
          <div 
            className={`w-36 h-36 sm:w-44 sm:h-44 rounded-full flex items-center justify-center transition-all duration-500 relative ${
              isSpeaking 
                ? 'scale-110 shadow-[0_0_60px_rgba(var(--color-accent-primary),0.85)] bg-accentPrimary/20' 
                : (isListening 
                    ? 'scale-100 shadow-[0_0_35px_rgba(var(--color-accent-primary),0.5)] bg-accentPrimary/10' 
                    : 'scale-95 opacity-60 bg-transparent border border-accentPrimary/30')
            }`}
          >
            {/* Wewnętrzny rdzeń */}
            <div 
              className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-accentPrimary transition-all duration-300 flex items-center justify-center ${
                isSpeaking 
                  ? 'animate-pulse opacity-90' 
                  : (isListening ? 'opacity-40 animate-pulse' : 'opacity-20')
              }`}
            >
              {isProcessing ? (
                <Loader2 className="w-10 h-10 text-black animate-spin" />
              ) : isSpeaking ? (
                <Volume2 className="w-10 h-10 text-black animate-bounce" />
              ) : isListening ? (
                <Mic className="w-10 h-10 text-black" />
              ) : (
                <Radio className="w-10 h-10 text-accentPrimary" />
              )}
            </div>

            {/* Pierścienie pulsujące */}
            <div 
              className={`absolute inset-0 rounded-full border-2 border-accentPrimary transition-all duration-1000 ${
                isListening ? 'animate-spin opacity-60' : 'opacity-20'
              }`} 
              style={{ borderStyle: 'dashed' }} 
            />
            {isSpeaking && (
              <div className="absolute -inset-3 rounded-full border border-accentPrimary/60 animate-ping opacity-40" />
            )}
          </div>

          {/* Etykieta statusu */}
          <div className="mt-4 flex items-center gap-2 font-mono text-xs sm:text-sm font-bold tracking-widest text-accentPrimary">
            <span className="w-2 h-2 rounded-full bg-accentPrimary animate-ping" />
            <span>{statusMessage}</span>
          </div>
        </div>

        {/* OBSZAR TRANSLACJI I ODPOWIEDZI */}
        <div className="w-full flex-1 min-h-[140px] max-h-[300px] overflow-y-auto custom-scrollbar p-4 rounded-xl bg-black/40 border border-border/70 flex flex-col gap-3">
          
          {/* Tekst wypowiedziany przez użytkownika */}
          {userTranscript && (
            <div className="flex items-start gap-2.5 text-xs sm:text-sm font-sans text-textPrimary bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="font-mono text-accentPrimary font-bold shrink-0">TY:</span>
              <span className="italic">{userTranscript}</span>
            </div>
          )}

          {/* Odpowiedź AI */}
          {aiResponse ? (
            <div className="flex items-start gap-2.5 text-xs sm:text-sm font-sans text-textPrimary leading-relaxed">
              <span className="font-mono text-accentPrimary font-bold shrink-0">OMNI:</span>
              <div className="flex-1 min-w-0 prose prose-invert prose-xs max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-bold text-accentPrimary" {...props} />,
                    em: ({node, ...props}) => <em className="italic text-accentSecondary" {...props} />,
                    a: ({node, ...props}) => <a className="text-accentPrimary underline" target="_blank" rel="noreferrer" {...props} />
                  }}
                >
                  {aiResponse}
                </ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-textMuted text-xs font-mono">
              Powiedz pytanie lub polecenie...
            </div>
          )}

          {/* WIDŻETY WBUDOWANE */}
          {activeWidgets.length > 0 && (
            <div className="pt-2 border-t border-border/40 flex flex-wrap gap-3 justify-center">
              {activeWidgets.includes('weather') && (
                <div className="glass-panel p-3 rounded-xl w-full sm:w-auto">
                  <WeatherWidget />
                </div>
              )}
              {activeWidgets.includes('timetable') && (
                <div className="glass-panel p-3 rounded-xl w-full sm:w-[320px]">
                  <TimetableChatWidget />
                </div>
              )}
              {activeWidgets.includes('finances') && (
                <div className="glass-panel p-3 rounded-xl w-full sm:w-[320px]">
                  <FinanceChatWidget />
                </div>
              )}
              {activeWidgets.includes('tasks') && (
                <div className="glass-panel p-3 rounded-xl w-full sm:w-[320px] h-[250px]">
                  <TodoList />
                </div>
              )}
              {activeWidgets.includes('system') && (
                <div className="w-full sm:w-[300px] h-[260px]">
                  <SystemMonitor />
                </div>
              )}
              {activeWidgets.includes('news') && (
                <div className="w-full sm:w-[350px] h-[260px]">
                  <ITNewsTicker selectedCategories={['ai', 'security']} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* STOPKA Z WSKAZÓWKAMI I PRZYCISKAMI KONTROLNYMI */}
        <div className="w-full mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-textMuted text-[11px] font-mono">
          <div className="flex items-center gap-2">
            <span>Wskazówka:</span>
            <span className="text-textPrimary bg-white/5 px-2 py-0.5 rounded border border-white/10">
              Powiedz "dziękuję" lub "stop", aby zakończyć
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                cleanupSpeech();
                startListeningLoop();
              }}
              className="px-2.5 py-1 rounded-lg bg-surface border border-border hover:border-accentPrimary text-textPrimary flex items-center gap-1.5 transition-all"
              title="Ponów nasłuchiwanie"
            >
              <RefreshCw className="w-3.5 h-3.5 text-accentPrimary" />
              <span>Ponów</span>
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 flex items-center gap-1.5 transition-all"
            >
              <StopCircle className="w-3.5 h-3.5" />
              <span>Zakończ</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
