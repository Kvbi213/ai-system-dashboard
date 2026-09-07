import { useTranslation } from 'react-i18next';
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { dispatchAiQuery } from '../services/clientAiDispatcher';

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
        const saved = localStorage.getItem('system_chat_history');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {
        console.warn('Nie udało się załadować historii czatu:', e);
      }
    }
    return [{ role: 'ai', content: t('chatOnlineWorker', 'SYSTEM ONLINE. Oczekuję na polecenia, mordo.') }];
  });

  const [mentorMessages, setMentorMessages] = useState(() => {
    const ghostMode = localStorage.getItem('system_ghost_mode') === 'true';
    if (!ghostMode) {
      try {
        const saved = localStorage.getItem('system_mentor_history');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {
        console.warn('Nie udało się załadować historii mentora:', e);
      }
    }
    return [{ role: 'ai', content: t('chatOnlineMentor', 'Cześć. Z czym się dzisiaj mierzysz? Chłodna analiza bez słodzenia gwarantowana.') }];
  });

  const [thoughtsLog, setThoughtsLog] = useState([
    t("chatMentorActive", "System Mentor aktywowany. Oczekiwanie na dane wejściowe..."),
  ]);

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

    if (userText.startsWith('/')) {
      const [cmd, ...args] = userText.toLowerCase().split(' ');
      const pushSysMsg = (content) => {
        if (mode === 'worker') setWorkerMessages(prev => [...prev, { role: 'ai', content, isSystem: true }]);
        else setMentorMessages(prev => [...prev, { role: 'ai', content, isSystem: true }]);
      };

      if (cmd === '/clear') {
        if (mode === 'worker') {
          setWorkerMessages([{ role: 'ai', content: t('chatOnlineWorker', 'SYSTEM ONLINE. Oczekuję na polecenia, mordo.') }]);
        } else {
          setMentorMessages([{ role: 'ai', content: t('chatOnlineMentor', 'Cześć. Z czym się dzisiaj mierzysz? Chłodna analiza bez słodzenia gwarantowana.') }]);
          setThoughtsLog([t("chatMentorReset", "System Mentor zresetowany. Oczekiwanie na dane wejściowe...")]);
        }
        return;
      }
      
      if (cmd === '/help') {
        pushSysMsg(t('chatHelpMsg', 'Dostępne polecenia systemowe:\n- /clear - czyści ekran obecnego trybu.\n- /purge - agresywnie usuwa lokalną historię z pamięci cache i czyści ekran.\n- /mode [worker|mentor] - przełącza tryb sztucznej inteligencji.\n- /export - zapisuje log z rozmową do pliku na dysku twardym.\n- /ping - weryfikuje łączność i opóźnienie do API System.'));
        return;
      }

      if (cmd === '/mode') {
        const newMode = args[0];
        if (newMode === 'worker' || newMode === 'mentor') {
          setMode(newMode);
          setTimeout(() => {
            if (newMode === 'worker') {
              setWorkerMessages(prev => [...prev, { role: 'ai', content: t('chatSwitchedWorker', '[*] INFO: Przełączono na tryb inżynieryjny (WORKER).'), isSystem: true }]);
            } else {
              setMentorMessages(prev => [...prev, { role: 'ai', content: t('chatSwitchedMentor', '[*] INFO: Przełączono na tryb analityczny (MENTOR).'), isSystem: true }]);
            }
          }, 0);
        } else {
          pushSysMsg(t('chatUnknownMode', '[!] BŁĄD: Nieznany tryb. Użyj: /mode worker lub /mode mentor'));
        }
        return;
      }

      if (cmd === '/export') {
        const msgs = mode === 'worker' ? workerMessages : mentorMessages;
        const textToSave = msgs.map(m => `[${m.role.toUpperCase()}]: ${m.content}`).join('\\n\\n');
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
        localStorage.removeItem(mode === 'worker' ? 'system_chat_history' : 'system_mentor_history');
        if (mode === 'worker') {
          setWorkerMessages([{ role: 'ai', content: t('chatPurgeWorker', 'SYSTEM ONLINE. Pamięć podręczna całkowicie wyczyszczona.') }]);
        } else {
          setMentorMessages([{ role: 'ai', content: t('chatPurgeMentor1', 'Pamięć długoterminowa zresetowana. Czekam na nowe wytyczne.') }]);
          setThoughtsLog([t("chatPurgeMentor2", "System Mentor uruchomiony (PURGED).")]);
        }
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

    if (mode === 'mentor') {
      setMentorMessages(prev => [...prev, { role: 'user', content: userText }]);
      try {
        const result = await dispatchAiQuery({
          text: userText,
          mode: 'mentor',
          newsCategories,
          userName,
          language: systemLanguage
        });

        const content = result.content || t("chatParseErr", "Błąd parsowania odpowiedzi.");
        setMentorMessages(prev => [...prev, { role: 'ai', content }]);
        if (result.mentor_thoughts) {
          const time = new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
          setThoughtsLog(prev => [`${time} > ${result.mentor_thoughts}`, ...prev]);
        }
        setIsProcessing(false);
        return { content, widgets: result.widgets || [] };
      } catch (err) {
        setMentorMessages(prev => [...prev, { role: 'ai', content: t('chatConnErr', 'BŁĄD POŁĄCZENIA: ') + err.message }]);
        setIsProcessing(false);
        return { content: t("chatSorryErr", "Przepraszam, wystąpił błąd połączenia."), widgets: [] };
      }
    }

    // WORKER MODE
    setWorkerMessages(prev => [...prev, { role: 'user', content: userText }]);
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
      setWorkerMessages(prev => [...prev, { role: 'ai', content, widgets }]);
      setIsProcessing(false);
      return { content, widgets };
    } catch (error) {
      setWorkerMessages(prev => [...prev, {
        role: 'ai',
        content: t('chatTimeout', 'BŁĄD POŁĄCZENIA: ') + (error?.message || 'Nieznany błąd')
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
