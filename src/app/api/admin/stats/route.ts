import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getOrderStats } from '@/lib/supabase';

// 简单的会话验证
async function verifySession(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return !!session?.value;
}

// GET - 获取支付统计数据
export async function GET(_request: NextRequest) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const stats = await getOrderStats();

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    return NextResponse.json({ error: '获取统计数据失败' }, { status: 500 });
  }
}
