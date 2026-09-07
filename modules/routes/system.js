import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { executeRun, executeQuery } from '../database.js';
import { logError } from '../scheduler.js';
import { clients } from '../emitter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

const router = express.Router();

router.get('/keys-status', (req, res) => {
  const missing = [];
  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'twój-klucz-groq' || process.env.GROQ_API_KEY.trim() === '') missing.push('GROQ_API_KEY');
  
  // Brave & Pushbullet are optional, bypass strict requirement
  
  if (!process.env.DASHBOARD_PIN || process.env.DASHBOARD_PIN === 'twój-pin' || process.env.DASHBOARD_PIN.trim() === '') missing.push('DASHBOARD_PIN');

  res.json({ success: true, missing });
});

router.post('/keys', (req, res) => {
  const { groq, brave, pushbullet, pin } = req.body;
  let envContent = '';
  try {
    envContent = fs.readFileSync(path.resolve(rootDir, '.env'), 'utf8');
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

  fs.writeFileSync(path.resolve(rootDir, '.env'), envContent);
  res.json({ success: true });
});

router.post('/reset', async (req, res) => {
  try {
    await executeRun('DELETE FROM tasks');
    await executeRun('DELETE FROM system_logs');
    await executeRun('DELETE FROM user_memory');
    await executeRun('DELETE FROM calendar_events');
    await executeRun('DELETE FROM phone_notifications');

    let envContent = fs.readFileSync(path.resolve(rootDir, '.env'), 'utf8');
    ['GROQ_API_KEY', 'BRAVE_SEARCH_API_KEY', 'PUSHBULLET_API_KEY', 'DASHBOARD_PIN'].forEach(key => {
      envContent = envContent.replace(new RegExp(`^${key}=.*`, 'm'), `${key}=`);
      delete process.env[key];
    });
    fs.writeFileSync(path.resolve(rootDir, '.env'), envContent);

    res.json({ success: true });
  } catch (err) {
    logError('POST /api/system/reset', err);
    res.status(500).json({ error: 'Błąd resetowania systemu.' });
  }
});

router.get('/metrics', async (req, res) => {
  const os = await import('os');
  const metrics = {
    cpu: os.loadavg()[0].toFixed(2),
    memory: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(1),
    uptime: (os.uptime() / 3600).toFixed(1),
    platform: os.platform()
  };
  res.json(metrics);
});

export default router;
