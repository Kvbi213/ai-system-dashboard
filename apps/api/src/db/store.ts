import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  TaskItem,
  TransactionItem,
  SubscriptionItem,
  SavingsGoal,
  ExerciseItem,
  HabitItem,
  PersonalRecord,
  TrafficCamera,
  SpeedRadar,
  LessonItem,
  GradeItem,
  RoutineItem,
  PersonalGoalItem,
  JournalEntry,
  SchoolEvent,
  EventId,
  TEMP_EVENT_ID,
  SubjectWithGrades,
  SingleGradeDetail,
  AutomationScriptItem
} from './types.js';

import {
  SEED_TASKS,
  SEED_TRANSACTIONS,
  SEED_SUBSCRIPTIONS,
  SEED_SAVINGS_GOALS,
  SEED_EXERCISES,
  SEED_HABITS,
  SEED_RECORDS,
  SEED_TRAFFIC_CAMERAS,
  SEED_SPEED_RADARS,
  SEED_TIMETABLE,
  SEED_GRADES,
  SEED_EVENTS,
  SEED_ROUTINES,
  SEED_PERSONAL_GOALS,
  SEED_JOURNAL
} from './seedData.js';

export * from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function formatDisplayGrade(raw: string | number): string {
  return String(raw !== undefined && raw !== null ? raw : '').trim();
}

/**
 * Normalizuje surowy ciąg daty z Librusa do formatu ISO YYYY-MM-DD.
 * @param rawDate - surowy ciąg wejściowy (ISO, 'YYYY-MM-DD (dziań)', string z Date)
 * @returns Znormalizowany ciąg YYYY-MM-DD lub undefined jeśli ciąg jest pusty/niepoprawny.
 */
export function parseLibrusDate(rawDate?: string): string | undefined {
  if (!rawDate) return undefined;
  const trimmed = String(rawDate).trim();
  if (!trimmed) return undefined;
  const isoMatch = trimmed.match(/\d{4}-\d{2}-\d{2}/);
  if (isoMatch) return isoMatch[0];
  const parsed = new Date(trimmed);
  return !isNaN(parsed.getTime()) ? parsed.toISOString().split('T')[0] : undefined;
}

export function parseSafeAverage(raw: unknown): number | undefined {
  if (raw === null || raw === undefined) return undefined;
  const num = typeof raw === 'number' ? raw : parseFloat(String(raw));
  return Number.isFinite(num) && num > 0 ? Number(num.toFixed(2)) : undefined;
}

/**
 * Normalizuje identyfikator zdarzenia: zachowuje TEMP_EVENT_ID jako string, parsuje liczby dodatnie do number.
 */
export function parseEventId(rawId: unknown): EventId {
  if (rawId === null || rawId === undefined) return TEMP_EVENT_ID;
  const str = String(rawId).trim();
  if (str === TEMP_EVENT_ID || str === '') return TEMP_EVENT_ID;
  const num = Number(str);
  return Number.isFinite(num) && num > 0 ? num : str;
}

/**
 * Sanityzuje opcjonalne pole info zdarzenia ze znaczników HTML i encji.
 */
export function sanitizeEventInfo(raw?: unknown): string | undefined {
  if (raw === null || raw === undefined) return undefined;
  const str = String(raw).trim();
  if (!str) return undefined;
  const noTags = str.replace(/<[^>]*>?/gm, '').trim();
  const unescaped = noTags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
  return unescaped || undefined;
}

function parseGradeValue(raw: string | number): number {
  if (typeof raw === 'number') return raw;
  const str = String(raw).trim();
  if (str === '+' || str === '-') return 0;
  if (str.endsWith('+')) {
    const base = parseFloat(str.slice(0, -1));
    return isNaN(base) ? 0 : base + 0.5;
  }
  if (str.endsWith('-')) {
    const base = parseFloat(str.slice(0, -1));
    return isNaN(base) ? 0 : Math.max(1, base - 0.25);
  }
  const val = parseFloat(str);
  return isNaN(val) ? 0 : val;
}

export class DatabaseStore {
  private tasks: TaskItem[] = [];
  private transactions: TransactionItem[] = [];
  private subscriptions: SubscriptionItem[] = [];
  private savingsGoals: SavingsGoal[] = [];
  private exercises: ExerciseItem[] = [];
  private habits: HabitItem[] = [];
  private records: PersonalRecord[] = [];
  private trafficCameras: TrafficCamera[] = [];
  private speedRadars: SpeedRadar[] = [];
  private timetable: Record<number, LessonItem[]> = {};
  private grades: GradeItem[] = [];
  private subjectsWithGrades: SubjectWithGrades[] = [];
  private events: SchoolEvent[] = [];
  private routines: RoutineItem[] = [];
  private personalGoals: PersonalGoalItem[] = [];
  private journal: JournalEntry[] = [];
  private automationScripts: AutomationScriptItem[] = [];
  private luckyNumber = 3;

  constructor() {
    this.seed();
    this.loadFromDisk();
  }

  private getPersistencePath(): string {
    const custom = process.env.STORE_PERSISTENCE_PATH;
    if (custom) return custom;
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch {
        // Ignoruj błąd tworzenia katalogu
      }
    }
    return path.join(dataDir, 'store_state.json');
  }

  public persist(): void {
    if (process.env.NODE_ENV === 'test' && !process.env.STORE_PERSISTENCE_PATH) {
      return;
    }
    try {
      const p = this.getPersistencePath();
      const payload = {
        tasks: this.tasks,
        transactions: this.transactions,
        subscriptions: this.subscriptions,
        savingsGoals: this.savingsGoals,
        exercises: this.exercises,
        habits: this.habits,
        records: this.records,
        events: this.events,
        routines: this.routines,
        personalGoals: this.personalGoals,
        journal: this.journal,
        automationScripts: this.automationScripts
      };
      fs.writeFileSync(p, JSON.stringify(payload, null, 2), 'utf8');
    } catch (err) {
      console.warn('[!] Ostrzeżenie zapisu persystencji stanu store:', err);
    }
  }

  public loadFromDisk(): boolean {
    try {
      const p = this.getPersistencePath();
      if (!fs.existsSync(p)) return false;
      const raw = fs.readFileSync(p, 'utf8');
      const data = JSON.parse(raw);
      if (Array.isArray(data.tasks)) this.tasks = data.tasks;
      if (Array.isArray(data.transactions)) this.transactions = data.transactions;
      if (Array.isArray(data.subscriptions)) this.subscriptions = data.subscriptions;
      if (Array.isArray(data.savingsGoals)) this.savingsGoals = data.savingsGoals;
      if (Array.isArray(data.exercises)) this.exercises = data.exercises;
      if (Array.isArray(data.habits)) this.habits = data.habits;
      if (Array.isArray(data.records)) this.records = data.records;
      if (Array.isArray(data.events) && data.events.length > 0) this.events = data.events;
      if (Array.isArray(data.routines) && data.routines.length > 0) this.routines = data.routines;
      if (Array.isArray(data.personalGoals) && data.personalGoals.length > 0) this.personalGoals = data.personalGoals;
      if (Array.isArray(data.journal) && data.journal.length > 0) this.journal = data.journal;
      if (Array.isArray(data.automationScripts) && data.automationScripts.length > 0) this.automationScripts = data.automationScripts;
      return true;
    } catch {
      return false;
    }
  }

  public seed(): void {
    this.tasks = JSON.parse(JSON.stringify(SEED_TASKS));
    this.transactions = JSON.parse(JSON.stringify(SEED_TRANSACTIONS));
    this.subscriptions = JSON.parse(JSON.stringify(SEED_SUBSCRIPTIONS));
    this.savingsGoals = JSON.parse(JSON.stringify(SEED_SAVINGS_GOALS));
    this.exercises = JSON.parse(JSON.stringify(SEED_EXERCISES));
    this.habits = JSON.parse(JSON.stringify(SEED_HABITS));
    this.records = JSON.parse(JSON.stringify(SEED_RECORDS));
    this.trafficCameras = JSON.parse(JSON.stringify(SEED_TRAFFIC_CAMERAS));
    this.speedRadars = JSON.parse(JSON.stringify(SEED_SPEED_RADARS));
    this.timetable = JSON.parse(JSON.stringify(SEED_TIMETABLE));
    this.grades = JSON.parse(JSON.stringify(SEED_GRADES));
    this.events = JSON.parse(JSON.stringify(SEED_EVENTS));
    this.routines = JSON.parse(JSON.stringify(SEED_ROUTINES));
    this.personalGoals = JSON.parse(JSON.stringify(SEED_PERSONAL_GOALS));
    this.journal = JSON.parse(JSON.stringify(SEED_JOURNAL));
    this.automationScripts = [
      {
        id: 'script_lesson_bell',
        name: 'Monitor Dzwonków i Zmiany Sal (5 min przed)',
        description: 'Bada czas do dzwonka i gdy zostaje 5 minut, wysyła alert Pushbullet z nazwą sali, kolejnym przedmiotem i nauczycielem.',
        templateId: 'template_lesson_bell',
        enabled: true,
        triggerType: 'lesson_bell',
        code: `if (!ctx.school.isSchoolHours()) return;
const info = ctx.school.getLessonInfo();
if (info.bellType === 'LESSON_END' && info.minutesToBell <= 5 && info.minutesToBell >= 1) {
  const next = info.nextLesson;
  const title = \`DZWONEK ZA \${info.minutesToBell} MIN :: \${info.currentLesson?.subject || 'Lekcja'}\`;
  const body = next
    ? \`Za \${info.minutesToBell} min koniec lekcji. Kolejna: \${next.subject} w sali \${next.classroom} (\${next.teacher || 'nauczyciel'}).\`
    : \`Za \${info.minutesToBell} min koniec lekcji. To ostatnia lekcja w dniu dzisiejszym!\`;
  await ctx.pushbullet.send(title, body, 'HIGH');
  ctx.log(\`Wysłano alert dzwonka: \${title}\`);
}`,
        createdAt: '2026-11-05T08:00:00.000Z',
        updatedAt: '2026-11-05T08:00:00.000Z'
      },
      {
        id: 'script_morning_briefing',
        name: 'Poranny Briefing Ucznia (07:15)',
        description: 'Poranne zestawienie: liczba lekcji, sala pierwszej lekcji, sprawdziany i zadania.',
        templateId: 'template_morning_briefing',
        enabled: true,
        triggerType: 'cron',
        cronExpression: '15 7 * * 1-5',
        code: `const lessons = ctx.school.getTodayLessons();
const exams = ctx.school.getTodayExams();
const pendingTasks = ctx.tasks.getPending();
let body = \`Plan na dziś (\${ctx.time.dayName}): \${lessons.length} lekcji.\\n\`;
if (lessons.length > 0) body += \`Pierwsza lekcja: \${lessons[0].subject} o \${lessons[0].timeRange} w sali \${lessons[0].classroom}.\\n\`;
if (exams.length > 0) body += \`UWAGA SPRAWDZIANY: \${exams.map(e => e.title).join(', ')}!\\n\`;
body += \`Zadania: \${pendingTasks.length} do zrobienia.\`;
await ctx.pushbullet.send(\`Poranny Briefing :: \${ctx.time.dayName}\`, body, 'HIGH');
ctx.log('Wysłano poranny briefing.');`,
        createdAt: '2026-11-05T08:00:00.000Z',
        updatedAt: '2026-11-05T08:00:00.000Z'
      }
    ];

    // Ładowanie i wzbogacanie autorytatywnych danych z librusGroundTruth.json
    this.loadLibrusGroundTruth();
  }

  private loadLibrusGroundTruth(): void {
    try {
      const groundTruthPath = path.join(__dirname, 'librusGroundTruth.json');
      if (!fs.existsSync(groundTruthPath)) return;

      const raw = fs.readFileSync(groundTruthPath, 'utf8');
      const data = JSON.parse(raw);

      if (typeof data.luckyNumber === 'number') {
        this.luckyNumber = data.luckyNumber;
      }

      // 1. Parsowanie Przedmiotów i Ocen
      if (data.grades && Array.isArray(data.grades.subjects)) {
        const parsedSubjects: SubjectWithGrades[] = [];
        const flatGrades: GradeItem[] = [];

        data.grades.subjects.forEach((sub: any, sIdx: number) => {
          const subGrades: SingleGradeDetail[] = [];
          const rawName = String(sub.name || '').trim();
          const normalizedName = rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1) : `Przedmiot_${sIdx + 1}`;

          const parseRawGrade = (g: any, gIdx: number, semester: 1 | 2): SingleGradeDetail => {
            const rawInfo = String(g.info || g.details?.raw || '');
            const infoCategory = rawInfo.match(/Kategoria:\s*([^\n\r]+)/i)?.[1]?.trim();
            const infoDate = rawInfo.match(/Data:\s*([^\n\r]+)/i)?.[1]?.trim();
            const infoTeacher = rawInfo.match(/Nauczyciel:\s*([^\n\r]+)/i)?.[1]?.trim();
            const infoWeightMatch = rawInfo.match(/Waga:\s*(\d+)/i);
            const infoInAvgMatch = rawInfo.match(/Licz do średniej:\s*([^\n\r]+)/i);
            const infoComment = rawInfo.match(/Komentarz:\s*([^\n\r]+)/i)?.[1]?.trim();

            const rawVal = g.value !== undefined ? g.value : g.numericValue;
            const displayVal = formatDisplayGrade(rawVal);
            const val = parseGradeValue(g.numericValue !== undefined ? g.numericValue : g.value);
            const weight = g.details?.weight !== undefined
              ? Number(g.details.weight)
              : (g.weight !== undefined ? Number(g.weight) : (infoWeightMatch ? parseInt(infoWeightMatch[1], 10) : 1));
            const cat = g.details?.category || g.category || infoCategory || 'Brak kategorii';
            const dt = parseLibrusDate(g.details?.date || g.date || infoDate);
            const tch = g.details?.teacher || g.teacher || infoTeacher || '';
            const gId = String(g.id || `gt_sem${semester}_${sIdx}_${gIdx}`);
            const imprMatch = rawInfo.match(/Poprawa oceny:\s*([0-9\+\-]+)/i);
            const isImprovement = Boolean(imprMatch || g.isImprovement);
            const rawImpr = imprMatch ? imprMatch[1].trim() : (g.improvedValue ? String(g.improvedValue).trim() : undefined);
            const cleanImprMatch = rawImpr ? rawImpr.match(/^([0-9\+\-]+)/) : null;
            const improvedValue = cleanImprMatch ? cleanImprMatch[1] : rawImpr;
            const inAvg = g.details?.inAverage !== undefined
              ? Boolean(g.details.inAverage)
              : (g.inAverage !== undefined
                  ? Boolean(g.inAverage)
                  : (infoInAvgMatch ? infoInAvgMatch[1].trim().toLowerCase() === 'tak' : (val > 0 && weight > 0)));
            const color = g.color || g.details?.color || '#FFD700';
            const textColor = g.textColor || g.details?.textColor;
            const isInsideBracket = g.isInsideBracket !== undefined ? Boolean(g.isInsideBracket) : undefined;

            return {
              id: gId,
              value: val,
              displayValue: displayVal,
              weight,
              category: cat,
              date: dt,
              teacher: tch,
              comment: g.details?.comment || g.comment || infoComment || undefined,
              semester,
              isImprovement,
              improvedValue,
              inAverage: inAvg,
              color,
              textColor,
              isInsideBracket
            };
          };

          const sem1List = Array.isArray(sub.sem1Grades)
            ? sub.sem1Grades
            : (Array.isArray(sub.semester?.[0]?.grades) ? sub.semester[0].grades : []);
          const sem2List = Array.isArray(sub.sem2Grades)
            ? sub.sem2Grades
            : (Array.isArray(sub.semester?.[1]?.grades) ? sub.semester[1].grades : []);

          // Semestr 1
          sem1List.forEach((g: any, gIdx: number) => {
            const detail = parseRawGrade(g, gIdx, 1);
            if (detail.isImprovement && detail.improvedValue) {
              for (let pi = subGrades.length - 1; pi >= 0; pi--) {
                const prev = subGrades[pi];
                if (prev.category === detail.category || prev.displayValue === detail.improvedValue) {
                  prev.improvedGradeId = detail.id;
                  detail.improvedGradeId = prev.id;
                  prev.inAverage = false;
                  break;
                }
              }
            }
            subGrades.push(detail);

            flatGrades.push({
              id: detail.id,
              subject: normalizedName,
              grade: detail.value,
              weight: detail.weight,
              description: detail.category,
              date: detail.date || '',
              teacher: detail.teacher
            });
          });

          // Semestr 2
          sem2List.forEach((g: any, gIdx: number) => {
            const detail = parseRawGrade(g, gIdx, 2);
            if (detail.isImprovement && detail.improvedValue) {
              for (let pi = subGrades.length - 1; pi >= 0; pi--) {
                const prev = subGrades[pi];
                if (prev.category === detail.category || prev.displayValue === detail.improvedValue) {
                  prev.improvedGradeId = detail.id;
                  detail.improvedGradeId = prev.id;
                  prev.inAverage = false;
                  break;
                }
              }
            }
            subGrades.push(detail);

            flatGrades.push({
              id: detail.id,
              subject: normalizedName,
              grade: detail.value,
              weight: detail.weight,
              description: detail.category,
              date: detail.date || '',
              teacher: detail.teacher
            });
          });

          const sem1Avg = parseSafeAverage(sub.semester1Average) ??
            parseSafeAverage(sub.sem1Avg) ??
            parseSafeAverage(sub.tempAverage) ??
            parseSafeAverage(sub.semester?.[0]?.tempAverage);

          const sem2Avg = parseSafeAverage(sub.semester2Average) ??
            parseSafeAverage(sub.sem2Avg) ??
            parseSafeAverage(sub.semester?.[1]?.tempAverage);

          let weightedSum = 0;
          let weightTotal = 0;
          for (const sg of subGrades) {
            if (sg.inAverage !== false && sg.weight > 0 && sg.value > 0) {
              weightedSum += sg.value * sg.weight;
              weightTotal += sg.weight;
            }
          }
          const computedAvg = weightTotal > 0 ? Number((weightedSum / weightTotal).toFixed(2)) : 0;
          const finalAvg = parseSafeAverage(sub.average) ??
            ((sem1Avg !== undefined && sem1Avg > 0)
              ? sem1Avg
              : (computedAvg > 0 ? computedAvg : (sem2Avg !== undefined && sem2Avg > 0 ? sem2Avg : 0)));

          parsedSubjects.push({
            id: `sub_${sIdx}_${normalizedName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
            name: normalizedName,
            average: finalAvg,
            semester1Average: sem1Avg,
            semester2Average: sem2Avg,
            grades: subGrades
          });
        });

        if (parsedSubjects.length > 0) {
          this.subjectsWithGrades = parsedSubjects;
        }
        if (flatGrades.length > 0) {
          this.grades = flatGrades;
        }
      }

      // 2. Parsowanie Wydarzeń Kalendarza
      const rawEventsList = Array.isArray(data.calendar?.events)
        ? data.calendar.events
        : (Array.isArray(data.calendarEvents) ? data.calendarEvents : []);

      if (rawEventsList.length > 0) {
        const flatList: any[] = [];
        for (const item of rawEventsList) {
          if (!item) continue;
          if (item.id !== undefined) {
            flatList.push(item);
          } else {
            const nested = Object.values(item).filter(
              (v: any) => v && typeof v === 'object' && v.id !== undefined
            );
            if (nested.length > 0) {
              nested.forEach((n: any) => {
                flatList.push({ ...n, date: n.date || n.day || item.date || item.day });
              });
            }
          }
        }

        const gtEvents: SchoolEvent[] = flatList.map((e: any) => ({
          id: parseEventId(e.id),
          date: parseLibrusDate(e.date || e.day) || new Date().toISOString().split('T')[0],
          type: (e.type === 'sprawdzian' ? 'sprawdzian' : e.type === 'kartkowka' ? 'kartkowka' : e.type === 'absence' ? 'absence' : 'inne') as any,
          category: e.category || 'Wydarzenie szkolne',
          title: e.title || 'Wydarzenie Librus',
          teacher: e.teacher || undefined,
          description: e.description || undefined,
          time: e.time || undefined,
          subject: e.subject || undefined,
          info: sanitizeEventInfo(e.info) ?? sanitizeEventInfo(e.title)
        }));

        // Połącz wydarzenia z zachowaniem unikalności ID
        const existingIds = new Set(this.events.map((ev) => String(ev.id)));
        for (const gte of gtEvents) {
          if (!existingIds.has(gte.id)) {
            this.events.push(gte);
            existingIds.add(gte.id);
          }
        }
      }
    } catch (err) {
      console.warn('[!] Nie udało się wczytać librusGroundTruth.json:', err);
    }
  }

  public reset(): void {
    this.seed();
    this.persist();
  }

  // Tasks
  public getTasks(userId: string): TaskItem[] {
    return this.tasks.filter((t) => t.userId === userId);
  }

  public addTask(userId: string, data: Omit<TaskItem, 'id' | 'userId' | 'completed' | 'createdAt'>): TaskItem {
    const newTask: TaskItem = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      title: data.title,
      priority: data.priority,
      category: data.category,
      completed: false,
      createdAt: new Date().toISOString()
    };
    this.tasks.push(newTask);
    this.persist();
    return newTask;
  }

  public toggleTask(userId: string, id: string): TaskItem | null {
    const task = this.tasks.find((t) => t.id === id && t.userId === userId);
    if (!task) return null;
    task.completed = !task.completed;
    this.persist();
    return task;
  }

  public updateTask(userId: string, id: string, updates: Partial<Pick<TaskItem, 'title' | 'priority' | 'category' | 'completed'>>): TaskItem | null {
    const task = this.tasks.find((t) => t.id === id && t.userId === userId);
    if (!task) return null;
    if (updates.title !== undefined) task.title = updates.title;
    if (updates.priority !== undefined) task.priority = updates.priority;
    if (updates.category !== undefined) task.category = updates.category;
    if (updates.completed !== undefined) task.completed = updates.completed;
    this.persist();
    return task;
  }

  public deleteTask(userId: string, id: string): boolean {
    const initialLen = this.tasks.length;
    this.tasks = this.tasks.filter((t) => !(t.id === id && t.userId === userId));
    const deleted = this.tasks.length < initialLen;
    if (deleted) this.persist();
    return deleted;
  }

  // Transactions
  public getTransactions(userId: string): TransactionItem[] {
    return this.transactions.filter((t) => t.userId === userId);
  }

  public addTransaction(userId: string, data: Omit<TransactionItem, 'id' | 'userId' | 'date'>): TransactionItem {
    const newTx: TransactionItem = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      title: data.title,
      amount: data.amount,
      envelope: data.envelope,
      category: data.category,
      type: data.type,
      date: 'Przed chwilą'
    };
    this.transactions.unshift(newTx);
    this.persist();
    return newTx;
  }

  public deleteTransaction(userId: string, id: string): boolean {
    const len = this.transactions.length;
    this.transactions = this.transactions.filter((t) => !(t.id === id && t.userId === userId));
    const deleted = this.transactions.length < len;
    if (deleted) this.persist();
    return deleted;
  }

  public transferFunds(
    userId: string,
    fromEnvelope: 'NEEDS' | 'WANTS' | 'SAVINGS',
    toEnvelope: 'NEEDS' | 'WANTS' | 'SAVINGS',
    amount: number,
    note?: string
  ): { expenseTx: TransactionItem; incomeTx: TransactionItem } {
    if (
      typeof amount !== 'number' ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      throw new Error('Kwota transferu musi być poprawną skończoną liczbą dodatnią większą od zera.');
    }
    if (fromEnvelope === toEnvelope) {
      throw new Error('Koperta źródłowa i docelowa transferu muszą być różne.');
    }
    const reason = note || `Przesunięcie środków: ${fromEnvelope} -> ${toEnvelope}`;
    const expenseTx = this.addTransaction(userId, {
      title: `Transfer wychodzący: ${reason}`,
      amount,
      envelope: fromEnvelope,
      category: 'Transfer',
      type: 'EXPENSE'
    });

    try {
      const incomeTx = this.addTransaction(userId, {
        title: `Transfer przychodzący: ${reason}`,
        amount,
        envelope: toEnvelope,
        category: 'Transfer',
        type: 'INCOME'
      });
      return { expenseTx, incomeTx };
    } catch (err) {
      try {
        this.deleteTransaction(userId, expenseTx.id);
      } catch (rollbackErr) {
        console.error('[!] Błąd rollbacku transakcji transferu:', rollbackErr);
      }
      throw err;
    }
  }

  // Subscriptions CRUD
  public getSubscriptions(): SubscriptionItem[] {
    return this.subscriptions;
  }

  public addSubscription(sub: Omit<SubscriptionItem, 'id'>): SubscriptionItem {
    const newSub: SubscriptionItem = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...sub
    };
    this.subscriptions.push(newSub);
    this.persist();
    return newSub;
  }

  public deleteSubscription(id: string): boolean {
    const len = this.subscriptions.length;
    this.subscriptions = this.subscriptions.filter((s) => s.id !== id);
    const deleted = this.subscriptions.length < len;
    if (deleted) this.persist();
    return deleted;
  }

  public toggleSubscription(id: string): SubscriptionItem | null {
    const sub = this.subscriptions.find((s) => s.id === id);
    if (!sub) return null;
    sub.status = sub.status === 'active' ? 'pending' : 'active';
    this.persist();
    return sub;
  }

  // Savings Goals CRUD
  public getSavingsGoals(): SavingsGoal[] {
    return this.savingsGoals;
  }

  public addSavingsGoal(goal: Omit<SavingsGoal, 'id'>): SavingsGoal {
    const newGoal: SavingsGoal = {
      id: `goal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...goal
    };
    this.savingsGoals.push(newGoal);
    this.persist();
    return newGoal;
  }

  public deleteSavingsGoal(id: string): boolean {
    const len = this.savingsGoals.length;
    this.savingsGoals = this.savingsGoals.filter((g) => g.id !== id);
    const deleted = this.savingsGoals.length < len;
    if (deleted) this.persist();
    return deleted;
  }

  public depositSavingsGoal(id: string, amount: number): SavingsGoal | null {
    const goal = this.savingsGoals.find((g) => g.id === id);
    if (!goal) return null;
    goal.currentPln += amount;
    this.persist();
    return goal;
  }

  // Workouts CRUD
  public getExercises(): ExerciseItem[] {
    return this.exercises;
  }

  public addExercise(ex: Omit<ExerciseItem, 'id' | 'completedSets'>): ExerciseItem {
    const newEx: ExerciseItem = {
      id: `ex_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      completedSets: 0,
      ...ex
    };
    this.exercises.push(newEx);
    this.persist();
    return newEx;
  }

  public deleteExercise(id: string): boolean {
    const len = this.exercises.length;
    this.exercises = this.exercises.filter((e) => e.id !== id);
    const deleted = this.exercises.length < len;
    if (deleted) this.persist();
    return deleted;
  }

  public resetExercise(id: string): ExerciseItem | null {
    const ex = this.exercises.find((e) => e.id === id);
    if (!ex) return null;
    ex.completedSets = 0;
    this.persist();
    return ex;
  }

  public incrementWorkoutSet(id: string): ExerciseItem | null {
    const ex = this.exercises.find((e) => e.id === id);
    if (!ex) return null;
    if (ex.completedSets < ex.sets) {
      ex.completedSets += 1;
      this.persist();
    }
    return ex;
  }

  // Habits CRUD
  public getHabits(): HabitItem[] {
    return this.habits;
  }

  public addHabit(title: string): HabitItem {
    const newHabit: HabitItem = {
      id: `habit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title,
      streakDays: 0,
      completedToday: false
    };
    this.habits.push(newHabit);
    this.persist();
    return newHabit;
  }

  public deleteHabit(id: string): boolean {
    const len = this.habits.length;
    this.habits = this.habits.filter((h) => h.id !== id);
    const deleted = this.habits.length < len;
    if (deleted) this.persist();
    return deleted;
  }

  public toggleHabit(id: string): HabitItem | null {
    const habit = this.habits.find((h) => h.id === id);
    if (!habit) return null;
    habit.completedToday = !habit.completedToday;
    if (habit.completedToday) {
      habit.streakDays += 1;
    } else if (habit.streakDays > 0) {
      habit.streakDays -= 1;
    }
    this.persist();
    return habit;
  }

  // Records CRUD
  public getRecords(): PersonalRecord[] {
    return this.records;
  }

  public addRecord(record: PersonalRecord): PersonalRecord {
    const existingIndex = this.records.findIndex((r) => r.exercise.toLowerCase() === record.exercise.toLowerCase());
    if (existingIndex >= 0) {
      this.records[existingIndex] = record;
    } else {
      this.records.unshift(record);
    }
    this.persist();
    return record;
  }

  public deleteRecord(exercise: string): boolean {
    const len = this.records.length;
    this.records = this.records.filter((r) => r.exercise.toLowerCase() !== exercise.toLowerCase());
    const deleted = this.records.length < len;
    if (deleted) this.persist();
    return deleted;
  }

  // Traffic
  public getTrafficCameras(): TrafficCamera[] {
    return this.trafficCameras;
  }

  public getSpeedRadars(): SpeedRadar[] {
    return this.speedRadars;
  }

  // School
  public getTimetable(day: number): LessonItem[] {
    return this.timetable[day] || [];
  }

  public getAllTimetable(): Record<number, LessonItem[]> {
    return this.timetable;
  }

  public getGrades(): GradeItem[] {
    return this.grades;
  }

  public getLuckyNumber(): number {
    return this.luckyNumber;
  }

  public refreshFromGroundTruth(): void {
    this.loadLibrusGroundTruth();
  }

  public getSubjectsWithGrades(): SubjectWithGrades[] {
    if (this.subjectsWithGrades.length > 0) {
      return this.subjectsWithGrades;
    }
    // Fallback: zgrupuj z this.grades
    const map = new Map<string, SingleGradeDetail[]>();
    for (const g of this.grades) {
      const list = map.get(g.subject) || [];
      list.push({
        id: g.id,
        value: g.grade,
        displayValue: String(g.grade),
        weight: g.weight,
        category: g.description,
        date: g.date,
        teacher: g.teacher,
        inAverage: true
      });
      map.set(g.subject, list);
    }

    const result: SubjectWithGrades[] = [];
    let idx = 1;
    for (const [name, grades] of map.entries()) {
      let sumProduct = 0;
      let sumWeight = 0;
      for (const gr of grades) {
        if (gr.weight > 0 && gr.value > 0) {
          sumProduct += gr.value * gr.weight;
          sumWeight += gr.weight;
        }
      }
      const avg = sumWeight > 0 ? Number((sumProduct / sumWeight).toFixed(2)) : 0;
      result.push({
        id: `subj_${idx++}`,
        name,
        average: avg,
        grades
      });
    }
    return result;
  }

  public getEvents(): SchoolEvent[] {
    return this.events;
  }

  public addSchoolEvent(event: Omit<SchoolEvent, 'id'>): SchoolEvent {
    const newEvent: SchoolEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...event
    };
    this.events.unshift(newEvent);
    this.persist();
    return newEvent;
  }

  public deleteSchoolEvent(id: string | number): boolean {
    const len = this.events.length;
    this.events = this.events.filter((e) => String(e.id) !== String(id));
    const deleted = this.events.length < len;
    if (deleted) this.persist();
    return deleted;
  }

  public calculateGpa(): number {
    const graded = this.subjectsWithGrades.filter(
      (s) => (s.semester1Average && s.semester1Average > 0) || (s.average && s.average > 0)
    );
    if (graded.length > 0) {
      const sum = graded.reduce((acc, s) => acc + (s.semester1Average || s.average || 0), 0);
      return Number((sum / graded.length).toFixed(2));
    }

    let sumProduct = 0;
    let sumWeight = 0;
    for (const g of this.grades) {
      if (g.weight > 0) {
        sumProduct += g.grade * g.weight;
        sumWeight += g.weight;
      }
    }
    return sumWeight > 0 ? Number((sumProduct / sumWeight).toFixed(2)) : 0;
  }

  // Private Hub (Routines, Goals, Journal)
  public getRoutines(): RoutineItem[] {
    return this.routines;
  }

  public toggleRoutine(id: string): RoutineItem | null {
    const rt = this.routines.find((r) => r.id === id);
    if (!rt) return null;
    rt.completed = !rt.completed;
    this.persist();
    return rt;
  }

  public addRoutine(routine: Omit<RoutineItem, 'id' | 'completed'>): RoutineItem {
    const newRt: RoutineItem = {
      id: `rt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      completed: false,
      ...routine
    };
    this.routines.push(newRt);
    this.persist();
    return newRt;
  }

  public deleteRoutine(id: string): boolean {
    const len = this.routines.length;
    this.routines = this.routines.filter((r) => r.id !== id);
    const deleted = this.routines.length < len;
    if (deleted) this.persist();
    return deleted;
  }

  public getPersonalGoals(): PersonalGoalItem[] {
    return this.personalGoals;
  }

  public addPersonalGoal(goal: Omit<PersonalGoalItem, 'id'>): PersonalGoalItem {
    const newGoal: PersonalGoalItem = {
      id: `pg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...goal
    };
    this.personalGoals.push(newGoal);
    this.persist();
    return newGoal;
  }

  public updateGoalProgress(id: string, delta: number): PersonalGoalItem | null {
    const goal = this.personalGoals.find((g) => g.id === id);
    if (!goal) return null;
    goal.current = Math.min(goal.target, Math.max(0, goal.current + delta));
    this.persist();
    return goal;
  }

  public deletePersonalGoal(id: string): boolean {
    const len = this.personalGoals.length;
    this.personalGoals = this.personalGoals.filter((g) => g.id !== id);
    const deleted = this.personalGoals.length < len;
    if (deleted) this.persist();
    return deleted;
  }

  public getJournalEntries(): JournalEntry[] {
    return this.journal;
  }

  public addJournalEntry(entry: Omit<JournalEntry, 'id' | 'date'>): JournalEntry {
    const newEntry: JournalEntry = {
      id: `j_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date: 'Dzisiaj, ' + new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
      ...entry
    };
    this.journal.unshift(newEntry);
    this.persist();
    return newEntry;
  }

  public deleteJournalEntry(id: string): boolean {
    const len = this.journal.length;
    this.journal = this.journal.filter((j) => j.id !== id);
    const deleted = this.journal.length < len;
    if (deleted) this.persist();
    return deleted;
  }

  // Automation Scripts CRUD
  public getAutomationScripts(): AutomationScriptItem[] {
    return this.automationScripts;
  }

  public getAutomationScript(id: string): AutomationScriptItem | null {
    return this.automationScripts.find((s) => s.id === id) || null;
  }

  public saveAutomationScript(
    data: Omit<AutomationScriptItem, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): AutomationScriptItem {
    const nowIso = new Date().toISOString();
    if (data.id) {
      const idx = this.automationScripts.findIndex((s) => s.id === data.id);
      if (idx >= 0) {
        const updated: AutomationScriptItem = {
          ...this.automationScripts[idx],
          ...data,
          id: data.id,
          updatedAt: nowIso
        };
        this.automationScripts[idx] = updated;
        this.persist();
        return updated;
      }
    }

    const newScript: AutomationScriptItem = {
      id: data.id || `script_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: data.name,
      description: data.description,
      templateId: data.templateId || 'template_custom_script',
      enabled: data.enabled ?? true,
      triggerType: data.triggerType || 'interval',
      cronExpression: data.cronExpression,
      code: data.code,
      createdAt: nowIso,
      updatedAt: nowIso
    };
    this.automationScripts.unshift(newScript);
    this.persist();
    return newScript;
  }

  public toggleAutomationScript(id: string): AutomationScriptItem | null {
    const script = this.automationScripts.find((s) => s.id === id);
    if (!script) return null;
    script.enabled = !script.enabled;
    script.updatedAt = new Date().toISOString();
    this.persist();
    return script;
  }

  public deleteAutomationScript(id: string): boolean {
    const len = this.automationScripts.length;
    this.automationScripts = this.automationScripts.filter((s) => s.id !== id);
    const deleted = this.automationScripts.length < len;
    if (deleted) this.persist();
    return deleted;
  }

  public updateAutomationScriptRunResult(
    id: string,
    status: 'SUCCESS' | 'ERROR' | 'SKIPPED',
    log: string
  ): void {
    const script = this.automationScripts.find((s) => s.id === id);
    if (!script) return;
    script.lastRunAt = new Date().toISOString();
    script.lastStatus = status;
    script.lastLog = log;
    this.persist();
  }
}

export const dbStore = new DatabaseStore();
