/**
 * 获取用户积分使用记录
 * GET /api/user/points-history
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromHeader, getUserFromToken } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // 验证用户登录
    const authHeader = request.headers.get('authorization');
    const token = getTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: '登录已过期' }, { status: 401 });
    }

    // 获取分页参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const supabaseAdmin = getSupabaseAdmin();

    // 按用户ID获取积分记录
    const { data, error, count } = await supabaseAdmin
      .from('points_log')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('获取积分记录失败:', error);
      return NextResponse.json({ error: '获取记录失败' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      logs: data || [],
      total: count || 0,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('获取积分记录异常:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
