import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getOrCreateDevice, getSupabaseAdmin } from '@/lib/supabase';

// 简单的会话验证
async function verifySession(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return !!session?.value;
}

// POST - 调整设备积分（加减积分）
export async function POST(request: NextRequest) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const { deviceId, points, reason } = await request.json();

    if (!deviceId || points === undefined || points === null) {
      return NextResponse.json({ error: '参数不完整' }, { status: 400 });
    }

    // 获取当前设备信息
    const device = await getOrCreateDevice(deviceId);

    // 计算新余额，确保不低于0
    const newBalance = Math.max(0, device.points + points);

    const supabaseAdmin = getSupabaseAdmin();

    // 更新设备积分
    const { error: updateError } = await supabaseAdmin
      .from('device_usage')
      .update({
        points: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('device_id', deviceId);

    if (updateError) {
      throw new Error(`更新积分失败: ${updateError.message}`);
    }

    // 记录积分变动日志
    const { error: logError } = await supabaseAdmin
      .from('points_log')
      .insert({
        device_id: deviceId,
        type: points > 0 ? 'recharge' : 'consume',
        points: points,
        balance: newBalance,
        description: reason || (points > 0 ? '管理员增加积分' : '管理员扣除积分'),
      });

    if (logError) {
      throw new Error(`记录积分日志失败: ${logError.message}`);
    }

    // 记录管理员操作日志
    const { error: adminLogError } = await supabaseAdmin
      .from('admin_logs')
      .insert({
        action: 'adjust_points',
        target_id: deviceId,
        detail: JSON.stringify({
          points,
          reason,
          newBalance,
        }),
      });

    if (adminLogError) {
      throw new Error(`记录管理员日志失败: ${adminLogError.message}`);
    }

    return NextResponse.json({
      success: true,
      newBalance,
    });
  } catch (error) {
    console.error('Adjust points error:', error);
    return NextResponse.json({ error: '调整积分失败' }, { status: 500 });
  }
}
