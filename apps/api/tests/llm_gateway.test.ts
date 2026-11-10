import { describe, it, expect } from 'vitest';
import { IterationBudget, IterationBudgetExhaustedError, LLMGateway, LLMTimeoutError } from '../src/domains/ai/index.js';
import { LLM_TOOLS, determineWidgets } from '../src/domains/ai/llmGateway.js';
import { sqliteStore } from '../src/db/sqliteStore.js';
import { dbStore } from '../src/db/store.js';

describe('IterationBudget & LLMGateway Resilience Suite', () => {
  it('throws IterationBudgetExhaustedError when maxLoops is exceeded', () => {
    const budget = new IterationBudget({ maxLoops: 2 });
    budget.recordStep();
    budget.recordStep();
    expect(() => budget.recordStep()).toThrow(IterationBudgetExhaustedError);
  });

  it('throws RangeError for non-positive budget parameters', () => {
    expect(() => new IterationBudget({ maxLoops: 0 })).toThrow(RangeError);
    expect(() => new IterationBudget({ maxLoops: -2 })).toThrow(RangeError);
    expect(() => new IterationBudget({ timeoutMs: -100 })).toThrow(RangeError);
    expect(() => new IterationBudget({ maxTokens: 0 })).toThrow(RangeError);
    expect(() => new IterationBudget({ maxTokens: -50 })).toThrow(RangeError);
  });

  it('throws IterationBudgetExhaustedError when maxTokens is exceeded via recordTokens', () => {
    const budget = new IterationBudget({ maxLoops: 10, maxTokens: 500 });
    budget.recordTokens(300);
    expect(() => budget.recordTokens(250)).toThrow(IterationBudgetExhaustedError);
  });

  it('records 0 tokens safely without throwing or mutating total count', () => {
    const budget = new IterationBudget({ maxLoops: 5, maxTokens: 500 });
    budget.recordTokens(0);
    expect(budget.getStatus().accumulatedTokens).toBe(0);
  });

  it('throws RangeError when recordTokens receives a negative value', () => {
    const budget = new IterationBudget({ maxLoops: 5 });
    expect(() => budget.recordTokens(-10)).toThrow(RangeError);
  });

  it('reports correct status including token accumulation', () => {
    const budget = new IterationBudget({ maxLoops: 5, maxTokens: 1000 });
    budget.recordStep(150);
    const status = budget.getStatus();
    expect(status.currentLoop).toBe(1);
    expect(status.accumulatedTokens).toBe(150);
    expect(status.remainingLoops).toBe(4);
    expect(status.maxTokens).toBe(1000);
  });

  it('LLMTimeoutError properly extends Error with prototype and provider tag', () => {
    const err = new LLMTimeoutError('Timeout on request', 'groq');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(LLMTimeoutError);
    expect(err.name).toBe('LLMTimeoutError');
    expect(err.provider).toBe('groq');
    expect(err.code).toBe('LLM_TIMEOUT');
  });

  it('LLMGateway throws fail-fast error when message is empty or whitespace', async () => {
    const gateway = new LLMGateway();
    await expect(gateway.complete({ message: '' })).rejects.toThrow(
      'LLMRequestOptions: message parameter is required and cannot be empty.'
    );
    await expect(gateway.complete({ message: '   ' })).rejects.toThrow(
      'LLMRequestOptions: message parameter is required and cannot be empty.'
    );
  });

  it('LLMGateway falls back to local deterministic engine gracefully for standard queries', async () => {
    const origKey = process.env.GROQ_API_KEY;
    delete process.env.GROQ_API_KEY;
    try {
      const gateway = new LLMGateway();
      const res = await gateway.complete({ message: 'podaj plan lekcji' });
      expect(res.reply).toBeDefined();
      expect(res.tokensUsed).toBeDefined();
      expect(res.tokensUsed.total).toBeGreaterThan(0);
      expect(res.provider).toBe('local');
      expect(res.widgets).toContain('timetable');
    } finally {
      process.env.GROQ_API_KEY = origKey;
    }
  });

  it('exposes expanded 35+ tools and routes them properly across MCP and automation', async () => {
    expect(LLM_TOOLS.length).toBeGreaterThanOrEqual(35);
    const toolNames = LLM_TOOLS.map((t) => t.function.name);
    expect(toolNames).toContain('query_timetable');
    expect(toolNames).toContain('get_current_lesson_status');
    expect(toolNames).toContain('get_substitutions');
    expect(toolNames).toContain('get_librus_grades');
    expect(toolNames).toContain('add_to_do');
    expect(toolNames).toContain('create_or_update_automation_script');
    expect(toolNames).toContain('test_run_automation_script');

    const gateway = new LLMGateway();
    const subsRaw = await gateway.executeLiveTool('get_substitutions', { day: 5 });
    const parsedSubs = JSON.parse(subsRaw);
    expect(parsedSubs.substitutions).toBeDefined();

    const widgets = determineWidgets('get_current_lesson_status', 'jaka jest następna lekcja');
    expect(widgets).toContain('timetable');
  });

  it('reads API keys dynamically from sqliteStore with process.env fallback', () => {
    const gateway = new LLMGateway();
    sqliteStore.setConfig('groq_api_key', 'gsk_dynamic_test_key_123');
    sqliteStore.setConfig('gemini_api_key', 'AIza_dynamic_gemini_key_456');

    expect(gateway.getGroqKey()).toBe('gsk_dynamic_test_key_123');
    expect(gateway.getGeminiKey()).toBe('AIza_dynamic_gemini_key_456');

    // Clear dynamic keys
    sqliteStore.setConfig('groq_api_key', '');
    sqliteStore.setConfig('gemini_api_key', '');
  });

  it('answers subject-specific queries deterministically with ground-truth grades (e.g. "a konkretnie z biologii?")', async () => {
    dbStore.refreshFromGroundTruth();
    const gateway = new LLMGateway();

    const res = await gateway.complete({ message: 'a konkretnie z biologii?' });
    expect(res.reply).toContain('Biologia');
    expect(res.reply).toContain('4.13');
    expect(res.reply).toContain('Wykaz ocen');
    expect(res.reply).not.toContain('Zrozumiałem polecenie. System asystenta OmniDash v4.0 przetworzył operację.');
    expect(res.widgets).toContain('grades');
    expect(res.toolCall?.toolName).toBe('get_librus_grades');
  });

  it('surfaces explicit 401 authorization diagnostic when external provider returns 401 and query is non-local', async () => {
    const gateway = new LLMGateway();
    // Simulate invalid groq key
    sqliteStore.setConfig('groq_api_key', 'gsk_invalid_revoked_key');
    delete process.env.GROQ_API_KEY;

    const res = await gateway.complete({ message: 'Napisz zaawansowany esej filozoficzny o sztucznej inteligencji' });
    expect(res.reply).toContain('Błąd autoryzacji dostawcy AI');
    expect(res.reply).toContain('401');
    expect(res.reply).not.toContain('Zrozumiałem polecenie. System asystenta OmniDash v4.0 przetworzył operację.');

    // Cleanup
    sqliteStore.setConfig('groq_api_key', '');
  });
});
