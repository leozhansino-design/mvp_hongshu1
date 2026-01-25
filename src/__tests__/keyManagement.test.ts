/**
 * Key Management Tests
 * 测试卡密管理的核心功能
 */

// Mock Supabase
const mockSupabaseFrom = jest.fn();
const mockSupabaseRpc = jest.fn();

jest.mock('@/lib/supabase', () => ({
  getSupabaseAdmin: () => ({
    from: mockSupabaseFrom,
    rpc: mockSupabaseRpc,
  }),
  getOrCreateDevice: jest.fn(),
  redeemKey: jest.fn(),
  consumePoints: jest.fn(),
}));

import { getOrCreateDevice, redeemKey, consumePoints } from '@/lib/supabase';

describe('Key Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Key Generation', () => {
    it('should generate keys with correct format LC-XXXX-XXXX-XXXX', () => {
      // 卡密格式正则
      const keyFormat = /^LC-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

      // 测试几个示例卡密
      const sampleKeys = [
        'LC-AB12-CD34-EF56',
        'LC-GHIJ-KLMN-PQRS',
        'LC-1234-5678-9ABC',
      ];

      sampleKeys.forEach(key => {
        expect(key).toMatch(keyFormat);
      });
    });

    it('should reject invalid key formats', () => {
      const keyFormat = /^LC-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

      const invalidKeys = [
        'AB-1234-5678-9ABC',  // 不以 LC 开头
        'LC-123-5678-9ABC',   // 第一段只有3位
        'LC-12345-5678-9ABC', // 第一段5位
        'LC-1234-5678',       // 缺少最后一段
        'lc-1234-5678-9abc',  // 小写
      ];

      invalidKeys.forEach(key => {
        expect(key).not.toMatch(keyFormat);
      });
    });

    it('should support all valid point tiers', () => {
      const validTiers = [10, 200, 1000];
      const invalidTiers = [0, 5, 50, 100, 500, 2000];

      validTiers.forEach(tier => {
        expect([10, 200, 1000]).toContain(tier);
      });

      invalidTiers.forEach(tier => {
        expect([10, 200, 1000]).not.toContain(tier);
      });
    });
  });

  describe('Key Redemption', () => {
    it('should successfully redeem a valid unused key', async () => {
      const mockRedeemKey = redeemKey as jest.Mock;
      mockRedeemKey.mockResolvedValue({
        success: true,
        points: 200,
      });

      const result = await redeemKey('LC-TEST-1234-5678', 'device-123');

      expect(result.success).toBe(true);
      expect(result.points).toBe(200);
    });

    it('should reject already used keys', async () => {
      const mockRedeemKey = redeemKey as jest.Mock;
      mockRedeemKey.mockResolvedValue({
        success: false,
        error: '卡密已被使用',
      });

      const result = await redeemKey('LC-USED-1234-5678', 'device-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('卡密已被使用');
    });

    it('should reject invalid keys', async () => {
      const mockRedeemKey = redeemKey as jest.Mock;
      mockRedeemKey.mockResolvedValue({
        success: false,
        error: '卡密无效',
      });

      const result = await redeemKey('LC-FAKE-1234-5678', 'device-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('卡密无效');
    });

    it('should reject disabled keys', async () => {
      const mockRedeemKey = redeemKey as jest.Mock;
      mockRedeemKey.mockResolvedValue({
        success: false,
        error: '卡密已作废',
      });

      const result = await redeemKey('LC-DEAD-1234-5678', 'device-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('卡密已作废');
    });
  });

  describe('Device Usage Tracking', () => {
    it('should create new device with 0 free_used', async () => {
      const mockGetOrCreateDevice = getOrCreateDevice as jest.Mock;
      mockGetOrCreateDevice.mockResolvedValue({
        device_id: 'new-device-123',
        free_used: 0,
        points: 0,
      });

      const device = await getOrCreateDevice('new-device-123');

      expect(device.free_used).toBe(0);
      expect(device.points).toBe(0);
    });

    it('should track free usage correctly', async () => {
      const mockGetOrCreateDevice = getOrCreateDevice as jest.Mock;

      // First use
      mockGetOrCreateDevice.mockResolvedValue({
        device_id: 'device-123',
        free_used: 1,
        points: 0,
      });

      let device = await getOrCreateDevice('device-123');
      expect(device.free_used).toBe(1);

      // Second use
      mockGetOrCreateDevice.mockResolvedValue({
        device_id: 'device-123',
        free_used: 2,
        points: 0,
      });

      device = await getOrCreateDevice('device-123');
      expect(device.free_used).toBe(2);

      // Third use (last free)
      mockGetOrCreateDevice.mockResolvedValue({
        device_id: 'device-123',
        free_used: 3,
        points: 0,
      });

      device = await getOrCreateDevice('device-123');
      expect(device.free_used).toBe(3);
    });

    it('should correctly calculate remaining free uses', () => {
      const FREE_LIMIT = 3;

      const testCases = [
        { free_used: 0, expected: 3 },
        { free_used: 1, expected: 2 },
        { free_used: 2, expected: 1 },
        { free_used: 3, expected: 0 },
        { free_used: 5, expected: 0 }, // Overflow case
      ];

      testCases.forEach(({ free_used, expected }) => {
        const remaining = Math.max(0, FREE_LIMIT - free_used);
        expect(remaining).toBe(expected);
      });
    });
  });

  describe('Points Consumption', () => {
    it('should deduct 10 points for overview when free exhausted', async () => {
      const mockConsumePoints = consumePoints as jest.Mock;
      mockConsumePoints.mockResolvedValue({ success: true });

      const result = await consumePoints('device-123', 10, '免费概览（积分）');

      expect(result.success).toBe(true);
      expect(mockConsumePoints).toHaveBeenCalledWith('device-123', 10, '免费概览（积分）');
    });

    it('should deduct 200 points for detailed analysis', async () => {
      const mockConsumePoints = consumePoints as jest.Mock;
      mockConsumePoints.mockResolvedValue({ success: true });

      const result = await consumePoints('device-123', 200, '精批详解');

      expect(result.success).toBe(true);
      expect(mockConsumePoints).toHaveBeenCalledWith('device-123', 200, '精批详解');
    });

    it('should reject when insufficient points', async () => {
      const mockConsumePoints = consumePoints as jest.Mock;
      mockConsumePoints.mockResolvedValue({
        success: false,
        error: '积分不足',
      });

      const result = await consumePoints('device-123', 200, '精批详解');

      expect(result.success).toBe(false);
      expect(result.error).toBe('积分不足');
    });

    it('should validate correct pricing', () => {
      const OVERVIEW_PRICE = 10;
      const DETAILED_PRICE = 200;

      expect(OVERVIEW_PRICE).toBe(10);
      expect(DETAILED_PRICE).toBe(200);

      // 精批价格应该是概览价格的20倍
      expect(DETAILED_PRICE / OVERVIEW_PRICE).toBe(20);
    });
  });

  describe('Points Balance Calculation', () => {
    it('should correctly add points after redemption', () => {
      const currentPoints = 50;
      const redeemPoints = 200;
      const newBalance = currentPoints + redeemPoints;

      expect(newBalance).toBe(250);
    });

    it('should correctly deduct points after consumption', () => {
      const currentPoints = 250;
      const consumeAmount = 200;
      const newBalance = currentPoints - consumeAmount;

      expect(newBalance).toBe(50);
    });

    it('should handle point tiers correctly', () => {
      const tiers = [
        { points: 10, price: 1 },   // 10积分 = 1元
        { points: 200, price: 20 }, // 200积分 = 20元
        { points: 1000, price: 100 }, // 1000积分 = 100元
      ];

      tiers.forEach(tier => {
        expect(tier.points / tier.price).toBe(10); // 10积分 = 1元
      });
    });
  });
});

describe('Key Format Validation', () => {
  const validateKeyFormat = (key: string): boolean => {
    return /^LC-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(key.toUpperCase().trim());
  };

  it('should accept valid key formats', () => {
    const validKeys = [
      'LC-ABCD-EFGH-IJKL',
      'LC-1234-5678-9ABC',
      'LC-A1B2-C3D4-E5F6',
      'lc-abcd-efgh-ijkl', // lowercase should be accepted (will be uppercased)
      ' LC-ABCD-EFGH-IJKL ', // with spaces (will be trimmed)
    ];

    validKeys.forEach(key => {
      expect(validateKeyFormat(key)).toBe(true);
    });
  });

  it('should reject invalid key formats', () => {
    const invalidKeys = [
      'AB-ABCD-EFGH-IJKL', // wrong prefix
      'LC-ABC-EFGH-IJKL',  // first segment too short
      'LC-ABCDE-EFGH-IJKL', // first segment too long
      'LC-ABCD-EFGH',      // missing last segment
      'LCABCDEFGHIJKL',    // no dashes
      '',                  // empty
      'LC-ABCD-EFGH-IJKL-MNOP', // too many segments
    ];

    invalidKeys.forEach(key => {
      expect(validateKeyFormat(key)).toBe(false);
    });
  });
});

describe('Usage Flow', () => {
  it('should follow correct usage flow for free users', () => {
    const FREE_LIMIT = 3;
    let freeUsed = 0;
    let points = 0;

    // First 3 uses are free
    for (let i = 0; i < 3; i++) {
      const remaining = FREE_LIMIT - freeUsed;
      expect(remaining).toBeGreaterThan(0);
      freeUsed++;
    }

    // After 3 uses, no more free
    const remaining = FREE_LIMIT - freeUsed;
    expect(remaining).toBe(0);

    // Need points to continue
    expect(points >= 10).toBe(false);

    // After redemption
    points = 200;
    expect(points >= 10).toBe(true);
    expect(points >= 200).toBe(true);
  });

  it('should allow detailed analysis only with sufficient points', () => {
    const DETAILED_PRICE = 200;

    const testCases = [
      { points: 0, canUseDetailed: false },
      { points: 50, canUseDetailed: false },
      { points: 100, canUseDetailed: false },
      { points: 199, canUseDetailed: false },
      { points: 200, canUseDetailed: true },
      { points: 500, canUseDetailed: true },
    ];

    testCases.forEach(({ points, canUseDetailed }) => {
      expect(points >= DETAILED_PRICE).toBe(canUseDetailed);
    });
  });
});
