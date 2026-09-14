/**
 * Wake Word Service - Asystent Głosowy "Hej Omni"
 * Odpowiada za ciągły, cichy nasłuch mikrofonu w tle (Silent Listening Mode),
 * detekcję słowa wybudzającego oraz bezkolizyjne zarządzanie Web Speech API.
 */

const GREETINGS = '(?:hej|hey|ej|halo|ok|okej|siema|cześć|czesc|witaj|yo|joł)';
const TARGETS = '(?:omni|omnia|omnik|omnie|omnis|oni|o\\s+mnie|on\\s+mi|omi|ommi|olmi|obni|ovni|homi|tomi|tommy|pomnik)';

// Wzorce słowa wybudzającego (uwzględniające specyfikę fonetyczną Google Web Speech API w j. polskim)
const WAKE_WORD_PATTERNS = [
  // Powitanie + cel fonetyczny (np. "hej omni", "hej oni", "hej o mnie", "ej o mnie", "cześć omni")
  new RegExp(`(?:^|\\s)${GREETINGS}\\s+${TARGETS}(?:dash|a)?(?:\\s|$|[!?,.])`, 'i'),
  // Samodzielne słowo o wysokiej pewności (np. "omni", "omnie", "omnia", "omnik", "omnidash")
  /(?:^|\s)omni(?:dash|a|k|e|s)?(?:\s|$|[!?,.])/i,
  // Złożenia dwuwyrazowe fonetyczne (np. "ej omni", "hej omi")
  /(?:^|\s)(?:hej|hey|ej)\s+(?:omi|ommi|homi|tomi|pomnik)(?:\s|$|[!?,.])/i
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
  if (!isWakeWord(clean)) return '';

  const pattern = new RegExp(`^(?:${GREETINGS})?\\s*(?:${TARGETS})(?:dash|a)?\\s*[!?,.:;\\-_]*\\s*(.*)$`, 'i');
  const match = clean.match(pattern);
  if (match && match[1]) {
    return match[1].replace(/^[!?,.:;\-_]+\s*/, '').trim();
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
    this.micStream = null;
    this.isListening = false;
    this.isStarting = false;
    this.isStopping = false;
    this.isPaused = false;
    this.isAiSpeaking = false;
    this.consecutiveErrors = 0;
    this.restartTimeout = null;
    this.callbacks = new Set();
    this.statusListeners = new Set();
    this.status = 'idle'; // 'idle' | 'listening' | 'paused' | 'detected' | 'error' | 'unsupported' | 'permission-denied'

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

  setAiSpeaking(isSpeaking) {
    this.isAiSpeaking = Boolean(isSpeaking);
    if (this.isAiSpeaking) {
      this.pause();
    } else {
      if (!this.isPaused && this.isEnabled()) {
        this.scheduleRestart(600);
      }
    }
  }

  /**
   * Ciche podtrzymanie strumienia audio mikrofonu (Warm Stream)
   * Zapobiega klikom systemowym, powiadomieniom i przełączaniu urządzenia w OS przy restartach Web Speech API
   */
  async acquireSilentAudioStream() {
    if (this.micStream) return;
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;

    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false, // Wyłączenie agresywnej bramki szumów – pozwala wychwycić cichą mowę bez krzyku
          autoGainControl: true,
          channelCount: 1
        }
      });
    } catch {
      // Cichy fallback – jeśli użytkownik jeszcze nie kliknął uprawnień
    }
  }

  releaseSilentAudioStream() {
    if (this.micStream) {
      try {
        this.micStream.getTracks().forEach(track => track.stop());
      } catch {}
      this.micStream = null;
    }
  }

  initRecognition() {
    if (!this.isSupported()) {
      this.status = 'unsupported';
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();

      const systemLang = (typeof localStorage !== 'undefined' && localStorage.getItem('system_language')) || 'pl';
      const langMap = { pl: 'pl-PL', en: 'en-US', uk: 'uk-UA', zh: 'zh-CN' };
      this.recognition.lang = langMap[systemLang] || 'pl-PL';
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 5;

      this.recognition.onstart = () => {
        this.isStarting = false;
        this.isListening = true;
        this.consecutiveErrors = 0;
        this.status = 'listening';
        this.notifyStatus('listening');
      };

      this.recognition.onresult = (event) => {
        if (this.isPaused || this.isAiSpeaking) return;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          // Sprawdzanie wszystkich alternatyw transkrypcji zwróconych przez silnik mowy
          for (let a = 0; a < result.length; a++) {
            const transcript = result[a]?.transcript || '';
            if (isWakeWord(transcript)) {
              const payload = extractWakeWordPayload(transcript);
              this.handleWakeWordDetected(transcript, payload);
              return;
            }
          }
        }
      };

      this.recognition.onerror = (event) => {
        this.isStarting = false;
        this.isListening = false;

        // Ciche traktowanie rutynowych zdarzeń przeglądarkowych
        if (event.error === 'not-allowed') {
          this.status = 'permission-denied';
          this.notifyStatus('permission-denied');
          return;
        }

        // Zwiększanie odstępu przy powtarzających się błędach (wykładniczy backoff)
        this.consecutiveErrors++;
        const delay = Math.min(1000 * Math.pow(1.3, this.consecutiveErrors), 6000);
        this.scheduleRestart(delay);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.isStarting = false;

        if (!this.isPaused && this.isEnabled() && !this.isAiSpeaking) {
          this.scheduleRestart(800);
        } else {
          this.status = this.isPaused ? 'paused' : 'idle';
          this.notifyStatus(this.status);
        }
      };
    } catch {
      this.status = 'error';
    }
  }

  scheduleRestart(delay = 800) {
    if (this.restartTimeout) clearTimeout(this.restartTimeout);
    if (!this.isEnabled() || this.isPaused || this.isAiSpeaking) return;

    this.restartTimeout = setTimeout(() => {
      if (!this.isListening && !this.isStarting && !this.isPaused && this.isEnabled() && !this.isAiSpeaking) {
        this.start();
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

  async start() {
    if (!this.isSupported() || !this.isEnabled() || this.isListening || this.isStarting || this.isAiSpeaking) return;

    this.isPaused = false;
    this.isStarting = true;

    // Ciche podtrzymanie mikrofonu w tle
    this.acquireSilentAudioStream().catch(() => {});

    try {
      this.recognition?.start();
    } catch (err) {
      this.isStarting = false;
      if (err?.name === 'InvalidStateError') {
        // Obiekt rozpoznawania był już w stanie startowania/aktywnym
        this.isListening = true;
      } else {
        this.scheduleRestart(1200);
      }
    }
  }

  stop() {
    if (this.restartTimeout) clearTimeout(this.restartTimeout);
    this.isPaused = false;
    this.isStarting = false;
    this.isListening = false;
    this.status = 'idle';

    try {
      this.recognition?.abort();
    } catch {}

    this.releaseSilentAudioStream();
    this.notifyStatus('idle');
  }

  pause() {
    this.isPaused = true;
    this.isStarting = false;
    if (this.restartTimeout) clearTimeout(this.restartTimeout);

    try {
      this.recognition?.abort();
    } catch {}

    this.status = 'paused';
    this.notifyStatus('paused');
  }

  resume() {
    if (!this.isEnabled()) return;
    this.isPaused = false;
    this.isStarting = false;
    this.scheduleRestart(400);
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
