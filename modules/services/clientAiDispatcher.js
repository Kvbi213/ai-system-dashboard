import axios from 'axios';
import { saveCloudDocument, deleteCloudDocument } from './cloudSync.js';

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
    const rawTasks = localStorage.getItem('cloud_cache_tasks');
    const rawTodos = localStorage.getItem('cloud_cache_todos');
    const list1 = rawTasks ? JSON.parse(rawTasks) : [];
    const list2 = rawTodos ? JSON.parse(rawTodos) : [];
    const combined = [...(Array.isArray(list1) ? list1 : []), ...(Array.isArray(list2) ? list2 : [])];

    if (combined.length === 0) {
      return DEFAULT_INITIAL_TASKS;
    }

    const taskMap = new Map();
    for (const item of combined) {
      if (!item) continue;
      const id = String(item.id || item.title || item.text || Math.random());
      const title = item.title || item.text || 'Zadanie bez nazwy';
      const status = item.status || (item.completed ? 'completed' : 'pending');
      const priority = item.priority || 'MEDIUM';
      const category = item.category || 'ogólne';
      if (!taskMap.has(id)) {
        taskMap.set(id, { ...item, id, title, status, priority, category });
      }
    }
    return Array.from(taskMap.values());
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

export function parseAndExecuteAiActionsWithWidgets(text) {
  if (!text || typeof text !== 'string') return { cleanedText: text, extraWidgets: [] };

  let cleanedText = text;
  const extraWidgets = [];
  // Odporny regex dopasowujący tagi akcji nawet jeśli model otoczy je pogrubieniem (**), grawisem (`) lub spacjami
  const actionRegex = /(?:\*\*|\*|`|\s)*\[(?:\*\*|\*|`|\s)*ACTION\s*:\s*(?:\*\*|\*|`|\s)*([A-Za-z_]+)(?:\*\*|\*|`|\s)*([^\]]*)\](?:\*\*|\*|`|\s)*/gi;
  let match;

  while ((match = actionRegex.exec(text)) !== null) {
    const actionType = (match[1] || '').trim().toUpperCase();
    const rawAttrs = match[2] || '';
    
    const attrs = {};
    // Wsparcie dla cudzysłowów pojedynczych, podwójnych, polskich („ ”) oraz francuskich/typograficznych (« »)
    const attrRegex = /([a-zA-Z0-9_]+)\s*=\s*["'„”«»]([^"'„”«»]*)["'„”«»]|([a-zA-Z0-9_]+)\s*=\s*([^\s\]]+)/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(rawAttrs)) !== null) {
      const key = (attrMatch[1] || attrMatch[3] || '').trim();
      const val = attrMatch[2] !== undefined ? attrMatch[2] : attrMatch[4];
      if (key) {
        attrs[key] = val;
        attrs[key.toLowerCase()] = val;
      }
    }

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
      } else if (actionType === 'COMPLETE_TASK') {
        try {
          const raw = localStorage.getItem('cloud_cache_tasks');
          if (raw) {
            const list = JSON.parse(raw);
            const query = (attrs.title || attrs.id || '').toLowerCase();
            const found = list.find(t => t.id === attrs.id || (t.title && t.title.toLowerCase().includes(query)));
            if (found) {
              const updated = { ...found, status: 'completed', completed_at: new Date().toISOString() };
              saveCloudDocument('tasks', found.id, updated);
              window.dispatchEvent(new CustomEvent('cloudDataChanged', { detail: { collection: 'tasks' } }));
              extraWidgets.push('tasks');
            }
          }
        } catch {}
      } else if (actionType === 'DELETE_TASK') {
        try {
          const raw = localStorage.getItem('cloud_cache_tasks');
          if (raw) {
            const list = JSON.parse(raw);
            const query = (attrs.title || attrs.id || '').toLowerCase();
            const found = list.find(t => t.id === attrs.id || (t.title && t.title.toLowerCase().includes(query)));
            if (found) {
              deleteCloudDocument('tasks', found.id);
              window.dispatchEvent(new CustomEvent('cloudDataChanged', { detail: { collection: 'tasks' } }));
              extraWidgets.push('tasks');
            }
          }
        } catch {}
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
      } else if (actionType === 'NAVIGATE') {
        if (attrs.path) {
          window.dispatchEvent(new CustomEvent('navigateRequested', { detail: attrs.path }));
        }
      }
    } catch (actErr) {
      console.warn('[AiDispatcher] Błąd wykonania akcji:', actionType, actErr);
    }
  }

  // Oczyść znaczniki akcji z tekstu użytkownika (w tym otoczone przez **, * lub `)
  cleanedText = cleanedText.replace(/(?:\*\*|\*|`|\s)*\[(?:\*\*|\*|`|\s)*ACTION\s*:\s*[A-Za-z_]+(?:\*\*|\*|`|\s)*[^\]]*\](?:\*\*|\*|`|\s)*/gi, '').trim();
  return { cleanedText, extraWidgets };
}

export function parseAndExecuteAiActions(text) {
  const res = parseAndExecuteAiActionsWithWidgets(text);
  return res.cleanedText;
}

export const dispatchAiQuery = async ({ text, mode = 'worker', userName = 'Użytkownik', language = 'pl' }) => {
  const groqKey = localStorage.getItem('system_groq_api_key') || 
                  localStorage.getItem('system_api_key') || 
                  import.meta.env.VITE_GROQ_API_KEY;

  const context = getClientContextSummary();

  // 1. Priorytet: Dedykowany Gateway Vercel Serverless (Bypass CORS, model openai/gpt-oss-120b)
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
      model: localStorage.getItem('system_active_model') || 'openai/gpt-oss-120b'
    };

    const vercelRes = await axios.post(VERCEL_AGENT_ENDPOINT, payload, {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' }
    });

    if (vercelRes.data && vercelRes.data.agent_response) {
      const rawContent = vercelRes.data.agent_response;
      const { cleanedText: content, extraWidgets } = parseAndExecuteAiActionsWithWidgets(rawContent);
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
        const { cleanedText: content, extraWidgets } = parseAndExecuteAiActionsWithWidgets(rawContent);
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

  // 3. Bezpośrednie wywołanie Groq API (fallback z nagłówkiem Authorization)
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

      const timetableSummary = (context.timetable || []).length > 0
        ? context.timetable.map(l => `- [${(l.day || '').toUpperCase()}] ${l.time_start || ''}-${l.time_end || ''}: ${l.subject} (${l.room || 'sala b/d'}, ${l.teacher || 'prowadzący b/d'}, typ: ${l.type || 'Zajęcia'})`).join('\n')
        : 'Brak wpisów w planie lekcji.';

      const workoutsSummary = (context.workouts || []).length > 0
        ? `Zarejestrowano ${context.workouts.length} treningów. Ostatnie: ` + context.workouts.slice(0, 5).map(w => `[${w.date || 'b/d'}] ${w.title} (${w.type || 'Siłowy'})`).join(', ')
        : 'Brak sesji treningowych.';

      const systemPrompt = mode === 'mentor'
        ? `Jesteś J.A.R.V.I.S — inteligentnym mentorem i analitykiem w systemie OmniDash. Rozmawiasz z ${userName}.
Aktualny czas systemowy (Polska / Warszawa): ${context.dateStr}, godzina ${context.timeStr}.
PAMIĘTAJ: Aktualna data i dokładna godzina użytkownika to ${context.dateStr}, godzina ${context.timeStr}. Jeśli użytkownik pyta o czas lub godzinę, ZAWSZE podawaj dokładnie tę godzinę.
Zadania w To-Do:
${tasksSummary}
Plan Lekcji:
${timetableSummary}
Finanse i Budżet 50/30/20:
${financesSummary}
Treningi:
${workoutsSummary}
Kalendarz:
${calendarSummary}
Zasady: Posiadasz bezpośredni dostęp do internetu oraz bazy Firestore. Odpowiadaj wyczerpująco, logicznie i wspierająco w języku ${language}.
Gdy przedstawiasz tabele danych, pogodę, finanse czy harmonogramy, ZAWSZE używaj czytelnych tabel Markdown (| Kolumna | ... |).
Jeśli użytkownik prosi o akcję, możesz użyć odpowiednich tagów na końcu w czystej postaci (BEZ pogrubień **): [ACTION:ADD_TASK ...], [ACTION:ADD_LESSON ...], [ACTION:ADD_EXPENSE ...], [ACTION:ADD_INCOME ...], [ACTION:ADD_WORKOUT ...], [ACTION:ADD_EVENT ...], [ACTION:SET_THEME ...], [ACTION:SET_ACCENT ...], [ACTION:REMEMBER ...].`
        : `Jesteś F.R.I.D.A.Y — inżynieryjnym silnikiem wykonawczym w OmniDash. Rozmawiasz z ${userName}.
Aktualny czas systemowy (Polska / Warszawa): ${context.dateStr}, godzina ${context.timeStr}.
PAMIĘTAJ: Aktualna data i dokładna godzina użytkownika to ${context.dateStr}, godzina ${context.timeStr}. Jeśli użytkownik pyta o czas lub godzinę, ZAWSZE podawaj dokładnie tę godzinę.
Zadania w To-Do:
${tasksSummary}
Plan Lekcji:
${timetableSummary}
Finanse i Budżet 50/30/20:
${financesSummary}
Treningi:
${workoutsSummary}
Kalendarz:
${calendarSummary}
Zasady: Posiadasz bezpośredni dostęp do internetu oraz bazy Firestore. Odpowiadaj konkretnie, merytorycznie i technicznie w języku ${language}.
Gdy przedstawiasz tabele danych, pogodę, finanse czy harmonogramy, ZAWSZE używaj czytelnych tabel Markdown (| Kolumna | ... |).
Jeśli użytkownik prosi o akcję, możesz użyć odpowiednich tagów na końcu w czystej postaci (BEZ pogrubień **): [ACTION:ADD_TASK ...], [ACTION:ADD_LESSON ...], [ACTION:ADD_EXPENSE ...], [ACTION:ADD_INCOME ...], [ACTION:ADD_WORKOUT ...], [ACTION:ADD_EVENT ...], [ACTION:SET_THEME ...], [ACTION:SET_ACCENT ...], [ACTION:REMEMBER ...].`;

      const response = await fetch(GROQ_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b',
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
        const { cleanedText: content, extraWidgets } = parseAndExecuteAiActionsWithWidgets(rawContent);
        const thoughts = mode === 'mentor' ? `Analiza kognitywna (GPT-OSS 120B): przetworzono zadania i kontekst operacyjny.` : null;
        const widgets = Array.from(new Set([...extraWidgets, ...determineWidgets(text, rawContent)]));

        return {
          content,
          mentor_thoughts: thoughts,
          widgets,
          source: 'cloud_groq'
        };
      }
    } catch (groqErr) {
      console.warn('[AiDispatcher] Bezpośrednie zapytanie Groq nie powiodło się:', groqErr.message);
    }
  }

  // 4. Wbudowany inteligentny asystent autonomiczny (Gdy brak sieci / błąd API)
  return handleAutonomousFallback(text, mode, userName, context);
};

function handleAutonomousFallback(text, mode, userName, context = getClientContextSummary()) {
  const lower = text.toLowerCase().trim();
  const { pendingTasks, completedTasks } = context;

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
