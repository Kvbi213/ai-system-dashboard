import axios from 'axios';
import { 
  saveCloudDocument, 
  deleteCloudDocument, 
  clearCloudCollection, 
  completeAllCloudTasks, 
  uncompleteCloudTask, 
  deleteCompletedCloudTasks, 
  INITIAL_FIRESTORE_DATA 
} from './cloudSync.js';
import { sendPushNotificationClient, formatPushText, cleanSubjectName } from './pushbulletService.js';

/**
 * Autonomiczny Silnik AI Dyspozytora Klienckiego (Client-Side AI Dispatcher)
 * Obsługuje komunikację z modelem LLM (openai/gpt-oss-120b)
 * przez Vercel Serverless Gateway (CORS-enabled), lokalny backend Express oraz bezpośredni fallback.
 */

const VERCEL_AGENT_ENDPOINT = 'https://ai-system-dashboard.vercel.app/api/agent';
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

const isCloudMode = typeof window !== 'undefined' && (
  window.location.hostname.includes('web.app') || 
  window.location.hostname.includes('firebaseapp.com') ||
  window.location.hostname.includes('vercel.app')
);

const DEFAULT_INITIAL_TASKS = [
  { id: '1', title: 'Wdrożenie Cloud Hosting (OmniDash)', priority: 'HIGH', status: 'completed', category: 'system' },
  { id: '2', title: 'Autoryzacja profilu administratora', priority: 'HIGH', status: 'completed', category: 'system' },
  { id: '3', title: 'Aktywacja modelu openai/gpt-oss-120b na Vercel', priority: 'HIGH', status: 'completed', category: 'ai' },
  { id: '4', title: 'Wielomodułowa synchronizacja kategorii Firestore', priority: 'MEDIUM', status: 'completed', category: 'system' },
  { id: '5', title: 'Personalizacja widżetów i analiza przepływów danych', priority: 'MEDIUM', status: 'pending', category: 'dashboard' },
];

export function getClientTasks() {
  try {
    const rawTasks = typeof localStorage !== 'undefined' ? localStorage.getItem('cloud_cache_tasks') : null;
    if (rawTasks !== null) {
      const list = JSON.parse(rawTasks);
      if (Array.isArray(list)) {
        return list.map(item => ({
          ...item,
          id: String(item.id || item.title || Math.random()),
          title: item.title || item.text || 'Zadanie bez nazwy',
          status: item.status || (item.completed ? 'completed' : 'pending'),
          priority: item.priority || 'MEDIUM',
          category: item.category || 'ogólne'
        }));
      }
    }

    const rawTodos = typeof localStorage !== 'undefined' ? localStorage.getItem('cloud_cache_todos') : null;
    if (rawTodos !== null) {
      const list = JSON.parse(rawTodos);
      if (Array.isArray(list)) {
        return list.map(item => ({
          ...item,
          id: String(item.id || item.title || Math.random()),
          title: item.title || item.text || 'Zadanie bez nazwy',
          status: item.status || (item.completed ? 'completed' : 'pending'),
          priority: item.priority || 'MEDIUM',
          category: item.category || 'ogólne'
        }));
      }
    }

    return DEFAULT_INITIAL_TASKS;
  } catch (err) {
    console.warn('[AiDispatcher] Błąd odczytu zadań z cache:', err);
    return DEFAULT_INITIAL_TASKS;
  }
}

function getClientContextSummary() {
  const tasks = getClientTasks();
  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  let calendar = [];
  try {
    const rawCal = localStorage.getItem('cloud_cache_calendar');
    if (rawCal) calendar = JSON.parse(rawCal);
  } catch {}

  let finances = [];
  try {
    const rawFin = localStorage.getItem('cloud_cache_finances');
    if (rawFin) finances = JSON.parse(rawFin);
  } catch {}

  let workouts = [];
  try {
    const rawWork = localStorage.getItem('cloud_cache_workouts');
    if (rawWork) workouts = JSON.parse(rawWork);
  } catch {}

  let operatorBrain = [];
  try {
    const rawBrain = localStorage.getItem('cloud_cache_operator_brain');
    if (rawBrain) operatorBrain = JSON.parse(rawBrain);
    const roomFactExists = operatorBrain.some(b => b && b.fact && b.fact.toLowerCase().includes('sale zaczynające się od'));
    if (!roomFactExists) {
      const roomFact = {
        id: 'b5',
        category: 'Wiedza',
        fact: 'Sale lekcyjne zaczynające się od „Z” oraz „SZ” oraz sale z numerem po kropce (np. 1.2, 1.16) znajdują się w innym budynku niż sale bez takiego oznaczenia (np. sala 34, 17).',
        created_at: new Date().toISOString()
      };
      operatorBrain.push(roomFact);
      try {
        localStorage.setItem('cloud_cache_operator_brain', JSON.stringify(operatorBrain));
        saveCloudDocument('operator_brain', roomFact.id, roomFact);
      } catch {}
    }
  } catch {}

  let timetable = [];
  try {
    const rawTimetable = localStorage.getItem('cloud_cache_timetable');
    if (rawTimetable) timetable = JSON.parse(rawTimetable);
  } catch {}
  if (!Array.isArray(timetable) || timetable.length === 0) {
    timetable = Array.isArray(INITIAL_FIRESTORE_DATA?.timetable) ? INITIAL_FIRESTORE_DATA.timetable : [];
  }

  const now = new Date();
  const timeZone = 'Europe/Warsaw';
  const dateStr = now.toLocaleDateString('pl-PL', { timeZone, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('pl-PL', { timeZone, hour: '2-digit', minute: '2-digit' });

  return {
    tasks,
    pendingTasks,
    completedTasks,
    calendar: Array.isArray(calendar) ? calendar : [],
    finances: Array.isArray(finances) ? finances : [],
    workouts: Array.isArray(workouts) ? workouts : [],
    operatorBrain: Array.isArray(operatorBrain) ? operatorBrain : [],
    timetable: Array.isArray(timetable) ? timetable : [],
    dateStr,
    timeStr,
    timeZone
  };
}

export function getTimetableContext(timetable = [], now = new Date()) {
  const timeZone = 'Europe/Warsaw';
  const dayNamesPl = { 1: 'poniedziałek', 2: 'wtorek', 3: 'środa', 4: 'czwartek', 5: 'piątek', 6: 'sobota', 0: 'niedziela' };
  const dayIdMap = { 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday', 6: 'saturday', 0: 'sunday' };
  const plDaysOrder = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota'];

  const warsawDayNameLong = new Intl.DateTimeFormat('pl-PL', { timeZone, weekday: 'long' }).format(now).toLowerCase();
  const todayDayIndex = plDaysOrder.indexOf(warsawDayNameLong) !== -1 ? plDaysOrder.indexOf(warsawDayNameLong) : now.getDay();
  const todayDayId = dayIdMap[todayDayIndex];
  const todayDayName = dayNamesPl[todayDayIndex];

  const currentTimeStr = now.toLocaleTimeString('pl-PL', { timeZone, hour: '2-digit', minute: '2-digit' });
  const currentDateStr = now.toLocaleDateString('pl-PL', { timeZone, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Lekcje na dziś
  const todayLessons = (timetable || [])
    .filter(l => (l.day || '').toLowerCase() === todayDayId || (l.day || '').toLowerCase() === todayDayName.toLowerCase())
    .sort((a, b) => (a.time_start || '').localeCompare(b.time_start || ''));

  // Trwająca lekcja
  const ongoingLesson = todayLessons.find(l => (l.time_start || '') <= currentTimeStr && (l.time_end || '') >= currentTimeStr);

  // Najbliższa kolejna lekcja dzisiaj
  const nextLessonToday = todayLessons.find(l => (l.time_start || '') > currentTimeStr);

  // Najbliższa lekcja ogółem (dzisiaj lub w kolejnych dniach szkolnych)
  let nextLessonOverall = nextLessonToday;
  let nextLessonDayLabel = todayDayName;

  if (!nextLessonOverall) {
    for (let offset = 1; offset <= 7; offset++) {
      const nextDayIndex = (todayDayIndex + offset) % 7;
      const nextDayId = dayIdMap[nextDayIndex];
      const nextDayName = dayNamesPl[nextDayIndex];
      const candidateLessons = (timetable || [])
        .filter(l => (l.day || '').toLowerCase() === nextDayId || (l.day || '').toLowerCase() === nextDayName.toLowerCase())
        .sort((a, b) => (a.time_start || '').localeCompare(b.time_start || ''));
      if (candidateLessons.length > 0) {
        nextLessonOverall = candidateLessons[0];
        nextLessonDayLabel = nextDayName;
        break;
      }
    }
  }

  // Lekcje na jutro
  const tomorrowDayIndex = (todayDayIndex + 1) % 7;
  const tomorrowDayId = dayIdMap[tomorrowDayIndex];
  const tomorrowDayName = dayNamesPl[tomorrowDayIndex];
  const tomorrowLessons = (timetable || [])
    .filter(l => (l.day || '').toLowerCase() === tomorrowDayId || (l.day || '').toLowerCase() === tomorrowDayName.toLowerCase())
    .sort((a, b) => (a.time_start || '').localeCompare(b.time_start || ''));

  const formatLessonLine = (l) => {
    if (!l) return '';
    const cleanSubj = cleanSubjectName(l.subject);
    const roomPart = l.room ? `[${l.room}]` : '';
    const teacherPart = l.teacher ? `(${l.teacher})` : '';
    return `• ${l.time_start || '??'} - ${l.time_end || '??'} ${roomPart} ${cleanSubj} ${teacherPart}`.replace(/\s+/g, ' ').trim();
  };

  const currentLessonFormatted = ongoingLesson ? formatLessonLine(ongoingLesson) : 'Brak (trwa przerwa lub czas wolny poza zajęciami)';
  const nextLessonFormatted = nextLessonOverall 
    ? `${formatLessonLine(nextLessonOverall)} (${nextLessonDayLabel === todayDayName ? 'dziś' : nextLessonDayLabel})`
    : 'Brak zaplanowanych kolejnych lekcji w planie.';

  return {
    timeZone,
    todayDayIndex,
    todayDayId,
    todayDayName,
    currentTimeStr,
    currentDateStr,
    todayLessons,
    ongoingLesson,
    nextLessonToday,
    nextLessonOverall,
    nextLessonDayLabel,
    tomorrowLessons,
    tomorrowDayName,
    currentLessonFormatted,
    nextLessonFormatted,
    formatLessonLine
  };
}

function determineWidgets(userText, aiResponse = '') {
  const combined = `${userText} ${aiResponse}`.toLowerCase();
  const widgets = [];

  if (
    combined.includes('todo') || 
    combined.includes('zadania') || 
    combined.includes('zadań') || 
    combined.includes('zadanie') || 
    combined.includes('obowiązki') ||
    combined.includes('listę zadań') ||
    combined.includes('lista zadań')
  ) {
    widgets.push('tasks');
  }

  if (
    combined.includes('pogod') || 
    combined.includes('temperatura') || 
    combined.includes('deszcz') || 
    combined.includes('prognoza')
  ) {
    widgets.push('weather');
  }

  if (
    combined.includes('finans') || 
    combined.includes('wydatek') || 
    combined.includes('przychód') || 
    combined.includes('pieniądze') || 
    combined.includes('budżet')
  ) {
    widgets.push('finances');
  }

  if (
    combined.includes('trening') || 
    combined.includes('siłowni') || 
    combined.includes('ćwiczen') || 
    combined.includes('workout')
  ) {
    widgets.push('workouts');
  }

  if (
    combined.includes('kalendarz') || 
    combined.includes('wydarzenie') || 
    combined.includes('spotkanie') || 
    combined.includes('termin')
  ) {
    widgets.push('calendar');
  }

  if (
    combined.includes('system') || 
    combined.includes('metryk') || 
    combined.includes('status') || 
    combined.includes('ram') || 
    combined.includes('cpu')
  ) {
    widgets.push('system');
  }

  if (
    combined.includes('lekcj') || 
    combined.includes('plan lekcji') || 
    combined.includes('zajęcia') || 
    combined.includes('zajęć') || 
    combined.includes('szkoł') || 
    combined.includes('uczelni') || 
    combined.includes('timetable') || 
    combined.includes('harmonogram') || 
    combined.includes('przedmiot')
  ) {
    widgets.push('timetable');
  }

  return Array.from(new Set(widgets));
}

export function isPushRequest(text) {
  if (!text || typeof text !== 'string') return false;
  const t = text.toLowerCase();
  const pushKeywords = [
    'wyślij na telefon', 'wyślij mi na telefon', 'wyślij to na telefon', 'prześlij na telefon',
    'wyślij na tel', 'wyślij mi na tel', 'wyślij to na tel', 'prześlij na tel',
    'wyślij na komórk', 'wyślij mi na komórk', 'prześlij na komórk', 'wyślij na smartfon',
    'na telefon', 'na tel', 'na komórk', 'na smartfon',
    'pushbullet', 'powiadomienie na telefon', 'powiadomienie push', 'wyślij powiadomienie',
    'prześlij powiadomienie', 'testowy push', 'wyślij push', 'test push', 'push na telefon'
  ];
  return pushKeywords.some(kw => t.includes(kw));
}

export function parseActionTags(text) {
  const actions = [];
  if (!text || typeof text !== 'string') return actions;

  // Szukamy początku akcji: [ACTION:NAZWA
  const startRegex = /(?:\*\*|\*|`|\s)*\[(?:\*\*|\*|`|\s)*ACTION\s*:\s*([A-Za-z_]+)\s*/gi;
  let match;

  while ((match = startRegex.exec(text)) !== null) {
    const actionType = match[1].toUpperCase();
    const startIndex = match.index;
    const contentStartIndex = startRegex.lastIndex;

    let depth = 1;
    let inQuote = null;
    let endIndex = -1;

    for (let i = contentStartIndex; i < text.length; i++) {
      const char = text[i];
      const prevChar = i > 0 ? text[i - 1] : '';

      if (inQuote) {
        if (char === inQuote && prevChar !== '\\') {
          const rest = text.slice(i + 1).trimStart();
          if (rest.startsWith(']') || rest.startsWith('**]') || rest.startsWith('*]') || rest.startsWith('`]') || /^[a-zA-Z0-9_]+\s*=/.test(rest)) {
            inQuote = null;
          }
        }
      } else {
        if (char === '"' || char === "'" || char === '„' || char === '«') {
          inQuote = char === '„' ? '”' : (char === '«' ? '»' : char);
        } else if (char === '[') {
          depth++;
        } else if (char === ']') {
          depth--;
          if (depth === 0) {
            endIndex = i;
            break;
          }
        }
      }
    }

    if (endIndex === -1) {
      const fallbackEnd = text.indexOf(']', contentStartIndex);
      endIndex = fallbackEnd !== -1 ? fallbackEnd : text.length;
    }

    const rawAttrs = text.slice(contentStartIndex, endIndex);
    let fullEnd = (endIndex < text.length && text[endIndex] === ']') ? endIndex + 1 : endIndex;
    while (fullEnd < text.length && (text[fullEnd] === '*' || text[fullEnd] === '`' || text[fullEnd] === ' ')) {
      fullEnd++;
    }

    actions.push({
      actionType,
      rawAttrs,
      fullMatchStart: startIndex,
      fullMatchEnd: fullEnd
    });
  }
  return actions;
}

export function parseAttributes(rawAttrs) {
  const attrs = {};
  if (!rawAttrs || typeof rawAttrs !== 'string') return attrs;

  const keyPattern = /(?:^|\s+)([a-zA-Z0-9_]+)\s*=\s*/g;
  const matches = [];
  let m;
  while ((m = keyPattern.exec(rawAttrs)) !== null) {
    matches.push({
      key: m[1],
      valueStart: m.index + m[0].length
    });
  }

  for (let i = 0; i < matches.length; i++) {
    const key = matches[i].key;
    const vStart = matches[i].valueStart;
    const nextMatch = matches[i + 1];
    let vEnd = nextMatch ? (nextMatch.valueStart - (nextMatch.key.length + 1)) : rawAttrs.length;
    let rawVal = rawAttrs.slice(vStart, vEnd).trim();

    if (
      (rawVal.startsWith('"') && rawVal.endsWith('"')) ||
      (rawVal.startsWith("'") && rawVal.endsWith("'")) ||
      (rawVal.startsWith('„') && rawVal.endsWith('”')) ||
      (rawVal.startsWith('«') && rawVal.endsWith('»'))
    ) {
      rawVal = rawVal.slice(1, -1);
    } else if (rawVal.startsWith('"') || rawVal.startsWith("'") || rawVal.startsWith('„') || rawVal.startsWith('«')) {
      rawVal = rawVal.replace(/^["'„«]/, '').replace(/["'”»]$/, '');
    }

    attrs[key] = rawVal;
    attrs[key.toLowerCase()] = rawVal;
  }
  return attrs;
}

export function extractPushDetails(userQuery, aiText, timetable = []) {
  let title = 'OmniDash Powiadomienie';
  const q = (userQuery || '').toLowerCase();
  const isNextLessonQuery = q.includes('następn') || q.includes('kolejn') || q.includes('najbliższ');
  const isLessonQuery = q.includes('lekcj') || q.includes('plan') || q.includes('zajęć') || q.includes('zajęcia');

  if (q.includes('test')) {
    title = 'OmniDash: Test Powiadomień';
  } else if (isNextLessonQuery && isLessonQuery) {
    title = 'OmniDash: Następna lekcja';
  } else if (isLessonQuery) {
    title = 'OmniDash: Plan Lekcji';
  } else if (q.includes('pogod')) {
    title = 'OmniDash: Prognoza Pogody';
  } else if (q.includes('zadani') || q.includes('todo')) {
    title = 'OmniDash: Zadania';
  } else if (q.includes('finans') || q.includes('wydatek')) {
    title = 'OmniDash: Finanse';
  } else if (q.includes('trening')) {
    title = 'OmniDash: Trening';
  }

  let cleanBody = (aiText || '')
    .replace(/(?:\*\*|\*|`|\s)*\[(?:\*\*|\*|`|\s)*ACTION\s*:\s*[A-Za-z_]+[^\]]*\](?:\*\*|\*|`|\s)*/gi, '')
    .trim();

  const lowerBody = cleanBody.toLowerCase();
  if (
    lowerBody.includes('nie ma polecenia') ||
    lowerBody.includes('nie ma dedykowanej') ||
    lowerBody.includes('nie ma w aktualnym zestawie') ||
    lowerBody.includes('brak polecenia') ||
    lowerBody.includes('nie ma funkcji') ||
    lowerBody.includes('nie posiadam możliwości')
  ) {
    cleanBody = '';
  }

  const isBodyBroken = !cleanBody || cleanBody.length < 5 || /^[^a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]*$/.test(cleanBody) || cleanBody.includes('""') || cleanBody.includes('„”');
  if (isLessonQuery && (isBodyBroken || isNextLessonQuery)) {
    let ttList = (Array.isArray(timetable) && timetable.length > 0) ? timetable : [];
    if (ttList.length === 0) {
      try {
        const raw = localStorage.getItem('cloud_cache_timetable');
        if (raw) ttList = JSON.parse(raw);
      } catch {}
    }
    if (!Array.isArray(ttList) || ttList.length === 0) {
      ttList = Array.isArray(INITIAL_FIRESTORE_DATA?.timetable) ? INITIAL_FIRESTORE_DATA.timetable : [];
    }

    if (ttList.length > 0) {
      const ttCtx = getTimetableContext(ttList, new Date());
      if (isNextLessonQuery && ttCtx.nextLessonOverall) {
        cleanBody = ttCtx.formatLessonLine(ttCtx.nextLessonOverall);
      } else if (ttCtx.todayLessons.length > 0) {
        cleanBody = ttCtx.todayLessons.map(l => ttCtx.formatLessonLine(l)).join('\n');
      }
    }
  }

  if (!cleanBody) {
    cleanBody = 'Powiadomienie z systemu OmniDash.';
  }

  const formatted = formatPushText(cleanBody);
  const body = formatted.slice(0, 500).trim() || 'Powiadomienie z systemu OmniDash.';
  return { title, body };
}

export function parseAndExecuteAiActionsWithWidgets(text, userQuery = '') {
  if (!text || typeof text !== 'string') return { cleanedText: text, extraWidgets: [] };

  let cleanedText = text;
  const extraWidgets = [];
  let hadSendPush = false;
  let hadClearTasks = false;
  let hadCompleteAllTasks = false;
  let hadTaskAction = false;

  const actions = parseActionTags(text);

  for (const action of actions) {
    const actionType = action.actionType;
    const attrs = parseAttributes(action.rawAttrs);

    try {
      if (actionType === 'ADD_TASK') {
        const id = 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
        const newTask = {
          id,
          title: attrs.title || 'Nowe zadanie',
          priority: attrs.priority || 'MEDIUM',
          status: 'pending',
          category: attrs.category || 'ogólne',
          created_at: new Date().toISOString()
        };
        saveCloudDocument('tasks', id, newTask);
        window.dispatchEvent(new CustomEvent('cloudDataChanged', { detail: { collection: 'tasks' } }));
        extraWidgets.push('tasks');
        hadTaskAction = true;
      } else if (actionType === 'CLEAR_TASKS' || actionType === 'CLEAR_TODO' || actionType === 'DELETE_ALL_TASKS') {
        clearCloudCollection('tasks');
        extraWidgets.push('tasks');
        hadClearTasks = true;
        hadTaskAction = true;
      } else if (actionType === 'COMPLETE_ALL_TASKS') {
        completeAllCloudTasks();
        extraWidgets.push('tasks');
        hadCompleteAllTasks = true;
        hadTaskAction = true;
      } else if (actionType === 'DELETE_COMPLETED_TASKS' || actionType === 'CLEAR_COMPLETED_TASKS') {
        deleteCompletedCloudTasks();
        extraWidgets.push('tasks');
        hadTaskAction = true;
      } else if (actionType === 'UNCOMPLETE_TASK' || actionType === 'RESET_TASK' || actionType === 'PENDING_TASK') {
        uncompleteCloudTask(attrs.id || attrs.title);
        extraWidgets.push('tasks');
        hadTaskAction = true;
      } else if (actionType === 'COMPLETE_TASK') {
        const rawTitle = (attrs.title || attrs.id || '').trim();
        if (/^(all|wszystko|wszystkie|\*)$/i.test(rawTitle)) {
          completeAllCloudTasks();
          extraWidgets.push('tasks');
          hadCompleteAllTasks = true;
          hadTaskAction = true;
        } else if (attrs.status === 'pending' || attrs.status === 'uncompleted') {
          uncompleteCloudTask(rawTitle);
          extraWidgets.push('tasks');
          hadTaskAction = true;
        } else {
          try {
            const raw = localStorage.getItem('cloud_cache_tasks');
            if (raw) {
              const list = JSON.parse(raw);
              const query = rawTitle.toLowerCase();
              const found = list.find(t => String(t.id).toLowerCase() === query || (t.title && t.title.toLowerCase().includes(query)));
              if (found) {
                const updated = { ...found, status: 'completed', completed_at: new Date().toISOString() };
                saveCloudDocument('tasks', found.id, updated);
                window.dispatchEvent(new CustomEvent('cloudDataChanged', { detail: { collection: 'tasks' } }));
                extraWidgets.push('tasks');
                hadTaskAction = true;
              }
            }
          } catch {}
        }
      } else if (actionType === 'DELETE_TASK') {
        const rawTitle = (attrs.title || attrs.id || '').trim();
        if (/^(all|wszystko|wszystkie|\*)$/i.test(rawTitle)) {
          clearCloudCollection('tasks');
          extraWidgets.push('tasks');
          hadClearTasks = true;
          hadTaskAction = true;
        } else if (attrs.status === 'completed') {
          deleteCompletedCloudTasks();
          extraWidgets.push('tasks');
          hadTaskAction = true;
        } else {
          try {
            const raw = localStorage.getItem('cloud_cache_tasks');
            if (raw) {
              const list = JSON.parse(raw);
              const query = rawTitle.toLowerCase();
              const found = list.find(t => String(t.id).toLowerCase() === query || (t.title && t.title.toLowerCase().includes(query)));
              if (found) {
                deleteCloudDocument('tasks', found.id);
                window.dispatchEvent(new CustomEvent('cloudDataChanged', { detail: { collection: 'tasks' } }));
                extraWidgets.push('tasks');
                hadTaskAction = true;
              }
            }
          } catch {}
        }
      } else if (actionType === 'ADD_LESSON') {
        const id = 't_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
        const newLesson = {
          id,
          day: attrs.day || 'monday',
          subject: attrs.subject || 'Zajęcia',
          time_start: attrs.time_start || '08:00',
          time_end: attrs.time_end || '09:30',
          room: attrs.room || '',
          teacher: attrs.teacher || '',
          type: attrs.type || 'Wykład',
          color: attrs.color || 'indigo',
          created_at: new Date().toISOString()
        };
        saveCloudDocument('timetable', id, newLesson);
        window.dispatchEvent(new CustomEvent('cloudDataChanged', { detail: { collection: 'timetable' } }));
        extraWidgets.push('timetable');
      } else if (actionType === 'DELETE_LESSON') {
        try {
          const raw = localStorage.getItem('cloud_cache_timetable');
          if (raw) {
            const list = JSON.parse(raw);
            const query = (attrs.subject || attrs.id || '').toLowerCase();
            const dayFilter = (attrs.day || '').toLowerCase();
            const found = list.find(l => 
              (l.id === attrs.id || (l.subject && l.subject.toLowerCase().includes(query))) &&
              (!dayFilter || l.day?.toLowerCase() === dayFilter)
            );
            if (found) {
              deleteCloudDocument('timetable', found.id);
              window.dispatchEvent(new CustomEvent('cloudDataChanged', { detail: { collection: 'timetable' } }));
              extraWidgets.push('timetable');
            }
          }
        } catch {}
      } else if (actionType === 'ADD_EXPENSE') {
        const id = 'fin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
        const newExpense = {
          id,
          amount: parseFloat(attrs.amount) || 0,
          category: attrs.category || 'Inne',
          type: 'expense',
          bucket: attrs.bucket || 'needs',
          description: attrs.description || '',
          transaction_date: attrs.date || new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString()
        };
        saveCloudDocument('finances', id, newExpense);
        window.dispatchEvent(new CustomEvent('cloudDataChanged', { detail: { collection: 'finances' } }));
        extraWidgets.push('finances');
      } else if (actionType === 'ADD_INCOME') {
        const id = 'fin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
        const newIncome = {
          id,
          amount: Math.abs(parseFloat(attrs.amount) || 0),
          category: attrs.category || 'Przychód',
          type: 'income',
          bucket: 'savings',
          description: attrs.description || '',
          transaction_date: attrs.date || new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString()
        };
        saveCloudDocument('finances', id, newIncome);
        window.dispatchEvent(new CustomEvent('cloudDataChanged', { detail: { collection: 'finances' } }));
        extraWidgets.push('finances');
      } else if (actionType === 'CLEAR_FINANCES') {
        try {
          const raw = localStorage.getItem('cloud_cache_finances');
          if (raw) {
            const list = JSON.parse(raw);
            list.forEach(f => {
              if (f.id !== 'finance_settings' && !f.is_settings) deleteCloudDocument('finances', f.id);
            });
            window.dispatchEvent(new CustomEvent('cloudDataChanged', { detail: { collection: 'finances' } }));
            extraWidgets.push('finances');
          }
        } catch {}
      } else if (actionType === 'ADD_WORKOUT') {
        const id = 'work_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
        const newWorkout = {
          id,
          title: attrs.title || 'Trening',
          type: attrs.type || 'Siłowy',
          description: attrs.description || '',
          date: attrs.date || new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString()
        };
        saveCloudDocument('workouts', id, newWorkout);
        window.dispatchEvent(new CustomEvent('cloudDataChanged', { detail: { collection: 'workouts' } }));
        extraWidgets.push('workouts');
      } else if (actionType === 'DELETE_WORKOUT') {
        try {
          const raw = localStorage.getItem('cloud_cache_workouts');
          if (raw) {
            const list = JSON.parse(raw);
            const query = (attrs.title || attrs.id || '').toLowerCase();
            const found = list.find(w => w.id === attrs.id || (w.title && w.title.toLowerCase().includes(query)));
            if (found) {
              deleteCloudDocument('workouts', found.id);
              window.dispatchEvent(new CustomEvent('cloudDataChanged', { detail: { collection: 'workouts' } }));
              extraWidgets.push('workouts');
            }
          }
        } catch {}
      } else if (actionType === 'ADD_EVENT') {
        const id = 'cal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
        const newEvent = {
          id,
          title: attrs.title || 'Wydarzenie',
          event_date: attrs.date || new Date().toISOString().split('T')[0],
          event_time: attrs.time || '10:00',
          priority: attrs.priority || 'MEDIUM',
          created_at: new Date().toISOString()
        };
        saveCloudDocument('calendar', id, newEvent);
        window.dispatchEvent(new CustomEvent('cloudDataChanged', { detail: { collection: 'calendar' } }));
        extraWidgets.push('calendar');
      } else if (actionType === 'DELETE_EVENT') {
        try {
          const raw = localStorage.getItem('cloud_cache_calendar');
          if (raw) {
            const list = JSON.parse(raw);
            const query = (attrs.title || attrs.id || '').toLowerCase();
            const found = list.find(e => e.id === attrs.id || (e.title && e.title.toLowerCase().includes(query)));
            if (found) {
              deleteCloudDocument('calendar', found.id);
              window.dispatchEvent(new CustomEvent('cloudDataChanged', { detail: { collection: 'calendar' } }));
              extraWidgets.push('calendar');
            }
          }
        } catch {}
      } else if (actionType === 'SET_THEME') {
        const themeId = attrs.theme;
        if (themeId) {
          localStorage.setItem('system_theme', themeId);
          document.documentElement.classList.toggle('theme-light', themeId === 'light' || themeId.includes('light'));
          window.dispatchEvent(new CustomEvent('themeChanged', { detail: themeId }));
        }
      } else if (actionType === 'SET_ACCENT') {
        const color = attrs.color;
        if (color) {
          localStorage.setItem('system_accent_color', color);
          window.dispatchEvent(new CustomEvent('accentChanged', { detail: color }));
        }
      } else if (actionType === 'REMEMBER') {
        const id = 'brain_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
        const newBrain = {
          id,
          fact: attrs.fact || attrs.content || '',
          category: attrs.category || 'Wiedza',
          created_at: new Date().toISOString()
        };
        saveCloudDocument('operator_brain', id, newBrain);
        window.dispatchEvent(new CustomEvent('cloudDataChanged', { detail: { collection: 'operator_brain' } }));
      } else if (actionType === 'FORGET') {
        try {
          const raw = localStorage.getItem('cloud_cache_operator_brain');
          if (raw) {
            const list = JSON.parse(raw);
            const query = (attrs.fact || attrs.id || '').toLowerCase();
            const found = list.find(b => b.id === attrs.id || (b.fact && b.fact.toLowerCase().includes(query)));
            if (found) {
              deleteCloudDocument('operator_brain', found.id);
              window.dispatchEvent(new CustomEvent('cloudDataChanged', { detail: { collection: 'operator_brain' } }));
            }
          }
        } catch {}
      } else if (actionType === 'SHOW_WIDGET') {
        if (attrs.name) extraWidgets.push(attrs.name.toLowerCase());
      } else if (actionType === 'SEND_PUSH') {
        hadSendPush = true;
        let title = attrs.title || 'OmniDash System';
        let body = attrs.body || '';

        const isBodyBroken = !body || body.length < 5 || /^[^a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]*$/.test(body) || body.includes('""') || body.includes('„”');
        if (isBodyBroken) {
          let ttList = [];
          try {
            const raw = localStorage.getItem('cloud_cache_timetable');
            if (raw) ttList = JSON.parse(raw);
          } catch {}
          if (!Array.isArray(ttList) || ttList.length === 0) {
            ttList = Array.isArray(INITIAL_FIRESTORE_DATA?.timetable) ? INITIAL_FIRESTORE_DATA.timetable : [];
          }
          if (ttList.length > 0) {
            const ttCtx = getTimetableContext(ttList, new Date());
            const q = (userQuery || '').toLowerCase();
            const isNextLessonQuery = q.includes('następn') || q.includes('kolejn') || q.includes('najbliższ') || (title || '').toLowerCase().includes('następn');
            if (isNextLessonQuery && ttCtx.nextLessonOverall) {
              body = ttCtx.formatLessonLine(ttCtx.nextLessonOverall);
              title = 'OmniDash: Następna lekcja';
            } else if (ttCtx.todayLessons.length > 0) {
              body = ttCtx.todayLessons.map(l => ttCtx.formatLessonLine(l)).join('\n');
              title = 'OmniDash: Plan Lekcji';
            }
          }
        }

        if (body) {
          sendPushNotificationClient(title, body).catch(err => {
            console.warn('[AiDispatcher] Błąd asynchronicznej wysyłki Push:', err);
          });
        }
      } else if (actionType === 'NAVIGATE') {
        if (attrs.path) {
          window.dispatchEvent(new CustomEvent('navigateRequested', { detail: attrs.path }));
        }
      }
    } catch (actErr) {
      console.warn('[AiDispatcher] Błąd wykonania akcji:', actionType, actErr);
    }
  }

  // Precyzyjne usuwanie znaczników akcji z tekstu za pomocą indeksów parsera
  if (actions.length > 0) {
    const sorted = [...actions].sort((a, b) => b.fullMatchStart - a.fullMatchStart);
    for (const a of sorted) {
      cleanedText = cleanedText.slice(0, a.fullMatchStart) + cleanedText.slice(a.fullMatchEnd);
    }
  }

  // Usuń ewentualne halucynowane sekcje poradnikowe (np. "Co zrobić z tymi informacjami? Skopiuj tabelę...")
  cleanedText = cleanedText.replace(/(?:---|___|\*\*\*|\n|^)\s*#{2,4}\s*Co zrobić z tymi informacjami\??[\s\S]*?(?=(?:\[ACTION:|$))/gi, '');
  cleanedText = cleanedText.replace(/[-*]\s*Skopiuj powyższ[a-zęóąśłżźćń\s]+i wyślij ją do siebie[^\n]*/gi, '');

  // Jeśli użytkownik prosił o wysyłkę na telefon, a w odpowiedzi nie było znacznika SEND_PUSH - wyślij automatycznie
  if (!hadSendPush && isPushRequest(userQuery)) {
    const { title, body } = extractPushDetails(userQuery, cleanedText);
    if (body) {
      sendPushNotificationClient(title, body).catch(err => {
        console.warn('[AiDispatcher] Błąd asynchronicznej wysyłki Push fallback:', err);
      });

      const lowerCleaned = cleanedText.toLowerCase();
      if (
        lowerCleaned.includes('nie ma polecenia') ||
        lowerCleaned.includes('nie ma dedykowanej funkcji') ||
        lowerCleaned.includes('nie ma w zestawie') ||
        lowerCleaned.includes('nie ma w aktualnym zestawie') ||
        lowerCleaned.includes('nie posiadam możliwości') ||
        lowerCleaned.includes('brak akcji')
      ) {
        cleanedText = `📱 **Wysłano powiadomienie Push na Twój telefon.**\n\n- **Tytuł:** ${title}\n- **Treść:** ${body}`;
      } else {
        cleanedText = `${cleanedText}\n\n📱 *(Powiadomienie Push zostało przesłane na Twój telefon: "${title}")*`;
      }
    }
  }

  // Kognitywny filtr intencji (Autonomous Fallback) dla operacji czyszczenia i masowych zadań To-Do
  const lowerUser = (userQuery || '').toLowerCase();
  const lowerAi = (cleanedText || '').toLowerCase();

  const isClearTasksIntent = 
    /(wyczyść|usuń wszystko|usuń całą|skasuj wszystko|wyczyść bazę|wyczyść listę|skasuj bazę|usuń zadania).*(to-?do|zadań|zadania|pipeline|tudu)/i.test(lowerUser) ||
    /^(wyczyść|skasuj|usuń wszystko z|usuń wszystko)\s+(to-?do|zadań|zadania|tudu)$/i.test(lowerUser) ||
    /lista to-?do została wyczyszczona/i.test(lowerAi) ||
    /baza danych z listą to-?do została wyczyszczona/i.test(lowerAi) ||
    /wszystkie pozycje z listy to-?do zostały usunięte/i.test(lowerAi);

  if (!hadClearTasks && isClearTasksIntent) {
    clearCloudCollection('tasks');
    extraWidgets.push('tasks');
    hadClearTasks = true;
  }

  const isCompleteAllIntent = 
    /(zaznacz|oznacz|ustaw).*(wszystkie|wszystko).*(jako wykonane|jako zrobione|wykonałem)/i.test(lowerUser) ||
    /(oznacz|zaznacz)\s+(wszystkie zadania|wszystko)\s+(na liście|w to-?do|w tudu)/i.test(lowerUser) ||
    /zaktualizowana lista to-?do[\s\S]*wykonane/i.test(lowerAi) ||
    /wszystkie zadania.*zostały (oznaczone|zaznaczone) jako wykonane/i.test(lowerAi);

  if (!hadCompleteAllTasks && !hadClearTasks && isCompleteAllIntent) {
    completeAllCloudTasks();
    extraWidgets.push('tasks');
    hadCompleteAllTasks = true;
  }

  // Oczyść pozostałe znaczniki akcji z tekstu użytkownika (w tym otoczone przez **, * lub `)
  return { cleanedText, extraWidgets };
}

export function parseAndExecuteAiActions(text, userQuery = '') {
  const res = parseAndExecuteAiActionsWithWidgets(text, userQuery);
  return res.cleanedText;
}

export const dispatchAiQuery = async ({ text, mode = 'worker', userName = 'Użytkownik', language = 'pl' }) => {
  const groqKey = typeof window !== 'undefined'
    ? (localStorage.getItem('system_groq_api_key') || 
       localStorage.getItem('system_api_key') || 
       import.meta.env.VITE_GROQ_API_KEY)
    : (process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY);

  const context = getClientContextSummary();

  // 1. Priorytet: Bezpośrednie zapytanie Groq API z poziomu przeglądarki (Direct Browser CORS)
  // Zapewnia natychmiastowe wykonanie, brak zależności od zewnętrznych deploymentów i pełną synchronizację ze znacznikami akcji ([ACTION:SEND_PUSH])
  if (groqKey && groqKey !== 'unconfigured_key' && groqKey.startsWith('gsk_')) {
    try {
      const tasksSummary = context.tasks.length > 0
        ? context.tasks.map(t => `- [${t.status === 'completed' ? 'WYKONANE' : 'OCZEKUJĄCE'}] [Priorytet: ${t.priority || 'MED'}] ${t.title} (${t.category || 'ogólne'})`).join('\n')
        : 'Brak zadań na liście.';

      const calendarSummary = context.calendar.length > 0
        ? context.calendar.map(e => `- [${e.event_date || e.date || 'brak daty'}] ${e.title}`).join('\n')
        : 'Brak zaplanowanych wydarzeń.';

      let totalIncome = 0;
      let totalExpenses = 0;
      let needsSum = 0;
      let wantsSum = 0;
      let savingsSum = 0;
      const settingsDoc = (context.finances || []).find(f => f && (f.id === 'finance_settings' || f.is_settings));
      const targetNeeds = settingsDoc?.needs_percent !== undefined && !isNaN(Number(settingsDoc.needs_percent)) ? Number(settingsDoc.needs_percent) : 50;
      const targetWants = settingsDoc?.wants_percent !== undefined && !isNaN(Number(settingsDoc.wants_percent)) ? Number(settingsDoc.wants_percent) : 30;
      const targetSavings = settingsDoc?.savings_percent !== undefined && !isNaN(Number(settingsDoc.savings_percent)) ? Number(settingsDoc.savings_percent) : 20;

      const actualTxs = (context.finances || []).filter(f => f && !f.is_settings && f.id !== 'finance_settings' && f.amount !== undefined);
      actualTxs.forEach(f => {
        const amt = Number(f.amount) || 0;
        if (f.type === 'income') totalIncome += amt;
        else {
          totalExpenses += amt;
          const b = (f.bucket || '').toLowerCase();
          if (b === 'wants' || b === 'zachcianki') wantsSum += amt;
          else if (b === 'savings' || b === 'oszczędności') savingsSum += amt;
          else needsSum += amt;
        }
      });
      const netBalance = totalIncome - totalExpenses;
      const needsPct = totalExpenses > 0 ? Math.round((needsSum / totalExpenses) * 100) : 0;
      const wantsPct = totalExpenses > 0 ? Math.round((wantsSum / totalExpenses) * 100) : 0;
      const savingsPct = totalExpenses > 0 ? Math.round((savingsSum / totalExpenses) * 100) : 0;

      const financesSummary = actualTxs.length > 0
        ? `Saldo konta: ${netBalance >= 0 ? '+' : ''}${netBalance.toFixed(2)} PLN | Przychody: +${totalIncome.toFixed(2)} PLN | Wydatki: -${totalExpenses.toFixed(2)} PLN
Podział ${targetNeeds}/${targetWants}/${targetSavings}: Potrzeby ${needsSum.toFixed(2)} PLN (${needsPct}%), Zachcianki ${wantsSum.toFixed(2)} PLN (${wantsPct}%), Oszczędności ${savingsSum.toFixed(2)} PLN (${savingsPct}%)
Ostatnie transakcje: ` + actualTxs.slice(0, 10).map(f => `${f.type === 'income' ? '+' : '-'}${f.amount} PLN (${f.category || 'Inne'})`).join(', ')
        : 'Brak transakcji w bazie. Saldo: 0.00 PLN.';

      const ttCtx = getTimetableContext(context.timetable, new Date());
      const todayPlanFormatted = ttCtx.todayLessons.length > 0
        ? ttCtx.todayLessons.map(l => ttCtx.formatLessonLine(l)).join('\n')
        : '• Brak zaplanowanych lekcji na dziś.';
      const tomorrowPlanFormatted = ttCtx.tomorrowLessons.length > 0
        ? ttCtx.tomorrowLessons.map(l => ttCtx.formatLessonLine(l)).join('\n')
        : '• Brak zaplanowanych lekcji na jutro.';

      const timetableFullSummary = `📅 DZIŚ JEST: ${ttCtx.todayDayName.toUpperCase()} (${ttCtx.todayDayId}), ${context.dateStr}, godzina ${context.timeStr}.
📍 AKTUALNA TRWAJĄCA LEKCJA: ${ttCtx.currentLessonFormatted}
🎯 NAJBLIŻSZA NASTĘPNA LEKCJA: ${ttCtx.nextLessonFormatted}

PLAN NA DZIŚ (${ttCtx.todayDayName.toUpperCase()}):
${todayPlanFormatted}

PLAN NA JUTRO (${ttCtx.tomorrowDayName.toUpperCase()}):
${tomorrowPlanFormatted}

WSZYSTKIE POZOSTAŁE LEKCJE W TYGODNIU:
` + ((context.timetable || []).length > 0
        ? context.timetable.map(l => {
            const cleanSubj = cleanSubjectName(l.subject);
            const roomPart = l.room ? `[${l.room}]` : '';
            const teacherPart = l.teacher ? `(${l.teacher})` : '';
            return `- [${(l.day || '').toUpperCase()}] ${l.time_start || ''}-${l.time_end || ''} ${roomPart} ${cleanSubj} ${teacherPart}`.trim();
          }).join('\n')
        : 'Brak wpisów w planie lekcji.');

      const workoutsSummary = (context.workouts || []).length > 0
        ? `Zarejestrowano ${context.workouts.length} treningów. Ostatnie: ` + context.workouts.slice(0, 5).map(w => `[${w.date || 'b/d'}] ${w.title} (${w.type || 'Siłowy'})`).join(', ')
        : 'Brak sesji treningowych.';

      const systemPrompt = mode === 'mentor'
        ? `Jesteś OMNI MIND — inteligentnym mentorem i analitykiem w systemie OmniDash. Rozmawiasz z ${userName}.
Aktualny czas systemowy (Polska / Warszawa): ${context.dateStr}, godzina ${context.timeStr}.
PAMIĘTAJ: Aktualna data i dokładna godzina użytkownika to ${context.dateStr}, godzina ${context.timeStr}. Jeśli użytkownik pyta o czas lub godzinę, ZAWSZE podawaj dokładnie tę godzinę.

🚨 KRYTYCZNA REGUŁA OPERACYJNA — WYSYŁANIE NA TELEFON (PUSHBULLET API):
Gdy użytkownik w jakikolwiek sposób wspomni o wysłaniu na telefon, powiadomieniu lub Pushbullet (np. „wyślij na telefon”, „wyślij mi to”, „przypomnij na telefonie”, „wyślij powiadomienie”, „chcę to na komórce”, „pushbullet”):
1. PRZEANALIZUJ PYTANIE UŻYTKOWNIKA ORAZ POTRZEBNE DANE Z BAZY (np. następna lekcja, plan lekcji, pogoda, zadania, finanse).
   - Jeśli użytkownik pyta o następną/najbliższą lekcję, ZAWSZE podawaj dane z: 🎯 NAJBLIŻSZA NASTĘPNA LEKCJA: ${ttCtx.nextLessonFormatted}.
2. W treści odpowiedzi zwięźle potwierdź, że wysyłasz powiadomienie na telefon.
3. BEZWZGLĘDNIE, ZAWSZE I BEZ WYJĄTKU na samym końcu odpowiedzi wyemituj znacznik:
   [ACTION:SEND_PUSH title="Zwięzły Tytuł" body="Treść wiadomości wysyłana na telefon"]
4. BEZWZGLĘDNY ZAKAZ mówienia, że nie masz połączenia z Pushbullet, że nie masz dostępu do telefonu lub że użytkownik musi to sam konfigurować.
5. BEZWZGLĘDNY ZAKAZ sugerowania ręcznego kopiowania tekstu („skopiuj powyższą tabelę”)! PO PROSTU ANALIZUJ I WYSYŁAJ!
6. FORMATOWANIE TREŚCI POWIADOMIENIA NA SMARTFON:
   - Tytuł (title): Krótki i czytelny (np. "Plan lekcji: Wtorek", "Następna lekcja").
   - Treść (body): Czytelna lista z punktorem "• " i formatem: • Godzina [Sala] Przedmiot (Nauczyciel). Każda pozycja w nowej linii, np:
     • 08:00 - 08:45 [Sala 1.16] Pracownia UTK (PW)
     • 08:50 - 09:35 [Sala 1.16] Pracownia UTK (PW)
     • 09:40 - 10:25 [Sala 1.16] Godz. wychowawcza (ZJ)
     • 10:40 - 11:25 [Hala] WF (GŁ)
   - BEZWZGLĘDNY ZAKAZ wklejania tabel Markdown (|---|) do parametru body! Tabel używaj w odpowiedzi tekstowej, a do body daj listę wypunktowaną.

Zasady: Posiadasz bezpośredni dostęp do internetu, bazy danych oraz smartfona użytkownika przez Pushbullet API. Odpowiadaj wyczerpująco, logicznie i wspierająco w języku ${language}.
BEZWZGLĘDNY ZAKAZ sugerowania użytkownikowi ręcznego kopiowania danych lub wysyłania sobie wiadomości/SMS („skopiuj powyższą tabelę i wyślij do siebie...”). Jeśli dane mają trafić na telefon lub użytkownik chce powiadomienia, wyemituj [ACTION:SEND_PUSH title="..." body="..."]. Nigdy nie twórz sekcji „Co zrobić z tymi informacjami?”. Lekcje są w bazie Timetable, nie proponuj dodawania ich do kalendarza.
Gdy przedstawiasz tabele danych, pogodę, finanse czy harmonogramy, ZAWSZE używaj czytelnych tabel Markdown (| Kolumna | ... |).

DOSTĘPNE ZNACZNIKI AKCJI ZARZĄDZANIA ZADANIAMI (TO-DO):
- [ACTION:ADD_TASK title="Nazwa zadania" priority="HIGH|MEDIUM|LOW" category="kategoria"]
- [ACTION:COMPLETE_TASK title="Nazwa zadania"]
- [ACTION:UNCOMPLETE_TASK title="Nazwa zadania"]
- [ACTION:DELETE_TASK title="Nazwa zadania"]
- [ACTION:CLEAR_TASKS] (usuwa WSZYSTKIE zadania i czyści listę To-Do)
- [ACTION:COMPLETE_ALL_TASKS] (oznacza WSZYSTKIE zadania jako wykonane)
- [ACTION:DELETE_COMPLETED_TASKS] (usuwa wyłącznie wykonane zadania)
KRYTYCZNA ZASADA TO-DO: Jeśli użytkownik prosi o usunięcie zadań, wyczyszczenie listy To-Do lub zmianę stanu zadań, ZAWSZE wyemituj na samym końcu właściwy znacznik akcji. BEZWZGLĘDNY ZAKAZ deklarowania w treści, że zadania zostały usunięte lub zaktualizowane, jeśli nie dołączyłeś odpowiedniego znacznika akcji!

Inne akcje systemowe: [ACTION:ADD_LESSON ...], [ACTION:ADD_EXPENSE ...], [ACTION:ADD_INCOME ...], [ACTION:ADD_WORKOUT ...], [ACTION:ADD_EVENT ...], [ACTION:SEND_PUSH ...], [ACTION:SET_THEME ...], [ACTION:SET_ACCENT ...], [ACTION:REMEMBER ...].

Zadania w To-Do:
${tasksSummary}
Plan Lekcji:
${timetableFullSummary}
Finanse i Budżet 50/30/20:
${financesSummary}
Treningi:
${workoutsSummary}
Kalendarz:
${calendarSummary}`
        : `Jesteś OMNI EXEC — wysoko wyspecjalizowanym inżynieryjnym systemem wykonawczym (Core Worker Engine) w OmniDash. Rozmawiasz z ${userName}.
Aktualny czas systemowy (Polska / Warszawa): ${context.dateStr}, godzina ${context.timeStr}.
PAMIĘTAJ: Aktualna data i dokładna godzina użytkownika to ${context.dateStr}, godzina ${context.timeStr}. Jeśli użytkownik pyta o czas lub godzinę, ZAWSZE podawaj dokładnie tę godzinę.

🚨 KRYTYCZNA REGUŁA OPERACYJNA — WYSYŁANIE NA TELEFON (PUSHBULLET API):
Gdy użytkownik w jakikolwiek sposób wspomni o wysłaniu na telefon, powiadomieniu, przesłaniu na smartfon itp. (np. „wyślij na telefon”, „wyślij mi to”, „przypomnij na telefonie”, „wyślij powiadomienie”, „chcę to na komórce”, „pushbullet”):
1. PRZEANALIZUJ PYTANIE UŻYTKOWNIKA ORAZ POTRZEBNE DANE Z BAZY (np. następna lekcja, plan lekcji, pogoda, zadania, finanse).
   - Jeśli użytkownik pyta o następną/najbliższą lekcję, ZAWSZE podawaj dane z: 🎯 NAJBLIŻSZA NASTĘPNA LEKCJA: ${ttCtx.nextLessonFormatted}.
2. W treści odpowiedzi zwięźle potwierdź, że wysyłasz powiadomienie na telefon.
3. BEZWZGLĘDNIE, ZAWSZE I BEZ WYJĄTKU na samym końcu odpowiedzi wyemituj znacznik:
   [ACTION:SEND_PUSH title="Zwięzły Tytuł" body="Treść wiadomości wysyłana na telefon"]
4. BEZWZGLĘDNY ZAKAZ mówienia, że nie masz połączenia z Pushbullet, że nie masz dostępu do telefonu lub że użytkownik musi to sam konfigurować.
5. BEZWZGLĘDNY ZAKAZ sugerowania ręcznego kopiowania tekstu („skopiuj powyższą tabelę”)! PO PROSTU ANALIZUJ I WYSYŁAJ!
6. FORMATOWANIE TREŚCI POWIADOMIENIA NA SMARTFON:
   - Tytuł (title): Krótki i czytelny (np. "Plan lekcji: Wtorek", "Następna lekcja").
   - Treść (body): Czytelna lista z punktorem "• " i formatem: • Godzina [Sala] Przedmiot (Nauczyciel). Każda pozycja w nowej linii, np:
     • 08:00 - 08:45 [Sala 1.16] Pracownia UTK (PW)
     • 08:50 - 09:35 [Sala 1.16] Pracownia UTK (PW)
     • 09:40 - 10:25 [Sala 1.16] Godz. wychowawcza (ZJ)
     • 10:40 - 11:25 [Hala] WF (GŁ)
   - BEZWZGLĘDNY ZAKAZ wklejania tabel Markdown (|---|) do parametru body! Tabel używaj w odpowiedzi tekstowej, a do body daj listę wypunktowaną.

Zasady: Posiadasz bezpośredni dostęp do internetu, bazy danych oraz smartfona użytkownika przez Pushbullet API. Odpowiadaj konkretnie, merytorycznie i technicznie w języku ${language}.
BEZWZGLĘDNY ZAKAZ sugerowania użytkownikowi ręcznego kopiowania danych lub wysyłania sobie wiadomości/SMS („skopiuj powyższą tabelę i wyślij do siebie...”). Jeśli dane mają trafić na telefon lub użytkownik chce powiadomienia, wyemituj [ACTION:SEND_PUSH title="..." body="..."]. Nigdy nie twórz sekcji „Co zrobić z tymi informacjami?”. Lekcje są w bazie Timetable, nie proponuj dodawania ich do kalendarza.
Gdy przedstawiasz tabele danych, pogodę, finanse czy harmonogramy, ZAWSZE używaj czytelnych tabel Markdown (| Kolumna | ... |).

DOSTĘPNE ZNACZNIKI AKCJI ZARZĄDZANIA ZADANIAMI (TO-DO):
- [ACTION:ADD_TASK title="Nazwa zadania" priority="HIGH|MEDIUM|LOW" category="kategoria"]
- [ACTION:COMPLETE_TASK title="Nazwa zadania"]
- [ACTION:UNCOMPLETE_TASK title="Nazwa zadania"]
- [ACTION:DELETE_TASK title="Nazwa zadania"]
- [ACTION:CLEAR_TASKS] (usuwa WSZYSTKIE zadania i czyści listę To-Do)
- [ACTION:COMPLETE_ALL_TASKS] (oznacza WSZYSTKIE zadania jako wykonane)
- [ACTION:DELETE_COMPLETED_TASKS] (usuwa wyłącznie wykonane zadania)
KRYTYCZNA ZASADA TO-DO: Jeśli użytkownik prosi o usunięcie zadań, wyczyszczenie listy To-Do lub zmianę stanu zadań, ZAWSZE wyemituj na samym końcu właściwy znacznik akcji. BEZWZGLĘDNY ZAKAZ deklarowania w treści, że zadania zostały usunięte lub zaktualizowane, jeśli nie dołączyłeś odpowiedniego znacznika akcji!

Inne akcje systemowe: [ACTION:ADD_LESSON ...], [ACTION:ADD_EXPENSE ...], [ACTION:ADD_INCOME ...], [ACTION:ADD_WORKOUT ...], [ACTION:ADD_EVENT ...], [ACTION:SEND_PUSH ...], [ACTION:SET_THEME ...], [ACTION:SET_ACCENT ...], [ACTION:REMEMBER ...].

Zadania w To-Do:
${tasksSummary}
Plan Lekcji:
${timetableFullSummary}
Finanse i Budżet 50/30/20:
${financesSummary}
Treningi:
${workoutsSummary}
Kalendarz:
${calendarSummary}`;

      const activeModel = (typeof localStorage !== 'undefined' && localStorage.getItem('system_active_model')) || 'openai/gpt-oss-120b';

      const response = await fetch(GROQ_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: activeModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text }
          ],
          temperature: mode === 'mentor' ? 0.7 : 0.3,
          max_tokens: 3000
        })
      });

      if (response.ok) {
        const resData = await response.json();
        const rawContent = resData.choices?.[0]?.message?.content || 'Brak odpowiedzi od modelu.';
        const { cleanedText: content, extraWidgets } = parseAndExecuteAiActionsWithWidgets(rawContent, text);
        const thoughts = mode === 'mentor' ? `Analiza kognitywna (${activeModel}): przetworzono zadania i kontekst operacyjny.` : null;
        const widgets = Array.from(new Set([...extraWidgets, ...determineWidgets(text, rawContent)]));

        return {
          content,
          mentor_thoughts: thoughts,
          widgets,
          source: 'cloud_groq'
        };
      } else {
        console.warn('[AiDispatcher] Groq API zwrócił błąd HTTP:', response.status);
      }
    } catch (groqErr) {
      console.warn('[AiDispatcher] Bezpośrednie zapytanie Groq nie powiodło się:', groqErr.message);
    }
  }

  // 2. Jeśli jesteśmy lokalnie (Desktop), spróbuj lokalnego backendu Express
  if (!isCloudMode) {
    try {
      const { data } = await axios.post('/api/agent', {
        text,
        mode,
        userName,
        language
      }, { timeout: 15000 });

      if (data && (data.agent_response || data.payload)) {
        const rawContent = data.agent_response || (data.payload?.agent_response || data.payload?.title || JSON.stringify(data.payload));
        const { cleanedText: content, extraWidgets } = parseAndExecuteAiActionsWithWidgets(rawContent, text);
        const backendWidgets = data.widgets || (data.widget ? [data.widget] : []);
        const mergedWidgets = Array.from(new Set([...backendWidgets, ...extraWidgets, ...determineWidgets(text, rawContent)]));

        return {
          content,
          mentor_thoughts: data.mentor_thoughts || null,
          widgets: mergedWidgets,
          source: 'local_backend'
        };
      }
    } catch (backendErr) {
      console.warn('[AiDispatcher] Backend lokalny niedostępny:', backendErr.message);
    }
  }

  // 3. Fallback: Dedykowany Gateway Vercel Serverless (model openai/gpt-oss-120b)
  try {
    const payload = {
      text,
      mode,
      userName,
      language,
      context: {
        tasks: context.tasks,
        calendar: context.calendar,
        finances: context.finances,
        workouts: context.workouts,
        operatorBrain: context.operatorBrain,
        timetable: context.timetable
      },
      clientTimestamp: Date.now(),
      clientTimeStr: context.timeStr,
      clientDateStr: context.dateStr,
      timeZone: 'Europe/Warsaw',
      customApiKey: groqKey && groqKey.startsWith('gsk_') ? groqKey : undefined,
      model: (typeof localStorage !== 'undefined' && localStorage.getItem('system_active_model')) || 'openai/gpt-oss-120b'
    };

    const vercelRes = await axios.post(VERCEL_AGENT_ENDPOINT, payload, {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' }
    });

    if (vercelRes.data && vercelRes.data.agent_response) {
      const rawContent = vercelRes.data.agent_response;
      const { cleanedText: content, extraWidgets } = parseAndExecuteAiActionsWithWidgets(rawContent, text);
      const backendWidgets = vercelRes.data.widgets || [];
      const mergedWidgets = Array.from(new Set([...backendWidgets, ...extraWidgets, ...determineWidgets(text, rawContent)]));

      return {
        content,
        mentor_thoughts: vercelRes.data.mentor_thoughts || null,
        widgets: mergedWidgets,
        source: 'vercel_serverless'
      };
    }
  } catch (vercelErr) {
    console.warn('[AiDispatcher] Vercel Gateway niedostępny lub timeout:', vercelErr.message);
  }

  // 4. Wbudowany inteligentny asystent autonomiczny (Gdy brak sieci / błąd API)
  return handleAutonomousFallback(text, mode, userName, context);
};

function handleAutonomousFallback(text, mode, userName, context = getClientContextSummary()) {
  const lower = text.toLowerCase().trim();
  const { pendingTasks, completedTasks } = context;

  // Obsługa żądania wysyłki na telefon przez Pushbullet
  if (isPushRequest(text)) {
    const { title, body } = extractPushDetails(text, text);
    sendPushNotificationClient(title, body).catch(err => {
      console.warn('[AiDispatcher] Błąd asynchronicznej wysyłki Push:', err);
    });

    return {
      content: `📱 **Zainicjowano wysyłkę powiadomienia Push na Twój telefon.**\n\n- **Tytuł:** ${title}\n- **Treść:** ${body}\n\n*Jeśli powiadomienie nie dotrze, upewnij się, że klucz Pushbullet API jest skonfigurowany w Ustawienia -> Zabezpieczenia.*`,
      mentor_thoughts: `Przekazano bezpośrednie powiadomienie na telefon operatora: "${title}".`,
      widgets: []
    };
  }

  // Obsługa dodawania zadania w języku naturalnym
  if (
    lower.startsWith('dodaj zadanie') || 
    lower.startsWith('nowe zadanie') || 
    lower.startsWith('dodaj do todo') ||
    lower.startsWith('zapisz zadanie')
  ) {
    let taskTitle = text
      .replace(/^dodaj\s+(?:do\s+todo|zadanie)[:\s]*/i, '')
      .replace(/^nowe\s+zadanie[:\s]*/i, '')
      .replace(/^zapisz\s+zadanie[:\s]*/i, '')
      .trim();

    if (taskTitle) {
      let priority = 'MEDIUM';
      if (taskTitle.toLowerCase().includes('pilne') || taskTitle.toLowerCase().includes('ważne') || taskTitle.toLowerCase().includes('high')) {
        priority = 'HIGH';
        taskTitle = taskTitle.replace(/\s*(pilne|ważne|high)\s*/gi, ' ').trim();
      }

      const newTask = {
        id: Date.now().toString(),
        title: taskTitle,
        status: 'pending',
        priority,
        category: 'jednorazowe',
        created_at: new Date().toISOString()
      };

      saveCloudDocument('tasks', newTask.id, newTask);

      return {
        content: `[+] **Pomyślnie dodano zadanie do To-Do:**\n\n- ${priority === 'HIGH' ? '🔴' : '🟡'} **${taskTitle}** (Priorytet: ${priority})\n\nZadanie zostało natychmiast zapisane w bazie Firestore i wyświetlone w poniższym widżecie:`,
        mentor_thoughts: `Zarejestrowano zadanie "${taskTitle}" o priorytecie ${priority}.`,
        widgets: ['tasks']
      };
    }
  }

  // Obsługa zapytań o zadania / todo / plany
  if (
    lower.includes('todo') || 
    lower.includes('zadania') || 
    lower.includes('zadań') || 
    lower.includes('co mamy') || 
    lower.includes('co mam') || 
    lower.includes('plany') || 
    lower.includes('obowiązki')
  ) {
    let content = '';

    if (pendingTasks.length === 0 && completedTasks.length === 0) {
      content = `### 📋 Lista To-Do na dziś\n\nNie masz obecnie żadnych zadań na liście. Możesz dodać nowe zadanie wpisując polecenie (np. *"dodaj zadanie: Przygotować raport"*) lub korzystając z widżetu poniżej:`;
    } else if (pendingTasks.length === 0) {
      content = `### 📋 Wszystkie zadania na dziś ukończone! 🎉\n\nAktualnie nie masz żadnych zaległych zadań. Wszystkie **${completedTasks.length}** pozycje zostały zrealizowane:\n\n` +
        completedTasks.map(t => `- ✅ ~~${t.title}~~`).join('\n') +
        `\n\nMożesz zrelaksować się lub zaplanować nowe cele poniżej:`;
    } else {
      content = `### 📋 Zadania w systemie To-Do na dziś (${context.dateStr}):\n\n` +
        `**Oczekujące na wykonanie (${pendingTasks.length}):**\n` +
        pendingTasks.map(t => {
          const badge = t.priority === 'HIGH' ? '🔴 **[HIGH]**' : (t.priority === 'MEDIUM' ? '🟡 **[MED]**' : '⚪ **[LOW]**');
          return `- ${badge} **${t.title}**${t.category ? ` *(${t.category})*` : ''}`;
        }).join('\n');

      if (completedTasks.length > 0) {
        content += `\n\n**Ostatnio wykonane (${completedTasks.length}):**\n` +
          completedTasks.slice(0, 5).map(t => `- ✅ ~~${t.title}~~`).join('\n');
      }

      content += `\n\n*Poniżej masz bezpośredni dostęp do interaktywnego widżetu To-Do — możesz natychmiast oznaczyć wykonanie lub dodać nowe pozycje:*`;
    }

    return {
      content,
      mentor_thoughts: `Przeanalizowano listę To-Do: ${pendingTasks.length} oczekujących, ${completedTasks.length} wykonanych.`,
      widgets: ['tasks']
    };
  }

  // Obsługa wiadomości / news / wydarzeń
  if (lower.includes('news') || lower.includes('wiadomoś') || lower.includes('wydarzen') || lower.includes('aktualnoś') || lower.includes('świat')) {
    return {
      content: `### 📰 Aktualne Wydarzenia & Wiadomości IT (Brave Search Live Intel)\n\nPoniżej znajduje się najnowszy kanał depesz informacyjnych IT Intel Feed powiązany z silnikiem Brave Search:\n\n- Możesz przeglądać najświeższe artykuły bezpośrednio w widżecie poniżej.\n- Jeśli chcesz wyszukać konkretny temat ze świata, wpisz polecenie np. *"znajdź [temat]"*.`,
      mentor_thoughts: 'Odpytano moduł wiadomości i wyszukiwania Brave Search.',
      widgets: ['news']
    };
  }

  // Obsługa pogody
  if (lower.includes('pogod') || lower.includes('temperatura') || lower.includes('deszcz') || lower.includes('zimno') || lower.includes('ciepło')) {
    return {
      content: `### ⛅ Warunki Atmosferyczne\n\nAktualne dane meteorologiczne dla Twojej lokalizacji zostały załadowane w widżecie poniżej:`,
      mentor_thoughts: 'Odpytano telemetryczny moduł pogody.',
      widgets: ['weather']
    };
  }

  // Obsługa statusu systemu
  if (lower.includes('status') || lower.includes('system') || lower.includes('stan') || lower.includes('metryk')) {
    return {
      content: `### 🛰️ OmniDash Core Status\n- **Środowisko:** ${isCloudMode ? 'Firebase & Vercel Cloud Gateway' : 'Desktop Bridge'}\n- **Model AI:** \`openai/gpt-oss-120b\`\n- **Operator:** ${userName}\n- **Zadania w To-Do:** ${pendingTasks.length} oczekujących, ${completedTasks.length} zrealizowanych\n- **Kategorie Firestore:** tasks, finances, workouts, calendar, operator_brain, chat_history\n- **Integralność bazy:** Zgodna (Live Cloud Sync)\n- **Ochrona sesji:** Aktywna (Crash Guard v2.5.0)`,
      mentor_thoughts: 'Wygenerowano raport statusowy z lokalnego silnika telemetrii.',
      widgets: ['system']
    };
  }

  // Obsługa zmiany motywu w języku naturalnym
  if (lower.includes('zmień motyw na') || lower.includes('ustaw motyw') || lower.includes('motyw retro') || lower.includes('motyw matrix') || lower.includes('motyw synthwave') || lower.includes('motyw nordic') || lower.includes('motyw monochrom') || lower.includes('motyw ciemny') || lower.includes('motyw jasny')) {
    let targetTheme = 'dark';
    if (lower.includes('retro') || lower.includes('bursztyn')) targetTheme = 'retro';
    else if (lower.includes('matrix') || lower.includes('hacker')) targetTheme = 'matrix';
    else if (lower.includes('monochrom') || lower.includes('slate') || lower.includes('czarno')) targetTheme = 'monochrome';
    else if (lower.includes('synthwave') || lower.includes('cyberpunk') || lower.includes('neon')) targetTheme = 'synthwave';
    else if (lower.includes('nordic') || lower.includes('frost') || lower.includes('błękit')) targetTheme = 'nordic';
    else if (lower.includes('jasny') || lower.includes('light') || lower.includes('dzień')) targetTheme = 'light';
    else if (lower.includes('ciemny') || lower.includes('dark')) targetTheme = 'dark';

    localStorage.setItem('system_theme', targetTheme);
    document.documentElement.classList.toggle('theme-light', targetTheme === 'light');
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: targetTheme }));

    return {
      content: `[+] **Motyw systemowy został zmieniony:**\n\n- Aktywowano styl: **${targetTheme.toUpperCase()}**\n- Nowy profil kolorystyczny został natychmiast zaaplikowany do wszystkich modułów interfejsu.`,
      mentor_thoughts: `Przełączono motyw graficzny na: ${targetTheme}.`,
      widgets: []
    };
  }

  // Obsługa dodawania do Planu Lekcji (Timetable)
  if (lower.startsWith('dodaj lekcję') || lower.startsWith('nowa lekcja') || lower.startsWith('dodaj do planu') || lower.startsWith('dodaj zajęcia')) {
    let raw = text.replace(/^(dodaj\s+(?:lekcję|do\s+planu|zajęcia)|nowa\s+lekcja)[:\s]*/i, '').trim();
    let day = 'monday';
    const dayMap = { poniedziałek: 'monday', wtorek: 'tuesday', środa: 'wednesday', czwartek: 'thursday', piątek: 'friday', sobota: 'saturday', niedziela: 'sunday' };
    for (const [plName, engId] of Object.entries(dayMap)) {
      if (raw.toLowerCase().includes(plName)) {
        day = engId;
        raw = raw.replace(new RegExp(plName, 'gi'), ' ').trim();
        break;
      }
    }

    const timeMatch = raw.match(/(\d{1,2}:\d{2})\s*(?:-|do|\s)\s*(\d{1,2}:\d{2})/);
    const startTime = timeMatch ? timeMatch[1] : '08:00';
    const endTime = timeMatch ? timeMatch[2] : '09:30';

    let subject = raw.replace(/(\d{1,2}:\d{2})\s*(?:-|do|\s)\s*(\d{1,2}:\d{2})/, ' ').trim();
    if (!subject) subject = 'Zajęcia';

    const newLesson = {
      id: 't_' + Date.now(),
      day,
      subject,
      time_start: startTime,
      time_end: endTime,
      room: 'Sala dydaktyczna',
      teacher: 'Prowadzący',
      type: 'Wykład',
      color: 'indigo',
      created_at: new Date().toISOString()
    };

    saveCloudDocument('timetable', newLesson.id, newLesson);
    window.dispatchEvent(new CustomEvent('cloudDataChanged', { detail: { collection: 'timetable' } }));

    return {
      content: `[+] **Pomyślnie dodano zajęcia do Planu Lekcji:**\n\n- 🎓 **${subject}**\n- 🗓️ Dzień: **${day}** (${startTime} - ${endTime})\n\nWpis został zsynchronizowany w bazie Cloud Firestore i jest widoczny w zakładce Plan Lekcji:`,
      mentor_thoughts: `Zapisano lekcję "${subject}" w dniu ${day} (${startTime}-${endTime}).`,
      widgets: ['timetable']
    };
  }

  // Obsługa zapytań o Plan Lekcji
  if (lower.includes('plan lekcji') || lower.includes('co mam dzisiaj') || lower.includes('jakie mam lekcje') || lower.includes('jaka lekcja') || lower.includes('zajęcia') || lower.includes('timetable') || lower.includes('harmonogram')) {
    const timetable = Array.isArray(context.timetable) ? context.timetable : [];
    if (timetable.length === 0) {
      return {
        content: `### 🎓 Plan Lekcji & Zajęć Dydaktycznych\n\nW Twojej bazie Firestore nie ma jeszcze żadnych zaplanowanych zajęć. Możesz dodać pierwszą lekcję wpisując polecenie np. *"dodaj lekcję Matematyka w poniedziałek 08:00-09:30"* lub skorzystać z widżetu poniżej:`,
        mentor_thoughts: 'Brak danych o planie lekcji w lokalnym cache.',
        widgets: ['timetable']
      };
    }

    const dayTranslations = {
      monday: 'Poniedziałek', tuesday: 'Wtorek', wednesday: 'Środa',
      thursday: 'Czwartek', friday: 'Piątek', saturday: 'Sobota', sunday: 'Niedziela'
    };

    let content = `### 🎓 Harmonogram Zajęć (Plan Lekcji)\n\n` +
      `Łącznie w bazie zarejestrowano **${timetable.length}** jednostek lekcyjnych:\n\n` +
      `| Dzień | Godziny | Przedmiot | Sala | Prowadzący | Typ |\n` +
      `|---|---|---|---|---|---|\n` +
      timetable.slice(0, 10).map(l => {
        const dName = dayTranslations[l.day?.toLowerCase()] || l.day || 'B/D';
        const times = `${l.time_start || '08:00'} - ${l.time_end || '09:30'}`;
        const room = l.room || '—';
        const teacher = l.teacher || '—';
        const type = l.type || 'Zajęcia';
        return `| **${dName}** | \`${times}\` | **${l.subject}** | ${room} | ${teacher} | ${type} |`;
      }).join('\n') +
      `\n\n> **Podpowiedź:** Poniżej wyświetlono interaktywny widżet planu lekcji z widokiem na dziś:`;

    return {
      content,
      mentor_thoughts: `Przeanalizowano plan lekcji: wygenerowano zestawienie ${timetable.length} kursów.`,
      widgets: ['timetable']
    };
  }

  // Obsługa dodawania treningu (Workouts)
  if (lower.startsWith('dodaj trening') || lower.startsWith('nowy trening') || lower.startsWith('zapisz trening')) {
    let workoutTitle = text.replace(/^(dodaj\s+trening|nowy\s+trening|zapisz\s+trening)[:\s]*/i, '').trim() || 'Sesja treningowa';
    let type = 'Siłowy';
    if (lower.includes('cardio') || lower.includes('bieganie')) type = 'Cardio';
    else if (lower.includes('kalistenika') || lower.includes('drążek')) type = 'Kalistenika';
    else if (lower.includes('rozciąganie') || lower.includes('mobility')) type = 'Rozciąganie';

    const newWorkout = {
      id: 'work_' + Date.now(),
      title: workoutTitle,
      type,
      description: 'Zarejestrowano przez asystenta AI OmniDash.',
      date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString()
    };

    saveCloudDocument('workouts', newWorkout.id, newWorkout);
    window.dispatchEvent(new CustomEvent('cloudDataChanged', { detail: { collection: 'workouts' } }));

    return {
      content: `[+] **Pomyślnie zarejestrowano trening:**\n\n- 🏋️ **${workoutTitle}** (Typ: **${type}**)\n- 📅 Data: **${newWorkout.date}**\n\nTrening został natychmiast zapisany w chmurze Firestore i widnieje w Twojej historii aktywności:`,
      mentor_thoughts: `Zapisano trening "${workoutTitle}" w kategorii ${type}.`,
      widgets: ['workouts']
    };
  }

  // Obsługa zapytań o treningi
  if (lower.includes('trening') || lower.includes('siłowni') || lower.includes('ćwiczen') || lower.includes('workout')) {
    const workouts = Array.isArray(context.workouts) ? context.workouts : [];
    let content = `### 🏋️ Dziennik Aktywności Fizycznej (Workouts)\n\n`;
    if (workouts.length === 0) {
      content += `Nie masz jeszcze zapisanych treningów w bieżącym rejestrze. Możesz dodać nowy trening pisząc *"dodaj trening: Klatka + Triceps (Siłowy)"* lub skorzystać z widżetu:`;
    } else {
      content += `Łącznie zarejestrowano **${workouts.length}** sesji treningowych:\n\n` +
        `| Data | Nazwa Treningu | Kategoria | Szczegóły |\n` +
        `|---|---|---|---|\n` +
        workouts.slice(0, 6).map(w => {
          return `| \`${w.date || 'B/D'}\` | **${w.title}** | \`${w.type || 'Siłowy'}\` | ${w.description || '—'} |`;
        }).join('\n') +
        `\n\n*Poniżej masz bezpośredni dostęp do widżetu treningów:*`;
    }
    return {
      content,
      mentor_thoughts: `Przeanalizowano dziennik treningowy (${workouts.length} wpisów).`,
      widgets: ['workouts']
    };
  }

  // Obsługa dodawania wydatku / wpływu (Finances)
  if (lower.startsWith('dodaj wydatek') || lower.startsWith('nowy wydatek') || lower.startsWith('dodaj przychód') || lower.startsWith('zapisz wydatek')) {
    const isIncome = lower.includes('przychód') || lower.includes('wpływ');
    const amountMatch = text.match(/(\d+(?:[.,]\d+)?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : 50;

    let category = 'Jedzenie';
    let bucket = 'needs';
    if (lower.includes('paliwo') || lower.includes('samochód') || lower.includes('czynsz') || lower.includes('rachunk')) {
      category = 'Rachunki/Transport';
      bucket = 'needs';
    } else if (lower.includes('gra') || lower.includes('kino') || lower.includes('rozrywka') || lower.includes('ubran')) {
      category = 'Rozrywka';
      bucket = 'wants';
    } else if (lower.includes('oszczędno') || lower.includes('inwestycj') || lower.includes('lokata')) {
      category = 'Oszczędności';
      bucket = 'savings';
    } else if (isIncome) {
      category = 'Wynagrodzenie';
      bucket = 'savings';
    }

    const newFinance = {
      id: 'fin_' + Date.now(),
      amount,
      category,
      type: isIncome ? 'income' : 'expense',
      bucket,
      description: text.replace(/^(dodaj\s+(?:wydatek|przychód)|nowy\s+wydatek)[:\s]*/i, '').trim(),
      transaction_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString()
    };

    saveCloudDocument('finances', newFinance.id, newFinance);
    window.dispatchEvent(new CustomEvent('cloudDataChanged', { detail: { collection: 'finances' } }));

    return {
      content: `[+] **Zarejestrowano transakcję w budżecie:**\n\n- 💰 **${isIncome ? '+' : '-'}${amount.toFixed(2)} PLN** (${category})\n- 📊 Alokacja 50/30/20: **${bucket.toUpperCase()}**\n\nWpis został zapisany w Firestore i zaktualizował wykres wydatków:`,
      mentor_thoughts: `Zarejestrowano transakcję ${newFinance.amount} PLN (${category}).`,
      widgets: ['finances']
    };
  }

  // Obsługa zapytań o Finanse
  if (lower.includes('finans') || lower.includes('budżet') || lower.includes('stan konta') || lower.includes('ile wydałem') || lower.includes('pieniądze') || lower.includes('wydatki') || lower.includes('przychody')) {
    const finances = Array.isArray(context.finances) ? context.finances : [];
    let totalExp = 0;
    let totalInc = 0;
    let bNeeds = 0;
    let bWants = 0;
    let bSavings = 0;

    const actualTxs = finances.filter(f => f && !f.is_settings && f.id !== 'finance_settings' && f.amount !== undefined);

    actualTxs.forEach(f => {
      const amt = Number(f.amount || 0);
      if (f.type === 'income') totalInc += amt;
      else {
        totalExp += amt;
        const b = (f.bucket || '').toLowerCase();
        if (b === 'wants' || b === 'zachcianki') bWants += amt;
        else if (b === 'savings' || b === 'oszczędności') bSavings += amt;
        else bNeeds += amt;
      }
    });
    const balance = totalInc - totalExp;
    const needsPct = totalExp > 0 ? Math.round((bNeeds / totalExp) * 100) : 0;
    const wantsPct = totalExp > 0 ? Math.round((bWants / totalExp) * 100) : 0;
    const savingsPct = totalExp > 0 ? Math.round((bSavings / totalExp) * 100) : 0;

    let content = `### 💰 Raport Finansowy & Budżet (Zasada 50/30/20)\n\n` +
      `| Wskaźnik Budżetu | Wartość | Status Bilansu |\n` +
      `|---|---|---|\n` +
      `| **Saldo Bieżące** | **${balance >= 0 ? '+' : ''}${balance.toFixed(2)} PLN** | ${balance >= 0 ? '🟢 Dodatnie' : '🔴 Ujemne'} |\n` +
      `| **Przychody Łącznie** | \`+${totalInc.toFixed(2)} PLN\` | Zarejestrowane wpływy |\n` +
      `| **Wydatki Skumulowane** | \`-${totalExp.toFixed(2)} PLN\` | Zarejestrowane koszty |\n\n` +
      `#### 📊 Alokacja Koszyków 50/30/20:\n\n` +
      `| Koszyk | Wydano | % Wydatków | Rekomendowany Cel |\n` +
      `|---|---|---|---|\n` +
      `| **Potrzeby (Needs)** | ${bNeeds.toFixed(2)} PLN | **${needsPct}%** | 50% budżetu |\n` +
      `| **Zachcianki (Wants)** | ${bWants.toFixed(2)} PLN | **${wantsPct}%** | 30% budżetu |\n` +
      `| **Oszczędności (Savings)** | ${bSavings.toFixed(2)} PLN | **${savingsPct}%** | 20% budżetu |\n\n`;

    if (actualTxs.length > 0) {
      content += `#### 📋 Ostatnie Transakcje:\n\n` +
        `| Data | Typ | Kwota | Kategoria | Opis |\n` +
        `|---|---|---|---|---|\n` +
        actualTxs.slice(0, 5).map(t => {
          const sign = t.type === 'income' ? '+' : '-';
          const typeLabel = t.type === 'income' ? 'Wpływ' : 'Wydatek';
          return `| \`${t.transaction_date || 'B/D'}\` | ${typeLabel} | **${sign}${Number(t.amount).toFixed(2)} PLN** | ${t.category || 'Inne'} | ${t.description || '—'} |`;
        }).join('\n') + `\n\n`;
    }

    content += `*Poniżej masz bezpośredni dostęp do interaktywnego widżetu finansów:*`;

    return {
      content,
      mentor_thoughts: `Przeanalizowano stan finansów: bilans ${balance.toFixed(2)} PLN, wydatki ${totalExp.toFixed(2)} PLN.`,
      widgets: ['finances']
    };
  }

  // Obsługa dodawania wydarzenia do Kalendarza
  if (lower.startsWith('dodaj wydarzenie') || lower.startsWith('nowe wydarzenie') || lower.startsWith('dodaj spotkanie') || lower.startsWith('zaplanuj')) {
    let title = text.replace(/^(dodaj\s+(?:wydarzenie|spotkanie)|nowe\s+wydarzenie|zaplanuj)[:\s]*/i, '').trim() || 'Ważne spotkanie';
    const dateMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
    const eventDate = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];

    const newEvent = {
      id: 'cal_' + Date.now(),
      title,
      event_date: eventDate,
      event_time: '10:00',
      priority: 'MEDIUM',
      created_at: new Date().toISOString()
    };

    saveCloudDocument('calendar', newEvent.id, newEvent);
    window.dispatchEvent(new CustomEvent('cloudDataChanged', { detail: { collection: 'calendar' } }));

    return {
      content: `[+] **Dodano wydarzenie do Kalendarza:**\n\n- 📅 **${title}**\n- 🗓️ Data: **${eventDate}** (10:00)\n\nWydarzenie jest widoczne w terminarzu i na siatce miesiąca:`,
      mentor_thoughts: `Zaplanowano wydarzenie "${title}" na dzień ${eventDate}.`,
      widgets: ['calendar']
    };
  }

  // Obsługa usuwania wydarzenia z Kalendarza w języku naturalnym
  if (lower.startsWith('usuń wydarzenie') || lower.startsWith('skasuj wydarzenie') || lower.startsWith('usuń spotkanie') || lower.startsWith('odwołaj spotkanie')) {
    const query = text.replace(/^(usuń\s+(?:wydarzenie|spotkanie)|skasuj\s+wydarzenie|odwołaj\s+spotkanie)[:\s]*/i, '').trim().toLowerCase();
    const calendar = Array.isArray(context.calendar) ? context.calendar : [];
    const found = calendar.find(e => (e.title && e.title.toLowerCase().includes(query)) || e.id === query);
    if (found) {
      deleteCloudDocument('calendar', found.id);
      window.dispatchEvent(new CustomEvent('cloudDataChanged', { detail: { collection: 'calendar' } }));
      return {
        content: `[-] **Pomyślnie usunięto wydarzenie z Kalendarza:**\n\n- 🗑️ **${found.title}** (${found.event_date || 'brak daty'})\n\nWpis został usunięty z bazy Firestore i zsynchronizowany na wszystkich urządzeniach.`,
        mentor_thoughts: `Skasowano wydarzenie "${found.title}" z kalendarza.`,
        widgets: ['calendar']
      };
    } else {
      return {
        content: `[!] Nie znaleziono wydarzenia pasującego do frazy: *"${query}"*. Poniżej wyświetlono aktualny kalendarz:`,
        mentor_thoughts: `Nie odnaleziono wydarzenia "${query}".`,
        widgets: ['calendar']
      };
    }
  }

  // Obsługa zapytań o Kalendarz
  if (lower.includes('kalendarz') || lower.includes('wydarzen') || lower.includes('spotkan') || lower.includes('terminarz')) {
    const calendar = Array.isArray(context.calendar) ? context.calendar : [];
    let content = `### 📅 Harmonogram & Terminarz Kalendarza\n\n`;
    if (calendar.length === 0) {
      content += `Brak zaplanowanych wydarzeń w Twoim terminarzu. Możesz dodać spotkanie wpisując *"dodaj spotkanie z zespołem"* lub korzystając z widżetu:`;
    } else {
      content += `Zaplanowane wydarzenia w bazie Firestore (${calendar.length}):\n\n` +
        calendar.slice(0, 6).map(e => `- 🗓️ **[${e.event_date || 'brak daty'}]** ${e.title} ${e.event_time ? `(${e.event_time})` : ''}`).join('\n') +
        `\n\n*Poniżej znajduje się pełny kalendarz miesięczny z podglądem nadchodzących terminów:*`;
    }
    return {
      content,
      mentor_thoughts: `Przeanalizowano kalendarz: ${calendar.length} wydarzeń.`,
      widgets: ['calendar']
    };
  }

  // Obsługa pamięci długoterminowej (Operator Brain)
  if (lower.startsWith('zapamiętaj że') || lower.startsWith('zapamiętaj:') || lower.startsWith('zapamiętaj')) {
    const fact = text.replace(/^zapamiętaj(?:\s+że|:)*/i, '').trim();
    if (fact) {
      const newBrain = {
        id: 'brain_' + Date.now(),
        fact,
        category: 'Preferencje',
        created_at: new Date().toISOString()
      };
      saveCloudDocument('operator_brain', newBrain.id, newBrain);
      window.dispatchEvent(new CustomEvent('cloudDataChanged', { detail: { collection: 'operator_brain' } }));

      return {
        content: `[+] **Zapisano fakt w Pamięci Długoterminowej (Operator Brain):**\n\n- 🧠 *" ${fact} "*\n\nTa informacja została utrwalona w Twoim profilu i asystent będzie brał ją pod uwagę podczas wszystkich kolejnych rozmów.`,
        mentor_thoughts: `Utrwalono fakt w Operator Brain: "${fact}".`,
        widgets: []
      };
    }
  }

  // Domyślna odpowiedź konwersacyjna
  return {
    content: `[+] **OmniDash Core Assistant (${mode.toUpperCase()})**\n\nOtrzymano polecenie: *"${text}"*.\n\nSystem działa w trybie chmurowym z modelem **openai/gpt-oss-120b** przez **Vercel Serverless Gateway**. Wszystkie Twoje kategorie w Firestore (Zadania, Kalendarz, Finanse, Treningi, Plan Lekcji, Operator Brain i Historia Chatu) są aktywne i zsynchronizowane w czasie rzeczywistym.`,
    mentor_thoughts: mode === 'mentor' ? 'Wykryto zapytanie ogólne w trybie asystenta.' : null,
    widgets: determineWidgets(text, '')
  };
}
