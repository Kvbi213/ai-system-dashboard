import { Router, Request, Response } from 'express';
import { dbStore, LessonItem } from '../db/store.js';
import { semanticMemory } from '../domains/memory/semanticRecall.js';
import os from 'os';

export interface McpToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required?: string[];
  };
}

/**
 * Zwraca numer bieżącego dnia roboczego (1=Pon, ..., 5=Pt).
 * W przypadku weekendu (sobota=6, niedziela=0) przełącza na najbliższy nadchodzący poniedziałek (1).
 */
export function getCurrentWorkday(now = new Date()): number {
  const day = now.getDay();
  if (day === 0 || day === 6) {
    return 1; // Najbliższy nadchodzący poniedziałek roboczy
  }
  return day;
}

/**
 * Bazowa klasa dla strukturalnych błędów serwera MCP z kodem HTTP.
 */
export class McpError extends Error {
  constructor(message: string, public readonly status: number = 500, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'McpError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class McpBadRequestError extends McpError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, 400, options);
    this.name = 'McpBadRequestError';
  }
}

export class McpNotFoundError extends McpError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, 404, options);
    this.name = 'McpNotFoundError';
  }
}

export class McpNotImplementedError extends McpError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, 501, options);
    this.name = 'McpNotImplementedError';
  }
}

/**
 * Reużywalny walidator liczb całkowitych w zadanym przedziale domkniętym.
 * Rzuca McpBadRequestError gdy walidacja nie powiedzie się.
 */
export function validatePositiveInteger(
  value: number,
  options: { min?: number; max?: number; name?: string }
): asserts value is number {
  const min = options.min ?? 1;
  const max = options.max ?? Number.MAX_SAFE_INTEGER;
  const name = options.name ?? 'wartość';

  if (!Number.isInteger(value) || value < min || value > max) {
    throw new McpBadRequestError(
      `Parametr "${name}" musi być liczbą całkowitą z zakresu od ${min} do ${max}.`
    );
  }
}

/**
 * Rygorystyczna asercja poprawności dnia roboczego (1 do 5).
 */
export function validateWorkday(day: number): asserts day is 1 | 2 | 3 | 4 | 5 {
  validatePositiveInteger(day, { min: 1, max: 5, name: 'day' });
}

export class InternalMcpServer {
  private tools: McpToolDefinition[] = [
    {
      name: 'get_system_metrics',
      description: 'Zwraca parametry wydajnościowe serwera (RAM, CPU, uptime, load avg) w formacie telemetrii Beszel.',
      parameters: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'query_timetable',
      description: 'Odpytuje zsynchronizowany plan lekcji Librus dla zadanego dnia tygodnia (1=Pon, 2=Wt, ..., 5=Pt).',
      parameters: {
        type: 'object',
        properties: {
          day: {
            type: 'number',
            description: 'Numer dnia tygodnia (1 do 5)'
          }
        },
        required: ['day']
      }
    },
    {
      name: 'get_active_alerts',
      description: 'Zwraca aktywne ostrzeżenia drogowe CANARD, fotoradary oraz alerty systemowe.',
      parameters: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'trigger_workout_sync',
      description: 'Pobiera lub wymusza synchronizację aktualnego postępu sesji kalisteniki FBW.',
      parameters: {
        type: 'object',
        properties: {
          cycle: {
            type: 'string',
            description: 'Identyfikator cyklu FBW (np. "Cykl A")'
          }
        }
      }
    },
    {
      name: 'get_current_lesson_status',
      description: 'Zwraca precyzyjny status bieżącej lekcji: trwające zajęcia, czas do dzwonka na przerwę, czas trwania przerwy oraz dane następnej lekcji (sala, przedmiot, nauczyciel).',
      parameters: {
        type: 'object',
        properties: {
          day: {
            type: 'number',
            description: 'Numer dnia tygodnia (1 do 5, domyślnie bieżący dzień roboczy)'
          },
          currentTime: {
            type: 'string',
            description: 'Czas w formacie "HH:mm" (opcjonalny, domyślnie aktualna godzina systemowa)'
          }
        }
      }
    },
    {
      name: 'schedule_lesson_transition_alert',
      description: 'Planuje deterministyczny komunikat Pushbullet / asystenta przed końcem lekcji (np. na 5 min przed dzwonkiem) z informacją o sali, przerwie i kolejnej lekcji.',
      parameters: {
        type: 'object',
        properties: {
          day: {
            type: 'number',
            description: 'Numer dnia tygodnia (1 do 5, domyślnie bieżący dzień roboczy)'
          },
          minutesBeforeEnd: {
            type: 'number',
            description: 'Liczba minut przed dzwonkiem na przerwę (od 1 do 30, domyślnie 5)'
          },
          lessonIndex: {
            type: 'number',
            description: 'Kolejność lekcji w planie (od 1 do 12)'
          },
          customNote: {
            type: 'string',
            description: 'Dodatkowa notatka do 300 znaków'
          }
        },
        required: ['lessonIndex']
      }
    },
    {
      name: 'save_student_directive',
      description: 'Zapisuje stałą preferencję lub regułę asystenta szkolnego (np. "przypominaj co lekcję o przerwie i kolejnej sali") do pamięci semantycznej Lab-Zero i bazy wiedzy OmniDash.',
      parameters: {
        type: 'object',
        properties: {
          directive: {
            type: 'string',
            description: 'Treść dyrektywy lub preferencji (od 3 do 500 znaków)'
          },
          tags: {
            type: 'string',
            description: 'Tagi rozdzielone przecinkami (maksymalnie 10 tagów)'
          }
        },
        required: ['directive']
      }
    }
  ];

  public listTools(): McpToolDefinition[] {
    return this.tools;
  }

  public async callTool(name: string, args: Record<string, any>): Promise<any> {
    try {
      return await this.handleToolCall(name, args);
    } catch (err: any) {
      if (err instanceof McpError) {
        throw err;
      }
      throw new McpError(`[!] McpServer Error [${name}]: ${err.message}`, 500, { cause: err });
    }
  }

  private async handleToolCall(name: string, args: Record<string, any>): Promise<any> {
    switch (name) {
      case 'get_system_metrics': {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const memoryPercent = Math.round((usedMem / totalMem) * 100);

        return {
          status: 'HEALTHY',
          uptimeSeconds: Math.round(os.uptime()),
          memory: {
            totalMb: Math.round(totalMem / (1024 * 1024)),
            usedMb: Math.round(usedMem / (1024 * 1024)),
            percent: memoryPercent
          },
          cpus: os.cpus().length,
          loadAvg: os.loadavg(),
          platform: os.platform(),
          timestamp: new Date().toISOString()
        };
      }

      case 'query_timetable': {
        const day = Number(args.day ?? getCurrentWorkday());
        validateWorkday(day);

        const lessons = dbStore.getTimetable(day);
        return {
          day,
          count: lessons.length,
          lessons: lessons.map((l) => ({
            order: l.order,
            time: l.timeRange,
            subject: l.subject,
            teacher: l.teacher,
            classroom: l.classroom
          }))
        };
      }

      case 'get_active_alerts': {
        const radars = dbStore.getSpeedRadars();
        const cameras = dbStore.getTrafficCameras();
        return {
          timestamp: new Date().toISOString(),
          canardRadarsCount: radars.length,
          trafficCamerasCount: cameras.length,
          hazards: [
            { id: 'hz_1', type: 'RADAR', location: 'DK22 / Czarlin', active: true },
            { id: 'hz_2', type: 'ROADWORK', location: 'Węzeł Stanisławie A1', status: 'płynny' }
          ]
        };
      }

      case 'trigger_workout_sync': {
        const exercises = dbStore.getExercises();
        const completedSets = exercises.reduce((acc, ex) => acc + (ex.completedSets || 0), 0);
        const totalSets = exercises.reduce((acc, ex) => acc + (ex.sets || 0), 0);
        return {
          cycle: args.cycle || 'FBW Podciąganie A',
          exercisesCount: exercises.length,
          completedSets,
          totalSets,
          isFinished: totalSets > 0 && completedSets >= totalSets,
          lastSynced: new Date().toISOString()
        };
      }

      case 'get_current_lesson_status': {
        const now = new Date();
        const dayNum = Number(args.day ?? getCurrentWorkday(now));
        validateWorkday(dayNum);

        const lessons = dbStore.getTimetable(dayNum);
        if (!lessons || lessons.length === 0) {
          return {
            day: dayNum,
            isBreak: true,
            currentLesson: null,
            nextLesson: null,
            statusSummary: 'Brak zaplanowanych lekcji na dany dzień.'
          };
        }

        let currentMinutes: number;
        if (args.currentTime && typeof args.currentTime === 'string' && args.currentTime.includes(':')) {
          const [h, m] = args.currentTime.split(':').map(Number);
          currentMinutes = (isNaN(h) ? now.getHours() : h) * 60 + (isNaN(m) ? now.getMinutes() : m);
        } else {
          currentMinutes = now.getHours() * 60 + now.getMinutes();
        }

        const parseRange = (rangeStr: string): { start: number; end: number } | null => {
          if (!rangeStr || !rangeStr.includes('-')) return null;
          const parts = rangeStr.split('-').map((s) => s.trim());
          if (parts.length < 2) return null;
          const [sh, sm] = parts[0].split(':').map(Number);
          const [eh, em] = parts[1].split(':').map(Number);
          if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return null;
          return {
            start: sh * 60 + sm,
            end: eh * 60 + em
          };
        };

        let currentLesson: LessonItem | null = null;
        let nextLesson: LessonItem | null = null;
        let isBreak = false;
        let minutesToBell = 0;
        let breakDurationMinutes = 10;

        for (let i = 0; i < lessons.length; i++) {
          const l = lessons[i];
          const range = parseRange(l.timeRange);
          if (!range) continue;

          if (currentMinutes >= range.start && currentMinutes < range.end) {
            currentLesson = l;
            minutesToBell = range.end - currentMinutes;
            if (i + 1 < lessons.length) {
              nextLesson = lessons[i + 1];
              const nextRange = parseRange(nextLesson.timeRange);
              if (nextRange) {
                breakDurationMinutes = Math.max(5, nextRange.start - range.end);
              }
            }
            break;
          } else if (currentMinutes < range.start) {
            isBreak = true;
            nextLesson = l;
            minutesToBell = range.start - currentMinutes;
            break;
          }
        }

        // Fallback gdy lekcje się skończyły lub jeszcze nie zaczęły
        if (!currentLesson && !nextLesson && lessons.length > 0) {
          const firstRange = parseRange(lessons[0].timeRange);
          if (firstRange) {
            nextLesson = lessons[0];
            isBreak = true;
            minutesToBell = Math.max(0, firstRange.start - currentMinutes);
          }
        }

        return {
          day: dayNum,
          currentMinutesFormatted: `${Math.floor(currentMinutes / 60).toString().padStart(2, '0')}:${(currentMinutes % 60).toString().padStart(2, '0')}`,
          isBreak,
          currentLesson: currentLesson ? {
            order: currentLesson.order,
            subject: currentLesson.subject,
            time: currentLesson.timeRange,
            classroom: currentLesson.classroom,
            teacher: currentLesson.teacher,
            minutesRemaining: minutesToBell
          } : null,
          breakInfo: {
            breakDurationMinutes,
            minutesUntilNextLesson: minutesToBell
          },
          nextLesson: nextLesson ? {
            order: nextLesson.order,
            subject: nextLesson.subject,
            time: nextLesson.timeRange,
            classroom: nextLesson.classroom,
            teacher: nextLesson.teacher
          } : null,
          statusSummary: currentLesson
            ? `Trwa lekcja: ${currentLesson.subject} (${currentLesson.classroom}). Do dzwonka: ${minutesToBell} min. Następnie: ${nextLesson ? nextLesson.subject + ' w sali ' + nextLesson.classroom : 'Koniec zajęć'}.`
            : `Przerwa. Do następnej lekcji (${nextLesson?.subject || 'Brak'}): ${minutesToBell} min.`
        };
      }

      case 'schedule_lesson_transition_alert': {
        const rawMinutes = Number(args.minutesBeforeEnd ?? 5);
        validatePositiveInteger(rawMinutes, { min: 1, max: 30, name: 'minutesBeforeEnd' });
        const minutesBeforeEnd = rawMinutes;

        const rawIndex = Number(args.lessonIndex ?? 1);
        validatePositiveInteger(rawIndex, { min: 1, max: 12, name: 'lessonIndex' });
        const lessonIndex = rawIndex;

        const note = args.customNote ? String(args.customNote).slice(0, 300) : 'Powiadomienie przed dzwonkiem';

        const dayNum = Number(args.day ?? getCurrentWorkday());
        validateWorkday(dayNum);

        const lessons = dbStore.getTimetable(dayNum);
        if (!lessons || lessons.length === 0) {
          throw new McpNotFoundError(`Brak planu lekcji dla dnia ${dayNum}.`);
        }

        const targetLesson = lessons.find((l) => l.order === lessonIndex);
        if (!targetLesson) {
          throw new McpNotFoundError(
            `Nie znaleziono lekcji o numerze ${lessonIndex} w planie dla dnia ${dayNum} (liczba lekcji w dniu: ${lessons.length}).`
          );
        }

        const nextIdx = lessons.findIndex((l) => l.order === targetLesson.order);
        const nextLesson = nextIdx >= 0 && nextIdx + 1 < lessons.length ? lessons[nextIdx + 1] : null;

        const timeParts = targetLesson.timeRange.split('-');
        const scheduledTime = timeParts.length > 1 ? timeParts[1].trim() : '12:00';

        const messagePayload = {
          type: 'LESSON_TRANSITION',
          scheduledAlertMinutesBefore: minutesBeforeEnd,
          targetLesson: targetLesson.subject,
          room: targetLesson.classroom,
          nextSubject: nextLesson ? nextLesson.subject : 'Koniec zajęć',
          nextRoom: nextLesson ? nextLesson.classroom : '-',
          nextTeacher: nextLesson ? nextLesson.teacher : '-',
          note,
          status: 'SCHEDULED'
        };

        return {
          success: true,
          scheduledForLesson: targetLesson.subject,
          fireAtTime: scheduledTime,
          alertWindow: `${minutesBeforeEnd} min przed dzwonkiem`,
          notificationPreview: `[DZWONEK] Za ${minutesBeforeEnd} min koniec: ${targetLesson.subject}. Następna lekcja: ${nextLesson ? nextLesson.subject + ' (sala ' + nextLesson.classroom + ')' : 'brak'}.`,
          payload: messagePayload
        };
      }

      case 'save_student_directive': {
        const rawDirective = String(args.directive || '').trim();
        if (!rawDirective || rawDirective.length < 3) {
          throw new McpBadRequestError('Pole "directive" jest wymagane i musi zawierać co najmniej 3 znaki.');
        }
        const directiveText = rawDirective.slice(0, 500);

        const tagList = args.tags
          ? String(args.tags).split(',').map((t) => t.trim().slice(0, 40)).filter(Boolean).slice(0, 10)
          : ['szkoła', 'lekcje', 'dyrektywa'];

        const memoryEntry = semanticMemory.addFact({
          category: 'SCHOOL',
          content: directiveText,
          tags: tagList
        });

        return {
          success: true,
          directiveId: memoryEntry.id,
          category: memoryEntry.category,
          storedContent: memoryEntry.content,
          tags: memoryEntry.tags,
          totalMemoryFacts: semanticMemory.getFacts().length,
          message: 'Dyrektywa została pomyślnie zindeksowana w pamięci semantycznej Lab-Zero.'
        };
      }

      default:
        throw new McpNotImplementedError(`Nieznane narzędzie "${name}".`);
    }
  }
}

export const mcpServer = new InternalMcpServer();

export const mcpRouter = Router();

mcpRouter.get('/tools', (_req: Request, res: Response) => {
  res.json({
    server: 'OmniDash Internal MCP Server v4.0.0',
    version: '1.0.0',
    tools: mcpServer.listTools()
  });
});

mcpRouter.post('/call', async (req: Request, res: Response) => {
  const { tool, arguments: args } = req.body;
  if (!tool || typeof tool !== 'string') {
    res.status(400).json({ error: 'BAD_REQUEST', message: 'Wymagane pole tool (string).' });
    return;
  }

  try {
    const result = await mcpServer.callTool(tool, args || {});
    res.json({
      success: true,
      tool,
      result
    });
  } catch (err: any) {
    const status = err instanceof McpError ? err.status : 500;
    res.status(status).json({
      success: false,
      tool,
      error: err.message
    });
  }
});
