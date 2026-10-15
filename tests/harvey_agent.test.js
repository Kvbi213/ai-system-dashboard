import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  HARVEY_FRAMEWORKS, 
  HARVEY_SIGNALS, 
  ANTI_AI_TELLS_RULES, 
  generateHarveyPrompt 
} from '../modules/ai/harveyPersona.js';
import { parseAndExecuteAiActionsWithWidgets } from '../modules/services/clientAiDispatcher.js';

describe('Harvey Sales & Outreach Agent (v2.33.0)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Struktura i Integralnosc Ram Sprzedazowych (Frameworks)', () => {
    it('zawiera komplet 5 sprawdzonych ram konwersji cold email', () => {
      expect(HARVEY_FRAMEWORKS).toBeDefined();
      expect(HARVEY_FRAMEWORKS.AIDA).toBeDefined();
      expect(HARVEY_FRAMEWORKS.PAS).toBeDefined();
      expect(HARVEY_FRAMEWORKS.BAB).toBeDefined();
      expect(HARVEY_FRAMEWORKS.QVC).toBeDefined();
      expect(HARVEY_FRAMEWORKS.THREE_PS).toBeDefined();
    });

    it('kazda rama posiada pelna definicje i formule konwersji', () => {
      Object.entries(HARVEY_FRAMEWORKS).forEach(([key, fw]) => {
        expect(fw.name).toBeDefined();
        expect(fw.description).toBeDefined();
        expect(fw.formula).toBeDefined();
        expect(fw.formula.length).toBeGreaterThan(10);
      });
    });

    it('zawiera kluczowe sygnaly rynkowe (buying signals)', () => {
      expect(Array.isArray(HARVEY_SIGNALS)).toBe(true);
      expect(HARVEY_SIGNALS.length).toBeGreaterThanOrEqual(10);
      const joined = HARVEY_SIGNALS.join(' ');
      expect(joined).toContain('SERP_RANK');
      expect(joined).toContain('NO_ONLINE_BOOKING');
      expect(joined).toContain('INCUMBENT_AGENCY');
      expect(joined).toContain('RUNNING_META_ADS');
    });

    it('zawiera scisle reguly eliminacji sztucznosci AI (Anti-AI Tells)', () => {
      expect(Array.isArray(ANTI_AI_TELLS_RULES)).toBe(true);
      expect(ANTI_AI_TELLS_RULES.length).toBeGreaterThanOrEqual(3);
      const joinedRules = ANTI_AI_TELLS_RULES.join(' ');
      expect(joinedRules).toContain('ZAKAZ korporacyjnych banałów AI');
      expect(joinedRules).toContain('50-110 słów');
    });
  });

  describe('2. Generowanie Promptu Systemowego (generateHarveyPrompt)', () => {
    it('tworzy prompt systemowy z prawidlowymi danymi operatora i czasem', () => {
      const prompt = generateHarveyPrompt({
        userName: 'Damian',
        language: 'pl',
        dateStr: 'czwartek, 15 października 2026',
        timeStr: '09:30',
        tasksSummary: '- Zadanie 1: Pipeline sprzedażowy',
        financesSummary: 'Bilans: 15400 PLN'
      });

      expect(prompt).toContain('Jesteś HARVEY');
      expect(prompt).toContain('Damian');
      expect(prompt).toContain('czwartek, 15 października 2026');
      expect(prompt).toContain('ALWAYS BE CLOSING (ABC)');
      expect(prompt).toContain('Pipeline sprzedażowy');
      expect(prompt).toContain('Bilans: 15400 PLN');
      expect(prompt).toContain('[ACTION:HARVEY_PROSPECT');
      expect(prompt).toContain('[ACTION:HARVEY_CAMPAIGN');
      expect(prompt).toContain('[ACTION:HARVEY_QUALIFY');
    });

    it('stosuje bezpieczne wartosci domyslne przy braku parametrow', () => {
      const prompt = generateHarveyPrompt();
      expect(prompt).toContain('Jesteś HARVEY');
      expect(prompt).toContain('Operator');
      expect(prompt).toContain('BIEŻĄCY STAN DANYCH SYSTEMOWYCH:');
    });
  });

  describe('3. Parsowanie i Wykonywanie Akcji Harvey (Action Tags)', () => {
    it('poprawnie przetwarza akcje prospectingu [ACTION:HARVEY_PROSPECT]', () => {
      const aiResponse = `Oto analiza rynku w Warszawie:\n[ACTION:HARVEY_PROSPECT query="stomatologia Warszawa" icp="Gabinety prywatne 3+ fotele"]`;
      const { cleanedText, executedTools } = parseAndExecuteAiActionsWithWidgets(aiResponse);

      expect(cleanedText.trim()).toBe('Oto analiza rynku w Warszawie:');
      expect(executedTools.length).toBe(1);
      expect(executedTools[0].tool).toBe('harvey_prospecting');
      expect(executedTools[0].status).toBe('200 OK');
      expect(executedTools[0].output).toContain('stomatologia Warszawa');
      expect(executedTools[0].output).toContain('Gabinety prywatne 3+ fotele');
    });

    it('poprawnie przetwarza akcje kampanii outreach [ACTION:HARVEY_CAMPAIGN]', () => {
      const aiResponse = `Przygotowałem sekwencję cold email:\n[ACTION:HARVEY_CAMPAIGN target="Klinika Uśmiech" framework="PAS" subject="Rezerwacje pacjentów po 18:00"]\nMożemy teraz zweryfikować treść.`;
      const { cleanedText, executedTools } = parseAndExecuteAiActionsWithWidgets(aiResponse);

      expect(cleanedText).toContain('Przygotowałem sekwencję cold email:');
      expect(cleanedText).toContain('Możemy teraz zweryfikować treść.');
      expect(cleanedText).not.toContain('[ACTION:HARVEY_CAMPAIGN');
      expect(executedTools.length).toBe(1);
      expect(executedTools[0].tool).toBe('harvey_outreach');
      expect(executedTools[0].output).toContain('Klinika Uśmiech');
      expect(executedTools[0].output).toContain('PAS');
      expect(executedTools[0].output).toContain('Rezerwacje pacjentów po 18:00');
    });

    it('poprawnie przetwarza akcje kwalifikacji leadu [ACTION:HARVEY_QUALIFY]', () => {
      const aiResponse = `Dokonałem oceny BANT i MEDDIC:\n[ACTION:HARVEY_QUALIFY company="TechSoft Sp. z o.o." score="9/10" status="QUALIFIED"]`;
      const { cleanedText, executedTools } = parseAndExecuteAiActionsWithWidgets(aiResponse);

      expect(cleanedText.trim()).toBe('Dokonałem oceny BANT i MEDDIC:');
      expect(executedTools.length).toBe(1);
      expect(executedTools[0].tool).toBe('harvey_qualification');
      expect(executedTools[0].output).toContain('TechSoft Sp. z o.o.');
      expect(executedTools[0].output).toContain('9/10');
      expect(executedTools[0].output).toContain('QUALIFIED');
    });

    it('obsluguje wielokrotne akcje w jednej wypowiedzi Harveya', () => {
      const aiResponse = `Rozpoczynam proces outreachu:\n` +
        `[ACTION:HARVEY_PROSPECT query="software house" icp="B2B SaaS"]\n` +
        `[ACTION:HARVEY_QUALIFY company="DevCraft" score="8/10" status="QUALIFIED"]\n` +
        `[ACTION:HARVEY_CAMPAIGN target="DevCraft" framework="AIDA" subject="Współpraca AI"]`;

      const { cleanedText, executedTools } = parseAndExecuteAiActionsWithWidgets(aiResponse);
      expect(cleanedText.trim()).toBe('Rozpoczynam proces outreachu:');
      expect(executedTools.length).toBe(3);
      expect(executedTools.map(t => t.tool)).toEqual([
        'harvey_prospecting',
        'harvey_qualification',
        'harvey_outreach'
      ]);
    });
  });
});
