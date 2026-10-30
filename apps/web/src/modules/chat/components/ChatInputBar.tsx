import React, { useState } from 'react';
import { Send, Sparkles, Mic } from 'lucide-react';

interface ChatInputBarProps {
  onSendMessage: (text: string) => void;
  isLoading?: boolean;
}

const PROMPT_CHIPS = [
  'Jaki mam dzisiaj plan lekcji?',
  'Podsumuj moje oceny z matematyki',
  'Czy na trasie DK22 są aktywne radary?',
  'Stan portfela 50/30/20'
];

export const ChatInputBar: React.FC<ChatInputBarProps> = ({ onSendMessage, isLoading = false }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full space-y-2">
      {/* Quick Prompt Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {PROMPT_CHIPS.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => onSendMessage(chip)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 hover:text-sky-300 hover:border-sky-500/40 whitespace-nowrap transition active:scale-95"
          >
            <Sparkles className="w-3 h-3 text-sky-400" />
            <span>{chip}</span>
          </button>
        ))}
      </div>

      {/* Input container */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Zapytaj asystenta OmniDash v4..."
          disabled={isLoading}
          className="w-full px-4 py-3 rounded-2xl bg-slate-900/80 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 pr-24 shadow-inner"
        />

        <div className="absolute right-2 flex items-center gap-1">
          <button
            type="button"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 transition"
            title="Nagrywanie głosowe"
          >
            <Mic className="w-4 h-4" />
          </button>

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`p-2 rounded-xl text-white transition shadow-sm ${
              input.trim() && !isLoading
                ? 'bg-sky-500 hover:bg-sky-400 active:scale-95 shadow-sky-500/20'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
