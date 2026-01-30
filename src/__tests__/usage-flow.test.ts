/**
 * Tests for usage consumption flow
 * Tests the complete flow: consume -> check -> verify count decreased
 */

// Mock fetch globally
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('Usage Consumption Flow', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('lc_device_id', 'test-device-123');
    mockFetch.mockClear();
  });

  describe('Free usage consumption', () => {
    test('consume API correctly decrements free usage', async () => {
      // Mock initial check - 3 free remaining
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          freeUsed: 0,
          freeRemaining: 3,
          freeLimit: 3,
          freeRemainingLife: 3,
          freeRemainingWealth: 3,
          points: 0,
          canUseFree: true,
          canUsePaid: false,
          canUseDetailed: false,
        }),
      } as Response);

      // Mock consume API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          type: 'free',
          freeRemaining: 2,
          points: 0,
        }),
      } as Response);

      // Mock check after consume - 2 free remaining
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          freeUsed: 1,
          freeRemaining: 2,
          freeLimit: 3,
          freeRemainingLife: 2,
          freeRemainingWealth: 3,
          points: 0,
          canUseFree: true,
          canUsePaid: false,
          canUseDetailed: false,
        }),
      } as Response);

      const { checkUsageStatus, consumeUsage } = await import('@/lib/device');

      // Initial check
      const initialStatus = await checkUsageStatus('life');
      expect(initialStatus.freeRemainingLife).toBe(3);

      // Consume one free use
      const consumeResult = await consumeUsage('free_overview');
      expect(consumeResult.success).toBe(true);
      expect(consumeResult.type).toBe('free');
      expect(consumeResult.freeRemaining).toBe(2);

      // Check after consume
      const afterStatus = await checkUsageStatus('life');
      expect(afterStatus.freeRemainingLife).toBe(2);
    });

    test('life and wealth curves have separate counters', async () => {
      // Mock consume for life curve
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          type: 'free',
          freeRemaining: 2,
          points: 0,
        }),
      } as Response);

      // Mock check after life consume - life: 2, wealth: 3
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          freeUsed: 1,
          freeRemaining: 2,
          freeLimit: 3,
          freeRemainingLife: 2,
          freeRemainingWealth: 3,
          points: 0,
          canUseFree: true,
          canUsePaid: false,
          canUseDetailed: false,
        }),
      } as Response);

      const { checkUsageStatus, consumeUsage } = await import('@/lib/device');

      // Consume life curve
      await consumeUsage('free_overview', {}, 'result-1', 'life');

      // Check status
      const status = await checkUsageStatus('life');

      // Life should be 2, wealth should still be 3
      expect(status.freeRemainingLife).toBe(2);
      expect(status.freeRemainingWealth).toBe(3);
    });

    test('consume fails gracefully when free uses exhausted and no points', async () => {
      // Mock consume API failure
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: '免费次数已用完，请充值积分',
          code: 'NO_FREE_NO_POINTS',
        }),
      } as Response);

      const { consumeUsage } = await import('@/lib/device');

      const result = await consumeUsage('free_overview');

      expect(result.success).toBe(false);
      expect(result.error).toBe('免费次数已用完，请充值积分');
    });

    test('uses points when free uses exhausted', async () => {
      // Mock consume API response - uses 10 points
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          type: 'points',
          pointsUsed: 10,
          points: 90,
        }),
      } as Response);

      const { consumeUsage } = await import('@/lib/device');

      const result = await consumeUsage('free_overview');

      expect(result.success).toBe(true);
      expect(result.type).toBe('points');
      expect(result.points).toBe(90);
    });
  });

  describe('Detailed unlock consumption', () => {
    test('detailed unlock requires 50 points', async () => {
      // Mock consume API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          type: 'points',
          pointsUsed: 50,
          points: 50,
        }),
      } as Response);

      const { consumeUsage } = await import('@/lib/device');

      const result = await consumeUsage('detailed');

      expect(result.success).toBe(true);
      expect(result.type).toBe('points');
      expect(result.points).toBe(50);
    });

    test('detailed unlock fails when insufficient points', async () => {
      // Mock consume API failure
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: '积分不足，需要50积分',
          code: 'INSUFFICIENT_POINTS',
          required: 50,
          current: 30,
        }),
      } as Response);

      const { consumeUsage } = await import('@/lib/device');

      const result = await consumeUsage('detailed');

      expect(result.success).toBe(false);
      expect(result.error).toBe('积分不足，需要50积分');
    });
  });
});
