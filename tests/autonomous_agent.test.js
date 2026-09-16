import { describe, it, expect } from 'vitest';
import {
  isStatusInquiry,
  isAbortCommand,
  isDeepResearchIntent,
  extractTaskFromPhone,
  decomposeGoal,
  generateFallbackPlan
} from '../modules/services/autonomousAgent.js';
import { formatPushText } from '../modules/services/pushbulletService.js';

describe('Autonomiczny Agent Ciągły (OmniDaemon 24/7) - Klasyfikatory i Narzędzia', () => {

  describe('1. Detekcja Zapytań o Stan ze Smartfona (isStatusInquiry)', () => {
    it('poprawnie wykrywa słowa kluczowe stanu pracy', () => {
      expect(isStatusInquiry('stan')).toBe(true);
      expect(isStatusInquiry('status')).toBe(true);
      expect(isStatusInquiry('jak idzie')).toBe(true);
      expect(isStatusInquiry('jak idzie badanie?')).toBe(true);
      expect(isStatusInquiry('co robisz')).toBe(true);
      expect(isStatusInquiry('jaki jest stan pracy?')).toBe(true);
      expect(isStatusInquiry('ile jeszcze czasu?')).toBe(true);
      expect(isStatusInquiry('raport')).toBe(true);
      expect(isStatusInquiry('na jakim etapie jesteś?')).toBe(true);
    });

    it('odrzuca wiadomości niezwiązane ze statusem', () => {
      expect(isStatusInquiry('kup mleko')).toBe(false);
      expect(isStatusInquiry('jaka jest dzisiaj pogoda?')).toBe(false);
      expect(isStatusInquiry('dodaj zadanie do kalendarza')).toBe(false);
      expect(isStatusInquiry('')).toBe(false);
      expect(isStatusInquiry(null)).toBe(false);
    });
  });

  describe('2. Detekcja Poleceń Zatrzymania / Kill Switch (isAbortCommand)', () => {
    it('poprawnie wykrywa komendy zatrzymania', () => {
      expect(isAbortCommand('stop')).toBe(true);
      expect(isAbortCommand('zatrzymaj')).toBe(true);
      expect(isAbortCommand('anuluj')).toBe(true);
      expect(isAbortCommand('przerwij')).toBe(true);
      expect(isAbortCommand('pauza')).toBe(true);
      expect(isAbortCommand('kill')).toBe(true);
      expect(isAbortCommand('stop zadanie')).toBe(true);
    });

    it('odrzuca zwykłe zdania', () => {
      expect(isAbortCommand('zbadaj modele ai')).toBe(false);
      expect(isAbortCommand('kontynuuj')).toBe(false);
      expect(isAbortCommand('')).toBe(false);
    });
  });

  describe('3. Detekcja Intencji Badawczych Deep Research (isDeepResearchIntent)', () => {
    it('poprawnie rozpoznaje złożone cele badawcze z Brave Search', () => {
      expect(isDeepResearchIntent('przebadaj modele ai który ma najlepszą przyszłość plany itp')).toBe(true);
      expect(isDeepResearchIntent('zbierz informacje na temat modeli ai')).toBe(true);
      expect(isDeepResearchIntent('szukaj na ich temat wszystkiego')).toBe(true);
      expect(isDeepResearchIntent('daj mi szczegółowe dane każdego z modeli')).toBe(true);
      expect(isDeepResearchIntent('przeszukaj sieć pod kątem nowych modeli LLM')).toBe(true);
      expect(isDeepResearchIntent('porównaj modele sztucznej inteligencji')).toBe(true);
    });

    it('odrzuca zapytania o stan i proste polecenia', () => {
      expect(isDeepResearchIntent('stan')).toBe(false);
      expect(isDeepResearchIntent('status')).toBe(false);
      expect(isDeepResearchIntent('stop')).toBe(false);
      expect(isDeepResearchIntent('jaka jest pogoda?')).toBe(false);
      expect(isDeepResearchIntent('')).toBe(false);
    });
  });

  describe('4. Wyodrębnianie Zadań ze Smartfona (extractTaskFromPhone)', () => {
    it('wykrywa i oczyszcza prefiksy zleceniowe', () => {
      expect(extractTaskFromPhone('Omni: zbadaj modele AI')).toBe('zbadaj modele AI');
      expect(extractTaskFromPhone('Agent: przygotuj raport o rynkach')).toBe('przygotuj raport o rynkach');
      expect(extractTaskFromPhone('Zadanie: sprawdź kurs walut')).toBe('sprawdź kurs walut');
      expect(extractTaskFromPhone('zbadaj przyszłość LLM')).toBe('przyszłość LLM');
      expect(extractTaskFromPhone('przebadaj roadmapę OpenAI')).toBe('roadmapę OpenAI');
      expect(extractTaskFromPhone('research: trendy technologiczne 2026')).toBe('trendy technologiczne 2026');
    });

    it('obsługuje bezpośrednie czasowniki zlecające i zapytania o modele', () => {
      expect(extractTaskFromPhone('znajdź najlepsze modele do programowania')).toBe('znajdź najlepsze modele do programowania');
      expect(extractTaskFromPhone('analizuj wyniki finansowe')).toBe('analizuj wyniki finansowe');
      expect(extractTaskFromPhone('daj mi szczegółowe dane każdego z modeli')).toBe('daj mi szczegółowe dane każdego z modeli');
      expect(extractTaskFromPhone('szukaj na ich temat wszystkiego')).toBe('szukaj na ich temat wszystkiego');
      expect(extractTaskFromPhone('zbierz informacje na temat modeli ai')).toBe('zbierz informacje na temat modeli ai');
    });

    it('zwraca null dla neutralnych wiadomości i zapytań o stan', () => {
      expect(extractTaskFromPhone('cześć jak się masz')).toBe(null);
      expect(extractTaskFromPhone('co tam')).toBe(null);
      expect(extractTaskFromPhone('stan')).toBe(null);
      expect(extractTaskFromPhone('stop')).toBe(null);
      expect(extractTaskFromPhone('')).toBe(null);
    });
  });

  describe('4. Formatowanie Powiadomień i Raportów Pushbullet', () => {
    it('poprawnie formatuje zwięzły raport o stanie na telefon', () => {
      const rawReport = `• Zadanie: Badanie modeli AI\n• Status: W TRAKCIE (60%)\n• Krok: Analiza Google Gemini\n• Zebrane źródła: 12`;
      const formatted = formatPushText(rawReport);
      expect(formatted).toContain('Zadanie: Badanie modeli AI');
      expect(formatted).toContain('Status: W TRAKCIE (60%)');
      expect(formatted).toContain('Krok: Analiza Google Gemini');
      expect(formatted).toContain('Zebrane źródła: 12');
    });

    it('oczyszcza zbędne tagi Markdown w raportach końcowych', () => {
      const markdown = `## Raport Końcowy\n**Modele hybrydowe** zyskują przewagę.\n- Wniosek 1\n- Wniosek 2`;
      const formatted = formatPushText(markdown);
      expect(formatted).not.toContain('##');
      expect(formatted).not.toContain('**');
      expect(formatted).toContain('Modele hybrydowe zyskują przewagę.');
    });
  });

  describe('5. Odporność Dekompozycji Celów (Fallback Planning)', () => {
    it('generuje bezpieczną strukturę etapów w trybie awaryjnym', () => {
      const res = generateFallbackPlan('Analiza wydajności silników bazodanowych');
      expect(res).toBeDefined();
      expect(res.steps).toBeDefined();
      expect(Array.isArray(res.steps)).toBe(true);
      expect(res.steps.length).toBeGreaterThanOrEqual(2);
      expect(res.steps[0]).toHaveProperty('step');
      expect(res.steps[0]).toHaveProperty('query');
      expect(res.steps[0]).toHaveProperty('focus');
    });

    it('generuje 3-etapowy zaawansowany plan dla zapytań o modele AI', () => {
      const res = generateFallbackPlan('przebadaj modele ai który ma najlepszą przyszłość');
      expect(res).toBeDefined();
      expect(res.title).toContain('Modeli AI');
      expect(res.steps.length).toBe(3);
      expect(res.steps[0].query).toContain('benchmarks');
      expect(res.steps[1].query).toContain('roadmap');
      expect(res.steps[2].query).toContain('context window');
    });

    it('generuje dedykowany komercyjny plan dla zapytań wykluczających modele open-source', () => {
      const prompt = 'zacznij dokładny skan wszystkich topowych modeli ai chodzi mi o dostępne w chacie a nie modele opensorce. informuj mnie na bierząco powiadomieniami push';
      const res = generateFallbackPlan(prompt);
      expect(res).toBeDefined();
      expect(res.title).toContain('Komercyjnych Modeli AI w Czacie 2026');
      expect(res.steps.length).toBe(3);
      expect(res.steps[0].query).toContain('commercial chat AI');
      expect(res.steps[0].query).not.toContain('DeepSeek');
      expect(res.steps[0].query).not.toContain('Llama');
      expect(res.steps[1].query).toContain('Claude 3.7 Sonnet');
      expect(res.steps[2].query).toContain('subscriptions');
    });
  });

  describe('6. Ochrona przed Pętlą Echa Powiadomień (isOwnSystemNotification)', () => {
    it('wykrywa powiadomienia wygenerowane przez system OmniDash', async () => {
      const { isOwnSystemNotification } = await import('../modules/pushbullet.js');
      expect(isOwnSystemNotification('OmniDash AI 🤖', 'Raport gotowy')).toBe(true);
      expect(isOwnSystemNotification('OmniAgent Cloud 🤖', 'Zadanie przyjęte')).toBe(true);
      expect(isOwnSystemNotification('OmniDaemon 24/7', 'Demon aktywny')).toBe(true);
      expect(isOwnSystemNotification('OmniDash Auto-Finanse 💳', 'Zapisano wydatek')).toBe(true);
    });

    it('przepuszcza wiadomości od operatora i aplikacji zewnętrznych', async () => {
      const { isOwnSystemNotification } = await import('../modules/pushbullet.js');
      expect(isOwnSystemNotification('Jakub', 'Jaki mam plan lekcji na jutro?')).toBe(false);
      expect(isOwnSystemNotification('mBank', 'Płatność kartą 45.00 PLN')).toBe(false);
      expect(isOwnSystemNotification('', 'ile mam dzisiaj zadań?')).toBe(false);
    });
  });

  describe('7. Obsługa Zapytań ze Smartfona i Obowiązkowa Odpowiedź Push (OmniDaemon)', () => {
    it('generuje wiadomości z chatMode: daemon i źródłami mobilnymi', async () => {
      const { handleMobileChatQuery } = await import('../modules/pushbullet.js');
      
      const res = await handleMobileChatQuery('Jaki mam plan lekcji?', {
        mockAiResponse: 'Plan lekcji na dziś: • 08:00 Matematyka • 09:00 Informatyka',
        skipCloudSync: true,
        mockPush: true
      });
      expect(res).toBeDefined();
      expect(res.userMsg).toBeDefined();
      expect(res.userMsg.chatMode).toBe('daemon');
      expect(res.userMsg.source).toBe('pushbullet_mobile');
      expect(res.userMsg.content).toBe('Jaki mam plan lekcji?');

      expect(res.aiMsg).toBeDefined();
      expect(res.aiMsg.chatMode).toBe('daemon');
      expect(res.aiMsg.source).toBe('omni_daemon');
      expect(res.aiMsg.content).toContain('Plan lekcji na dziś');
      expect(res.pushRes).toBeDefined();
      expect(res.pushRes.success).toBe(true);
    });

    it('zwraca null dla pustych lub nieprawidłowych zapytań', async () => {
      const { handleMobileChatQuery } = await import('../modules/pushbullet.js');
      expect(await handleMobileChatQuery('')).toBeNull();
      expect(await handleMobileChatQuery('   ')).toBeNull();
      expect(await handleMobileChatQuery(null)).toBeNull();
    });
  });

});
