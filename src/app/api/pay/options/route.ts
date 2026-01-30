/**
 * 获取充值选项接口（公开，无需鉴权）
 * GET /api/pay/options
 */

import { NextResponse } from 'next/server';
import { getRechargeOptions } from '@/lib/supabase';

export async function GET() {
  try {
    const options = await getRechargeOptions();

    // 只返回启用的选项，且只暴露前端需要的字段
    const publicOptions = options
      .filter((opt) => opt.is_active)
      .map((opt) => ({
        id: opt.id,
        price: opt.price,
        points: opt.points,
      }));

    return NextResponse.json({
      success: true,
      options: publicOptions,
    });
  } catch (error) {
    console.error('Get recharge options error:', error);
    // 返回默认选项作为降级方案
    return NextResponse.json({
      success: true,
      options: [
        { id: 1, price: 990, points: 100 },
        { id: 2, price: 1990, points: 220 },
        { id: 3, price: 4990, points: 600 },
        { id: 4, price: 9990, points: 1300 },
        { id: 5, price: 19990, points: 2800 },
        { id: 6, price: 49990, points: 8000 },
      ],
    });
  }
}
