import { NextRequest, NextResponse } from 'next/server';
import {
  getOrCreateDevice,
  incrementDeviceUsage,
  consumePoints,
  logUsage,
  getDetailedPoints,
} from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const FREE_LIMIT = 3;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceId, action, birthInfo, resultId, curveMode = 'life' } = body;

    if (!deviceId) {
      return NextResponse.json({ error: '缺少设备ID' }, { status: 400 });
    }

    if (!action || !['free_overview', 'paid_overview', 'detailed'].includes(action)) {
      return NextResponse.json({ error: '无效的操作类型' }, { status: 400 });
    }

    const device = await getOrCreateDevice(deviceId);

    // 根据曲线类型获取对应的免费已用次数
    const freeUsed = curveMode === 'wealth'
      ? (device.free_used_wealth || 0)
      : (device.free_used || 0);
    const freeRemaining = Math.max(0, FREE_LIMIT - freeUsed);

    // 根据操作类型处理
    if (action === 'free_overview') {
      // 免费概览
      if (freeRemaining > 0) {
        // 使用免费次数（按曲线类型分别计数）
        await incrementDeviceUsage(deviceId, curveMode);
        await logUsage({
          deviceId,
          action: 'free_overview',
          pointsCost: 0,
          birthInfo,
          resultId,
          curveMode,
        });

        return NextResponse.json({
          success: true,
          type: 'free',
          freeRemaining: freeRemaining - 1,
          points: device.points,
        });
      } else if (device.points >= 10) {
        // 用积分
        const modeLabel = curveMode === 'wealth' ? '财富曲线' : '人生曲线';
        const result = await consumePoints(deviceId, 10, `${modeLabel}概览（积分）`);
        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }

        await logUsage({
          deviceId,
          action: 'paid_overview',
          pointsCost: 10,
          birthInfo,
          resultId,
          curveMode,
        });

        return NextResponse.json({
          success: true,
          type: 'points',
          pointsUsed: 10,
          points: device.points - 10,
        });
      } else {
        return NextResponse.json(
          { error: '免费次数已用完，请充值积分', code: 'NO_FREE_NO_POINTS' },
          { status: 400 }
        );
      }
    } else if (action === 'detailed') {
      // 精批详解 - 从系统配置获取积分价格
      const detailedPrice = await getDetailedPoints();

      if (device.points < detailedPrice) {
        return NextResponse.json(
          { error: `积分不足，需要${detailedPrice}积分`, code: 'INSUFFICIENT_POINTS', required: detailedPrice, current: device.points },
          { status: 400 }
        );
      }

      const result = await consumePoints(deviceId, detailedPrice, '精批详解');
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      await logUsage({
        deviceId,
        action: 'detailed',
        pointsCost: detailedPrice,
        birthInfo,
        resultId,
        curveMode,
      });

      return NextResponse.json({
        success: true,
        type: 'points',
        pointsUsed: detailedPrice,
        points: device.points - detailedPrice,
      });
    }

    return NextResponse.json({ error: '无效的操作' }, { status: 400 });
  } catch (error) {
    console.error('Consume error:', error);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}
