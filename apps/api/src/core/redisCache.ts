import Redis from 'ioredis';

export interface RedisCacheOptions {
  redisUrl?: string;
  fallbackOnly?: boolean;
  keyPrefix?: string;
}

interface CacheItem {
  value: string;
  expiresAt: number | null;
}

export class RedisCache {
  private redisClient: Redis | null = null;
  private isRedisConnected = false;
  private inMemoryCache = new Map<string, CacheItem>();
  private keyPrefix: string;
  private isFallbackOnly: boolean;

  constructor(options: RedisCacheOptions = {}) {
    this.keyPrefix = options.keyPrefix || 'omnidash:';
    this.isFallbackOnly = !!options.fallbackOnly;

    if (!this.isFallbackOnly) {
      const url = options.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379';
      this.initRedis(url);
    }
  }

  private initRedis(url: string): void {
    try {
      this.redisClient = new Redis(url, {
        lazyConnect: true,
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
        connectTimeout: 500,
        retryStrategy: () => null // Zero-blocking: natychmiastowy failover bez pętli ponowień
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

      // Bezpieczna próba połączenia w tle
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
    const keys = Array.isArray(key) ? key : [key];
    const prefixedKeys = keys.map((k) => this.formatKey(k));

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

  public async invalidatePattern(pattern: string): Promise<void> {
    const fullPattern = this.formatKey(pattern);

    if (this.isRedisConnected && this.redisClient) {
      try {
        const matchingKeys = await this.redisClient.keys(fullPattern);
        if (matchingKeys.length > 0) {
          await this.redisClient.del(...matchingKeys);
        }
        return;
      } catch {
        this.isRedisConnected = false;
      }
    }

    // In-Memory Fallback: Regex matching
    const regexPattern = new RegExp('^' + fullPattern.replace(/\*/g, '.*') + '$');
    for (const k of this.inMemoryCache.keys()) {
      if (regexPattern.test(k)) {
        this.inMemoryCache.delete(k);
      }
    }
  }

  public async clear(): Promise<void> {
    if (this.isRedisConnected && this.redisClient) {
      try {
        await this.invalidatePattern('*');
      } catch {
        this.isRedisConnected = false;
      }
    }
    this.inMemoryCache.clear();
  }

  public getStats(): { isRedisConnected: boolean; inMemoryKeysCount: number } {
    // Czyszczenie wygasłych kluczy przed zliczeniem
    const now = Date.now();
    for (const [k, v] of this.inMemoryCache.entries()) {
      if (v.expiresAt !== null && now > v.expiresAt) {
        this.inMemoryCache.delete(k);
      }
    }

    return {
      isRedisConnected: this.isRedisConnected,
      inMemoryKeysCount: this.inMemoryCache.size
    };
  }

  public async close(): Promise<void> {
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
