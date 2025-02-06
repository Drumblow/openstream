class CacheService {
  private static instance: CacheService;
  private cache: Map<string, { value: any; timestamp: number; ttl: number }>;
  private readonly DEFAULT_TTL = 3600 * 1000; // 1 hour in milliseconds

  private constructor() {
    this.cache = new Map();
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  async get(key: string): Promise<any> {
    try {
      const cached = this.cache.get(key);
      if (!cached) return null;

      const { value, timestamp, ttl } = cached;
      if (Date.now() - timestamp > ttl) {
        this.cache.delete(key);
        return null;
      }

      return value;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      this.cache.set(key, {
        value,
        timestamp: Date.now(),
        ttl
      });
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      this.cache.delete(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      this.cache.clear();
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  // Cleanup expired items
  cleanup(): void {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export const cacheService = CacheService.getInstance();

// Run cleanup every hour
setInterval(() => {
  cacheService.cleanup();
}, 3600 * 1000);
