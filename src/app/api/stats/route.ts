/**
 * 全站统计 API
 * GET /api/stats - 获取统计数据
 * POST /api/stats/increment - 增加统计值
 */

import { NextResponse } from 'next/server';
import { getTotalGenerated, incrementTotalGenerated } from '@/lib/supabase';

// GET - 获取总生成次数
export async function GET() {
  try {
    const totalGenerated = await getTotalGenerated();

    return NextResponse.json({
      success: true,
      totalGenerated,
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    // 返回默认值，避免页面出错
    return NextResponse.json({
      success: true,
      totalGenerated: 41512, // 默认基础值
    });
  }
}

// POST - 增加生成次数
export async function POST() {
  try {
    const newTotal = await incrementTotalGenerated();

    return NextResponse.json({
      success: true,
      totalGenerated: newTotal,
    });
  } catch (error) {
    console.error('增加生成次数失败:', error);
    return NextResponse.json(
      { success: false, error: '增加生成次数失败' },
      { status: 500 }
    );
  }
}
