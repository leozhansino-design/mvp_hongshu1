/**
 * 大师管理接口
 * GET /api/admin/masters - 获取所有大师（含下架的）
 * POST /api/admin/masters - 添加大师
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getMasters, createMaster } from '@/lib/supabase';
import { dbToMaster } from '@/types/master';

// 会话验证
async function verifySession(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return !!session?.value;
}

// 生成大师ID
function generateMasterId(): string {
  const random = Math.random().toString(36).substring(2, 8);
  return `master_${random}`;
}

// GET - 获取所有大师
export async function GET() {
  if (!(await verifySession())) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const mastersDB = await getMasters(true); // 包含下架的
    const masters = mastersDB.map(dbToMaster);

    return NextResponse.json({
      success: true,
      masters,
    });
  } catch (error) {
    console.error('Get masters error:', error);
    return NextResponse.json({ error: '获取大师列表失败' }, { status: 500 });
  }
}

// POST - 添加大师
export async function POST(request: NextRequest) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      name,
      avatar,
      price,
      wordCount,
      followUps,
      years,
      intro,
      tags,
      sortOrder,
    } = body;

    // 参数验证
    if (!name) {
      return NextResponse.json({ error: '名称不能为空' }, { status: 400 });
    }

    if (!price || price <= 0) {
      return NextResponse.json({ error: '价格必须大于0' }, { status: 400 });
    }

    if (!wordCount || wordCount <= 0) {
      return NextResponse.json({ error: '报告字数必须大于0' }, { status: 400 });
    }

    const masterDB = await createMaster({
      id: generateMasterId(),
      name,
      avatar: avatar || null,
      price: Math.round(price * 100), // 转换为分
      word_count: wordCount,
      follow_ups: followUps ?? 0,
      years: years || null,
      intro: intro || null,
      tags: tags || [],
      is_active: true,
      sort_order: sortOrder ?? 0,
    });

    const master = dbToMaster(masterDB);

    return NextResponse.json({
      success: true,
      master,
    });
  } catch (error) {
    console.error('Create master error:', error);
    return NextResponse.json({ error: '创建大师失败' }, { status: 500 });
  }
}
