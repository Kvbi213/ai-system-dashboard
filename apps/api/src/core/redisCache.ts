import Redis from 'ioredis';

export class InvalidCacheKeyError extends Error {
  constructor(public readonly key: unknown, message: string) {
    super(`[InvalidCacheKeyError] ${message} (otrzymano: "${String(key)}")`);
    this.name = 'InvalidCacheKeyError';
  }
}

export class CacheSerializationError extends Error {
  constructor(message: string) {
    super(`[CacheSerializationError] ${message}`);
    this.name = 'CacheSerializationError';
  }
}

export interface RedisCacheOptions {
  redisUrl?: string;
  fallbackOnly?: boolean;
  keyPrefix?: string;
  janitorIntervalMs?: number;
  unrefJanitor?: boolean;
}

interface CacheItem {
  value: string;
  expiresAt: number | null;
}

const MAX_TOTAL_KEY_LENGTH = 256;
const SINGLE_KEY_REGEX = /^[A-Za-z0-9:_\-\.\/]+$/;
const PATTERN_KEY_REGEX = /^[A-Za-z0-9:_\-\.\/\*\?]+$/;

function globToRegex(globPattern: string): RegExp {
  const escaped = globPattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${escaped}$`);
}

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

    this.startJanitor(
      options.janitorIntervalMs ?? 60000,
      options.unrefJanitor ?? true
    );

    if (!this.isFallbackOnly) {
      const url = options.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379';
      this.initRedis(url);
    }
  }

  private startJanitor(intervalMs: number, shouldUnref: boolean): void {
    if (intervalMs <= 0) return;
    this.janitorTimer = setInterval(() => {
      this.purgeExpired();
    }, intervalMs);

    if (shouldUnref && this.janitorTimer.unref) {
      this.janitorTimer.unref();
    }
  }

  public purgeExpired(): number {
    const now = Date.now();
    let purgedCount = 0;
    for (const [key, item] of this.inMemoryCache.entries()) {
      if (item && item.expiresAt !== null && now > item.expiresAt) {
        this.inMemoryCache.delete(key);
        purgedCount++;
      }
    }
    return purgedCount;
  }

  private validateKey(key: string, allowWildcards = false): void {
    if (typeof key !== 'string' || key.trim().length === 0) {
      throw new InvalidCacheKeyError(key, 'Klucz pamięci podręcznej musi być niepustym ciągiem znaków');
    }

    const maxRawKeyLength = MAX_TOTAL_KEY_LENGTH - this.keyPrefix.length;
    if (key.length > maxRawKeyLength) {
      throw new InvalidCacheKeyError(
        key,
        `Długość klucza (${key.length}) wraz z prefiksem ("${this.keyPrefix}") przekracza dopuszczalny limit ${MAX_TOTAL_KEY_LENGTH} znaków`
      );
    }

    const regex = allowWildcards ? PATTERN_KEY_REGEX : SINGLE_KEY_REGEX;
    if (!regex.test(key)) {
      throw new InvalidCacheKeyError(
        key,
        allowWildcards
          ? 'Wzorzec inwalidacji zawiera niedozwolone znaki. Dozwolone znaki alfanumeryczne, : _ - . / * ?'
          : 'Klucz zawiera znaki zabronione lub kontrolne. Dozwolone znaki alfanumeryczne oraz : _ - . /'
      );
    }
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
            return null; // Zakończ ponawianie prób po 5 nieudanych połączeniach
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
    this.validateKey(key, false);

    const prefixedKey = this.formatKey(key);

    if (this.isRedisConnected && this.redisClient) {
      try {
        const raw = await this.redisClient.get(prefixedKey);
        if (raw !== null) {
          try {
            return JSON.parse(raw) as T;
          } catch {
            await this.redisClient.del(prefixedKey).catch(() => {});
            return null;
          }
        }
        return null;
      } catch {
        this.isRedisConnected = false;
      }
    }

    // In-Memory Fallback
    const item = this.inMemoryCache.get(prefixedKey);
    if (!item || typeof item.value !== 'string') return null;

    if (item.expiresAt !== null && Date.now() > item.expiresAt) {
      this.inMemoryCache.delete(prefixedKey);
      return null;
    }

    try {
      return JSON.parse(item.value) as T;
    } catch {
      this.inMemoryCache.delete(prefixedKey);
      return null;
    }
  }

  public async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    this.validateKey(key, false);

    let serialized: string;
    try {
      serialized = JSON.stringify(value);
      if (serialized === undefined) {
        throw new Error('Wartość jest undefined i nie może zostać zserializowana');
      }
    } catch (err: any) {
      throw new CacheSerializationError(`Nie można zserializować wartości dla klucza "${key}": ${err.message}`);
    }

    const prefixedKey = this.formatKey(key);

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
    for (const k of rawKeys) {
      this.validateKey(k, false);
    }

    const prefixedKeys = rawKeys.map((k) => this.formatKey(k));

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
    this.validateKey(pattern, true);

    const fullPattern = this.formatKey(pattern);

    if (this.isRedisConnected && this.redisClient) {
      try {
        await this.scanAndDelete(fullPattern);
        return;
      } catch {
        this.isRedisConnected = false;
      }
    }

    // In-Memory Fallback: precyzyjny regex z escape'owaniem znaków
    const regexPattern = globToRegex(fullPattern);

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
    this.purgeExpired();
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
