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
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/80 border border-slate-200/90 text-xs text-slate-700 hover:text-sky-700 hover:border-sky-300 whitespace-nowrap transition active:scale-95 shadow-sm font-medium"
          >
            <Sparkles className="w-3 h-3 text-sky-600" />
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
          className="w-full px-4 py-3 rounded-2xl bg-white/90 border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 pr-24 shadow-sm"
        />

        <div className="absolute right-2 flex items-center gap-1">
          <button
            type="button"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 transition"
            title="Nagrywanie głosowe"
          >
            <Mic className="w-4 h-4" />
          </button>

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`p-2 rounded-xl text-white transition shadow-sm ${
              input.trim() && !isLoading
                ? 'bg-sky-600 hover:bg-sky-500 active:scale-95 shadow-sky-600/20'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
