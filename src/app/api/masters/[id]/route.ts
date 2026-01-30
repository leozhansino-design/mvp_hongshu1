/**
 * 获取单个大师详情接口
 * GET /api/masters/:id
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMaster } from '@/lib/supabase';
import { dbToMaster } from '@/types/master';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const masterDB = await getMaster(id);

    if (!masterDB) {
      return NextResponse.json(
        { success: false, message: '大师不存在' },
        { status: 404 }
      );
    }

    if (!masterDB.is_active) {
      return NextResponse.json(
        { success: false, message: '大师已下架' },
        { status: 404 }
      );
    }

    const master = dbToMaster(masterDB);

    return NextResponse.json({
      success: true,
      master,
    });
  } catch (error) {
    console.error('Get master error:', error);
    return NextResponse.json(
      { success: false, message: '获取大师信息失败' },
      { status: 500 }
    );
  }
}
