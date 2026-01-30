/**
 * 获取咨询订单详情接口
 * GET /api/consultations/:id
 */

import { NextRequest, NextResponse } from 'next/server';
import { getConsultation } from '@/lib/supabase';
import { dbToConsultation } from '@/types/master';
import { getTokenFromHeader, getUserFromToken } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 验证用户登录
    const authHeader = request.headers.get('authorization');
    const token = getTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: '登录已过期，请重新登录' }, { status: 401 });
    }

    const consultationDB = await getConsultation(id);

    if (!consultationDB) {
      return NextResponse.json(
        { success: false, message: '订单不存在' },
        { status: 404 }
      );
    }

    // 验证订单归属
    if (consultationDB.user_id !== user.id) {
      return NextResponse.json(
        { success: false, message: '无权查看此订单' },
        { status: 403 }
      );
    }

    const consultation = dbToConsultation(consultationDB);

    return NextResponse.json({
      success: true,
      consultation,
    });
  } catch (error) {
    console.error('Get consultation error:', error);
    return NextResponse.json(
      { success: false, message: '获取订单信息失败' },
      { status: 500 }
    );
  }
}
