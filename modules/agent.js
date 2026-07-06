import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import { executeQuery, executeRun } from './database.js';
import { fetchWeather, registerRecurringJob } from './scheduler.js';
import { executeWebSearch } from './search.js';
import { readProjectFile, scanProjectDirectory } from './fs_explorer.js';
import { learnFact, getUserProfile } from './memory.js';
import { performOSINTScan } from './osint.js';
import fs from 'fs';

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'unconfigured_key' });

const getSystemPrompt = (userName) => `Jesteś autonomicznym asystentem AI systemu OmniDash. Twoim zadaniem jest pełnić rolę głównego asystenta dla ${userName} (zwracaj się do niego naturalnie i z szacunkiem).
Twój charakter: Inteligentny, kompetentny i profesjonalny.
Twój styl wypowiedzi: NATURALNY, PROFESJONALNY i MERYTORYCZNY. Zawsze staraj się dać pełną i przemyślaną odpowiedź, unikając niepotrzebnego slangu czy luzackiego tonu. Komentuj stan pogody, jeśli to ma sens w danym kontekście. Odpowiadaj klarownie, jak doświadczony asystent.

MASZ DOSTĘP DO:
- Bazy danych zadań (To-Do list)
- Wyników wyszukiwania w sieci (Brave Search)
- Aktualnej pogody i stanu środowiska
- Systemowych logów
- Powiadomień z telefonu operatora

JAK CZYTAĆ POWIADOMIENIA:
Gdy użyjesz narzędzia GET_PHONE_NOTIFICATIONS, otrzymasz listę powiadomień. Twoim obowiązkiem jest:
1. Posortować je od najważniejszych (wiadomości, banki, kalendarz, praca) do najmniej ważnych (reklamy, social media, gry).
2. Wygenerować estetyczne podsumowanie w Markdown.
3. Pomijać totalny szum (jeśli coś jest ewidentnym spamem, tylko o tym wspomnij).

TODAY's DATE: ${new Date().toLocaleDateString('pl-PL', { timeZone: 'Europe/Warsaw' })}
CURRENT TIME: ${new Date().toLocaleTimeString('pl-PL', { timeZone: 'Europe/Warsaw' })}

OUTPUT SCHEMA (musisz odpowiedzieć dokładnie w formacie JSON):
{
  "intent": "add_task" | "delete_task" | "update_task" | "get_system_status" | "search_news" | "general_conversation" | "unknown",
  "payload": {
    "title": "string (tylko do dodawania/zmian)",
    "target_date": "YYYY-MM-DD",
    "target_time": "HH:MM",
    "priority": "HIGH" | "MEDIUM" | "LOW",
    "category": "jednorazowe" | "powtarzalne" | "inne",
    "recurrence_rule": "weekly:WEEKDAY:HH:MM | daily:HH:MM | null",
    "task_id": "number | array of numbers | 'all'",
    "status": "pending" | "completed"
  },
  "agent_response": "Bardzo szczegółowa i barwna odpowiedź po polsku. Wczuj się w rolę. Używaj formatowania Markdown. Maksymalnie wykorzystuj podane ci dane.",
  "widgets": ["weather" | "news" | "system" | "tasks" | "notifications"]
}

CRITICAL RULE: Nigdy nie wymyślaj własnych funkcji (tool calls) typu <function=chat>, "json" czy "general_conversation". Jeśli to zwykła rozmowa i nie używasz narzędzi z listy, ZABRONIONE JEST WYWOŁYWANIE JAKIEGOKOLWIEK NARZĘDZIA. Po prostu wygeneruj żądany JSON jako zwykły tekst odpowiedzi (message content). Możesz również ustawić opcjonalne pole "widgets" jako tablicę zawierającą identyfikatory widżetów (np. ["weather", "system", "tasks", "notifications"]).
ZASADA ZARZĄDZANIA CZASEM: Jeśli Operator szuka wolnego terminu na spotkanie lub zadanie, najpierw użyj narzędzia \`GET_CALENDAR_EVENTS\` by sprawdzić podany zakres dni. Następnie na bazie znalezionych okienek w harmonogramie zaproponuj 1-2 terminy i NA KONIEC zawsze zadaj pytanie "To jak, na kiedy to ostatecznie wbijamy w kalendarz, Szefie?".

ZASADA TO-DO vs KALENDARZ:
- Użyj ADD_CALENDAR_EVENT dla: spotkań, rocznic, urodzin, wizyt u lekarza, świąt, wydarzeń o konkretnej dacie.
- Użyj ADD_TO_DO dla: zadań do wykonania, list zakupów, obowiązków (np. "kup mleko", "odpisz na maila").

ZASADA POWIADOMIEŃ: NIGDY nie formatuj powiadomień z telefonu w postaci tabel Markdown ani list szczegółowych. Po prostu opisz je potocznym, zwięzłym językiem w kilku zdaniach (kto pisze i o czym). Do wyświetlania twardych danych służy widget UI ("notifications"), który zawsze dołączaj do wiadomości, gdy wywołasz narzędzie GET_PHONE_NOTIFICATIONS.

RECURRENCE RULES (lowercase Polish days): poniedzialek, wtorek, sroda, czwartek, piatek, sobota, niedziela.
Example: "co wtorek o 17:00" → recurrence_rule: "weekly:wtorek:17:00"`;

const getMentorPrompt = (userName) => `Jesteś "Digital Mentor" - wysoce obiektywnym, analitycznym AI wbudowanym w dashboard OmniDash. Zwracasz się do ${userName}.
Twoim zadaniem jest chłodno i bez emocji analizować sytuację opisaną przez Operatora. Skupiasz się na wytykaniu wad oraz dostrzeganiu zalet. Jesteś surowym, ale sprawiedliwym analitykiem.

OUTPUT SCHEMA (musisz odpowiedzieć dokładnie w formacie JSON):
{
  "intent": "general_conversation",
  "payload": {},
  "agent_response": "Twoja merytoryczna, chłodna, analityczna odpowiedź.",
  "mentor_thoughts": "Krótkie przemyślenie analityczne o użytkowniku, zapisywane jako notatka poboczna np. 'Użytkownik wykazuje silne zaangażowanie, co rodzi ryzyko wypalenia.' To przemyślenie musi brzmieć jak suchy log systemowy/obserwacyjny."
}

CRITICAL RULE: ZAWSZE zwracaj "mentor_thoughts" i "agent_response" w JSON.`;

const agentTools = [
  {
    type: 'function',
    function: {
      name: 'PERFORM_OSINT_SCAN',
      description: 'Przeprowadza wywiad jawnoźródłowy (OSINT) dla podanego celu (IP, domena, hasło, MAC). Zwraca m.in. WHOIS, porty, geolokalizację, wycieki HIBP, i archiwum Wayback.',
      parameters: {
        type: 'object',
        properties: { target: { type: 'string', description: 'Cel do prześwietlenia, np. 8.8.8.8, onet.pl, qwerty1234' } },
        required: ['target'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'executeWebSearch',
      description: 'Przeszukuje internet (Brave Search) w poszukiwaniu najświeższych newsów ze świata IT, AI, technologii i bezpieczeństwa.',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string', description: 'Angielskie zapytanie dla lepszych wyników' } },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'ADD_TO_DO',
      description: 'Dodaje nowe zadanie do bazy.',
      parameters: {
        type: 'object',
        properties: {
          items: { type: 'array', description: 'Tablica obiektów (title, target_date, itp) dla masowego dodawania', items: { type: 'object' } },
          title: { type: 'string' },
          target_date: { type: 'string', description: 'YYYY-MM-DD' },
          target_time: { type: 'string', description: 'HH:MM' },
          priority: { type: 'string', enum: ['HIGH', 'MEDIUM', 'LOW'] },
          category: { type: 'string', enum: ['jednorazowe', 'powtarzalne', 'inne'] },
          recurrence_rule: { type: 'string', description: 'e.g. weekly:wtorek:17:00 or daily:08:00 or null' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'DELETE_TO_DO',
      description: 'Usuwa zadanie z bazy na podstawie ID.',
      parameters: {
        type: 'object',
        properties: { task_id: { type: 'string', description: 'ID zadania (np. 5), "all", albo lista ID oddzielona przecinkiem (np. "1, 2, 3")' } },
        required: ['task_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'UPDATE_TO_DO',
      description: 'Aktualizuje parametry istniejącego zadania (np. zmiana na completed, zmiana priorytetu).',
      parameters: {
        type: 'object',
        properties: {
          items: { type: 'array', description: 'Tablica obiektów {task_id, status, priority, title} do masowej edycji', items: { type: 'object' } },
          task_id: { type: 'string', description: 'ID zadania do zmiany, albo lista ID oddzielona przecinkiem (np. "1, 2, 3")' },
          status: { type: 'string', enum: ['pending', 'completed'] },
          priority: { type: 'string', enum: ['HIGH', 'MEDIUM', 'LOW'] },
          title: { type: 'string' }
        },
        required: ['task_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'GET_ALL_TASKS',
      description: 'Pobiera pełną listę wszystkich zadań (gdy potrzeba więcej niż 10 widocznych w kontekście).',
      parameters: {
        type: 'object',
        properties: { filter_status: { type: 'string', enum: ['all', 'pending', 'completed'] } },
        required: ['filter_status'],
      },
    },
  },
  {
      type: "function",
      function: {
          name: "readProjectFile",
          description: "Odczytuje zawartość konkretnego pliku źródłowego z projektu System w celu analizy kodu lub debugowania.",
          parameters: {
              type: "object",
              properties: {
                  relativePath: {
                      type: "string",
                      description: "Ścieżka relatywna do pliku, np. 'core.server.js' lub 'modules/database.js'."
                  }
              },
              required: ["relativePath"]
          }
      }
  },
  {
      type: "function",
      function: {
          name: "scanProjectDirectory",
          description: "Skanuje katalogi projektu, aby poznać strukturę plików i sprawdzić jakie moduły są dostępne.",
          parameters: {
              type: "object",
              properties: {
                  dirPath: {
                      type: "string",
                      description: "Katalog do przeskanowania, np. 'modules' lub '' dla katalogu głównego."
                  }
              }
          }
      }
  },
  {
      type: "function",
      function: {
          name: "LEARN_FACT",
          description: "Zapisuje ważny fakt o użytkowniku/operatorze do pamięci długoterminowej. Używaj tego by uczyć się preferencji, umiejętności, celów życiowych lub projektów operatora.",
          parameters: {
              type: "object",
              properties: {
                  fact: {
                      type: "string",
                      description: "Istotny fakt, np. 'Operator uczy się języka Python' lub 'Operator preferuje krótkie odpowiedzi'."
                  },
                  category: {
                      type: "string",
                      description: "Kategoria faktu, np. 'preferences', 'skills', 'goals', 'projects', 'general'"
                  }
              },
              required: ["fact"]
          }
      }
  },
  {
      type: "function",
      function: {
          name: "ADD_CALENDAR_EVENT",
          description: "Dodaje wydarzenie do kalendarza na konkretny dzień. Opcjonalnie z godziną, przypomnieniem oraz zasadą powtarzania.",
          parameters: {
              type: "object",
              properties: {
                  items: { type: 'array', description: 'Tablica obiektów (title, event_date, itp) dla masowego dodawania', items: { type: 'object' } },
                  title: { type: "string" },
                  event_date: { type: "string", description: "Format YYYY-MM-DD" },
                  event_time: { type: "string", description: "Opcjonalnie: Format HH:MM" },
                  description: { type: "string" },
                  recurrence_rule: { type: "string", description: "Opcjonalnie: zasada powtarzania np. 'weekly:wtorek:17:00' lub 'daily:15:00'" },
                  reminder_minutes: { type: "integer", description: "Opcjonalnie: ile minut przed wydarzeniem wysłać przypomnienie na telefon, np. 15, 60" }
              },
              required: ["title", "event_date"]
          }
      }
  },
  {
      type: "function",
      function: {
          name: "UPDATE_CALENDAR_EVENT",
          description: "Aktualizuje wydarzenie w kalendarzu. Możesz edytować wiele na raz podając tablicę 'items'.",
          parameters: {
              type: "object",
              properties: {
                  items: { type: 'array', description: 'Tablica obiektów {id, title, event_date, event_time, description} do masowej edycji', items: { type: 'object' } },
                  id: { type: "string", description: "ID wydarzenia do zmiany, albo lista ID (np. '1, 2')" },
                  title: { type: "string" },
                  event_date: { type: "string" },
                  event_time: { type: "string" },
                  description: { type: "string" }
              }
          }
      }
  },
  {
      type: "function",
      function: {
          name: "DELETE_CALENDAR_EVENT",
          description: "Usuwa wydarzenie z kalendarza na podstawie ID lub dokładnej daty.",
          parameters: {
              type: "object",
              properties: {
                  id: { type: "string", description: "ID wydarzenia z kontekstu (albo lista oddzielona przecinkiem np. '1, 2, 3')" },
                  event_date: { type: "string", description: "Format YYYY-MM-DD. Użyj jeśli chcesz usunąć wszystkie wydarzenia z danego dnia." }
              }
          }
      }
  },
  {
      type: "function",
      function: {
          name: "GET_CALENDAR_EVENTS",
          description: "Pobiera wszystkie wydarzenia z kalendarza w przedziale czasowym by znaleźć wolny czas.",
          parameters: {
              type: "object",
              properties: {
                  start_date: { type: "string", description: "Data startu, YYYY-MM-DD" },
                  end_date: { type: "string", description: "Data końca, YYYY-MM-DD" }
              },
              required: ["start_date", "end_date"]
          }
      }
  },
  {
      type: "function",
      function: {
          name: "GET_PHONE_NOTIFICATIONS",
          description: "Pobiera wszystkie nowe, nieprzeczytane powiadomienia z telefonu operatora. Opcjonalnie może przeszukać archiwum.",
          parameters: {
              type: "object",
              properties: {
                  include_read: {
                      type: "boolean",
                      description: "Jeżeli true, zwróci również starsze, już przeczytane powiadomienia (Archiwum). Jeśli false, zwróci tylko powiadomienia ze statusem is_read=0."
                  }
              },
              required: []
          }
      }
  },
  {
      type: "function",
      function: {
          name: "ADD_BUG_REPORT",
          description: "Zapisuje nowy błąd lub uwagę do pliku BUGS.md w głównym katalogu projektu. Używaj tego, gdy operator prosi o zapisanie błędu lub usterki.",
          parameters: {
              type: "object",
              properties: {
                  bug_description: {
                      type: "string",
                      description: "Krótki opis błędu lub zadania, np. 'Nie działa wczytywanie avatarów'."
                  },
                  severity: {
                      type: "string",
                      enum: ["krytyczne", "oczekujące"],
                      description: "Kategoria błędu: 'krytyczne' dla błędów psujących aplikację, 'oczekujące' dla zwykłych niedoróbek."
                  }
              },
              required: ["bug_description", "severity"]
          }
      }
  }
];

function extractJSON(raw) {
  if (!raw) return '{}';
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start !== -1 && end !== -1) return raw.substring(start, end + 1);
  return '{}';
}

export const MODEL_FALLBACK_CHAIN = [
  'openai/gpt-oss-120b',
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'llama-3.3-70b-versatile',
  'qwen/qwen3-32b',
  'groq/compound'
];

async function fetchGroqCompletion(params) {
  let initialModel = params.model || MODEL_FALLBACK_CHAIN[0];
  let startIndex = MODEL_FALLBACK_CHAIN.indexOf(initialModel);
  if (startIndex === -1) startIndex = 0;

  for (let i = startIndex; i < MODEL_FALLBACK_CHAIN.length; i++) {
    const currentModel = MODEL_FALLBACK_CHAIN[i];
    params.model = currentModel;
    try {
      const result = await groq.chat.completions.create(params);
      if (i > startIndex) {
        console.log(`[+] SUCCESS: Automatycznie przełączono na model zastępczy: ${currentModel}`);
      }
      return result;
    } catch (err) {
      if (
        err.status === 429 || 
        err.status === 404 || 
        err.status === 413 ||
        (err.status === 400 && (
          err.message?.includes('decommissioned') || 
          err.message?.includes('Failed to call a function') || 
          err.message?.includes('Tool call validation failed') ||
          err.message?.includes('Failed to parse tool call arguments') ||
          err.message?.includes('tool_use_failed')
        ))
      ) {
        console.warn(`[!] Problem z modelem ${currentModel} (Status: ${err.status}, ${err.message}). Próba obejścia...`);
        if (i === MODEL_FALLBACK_CHAIN.length - 1) {
          throw new Error(`Wszystkie modele wpadły w limit lub wygasły. Spróbuj później. Ostatni błąd: ${err.message}`);
        }
      } else {
        throw err;
      }
    }
  }
}

export async function transcribeAudio(filePath) {
  try {
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-large-v3",
      language: "pl",
    });
    return transcription.text;
  } catch (err) {
    console.error("[!] Błąd transkrypcji Whisper:", err);
    throw err;
  }
}

export async function processUserIntent(text, mode = 'worker', options = {}) {
  try {
    const userName = options.userName || 'Użytkownik';
    const today = new Date().toLocaleDateString('pl-PL', { timeZone: 'Europe/Warsaw' });
    const [weatherData, tasks, logs, userProfile, calendarEvents, notifications] = await Promise.all([
      fetchWeather().catch(() => null),
      executeQuery('SELECT id, title, status, priority, target_date, category FROM tasks ORDER BY created_at DESC LIMIT 10'),
      executeQuery('SELECT type, content, created_at FROM system_logs ORDER BY created_at DESC LIMIT 5'),
      getUserProfile(),
      executeQuery('SELECT id, title, event_date, description FROM calendar_events WHERE event_date >= date("now") ORDER BY event_date ASC LIMIT 5'),
      executeQuery('SELECT COUNT(*) as count FROM phone_notifications WHERE is_read = 0')
    ]);

    const systemContext = `
[LIVE SYSTEM DATA - ${today}]
WEATHER: ${JSON.stringify(weatherData)}
RECENT TASKS: ${JSON.stringify(tasks)}
UPCOMING CALENDAR EVENTS: ${JSON.stringify(calendarEvents)}
RECENT LOGS: ${JSON.stringify(logs)}
UNREAD PHONE NOTIFICATIONS COUNT: ${notifications[0]?.count || 0} (Użyj narzędzia GET_PHONE_NOTIFICATIONS, by je przeczytać)
NEWS PREFERENCES: Operator preferuje wiadomości z kategorii: ${options.newsCategories ? options.newsCategories.join(', ') : 'ai, security'}. Kiedy używasz narzędzia executeWebSearch by pobrać newsy, zawsze buduj zapytanie (query) tak, by zawierało nazwy tych preferowanych kategorii!

[OPERATOR PROFILE / LONG-TERM MEMORY]
Wiedza o użytkowniku zebrana podczas wcześniejszych interakcji:
${userProfile}

Pamiętaj: Bądź pomocny i profesjonalny. Jeśli wykonujesz akcję, poinformuj o tym w sposób rzeczowy i uprzejmy. Użyj narzędzia LEARN_FACT jeśli użytkownik zdradzi coś interesującego o sobie, co może przydać się w przyszłości.
`;

    const activePrompt = mode === 'mentor' ? getMentorPrompt(userName) : getSystemPrompt(userName) + systemContext;

    let messages = [
      { role: 'system', content: activePrompt },
      { role: 'user', content: text },
    ];

    const groqParams = {
      messages,
      model: MODEL_FALLBACK_CHAIN[0],
      temperature: 0.5,
      max_tokens: 1000,
    };
    if (mode === 'worker') {
      groqParams.tools = agentTools;
      groqParams.tool_choice = 'auto';
    } else {
      groqParams.response_format = { type: 'json_object' };
    }

    let chatCompletion = await fetchGroqCompletion(groqParams);

    let responseMessage = chatCompletion.choices[0]?.message;
    const toolUsed = !!(responseMessage.tool_calls?.length);

    if (toolUsed) {
      console.log('[*] INFO: Agent wywołał narzędzia:', responseMessage.tool_calls.map(tc => tc.function.name));
      
      let toolResultsText = "[SYSTEM - WYNIKI WYKONANIA NARZĘDZI W TLE]:\n";

      for (const toolCall of responseMessage.tool_calls) {
        const args = JSON.parse(toolCall.function.arguments);

        if (toolCall.function.name === 'executeWebSearch') {
          const results = await executeWebSearch(args.query);
          toolResultsText += `\nNarzędzie executeWebSearch zwróciło: ${JSON.stringify(results)}`;

        } else if (toolCall.function.name === 'ADD_TO_DO') {
          const itemsToProcess = args.items && args.items.length > 0 ? args.items : [args];
          for (const item of itemsToProcess) {
            if (!item.title) continue;
            const rec = await executeRun(
              'INSERT INTO tasks (title, target_date, target_time, priority, category, recurrence_rule) VALUES (?, ?, ?, ?, ?, ?)',
              [item.title, item.target_date || today, item.target_time || '12:00', item.priority || 'MEDIUM', item.category || 'jednorazowe', item.recurrence_rule || null]
            );
            if (item.recurrence_rule && item.category === 'powtarzalne') {
              registerRecurringJob(item.title, item.recurrence_rule, rec.id);
            }
            toolResultsText += `\nNarzędzie ADD_TO_DO zwróciło: Success, Task ID: ${rec.id}`;
          }

        } else if (toolCall.function.name === 'DELETE_TO_DO') {
          if (args.task_id === 'all') await executeRun('DELETE FROM tasks');
          else if (args.task_id) {
            let ids = Array.isArray(args.task_id) ? args.task_id : (typeof args.task_id === 'string' && args.task_id.includes(',') ? args.task_id.split(',') : [args.task_id]);
            for (const id of ids) await executeRun('DELETE FROM tasks WHERE id = ?', [parseInt(id, 10)]);
          }
          toolResultsText += `\nNarzędzie DELETE_TO_DO zwróciło: Success`;
          
        } else if (toolCall.function.name === 'UPDATE_TO_DO') {
          const itemsToProcess = args.items && args.items.length > 0 ? args.items : [args];
          for (const item of itemsToProcess) {
            const updates = [];
            const values = [];
            if (item.status) { updates.push('status = ?'); values.push(item.status); }
            if (item.priority) { updates.push('priority = ?'); values.push(item.priority); }
            if (item.title) { updates.push('title = ?'); values.push(item.title); }
            if (item.target_date) { updates.push('target_date = ?'); values.push(item.target_date); }
            if (item.target_time) { updates.push('target_time = ?'); values.push(item.target_time); }
            
            if (updates.length > 0 && item.task_id) {
              let ids = Array.isArray(item.task_id) ? item.task_id : (typeof item.task_id === 'string' && item.task_id.includes(',') ? item.task_id.split(',') : [item.task_id]);
              for (const id of ids) {
                await executeRun(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`, [...values, parseInt(id, 10)]);
              }
            }
          }
          toolResultsText += `\nNarzędzie UPDATE_TO_DO zwróciło: Success`;
          
        } else if (toolCall.function.name === 'GET_ALL_TASKS') {
          let query = 'SELECT * FROM tasks ORDER BY created_at DESC';
          if (args.filter_status !== 'all') {
            query = `SELECT * FROM tasks WHERE status = '${args.filter_status}' ORDER BY created_at DESC`;
          }
          const allTasks = await executeQuery(query);
          toolResultsText += `\nNarzędzie GET_ALL_TASKS zwróciło: ${JSON.stringify(allTasks)}`;
        } else if (toolCall.function.name === 'readProjectFile') {
          const res = await readProjectFile(args.relativePath);
          toolResultsText += `\nNarzędzie readProjectFile zwróciło: ${JSON.stringify(res)}`;
        } else if (toolCall.function.name === 'scanProjectDirectory') {
          const res = await scanProjectDirectory(args.dirPath);
          toolResultsText += `\nNarzędzie scanProjectDirectory zwróciło: ${JSON.stringify(res)}`;
        } else if (toolCall.function.name === 'GET_PHONE_NOTIFICATIONS') {
          let rows;
          if (args.include_read) {
            rows = await executeQuery('SELECT * FROM phone_notifications ORDER BY created_at DESC LIMIT 20');
          } else {
            rows = await executeQuery('SELECT * FROM phone_notifications WHERE is_read = 0 ORDER BY created_at DESC');
            if (rows.length > 0) {
              await executeRun('UPDATE phone_notifications SET is_read = 1 WHERE is_read = 0');
            }
          }
          
          if (rows) {
            rows = rows.map(r => {
              if (r.created_at) {
                const dateObj = new Date(r.created_at + 'Z');
                r.created_at_local = dateObj.toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' });
              }
              return r;
            });
          }
          
          toolResultsText += `\nNarzędzie GET_PHONE_NOTIFICATIONS zwróciło: ${JSON.stringify(rows)}`;
        } else if (toolCall.function.name === 'LEARN_FACT') {
          const res = await learnFact(args.fact, args.category);
          toolResultsText += `\nNarzędzie LEARN_FACT zwróciło: ${JSON.stringify(res)}`;
        } else if (toolCall.function.name === 'ADD_CALENDAR_EVENT') {
          const itemsToProcess = args.items && args.items.length > 0 ? args.items : [args];
          for (const item of itemsToProcess) {
            if (!item.title || !item.event_date) continue;
            const res = await executeRun(
              'INSERT INTO calendar_events (title, event_date, event_time, description, recurrence_rule, reminder_minutes) VALUES (?, ?, ?, ?, ?, ?)',
              [item.title, item.event_date, item.event_time || null, item.description || null, item.recurrence_rule || null, item.reminder_minutes || null]
            );
            toolResultsText += `\nNarzędzie ADD_CALENDAR_EVENT zwróciło: Success, Event ID: ${res.id}`;
          }
        
        } else if (toolCall.function.name === 'UPDATE_CALENDAR_EVENT') {
          const itemsToProcess = args.items && args.items.length > 0 ? args.items : [args];
          for (const item of itemsToProcess) {
            const updates = [];
            const values = [];
            if (item.title) { updates.push('title = ?'); values.push(item.title); }
            if (item.event_date) { updates.push('event_date = ?'); values.push(item.event_date); }
            if (item.event_time) { updates.push('event_time = ?'); values.push(item.event_time); }
            if (item.description) { updates.push('description = ?'); values.push(item.description); }
            
            if (updates.length > 0 && item.id) {
              let ids = Array.isArray(item.id) ? item.id : (typeof item.id === 'string' && item.id.includes(',') ? item.id.split(',') : [item.id]);
              for (const id of ids) {
                await executeRun(`UPDATE calendar_events SET ${updates.join(', ')} WHERE id = ?`, [...values, parseInt(id, 10)]);
              }
            }
          }
          toolResultsText += `\nNarzędzie UPDATE_CALENDAR_EVENT zwróciło: Success`;
        
        } else if (toolCall.function.name === 'PERFORM_OSINT_SCAN') {
          const res = await performOSINTScan(args.target);
          toolResultsText += "\nNarzędzie PERFORM_OSINT_SCAN zwróciło: " + JSON.stringify(res);
        } else if (toolCall.function.name === 'DELETE_CALENDAR_EVENT') {
          if (args.id) {
            let ids = Array.isArray(args.id) ? args.id : (typeof args.id === 'string' && args.id.includes(',') ? args.id.split(',') : [args.id]);
            for (const id of ids) {
              await executeRun('DELETE FROM calendar_events WHERE id = ?', [parseInt(id, 10)]);
            }
            toolResultsText += `\nNarzędzie DELETE_CALENDAR_EVENT zwróciło: Success, usunięto ID ${args.id}`;
          } else if (args.event_date) {
            await executeRun('DELETE FROM calendar_events WHERE event_date = ?', [args.event_date]);
            toolResultsText += `\nNarzędzie DELETE_CALENDAR_EVENT zwróciło: Success, usunięto datę ${args.event_date}`;
          } else {
            toolResultsText += `\nNarzędzie DELETE_CALENDAR_EVENT zwróciło: Error - brak id lub daty`;
          }
        } else if (toolCall.function.name === 'GET_CALENDAR_EVENTS') {
          const events = await executeQuery(
            'SELECT id, title, event_date, event_time, description, recurrence_rule, reminder_minutes FROM calendar_events WHERE event_date >= ? AND event_date <= ? ORDER BY event_date ASC',
            [args.start_date, args.end_date]
          );
          toolResultsText += `\nNarzędzie GET_CALENDAR_EVENTS zwróciło: ${JSON.stringify(events)}`;
        } else if (toolCall.function.name === 'ADD_BUG_REPORT') {
          try {
            const bugsFilePath = './BUGS.md';
            let content = '';
            if (fs.existsSync(bugsFilePath)) {
              content = fs.readFileSync(bugsFilePath, 'utf8');
            } else {
              content = "# Rejestr Błędów i Zadań Naprawczych (BUGS)\n\n## 🔴 Krytyczne Błędy do Naprawy\n*(brak)*\n\n## 🟡 Oczekujące Poprawki\n*(brak)*\n\n## 🟢 Zrealizowane (Archiwum)\n*(brak)*\n";
            }
            
            const timestamp = new Date().toLocaleDateString('pl-PL', { timeZone: 'Europe/Warsaw' }) + ' ' + new Date().toLocaleTimeString('pl-PL', { timeZone: 'Europe/Warsaw', hour: '2-digit', minute: '2-digit' });
            const entry = `- **[Dodano: ${timestamp}]** ${args.bug_description}\n`;
            
            if (args.severity === 'krytyczne') {
               if (content.includes("## 🔴 Krytyczne Błędy do Naprawy\n*(brak)*")) {
                 content = content.replace("## 🔴 Krytyczne Błędy do Naprawy\n*(brak)*", "## 🔴 Krytyczne Błędy do Naprawy\n" + entry);
               } else {
                 content = content.replace("## 🔴 Krytyczne Błędy do Naprawy\n", "## 🔴 Krytyczne Błędy do Naprawy\n" + entry);
               }
            } else {
               if (content.includes("## 🟡 Oczekujące Poprawki\n*(brak)*")) {
                 content = content.replace("## 🟡 Oczekujące Poprawki\n*(brak)*", "## 🟡 Oczekujące Poprawki\n" + entry);
               } else {
                 content = content.replace("## 🟡 Oczekujące Poprawki\n", "## 🟡 Oczekujące Poprawki\n" + entry);
               }
            }
            
            fs.writeFileSync(bugsFilePath, content);
            toolResultsText += `\nNarzędzie ADD_BUG_REPORT zwróciło: Sukces, dodano raport do pliku BUGS.md`;
          } catch (e) {
            toolResultsText += `\nNarzędzie ADD_BUG_REPORT zwróciło: Error - ${e.message}`;
          }
        }
      }

      messages.push({ 
        role: 'system', 
        content: toolResultsText + "\n\nCRITICAL: Zwróć obiekt JSON z kluczami 'intent', 'payload' oraz OBOWIĄZKOWO 'agent_response' zawierający pełną, tekstową odpowiedź (Markdown)."
      });

      chatCompletion = await fetchGroqCompletion({
        messages,
        response_format: { type: 'json_object' },
        temperature: 0.6,
        max_tokens: 1000,
      });
      responseMessage = chatCompletion.choices[0]?.message;
      
    } else {
      try {
        JSON.parse(extractJSON(responseMessage.content));
      } catch {
        const toolList = agentTools.map(t => t.function.name).join(', ');
        messages.push({ role: 'system', content: `Dostępne narzędzia: ${toolList}. Pamiętaj o wymogu zwrócenia prawidłowego formatu JSON { "intent": "...", "payload": {}, "agent_response": "..." }. Klucz 'agent_response' jest obowiązkowy!` });
        chatCompletion = await fetchGroqCompletion({
          messages,
          response_format: { type: 'json_object' },
          temperature: 0.6,
          max_tokens: 1000,
        });
        responseMessage = chatCompletion.choices[0]?.message;
      }
    }

    const parsed = JSON.parse(extractJSON(responseMessage?.content || '{}'));
    
    if (typeof parsed.agent_response === 'object') {
      parsed.agent_response = JSON.stringify(parsed.agent_response);
    }

    if (!parsed.agent_response || parsed.agent_response.trim() === '' || parsed.agent_response.trim() === '{}') {
      const rawContent = responseMessage?.content?.trim() || "";
      if (rawContent && rawContent !== '{}' && !rawContent.startsWith('{')) {
        parsed.agent_response = rawContent;
      } else {
        parsed.agent_response = "Przetworzyłem Twoje żądanie, ale wystąpił błąd w generowaniu odpowiedzi tekstowej (utracono format).";
      }
    }

    if (!parsed.intent) {
      parsed.intent = 'general_conversation';
    }

    if (!toolUsed) {
      if (parsed.intent === 'add_task' && parsed.payload?.title) {
        const { title, target_date, target_time, priority, category, recurrence_rule } = parsed.payload;
        const rec = await executeRun(
          'INSERT INTO tasks (title, target_date, target_time, priority, category, recurrence_rule) VALUES (?, ?, ?, ?, ?, ?)',
          [title, target_date || today, target_time || '12:00', priority || 'MEDIUM', category || 'jednorazowe', recurrence_rule || null]
        );
        if (recurrence_rule && category === 'powtarzalne') registerRecurringJob(title, recurrence_rule, rec.id);
      } else if (parsed.intent === 'delete_task' && parsed.payload?.task_id) {
        if (parsed.payload.task_id === 'all') {
          await executeRun('DELETE FROM tasks');
        } else if (Array.isArray(parsed.payload.task_id)) {
          for (const id of parsed.payload.task_id) {
            await executeRun('DELETE FROM tasks WHERE id = ?', [parseInt(id, 10)]);
          }
        } else {
          await executeRun('DELETE FROM tasks WHERE id = ?', [parseInt(parsed.payload.task_id, 10)]);
        }
      } else if (parsed.intent === 'update_task' && parsed.payload?.task_id && parsed.payload?.status) {
        if (Array.isArray(parsed.payload.task_id)) {
          for (const id of parsed.payload.task_id) {
            await executeRun('UPDATE tasks SET status = ? WHERE id = ?', [parsed.payload.status, parseInt(id, 10)]);
          }
        } else {
          await executeRun('UPDATE tasks SET status = ? WHERE id = ?', [parsed.payload.status, parseInt(parsed.payload.task_id, 10)]);
        }
      }
    }

    if (toolUsed && messages.some(m => m.content.includes('Narzędzie executeWebSearch zwróciło:'))) {
        parsed.intent = 'search_news';
        const searchResRaw = messages.find(m => m.content.includes('Narzędzie executeWebSearch zwróciło:'))?.content;
        try {
            const arrMatch = searchResRaw.split('Narzędzie executeWebSearch zwróciło: ')[1];
            parsed.payload = JSON.parse(arrMatch);
            if (!parsed.agent_response || parsed.agent_response === "{}") {
                parsed.agent_response = parsed.payload.map(r => `**[${r.title}](${r.url})**\n${r.description}`).join('\n\n');
            }
        } catch(e) {}
    }

    if (mode === 'mentor' && parsed.mentor_thoughts) {
      try {
        await learnFact(parsed.mentor_thoughts, 'mentor_observation');
        console.log('[+] Zapisano myśli mentora do pamięci długoterminowej.');
      } catch (err) {
        console.error('[!] Błąd zapisu myśli mentora:', err);
      }
    }

    return parsed;
  } catch (error) {
    console.error('[!] ERROR: Błąd agenta:', error?.message || error);
    return {
      intent: 'unknown',
      agent_response: `[AWIA BŁĄD KRYTYCZNY] Wykryto zaporę, zrzucono pakiet: ${error?.message?.substring(0, 120)}. Spróbuj uderzyć jeszcze raz, Szefie.`,
    };
  }
}

export async function generateHourlySummary(weatherData, options = {}) {
  try {
    const userName = options.userName || 'Użytkownik';
    const today = new Date().toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Warsaw' });
    const nowHour = new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Warsaw' });
    const prompt = `Zrób krótkie, profesjonalne podsumowanie logów dla użytkownika (Imię: ${userName}). Data: ${today}, Godzina: ${nowHour}. Pogoda: ${JSON.stringify(weatherData)}. Bądź zwięzły i rzeczowy.`;
    const completion = await fetchGroqCompletion({
      messages: [
        { role: 'system', content: 'Jesteś asystentem System. Mów profesjonalnie i naturalnie.' },
        { role: 'user', content: prompt },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
    });
    return completion.choices[0]?.message?.content || 'System nominalny. Przestrzeń zabezpieczona.';
  } catch {
    return 'Brak wizji na matrix. System stabilny mimo to.';
  }
}
