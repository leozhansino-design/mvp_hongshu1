/**
 * 大师咨询微信支付异步回调通知接口
 * POST /api/consultations/notify/wechat
 *
 * 微信支付完成后，微信服务器会主动调用此接口通知支付结果。
 * 需要解密回调数据并更新咨询订单状态。
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyWechatNotify } from '@/lib/wechat-pay';
import { updateConsultationPaid, getConsultation } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // 获取原始请求体
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
      console.error('咨询订单微信回调验证失败:', result.error);
      return NextResponse.json({ code: 'SUCCESS', message: '成功' });
    }

    const { out_trade_no, trade_state, transaction_id } = result.data;

    // 仅处理支付成功的通知
    if (trade_state === 'SUCCESS') {
      try {
        // 验证是咨询订单（以 MS_ 开头）
        if (!out_trade_no.startsWith('MS_')) {
          console.log('非咨询订单，跳过:', out_trade_no);
          return NextResponse.json({ code: 'SUCCESS', message: '成功' });
        }

        // 获取咨询订单
        const consultation = await getConsultation(out_trade_no);
        if (!consultation) {
          console.error('咨询订单不存在:', out_trade_no);
          return NextResponse.json({ code: 'SUCCESS', message: '成功' });
        }

        // 更新咨询订单为已支付
        await updateConsultationPaid(out_trade_no, transaction_id);

        console.log('咨询订单微信支付成功:', {
          consultationId: out_trade_no,
          transactionId: transaction_id,
          masterName: consultation.master_name,
          price: consultation.price,
        });
      } catch (updateError) {
        console.error('咨询订单微信回调处理异常:', {
          orderId: out_trade_no,
          error: updateError instanceof Error ? updateError.message : updateError,
        });
      }
    } else {
      console.log('咨询订单微信回调：交易状态非 SUCCESS:', {
        orderId: out_trade_no,
        tradeState: trade_state,
      });
    }

    return NextResponse.json({ code: 'SUCCESS', message: '成功' });
  } catch (error) {
    console.error('咨询订单微信回调处理异常:', error);
    return NextResponse.json({ code: 'SUCCESS', message: '成功' });
  }
}
