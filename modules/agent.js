import Groq from 'groq-sdk';
import { exec } from 'child_process';
import { executeQuery, executeRun } from './database.js';
import { fetchWeather, registerRecurringJob } from './scheduler.js';
import { broadcastEvent } from './emitter.js';
import { executeWebSearch } from './search.js';
import { readProjectFile, scanProjectDirectory } from './fs_explorer.js';
import { learnFact, getUserProfile } from './memory.js';
import { performOSINTScan } from './osint.js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'unconfigured_key' });

import { getSystemPrompt, getMentorPrompt } from './ai/prompts.js';

import { agentTools } from './ai/tools.js';

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

export async function transcribeAudio(filePath, lang = "pl") {
  try {
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-large-v3",
      language: lang,
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
    const [weatherData, tasks, logs, userProfile, calendarEvents, notifications, financeBalance, recentFinances, financeSettings, bucketSpending, workouts] = await Promise.all([
      fetchWeather().catch(() => null),
      executeQuery('SELECT id, title, status, priority, target_date, category FROM tasks ORDER BY created_at DESC LIMIT 10'),
      executeQuery('SELECT type, content, created_at FROM system_logs ORDER BY created_at DESC LIMIT 5'),
      getUserProfile(),
      executeQuery('SELECT id, title, event_date, description FROM calendar_events WHERE event_date >= date("now") ORDER BY event_date ASC LIMIT 5'),
      executeQuery('SELECT COUNT(*) as count FROM phone_notifications WHERE is_read = 0'),
      executeQuery('SELECT SUM(CASE WHEN type="income" THEN amount ELSE -amount END) as balance FROM finances'),
      executeQuery('SELECT type, amount, category, description, transaction_date FROM finances ORDER BY transaction_date DESC LIMIT 3'),
      executeQuery('SELECT * FROM finance_settings ORDER BY id DESC LIMIT 1'),
      executeQuery('SELECT bucket, SUM(CASE WHEN type="income" THEN amount ELSE -amount END) as balance FROM finances WHERE bucket IS NOT NULL AND strftime("%Y-%m", transaction_date) = strftime("%Y-%m", "now") GROUP BY bucket'),
      executeQuery('SELECT * FROM workouts ORDER BY date DESC LIMIT 5')
    ]);

    const systemContext = `
[LIVE SYSTEM DATA - ${today}]
WEATHER: ${JSON.stringify(weatherData)}
RECENT TASKS: ${JSON.stringify(tasks)}
UPCOMING CALENDAR EVENTS: ${JSON.stringify(calendarEvents)}
RECENT LOGS: ${JSON.stringify(logs)}
FINANCIAL BALANCE: ${financeBalance[0]?.balance || 0} PLN
FINANCE SETTINGS (Income/Buckets): ${JSON.stringify(financeSettings[0] || {})}
CURRENT MONTH BUCKET BALANCES: ${JSON.stringify(bucketSpending || [])} (Pokazuje ile masz odłożone w danym kubełku)
RECENT FINANCES: ${JSON.stringify(recentFinances)}
RECENT WORKOUTS: ${JSON.stringify(workouts || [])}
UNREAD PHONE NOTIFICATIONS COUNT: ${notifications[0]?.count || 0} (Użyj narzędzia GET_PHONE_NOTIFICATIONS, by je przeczytać)
NEWS PREFERENCES: Operator preferuje wiadomości z kategorii: ${options.newsCategories ? options.newsCategories.join(', ') : 'ai, security'}. Kiedy używasz narzędzia executeWebSearch by pobrać newsy, zawsze buduj zapytanie (query) tak, by zawierało nazwy tych preferowanych kategorii!

[OPERATOR PROFILE / LONG-TERM MEMORY]
Wiedza o użytkowniku zebrana podczas wcześniejszych interakcji:
${userProfile}

Pamiętaj: Bądź pomocny i profesjonalny. Jeśli wykonujesz akcję, poinformuj o tym w sposób rzeczowy i uprzejmy. Użyj narzędzia LEARN_FACT jeśli użytkownik zdradzi coś interesującego o sobie, co może przydać się w przyszłości.
`;

    const activePrompt = (mode === 'mentor' ? getMentorPrompt(userName) : getSystemPrompt(userName) + systemContext) + `\n\nCRITICAL INSTRUCTION: You MUST respond in the following language code: ${options.language || 'pl'}.`;

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

        } else if (toolCall.function.name === 'CHANGE_UI_TAB') {
          broadcastEvent('navigate', { path: args.tab });
          toolResultsText += `\nNarzędzie CHANGE_UI_TAB: Sukces. Ekran zmieniony na ${args.tab}.`;

        } else if (toolCall.function.name === 'RUN_OSINT_SCAN') {
          toolResultsText += `\nNarzędzie RUN_OSINT_SCAN: Zlecono w tle (wynik będzie widoczny w zakładce OSINT, nie czekaj na niego).`;
          broadcastEvent('osint_scan_start', { target: args.target });

        } else if (toolCall.function.name === 'RELOAD_SYSTEM') {
          broadcastEvent('reload', {});
          toolResultsText += `\nNarzędzie RELOAD_SYSTEM: Zlecono odświeżenie strony użytkownika.`;

        } else if (toolCall.function.name === 'UPDATE_SYSTEM_SETTINGS') {
          // Na razie makieta zapisu do settings
          toolResultsText += `\nNarzędzie UPDATE_SYSTEM_SETTINGS: Ustawienia systemowe zaktualizowane pomyślnie.`;
          broadcastEvent('system_settings_updated', args);

        } else if (toolCall.function.name === 'UPDATE_FINANCE_SETTINGS') {
          await executeRun(
            'INSERT INTO finance_settings (monthly_income, needs_percent, wants_percent, savings_percent) VALUES (?, ?, ?, ?)',
            [args.monthly_income || 5000, args.needs_percent || 50, args.wants_percent || 30, args.savings_percent || 20]
          );
          toolResultsText += `\nNarzędzie UPDATE_FINANCE_SETTINGS: Ustawienia zaktualizowane.`;
          broadcastEvent('finance_settings_updated', {});

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
          
        } else if (toolCall.function.name === 'ADD_WORKOUT') {
          const rec = await executeRun(
            'INSERT INTO workouts (title, type, description, date) VALUES (?, ?, ?, ?)',
            [args.title, args.type || 'Inne', args.description || '', args.date]
          );
          toolResultsText += `\nNarzędzie ADD_WORKOUT zwróciło: Success, Workout ID: ${rec.id}`;

        } else if (toolCall.function.name === 'ADD_FINANCE_RECORD') {
          const rec = await executeRun(
            'INSERT INTO finances (type, amount, currency, category, bucket, description, transaction_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [args.type, args.amount, args.currency || 'PLN', args.category || 'Inne', args.bucket || null, args.description || '', args.transaction_date]
          );
          toolResultsText += `\nNarzędzie ADD_FINANCE_RECORD zwróciło: Success, Finance ID: ${rec.id}`;
          
        } else if (toolCall.function.name === 'TRANSFER_FUNDS') {
          const date = new Date().toISOString().split('T')[0];
          await executeRun(
            'INSERT INTO finances (type, amount, currency, category, bucket, description, transaction_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
            ['expense', args.amount, 'PLN', 'Transfer', args.from_bucket, `Transfer to ${args.to_bucket}`, date]
          );
          await executeRun(
            'INSERT INTO finances (type, amount, currency, category, bucket, description, transaction_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
            ['income', args.amount, 'PLN', 'Transfer', args.to_bucket, `Transfer from ${args.from_bucket}`, date]
          );
          toolResultsText += `\nNarzędzie TRANSFER_FUNDS zwróciło: Success, Przelano ${args.amount} z ${args.from_bucket} do ${args.to_bucket}.`;
          
        } else if (toolCall.function.name === 'DELETE_FINANCE_RECORD') {
          await executeRun('DELETE FROM finances WHERE id = ?', [parseInt(args.id, 10)]);
          toolResultsText += `\nNarzędzie DELETE_FINANCE_RECORD zwróciło: Success`;
          
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
        max_tokens: 4096,
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
          max_tokens: 4096,
        });
        responseMessage = chatCompletion.choices[0]?.message;
      }
    }

    let parsed = {};
    const rawContent = responseMessage?.content?.trim() || "";
    try {
      parsed = JSON.parse(extractJSON(rawContent || '{}'));
    } catch (e) {
      console.warn("[!] Błąd parsowania JSON, próba odzyskania tekstu...", e.message);
    }
    
    if (typeof parsed.agent_response === 'object') {
      parsed.agent_response = JSON.stringify(parsed.agent_response);
    }

    if (!parsed.agent_response || parsed.agent_response.trim() === '' || parsed.agent_response.trim() === '{}') {
      const match = rawContent.match(/"agent_response"\s*:\s*"([\s\S]*?)(?:"\s*(?:,|}|$))/);
      if (match && match[1]) {
        parsed.agent_response = match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
      } else if (rawContent && rawContent !== '{}' && !rawContent.startsWith('{')) {
        parsed.agent_response = rawContent;
      } else {
        parsed.agent_response = rawContent || "Błąd formatowania odpowiedzi.";
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

    if (mode === 'mentor' && parsed.delegate_to_worker) {
      console.log(`[*] INFO: Mentor deleguje zadanie do Workera: ${parsed.delegate_to_worker}`);
      try {
        const workerOptions = { ...options, isDelegated: true };
        const workerResponse = await processUserIntent(`[Zlecenie od Mentora działającego w imieniu użytkownika ${userName}]: ${parsed.delegate_to_worker}`, 'worker', workerOptions);
        
        parsed.agent_response += `\n\n---\n**🤖 Akcja Workera (Zlecona przez Mentora):**\n${workerResponse.agent_response}`;
        
        if (workerResponse.widgets && workerResponse.widgets.length > 0) {
            parsed.widgets = [...new Set([...(parsed.widgets || []), ...workerResponse.widgets])];
        }
        
        await executeRun("INSERT INTO system_logs (type, content) VALUES ('MENTOR_DELEGATION', ?)", [`Zlecono zadanie do workera: ${parsed.delegate_to_worker}`]);
      } catch (err) {
        console.error('[!] Błąd podczas delegacji do Workera:', err);
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

