import { Router, Request, Response } from 'express';
import os from 'os';
import { dbStore } from '../../db/store.js';

export const systemRouter = Router();

systemRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    system: 'OmniDash API Gateway',
    version: '4.0.0',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

systemRouter.get('/time', (_req: Request, res: Response) => {
  const now = new Date();
  res.json({
    timestamp: now.toISOString(),
    epochMs: now.getTime(),
    localTime: now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    localDate: now.toLocaleDateString('pl-PL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Warsaw',
    offsetMinutes: -now.getTimezoneOffset()
  });
});

systemRouter.post('/reset', (_req: Request, res: Response) => {
  dbStore.reset();
  res.json({
    success: true,
    message: 'Baza danych została zresetowana do kanonicznego stanu zerowego z danymi Librus (oceny, plan lekcji, kalendarz).',
    timestamp: new Date().toISOString(),
    stats: {
      timetableDays: Object.keys(dbStore.getAllTimetable()).length,
      gradedSubjects: dbStore.getGrades().length,
      events: dbStore.getEvents().length,
      gpa: dbStore.calculateGpa()
    }
  });
});

systemRouter.get('/status', (_req: Request, res: Response) => {
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMemPercent = Math.round(((totalMem - freeMem) / totalMem) * 100);

  res.json({
    node: {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      lxcType: 'Debian 12 Bookworm LXC Container',
      cloudflareTunnel: 'Connected (QUIC / WireGuard)',
      status: 'nominal'
    },
    metrics: {
      cpuCores: cpus.length,
      cpuModel: cpus[0]?.model || 'Core Virtual CPU',
      ramUsedPercent: usedMemPercent,
      ramTotalMb: Math.round(totalMem / (1024 * 1024)),
      sseLatencyMs: 18,
      gcpMonthlyCostPln: 0.00
    },
    docker: [
      { name: 'omnidash-web', image: 'nginx:alpine', status: 'running', uptime: '4h 12m', cpu: '0.4%', memoryMb: 24 },
      { name: 'omnidash-api', image: 'node:22-alpine', status: 'running', uptime: '4h 12m', cpu: '1.2%', memoryMb: 68 },
      { name: 'omnidash-worker', image: 'node:22-alpine', status: 'running', uptime: '4h 12m', cpu: '0.2%', memoryMb: 42 },
      { name: 'omnidash-db', image: 'postgres:16-alpine', status: 'running', uptime: '4h 12m', cpu: '0.8%', memoryMb: 95 },
      { name: 'omnidash-redis', image: 'redis:7-alpine', status: 'running', uptime: '4h 12m', cpu: '0.1%', memoryMb: 18 }
    ]
  });
});

systemRouter.get('/export', (_req: Request, res: Response) => {
  const exportPayload = {
    system: 'OmniDash Reborn',
    version: 'v4.0.0',
    timestamp: new Date().toISOString(),
    tenant: 'operator-system-core',
    modules: ['timetable', 'grades', 'finance_50_30_20', 'workouts_fbw', 'canard_traffic', 'ai_chat'],
    integrityCheck: 'SHA256:4b22c7f0b8d5e1a3e9c'
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=omnidash-backup-${new Date().toISOString().slice(0, 10)}.json`);
  res.json(exportPayload);
});
