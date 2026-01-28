/**
 * 创建支付订单接口
 * POST /api/pay/create
 *
 * 接受设备ID、充值选项ID和支付方式，创建对应的微信或支付宝支付订单。
 * 微信返回二维码链接(codeUrl)，支付宝返回跳转链接(payUrl)。
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateOrderId, createNativePayOrder } from '@/lib/wechat-pay';
import { createAlipayOrder } from '@/lib/alipay';
import { createOrder, getRechargeOptions } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { deviceId, optionId, payMethod } = await request.json();

    // 参数校验
    if (!deviceId) {
      return NextResponse.json({ error: '缺少设备ID' }, { status: 400 });
    }

    if (!optionId) {
      return NextResponse.json({ error: '缺少充值选项ID' }, { status: 400 });
    }

    if (!payMethod || !['wechat', 'alipay'].includes(payMethod)) {
      return NextResponse.json(
        { error: '支付方式无效，仅支持 wechat 或 alipay' },
        { status: 400 }
      );
    }

    // 从数据库加载充值选项
    const rechargeOptions = await getRechargeOptions();
    const selectedOption = rechargeOptions.find((opt) => opt.id === optionId);

    if (!selectedOption) {
      return NextResponse.json({ error: '充值选项不存在' }, { status: 400 });
    }

    // 生成唯一订单号
    const orderId = generateOrderId();

    // 获取站点 URL（用于构造回调地址）
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lifecurve.cn';

    // 商品描述
    const description = `人生曲线 - 充值${selectedOption.points}积分`;

    // 在数据库中创建订单记录
    await createOrder({
      id: orderId,
      deviceId,
      amount: selectedOption.price,
      points: selectedOption.points,
      payMethod,
    });

    // 根据支付方式调用对应的支付接口
    if (payMethod === 'wechat') {
      // 微信扫码支付 (Native Pay)
      const notifyUrl = `${siteUrl}/api/pay/wechat/notify`;

      const result = await createNativePayOrder({
        orderId,
        amount: selectedOption.price,
        description,
        notifyUrl,
      });

      if (!result.success) {
        console.error('微信支付下单失败:', result.error);
        return NextResponse.json(
          { error: result.error || '微信支付下单失败' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        orderId,
        codeUrl: result.codeUrl,
      });
    } else {
      // 支付宝电脑网站支付
      const notifyUrl = `${siteUrl}/api/pay/alipay/notify`;
      const returnUrl = `${siteUrl}/api/pay/alipay/return?orderId=${orderId}`;

      const result = await createAlipayOrder({
        orderId,
        amount: selectedOption.price,
        subject: description,
        notifyUrl,
        returnUrl,
      });

      if (!result.success) {
        console.error('支付宝下单失败:', result.error);
        return NextResponse.json(
          { error: result.error || '支付宝下单失败' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        orderId,
        payUrl: result.payUrl,
      });
    }
  } catch (error) {
    console.error('创建支付订单异常:', error);
    return NextResponse.json(
      { error: '创建订单失败，请重试' },
      { status: 500 }
    );
  }
}
