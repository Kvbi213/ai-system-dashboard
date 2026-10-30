import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { isOriginAllowed } from './core/corsConfig.js';
import { authMiddleware } from './core/authMiddleware.js';

import { authRouter } from './domains/auth/router.js';
import { systemRouter } from './domains/system/router.js';
import { tasksRouter } from './domains/tasks/router.js';
import { financeRouter } from './domains/finance/router.js';
import { workoutsRouter } from './domains/workouts/router.js';
import { trafficRouter } from './domains/traffic/router.js';
import { schoolRouter } from './domains/school/router.js';
import { newsRouter } from './domains/news/router.js';
import { aiRouter } from './domains/ai/router.js';
import { osintRouter } from './domains/osint/router.js';
import { pushbulletRouter } from './domains/pushbullet/router.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:']
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'x-dev-bypass']
  })
);

app.use(express.json({ limit: '25mb' }));

// Auth guard on /api
app.use('/api', authMiddleware);

// Domain Routes
app.use('/api/auth', authRouter);
app.use('/api/system', systemRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/finance', financeRouter);
app.use('/api/workouts', workoutsRouter);
app.use('/api/traffic', trafficRouter);
app.use('/api/school', schoolRouter);
app.use('/api/news', newsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/osint', osintRouter);
app.use('/api/pushbullet', pushbulletRouter);

// Global Error Handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[!] API Gateway Error:', err);
  res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[+] SUCCESS :: OmniDash API Gateway listening on port ${PORT}`);
  });
}

export default app;
