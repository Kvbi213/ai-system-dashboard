import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { initDB } from './modules/database.js';
import { runScheduler } from './modules/scheduler.js';
import { startPushbulletListener } from './modules/pushbullet.js';

// Import routers
import authRouter, { authMiddleware } from './modules/routes/auth.js';
import systemRouter from './modules/routes/system.js';
import eventsRouter from './modules/routes/events.js';
import financeRouter from './modules/routes/finance.js';
import aiRouter from './modules/routes/ai.js';
import osintRouter from './modules/routes/osint.js';
import weatherRouter from './modules/routes/weather.js';
import newsRouter from './modules/routes/news.js';
import tasksRouter from './modules/routes/tasks.js';
import calendarRouter from './modules/routes/calendar.js';
import workoutsRouter from './modules/routes/workouts.js';
import memoryRouter from './modules/routes/memory.js';
import timetableRouter from './modules/routes/timetable.js';
import phoneRouter from './modules/routes/phone.js';
import logsRouter from './modules/routes/logs.js';
import firebaseRouter from './modules/routes/firebase.js';
import librusRouter from './modules/routes/librus.js';
import trafficRouter from './modules/routes/traffic.js';
import gcpBudgetRouter from './modules/routes/gcpBudget.js';
import { initGcpBudgetDb } from './modules/services/gcpBudgetService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5000',
  'https://void-potato-7721.web.app',
  'https://void-potato-7721.firebaseapp.com'
];

const envOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean)
  : [];

const allowedOrigins = new Set([...defaultAllowedOrigins, ...envOrigins]);

const corsOptions = {
  origin: (origin, callback) => {
    // Żądania z aplikacji mobilnych, curl, Electron i zadań lokalnych nie przesyłają nagłówka Origin
    if (!origin) return callback(null, true);
    
    // Ścisła weryfikacja domen produkcyjnych oraz lokalnych portów deweloperskich
    if (allowedOrigins.has(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }

    console.warn(`[!] SECURITY :: CORS :: Zablokowano nieautoryzowane źródło: ${origin}`);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-CSRF-Token', 'x-system-pin']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Subsystems
initDB().then(() => {
  initGcpBudgetDb();
  runScheduler();
  if (process.env.PUSHBULLET_API_KEY && process.env.PUSHBULLET_API_KEY !== 'twój-klucz-pushbullet') {
    startPushbulletListener();
  }
}).catch(err => {
  console.error('[!] Failed to initialize database:', err);
  process.exit(1);
});

// Global Auth Middleware
app.use('/api', authMiddleware);

// Mount Routers
app.use('/api/auth', authRouter);
app.use('/api/system', systemRouter);
app.use('/api/events', eventsRouter);
app.use('/api/finance', financeRouter);
app.use('/api', aiRouter);
app.use('/api/osint', osintRouter);
app.use('/api/weather', weatherRouter);
app.use('/api/news', newsRouter); // news-brief is also in newsRouter as /brief
app.use('/api/tasks', tasksRouter);
app.use('/api/calendar', calendarRouter); // schedule is /schedule inside calendarRouter
app.use('/api/workouts', workoutsRouter);
app.use('/api/timetable', timetableRouter);
app.use('/api/memory', memoryRouter);
app.use('/api/phone', phoneRouter);
app.use('/api/logs', logsRouter);
app.use('/api/firebase', firebaseRouter);
app.use('/api/librus', librusRouter);
app.use('/api/traffic', trafficRouter);
app.use('/api/gcp', gcpBudgetRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(`Express [${req.method} ${req.path}]`, err);
  res.status(500).json({ error: 'Wewnętrzny błąd serwera.', message: err.message });
});

app.listen(PORT, () => {
  console.log(`[+] SUCCESS: System API Gateway działa na porcie ${PORT}`);
});
