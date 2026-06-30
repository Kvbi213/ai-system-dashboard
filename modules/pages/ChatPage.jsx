import React, { useState } from 'react';
import { Bot, X } from 'lucide-react';
import Terminal from '../components/Terminal';
import ModelWidget from '../components/ModelWidget';

const ChatPage = () => {
  const [showModels, setShowModels] = useState(false);
  return (
    <div id="tour-terminal" className="flex flex-col h-full glass-panel rounded-xl border border-border p-4 pb-20 md:pb-8 md:p-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accentPrimary to-transparent opacity-50"></div>
      
      <div className="flex items-center gap-4 mb-6 flex-shrink-0">
        <div className="w-3 h-3 rounded-full bg-accentPrimary animate-pulse"></div>
        <h1 className="font-mono text-2xl text-accentPrimary uppercase tracking-widest font-bold">
          AI Agent Terminal
        </h1>
        <div className="ml-auto flex items-center gap-4">
          <button 
            onClick={() => setShowModels(!showModels)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-mono font-bold uppercase tracking-widest transition-colors ${showModels ? 'bg-accentPrimary border-accentPrimary text-black' : 'border-accentPrimary/50 text-accentPrimary hover:bg-accentPrimary/10'}`}
          >
            <Bot className="w-4 h-4" /> Models
          </button>
          <span className="font-mono text-xs text-textMuted uppercase tracking-widest hidden sm:inline">Connection: Secure</span>
        </div>
      </div>
      
      {showModels && (
        <div className="absolute top-20 right-4 md:right-8 w-full max-w-[400px] h-[350px] z-50 shadow-[0_0_30px_rgba(var(--color-accent-primary-hex),0.2)] rounded-xl animate-fade-in-up">
          <button 
            onClick={() => setShowModels(false)}
            className="absolute -top-3 -right-3 bg-surface border border-border p-1.5 rounded-full text-textMuted hover:text-accentPrimary z-50 transition-colors"
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
