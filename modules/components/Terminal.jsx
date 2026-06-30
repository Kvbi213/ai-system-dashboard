import React, { useState, useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, Send, Code, BrainCircuit, Lightbulb, X, Mic, Loader2, Copy, Check, Radio } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import WeatherWidget from './WeatherWidget';
import ITNewsTicker from './ITNewsTicker';
import SystemMonitor from './SystemMonitor';
import TodoList from './TodoList';
import ModelWidget from './ModelWidget';
import NotificationsWidget from './NotificationsWidget';
import { useChatContext } from '../context/ChatContext';

const ChatMessage = ({ msg }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!msg.content) return;
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex group ${msg.role === 'user' ? 'text-textMuted' : (msg.isSystem ? 'text-yellow-500 font-bold' : 'text-accentPrimary neon-text')}`}>
      <span className="opacity-50 mr-2 shrink-0">[{msg.role === 'user' ? 'USER' : (msg.isSystem ? 'SYS' : 'AI')}]:</span>
      <div className="flex-1 break-words whitespace-pre-wrap relative">
        {msg.role === 'ai' && !msg.isSystem ? (
          <div className="glass-panel p-4 rounded-xl border border-border/50 bg-background/40 relative">
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 p-1.5 rounded-lg text-textMuted hover:text-accentPrimary hover:bg-accentPrimary/10 transition-colors opacity-0 group-hover:opacity-100"
              title="Kopiuj tekst"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
            <ReactMarkdown
              components={{
                p: ({node, ...props}) => <p className="mb-1" {...props} />,
                a: ({node, ...props}) => <a className="text-accentSecondary hover:text-textPrimary underline" target="_blank" rel="noreferrer" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-1 space-y-1" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-1 space-y-1" {...props} />,
                li: ({node, ...props}) => <li className="marker:text-accentPrimary" {...props} />,
                strong: ({node, ...props}) => <strong className="font-bold text-textPrimary" {...props} />
              }}
            >
              {msg.content}
            </ReactMarkdown>
            {msg.widgets && msg.widgets.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-4 pointer-events-auto w-full items-start">
                {msg.widgets.includes('weather') && (
                  <div className="glass-panel p-5 rounded-xl border border-border w-full sm:w-[280px] flex items-center justify-center">
                    <WeatherWidget />
                  </div>
                )}
                {msg.widgets.includes('system') && (
                  <div className="w-full sm:w-[320px] h-[340px]">
                    <SystemMonitor />
                  </div>
                )}
                {msg.widgets.includes('notifications') && (
                  <div className="glass-panel p-2 rounded-xl border border-border w-full sm:w-[320px] h-[340px]">
                    <NotificationsWidget />
                  </div>
                )}
                {msg.widgets.includes('news') && (
                  <div className="w-full sm:w-[450px] h-[340px]">
                    <ITNewsTicker selectedCategories={window.__newsCategories || ['ai', 'security', 'hardware']} />
                  </div>
                )}
                {msg.widgets.includes('tasks') && (
                  <div className="w-full sm:w-[350px] h-[340px]">
                    <TodoList />
                  </div>
                )}
                {msg.widgets.includes('models') && (
                  <div className="w-full sm:w-[450px] h-[340px]">
                    <ModelWidget />
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          msg.content
        )}
      </div>
    </div>
  );
};

const Terminal = () => {
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
    { cmd: '/clear', desc: 'Czyści ekran obecnego trybu' },
    { cmd: '/purge', desc: 'Agresywnie czyści pamięć i ekran' },
    { cmd: '/mode worker', desc: 'Przełącza na tryb inżynieryjny' },
    { cmd: '/mode mentor', desc: 'Przełącza na tryb analityczny' },
    { cmd: '/export', desc: 'Zapisuje historię czatu do pliku TXT' },
    { cmd: '/ping', desc: 'Sprawdza łączność i opóźnienie' },
    { cmd: '/help', desc: 'Wyświetla listę poleceń' }
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
      alert("Twoja przegldarka nie obsuguje SpeechRecognition.");
      setIsLiveMode(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'pl-PL';
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
         utterance.lang = 'pl-PL';
         
         const voices = window.speechSynthesis.getVoices();
         const voicePref = localStorage.getItem('system_voice_pref') || 'paulina';
         const voiceRate = parseFloat(localStorage.getItem('system_voice_rate')) || 1.8;
         
         let selectedVoice;
         if (voicePref === 'female' || voicePref === 'paulina') {
            selectedVoice = voices.find(v => v.name.toLowerCase().includes('paulina') || v.name.toLowerCase().includes('zofia')) || voices.find(v => v.lang.includes('pl') && !v.name.toLowerCase().includes('male') && !v.name.toLowerCase().includes('marek'));
         } else {
            selectedVoice = voices.find(v => v.name.toLowerCase().includes('marek') || v.name.toLowerCase().includes('adam')) || voices.find(v => v.lang.includes('pl') && (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('mężczyzna')));
         }
         
         if (!selectedVoice) selectedVoice = voices.find(v => v.lang.includes('pl'));
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
              const res = await fetch('/api/voice/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audioData: reader.result })
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
        console.error("Brak dostępu do mikrofonu", err);
      }
    }
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
            title="Przemyślenia AI"
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
              {isSpeaking ? 'JARVIS // MÓWI' : (isListening ? 'JARVIS // NASŁUCHUJE' : 'JARVIS // OCZEKUJE')}
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
        <div className="flex-1 overflow-y-auto space-y-3 font-mono text-sm mb-4 custom-scrollbar pr-2">
          {messages.map((msg, i) => (
            <ChatMessage key={i} msg={msg} />
          ))}
          {isProcessing && (
            <div className="text-accentPrimary neon-text">
              <span className="opacity-50 mr-2">[AI]:</span>
              <span className="terminal-cursor"></span>
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </div>
      )}

      {/* Autocomplete Dropdown */}
      {filteredCommands.length > 0 && (
        <div className="absolute bottom-16 left-4 z-20 bg-background border-2 border-border rounded-xl shadow-2xl shadow-black/80 p-2 min-w-[280px] animate-fade-in-up">
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

      <form onSubmit={handleSubmit} className="relative flex items-center border-t border-border pt-3 gap-2">
        <span className="font-mono text-accentPrimary mr-2">$</span>

        <button 
          type="button" 
          onClick={toggleLiveMode}
          className={`p-1.5 rounded-full transition-all flex items-center justify-center ${isLiveMode ? 'bg-accentPrimary text-black animate-pulse shadow-[0_0_15px_currentColor]' : 'text-textMuted hover:text-accentPrimary hover:bg-accentPrimary/10'}`}
          title="Tryb ciągłej rozmowy"
        >
          <Radio className="w-4 h-4" />
        </button>
        <button 
          type="button" 
          onClick={toggleRecording}
          disabled={isTranscribing}
          className={`p-1.5 rounded-full transition-all flex items-center justify-center ${isRecording ? 'bg-red-500/20 text-red-500 animate-pulse' : 'text-textMuted hover:text-accentPrimary hover:bg-accentPrimary/10'}`}
          title="Nagrywanie gosowe"
        >
          {isTranscribing ? <Loader2 className="w-4 h-4 animate-spin text-accentPrimary" /> : <Mic className="w-4 h-4" />}
        </button>
        <input 
          id="chat-input"
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === 'worker' ? "Wprowadź komendę..." : "Wygadaj się..."}
          className="flex-1 bg-transparent border-none outline-none font-mono text-sm text-textPrimary placeholder:text-border"
          autoComplete="off"
          autoFocus
        />
        <button type="submit" disabled={isProcessing || !input.trim()} className="text-accentPrimary hover:text-textPrimary transition-colors disabled:opacity-50">
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Pane z przemyśleniami */}
      {showThoughts && mode === 'mentor' && (
        <div className="absolute top-12 right-2 w-64 bg-background border border-accentPrimary/40 rounded-xl shadow-[0_0_20px_rgba(var(--color-accent-primary),0.15)] z-10 flex flex-col overflow-hidden animate-fade-in-up">
          <div className="p-3 border-b border-border/50 flex justify-between items-center bg-black/20">
            <span className="font-mono text-[10px] uppercase text-accentPrimary font-bold tracking-wider flex items-center gap-2">
              <Lightbulb className="w-3 h-3" /> Wewnętrzny Dziennik
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
