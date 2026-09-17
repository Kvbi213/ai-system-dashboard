import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkElevenLabsQuota, ttsService, ELEVENLABS_DEFAULT_VOICES, GOOGLE_DEFAULT_VOICES } from '../modules/services/ttsService.js';

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

describe('TTS Service & ElevenLabs Quota Management', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. checkElevenLabsQuota()', () => {
    it('zwraca bezpieczną odpowiedź przy braku klucza API', async () => {
      const quota = await checkElevenLabsQuota('');
      expect(quota.hasKey).toBe(false);
      expect(quota.tier).toBe('brak');
      expect(quota.characterCount).toBe(0);
      expect(quota.remaining).toBe(0);
      expect(quota.isExceeded).toBe(false);
    });

    it('poprawnie przetwarza odpowiedź konta z wyczerpanym limitem (status quota_exceeded / 6 znaków)', async () => {
      const mockSubscription = {
        tier: 'free',
        character_count: 9994,
        character_limit: 10000,
        status: 'quota_exceeded',
        next_character_count_reset_unix: 1792024066
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockSubscription
      });

      const quota = await checkElevenLabsQuota('mock_key');
      expect(quota.hasKey).toBe(true);
      expect(quota.tier).toBe('free');
      expect(quota.characterCount).toBe(9994);
      expect(quota.characterLimit).toBe(10000);
      expect(quota.remaining).toBe(6);
      expect(quota.isExceeded).toBe(true);
      expect(quota.percentUsed).toBe(99.9);
      expect(quota.resetDate).toBeDefined();
    });

    it('poprawnie przetwarza aktywne konto z dużym zapasem znaków', async () => {
      const mockSubscription = {
        tier: 'starter',
        character_count: 2500,
        character_limit: 30000,
        status: 'active',
        next_character_count_reset_unix: 1792024066
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockSubscription
      });

      const quota = await checkElevenLabsQuota('mock_key_active');
      expect(quota.hasKey).toBe(true);
      expect(quota.characterCount).toBe(2500);
      expect(quota.characterLimit).toBe(30000);
      expect(quota.remaining).toBe(27500);
      expect(quota.isExceeded).toBe(false);
      expect(quota.percentUsed).toBe(8.3);
    });
  });

  describe('2. speakWithElevenLabs() i detekcja błędu quota_exceeded', () => {
    it('wyrzuca wyjątek informacyjny i rozgłasza zdarzenie ttsQuotaExceeded przy kodzie 401', async () => {
      const quotaErrorResponse = {
        detail: {
          type: 'invalid_request',
          code: 'quota_exceeded',
          message: 'This request exceeds your quota of 10000. You have 6 credits remaining, while 19 credits are required for this request.',
          status: 'quota_exceeded'
        }
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => JSON.stringify(quotaErrorResponse),
        headers: { get: () => 'application/json' }
      });

      let eventFired = false;
      let eventDetail = null;

      const handler = (e) => {
        eventFired = true;
        eventDetail = e.detail;
      };
      window.addEventListener('ttsQuotaExceeded', handler);

      await expect(
        ttsService.speakWithElevenLabs('Testowy tekst syntezy', 'mock_key', 'CwhRBWXzGAHq8TQ4Fs17', {})
      ).rejects.toThrow(/Wyczerpano miesięczny limit znaków/);

      expect(eventFired).toBe(true);
      expect(eventDetail).toBeDefined();
      expect(eventDetail.engine).toBe('elevenlabs');
      expect(eventDetail.status).toBe('quota_exceeded');
      expect(eventDetail.remainingCredits).toBe(6);

      window.removeEventListener('ttsQuotaExceeded', handler);
    });
  });

  describe('3. Domyślne identyfikatory lektorów ElevenLabs', () => {
    it('zawiera oficjalne zweryfikowane głosy (Roger, Bella, Sarah, Adam)', () => {
      const voiceIds = ELEVENLABS_DEFAULT_VOICES.map(v => v.id);
      expect(voiceIds).toContain('CwhRBWXzGAHq8TQ4Fs17'); // Roger
      expect(voiceIds).toContain('hpp4J3VqNfWAUOO0d1Us'); // Bella
      expect(voiceIds).toContain('EXAVITQu4vr4xnSDxMaL'); // Sarah
      expect(voiceIds).toContain('pNInz6obpgDQGcFmaJgB'); // Adam
      expect(ELEVENLABS_DEFAULT_VOICES.length).toBe(21);
    });
  });

  describe('4. Google Cloud Neural TTS & Eliminacja Web Speech', () => {
    it('całkowicie usuwa speakWithWebSpeech z obiektu ttsService', () => {
      expect(ttsService.speakWithWebSpeech).toBeUndefined();
    });

    it('migruje silnik web na bezpieczny domyślny silnik studyjny', () => {
      localStorage.setItem('system_tts_engine', 'web');
      expect(ttsService.getEngine()).not.toBe('web');
      expect(['edge', 'elevenlabs', 'google']).toContain(ttsService.getEngine());
    });

    it('zawiera zweryfikowane głosy Google WaveNet i Neural2', () => {
      const voiceIds = GOOGLE_DEFAULT_VOICES.map(v => v.id);
      expect(voiceIds).toContain('pl-PL-Wavenet-B');
      expect(voiceIds).toContain('pl-PL-Neural2-A');
      expect(voiceIds).toContain('en-US-Journey-D');
      expect(GOOGLE_DEFAULT_VOICES.length).toBeGreaterThanOrEqual(5);
    });

    it('speakWithGoogle poprawnie wykonuje bezpośrednie zapytanie REST do Google Cloud TTS', async () => {
      const mockBase64Mp3 = 'SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA';
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ audioContent: mockBase64Mp3 }),
        headers: { get: () => 'application/json' }
      });

      // Mock playAudioBlob aby nie uruchamiać HTML5 Audio w jsdom
      const playBlobSpy = vi.spyOn(ttsService, 'playAudioBlob').mockResolvedValue();

      await ttsService.speakWithGoogle('Test mowy Google Cloud', 'AIzaSy_mock_key', 'pl-PL-Wavenet-B', {});

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://texttospeech.googleapis.com/v1/text:synthesize?key=AIzaSy_mock_key'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"name":"pl-PL-Wavenet-B"')
        })
      );
      expect(playBlobSpy).toHaveBeenCalled();
    });
  });
});

