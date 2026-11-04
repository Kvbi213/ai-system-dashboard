import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RedisCache } from '../src/core/redisCache.js';

describe('RedisCache (Resilient In-Memory & Redis Failover)', () => {
  let cache: RedisCache;

  beforeEach(() => {
    cache = new RedisCache({ fallbackOnly: true, janitorIntervalMs: 50 });
  });

  afterEach(async () => {
    await cache.clear();
    await cache.close();
  });

  it('zapisuje i odczytuje wartości w buforze in-memory', async () => {
    await cache.set('test:key1', { name: 'OmniDash', version: '4.0.0' }, 60);
    const result = await cache.get<{ name: string; version: string }>('test:key1');

    expect(result).not.toBeNull();
    expect(result?.name).toBe('OmniDash');
    expect(result?.version).toBe('4.0.0');
  });

  it('zwraca null dla nieistniejącego klucza', async () => {
    const result = await cache.get('nonexistent');
    expect(result).toBeNull();
  });

  it('respektuje czas wygaśnięcia TTL', async () => {
    await cache.set('test:short', 'temporary', 0.1); // 100ms
    const immediate = await cache.get<string>('test:short');
    expect(immediate).toBe('temporary');

    await new Promise((resolve) => setTimeout(resolve, 150));
    const expired = await cache.get<string>('test:short');
    expect(expired).toBeNull();
  });

  it('usuwa pojedyncze i wielokrotne klucze', async () => {
    await cache.set('k1', 'val1');
    await cache.set('k2', 'val2');
    await cache.set('k3', 'val3');

    await cache.del('k1');
    expect(await cache.get('k1')).toBeNull();

    await cache.del(['k2', 'k3']);
    expect(await cache.get('k2')).toBeNull();
    expect(await cache.get('k3')).toBeNull();
  });

  it('inwaliduje klucze na podstawie wzorca (pattern)', async () => {
    await cache.set('school:grades', [5, 4, 6]);
    await cache.set('school:timetable', { monday: [] });
    await cache.set('private:routines', ['water', 'sleep']);

    await cache.invalidatePattern('school:*');

    expect(await cache.get('school:grades')).toBeNull();
    expect(await cache.get('school:timetable')).toBeNull();
    expect(await cache.get('private:routines')).not.toBeNull();
  });

  it('działa poprawnie w metodzie getOrSet (cache hit i cache miss)', async () => {
    let callCount = 0;
    const fetcher = async () => {
      callCount++;
      return { timestamp: Date.now(), data: 'fetched' };
    };

    const first = await cache.getOrSet('getorset:test', 60, fetcher);
    expect(callCount).toBe(1);
    expect(first.data).toBe('fetched');

    const second = await cache.getOrSet('getorset:test', 60, fetcher);
    expect(callCount).toBe(1); // Nie powinien wywołać fetchera ponownie
    expect(second.data).toBe('fetched');
    expect(second.timestamp).toBe(first.timestamp);
  });

  it('udostępnia statystyki pamięci podręcznej', async () => {
    await cache.set('stat1', 'a');
    await cache.set('stat2', 'b');
    const stats = cache.getStats();

    expect(stats.isRedisConnected).toBe(false);
    expect(stats.inMemoryKeysCount).toBe(2);
  });

  it('odrzuca klucze z wildcardami i niepoprawne długości w operacjach pojedynczych', async () => {
    await cache.set('invalid*key', 'should_not_save');
    expect(await cache.get('invalid*key')).toBeNull();

    await cache.set('valid:key', 'saved');
    expect(await cache.get('valid:key')).toBe('saved');

    const tooLongKey = 'a'.repeat(300);
    await cache.set(tooLongKey, 'overflow');
    expect(await cache.get(tooLongKey)).toBeNull();
  });

  it('automatycznie czyści wygasłe wpisy za pomocą okresowego janitora', async () => {
    await cache.set('janitor:short', 'val', 0.05); // 50ms TTL
    expect(await cache.get('janitor:short')).toBe('val');

    // Odczekaj 120ms, aby minął zarówno TTL, jak i interwał janitora (50ms)
    await new Promise((resolve) => setTimeout(resolve, 120));

    const stats = cache.getStats();
    expect(stats.inMemoryKeysCount).toBe(0);
  });
});
