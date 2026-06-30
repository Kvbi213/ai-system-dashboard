import axios from 'axios';
import { generateHourlySummary } from './agent.js';
import { executeRun, executeQuery } from './database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ERROR_LOG = path.resolve(__dirname, '../docs/error.log');

// ��� Globalny rejestrator b��d�w �����������������������������������������������
export function logError(source, error) {
  const entry = `[${new Date().toISOString()}] [${source}] ${error?.message || String(error)}\n${error?.stack || ''}\n---\n`;
  console.error(`[!] ERROR [${source}]:`, error?.message || error);
  fs.appendFileSync(ERROR_LOG, entry, 'utf8');
}

// ��� Pobieranie pogody (z retry) �����������������������������������������������
export async function fetchWeather() {
  const lat = process.env.WEATHER_LAT || 53.96;
  const lon = process.env.WEATHER_LON || 18.53;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=precipitation_probability&forecast_days=1`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await axios.get(url, { timeout: 8000 });
      const cw = response.data.current_weather;
      // Do��cz prawdopodobie�stwo opad�w dla bie��cej godziny
      const currentHourIndex = new Date().getHours();
      const precipProb = response.data.hourly?.precipitation_probability?.[currentHourIndex] ?? null;
      return { ...cw, precipitation_probability: precipProb };
    } catch (err) {
      if (attempt === 3) {
        logError('fetchWeather', err);
        return null;
      }
      await new Promise(r => setTimeout(r, 2000 * attempt));
    }
  }
}

// ��� Silnik cyklicznych zada� (In-Memory Queue) ��������������������������������

// Mapowanie: dzie� tygodnia (0=Sun..6=Sat) � nazwa polska
const PL_DAYS = { 'poniedzialek': 1, 'wtorek': 2, 'sroda': 3, 'czwartek': 4, 'piatek': 5, 'sobota': 6, 'niedziela': 0 };

// Kolejka aktywnych job�w cyklicznych [{title, dayOfWeek, hour, minute, taskId}]
const recurringJobs = [];

/**
 * Parsuje regu�� cykliczn� z pola `recurrence_rule` w bazie.
 * Format: "weekly:WEEKDAY:HH:MM" np. "weekly:wtorek:17:00"
 */
function parseRecurrenceRule(rule) {
  if (!rule) return null;
  const parts = rule.split(':');
  if (parts[0] === 'weekly' && parts.length === 4) {
    const dayOfWeek = PL_DAYS[parts[1].toLowerCase()];
    if (dayOfWeek === undefined) return null;
    return { type: 'weekly', dayOfWeek, hour: parseInt(parts[2], 10), minute: parseInt(parts[3], 10) };
  }
  if (parts[0] === 'daily' && parts.length === 3) {
    return { type: 'daily', hour: parseInt(parts[1], 10), minute: parseInt(parts[2], 10) };
  }
  return null;
}

/**
 * �aduje zadania cykliczne z bazy SQLite do kolejki w pami�ci.
 */
async function loadRecurringJobs() {
  recurringJobs.length = 0;
  try {
    const tasks = await executeQuery(
      "SELECT id, title, recurrence_rule FROM tasks WHERE category = 'powtarzalne' AND recurrence_rule IS NOT NULL AND status != 'completed'"
    );
    for (const task of tasks) {
      const parsed = parseRecurrenceRule(task.recurrence_rule);
      if (parsed) {
        recurringJobs.push({ ...parsed, title: task.title, taskId: task.id });
        console.log(`[*] SCHEDULER: Za�adowano job cykliczny: "${task.title}" (${task.recurrence_rule})`);
      }
    }
    console.log(`[+] SCHEDULER: Za�adowano ${recurringJobs.length} job�w cyklicznych.`);
  } catch (err) {
    logError('loadRecurringJobs', err);
  }
}

/**
 * Co minut� sprawdza, czy kt�ry� job cykliczny powinien teraz uruchomi� zdarzenie.
 */
function tickRecurringJobs() {
  const now = new Date();
  const currentDay = now.getDay();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  for (const job of recurringJobs) {
    let shouldFire = false;
    if (job.type === 'weekly' && job.dayOfWeek === currentDay && job.hour === currentHour && job.minute === currentMinute) {
      shouldFire = true;
    } else if (job.type === 'daily' && job.hour === currentHour && job.minute === currentMinute) {
      shouldFire = true;
    }
    if (shouldFire) {
      console.log(`[+] SCHEDULER: Uruchamiam job cykliczny: "${job.title}"`);
      executeRun(
        "INSERT INTO system_logs (type, content) VALUES (?, ?)",
        ['scheduler_fire', JSON.stringify({ title: job.title, firedAt: now.toISOString() })]
      ).catch(err => logError('tickRecurringJobs:INSERT', err));
    }
  }
}

/**
 * Publiczne API do rejestracji nowego jobu cyklicznego (u�ywane przez agenta).
 */
export function registerRecurringJob(title, recurrenceRule, taskId) {
  const parsed = parseRecurrenceRule(recurrenceRule);
  if (!parsed) {
    console.warn(`[!] SCHEDULER: Nieprawid�owa regu�a: ${recurrenceRule}`);
    return false;
  }
  recurringJobs.push({ ...parsed, title, taskId });
  console.log(`[+] SCHEDULER: Zarejestrowano nowy job: "${title}" (${recurrenceRule})`);
  return true;
}

/**
 * Zwraca kopi� aktualnej kolejki job�w (dla endpointu /api/schedule).
 */
export function getScheduleQueue() {
  return recurringJobs.map(j => ({ ...j }));
}

// ��� Inicjalizacja pe�nego schedulera �����������������������������������������
const calendarReminders = [];

async function loadCalendarReminders() {
  calendarReminders.length = 0;
  try {
    const events = await executeQuery(
      "SELECT id, title, event_date, event_time, reminder_minutes FROM calendar_events WHERE reminder_minutes IS NOT NULL AND event_date >= date('now')"
    );
    for (const ev of events) {
      if (ev.event_time) {
        const eventDateTime = new Date(`${ev.event_date}T${ev.event_time}:00`);
        const reminderTime = new Date(eventDateTime.getTime() - (ev.reminder_minutes * 60000));
        calendarReminders.push({ 
          id: ev.id,
          title: ev.title, 
          reminderTime: reminderTime.getTime(),
          fired: false
        });
      }
    }
    console.log(`[+] SCHEDULER: Za�adowano ${calendarReminders.length} przypomnie� kalendarza.`);
  } catch (err) {
    logError('loadCalendarReminders', err);
  }
}

function tickCalendarReminders() {
  const now = Date.now();
  for (const reminder of calendarReminders) {
    if (!reminder.fired && now >= reminder.reminderTime && now < reminder.reminderTime + 5 * 60000) {
      reminder.fired = true;
      console.log(`[+] SCHEDULER: Uruchamiam przypomnienie kalendarza: "${reminder.title}"`);
      executeRun(
        "INSERT INTO phone_notifications (title, body, application_name, package_name, is_read) VALUES (?, ?, ?, ?, ?)",
        ["Przypomnienie z kalendarza", reminder.title, "AI Calendar", "ai.calendar.system", 0]
      ).catch(err => logError('tickCalendarReminders:INSERT', err));
    }
  }
}

export async function runScheduler() {
  console.log('[*] INFO: Inicjalizacja zaawansowanego schedulera...');

  // Za�aduj joby cykliczne z bazy
  await loadRecurringJobs();
  await loadCalendarReminders();

  // Minutowy tick dla cyklicznych job�w
  setInterval(() => { tickRecurringJobs(); tickCalendarReminders(); }, 60000);

  // Co 30 minut od�wie� kolejk� z bazy (odbiera nowe zadania dodane przez agenta)
  setInterval(() => { loadRecurringJobs(); loadCalendarReminders(); }, 30 * 60 * 1000);

  // Godzinne podsumowanie pogodowe
  const hourlyJob = async () => {
    console.log('[*] INFO: Generowanie godzinnego podsumowania...');
    const weather = await fetchWeather();
    if (weather) {
      await executeRun('INSERT INTO system_logs (type, content) VALUES (?, ?)', ['weather', JSON.stringify(weather)])
        .catch(err => logError('hourlyJob:weather', err));
      const summary = await generateHourlySummary(weather);
      await executeRun('INSERT INTO system_logs (type, content) VALUES (?, ?)', ['agent_summary', summary])
        .catch(err => logError('hourlyJob:summary', err));
      console.log('[+] SUCCESS: Zapisano godzinne podsumowanie oraz stan pogody.');
    }
  };

  hourlyJob();
  setInterval(hourlyJob, 3600000);
}
