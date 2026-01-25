// 设备ID管理
const DEVICE_ID_KEY = 'lc_device_id';

// 生成唯一设备ID
function generateDeviceId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  const randomPart2 = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomPart}-${randomPart2}`;
}

// 获取或创建设备ID
export function getDeviceId(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  let deviceId = localStorage.getItem(DEVICE_ID_KEY);

  if (!deviceId) {
    deviceId = generateDeviceId();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }

  return deviceId;
}

// 使用情况类型
export interface UsageStatus {
  freeUsed: number;
  freeRemaining: number;
  freeLimit: number;
  points: number;
  canUseFree: boolean;
  canUsePaid: boolean;
  canUseDetailed: boolean;
}

// 检查使用情况
export async function checkUsageStatus(): Promise<UsageStatus> {
  const deviceId = getDeviceId();

  if (!deviceId) {
    return {
      freeUsed: 0,
      freeRemaining: 3,
      freeLimit: 3,
      points: 0,
      canUseFree: true,
      canUsePaid: false,
      canUseDetailed: false,
    };
  }

  try {
    const response = await fetch(`/api/usage/check?deviceId=${encodeURIComponent(deviceId)}`);
    const data = await response.json();

    if (data.success) {
      return {
        freeUsed: data.freeUsed,
        freeRemaining: data.freeRemaining,
        freeLimit: data.freeLimit,
        points: data.points,
        canUseFree: data.canUseFree,
        canUsePaid: data.canUsePaid,
        canUseDetailed: data.canUseDetailed,
      };
    }
  } catch (error) {
    console.error('Failed to check usage status:', error);
  }

  // 默认值
  return {
    freeUsed: 0,
    freeRemaining: 3,
    freeLimit: 3,
    points: 0,
    canUseFree: true,
    canUsePaid: false,
    canUseDetailed: false,
  };
}

// 消耗使用次数/积分
export async function consumeUsage(
  action: 'free_overview' | 'paid_overview' | 'detailed',
  birthInfo?: Record<string, unknown>,
  resultId?: string,
  curveMode?: 'life' | 'wealth'
): Promise<{ success: boolean; error?: string; type?: string; points?: number }> {
  const deviceId = getDeviceId();

  if (!deviceId) {
    return { success: false, error: '设备ID无效' };
  }

  try {
    const response = await fetch('/api/usage/consume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId,
        action,
        birthInfo,
        resultId,
        curveMode,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || '操作失败' };
    }

    return {
      success: true,
      type: data.type,
      points: data.points,
    };
  } catch (error) {
    console.error('Failed to consume usage:', error);
    return { success: false, error: '网络错误' };
  }
}

// 兑换卡密
export async function redeemKeyCode(
  keyCode: string
): Promise<{ success: boolean; error?: string; pointsAdded?: number; totalPoints?: number }> {
  const deviceId = getDeviceId();

  if (!deviceId) {
    return { success: false, error: '设备ID无效' };
  }

  try {
    const response = await fetch('/api/keys/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyCode, deviceId }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || '兑换失败' };
    }

    return {
      success: true,
      pointsAdded: data.pointsAdded,
      totalPoints: data.totalPoints,
    };
  } catch (error) {
    console.error('Failed to redeem key:', error);
    return { success: false, error: '网络错误' };
  }
}
