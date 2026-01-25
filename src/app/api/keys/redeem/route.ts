import { NextRequest, NextResponse } from 'next/server';
import { redeemKey, getOrCreateDevice } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { keyCode, deviceId } = await request.json();

    if (!keyCode) {
      return NextResponse.json({ error: '请输入卡密' }, { status: 400 });
    }

    if (!deviceId) {
      return NextResponse.json({ error: '缺少设备ID' }, { status: 400 });
    }

    // 格式化卡密（统一大写，移除多余空格）
    const formattedKey = keyCode.toUpperCase().trim();

    // 简单格式验证
    if (!/^LC-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(formattedKey)) {
      return NextResponse.json({ error: '卡密格式无效' }, { status: 400 });
    }

    const result = await redeemKey(formattedKey, deviceId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // 获取更新后的设备信息
    const device = await getOrCreateDevice(deviceId);

    return NextResponse.json({
      success: true,
      pointsAdded: result.points,
      totalPoints: device.points,
      message: `恭喜！获得 ${result.points} 积分`,
    });
  } catch (error) {
    console.error('Redeem key error:', error);
    return NextResponse.json({ error: '兑换失败，请重试' }, { status: 500 });
  }
}
