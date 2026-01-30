import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateDevice } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const FREE_LIMIT = 3; // 每个设备每种曲线免费3次

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');
    const curveMode = searchParams.get('curveMode') || 'life';

    if (!deviceId) {
      return NextResponse.json({ error: '缺少设备ID' }, { status: 400 });
    }

    const device = await getOrCreateDevice(deviceId);

    // 根据曲线类型返回对应的免费次数
    const freeUsedLife = device.free_used || 0;
    const freeUsedWealth = device.free_used_wealth || 0;
    const freeUsed = curveMode === 'wealth' ? freeUsedWealth : freeUsedLife;
    const freeRemaining = Math.max(0, FREE_LIMIT - freeUsed);

    return NextResponse.json({
      success: true,
      deviceId: device.device_id,
      curveMode,
      freeUsed,
      freeRemaining,
      freeLimit: FREE_LIMIT,
      // 返回两种曲线的免费次数
      freeUsedLife,
      freeRemainingLife: Math.max(0, FREE_LIMIT - freeUsedLife),
      freeUsedWealth,
      freeRemainingWealth: Math.max(0, FREE_LIMIT - freeUsedWealth),
      points: device.points,
      canUseFree: freeRemaining > 0,
      canUsePaid: device.points >= 10,
      canUseDetailed: device.points >= 50,
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Check usage error:', error);
    // 返回错误状态，让客户端知道查询失败
    return NextResponse.json({
      success: false,
      error: '查询使用状态失败',
      detail: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
