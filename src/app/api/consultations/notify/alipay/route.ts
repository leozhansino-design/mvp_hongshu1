/**
 * 大师咨询支付宝异步回调通知接口
 * POST /api/consultations/notify/alipay
 *
 * 支付宝支付完成后，支付宝服务器会主动调用此接口通知支付结果。
 * 需要验证签名、更新咨询订单状态。
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAlipayNotify } from '@/lib/alipay';
import { getConsultation, updateConsultationPaid } from '@/lib/supabase';

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
      console.error('咨询订单支付宝回调验签失败:', {
        outTradeNo: params.out_trade_no,
        tradeStatus: params.trade_status,
      });
      return new NextResponse('failure', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    const { trade_status, out_trade_no, trade_no } = params;

    // 仅处理交易成功的通知
    if (trade_status === 'TRADE_SUCCESS') {
      try {
        // 验证是咨询订单（以 MS_ 开头）
        if (!out_trade_no.startsWith('MS_')) {
          console.log('非咨询订单，跳过:', out_trade_no);
          return new NextResponse('success', {
            status: 200,
            headers: { 'Content-Type': 'text/plain' },
          });
        }

        // 获取咨询订单
        const consultation = await getConsultation(out_trade_no);
        if (!consultation) {
          console.error('咨询订单不存在:', out_trade_no);
          return new NextResponse('success', {
            status: 200,
            headers: { 'Content-Type': 'text/plain' },
          });
        }

        // 更新咨询订单为已支付
        await updateConsultationPaid(out_trade_no, trade_no);

        console.log('咨询订单支付宝支付成功:', {
          consultationId: out_trade_no,
          tradeNo: trade_no,
          masterName: consultation.master_name,
          price: consultation.price,
        });
      } catch (updateError) {
        console.error('咨询订单支付宝回调处理异常:', {
          orderId: out_trade_no,
          error: updateError instanceof Error ? updateError.message : updateError,
        });
      }
    } else {
      console.log('咨询订单支付宝回调：交易状态非 TRADE_SUCCESS:', {
        orderId: out_trade_no,
        tradeStatus: trade_status,
      });
    }

    return new NextResponse('success', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error) {
    console.error('咨询订单支付宝回调处理异常:', error);
    return new NextResponse('failure', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
