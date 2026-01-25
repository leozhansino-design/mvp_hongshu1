import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateDevice } from '@/lib/supabase';

const FREE_LIMIT = 3; // 每个设备免费3次

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');

    if (!deviceId) {
      return NextResponse.json({ error: '缺少设备ID' }, { status: 400 });
    }

    const device = await getOrCreateDevice(deviceId);
    const freeRemaining = Math.max(0, FREE_LIMIT - device.free_used);

    return NextResponse.json({
      success: true,
      deviceId: device.device_id,
      freeUsed: device.free_used,
      freeRemaining,
      freeLimit: FREE_LIMIT,
      points: device.points,
      canUseFree: freeRemaining > 0,
      canUsePaid: device.points >= 10,
      canUseDetailed: device.points >= 200,
    });
  } catch (error) {
    console.error('Check usage error:', error);
    // 如果数据库不可用，返回默认值（开发模式）
    return NextResponse.json({
      success: true,
      freeUsed: 0,
      freeRemaining: FREE_LIMIT,
      freeLimit: FREE_LIMIT,
      points: 0,
      canUseFree: true,
      canUsePaid: false,
      canUseDetailed: false,
      fallback: true,
    });
  }
}
