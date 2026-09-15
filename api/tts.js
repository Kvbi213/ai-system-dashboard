import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, xi-api-key'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metoda niedozwolona. Użyj POST.' });
  }

  const { engine = 'edge', text, voiceId, apiKey } = req.body || {};
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Brak tekstu do syntezy' });
  }

  const safeText = text.substring(0, 4000);

  try {
    // 1. Silnik Microsoft Edge Neural (Studio / Darmowy)
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
        res.status(200).send(buffer);
      });
      audioStream.on('error', (err) => {
        console.error('[API Voice TTS] Błąd EdgeTTS:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Błąd generowania głosu Edge TTS' });
        }
      });
      return;
    }

    // 2. Silnik ElevenLabs
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
      return res.status(200).send(Buffer.from(arrayBuffer));
    }

    // 3. Silnik OpenAI TTS
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
      return res.status(200).send(Buffer.from(arrayBuffer));
    }

    return res.status(400).json({ error: 'Nieobsługiwany silnik syntezy TTS' });
  } catch (err) {
    console.error('[API Voice TTS] Błąd wykonania:', err);
    return res.status(500).json({ error: 'Wystąpił błąd podczas syntezy mowy' });
  }
}
