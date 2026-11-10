import dotenv from 'dotenv';
dotenv.config();

import { finOpsCollector } from '../system/finopsCollector.js';
import { IterationBudget } from './iterationBudget.js';
import { dbStore, LessonItem } from '../../db/store.js';
import { sqliteStore } from '../../db/sqliteStore.js';
import { pushbulletService } from '../pushbullet/pushbulletService.js';
import { AUTOMATION_TEMPLATES } from '../automation/automationTemplates.js';
import { calculateLessonInfo, executeScript } from '../automation/scriptEngine.js';
import { mcpServer } from '../../mcp/internalMcpServer.js';

export interface LLMRequestOptions {
  message: string;
  userId?: string;
  history?: { role: 'user' | 'assistant' | 'system' | 'tool'; content: string; tool_call_id?: string }[];
  temperature?: number;
  maxTokens?: number;
  maxLoops?: number;
}

export interface LLMResponse {
  reply: string;
  provider: 'groq' | 'gemini' | 'openai' | 'local';
  model: string;
  latencyMs: number;
  tokensUsed: { prompt: number; completion: number; total: number };
  toolCall?: { toolName: string; args: Record<string, unknown>; output: string };
  widgets?: string[];
  fallbackCount: number;
}

const POLISH_DAYS = [
  'Niedziela',
  'Poniedziałek',
  'Wtorek',
  'Środa',
  'Czwartek',
  'Piątek',
  'Sobota'
];

export class LLMTimeoutError extends Error {
  public readonly provider: string;
  public readonly code: string = 'LLM_TIMEOUT';

  constructor(message: string, provider: string, options?: { cause?: unknown }) {
    super(message, options);
    this.provider = provider;
    this.name = 'LLMTimeoutError';
    Object.setPrototypeOf(this, new.target.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, LLMTimeoutError);
    }
  }
}

async function withTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  ms: number,
  provider: string
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);

  try {
    const result = await fn(controller.signal);
    clearTimeout(timeout);
    return result;
  } catch (err: any) {
    clearTimeout(timeout);
    if (err?.name === 'AbortError' || controller.signal.aborted) {
      throw new LLMTimeoutError(`${provider} provider timed out (${ms}ms abort)`, provider, { cause: err });
    }
    throw err;
  }
}

/**
 * Zwraca listę identyfikatorów widżetów do wyrenderowania w oknie czatu AI.
 */
export function determineWidgets(toolName?: string, userMessage: string = '', aiReply: string = ''): string[] {
  const widgets = new Set<string>();
  const combined = `${userMessage} ${aiReply}`.toLowerCase();

  if (toolName) {
    if (['query_timetable', 'get_current_lesson_status', 'timetable_get_schedule', 'get_school_timetable'].includes(toolName)) {
      widgets.add('timetable');
    }
    if (['get_substitutions'].includes(toolName)) {
      widgets.add('substitutions');
    }
    if (['get_librus_grades', 'get_grades_summary'].includes(toolName)) {
      widgets.add('grades');
    }
    if (['get_librus_calendar', 'get_calendar_events', 'add_calendar_event', 'delete_calendar_event'].includes(toolName)) {
      widgets.add('calendar');
    }
    if (['get_all_tasks', 'add_to_do', 'update_to_do', 'delete_to_do', 'add_task'].includes(toolName)) {
      widgets.add('tasks');
    }
    if (['add_finance_record', 'delete_finance_record', 'transfer_funds', 'get_gcp_budget_status', 'add_finance_transaction'].includes(toolName)) {
      widgets.add('finances');
    }
    if (['trigger_workout_sync', 'add_workout'].includes(toolName)) {
      widgets.add('workouts');
    }
    if (['create_or_update_automation_script', 'test_run_automation_script', 'list_automation_scripts', 'list_automation_templates'].includes(toolName)) {
      widgets.add('automation');
    }
  }

  // Heurystyki tekstowe synchronizowane z wersją archiwalną
  if (/(plan lekcji|harmonogram|kolejna lekcja|lekcje na dziś|sala lekcyjna|następna lekcja|dzwonek)/i.test(combined)) {
    widgets.add('timetable');
  }
  if (/(zastępstw|zastępstwo|nieobecnoś|odwołan|zmiana sali)/i.test(combined)) {
    widgets.add('substitutions');
  }
  if (/(oceny|średnia|stopnie|librus oceny|sprawdzian z|numerek)/i.test(combined)) {
    widgets.add('grades');
  }
  if (/(zadania|todo|to-do|co mam zrobić|lista zadań)/i.test(combined)) {
    widgets.add('tasks');
  }
  if (/(budżet|finanse|wydatek|przychód|portfel|pieniądze|saldo|rachunek)/i.test(combined)) {
    widgets.add('finances');
  }
  if (/(trening|siłowni|fbw|ćwiczen|workout|serie)/i.test(combined)) {
    widgets.add('workouts');
  }
  if (/(kalendarz|terminarz|wydarzen|sprawdziany|kartkówk)/i.test(combined)) {
    widgets.add('calendar');
  }
  if (/(skrypt|automatyz|pushbullet|powiadomienie na telefon)/i.test(combined)) {
    widgets.add('automation');
  }

  return Array.from(widgets);
}

const AUTOMATION_TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'create_or_update_automation_script',
      description: 'Tworzy nowy skrypt automatyzacji lub aktualizuje istniejący na podstawie szablonu lub kodu JavaScript z obiektem ctx (odczyt czasu, lekcji, dzwonka, wysyłanie push).',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Nazwa skryptu automatyzacji' },
          description: { type: 'string', description: 'Krótki opis zadania skryptu' },
          templateId: { type: 'string', description: 'ID szablonu: template_lesson_bell, template_morning_briefing, template_habit_reminder, template_custom_script' },
          triggerType: { type: 'string', enum: ['interval', 'cron', 'lesson_bell', 'manual'], description: 'Typ wyzwalacza' },
          cronExpression: { type: 'string', description: 'Wyrażenie CRON (np. 15 7 * * 1-5)' },
          code: { type: 'string', description: 'Ciało funkcji JavaScript otrzymującej obiekt ctx' },
          enabled: { type: 'boolean', description: 'Czy skrypt ma być od razu aktywny' }
        },
        required: ['name', 'code']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'test_run_automation_script',
      description: 'Testuje i uruchamia podany kod skryptu automatyzacji w bezpiecznej piaskownicy z wstrzykniętym obiektem ctx (odczyt czasu, lekcji, Pushbullet) i zwraca logi wykonania.',
      parameters: {
        type: 'object',
        properties: {
          code: { type: 'string', description: 'Kod skryptu JavaScript do testowego wykonania' },
          scriptId: { type: 'string', description: 'ID zarejestrowanego skryptu (jeśli testujemy istniejący)' },
          simulatedDate: { type: 'string', description: 'Opcjonalna symulowana data ISO dla testu (np. 2026-11-05T09:30:00)' }
        }
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'list_automation_scripts',
      description: 'Zwraca listę wszystkich zarejestrowanych skryptów automatyzacji w systemie OmniDash.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'list_automation_templates',
      description: 'Zwraca listę gotowych szablonów automatyzacji (alert dzwonka, briefing, nawyki, custom).',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'delete_automation_script',
      description: 'Usuwa zarejestrowany skrypt automatyzacji po jego ID.',
      parameters: {
        type: 'object',
        properties: {
          scriptId: { type: 'string', description: 'ID skryptu do usunięcia' }
        },
        required: ['scriptId']
      }
    }
  }
];

export const LLM_TOOLS = [
  ...mcpServer.listTools().map((t) => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters
    }
  })),
  ...AUTOMATION_TOOLS
];

export class LLMGateway {
  private readonly groqApiKey: string;
  private readonly geminiApiKey: string;
  private readonly openaiApiKey: string;

  constructor() {
    this.groqApiKey = process.env.GROQ_API_KEY || '';
    this.geminiApiKey = process.env.GEMINI_API_KEY || '';
    this.openaiApiKey = process.env.OPENAI_API_KEY || '';
  }

  public getGroqKey(): string {
    try {
      const dbKey = sqliteStore.getConfig('groq_api_key');
      if (dbKey && dbKey.trim().length > 0) {
        return dbKey.trim();
      }
    } catch {
      // sqlite config lookup fallback
    }
    return (process.env.GROQ_API_KEY || this.groqApiKey || '').trim();
  }

  public getGeminiKey(): string {
    try {
      const dbKey = sqliteStore.getConfig('gemini_api_key');
      if (dbKey && dbKey.trim().length > 0) {
        return dbKey.trim();
      }
    } catch {
      // sqlite config lookup fallback
    }
    return (process.env.GEMINI_API_KEY || this.geminiApiKey || '').trim();
  }

  public async testGroqKey(key: string): Promise<{ ok: boolean; error?: string; latencyMs: number }> {
    const start = Date.now();
    try {
      const res = await withTimeout(
        (signal) =>
          fetch('https://api.groq.com/openai/v1/models', {
            headers: { Authorization: `Bearer ${key}` },
            signal
          }),
        4000,
        'groq'
      );
      const latencyMs = Date.now() - start;
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        return { ok: false, error: `Groq HTTP error ${res.status}: ${res.statusText}${errText ? ` (${errText})` : ''}`, latencyMs };
      }
      return { ok: true, latencyMs };
    } catch (err: any) {
      return { ok: false, error: err.message, latencyMs: Date.now() - start };
    }
  }

  public async testGeminiKey(key: string): Promise<{ ok: boolean; error?: string; latencyMs: number }> {
    const start = Date.now();
    try {
      const res = await withTimeout(
        (signal) =>
          fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`, {
            signal
          }),
        4000,
        'gemini'
      );
      const latencyMs = Date.now() - start;
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        return { ok: false, error: `Gemini HTTP error ${res.status}: ${res.statusText}${errText ? ` (${errText})` : ''}`, latencyMs };
      }
      return { ok: true, latencyMs };
    } catch (err: any) {
      return { ok: false, error: err.message, latencyMs: Date.now() - start };
    }
  }

  public async getGatewayStatus(): Promise<{
    connected: boolean;
    provider: 'groq' | 'gemini' | 'local';
    model: string;
    configured: boolean;
    groqConfigured: boolean;
    geminiConfigured: boolean;
    latencyMs: number;
    error?: string;
  }> {
    const groqKey = this.getGroqKey();
    const geminiKey = this.getGeminiKey();
    const groqConfigured = Boolean(groqKey && groqKey.trim().length > 0);
    const geminiConfigured = Boolean(geminiKey && geminiKey.trim().length > 0);

    if (groqConfigured) {
      const test = await this.testGroqKey(groqKey);
      if (test.ok) {
        return {
          connected: true,
          provider: 'groq',
          model: 'openai/gpt-oss-120b',
          configured: true,
          groqConfigured: true,
          geminiConfigured,
          latencyMs: test.latencyMs
        };
      }
      if (geminiConfigured) {
        const gTest = await this.testGeminiKey(geminiKey);
        if (gTest.ok) {
          return {
            connected: true,
            provider: 'gemini',
            model: 'gemini-2.0-flash',
            configured: true,
            groqConfigured: true,
            geminiConfigured: true,
            latencyMs: gTest.latencyMs
          };
        }
      }
      return {
        connected: false,
        provider: 'groq',
        model: 'openai/gpt-oss-120b',
        configured: true,
        groqConfigured: true,
        geminiConfigured,
        latencyMs: test.latencyMs,
        error: test.error
      };
    }

    if (geminiConfigured) {
      const test = await this.testGeminiKey(geminiKey);
      return {
        connected: test.ok,
        provider: 'gemini',
        model: 'gemini-2.0-flash',
        configured: true,
        groqConfigured: false,
        geminiConfigured: true,
        latencyMs: test.latencyMs,
        error: test.error
      };
    }

    return {
      connected: false,
      provider: 'local',
      model: 'omnidash-deterministic-core-v4',
      configured: false,
      groqConfigured: false,
      geminiConfigured: false,
      latencyMs: 0,
      error: 'Brak skonfigurowanych kluczy zewnętrznych dostawców AI (Groq / Gemini)'
    };
  }


  public buildSystemPrompt(): string {
    const now = new Date();
    const day = now.getDay();
    const dayName = POLISH_DAYS[day] || 'Dzień';
    const currentDay = day >= 1 && day <= 5 ? day : 1;
    const formattedTime = now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    const dateFormatted = `${now.getDate()} listopada ${now.getFullYear()} (${dayName})`;
    const lessonInfo = calculateLessonInfo(now);
    const todayLessons = dbStore.getTimetable(currentDay);
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const todayExams = dbStore.getEvents().filter((e) => e.date === dateStr);

    return `Jesteś autonomicznym, wysoce precyzyjnym asystentem inżynieryjnym i wykonawczym ekosystemu OmniDash v1.0.0.
Odpowiadasz operatorowi w języku polskim: bezpośrednio, merytorycznie, bez zbędnych wstępów, przeprosin i small-talku.

--- AUTORYTATYWNY KONTEKST SYSTEMU ---
- Aktualny czas: ${formattedTime}
- Bieżąca data: ${dateFormatted}
- Dzień roboczy: ${dayName} (Dzień ${currentDay}/5)
- Status zajęć: ${lessonInfo.timeUntilNextEventFormatted}
- Aktualna lekcja: ${lessonInfo.currentLessonLabel || (lessonInfo.currentLesson ? `Lekcja ${lessonInfo.currentLesson.order}. ${lessonInfo.currentLesson.subject} (${lessonInfo.currentLesson.classroom}, ${lessonInfo.currentLesson.teacher})` : 'Brak (przerwa lub poza lekcjami)')}
- Kolejna lekcja: ${lessonInfo.nextLessonLabel || (lessonInfo.nextLesson ? `Lekcja ${lessonInfo.nextLesson.order}. ${lessonInfo.nextLesson.subject} (${lessonInfo.nextLesson.classroom}, ${lessonInfo.nextLesson.teacher})` : 'Koniec zajęć')}
- Czas do dzwonka: ${lessonInfo.minutesToBell} min (${lessonInfo.bellType === 'LESSON_END' ? 'dzwonek na przerwę kończący bieżącą lekcję' : (lessonInfo.bellType === 'BREAK_END' ? 'dzwonek na lekcję po przerwie' : 'poza godzinami szkolnymi')})
${lessonInfo.isConsecutiveSameSubject ? `- UWAGA ARCHITEKTONICZNA: Bieżąca lekcja i kolejna lekcja to dwugodzinny blok tego samego przedmiotu (${lessonInfo.currentLesson?.subject}). Wyjaśnij to operatorowi, rozróżniając lekcję ${lessonInfo.currentLesson?.order} oraz ${lessonInfo.nextLesson?.order}.` : ''}
- Dzisiejsze lekcje (${todayLessons.length}): ${todayLessons.map((l) => `${l.order}. ${l.subject} (${l.timeRange}, s. ${l.classroom})`).join(', ')}
- Dzisiejsze sprawdziany / kartkówki: ${todayExams.length > 0 ? todayExams.map((e) => `${e.title} (${e.subject || 'szkoła'})`).join('; ') : 'Brak zaplanowanych sprawdzianów na dziś'}

--- ZASADY DZIAŁANIA I FUNCTION CALLING ---
1. Posiadasz pełny zestaw ponad 35 produkcyjnych narzędzi (tools): plan lekcji (query_timetable), stan lekcji i dzwonka (get_current_lesson_status), oceny Librus (get_librus_grades), terminarz i sprawdziany (get_librus_calendar), zastępstwa szkolne (get_substitutions), zadania todo (get_all_tasks, add_to_do, update_to_do, delete_to_do), finanse 50/30/20 (add_finance_record, delete_finance_record, transfer_funds, get_gcp_budget_status), kalendarz (add_calendar_event, get_calendar_events), treningi FBW (trigger_workout_sync), powiadomienia Pushbullet (send_phone_notification), telemetrię węzła (get_system_metrics), rekonesans OSINT (perform_osint_scan), przeszukiwanie internetu (execute_web_search), alerty drogowe CANARD (get_traffic_alerts), pamięć asocjacyjną (learn_fact, query_semantic_memory) oraz silnik skryptów automatyzacji (create_or_update_automation_script, test_run_automation_script, list_automation_scripts). ZAWSZE wywołuj odpowiednie narzędzie!
2. Rygor interpretacji dzwonka i kolejnych lekcji:
   - Gdy trwa lekcja i bellType to LESSON_END: dzwonek za X minut oznacza DZWONEK NA PRZERWĘ kończący bieżącą lekcję. NIE mów "kolejna lekcja rozpocznie się za X min", ponieważ najpierw jest przerwa!
   - Kolejna lekcja rozpoczyna się po przerwie. Jeśli kolejną lekcją jest ten sam przedmiot, jest to kolejny blok zajęć (np. 2 godziny pod rząd w tej samej sali).
   - Nigdy nie używaj w odpowiedzi technicznych nazw enumów typu "LESSON_END" ani "BREAK_END". Pisz po polsku: "dzwonek na przerwę" lub "dzwonek na rozpoczęcie lekcji".
3. Gdy tworzysz skrypt automatyzacji, użyj create_or_update_automation_script lub test_run_automation_script. Obiekt ctx w skryptach posiada: ctx.time, ctx.school.getCurrentLesson(), ctx.school.getNextLesson(), ctx.school.getMinutesToBell(), ctx.school.getLessonInfo(), ctx.pushbullet.send(title, body, priority), ctx.tasks, ctx.habits, ctx.log(msg).`;
  }

  public async complete(options: LLMRequestOptions): Promise<LLMResponse> {
    if (!options.message || typeof options.message !== 'string' || !options.message.trim()) {
      throw new Error('LLMRequestOptions: message parameter is required and cannot be empty.');
    }

    const budget = new IterationBudget({
      maxLoops: options.maxLoops ?? 5,
      maxTokens: options.maxTokens
    });
    const startTime = Date.now();
    let fallbackCount = 0;

    let authError: { provider: string; status: number; message: string } | null = null;

    // 1. Primary: Groq API with openai/gpt-oss-120b & Function Calling
    const groqKey = this.getGroqKey();
    if (groqKey?.trim()) {
      try {
        budget.recordStep();
        const res = await this.callGroqWithTools(options, groqKey);
        budget.recordTokens(res.tokensUsed.total);
        const durationMs = Date.now() - startTime;
        finOpsCollector.recordMetric({
          module: 'ai_chat',
          provider: 'groq',
          inputUnits: res.tokensUsed.prompt,
          outputUnits: res.tokensUsed.completion,
          costPln: (res.tokensUsed.total / 1000) * 0.0025,
          durationMs
        });
        return { ...res, latencyMs: durationMs, fallbackCount };
      } catch (err: any) {
        console.warn('[!] LLMGateway: Groq provider failed, initiating failover:', err);
        fallbackCount++;
        if (err?.status === 401 || err?.message?.includes('401') || err?.message?.includes('invalid_api_key') || err?.message?.includes('Unauthorized')) {
          authError = { provider: 'Groq', status: 401, message: err.message };
        }
      }
    }

    // 2. Secondary: Gemini 2.0 Flash API
    const geminiKey = this.getGeminiKey();
    if (geminiKey?.trim()) {
      try {
        budget.recordStep();
        const res = await this.callGemini(options, geminiKey);
        budget.recordTokens(res.tokensUsed.total);
        const durationMs = Date.now() - startTime;
        finOpsCollector.recordMetric({
          module: 'ai_chat',
          provider: 'gemini',
          inputUnits: res.tokensUsed.prompt,
          outputUnits: res.tokensUsed.completion,
          costPln: (res.tokensUsed.total / 1000) * 0.0035,
          durationMs
        });
        return { ...res, latencyMs: durationMs, fallbackCount };
      } catch (err: any) {
        console.warn('[!] LLMGateway: Gemini provider failed, initiating failover:', err);
        fallbackCount++;
        if (err?.status === 401 || err?.message?.includes('401') || err?.message?.includes('invalid_api_key') || err?.message?.includes('API_KEY_INVALID')) {
          authError = { provider: 'Gemini', status: 401, message: err.message };
        }
      }
    }

    // 3. Deterministic Local Executive Assistant Fallback
    budget.recordStep();
    const localRes = await this.executeLocalAssistant(options.message, options.userId, authError);
    const durationMs = Date.now() - startTime;
    const localTokens = options.message.length + localRes.reply.length;
    budget.recordTokens(localTokens);

    finOpsCollector.recordMetric({
      module: 'ai_chat',
      provider: 'local',
      inputUnits: options.message.length,
      outputUnits: localRes.reply.length,
      costPln: 0,
      durationMs
    });

    return {
      reply: localRes.reply,
      provider: 'local',
      model: 'omnidash-deterministic-core-v4',
      latencyMs: durationMs,
      tokensUsed: { prompt: options.message.length, completion: localRes.reply.length, total: localTokens },
      toolCall: localRes.toolCall,
      widgets: localRes.widgets,
      fallbackCount
    };
  }

  private async callGroqWithTools(options: LLMRequestOptions, apiKey?: string): Promise<Omit<LLMResponse, 'latencyMs' | 'fallbackCount'>> {
    const key = apiKey || this.getGroqKey();
    return await withTimeout(
      async (signal) => {
        const systemPrompt = this.buildSystemPrompt();
        const messages: any[] = [
          { role: 'system', content: systemPrompt },
          ...(options.history || []),
          { role: 'user', content: options.message }
        ];

        // 1st Turn: Send user message with all 35 available tools
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`
          },
          body: JSON.stringify({
            model: 'openai/gpt-oss-120b',
            messages,
            tools: LLM_TOOLS,
            tool_choice: 'auto',
            temperature: options.temperature ?? 0.3,
            max_tokens: options.maxTokens ?? 1024
          }),
          signal
        });

        if (!response.ok) {
          const errBody = await response.text().catch(() => '');
          const err: any = new Error(`Groq HTTP error ${response.status}: ${response.statusText}${errBody ? ` - ${errBody}` : ''}`);
          err.status = response.status;
          throw err;
        }

        const data = (await response.json()) as any;
        const choice = data.choices?.[0];
        const assistantMsg = choice?.message;
        let totalUsage = data.usage || { prompt_tokens: 200, completion_tokens: 100, total_tokens: 300 };

        // Check if model called tools
        if (assistantMsg?.tool_calls && Array.isArray(assistantMsg.tool_calls) && assistantMsg.tool_calls.length > 0) {
          const firstToolCall = assistantMsg.tool_calls[0];
          const fnName = firstToolCall.function?.name;
          let fnArgs: Record<string, any> = {};
          try {
            fnArgs = JSON.parse(firstToolCall.function?.arguments || '{}');
          } catch {
            fnArgs = {};
          }

          // Execute tool call live across MCP and Automation Engine
          const toolResult = await this.executeLiveTool(fnName, fnArgs, options.userId);

          // 2nd Turn: Feed tool response back to Groq for natural response synthesis
          messages.push(assistantMsg);
          messages.push({
            role: 'tool',
            tool_call_id: firstToolCall.id,
            name: fnName,
            content: toolResult
          });

          const secondResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${key}`
            },
            body: JSON.stringify({
              model: 'openai/gpt-oss-120b',
              messages,
              temperature: options.temperature ?? 0.3,
              max_tokens: options.maxTokens ?? 1024
            }),
            signal
          });

          if (secondResponse.ok) {
            const secondData = (await secondResponse.json()) as any;
            const secondChoice = secondData.choices?.[0];
            const finalReply = secondChoice?.message?.content || assistantMsg.content || 'Pomyślnie zrealizowano narzędzie.';
            if (secondData.usage) {
              totalUsage = {
                prompt_tokens: totalUsage.prompt_tokens + secondData.usage.prompt_tokens,
                completion_tokens: totalUsage.completion_tokens + secondData.usage.completion_tokens,
                total_tokens: totalUsage.total_tokens + secondData.usage.total_tokens
              };
            }

            const widgets = determineWidgets(fnName, options.message, finalReply);

            return {
              reply: finalReply,
              provider: 'groq',
              model: 'openai/gpt-oss-120b',
              tokensUsed: { prompt: totalUsage.prompt_tokens, completion: totalUsage.completion_tokens, total: totalUsage.total_tokens },
              toolCall: {
                toolName: fnName,
                args: fnArgs,
                output: toolResult
              },
              widgets
            };
          }

          // If second turn failed, return tool result directly
          const fallbackReply = assistantMsg.content || `Wykonano narzędzie ${fnName}: ${toolResult}`;
          const widgets = determineWidgets(fnName, options.message, fallbackReply);
          return {
            reply: fallbackReply,
            provider: 'groq',
            model: 'openai/gpt-oss-120b',
            tokensUsed: { prompt: totalUsage.prompt_tokens, completion: totalUsage.completion_tokens, total: totalUsage.total_tokens },
            toolCall: {
              toolName: fnName,
              args: fnArgs,
              output: toolResult
            },
            widgets
          };
        }

        const reply = assistantMsg?.content || 'Pomyślnie przetworzono polecenie.';
        const widgets = determineWidgets(undefined, options.message, reply);
        return {
          reply,
          provider: 'groq',
          model: 'openai/gpt-oss-120b',
          tokensUsed: { prompt: totalUsage.prompt_tokens, completion: totalUsage.completion_tokens, total: totalUsage.total_tokens },
          widgets
        };
      },
      8000,
      'groq'
    );
  }

  public async executeLiveTool(name: string, args: Record<string, any>, userId?: string): Promise<string> {
    const callerUserId = userId && userId.trim() ? userId.trim() : 'operator-system-core';

    switch (name) {
      case 'get_current_lesson_status': {
        const info = calculateLessonInfo(new Date());
        return JSON.stringify({
          status: info.timeUntilNextEventFormatted,
          currentLesson: info.currentLessonLabel || (info.currentLesson ? `Lekcja ${info.currentLesson.order}. ${info.currentLesson.subject} (${info.currentLesson.classroom}, ${info.currentLesson.teacher})` : 'Brak (przerwa lub poza lekcjami)'),
          nextLesson: info.nextLessonLabel || (info.nextLesson ? `Lekcja ${info.nextLesson.order}. ${info.nextLesson.subject} (${info.nextLesson.classroom}, ${info.nextLesson.teacher})` : 'Koniec zajęć'),
          minutesToBell: info.minutesToBell,
          bellType: info.bellType,
          bellEvent: info.bellType === 'LESSON_END' ? 'Dzwonek na przerwę' : (info.bellType === 'BREAK_END' ? 'Dzwonek na lekcję' : 'Poza godzinami szkolnymi'),
          isConsecutiveSameSubject: info.isConsecutiveSameSubject,
          blockDescription: info.blockDescription,
          instructionForAssistant: info.bellType === 'LESSON_END'
            ? `Dzwonek za ${info.minutesToBell} min kończy BIEŻĄCĄ lekcję (dzwonek na przerwę). Następna lekcja zaczyna się po przerwie.`
            : `Dzwonek za ${info.minutesToBell} min kończy przerwę i rozpoczyna kolejną lekcję.`
        });
      }

      case 'create_or_update_automation_script': {
        const script = dbStore.saveAutomationScript({
          name: args.name || 'Nowy skrypt automatyzacji',
          description: args.description,
          templateId: args.templateId || 'template_custom_script',
          triggerType: args.triggerType || 'lesson_bell',
          cronExpression: args.cronExpression,
          code: args.code,
          enabled: args.enabled !== undefined ? !!args.enabled : true
        });
        return JSON.stringify({ success: true, createdScriptId: script.id, scriptName: script.name });
      }

      case 'test_run_automation_script': {
        let codeToRun = args.code;
        if (!codeToRun && args.scriptId) {
          const s = dbStore.getAutomationScript(args.scriptId);
          codeToRun = s ? s.code : '';
        }
        if (!codeToRun) {
          return JSON.stringify({ success: false, error: 'Brak kodu do testu.' });
        }
        const customDate = args.simulatedDate ? new Date(args.simulatedDate) : undefined;
        const res = await executeScript(codeToRun, customDate);
        return JSON.stringify({
          success: res.success,
          logs: res.logs,
          notificationsCount: res.notificationsSent.length,
          notificationsSent: res.notificationsSent,
          durationMs: res.durationMs,
          error: res.error
        });
      }

      case 'list_automation_scripts': {
        const scripts = dbStore.getAutomationScripts();
        return JSON.stringify(scripts.map((s) => ({ id: s.id, name: s.name, enabled: s.enabled, trigger: s.triggerType, lastStatus: s.lastStatus })));
      }

      case 'list_automation_templates': {
        return JSON.stringify(AUTOMATION_TEMPLATES.map((t) => ({ id: t.id, name: t.name, description: t.description })));
      }

      case 'delete_automation_script': {
        const scriptId = args.scriptId;
        const deleted = dbStore.deleteAutomationScript(scriptId);
        return JSON.stringify({ success: deleted, scriptId });
      }

      // Powiadomienia Pushbullet
      case 'send_phone_notification':
      case 'send_pushbullet_notification': {
        // Zabezpieczenie defensywne przed wywołaniem narzędzia z nieprawidłowym lub pustym obiektem parametrów
        const isPlainObject = args && Object.prototype.toString.call(args) === '[object Object]';
        const safeArgs = isPlainObject ? (args as Record<string, unknown>) : {};
        const title = String(safeArgs.title || 'OmniDash Powiadomienie').trim();
        const body = String(safeArgs.body || 'Wiadomość z asystenta AI').trim();
        const validPriorities = ['CRITICAL', 'HIGH', 'NORMAL', 'LOW'] as const;
        type ValidPriority = (typeof validPriorities)[number];
        const rawPriority = typeof safeArgs.priority === 'string' ? safeArgs.priority.toUpperCase() : 'NORMAL';
        const priority: ValidPriority = (validPriorities as readonly string[]).includes(rawPriority)
          ? (rawPriority as ValidPriority)
          : 'NORMAL';

        const pushRes = await pushbulletService.sendPush({ title, body, priority });
        return JSON.stringify({
          success: pushRes.success,
          iden: pushRes.iden,
          simulated: pushRes.simulated,
          message: pushRes.message,
          sentAt: pushRes.sentAt
        });
      }

      // Legacy Aliases
      case 'timetable_get_schedule':
      case 'get_school_timetable': {
        return await this.executeLiveTool('query_timetable', args, userId);
      }

      case 'get_grades_summary': {
        return await this.executeLiveTool('get_librus_grades', args, userId);
      }

      case 'add_task': {
        return await this.executeLiveTool('add_to_do', args, userId);
      }

      case 'add_finance_transaction': {
        return await this.executeLiveTool('add_finance_record', {
          type: args.type === 'INCOME' ? 'income' : 'expense',
          amount: args.amount,
          currency: 'PLN',
          category: args.category || 'Ogólne',
          bucket: (args.envelope || 'needs').toLowerCase(),
          description: args.title,
          transaction_date: new Date().toISOString().split('T')[0]
        }, userId);
      }

      default: {
        try {
          const res = await mcpServer.callTool(name, args);
          return typeof res === 'string' ? res : JSON.stringify(res);
        } catch (err: any) {
          return JSON.stringify({ error: `Błąd wykonania narzędzia ${name}: ${err.message}` });
        }
      }
    }
  }

  private async callGemini(options: LLMRequestOptions, apiKey?: string): Promise<Omit<LLMResponse, 'latencyMs' | 'fallbackCount'>> {
    const key = apiKey || this.getGeminiKey();
    return await withTimeout(
      async (signal) => {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: `${this.buildSystemPrompt()}\n\nZapytanie operatora: ${options.message}` }]
              }
            ]
          }),
          signal
        });

        if (!response.ok) {
          const errBody = await response.text().catch(() => '');
          const err: any = new Error(`Gemini HTTP error ${response.status}: ${response.statusText}${errBody ? ` - ${errBody}` : ''}`);
          err.status = response.status;
          throw err;
        }
        const data = (await response.json()) as any;
        const candidate = data.candidates?.[0];
        const reply = candidate?.content?.parts?.[0]?.text || 'Przetworzono polecenie w chmurze Gemini.';
        const widgets = determineWidgets(undefined, options.message, reply);

        return {
          reply,
          provider: 'gemini',
          model: 'gemini-2.0-flash',
          tokensUsed: { prompt: 160, completion: 90, total: 250 },
          widgets
        };
      },
      7000,
      'gemini'
    );
  }

  private async executeLocalAssistant(
    message: string,
    userId?: string,
    authError?: { provider: string; status: number; message: string } | null
  ): Promise<{ reply: string; toolCall?: { toolName: string; args: Record<string, unknown>; output: string }; widgets?: string[] }> {
    const query = message.toLowerCase();
    const now = new Date();
    const day = now.getDay();
    const currentDay = day >= 1 && day <= 5 ? day : 1;
    const lessonInfo = calculateLessonInfo(now);

    // 1. Dzwonki, lekcje, harmonogram
    if (query.includes('przerw') || query.includes('dzwonek') || query.includes('następn') || query.includes('gdzie mam') || query.includes('jaka lekcja')) {
      const output = await this.executeLiveTool('get_current_lesson_status', {}, userId);
      const reply = `Aktualny status: ${lessonInfo.timeUntilNextEventFormatted}. ${
        lessonInfo.currentLesson
          ? `Obecnie trwa: ${lessonInfo.currentLessonLabel || `${lessonInfo.currentLesson.subject} w sali ${lessonInfo.currentLesson.classroom}`}.`
          : 'Trwa przerwa.'
      } ${
        lessonInfo.nextLesson
          ? `Kolejna lekcja: ${lessonInfo.nextLessonLabel || `${lessonInfo.nextLesson.subject} w sali ${lessonInfo.nextLesson.classroom}`}. Czas do dzwonka: ${lessonInfo.minutesToBell} min.`
          : 'To ostatnia lekcja w dniu dzisiejszym.'
      }`;
      const widgets = determineWidgets('get_current_lesson_status', message, reply);
      return {
        reply,
        toolCall: {
          toolName: 'get_current_lesson_status',
          args: {},
          output
        },
        widgets
      };
    }

    // 2. Skrypty automatyzacji
    if (query.includes('skrypt') || query.includes('automatyz') || query.includes('przypom')) {
      const output = await this.executeLiveTool('list_automation_scripts', {}, userId);
      const reply = `W systemie zarejestrowane są aktywne skrypty automatyzacji, w tym monitor dzwonków szkolnych (wysyłający alert Pushbullet na 5 min przed końcem lekcji z kolejną salą) oraz poranny briefing. Możesz edytować ich kod lub stworzyć nowy z szablonu.`;
      const widgets = determineWidgets('list_automation_scripts', message, reply);
      return {
        reply,
        toolCall: {
          toolName: 'list_automation_scripts',
          args: {},
          output
        },
        widgets
      };
    }

    // 3. Wieczorny przegląd dnia / podsumowanie
    if (query.includes('wieczorn') || (query.includes('podsumowanie') && (query.includes('dnia') || query.includes('przegląd') || query.includes('dane z całego dnia')))) {
      const latest = sqliteStore.getLatestEveningDigest();
      const reply = latest?.summaryText || 'Wieczorny Przegląd Dnia: podsumowano aktywności, zadania i stan systemu na dziś.';
      return {
        reply,
        toolCall: undefined,
        widgets: ['tasks', 'finances']
      };
    }

    // 4. Zastępstwa
    if (query.includes('zastępstw') || query.includes('odwołan')) {
      const output = await this.executeLiveTool('get_substitutions', { day: currentDay }, userId);
      const reply = `Pobrano aktualne zastępstwa szkolne oraz absencje nauczycieli dla dnia dzisiejszego.`;
      const widgets = determineWidgets('get_substitutions', message, reply);
      return {
        reply,
        toolCall: {
          toolName: 'get_substitutions',
          args: { day: currentDay },
          output
        },
        widgets
      };
    }

    // 5. Zapytania o oceny z konkretnego przedmiotu (np. "a konkretnie z biologii?", "oceny z chemii", "z matematyki")
    const subjects = dbStore.getSubjectsWithGrades();
    const SUBJECT_ALIASES: Array<{ name: string; patterns: RegExp[] }> = [
      { name: 'Biologia', patterns: [/biolog/i] },
      { name: 'Chemia', patterns: [/chem/i] },
      { name: 'Matematyka', patterns: [/matematyk/i, /\bmatm/i] },
      { name: 'Informatyka', patterns: [/informatyk/i, /\binfy\b/i, /\binfa\b/i] },
      { name: 'Historia', patterns: [/histori/i] },
      { name: 'Język polski', patterns: [/polsk/i] },
      { name: 'Język angielski zawodowy', patterns: [/angielski[a-z]*\s+zawodow/i] },
      { name: 'Język angielski', patterns: [/angielsk/i, /\bangol/i] },
      { name: 'Język niemiecki', patterns: [/niemieck/i] },
      { name: 'Pracownia urządzeń techniki komputerowej', patterns: [/pracowni[a-z]*\s+urządzeń/i, /\bputk\b/i] },
      { name: 'Urządzenia techniki komputerowej', patterns: [/urządzeń\s+techniki/i, /urządzenia\s+techniki/i, /\butk\b/i] },
      { name: 'Pracownia systemów operacyjnych', patterns: [/pracowni[a-z]*\s+systemów/i, /\bpso\b/i] },
      { name: 'Systemy operacyjne', patterns: [/system[a-z]*\s+operacyjn/i, /\bso\b/i] },
      { name: 'Pracownia lokalnych sieci komputerowych', patterns: [/pracowni[a-z]*\s+lokalnych\s+sieci/i, /pracowni[a-z]*\s+sieci/i] },
      { name: 'Lokalne sieci komputerowe', patterns: [/lokaln[a-z]*\s+sieci/i, /\bsieci\s+komputerow/i, /\bsieci\b/i] },
      { name: 'Wychowanie fizyczne', patterns: [/wychowan[a-z]*\s+fizyczn/i, /\bwf\b/i, /\bw-f\b/i] },
      { name: 'Biznes i zarządzanie', patterns: [/biznes/i, /zarządzan/i, /\bbiz\b/i] },
      { name: 'Edukacja obywatelska', patterns: [/edukacj[a-z]*\s+obywatelsk/i, /\beo\b/i] },
      { name: 'Edukacja zdrowotna', patterns: [/edukacj[a-z]*\s+zdrowotn/i, /\bez\b/i] },
      { name: 'Religia', patterns: [/religi/i] },
      { name: 'Zajęcia z wychowawcą', patterns: [/wychowawc/i, /godzin[a-z]*\s+wychowawcz/i] }
    ];

    let matchedSubject: (typeof subjects)[0] | undefined;
    for (const item of SUBJECT_ALIASES) {
      if (item.patterns.some((p) => p.test(query))) {
        matchedSubject = subjects.find((s) => s.name.toLowerCase() === item.name.toLowerCase());
        if (matchedSubject) break;
      }
    }

    if (matchedSubject) {
      const gradesList = matchedSubject.grades || [];
      const avg = matchedSubject.average || matchedSubject.semester1Average || 0;
      let reply = `Oceny z przedmiotu ${matchedSubject.name}:\n`;
      reply += `Bieżąca średnia: ${avg > 0 ? avg.toFixed(2) : 'brak średniej'}.\n`;
      if (gradesList.length === 0) {
        reply += 'Brak wpisanych ocen w dzienniku Librus dla tego przedmiotu.';
      } else {
        reply += `Wykaz ocen (${gradesList.length}):\n`;
        reply += gradesList
          .map((g) => {
            let line = `- ${g.displayValue || g.value} (waga ${g.weight}, ${g.category || 'brak kategorii'}, ${g.date || 'brak daty'})`;
            if (g.isImprovement && g.improvedValue) {
              line += ` [poprawa oceny ${g.improvedValue}]`;
            } else if (g.inAverage === false && g.improvedGradeId) {
              line += ` [ocena poprawiona]`;
            }
            return line;
          })
          .join('\n');
      }
      const widgets = determineWidgets('get_librus_grades', message, reply);
      return {
        reply,
        toolCall: {
          toolName: 'get_librus_grades',
          args: { subject: matchedSubject.name },
          output: JSON.stringify(matchedSubject)
        },
        widgets
      };
    }

    // 6. Ogólne oceny / średnia
    if (query.includes('ocen') || query.includes('średni')) {
      const output = await this.executeLiveTool('get_librus_grades', {}, userId);
      const gpa = dbStore.calculateGpa();
      const reply = `Twoja bieżąca średnia ważona wynosi ${gpa.toFixed(2)}. Poniżej znajduje się podsumowanie ocen z dziennika Librus Synergia.`;
      const widgets = determineWidgets('get_librus_grades', message, reply);
      return {
        reply,
        toolCall: {
          toolName: 'get_librus_grades',
          args: {},
          output
        },
        widgets
      };
    }

    // 7. Plan lekcji
    if (query.includes('plan') || query.includes('lekcj')) {
      const timetable = dbStore.getTimetable(currentDay);
      const output = await this.executeLiveTool('query_timetable', { day: currentDay }, userId);
      const reply = `W dzisiejszym harmonogramie masz ${timetable.length} lekcji: ` +
        timetable.map((t: LessonItem) => `${t.order}. ${t.subject} (${t.timeRange}, s. ${t.classroom})`).join(', ') + '.';
      const widgets = determineWidgets('query_timetable', message, reply);
      return {
        reply,
        toolCall: {
          toolName: 'query_timetable',
          args: { day: currentDay },
          output
        },
        widgets
      };
    }

    // 8. Powiadomienie push
    if (query.includes('push') || query.includes('telefon') || query.includes('powiadom')) {
      const output = await this.executeLiveTool('send_phone_notification', { title: 'OmniDash Asystent', body: message, priority: 'HIGH' }, userId);
      const reply = 'Wysłano powiadomienie na Twój smartfon przez Pushbullet Dispatcher.';
      const widgets = determineWidgets('send_phone_notification', message, reply);
      return {
        reply,
        toolCall: {
          toolName: 'send_phone_notification',
          args: { title: 'OmniDash Asystent', body: message, priority: 'HIGH' },
          output
        },
        widgets
      };
    }

    // 9. Zadania
    if (query.includes('dodaj zadanie') || query.includes('nowe zadanie')) {
      const taskTitle = message.replace(/(dodaj zadanie|nowe zadanie|zadanie:?)/gi, '').trim() || 'Nowe zadanie z czatu';
      const output = await this.executeLiveTool('add_to_do', { title: taskTitle, priority: 'HIGH' }, userId);
      const reply = `Zadanie "${taskTitle}" zostało pomyślnie dodane do listy zadań.`;
      const widgets = determineWidgets('add_to_do', message, reply);
      return {
        reply,
        toolCall: {
          toolName: 'add_to_do',
          args: { title: taskTitle },
          output
        },
        widgets
      };
    }

    // 10. Fallback: Jeśli wystąpił błąd autoryzacji (401), natychmiast zwróć jasny komunikat diagnostyczny
    if (authError) {
      const reply = `Błąd autoryzacji dostawcy AI (${authError.provider} HTTP 401: Nieprawidłowy lub unieważniony klucz API). Zaktualizuj klucz API w konfiguracji systemu (POST /api/ai/config lub zmienna ${authError.provider.toUpperCase()}_API_KEY).`;
      return {
        reply,
        toolCall: undefined,
        widgets: []
      };
    }

    // 11. Domyślny komunikat braku dopasowania lokalnego bez pustych atrap
    const reply = 'Zapytanie wykracza poza wbudowane moduły lokalne (plan lekcji, dzwonki, oceny Librus, zadania, finanse, automatyzacja). Skonfiguruj aktywny klucz API dostawcy Groq lub Gemini (POST /api/ai/config), aby umożliwić pełną konwersację z asystentem AI.';
    const widgets = determineWidgets(undefined, message, reply);
    return {
      reply,
      toolCall: undefined,
      widgets
    };
  }
}

export const llmGateway = new LLMGateway();
