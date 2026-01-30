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
  // 分曲线类型的免费次数
  freeRemainingLife: number;
  freeRemainingWealth: number;
  points: number;
  canUseFree: boolean;
  canUsePaid: boolean;
  canUseDetailed: boolean;
}

// 检查使用情况（支持按曲线类型查询）
export async function checkUsageStatus(curveMode: 'life' | 'wealth' = 'life'): Promise<UsageStatus> {
  const deviceId = getDeviceId();

  if (!deviceId) {
    return {
      freeUsed: 0,
      freeRemaining: 3,
      freeLimit: 3,
      freeRemainingLife: 3,
      freeRemainingWealth: 3,
      points: 0,
      canUseFree: true,
      canUsePaid: false,
      canUseDetailed: false,
    };
  }

  try {
    const response = await fetch(`/api/usage/check?deviceId=${encodeURIComponent(deviceId)}&curveMode=${curveMode}&_t=${Date.now()}`, {
      cache: 'no-store',
    });
    const data = await response.json();

    if (data.success) {
      return {
        freeUsed: data.freeUsed,
        freeRemaining: data.freeRemaining,
        freeLimit: data.freeLimit,
        freeRemainingLife: data.freeRemainingLife ?? data.freeRemaining,
        freeRemainingWealth: data.freeRemainingWealth ?? data.freeRemaining,
        points: data.points,
        canUseFree: data.canUseFree,
        canUsePaid: data.canUsePaid,
        canUseDetailed: data.canUseDetailed,
      };
    } else {
      console.error('Usage check API returned error:', data.error, data.detail);
    }
  } catch (error) {
    console.error('Failed to check usage status:', error);
  }

  // 默认值
  return {
    freeUsed: 0,
    freeRemaining: 3,
    freeLimit: 3,
    freeRemainingLife: 3,
    freeRemainingWealth: 3,
    points: 0,
    canUseFree: true,
    canUsePaid: false,
    canUseDetailed: false,
  };
}

// 结果缓存相关类型
export interface CacheCheckResult {
  found: boolean;
  cacheKey: string;
  resultData?: unknown;
}

// 检查结果缓存
export async function checkResultCache(params: {
  name: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  gender: string;
  isLunar: boolean;
  curveMode: 'life' | 'wealth';
  isPaid: boolean;
}): Promise<CacheCheckResult> {
  const deviceId = getDeviceId();

  if (!deviceId) {
    return { found: false, cacheKey: '' };
  }

  try {
    const queryParams = new URLSearchParams({
      deviceId,
      name: params.name,
      year: params.year.toString(),
      month: params.month.toString(),
      day: params.day.toString(),
      hour: params.hour.toString(),
      gender: params.gender,
      isLunar: params.isLunar.toString(),
      curveMode: params.curveMode,
      isPaid: params.isPaid.toString(),
    });

    const response = await fetch(`/api/result/cache?${queryParams.toString()}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return { found: false, cacheKey: '' };
    }

    const data = await response.json();
    return {
      found: data.found,
      cacheKey: data.cacheKey,
      resultData: data.resultData,
    };
  } catch (error) {
    console.error('Failed to check cache:', error);
    return { found: false, cacheKey: '' };
  }
}

// 保存结果到缓存
export async function saveResultCache(params: {
  cacheKey: string;
  curveMode: 'life' | 'wealth';
  isPaid: boolean;
  resultData: unknown;
  birthInfo?: unknown;
}): Promise<boolean> {
  const deviceId = getDeviceId();

  if (!deviceId || !params.cacheKey) {
    return false;
  }

  try {
    const response = await fetch('/api/result/cache', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cacheKey: params.cacheKey,
        deviceId,
        curveMode: params.curveMode,
        isPaid: params.isPaid,
        resultData: params.resultData,
        birthInfo: params.birthInfo,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to save cache:', error);
    return false;
  }
}

// 消耗使用次数/积分
export async function consumeUsage(
  action: 'free_overview' | 'paid_overview' | 'detailed',
  birthInfo?: Record<string, unknown>,
  resultId?: string,
  curveMode?: 'life' | 'wealth'
): Promise<{ success: boolean; error?: string; type?: string; points?: number; freeRemaining?: number }> {
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
      freeRemaining: data.freeRemaining,
    };
  } catch (error) {
    console.error('Failed to consume usage:', error);
    return { success: false, error: '网络错误' };
  }
}

