import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Play, ToggleLeft, ToggleRight, Sparkles, Clock, Trash2, CheckCircle2, AlertTriangle, Code2, Plus } from 'lucide-react';
import { automationApi } from '../../../api/client';
import { useToast } from '../../../components/ui/Toast';

interface ScriptItem {
  id: string;
  name: string;
  description?: string;
  templateId: string;
  enabled: boolean;
  triggerType: 'interval' | 'cron' | 'lesson_bell' | 'manual';
  cronExpression?: string;
  code: string;
  lastRunAt?: string;
  lastStatus?: 'SUCCESS' | 'ERROR' | 'SKIPPED';
  lastLog?: string;
}

interface TemplateItem {
  id: string;
  name: string;
  description: string;
  category: string;
  sampleCode: string;
}

export const AutomationScriptsManager: React.FC = () => {
  const [scripts, setScripts] = useState<ScriptItem[]>([]);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [contextStatus, setContextStatus] = useState<any>(null);
  const [runningScriptId, setRunningScriptId] = useState<string | null>(null);
  const [expandedCodeId, setExpandedCodeId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('template_lesson_bell');
  const [newScriptName, setNewScriptName] = useState('');
  const [newScriptCode, setNewScriptCode] = useState('');

  const toast = useToast();

  const loadData = () => {
    automationApi.getScripts().then((res) => {
      if (res?.scripts) setScripts(res.scripts);
    }).catch(() => {});

    automationApi.getTemplates().then((res) => {
      if (res?.templates) {
        setTemplates(res.templates);
        if (res.templates.length > 0 && !newScriptCode) {
          setNewScriptCode(res.templates[0].sampleCode);
          setNewScriptName(res.templates[0].name);
        }
      }
    }).catch(() => {});

    automationApi.getContextStatus().then((res) => {
      setContextStatus(res);
    }).catch(() => {});
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleToggle = async (id: string) => {
    try {
      const res = await automationApi.toggleScript(id);
      if (res?.script) {
        setScripts((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: res.script.enabled } : s)));
        toast.success(`Skrypt ${res.script.enabled ? 'aktywowany' : 'wyłączony'}`);
      }
    } catch {
      toast.error('Błąd przełączania stanu skryptu');
    }
  };

  const handleRun = async (id: string) => {
    setRunningScriptId(id);
    try {
      const res = await automationApi.runScript(id);
      const execution = res?.execution;
      if (execution?.success) {
        toast.success(`Wykonano pomyślnie! Wysłane powiadomienia: ${execution.notificationsSent?.length || 0}`);
      } else {
        toast.error(`Błąd wykonania: ${execution?.error || 'Nieznany'}`);
      }
      loadData();
    } catch (e: any) {
      toast.error(`Błąd: ${e.message}`);
    } finally {
      setRunningScriptId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await automationApi.deleteScript(id);
      setScripts((prev) => prev.filter((s) => s.id !== id));
      toast.success('Usunięto skrypt automatyzacji');
    } catch {
      toast.error('Błąd usuwania skryptu');
    }
  };

  const handleSelectTemplate = (tplId: string) => {
    setSelectedTemplateId(tplId);
    const found = templates.find((t) => t.id === tplId);
    if (found) {
      setNewScriptName(found.name);
      setNewScriptCode(found.sampleCode);
    }
  };

  const handleCreateScript = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScriptName.trim() || !newScriptCode.trim()) return;

    try {
      const res = await automationApi.saveScript({
        name: newScriptName.trim(),
        templateId: selectedTemplateId,
        triggerType: selectedTemplateId === 'template_lesson_bell' ? 'lesson_bell' : 'cron',
        code: newScriptCode.trim(),
        enabled: true
      });
      if (res?.script) {
        setScripts((prev) => [res.script, ...prev]);
        toast.success('Utworzono nowy skrypt automatyzacji');
        setIsAdding(false);
      }
    } catch {
      toast.error('Nie udało się zapisać skryptu');
    }
  };

  return (
    <div className="space-y-4" data-testid="automation-scripts-manager">
      {/* Context Status HUD */}
      {contextStatus && (
        <GlassCard className="p-4" glow="sky">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Stan Kontekstu Lekcyjnego (Live)</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono">
                    ONLINE
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  {contextStatus.lessonInfo?.timeUntilNextEventFormatted || 'Brak danych'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="bg-white/80 dark:bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 font-medium">Aktualna: </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {contextStatus.lessonInfo?.currentLesson
                    ? `Lekcja ${contextStatus.lessonInfo.currentLesson.order}. ${contextStatus.lessonInfo.currentLesson.subject}`
                    : 'Przerwa / Wolne'}
                </span>
                {contextStatus.lessonInfo?.currentLesson?.timeRange && (
                  <span className="ml-1 text-[11px] text-slate-400 font-mono">({contextStatus.lessonInfo.currentLesson.timeRange})</span>
                )}
                {contextStatus.lessonInfo?.currentLesson?.classroom && (
                  <span className="ml-1 text-sky-600 font-bold">s. {contextStatus.lessonInfo.currentLesson.classroom}</span>
                )}
              </div>

              <div className="bg-white/80 dark:bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 font-medium">Kolejna: </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {contextStatus.lessonInfo?.nextLesson
                    ? `Lekcja ${contextStatus.lessonInfo.nextLesson.order}. ${contextStatus.lessonInfo.nextLesson.subject}`
                    : 'Koniec zajęć'}
                </span>
                {contextStatus.lessonInfo?.nextLesson?.timeRange && (
                  <span className="ml-1 text-[11px] text-slate-400 font-mono">({contextStatus.lessonInfo.nextLesson.timeRange})</span>
                )}
                {contextStatus.lessonInfo?.isConsecutiveSameSubject && (
                  <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                    Blok 2
                  </span>
                )}
                {contextStatus.lessonInfo?.nextLesson?.classroom && (
                  <span className="ml-1 text-emerald-600 font-bold">s. {contextStatus.lessonInfo.nextLesson.classroom}</span>
                )}
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Main Automation Scripts Card */}
      <GlassCard className="p-4 sm:p-5" glow="none">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Skrypty Automatyzacji i Powiadomień Pushbullet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Dedykowany silnik powiadomień przed dzwonkiem oraz reguły generowane przez AI
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/20 active:scale-95 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nowy Skrypt</span>
          </button>
        </div>

        {/* Add Script Form */}
        {isAdding && (
          <form onSubmit={handleCreateScript} className="p-4 mb-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Wybierz Szablon Bazowy
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {templates.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl.id)}
                    className={`text-left p-2.5 rounded-xl border text-xs transition ${
                      selectedTemplateId === tpl.id
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm font-bold'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-purple-300'
                    }`}
                  >
                    <p className="truncate">{tpl.name}</p>
                    <p className={`text-[10px] mt-0.5 ${selectedTemplateId === tpl.id ? 'text-purple-100' : 'text-slate-500'}`}>
                      {tpl.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nazwa Skryptu
              </label>
              <input
                type="text"
                value={newScriptName}
                onChange={(e) => setNewScriptName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                placeholder="np. Alert dzwonka na przerwę..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Ciało Skryptu JavaScript (parametr <code className="text-purple-600 font-mono">ctx</code>)
              </label>
              <textarea
                rows={6}
                value={newScriptCode}
                onChange={(e) => setNewScriptCode(e.target.value)}
                className="w-full font-mono text-[11px] p-2.5 rounded-xl bg-slate-950 text-emerald-400 border border-slate-800 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                Zapisz i Aktywuj
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium"
              >
                Anuluj
              </button>
            </div>
          </form>
        )}

        {/* Scripts List */}
        <div className="space-y-3">
          {scripts.map((script) => (
            <div
              key={script.id}
              className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm transition hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-start sm:items-center gap-3">
                  <button
                    onClick={() => handleToggle(script.id)}
                    className="mt-0.5 sm:mt-0 text-slate-400 hover:text-purple-600 transition"
                    title={script.enabled ? 'Deaktywuj' : 'Aktywuj'}
                  >
                    {script.enabled ? (
                      <ToggleRight className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-slate-400" />
                    )}
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {script.name}
                      </h4>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        {script.triggerType}
                      </span>
                      {script.lastStatus && (
                        <span
                          className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            script.lastStatus === 'SUCCESS'
                              ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'text-rose-700 bg-rose-50 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {script.lastStatus === 'SUCCESS' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                          <span>{script.lastStatus}</span>
                        </span>
                      )}
                    </div>
                    {script.description && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {script.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => setExpandedCodeId(expandedCodeId === script.id ? null : script.id)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs flex items-center gap-1 transition"
                    title="Pokaż kod skryptu"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Kod</span>
                  </button>

                  <button
                    disabled={runningScriptId === script.id}
                    onClick={() => handleRun(script.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950 hover:bg-sky-100 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-xs font-bold flex items-center gap-1 shadow-xs transition"
                  >
                    <Play className="w-3.5 h-3.5 text-sky-600" />
                    <span>{runningScriptId === script.id ? 'Wykonuję...' : 'Testuj'}</span>
                  </button>

                  <button
                    onClick={() => handleDelete(script.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 transition"
                    title="Usuń skrypt"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Code viewer */}
              {expandedCodeId === script.id && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <pre className="p-2.5 rounded-xl bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-48">
                    {script.code}
                  </pre>
                  {script.lastLog && (
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300 font-mono">
                      <span className="font-bold text-slate-900 dark:text-white">Ostatni log: </span>
                      {script.lastLog}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};
