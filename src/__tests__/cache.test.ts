/**
 * Tests for cache-related functions
 */

import { generateCacheKey } from '@/lib/cache-utils';

describe('Cache Functions', () => {
  describe('generateCacheKey', () => {
    const baseParams = {
      deviceId: 'device-123',
      name: '张三',
      year: 1990,
      month: 6,
      day: 15,
      hour: 12,
      gender: 'male',
      isLunar: false,
      curveMode: 'life' as const,
      isPaid: false,
    };

    test('generates consistent key for same input', () => {
      const key1 = generateCacheKey(baseParams);
      const key2 = generateCacheKey(baseParams);
      expect(key1).toBe(key2);
    });

    test('generates different keys for different deviceId', () => {
      const key1 = generateCacheKey(baseParams);
      const key2 = generateCacheKey({ ...baseParams, deviceId: 'device-456' });
      expect(key1).not.toBe(key2);
    });

    test('generates different keys for different name', () => {
      const key1 = generateCacheKey(baseParams);
      const key2 = generateCacheKey({ ...baseParams, name: '李四' });
      expect(key1).not.toBe(key2);
    });

    test('generates different keys for different birth year', () => {
      const key1 = generateCacheKey(baseParams);
      const key2 = generateCacheKey({ ...baseParams, year: 1995 });
      expect(key1).not.toBe(key2);
    });

    test('generates different keys for different birth month', () => {
      const key1 = generateCacheKey(baseParams);
      const key2 = generateCacheKey({ ...baseParams, month: 7 });
      expect(key1).not.toBe(key2);
    });

    test('generates different keys for different birth day', () => {
      const key1 = generateCacheKey(baseParams);
      const key2 = generateCacheKey({ ...baseParams, day: 20 });
      expect(key1).not.toBe(key2);
    });

    test('generates different keys for different birth hour', () => {
      const key1 = generateCacheKey(baseParams);
      const key2 = generateCacheKey({ ...baseParams, hour: 15 });
      expect(key1).not.toBe(key2);
    });

    test('generates different keys for different gender', () => {
      const key1 = generateCacheKey(baseParams);
      const key2 = generateCacheKey({ ...baseParams, gender: 'female' });
      expect(key1).not.toBe(key2);
    });

    test('generates different keys for different calendar type (lunar vs solar)', () => {
      const key1 = generateCacheKey(baseParams);
      const key2 = generateCacheKey({ ...baseParams, isLunar: true });
      expect(key1).not.toBe(key2);
    });

    test('generates different keys for different curve mode', () => {
      const key1 = generateCacheKey(baseParams);
      const key2 = generateCacheKey({ ...baseParams, curveMode: 'wealth' });
      expect(key1).not.toBe(key2);
    });

    test('generates different keys for free vs paid', () => {
      const key1 = generateCacheKey(baseParams);
      const key2 = generateCacheKey({ ...baseParams, isPaid: true });
      expect(key1).not.toBe(key2);
    });

    test('key format starts with version prefix', () => {
      const key = generateCacheKey(baseParams);
      expect(key).toMatch(/^v1_/);
    });

    test('key contains hash and length suffix', () => {
      const key = generateCacheKey(baseParams);
      // Format: v1_{8-char-hex}_{length}
      expect(key).toMatch(/^v1_[0-9a-f]{8}_\d+$/);
    });
  });
});
