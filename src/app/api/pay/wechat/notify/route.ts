/**
 * 微信支付异步回调通知接口
 * POST /api/pay/wechat/notify
 *
 * 微信支付完成后，微信服务器会主动调用此接口通知支付结果。
 * 需要解密回调数据并更新订单状态、发放积分。
 * 返回格式必须为 JSON { code: 'SUCCESS', message: '成功' }，否则微信会重试。
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyWechatNotify } from '@/lib/wechat-pay';
import { updateOrderPaid, addPointsFromOrder, getOrder } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // 获取原始请求体（微信回调需要原始文本进行签名验证）
    const body = await request.text();

    // 获取微信签名相关请求头
    const headers = {
      'Wechatpay-Timestamp': request.headers.get('wechatpay-timestamp') || '',
      'Wechatpay-Nonce': request.headers.get('wechatpay-nonce') || '',
      'Wechatpay-Signature': request.headers.get('wechatpay-signature') || '',
      'Wechatpay-Serial': request.headers.get('wechatpay-serial') || '',
    };

    // 验证并解密回调通知
    const result = await verifyWechatNotify(headers, body);

    if (!result.success || !result.data) {
      console.error('微信回调验证失败:', result.error);
      // 即使验证失败，也返回 SUCCESS 避免微信反复重试
      return NextResponse.json({ code: 'SUCCESS', message: '成功' });
    }

    const { out_trade_no, trade_state, transaction_id } = result.data;

    // 仅处理支付成功的通知
    if (trade_state === 'SUCCESS') {
      try {
        // 更新订单为已支付（仅当订单状态为 pending 时才会更新成功，防止重复处理）
        const updatedOrder = await updateOrderPaid(out_trade_no, transaction_id);

        // updateOrderPaid 成功意味着订单之前是 pending 状态，现在首次变为 paid
        // 此时发放积分
        await addPointsFromOrder(
          updatedOrder.device_id,
          updatedOrder.points,
          out_trade_no
        );

        console.log('微信支付成功，积分已发放:', {
          orderId: out_trade_no,
          transactionId: transaction_id,
          points: updatedOrder.points,
          deviceId: updatedOrder.device_id,
        });
      } catch (updateError) {
        // 更新失败可能是因为订单已经不是 pending 状态（重复通知），不算错误
        console.error('微信回调处理订单异常（可能是重复通知）:', {
          orderId: out_trade_no,
          error: updateError instanceof Error ? updateError.message : updateError,
        });
      }
    } else {
      console.log('微信回调：交易状态非 SUCCESS:', {
        orderId: out_trade_no,
        tradeState: trade_state,
      });
    }

    // 无论处理结果如何，均返回成功响应，避免微信重复通知
    return NextResponse.json({ code: 'SUCCESS', message: '成功' });
  } catch (error) {
    console.error('微信回调处理异常:', error);
    // 发生未知异常也返回成功，避免微信无限重试
    return NextResponse.json({ code: 'SUCCESS', message: '成功' });
  }
}
