interface CacheItem<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

class CacheService {
  private static instance: CacheService;
  private readonly DB_NAME = 'openstream';
  private readonly DB_VERSION = 4; // Increment version
  private readonly STORES = ['search', 'album', 'tracks', 'playlists', 'settings'] as const;
  private readonly DEFAULT_TTL = 3600 * 1000; // 1 hour
  private db: IDBDatabase | null = null;
  private isClient: boolean;

  private constructor() {
    this.isClient = typeof window !== 'undefined';
    if (this.isClient) {
      this.initDB().catch(console.error);
    }
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  private async initDB(): Promise<void> {
    if (!this.isClient) return;

    console.log('[CacheService] Initializing database');

    // Delete old database if exists
    try {
      const deleteRequest = window.indexedDB.deleteDatabase(this.DB_NAME);
      await new Promise((resolve, reject) => {
        deleteRequest.onsuccess = resolve;
        deleteRequest.onerror = reject;
      });
    } catch (error) {
      console.warn('[CacheService] Error deleting old database:', error);
    }

    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.error('[CacheService] Database error:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        console.log('[CacheService] Database opened successfully');
        this.db = request.result;
        
        // Verify stores
        const storeNames = Array.from(this.db.objectStoreNames);
        const missingStores = this.STORES.filter(store => !storeNames.includes(store));
        
        if (missingStores.length > 0) {
          console.warn('[CacheService] Missing stores:', missingStores);
          this.db.close();
          this.initDB().then(resolve).catch(reject);
          return;
        }
        
        resolve();
      };

      request.onupgradeneeded = (event) => {
        console.log('[CacheService] Database upgrade needed');
        const db = (event.target as IDBOpenDBRequest).result;

        this.STORES.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            console.log(`[CacheService] Creating store: ${storeName}`);
            const store = db.createObjectStore(storeName, { keyPath: 'key' });
            store.createIndex('timestamp', 'timestamp');
            store.createIndex('ttl', 'ttl');
          }
        });
      };
    });
  }

  private getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): IDBObjectStore | null {
    if (!this.isClient || !this.db) {
      console.log('[CacheService] No database available');
      return null;
    }

    try {
      console.log(`[CacheService] Getting store: ${storeName}`);
      const transaction = this.db.transaction(storeName, mode);
      return transaction.objectStore(storeName);
    } catch (error) {
      console.error(`[CacheService] Error getting store ${storeName}:`, error);
      return null;
    }
  }

  async get<T>(store: string, key: string): Promise<T | null> {
    if (!this.isClient) return null;

    try {
      await this.waitForDB();
      const storeObj = this.getStore(store);
      if (!storeObj) return null;
      
      return new Promise((resolve) => {
        const request = storeObj.get(key);

        request.onsuccess = () => {
          const data = request.result as CacheItem<T> | undefined;
          
          if (!data) {
            resolve(null);
            return;
          }

          if (Date.now() - data.timestamp > data.ttl) {
            this.del(store, key).catch(console.error);
            resolve(null);
            return;
          }

          resolve(data.value);
        };

        request.onerror = () => resolve(null);
      });
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set<T>(store: string, key: string, value: T, ttl: number = this.DEFAULT_TTL): Promise<void> {
    if (!this.isClient) return;

    try {
      await this.waitForDB();
      const storeObj = this.getStore(store, 'readwrite');
      if (!storeObj) return;

      return new Promise((resolve) => {
        const request = storeObj.put({
          key,
          value,
          timestamp: Date.now(),
          ttl
        });

        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
      });
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async del(store: string, key: string): Promise<void> {
    if (!this.isClient) return;

    try {
      await this.waitForDB();
      const storeObj = this.getStore(store, 'readwrite');
      if (!storeObj) return;
      
      return new Promise((resolve, reject) => {
        const request = storeObj.delete(key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async clear(store?: string): Promise<void> {
    if (!this.isClient) return;

    try {
      await this.waitForDB();
      
      if (store) {
        const storeObj = this.getStore(store, 'readwrite');
        if (!storeObj) return;

        return new Promise((resolve, reject) => {
          const request = storeObj.clear();
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve();
        });
      }

      // Clear all stores
      const stores = Array.from(this.db!.objectStoreNames);
      await Promise.all(stores.map(store => this.clear(store)));
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  private waitForDB(): Promise<void> {
    if (!this.isClient) return Promise.resolve();
    
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve();
        return;
      }

      let attempts = 0;
      const maxAttempts = 10;
      
      const checkInterval = setInterval(() => {
        if (this.db) {
          clearInterval(checkInterval);
          resolve();
          return;
        }

        attempts++;
        if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          this.initDB()
            .then(() => resolve())
            .catch(reject);
        }
      }, 500);

      // Shorter timeout
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!this.db) {
          reject(new Error('Database initialization timeout'));
        }
      }, 5000);
    });
  }

  async cleanup(): Promise<void> {
    if (!this.isClient) return;

    try {
      await this.waitForDB();
      
      const stores = Array.from(this.db!.objectStoreNames);
      const now = Date.now();

      for (const storeName of stores) {
        const store = this.getStore(storeName, 'readwrite');
        if (!store) continue;
        const request = store.openCursor();

        request.onsuccess = () => {
          const cursor = request.result;
          if (!cursor) return;

          const data = cursor.value as CacheItem<unknown>;
          if (now - data.timestamp > data.ttl) {
            store.delete(cursor.key);
          }

          cursor.continue();
        };
      }
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
  }
}

export const cacheService = CacheService.getInstance();

// Run cleanup every hour if in browser environment
if (typeof window !== 'undefined') {
  setInterval(() => {
    cacheService.cleanup();
  }, 3600 * 1000);
}
