import { LessonItem, SchoolEvent, TaskItem, HabitItem } from '../../db/store.js';

export type AutomationTriggerType = 'interval' | 'cron' | 'lesson_bell' | 'manual';

export interface AutomationScript {
  id: string;
  name: string;
  description?: string;
  templateId: string;
  enabled: boolean;
  triggerType: AutomationTriggerType;
  cronExpression?: string; // np. "15 7 * * 1-5" lub "*/5 * * * *"
  code: string; // Kod ciała funkcji otrzymującej parametr 'ctx'
  lastRunAt?: string;
  lastStatus?: 'SUCCESS' | 'ERROR' | 'SKIPPED';
  lastLog?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  category: 'SCHOOL' | 'PRODUCTIVITY' | 'HEALTH' | 'CUSTOM';
  defaultTriggerType: AutomationTriggerType;
  defaultCron?: string;
  sampleCode: string;
}

export interface CurrentLessonInfo {
  currentLesson: LessonItem | null;
  nextLesson: LessonItem | null;
  minutesToBell: number;
  bellType: 'LESSON_END' | 'BREAK_END' | 'OUTSIDE_HOURS';
  timeUntilNextEventFormatted: string;
}

export interface ScriptExecutionContext {
  time: {
    now: Date;
    formattedTime: string;
    dateStr: string;
    dayOfWeek: number;
    dayName: string;
    minutesFromMidnight: number;
  };
  school: {
    getCurrentLesson(): LessonItem | null;
    getNextLesson(): LessonItem | null;
    getMinutesToBell(): number;
    getLessonInfo(): CurrentLessonInfo;
    getTodayLessons(): LessonItem[];
    getTodayExams(): SchoolEvent[];
    isSchoolHours(): boolean;
  };
  pushbullet: {
    send(title: string, body: string, priority?: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW'): Promise<any>;
  };
  tasks: {
    getPending(): TaskItem[];
    add(title: string, priority?: 'HIGH' | 'MEDIUM' | 'LOW'): TaskItem;
  };
  habits: {
    getIncomplete(): HabitItem[];
    getHabits(): HabitItem[];
  };
  log(message: string): void;
  notify(title: string, body: string, priority?: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW'): Promise<any>;
}

export interface ScriptExecutionResult {
  success: boolean;
  result?: any;
  logs: string[];
  notificationsSent: Array<{ title: string; body: string; priority: string }>;
  error?: string;
  durationMs: number;
}
