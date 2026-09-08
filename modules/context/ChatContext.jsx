import { useTranslation } from 'react-i18next';
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { dispatchAiQuery } from '../services/clientAiDispatcher';
import { subscribeCollection, saveCloudDocument, clearChatHistoryCloud } from '../services/cloudSync';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { t } = useTranslation();

  const [mode, setMode] = useState('worker');
  const [showThoughts, setShowThoughts] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [workerMessages, setWorkerMessages] = useState(() => {
    const ghostMode = localStorage.getItem('system_ghost_mode') === 'true';
    if (!ghostMode) {
      try {
        const clearedWorker = parseInt(localStorage.getItem('system_chat_cleared_worker') || '0', 10);
        const saved = localStorage.getItem('system_chat_history');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const filtered = parsed.filter(m => {
              const msgTime = new Date(m.timestamp || m.updated_at || 0).getTime();
              return !clearedWorker || msgTime > clearedWorker;
            });
            if (filtered.length > 0) return filtered;
          }
        }
      } catch (e) {
        console.warn('Nie udało się załadować historii czatu:', e);
      }
    }
    return [{ 
      id: 'welcome_worker_init',
      role: 'ai', 
      content: t('chatOnlineWorker', 'SYSTEM ONLINE. Oczekuję na polecenia, mordo.'),
      timestamp: new Date().toISOString(),
      chatMode: 'worker'
    }];
  });

  const [mentorMessages, setMentorMessages] = useState(() => {
    const ghostMode = localStorage.getItem('system_ghost_mode') === 'true';
    if (!ghostMode) {
      try {
        const clearedMentor = parseInt(localStorage.getItem('system_chat_cleared_mentor') || '0', 10);
        const saved = localStorage.getItem('system_mentor_history');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const filtered = parsed.filter(m => {
              const msgTime = new Date(m.timestamp || m.updated_at || 0).getTime();
              return !clearedMentor || msgTime > clearedMentor;
            });
            if (filtered.length > 0) return filtered;
          }
        }
      } catch (e) {
        console.warn('Nie udało się załadować historii mentora:', e);
      }
    }
    return [{ 
      id: 'welcome_mentor_init',
      role: 'ai', 
      content: t('chatOnlineMentor', 'Cześć. Z czym się dzisiaj mierzysz? Chłodna analiza bez słodzenia gwarantowana.'),
      timestamp: new Date().toISOString(),
      chatMode: 'mentor'
    }];
  });

  const [thoughtsLog, setThoughtsLog] = useState([
    t("chatMentorActive", "System Mentor aktywowany. Oczekiwanie na dane wejściowe..."),
  ]);

  // Subskrypcja chmurowej historii chatu z Firestore (chat_history)
  useEffect(() => {
    const ghostMode = localStorage.getItem('system_ghost_mode') === 'true';
    if (ghostMode) return;

    const unsubscribe = subscribeCollection('chat_history', (cloudMsgs) => {
      const clearedWorker = parseInt(localStorage.getItem('system_chat_cleared_worker') || '0', 10);
      const clearedMentor = parseInt(localStorage.getItem('system_chat_cleared_mentor') || '0', 10);

      const allMsgs = Array.isArray(cloudMsgs) ? cloudMsgs : [];

      // Filtruj wiadomości dla trybu WORKER nowsze niż znacznik czyszczenia
      const workerFromCloud = allMsgs.filter(m => {
        const msgMode = m.chatMode || 'worker';
        if (msgMode !== 'worker') return false;
        const msgTime = new Date(m.timestamp || m.updated_at || 0).getTime();
        return !clearedWorker || msgTime > clearedWorker;
      });

      // Filtruj wiadomości dla trybu MENTOR nowsze niż znacznik czyszczenia
      const mentorFromCloud = allMsgs.filter(m => {
        if (m.chatMode !== 'mentor') return false;
        const msgTime = new Date(m.timestamp || m.updated_at || 0).getTime();
        return !clearedMentor || msgTime > clearedMentor;
      });

      setWorkerMessages(prev => {
        // Zachowaj wiadomości w pamięci z obecnej sesji po czyszczeniu
        const validPrev = prev.filter(m => {
          const t = new Date(m.timestamp || 0).getTime();
          return !clearedWorker || t > clearedWorker;
        });

        // Połącz unikalne po id lub roli/treści/czasie
        const map = new Map();
        validPrev.forEach(m => {
          const key = m.id || `${m.role}_${m.content}_${m.timestamp}`;
          map.set(key, m);
        });
        workerFromCloud.forEach(m => {
          const key = m.id || `${m.role}_${m.content}_${m.timestamp}`;
          map.set(key, m);
        });

        const merged = Array.from(map.values());
        merged.sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));

        if (merged.length === 0) {
          return [{
            id: `welcome_worker_${clearedWorker || 'init'}`,
            role: 'ai',
            content: t('chatOnlineWorker', 'SYSTEM ONLINE. Oczekuję na polecenia, mordo.'),
            timestamp: new Date(clearedWorker || Date.now()).toISOString(),
            chatMode: 'worker'
          }];
        }
        return merged;
      });

      setMentorMessages(prev => {
        const validPrev = prev.filter(m => {
          const t = new Date(m.timestamp || 0).getTime();
          return !clearedMentor || t > clearedMentor;
        });

        const map = new Map();
        validPrev.forEach(m => {
          const key = m.id || `${m.role}_${m.content}_${m.timestamp}`;
          map.set(key, m);
        });
        mentorFromCloud.forEach(m => {
          const key = m.id || `${m.role}_${m.content}_${m.timestamp}`;
          map.set(key, m);
        });

        const merged = Array.from(map.values());
        merged.sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));

        if (merged.length === 0) {
          return [{
            id: `welcome_mentor_${clearedMentor || 'init'}`,
            role: 'ai',
            content: t('chatOnlineMentor', 'Cześć. Z czym się dzisiaj mierzysz? Chłodna analiza bez słodzenia gwarantowana.'),
            timestamp: new Date(clearedMentor || Date.now()).toISOString(),
            chatMode: 'mentor'
          }];
        }
        return merged;
      });
    });

    const handleChatCleared = (e) => {
      const ts = e.detail?.timestamp || Date.now();
      const iso = new Date(ts).toISOString();
      const targetMode = e.detail?.mode || 'all';

      if (targetMode === 'worker' || targetMode === 'all') {
        setWorkerMessages([{
          id: `welcome_worker_${ts}`,
          role: 'ai',
          content: t('chatOnlineWorker', 'SYSTEM ONLINE. Oczekuję na polecenia, mordo.'),
          timestamp: iso,
          chatMode: 'worker'
        }]);
      }
      if (targetMode === 'mentor' || targetMode === 'all') {
        setMentorMessages([{
          id: `welcome_mentor_${ts}`,
          role: 'ai',
          content: t('chatOnlineMentor', 'Cześć. Z czym się dzisiaj mierzysz? Chłodna analiza bez słodzenia gwarantowana.'),
          timestamp: iso,
          chatMode: 'mentor'
        }]);
      }
    };
    window.addEventListener('chatCleared', handleChatCleared);

    return () => {
      unsubscribe();
      window.removeEventListener('chatCleared', handleChatCleared);
    };
  }, [t]);

  useEffect(() => {
    const ghostMode = localStorage.getItem('system_ghost_mode') === 'true';
    if (!ghostMode) {
      localStorage.setItem('system_chat_history', JSON.stringify(workerMessages));
    }
  }, [workerMessages]);

  useEffect(() => {
    const ghostMode = localStorage.getItem('system_ghost_mode') === 'true';
    if (!ghostMode) {
      localStorage.setItem('system_mentor_history', JSON.stringify(mentorMessages));
    }
  }, [mentorMessages]);

  const sendCommand = async (inputStr) => {
    if (!inputStr.trim()) return;
    const userText = inputStr.trim();
    const ghostMode = localStorage.getItem('system_ghost_mode') === 'true';

    if (userText.startsWith('/')) {
      const [cmd, ...args] = userText.toLowerCase().split(' ');
      const pushSysMsg = (content) => {
        const sysMsg = { role: 'ai', content, isSystem: true, timestamp: new Date().toISOString() };
        if (mode === 'worker') setWorkerMessages(prev => [...prev, sysMsg]);
        else setMentorMessages(prev => [...prev, sysMsg]);
      };

      if (cmd === '/clear') {
        const clearTimestamp = Date.now();
        const clearIso = new Date(clearTimestamp).toISOString();

        if (mode === 'worker') {
          localStorage.setItem('system_chat_cleared_worker', String(clearTimestamp));
          const welcome = [{ 
            id: `welcome_worker_${clearTimestamp}`,
            role: 'ai', 
            content: t('chatOnlineWorker', 'SYSTEM ONLINE. Oczekuję na polecenia, mordo.'), 
            timestamp: clearIso,
            chatMode: 'worker'
          }];
          setWorkerMessages(welcome);
          localStorage.setItem('system_chat_history', JSON.stringify(welcome));
          window.dispatchEvent(new CustomEvent('chatCleared', { detail: { timestamp: clearTimestamp, mode: 'worker' } }));
          clearChatHistoryCloud('worker').catch(err => console.warn('[ChatContext] Błąd czyszczenia chmury worker:', err));
        } else {
          localStorage.setItem('system_chat_cleared_mentor', String(clearTimestamp));
          const welcome = [{ 
            id: `welcome_mentor_${clearTimestamp}`,
            role: 'ai', 
            content: t('chatOnlineMentor', 'Cześć. Z czym się dzisiaj mierzysz? Chłodna analiza bez słodzenia gwarantowana.'), 
            timestamp: clearIso,
            chatMode: 'mentor'
          }];
          setMentorMessages(welcome);
          localStorage.setItem('system_mentor_history', JSON.stringify(welcome));
          setThoughtsLog([t("chatMentorReset", "System Mentor zresetowany. Oczekiwanie na dane wejściowe...")]);
          window.dispatchEvent(new CustomEvent('chatCleared', { detail: { timestamp: clearTimestamp, mode: 'mentor' } }));
          clearChatHistoryCloud('mentor').catch(err => console.warn('[ChatContext] Błąd czyszczenia chmury mentor:', err));
        }
        return;
      }
      
      if (cmd === '/help') {
        pushSysMsg(t('chatHelpMsg', 'Dostępne polecenia systemowe:\n- /clear - czyści ekran obecnego trybu oraz usuwa historię z chmury.\n- /purge - agresywnie usuwa historię z pamięci podręcznej i chmury dla obu trybów.\n- /mode [worker|mentor] - przełącza tryb sztucznej inteligencji.\n- /export - zapisuje log z rozmową do pliku na dysku twardym.\n- /ping - weryfikuje łączność i opóźnienie do API System.'));
        return;
      }

      if (cmd === '/mode') {
        const newMode = args[0];
        if (newMode === 'worker' || newMode === 'mentor') {
          setMode(newMode);
          setTimeout(() => {
            if (newMode === 'worker') {
              setWorkerMessages(prev => [...prev, { role: 'ai', content: t('chatSwitchedWorker', '[*] INFO: Przełączono na tryb inżynieryjny (WORKER).'), isSystem: true, timestamp: new Date().toISOString() }]);
            } else {
              setMentorMessages(prev => [...prev, { role: 'ai', content: t('chatSwitchedMentor', '[*] INFO: Przełączono na tryb analityczny (MENTOR).'), isSystem: true, timestamp: new Date().toISOString() }]);
            }
          }, 0);
        } else {
          pushSysMsg(t('chatUnknownMode', '[!] BŁĄD: Nieznany tryb. Użyj: /mode worker lub /mode mentor'));
        }
        return;
      }

      if (cmd === '/export') {
        const msgs = mode === 'worker' ? workerMessages : mentorMessages;
        const textToSave = msgs.map(m => `[${m.role.toUpperCase()}]: ${m.content}`).join('\n\n');
        const blob = new Blob([textToSave], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `system_log_${mode}_${new Date().toISOString().slice(0,10)}.txt`;
        a.click();
        pushSysMsg(t('chatExportSuccess', '[+] SUCCESS: Pomyślnie wyeksportowano log konwersacji trybu ') + mode.toUpperCase());
        return;
      }

      if (cmd === '/purge') {
        const clearTimestamp = Date.now();
        const clearIso = new Date(clearTimestamp).toISOString();

        localStorage.setItem('system_chat_cleared_worker', String(clearTimestamp));
        localStorage.setItem('system_chat_cleared_mentor', String(clearTimestamp));
        localStorage.removeItem('system_chat_history');
        localStorage.removeItem('system_mentor_history');

        const workerWelcome = [{ 
          id: `welcome_worker_${clearTimestamp}`,
          role: 'ai', 
          content: t('chatPurgeWorker', 'SYSTEM ONLINE. Pamięć podręczna całkowicie wyczyszczona.'), 
          timestamp: clearIso,
          chatMode: 'worker'
        }];
        const mentorWelcome = [{ 
          id: `welcome_mentor_${clearTimestamp}`,
          role: 'ai', 
          content: t('chatPurgeMentor1', 'Pamięć długoterminowa zresetowana. Czekam na nowe wytyczne.'), 
          timestamp: clearIso,
          chatMode: 'mentor'
        }];

        setWorkerMessages(workerWelcome);
        setMentorMessages(mentorWelcome);
        setThoughtsLog([t("chatPurgeMentor2", "System Mentor uruchomiony (PURGED).")]);

        window.dispatchEvent(new CustomEvent('chatCleared', { detail: { timestamp: clearTimestamp, mode: 'all' } }));
        clearChatHistoryCloud('all').catch(err => console.warn('[ChatContext] Błąd purge chmury:', err));
        return;
      }

      if (cmd === '/ping') {
        const start = Date.now();
        pushSysMsg(t('chatPing', '[*] INFO: PINGowanie systemu...'));
        axios.get('/api/weather', { timeout: 5000 }).then(() => {
          const end = Date.now();
          pushSysMsg(t('chatPingSuccess', '[+] SUCCESS: Połączenie stabilne. Opóźnienie: ') + (end - start) + 'ms.');
        }).catch(err => {
          pushSysMsg(t('chatPingError', '[!] ERROR: Połączenie niestabilne. Błąd: ') + err.message);
        });
        return;
      }

      pushSysMsg(t('chatUnknownCmd', '[!] BŁĄD: Nieznana komenda ') + cmd + '. Wpisz /help, aby zobaczyć listę.');
      return;
    }

    setIsProcessing(true);

    const savedNews = localStorage.getItem('system_news_categories');
    const newsCategories = savedNews ? JSON.parse(savedNews) : ['ai', 'security'];
    const userName = localStorage.getItem('system_user_name') || 'Użytkownik';
    const systemLanguage = localStorage.getItem('system_language') || 'pl';
    const nowIso = new Date().toISOString();
    const userMsgId = Date.now().toString();

    const userMsg = { id: userMsgId, role: 'user', content: userText, timestamp: nowIso, chatMode: mode };

    if (!ghostMode) {
      saveCloudDocument('chat_history', userMsgId, userMsg);
    }

    if (mode === 'mentor') {
      setMentorMessages(prev => [...prev, userMsg]);
      try {
        const result = await dispatchAiQuery({
          text: userText,
          mode: 'mentor',
          newsCategories,
          userName,
          language: systemLanguage
        });

        const content = result.content || t("chatParseErr", "Błąd parsowania odpowiedzi.");
        const aiMsgId = (Date.now() + 1).toString();
        const aiMsg = { id: aiMsgId, role: 'ai', content, timestamp: new Date().toISOString(), chatMode: 'mentor' };
        
        setMentorMessages(prev => [...prev, aiMsg]);
        if (!ghostMode) {
          saveCloudDocument('chat_history', aiMsgId, aiMsg);
        }

        if (result.mentor_thoughts) {
          const time = new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
          setThoughtsLog(prev => [`${time} > ${result.mentor_thoughts}`, ...prev]);
        }
        setIsProcessing(false);
        return { content, widgets: result.widgets || [] };
      } catch (err) {
        setMentorMessages(prev => [...prev, { role: 'ai', content: t('chatConnErr', 'BŁĄD POŁĄCZENIA: ') + err.message, timestamp: new Date().toISOString() }]);
        setIsProcessing(false);
        return { content: t("chatSorryErr", "Przepraszam, wystąpił błąd połączenia."), widgets: [] };
      }
    }

    // WORKER MODE
    setWorkerMessages(prev => [...prev, userMsg]);
    try {
      const result = await dispatchAiQuery({
        text: userText,
        mode: 'worker',
        newsCategories,
        userName,
        language: systemLanguage
      });

      const content = result.content || t('chatDone', 'Polecenie zrealizowane.');
      const widgets = result.widgets || [];
      const aiMsgId = (Date.now() + 1).toString();
      const aiMsg = { id: aiMsgId, role: 'ai', content, widgets, timestamp: new Date().toISOString(), chatMode: 'worker' };

      setWorkerMessages(prev => [...prev, aiMsg]);
      if (!ghostMode) {
        saveCloudDocument('chat_history', aiMsgId, aiMsg);
      }

      setIsProcessing(false);
      return { content, widgets };
    } catch (error) {
      setWorkerMessages(prev => [...prev, {
        role: 'ai',
        content: t('chatTimeout', 'BŁĄD POŁĄCZENIA: ') + (error?.message || 'Nieznany błąd'),
        timestamp: new Date().toISOString()
      }]);
      setIsProcessing(false);
    }
  };

  const value = {
    mode, setMode,
    showThoughts, setShowThoughts,
    isProcessing,
    workerMessages, setWorkerMessages,
    mentorMessages, setMentorMessages,
    thoughtsLog, setThoughtsLog,
    sendCommand
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => useContext(ChatContext);
