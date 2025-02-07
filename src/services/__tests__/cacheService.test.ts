import { cacheService } from '../cacheService';

// Mock timer functions
jest.useFakeTimers();

describe('Cache Service', () => {
  beforeEach(() => {
    // Clear all mocks and cache before each test
    jest.clearAllMocks();
    jest.clearAllTimers();
    cacheService.clear('test');
  });

  afterEach(() => {
    // Stop cleanup timer after each test
    cacheService.stopCleanupTimer();
  });

  afterAll(() => {
    // Restore real timers
    jest.useRealTimers();
  });

  it('should set and get cache items', async () => {
    const key = 'testKey';
    const value = { data: 'testData' };

    await cacheService.set('test', key, value);
    const result = await cacheService.get('test', key);

    expect(result).toEqual(value);
  });

  it('should return null for expired items', async () => {
    const key = 'testKey';
    const value = { data: 'testData' };
    const ttl = 1000; // 1 second

    await cacheService.set('test', key, value, ttl);
    
    // Advance time by 2 seconds
    jest.advanceTimersByTime(2000);
    
    const result = await cacheService.get('test', key);
    expect(result).toBeNull();
  });

  it('should delete cache items', async () => {
    const key = 'testKey';
    const value = { data: 'testData' };

    await cacheService.set('test', key, value);
    await cacheService.del('test', key);
    
    const result = await cacheService.get('test', key);
    expect(result).toBeNull();
  });

  it('should clear all cache items in a namespace', async () => {
    const items = [
      { key: 'key1', value: 'value1' },
      { key: 'key2', value: 'value2' }
    ];

    // Set multiple items
    await Promise.all(
      items.map(item => cacheService.set('test', item.key, item.value))
    );

    // Clear all items
    await cacheService.clear('test');

    // Verify all items are cleared
    const results = await Promise.all(
      items.map(item => cacheService.get('test', item.key))
    );

    expect(results.every(result => result === null)).toBe(true);
  });

  it('should automatically cleanup expired items', async () => {
    const key = 'testKey';
    const value = { data: 'testData' };
    const ttl = 1000; // 1 second

    await cacheService.set('test', key, value, ttl);
    
    // Advance time past the cleanup interval
    jest.advanceTimersByTime(3600 * 1000 + 1000);
    
    const result = await cacheService.get('test', key);
    expect(result).toBeNull();
  });
});