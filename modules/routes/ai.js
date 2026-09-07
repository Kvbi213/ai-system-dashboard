import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { processUserIntent, MODEL_FALLBACK_CHAIN, transcribeAudio } from '../agent.js';
import { logError } from '../scheduler.js';
import { apiLimiter } from './middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

const router = express.Router();

router.post('/agent', apiLimiter, async (req, res) => {
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

router.post('/voice/transcribe', apiLimiter, async (req, res) => {
  const { audioData, language } = req.body;
  if (!audioData) return res.status(400).json({ error: 'Brak danych audio' });
  if (audioData.length > 20000000) return res.status(413).json({ error: 'Plik audio jest zbyt duży' });
  
  const tmpPath = path.resolve(rootDir, `temp_audio_${crypto.randomUUID()}.webm`);
  try {
    const base64Content = audioData.split(';base64,').pop();
    const buffer = Buffer.from(base64Content, 'base64');
    fs.writeFileSync(tmpPath, buffer);
    
    const text = await transcribeAudio(tmpPath, language || 'pl');
    res.json({ text });
  } catch (err) {
    logError('POST /api/voice/transcribe', err);
    res.status(500).json({ error: 'Błąd transkrypcji' });
  } finally {
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
  }
});

router.get('/models/status', async (req, res) => {
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

router.get('/models', async (req, res) => {
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

router.post('/models/active', (req, res) => {
  const { modelId } = req.body;
  if (!modelId) return res.status(400).json({ error: 'Brak modelId' });
  
  const idx = MODEL_FALLBACK_CHAIN.indexOf(modelId);
  if (idx !== -1) MODEL_FALLBACK_CHAIN.splice(idx, 1);
  MODEL_FALLBACK_CHAIN.unshift(modelId);
  
  try {
    const agentPath = path.resolve(rootDir, 'modules/agent.js');
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

export default router;
