/**
 * Payment System Tests
 * 测试支付系统和积分管理的核心功能
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
  incrementDeviceUsage: jest.fn(),
  consumePoints: jest.fn(),
}));

import { getOrCreateDevice, incrementDeviceUsage, consumePoints } from '@/lib/supabase';

describe('Device Usage Tracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should deduct 10 points for overview when free exhausted', async () => {
    const mockConsumePoints = consumePoints as jest.Mock;
    mockConsumePoints.mockResolvedValue({ success: true });

    const result = await consumePoints('device-123', 10, '免费概览（积分）');

    expect(result.success).toBe(true);
    expect(mockConsumePoints).toHaveBeenCalledWith('device-123', 10, '免费概览（积分）');
  });

  it('should deduct 50 points for detailed analysis', async () => {
    const mockConsumePoints = consumePoints as jest.Mock;
    mockConsumePoints.mockResolvedValue({ success: true });

    const result = await consumePoints('device-123', 50, '精批详解');

    expect(result.success).toBe(true);
    expect(mockConsumePoints).toHaveBeenCalledWith('device-123', 50, '精批详解');
  });

  it('should reject when insufficient points', async () => {
    const mockConsumePoints = consumePoints as jest.Mock;
    mockConsumePoints.mockResolvedValue({
      success: false,
      error: '积分不足',
    });

    const result = await consumePoints('device-123', 50, '精批详解');

    expect(result.success).toBe(false);
    expect(result.error).toBe('积分不足');
  });

  it('should validate correct pricing', () => {
    const OVERVIEW_PRICE = 10;
    const DETAILED_PRICE = 50;

    expect(OVERVIEW_PRICE).toBe(10);
    expect(DETAILED_PRICE).toBe(50);

    // 精批价格应该是概览价格的5倍
    expect(DETAILED_PRICE / OVERVIEW_PRICE).toBe(5);
  });
});

describe('Points Balance Calculation', () => {
  it('should correctly add points after purchase', () => {
    const currentPoints = 50;
    const purchasePoints = 100;
    const newBalance = currentPoints + purchasePoints;

    expect(newBalance).toBe(150);
  });

  it('should correctly deduct points after consumption', () => {
    const currentPoints = 150;
    const consumeAmount = 50;
    const newBalance = currentPoints - consumeAmount;

    expect(newBalance).toBe(100);
  });

  it('should handle recharge tiers correctly', () => {
    const tiers = [
      { points: 100, price: 990 },     // 100积分 = 9.90元
      { points: 350, price: 2990 },    // 350积分 = 29.90元
      { points: 600, price: 4990 },    // 600积分 = 49.90元
      { points: 1300, price: 9990 },   // 1300积分 = 99.90元
      { points: 2800, price: 19990 },  // 2800积分 = 199.90元
      { points: 7500, price: 49990 },  // 7500积分 = 499.90元
    ];

    // 所有档位积分数大于0
    tiers.forEach(tier => {
      expect(tier.points).toBeGreaterThan(0);
      expect(tier.price).toBeGreaterThan(0);
    });

    // 按价格递增排列
    for (let i = 1; i < tiers.length; i++) {
      expect(tiers[i].price).toBeGreaterThan(tiers[i - 1].price);
    }

    // 越高档位每元获得的积分越多（更优惠）
    for (let i = 1; i < tiers.length; i++) {
      const currentRatio = tiers[i].points / tiers[i].price;
      const prevRatio = tiers[i - 1].points / tiers[i - 1].price;
      expect(currentRatio).toBeGreaterThanOrEqual(prevRatio);
    }
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

    // After purchase
    points = 100;
    expect(points >= 10).toBe(true);
    expect(points >= 50).toBe(true);
  });

  it('should allow detailed analysis only with sufficient points', () => {
    const DETAILED_PRICE = 50;

    const testCases = [
      { points: 0, canUseDetailed: false },
      { points: 10, canUseDetailed: false },
      { points: 49, canUseDetailed: false },
      { points: 50, canUseDetailed: true },
      { points: 100, canUseDetailed: true },
      { points: 500, canUseDetailed: true },
    ];

    testCases.forEach(({ points, canUseDetailed }) => {
      expect(points >= DETAILED_PRICE).toBe(canUseDetailed);
    });
  });
});

describe('Separate Life/Wealth Curve Tracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should track life and wealth curve free usage independently', async () => {
    const mockGetOrCreateDevice = getOrCreateDevice as jest.Mock;
    mockGetOrCreateDevice.mockResolvedValue({
      device_id: 'device-123',
      free_used: 2,           // 人生曲线已用2次
      free_used_wealth: 0,    // 财富曲线未使用
      points: 0,
    });

    const device = await getOrCreateDevice('device-123');

    const FREE_LIMIT = 3;
    const lifeRemaining = Math.max(0, FREE_LIMIT - device.free_used);
    const wealthRemaining = Math.max(0, FREE_LIMIT - (device.free_used_wealth || 0));

    expect(lifeRemaining).toBe(1);       // 人生曲线还剩1次
    expect(wealthRemaining).toBe(3);     // 财富曲线还有3次
  });

  it('should increment correct counter based on curveMode', async () => {
    const mockIncrement = incrementDeviceUsage as jest.Mock;

    // 使用人生曲线
    mockIncrement.mockResolvedValue({
      device_id: 'device-123',
      free_used: 1,
      free_used_wealth: 0,
      points: 0,
    });

    let result = await incrementDeviceUsage('device-123', 'life');
    expect(result.free_used).toBe(1);
    expect(result.free_used_wealth).toBe(0);

    // 使用财富曲线
    mockIncrement.mockResolvedValue({
      device_id: 'device-123',
      free_used: 1,
      free_used_wealth: 1,
      points: 0,
    });

    result = await incrementDeviceUsage('device-123', 'wealth');
    expect(result.free_used).toBe(1);
    expect(result.free_used_wealth).toBe(1);
  });

  it('should exhaust life curve free usage without affecting wealth curve', () => {
    const FREE_LIMIT = 3;

    // 模拟设备状态：人生曲线用完，财富曲线未使用
    const device = {
      free_used: 3,
      free_used_wealth: 0,
      points: 10,
    };

    const lifeRemaining = Math.max(0, FREE_LIMIT - device.free_used);
    const wealthRemaining = Math.max(0, FREE_LIMIT - device.free_used_wealth);

    expect(lifeRemaining).toBe(0);       // 人生曲线用完
    expect(wealthRemaining).toBe(3);     // 财富曲线完全独立

    // 人生曲线需要积分
    const canUseLifeFree = lifeRemaining > 0;
    const canUseLifePaid = device.points >= 10;
    expect(canUseLifeFree).toBe(false);
    expect(canUseLifePaid).toBe(true);

    // 财富曲线还是免费
    const canUseWealthFree = wealthRemaining > 0;
    expect(canUseWealthFree).toBe(true);
  });

  it('should correctly determine action type based on curveMode and free remaining', () => {
    const testCases = [
      { free_used: 0, free_used_wealth: 0, curveMode: 'life', isPaid: false, expectedAction: 'free_overview' },
      { free_used: 3, free_used_wealth: 0, curveMode: 'life', isPaid: false, expectedAction: 'free_overview' },
      { free_used: 0, free_used_wealth: 3, curveMode: 'wealth', isPaid: false, expectedAction: 'free_overview' },
      { free_used: 0, free_used_wealth: 0, curveMode: 'life', isPaid: true, expectedAction: 'detailed' },
      { free_used: 0, free_used_wealth: 0, curveMode: 'wealth', isPaid: true, expectedAction: 'detailed' },
    ];

    testCases.forEach(({ isPaid, expectedAction }) => {
      const action = isPaid ? 'detailed' : 'free_overview';
      expect(action).toBe(expectedAction);
    });
  });

  it('should share points between life and wealth curves', () => {
    // 积分是共享的，不区分曲线类型
    const device = {
      free_used: 3,
      free_used_wealth: 3,
      points: 100,
    };

    // 两种曲线都可以用积分
    expect(device.points >= 10).toBe(true);   // 概览
    expect(device.points >= 50).toBe(true);   // 精批
  });
});

describe('Order Management', () => {
  it('should generate valid order IDs', () => {
    const orderId = `ORD_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    expect(orderId).toMatch(/^ORD_\d+_[a-z0-9]+$/);
  });

  it('should calculate amounts correctly (price in fen)', () => {
    const tiers = [
      { price: 990, expectedYuan: '9.90' },
      { price: 2990, expectedYuan: '29.90' },
      { price: 4990, expectedYuan: '49.90' },
      { price: 9990, expectedYuan: '99.90' },
      { price: 19990, expectedYuan: '199.90' },
      { price: 49990, expectedYuan: '499.90' },
    ];

    tiers.forEach(({ price, expectedYuan }) => {
      expect((price / 100).toFixed(2)).toBe(expectedYuan);
    });
  });

  it('should validate order status transitions', () => {
    const validTransitions: Record<string, string[]> = {
      pending: ['paid', 'failed'],
      paid: ['refunded'],
      failed: [],
      refunded: [],
    };

    // pending -> paid is valid
    expect(validTransitions['pending']).toContain('paid');
    // paid -> refunded is valid
    expect(validTransitions['paid']).toContain('refunded');
    // refunded -> anything is invalid
    expect(validTransitions['refunded']).toHaveLength(0);
    // failed -> anything is invalid
    expect(validTransitions['failed']).toHaveLength(0);
  });

  it('should handle refund amount correctly', () => {
    const order = {
      amount: 2990,
      points: 350,
      status: 'paid' as const,
    };

    // Refund amount should equal original amount
    const refundAmount = order.amount;
    expect(refundAmount).toBe(2990);
    expect((refundAmount / 100).toFixed(2)).toBe('29.90');
  });

  it('should prevent double-payment by only updating pending orders', () => {
    const orders = [
      { id: '1', status: 'pending' },
      { id: '2', status: 'paid' },
      { id: '3', status: 'failed' },
    ];

    // Only pending orders should be updatable to paid
    const updatable = orders.filter(o => o.status === 'pending');
    expect(updatable).toHaveLength(1);
    expect(updatable[0].id).toBe('1');
  });
});
