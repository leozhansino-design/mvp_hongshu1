/**
 * 咨询订单管理接口
 * GET /api/admin/consultations - 获取咨询订单列表
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getConsultations, getConsultationStats } from '@/lib/supabase';
import { dbToConsultation, ConsultationStatus } from '@/types/master';

// 会话验证
async function verifySession(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return !!session?.value;
}

// GET - 获取咨询订单列表
export async function GET(request: NextRequest) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const masterId = searchParams.get('masterId') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);
    const includeStats = searchParams.get('includeStats') === 'true';

    // status 为 'all' 时不进行状态筛选
    const filterStatus = statusParam === 'all' || !statusParam ? undefined : (statusParam as ConsultationStatus);

    const { consultations: consultationsDB, total } = await getConsultations({
      status: filterStatus as ConsultationStatus | undefined,
      masterId,
      search,
      page,
      pageSize,
    });

    const consultations = consultationsDB.map(dbToConsultation);

    // 获取统计数据
    let stats = null;
    if (includeStats) {
      stats = await getConsultationStats();
    }

    return NextResponse.json({
      success: true,
      consultations,
      total,
      page,
      pageSize,
      stats,
    });
  } catch (error) {
    console.error('Get consultations error:', error);
    return NextResponse.json({ error: '获取咨询订单列表失败' }, { status: 500 });
  }
}
