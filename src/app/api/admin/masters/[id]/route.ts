/**
 * 单个大师管理接口
 * GET /api/admin/masters/:id - 获取大师详情
 * PUT /api/admin/masters/:id - 编辑大师
 * DELETE /api/admin/masters/:id - 删除大师
 * PATCH /api/admin/masters/:id - 上架/下架
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getMaster, updateMaster, deleteMaster, toggleMasterActive } from '@/lib/supabase';
import { dbToMaster } from '@/types/master';

// 会话验证
async function verifySession(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return !!session?.value;
}

// GET - 获取大师详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const masterDB = await getMaster(id);

    if (!masterDB) {
      return NextResponse.json({ error: '大师不存在' }, { status: 404 });
    }

    const master = dbToMaster(masterDB);

    return NextResponse.json({
      success: true,
      master,
    });
  } catch (error) {
    console.error('Get master error:', error);
    return NextResponse.json({ error: '获取大师信息失败' }, { status: 500 });
  }
}

// PUT - 编辑大师
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const { id } = await params;
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

    // 检查大师是否存在
    const existingMaster = await getMaster(id);
    if (!existingMaster) {
      return NextResponse.json({ error: '大师不存在' }, { status: 404 });
    }

    // 构建更新数据
    const updates: Record<string, unknown> = {};

    if (name !== undefined) updates.name = name;
    if (avatar !== undefined) updates.avatar = avatar;
    if (price !== undefined) updates.price = Math.round(price * 100);
    if (wordCount !== undefined) updates.word_count = wordCount;
    if (followUps !== undefined) updates.follow_ups = followUps;
    if (years !== undefined) updates.years = years;
    if (intro !== undefined) updates.intro = intro;
    if (tags !== undefined) updates.tags = tags;
    if (sortOrder !== undefined) updates.sort_order = sortOrder;

    const masterDB = await updateMaster(id, updates);
    const master = dbToMaster(masterDB);

    return NextResponse.json({
      success: true,
      master,
    });
  } catch (error) {
    console.error('Update master error:', error);
    return NextResponse.json({ error: '更新大师失败' }, { status: 500 });
  }
}

// DELETE - 删除大师
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const { id } = await params;

    // 检查大师是否存在
    const existingMaster = await getMaster(id);
    if (!existingMaster) {
      return NextResponse.json({ error: '大师不存在' }, { status: 404 });
    }

    await deleteMaster(id);

    return NextResponse.json({
      success: true,
      message: '大师已删除',
    });
  } catch (error) {
    console.error('Delete master error:', error);
    return NextResponse.json({ error: '删除大师失败' }, { status: 500 });
  }
}

// PATCH - 上架/下架
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { isActive } = body;

    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'isActive 参数必须是布尔值' }, { status: 400 });
    }

    // 检查大师是否存在
    const existingMaster = await getMaster(id);
    if (!existingMaster) {
      return NextResponse.json({ error: '大师不存在' }, { status: 404 });
    }

    const masterDB = await toggleMasterActive(id, isActive);
    const master = dbToMaster(masterDB);

    return NextResponse.json({
      success: true,
      master,
      message: isActive ? '大师已上架' : '大师已下架',
    });
  } catch (error) {
    console.error('Toggle master active error:', error);
    return NextResponse.json({ error: '更新大师状态失败' }, { status: 500 });
  }
}
