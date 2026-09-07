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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Subsystems
initDB().then(() => {
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

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(`Express [${req.method} ${req.path}]`, err);
  res.status(500).json({ error: 'Wewnętrzny błąd serwera.', message: err.message });
});

app.listen(PORT, () => {
  console.log(`[+] SUCCESS: System API Gateway działa na porcie ${PORT}`);
});
