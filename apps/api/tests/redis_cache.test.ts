import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RedisCache, InvalidCacheKeyError } from '../src/core/redisCache.js';

describe('RedisCache (Resilient In-Memory & Redis Failover)', () => {
  let cache: RedisCache;

  beforeEach(() => {
    cache = new RedisCache({ fallbackOnly: true, janitorIntervalMs: 0 });
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

  it('rzuca InvalidCacheKeyError przy niepoprawnych kluczach, znakach kontrolnych i wildcardach w get/set/del', async () => {
    await expect(cache.set('invalid*key', 'fail')).rejects.toThrow(InvalidCacheKeyError);
    await expect(cache.get('invalid?key')).rejects.toThrow(InvalidCacheKeyError);
    await expect(cache.del('invalid\nkey')).rejects.toThrow(InvalidCacheKeyError);
    await expect(cache.set('', 'empty')).rejects.toThrow(InvalidCacheKeyError);

    const tooLongKey = 'a'.repeat(300);
    await expect(cache.set(tooLongKey, 'overflow')).rejects.toThrow(InvalidCacheKeyError);

    // Wzorzec z dozwolonymi wildcardami przechodzi
    await expect(cache.invalidatePattern('valid:*')).resolves.toBeUndefined();
    // Wzorzec z nielegalnymi znakami rzuca błąd
    await expect(cache.invalidatePattern('invalid*pattern\n')).rejects.toThrow(InvalidCacheKeyError);
  });

  it('bezpiecznie ignoruje i usuwa uszkodzone wartości JSON bez rzucania niespójnego wyjątku', async () => {
    // Ręczne wstrzyknięcie uszkodzonego stringa do mapy in-memory
    const internalMap = (cache as any).inMemoryCache as Map<string, any>;
    internalMap.set('omnidash:corrupted:json', {
      value: '{ unclosed json syntax',
      expiresAt: null
    });

    const result = await cache.get('corrupted:json');
    expect(result).toBeNull();
    // Powinien zostać wyczyszczony z pamięci po wykryciu uszkodzenia
    expect(internalMap.has('omnidash:corrupted:json')).toBe(false);
  });

  it('czyści wygasłe wpisy za pomocą metody purgeExpired', async () => {
    await cache.set('purge:short', 'val', 0.05); // 50ms TTL
    expect(await cache.get('purge:short')).toBe('val');

    await new Promise((resolve) => setTimeout(resolve, 80));

    const purged = cache.purgeExpired();
    expect(purged).toBeGreaterThanOrEqual(1);

    const stats = cache.getStats();
    expect(stats.inMemoryKeysCount).toBe(0);
  });

  it('okresowy janitor w tle automatycznie usuwa przeterminowane klucze', async () => {
    const autoCache = new RedisCache({ fallbackOnly: true, janitorIntervalMs: 30, unrefJanitor: false });
    try {
      await autoCache.set('auto:short', 'val', 0.04); // 40ms TTL
      expect(await autoCache.get('auto:short')).toBe('val');

      // Odczekaj 80ms, aby minął zarówno TTL, jak i interwał janitora (30ms)
      await new Promise((resolve) => setTimeout(resolve, 80));

      const stats = autoCache.getStats();
      expect(stats.inMemoryKeysCount).toBe(0);
    } finally {
      await autoCache.close();
    }
  });
});
