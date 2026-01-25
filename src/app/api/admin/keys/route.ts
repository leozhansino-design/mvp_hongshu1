import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getKeys, getKeysStats, generateKeys, disableKey } from '@/lib/supabase';

// 简单的会话验证
async function verifySession(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return !!session?.value;
}

// GET - 获取卡密列表
export async function GET(request: NextRequest) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'unused' | 'used' | 'disabled' | 'all' || 'all';
    const points = searchParams.get('points') ? parseInt(searchParams.get('points')!) : undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    const { keys, total } = await getKeys({ status, points, page, pageSize });
    const stats = await getKeysStats();

    return NextResponse.json({
      success: true,
      keys,
      total,
      stats,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Get keys error:', error);
    return NextResponse.json({ error: '获取卡密失败' }, { status: 500 });
  }
}

// POST - 生成卡密
export async function POST(request: NextRequest) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const { points, count } = await request.json();

    if (![10, 200, 1000].includes(points)) {
      return NextResponse.json({ error: '无效的积分档位' }, { status: 400 });
    }

    if (!count || count < 1 || count > 1000) {
      return NextResponse.json({ error: '数量必须在1-1000之间' }, { status: 400 });
    }

    const keys = await generateKeys(points, count);

    return NextResponse.json({
      success: true,
      keys,
      count: keys.length,
    });
  } catch (error) {
    console.error('Generate keys error:', error);
    return NextResponse.json({ error: '生成卡密失败' }, { status: 500 });
  }
}

// DELETE - 作废卡密
export async function DELETE(request: NextRequest) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const { keyCode } = await request.json();

    if (!keyCode) {
      return NextResponse.json({ error: '缺少卡密' }, { status: 400 });
    }

    await disableKey(keyCode);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Disable key error:', error);
    return NextResponse.json({ error: '作废卡密失败' }, { status: 500 });
  }
}
