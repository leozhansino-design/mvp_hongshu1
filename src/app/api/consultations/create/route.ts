/**
 * 创建咨询订单接口
 * POST /api/consultations/create
 *
 * 接受用户信息、生辰、问题和支付方式，创建咨询订单并发起支付。
 */

import { NextRequest, NextResponse } from 'next/server';
import { createNativePayOrder } from '@/lib/wechat-pay';
import { createAlipayOrder } from '@/lib/alipay';
import { getMaster, createConsultation } from '@/lib/supabase';
import { generateConsultationId, getFocusHint } from '@/types/master';
import { getTokenFromHeader, getUserFromToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      masterId,
      birthYear,
      birthMonth,
      birthDay,
      birthTime,
      gender,
      name,
      wechatId,
      question,
      payMethod,
    } = body;

    // 参数校验
    if (!masterId) {
      return NextResponse.json({ error: '请选择大师' }, { status: 400 });
    }

    if (!birthYear || !birthMonth || !birthDay) {
      return NextResponse.json({ error: '请填写出生日期' }, { status: 400 });
    }

    if (!gender || !['male', 'female'].includes(gender)) {
      return NextResponse.json({ error: '请选择性别' }, { status: 400 });
    }

    if (!wechatId || !wechatId.trim()) {
      return NextResponse.json({ error: '请填写微信号' }, { status: 400 });
    }

    if (!question || question.trim().length < 10) {
      return NextResponse.json({ error: '问题描述至少10个字' }, { status: 400 });
    }

    if (question.length > 500) {
      return NextResponse.json({ error: '问题描述不能超过500字' }, { status: 400 });
    }

    if (!payMethod || !['wechat', 'alipay'].includes(payMethod)) {
      return NextResponse.json(
        { error: '支付方式无效，仅支持 wechat 或 alipay' },
        { status: 400 }
      );
    }

    // 验证用户登录
    const authHeader = request.headers.get('authorization');
    const token = getTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: '登录已过期，请重新登录' }, { status: 401 });
    }

    // 获取大师信息
    const master = await getMaster(masterId);
    if (!master) {
      return NextResponse.json({ error: '大师不存在' }, { status: 400 });
    }

    if (!master.is_active) {
      return NextResponse.json({ error: '该大师暂不接单' }, { status: 400 });
    }

    // 生成咨询订单号
    const consultationId = generateConsultationId();

    // 获取站点 URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lifecurve.cn';

    // 商品描述
    const description = `大师测算 - ${master.name}`;

    // 根据年龄性别计算关注重点
    const focusHintData = getFocusHint(birthYear, gender as 'male' | 'female');
    const focusHintText = `【${focusHintData.label}】${focusHintData.description}`;

    // 创建咨询订单记录
    await createConsultation({
      id: consultationId,
      user_id: user.id,
      user_phone: user.phone,
      master_id: masterId,
      master_name: master.name,
      price: master.price,
      word_count: master.word_count,
      follow_ups: master.follow_ups,
      birth_year: birthYear,
      birth_month: birthMonth,
      birth_day: birthDay,
      birth_time: birthTime || undefined,
      gender,
      name: name || undefined,
      wechat_id: wechatId.trim(),
      question: question.trim(),
      focus_hint: focusHintText,
      pay_method: payMethod,
      trade_no: undefined,
      status: 'pending',
      follow_up_records: [],
      follow_up_used: 0,
    });

    // 使用咨询订单ID作为支付订单ID
    const orderId = consultationId;

    // 根据支付方式调用对应的支付接口
    if (payMethod === 'wechat') {
      // 微信扫码支付 (Native Pay)
      const notifyUrl = `${siteUrl}/api/consultations/notify/wechat`;

      const result = await createNativePayOrder({
        orderId,
        amount: master.price,
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
        consultationId,
        codeUrl: result.codeUrl,
      });
    } else {
      // 支付宝电脑网站支付
      const notifyUrl = `${siteUrl}/api/consultations/notify/alipay`;
      const returnUrl = `${siteUrl}/masters/success?id=${consultationId}`;

      const result = await createAlipayOrder({
        orderId,
        amount: master.price,
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
        consultationId,
        payUrl: result.payUrl,
      });
    }
  } catch (error) {
    console.error('创建咨询订单异常:', error);
    return NextResponse.json(
      { error: '创建订单失败，请重试' },
      { status: 500 }
    );
  }
}
