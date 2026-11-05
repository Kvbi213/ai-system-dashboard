import React from 'react';
import { Sparkles, User, Copy, Check } from 'lucide-react';
import { ToolCallingAccordion } from './ToolCallingAccordion';
import { ChatInlineWidgetsContainer } from './ChatInlineWidgets';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  toolCall?: {
    toolName: string;
    args: Record<string, unknown>;
    output: string;
  };
  widgets?: string[];
}

interface ChatMessageItemProps {
  message: ChatMessage;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message }) => {
  const [copied, setCopied] = React.useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start group`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-sm ${
          isUser
            ? 'bg-sky-600 border-sky-500 text-white shadow-sky-500/20'
            : 'bg-white border-slate-200 text-sky-600 shadow-sm'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
      </div>

      {/* Bubble Container */}
      <div className={`max-w-[85%] sm:max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-sky-600 text-white rounded-tr-sm shadow-md shadow-sky-600/20'
              : 'glass-panel text-slate-800 rounded-tl-sm border-white/90 shadow-sm'
          }`}
        >
          {message.toolCall && (
            <ToolCallingAccordion
              toolName={message.toolCall.toolName}
              args={message.toolCall.args}
              output={message.toolCall.output}
            />
          )}

          <div className="whitespace-pre-wrap font-normal">{message.content}</div>

          {message.widgets && message.widgets.length > 0 && (
            <ChatInlineWidgetsContainer widgets={message.widgets} />
          )}
        </div>

        {/* Footer info: time & copy */}
        <div className="flex items-center gap-2 mt-1 px-1 text-[10px] text-slate-400 font-mono">
          <span>{message.timestamp}</span>
          <button
            onClick={handleCopy}
            className="opacity-0 group-hover:opacity-100 hover:text-slate-700 transition"
            title="Kopiuj treść"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>
    </div>
  );
};
