import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getOrders } from '@/lib/supabase';

// 简单的会话验证
async function verifySession(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return !!session?.value;
}

// GET - 获取订单列表（分页、按状态和设备筛选）
export async function GET(request: NextRequest) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);
    const deviceId = searchParams.get('deviceId') || undefined;

    // status 为 'all' 时不进行状态筛选
    const filterStatus = status === 'all' ? undefined : status;

    const { orders, total } = await getOrders({
      status: filterStatus,
      page,
      pageSize,
      deviceId,
    });

    return NextResponse.json({
      success: true,
      orders,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json({ error: '获取订单列表失败' }, { status: 500 });
  }
}
