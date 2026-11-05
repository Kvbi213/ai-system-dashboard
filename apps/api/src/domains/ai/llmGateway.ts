import dotenv from 'dotenv';
dotenv.config();

import { finOpsCollector } from '../system/finopsCollector.js';
import { IterationBudget } from './iterationBudget.js';
import { dbStore, LessonItem } from '../../db/store.js';
import { pushbulletService } from '../pushbullet/pushbulletService.js';
import { AUTOMATION_TEMPLATES } from '../automation/automationTemplates.js';
import { calculateLessonInfo, executeScript } from '../automation/scriptEngine.js';

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

export const LLM_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_current_lesson_status',
      description: 'Zwraca aktualną godzinę, aktualnie trwającą lekcję, czas w minutach do dzwonka na przerwę, kolejną lekcję, salę oraz nazwisko nauczyciela.',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'send_phone_notification',
      description: 'Wysyła natychmiastowe powiadomienie Push na smartfon operatora przez Pushbullet Dispatcher.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Tytuł powiadomienia (np. Dzwonek za 5 min, Alert lekcji)' },
          body: { type: 'string', description: 'Treść powiadomienia' },
          priority: { type: 'string', enum: ['CRITICAL', 'HIGH', 'NORMAL', 'LOW'], description: 'Priorytet powiadomienia' }
        },
        required: ['title', 'body'],
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
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
        required: ['name', 'code'],
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'test_run_automation_script',
      description: 'Testuje i uruchamia podany kod skryptu automatyzacji w bezpiecznej piaskownicy z wstrzykniętym obiektem ctx (odczyt czasu, lekcji, Pushbullet) i zwraca logi wykonania.',
      parameters: {
        type: 'object',
        properties: {
          code: { type: 'string', description: 'Kod skryptu JavaScript do testowego wykonania' },
          scriptId: { type: 'string', description: 'ID zarejestrowanego skryptu (jeśli testujemy istniejący)' },
          simulatedDate: { type: 'string', description: 'Opcjonalna symulowana data ISO dla testu (np. 2026-11-05T09:30:00)' }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_automation_scripts',
      description: 'Zwraca listę wszystkich zarejestrowanych skryptów automatyzacji w systemie OmniDash.',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_automation_templates',
      description: 'Zwraca listę gotowych szablonów automatyzacji (alert dzwonka, briefing, nawyki, custom).',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'timetable_get_schedule',
      description: 'Pobiera plan lekcji na wybrany dzień tygodnia (1=poniedziałek, ..., 5=piątek) lub cały tydzień.',
      parameters: {
        type: 'object',
        properties: {
          day: { type: 'number', description: 'Numer dnia tygodnia od 1 do 5 (domyślnie bieżący dzień)' }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_grades_summary',
      description: 'Zwraca wykaz ocen z Librus Synergia, średnią ważoną GPA, liczbę ocen celujących i szczęśliwy numerek.',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'add_task',
      description: 'Dodaje nowe zadanie do listy zadań operatora.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Tytuł zadania' },
          priority: { type: 'string', enum: ['HIGH', 'MEDIUM', 'LOW'], description: 'Priorytet zadania' },
          category: { type: 'string', description: 'Kategoria zadania' }
        },
        required: ['title'],
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'add_finance_transaction',
      description: 'Rejestruje wydatek lub przychód w budżecie 50/30/20.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Nazwa transakcji' },
          amount: { type: 'number', description: 'Kwota transakcji w PLN' },
          envelope: { type: 'string', enum: ['NEEDS', 'WANTS', 'SAVINGS'], description: 'Koperta budżetowa' },
          type: { type: 'string', enum: ['EXPENSE', 'INCOME'], description: 'Typ transakcji' }
        },
        required: ['title', 'amount', 'envelope'],
        additionalProperties: false
      }
    }
  }
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

  private getGroqKey(): string {
    return process.env.GROQ_API_KEY || this.groqApiKey || '';
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

    return `Jesteś autonomicznym, wysoce precyzyjnym asystentem inżynieryjnym i wykonawczym ekosystemu OmniDash v4.0.0.
Odpowiadasz operatorowi w języku polskim: bezpośrednio, merytorycznie, bez zbędnych wstępów, przeprosin i small-talku.

--- AUTORYTATYWNY KONTEKST SYSTEMU ---
- Aktualny czas: ${formattedTime}
- Bieżąca data: ${dateFormatted}
- Dzień roboczy: ${dayName} (Dzień ${currentDay}/5)
- Status zajęć: ${lessonInfo.timeUntilNextEventFormatted}
- Aktualna lekcja: ${lessonInfo.currentLesson ? `${lessonInfo.currentLesson.subject} w sali ${lessonInfo.currentLesson.classroom} (${lessonInfo.currentLesson.teacher || 'nauczyciel'})` : 'Brak (przerwa lub poza lekcjami)'}
- Kolejna lekcja: ${lessonInfo.nextLesson ? `${lessonInfo.nextLesson.subject} w sali ${lessonInfo.nextLesson.classroom} (${lessonInfo.nextLesson.teacher || 'nauczyciel'})` : 'Koniec zajęć'}
- Do dzwonka: ${lessonInfo.minutesToBell} min (${lessonInfo.bellType})
- Dzisiejsze lekcje (${todayLessons.length}): ${todayLessons.map((l) => `${l.order}. ${l.subject} (${l.timeRange}, s. ${l.classroom})`).join(', ')}
- Dzisiejsze sprawdziany / kartkówki: ${todayExams.length > 0 ? todayExams.map((e) => `${e.title} (${e.subject || 'szkoła'})`).join('; ') : 'Brak zaplanowanych sprawdzianów na dziś'}

--- ZASADY DZIAŁANIA I FUNCTION CALLING ---
1. Posiadasz pełny zestaw narzędzi (tools). Gdy operator pyta o kolejną lekcję, dzwonek, wysłanie powiadomienia, dodanie zadania, wydatku, lub prosi o stworzenie skryptu automatyzacji (np. przypominającego przez Pushbullet przed dzwonkiem lub rano) — ZAWSZE wywołaj odpowiednie narzędzie!
2. Po wykonaniu narzędzia przedstaw operatorowi zwięzłe inżynieryjne podsumowanie wykonanej akcji.
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
      } catch (err) {
        console.warn('[!] LLMGateway: Groq provider failed, initiating failover:', err);
        fallbackCount++;
      }
    }

    // 2. Secondary: Gemini 2.0 Flash API
    if (this.geminiApiKey?.trim()) {
      try {
        budget.recordStep();
        const res = await this.callGemini(options);
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
      } catch (err) {
        console.warn('[!] LLMGateway: Gemini provider failed, initiating failover:', err);
        fallbackCount++;
      }
    }

    // 3. Deterministic Local Executive Assistant Fallback
    budget.recordStep();
    const localRes = await this.executeLocalAssistant(options.message, options.userId);
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

        // 1st Turn: Send user message with available tools
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
          throw new Error(`Groq HTTP error ${response.status}: ${response.statusText}`);
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

          // Execute tool call live
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

            return {
              reply: finalReply,
              provider: 'groq',
              model: 'openai/gpt-oss-120b',
              tokensUsed: { prompt: totalUsage.prompt_tokens, completion: totalUsage.completion_tokens, total: totalUsage.total_tokens },
              toolCall: {
                toolName: fnName,
                args: fnArgs,
                output: toolResult
              }
            };
          }

          // If second turn failed, return tool result directly
          return {
            reply: assistantMsg.content || `Wykonano narzędzie ${fnName}: ${toolResult}`,
            provider: 'groq',
            model: 'openai/gpt-oss-120b',
            tokensUsed: { prompt: totalUsage.prompt_tokens, completion: totalUsage.completion_tokens, total: totalUsage.total_tokens },
            toolCall: {
              toolName: fnName,
              args: fnArgs,
              output: toolResult
            }
          };
        }

        const reply = assistantMsg?.content || 'Pomyślnie przetworzono polecenie.';
        return {
          reply,
          provider: 'groq',
          model: 'openai/gpt-oss-120b',
          tokensUsed: { prompt: totalUsage.prompt_tokens, completion: totalUsage.completion_tokens, total: totalUsage.total_tokens }
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
          currentLesson: info.currentLesson ? `${info.currentLesson.subject} (${info.currentLesson.classroom}, ${info.currentLesson.teacher})` : null,
          nextLesson: info.nextLesson ? `${info.nextLesson.subject} (${info.nextLesson.classroom}, ${info.nextLesson.teacher})` : null,
          minutesToBell: info.minutesToBell,
          bellType: info.bellType
        });
      }

      case 'send_phone_notification': {
        const title = args.title || 'OmniDash Powiadomienie';
        const body = args.body || 'Wiadomość z asystenta AI';
        const priority = args.priority || 'NORMAL';
        const pushResult = await pushbulletService.sendPush({ title, body, priority });
        return JSON.stringify({ success: true, pushResult });
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

      case 'timetable_get_schedule':
      case 'get_school_timetable': {
        const now = new Date();
        const requestedDay = typeof args.day === 'number' && args.day >= 1 && args.day <= 5 ? args.day : (now.getDay() >= 1 && now.getDay() <= 5 ? now.getDay() : 1);
        const lessons = dbStore.getTimetable(requestedDay);
        return JSON.stringify({ day: requestedDay, lessonsCount: lessons.length, lessons });
      }

      case 'get_grades_summary': {
        const gpa = dbStore.calculateGpa();
        const luckyNumber = dbStore.getLuckyNumber();
        const subjects = dbStore.getSubjectsWithGrades();
        return JSON.stringify({ gpa, luckyNumber, subjectsCount: subjects.length });
      }

      case 'add_task': {
        const title = args.title || 'Zadanie z asystenta AI';
        const priority = args.priority || 'HIGH';
        const created = dbStore.addTask(callerUserId, { title, priority, category: args.category || 'Asystent AI' });
        return JSON.stringify({ success: true, taskId: created.id, title: created.title });
      }

      case 'add_finance_transaction': {
        const title = args.title || 'Transakcja z AI';
        const amount = typeof args.amount === 'number' ? args.amount : 0;
        const envelope = args.envelope || 'NEEDS';
        const tx = dbStore.addTransaction(callerUserId, { title, amount, envelope, category: 'AI', type: args.type || 'EXPENSE' });
        return JSON.stringify({ success: true, txId: tx.id, amount: tx.amount });
      }

      default:
        return JSON.stringify({ error: `Nierozpoznane narzędzie: ${name}` });
    }
  }

  private async callGemini(options: LLMRequestOptions): Promise<Omit<LLMResponse, 'latencyMs' | 'fallbackCount'>> {
    return await withTimeout(
      async (signal) => {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.geminiApiKey}`;
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
          throw new Error(`Gemini HTTP error ${response.status}: ${response.statusText}`);
        }
        const data = (await response.json()) as any;
        const candidate = data.candidates?.[0];
        const reply = candidate?.content?.parts?.[0]?.text || 'Przetworzono polecenie w chmurze Gemini.';

        return {
          reply,
          provider: 'gemini',
          model: 'gemini-2.0-flash',
          tokensUsed: { prompt: 160, completion: 90, total: 250 }
        };
      },
      7000,
      'gemini'
    );
  }

  private async executeLocalAssistant(message: string, userId?: string): Promise<{ reply: string; toolCall?: { toolName: string; args: Record<string, unknown>; output: string } }> {
    const query = message.toLowerCase();
    const now = new Date();
    const day = now.getDay();
    const currentDay = day >= 1 && day <= 5 ? day : 1;
    const lessonInfo = calculateLessonInfo(now);

    if (query.includes('przerw') || query.includes('dzwonek') || query.includes('następn') || query.includes('gdzie mam') || query.includes('jaka lekcja')) {
      const output = await this.executeLiveTool('get_current_lesson_status', {}, userId);
      const reply = `Aktualny status: ${lessonInfo.timeUntilNextEventFormatted}. ${
        lessonInfo.currentLesson
          ? `Obecnie trwa: ${lessonInfo.currentLesson.subject} w sali ${lessonInfo.currentLesson.classroom} (${lessonInfo.currentLesson.teacher || 'nauczyciel'}).`
          : 'Trwa przerwa.'
      } ${
        lessonInfo.nextLesson
          ? `Kolejna lekcja: ${lessonInfo.nextLesson.subject} w sali ${lessonInfo.nextLesson.classroom} (${lessonInfo.nextLesson.teacher || 'nauczyciel'}). Do dzwonka: ${lessonInfo.minutesToBell} min.`
          : 'To ostatnia lekcja w dniu dzisiejszym.'
      }`;
      return {
        reply,
        toolCall: {
          toolName: 'get_current_lesson_status',
          args: {},
          output
        }
      };
    }

    if (query.includes('skrypt') || query.includes('automatyz') || query.includes('przypom')) {
      const output = await this.executeLiveTool('list_automation_scripts', {}, userId);
      const reply = `W systemie zarejestrowane są aktywne skrypty automatyzacji, w tym monitor dzwonków szkolnych (wysyłający alert Pushbullet na 5 min przed końcem lekcji z kolejną salą) oraz poranny briefing. Możesz edytować ich kod lub stworzyć nowy z szablonu.`;
      return {
        reply,
        toolCall: {
          toolName: 'list_automation_scripts',
          args: {},
          output
        }
      };
    }

    if (query.includes('plan') || query.includes('lekcj')) {
      const timetable = dbStore.getTimetable(currentDay);
      const output = await this.executeLiveTool('get_school_timetable', { day: currentDay }, userId);
      const reply = `W dzisiejszym harmonogramie masz ${timetable.length} lekcji: ` +
        timetable.map((t: LessonItem) => `${t.order}. ${t.subject} (${t.timeRange}, s. ${t.classroom})`).join(', ') + '.';
      return {
        reply,
        toolCall: {
          toolName: 'get_school_timetable',
          args: { day: currentDay },
          output
        }
      };
    }

    if (query.includes('push') || query.includes('telefon') || query.includes('powiadom')) {
      const output = await this.executeLiveTool('send_phone_notification', { title: 'OmniDash Asystent', body: message, priority: 'HIGH' }, userId);
      return {
        reply: 'Wysłano powiadomienie na Twój smartfon przez Pushbullet Dispatcher.',
        toolCall: {
          toolName: 'send_phone_notification',
          args: { title: 'OmniDash Asystent', body: message, priority: 'HIGH' },
          output
        }
      };
    }

    if (query.includes('dodaj zadanie') || query.includes('nowe zadanie')) {
      const taskTitle = message.replace(/(dodaj zadanie|nowe zadanie|zadanie:?)/gi, '').trim() || 'Nowe zadanie z czatu';
      const output = await this.executeLiveTool('add_task', { title: taskTitle, priority: 'HIGH' }, userId);
      return {
        reply: `Zadanie "${taskTitle}" zostało pomyślnie dodane do listy zadań.`,
        toolCall: {
          toolName: 'add_task',
          args: { title: taskTitle },
          output
        }
      };
    }

    return {
      reply: 'Zrozumiałem polecenie. System asystenta OmniDash v4.0 przetworzył operację.',
      toolCall: undefined
    };
  }
}

export const llmGateway = new LLMGateway();
