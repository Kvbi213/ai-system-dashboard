/**
 * Advanced TTS Service - Wielosilnikowa Synteza Mowy AI
 * Obsługuje ElevenLabs (Hi-Fi), OpenAI TTS (Studio) oraz inteligentny
 * silnik Web Neural Engine (przeglądarkowy fallback).
 */

import { cleanTextForSpeech } from './wakeWordService.js';

export const EDGE_DEFAULT_VOICES = [
  { id: 'pl-PL-MarekNeural', name: 'Marek (Męski - Studio Neural / Naturalny)' },
  { id: 'pl-PL-ZofiaNeural', name: 'Zofia (Damski - Studio Neural / Ciepły)' },
  { id: 'pl-PL-AgnieszkaNeural', name: 'Agnieszka (Damski - Naturalny)' },
  { id: 'en-US-ChristopherNeural', name: 'Christopher (Męski - Studio US English)' },
  { id: 'en-US-JennyNeural', name: 'Jenny (Damski - Studio US English)' }
];

export const ELEVENLABS_DEFAULT_VOICES = [
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam (Męski - Głęboki Studio / Polski Naturalny)' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni (Męski - Spokojny / Polski)' },
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel (Damski - Naturalny/Ciepły)' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah (Damski - Profesjonalny Studio)' },
  { id: 'piTKgcLEGmPE4e6mEKli', name: 'Nicole (Damski - Wyrazisty)' },
  { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold (Męski - Mocny)' }
];

export const OPENAI_DEFAULT_VOICES = [
  { id: 'onyx', name: 'Onyx (Głęboki, męski)' },
  { id: 'alloy', name: 'Alloy (Zbalansowany, neutralny)' },
  { id: 'nova', name: 'Nova (Energetyczny, kobiecy)' },
  { id: 'echo', name: 'Echo (Spokojny, męski)' },
  { id: 'fable', name: 'Fable (Ekspresyjny, brytyjski)' },
  { id: 'shimmer', name: 'Shimmer (Czysty, kobiecy)' }
];

export const WEB_VOICE_PROFILES = [
  { id: 'female', name: 'Damski (Paulina / Zofia Online Natural)' },
  { id: 'male', name: 'Męski (Marek / Adam Online Natural)' }
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
      if (stored) return stored; // 'elevenlabs' | 'edge' | 'openai' | 'web'
    }
    // Domyślnie ElevenLabs jeśli skonfigurowany jest klucz, w przeciwnym razie Microsoft Edge Neural
    if (this.getElevenLabsKey()) return 'elevenlabs';
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

  getOpenAiKey() {
    if (typeof localStorage === 'undefined') return '';
    return localStorage.getItem('system_openai_tts_api_key') || '';
  }

  getVoiceId() {
    if (typeof localStorage === 'undefined') return '';
    const engine = this.getEngine();
    if (engine === 'edge') {
      return localStorage.getItem('system_edge_voice_id') || EDGE_DEFAULT_VOICES[0].id;
    }
    if (engine === 'elevenlabs') {
      return localStorage.getItem('system_elevenlabs_voice_id') || ELEVENLABS_DEFAULT_VOICES[0].id;
    }
    if (engine === 'openai') {
      return localStorage.getItem('system_openai_voice_id') || 'onyx';
    }
    return localStorage.getItem('system_voice_pref') || 'female';
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
  async speak(text, { onStart, onEnd, onError } = {}) {
    this.stop();
    const clean = cleanTextForSpeech(text);
    if (!clean) {
      if (onEnd) onEnd();
      return;
    }

    const engine = this.getEngine();

    // 1. SILNIK ELEVENLABS (STUDIO HYPER-REALISTIC QUALITY)
    if (engine === 'elevenlabs') {
      const apiKey = this.getElevenLabsKey();
      const voiceId = this.getVoiceId();

      try {
        await this.speakWithElevenLabs(clean, apiKey, voiceId, { onStart, onEnd, onError });
        return;
      } catch (err) {
        console.warn('[TTSService] Błąd ElevenLabs, przejście do silnika rezerwowego Edge TTS:', err.message);
        try {
          await this.speakWithEdgeTTS(clean, localStorage.getItem('system_edge_voice_id') || 'pl-PL-MarekNeural', { onStart, onEnd, onError });
          return;
        } catch (edgeErr) {
          console.warn('[TTSService] Błąd Edge TTS, przejście do silnika rezerwowego Web Speech:', edgeErr.message);
        }
      }
    }

    // 2. SILNIK MICROSOFT EDGE NEURAL (BEZPŁATNY / STUDIO QUALITY)
    if (engine === 'edge') {
      const voiceId = this.getVoiceId();
      try {
        await this.speakWithEdgeTTS(clean, voiceId, { onStart, onEnd, onError });
        return;
      } catch (err) {
        console.warn('[TTSService] Błąd Edge TTS, przejście do silnika rezerwowego Web Speech:', err.message);
      }
    }

    // 3. SILNIK OPENAI TTS
    if (engine === 'openai') {
      const apiKey = this.getOpenAiKey();
      const voiceId = this.getVoiceId();

      try {
        await this.speakWithOpenAI(clean, apiKey, voiceId, { onStart, onEnd, onError });
        return;
      } catch (err) {
        console.warn('[TTSService] Błąd OpenAI TTS, przejście do silnika rezerwowego Web Neural:', err.message);
      }
    }

    // 4. SILNIK WEB SPEECH API (AWARYJNY FALLBACK)
    this.speakWithWebSpeech(clean, { onStart, onEnd, onError });
  }

  /**
   * Synteza za pomocą ElevenLabs API (bezpośrednio lub przez proxy)
   */
  async speakWithElevenLabs(text, apiKey, voiceId, { onStart, onEnd, onError }) {
    let audioBlob = null;

    // Próba odpytania proxy backendowego
    try {
      const proxyRes = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engine: 'elevenlabs',
          text,
          voiceId: voiceId || ELEVENLABS_DEFAULT_VOICES[0].id,
          apiKey: apiKey || undefined
        })
      });

      if (proxyRes.ok) {
        audioBlob = await proxyRes.blob();
      }
    } catch {}

    // Fallback: bezpośrednie zapytanie z klienta (np. w chmurze bez backendu Node)
    if (!audioBlob && apiKey) {
      const targetVoice = voiceId || ELEVENLABS_DEFAULT_VOICES[0].id;
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

      if (!res.ok) {
        throw new Error(`ElevenLabs API zwróciło status ${res.status}`);
      }
      audioBlob = await res.blob();
    }

    if (!audioBlob) {
      throw new Error('Brak klucza API ElevenLabs lub niepowodzenie żądania');
    }

    await this.playAudioBlob(audioBlob, { onStart, onEnd, onError });
  }

  /**
   * Synteza za pomocą OpenAI TTS API (bezpośrednio lub przez proxy)
   */
  async speakWithOpenAI(text, apiKey, voiceId, { onStart, onEnd, onError }) {
    let audioBlob = null;

    // Próba odpytania proxy backendowego
    try {
      const proxyRes = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engine: 'openai',
          text,
          voiceId: voiceId || 'onyx',
          apiKey: apiKey || undefined
        })
      });

      if (proxyRes.ok) {
        audioBlob = await proxyRes.blob();
      }
    } catch {}

    // Fallback bezpośredni
    if (!audioBlob && apiKey) {
      const res = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice: voiceId || 'onyx'
        })
      });

      if (!res.ok) {
        throw new Error(`OpenAI TTS API zwróciło status ${res.status}`);
      }
      audioBlob = await res.blob();
    }

    if (!audioBlob) {
      throw new Error('Brak klucza API OpenAI lub niepowodzenie żądania');
    }

    await this.playAudioBlob(audioBlob, { onStart, onEnd, onError });
  }

  /**
   * Synteza za pomocą Microsoft Edge Neural API (Zero API Key, Studio Quality)
   */
  async speakWithEdgeTTS(text, voiceId, { onStart, onEnd, onError }) {
    const targetVoice = voiceId || EDGE_DEFAULT_VOICES[0].id;
    const res = await fetch('/api/voice/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        engine: 'edge',
        text,
        voiceId: targetVoice
      })
    });

    if (!res.ok) {
      throw new Error(`Błąd Edge TTS (status ${res.status})`);
    }

    const audioBlob = await res.blob();
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

  /**
   * Wbudowana przeglądarkowa synteza mowy Web Speech API z inteligentnym doborem głosu Natural Neural
   */
  speakWithWebSpeech(text, { onStart, onEnd, onError }) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    const systemLang = (typeof localStorage !== 'undefined' && localStorage.getItem('system_language')) || 'pl';
    const langMap = { pl: 'pl-PL', en: 'en-US', uk: 'uk-UA', zh: 'zh-CN' };
    utterance.lang = langMap[systemLang] || 'pl-PL';

    const voicePref = (typeof localStorage !== 'undefined' && localStorage.getItem('system_voice_pref')) || 'female';
    const voiceRate = (typeof localStorage !== 'undefined' && parseFloat(localStorage.getItem('system_voice_rate'))) || 1.15;
    utterance.rate = voiceRate;
    utterance.pitch = 1.05;

    const voices = window.speechSynthesis.getVoices();
    let selectedVoice;

    if (systemLang === 'pl') {
      if (voicePref === 'female' || voicePref === 'paulina') {
        selectedVoice = voices.find(v => v.name.includes('Natural') && (v.name.includes('Paulina') || v.name.includes('Zofia'))) ||
          voices.find(v => v.name.toLowerCase().includes('paulina') || v.name.toLowerCase().includes('zofia')) ||
          voices.find(v => v.lang.includes('pl') && !v.name.toLowerCase().includes('male') && !v.name.toLowerCase().includes('marek'));
      } else {
        selectedVoice = voices.find(v => v.name.includes('Natural') && (v.name.includes('Marek') || v.name.includes('Adam'))) ||
          voices.find(v => v.name.toLowerCase().includes('marek') || v.name.toLowerCase().includes('adam')) ||
          voices.find(v => v.lang.includes('pl') && (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('mężczyzna')));
      }
    }

    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.includes(systemLang));
    }
    if (selectedVoice) utterance.voice = selectedVoice;

    utterance.onstart = () => {
      this._isSpeaking = true;
      if (onStart) onStart();
    };

    utterance.onend = () => {
      this._isSpeaking = false;
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      this._isSpeaking = false;
      this.currentUtterance = null;
      if (onError) onError(e);
      else if (onEnd) onEnd();
    };

    this.currentUtterance = utterance;
    this._isSpeaking = true;
    window.speechSynthesis.speak(utterance);
  }
}

export const ttsService = new TTSService();
export default ttsService;
