/**
 * Wake Word Service - Asystent Głosowy "Hej Omni"
 * Odpowiada za ciągły nasłuch mikrofonu w tle, detekcję słowa wybudzającego
 * oraz zarządzanie cyklem życia Web Speech API.
 */

// Wzorce słowa wybudzającego (wielkość liter i polskie znaki ignorowane)
const WAKE_WORD_PATTERNS = [
  /(?:^|\s)(?:hej|hey|halo|ok|okej|siema|cześć|witaj)\s+omni(?:dash|a)?(?:\s|$|[!?,.])/i,
  /(?:^|\s)(?:hej|hey)\s+omi(?:\s|$|[!?,.])/i,
  /(?:^|\s)omni(?:dash)?(?:\s|$|[!?,.])/i
];

/**
 * Normalizuje tekst wejściowy usuwając zbędne białe znaki i znaki interpunkcyjne na końcach
 */
export function normalizeSpeechText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sprawdza czy w transkrypcie mowy występuje słowo wybudzające "Hej Omni"
 */
export function isWakeWord(transcript) {
  if (!transcript || typeof transcript !== 'string') return false;
  const normalized = normalizeSpeechText(transcript);
  if (!normalized) return false;

  return WAKE_WORD_PATTERNS.some(pattern => pattern.test(normalized));
}

/**
 * Wyodrębnia ewentualną treść zapytania wypowiedzianego bezpośrednio po słowie kluczowym
 * np. "hej omni jaka jest pogoda" -> "jaka jest pogoda"
 */
export function extractWakeWordPayload(transcript) {
  if (!transcript || typeof transcript !== 'string') return '';
  const clean = transcript.trim();

  // Usuwanie prefiksu wybudzającego wraz ze znakami interpunkcyjnymi
  const match = clean.match(/^(?:hej|hey|halo|ok|okej|siema|cześć|witaj)?\s*omni(?:dash|a)?\s*[!?,.:;\-_]*\s*(.*)$/i);
  if (match && match[1]) {
    const payload = match[1].replace(/^[!?,.:;\-_]+\s*/, '').trim();
    return payload;
  }
  return '';
}

/**
 * Oczyszcza tekst z formatowania Markdown, emotikon, linków i znaczników systemowych na potrzeby syntezy mowy TTS
 */
export function cleanTextForSpeech(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    // Usunięcie znaczników akcji [ACTION:...]
    .replace(/\[ACTION:[^\]]+\]/gi, '')
    // Usunięcie bloków kodu ```...```
    .replace(/```[\s\S]*?```/g, '')
    // Usunięcie tabel markdown
    .replace(/\|[^\n]+\|/g, '')
    // Usunięcie linków i obrazków markdown [tekst](url) -> tekst
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    // Usunięcie znaków formatowania Markdown (*, _, ~, `, #, >, -)
    .replace(/[*_~`#>-]/g, ' ')
    // Usunięcie emotikon
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')
    // Usunięcie wielokrotnych spacji i nowych linii
    .replace(/\s+/g, ' ')
    .trim();
}

class WakeWordService {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.isPaused = false;
    this.restartTimeout = null;
    this.callbacks = new Set();
    this.statusListeners = new Set();
    this.status = 'idle'; // 'idle' | 'listening' | 'paused' | 'detected' | 'error' | 'unsupported'

    this.initRecognition();
  }

  isSupported() {
    return typeof window !== 'undefined' && 
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }

  isEnabled() {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('system_wake_word_enabled') !== 'false';
  }

  setEnabled(enabled) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('system_wake_word_enabled', enabled ? 'true' : 'false');
    this.notifyStatus(enabled ? (this.isListening ? 'listening' : 'idle') : 'disabled');
    if (enabled) {
      this.start();
    } else {
      this.stop();
    }
  }

  initRecognition() {
    if (!this.isSupported()) {
      this.status = 'unsupported';
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    const systemLang = (typeof localStorage !== 'undefined' && localStorage.getItem('system_language')) || 'pl';
    const langMap = { pl: 'pl-PL', en: 'en-US', uk: 'uk-UA', zh: 'zh-CN' };
    this.recognition.lang = langMap[systemLang] || 'pl-PL';
    this.recognition.continuous = true;
    this.recognition.interimResults = true;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.status = 'listening';
      this.notifyStatus('listening');
    };

    this.recognition.onresult = (event) => {
      if (this.isPaused) return;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0]?.transcript || '';

        if (isWakeWord(transcript)) {
          const payload = extractWakeWordPayload(transcript);
          this.handleWakeWordDetected(transcript, payload);
          break;
        }
      }
    };

    this.recognition.onerror = (event) => {
      // Ignorujemy błędy no-speech i aborted – to normalne cykle w Web Speech API
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.warn('[WakeWordService] Błąd rozpoznawania mowy:', event.error);
        if (event.error === 'not-allowed') {
          this.status = 'permission-denied';
          this.notifyStatus('permission-denied');
          this.isListening = false;
          return;
        }
      }
      this.scheduleRestart(800);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (!this.isPaused && this.isEnabled()) {
        this.scheduleRestart(400);
      } else {
        this.status = this.isPaused ? 'paused' : 'idle';
        this.notifyStatus(this.status);
      }
    };
  }

  scheduleRestart(delay = 500) {
    if (this.restartTimeout) clearTimeout(this.restartTimeout);
    if (!this.isEnabled() || this.isPaused) return;

    this.restartTimeout = setTimeout(() => {
      if (!this.isListening && !this.isPaused && this.isEnabled()) {
        try {
          this.recognition?.start();
        } catch {
          // Już uruchomione lub zajęte
        }
      }
    }, delay);
  }

  handleWakeWordDetected(transcript, payload) {
    this.status = 'detected';
    this.notifyStatus('detected');
    this.pause();

    // Rozgłoszenie zdarzenia systemowego
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('wakeWordDetected', {
        detail: { transcript, payload }
      }));
    }

    // Powiadomienie zarejestrowanych callbacków
    this.callbacks.forEach(cb => {
      try {
        cb({ transcript, payload });
      } catch (err) {
        console.error('[WakeWordService] Błąd w callbacku wybudzenia:', err);
      }
    });
  }

  start() {
    if (!this.isSupported() || !this.isEnabled() || this.isListening) return;
    this.isPaused = false;
    try {
      this.recognition?.start();
    } catch {
      // Bezpieczny fallback
    }
  }

  stop() {
    if (this.restartTimeout) clearTimeout(this.restartTimeout);
    this.isPaused = false;
    this.isListening = false;
    this.status = 'idle';
    try {
      this.recognition?.abort();
    } catch {
      // Ignoruj
    }
    this.notifyStatus('idle');
  }

  pause() {
    this.isPaused = true;
    if (this.restartTimeout) clearTimeout(this.restartTimeout);
    try {
      this.recognition?.abort();
    } catch {
      // Ignoruj
    }
    this.status = 'paused';
    this.notifyStatus('paused');
  }

  resume() {
    if (!this.isEnabled()) return;
    this.isPaused = false;
    this.scheduleRestart(200);
  }

  onWakeWord(callback) {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  onStatusChange(listener) {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  notifyStatus(status) {
    this.status = status;
    this.statusListeners.forEach(listener => {
      try {
        listener(status);
      } catch (e) {
        console.error(e);
      }
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('wakeWordStatusChanged', {
        detail: { status, isListening: this.isListening, isEnabled: this.isEnabled() }
      }));
    }
  }
}

export const wakeWordService = new WakeWordService();
export default wakeWordService;
