import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  ttsService, 
  FISH_AUDIO_DEFAULT_VOICES, 
  EDGE_DEFAULT_VOICES 
} from '../modules/services/ttsService.js';

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

global.localStorage = localStorageMock;
if (typeof window !== 'undefined') {
  window.localStorage = localStorageMock;
}

describe('Fish Audio TTS Engine Integration (v2.33.0)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorageMock.clear();
    ttsService.setEngine('edge');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    ttsService.stop();
  });

  describe('1. Profile i Konfiguracja Glosow Fish Audio', () => {
    it('zawiera domyslne modele referencyjne Fish Audio', () => {
      expect(FISH_AUDIO_DEFAULT_VOICES).toBeDefined();
      expect(Array.isArray(FISH_AUDIO_DEFAULT_VOICES)).toBe(true);
      expect(FISH_AUDIO_DEFAULT_VOICES.length).toBeGreaterThanOrEqual(4);

      const ids = FISH_AUDIO_DEFAULT_VOICES.map(v => v.id);
      expect(ids).toContain('800a830bc9bc42dd90a7826279f53835'); // Anna
      expect(ids).toContain('54d9e8460ec444009252c4167e4fe337'); // Michał
      expect(ids).toContain('custom');
    });

    it('poprawnie pobiera klucz API Fish Audio z localStorage', () => {
      expect(ttsService.getFishAudioKey()).toBe('');
      localStorageMock.setItem('system_fish_audio_api_key', 'test_fish_key_123');
      expect(ttsService.getFishAudioKey()).toBe('test_fish_key_123');
    });

    it('poprawnie ustawia i wykrywa silnik fish_audio', () => {
      ttsService.setEngine('fish_audio');
      expect(ttsService.getEngine()).toBe('fish_audio');
    });

    it('zwraca domyslny identyfikator glosu dla Fish Audio', () => {
      ttsService.setEngine('fish_audio');
      expect(ttsService.getVoiceId()).toBe(FISH_AUDIO_DEFAULT_VOICES[0].id);

      localStorageMock.setItem('system_fish_audio_voice_id', 'custom_voice_abc');
      expect(ttsService.getVoiceId()).toBe('custom_voice_abc');
    });
  });

  describe('2. Wywolanie Bezposrednie API Fish Audio (api.fish.audio/v1/tts)', () => {
    it('formatuje zapytanie HTTP do api.fish.audio z prawidlowymi naglowkami i payloadem', async () => {
      const mockAudioBytes = new Uint8Array([1, 2, 3, 4]).buffer;
      let requestedUrl = '';
      let requestOptions = null;

      global.fetch = vi.fn().mockImplementation((url, opts) => {
        requestedUrl = url;
        requestOptions = opts;
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: {
            get: (name) => name.toLowerCase() === 'content-type' ? 'audio/mpeg' : null
          },
          blob: async () => new Blob([mockAudioBytes], { type: 'audio/mpeg' })
        });
      });

      // Mock HTML Audio element z prawidlowa obsluga onplay i onended
      global.Audio = vi.fn().mockImplementation(() => {
        const audioInstance = {
          play: vi.fn().mockImplementation(async () => {
            if (audioInstance.onplay) audioInstance.onplay();
            setTimeout(() => {
              if (audioInstance.onended) audioInstance.onended();
            }, 10);
            return Promise.resolve();
          }),
          pause: vi.fn(),
          onplay: null,
          onended: null,
          onerror: null
        };
        return audioInstance;
      });

      global.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/mock-audio');
      global.URL.revokeObjectURL = vi.fn();

      const onStart = vi.fn();
      const onEnd = vi.fn();

      await ttsService.speakWithFishAudio(
        'Witaj w systemie OmniDash',
        'fish_live_secret_key',
        '800a830bc9bc42dd90a7826279f53835',
        { onStart, onEnd }
      );

      expect(requestedUrl).toBe('https://api.fish.audio/v1/tts');
      expect(requestOptions.method).toBe('POST');
      expect(requestOptions.headers['Authorization']).toBe('Bearer fish_live_secret_key');
      expect(requestOptions.headers['Content-Type']).toBe('application/json');

      const body = JSON.parse(requestOptions.body);
      expect(body.text).toBe('Witaj w systemie OmniDash');
      expect(body.reference_id).toBe('800a830bc9bc42dd90a7826279f53835');
      expect(body.format).toBe('mp3');
      expect(onStart).toHaveBeenCalled();
      expect(onEnd).toHaveBeenCalled();
    });
  });

  describe('3. Odpornosc na Bledy i Fallback', () => {
    it('w przypadku bledu serwera Fish Audio, wywoluje fallback bez rzucania krytycznego wyjatku', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const fallbackSpy = vi.spyOn(ttsService, 'speakWithEdgeTTS').mockResolvedValue(true);

      ttsService.setEngine('fish_audio');
      localStorageMock.setItem('system_fish_audio_api_key', 'invalid_key');

      await ttsService.speak('Test awaryjnego przelaczenia na Edge Neural', {
        engine: 'fish_audio',
        voiceId: '800a830bc9bc42dd90a7826279f53835'
      });

      expect(fallbackSpy).toHaveBeenCalled();
    });
  });
});
