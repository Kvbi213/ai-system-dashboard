import { describe, it, expect } from 'vitest';
import { IterationBudget, IterationBudgetExhaustedError } from '../src/domains/ai/iterationBudget.js';
import { LLMGateway } from '../src/domains/ai/llmGateway.js';

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

  it('reports correct status including token accumulation', () => {
    const budget = new IterationBudget({ maxLoops: 5, maxTokens: 1000 });
    budget.recordStep(150);
    const status = budget.getStatus();
    expect(status.currentLoop).toBe(1);
    expect(status.accumulatedTokens).toBe(150);
    expect(status.remainingLoops).toBe(4);
    expect(status.maxTokens).toBe(1000);
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
    const gateway = new LLMGateway();
    const res = await gateway.complete({ message: 'podaj plan lekcji' });
    expect(res.reply).toBeDefined();
    expect(res.tokensUsed).toBeDefined();
    expect(res.tokensUsed.total).toBeGreaterThan(0);
    expect(res.provider).toBe('local');
    expect(res.fallbackCount).toBeGreaterThanOrEqual(1);
  });
});
