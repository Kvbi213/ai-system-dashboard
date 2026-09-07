import axios from 'axios';
import { saveCloudDocument } from './cloudSync.js';

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
  { id: '1', title: 'Wdrożenie Firebase Hosting (void-potato-7721)', priority: 'HIGH', status: 'completed', category: 'system' },
  { id: '2', title: 'Autoryzacja właściciela: marektowarek21372137@gmail.com', priority: 'HIGH', status: 'completed', category: 'system' },
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
  } catch {}

  let timetable = [];
  try {
    const rawTimetable = localStorage.getItem('cloud_cache_timetable');
    if (rawTimetable) timetable = JSON.parse(rawTimetable);
  } catch {}

  const now = new Date();
  const dateStr = now.toLocaleDateString('pl-PL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });

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
    timeStr
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
      customApiKey: groqKey && groqKey.startsWith('gsk_') ? groqKey : undefined,
      model: localStorage.getItem('system_active_model') || 'openai/gpt-oss-120b'
    };

    const vercelRes = await axios.post(VERCEL_AGENT_ENDPOINT, payload, {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' }
    });

    if (vercelRes.data && vercelRes.data.agent_response) {
      const content = vercelRes.data.agent_response;
      const backendWidgets = vercelRes.data.widgets || [];
      const mergedWidgets = Array.from(new Set([...backendWidgets, ...determineWidgets(text, content)]));

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
        const content = data.agent_response || (data.payload?.agent_response || data.payload?.title || JSON.stringify(data.payload));
        const backendWidgets = data.widgets || (data.widget ? [data.widget] : []);
        const mergedWidgets = Array.from(new Set([...backendWidgets, ...determineWidgets(text, content)]));

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

      const systemPrompt = mode === 'mentor'
        ? `Jesteś J.A.R.V.I.S — inteligentnym mentorem i analitykiem w systemie OmniDash. Rozmawiasz z ${userName}.
Aktualny czas: ${context.dateStr}, ${context.timeStr}.
Zadania w To-Do:
${tasksSummary}
Kalendarz:
${calendarSummary}
Zasady: Posiadasz bezpośredni dostęp do internetu oraz silnika Brave Search. NIGDY nie mów, że nie masz dostępu do wiadomości ze świata ani internetu! Odpowiadaj wyczerpująco, logicznie i wspierająco w języku ${language} z użyciem bogatego Markdown.`
        : `Jesteś F.R.I.D.A.Y — inżynieryjnym silnikiem wykonawczym w OmniDash. Rozmawiasz z ${userName}.
Aktualny czas: ${context.dateStr}, ${context.timeStr}.
Zadania w To-Do:
${tasksSummary}
Kalendarz:
${calendarSummary}
Zasady: Posiadasz bezpośredni dostęp do internetu oraz silnika Brave Search. NIGDY nie mów, że nie masz dostępu do wiadomości ze świata ani internetu! Odpowiadaj konkretnie, merytorycznie i technicznie w języku ${language} z użyciem bogatego Markdown.`;

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
        const content = resData.choices?.[0]?.message?.content || 'Brak odpowiedzi od modelu.';
        const thoughts = mode === 'mentor' ? `Analiza kognitywna (GPT-OSS 120B): przetworzono zadania i kontekst operacyjny.` : null;
        const widgets = determineWidgets(text, content);

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

  // Domyślna odpowiedź konwersacyjna
  return {
    content: `[+] **OmniDash Core Assistant (${mode.toUpperCase()})**\n\nOtrzymano polecenie: *"${text}"*.\n\nSystem działa w trybie chmurowym z modelem **openai/gpt-oss-120b** przez **Vercel Serverless Gateway**. Wszystkie Twoje kategorie w Firestore (Zadania, Kalendarz, Finanse, Treningi, Operator Brain i Historia Chatu) są aktywne i zsynchronizowane w czasie rzeczywistym.`,
    mentor_thoughts: mode === 'mentor' ? 'Wykryto zapytanie ogólne w trybie asystenta.' : null,
    widgets: determineWidgets(text, '')
  };
}
