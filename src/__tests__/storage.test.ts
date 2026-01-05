import {
  getUsageCount,
  incrementUsage,
  resetUsage,
  getRemainingUsage,
  canUseFreeTrial,
  saveResult,
  getResult,
  deleteResult,
  getDeviceId,
} from '@/services/storage';
import { StoredResult } from '@/types';
import { FREE_USAGE_LIMIT } from '@/lib/constants';

describe('Storage Service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Usage Management', () => {
    test('getUsageCount returns 0 initially', () => {
      expect(getUsageCount()).toBe(0);
    });

    test('incrementUsage increases count', () => {
      expect(incrementUsage()).toBe(1);
      expect(incrementUsage()).toBe(2);
      expect(getUsageCount()).toBe(2);
    });

    test('resetUsage sets count to 0', () => {
      incrementUsage();
      incrementUsage();
      resetUsage();
      expect(getUsageCount()).toBe(0);
    });

    test('getRemainingUsage returns correct value', () => {
      expect(getRemainingUsage()).toBe(FREE_USAGE_LIMIT);
      incrementUsage();
      expect(getRemainingUsage()).toBe(FREE_USAGE_LIMIT - 1);
    });

    test('canUseFreeTrial returns true when usage < limit', () => {
      expect(canUseFreeTrial()).toBe(true);
    });

    test('canUseFreeTrial returns false when usage >= limit', () => {
      for (let i = 0; i < FREE_USAGE_LIMIT; i++) {
        incrementUsage();
      }
      expect(canUseFreeTrial()).toBe(false);
    });
  });

  describe('Device ID', () => {
    test('getDeviceId generates and persists ID', () => {
      const id1 = getDeviceId();
      const id2 = getDeviceId();
      expect(id1).toBe(id2);
      expect(id1).toMatch(/^device_\d+_[a-z0-9]+$/);
    });
  });

  describe('Result Storage', () => {
    const mockResult: StoredResult = {
      id: 'test-123',
      birthInfo: {
        gender: 'male',
        year: 1990,
        month: 6,
        day: 15,
        hour: 'wu',
      },
      freeResult: {
        klineData: [
          { age: 1, score: 55, trend: 'up' },
          { age: 10, score: 60, trend: 'up' },
        ],
        currentPhase: 'rising',
        highlightCount: 3,
        warningCount: 2,
        briefSummary: 'Test summary',
      },
      isPaid: false,
      createdAt: Date.now(),
    };

    test('saveResult and getResult work correctly', () => {
      saveResult(mockResult);
      const retrieved = getResult('test-123');
      expect(retrieved).toEqual(mockResult);
    });

    test('getResult returns null for non-existent ID', () => {
      expect(getResult('non-existent')).toBeNull();
    });

    test('deleteResult removes the result', () => {
      saveResult(mockResult);
      expect(getResult('test-123')).not.toBeNull();
      deleteResult('test-123');
      expect(getResult('test-123')).toBeNull();
    });
  });
});
