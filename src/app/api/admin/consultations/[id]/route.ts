/**
 * 单个咨询订单管理接口
 * GET /api/admin/consultations/:id - 获取订单详情
 * PATCH /api/admin/consultations/:id - 标记完成或退款
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getConsultation, markConsultationCompleted, refundConsultation } from '@/lib/supabase';
import { dbToConsultation } from '@/types/master';
import { createAlipayRefund } from '@/lib/alipay';
import { createRefund } from '@/lib/wechat-pay';

// 会话验证
async function verifySession(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return !!session?.value;
}

// GET - 获取订单详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const consultationDB = await getConsultation(id);

    if (!consultationDB) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 });
    }

    const consultation = dbToConsultation(consultationDB);

    return NextResponse.json({
      success: true,
      consultation,
    });
  } catch (error) {
    console.error('Get consultation error:', error);
    return NextResponse.json({ error: '获取订单信息失败' }, { status: 500 });
  }
}

// PATCH - 标记完成或退款
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
    const { action } = body; // 'complete' | 'refund'

    // 检查订单是否存在
    const consultationDB = await getConsultation(id);
    if (!consultationDB) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 });
    }

    if (action === 'complete') {
      // 标记完成
      if (consultationDB.status !== 'pending') {
        return NextResponse.json({ error: '只能标记待处理的订单为已完成' }, { status: 400 });
      }

      const updatedDB = await markConsultationCompleted(id);
      const consultation = dbToConsultation(updatedDB);

      return NextResponse.json({
        success: true,
        consultation,
        message: '订单已标记为完成',
      });
    } else if (action === 'refund') {
      // 退款
      if (consultationDB.status !== 'pending') {
        return NextResponse.json({ error: '只能退款待处理的订单' }, { status: 400 });
      }

      // 调用第三方退款接口
      const refundAmount = consultationDB.price;
      const refundId = `RF_${id}_${Date.now()}`;

      // 检查是否有交易号
      if (!consultationDB.trade_no) {
        return NextResponse.json({ error: '订单未支付或缺少交易号' }, { status: 400 });
      }

      let refundResult;
      if (consultationDB.pay_method === 'wechat') {
        refundResult = await createRefund({
          orderId: id,
          refundId,
          totalAmount: consultationDB.price,
          refundAmount,
          reason: '用户申请退款',
        });
      } else if (consultationDB.pay_method === 'alipay') {
        refundResult = await createAlipayRefund({
          tradeNo: consultationDB.trade_no,
          refundAmount,
          refundReason: '用户申请退款',
          outRequestNo: refundId,
        });
      } else {
        return NextResponse.json({ error: '未知的支付方式' }, { status: 400 });
      }

      if (!refundResult.success) {
        console.error('退款失败:', refundResult.error);
        return NextResponse.json({ error: refundResult.error || '退款失败' }, { status: 500 });
      }

      // 更新订单状态
      const updatedDB = await refundConsultation(id);
      const consultation = dbToConsultation(updatedDB);

      return NextResponse.json({
        success: true,
        consultation,
        message: '退款成功',
      });
    } else {
      return NextResponse.json({ error: '无效的操作' }, { status: 400 });
    }
  } catch (error) {
    console.error('Update consultation error:', error);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}
