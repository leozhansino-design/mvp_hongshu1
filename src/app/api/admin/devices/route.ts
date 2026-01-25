import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabase';

// 简单的会话验证
async function verifySession(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return !!session?.value;
}

// GET - 获取设备/用户列表
export async function GET(request: NextRequest) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    const supabaseAdmin = getSupabaseAdmin();

    // 获取设备列表
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: devices, error: devicesError, count } = await supabaseAdmin
      .from('device_usage')
      .select('*', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(from, to);

    if (devicesError) {
      throw new Error(devicesError.message);
    }

    // 获取每个设备的消费总额和报告数量
    const deviceIds = devices?.map(d => d.device_id) || [];

    // 获取消费统计
    const { data: consumeStats } = await supabaseAdmin
      .from('points_log')
      .select('device_id, points')
      .in('device_id', deviceIds)
      .eq('type', 'consume');

    // 获取报告数量
    const { data: usageLogs } = await supabaseAdmin
      .from('usage_log')
      .select('device_id')
      .in('device_id', deviceIds);

    // 汇总统计
    const consumeByDevice: Record<string, number> = {};
    const reportsByDevice: Record<string, number> = {};

    consumeStats?.forEach(log => {
      consumeByDevice[log.device_id] = (consumeByDevice[log.device_id] || 0) + Math.abs(log.points);
    });

    usageLogs?.forEach(log => {
      reportsByDevice[log.device_id] = (reportsByDevice[log.device_id] || 0) + 1;
    });

    // 合并数据
    const enrichedDevices = devices?.map(device => ({
      ...device,
      total_consumed: consumeByDevice[device.device_id] || 0,
      report_count: reportsByDevice[device.device_id] || 0,
    }));

    return NextResponse.json({
      success: true,
      devices: enrichedDevices,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    });
  } catch (error) {
    console.error('Get devices error:', error);
    return NextResponse.json({ error: '获取设备列表失败' }, { status: 500 });
  }
}
