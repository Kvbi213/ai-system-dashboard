import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { processUserIntent, MODEL_FALLBACK_CHAIN, transcribeAudio } from '../agent.js';
import { logError } from '../scheduler.js';
import { apiLimiter } from './middleware.js';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import { getActiveJob, createAgentJob, abortActiveJob, handleStatusInquiry, runFullResearchJob } from '../services/autonomousAgent.js';
import { executeQuery } from '../database.js';

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

router.post('/voice/tts', async (req, res) => {
  const { engine = 'edge', text, voiceId, apiKey } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Brak tekstu do syntezy' });
  }

  // Sanityzacja długości wejścia
  const safeText = text.substring(0, 4000);

  try {
    // 1. SILNIK MICROSOFT EDGE NEURAL (DARMOWY / STUDIO QUALITY)
    if (engine === 'edge' || !engine) {
      const targetVoice = voiceId || 'pl-PL-MarekNeural';
      const tts = new MsEdgeTTS();
      await tts.setMetadata(targetVoice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
      const { audioStream } = tts.toStream(safeText);

      const chunks = [];
      audioStream.on('data', chunk => chunks.push(chunk));
      audioStream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.send(buffer);
      });
      audioStream.on('error', (err) => {
        logError('POST /api/voice/tts (EdgeTTS)', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Błąd generowania głosu Edge TTS' });
        }
      });
      return;
    }

    if (engine === 'elevenlabs') {
      const key = apiKey || process.env.ELEVENLABS_API_KEY;
      if (!key) {
        return res.status(400).json({ error: 'Brak klucza API ElevenLabs' });
      }

      const targetVoice = voiceId || 'pNInz6obpgDQGcFmaJgB';
      const elRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${targetVoice}`, {
        method: 'POST',
        headers: {
          'xi-api-key': key,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        body: JSON.stringify({
          text: safeText,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8
          }
        })
      });

      if (!elRes.ok) {
        const errText = await elRes.text();
        return res.status(elRes.status).json({ error: `Błąd ElevenLabs API: ${errText}` });
      }

      res.setHeader('Content-Type', 'audio/mpeg');
      const arrayBuffer = await elRes.arrayBuffer();
      return res.send(Buffer.from(arrayBuffer));
    }

    if (engine === 'openai') {
      const key = apiKey || process.env.OPENAI_API_KEY;
      if (!key) {
        return res.status(400).json({ error: 'Brak klucza API OpenAI' });
      }

      const oaRes = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: safeText,
          voice: voiceId || 'onyx'
        })
      });

      if (!oaRes.ok) {
        const errText = await oaRes.text();
        return res.status(oaRes.status).json({ error: `Błąd OpenAI TTS: ${errText}` });
      }

      res.setHeader('Content-Type', 'audio/mpeg');
      const arrayBuffer = await oaRes.arrayBuffer();
      return res.send(Buffer.from(arrayBuffer));
    }

    return res.status(400).json({ error: 'Nieobsługiwany silnik syntezy TTS' });
  } catch (err) {
    logError('POST /api/voice/tts', err);
    return res.status(500).json({ error: 'Wystąpił błąd podczas syntezy mowy' });
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

// Endpointy Autonomicznego Agenta Badawczego (OmniDaemon)
router.get('/agent/jobs', async (req, res) => {
  try {
    const jobs = await executeQuery('SELECT * FROM agent_jobs ORDER BY id DESC LIMIT 10');
    const active = await getActiveJob();
    res.json({ active, jobs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/agent/research', async (req, res) => {
  const { goal, priority, notify_mode } = req.body;
  if (!goal) return res.status(400).json({ error: 'Wymagany parametr goal.' });
  try {
    runFullResearchJob(goal, { priority, notify_mode }).catch(err => {
      console.error('[!] Błąd zadania badawczego:', err);
    });
    res.json({ success: true, message: `Rozpoczęto badanie w tle: "${goal}"` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/agent/abort', async (req, res) => {
  try {
    const result = await abortActiveJob();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/agent/status-inquiry', async (req, res) => {
  try {
    const result = await handleStatusInquiry();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
