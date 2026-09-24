import express from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiLimiter } from './middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

const router = express.Router();
export const activeSessions = new Set();

router.post('/login', apiLimiter, (req, res) => {
  const { pin } = req.body;
  if (pin === process.env.DASHBOARD_PIN) {
    const token = crypto.randomBytes(32).toString('hex');
    activeSessions.add(token);
    res.json({ success: true, token });
  } else {
    res.status(401).json({ error: 'Nieprawidłowy PIN' });
  }
});

router.get('/verify', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (activeSessions.has(token)) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Brak autoryzacji' });
  }
});

router.post('/change-pin', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!activeSessions.has(token)) return res.status(401).json({ error: 'Brak autoryzacji' });
  
  const { oldPin, newPin } = req.body;
  if (oldPin !== process.env.DASHBOARD_PIN) {
    return res.status(400).json({ error: 'Stary PIN jest nieprawidłowy' });
  }
  
  process.env.DASHBOARD_PIN = newPin;
  let envContent = fs.readFileSync(path.resolve(rootDir, '.env'), 'utf8');
  envContent = envContent.replace(new RegExp(`DASHBOARD_PIN=.*`), `DASHBOARD_PIN=${newPin}`);
  fs.writeFileSync(path.resolve(rootDir, '.env'), envContent);
  
  res.json({ success: true });
});

export const authMiddleware = (req, res, next) => {
  if (req.path.startsWith('/auth/')) return next();
  if (req.path.startsWith('/firebase/status')) return next();
  if (req.path.startsWith('/firebase/verify-owner')) return next();
  if (req.path.startsWith('/system/keys')) return next();
  if (req.path.startsWith('/phone/')) return next();
  if (req.path.startsWith('/voice/tts')) return next();
  if (req.path.startsWith('/gcp/budget-webhook')) return next();

  // Weryfikacja poświadczeń systemowych dla skryptów wewnętrznych i mikroserwisów
  const candidate = req.headers['x-system-pin'] || req.headers['x-internal-key'];
  if (candidate) {
    const candidateBuf = Buffer.from(String(candidate));
    const validKeys = [
      process.env.INTERNAL_SERVICE_KEY,
      process.env.SESSION_SECRET,
      process.env.DASHBOARD_PIN
    ].filter(Boolean);

    for (const key of validKeys) {
      const keyBuf = Buffer.from(String(key));
      if (candidateBuf.length === keyBuf.length && crypto.timingSafeEqual(candidateBuf, keyBuf)) {
        return next();
      }
    }
  }

  const token = req.headers.authorization?.split(' ')[1];
  if (activeSessions.has(token)) return next();
  res.status(401).json({ error: 'Brak autoryzacji' });
};

export default router;
