import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { executeQuery, executeRun } from './modules/database.js';
import { processUserIntent, MODEL_FALLBACK_CHAIN, transcribeAudio } from './modules/agent.js';
import { fetchWeather, runScheduler, getScheduleQueue, logError } from './modules/scheduler.js';
import { executeWebSearch } from './modules/search.js';
import { getAllFacts, deleteFact } from './modules/memory.js';
import { startPushbulletListener } from './modules/pushbullet.js';
import { performOSINTScan } from './modules/osint.js';
import { clients } from './modules/emitter.js';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ERROR_LOG = path.resolve(__dirname, 'docs/error.log');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '15mb' }));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuta
  max: 50,
  message: { error: 'Przekroczono limit zapytań API. Zwolnij.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Inicjalizacja schedulera
runScheduler();

// Inicjalizacja nasłuchu powiadomień z telefonu
startPushbulletListener();

// ── AUTHENTICATION ──────────────────────────────────────────────
const activeSessions = new Set();

app.post('/api/auth/login', apiLimiter, (req, res) => {
  const { pin } = req.body;
  if (pin === process.env.DASHBOARD_PIN) {
    const token = crypto.randomBytes(32).toString('hex');
    activeSessions.add(token);
    res.json({ success: true, token });
  } else {
    res.status(401).json({ error: 'Nieprawidłowy PIN' });
  }
});

app.get('/api/auth/verify', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (activeSessions.has(token)) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Brak autoryzacji' });
  }
});

app.post('/api/auth/change-pin', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!activeSessions.has(token)) return res.status(401).json({ error: 'Brak autoryzacji' });
  
  const { oldPin, newPin } = req.body;
  if (oldPin !== process.env.DASHBOARD_PIN) {
    return res.status(400).json({ error: 'Stary PIN jest nieprawidłowy' });
  }
  
  process.env.DASHBOARD_PIN = newPin;
  let envContent = fs.readFileSync(path.resolve(__dirname, '.env'), 'utf8');
  envContent = envContent.replace(new RegExp(`DASHBOARD_PIN=.*`), `DASHBOARD_PIN=${newPin}`);
  fs.writeFileSync(path.resolve(__dirname, '.env'), envContent);
  
  res.json({ success: true });
});

app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/auth/')) return next();
  if (req.path.startsWith('/system/keys')) return next();
  const token = req.headers.authorization?.split(' ')[1];
  if (activeSessions.has(token)) return next();
  res.status(401).json({ error: 'Brak autoryzacji' });
});

// ── SYSTEM CONFIGURATION ───────────────────────────────────────
app.get('/api/system/keys-status', (req, res) => {
  const missing = [];
  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'twój-klucz-groq' || process.env.GROQ_API_KEY.trim() === '') missing.push('GROQ_API_KEY');
  if (!process.env.BRAVE_SEARCH_API_KEY || process.env.BRAVE_SEARCH_API_KEY === 'twój-klucz-brave' || process.env.BRAVE_SEARCH_API_KEY.trim() === '') missing.push('BRAVE_SEARCH_API_KEY');
  if (!process.env.PUSHBULLET_API_KEY || process.env.PUSHBULLET_API_KEY === 'twój-klucz-pushbullet' || process.env.PUSHBULLET_API_KEY.trim() === '') missing.push('PUSHBULLET_API_KEY');
  
  if (!process.env.DASHBOARD_PIN || process.env.DASHBOARD_PIN === 'twój-pin' || process.env.DASHBOARD_PIN.trim() === '') missing.push('DASHBOARD_PIN');

  res.json({ success: true, missing });
});

app.post('/api/system/keys', (req, res) => {
  const { groq, brave, pushbullet, pin } = req.body;
  let envContent = '';
  try {
    envContent = fs.readFileSync(path.resolve(__dirname, '.env'), 'utf8');
  } catch (err) {
    envContent = '';
  }

  const updateOrAppend = (key, val) => {
    if (val && val.trim() !== '') {
      process.env[key] = val.trim();
      if (new RegExp(`^${key}=.*`, 'm').test(envContent)) {
        envContent = envContent.replace(new RegExp(`^${key}=.*`, 'm'), `${key}=${val.trim()}`);
      } else {
        envContent += `\n${key}=${val.trim()}`;
      }
    }
  };

  updateOrAppend('GROQ_API_KEY', groq);
  updateOrAppend('BRAVE_SEARCH_API_KEY', brave);
  updateOrAppend('PUSHBULLET_API_KEY', pushbullet);
  if (pin) updateOrAppend('DASHBOARD_PIN', pin);

  fs.writeFileSync(path.resolve(__dirname, '.env'), envContent);
  res.json({ success: true });
});

app.post('/api/system/reset', async (req, res) => {
  try {
    await executeRun('DELETE FROM tasks');
    await executeRun('DELETE FROM system_logs');
    await executeRun('DELETE FROM user_memory');
    await executeRun('DELETE FROM calendar_events');
    await executeRun('DELETE FROM phone_notifications');

    let envContent = fs.readFileSync(path.resolve(__dirname, '.env'), 'utf8');
    ['GROQ_API_KEY', 'BRAVE_SEARCH_API_KEY', 'PUSHBULLET_API_KEY', 'DASHBOARD_PIN'].forEach(key => {
      envContent = envContent.replace(new RegExp(`^${key}=.*`, 'm'), `${key}=`);
      delete process.env[key];
    });
    fs.writeFileSync(path.resolve(__dirname, '.env'), envContent);

    res.json({ success: true });
  } catch (err) {
    logError('POST /api/system/reset', err);
    res.status(500).json({ error: 'Błąd resetowania systemu.' });
  }
});

// ── OSINT ──────────────────────────────────────────────────────
app.post('/api/osint', apiLimiter, async (req, res) => {
  const { target } = req.body;
  if (!target) return res.status(400).json({ error: 'Brak podanego celu (target).' });
  const result = await performOSINTScan(target);
  res.json(result);
});

// ── SSE (Server-Sent Events) ───────────────────────────────────
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Ping klienta zaraz po podłączeniu, by wymusić wysłanie nagłówków
  res.write('event: ping\ndata: connected\n\n');

  clients.push(res);

  req.on('close', () => {
    const index = clients.indexOf(res);
    if (index !== -1) {
      clients.splice(index, 1);
    }
  });
});

// ── FINANCES ───────────────────────────────────────────────────
app.get('/api/finance/settings', async (req, res) => {
  try {
    const rows = await executeQuery('SELECT * FROM finance_settings ORDER BY id DESC LIMIT 1');
    if (rows.length === 0) {
      res.json(null);
    } else {
      res.json(rows[0]);
    }
  } catch (err) {
    logError('GET /api/finance/settings', err);
    res.status(500).json({ error: 'Błąd pobierania ustawień finansowych.' });
  }
});

app.post('/api/finance/settings', async (req, res) => {
  const { monthly_income, needs_percent, wants_percent, savings_percent } = req.body;
  try {
    await executeRun('DELETE FROM finance_settings'); // Zostawiamy tylko jedne aktualne ustawienia
    const result = await executeRun(
      'INSERT INTO finance_settings (monthly_income, needs_percent, wants_percent, savings_percent) VALUES (?, ?, ?, ?)',
      [monthly_income, needs_percent, wants_percent, savings_percent]
    );
    res.json({ success: true, id: result.id });
  } catch (err) {
    logError('POST /api/finance/settings', err);
    res.status(500).json({ error: 'Błąd zapisu ustawień finansowych.' });
  }
});

app.get('/api/finances', async (req, res) => {
  try {
    const rows = await executeQuery('SELECT * FROM finances ORDER BY transaction_date DESC');
    res.json(rows);
  } catch (err) {
    logError('GET /api/finances', err);
    res.status(500).json({ error: 'Błąd pobierania finansów.' });
  }
});

app.post('/api/finances', async (req, res) => {
  const { type, amount, currency, category, bucket, description, transaction_date } = req.body;
  if (!type || !amount || !transaction_date) {
    return res.status(400).json({ error: 'Brak wymaganych pól (type, amount, transaction_date).' });
  }
  try {
    const result = await executeRun(
      'INSERT INTO finances (type, amount, currency, category, bucket, description, transaction_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [type, amount, currency || 'PLN', category || 'Inne', bucket || null, description || '', transaction_date]
    );
    res.json({ success: true, id: result.id });
  } catch (err) {
    logError('POST /api/finances', err);
    res.status(500).json({ error: 'Błąd dodawania wpisu finansowego.' });
  }
});

app.delete('/api/finances/:id', async (req, res) => {
  try {
    await executeRun('DELETE FROM finances WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    logError('DELETE /api/finances/:id', err);
    res.status(500).json({ error: 'Błąd usuwania wpisu finansowego.' });
  }
});

// ── AGENT ──────────────────────────────────────────────────────
app.post('/api/agent', apiLimiter, async (req, res) => {
  const { text, mode, newsCategories, userName } = req.body;
  if (!text) return res.status(400).json({ error: 'Brak tekstu wejściowego.' });
  console.log(`[*] INFO: Otrzymano zapytanie do agenta: ${text} [Tryb: ${mode || 'worker'}] od: ${userName || 'Użytkownik'}`);
  try {
    const result = await processUserIntent(text, mode, { newsCategories, userName });
    res.json(result);
  } catch (err) {
    logError('POST /api/agent', err);
    res.status(500).json({ error: 'Błąd przetwarzania agenta.' });
  }
});

app.get('/api/model/status', async (req, res) => {
  const start = performance.now();
  try {
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
      signal: AbortSignal.timeout(5000)
    });
    const end = performance.now();
    if (!response.ok) throw new Error('API offline');
    res.json({ status: 'online', latency: Math.round(end - start), model: MODEL_FALLBACK_CHAIN[0] });
  } catch (err) {
    res.json({ status: 'offline', latency: 999, model: MODEL_FALLBACK_CHAIN[0] });
  }
});

// ── VOICE TRANSCRIPTION ────────────────────────────────────────
app.post('/api/voice/transcribe', apiLimiter, async (req, res) => {
  const { audioData } = req.body;
  if (!audioData) return res.status(400).json({ error: 'Brak danych audio' });
  if (audioData.length > 20000000) return res.status(413).json({ error: 'Plik audio jest zbyt duży' });
  
  const tmpPath = path.resolve(__dirname, `temp_audio_${crypto.randomUUID()}.webm`);
  try {
    const base64Content = audioData.split(';base64,').pop();
    const buffer = Buffer.from(base64Content, 'base64');
    fs.writeFileSync(tmpPath, buffer);
    
    const text = await transcribeAudio(tmpPath);
    res.json({ text });
  } catch (err) {
    logError('POST /api/voice/transcribe', err);
    res.status(500).json({ error: 'Błąd transkrypcji' });
  } finally {
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
  }
});

// ── PHONE WEBHOOK (API FOR UI WIDGET) ────────────────────────
app.get('/api/phone/notifications', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const notifications = await executeQuery('SELECT * FROM phone_notifications ORDER BY created_at DESC LIMIT ?', [limit]);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── WORKOUTS ───────────────────────────────────────────────────
app.get('/api/workouts', async (req, res) => {
  try {
    const workouts = await executeQuery('SELECT * FROM workouts ORDER BY date DESC, created_at DESC');
    res.json(workouts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/workouts', async (req, res) => {
  try {
    const { title, type, description, date } = req.body;
    const result = await executeRun(
      'INSERT INTO workouts (title, type, description, date) VALUES (?, ?, ?, ?)',
      [title, type || 'Inne', description || '', date || new Date().toISOString().split('T')[0]]
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/workouts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await executeRun('DELETE FROM workouts WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── MEMORY ─────────────────────────────────────────────────────
app.get('/api/memory', async (req, res) => {
  const facts = await getAllFacts();
  res.json({ facts });
});

app.delete('/api/memory/:id', async (req, res) => {
  const result = await deleteFact(req.params.id);
  if (result.success) res.json(result);
  else res.status(500).json(result);
});

app.get('/api/models', async (req, res) => {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) throw new Error('API offline');
    const data = await response.json();
    res.json({
      models: data.data,
      activeModel: MODEL_FALLBACK_CHAIN[0],
      fallbackChain: MODEL_FALLBACK_CHAIN
    });
  } catch (err) {
    res.status(500).json({ error: 'Nie udało się pobrać modeli' });
  }
});

app.post('/api/models/active', (req, res) => {
  const { modelId } = req.body;
  if (!modelId) return res.status(400).json({ error: 'Brak modelId' });
  
  const idx = MODEL_FALLBACK_CHAIN.indexOf(modelId);
  if (idx !== -1) MODEL_FALLBACK_CHAIN.splice(idx, 1);
  MODEL_FALLBACK_CHAIN.unshift(modelId);
  
  try {
    const agentPath = path.resolve(__dirname, 'modules/agent.js');
    let content = fs.readFileSync(agentPath, 'utf8');
    const regex = /export const MODEL_FALLBACK_CHAIN = \[([\s\S]*?)\];/;
    const newArrayStr = "export const MODEL_FALLBACK_CHAIN = [\n  " + MODEL_FALLBACK_CHAIN.map(m => `'${m}'`).join(',\n  ') + "\n];";
    content = content.replace(regex, newArrayStr);
    fs.writeFileSync(agentPath, content, 'utf8');
  } catch (err) {
    console.error('[!] Błąd zapisu do agent.js:', err);
  }
  
  res.json({ success: true, activeModel: MODEL_FALLBACK_CHAIN[0], fallbackChain: MODEL_FALLBACK_CHAIN });
});

// ── WEATHER ────────────────────────────────────────────────────
app.get('/api/weather', async (req, res) => {
  try {
    const weather = await fetchWeather();
    if (weather) res.json(weather);
    else res.status(503).json({ error: 'Nie udało się pobrać danych pogodowych.' });
  } catch (err) {
    logError('GET /api/weather', err);
    res.status(500).json({ error: 'Błąd serwera pogody.' });
  }
});

app.get('/api/weather/raw', async (req, res) => {
  try {
    const lat = req.query.lat || 53.96;
    const lon = req.query.lon || 18.53;
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,precipitation_probability,weathercode&forecast_days=1&timezone=Europe%2FWarsaw`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: true });
  }
});

// ── IT NEWS (proxy do Brave Search) ────────────────────────────
app.get('/api/news', async (req, res) => {
  const query = req.query.q || 'AI technology news 2026';
  try {
    const results = await executeWebSearch(query);
    res.json({ results });
  } catch (err) {
    logError('GET /api/news', err);
    res.status(500).json({ error: 'Błąd pobierania newsów.', results: [] });
  }
});

// ── NEWS BRIEF (ostatnie podsumowanie AI) ──────────────────────
app.get('/api/news-brief', async (req, res) => {
  try {
    const rows = await executeQuery(
      "SELECT content, created_at FROM system_logs WHERE type = 'agent_summary' ORDER BY created_at DESC LIMIT 1"
    );
    res.json(rows[0] || { content: 'Brak podsumowania.', created_at: null });
  } catch (err) {
    logError('GET /api/news-brief', err);
    res.status(500).json({ error: 'Błąd pobierania podsumowania.' });
  }
});

// ── TASKS ──────────────────────────────────────────────────────
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await executeQuery('SELECT * FROM tasks ORDER BY created_at DESC');
    res.json(tasks);
  } catch (err) {
    logError('GET /api/tasks', err);
    res.status(500).json({ error: 'Błąd pobierania zadań.' });
  }
});

app.post('/api/tasks', async (req, res) => {
  const { title, target_date, target_time, priority, category, recurrence_rule } = req.body;
  
  if (!title || typeof title !== 'string' || title.length > 500) {
    return res.status(400).json({ error: 'Nieprawidłowy lub zbyt długi tytuł zadania.' });
  }
  const validPriorities = ['HIGH', 'MEDIUM', 'LOW'];
  const p = validPriorities.includes(priority) ? priority : 'MEDIUM';
  try {
    const result = await executeRun(
      'INSERT INTO tasks (title, target_date, target_time, priority, category, recurrence_rule) VALUES (?, ?, ?, ?, ?, ?)',
      [title, target_date || null, target_time || null, p, category || 'jednorazowe', recurrence_rule || null]
    );
    res.json({ success: true, id: result.id });
  } catch (err) {
    logError('POST /api/tasks', err);
    res.status(500).json({ error: 'Błąd dodawania zadania.' });
  }
});

app.patch('/api/tasks/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await executeRun('UPDATE tasks SET status = ? WHERE id = ?', [status, id]);
    res.json({ success: true });
  } catch (err) {
    logError('PATCH /api/tasks/:id/status', err);
    res.status(500).json({ error: 'Błąd aktualizacji zadania.' });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (id === 'all') await executeRun('DELETE FROM tasks');
    else await executeRun('DELETE FROM tasks WHERE id = ?', [parseInt(id, 10)]);
    res.json({ success: true });
  } catch (err) {
    logError('DELETE /api/tasks/:id', err);
    res.status(500).json({ error: 'Błąd usuwania zadania.' });
  }
});

// ── CALENDAR ────────────────────────────────────────────────────
app.get('/api/calendar', async (req, res) => {
  try {
    const events = await executeQuery('SELECT * FROM calendar_events ORDER BY event_date ASC');
    res.json(events);
  } catch (err) {
    logError('GET /api/calendar', err);
    res.status(500).json({ error: 'Błąd pobierania kalendarza.' });
  }
});

app.post('/api/calendar', async (req, res) => {
  const { title, event_date, event_time, description, recurrence_rule, reminder_minutes } = req.body;
  try {
    const result = await executeRun(
      'INSERT INTO calendar_events (title, event_date, event_time, description, recurrence_rule, reminder_minutes) VALUES (?, ?, ?, ?, ?, ?)',
      [title, event_date, event_time || null, description || null, recurrence_rule || null, reminder_minutes || null]
    );
    res.json({ success: true, id: result.id });
  } catch (err) {
    logError('POST /api/calendar', err);
    res.status(500).json({ error: 'Błąd dodawania wydarzenia.' });
  }
});

app.delete('/api/calendar/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (id === 'all') await executeRun('DELETE FROM calendar_events');
    else await executeRun('DELETE FROM calendar_events WHERE id = ?', [parseInt(id, 10)]);
    res.json({ success: true });
  } catch (err) {
    logError('DELETE /api/calendar/:id', err);
    res.status(500).json({ error: 'Błąd usuwania wydarzenia.' });
  }
});

// ── SCHEDULE ───────────────────────────────────────────────────
app.get('/api/schedule', (req, res) => {
  try {
    const queue = getScheduleQueue();
    res.json({ jobs: queue, count: queue.length });
  } catch (err) {
    logError('GET /api/schedule', err);
    res.status(500).json({ error: 'Błąd pobierania kolejki schedulera.' });
  }
});

// ── SYSTEM METRICS ─────────────────────────────────────────────
import os from 'os';

app.get('/api/system/metrics', (req, res) => {
  try {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const ramUsage = (usedMem / totalMem) * 100;
    
    // Simplistic CPU load using loadavg (works well on UNIX, but on Windows loadavg might return [0,0,0]).
    // We can also compute based on os.cpus() times, but let's just use a basic approach.
    const cpus = os.cpus();
    let totalIdle = 0, totalTick = 0;
    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });
    // This is an average since boot. For a real 1-second interval, we'd need to store previous tick.
    // We'll calculate average usage since boot for simplicity, or we can use a mock delta if we want it to look dynamic.
    const cpuUsage = 100 - ~~(100 * totalIdle / totalTick);

    res.json({
      cpu: cpuUsage,
      ram: Math.round(ramUsage),
      uptime: os.uptime(),
      platform: os.platform()
    });
  } catch (err) {
    logError('GET /api/system/metrics', err);
    res.status(500).json({ error: 'Błąd pobierania metryk systemowych.' });
  }
});

// ── LOGS ───────────────────────────────────────────────────────
app.get('/api/logs', async (req, res) => {
  try {
    const logs = await executeQuery(
      "SELECT * FROM system_logs WHERE type = 'agent_summary' ORDER BY created_at DESC LIMIT 5"
    );
    res.json(logs);
  } catch (err) {
    logError('GET /api/logs', err);
    res.status(500).json({ error: 'Błąd pobierania logów.' });
  }
});

// ── GLOBAL ERROR MIDDLEWARE ────────────────────────────────────
app.use((err, req, res, next) => {
  logError(`Express [${req.method} ${req.path}]`, err);
  res.status(500).json({ error: 'Wewnętrzny błąd serwera.', message: err.message });
});

app.listen(PORT, () => {
  console.log(`[+] SUCCESS: System API Gateway działa na porcie ${PORT}`);
});
