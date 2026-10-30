import React, { useState } from 'react';
import { Terminal, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';

interface ToolCallingAccordionProps {
  toolName: string;
  args: Record<string, unknown>;
  output: string;
}

export const ToolCallingAccordion: React.FC<ToolCallingAccordionProps> = ({
  toolName,
  args,
  output
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="my-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-slate-950/40 hover:bg-slate-900 transition text-slate-300"
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-sky-400" />
          <span className="font-mono text-sky-300 font-medium">{toolName}</span>
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
            <CheckCircle2 className="w-3 h-3" />
            SUCCESS
          </span>
        </div>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
      </button>

      {isOpen && (
        <div className="p-3 space-y-2 border-t border-slate-800/80 font-mono text-[11px] bg-slate-950/60">
          <div>
            <span className="text-slate-500 font-semibold">Argumenty:</span>
            <pre className="mt-1 p-2 rounded-lg bg-slate-900 text-slate-300 overflow-x-auto">
              {JSON.stringify(args, null, 2)}
            </pre>
          </div>
          <div>
            <span className="text-slate-500 font-semibold">Wynik wykonania:</span>
            <pre className="mt-1 p-2 rounded-lg bg-slate-900 text-emerald-300 overflow-x-auto whitespace-pre-wrap">
              {output}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
