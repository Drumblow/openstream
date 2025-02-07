interface CacheItem<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

class CacheService {
  private static instance: CacheService;
  private cache: Map<string, { value: any; timestamp: number; ttl: number }>;
  private readonly DEFAULT_TTL = 3600 * 1000; // 1 hour in milliseconds
  private cleanupTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.cache = new Map();
    this.startCleanupTimer();
  }

  private startCleanupTimer() {
    const runCleanup = () => {
      this.cleanup();
      this.cleanupTimer = setTimeout(runCleanup, 3600 * 1000);
    };

    this.cleanupTimer = setTimeout(runCleanup, 3600 * 1000);
  }

  public stopCleanupTimer() {
    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  async get(namespace: string, key: string): Promise<any> {
    try {
      const cacheKey = `${namespace}:${key}`;
      const cached = this.cache.get(cacheKey);
      if (!cached) return null;

      const { value, timestamp, ttl } = cached;
      if (Date.now() - timestamp > ttl) {
        this.cache.delete(cacheKey);
        return null;
      }

      return value;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(namespace: string, key: string, value: any, ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      const cacheKey = `${namespace}:${key}`;
      this.cache.set(cacheKey, {
        value,
        timestamp: Date.now(),
        ttl
      });
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async del(namespace: string, key: string): Promise<void> {
    try {
      const cacheKey = `${namespace}:${key}`;
      this.cache.delete(cacheKey);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async clear(namespace: string): Promise<void> {
    try {
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${namespace}:`)) {
          this.cache.delete(key);
        }
      }
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export const cacheService = CacheService.getInstance();

// Clean up before process exit
if (typeof process !== 'undefined') {
  process.on('beforeExit', () => {
    const instance = CacheService.getInstance();
    instance.stopCleanupTimer();
  });
}