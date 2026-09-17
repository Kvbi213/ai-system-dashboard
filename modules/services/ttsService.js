/**
 * Advanced TTS Service - Wielosilnikowa Synteza Mowy AI
 * Obsługuje ElevenLabs (Hi-Fi), OpenAI TTS (Studio) oraz inteligentny
 * silnik Web Neural Engine (przeglądarkowy fallback).
 */

import { cleanTextForSpeech } from './wakeWordService.js';

const isCloudEnvironment = () => {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host.includes('web.app') || 
         host.includes('firebaseapp.com') || 
         host.includes('vercel.app') || 
         (host !== 'localhost' && host !== '127.0.0.1');
};

export const EDGE_DEFAULT_VOICES = [
  { id: 'pl-PL-MarekNeural', name: 'Marek (Męski - Studio Neural / Naturalny)' },
  { id: 'pl-PL-ZofiaNeural', name: 'Zofia (Damski - Studio Neural / Ciepły)' },
  { id: 'pl-PL-AgnieszkaNeural', name: 'Agnieszka (Damski - Naturalny)' },
  { id: 'en-US-ChristopherNeural', name: 'Christopher (Męski - Studio US English)' },
  { id: 'en-US-JennyNeural', name: 'Jenny (Damski - Studio US English)' }
];

export const ELEVENLABS_DEFAULT_VOICES = [
  { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger (Męski - Laid-Back, Resonant)' },
  { id: 'hpp4J3VqNfWAUOO0d1Us', name: 'Bella (Damski - Professional, Bright, Warm)' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah (Damski - Mature, Reassuring, Confident)' },
  { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura (Damski - Enthusiast, Quirky Attitude)' },
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie (Męski - Deep, Confident, Energetic)' },
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George (Męski - Warm Storyteller)' },
  { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Callum (Męski - Husky Trickster)' },
  { id: 'SAz9YHcvj6GT2YYXdXww', name: 'River (Neutralny - Relaxed, Informative)' },
  { id: 'SOYHLrjzK2X1ezoPC6cr', name: 'Harry (Męski - Fierce Warrior)' },
  { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam (Męski - Energetic Creator)' },
  { id: 'Xb7hH8MSUJpSbSDYk0k2', name: 'Alice (Damski - Clear, Engaging Educator)' },
  { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda (Damski - Knowledgable, Professional)' },
  { id: 'bIHbv24MWmeRgasZH58o', name: 'Will (Męski - Relaxed Optimist)' },
  { id: 'cgSgspJ2msm6clMCkdW9', name: 'Jessica (Damski - Playful, Bright, Warm)' },
  { id: 'cjVigY5qzO86Huf0OWal', name: 'Eric (Męski - Smooth, Trustworthy)' },
  { id: 'iP95p4xoKVk53GoZ742B', name: 'Chris (Męski - Charming, Down-to-Earth)' },
  { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian (Męski - Deep, Resonant and Comforting)' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel (Męski - Steady Broadcaster)' },
  { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily (Damski - Velvety Actress)' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam (Męski - Dominant, Firm)' },
  { id: 'pqHfZKP75CvOlQylNhV4', name: 'Bill (Męski - Wise, Mature, Balanced)' }
];

export async function fetchElevenLabsVoices(apiKey) {
  const key = apiKey || (typeof localStorage !== 'undefined' && localStorage.getItem('system_elevenlabs_api_key')) ||
              (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ELEVENLABS_API_KEY) ||
              (typeof process !== 'undefined' && process.env?.ELEVENLABS_API_KEY) || '';
  if (!key) return ELEVENLABS_DEFAULT_VOICES;

  try {
    const res = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'xi-api-key': key.trim(),
        'Accept': 'application/json'
      }
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.voices) && data.voices.length > 0) {
        const mapped = data.voices.map(v => ({
          id: v.voice_id,
          name: v.name,
          category: v.category || 'premade',
          description: v.description || ''
        }));
        if (typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem('cached_elevenlabs_voices', JSON.stringify(mapped));
          } catch {}
        }
        return mapped;
      }
    }
  } catch (err) {
    console.warn('[TTSService] Błąd pobierania dynamicznej listy głosów ElevenLabs:', err.message);
  }

  if (typeof localStorage !== 'undefined') {
    try {
      const cached = localStorage.getItem('cached_elevenlabs_voices');
      if (cached) return JSON.parse(cached);
    } catch {}
  }
  return ELEVENLABS_DEFAULT_VOICES;
}

export async function checkElevenLabsQuota(apiKey) {
  let key = apiKey;
  if (key === undefined) {
    key = (typeof localStorage !== 'undefined' && localStorage.getItem('system_elevenlabs_api_key')) ||
          (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ELEVENLABS_API_KEY) ||
          (typeof process !== 'undefined' && process.env?.ELEVENLABS_API_KEY) || '';
  }
  if (!key || !key.trim()) {
    return { hasKey: false, tier: 'brak', characterCount: 0, characterLimit: 0, remaining: 0, isExceeded: false };
  }

  try {
    const res = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
      method: 'GET',
      headers: {
        'xi-api-key': key.trim(),
        'Accept': 'application/json'
      }
    });

    if (res.ok) {
      const data = await res.json();
      const characterCount = Number(data.character_count || 0);
      const characterLimit = Number(data.character_limit || 10000);
      const remaining = Math.max(0, characterLimit - characterCount);
      const isExceeded = remaining <= 10 || data.status === 'quota_exceeded';
      const resetTimestamp = data.next_character_count_reset_unix;
      const resetDate = resetTimestamp ? new Date(resetTimestamp * 1000).toLocaleDateString('pl-PL') : null;

      const result = {
        hasKey: true,
        tier: data.tier || 'free',
        status: data.status || 'active',
        characterCount,
        characterLimit,
        remaining,
        isExceeded,
        resetDate,
        percentUsed: characterLimit > 0 ? Math.min(100, Math.round((characterCount / characterLimit) * 1000) / 10) : 0
      };

      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem('cached_elevenlabs_quota', JSON.stringify(result));
          if (isExceeded) {
            localStorage.setItem('elevenlabs_quota_exceeded', 'true');
          } else {
            localStorage.removeItem('elevenlabs_quota_exceeded');
          }
        } catch {}
      }

      return result;
    } else {
      const errText = await res.text();
      return {
        hasKey: true,
        error: `Błąd API (${res.status}): ${errText}`,
        isExceeded: res.status === 401 || res.status === 429
      };
    }
  } catch (err) {
    console.warn('[TTSService] Błąd sprawdzania limitu ElevenLabs:', err.message);
    if (typeof localStorage !== 'undefined') {
      try {
        const cached = localStorage.getItem('cached_elevenlabs_quota');
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return { hasKey: true, error: err.message, isExceeded: false };
  }
}


export const OPENAI_DEFAULT_VOICES = [
  { id: 'onyx', name: 'Onyx (Głęboki, męski)' },
  { id: 'alloy', name: 'Alloy (Zbalansowany, neutralny)' },
  { id: 'nova', name: 'Nova (Energetyczny, kobiecy)' },
  { id: 'echo', name: 'Echo (Spokojny, męski)' },
  { id: 'fable', name: 'Fable (Ekspresyjny, brytyjski)' },
  { id: 'shimmer', name: 'Shimmer (Czysty, kobiecy)' }
];

export const GOOGLE_DEFAULT_VOICES = [
  { id: 'pl-PL-Wavenet-B', name: 'Wavenet-B (Męski - Studio Naturalny)' },
  { id: 'pl-PL-Neural2-A', name: 'Neural2-A (Damski - Studio Ciepły)' },
  { id: 'pl-PL-Wavenet-C', name: 'Wavenet-C (Męski - Studio Zrównoważony)' },
  { id: 'pl-PL-Wavenet-A', name: 'Wavenet-A (Damski - Studio Czysty)' },
  { id: 'pl-PL-Wavenet-D', name: 'Wavenet-D (Męski - Studio Głęboki)' },
  { id: 'en-US-Journey-D', name: 'Journey-D (Męski - US Expressive)' },
  { id: 'en-US-Neural2-F', name: 'Neural2-F (Damski - US Expressive)' }
];

class TTSService {
  constructor() {
    this.currentAudio = null;
    this.currentUtterance = null;
    this.currentBlobUrl = null;
    this._isSpeaking = false;
    this.onEndCallbacks = new Set();
  }

  getEngine() {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('system_tts_engine');
      if (stored && stored !== 'web') return stored; // 'elevenlabs' | 'google' | 'edge' | 'openai'
    }
    // Domyślnie ElevenLabs jeśli skonfigurowany jest klucz, następnie Google Cloud lub Edge Neural
    if (this.getElevenLabsKey()) return 'elevenlabs';
    if (this.getGoogleApiKey()) return 'google';
    return 'edge';
  }

  setEngine(engine) {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem('system_tts_engine', engine);
  }

  getElevenLabsKey() {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('system_elevenlabs_api_key');
      if (stored && stored.trim()) return stored.trim();
    }
    const envKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ELEVENLABS_API_KEY) ||
                   (typeof process !== 'undefined' && process.env?.ELEVENLABS_API_KEY) ||
                   '';
    return envKey.trim();
  }

  getGoogleApiKey() {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('system_google_tts_api_key');
      if (stored && stored.trim()) return stored.trim();
    }
    const envKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_TTS_API_KEY) ||
                   (typeof process !== 'undefined' && process.env?.GOOGLE_TTS_API_KEY) ||
                   '';
    return envKey.trim();
  }

  getOpenAiKey() {
    if (typeof localStorage === 'undefined') return '';
    return localStorage.getItem('system_openai_tts_api_key') || '';
  }

  getVoiceId() {
    if (typeof localStorage === 'undefined') return '';
    const engine = this.getEngine();
    if (engine === 'google') {
      return localStorage.getItem('system_google_voice_id') || GOOGLE_DEFAULT_VOICES[0].id;
    }
    if (engine === 'edge') {
      return localStorage.getItem('system_edge_voice_id') || EDGE_DEFAULT_VOICES[0].id;
    }
    if (engine === 'elevenlabs') {
      return localStorage.getItem('system_elevenlabs_voice_id') || ELEVENLABS_DEFAULT_VOICES[0].id;
    }
    if (engine === 'openai') {
      return localStorage.getItem('system_openai_voice_id') || 'onyx';
    }
    return GOOGLE_DEFAULT_VOICES[0].id;
  }

  isSpeaking() {
    return this._isSpeaking;
  }

  stop() {
    this._isSpeaking = false;

    // Zatrzymanie odtwarzacza audio HTML5
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio.src = '';
      } catch {}
      this.currentAudio = null;
    }

    // Zwolnienie blob URL
    if (this.currentBlobUrl) {
      try {
        URL.revokeObjectURL(this.currentBlobUrl);
      } catch {}
      this.currentBlobUrl = null;
    }

    // Zatrzymanie syntezy Web Speech API
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    this.currentUtterance = null;
  }

  /**
   * Główna metoda odtwarzająca mowę z automatycznym wyborem silnika i fallbackiem
   */
  async speak(text, { engine: explicitEngine, voiceId: explicitVoiceId, apiKey: explicitApiKey, onStart, onEnd, onError } = {}) {
    this.stop();
    const clean = cleanTextForSpeech(text);
    if (!clean) {
      if (onEnd) onEnd();
      return;
    }

    let engine = explicitEngine || this.getEngine();
    if (engine === 'web') engine = 'edge';

    // 1. SILNIK ELEVENLABS (STUDIO HYPER-REALISTIC QUALITY)
    if (engine === 'elevenlabs') {
      const apiKey = explicitApiKey || this.getElevenLabsKey();
      const voiceId = explicitVoiceId || this.getVoiceId();

      try {
        await this.speakWithElevenLabs(clean, apiKey, voiceId, { onStart, onEnd, onError });
        return;
      } catch (err) {
        console.warn('[TTSService] Błąd ElevenLabs, przejście do silnika rezerwowego:', err.message);
        if (typeof window !== 'undefined' && (err.message.includes('limit') || err.message.includes('quota'))) {
          window.dispatchEvent(new CustomEvent('ttsQuotaExceeded', {
            detail: {
              engine: 'elevenlabs',
              message: err.message
            }
          }));
        }

        // Rezerwowy 1: Google Cloud Neural (jeśli skonfigurowany)
        const googleKey = this.getGoogleApiKey();
        if (googleKey) {
          try {
            await this.speakWithGoogle(clean, googleKey, localStorage.getItem('system_google_voice_id') || GOOGLE_DEFAULT_VOICES[0].id, { onStart, onEnd, onError });
            return;
          } catch (gErr) {
            console.warn('[TTSService] Błąd Google TTS fallback:', gErr.message);
          }
        }

        // Rezerwowy 2: Microsoft Edge Neural
        try {
          await this.speakWithEdgeTTS(clean, localStorage.getItem('system_edge_voice_id') || 'pl-PL-MarekNeural', { onStart, onEnd, onError });
          return;
        } catch (edgeErr) {
          console.warn('[TTSService] Błąd Edge TTS fallback:', edgeErr.message);
        }
      }
    }

    // 2. SILNIK GOOGLE CLOUD NEURAL (1 MLN ZNAKÓW / MC FREE TIER)
    if (engine === 'google') {
      const apiKey = explicitApiKey || this.getGoogleApiKey();
      const voiceId = explicitVoiceId || this.getVoiceId();

      try {
        await this.speakWithGoogle(clean, apiKey, voiceId, { onStart, onEnd, onError });
        return;
      } catch (err) {
        console.warn('[TTSService] Błąd Google TTS, próba przejścia do Edge TTS:', err.message);
        try {
          await this.speakWithEdgeTTS(clean, localStorage.getItem('system_edge_voice_id') || 'pl-PL-MarekNeural', { onStart, onEnd, onError });
          return;
        } catch (edgeErr) {
          console.warn('[TTSService] Błąd rezerwowego Edge TTS:', edgeErr.message);
        }
      }
    }

    // 3. SILNIK MICROSOFT EDGE NEURAL (BEZPŁATNY / STUDIO QUALITY)
    if (engine === 'edge') {
      const voiceId = explicitVoiceId || this.getVoiceId();
      try {
        await this.speakWithEdgeTTS(clean, voiceId, { onStart, onEnd, onError });
        return;
      } catch (err) {
        console.warn('[TTSService] Błąd Edge TTS, próba przejścia do Google TTS:', err.message);
        const googleKey = this.getGoogleApiKey();
        if (googleKey) {
          try {
            await this.speakWithGoogle(clean, googleKey, localStorage.getItem('system_google_voice_id') || GOOGLE_DEFAULT_VOICES[0].id, { onStart, onEnd, onError });
            return;
          } catch (gErr) {
            console.warn('[TTSService] Błąd rezerwowego Google TTS:', gErr.message);
          }
        }
      }
    }

    // 4. SILNIK OPENAI TTS
    if (engine === 'openai') {
      const apiKey = explicitApiKey || this.getOpenAiKey();
      const voiceId = explicitVoiceId || this.getVoiceId();

      try {
        await this.speakWithOpenAI(clean, apiKey, voiceId, { onStart, onEnd, onError });
        return;
      } catch (err) {
        console.warn('[TTSService] Błąd OpenAI TTS, próba przejścia do Edge TTS:', err.message);
        try {
          await this.speakWithEdgeTTS(clean, localStorage.getItem('system_edge_voice_id') || 'pl-PL-MarekNeural', { onStart, onEnd, onError });
          return;
        } catch (edgeErr) {
          console.warn('[TTSService] Błąd rezerwowego Edge TTS:', edgeErr.message);
        }
      }
    }

    // Zero drewnianych głosów Web Speech! Emitujemy błąd systemowy zamiast odtwarzania robotycznego głosu.
    const failError = new Error('Wszystkie dostępne silniki studyjnej syntezy mowy zgłosiły błąd.');
    console.error('[TTSService] Niepowodzenie syntezy mowy AI:', failError);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('systemAlert', {
        detail: {
          type: 'error',
          title: 'Błąd Syntezy Mowy AI',
          message: 'Nie udało się odtworzyć mowy z dostępnych silników studyjnych (ElevenLabs / Google Cloud / Edge Neural). Sprawdź połączenie i klucze API w Ustawieniach.'
        }
      }));
    }
    if (onError) onError(failError);
    else if (onEnd) onEnd();
  }

  /**
   * Synteza za pomocą ElevenLabs API (bezpośrednio z przeglądarki z fallbackiem na backend proxy)
   */
  async speakWithElevenLabs(text, apiKey, voiceId, { onStart, onEnd, onError }) {
    let audioBlob = null;
    const targetVoice = voiceId || ELEVENLABS_DEFAULT_VOICES[0].id;

    // 1. Bezpośrednie zapytanie z przeglądarki do ElevenLabs API (pełne wsparcie CORS na całym świecie)
    if (apiKey) {
      try {
        const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${targetVoice}`, {
          method: 'POST',
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg'
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.8
            }
          })
        });

        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('audio') || contentType.includes('mpeg') || contentType.includes('octet-stream')) {
            audioBlob = await res.blob();
          }
        } else {
          const errText = await res.text();
          console.warn(`[ElevenLabs API] Błąd ${res.status}:`, errText);

          // Precyzyjna detekcja wyczerpania limitu znaków konta (quota_exceeded)
          if (res.status === 401 || res.status === 429 || errText.includes('quota_exceeded') || errText.includes('exceeds your quota')) {
            let remainingCredits = 0;
            const match = errText.match(/(\d+)\s+credits?\s+remaining/i);
            if (match) remainingCredits = parseInt(match[1], 10);

            const quotaDetail = {
              engine: 'elevenlabs',
              status: 'quota_exceeded',
              remainingCredits,
              message: `Wyczerpano bezpłatny miesięczny limit znaków konta ElevenLabs (pozostało tylko ${remainingCredits} znaków). Przełączono na silnik zapasowy.`
            };

            if (typeof localStorage !== 'undefined') {
              try {
                localStorage.setItem('elevenlabs_quota_exceeded', 'true');
              } catch {}
            }

            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('ttsQuotaExceeded', { detail: quotaDetail }));
              window.dispatchEvent(new CustomEvent('systemAlert', {
                detail: {
                  type: 'warning',
                  title: 'ElevenLabs: Limit znaków wyczerpany',
                  message: `Konto ElevenLabs osiągnęło limit 10 000 znaków (pozostało: ${remainingCredits} znaków). Zmień klucz API lub wybierz Edge Neural w Ustawieniach.`
                }
              }));
            }

            throw new Error(`Wyczerpano miesięczny limit znaków ElevenLabs (pozostało tylko ${remainingCredits} znaków).`);
          }
        }
      } catch (err) {
        if (err.message && (err.message.includes('limit') || err.message.includes('quota'))) {
          throw err;
        }
        console.warn('[ElevenLabs Direct Fetch] Błąd sieciowy:', err.message);
      }
    }

    // 2. Próba odpytania proxy backendowego (wyłącznie z walidacją MIME audio, odrzucanie text/html)
    if (!audioBlob) {
      const endpoints = isCloudEnvironment()
        ? ['https://ai-system-dashboard.vercel.app/api/tts']
        : ['/api/voice/tts', 'https://ai-system-dashboard.vercel.app/api/tts'];

      for (const endpoint of endpoints) {
        try {
          const proxyRes = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              engine: 'elevenlabs',
              text,
              voiceId: targetVoice,
              apiKey: apiKey || undefined
            })
          });

          const contentType = proxyRes.headers.get('content-type') || '';
          if (proxyRes.ok && (contentType.includes('audio') || contentType.includes('mpeg') || contentType.includes('octet-stream'))) {
            audioBlob = await proxyRes.blob();
            if (audioBlob && audioBlob.size > 0) break;
          }
        } catch {}
      }
    }

    if (!audioBlob || audioBlob.size === 0) {
      throw new Error('Brak klucza API ElevenLabs lub niepowodzenie żądania');
    }

    await this.playAudioBlob(audioBlob, { onStart, onEnd, onError });
  }

  /**
   * Synteza za pomocą OpenAI TTS API (bezpośrednio lub przez proxy)
   */
  async speakWithOpenAI(text, apiKey, voiceId, { onStart, onEnd, onError }) {
    let audioBlob = null;
    const targetVoice = voiceId || 'onyx';

    // 1. Bezpośrednie zapytanie z klienta
    if (apiKey) {
      try {
        const res = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'tts-1',
            input: text,
            voice: targetVoice
          })
        });

        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('audio') || contentType.includes('mpeg') || contentType.includes('octet-stream')) {
            audioBlob = await res.blob();
          }
        }
      } catch (err) {
        console.warn('[OpenAI TTS Direct Fetch] Błąd:', err.message);
      }
    }

    // 2. Proxy backendowe
    if (!audioBlob) {
      const endpoints = isCloudEnvironment()
        ? ['https://ai-system-dashboard.vercel.app/api/tts']
        : ['/api/voice/tts', 'https://ai-system-dashboard.vercel.app/api/tts'];

      for (const endpoint of endpoints) {
        try {
          const proxyRes = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              engine: 'openai',
              text,
              voiceId: targetVoice,
              apiKey: apiKey || undefined
            })
          });

          const contentType = proxyRes.headers.get('content-type') || '';
          if (proxyRes.ok && (contentType.includes('audio') || contentType.includes('mpeg') || contentType.includes('octet-stream'))) {
            audioBlob = await proxyRes.blob();
            if (audioBlob && audioBlob.size > 0) break;
          }
        } catch {}
      }
    }

    if (!audioBlob || audioBlob.size === 0) {
      throw new Error('Brak klucza API OpenAI lub niepowodzenie żądania');
    }

    await this.playAudioBlob(audioBlob, { onStart, onEnd, onError });
  }

  /**
   * Synteza za pomocą Google Cloud Text-to-Speech API (Neural2 / WaveNet, 1 mln znaków/mc free)
   */
  async speakWithGoogle(text, apiKey, voiceId, { onStart, onEnd, onError } = {}) {
    let audioBlob = null;
    const key = apiKey || this.getGoogleApiKey();
    const targetVoice = voiceId || GOOGLE_DEFAULT_VOICES[0].id;
    const langCode = targetVoice.substring(0, 5) || 'pl-PL';

    // 1. Bezpośrednie wywołanie REST z przeglądarki (Google Cloud TTS ma natywny CORS dla kluczy API)
    if (key) {
      try {
        const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(key)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            input: { text },
            voice: {
              languageCode: langCode,
              name: targetVoice
            },
            audioConfig: {
              audioEncoding: 'MP3',
              speakingRate: 1.0,
              pitch: 0.0
            }
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.audioContent) {
            const binaryString = (typeof window !== 'undefined' && typeof window.atob === 'function')
              ? window.atob(data.audioContent)
              : (typeof Buffer !== 'undefined' ? Buffer.from(data.audioContent, 'base64').toString('binary') : atob(data.audioContent));
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            audioBlob = new Blob([bytes.buffer], { type: 'audio/mpeg' });
          }
        } else {
          const errText = await res.text();
          console.warn(`[Google TTS API] Błąd ${res.status}:`, errText);
          if (typeof window !== 'undefined' && res.status === 403) {
            window.dispatchEvent(new CustomEvent('systemAlert', {
              detail: {
                type: 'warning',
                title: 'Google Cloud TTS: Błąd autoryzacji',
                message: 'Nieprawidłowy klucz API lub brak włączonej usługi Cloud Text-to-Speech API w Google Cloud Console.'
              }
            }));
          }
        }
      } catch (err) {
        console.warn('[Google TTS Direct Fetch] Błąd sieciowy:', err.message);
      }
    }

    // 2. Fallback na proxy backendowe (jeśli brak bezpośredniej odpowiedzi)
    if (!audioBlob) {
      const endpoints = isCloudEnvironment()
        ? ['https://ai-system-dashboard.vercel.app/api/tts']
        : ['/api/voice/tts', 'https://ai-system-dashboard.vercel.app/api/tts'];

      for (const endpoint of endpoints) {
        try {
          const proxyRes = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              engine: 'google',
              text,
              voiceId: targetVoice,
              apiKey: key || undefined
            })
          });

          const contentType = proxyRes.headers.get('content-type') || '';
          if (proxyRes.ok && (contentType.includes('audio') || contentType.includes('mpeg') || contentType.includes('octet-stream'))) {
            audioBlob = await proxyRes.blob();
            if (audioBlob && audioBlob.size > 0) break;
          }
        } catch {}
      }
    }

    if (!audioBlob || audioBlob.size === 0) {
      throw new Error('Brak klucza API Google Cloud lub niepowodzenie żądania syntezy');
    }

    await this.playAudioBlob(audioBlob, { onStart, onEnd, onError });
  }

  /**
   * Synteza za pomocą Microsoft Edge Neural API (Zero API Key, Studio Quality)
   */
  async speakWithEdgeTTS(text, voiceId, { onStart, onEnd, onError }) {
    const targetVoice = voiceId || EDGE_DEFAULT_VOICES[0].id;
    let audioBlob = null;

    const endpoints = isCloudEnvironment()
      ? ['https://ai-system-dashboard.vercel.app/api/tts', '/api/voice/tts']
      : ['/api/voice/tts', 'https://ai-system-dashboard.vercel.app/api/tts'];

    for (const endpoint of endpoints) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            engine: 'edge',
            text,
            voiceId: targetVoice
          })
        });

        const contentType = res.headers.get('content-type') || '';
        if (res.ok && (contentType.includes('audio') || contentType.includes('mpeg') || contentType.includes('octet-stream'))) {
          audioBlob = await res.blob();
          if (audioBlob && audioBlob.size > 0) break;
        }
      } catch (err) {
        console.debug(`[EdgeTTS] Endpoint ${endpoint} failed:`, err.message);
      }
    }

    if (!audioBlob || audioBlob.size === 0) {
      throw new Error('Pusty strumień audio z Edge TTS');
    }

    await this.playAudioBlob(audioBlob, { onStart, onEnd, onError });
  }

  /**
   * Odtwarzanie wygenerowanego strumienia audio z obsługą cyklu życia
   */
  playAudioBlob(blob, { onStart, onEnd, onError }) {
    return new Promise((resolve, reject) => {
      try {
        if (!blob || blob.size === 0 || blob.type === 'text/html') {
          const err = new Error('Nieprawidłowy strumień audio (odrzucono HTML/pusty blob)');
          this._isSpeaking = false;
          if (onError) onError(err);
          reject(err);
          return;
        }
        const url = URL.createObjectURL(blob);
        this.currentBlobUrl = url;
        const audio = new Audio(url);
        this.currentAudio = audio;

        audio.onplay = () => {
          this._isSpeaking = true;
          if (onStart) onStart();
        };

        audio.onended = () => {
          this._isSpeaking = false;
          if (this.currentBlobUrl) {
            URL.revokeObjectURL(this.currentBlobUrl);
            this.currentBlobUrl = null;
          }
          this.currentAudio = null;
          if (onEnd) onEnd();
          resolve();
        };

        audio.onerror = (e) => {
          this._isSpeaking = false;
          if (this.currentBlobUrl) {
            URL.revokeObjectURL(this.currentBlobUrl);
            this.currentBlobUrl = null;
          }
          this.currentAudio = null;
          if (onError) onError(e);
          reject(e);
        };

        audio.play().catch(err => {
          this._isSpeaking = false;
          if (onError) onError(err);
          reject(err);
        });
      } catch (err) {
        this._isSpeaking = false;
        if (onError) onError(err);
        reject(err);
      }
    });
  }
}

export const ttsService = new TTSService();
export default ttsService;
