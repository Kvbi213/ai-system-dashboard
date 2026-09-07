import React, { useState } from 'react';
import { Bot, X } from 'lucide-react';
import Terminal from '../components/Terminal';
import ModelWidget from '../components/ModelWidget';

const ChatPage = () => {
  const [showModels, setShowModels] = useState(false);
  return (
    <div id="tour-terminal" className="flex flex-col h-full glass-panel rounded-xl border border-border p-3 sm:p-5 md:p-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accentPrimary to-transparent opacity-50"></div>
      
      <div className="flex items-center justify-between mb-3 sm:mb-6 flex-shrink-0">
        <div className="flex flex-col">
          <nav aria-label="breadcrumb" className="hidden sm:flex items-center space-x-2 text-sm text-textMuted mb-0.5">
            <span className="flex items-center text-sm font-medium text-textMuted/70">OmniDash</span>
            <span className="shrink-0 text-sm font-medium text-textMuted/70">/</span>
            <span className="flex items-center text-sm font-medium text-textPrimary">Asystent AI</span>
          </nav>
          <h2 className="font-mono text-base sm:text-lg font-bold text-textPrimary">OmniChat AI</h2>
          <p className="font-sans text-[11px] sm:text-xs text-textMuted">Inteligentny interfejs konwersacyjny</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            onClick={() => setShowModels(!showModels)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-sans font-medium transition-colors ${showModels ? 'bg-accentPrimary border-accentPrimary text-black' : 'border-border text-textPrimary hover:bg-surface'}`}
          >
            <Bot className="w-4 h-4" /> Modele AI
          </button>
        </div>
      </div>
      
      {showModels && (
        <div className="fixed inset-x-3 top-16 bottom-20 md:bottom-auto md:absolute md:top-20 md:right-8 md:w-[400px] md:h-[350px] z-50 shadow-[0_0_30px_rgba(var(--color-accent-primary-hex),0.2)] rounded-xl opacity-0 animate-soft-enter">
          <button 
            onClick={() => setShowModels(false)}
            className="absolute -top-3 -right-3 bg-surface border border-border p-1.5 rounded-full text-textMuted hover:text-accentPrimary z-50 transition-colors shadow-lg"
          >
            <X className="w-4 h-4" />
          </button>
          <ModelWidget />
        </div>
      )}
      
      <div className="flex-1 w-full relative min-h-0 overflow-hidden">
        <Terminal />
      </div>
    </div>
  );
};

export default ChatPage;
