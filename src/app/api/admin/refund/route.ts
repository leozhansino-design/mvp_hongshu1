import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getOrder, updateOrderRefunded, getSupabaseAdmin } from '@/lib/supabase';
import { createRefund } from '@/lib/wechat-pay';
import { createAlipayRefund } from '@/lib/alipay';

// 简单的会话验证
async function verifySession(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return !!session?.value;
}

// POST - 处理退款
export async function POST(request: NextRequest) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const { orderId, password } = await request.json();

    // 验证管理员密码
    const adminPassword = process.env.ADMIN_PASSWORD || 'Dianzi123';
    if (password !== adminPassword) {
      return NextResponse.json({ error: '密码错误' }, { status: 403 });
    }

    // 获取订单信息
    const order = await getOrder(orderId);
    if (!order) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 });
    }

    // 检查订单状态是否为已支付
    if (order.status !== 'paid') {
      return NextResponse.json({ error: '订单状态不允许退款' }, { status: 400 });
    }

    // 生成退款单号
    const refundId = `R${Date.now()}`;

    // 根据支付方式调用对应的退款接口
    if (order.pay_method === 'wechat') {
      const result = await createRefund({
        orderId: order.id,
        refundId,
        totalAmount: order.amount,
        refundAmount: order.amount,
        reason: '管理员退款',
      });
      if (!result.success) {
        return NextResponse.json(
          { error: result.error || '微信退款失败' },
          { status: 500 }
        );
      }
    } else if (order.pay_method === 'alipay') {
      const result = await createAlipayRefund({
        tradeNo: order.trade_no!,
        refundAmount: order.amount,
        refundReason: '管理员退款',
        outRequestNo: refundId,
      });
      if (!result.success) {
        return NextResponse.json(
          { error: result.error || '支付宝退款失败' },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json({ error: '不支持的支付方式' }, { status: 400 });
    }

    // 更新订单状态为已退款
    await updateOrderRefunded(orderId, refundId, order.amount);

    // 扣除设备积分
    const supabaseAdmin = getSupabaseAdmin();
    const { data: device } = await supabaseAdmin
      .from('device_usage')
      .select('*')
      .eq('device_id', order.device_id)
      .single();

    if (device) {
      const newBalance = Math.max(0, device.points - order.points);

      await supabaseAdmin
        .from('device_usage')
        .update({
          points: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('device_id', order.device_id);

      // 记录积分变动
      await supabaseAdmin.from('points_log').insert({
        device_id: order.device_id,
        type: 'consume',
        points: -order.points,
        balance: newBalance,
        description: `订单退款扣除积分 (${orderId})`,
      });
    }

    // 记录管理员操作日志
    await supabaseAdmin.from('admin_logs').insert({
      action: 'refund',
      target_id: orderId,
      detail: JSON.stringify({
        amount: order.amount,
        points: order.points,
        deviceId: order.device_id,
      }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Refund error:', error);
    return NextResponse.json({ error: '退款处理失败' }, { status: 500 });
  }
}
