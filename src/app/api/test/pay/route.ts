import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getSupabaseAdmin } from '@/lib/supabase';
import { createNativePayOrder } from '@/lib/wechat-pay';
import { createAlipayOrder } from '@/lib/alipay';

// 测试产品价格配置（分）
const TEST_PRICES: Record<string, { basic: number; full: number }> = {
  'enneagram': { basic: 100, full: 1990 },
  'life-curve': { basic: 100, full: 1990 },
  'wealth-curve': { basic: 100, full: 1990 },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testSlug, level, payMethod, testResultId } = body;

    // 验证参数
    if (!testSlug || !level || !payMethod) {
      return NextResponse.json(
        { success: false, error: '参数错误' },
        { status: 400 }
      );
    }

    // 获取价格
    const prices = TEST_PRICES[testSlug];
    if (!prices) {
      return NextResponse.json(
        { success: false, error: '测试产品不存在' },
        { status: 400 }
      );
    }

    const amount = level === 'full' ? prices.full : prices.basic;
    const deviceId = request.headers.get('x-device-id') || 'unknown';

    // 生成订单号
    const orderId = `TEST_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const supabase = getSupabaseAdmin();

    // 创建订单记录
    const { error: insertError } = await supabase
      .from('test_orders')
      .insert({
        id: orderId,
        device_id: deviceId,
        test_slug: testSlug,
        report_level: level,
        amount,
        pay_method: payMethod,
        status: 'pending',
        test_result_id: testResultId || null,
        expire_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      });

    if (insertError) {
      console.error('创建订单失败:', insertError);
      return NextResponse.json(
        { success: false, error: '创建订单失败' },
        { status: 500 }
      );
    }

    // 测试名称
    const testNames: Record<string, string> = {
      'enneagram': '九型人格测试',
      'life-curve': '人生曲线',
      'wealth-curve': '财富曲线',
    };
    const description = `${testNames[testSlug] || testSlug} - ${level === 'full' ? '完整版' : '基础版'}`;

    // 调用支付接口
    if (payMethod === 'wechat') {
      const notifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://your-domain.com'}/api/test/pay/wechat/notify`;

      const result = await createNativePayOrder({
        orderId,
        amount,
        description,
        notifyUrl,
      });

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error || '创建支付订单失败' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        orderId,
        codeUrl: result.codeUrl,
        payMethod: 'wechat',
      });
    } else if (payMethod === 'alipay') {
      const returnUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://your-domain.com'}/test/${testSlug}/pay-result?orderId=${orderId}`;
      const notifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://your-domain.com'}/api/test/pay/alipay/notify`;

      const result = await createAlipayOrder({
        orderId,
        amount,
        subject: description,
        returnUrl,
        notifyUrl,
      });

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error || '创建支付订单失败' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        orderId,
        payUrl: result.payUrl,
        payMethod: 'alipay',
      });
    } else {
      return NextResponse.json(
        { success: false, error: '不支持的支付方式' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('创建支付订单失败:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}
