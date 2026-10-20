import React, { useState } from 'react';
import Terminal from '../components/Terminal';
import ModelWidget from '../components/ModelWidget';

const ChatPage = () => {
  const [showModels, setShowModels] = useState(false);

  return (
    <div id="tour-terminal" className="flex flex-col h-full rounded-2xl bg-surface-container-low border border-white/[0.04] p-space-md sm:p-space-lg relative overflow-hidden shadow-xl animate-soft-enter">
      {/* Top Ambient Glow */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-40"></div>
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-sm mb-space-md flex-shrink-0">
        <div className="flex flex-col gap-space-xs">
          <nav aria-label="breadcrumb" className="flex items-center space-x-2 font-code-mono text-label-sm text-outline">
            <span className="hover:text-primary transition-colors cursor-pointer">OmniDash</span>
            <span className="text-outline-variant">/</span>
            <span>Core Systems</span>
            <span className="text-outline-variant">/</span>
            <span className="text-primary font-medium">Omni Chat &amp; AI</span>
          </nav>
          <div className="flex items-center gap-space-sm flex-wrap">
            <h2 className="font-headline-md text-headline-md font-bold text-on-surface tracking-tight">
              Omni Chat &amp; Asystent Kognitywny
            </h2>
            <span className="px-space-xs py-0.5 rounded-full bg-surface-container-high text-primary font-code-mono text-[11px] font-semibold flex items-center gap-1 border border-white/[0.04]">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              Groq LPU 120t/s • Llama 3.3 70B
            </span>
          </div>
        </div>

        <div className="flex items-center gap-space-xs">
          <button 
            type="button"
            onClick={() => setShowModels(!showModels)}
            className={`flex items-center gap-space-xs px-space-md py-1.5 rounded-lg border text-label-md font-label-md font-medium transition-all active:scale-95 ${
              showModels 
                ? 'bg-primary border-primary text-on-primary font-semibold shadow-[0_0_16px_rgba(173,198,255,0.3)]' 
                : 'border-white/[0.08] bg-surface-container text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">smart_toy</span>
            <span>Modele AI &amp; Parametry</span>
          </button>
        </div>
      </div>
      
      {/* Models Modal Overlay */}
      {showModels && (
        <div className="fixed inset-x-3 top-20 bottom-24 md:bottom-auto md:absolute md:top-20 md:right-8 md:w-[420px] md:h-[380px] z-50 shadow-[0_0_40px_rgba(0,0,0,0.8)] rounded-2xl bg-surface-container-low border border-white/[0.1] p-space-sm animate-scale-in">
          <button 
            type="button"
            onClick={() => setShowModels(false)}
            className="absolute -top-3 -right-3 bg-surface-container-highest border border-white/[0.1] w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-on-surface z-50 transition-colors shadow-lg active:scale-90"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
          <ModelWidget />
        </div>
      )}
      
      {/* Terminal Viewport Container */}
      <div className="flex-1 w-full relative min-h-0 overflow-hidden rounded-xl bg-surface-container-lowest border border-white/[0.04]">
        <Terminal />
      </div>
    </div>
  );
};

export default ChatPage;
