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
    <div className="my-2 rounded-xl bg-slate-50 border border-slate-200/90 text-xs overflow-hidden shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-slate-100/60 hover:bg-slate-100 transition text-slate-700 font-medium"
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-sky-600" />
          <span className="font-mono text-sky-800 font-bold">{toolName}</span>
          <span className="flex items-center gap-1 text-[10px] text-emerald-700 font-mono font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            SUCCESS
          </span>
        </div>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
      </button>

      {isOpen && (
        <div className="p-3 space-y-2 border-t border-slate-200 font-mono text-[11px] bg-white">
          <div>
            <span className="text-slate-500 font-bold">Argumenty:</span>
            <pre className="mt-1 p-2 rounded-lg bg-slate-50 text-slate-700 border border-slate-200 overflow-x-auto">
              {JSON.stringify(args, null, 2)}
            </pre>
          </div>
          <div>
            <span className="text-slate-500 font-bold">Wynik wykonania:</span>
            <pre className="mt-1 p-2 rounded-lg bg-slate-50 text-emerald-800 border border-slate-200 overflow-x-auto whitespace-pre-wrap">
              {output}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
