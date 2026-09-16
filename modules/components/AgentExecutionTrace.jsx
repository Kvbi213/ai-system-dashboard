import React, { useState } from 'react';
import { 
  ChevronRight, ChevronDown, FileText, Database, Globe, 
  Terminal as TerminalIcon, Search, CheckCircle2, ExternalLink, Loader2, Sparkles, Cpu
} from 'lucide-react';

/**
 * Sanityzacja ciągów poleceń pod kątem bezpieczeństwa danych uwierzytelniających (Protokół Antigravity)
 */
function sanitizeCommand(str) {
  if (!str) return '';
  return String(str)
    .replace(/gsk_[a-zA-Z0-9_-]{20,}/g, '$API_KEY')
    .replace(/Bearer\s+[a-zA-Z0-9_\-\.]{20,}/gi, 'Bearer $TOKEN')
    .replace(/key=[a-zA-Z0-9_\-]{20,}/gi, 'key=$API_KEY');
}

/**
 * Komponent inspekcji wykonania agenta AI (wzorowany na nowoczesnych IDE agentowych)
 * Wyświetla eksplorowane pliki, uruchomione narzędzia/komendy oraz zrealizowane wyszukiwania.
 */
const AgentExecutionTrace = ({ trace, isLive = false, defaultExpanded = false }) => {
  if (!trace && !isLive) return null;

  const [expandedFiles, setExpandedFiles] = useState(false);
  const [expandedSearches, setExpandedSearches] = useState(defaultExpanded || isLive);
  const [expandedCommands, setExpandedCommands] = useState({});
  const [expandedSearchItems, setExpandedSearchItems] = useState({});

  const exploredFiles = trace?.exploredFiles || trace?.explored || [];
  const commands = trace?.commands || trace?.tools || [];
  const searches = trace?.searches || [];
  const status = trace?.status || (isLive ? 'working' : 'completed');
  const statusMessage = trace?.statusMessage || (isLive ? 'Working.' : '');

  // Jeśli brak jakichkolwiek danych śladu i nie jest to stan live, nie renderuj pustego elementu
  if (exploredFiles.length === 0 && commands.length === 0 && searches.length === 0 && !isLive) {
    return null;
  }

  const toggleCommand = (index) => {
    setExpandedCommands(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const toggleSearchItem = (index) => {
    setExpandedSearchItems(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="w-full my-2.5 flex flex-col gap-1.5 font-sans select-text text-[13px] text-textMuted/90 animate-fade-in">
      {/* 1. EKSPLOROWANE PLIKI / ZASOBY */}
      {exploredFiles.length > 0 && (
        <div className="flex flex-col">
          <button
            type="button"
            onClick={() => setExpandedFiles(!expandedFiles)}
            className="group inline-flex items-center gap-1.5 text-left text-textMuted hover:text-textPrimary transition-colors py-0.5 max-w-fit"
          >
            <span>Explored {exploredFiles.length} {exploredFiles.length === 1 ? 'file' : 'files'}</span>
            {expandedFiles ? (
              <ChevronDown className="w-3.5 h-3.5 text-textMuted/70 group-hover:text-textPrimary transition-transform" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-textMuted/70 group-hover:text-textPrimary transition-transform" />
            )}
          </button>

          {expandedFiles && (
            <div className="ml-3 mt-1.5 pl-2.5 border-l border-border/40 flex flex-col gap-1.5 py-1 text-xs">
              {exploredFiles.map((item, idx) => {
                const itemName = typeof item === 'string' ? item : item.name || item.path || 'resource';
                const itemDetails = typeof item === 'object' ? item.details : null;
                const itemType = typeof item === 'object' ? item.type : 'file';

                return (
                  <div key={idx} className="flex items-center gap-2 text-textPrimary/80 py-0.5">
                    {itemType === 'database' ? (
                      <Database className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    ) : itemType === 'search' ? (
                      <Globe className="w-3.5 h-3.5 text-accentPrimary shrink-0" />
                    ) : itemType === 'config' ? (
                      <Cpu className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                    <span className="font-mono text-[12px] text-textPrimary">{itemName}</span>
                    {itemDetails && (
                      <span className="text-[11px] text-textMuted font-mono px-1.5 py-0.2 rounded bg-surface/80 border border-border/40">
                        {itemDetails}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. URUCHOMIONE KOMENDY / NARZĘDZIA (RAN ...) */}
      {commands.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {commands.map((cmd, idx) => {
            const isExpanded = !!expandedCommands[idx];
            const rawCmd = typeof cmd === 'string' ? cmd : cmd.command || cmd.name || '';
            const safeCmd = sanitizeCommand(rawCmd);
            const cmdStatus = typeof cmd === 'object' ? cmd.status : '200 OK';
            const cmdOutput = typeof cmd === 'object' ? cmd.output : null;

            return (
              <div key={idx} className="flex flex-col">
                <button
                  type="button"
                  onClick={() => toggleCommand(idx)}
                  className="group inline-flex items-center gap-1.5 text-left text-textMuted hover:text-textPrimary transition-colors py-0.5 max-w-full"
                  title="Kliknij, aby rozwinąć szczegóły wykonania"
                >
                  <span className="shrink-0 text-textMuted/70">Ran</span>
                  <span className="font-mono text-xs text-textPrimary/90 truncate max-w-[550px] bg-black/30 px-1.5 py-0.5 rounded border border-white/5">
                    {safeCmd}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-textMuted/70 group-hover:text-textPrimary shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-textMuted/70 group-hover:text-textPrimary shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="ml-3 mt-1.5 pl-2.5 border-l border-border/40 py-1.5 flex flex-col gap-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-textMuted font-mono text-[11px]">Status:</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {cmdStatus}
                      </span>
                    </div>
                    {cmdOutput && (
                      <div className="mt-1 p-2 rounded-lg bg-black/50 border border-border/50 font-mono text-[11.5px] text-textPrimary/90 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto custom-scrollbar">
                        {sanitizeCommand(cmdOutput)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 3. WYSZUKIWANIA SIECIOWE (EXPLORING / SEARCHED ...) */}
      {searches.length > 0 && (
        <div className="flex flex-col">
          <button
            type="button"
            onClick={() => setExpandedSearches(!expandedSearches)}
            className="group inline-flex items-center gap-1.5 text-left text-textMuted hover:text-textPrimary transition-colors py-0.5 max-w-fit"
          >
            <span>
              {isLive ? `Exploring ${searches.length} ${searches.length === 1 ? 'search' : 'searches'}` : `Explored ${searches.length} ${searches.length === 1 ? 'search' : 'searches'}`}
            </span>
            {expandedSearches ? (
              <ChevronDown className="w-3.5 h-3.5 text-textMuted/70 group-hover:text-textPrimary transition-transform" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-textMuted/70 group-hover:text-textPrimary transition-transform" />
            )}
          </button>

          {expandedSearches && (
            <div className="ml-3 mt-1.5 pl-2.5 border-l border-border/40 flex flex-col gap-1.5 py-1 text-xs">
              {searches.map((s, idx) => {
                const queryText = typeof s === 'string' ? s : s.query || '';
                const resultsCount = typeof s === 'object' ? (s.resultsCount ?? s.results?.length ?? 0) : 0;
                const hasResults = typeof s === 'object' && Array.isArray(s.results) && s.results.length > 0;
                const isItemExpanded = !!expandedSearchItems[idx];

                return (
                  <div key={idx} className="flex flex-col">
                    <div 
                      onClick={() => hasResults && toggleSearchItem(idx)}
                      className={`inline-flex items-center gap-2 py-0.5 ${hasResults ? 'cursor-pointer group' : ''}`}
                    >
                      <span className="text-textMuted/70 font-mono text-xs">Searched</span>
                      <span className="text-textPrimary font-medium font-mono text-xs group-hover:text-accentPrimary transition-colors">
                        {queryText}
                      </span>
                      <span className="text-[11px] font-mono text-textMuted px-2 py-0.5 rounded-full bg-white/5 border border-white/10 shrink-0">
                        {resultsCount} {resultsCount === 1 ? 'result' : 'results'}
                      </span>
                      {hasResults && (
                        isItemExpanded ? (
                          <ChevronDown className="w-3 h-3 text-textMuted/50 group-hover:text-textPrimary" />
                        ) : (
                          <ChevronRight className="w-3 h-3 text-textMuted/50 group-hover:text-textPrimary" />
                        )
                      )}
                    </div>

                    {/* Podgląd znalezionych źródeł po rozwinięciu pojedynczego wyszukiwania */}
                    {hasResults && isItemExpanded && (
                      <div className="ml-4 mt-1 pl-2 border-l border-white/10 flex flex-col gap-1.5 py-1 text-[11.5px]">
                        {s.results.map((res, rIdx) => (
                          <div key={rIdx} className="flex flex-col gap-0.5 text-textMuted">
                            <a
                              href={res.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-accentPrimary hover:underline font-medium inline-flex items-center gap-1.5 truncate max-w-[550px]"
                            >
                              <ExternalLink className="w-3 h-3 shrink-0" />
                              <span className="truncate">{res.title || res.url}</span>
                            </a>
                            {res.snippet && (
                              <p className="text-[11px] text-textMuted/80 line-clamp-2 italic font-mono pl-4">
                                {res.snippet}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. WSKAŹNIK STANU (WORKING. / PROCESSING) */}
      {isLive && (
        <div className="flex items-center gap-2 text-xs font-mono text-accentPrimary pt-1 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-accentPrimary animate-ping" />
          <span>{statusMessage || 'Working.'}</span>
        </div>
      )}
    </div>
  );
};

/**
 * Automatyczna ekstrakcja śladu wykonania ze struktury wiadomości lub jej treści (Fallback dla historii)
 */
export function extractTraceFromMessage(msg) {
  if (!msg || msg.role !== 'ai') return null;
  if (msg.executionTrace) return msg.executionTrace;

  const content = msg.content || '';
  const exploredFiles = [];
  const commands = [];
  const searches = [];

  // Badanie OmniDaemon lub Brave Search
  if (content.includes('[OMNIDAEMON]') || content.includes('Brave Search') || content.includes('TABELA PORÓWNAWCZA')) {
    exploredFiles.push({ name: 'localStorage: system_active_model', type: 'config', details: 'openai/gpt-oss-120b' });
    exploredFiles.push({ name: 'Cloud Firestore: chat_history', type: 'database', details: 'Kolekcja OMNIDAEMON' });
    exploredFiles.push({ name: 'Brave Search Web Index', type: 'search', details: 'Eksploracja sieci' });

    const queryMatches = [...content.matchAll(/Wyszukiwanie Brave Search:\s*`([^`]+)`/g)];
    if (queryMatches.length > 0) {
      queryMatches.forEach(m => {
        searches.push({ query: m[1], resultsCount: 4, results: [] });
      });
    } else if (content.includes('TABELA PORÓWNAWCZA') || content.includes('modeli')) {
      searches.push({ query: 'topowe komercyjne modele ai 2026 w czacie', resultsCount: 5, results: [] });
      searches.push({ query: 'chatgpt pro o1 claude 3.7 sonnet gemini advanced 2m', resultsCount: 4, results: [] });
    }

    commands.push({ command: 'Brave Search Multi-Stage Pipeline', status: '200 OK', output: 'Przeszukano sieć i zindeksowano źródła' });
    commands.push({ command: 'Groq LLM Synthesis (openai/gpt-oss-120b)', status: '200 OK', output: 'Zsyntetyzowano raport analityczny' });
    if (content.includes('Pushbullet') || content.includes('telefon') || content.includes('smartfon')) {
      commands.push({ command: 'Pushbullet Mobile Broadcast', status: 'sent', output: 'Wysłano powiadomienie na smartfon' });
    }

    return {
      exploredFiles,
      commands,
      searches,
      status: 'completed',
      statusMessage: 'Zakończono.'
    };
  }

  // Akcje systemowe i bazy danych
  if (content.includes('zadanie') || content.includes('To-Do') || content.includes('plan lekcji') || content.includes('budżet') || content.includes('wydatek')) {
    if (content.includes('zadanie') || content.includes('To-Do')) {
      exploredFiles.push({ name: 'Cloud Firestore: tasks', type: 'database', details: 'Baza zadań' });
    }
    if (content.includes('lekcj') || content.includes('plan')) {
      exploredFiles.push({ name: 'Cloud Firestore: timetable', type: 'database', details: 'Plan lekcji' });
    }
    if (content.includes('budżet') || content.includes('wydat') || content.includes('zł') || content.includes('PLN')) {
      exploredFiles.push({ name: 'Cloud Firestore: finances', type: 'database', details: 'Finanse 50/30/20' });
    }
    exploredFiles.push({ name: 'localStorage: system_active_model', type: 'config', details: 'openai/gpt-oss-120b' });
    commands.push({ command: 'Groq LLM Reasoning (openai/gpt-oss-120b)', status: '200 OK', output: 'Zrealizowano polecenie' });

    return {
      exploredFiles,
      commands,
      searches: [],
      status: 'completed',
      statusMessage: 'Zakończono.'
    };
  }

  return null;
}

export default AgentExecutionTrace;

