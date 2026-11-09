import { Router, Request, Response } from 'express';
import { dbStore } from '../../db/store.js';
import { sqliteStore } from '../../db/sqliteStore.js';
import { AUTOMATION_TEMPLATES } from './automationTemplates.js';
import { executeScript, calculateLessonInfo, buildScriptContext } from './scriptEngine.js';
import { getWarsawTime } from './timeUtils.js';

export const automationRouter = Router();

// Templates
automationRouter.get('/templates', (_req: Request, res: Response) => {
  res.json({ templates: AUTOMATION_TEMPLATES });
});

// Context status
automationRouter.get('/context-status', (_req: Request, res: Response) => {
  const now = new Date();
  const warsaw = getWarsawTime(now);
  const lessonInfo = calculateLessonInfo(now);
  const currentDay = warsaw.day >= 1 && warsaw.day <= 5 ? warsaw.day : 1;
  const lessons = dbStore.getTimetable(currentDay);
  const exams = dbStore.getEvents().filter((e) => e.date === warsaw.dateKey);

  res.json({
    now: now.toISOString(),
    formattedTime: warsaw.formattedTime,
    dayOfWeek: warsaw.day,
    lessonInfo,
    todayLessonsCount: lessons.length,
    todayExamsCount: exams.length,
    todayExams: exams
  });
});

// Scripts CRUD
automationRouter.get('/scripts', (_req: Request, res: Response) => {
  res.json({ scripts: dbStore.getAutomationScripts() });
});

automationRouter.get('/scripts/:id', (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
  const script = dbStore.getAutomationScript(id);
  if (!script) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Skrypt automatyzacji nie został znaleziony.' });
    return;
  }
  res.json({ script });
});

automationRouter.post('/scripts', (req: Request, res: Response) => {
  const { id, name, description, templateId, enabled, triggerType, cronExpression, code } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: 'INVALID_NAME', message: 'Nazwa skryptu jest wymagana.' });
    return;
  }
  if (!code || typeof code !== 'string' || !code.trim()) {
    res.status(400).json({ error: 'INVALID_CODE', message: 'Kod skryptu nie może być pusty.' });
    return;
  }

  const saved = dbStore.saveAutomationScript({
    id,
    name: name.trim(),
    description: description ? description.trim() : undefined,
    templateId: templateId || 'template_custom_script',
    enabled: enabled !== undefined ? !!enabled : true,
    triggerType: triggerType || 'interval',
    cronExpression: cronExpression ? cronExpression.trim() : undefined,
    code: code.trim()
  });

  try {
    sqliteStore.saveAutomationScript(saved);
  } catch (err: any) {
    console.warn(`[!] Ostrzeżenie zapisu skryptu do SQLite: ${err.message}`);
  }

  res.status(201).json({ script: saved });
});

automationRouter.patch('/scripts/:id/toggle', (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
  const toggled = dbStore.toggleAutomationScript(id);
  if (!toggled) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Skrypt automatyzacji nie został znaleziony.' });
    return;
  }
  try {
    sqliteStore.saveAutomationScript(toggled);
  } catch {}
  res.json({ script: toggled });
});

automationRouter.delete('/scripts/:id', (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
  const success = dbStore.deleteAutomationScript(id);
  try {
    sqliteStore.deleteAutomationScript(id);
  } catch {}
  res.json({ success });
});

// Run script by id
automationRouter.post('/scripts/:id/run', async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
  const script = dbStore.getAutomationScript(id);
  if (!script) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Skrypt automatyzacji nie został znaleziony.' });
    return;
  }

  const customDate = req.body.simulatedDate ? new Date(req.body.simulatedDate) : undefined;
  const execution = await executeScript(script.code, customDate);

  const status = execution.success ? 'SUCCESS' : 'ERROR';
  const logStr = execution.logs.join('\n') + (execution.error ? `\n[BŁĄD]: ${execution.error}` : '');
  dbStore.updateAutomationScriptRunResult(id, status, logStr);

  res.json({
    scriptId: id,
    execution
  });
});

// Dry-run code preview
automationRouter.post('/preview', async (req: Request, res: Response) => {
  const { code, simulatedDate } = req.body;
  if (!code || typeof code !== 'string') {
    res.status(400).json({ error: 'INVALID_CODE', message: 'Wymagany jest kod do testu.' });
    return;
  }

  const customDate = simulatedDate ? new Date(simulatedDate) : undefined;
  const execution = await executeScript(code, customDate);
  res.json({ execution });
});
