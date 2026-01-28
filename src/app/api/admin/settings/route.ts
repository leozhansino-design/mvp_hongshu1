import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getRechargeOptions, updateRechargeOptions } from '@/lib/supabase';

// 简单的会话验证
async function verifySession(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return !!session?.value;
}

// GET - 获取充值选项
export async function GET(_request: NextRequest) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const options = await getRechargeOptions(false);

    return NextResponse.json({
      success: true,
      options,
    });
  } catch (error) {
    console.error('Get recharge options error:', error);
    return NextResponse.json({ error: '获取充值选项失败' }, { status: 500 });
  }
}

// PUT - 更新充值选项
export async function PUT(request: NextRequest) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const { options } = await request.json();

    if (!Array.isArray(options) || options.length === 0) {
      return NextResponse.json({ error: '充值选项不能为空' }, { status: 400 });
    }

    await updateRechargeOptions(options);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update recharge options error:', error);
    return NextResponse.json({ error: '更新充值选项失败' }, { status: 500 });
  }
}
