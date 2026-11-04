import Redis from 'ioredis';

export interface RedisCacheOptions {
  redisUrl?: string;
  fallbackOnly?: boolean;
  keyPrefix?: string;
  janitorIntervalMs?: number;
}

interface CacheItem {
  value: string;
  expiresAt: number | null;
}

const MAX_KEY_LENGTH = 256;
const WILDCARD_REGEX = /[*?[\]]/;

export class RedisCache {
  private redisClient: Redis | null = null;
  private isRedisConnected = false;
  private inMemoryCache = new Map<string, CacheItem>();
  private keyPrefix: string;
  private isFallbackOnly: boolean;
  private janitorTimer: NodeJS.Timeout | null = null;

  constructor(options: RedisCacheOptions = {}) {
    this.keyPrefix = options.keyPrefix || 'omnidash:';
    this.isFallbackOnly = !!options.fallbackOnly;

    this.startJanitor(options.janitorIntervalMs ?? 60000);

    if (!this.isFallbackOnly) {
      const url = options.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379';
      this.initRedis(url);
    }
  }

  private startJanitor(intervalMs: number): void {
    if (intervalMs <= 0) return;
    this.janitorTimer = setInterval(() => {
      this.purgeExpiredInMemory();
    }, intervalMs);

    if (this.janitorTimer.unref) {
      this.janitorTimer.unref();
    }
  }

  private purgeExpiredInMemory(): void {
    const now = Date.now();
    for (const [key, item] of this.inMemoryCache.entries()) {
      if (item.expiresAt !== null && now > item.expiresAt) {
        this.inMemoryCache.delete(key);
      }
    }
  }

  private validateKey(key: string, allowWildcards = false): boolean {
    if (typeof key !== 'string' || key.trim().length === 0) {
      return false;
    }
    if (key.length > MAX_KEY_LENGTH) {
      return false;
    }
    if (!allowWildcards && WILDCARD_REGEX.test(key)) {
      return false;
    }
    return true;
  }

  private initRedis(url: string): void {
    try {
      this.redisClient = new Redis(url, {
        lazyConnect: true,
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
        connectTimeout: 500,
        retryStrategy: (times: number) => {
          if (times > 5) {
            return null; // Zakończ agresywne próby ponowień w przypadku braku instancji
          }
          return Math.min(times * 500, 3000);
        }
      });

      this.redisClient.on('connect', () => {
        this.isRedisConnected = true;
      });

      this.redisClient.on('ready', () => {
        this.isRedisConnected = true;
      });

      this.redisClient.on('error', () => {
        this.isRedisConnected = false;
      });

      this.redisClient.on('close', () => {
        this.isRedisConnected = false;
      });

      this.redisClient.on('reconnecting', () => {
        this.isRedisConnected = false;
      });

      // Bezpieczna próba asynchronicznego połączenia
      this.redisClient.connect().catch(() => {
        this.isRedisConnected = false;
      });
    } catch {
      this.isRedisConnected = false;
      this.redisClient = null;
    }
  }

  private formatKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  public async get<T>(key: string): Promise<T | null> {
    if (!this.validateKey(key, false)) {
      return null;
    }

    const prefixedKey = this.formatKey(key);

    if (this.isRedisConnected && this.redisClient) {
      try {
        const raw = await this.redisClient.get(prefixedKey);
        if (raw !== null) {
          return JSON.parse(raw) as T;
        }
        return null;
      } catch {
        this.isRedisConnected = false;
      }
    }

    // In-Memory Fallback
    const item = this.inMemoryCache.get(prefixedKey);
    if (!item) return null;

    if (item.expiresAt !== null && Date.now() > item.expiresAt) {
      this.inMemoryCache.delete(prefixedKey);
      return null;
    }

    try {
      return JSON.parse(item.value) as T;
    } catch {
      return null;
    }
  }

  public async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    if (!this.validateKey(key, false)) {
      return;
    }

    const prefixedKey = this.formatKey(key);
    const serialized = JSON.stringify(value);

    if (this.isRedisConnected && this.redisClient) {
      try {
        if (ttlSeconds && ttlSeconds > 0) {
          await this.redisClient.set(prefixedKey, serialized, 'EX', Math.ceil(ttlSeconds));
        } else {
          await this.redisClient.set(prefixedKey, serialized);
        }
        return;
      } catch {
        this.isRedisConnected = false;
      }
    }

    // In-Memory Fallback
    const expiresAt = ttlSeconds && ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null;
    this.inMemoryCache.set(prefixedKey, {
      value: serialized,
      expiresAt
    });
  }

  public async del(key: string | string[]): Promise<void> {
    const rawKeys = Array.isArray(key) ? key : [key];
    const validKeys = rawKeys.filter((k) => this.validateKey(k, false));
    if (validKeys.length === 0) return;

    const prefixedKeys = validKeys.map((k) => this.formatKey(k));

    if (this.isRedisConnected && this.redisClient && prefixedKeys.length > 0) {
      try {
        await this.redisClient.del(...prefixedKeys);
        return;
      } catch {
        this.isRedisConnected = false;
      }
    }

    // In-Memory Fallback
    for (const pk of prefixedKeys) {
      this.inMemoryCache.delete(pk);
    }
  }

  public async getOrSet<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const fresh = await fetcher();
    await this.set(key, fresh, ttlSeconds);
    return fresh;
  }

  private async scanAndDelete(pattern: string): Promise<void> {
    if (!this.redisClient) return;
    let cursor = '0';
    do {
      const [nextCursor, keys] = await this.redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      if (keys && keys.length > 0) {
        await this.redisClient.del(...keys);
      }
    } while (cursor !== '0');
  }

  public async invalidatePattern(pattern: string): Promise<void> {
    if (!this.validateKey(pattern, true)) {
      return;
    }

    const fullPattern = this.formatKey(pattern);

    if (this.isRedisConnected && this.redisClient) {
      try {
        await this.scanAndDelete(fullPattern);
        return;
      } catch {
        this.isRedisConnected = false;
      }
    }

    // In-Memory Fallback: Bezpieczne dopasowanie regexem
    const escaped = fullPattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    const regexPattern = new RegExp(`^${escaped}$`);

    for (const k of this.inMemoryCache.keys()) {
      if (regexPattern.test(k)) {
        this.inMemoryCache.delete(k);
      }
    }
  }

  public async clear(): Promise<void> {
    if (this.isRedisConnected && this.redisClient) {
      try {
        await this.scanAndDelete(this.formatKey('*'));
      } catch {
        this.isRedisConnected = false;
      }
    }
    this.inMemoryCache.clear();
  }

  public getStats(): { isRedisConnected: boolean; inMemoryKeysCount: number } {
    this.purgeExpiredInMemory();
    return {
      isRedisConnected: this.isRedisConnected,
      inMemoryKeysCount: this.inMemoryCache.size
    };
  }

  public async close(): Promise<void> {
    if (this.janitorTimer) {
      clearInterval(this.janitorTimer);
      this.janitorTimer = null;
    }

    if (this.redisClient) {
      try {
        await this.redisClient.quit();
      } catch {
        this.redisClient.disconnect();
      }
      this.redisClient = null;
      this.isRedisConnected = false;
    }
    this.inMemoryCache.clear();
  }
}

export const redisCache = new RedisCache();
