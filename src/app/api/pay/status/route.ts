/**
 * 查询订单支付状态接口
 * GET /api/pay/status?orderId=xxx
 *
 * 前端轮询此接口获取订单的最新支付状态。
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrder } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    // 参数校验
    if (!orderId) {
      return NextResponse.json({ error: '缺少订单号' }, { status: 400 });
    }

    // 从数据库查询订单
    const order = await getOrder(orderId);

    if (!order) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      status: order.status,
      orderId: order.id,
      points: order.points,
      amount: order.amount,
    });
  } catch (error) {
    console.error('查询订单状态异常:', error);
    return NextResponse.json(
      { error: '查询订单状态失败' },
      { status: 500 }
    );
  }
}
