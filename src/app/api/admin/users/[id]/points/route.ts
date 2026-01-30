import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabase';

// 验证admin session
async function verifySession(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return !!session?.value;
}

// PUT - 调整用户积分
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const { id: userId } = await params;
    const { adjustment, reason } = await request.json();

    if (typeof adjustment !== 'number' || adjustment === 0) {
      return NextResponse.json({ error: '请输入有效的积分变动值' }, { status: 400 });
    }

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json({ error: '请输入变动原因' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 获取当前用户信息
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // 计算新积分（不允许为负数）
    const currentPoints = user.points || 0;
    const newPoints = Math.max(0, currentPoints + adjustment);

    // 更新用户积分
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ points: newPoints })
      .eq('id', userId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    // 记录积分变动日志
    const logType = adjustment > 0 ? 'recharge' : 'consume';
    await supabaseAdmin.from('points_log').insert({
      user_id: userId,
      type: logType,
      points: adjustment,
      balance: newPoints,
      description: `管理员调整: ${reason}`,
    });

    return NextResponse.json({
      success: true,
      previousPoints: currentPoints,
      newPoints,
      adjustment,
    });
  } catch (error) {
    console.error('Adjust user points error:', error);
    return NextResponse.json({ error: '调整积分失败' }, { status: 500 });
  }
}
