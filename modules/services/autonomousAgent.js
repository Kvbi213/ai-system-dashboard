import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import { executeWebSearch } from '../search.js';
import { sendPushNotification } from '../pushbullet.js';
import { executeQuery, executeRun } from '../database.js';

dotenv.config();

const groq = new Groq({ 
  apiKey: process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY || 'unconfigured',
  dangerouslyAllowBrowser: true 
});

export const AGENT_MODELS = [
  'openai/gpt-oss-120b',
  'llama-3.3-70b-versatile',
  'qwen/qwen3-32b'
];

/**
 * Wywołuje Groq LLM z automatycznym fallbackiem modeli
 */
export async function callAgentLLM(messages, temperature = 0.3, maxTokens = 1200) {
  for (const model of AGENT_MODELS) {
    try {
      const response = await groq.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      });
      return response.choices?.[0]?.message?.content || '';
    } catch (err) {
      console.warn(`[AutonomousAgent] Błąd modelu ${model}:`, err.message);
    }
  }
  throw new Error('Wszystkie modele LLM dla agenta zawiodły.');
}

/**
 * Sprawdza czy tekst jest pytaniem o status / stan pracy ze smartfona
 */
export function isStatusInquiry(text) {
  if (!text || typeof text !== 'string') return false;
  const t = text.trim().toLowerCase();
  const keywords = [
    'stan', 'status', 'jak idzie', 'jak tam', 'co robisz', 'co tam',
    'ile jeszcze', 'postęp', 'postep', 'raport', 'jak leci', 'na jakim etapie',
    'gdzie jesteś', 'co robisz teraz', 'stan pracy'
  ];
  return keywords.some(kw => t === kw || t.startsWith(kw + ' ') || t.endsWith(' ' + kw) || t.includes(kw));
}

/**
 * Sprawdza czy tekst jest poleceniem zatrzymania / anulowania
 */
export function isAbortCommand(text) {
  if (!text || typeof text !== 'string') return false;
  const t = text.trim().toLowerCase();
  const stopKeywords = ['stop', 'zatrzymaj', 'anuluj', 'przerwij', 'pauza', 'stój', 'stoj', 'kill'];
  return stopKeywords.some(kw => t === kw || t.startsWith(kw + ' '));
}

/**
 * Wykrywa czy wiadomość ze smartfona jest zleceniem nowego zadania
 */
export function extractTaskFromPhone(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  const prefixes = [
    /^omni:\s*/i,
    /^agent:\s*/i,
    /^zadanie:\s*/i,
    /^zbadaj:\s*/i,
    /^zbadaj\s+/i,
    /^przebadaj\s+/i,
    /^sprawdź\s+/i,
    /^research:\s*/i
  ];

  for (const prefix of prefixes) {
    if (prefix.test(trimmed)) {
      return trimmed.replace(prefix, '').trim();
    }
  }

  // Jeśli tekst zawiera bezpośrednie czasowniki zlecające
  if (lower.startsWith('znajdź ') || lower.startsWith('analizuj ') || lower.startsWith('poszukaj ')) {
    return trimmed;
  }

  return null;
}

/**
 * Dekomponuje złożony cel badawczy na 2 do 4 logicznych kroków Brave Search
 */
export async function decomposeGoal(goal) {
  const prompt = `Jesteś Autonomicznym Planistą Badawczym w systemie OmniDash.
Użytkownik zlecił cel badawczy: "${goal}"

Twoim zadaniem jest dekompozycja tego celu na 2 do 4 konkretnych, odrębnych zapytań do wyszukiwarki internetowej (Brave Search), które pozwolą zebrać kompleksowe dane.

Zwróć WYŁĄCZNIE poprawny obiekt JSON o strukturze:
{
  "title": "Krótki tytuł badania (np. Przyszłość Modeli AI)",
  "steps": [
    {
      "step": 1,
      "query": "precyzyjne zapytanie do Brave Search po angielsku lub polsku",
      "focus": "krótki opis co badamy w tym kroku (np. Plany i roadmap OpenAI GPT-5)"
    },
    ...
  ]
}`;

  try {
    const raw = await callAgentLLM([
      { role: 'system', content: 'Zwracaj wyłącznie czysty JSON bez formatowania markdown.' },
      { role: 'user', content: prompt }
    ], 0.2, 800);

    const jsonText = raw.substring(raw.indexOf('{'), raw.lastIndexOf('}') + 1);
    const parsed = JSON.parse(jsonText);
    if (Array.isArray(parsed.steps) && parsed.steps.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.warn('[AutonomousAgent] Fallback dekompozycji celu:', err.message);
  }

  // Fallback gdyby LLM nie zwrócił poprawnego JSON
  return generateFallbackPlan(goal);
}

/**
 * Generuje deterministyczny, awaryjny plan badawczy bez użycia sieci
 */
export function generateFallbackPlan(goal) {
  return {
    title: (goal || 'Badanie').substring(0, 40),
    steps: [
      { step: 1, query: `${goal} roadmap 2026`, focus: 'Główne trendy i kierunki rozwoju' },
      { step: 2, query: `${goal} news analysis`, focus: 'Najnowsze analizy branżowe' }
    ]
  };
}

/**
 * Tworzy nowe zadanie agenta w bazie danych
 */
export async function createAgentJob(goal, options = {}) {
  const plan = await decomposeGoal(goal);
  const totalSteps = plan.steps.length;
  const initialLog = JSON.stringify({
    title: plan.title,
    steps: plan.steps,
    currentStepIndex: 0,
    collectedData: []
  });

  let jobId = null;

  try {
    const res = await executeRun(
      `INSERT INTO agent_jobs (goal, status, priority, current_step, progress_percent, max_iterations, execution_log, notify_mode)
       VALUES (?, 'queued', ?, ?, 0, ?, ?, ?)`,
      [
        goal,
        options.priority || 'MEDIUM',
        `Przygotowano plan: ${totalSteps} etapów`,
        totalSteps,
        initialLog,
        options.notify_mode || 'milestones'
      ]
    );
    jobId = res.id;
  } catch (err) {
    console.warn('[AutonomousAgent] Zapis do SQLite niemożliwy, używam trybu in-memory:', err.message);
    jobId = Date.now();
  }

  // Powiadomienie wstępne na telefon
  if (options.notify_mode !== 'none') {
    const initialMsg = `Rozpoczęto zadanie badawcze: "${plan.title}"\n• Zaplanowano etapów: ${totalSteps}\n• Krok 1: ${plan.steps[0].focus}`;
    await sendPushNotification(`[OmniAgent 🤖] Przyjęto Cel`, initialMsg).catch(() => {});
  }

  return { jobId, plan };
}

/**
 * Pobiera aktualnie aktywne zadanie z bazy
 */
export async function getActiveJob() {
  try {
    const rows = await executeQuery(
      `SELECT * FROM agent_jobs WHERE status IN ('executing', 'queued') ORDER BY id DESC LIMIT 1`
    );
    if (rows && rows.length > 0) return rows[0];
  } catch (err) {
    // Ignoruj jeśli tabela SQLite nie istnieje
  }
  return null;
}

/**
 * Obsługuje natychmiastowe zapytanie o stan pracy (np. przez Pushbullet lub Web)
 */
export async function handleStatusInquiry() {
  const job = await getActiveJob();
  if (!job) {
    const emptyMsg = `Aktualnie brak aktywnych zadań w kolejce.\n• Wszystkie badania zakończone.\n• Możesz zlecić nowe zadanie pisząc np. "Omni: zbadaj..."`;
    await sendPushNotification(`[OmniAgent 🤖] Raport Stanu`, emptyMsg).catch(() => {});
    return { status: 'idle', message: emptyMsg };
  }

  let log = {};
  try { log = JSON.parse(job.execution_log || '{}'); } catch (e) {}

  const currentStep = job.current_step || 'Przetwarzanie danych...';
  const progress = job.progress_percent || 0;
  const sourcesCount = log.collectedData?.reduce((acc, step) => acc + (step.resultsCount || 0), 0) || 0;

  const statusMsg = `• Zadanie: ${log.title || job.goal}\n• Status: W TRAKCIE (${progress}%)\n• Bieżący etap: ${currentStep}\n• Zebrane źródła: ${sourcesCount}\n• Iteracja: ${job.iteration_count || 0}/${job.max_iterations || 10}`;

  await sendPushNotification(`[OmniAgent 🤖] Stan Pracy na Żywo`, statusMsg).catch(() => {});
  return { status: 'executing', job, message: statusMsg };
}

/**
 * Anuluje lub wstrzymuje bieżące zadanie
 */
export async function abortActiveJob() {
  const job = await getActiveJob();
  if (!job) {
    const msg = `Brak aktywnego zadania do zatrzymania.`;
    await sendPushNotification(`[OmniAgent 🤖] Status`, msg).catch(() => {});
    return { success: false, message: msg };
  }

  try {
    await executeRun(
      `UPDATE agent_jobs SET status = 'paused', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [job.id]
    );
  } catch (err) {}

  const confirmMsg = `Zadanie "${job.goal}" zostało natychmiast zatrzymane (Emergency Stop).`;
  await sendPushNotification(`[OmniAgent 🤖] Zatrzymano Pracę ⏹️`, confirmMsg).catch(() => {});
  return { success: true, message: confirmMsg };
}

/**
 * Realizuje pojedynczy krok pętli badawczej lub całe zadanie
 */
export async function runNextAgentStep(providedJob = null) {
  const job = providedJob || await getActiveJob();
  if (!job) return { finished: true, message: 'Brak zadań w kolejce' };

  let log = { title: job.goal, steps: [], currentStepIndex: 0, collectedData: [] };
  try {
    if (job.execution_log) log = JSON.parse(job.execution_log);
  } catch (e) {}

  const steps = log.steps || [];
  const currentIndex = log.currentStepIndex || 0;

  // Sprawdź czy zakończono wszystkie kroki
  if (currentIndex >= steps.length) {
    return await completeJob(job, log);
  }

  const stepData = steps[currentIndex];
  const stepNumber = currentIndex + 1;
  const totalSteps = steps.length;

  console.log(`[AutonomousAgent] Realizacja kroku ${stepNumber}/${totalSteps}: "${stepData.query}" (${stepData.focus})`);

  // Aktualizacja stanu na 'executing'
  const progressPercent = Math.round((currentIndex / totalSteps) * 100);
  const stepDescription = `Krok ${stepNumber}/${totalSteps}: ${stepData.focus}`;

  try {
    await executeRun(
      `UPDATE agent_jobs SET status = 'executing', current_step = ?, progress_percent = ?, iteration_count = iteration_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [stepDescription, progressPercent, job.id]
    );
  } catch (err) {}

  // 1. Wyszukiwanie Brave Search
  const searchResults = await executeWebSearch(stepData.query, { count: 5 });
  console.log(`[AutonomousAgent] Brave Search zwrócił ${searchResults.length} wyników.`);

  // 2. Cząstkowa synteza kognitywna
  const synthesisPrompt = `Jesteś analitykiem w systemie OmniDash.
Badany cel: "${job.goal}"
Aktualny obszar badania: "${stepData.focus}"
Wyniki z internetu:
${searchResults.map((r, i) => `${i + 1}. [${r.title}] (${r.url})\n   ${r.description}`).join('\n\n')}

Przygotuj zwięzłą syntezę (maksymalnie 3 kluczowe punkty/fakty). Pisz konkretnie i technicznie po polsku.`;

  let stepSummary = '';
  try {
    stepSummary = await callAgentLLM([
      { role: 'system', content: 'Odpowiadaj w zwięzłych podpunktach.' },
      { role: 'user', content: synthesisPrompt }
    ], 0.3, 500);
  } catch (err) {
    stepSummary = `Zebrano ${searchResults.length} źródeł dla zapytania: ${stepData.query}.`;
  }

  // Zapisz do pamięci zadania
  log.collectedData.push({
    step: stepNumber,
    focus: stepData.focus,
    query: stepData.query,
    resultsCount: searchResults.length,
    summary: stepSummary
  });
  log.currentStepIndex = currentIndex + 1;

  const nextProgress = Math.round((log.currentStepIndex / totalSteps) * 100);

  try {
    await executeRun(
      `UPDATE agent_jobs SET execution_log = ?, progress_percent = ?, current_step = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [JSON.stringify(log), nextProgress, `Ukończono: ${stepData.focus}`, job.id]
    );
  } catch (err) {}

  // 3. Powiadomienie etapowe na telefon (Milestone Push)
  if (job.notify_mode === 'milestones' || job.notify_mode === 'stream') {
    const milestoneTitle = `[OmniAgent 🤖] Etap ${stepNumber}/${totalSteps}`;
    const milestoneBody = `• Obszar: ${stepData.focus}\n${stepSummary}\n• Postęp: ${nextProgress}%`;
    await sendPushNotification(milestoneTitle, milestoneBody).catch(() => {});
  }

  // Jeśli to był ostatni krok, zamknij zadanie
  if (log.currentStepIndex >= totalSteps) {
    return await completeJob(job, log);
  }

  return { finished: false, step: stepNumber, totalSteps, nextProgress };
}

/**
 * Kończy zadanie i wysyła pełny raport końcowy
 */
async function completeJob(job, log) {
  console.log(`[AutonomousAgent] Wszystkie kroki wykonane. Generowanie raportu końcowego...`);

  const summaryPrompt = `Jesteś Głównym Analitykiem AI w systemie OmniDash.
Użytkownik zlecił cel badawczy: "${job.goal}"

Oto wyniki zebrane w kolejnych etapach:
${log.collectedData.map(d => `--- ETAP: ${d.focus} ---\n${d.summary}`).join('\n\n')}

Sporządź ostateczny, ekspercki raport podsumowujący.
Układ:
1. Wnioski kluczowe (Kto ma najlepszą pozycję/przyszłość i dlaczego).
2. Podsumowanie planów i roadmap.
3. Rekomendacja końcowa.

Raport musi być konkretny, czytelny, z punktorami.`;

  let finalReport = '';
  try {
    finalReport = await callAgentLLM([
      { role: 'system', content: 'Generuj ustrukturyzowany, czytelny raport końcowy w Markdown.' },
      { role: 'user', content: summaryPrompt }
    ], 0.3, 1000);
  } catch (err) {
    finalReport = log.collectedData.map(d => `• ${d.focus}: ${d.summary}`).join('\n');
  }

  try {
    await executeRun(
      `UPDATE agent_jobs SET status = 'completed', progress_percent = 100, current_step = 'Zadanie zrealizowane', result_summary = ?, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [finalReport, job.id]
    );
  } catch (err) {}

  // Wysłanie raportu końcowego na smartfon
  const reportPushTitle = `[OmniAgent 🤖] Raport Końcowy: ${log.title || 'Badanie'}`;
  await sendPushNotification(reportPushTitle, finalReport).catch(() => {});

  return { finished: true, resultSummary: finalReport };
}

/**
 * Uruchamia całe zadanie w pętli do końca (dla środowiska Node/Server)
 */
export async function runFullResearchJob(goal, options = {}) {
  const { jobId, plan } = await createAgentJob(goal, options);
  let status = { finished: false };
  let iterations = 0;
  const maxIterations = (plan.steps?.length || 3) + 2;

  while (!status.finished && iterations < maxIterations) {
    iterations++;
    const job = await getActiveJob();
    if (!job || job.status === 'paused') break;
    status = await runNextAgentStep(job);
    if (!status.finished) {
      // Krótka pauza 1.5s między zapytaniami by nie przeciążać API
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  return status;
}
