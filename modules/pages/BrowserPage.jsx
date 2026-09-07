import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, RotateCw, Home, Shield, ExternalLink, Globe } from 'lucide-react';

const BrowserPage = () => {
  const { t } = useTranslation();
  const [url, setUrl] = useState('https://duckduckgo.com');
  const [inputUrl, setInputUrl] = useState('https://duckduckgo.com');
  const [iframeKey, setIframeKey] = useState(0);

  const handleNavigate = (e) => {
    e.preventDefault();
    let finalUrl = inputUrl;
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }
    setUrl(finalUrl);
    setInputUrl(finalUrl);
  };

  const reload = () => {
    setIframeKey(prev => prev + 1);
  };

  const goHome = () => {
    setUrl('https://duckduckgo.com');
    setInputUrl('https://duckduckgo.com');
  };

  return (
    <div className="flex flex-col h-full gap-4 pb-20 md:pb-0">
      <header className="glass-panel flex-shrink-0 flex flex-col items-start gap-4 p-5 opacity-0 animate-soft-enter" style={{ animationDelay: '50ms' }}>
        <div className="flex items-center gap-4 w-full border-b border-border/50 pb-4 mb-1">
          <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center flex-shrink-0 shadow-sm">
            <Globe className="w-5 h-5 text-textPrimary" />
          </div>
          <div className="flex flex-col">
            <nav aria-label="breadcrumb" className="flex items-center space-x-2 text-sm text-textMuted mb-0.5">
              <span className="flex items-center text-lg font-medium text-textMuted/70">OmniDash</span>
              <span className="shrink-0 text-lg font-medium text-textMuted/70">/</span>
              <span className="flex items-center text-lg font-medium text-textPrimary">Przeglądarka</span>
            </nav>
            <p className="font-sans text-xs text-textMuted mt-0.5">Wbudowana bezpieczna przeglądarka internetowa</p>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-4 w-full">
        
        <form onSubmit={handleNavigate} className="flex-1 flex gap-2 w-full">
          <div className="flex-1 relative">
            <input 
              type="text" 
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="w-full bg-black/40 border border-border rounded-lg py-2 pl-4 pr-10 text-textPrimary font-mono focus:outline-none focus:border-accentPrimary transition-colors"
              placeholder="Wprowadź URL..."
            />
          </div>
          <button type="submit" className="bg-surface hover:bg-accentPrimary/20 text-textPrimary hover:text-accentPrimary border border-border rounded-lg px-4 transition-colors">
            <Search className="w-5 h-5" />
          </button>
        </form>

        <div className="flex gap-2 w-full md:w-auto justify-end">
          <button onClick={reload} className="p-2 rounded-lg bg-surface hover:bg-accentPrimary/20 text-textMuted hover:text-accentPrimary transition-colors" title="Odśwież">
            <RotateCw className="w-5 h-5" />
          </button>
          <button onClick={goHome} className="p-2 rounded-lg bg-surface hover:bg-accentPrimary/20 text-textMuted hover:text-accentPrimary transition-colors" title="Strona Główna">
            <Home className="w-5 h-5" />
          </button>
          <a href={url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-surface hover:bg-accentPrimary/20 text-textMuted hover:text-accentPrimary transition-colors" title="Otwórz w nowej karcie">
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>
        </div>
      </header>

      <main className="flex-1 glass-panel overflow-hidden opacity-0 animate-soft-enter flex flex-col" style={{ animationDelay: '100ms' }}>
        <div className="w-full h-full bg-white rounded-2xl overflow-hidden relative">
          <iframe 
            key={iframeKey}
            src={url} 
            className="w-full h-full border-none"
            title="Embedded Browser"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          />
        </div>
      </main>
    </div>
  );
};

export default BrowserPage;
