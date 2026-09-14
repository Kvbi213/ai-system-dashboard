/**
 * Wake Word Service - Asystent Głosowy "Hej Omni"
 * Odpowiada za ciągły, cichy nasłuch mikrofonu w tle (Silent Listening Mode),
 * detekcję słowa wybudzającego oraz bezkolizyjne zarządzanie Web Speech API.
 */

const GREETINGS = '(?:hej|hey|ej|halo|ok|okej|siema|siemanko|cześć|czesc|witaj|yo|joł|hejka|słuchaj|sluchaj|mordo|ziom)';
const TARGETS = '(?:omnidash|asystencie|asystent|komputer|omnik|omnis|omnia|omnie|omini|ommi|omni|oni|on\\s+mi|o\\s+mnie|do\\s+mnie|pomnik|mommy|mami|tomi|tommy|homi|olmi|obni|ovni|omi)';

// Wzorce słowa wybudzającego (uwzględniające specyfikę fonetyczną Google Web Speech API w j. polskim)
const WAKE_WORD_PATTERNS = [
  // 1. Powitanie + cel fonetyczny (np. "hej omni", "hej oni", "hej o mnie", "ej o mnie", "cześć omni", "hejka o mnie")
  new RegExp(`(?:^|\\s)${GREETINGS}\\s+${TARGETS}(?:dash|a)?(?:\\s|$|[!?,.])`, 'i'),
  // 2. Samodzielne słowo o wysokiej pewności (np. "omni", "omnie", "omnia", "omnik", "omnidash", "omini", "asystent", "komputer")
  /(?:^|\s)(?:omni|omnidash|omnia|omnik|omnie|omnis|omini|asystent|asystencie|komputer)(?:\s|$|[!?,.])/i,
  // 3. Złożenia dwuwyrazowe fonetyczne (np. "ej omni", "hej omi", "hej mommy", "hej mami")
  /(?:^|\s)(?:hej|hey|ej|hejka)\s+(?:omi|ommi|homi|tomi|pomnik|mommy|mami)(?:\s|$|[!?,.])/i,
  // 4. Fonetyczne substytuty "o mnie" / "on mi" / "oni" na początku wypowiedzi (częsty zapis cichej mowy w Google Speech)
  /^(?:o\s+mnie|on\s+mi|oni)(?:\s|$|[!?,.])/i,
  // 5. Złożenia fonetyczne z bezpośrednim pytaniem (np. "o mnie jaka jest pogoda", "omini co tam")
  /(?:^|\s)(?:o\s+mnie|on\s+mi|oni)\s+(?:jaka|jaki|jak|co|ile|kiedy|gdzie|dlaczego|kto|czy|pokaż|pokaz|zrób|zrob|powiedz|dodaj|otwórz|otworz|wyjaśnij|sprawdź|podsumuj)/i
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
  if (/(?:^|\s)(?:omni|omnidash|omnia|omnie|omnis|hejomni|ejomni|heyomni|omini|asystent|asystencie|komputer)(?:$|\s|[!?,.])/i.test(normalized)) {
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

  const prefixPatterns = [
    new RegExp(`^(?:${GREETINGS})?\\s*(?:${TARGETS})(?:dash|a)?\\s*[!?,.:;\\-_]*\\s*(.*)$`, 'i'),
    /^(?:omnidash|asystencie|asystent|komputer|omnik|omnis|omnia|omnie|omini|omni)\s*[!?,.:;\-_]*\s*(.*)$/i,
    /^(?:hejomni|ejomni|heyomni)\s*[!?,.:;\-_]*\s*(.*)$/i,
    /^(?:o\s+mnie|on\s+mi|oni)\s*[!?,.:;\-_]*\s*(.*)$/i
  ];

  for (const pat of prefixPatterns) {
    const m = clean.match(pat);
    if (m && m[1] !== undefined) {
      const payload = m[1].replace(/^[!?,.:;\-_]+\s*/, '').trim();
      return payload;
    }
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

/**
 * Sprawdza czy transkrypcja mowy z mikrofonu stanowi echo akustyczne wypowiedzi AI
 * (zapobiega zapętleniu, w którym asystent odpowiada na własne słowa emitowane przez głośniki).
 */
export function isAcousticEcho(spokenText, aiText) {
  if (!spokenText || !aiText || typeof spokenText !== 'string' || typeof aiText !== 'string') {
    return false;
  }
  const cleanSpoken = spokenText
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const cleanAi = aiText
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleanSpoken.length < 3 || cleanAi.length < 3) return false;

  // 1. Bezpośrednie zawieranie (podciąg)
  if (cleanAi.includes(cleanSpoken)) return true;

  // 2. Jeśli wypowiedź użytkownika to min. 2 słowa i znaczna większość tych słów występuje w tekście AI
  const spokenWords = cleanSpoken.split(' ').filter(w => w.length >= 2);
  if (spokenWords.length === 0) return false;

  const aiWordsSet = new Set(cleanAi.split(' ').filter(w => w.length >= 2));
  const matchedWords = spokenWords.filter(w => aiWordsSet.has(w));

  if (spokenWords.length >= 2 && (matchedWords.length / spokenWords.length) >= 0.6) {
    return true;
  }

  return false;
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
    this.isLiveModeActive = false;
    this.consecutiveErrors = 0;
    this.restartTimeout = null;
    this.callbacks = new Set();
    this.statusListeners = new Set();
    this.status = 'idle'; // 'idle' | 'listening' | 'paused' | 'detected' | 'error' | 'unsupported' | 'permission-denied'
    this.history = [];
    this.hasLoggedStart = false;
    this.audioContext = null;
    this.meterAnimFrame = null;
    this.volumeLevel = 0;

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

  setLiveModeActive(active) {
    this.isLiveModeActive = Boolean(active);
    if (this.isLiveModeActive) {
      this.pause();
    } else {
      if (this.isEnabled() && !this.isAiSpeaking) {
        this.resume();
      }
    }
  }

  setAiSpeaking(isSpeaking) {
    this.isAiSpeaking = Boolean(isSpeaking);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('omniAiSpeaking', { detail: { isSpeaking: this.isAiSpeaking } }));
    }
    if (this.isAiSpeaking) {
      this.pause();
    } else {
      // Jeśli jesteśmy w trybie ciągłej rozmowy w Terminalu, nie wznawiaj wakeWordService w tle
      if (this.isEnabled() && !this.isLiveModeActive) {
        this.resume();
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
   * Ciche podtrzymanie strumienia audio mikrofonu (Warm Stream) & Analiza poziomu VU
   * Wyłączenie tłumienia programowego WebRTC pozwala na wychwycenie cichego szeptu i mowy bez krzyku.
   */
  async acquireSilentAudioStream(forcePrompt = false) {
    if (this.micStream && !forcePrompt) return;
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;

    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false, // WAŻNE: wyłączenie programowej bramki szumów – zapobiega wyciszaniu szeptu!
          autoGainControl: true,   // Wzmocnienie cichej mowy
          channelCount: 1
        }
      });
      console.log('%c[OmniVoice 🎤] Strumień mikrofonu podtrzymany pomyślnie.', 'color: #00FF66; font-size: 11px;');
      this.setupAudioMeter();
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        console.warn('%c[OmniVoice ⚠️] Brak uprawnień do mikrofonu (getUserMedia rejected). Zezwól na dostęp w przeglądarce.', 'color: #FFB800;');
        this.status = 'permission-denied';
        this.notifyStatus('permission-denied');
        this.attachAutoRecoveryOnUserInteraction();
      }
    }
  }

  async resumeAudioContext() {
    try {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
        console.log('[OmniVoice 🔊] AudioContext odblokowany pomyślnie.');
      }
      if (!this.micStream) {
        await this.acquireSilentAudioStream(true);
      }
    } catch (e) {
      console.warn('[OmniVoice] Błąd wznawiania AudioContext:', e);
    }
  }

  setupAudioMeter() {
    if (!this.micStream || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioContext || this.audioContext.state === 'closed') {
        this.audioContext = new AudioCtx();
      }

      // Rejestracja odblokowania AudioContext na pierwsze kliknięcie (zgodnie z Autoplay Policy)
      const ensureRunning = () => {
        if (this.audioContext && this.audioContext.state === 'suspended') {
          this.audioContext.resume().catch(() => {});
        }
      };
      if (this.audioContext.state === 'suspended') {
        window.addEventListener('click', ensureRunning, { once: true });
        window.addEventListener('pointerdown', ensureRunning, { once: true });
        window.addEventListener('keydown', ensureRunning, { once: true });
        this.audioContext.resume().catch(() => {});
      }

      const source = this.audioContext.createMediaStreamSource(this.micStream);
      const analyser = this.audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.3;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.fftSize);
      const updateVolume = () => {
        if (!this.micStream) {
          this.volumeLevel = 0;
          return;
        }

        // Pomiar amplitudy fali w dziedzinie czasu (Time Domain RMS)
        analyser.getByteTimeDomainData(dataArray);
        let sumSquares = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const deviation = (dataArray[i] - 128) / 128;
          sumSquares += deviation * deviation;
        }
        const rms = Math.sqrt(sumSquares / dataArray.length);

        // Skalowanie dynamiczne czułe na szept (RMS ~0.008 - 0.25)
        let normalizedVol = 0;
        if (rms > 0.005) {
          normalizedVol = Math.min(100, Math.round(Math.pow(rms * 4.5, 0.75) * 100));
        }
        this.volumeLevel = normalizedVol;

        window.dispatchEvent(new CustomEvent('omniMicVolume', { detail: { volume: normalizedVol, rms } }));
        this.meterAnimFrame = requestAnimationFrame(updateVolume);
      };

      if (this.meterAnimFrame && typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(this.meterAnimFrame);
      }
      this.meterAnimFrame = requestAnimationFrame(updateVolume);
    } catch (e) {
      console.warn('[OmniVoice] Nie udało się zainicjować miernika VU audio:', e);
    }
  }

  releaseSilentAudioStream() {
    if (this.meterAnimFrame && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.meterAnimFrame);
      this.meterAnimFrame = null;
    }
    if (this.micStream) {
      try {
        this.micStream.getTracks().forEach(track => track.stop());
      } catch {}
      this.micStream = null;
    }
    this.volumeLevel = 0;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('omniMicVolume', { detail: { volume: 0 } }));
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
    if (!this.isEnabled() || this.isPaused || this.isAiSpeaking || this.isLiveModeActive) return;

    this.restartTimeout = setTimeout(() => {
      if (!this.isListening && !this.isStarting && !this.isPaused && this.isEnabled() && !this.isAiSpeaking && !this.isLiveModeActive) {
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
    if (this.isListening || this.isStarting || this.isAiSpeaking || this.isLiveModeActive) return;

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
        volumeLevel: this.volumeLevel,
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
        await this.resumeAudioContext();
        await this.acquireSilentAudioStream(true);
        this.start();
      },
      resumeAudio: () => this.resumeAudioContext(),
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
