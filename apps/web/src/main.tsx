import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

// Obsługa okna popup Google OAuth 2.0 (przekazanie tokena do okna nadrzędnego)
if (window.opener && window.location.hash && (window.location.hash.includes('access_token=') || window.location.hash.includes('error='))) {
  try {
    window.opener.postMessage({ type: 'GOOGLE_OAUTH_RESPONSE', hash: window.location.hash }, window.location.origin);
    window.close();
  } catch (e) {
    console.error('Błąd przekazywania tokena OAuth do okna nadrzędnego:', e);
  }
}

const rootEl = document.getElementById('root');

if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <ThemeProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </React.StrictMode>
  );
}
