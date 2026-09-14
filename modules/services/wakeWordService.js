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

  // 1. Zawsze dopasuj, jeśli transkrypcja zawiera "omni" lub jego fonetyczne zbitki
  if (/(?:^|\s)(?:omni|omnidash|omnia|omnie|omnis|hejomni|ejomni|heyomni)(?:$|\s|[!?,.])/i.test(normalized)) {
    return true;
  }

  // 2. Fonetyczne warianty powitania i celów (w tym "hej oni", "hej o mnie", "ej o mnie", "hej omi" itp.)
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
    this.history = [];
    this.hasLoggedStart = false;

    this.initRecognition();
    this.setupDevToolsInspector();
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
    console.log(`%c[OmniVoice ⚙️] Nasłuch w tle: ${enabled ? 'WŁĄCZONY' : 'WYŁĄCZONY'}`, 'color: #38BDF8; font-weight: bold;');
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
        this.scheduleRestart(400);
      }
    }
  }

  recordTranscript(text, matched, isFinal) {
    const entry = {
      timestamp: new Date().toLocaleTimeString('pl-PL'),
      text,
      matched,
      isFinal
    };
    this.history.unshift(entry);
    if (this.history.length > 25) this.history.pop();

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('omniSpeechHeard', { detail: entry }));
    }
  }

  attachAutoRecoveryOnUserInteraction() {
    if (typeof window === 'undefined') return;
    const onUserInteract = () => {
      window.removeEventListener('click', onUserInteract);
      window.removeEventListener('keydown', onUserInteract);
      window.removeEventListener('pointerdown', onUserInteract);
      console.log('%c[OmniVoice 🔄] Wykryto interakcję użytkownika – ponowna próba aktywacji mikrofonu...', 'color: #00FF66;');
      if (!this.isListening && !this.isPaused && this.isEnabled()) {
        this.start();
      }
    };
    window.addEventListener('click', onUserInteract, { once: true });
    window.addEventListener('keydown', onUserInteract, { once: true });
    window.addEventListener('pointerdown', onUserInteract, { once: true });
  }

  /**
   * Ciche podtrzymanie strumienia audio mikrofonu (Warm Stream)
   * Zapobiega klikom systemowym, powiadomieniom i przełączaniu urządzenia w OS przy restartach Web Speech API
   */
  async acquireSilentAudioStream(forcePrompt = false) {
    if (this.micStream && !forcePrompt) return;
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;

    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true, // Włączenie redukcji szumów – filtruje hałas tła, klimatyzacji i sali lekcyjnej
          autoGainControl: true,
          channelCount: 1
        }
      });
      console.log('%c[OmniVoice 🎤] Strumień mikrofonu podtrzymany pomyślnie.', 'color: #00FF66; font-size: 11px;');
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        console.warn('%c[OmniVoice ⚠️] Brak uprawnień do mikrofonu (getUserMedia rejected). Zezwól na dostęp w przeglądarce.', 'color: #FFB800;');
        this.status = 'permission-denied';
        this.notifyStatus('permission-denied');
        this.attachAutoRecoveryOnUserInteraction();
      }
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
      console.warn('%c[OmniVoice ⚠️] Ta przeglądarka nie obsługuje SpeechRecognition (użyj Chrome, Edge lub Opery).', 'color: #FF3366;');
      return;
    }

    if (this.recognition) {
      try {
        this.recognition.onstart = null;
        this.recognition.onresult = null;
        this.recognition.onerror = null;
        this.recognition.onend = null;
        this.recognition.abort();
      } catch {}
      this.recognition = null;
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
        if (!this.hasLoggedStart) {
          console.log(
            '%c[OmniVoice 🎙️] NASŁUCH AKTYWNY! Mikrofon nasłuchuje w tle. Powiedz "Hej Omni", aby wywołać asystenta.',
            'color: #00FF66; font-weight: bold; font-size: 11px;'
          );
          this.hasLoggedStart = true;
        }
      };

      this.recognition.onresult = (event) => {
        if (this.isPaused || this.isAiSpeaking) return;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const isFinal = Boolean(result.isFinal);

          for (let a = 0; a < result.length; a++) {
            const transcript = result[a]?.transcript || '';
            if (!transcript.trim()) continue;

            const matched = isWakeWord(transcript);
            this.recordTranscript(transcript, matched, isFinal);

            // Logowanie usłyszanej frazy w DevTools
            console.log(
              `%c[OmniVoice 👂] %c"${transcript}" %c${matched ? '🎯 DOPASOWANIE ("Hej Omni")' : ''} %c${isFinal ? '(final)' : '(interim)'}`,
              'color: #38BDF8; font-weight: bold;',
              'color: #FFFFFF; font-style: italic;',
              matched ? 'background: #00FF66; color: #000; font-weight: bold; padding: 1px 4px; border-radius: 2px;' : 'color: #64748B;',
              'color: #94A3B8; font-size: 10px;'
            );

            if (matched) {
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

        // 1. Zwykły timeout ciszy w Chrome/Edge – to nie jest błąd krytyczny!
        if (event.error === 'no-speech') {
          this.consecutiveErrors = 0;
          this.scheduleRestart(80);
          return;
        }

        // 2. Przerwanie wywołane przez pause() lub stop()
        if (event.error === 'aborted') {
          this.consecutiveErrors = 0;
          return;
        }

        // 3. Brak uprawnień do mikrofonu
        if (event.error === 'not-allowed') {
          this.status = 'permission-denied';
          this.notifyStatus('permission-denied');
          console.error(
            '%c[OmniVoice ❌ BRAK UPRAWNIEŃ DO MIKROFONU] %cPrzeglądarka zablokowała mikrofon (not-allowed).\n%cKliknij ikonę kłódki/suwaków w pasku adresu przeglądarki i ustaw Mikrofon na "Zezwalaj" (Allow), a następnie kliknij w dowolnym miejscu na stronie.',
            'background: #EF4444; color: #fff; font-weight: bold; padding: 2px 6px; border-radius: 2px;',
            'color: #EF4444; font-weight: bold;',
            'color: #FBBF24;'
          );
          this.attachAutoRecoveryOnUserInteraction();
          return;
        }

        // 4. Błąd usługi Google Speech (np. Brave Shields)
        if (event.error === 'service-not-allowed' || event.error === 'network') {
          console.error(
            `%c[OmniVoice ❌ BŁĄD USŁUGI ROZPOZNAWANIA MOWY (${event.error})] %cGoogle Speech API nie odpowiada.\nJeśli używasz przeglądarki Brave, wyłącz tarczę (Brave Shields) dla tej strony, aby zezwolić na serwery rozpoznawania mowy.`,
            'background: #EF4444; color: #fff; font-weight: bold; padding: 2px 6px; border-radius: 2px;',
            'color: #EF4444;',
            'color: #FBBF24;'
          );
          this.consecutiveErrors++;
          const delay = Math.min(2000 * Math.pow(1.3, this.consecutiveErrors), 8000);
          this.scheduleRestart(delay);
          return;
        }

        console.warn(`[OmniVoice ⚠️] Zdarzenie błędu rozpoznawania: ${event.error}`);
        this.consecutiveErrors++;
        const delay = Math.min(1000 * Math.pow(1.3, this.consecutiveErrors), 5000);
        this.scheduleRestart(delay);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.isStarting = false;
        // W Chromium/Chrome zakończona instancja SpeechRecognition nie nadaje się do ponownego start(),
        // więc zwalniamy referencję, by kolejna próba stworzyła świeżą instancję
        this.recognition = null;

        if (!this.isPaused && this.isEnabled() && !this.isAiSpeaking) {
          this.scheduleRestart(100);
        } else {
          this.status = this.isPaused ? 'paused' : 'idle';
          this.notifyStatus(this.status);
        }
      };
    } catch (err) {
      this.status = 'error';
      console.error('[OmniVoice ❌] Błąd inicjalizacji SpeechRecognition:', err);
    }
  }

  scheduleRestart(delay = 100) {
    if (this.restartTimeout) clearTimeout(this.restartTimeout);
    if (!this.isEnabled() || this.isPaused || this.isAiSpeaking) return;

    this.restartTimeout = setTimeout(() => {
      if (!this.isListening && !this.isStarting && !this.isPaused && this.isEnabled() && !this.isAiSpeaking) {
        this.start();
      }
    }, delay);
  }

  handleWakeWordDetected(transcript, payload) {
    console.log(
      `%c[OmniVoice 🎯 WYKRYTO SŁOWO WYBUDZAJĄCE!] %c"${transcript}"%c${payload ? ` -> Zapytanie: "${payload}"` : ''} -> Przekierowanie do /chat`,
      'background: #00FF66; color: #000; font-weight: bold; padding: 3px 8px; border-radius: 4px; font-size: 12px;',
      'color: #00FF66; font-weight: bold;',
      'color: #38BDF8;'
    );
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
    if (!this.isSupported()) {
      console.warn('[OmniVoice] SpeechRecognition nie jest obsługiwane w tej przeglądarce.');
      return;
    }
    if (!this.isEnabled()) {
      console.log('[OmniVoice] Nasłuch wyłączony w konfiguracji systemowej (system_wake_word_enabled = false).');
      return;
    }
    if (this.isListening || this.isStarting || this.isAiSpeaking) return;

    this.isPaused = false;
    this.isStarting = true;

    // Ciche podtrzymanie mikrofonu w tle
    this.acquireSilentAudioStream().catch(() => {});

    if (!this.recognition) {
      this.initRecognition();
    }

    try {
      this.recognition?.start();
    } catch (err) {
      this.isStarting = false;
      if (err?.name === 'InvalidStateError') {
        try {
          this.initRecognition();
          this.recognition?.start();
        } catch {
          this.scheduleRestart(500);
        }
      } else {
        this.scheduleRestart(500);
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

    // Zwalniamy strumień mikrofonu, aby nie blokować urządzeń audio dla innych komponentów
    this.releaseSilentAudioStream();
    this.status = 'paused';
    this.notifyStatus('paused');
  }

  resume() {
    if (!this.isEnabled()) return;
    this.isPaused = false;
    this.isStarting = false;
    this.acquireSilentAudioStream().catch(() => {});
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

  setupDevToolsInspector() {
    if (typeof window === 'undefined' && typeof globalThis === 'undefined') return;

    const hub = {
      getStatus: () => this.status,
      getState: () => ({
        status: this.status,
        isListening: this.isListening,
        isStarting: this.isStarting,
        isPaused: this.isPaused,
        isAiSpeaking: this.isAiSpeaking,
        isEnabled: this.isEnabled(),
        consecutiveErrors: this.consecutiveErrors,
        language: this.recognition?.lang || 'pl-PL',
        hasMicStream: Boolean(this.micStream),
        history: [...this.history]
      }),
      history: this.history,
      start: () => {
        console.log('[OmniVoice 🚀] Wymuszone uruchomienie nasłuchu przez DevTools...');
        return this.start();
      },
      stop: () => {
        console.log('[OmniVoice 🛑] Zatrzymanie nasłuchu przez DevTools...');
        return this.stop();
      },
      restart: () => {
        console.log('[OmniVoice 🔄] Restartowanie nasłuchu...');
        this.stop();
        return this.start();
      },
      testWakeWord: (phrase = 'hej omni') => {
        console.log(`%c[OmniVoice 🧪 Test Wywołania] %cSymulacja wypowiedzenia: "${phrase}"`, 'background: #8B5CF6; color: #fff; font-weight: bold; padding: 2px 6px; border-radius: 2px;', 'color: #C084FC;');
        this.handleWakeWordDetected(phrase, extractWakeWordPayload(phrase));
      },
      requestMic: async () => {
        console.log('[OmniVoice 🎤] Prośba o dostęp do mikrofonu (getUserMedia)...');
        await this.acquireSilentAudioStream(true);
        this.start();
      },
      enable: () => this.setEnabled(true),
      disable: () => this.setEnabled(false),
      showInspector: () => {
        localStorage.setItem('system_voice_debug_visible', 'true');
        window.dispatchEvent(new CustomEvent('toggleVoiceInspector', { detail: { visible: true } }));
        console.log('[OmniVoice 🔍] Pływający wskaźnik na ekranie został WŁĄCZONY.');
      },
      hideInspector: () => {
        localStorage.setItem('system_voice_debug_visible', 'false');
        window.dispatchEvent(new CustomEvent('toggleVoiceInspector', { detail: { visible: false } }));
        console.log('[OmniVoice 🔍] Pływający wskaźnik na ekranie został UKRYTY.');
      },
      help: () => {
        console.log(
          '%c=== NARZĘDZIA DIAGNOSTYCZNE ASYSTENTA GŁOSOWEGO OMNI ===',
          'color: #00FF66; font-size: 14px; font-weight: bold; border-bottom: 2px solid #00FF66; padding-bottom: 4px;'
        );
        console.table([
          { Polecenie: '__OMNI_VOICE__.getState()', Opis: 'Zwraca pełny stan obiektu nasłuchu w czasie rzeczywistym' },
          { Polecenie: '__OMNI_VOICE__.history', Opis: 'Ostatnie transkrypcje usłyszane przez mikrofon' },
          { Polecenie: '__OMNI_VOICE__.testWakeWord("hej omni")', Opis: 'Symuluje natychmiastowe wywołanie i przejście do czatu' },
          { Polecenie: '__OMNI_VOICE__.requestMic()', Opis: 'Otwiera okno przeglądarki z prośbą o uprawnienie do mikrofonu' },
          { Polecenie: '__OMNI_VOICE__.restart()', Opis: 'Wymusza natychmiastowy restart Web Speech API' },
          { Polecenie: '__OMNI_VOICE__.showInspector()', Opis: 'Pokazuje pływający podgląd nasłuchu na ekranie (Live HUD)' },
          { Polecenie: '__OMNI_VOICE__.hideInspector()', Opis: 'Chowa pływający podgląd nasłuchu na ekranie' }
        ]);
      }
    };

    if (typeof window !== 'undefined') {
      window.__OMNI_VOICE__ = hub;
    }
    if (typeof globalThis !== 'undefined') {
      globalThis.__OMNI_VOICE__ = hub;
    }

    this.devToolsHub = hub;

    setTimeout(() => {
      console.log(
        '%c[OmniVoice 🎙️ DevTools Active] %cPodgląd asystenta głosowego zainicjalizowany.\nWpisz %cwindow.__OMNI_VOICE__.help()%c w konsoli, aby sprawdzić diagnostykę lub przetestować mikrofon.',
        'color: #00FF66; font-weight: bold; font-size: 11px;',
        'color: #94A3B8;',
        'color: #38BDF8; font-weight: bold; background: rgba(56, 189, 248, 0.15); padding: 1px 5px; border-radius: 3px;',
        'color: #94A3B8;'
      );
    }, 600);
  }
}

export const wakeWordService = new WakeWordService();
if (typeof window !== 'undefined') {
  window.__OMNI_VOICE__ = window.__OMNI_VOICE__ || wakeWordService.devToolsHub;
}
if (typeof globalThis !== 'undefined') {
  globalThis.__OMNI_VOICE__ = globalThis.__OMNI_VOICE__ || wakeWordService.devToolsHub;
}
export default wakeWordService;
