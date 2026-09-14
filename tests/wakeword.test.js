import { describe, it, expect } from 'vitest';
import {
  isWakeWord,
  extractWakeWordPayload,
  cleanTextForSpeech,
  normalizeSpeechText
} from '../modules/services/wakeWordService.js';

describe('Wake Word Service ("Hej Omni")', () => {
  describe('normalizeSpeechText', () => {
    it('powinien normalizować tekst do małych liter i usuwać zbędne znaki', () => {
      expect(normalizeSpeechText('  Hej, Omni!  ')).toBe('hej omni');
      expect(normalizeSpeechText('HEY... OMNI???')).toBe('hey omni');
      expect(normalizeSpeechText('')).toBe('');
      expect(normalizeSpeechText(null)).toBe('');
    });
  });

  describe('isWakeWord (Detekcja frazy wybudzającej)', () => {
    it('powinien wykrywać podstawowe wywołanie "hej omni"', () => {
      expect(isWakeWord('hej omni')).toBe(true);
      expect(isWakeWord('Hej Omni')).toBe(true);
      expect(isWakeWord('HEJ OMNI!')).toBe(true);
      expect(isWakeWord('hej omni?')).toBe(true);
    });

    it('powinien wykrywać alternatywne powitania z Omni', () => {
      expect(isWakeWord('hey omni')).toBe(true);
      expect(isWakeWord('cześć omni')).toBe(true);
      expect(isWakeWord('siema omni')).toBe(true);
      expect(isWakeWord('halo omni')).toBe(true);
      expect(isWakeWord('ok omni')).toBe(true);
      expect(isWakeWord('okej omni')).toBe(true);
      expect(isWakeWord('witaj omni')).toBe(true);
    });

    it('powinien wykrywać warianty nazwy "omnidash" oraz "omi"', () => {
      expect(isWakeWord('hej omnidash')).toBe(true);
      expect(isWakeWord('hej omi')).toBe(true);
      expect(isWakeWord('hey omi')).toBe(true);
    });

    it('powinien wykrywać fonetyczne warianty cichej mowy w j. polskim (np. "hej oni", "hej o mnie", "o mnie", "omini")', () => {
      expect(isWakeWord('hej oni')).toBe(true);
      expect(isWakeWord('ej oni')).toBe(true);
      expect(isWakeWord('hej o mnie')).toBe(true);
      expect(isWakeWord('ej o mnie')).toBe(true);
      expect(isWakeWord('hej on mi')).toBe(true);
      expect(isWakeWord('o mnie')).toBe(true);
      expect(isWakeWord('omini')).toBe(true);
      expect(isWakeWord('hej omini')).toBe(true);
      expect(isWakeWord('hej mommy')).toBe(true);
      expect(isWakeWord('asystent')).toBe(true);
      expect(isWakeWord('komputer')).toBe(true);
      expect(isWakeWord('omni')).toBe(true);
      expect(isWakeWord('omnie')).toBe(true);
    });

    it('powinien wykrywać wywołanie "omni" z pytaniem w jednym zdaniu', () => {
      expect(isWakeWord('hej omni jaka jest dzisiaj pogoda?')).toBe(true);
      expect(isWakeWord('hej o mnie jaka jest pogoda?')).toBe(true);
      expect(isWakeWord('o mnie jaka jest pogoda?')).toBe(true);
      expect(isWakeWord('omini co tam?')).toBe(true);
      expect(isWakeWord('hej oni ile mam zadan')).toBe(true);
      expect(isWakeWord('hej omni, sprawdź plan lekcji')).toBe(true);
      expect(isWakeWord('omni, pokaż finanse')).toBe(true);
    });

    it('powinien odrzucać wypowiedzi niezawierające słowa wybudzającego', () => {
      expect(isWakeWord('jaka jest dzisiaj pogoda?')).toBe(false);
      expect(isWakeWord('muszę kupić mleko i chleb')).toBe(false);
      expect(isWakeWord('włącz światło w pokoju')).toBe(false);
      expect(isWakeWord('nie mówię do ciebie')).toBe(false);
      expect(isWakeWord('')).toBe(false);
      expect(isWakeWord(null)).toBe(false);
      expect(isWakeWord(undefined)).toBe(false);
    });
  });

  describe('extractWakeWordPayload (Ekstrakcja pytania z frazy wybudzającej)', () => {
    it('powinien wyodrębnić pytanie jeśli padło bezpośrednio po "hej omni"', () => {
      expect(extractWakeWordPayload('hej omni jaka jest pogoda?')).toBe('jaka jest pogoda?');
      expect(extractWakeWordPayload('hej omni, ile mam zadań na dziś')).toBe('ile mam zadań na dziś');
      expect(extractWakeWordPayload('cześć omni: podsumuj wydatki')).toBe('podsumuj wydatki');
    });

    it('powinien zwrócić pusty ciąg gdy padło samo powitanie', () => {
      expect(extractWakeWordPayload('hej omni')).toBe('');
      expect(extractWakeWordPayload('Hej Omni!')).toBe('');
      expect(extractWakeWordPayload('hey omni...')).toBe('');
    });
  });

  describe('cleanTextForSpeech (Sanityzacja tekstu dla syntezatora TTS)', () => {
    it('powinien usuwać formatowanie Markdown i linki', () => {
      const input = '**Witaj Jakubie!** Masz dziś *3 zadania*. Zobacz [tutaj](https://example.com).';
      const output = cleanTextForSpeech(input);
      expect(output).toContain('Witaj Jakubie');
      expect(output).toContain('Masz dziś 3 zadania');
      expect(output).toContain('Zobacz tutaj');
      expect(output).not.toContain('**');
      expect(output).not.toContain('https://');
    });

    it('powinien usuwać znaczniki akcji [ACTION:SEND_PUSH]', () => {
      const input = 'Wysyłam powiadomienie na Twój telefon.\n[ACTION:SEND_PUSH title="Test" body="Treść"]';
      const output = cleanTextForSpeech(input);
      expect(output).toBe('Wysyłam powiadomienie na Twój telefon.');
      expect(output).not.toContain('ACTION:SEND_PUSH');
    });

    it('powinien usuwać bloki kodu i tabele markdown', () => {
      const input = 'Oto plan:\n| Lekcja | Godzina |\n| Fizyka | 8:00 |\n```const a = 1;```\nPowodzenia!';
      const output = cleanTextForSpeech(input);
      expect(output).toContain('Oto plan');
      expect(output).toContain('Powodzenia');
      expect(output).not.toContain('const a = 1');
    });

    it('powinien usuwać emotikony', () => {
      const input = 'Temperatura wynosi 22°C ☀️ i jest bezchmurnie 🚀!';
      const output = cleanTextForSpeech(input);
      expect(output).toContain('Temperatura wynosi 22°C');
      expect(output).toContain('jest bezchmurnie');
      expect(output).not.toContain('☀️');
      expect(output).not.toContain('🚀');
    });
  });
});
