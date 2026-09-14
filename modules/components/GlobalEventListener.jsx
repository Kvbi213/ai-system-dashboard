import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { wakeWordService } from '../services/wakeWordService';

const GlobalEventListener = () => {
  const navigate = useNavigate();

  // Obsługa detekcji słowa wybudzającego "Hej Omni" i przekierowania do czatu
  useEffect(() => {
    wakeWordService.start();

    const handleWakeWord = (e) => {
      const payload = e.detail?.payload || '';
      navigate('/chat');
      // Krótki timeout gwarantujący zamontowanie komponentu ChatPage / Terminal
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('startContinuousLiveVoice', {
          detail: { payload }
        }));
      }, 150);
    };

    const handleOpenVoice = () => {
      navigate('/chat');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('startContinuousLiveVoice', {
          detail: { payload: '' }
        }));
      }, 150);
    };

    window.addEventListener('wakeWordDetected', handleWakeWord);
    window.addEventListener('openLiveVoiceModal', handleOpenVoice);
    window.addEventListener('startLiveVoiceChat', handleOpenVoice);

    return () => {
      window.removeEventListener('wakeWordDetected', handleWakeWord);
      window.removeEventListener('openLiveVoiceModal', handleOpenVoice);
      window.removeEventListener('startLiveVoiceChat', handleOpenVoice);
      wakeWordService.stop();
    };
  }, [navigate]);

  useEffect(() => {
    const isCloudMode = typeof window !== 'undefined' && (window.location.hostname.includes('web.app') || window.location.hostname.includes('firebaseapp.com'));
    if (isCloudMode) return;

    let eventSource;
    try {
      eventSource = new EventSource('/api/events');

      eventSource.addEventListener('navigate', (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data && data.path) {
            navigate(data.path);
          }
        } catch (err) {
          console.error('Błąd parsowania zdarzenia navigate:', err);
        }
      });

      eventSource.addEventListener('osint_scan_start', (e) => {
        console.log('OSINT scan started in background:', e.data);
      });

      eventSource.addEventListener('reload', () => {
        window.location.reload();
      });

      eventSource.onerror = (error) => {
        console.warn('SSE rozłączone (serwer offline):', error);
      };
    } catch (err) {
      console.warn('Nie udało się zainicjować SSE:', err);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [navigate]);

  return null;
};

export default GlobalEventListener;
