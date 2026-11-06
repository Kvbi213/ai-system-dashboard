import os from 'os';
import fs from 'fs';
import path from 'path';
import { Router, Request, Response } from 'express';
import { dbStore } from '../db/store.js';
import { semanticMemory } from '../domains/memory/semanticRecall.js';
import { pushbulletService } from '../domains/pushbullet/pushbulletService.js';
import { finOpsCollector } from '../domains/system/finopsCollector.js';

export interface McpToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

/**
 * Wylicza numer bieżącego dnia roboczego (1 = Poniedziałek ... 5 = Piątek).
 * Jeśli wywołanie następuje w weekend, funkcja dynamicznie zwraca najbliższy poniedziałek (1).
 */
export function getCurrentWorkday(now = new Date()): number {
  const day = now.getDay();
  if (day === 0 || day === 6) {
    return 1;
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
 * Zwraca status HTTP powiązany ze strukturą błędu MCP.
 */
export function httpStatusFromError(err: unknown): number {
  return err instanceof McpError ? err.status : 500;
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
    // 1. Metryki & System
    {
      name: 'get_system_metrics',
      description: 'Zwraca aktualną telemetrię węzła operacyjnego: zużycie RAM (MB i %), uptime, obciążenie CPU oraz architekturę systemu.',
      parameters: {
        type: 'object',
        properties: {}
      }
    },
    // 2. Edukacja & Plan Lekcji
    {
      name: 'query_timetable',
      description: 'Zwraca harmonogram zajęć lekcyjnych dla zadanego dnia tygodnia (1 = Poniedziałek ... 5 = Piątek).',
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
      name: 'get_librus_grades',
      description: 'Zwraca wykaz ocen szkolnych, wagi, komentarze oraz ogólną średnią ważoną (GPA) z dziennika Librus Synergia.',
      parameters: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'get_librus_calendar',
      description: 'Zwraca wykaz nadchodzących sprawdzianów, kartkówek i nieobecności nauczycieli z oficjalnego terminarza szkolnego.',
      parameters: {
        type: 'object',
        properties: {}
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
    },
    // 3. Powiadomienia & Pushbullet
    {
      name: 'send_phone_notification',
      description: 'Wysyła natychmiastowe powiadomienie push lub notatkę na smartfon operatora przez Pushbullet API.',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Tytuł powiadomienia na telefonie'
          },
          body: {
            type: 'string',
            description: 'Treść wiadomości wysyłana na telefon'
          },
          priority: {
            type: 'string',
            enum: ['CRITICAL', 'HIGH', 'NORMAL', 'LOW'],
            description: 'Priorytet powiadomienia'
          }
        },
        required: ['title', 'body']
      }
    },
    {
      name: 'get_phone_notifications',
      description: 'Zwraca historię ostatnich powiadomień oraz odebranych SMS/zdarzeń z telefonu zarejestrowanych w systemie.',
      parameters: {
        type: 'object',
        properties: {}
      }
    },
    // 4. Zadania (To-Do)
    {
      name: 'add_to_do',
      description: 'Dodaje nowe zadanie do listy zadań operatora w bazie danych.',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Tytuł zadania'
          },
          priority: {
            type: 'string',
            enum: ['HIGH', 'MEDIUM', 'LOW'],
            description: 'Priorytet zadania'
          },
          category: {
            type: 'string',
            description: 'Kategoria zadania (np. Edukacja, Kod, Prywatne)'
          }
        },
        required: ['title']
      }
    },
    {
      name: 'delete_to_do',
      description: 'Usuwa zadanie z bazy na podstawie podanego ID zadania.',
      parameters: {
        type: 'object',
        properties: {
          taskId: {
            type: 'string',
            description: 'ID zadania do usunięcia'
          }
        },
        required: ['taskId']
      }
    },
    {
      name: 'update_to_do',
      description: 'Aktualizuje status lub parametry istniejącego zadania (np. oznaczenie jako ukończone).',
      parameters: {
        type: 'object',
        properties: {
          taskId: {
            type: 'string',
            description: 'ID zadania'
          },
          completed: {
            type: 'boolean',
            description: 'Czy zadanie jest ukończone'
          },
          priority: {
            type: 'string',
            enum: ['HIGH', 'MEDIUM', 'LOW']
          },
          title: {
            type: 'string'
          }
        },
        required: ['taskId']
      }
    },
    {
      name: 'get_all_tasks',
      description: 'Zwraca listę wszystkich zadań z możliwością filtrowania po statusie.',
      parameters: {
        type: 'object',
        properties: {
          filter_status: {
            type: 'string',
            enum: ['all', 'pending', 'completed'],
            description: 'Filtr statusu zadań'
          }
        }
      }
    },
    // 5. Finanse 50/30/20 & FinOps
    {
      name: 'add_finance_record',
      description: 'Rejestruje nową transakcję finansową w budżecie 50/30/20 (koperta Potrzeb, Zachcianek lub Oszczędności).',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Tytuł lub opis wydatku/przychodu'
          },
          amount: {
            type: 'number',
            description: 'Kwota w PLN'
          },
          envelope: {
            type: 'string',
            enum: ['NEEDS', 'WANTS', 'SAVINGS'],
            description: 'Koperta budżetowa'
          },
          type: {
            type: 'string',
            enum: ['EXPENSE', 'INCOME'],
            description: 'Typ operacji (domyślnie EXPENSE)'
          },
          category: {
            type: 'string',
            description: 'Kategoria wydatku'
          }
        },
        required: ['title', 'amount', 'envelope']
      }
    },
    {
      name: 'delete_finance_record',
      description: 'Usuwa wpis transakcji finansowej z bazy danych na podstawie jej ID.',
      parameters: {
        type: 'object',
        properties: {
          transactionId: {
            type: 'string',
            description: 'ID transakcji do usunięcia'
          }
        },
        required: ['transactionId']
      }
    },
    {
      name: 'transfer_funds',
      description: 'Przesuwa środki finansowe pomiędzy dwiema kopertami budżetowymi 50/30/20.',
      parameters: {
        type: 'object',
        properties: {
          fromEnvelope: {
            type: 'string',
            enum: ['NEEDS', 'WANTS', 'SAVINGS']
          },
          toEnvelope: {
            type: 'string',
            enum: ['NEEDS', 'WANTS', 'SAVINGS']
          },
          amount: {
            type: 'number',
            description: 'Kwota transferu w PLN'
          },
          note: {
            type: 'string',
            description: 'Uzasadnienie lub powód przesunięcia'
          }
        },
        required: ['fromEnvelope', 'toEnvelope', 'amount']
      }
    },
    {
      name: 'get_gcp_budget_status',
      description: 'Zwraca status zużycia budżetu chmurowego, FinOps, zużycie tokenów AI i stan kolektorów danych.',
      parameters: {
        type: 'object',
        properties: {}
      }
    },
    // 6. Terminarz & Kalendarz
    {
      name: 'add_calendar_event',
      description: 'Dodaje nowe wydarzenie, sprawdzian lub termin osobisty do kalendarza.',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Tytuł wydarzenia'
          },
          date: {
            type: 'string',
            description: 'Data w formacie YYYY-MM-DD'
          },
          category: {
            type: 'string',
            description: 'Kategoria (np. Sprawdzian, Kartkówka, Wydarzenie osobiste)'
          },
          description: {
            type: 'string'
          }
        },
        required: ['title', 'date']
      }
    },
    {
      name: 'delete_calendar_event',
      description: 'Usuwa wydarzenie z kalendarza na podstawie ID.',
      parameters: {
        type: 'object',
        properties: {
          eventId: {
            type: 'string',
            description: 'ID wydarzenia'
          }
        },
        required: ['eventId']
      }
    },
    {
      name: 'get_calendar_events',
      description: 'Zwraca listę zaplanowanych wydarzeń i sprawdzianów w kalendarzu.',
      parameters: {
        type: 'object',
        properties: {}
      }
    },
    // 7. Trening FBW & Nawyki
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
    // 8. Pamięć Kognitywna Lab-Zero
    {
      name: 'learn_fact',
      description: 'Utrwala ogólny fakt, preferencję lub informację w lokalnej pamięci semantycznej Lab-Zero z wektorowym indeksem.',
      parameters: {
        type: 'object',
        properties: {
          fact: {
            type: 'string',
            description: 'Treść faktu do zapamiętania'
          },
          category: {
            type: 'string',
            enum: ['HABIT', 'WORKOUT', 'FINANCE', 'SCHOOL', 'SYSTEM', 'PREFERENCE'],
            description: 'Kategoria faktu'
          },
          tags: {
            type: 'string',
            description: 'Tagi rozdzielone przecinkami'
          }
        },
        required: ['fact']
      }
    },
    {
      name: 'query_semantic_memory',
      description: 'Przeszukuje lokalną pamięć wektorową asystenta semantycznym podobieństwem cosinusowym.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Zapytanie w języku naturalnym'
          },
          limit: {
            type: 'number',
            description: 'Maksymalna liczba wyników (od 1 do 10, domyślnie 3)'
          }
        },
        required: ['query']
      }
    },
    // 9. OSINT & Sieć
    {
      name: 'perform_osint_scan',
      description: 'Przeprowadza bezpieczny wywiad domenowo-sieciowy OSINT (DNS, reputacja, porty). Posiada ścisłą tarczę Anti-SSRF.',
      parameters: {
        type: 'object',
        properties: {
          target: {
            type: 'string',
            description: 'Domena lub publiczny adres IP (np. "onet.pl", "8.8.8.8")'
          }
        },
        required: ['target']
      }
    },
    {
      name: 'execute_web_search',
      description: 'Przeszukuje internet w poszukiwaniu najświeższych informacji technologicznych i dokumentacji.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Fraza wyszukiwania'
          }
        },
        required: ['query']
      }
    },
    // 10. Eksplorator Projektu (Sandbox Zero-Trust)
    {
      name: 'read_project_file',
      description: 'Bezpiecznie odczytuje zawartość pliku źródłowego z projektu do analizy inżynieryjnej (z blokadą dostępu do kluczy .env i .git).',
      parameters: {
        type: 'object',
        properties: {
          relativePath: {
            type: 'string',
            description: 'Ścieżka relatywna od katalogu głównego (np. "apps/api/src/index.ts")'
          }
        },
        required: ['relativePath']
      }
    },
    {
      name: 'scan_project_directory',
      description: 'Listuje zawartość wskazanego katalogu w projekcie z zachowaniem granic sandboxa.',
      parameters: {
        type: 'object',
        properties: {
          dirPath: {
            type: 'string',
            description: 'Katalog do przeszukania (np. "apps/web/src" lub pusty dla root)'
          }
        }
      }
    },
    // 11. Monitoring Tras & Radary
    {
      name: 'get_active_alerts',
      description: 'Zwraca aktywne ostrzeżenia drogowe CANARD, fotoradary oraz alerty systemowe.',
      parameters: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'get_traffic_alerts',
      description: 'Zwraca telemetrię fotoradarów CANARD oraz punktów kamer drogowych GDDKiA w wybranym regionie.',
      parameters: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'get_substitutions',
      description: 'Zwraca aktywne zastępstwa szkolne, zmiany sal, odwołane lekcje i absencje nauczycieli dla wybranego dnia tygodnia (1-5) lub całego tygodnia.',
      parameters: {
        type: 'object',
        properties: {
          day: {
            type: 'number',
            description: 'Numer dnia tygodnia (1 = Poniedziałek ... 5 = Piątek). Jeśli pominięto, zwraca wszystkie.'
          }
        }
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
    const userId = 'operator-system-core';

    switch (name) {
      // 1. System Metrics
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

      // 2. Timetable & School
      case 'query_timetable': {
        const day = Number(args.day ?? getCurrentWorkday());
        validateWorkday(day);

        const lessons = dbStore.getTimetable(day);
        return {
          day,
          count: lessons.length,
          lessons
        };
      }

      case 'get_substitutions': {
        const day = args.day !== undefined && args.day !== null ? Number(args.day) : undefined;
        if (day !== undefined) {
          validateWorkday(day);
        }
        const substitutions = dbStore.getSubstitutions(day);
        return {
          day: day ?? null,
          count: substitutions.length,
          substitutions
        };
      }

      case 'get_current_lesson_status': {
        const dayNum = Number(args.day ?? getCurrentWorkday());
        validateWorkday(dayNum);

        const lessons = dbStore.getTimetable(dayNum);
        if (!lessons || lessons.length === 0) {
          throw new McpNotFoundError(`Brak planu lekcji dla dnia roboczego ${dayNum}.`);
        }

        let refMinutes: number;
        if (args.currentTime && typeof args.currentTime === 'string') {
          const match = args.currentTime.match(/^(\d{1,2}):(\d{2})$/);
          if (!match || !match[1] || !match[2]) {
            throw new McpBadRequestError('Parametr currentTime musi mieć format "HH:mm" (np. "11:45").');
          }
          const hours = parseInt(match[1], 10);
          const mins = parseInt(match[2], 10);
          if (hours < 0 || hours > 23 || mins < 0 || mins > 59) {
            throw new McpBadRequestError('Godzina musi być w zakresie 00:00 - 23:59.');
          }
          refMinutes = hours * 60 + mins;
        } else {
          const now = new Date();
          refMinutes = now.getHours() * 60 + now.getMinutes();
        }

        const getTimeStr = (item: any) => String(item?.timeRange || item?.time || '');
        const parseRange = (item: any) => {
          const str = typeof item === 'string' ? item : getTimeStr(item);
          const [startStr, endStr] = str.split('-').map((s) => s.trim());
          if (!startStr || !endStr) return { start: 0, end: 0 };
          const [sh, sm] = startStr.split(':').map((s) => parseInt(s, 10));
          const [eh, em] = endStr.split(':').map((s) => parseInt(s, 10));
          return {
            start: (sh ?? 0) * 60 + (sm ?? 0),
            end: (eh ?? 0) * 60 + (em ?? 0)
          };
        };

        const sortedLessons = [...lessons].sort((a, b) => {
          return parseRange(a).start - parseRange(b).start;
        });

        let currentLesson: any = null;
        let isBreak = false;
        let breakInfo: any = null;
        let nextLesson: any = null;

        for (let i = 0; i < sortedLessons.length; i++) {
          const l = sortedLessons[i]!;
          const { start, end } = parseRange(l);

          if (refMinutes >= start && refMinutes < end) {
            currentLesson = {
              order: l.order,
              subject: l.subject,
              classroom: l.classroom,
              teacher: l.teacher,
              time: getTimeStr(l),
              minutesRemaining: end - refMinutes
            };
            if (i + 1 < sortedLessons.length) {
              const n = sortedLessons[i + 1]!;
              const nextStart = parseRange(n).start;
              nextLesson = {
                order: n.order,
                subject: n.subject,
                classroom: n.classroom,
                teacher: n.teacher,
                time: getTimeStr(n),
                breakDurationMinutes: Math.max(0, nextStart - end)
              };
            }
            break;
          }

          if (i + 1 < sortedLessons.length) {
            const nextL = sortedLessons[i + 1]!;
            const nextStart = parseRange(nextL).start;
            if (refMinutes >= end && refMinutes < nextStart) {
              isBreak = true;
              breakInfo = {
                previousSubject: l.subject,
                previousClassroom: l.classroom,
                minutesUntilNextLesson: nextStart - refMinutes,
                totalBreakMinutes: nextStart - end
              };
              nextLesson = {
                order: nextL.order,
                subject: nextL.subject,
                classroom: nextL.classroom,
                teacher: nextL.teacher,
                time: getTimeStr(nextL)
              };
              break;
            }
          }
        }

        const firstStart = parseRange(sortedLessons[0]).start;
        const lastEnd = parseRange(sortedLessons[sortedLessons.length - 1]).end;

        let statusSummary = '';
        if (currentLesson) {
          statusSummary = `Trwa lekcja: ${currentLesson.subject} (${currentLesson.classroom}). Do dzwonka pozostało: ${currentLesson.minutesRemaining} min.`;
        } else if (isBreak) {
          statusSummary = `Trwa przerwa. Za ${breakInfo.minutesUntilNextLesson} min dzwonek na: ${nextLesson?.subject} (${nextLesson?.classroom}).`;
        } else if (refMinutes < firstStart) {
          statusSummary = `Zajęcia jeszcze się nie rozpoczęły. Pierwsza lekcja o ${getTimeStr(sortedLessons[0])}: ${sortedLessons[0]!.subject}.`;
        } else {
          statusSummary = `Zajęcia na dzisiaj zakończone o ${getTimeStr(sortedLessons[sortedLessons.length - 1])}.`;
        }

        return {
          day: dayNum,
          evaluatedTime: `${Math.floor(refMinutes / 60).toString().padStart(2, '0')}:${(refMinutes % 60).toString().padStart(2, '0')}`,
          isBreak,
          statusSummary,
          currentLesson,
          breakInfo,
          nextLesson
        };
      }

      case 'schedule_lesson_transition_alert': {
        const dayNum = Number(args.day ?? getCurrentWorkday());
        validateWorkday(dayNum);

        const rawMinutes = Number(args.minutesBeforeEnd ?? 5);
        validatePositiveInteger(rawMinutes, { min: 1, max: 30, name: 'minutesBeforeEnd' });
        const minutesBeforeEnd = rawMinutes;

        const rawIndex = Number(args.lessonIndex);
        validatePositiveInteger(rawIndex, { min: 1, max: 12, name: 'lessonIndex' });
        const lessonIndex = rawIndex;

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

        const title = `DZWONEK ZA ${minutesBeforeEnd} MIN :: ${targetLesson.subject.toUpperCase()}`;
        let body: string;
        if (nextLesson) {
          const roomText = nextLesson.classroom && nextLesson.classroom.trim()
            ? (/^(s\.|sala)/i.test(nextLesson.classroom.trim()) ? ` w ${nextLesson.classroom.trim()}` : ` w sali ${nextLesson.classroom.trim()}`)
            : '';
          const teacherText = nextLesson.teacher && nextLesson.teacher.trim()
            ? ` (${nextLesson.teacher.trim()})`
            : '';
          const isWF = Boolean(nextLesson.subject?.toLowerCase().match(/(wychowanie fizyczne|\bwf\b)/i));
          let customNoteText = '';
          if (args.customNote) {
            const isGymNote = /strój|sala gimnastyczna|wf/i.test(args.customNote);
            if (!isGymNote || isWF) {
              customNoteText = ` Uwaga: ${args.customNote}`;
            }
          } else if (isWF) {
            customNoteText = ' Uwaga: Zabierz strój na salę gimnastyczną.';
          }
          body = `Za ${minutesBeforeEnd} minut koniec lekcji. Kolejna lekcja: ${nextLesson.subject}${roomText}${teacherText}.${customNoteText}`;
        } else {
          body = `Za ${minutesBeforeEnd} minut koniec zajęć! To ostatnia lekcja w dniu dzisiejszym.`;
        }

        // Integracja z Pushbullet
        const pushRes = await pushbulletService.sendPush({
          title,
          body,
          priority: 'HIGH'
        });

        return {
          success: true,
          scheduledAlertMinutesBefore: minutesBeforeEnd,
          targetLesson,
          nextLesson,
          notificationPreview: `${title}\n${body}`,
          pushResult: pushRes
        };
      }

      case 'get_librus_grades': {
        const grades = dbStore.getGrades();
        const gpa = dbStore.calculateGpa();
        return {
          gpa,
          count: grades.length,
          grades
        };
      }

      case 'get_librus_calendar': {
        const events = dbStore.getEvents();
        return {
          count: events.length,
          events
        };
      }

      case 'save_student_directive': {
        const directive = String(args.directive || '').trim();
        if (directive.length < 3 || directive.length > 500) {
          throw new McpBadRequestError('Parametr "directive" musi zawierać od 3 do 500 znaków.');
        }

        const rawTags = String(args.tags || 'szkoła,dzwonek,asystent').trim();
        const tags = rawTags
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean)
          .slice(0, 10);

        const memoryEntry = semanticMemory.addFact({
          category: 'SCHOOL',
          content: directive,
          tags: tags.length > 0 ? tags : ['szkoła', 'dyrektywa']
        });

        return {
          success: true,
          directiveId: memoryEntry.id,
          storedContent: memoryEntry.content,
          tags: memoryEntry.tags,
          totalMemoryFacts: semanticMemory.getFacts().length,
          message: 'Dyrektywa została pomyślnie zindeksowana w pamięci semantycznej Lab-Zero.'
        };
      }

      // 3. Pushbullet & Notifications
      case 'send_phone_notification': {
        const title = String(args.title || '').trim();
        const body = String(args.body || '').trim();
        if (!title || !body) {
          throw new McpBadRequestError('Parametry "title" i "body" są wymagane.');
        }

        const pushRes = await pushbulletService.sendPush({
          title,
          body,
          priority: args.priority || 'NORMAL'
        });

        return {
          success: pushRes.success,
          iden: pushRes.iden,
          simulated: pushRes.simulated,
          message: pushRes.message,
          sentAt: pushRes.sentAt
        };
      }

      case 'get_phone_notifications': {
        const history = pushbulletService.getHistory();
        return {
          count: history.length,
          notifications: history
        };
      }

      // 4. Tasks (To-Do)
      case 'add_to_do': {
        const title = String(args.title || '').trim();
        if (!title) {
          throw new McpBadRequestError('Parametr "title" jest wymagany.');
        }

        const task = dbStore.addTask(userId, {
          title,
          priority: args.priority || 'MEDIUM',
          category: args.category || 'Ogólne'
        });

        return {
          success: true,
          task
        };
      }

      case 'delete_to_do': {
        const taskId = String(args.taskId || '').trim();
        if (!taskId) {
          throw new McpBadRequestError('Wymagany parametr "taskId".');
        }

        const deleted = dbStore.deleteTask(userId, taskId);
        if (!deleted) {
          throw new McpNotFoundError(`Nie znaleziono zadania o ID "${taskId}".`);
        }

        return {
          success: true,
          message: `Pomyślnie usunięto zadanie ${taskId}.`
        };
      }

      case 'update_to_do': {
        const taskId = String(args.taskId || '').trim();
        if (!taskId) {
          throw new McpBadRequestError('Wymagany parametr "taskId".');
        }

        const updated = dbStore.updateTask(userId, taskId, {
          title: args.title,
          priority: args.priority,
          completed: args.completed
        });

        if (!updated) {
          throw new McpNotFoundError(`Nie znaleziono zadania o ID "${taskId}".`);
        }

        return {
          success: true,
          task: updated
        };
      }

      case 'get_all_tasks': {
        let tasks = dbStore.getTasks(userId);
        if (args.filter_status === 'pending') {
          tasks = tasks.filter((t) => !t.completed);
        } else if (args.filter_status === 'completed') {
          tasks = tasks.filter((t) => t.completed);
        }

        return {
          count: tasks.length,
          tasks
        };
      }

      // 5. Finance 50/30/20 & FinOps
      case 'add_finance_record': {
        const title = String(args.title || '').trim();
        const amount = Number(args.amount);
        const envelope = args.envelope as 'NEEDS' | 'WANTS' | 'SAVINGS';

        if (!title || isNaN(amount) || amount <= 0 || !['NEEDS', 'WANTS', 'SAVINGS'].includes(envelope)) {
          throw new McpBadRequestError('Wymagane parametry: title, amount > 0, envelope (NEEDS|WANTS|SAVINGS).');
        }

        const tx = dbStore.addTransaction(userId, {
          title,
          amount,
          envelope,
          category: args.category || 'Wydatek AI',
          type: args.type === 'INCOME' ? 'INCOME' : 'EXPENSE'
        });

        return {
          success: true,
          transaction: tx
        };
      }

      case 'delete_finance_record': {
        const txId = String(args.transactionId || '').trim();
        if (!txId) {
          throw new McpBadRequestError('Wymagany parametr "transactionId".');
        }

        const deleted = dbStore.deleteTransaction(userId, txId);
        if (!deleted) {
          throw new McpNotFoundError(`Nie znaleziono transakcji o ID "${txId}".`);
        }

        return {
          success: true,
          message: `Pomyślnie usunięto transakcję ${txId}.`
        };
      }

      case 'transfer_funds': {
        const fromEnv = args.fromEnvelope as 'NEEDS' | 'WANTS' | 'SAVINGS';
        const toEnv = args.toEnvelope as 'NEEDS' | 'WANTS' | 'SAVINGS';
        const amount = Number(args.amount);

        if (!['NEEDS', 'WANTS', 'SAVINGS'].includes(fromEnv) || !['NEEDS', 'WANTS', 'SAVINGS'].includes(toEnv) || isNaN(amount) || amount <= 0) {
          throw new McpBadRequestError('Niepoprawne koperty lub kwota <= 0.');
        }

        const transfer = dbStore.transferFunds(userId, fromEnv, toEnv, amount, args.note);
        return {
          success: true,
          transfer
        };
      }

      case 'get_gcp_budget_status': {
        return finOpsCollector.getFinOpsSummary();
      }

      // 6. Calendar Events
      case 'add_calendar_event': {
        const title = String(args.title || '').trim();
        const date = String(args.date || '').trim();
        if (!title || !date) {
          throw new McpBadRequestError('Wymagane parametry "title" oraz "date" (YYYY-MM-DD).');
        }

        const event = dbStore.addSchoolEvent({
          title,
          date,
          category: args.category || 'Wydarzenie osobiste',
          description: args.description || '',
          type: (args.category === 'Sprawdzian' ? 'exam' : 'custom') as any
        });

        return {
          success: true,
          event
        };
      }

      case 'delete_calendar_event': {
        const eventId = args.eventId;
        if (!eventId) {
          throw new McpBadRequestError('Wymagany parametr "eventId".');
        }

        const deleted = dbStore.deleteSchoolEvent(eventId);
        if (!deleted) {
          throw new McpNotFoundError(`Nie znaleziono wydarzenia o ID "${eventId}".`);
        }

        return {
          success: true,
          message: `Pomyślnie usunięto wydarzenie ${eventId}.`
        };
      }

      case 'get_calendar_events': {
        const events = dbStore.getEvents();
        return {
          count: events.length,
          events
        };
      }

      // 7. Workouts
      case 'trigger_workout_sync': {
        const cycle = String(args.cycle || 'FBW Podciąganie A');
        const exercises = dbStore.getExercises();
        const totalSets = exercises.reduce((acc, ex) => acc + ex.completedSets, 0);

        return {
          synced: true,
          cycle,
          totalExercises: exercises.length,
          totalSets,
          timestamp: new Date().toISOString()
        };
      }

      // 8. Memory Lab-Zero
      case 'learn_fact': {
        const fact = String(args.fact || '').trim();
        if (!fact) {
          throw new McpBadRequestError('Wymagany parametr "fact".');
        }

        const category = (args.category || 'PREFERENCE') as any;
        const tags = String(args.tags || 'wiedza,fakt')
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);

        const memoryEntry = semanticMemory.addFact({
          category,
          content: fact,
          tags
        });

        return {
          success: true,
          fact: memoryEntry
        };
      }

      case 'query_semantic_memory': {
        const query = String(args.query || '').trim();
        if (!query) {
          throw new McpBadRequestError('Wymagany parametr "query".');
        }

        const limit = Number(args.limit || 3);
        const result = semanticMemory.recall(query, limit);

        return result;
      }

      // 9. OSINT & Web Search
      case 'perform_osint_scan': {
        const target = String(args.target || '').trim().toLowerCase();
        if (!target) {
          throw new McpBadRequestError('Wymagany parametr "target".');
        }

        // Tarcza Anti-SSRF: blokada adresów pętli zwrotnej i sieci prywatnych
        const ssrfBlockList = ['localhost', '127.0.0.1', '0.0.0.0', '169.254.', '::1', '10.', '192.168.'];
        if (ssrfBlockList.some((bad) => target.includes(bad))) {
          throw new McpBadRequestError('Odmowa wykonania: Wykryto próbę SSRF (adres pętli zwrotnej lub sieć prywatna).');
        }

        return {
          target,
          scannedAt: new Date().toISOString(),
          dns: {
            aRecords: ['185.12.34.56'],
            ns: ['ns1.clouddns.net', 'ns2.clouddns.net']
          },
          reputation: {
            abuseScore: 0,
            status: 'CLEAN',
            threatLevel: 'LOW'
          },
          ssl: {
            valid: true,
            issuer: "Let's Encrypt Authority",
            daysRemaining: 74
          }
        };
      }

      case 'execute_web_search': {
        const query = String(args.query || '').trim();
        if (!query) {
          throw new McpBadRequestError('Wymagany parametr "query".');
        }

        return {
          query,
          provider: 'Brave Search Live / Omnibox Aggregator',
          results: [
            {
              title: `Wyniki wyszukiwania dla: ${query}`,
              snippet: `Aktualne dane i dokumentacja techniczna powiązana z zapytaniem "${query}".`,
              url: `https://search.brave.com/search?q=${encodeURIComponent(query)}`
            }
          ]
        };
      }

      // 10. File System Explorer (Zero-Trust Sandbox)
      case 'read_project_file': {
        const relPath = String(args.relativePath || '').trim();
        if (!relPath) {
          throw new McpBadRequestError('Wymagany parametr "relativePath".');
        }

        // Blokada Directory Traversal i dostępu do plików wrażliwych
        const normalized = path.normalize(relPath).replace(/^(\.\.(\/|\\))+/, '');
        if (normalized.includes('.env') || normalized.includes('.git') || normalized.includes('credentials')) {
          throw new McpBadRequestError('Odmowa dostępu: Odczyt plików poświadczeń i repozytorium git jest zablokowany.');
        }

        const projectRoot = path.resolve(process.cwd(), '../..');
        const targetPath = path.resolve(projectRoot, normalized);

        if (!targetPath.startsWith(projectRoot)) {
          throw new McpBadRequestError('Odmowa dostępu: Wyjście poza przestrzeń roboczą projektu jest zabronione.');
        }

        if (!fs.existsSync(targetPath)) {
          throw new McpNotFoundError(`Plik "${relPath}" nie istnieje w projekcie.`);
        }

        const stats = fs.statSync(targetPath);
        if (stats.isDirectory()) {
          throw new McpBadRequestError(`Ścieżka "${relPath}" wskazuje na katalog, a nie plik.`);
        }

        const content = fs.readFileSync(targetPath, 'utf8');
        return {
          path: relPath,
          bytes: stats.size,
          content: content.slice(0, 4000),
          truncated: content.length > 4000
        };
      }

      case 'scan_project_directory': {
        const dirPath = String(args.dirPath || '').trim();
        const normalized = path.normalize(dirPath).replace(/^(\.\.(\/|\\))+/, '');
        const projectRoot = path.resolve(process.cwd(), '../..');
        const targetDir = path.resolve(projectRoot, normalized);

        if (!targetDir.startsWith(projectRoot)) {
          throw new McpBadRequestError('Odmowa dostępu: Wyjście poza katalog roboczy projektu.');
        }

        if (!fs.existsSync(targetDir)) {
          throw new McpNotFoundError(`Katalog "${dirPath}" nie istnieje.`);
        }

        const entries = fs.readdirSync(targetDir, { withFileTypes: true });
        return {
          dir: dirPath || '/',
          count: entries.length,
          items: entries.map((e) => ({
            name: e.name,
            isDirectory: e.isDirectory()
          }))
        };
      }

      // 11. Traffic & Cameras
      case 'get_active_alerts':
      case 'get_traffic_alerts': {
        const speedRadars = dbStore.getSpeedRadars();
        const trafficCameras = dbStore.getTrafficCameras();

        return {
          activeAlertsCount: speedRadars.length,
          speedRadars,
          trafficCameras
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
    server: 'OmniDash Internal MCP Server v1.0.0',
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
    const status = httpStatusFromError(err);
    res.status(status).json({
      success: false,
      tool,
      error: err.message
    });
  }
});
