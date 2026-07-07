import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const GlobalEventListener = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const eventSource = new EventSource('/api/events');

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
      console.error('SSE Error:', error);
    };

    return () => {
      eventSource.close();
    };
  }, [navigate]);

  return null;
};

export default GlobalEventListener;
