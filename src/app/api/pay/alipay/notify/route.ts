/**
 * 支付宝异步回调通知接口
 * POST /api/pay/alipay/notify
 *
 * 支付宝支付完成后，支付宝服务器会主动调用此接口通知支付结果。
 * 需要验证签名、更新订单状态并发放积分。
 * 返回纯文本 "success" 表示处理成功，否则支付宝会重试。
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAlipayNotify } from '@/lib/alipay';
import { getOrder, updateOrderPaid, addPointsFromOrder } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // 支付宝回调使用 application/x-www-form-urlencoded 格式
    const formData = await request.text();

    // 将 form-urlencoded 字符串解析为参数对象
    const params: Record<string, string> = {};
    const searchParams = new URLSearchParams(formData);
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    // 验证支付宝签名
    const isValid = await verifyAlipayNotify(params);

    if (!isValid) {
      console.error('支付宝回调验签失败:', {
        outTradeNo: params.out_trade_no,
        tradeStatus: params.trade_status,
      });
      // 验签失败返回 failure，支付宝会重试
      return new NextResponse('failure', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    const { trade_status, out_trade_no, trade_no } = params;

    // 仅处理交易成功的通知
    if (trade_status === 'TRADE_SUCCESS') {
      try {
        // 查询订单信息
        const order = await getOrder(out_trade_no);

        if (!order) {
          console.error('支付宝回调：订单不存在:', out_trade_no);
          return new NextResponse('success', {
            status: 200,
            headers: { 'Content-Type': 'text/plain' },
          });
        }

        // 更新订单为已支付（仅当订单状态为 pending 时才会更新成功，防止重复处理）
        const updatedOrder = await updateOrderPaid(out_trade_no, trade_no);

        // updateOrderPaid 成功意味着订单之前是 pending 状态，现在首次变为 paid
        // 此时发放积分
        await addPointsFromOrder(
          updatedOrder.device_id,
          updatedOrder.points,
          out_trade_no
        );

        console.log('支付宝支付成功，积分已发放:', {
          orderId: out_trade_no,
          tradeNo: trade_no,
          points: updatedOrder.points,
          deviceId: updatedOrder.device_id,
        });
      } catch (updateError) {
        // 更新失败可能是因为订单已经不是 pending 状态（重复通知），不算错误
        console.error('支付宝回调处理订单异常（可能是重复通知）:', {
          orderId: out_trade_no,
          error: updateError instanceof Error ? updateError.message : updateError,
        });
      }
    } else {
      console.log('支付宝回调：交易状态非 TRADE_SUCCESS:', {
        orderId: out_trade_no,
        tradeStatus: trade_status,
      });
    }

    // 返回 "success" 告知支付宝已收到通知
    return new NextResponse('success', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error) {
    console.error('支付宝回调处理异常:', error);
    // 发生异常返回 failure，支付宝会重试
    return new NextResponse('failure', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
