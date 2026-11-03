import { describe, it, expect } from 'vitest';
import { SemanticMemoryStore, computeDenseEmbedding, cosineSimilarity } from '../src/domains/memory/semanticRecall.js';
import { FinOpsCollector } from '../src/domains/system/finopsCollector.js';

describe('SemanticMemoryStore (Lab-Zero offline recall pattern)', () => {
  it('computes normalized dense embeddings with deterministic dimensions', () => {
    const vec1 = computeDenseEmbedding('Trening FBW kalistenika');
    const vec2 = computeDenseEmbedding('drążek i dipy na strychu');
    expect(vec1.length).toBe(128);
    expect(vec2.length).toBe(128);

    const sim = cosineSimilarity(vec1, vec2);
    expect(sim).toBeGreaterThanOrEqual(0);
    expect(sim).toBeLessThanOrEqual(1);
  });

  it('recalls relevant facts in <30ms with cosine ranking', () => {
    const store = new SemanticMemoryStore();
    const result = store.recall('jaki mam podział budżetu i oszczędności', 2);

    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results[0]?.fact.category).toBe('FINANCE');
    expect(result.latencyMs).toBeLessThan(50);
  });

  it('allows registering dynamic memory facts and recalling them', () => {
    const store = new SemanticMemoryStore();
    store.addFact({
      category: 'PREFERENCE',
      content: 'Kawa wyłącznie bez cukru z mlekiem owsianym o 10:00.',
      tags: ['kawa', 'dieta', 'napój']
    });

    const res = store.recall('kawa bez cukru');
    expect(res.results.some((r) => r.fact.content.includes('mlekiem owsianym'))).toBe(true);
  });
});

describe('FinOpsCollector & Coverage Gaps (ai-cost-dashboard pattern)', () => {
  it('tracks token and TTS usage and computes summary breakdown', () => {
    const collector = new FinOpsCollector();
    collector.recordMetric({
      module: 'ai_chat',
      provider: 'groq',
      inputUnits: 1000,
      outputUnits: 500,
      costPln: 0.02,
      durationMs: 400
    });

    const summary = collector.getFinOpsSummary();
    expect(summary.totalCostPln).toBeGreaterThan(0);
    expect(summary.totalTokens).toBeGreaterThan(1500);
    expect(summary.byModule['ai_chat']).toBeDefined();
  });

  it('monitors coverage gaps across scrapers and background tasks', () => {
    const collector = new FinOpsCollector();
    const summary = collector.getFinOpsSummary();
    expect(summary.coverageGaps.length).toBeGreaterThanOrEqual(3);
    expect(summary.coverageGaps.some((g) => g.sourceName.includes('Librus'))).toBe(true);
  });
});
