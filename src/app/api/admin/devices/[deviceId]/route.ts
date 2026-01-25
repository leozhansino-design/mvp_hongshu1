import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabase';

// 简单的会话验证
async function verifySession(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return !!session?.value;
}

// GET - 获取设备详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const { deviceId } = await params;
    const supabaseAdmin = getSupabaseAdmin();

    // 获取设备基本信息
    const { data: device, error: deviceError } = await supabaseAdmin
      .from('device_usage')
      .select('*')
      .eq('device_id', deviceId)
      .single();

    if (deviceError || !device) {
      return NextResponse.json({ error: '设备不存在' }, { status: 404 });
    }

    // 获取积分记录
    const { data: pointsLogs } = await supabaseAdmin
      .from('points_log')
      .select('*')
      .eq('device_id', deviceId)
      .order('created_at', { ascending: false })
      .limit(100);

    // 获取使用记录（报告历史）
    const { data: usageLogs } = await supabaseAdmin
      .from('usage_log')
      .select('*')
      .eq('device_id', deviceId)
      .order('created_at', { ascending: false })
      .limit(100);

    // 计算统计
    let totalConsumed = 0;
    let totalRecharged = 0;

    pointsLogs?.forEach(log => {
      if (log.type === 'consume') {
        totalConsumed += Math.abs(log.points);
      } else if (log.type === 'recharge') {
        totalRecharged += log.points;
      }
    });

    return NextResponse.json({
      success: true,
      device: {
        ...device,
        total_consumed: totalConsumed,
        total_recharged: totalRecharged,
        report_count: usageLogs?.length || 0,
      },
      pointsLogs: pointsLogs || [],
      usageLogs: usageLogs || [],
    });
  } catch (error) {
    console.error('Get device detail error:', error);
    return NextResponse.json({ error: '获取设备详情失败' }, { status: 500 });
  }
}
