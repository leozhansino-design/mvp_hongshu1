/**
 * 支付宝同步回跳接口
 * GET /api/pay/alipay/return?orderId=xxx
 *
 * 用户在支付宝完成支付后，浏览器会同步跳转到此地址。
 * 此接口仅做页面重定向，不处理支付逻辑（支付结果以异步通知为准）。
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId');

  // 获取站点 URL
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lifecurve.cn';

  if (orderId) {
    // 带上支付成功标识和订单号，重定向到首页
    return NextResponse.redirect(
      `${siteUrl}/?payment=success&orderId=${orderId}`
    );
  }

  // 没有订单号时直接重定向到首页
  return NextResponse.redirect(`${siteUrl}/`);
}
