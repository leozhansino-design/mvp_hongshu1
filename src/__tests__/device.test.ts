/**
 * Tests for device-related functions
 */

import { getDeviceId, checkUsageStatus, consumeUsage } from '@/lib/device';

// Mock fetch globally
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('Device Functions', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Clear mock calls
    mockFetch.mockClear();
  });

  describe('getDeviceId', () => {
    test('generates a new device ID when none exists', () => {
      const deviceId = getDeviceId();
      expect(deviceId).toBeTruthy();
      expect(typeof deviceId).toBe('string');
      expect(deviceId.length).toBeGreaterThan(10);
    });

    test('returns the same device ID on subsequent calls', () => {
      const deviceId1 = getDeviceId();
      const deviceId2 = getDeviceId();
      expect(deviceId1).toBe(deviceId2);
    });

    test('stores device ID in localStorage', () => {
      const deviceId = getDeviceId();
      expect(localStorage.getItem('lc_device_id')).toBe(deviceId);
    });

    test('returns existing device ID from localStorage', () => {
      const existingId = 'existing-device-id-123';
      localStorage.setItem('lc_device_id', existingId);
      const deviceId = getDeviceId();
      expect(deviceId).toBe(existingId);
    });
  });

  describe('checkUsageStatus', () => {
    test('returns default status when API succeeds with data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          freeUsed: 1,
          freeRemaining: 2,
          freeLimit: 3,
          freeRemainingLife: 2,
          freeRemainingWealth: 3,
          points: 100,
          canUseFree: true,
          canUsePaid: true,
          canUseDetailed: true,
        }),
      } as Response);

      const status = await checkUsageStatus('life');

      expect(status.freeUsed).toBe(1);
      expect(status.freeRemaining).toBe(2);
      expect(status.freeLimit).toBe(3);
      expect(status.freeRemainingLife).toBe(2);
      expect(status.freeRemainingWealth).toBe(3);
      expect(status.points).toBe(100);
      expect(status.canUseFree).toBe(true);
      expect(status.canUsePaid).toBe(true);
      expect(status.canUseDetailed).toBe(true);
    });

    test('returns default status on API failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const status = await checkUsageStatus('life');

      // Should return default values on error
      expect(status.freeRemaining).toBe(3);
      expect(status.freeLimit).toBe(3);
      expect(status.points).toBe(0);
      expect(status.canUseFree).toBe(true);
    });

    test('includes curveMode in API request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          freeUsed: 0,
          freeRemaining: 3,
          freeLimit: 3,
          points: 0,
          canUseFree: true,
          canUsePaid: false,
          canUseDetailed: false,
        }),
      } as Response);

      await checkUsageStatus('wealth');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('curveMode=wealth');
    });
  });

  describe('consumeUsage', () => {
    beforeEach(() => {
      // Ensure device ID exists
      localStorage.setItem('lc_device_id', 'test-device-id');
    });

    test('returns success when API succeeds', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          type: 'free',
          freeRemaining: 2,
          points: 100,
        }),
      } as Response);

      const result = await consumeUsage('free_overview');

      expect(result.success).toBe(true);
      expect(result.type).toBe('free');
      expect(result.freeRemaining).toBe(2);
      expect(result.points).toBe(100);
    });

    test('returns error when API fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: '积分不足',
        }),
      } as Response);

      const result = await consumeUsage('detailed');

      expect(result.success).toBe(false);
      expect(result.error).toBe('积分不足');
    });

    test('returns error on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await consumeUsage('free_overview');

      expect(result.success).toBe(false);
      expect(result.error).toBe('网络错误');
    });

    test('sends correct data for free_overview action', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      await consumeUsage('free_overview', { name: '张三' }, 'result-123', 'life');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options?.body as string);

      expect(body.action).toBe('free_overview');
      expect(body.curveMode).toBe('life');
      expect(body.resultId).toBe('result-123');
    });

    test('sends correct data for detailed action', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      await consumeUsage('detailed', { name: '李四' }, 'result-456', 'wealth');

      const [, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options?.body as string);

      expect(body.action).toBe('detailed');
      expect(body.curveMode).toBe('wealth');
    });
  });
});
