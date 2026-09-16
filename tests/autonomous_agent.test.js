import { describe, it, expect } from 'vitest';
import {
  isStatusInquiry,
  isAbortCommand,
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

  describe('3. Wyodrębnianie Zadań ze Smartfona (extractTaskFromPhone)', () => {
    it('wykrywa i oczyszcza prefiksy zleceniowe', () => {
      expect(extractTaskFromPhone('Omni: zbadaj modele AI')).toBe('zbadaj modele AI');
      expect(extractTaskFromPhone('Agent: przygotuj raport o rynkach')).toBe('przygotuj raport o rynkach');
      expect(extractTaskFromPhone('Zadanie: sprawdź kurs walut')).toBe('sprawdź kurs walut');
      expect(extractTaskFromPhone('zbadaj przyszłość LLM')).toBe('przyszłość LLM');
      expect(extractTaskFromPhone('przebadaj roadmapę OpenAI')).toBe('roadmapę OpenAI');
      expect(extractTaskFromPhone('research: trendy technologiczne 2026')).toBe('trendy technologiczne 2026');
    });

    it('obsługuje bezpośrednie czasowniki zlecające', () => {
      expect(extractTaskFromPhone('znajdź najlepsze modele do programowania')).toBe('znajdź najlepsze modele do programowania');
      expect(extractTaskFromPhone('analizuj wyniki finansowe')).toBe('analizuj wyniki finansowe');
    });

    it('zwraca null dla neutralnych wiadomości', () => {
      expect(extractTaskFromPhone('cześć jak się masz')).toBe(null);
      expect(extractTaskFromPhone('co tam')).toBe(null);
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
  });

});
